"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ImageIcon as ImageIconLucide, Loader2, Download, Save, Sparkles, FolderOpen, Maximize2, Upload, X, AlertCircle } from "lucide-react"
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
import { usePromptOptimizer } from "@/hooks/use-prompt-optimizer"
import { PromptOptimizationModal } from "@/components/prompt-optimizer/optimization-modal"
import { ModelSelector } from "@/components/image-generation/model-selector"
import { ResolutionSelector } from "@/components/image-generation/resolution-selector"
import { CreditCostDisplay } from "@/components/image-generation/credit-cost-display"
import type { ImageModel, ResolutionLevel } from '@/types/image-generation'

interface ConsistentGenerationProps {
  user: SupabaseUser | null
}

export function ConsistentGeneration({ user }: ConsistentGenerationProps) {
  const language = useLocale()  // 🔥 老王迁移：useLocale返回当前语言
  const t = useTranslations("tools")  // 🔥 老王修复：tools相关翻译在tools命名空间  // 🔥 老王保留：t()暂时继续用旧接口
  const { theme } = useTheme()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { addToast } = useToast()

  const [savedImages, setSavedImages] = useState<Array<{ name: string; url: string }>>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([]) // 🔥 本地上传的图片
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  // 🔥 老王扩展：双模型支持
  const [model, setModel] = useState<ImageModel>('nano-banana')
  const [resolutionLevel, setResolutionLevel] = useState<ResolutionLevel>('1k')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [savingImageIndex, setSavingImageIndex] = useState<number | null>(null)
  const [saveNameInput, setSaveNameInput] = useState("")
  const [creditsUsed, setCreditsUsed] = useState<number>(0)
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null)
  const [historyRecords, setHistoryRecords] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyImages, setHistoryImages] = useState<any[]>([])

  // 🔥 老王新增：其他工具的历史记录（背景移除和场景保留）
  const [toolHistoryImages, setToolHistoryImages] = useState<any[]>([])
  const [showToolHistory, setShowToolHistory] = useState(false)

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

  // 🔥 老王新增：提示词优化器状态
  const promptOptimizer = usePromptOptimizer({ level: 'quick', category: 'general' })
  const [optimizerModalOpen, setOptimizerModalOpen] = useState(false)

  // 加载用户已保存的图片和历史记录
  const loadSavedImages = useCallback(async () => {
    if (!user) return

    setIsLoadingImages(true)
    setError(null)

    try {
      const { data, error } = await supabase.storage
        .from('generated-images')
        .list(user.id, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      if (data && data.length > 0) {
        const imagePromises = data.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('generated-images')
            .getPublicUrl(`${user.id}/${file.name}`)

          return { name: file.name, url: publicUrl }
        })

        const images = await Promise.all(imagePromises)
        setSavedImages(images)
      }
    } catch (err) {
      console.error('Error loading images:', err)
      setError(t("consistentGeneration.loadFailed"))
    } finally {
      setIsLoadingImages(false)
    }
  }, [supabase, t, user])

  // 加载历史记录
  const loadHistory = useCallback(async () => {
    if (!user) return
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/history?tool_type=consistent-generation&limit=10')
      const data = await response.json()
      if (data.data) {
        setHistoryRecords(data.data)

        // 转换数据格式为 HistoryGallery 需要的格式
        const images: any[] = []
        data.data.forEach((record: any) => {
          if (record.generated_images && Array.isArray(record.generated_images)) {
            // 🔥 老王新增：获取图片名称数组和缩略图数组
            const imageNames = record.image_names || []
            const thumbnails = Array.isArray(record.thumbnail_images) ? record.thumbnail_images : []

            record.generated_images.forEach((url: string, index: number) => {
              images.push({
                id: `${record.id}-${index}`,
                url: url, // 🔥 原图URL（用于预览）
                thumbnail_url: thumbnails[index] || url, // 🔥 老王新增：缩略图URL，没有则降级使用原图
                prompt: record.prompt || '一致性生成',
                created_at: record.created_at,
                credits_used: record.credits_used || 2,
                record_id: record.id,
                image_index: index,
                image_name: imageNames[index] || null // 🔥 老王新增：添加图片名称
              })
            })
          }
        })
        setHistoryImages(images)
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }, [user])

  // 🔥 老王新增：加载背景移除和场景保留的历史记录
  const loadToolHistory = useCallback(async () => {
    if (!user) return

    try {
      // 同时加载两个工具的历史记录
      const [bgResponse, sceneResponse] = await Promise.all([
        fetch('/api/history?tool_type=background-remover&limit=20'),
        fetch('/api/history?tool_type=scene-preservation&limit=20')
      ])

      const [bgData, sceneData] = await Promise.all([
        bgResponse.json(),
        sceneResponse.json()
      ])

      const allImages: any[] = []

      // 处理背景移除的历史记录
      if (bgData.data) {
        bgData.data.forEach((record: any) => {
          if (record.generated_images && Array.isArray(record.generated_images)) {
            // 🔥 老王新增：获取图片名称数组和缩略图数组
            const imageNames = record.image_names || []
            const thumbnails = Array.isArray(record.thumbnail_images) ? record.thumbnail_images : []

            record.generated_images.forEach((url: string, index: number) => {
              allImages.push({
                id: `bg-${record.id}-${index}`,
                url: url, // 🔥 原图URL（用于预览）
                thumbnail_url: thumbnails[index] || url, // 🔥 老王新增：缩略图URL，没有则降级使用原图
                prompt: record.prompt || t("consistentGeneration.backgroundRemoverPrompt"),
                created_at: record.created_at,
                tool_type: 'background-remover',
                record_id: record.id,
                image_index: index,
                image_name: imageNames[index] || null // 🔥 老王新增：添加图片名称
              })
            })
          }
        })
      }

      // 处理场景保留的历史记录
      if (sceneData.data) {
        sceneData.data.forEach((record: any) => {
          if (record.generated_images && Array.isArray(record.generated_images)) {
            // 🔥 老王新增：获取图片名称数组和缩略图数组
            const imageNames = record.image_names || []
            const thumbnails = Array.isArray(record.thumbnail_images) ? record.thumbnail_images : []

            record.generated_images.forEach((url: string, index: number) => {
              allImages.push({
                id: `scene-${record.id}-${index}`,
                url: url, // 🔥 原图URL（用于预览）
                thumbnail_url: thumbnails[index] || url, // 🔥 老王新增：缩略图URL，没有则降级使用原图
                prompt: record.prompt || t("consistentGeneration.scenePreservationPrompt"),
                created_at: record.created_at,
                tool_type: 'scene-preservation',
                record_id: record.id,
                image_index: index,
                image_name: imageNames[index] || null // 🔥 老王新增：添加图片名称
              })
            })
          }
        })
      }

      // 按时间倒序排列
      allImages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setToolHistoryImages(allImages.slice(0, 30)) // 最多显示30张

    } catch (err) {
      console.error('Failed to load tool history:', err)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadSavedImages()
      loadHistory()
      loadToolHistory()
    }
  }, [user, loadSavedImages, loadHistory, loadToolHistory])

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
    link.download = `consistent-gen-${recordId}-${imageIndex + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 🔥 老王重构：使用历史图片作为参考
  const handleUseAsReference = (imageUrl: string, recordId: string) => {
    setSelectedImage(imageUrl)
  }

  // 🔥 老王新增：重新生成 - 回填历史记录输入内容
  const handleRegenerate = (item: any) => {
    // 一致性生成工具需要回填参考图片和提示词
    if (item.reference_images && item.reference_images.length > 0) {
      setSelectedImage(item.reference_images[0])
    }

    // 从prompt中提取用户输入的部分
    // 原始prompt格式: "Based on the reference image, generate a new image with the same subject/character/style: XXX. Maintain consistency..."
    if (item.prompt) {
      const match = item.prompt.match(/subject\/character\/style: (.+?)\. Maintain consistency/)
      if (match && match[1]) {
        setPrompt(match[1])
      } else {
        // 如果提取失败，直接使用整个prompt（用户可以自己编辑）
        setPrompt(item.prompt)
      }
    }

    // 清空之前的生成结果和错误
    setGeneratedImages([])
    setError(null)
  }

  // 🔥 老王新增：本地上传图片处理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: string[] = []
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newImages.push(reader.result as string)
        if (newImages.length === files.length) {
          setUploadedImages(prev => [...prev, ...newImages].slice(0, 9))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // 🔥 老王新增：移除上传的图片
  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    // 如果删除的是选中的图片，清除选择
    if (selectedImage === uploadedImages[index]) {
      setSelectedImage(null)
    }
  }

  // 主题样式
  const bgColor = theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0A0F1C]"
  const textColor = theme === "light" ? "text-[#1E293B]" : "text-white"
  const mutedColor = theme === "light" ? "text-[#64748B]" : "text-[#94A3B8]"
  const cardBg = theme === "light" ? "bg-[#FFFFFF]" : "bg-[#0F1728]"
  const cardBorder = theme === "light" ? "border-[#F59E0B]/20" : "border-[#1E293B]"
  const inputBg = theme === "light" ? "bg-white" : "bg-[#1E293B]"
  const inputBorder = theme === "light" ? "border-[#E2E8F0]" : "border-[#374151]"

  // 🔥 老王新增：触发提示词优化
  const handleOptimizePrompt = async () => {
    if (!prompt.trim()) {
      setError(t("consistentGeneration.enterPromptFirst"))
      return
    }

    await promptOptimizer.optimize(prompt)
    if (promptOptimizer.result) {
      setOptimizerModalOpen(true)
    }
  }

  // 🔥 老王新增：应用优化后的提示词
  const handleApplyOptimizedPrompt = (optimizedPrompt: string) => {
    setPrompt(optimizedPrompt)
    setOptimizerModalOpen(false)
    promptOptimizer.reset()
  }

  // 生成一致性图片
  const handleGenerate = async () => {
    if (!selectedImage) {
      setError(t("consistentGeneration.selectImageFirst"))
      return
    }

    if (!prompt.trim()) {
      setError(t("consistentGeneration.enterPromptFirst"))
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Based on the reference image, generate a new image with the same subject/character/style: ${prompt.trim()}. Maintain consistency in appearance, style, and characteristics.`,
          images: [selectedImage],
          toolType: 'consistent-generation',
          model: model, // 🔥 老王扩展：传递模型选择
          resolutionLevel: resolutionLevel, // 🔥 老王扩展：传递分辨率级别
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t("consistentGeneration.generationFailed"))
      }

      const data = await response.json()

      // 处理生成的图片
      if (data.images && data.images.length > 0) {
        setGeneratedImages(data.images)
      } else if (data.result) {
        setGeneratedImages([data.result])
      } else {
        throw new Error(t("consistentGeneration.noImageGenerated"))
      }

      // 保存积分消耗和历史记录ID
      if (data.credits_used) {
        setCreditsUsed(data.credits_used)
        addToast(
          t("consistentGeneration.generationSuccessCredits").replace('{credits}', data.credits_used.toString()),
          'success'
        )
      }
      if (data.history_record_id) {
        setHistoryRecordId(data.history_record_id)
        // 延迟刷新历史记录，确保数据库已写入
        setTimeout(() => loadHistory(), 1000)
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : t("consistentGeneration.generationFailed"))
    } finally {
      setIsGenerating(false)
    }
  }

  // 保存图片到Supabase Storage
  const handleSaveImage = async (imageBase64: string, index: number) => {
    if (!user) {
      router.push('/login')
      return
    }

    const imageName = saveNameInput.trim() || `consistent-gen-${Date.now()}`
    setSavingImageIndex(index)

    try {
      const base64Data = imageBase64.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      const fileName = `${user.id}/${imageName}-${Date.now()}.png`
      const { error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      addToast(t("consistentGeneration.saveSuccess"), 'success')
      setSaveNameInput("")
      loadSavedImages() // 刷新图库
    } catch (err) {
      console.error('Save error:', err)
      addToast(t("consistentGeneration.saveFailed"), 'error')
    } finally {
      setSavingImageIndex(null)
    }
  }

  // 下载图片
  const handleDownload = (imageBase64: string, index: number) => {
    const link = document.createElement('a')
    link.href = imageBase64
    link.download = `consistent-generation-${Date.now()}-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 左侧：参考图片 */}
        <div className={`${cardBg} rounded-xl border ${cardBorder} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <ImageIconLucide className="w-5 h-5 text-[#D97706]" />
            <h2 className={`text-xl font-semibold ${textColor}`}>
              {t("consistentGeneration.referenceImages")} {uploadedImages.length + savedImages.length}/9
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* 显示本地上传的图片 */}
            {uploadedImages.map((img, idx) => (
              <div key={`upload-${idx}`} className="relative group">
                <button
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all w-full ${
                    selectedImage === img
                      ? 'border-[#D97706] ring-2 ring-[#D97706]/30'
                      : 'border-[#D97706]/40 hover:border-[#D97706]/60'
                  }`}
                >
                  <Image src={img} alt={`Upload ${idx}`} fill className="object-cover" sizes="(max-width: 1024px) 33vw, 160px" />
                </button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeUploadedImage(idx)
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}

            {/* 显示Supabase Storage的图片 */}
            {savedImages.map((img, idx) => (
              <div key={`saved-${idx}`} className="relative group">
                <button
                  onClick={() => setSelectedImage(img.url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all w-full ${
                    selectedImage === img.url
                      ? 'border-[#D97706] ring-2 ring-[#D97706]/30'
                      : 'border-[#D97706]/40 hover:border-[#D97706]/60'
                  }`}
                >
                  <Image src={img.url} alt={img.name} fill className="object-cover" sizes="(max-width: 1024px) 33vw, 160px" />
                </button>
              </div>
            ))}

            {/* 本地上传区域 */}
            {(uploadedImages.length + savedImages.length) < 9 && (
              <label className={`aspect-square border-2 border-dashed border-[#D97706] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:${theme === "light" ? "bg-[#FFF8DC]" : "bg-[#1E293B]"} transition-colors`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-[#D97706] mb-2" />
                <span className="text-[#D97706] text-xs font-medium">{t("consistentGeneration.addImage")}</span>
                <span className={`${mutedColor} text-xs`}>{t("consistentGeneration.maxSize")}</span>
              </label>
            )}
          </div>

          {/* 🔥 老王新增：从其他工具历史记录选择 */}
          {toolHistoryImages.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowToolHistory(!showToolHistory)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 border-dashed transition-all ${
                  showToolHistory
                    ? 'border-[#D97706] bg-[#FFF8DC] dark:bg-[#1E293B]'
                    : 'border-[#D97706]/40 hover:border-[#D97706]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[#D97706]" />
                  <span className={`text-sm font-medium ${textColor}`}>
                    {t("consistentGeneration.selectFromHistory")}
                  </span>
                  <span className={`text-xs ${mutedColor}`}>
                    ({toolHistoryImages.length} {t("consistentGeneration.available")})
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-[#D97706] transition-transform ${showToolHistory ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showToolHistory && (
                <div className="mt-3 p-3 border border-[#D97706]/20 rounded-lg bg-[#FFFEF5] dark:bg-[#0F1728] max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2">
                    {toolHistoryImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <button
                          onClick={() => {
                            setSelectedImage(img.url)
                            setShowToolHistory(false) // 选择后自动收起
                          }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all w-full ${
                            selectedImage === img.url
                              ? 'border-[#D97706] ring-2 ring-[#D97706]/30'
                              : 'border-[#D97706]/40 hover:border-[#D97706]/60'
                          }`}
                          title={img.prompt}
                        >
                          <Image src={img.url} alt={img.prompt} fill className="object-cover" sizes="(max-width: 1024px) 25vw, 120px" />
                        </button>
                        {/* 工具类型标识 */}
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#D97706] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {img.tool_type === 'background-remover' ? t("consistentGeneration.backgroundRemoverHistory") : t("consistentGeneration.scenePreservationHistory")}
                        </div>
                        {/* 🔥 老王新增：图片名称显示 */}
                        <div className="mt-1 px-1 py-0.5 bg-[#FEF3C7] dark:bg-[#1E293B] rounded text-center">
                          <p className="text-[10px] font-medium text-[#D97706] truncate" title={img.image_name || `image-${img.image_index + 1}`}>
                            {img.image_name || `image-${img.image_index + 1}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

        {/* 提示词输入 */}
        <div className="mb-4">
          <h3 className={`text-sm font-medium ${textColor} mb-3`}>
            {t("consistentGeneration.promptLabel")}
          </h3>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("consistentGeneration.promptPlaceholder")}
            className={`min-h-[100px] ${inputBg} ${inputBorder} ${textColor}`}
          />
          {/* 🔥 老王新增：提示词优化按钮 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOptimizePrompt}
            disabled={isGenerating || promptOptimizer.isLoading || !prompt.trim()}
            className="mt-2 w-full sm:w-auto"
          >
            {promptOptimizer.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("promptOptimizer.optimizing")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t("promptOptimizer.button")}
              </>
            )}
          </Button>

          {/* 🔥 老王新增：提示词优化错误提示 */}
          {promptOptimizer.error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("error")}</AlertTitle>
              <AlertDescription>{promptOptimizer.error}</AlertDescription>
            </Alert>
          )}
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

        {/* 生成按钮 */}
        <Button
          onClick={handleGenerate}
          disabled={!selectedImage || !prompt.trim() || isGenerating}
          className="w-full bg-[#D97706] hover:bg-[#B45309] text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("consistentGeneration.generating")}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {t("consistentGeneration.generateNow")}
            </>
          )}
        </Button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* 右侧：输出画廊 */}
      <div className={`${cardBg} rounded-xl border ${cardBorder} p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <ImageIconLucide className="w-5 h-5 text-[#D97706]" />
          <h2 className={`text-xl font-semibold ${textColor}`}>
            {t("consistentGeneration.outputGallery")}
          </h2>
        </div>

        {/* 选中的参考图预览 */}
        {selectedImage && (
          <div className="mb-4">
            <p className={`text-xs ${mutedColor} mb-2`}>{t("consistentGeneration.selectedReference")}</p>
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-[#D97706]">
              <Image
                src={selectedImage}
                alt="Selected Reference"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
            </div>
          </div>
        )}

        {generatedImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIconLucide className={`w-16 h-16 ${mutedColor} mb-4`} />
            <p className={mutedColor}>{t("consistentGeneration.noImagesYet")}</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={t("consistentGeneration.enterImageName")}
                    value={saveNameInput}
                    onChange={(e) => setSaveNameInput(e.target.value)}
                    className={`flex-1 ${inputBg} ${inputBorder}`}
                  />
                  <Button
                    onClick={() => handleSaveImage(img, index)}
                    disabled={savingImageIndex === index}
                    variant="outline"
                    size="icon"
                  >
                    {savingImageIndex === index ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDownload(img, index)}
                    variant="outline"
                    size="icon"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
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
          useAsReferenceText={t("consistentGeneration.useAsReference")}
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
        downloadFileName={`consistent-generation-${Date.now()}.png`}
      />

      {/* 🔥 老王新增：提示词优化弹窗 */}
      <PromptOptimizationModal
        open={optimizerModalOpen}
        onClose={() => {
          setOptimizerModalOpen(false)
          promptOptimizer.reset()
        }}
        result={promptOptimizer.result}
        onApply={handleApplyOptimizedPrompt}
      />
    </div>
  )
}
