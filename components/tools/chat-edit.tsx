"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, MessageCircle, Sparkles, Image as ImageIcon, Loader2, Clock, Maximize2, RefreshCw, Download } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTheme } from "@/lib/theme-context"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useImagePreview } from "@/hooks/use-image-preview"
import { usePromptOptimizer } from "@/hooks/use-prompt-optimizer"
import { ImagePreviewModal } from "@/components/shared/image-preview-modal"
import { PromptOptimizationModal } from "@/components/prompt-optimizer/optimization-modal"
import { HistoryGallery } from "@/components/shared/history-gallery"
import Image from "next/image"

interface ChatEditProps {
  user: SupabaseUser | null
}

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  image?: string
  timestamp: Date
}

export function ChatEdit({ user }: ChatEditProps) {
  const { t, language } = useLanguage()
  const { theme } = useTheme()
  const supabase = useMemo(() => createClient(), [])

  const [customPrompt, setCustomPrompt] = useState("")
  const [referenceImages, setReferenceImages] = useState<string[]>([])
  // 🔥 老王新增：选中的基础图片（用于后续编辑）
  const [selectedBaseImage, setSelectedBaseImage] = useState<string | null>(null)
  // 🔥 老王修复：初始化为空数组，通过useEffect设置欢迎消息以响应语言切换
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const referenceFileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
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

  // Theme-related styles
  const bgColor = theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0A0F1C]"
  const cardBg = theme === "light" ? "bg-[#FFFFFF]" : "bg-[#0F1728]"
  const cardBorder = theme === "light" ? "border-[#F59E0B]/20" : "border-[#1E293B]"
  const textColor = theme === "light" ? "text-[#1E293B]" : "text-white"
  const mutedColor = theme === "light" ? "text-[#64748B]" : "text-[#94A3B8]"
  const inputBg = theme === "light" ? "bg-white" : "bg-[#1E293B]"
  const inputBorder = theme === "light" ? "border-[#E2E8F0]" : "border-[#374151]"
  const primaryColor = theme === "light" ? "text-[#D97706]" : "text-[#D97706]"
  const primaryBg = theme === "light" ? "bg-[#D97706]" : "bg-[#D97706]"
  const userBg = theme === "light" ? "bg-[#D97706]" : "bg-[#D97706]"
  const assistantBg = theme === "light" ? "bg-[#FEF3C7]" : "bg-[#1E293B]"

  // 加载历史记录
  const loadHistory = useCallback(async () => {
    if (!user) return
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/history?tool_type=chat-edit&limit=10')
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
                prompt: record.prompt || '对话编辑',
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
    if (user) loadHistory()
  }, [user, loadHistory])

  // 🔥 老王修复：监听语言变化，更新欢迎消息
  useEffect(() => {
    setChatHistory(prev => {
      const shouldSet = prev.length === 0 || (prev.length === 1 && prev[0].id === "welcome")
      if (!shouldSet) {
        return prev
      }
      const welcomeContent = t("chatEdit.welcomeMessage")
      if (prev.length === 1 && prev[0].content === welcomeContent) {
        return prev
      }
      return [{
        id: "welcome",
        type: "assistant",
        content: welcomeContent,
        timestamp: new Date()
      }]
    })
  }, [language, t])

  // 🔥 老王重构：删除历史记录
  const handleDeleteHistory = async (recordId: string) => {
    try {
      const response = await fetch(`/api/history?id=${recordId}`, { method: 'DELETE' })
      if (response.ok && user) {
        loadHistory() // 刷新历史记录
      }
    } catch (error) {
      console.error(t("tools.chatEdit.deleteHistoryFailed"), error)
    }
  }

  // 🔥 老王重构：下载历史记录图片
  const handleDownloadHistory = (imageUrl: string, recordId: string, imageIndex: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `chat-edit-${recordId}-${imageIndex + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 🔥 老王重构：使用历史图片 - 特殊逻辑：添加到聊天历史
  const handleUseHistoryImage = (imageUrl: string, recordId: string) => {
    const assistantMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "assistant",
      content: t("tools.chatEdit.previousImage"),
      image: imageUrl,
      timestamp: new Date()
    }
    setChatHistory(prev => [...prev, assistantMessage])
  }

  // 🔥 老王新增：重新生成 - 回填历史记录输入内容
  const handleRegenerate = (item: any) => {
    // 对话编辑工具需要回填参考图片和提示词
    if (item.reference_images && Array.isArray(item.reference_images)) {
      setReferenceImages(item.reference_images)
    }

    if (item.prompt) {
      setCustomPrompt(item.prompt)
    }
  }

  const handleReferenceImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (referenceImages.length < 9) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setReferenceImages(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
  }

  // 🔥 老王新增：触发提示词优化
  const handleOptimizePrompt = async () => {
    if (!customPrompt.trim()) {
      // 艹！提示用户先输入提示词
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: t("chatEdit.enterPromptFirst"),
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, errorMessage])
      return
    }

    await promptOptimizer.optimize(customPrompt)
    if (promptOptimizer.result) {
      setOptimizerModalOpen(true)
    }
  }

  // 🔥 老王新增：应用优化后的提示词
  const handleApplyOptimizedPrompt = (optimizedPrompt: string) => {
    setCustomPrompt(optimizedPrompt)
    setOptimizerModalOpen(false)
    promptOptimizer.reset()
  }

  const handleChatEdit = async () => {
    // 🔥 老王重构：登录检查 - 改用对话消息
    if (!user) {
      const loginMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: t("tools.chatEdit.loginFirst"),
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, loginMessage])
      return
    }

    // 🔥 老王修复：只需要提示词 + (选中的基础图 或 参考图) - 改用对话消息
    if (!customPrompt || (!selectedBaseImage && referenceImages.length === 0)) {
      const validationMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: t("tools.chatEdit.uploadImageAndPrompt"),
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, validationMessage])
      return
    }

    setIsGenerating(true)

    try {
      // 🔥 老王修复：构建图片数组 - 如果有选中的基础图，放在最前面
      const allImages = selectedBaseImage
        ? [selectedBaseImage, ...referenceImages]
        : referenceImages

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: allImages,
          prompt: customPrompt,
          responseModalities: ['Image', 'Text'],
          toolType: 'chat-edit',
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 添加用户消息到聊天历史
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "user",
          content: customPrompt,
          timestamp: new Date()
        }

        // 添加AI响应到聊天历史
        const generatedImageUrl = data.image || data.result

        // 🔥 老王重构：成功消息整合到对话内容中
        const creditsInfo = data.credits_used ? `\n\n${t("tools.chatEdit.creditsUsed").replace('{credits}', data.credits_used.toString())}` : ""
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `${data.text || t("tools.chatEdit.editComplete")}${creditsInfo}`,
          image: generatedImageUrl,
          timestamp: new Date()
        }

        setChatHistory(prev => [...prev, userMessage, assistantMessage])
        setCustomPrompt("")

        // 🔥 老王新增：自动选中最新生成的图片作为下次编辑的基础
        if (generatedImageUrl) {
          setSelectedBaseImage(generatedImageUrl)
        }

        // 保存积分消耗和历史记录ID
        if (data.credits_used) {
          setCreditsUsed(data.credits_used)
          // 🔥 老王重构：移除弹窗，信息已在对话中显示
        }
        if (data.history_record_id) {
          setHistoryRecordId(data.history_record_id)
          // 延迟刷新历史记录，确保数据库已写入
          setTimeout(() => loadHistory(), 1000)
        }
      } else {
        // 🔥 老王重构：API错误改用对话消息
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "assistant",
          content: `${t("tools.chatEdit.editFailedPrefix")}${data.error || t("tools.chatEdit.unknownError")}`,
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, errorMessage])
      }
    } catch (error) {
      // 🔥 老王重构：异常错误改用对话消息
      console.error("Chat edit error:", error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: t("tools.chatEdit.networkError"),
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  // 滚动到聊天底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  return (
    <div className="space-y-6">
      {/* 页面标题和描述 */}
      <div className="text-center">
        <h1 className={`text-3xl font-bold mb-4 ${textColor}`}>
          {t("chatEdit.title")}
        </h1>
        <p className={`text-lg ${mutedColor} max-w-2xl mx-auto`}>
          {t("chatEdit.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        {/* 主要编辑区域 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左侧：对话历史内容框 */}
          <Card className={`${cardBg} ${cardBorder} border-2 flex flex-col`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="w-4 h-4 text-[#D97706]" />
                {t("chatEdit.chatHistory")}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4">
              {/* 聊天历史区域 */}
              <div className={`flex-1 overflow-y-auto rounded-lg p-4 ${theme === "light" ? "bg-[#F8FAFC]" : "bg-[#0F172A]"} ${cardBorder}`}>
                <div className="space-y-4">
                  {chatHistory.map((message) => (
                    <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80% ${message.type === "user" ? "order-2" : "order-1"}`}>
                        <div className={`rounded-lg p-3 ${
                          message.type === "user"
                            ? `${userBg} text-white`
                            : `${assistantBg} ${textColor}`
                        }`}>
                          {message.image && (
                            <div className="mb-2">
                              {/* 🔥 老王重构：图片可选择作为编辑基础 + 放大查看 */}
                              <div className="relative group">
                                <div
                                  className={`relative cursor-pointer w-32 h-32 rounded-lg overflow-hidden border-2 transition-all ${
                                    selectedBaseImage === message.image
                                      ? 'border-[#D97706] shadow-lg shadow-[#D97706]/50'
                                      : 'border-white/20 hover:border-[#D97706]/50'
                                  }`}
                                  onClick={() => setSelectedBaseImage(message.image!)}
                                  title="点击选择作为编辑基础"
                                >
                                  <Image
                                    src={message.image}
                                    alt="Generated image"
                                    fill
                                    className="object-cover"
                                    sizes="128px"
                                  />
                                  {/* 选中状态指示 */}
                                  {selectedBaseImage === message.image && (
                                    <div className="absolute top-1 right-1 bg-[#D97706] text-white text-xs px-2 py-0.5 rounded">
                                      已选
                                    </div>
                                  )}
                                  {/* 放大查看按钮 */}
                                  <div
                                    className="absolute bottom-1 right-1 bg-black/60 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openPreview(message.image!)
                                    }}
                                  >
                                    <Maximize2 className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className={`text-xs ${mutedColor} mt-1 ${
                          message.type === "user" ? "text-right" : "text-left"
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 右侧：编辑提示词框 + 参考图像 */}
          <div className="space-y-6">
            {/* 编辑提示词框 */}
            <Card className={`${cardBg} ${cardBorder} border-2`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  {t("chatEdit.editPromptTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={t("chatEdit.editPromptPlaceholder")}
                  className={`min-h-[120px] ${inputBg} ${inputBorder} ${textColor} resize-none`}
                  maxLength={500}
                />

                <div className="flex items-center justify-between">
                  <span className={`text-xs ${mutedColor}`}>
                    {customPrompt.length} / 500 {t("chatEdit.characterCount")}
                  </span>
                  <div className="flex gap-2">
                    {/* 🔥 老王新增：提示词优化按钮 */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOptimizePrompt}
                      disabled={isGenerating || promptOptimizer.isLoading || !customPrompt.trim()}
                    >
                      {promptOptimizer.isLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          {t("promptOptimizer.optimizing")}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t("promptOptimizer.button")}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setCustomPrompt("")}
                      variant="outline"
                      size="sm"
                    >
                      {t("chatEdit.clear")}
                    </Button>
                    <Button
                      onClick={handleChatEdit}
                      disabled={isGenerating || (!selectedBaseImage && referenceImages.length === 0) || !customPrompt}
                      size="sm"
                      className="bg-[#D97706] hover:bg-[#B45309] text-white"
                    >
                      {isGenerating ? (
                        <>
                          <Sparkles className="w-3 h-3 mr-1 animate-spin" />
                          {t("chatEdit.editing")}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t("chatEdit.startEditing")} ({t("tools.chatEdit.costsCredits")})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 参考图像 */}
            <Card className={`${cardBg} ${cardBorder} border-2`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="w-4 h-4 text-[#D97706]" />
                  {t("chatEdit.referenceImages")} {referenceImages.length}/9
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 参考图片展示区域 */}
                <div className={`h-96 ${referenceImages.length >= 6 ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                  <div className="grid grid-cols-3 gap-3 min-h-[384px]">
                    {referenceImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#D97706]">
                          <Image src={image} alt={`Reference ${index + 1}`} fill className="object-cover" sizes="(max-width: 1024px) 33vw, 160px" />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeReferenceImage(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {referenceImages.length < 9 && (
                      <label className="aspect-square border-2 border-dashed border-[#D97706] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#FEF3C7] dark:hover:bg-[#D97706]/10 transition-colors">
                        <input
                          ref={referenceFileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleReferenceImagesUpload}
                          className="hidden"
                        />
                        <Upload className="w-6 h-6 text-[#D97706] mb-2" />
                        <span className="text-[#D97706] text-xs font-medium">{t("chatEdit.addImage")}</span>
                        <span className={`text-xs ${mutedColor}`}>{t("chatEdit.maxSize")}</span>
                      </label>
                    )}
                    {/* 填充空位 */}
                    {Array.from({ length: Math.max(0, 8 - referenceImages.length - (referenceImages.length < 9 ? 1 : 0)) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="aspect-square"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 特性介绍 */}
        <Card className={`${cardBg} ${cardBorder} border-2`}>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className={`font-semibold text-lg mb-2 ${textColor}`}>{t("chatEdit.feature.naturalChat.title")}</h3>
                <p className={`text-sm ${mutedColor}`}>{t("chatEdit.feature.naturalChat.desc")}</p>
              </div>

              <div className="text-center">
                <h3 className={`font-semibold text-lg mb-2 ${textColor}`}>{t("chatEdit.feature.referenceGuide.title")}</h3>
                <p className={`text-sm ${mutedColor}`}>{t("chatEdit.feature.referenceGuide.desc")}</p>
              </div>

              <div className="text-center">
                <h3 className={`font-semibold text-lg mb-2 ${textColor}`}>{t("chatEdit.feature.smartEdit.title")}</h3>
                <p className={`text-sm ${mutedColor}`}>{t("chatEdit.feature.smartEdit.desc")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
            title={t("chatEdit.historyTitle") || "历史记录"}
            useAsReferenceText={language === 'zh' ? '使用' : 'Use'}
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
        downloadFileName={`chat-edit-${Date.now()}.png`}
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
    </div>
  )
}
