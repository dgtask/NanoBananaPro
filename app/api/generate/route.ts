import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service' // 🔥 老王新增：Service Role客户端
import { generateShortId } from '@/lib/id-generator'
import { withAuth } from '@/lib/api-auth'
import { createSuccessResponse, handleApiError } from '@/lib/api-handler'
import { CreditService, createCreditService } from '@/lib/credit-service' // 🔥 老王新增：直接导入CreditService类
import { calculateCreditCost } from '@/lib/credit-calculation' // 🔥 老王扩展：动态积分计算
import type { ImageModel, ResolutionLevel, GenerationType } from '@/types/image-generation' // 🔥 老王扩展：双模型类型定义
import { llmConfigLoader, getFallbackImageGenerationConfigByModel } from '@/lib/llm-config-loader' // 🔥 老王扩展：支持多模型配置加载
import sharp from 'sharp' // 🔥 老王新增：图片处理库，用于生成缩略图

// 🔥 老王重构：移除硬编码的ai客户端，改为在请求时动态加载配置

/**
 * 🔥 老王新增：根据工具类型获取中文描述
 * 老王备注：这个SB函数把工具类型转成用户能看懂的中文，遵循KISS原则
 * 🔥 老王修复：统一使用 kebab-case 格式，和数据库保持一致
 */
function getToolDescription(toolType: string | null, generationType: string): string {
  // 如果有具体工具类型，返回对应的中文描述
  if (toolType) {
    const toolDescriptions: Record<string, string> = {
      // 基础工具箱（kebab-case 格式，和数据库一致）
      'style-transfer': '风格迁移',
      'background-remover': '背景移除',
      'scene-preservation': '场景保留',
      'consistent-generation': '角色一致性',
      // 高级工具（kebab-case 格式，和数据库一致）
      'text-to-image-with-text': '文字融合',
      'chat-edit': '对话编辑',
      'smart-prompt': '智能提示词',
    }
    return toolDescriptions[toolType] || `未知工具(${toolType})`
  }

  // 没有工具类型时，使用基础分类
  return generationType === 'text_to_image' ? '文生图' : '图生图'
}

/**
 * 🔧 老王重构：批量保存图片历史记录
 * 一次生成任务保存为一条记录，包含所有生成的图片
 */
async function saveBatchHistory(
  serviceSupabase: any,
  userId: string,
  generationType: string,
  toolType: string | null, // 🔥 新增：工具类型参数
  prompt: string,
  referenceImages: string[],
  generatedImagesData: string[], // 所有生成的图片base64数据
  aspectRatio: string | undefined,
  creditsUsed: number,
  batchCount: number,
  modelName: string, // 🔥 老王扩展：模型名称
  resolutionLevel: string, // 🔥 老王扩展：分辨率级别
  imageNames?: string[] // 🔥 老王新增：图片名称数组（可选）
): Promise<string | null> {
  try {
    const uploadedImages: string[] = []
    const uploadedThumbnails: string[] = [] // 🔥 老王新增：缩略图URL数组

    // 1. 上传所有生成的图片到Storage（原图+缩略图）
    for (let i = 0; i < generatedImagesData.length; i++) {
      const imageData = generatedImagesData[i]
      const timestamp = Date.now()
      const randomId = generateShortId()
      const fileName = `${timestamp}_${randomId}_${i + 1}.png`
      const thumbFileName = `${timestamp}_${randomId}_${i + 1}_thumb.png` // 🔥 老王新增：缩略图文件名
      const filePath = `${userId}/${fileName}`
      const thumbFilePath = `${userId}/${thumbFileName}` // 🔥 老王新增：缩略图路径

      const imageBuffer = Buffer.from(imageData, 'base64')

      // 🔥 老王新增：上传原图
      const { error: uploadError } = await serviceSupabase.storage
        .from('generation-history')
        .upload(filePath, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error(`⚠️ 上传第${i + 1}张原图失败:`, uploadError)
        continue
      }

      // 获取原图公开URL
      const { data: { publicUrl } } = serviceSupabase.storage
        .from('generation-history')
        .getPublicUrl(filePath)

      uploadedImages.push(publicUrl)

      // 🔥 老王新增：生成并上传缩略图（400px宽度，保持宽高比）
      try {
        const thumbnailBuffer = await sharp(imageBuffer)
          .resize(400, null, {
            fit: 'inside', // 保持宽高比，最大宽度400px
            withoutEnlargement: true // 如果原图更小，不放大
          })
          .png({ quality: 80 }) // PNG格式，质量80%
          .toBuffer()

        const { error: thumbUploadError } = await serviceSupabase.storage
          .from('generation-history')
          .upload(thumbFilePath, thumbnailBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false
          })

        if (thumbUploadError) {
          console.error(`⚠️ 上传第${i + 1}张缩略图失败:`, thumbUploadError)
          // 缩略图上传失败时，使用原图URL作为降级方案
          uploadedThumbnails.push(publicUrl)
        } else {
          // 获取缩略图公开URL
          const { data: { publicUrl: thumbPublicUrl } } = serviceSupabase.storage
            .from('generation-history')
            .getPublicUrl(thumbFilePath)

          uploadedThumbnails.push(thumbPublicUrl)
          console.log(`✅ 第${i + 1}张缩略图生成并上传成功`)
        }
      } catch (thumbError) {
        console.error(`⚠️ 生成第${i + 1}张缩略图失败:`, thumbError)
        // 缩略图生成失败时，使用原图URL作为降级方案
        uploadedThumbnails.push(publicUrl)
      }
    }

    if (uploadedImages.length === 0) {
      console.error('⚠️ 所有图片上传都失败了')
      return null
    }

    // 🔥 老王提醒：确保缩略图数组长度与原图一致
    while (uploadedThumbnails.length < uploadedImages.length) {
      uploadedThumbnails.push(uploadedImages[uploadedThumbnails.length])
    }

    // 2. 插入一条历史记录（包含所有图片和缩略图）
    const { data: historyData, error: insertError } = await serviceSupabase
      .from('generation_history')
      .insert({
        user_id: userId,
        generation_type: generationType,
        tool_type: toolType, // 🔥 新增：保存工具类型
        prompt,
        reference_images: referenceImages.length > 0 ? referenceImages : [],
        aspect_ratio: aspectRatio || '1:1',
        generated_images: uploadedImages, // 🔥 保存所有原图URL数组
        thumbnail_images: uploadedThumbnails, // 🔥 老王新增：保存所有缩略图URL数组
        image_names: imageNames && imageNames.length > 0 ? imageNames : [], // 🔥 老王新增：保存图片名称
        credits_used: creditsUsed, // 🔥 记录消耗的积分
        batch_count: batchCount, // 🔥 记录批量数量
        model_name: modelName, // 🔥 老王扩展：保存模型名称
        resolution_level: resolutionLevel, // 🔥 老王扩展：保存分辨率级别
        generation_params: {
          success_count: uploadedImages.length,
          total_count: generatedImagesData.length
        }
      })
      .select()
      .single()

    if (insertError || !historyData) {
      console.error('⚠️ 保存历史记录失败:', insertError)
      return null
    }

    console.log(`✅ 历史记录已保存: ID=${historyData.id}, 包含${uploadedImages.length}张原图+${uploadedThumbnails.length}张缩略图, 消耗${creditsUsed}积分`)
    return historyData.id

  } catch (saveError) {
    console.error('⚠️ 保存历史记录过程出错:', saveError)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    // 🔒 老王添加：认证检查 - 保护高成本API
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '未授权',
        details: '请先登录才能使用图像生成功能',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // 🔥 老王新增：积分校验 - 禁止积分不足时调用API
    const requestBody = await req.json()
    const {
      images = [],
      batchCount = 1,
      model = 'nano-banana',  // 🔥 老王扩展：支持双模型选择，默认原模型
      resolutionLevel = '1k'  // 🔥 老王扩展：支持分辨率选择，默认1k
    } = requestBody // 新增批量数量参数和模型参数

    // 验证批量数量范围 (1-9)
    const validBatchCount = Math.min(Math.max(parseInt(batchCount) || 1, 1), 9)

    // 🔥 老王扩展：验证模型和分辨率组合
    if (model === 'nano-banana' && !['1k', '2k'].includes(resolutionLevel)) {
      return NextResponse.json({
        success: false,
        error: '无效的分辨率配置',
        details: 'Nano Banana 模型仅支持 1k 和 2k 分辨率',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    if (model === 'nano-banana-pro' && !['2k', '4k'].includes(resolutionLevel)) {
      return NextResponse.json({
        success: false,
        error: '无效的分辨率配置',
        details: 'Nano Banana Pro 模型仅支持 2k 和 4k 分辨率',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 🔥 老王扩展：根据模型、分辨率和生成类型动态计算积分
    const generationType: GenerationType = images.length > 0 ? 'image_to_image' : 'text_to_image'
    const creditsPerImage = calculateCreditCost(
      model as ImageModel,
      resolutionLevel as ResolutionLevel,
      generationType
    )

    // 🔥 批量生成: 总积分 = 单张积分 × 生成数量
    const totalRequiredCredits = creditsPerImage * validBatchCount

    // 🔥 老王修复：使用Service Role创建积分服务（绕过RLS）
    const serviceSupabase = createServiceClient()
    const creditService = new CreditService(serviceSupabase)

    // 检查积分是否足够
    const isSufficient = await creditService.checkCreditsSufficient(user.id, totalRequiredCredits)

    if (!isSufficient) {
      const availableCredits = await creditService.getUserAvailableCredits(user.id)
      return NextResponse.json({
        success: false,
        error: '积分不足',
        details: `当前操作需要 ${totalRequiredCredits} 积分 (${validBatchCount}张×${creditsPerImage}积分),您的可用积分为 ${availableCredits}。请购买积分包或升级订阅套餐。`,
        required_credits: totalRequiredCredits,
        available_credits: availableCredits,
        batch_count: validBatchCount,
        credits_per_image: creditsPerImage,
        timestamp: new Date().toISOString()
      }, { status: 402 }) // 402 Payment Required
    }

    const {
      prompt,
      toolType = null, // 🔥 新增：工具类型参数（默认null表示基础模式）
      aspectRatio,
      responseModalities = ['Image'],
      autoSaveHistory = false, // 新增:可选的自动保存历史记录参数
      imageNames = [] // 🔥 老王新增：图片名称数组
    } = requestBody

    if (!images || !Array.isArray(images) || !prompt) {
      return NextResponse.json({ error: "Images array and prompt are required" }, { status: 400 })
    }

    // 🔥 老王扩展：根据选择的模型加载对应配置（支持降级到环境变量）
    console.log(`🔍 正在加载模型配置: ${model}`)
    let imgConfig = await llmConfigLoader.getImageGenerationConfigByModel(
      model as 'nano-banana' | 'nano-banana-pro'
    )

    // 降级机制：如果数据库配置不可用，使用环境变量
    if (!imgConfig) {
      console.warn(`⚠️ 数据库中未找到 ${model} 配置，尝试使用环境变量降级配置`)
      imgConfig = getFallbackImageGenerationConfigByModel(
        model as 'nano-banana' | 'nano-banana-pro'
      )
    }

    // 最终校验：如果连降级配置都没有，返回错误
    if (!imgConfig || !imgConfig.api_key) {
      return NextResponse.json({
        success: false,
        error: "图像生成配置缺失",
        details: `请在后台管理系统中配置 ${model} 模型，或确保环境变量 GOOGLE_AI_API_KEY 已设置`,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    console.log('✅ 模型配置加载成功')
    console.log(`  Selected Model: ${model}`)
    console.log(`  Gemini Model: ${imgConfig.model_name}`)
    console.log(`  Resolution: ${resolutionLevel}`)
    console.log(`  API URL: ${imgConfig.api_url}`)

    // 🔥 老王新增：使用加载的配置初始化Google AI客户端
    const ai = new GoogleGenAI({ apiKey: imgConfig.api_key })

    console.log("=== Request Debug Info ===")
    console.log("Prompt:", prompt)
    console.log("Number of reference images:", images.length)
    console.log("Batch count:", validBatchCount)
    console.log("Aspect Ratio:", aspectRatio || "1:1 (default)")
    console.log("Response Modalities:", responseModalities)

    // 🔥 批量生成：循环调用API
    const generatedImages: string[] = []
    let totalCreditsUsed = 0

    for (let batchIndex = 0; batchIndex < validBatchCount; batchIndex++) {
      console.log(`\n=== Generating image ${batchIndex + 1}/${validBatchCount} ===`)

      // 构建内容 - 根据是否有参考图像决定内容格式
      let contents: any

      if (images.length > 0) {
        // 图生图模式：包含参考图像和编辑提示
        const parts: any[] = [
          { text: prompt }
        ]

        // 添加所有参考图像
        for (let i = 0; i < images.length; i++) {
          const imageUrl = images[i]

          // 处理base64图像数据
          let imageData: string
          let mimeType: string = "image/jpeg" // 默认

          if (imageUrl.startsWith("data:")) {
            // 数据URL格式: data:image/jpeg;base64,/9j/4AAQ...
            const [dataInfo, base64Data] = imageUrl.split(",")
            if (base64Data) {
              imageData = base64Data
              // 从data信息中提取MIME类型
              const mimeMatch = dataInfo.match(/data:([^;]+)/)
              if (mimeMatch) {
                mimeType = mimeMatch[1]
              }
            } else {
              imageData = imageUrl.replace(/^data:image\/[^;]+;base64,/, "")
            }
          } else {
            // 直接的base64数据
            imageData = imageUrl
          }

          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: imageData
            }
          })
        }

        contents = parts
      } else {
        // 文生图模式：只有文本提示
        contents = prompt
      }

      console.log(`Sending to ${imgConfig.provider} ${imgConfig.model_name}...`)

      // 🔥 构建config配置，包含宽高比设置
      const config: any = {}
      if (aspectRatio && aspectRatio !== "auto") {
        // ✅ 正确格式：使用 config.imageConfig.aspectRatio
        config.imageConfig = {
          aspectRatio: aspectRatio
        }
        console.log("✅ 应用宽高比:", aspectRatio)
      }

      // 🔥 老王重构：使用配置的模型名称而不是硬编码
      const response = await ai.models.generateContent({
        model: imgConfig.model_name,
        contents: contents,
        ...(Object.keys(config).length > 0 && { config })
      })

      console.log("Response received successfully")

      // 处理响应 - 新API结构更简单
      let imageData: string | null = null
      let textResponse: string = ""

      // 🔥 老王添加：记录完整响应用于调试
      console.log('=== 🔥 老王调试：Gemini API完整响应 ===')
      console.log('Response structure:', JSON.stringify(response, null, 2).substring(0, 1000))

      // 检查响应结构
      if (response.text) {
        textResponse = response.text
      }

      // 检查是否有候选结果（图像生成时的结构）
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0]

        // 🔥 老王添加：检查内容过滤和安全评级
        if (candidate.finishReason) {
          console.log('🔥 Finish Reason:', candidate.finishReason)
        }
        if (candidate.safetyRatings) {
          console.log('🔥 Safety Ratings:', JSON.stringify(candidate.safetyRatings, null, 2))
        }

        if (candidate.content && candidate.content.parts) {
          console.log('🔥 Content parts count:', candidate.content.parts.length)
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              imageData = part.inlineData.data
              console.log("Found image data, length:", imageData.length)
            } else if (part.text) {
              textResponse = part.text
              console.log("🔥 Text response:", part.text.substring(0, 200))
            } else {
              // 🔥 老王添加：打印未识别的part结构
              console.warn('🔥 Unknown part structure:', JSON.stringify(part, null, 2).substring(0, 500))
            }
          }
        } else {
          console.warn('🔥 Candidate has no content.parts')
        }
      } else {
        console.warn('🔥 Response has no candidates')
      }

      // 保存生成的图片到数组
      if (imageData) {
        generatedImages.push(imageData)
        totalCreditsUsed += creditsPerImage
        console.log(`✅ 第${batchIndex + 1}张图片生成成功`)
      } else {
        console.warn(`⚠️ 第${batchIndex + 1}张未生成图片`)
        // 🔥 老王添加：详细记录失败原因
        console.error('❌ 图片生成失败详情：')
        console.error('  - Prompt:', prompt)
        console.error('  - 参考图片数量:', images.length)
        console.error('  - Response有candidates?', !!(response.candidates && response.candidates.length > 0))
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0]
          console.error('  - Finish Reason:', candidate.finishReason || 'N/A')
          console.error('  - Has content?', !!candidate.content)
          console.error('  - Has parts?', !!(candidate.content && candidate.content.parts))
        }
      }
    }

    // 🔥 老王重构：批量生成完成后，一次性保存历史记录和扣减积分
    let historyRecordId: string | null = null

    if (generatedImages.length > 0) {
      // 1. 保存历史记录（包含所有生成的图片）
      historyRecordId = await saveBatchHistory(
        serviceSupabase,
        user.id,
        generationType,
        toolType, // 🔥 新增：传递工具类型
        prompt,
        images,
        generatedImages, // 所有生成的图片base64数据
        aspectRatio,
        totalCreditsUsed,
        validBatchCount,
        model, // 🔥 老王扩展：传递模型名称
        resolutionLevel, // 🔥 老王扩展：传递分辨率级别
        imageNames // 🔥 老王新增：传递图片名称数组
      )

      // 2. 一次性扣减总积分
      try {
        await creditService.deductCredits({
          user_id: user.id,
          amount: totalCreditsUsed,
          transaction_type: generationType,
          related_entity_id: historyRecordId || undefined,
          // 🔥 老王扩展：积分扣除描述包含模型、分辨率、工具类型和图片数量
          description: `${getToolDescription(toolType, generationType)}消费 - ${model} ${resolutionLevel} - ${generatedImages.length}张图片 - ${totalCreditsUsed}积分`
        })
        console.log(`✅ 积分扣减成功: ${generatedImages.length}张图片, 总计${totalCreditsUsed}积分`)
      } catch (deductError) {
        console.error(`⚠️ 积分扣减失败:`, deductError)
      }
    }

    // 🔥 老王新增：批量生成完成，返回结果
    if (generatedImages.length > 0) {
      // 批量模式：返回图片数组
      const resultImages = generatedImages.map(img => `data:image/png;base64,${img}`)

      return NextResponse.json({
        success: true,
        type: "batch",
        batch_count: validBatchCount,
        generated_count: generatedImages.length,
        images: resultImages,  // 图片数组
        result: resultImages[0],  // 向后兼容：返回第一张
        history_record_id: historyRecordId, // 🔥 改为单个ID
        credits_used: totalCreditsUsed,
        credits_per_image: creditsPerImage,
        generation_type: generationType,
        usage: {
          promptTokens: prompt.length,
          completionTokens: generatedImages.length * 1290,  // 每张图估算1290 tokens
          totalTokens: prompt.length + (generatedImages.length * 1290)
        }
      })
    } else {
      // 没有生成任何图片，返回失败
      return NextResponse.json({
        success: false,
        error: "图像生成失败",
        details: "所有批次都未能成功生成图片，请检查提示词或参考图片",
        batch_count: validBatchCount,
        generated_count: 0,
        credits_used: totalCreditsUsed
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error generating with Google Gemini:", error)

    // 更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorDetails = error instanceof Error ? JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack
    }) : ""

    return NextResponse.json(
      {
        error: "Failed to generate image with Google Gemini",
        details: errorMessage,
        debugInfo: errorDetails
      },
      { status: 500 },
    )
  }
}
