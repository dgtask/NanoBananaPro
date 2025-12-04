"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, ImageIcon as ImageIconLucide, Loader2, Sparkles } from "lucide-react"
import { useLocale } from "next-intl"  // 🔥 老王迁移：使用next-intl的useLocale
import { useTranslations } from "next-intl"  // 🔥 老王保留：t()函数暂时继续用旧接口
import { useTheme } from "@/lib/theme-context"
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

// 风格列表定义
const STYLE_LIST = [
  { id: "anime", nameEn: "Anime", nameZh: "动漫风格", prompt: "in anime style, vibrant colors, manga-inspired" },
  { id: "watercolor", nameEn: "Watercolor", nameZh: "水彩画", prompt: "in watercolor painting style, soft brushstrokes, artistic" },
  { id: "oil-painting", nameEn: "Oil Painting", nameZh: "油画", prompt: "in oil painting style, rich textures, classical art" },
  { id: "sketch", nameEn: "Pencil Sketch", nameZh: "素描", prompt: "in pencil sketch style, hand-drawn, artistic lines" },
  { id: "3d-render", nameEn: "3D Render", nameZh: "3D渲染", prompt: "in 3D rendered style, cinematic lighting, highly detailed" },
  { id: "pixel-art", nameEn: "Pixel Art", nameZh: "像素艺术", prompt: "in pixel art style, retro gaming aesthetic, 8-bit" },
  { id: "cartoon", nameEn: "Cartoon", nameZh: "卡通风格", prompt: "in cartoon style, colorful, playful design" },
  { id: "cyberpunk", nameEn: "Cyberpunk", nameZh: "赛博朋克", prompt: "in cyberpunk style, neon lights, futuristic" },
  { id: "fantasy", nameEn: "Fantasy", nameZh: "奇幻风格", prompt: "in fantasy art style, magical, epic" },
  { id: "minimalist", nameEn: "Minimalist", nameZh: "极简风格", prompt: "in minimalist style, clean lines, simple design" },
  { id: "vintage", nameEn: "Vintage", nameZh: "复古风格", prompt: "in vintage style, retro aesthetic, aged look" },
  { id: "gothic", nameEn: "Gothic", nameZh: "哥特风格", prompt: "in gothic style, dark atmosphere, dramatic" }
]

interface StyleTransferProps {
  user: SupabaseUser | null
}

export function StyleTransfer({ user }: StyleTransferProps) {
  const language = useLocale()  // 🔥 老王迁移：useLocale返回当前语言
  const t = useTranslations("tools")  // 🔥 老王修复：tools相关翻译在tools命名空间  // 🔥 老王保留：t()暂时继续用旧接口
  const { theme } = useTheme()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  // 🔥 老王扩展：双模型支持
  const [model, setModel] = useState<ImageModel>('nano-banana')
  const [resolutionLevel, setResolutionLevel] = useState<ResolutionLevel>('1k')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [creditsUsed, setCreditsUsed] = useState<number>(0)
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null)
  const [historyRecords, setHistoryRecords] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyImages, setHistoryImages] = useState<any[]>([])
  const [saveNameInput, setSaveNameInput] = useState("")
  const [savingImageIndex, setSavingImageIndex] = useState<number | null>(null)

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
  const primaryColor = theme === "light" ? "text-[#D97706]" : "text-[#D97706]"
  const primaryBg = theme === "light" ? "bg-[#D97706]" : "bg-[#D97706]"

  // 🔥 老王重构：加载历史记录并转换为画廊格式
  const loadHistory = useCallback(async () => {
    if (!user) return

    setLoadingHistory(true)
    try {
      const response = await fetch('/api/history?tool_type=style-transfer&limit=10')
      const data = await response.json()
      if (data.data) {
        setHistoryRecords(data.data)

        // 转换数据格式为 HistoryGallery 需要的格式
        const images: any[] = []
        data.data.forEach((record: any) => {
          if (record.generated_images && Array.isArray(record.generated_images)) {
            // 🔥 老王新增：获取缩略图数组
            const thumbnails = Array.isArray(record.thumbnail_images) ? record.thumbnail_images : []

            record.generated_images.forEach((url: string, index: number) => {
              images.push({
                id: `${record.id}-${index}`,
                url: url, // 🔥 原图URL（用于预览）
                thumbnail_url: thumbnails[index] || url, // 🔥 老王新增：缩略图URL，没有则降级使用原图
                prompt: record.prompt || '风格迁移',
                created_at: record.created_at,
                credits_used: record.credits_used || 2,
                record_id: record.id,
                image_index: index
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

  // 组件挂载时加载历史记录
  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user, loadHistory])


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

  // 生成风格迁移图片
  const handleGenerate = async () => {
    if (!referenceImage) {
      setError(t("styleTransfer.uploadImageFirst"))
      return
    }

    if (!selectedStyle) {
      setError(t("styleTransfer.selectStyleFirst"))
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    setIsGenerating(true)
    setError(null)

    const selectedStyleData = STYLE_LIST.find(s => s.id === selectedStyle)
    if (!selectedStyleData) return

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Transform this image ${selectedStyleData.prompt}. Maintain the core composition and subject while applying the style transformation.`,
          images: [referenceImage],
          toolType: 'style-transfer',
          model: model, // 🔥 老王扩展：传递模型选择
          resolutionLevel: resolutionLevel, // 🔥 老王扩展：传递分辨率级别
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t("styleTransfer.generationFailed"))
      }

      const data = await response.json()

      // 处理生成的图片
      if (data.images && data.images.length > 0) {
        setGeneratedImages(data.images)
      } else if (data.result) {
        setGeneratedImages([data.result])
      } else {
        throw new Error(t("styleTransfer.noImageGenerated"))
      }

      // 保存积分消耗和历史记录ID
      if (data.credits_used) {
        setCreditsUsed(data.credits_used)
        alert(t("styleTransfer.generationSuccess").replace('{credits}', data.credits_used.toString()))
      }
      if (data.history_record_id) {
        setHistoryRecordId(data.history_record_id)
        // 延迟刷新历史记录，确保数据库已写入
        setTimeout(() => {
          loadHistory()
        }, 1000)
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : t("styleTransfer.generationFailed"))
    } finally {
      setIsGenerating(false)
    }
  }

  // 🔥 老王重构：保存图片到Supabase Storage
  const handleSaveImage = async (imageUrl: string, index: number, name: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const base64Data = imageUrl.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      const fileName = `${user.id}/${name}-${Date.now()}.png`
      const { error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      alert(t("styleTransfer.saveSuccess"))
    } catch (err) {
      console.error('Save error:', err)
      alert(t("styleTransfer.saveFailed"))
      throw err
    }
  }

  // 🔥 老王重构：下载图片
  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `style-transfer-${Date.now()}-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 🔥 老王重构：删除历史记录
  const handleDeleteHistory = async (recordId: string) => {
    const response = await fetch(`/api/history?id=${recordId}`, { method: 'DELETE' })
    if (response.ok && user) {
      loadHistory() // 刷新历史记录
    }
  }

  // 🔥 老王重构：使用历史图片作为参考
  const handleUseAsReference = (imageUrl: string, recordId: string) => {
    setReferenceImage(imageUrl)
  }

  // 🔥 老王重构：下载历史记录图片
  const handleDownloadHistory = (imageUrl: string, recordId: string, imageIndex: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `style-transfer-${recordId}-${imageIndex + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 🔥 老王新增：重新生成 - 回填历史记录输入内容
  const handleRegenerate = (item: any) => {
    // 风格迁移工具需要回填参考图片和风格选择
    if (item.reference_images && item.reference_images.length > 0) {
      setReferenceImage(item.reference_images[0])
    }

    // 从prompt中提取风格ID
    // 原始prompt格式: "Transform this image in XXX style, ..."
    if (item.prompt) {
      // 尝试从prompt匹配风格
      const matchedStyle = STYLE_LIST.find(style =>
        item.prompt.toLowerCase().includes(style.id.replace('-', ' ')) ||
        item.prompt.toLowerCase().includes(style.nameEn.toLowerCase()) ||
        item.prompt.toLowerCase().includes(style.nameZh)
      )
      if (matchedStyle) {
        setSelectedStyle(matchedStyle.id)
      }
    }

    // 清空之前的生成结果和错误
    setGeneratedImages([])
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 左侧：风格选择网格 */}
        <div className={`${cardBg} rounded-xl border ${cardBorder} p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#D97706]" />
          <h2 className={`text-xl font-semibold ${textColor}`}>
            {t("styleTransfer.selectStyle")}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto mb-4">
          {STYLE_LIST.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`p-3 rounded-lg border-2 transition-all text-xs ${
                selectedStyle === style.id
                  ? 'border-[#D97706] bg-[#D97706]/10'
                  : `${cardBorder} hover:border-[#D97706]/50`
              }`}
            >
              <div className={`font-medium ${textColor}`}>
                {language === 'zh' ? style.nameZh : style.nameEn}
              </div>
            </button>
          ))}
        </div>

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

        {/* 参考图上传 */}
        <div className="mb-4">
          <h3 className={`text-sm font-medium ${textColor} mb-3`}>
            {t("styleTransfer.uploadReference")}
          </h3>

          {!referenceImage ? (
            <label className={`border-2 border-dashed ${cardBorder} rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#D97706] transition-colors`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-[#D97706] mb-2" />
              <p className={`${textColor} font-medium text-sm mb-1`}>{t("styleTransfer.clickToUpload")}</p>
              <p className={`${mutedColor} text-xs`}>{t("styleTransfer.supportedFormats")}</p>
            </label>
          ) : (
            <div className="relative">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                <Image
                  src={referenceImage}
                  alt="Reference"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 480px"
                />
              </div>
              <Button
                onClick={removeReferenceImage}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
              >
                {t("styleTransfer.remove")}
              </Button>
            </div>
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
          disabled={!referenceImage || !selectedStyle || isGenerating}
          className="w-full bg-[#D97706] hover:bg-[#B45309] text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("styleTransfer.generating")}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {t("styleTransfer.generateNow")}
            </>
          )}
        </Button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* 🔥 老王重构：右侧输出画廊 - 使用共用组件 */}
      <div className={`${cardBg} rounded-xl border ${cardBorder} p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <ImageIconLucide className="w-5 h-5 text-[#D97706]" />
          <h2 className={`text-xl font-semibold ${textColor}`}>
            {t("styleTransfer.outputGallery")}
          </h2>
        </div>

        <OutputGallery
          images={generatedImages}
          language={language}
          textColor={textColor}
          mutedColor={mutedColor}
          inputBg={inputBg}
          inputBorder={inputBorder}
          onImageClick={openPreview}
          onSaveImage={handleSaveImage}
          onDownloadImage={handleDownloadImage}
          emptyMessage={t("styleTransfer.noImagesYet")}
          showSaveInput={true}
        />
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
        useAsReferenceText={t("styleTransfer.useAsReference")}
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
      downloadFileName={`style-transfer-${Date.now()}.png`}
    />
  </div>
  )
}
