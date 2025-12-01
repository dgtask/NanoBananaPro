"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, FileText, Download, Copy, Check, Clock, Maximize2, RefreshCw } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTheme } from "@/lib/theme-context"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useImagePreview } from "@/hooks/use-image-preview"
import { usePromptOptimizer } from "@/hooks/use-prompt-optimizer"
import { ImagePreviewModal } from "@/components/shared/image-preview-modal"
import { PromptOptimizationModal } from "@/components/prompt-optimizer/optimization-modal"
import { HistoryGallery } from "@/components/shared/history-gallery"
import { useRouter } from "next/navigation" // 🔥 老王修复：添加缺失的useRouter导入
import Image from "next/image"

interface TextToImageWithTextProps {
  user: SupabaseUser | null
}

// 模板类型
interface Template {
  id: string
  name: string
  description: string
  prompt: string
  aspectRatio: string
  category: string
}

const getTemplates = (t: (key: string) => string): Template[] => [
  {
    id: "recipe",
    name: t("textToImageWithText.template.recipe.name"),
    description: t("textToImageWithText.template.recipe.description"),
    prompt: t("textToImageWithText.template.recipe.prompt"),
    aspectRatio: "16:9",
    category: t("textToImageWithText.template.recipe.category") || "烹饪"
  },
  {
    id: "tutorial",
    name: t("textToImageWithText.template.tutorial.name"),
    description: t("textToImageWithText.template.tutorial.description"),
    prompt: t("textToImageWithText.template.tutorial.prompt"),
    aspectRatio: "4:3",
    category: t("textToImageWithText.template.tutorial.category") || "教育"
  },
  {
    id: "marketing",
    name: t("textToImageWithText.template.marketing.name"),
    description: t("textToImageWithText.template.marketing.description"),
    prompt: t("textToImageWithText.template.marketing.prompt"),
    aspectRatio: "1:1",
    category: t("textToImageWithText.template.marketing.category") || "营销"
  },
  {
    id: "story",
    name: t("textToImageWithText.template.story.name"),
    description: t("textToImageWithText.template.story.description"),
    prompt: t("textToImageWithText.template.story.prompt"),
    aspectRatio: "3:2",
    category: t("textToImageWithText.template.story.category") || "创意"
  },
  {
    id: "poster",
    name: t("textToImageWithText.template.poster.name"),
    description: t("textToImageWithText.template.poster.description"),
    prompt: t("textToImageWithText.template.poster.prompt"),
    aspectRatio: "2:3",
    category: t("textToImageWithText.template.poster.category") || "设计"
  },
  {
    id: "manual",
    name: t("textToImageWithText.template.manual.name"),
    description: t("textToImageWithText.template.manual.description"),
    prompt: t("textToImageWithText.template.manual.prompt"),
    aspectRatio: "3:2",
    category: t("textToImageWithText.template.manual.category") || "文档"
  }
]

export function TextToImageWithText({ user }: TextToImageWithTextProps) {
  const { language, t } = useLanguage()
  const { theme } = useTheme()
  const router = useRouter() // 🔥 老王修复：初始化router
  const supabase = useMemo(() => createClient(), [])

  // Get localized templates
  const templates = getTemplates(t)

  const [prompt, setPrompt] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [batchCount, setBatchCount] = useState(1) // 🔥 老王新增：批量生成数量（1-9张）
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creditsUsed, setCreditsUsed] = useState<number>(0)
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null)
  const [historyRecords, setHistoryRecords] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyImages, setHistoryImages] = useState<any[]>([])

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

  // 主题相关的样式类
  const bgColor = theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0A0F1C]"
  const cardBg = theme === "light" ? "bg-[#FFFFFF]" : "bg-[#0F1728]"
  const cardBorder = theme === "light" ? "border-[#F59E0B]/20" : "border-[#1E293B]"
  const textColor = theme === "light" ? "text-[#1E293B]" : "text-white"
  const mutedColor = theme === "light" ? "text-[#64748B]" : "text-[#94A3B8]"
  const inputBg = theme === "light" ? "bg-white" : "bg-[#1E293B]"
  const inputBorder = theme === "light" ? "border-[#E2E8F0]" : "border-[#374151]"
  const primaryColor = theme === "light" ? "text-[#D97706]" : "text-[#D97706]"
  const primaryBg = theme === "light" ? "bg-[#D97706]" : "bg-[#D97706]"

  // 加载历史记录
  const loadHistory = useCallback(async () => {
    if (!user) return
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/history?tool_type=text-to-image-with-text&limit=10')
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
                prompt: record.prompt || '图文交织',
                created_at: record.created_at,
                credits_used: record.credits_used || 1,
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
    if (user) loadHistory()
  }, [user, loadHistory])

  // 🔥 老王重构：删除历史记录
  const handleDeleteHistory = async (recordId: string) => {
    try {
      const response = await fetch(`/api/history?id=${recordId}`, { method: 'DELETE' })
      if (response.ok && user) {
        loadHistory() // 刷新历史记录
      }
    } catch (error) {
      console.error(t("tools.textToImageWithText.deleteHistoryFailed"), error)
    }
  }

  // 🔥 老王重构：下载历史记录图片
  const handleDownloadHistory = (imageUrl: string, recordId: string, imageIndex: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `text-to-image-${recordId}-${imageIndex + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 🔥 老王重构：使用历史图片作为参考 - 特殊逻辑：跳转到图片编辑页面
  const handleUseHistoryImage = (imageUrl: string, recordId: string) => {
    // 文生图特殊处理：跳转到图片编辑页面，把历史生成图作为参考图
    // 保存图片URL到localStorage，然后跳转
    localStorage.setItem('text_to_image_reference', imageUrl)
    router.push('/editor/image-edit?mode=image-to-image')
  }

  // 🔥 老王新增：重新生成 - 回填历史记录输入内容
  const handleRegenerate = (item: any) => {
    // 文生图工具需要回填提示词和画幅比例
    if (item.prompt) {
      setPrompt(item.prompt)
    }

    if (item.aspect_ratio) {
      setAspectRatio(item.aspect_ratio)
    }

    // 清空之前的生成结果和错误
    setResult(null)
    setError(null)
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    setAspectRatio(template.aspectRatio)
    setPrompt(template.prompt)
  }

  const handleGenerate = async () => {
    if (!user) {
      alert(t("tools.textToImageWithText.loginFirst"))
      return
    }

    if (!prompt.trim()) {
      setError(t("tools.textToImageWithText.pleaseEnterDescription"))
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [], // 纯文生图
          prompt: prompt.trim(),
          aspectRatio: aspectRatio,
          responseModalities: ['Image', 'Text'], // 图文交织模式
          toolType: 'text-to-image-with-text',
          batchCount: batchCount, // 🔥 老王新增：批量生成数量
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult(data)

        // 保存积分消耗和历史记录ID
        if (data.credits_used) {
          setCreditsUsed(data.credits_used)
          alert(t("tools.textToImageWithText.generationSuccessCredits").replace('{credits}', data.credits_used.toString()))
        }
        if (data.history_record_id) {
          setHistoryRecordId(data.history_record_id)
          // 延迟刷新历史记录，确保数据库已写入
          setTimeout(() => loadHistory(), 1000)
        }
      } else {
        setError(data.error || t("textToImageWithText.generationFailed"))
      }
    } catch (err) {
      setError(t("textToImageWithText.networkError"))
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyText = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 🔥 老王新增：触发提示词优化
  const handleOptimizePrompt = async () => {
    if (!prompt.trim()) {
      setError(t("textToImageWithText.enterPromptFirst"))
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

  const handleDownloadImage = () => {
    if (result?.image || result?.result) {
      const imageUrl = result.image || result.result
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `generated-image-${Date.now()}.png`
      link.click()
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和描述 */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <FileText className="w-8 h-8 text-[#D97706]" />
          <h1 className={`text-3xl font-bold ${textColor}`}>
            {t("textToImageWithText.pageTitle")}
          </h1>
        </div>
        <p className={`text-lg ${mutedColor} max-w-2xl mx-auto`}>
          {t("textToImageWithText.pageDescription")}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant="secondary" className="bg-[#FEF3C7] text-[#D97706]">
            Gemini 2.5 Flash
          </Badge>
          <Badge variant="secondary" className="bg-[#FEF3C7] text-[#D97706]">
            {t("textToImageWithText.imageTextWeaving")}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：模板选择 + 参数设置 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 模板选择 */}
          <Card className={`${cardBg} border ${cardBorder} rounded-xl`}>
            <CardHeader>
              <CardTitle className={`text-lg ${textColor}`}>{t("textToImageWithText.selectTemplate")}</CardTitle>
              <CardDescription className={mutedColor}>
                {t("textToImageWithText.quickStart")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-[#D97706] bg-[#FEF3C7] dark:bg-[#D97706]/10'
                      : `${cardBorder} hover:border-[#D97706]/50`
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {template.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.description}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {template.category}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* 参数设置 */}
          <Card className={`${cardBg} border ${cardBorder} rounded-xl`}>
            <CardHeader>
              <CardTitle className={`text-lg ${textColor}`}>{t("textToImageWithText.parameterSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                  {t("textToImageWithText.aspectRatio")}
                </label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1 {t("tools.textToImageWithText.aspectRatio.square")}</SelectItem>
                    <SelectItem value="4:3">4:3 {t("tools.textToImageWithText.aspectRatio.landscape")}</SelectItem>
                    <SelectItem value="3:4">3:4 {t("tools.textToImageWithText.aspectRatio.portrait")}</SelectItem>
                    <SelectItem value="16:9">16:9 {t("tools.textToImageWithText.aspectRatio.widescreen")}</SelectItem>
                    <SelectItem value="9:16">9:16 {t("tools.textToImageWithText.aspectRatio.vertical")}</SelectItem>
                    <SelectItem value="3:2">3:2 {t("tools.textToImageWithText.aspectRatio.landscape")}</SelectItem>
                    <SelectItem value="2:3">2:3 {t("tools.textToImageWithText.aspectRatio.portrait")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 🔥 老王新增：出图数量选择器 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                  {t("tools.textToImageWithText.imageCount")}
                </label>
                <Select value={String(batchCount)} onValueChange={(v) => setBatchCount(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <SelectItem key={num} value={String(num)}>
                        {num} {t("tools.textToImageWithText.imagesUnit")} ({num} {t("tools.textToImageWithText.creditsUnit")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={`text-xs ${mutedColor} mt-1`}>
                  {t("tools.textToImageWithText.creditHint")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：输出画廊 + 描述内容 */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* 输出画廊 */}
          <Card className={`${cardBg} border ${cardBorder} rounded-xl flex-1`}>
            <CardHeader>
              <CardTitle className={`text-lg ${textColor}`}>{t("textToImageWithText.outputGallery")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result ? (
                <>
                  {/* 🔥 老王重构：支持批量生成多张图片显示 */}
                  {(result.images || result.image) && (
                    <div className="space-y-2">
                      <h4 className={`font-medium ${textColor}`}>
                        {t("textToImageWithText.generatedImage")}
                        {result.images && result.images.length > 1 && ` ${t("tools.textToImageWithText.imageCountSuffix").replace('{count}', result.images.length.toString())}`}
                      </h4>

                      {/* 单张图片 */}
                      {result.image && !result.images && (
                        <>
                          <div
                            className="relative group cursor-pointer rounded-lg overflow-hidden border max-h-96"
                            onClick={() => openPreview(result.image)}
                          >
                            <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                              <Image
                                src={result.image}
                                alt="Generated image"
                                fill
                                className="object-contain"
                                sizes="(max-width: 1024px) 100vw, 640px"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                              <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <Button
                            onClick={handleDownloadImage}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {t("textToImageWithText.downloadImage")}
                          </Button>
                        </>
                      )}

                      {/* 🔥 老王新增：多张图片网格显示 */}
                      {result.images && result.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {result.images.map((img: string, index: number) => (
                            <div key={index} className="space-y-2">
                              <div
                                className="relative group cursor-pointer rounded-lg overflow-hidden border aspect-square"
                                onClick={() => openPreview(img)}
                              >
                                <Image
                                  src={img}
                                  alt={`Generated ${index + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 1024px) 50vw, 360px"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                  <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {/* 图片序号标识 */}
                                <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                                  {index + 1}
                                </div>
                              </div>
                              <Button
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = img
                                  link.download = `generated-image-${Date.now()}-${index + 1}.png`
                                  link.click()
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                {t("tools.textToImageWithText.download")}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {result.text && (
                    <div className="space-y-2">
                      <h4 className={`font-medium ${textColor}`}>{t("textToImageWithText.generatedText")}</h4>
                      <div className={`p-3 rounded-lg border ${theme === 'light' ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#1E293B] border-[#374151]'} max-h-32 overflow-y-auto`}>
                        <p className={`text-sm leading-relaxed ${textColor}`}>{result.text}</p>
                      </div>
                      <Button
                        onClick={handleCopyText}
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            {t("textToImageWithText.copied")}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            {t("textToImageWithText.copyText")}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className={`h-full flex items-center justify-center ${mutedColor}`}>
                  <div className="text-center">
                    <div className="text-lg mb-2">🎨</div>
                    <p className="text-sm">{t("textToImageWithText.noResult")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 描述内容 */}
          <Card className={`${cardBg} border ${cardBorder} rounded-xl`}>
            <CardHeader>
              <CardTitle className={`text-lg ${textColor}`}>{t("textToImageWithText.describeContent")}</CardTitle>
              <CardDescription className={mutedColor}>
                {t("textToImageWithText.describeContentDetail")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("textToImageWithText.placeholder")}
                className={`min-h-[120px] ${inputBg} ${inputBorder} ${textColor} resize-none`}
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

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-[#D97706] hover:bg-[#B45309] text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("textToImageWithText.generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("textToImageWithText.generateContent")} ({language === 'zh' ? `消耗 ${batchCount} ${t("tools.textToImageWithText.creditsUnit")}` : `Costs ${batchCount} ${batchCount === 1 ? t("tools.textToImageWithText.creditUnit") : t("tools.textToImageWithText.creditsUnit")}`})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
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
          onUseAsReference={handleUseHistoryImage}
          onRegenerate={handleRegenerate}
          onDownload={handleDownloadHistory}
          onDelete={handleDeleteHistory}
          useAsReferenceText={t("tools.textToImageWithText.useAsReference")}
        />
      )}

      {/* 🔥 老王重构：图片预览模态框 - 使用共用���件 */}
      <ImagePreviewModal
        show={showPreview}
        imageUrl={previewImage}
        zoom={imageZoom}
        language={language}
        onClose={closePreview}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={resetZoom}
        downloadFileName={`text-to-image-${Date.now()}.png`}
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
