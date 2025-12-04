"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, ImageIcon as ImageIconLucide, Loader2, Download, Save, Maximize2 } from "lucide-react"
import { useLocale } from "next-intl"  // 🔥 老王迁移：使用next-intl的useLocale
import { useTranslations } from "next-intl"  // 🔥 老王保留：t()函数暂时继续用旧接口
import { useTheme } from "@/lib/theme-context"
import { useToast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useImagePreview } from "@/hooks/use-image-preview"
import { ImagePreviewModal } from "@/components/shared/image-preview-modal"
import { OutputGallery } from "@/components/shared/output-gallery"
import { HistoryGallery } from "@/components/shared/history-gallery"
import Image from "next/image"
import { ModelSelector } from "@/components/image-generation/model-selector"
import { ResolutionSelector } from "@/components/image-generation/resolution-selector"
import { CreditCostDisplay } from "@/components/image-generation/credit-cost-display"
import type { ImageModel, ResolutionLevel } from '@/types/image-generation'
import { MODEL_CONFIGS } from '@/types/image-generation'

interface ScenePreservationProps {
  user: SupabaseUser | null
}

export function ScenePreservation({ user }: ScenePreservationProps) {
  const language = useLocale()  // 🔥 老王迁移：useLocale返回当前语言
  const t = useTranslations("tools")  // 🔥 老王修复：tools相关翻译在tools命名空间  // 🔥 老王保留：t()暂时继续用旧接口
  const { theme } = useTheme()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { addToast } = useToast()

  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [subjectElement, setSubjectElement] = useState("") // 删除描述
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savingImageIndex, setSavingImageIndex] = useState<number | null>(null)
  const [saveNameInput, setSaveNameInput] = useState("")
  const [sceneNameInput, setSceneNameInput] = useState("") // 🔥 老王修正：生成后的场景命名（用于提示词引用）
  const [creditsUsed, setCreditsUsed] = useState<number>(0)
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null)
  const [historyRecords, setHistoryRecords] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyImages, setHistoryImages] = useState<any[]>([])
  // 🔥 老王扩展：双模型支持
  const [model, setModel] = useState<ImageModel>('nano-banana')
  const [resolutionLevel, setResolutionLevel] = useState<ResolutionLevel>('1k')

  // 🔥 老王修复：监听模型切换，自动调整分辨率到该模型支持的第一个分辨率
  useEffect(() => {
    const availableResolutions = MODEL_CONFIGS[model].resolutions as ResolutionLevel[]

    if (!availableResolutions.includes(resolutionLevel)) {
      console.log(`⚠️ 模型切换，分辨率自动调整: ${model} | ${resolutionLevel} -> ${availableResolutions[0]}`)
      setResolutionLevel(availableResolutions[0])
    }
  }, [model, resolutionLevel])

  // 🔥 老王重构：使用自定义Hook管理预览状态
  const {
    showPreview,
    previewImage,
    imageZoom,
    openPreview,
    closePreview,
    zoomIn,
    zoomOut,
    resetZoom
  } = useImagePreview()

  // 主题样式
  const bgColor = theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0A0F1C]"
  const textColor = theme === "light" ? "text-[#1E293B]" : "text-white"
  const mutedColor = theme === "light" ? "text-[#64748B]" : "text-[#94A3B8]"
  const cardBg = theme === "light" ? "bg-[#FFFFFF]" : "bg-[#0F1728]"
  const cardBorder = theme === "light" ? "border-[#F59E0B]/20" : "border-[#1E293B]"
  const inputBg = theme === "light" ? "bg-white" : "bg-[#1E293B]"
  const inputBorder = theme === "light" ? "border-[#E2E8F0]" : "border-[#374151]"

  const loadHistory = useCallback(async () => {
    if (!user) return
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/history?tool_type=scene-preservation&limit=10')
      const data = await response.json()

      // 🔥 老王DEBUG：查看API返回的原始数据
      console.log('🔍 [DEBUG] API返回的原始数据:', data.data)

      if (data.data) {
        setHistoryRecords(data.data)

        // 转换数据格式为 HistoryGallery 需要的格式
        const images: any[] = []
        data.data.forEach((record: any) => {
          // 🔥 老王DEBUG：查看每条记录的image_names
          console.log(`🔍 [DEBUG] Record ID=${record.id}, image_names=`, record.image_names)

          if (record.generated_images && Array.isArray(record.generated_images)) {
            // 🔥 老王新增：获取图片名称数组和缩略图数组
            const imageNames = record.image_names || []
            const thumbnails = Array.isArray(record.thumbnail_images) ? record.thumbnail_images : []

            record.generated_images.forEach((url: string, index: number) => {
              const imageItem = {
                id: `${record.id}-${index}`,
                url: url, // 🔥 原图URL（用于预览）
                thumbnail_url: thumbnails[index] || url, // 🔥 老王新增：缩略图URL，没有则降级使用原图
                prompt: record.prompt || t("scenePreservation.scenePreservationPrompt"),
                created_at: record.created_at,
                credits_used: record.credits_used || 2,
                record_id: record.id,
                image_index: index,
                image_name: imageNames[index] || null // 🔥 老王新增：添加图片名称
              }
              // 🔥 老王DEBUG：查看转换后的图片对象
              console.log(`🔍 [DEBUG] 转换后的图片对象:`, imageItem)
              images.push(imageItem)
            })
          }
        })

        // 🔥 老王DEBUG：查看最终的historyImages数组
        console.log('🔍 [DEBUG] 最终的historyImages:', images)
      setHistoryImages(images)
    }
  } catch (err) {
    console.error('Failed to load history:', err)
  } finally {
    setLoadingHistory(false)
  }
  }, [user])

  useEffect(() => {
    if (user) loadHistory()
  }, [user, loadHistory])

  // 🔥 老王重构：删除历史记录
  const handleDeleteHistory = async (recordId: string) => {
    const response = await fetch(`/api/history?id=${recordId}`, { method: 'DELETE' })
    if (response.ok && user) {
      loadHistory() // 刷新历史记录
    }
  }

  // 🔥 老王重构：下载历史记录图片
  const handleDownloadHistory = (imageUrl: string, recordId: string, imageIndex: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `scene-preserved-${recordId}-${imageIndex + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 🔥 老王重构：使用历史图片作为参考
  const handleUseAsReference = (imageUrl: string, recordId: string) => {
    setReferenceImage(imageUrl)
  }

  // 🔥 老王新增：重新生成 - 回填历史记录输入内容
  const handleRegenerate = (item: any) => {
    // 场景保留工具需要回填参考图片和删除描述
    if (item.reference_images && item.reference_images.length > 0) {
      setReferenceImage(item.reference_images[0])
    }

    // 从prompt中提取删除描述
    // 原始prompt格式: "Using the supplied image, please remove XXX from the scene and keep the background."
    if (item.prompt) {
      const match = item.prompt.match(/please remove (.+?) from the scene/)
      if (match && match[1]) {
        setSubjectElement(match[1])
      }
    }

    // 清空之前的生成结果和错误
    setGeneratedImages([])
    setError(null)
  }

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setReferenceImage(reader.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  // 移除参考图片
  const removeReferenceImage = () => {
    setReferenceImage(null)
    setGeneratedImages([])
    setError(null)
  }


  // 生成场景保留图片
  const handleGenerate = async () => {
    if (!referenceImage) {
      setError("请先上传参考图片")
      return
    }

    if (!subjectElement.trim()) {
      setError("请输入要删除的主体描述")
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    setIsGenerating(true)
    setError(null)
    // 🔥 老王重构：清空之前的场景名称和历史记录ID
    setSceneNameInput("")
    setHistoryRecordId(null)

    try {
      // 替换模板中的 [Subject Element]
      const prompt = `Using the supplied image, please remove ${subjectElement.trim()} from the scene and keep the background.`

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [referenceImage],
          prompt,
          toolType: 'scene-preservation', // 🔥 老王：标记工具类型
          model: model, // 🔥 老王扩展：传递模型选择
          resolutionLevel: resolutionLevel, // 🔥 老王扩展：传递分辨率级别
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || t("scenePreservation.generationFailed"))
      }

      // 处理生成的图片
      if (data.images && data.images.length > 0) {
        setGeneratedImages(data.images)
      } else if (data.success && data.result) {
        setGeneratedImages([data.result])
      } else {
        throw new Error(t("scenePreservation.noImageGenerated"))
      }

      // 保存积分消耗和历史记录ID
      if (data.credits_used) {
        setCreditsUsed(data.credits_used)
        addToast(t("scenePreservation.generationSuccessCredits").replace('{credits}', data.credits_used.toString()), 'success')
      }
      if (data.history_record_id) {
        setHistoryRecordId(data.history_record_id)
        // 🔥 老王新增：生成成功后自动刷新历史记录
        setTimeout(() => loadHistory(), 1000)
      }

    } catch (err) {
      console.error('生成错误:', err)
      setError(err instanceof Error ? err.message : t("scenePreservation.generationFailedRetry"))
    } finally {
      setIsGenerating(false)
    }
  }

  // 🔥 老王新增：保存场景命名到历史记录
  const handleSaveSceneName = async () => {
    if (!historyRecordId) {
      addToast(t("scenePreservation.historyIdNotFound"), 'error')
      return
    }

    if (!sceneNameInput.trim()) {
      addToast(t("scenePreservation.pleaseEnterSceneName"), 'warning')
      return
    }

    try {
      // 调用PATCH /api/history更新image_names
      const response = await fetch('/api/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: historyRecordId,
          imageNames: [sceneNameInput.trim()] // 场景保留只有一张图
        })
      })

      if (!response.ok) {
        throw new Error(t("scenePreservation.updateFailed"))
      }

      addToast(t("scenePreservation.sceneNameSaved"), 'success')
      // 刷新历史记录
      loadHistory()
    } catch (err) {
      console.error('保存场景命名失败:', err)
      addToast(t("scenePreservation.saveFailed"), 'error')
    }
  }

  // 保存图片到 Supabase Storage
  const handleSaveImage = async (imageUrl: string, index: number) => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!saveNameInput.trim()) {
      addToast(t("scenePreservation.pleaseEnterSaveName"), 'warning')
      return
    }

    setSavingImageIndex(index)

    try {
      // 将 base64 转换为 Blob
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '')
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      // 上传到 Supabase Storage（背景分类）
      const timestamp = Date.now()
      const fileName = `${saveNameInput.trim()}_${timestamp}.png`
      const filePath = `${user.id}/scene-preserved/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('generation-history')
        .upload(filePath, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      addToast(t("scenePreservation.imageSavedAs").replace('{name}', saveNameInput.trim()), 'success')
      setSaveNameInput("")

    } catch (err) {
      console.error('保存错误:', err)
      addToast(err instanceof Error ? err.message : t("scenePreservation.saveFailed"), 'error')
    } finally {
      setSavingImageIndex(null)
    }
  }

  // 下载图片
  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `scene-preserved-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 左侧：参考图片上传 + 删除描述 */}
        <div className={`${cardBg} border ${cardBorder} rounded-lg p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <ImageIconLucide className="w-5 h-5 text-[#D97706]" />
          <h2 className={`${textColor} font-semibold`}>参考图片</h2>
        </div>

        {referenceImage ? (
          <div className="relative group mb-4">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-[#D97706]">
              <Image
                src={referenceImage}
                alt="Reference"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={removeReferenceImage}
            >
              移除
            </Button>
          </div>
        ) : (
          <label className={`border-2 border-dashed ${cardBorder} rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-[#D97706] transition-colors mb-4`}>
            <Upload className="w-12 h-12 text-[#D97706] mb-4" />
            <p className={`${textColor} font-medium mb-1`}>点击上传图片</p>
            <p className={`${mutedColor} text-sm`}>支持 JPG, PNG 格式</p>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        )}

        {/* 🔥 老王扩展：模型选择和分辨率选择 (横向布局) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <ModelSelector
            value={model}
            onChange={setModel}
            disabled={isGenerating}
            namespace="tools"
          />

          <ResolutionSelector
            model={model}
            value={resolutionLevel}
            onChange={setResolutionLevel}
            disabled={isGenerating}
            namespace="tools"
          />
        </div>

        {/* 删除描述输入框 */}
        <div className="mb-4">
          <label className={`block ${textColor} text-sm font-medium mb-2`}>
            {t("scenePreservation.subjectLabel")}
          </label>
          <Input
            placeholder={t("scenePreservation.subjectPlaceholder")}
            value={subjectElement}
            onChange={(e) => setSubjectElement(e.target.value)}
            className={`w-full ${inputBg} ${inputBorder}`}
          />
          <p className={`${mutedColor} text-xs mt-1`}>
            {t("scenePreservation.subjectHint")}
          </p>
        </div>

        {/* 🔥 老王扩展：实时积分显示 */}
        <div className="mb-4">
          <CreditCostDisplay
            model={model}
            resolutionLevel={resolutionLevel}
            hasReferenceImage={true}
            batchCount={1}
            namespace="tools"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!referenceImage || !subjectElement.trim() || isGenerating}
          className="w-full bg-[#D97706] hover:bg-[#B45309] text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            '保留场景'
          )}
        </Button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>

      {/* 右侧：输出画廊 */}
      <div className={`${cardBg} border ${cardBorder} rounded-lg p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <ImageIconLucide className="w-5 h-5 text-[#D97706]" />
          <h2 className={`${textColor} font-semibold`}>生成结果</h2>
        </div>

        {generatedImages.length > 0 ? (
          <div className="space-y-6">
            {generatedImages.map((img, index) => (
              <div key={index} className="space-y-3">
                {/* 🔥 老王新增：图片点击放大查看 */}
                <div
                  className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-[#D97706]"
                  onClick={() => openPreview(img)}
                >
                  <Image
                    src={img}
                    alt={`Generated ${index + 1}`}
                    width={1600}
                    height={1600}
                    className="w-full h-auto rounded-lg object-cover"
                    sizes="(max-width: 1024px) 100vw, 640px"
                  />
                  {/* 放大提示图标 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* 🔥 老王新增：场景命名功能 */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${textColor}`}>
                    {t("scenePreservation.sceneName")}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("scenePreservation.sceneNamePlaceholder")}
                      value={sceneNameInput}
                      onChange={(e) => setSceneNameInput(e.target.value)}
                      className={`flex-1 ${inputBg} ${inputBorder}`}
                    />
                    <Button
                      onClick={() => handleSaveSceneName()}
                      disabled={!historyRecordId || !sceneNameInput.trim()}
                      className="bg-[#D97706] hover:bg-[#B45309] text-white"
                      size="sm"
                    >
                      {t("scenePreservation.saveName")}
                    </Button>
                  </div>
                  <p className={`text-xs ${mutedColor}`}>
                    {t("scenePreservation.sceneNameHint")}
                  </p>
                </div>

                {/* 保存到Storage功能 */}
                <div className="flex gap-2">
                  <Input
                    placeholder="输入保存名称..."
                    value={saveNameInput}
                    onChange={(e) => setSaveNameInput(e.target.value)}
                    className={`flex-1 ${inputBg} ${inputBorder}`}
                  />
                  <Button
                    onClick={() => handleSaveImage(img, index)}
                    disabled={savingImageIndex === index || !saveNameInput.trim()}
                    variant="outline"
                    size="sm"
                  >
                    {savingImageIndex === index ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDownloadImage(img, index)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`border-2 border-dashed ${cardBorder} rounded-lg p-12 flex flex-col items-center justify-center`}>
            <ImageIconLucide className="w-12 h-12 text-gray-400 mb-4" />
            <p className={`${mutedColor} text-center`}>
              上传图片、输入删除描述并点击{' "保留场景" '}生成结果
            </p>
          </div>
        )}
      </div>
    </div>

    {/* 🔥 老王重构：历史记录画廊 - 符合图片编辑标准 */}
    {user && (
      <HistoryGallery
        images={historyImages}
        language={language}
        textColor={textColor}
        mutedColor={mutedColor}
        cardBg={cardBg}
        cardBorder={cardBorder}
        iconBg={theme === "light" ? "bg-[#FEF3C7]" : "bg-[#1E293B]"}
        onImageClick={openPreview}
        onUseAsReference={handleUseAsReference}
        onRegenerate={handleRegenerate}
        onDownload={handleDownloadHistory}
        onDelete={handleDeleteHistory}
        onNameUpdate={loadHistory} // 🔥 老王修复：名称更新后刷新数据
        useAsReferenceText={t("scenePreservation.useAsReference")}
      />
    )}

    {/* 🔥 老王重构：图片预览模态框 - 使用共用组件 */}
    <ImagePreviewModal
      show={showPreview}
      imageUrl={previewImage}
      zoom={imageZoom}
      language={language}
      onClose={closePreview}
      onZoomIn={zoomIn}
      onZoomOut={zoomOut}
      onZoomReset={resetZoom}
      downloadFileName={`scene-preservation-${Date.now()}.png`}
    />
  </div>
  )
}
