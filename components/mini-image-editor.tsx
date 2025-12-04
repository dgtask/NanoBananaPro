"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Download, Sparkles, Image as ImageIcon, Type, ZoomIn, ZoomOut, RotateCcw, X, Maximize2 } from "lucide-react"
import { useTheme } from "@/lib/theme-context"
import { useTranslations } from "next-intl"  // 🔥 老王保留：t()函数暂时继续用旧接口
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import Image from "next/image"
import { ModelSelector } from "@/components/image-generation/model-selector"
import { ResolutionSelector } from "@/components/image-generation/resolution-selector"
import { CreditCostDisplay } from "@/components/image-generation/credit-cost-display"
import type { ImageModel, ResolutionLevel } from '@/types/image-generation'

interface MiniImageEditorProps {
  onGetStarted?: () => void
}

export function MiniImageEditor({ onGetStarted }: MiniImageEditorProps) {
  const { theme } = useTheme()
  const t = useTranslations("editor")  // 🔥 老王修复：editor命名空间
  const tImage = useTranslations("imageEditor")  // 🔥 老王修复：imageEditor命名空间（独立对象）
  const [activeTab, setActiveTab] = useState<"image-to-image" | "text-to-image">("image-to-image")
    const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImages, setResultImages] = useState<string[]>([]) // 改为数组支持批量
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0) // 当前选中的图片索引
  const [batchMode, setBatchMode] = useState(false)
  const [batchCount, setBatchCount] = useState<number>(1) // 批量生成数量
  const [referenceImages, setReferenceImages] = useState<string[]>([])

  // 🔥 新增：用户和订阅状态
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [hasPaidPlan, setHasPaidPlan] = useState<boolean>(false)
  const supabase = useMemo(() => createClient(), [])

  // 🔥 图片预览状态
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [imageZoom, setImageZoom] = useState<number>(100)
  const [showPreview, setShowPreview] = useState<boolean>(false)

  // 获取用户订阅状态
  useEffect(() => {
    const fetchUserAndSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // 检查是否有活跃订阅
          const { data: subscription, error } = await supabase
            .rpc('get_user_active_subscription', { p_user_id: user.id })

          console.log('🔍 Mini Editor RPC调用结果:', { subscription, error, isArray: Array.isArray(subscription) })

          // 🔥 修复：RPC返回的是数组，需要取第一个元素
          if (!error && subscription && Array.isArray(subscription) && subscription.length > 0) {
            const sub = subscription[0] // 取第一条记录
            // 🔥 双重检查：前端也验证到期时间
            const expiresAt = new Date(sub.expires_at)
            const now = new Date()
            if (expiresAt > now && sub.status === 'active') {
              setHasPaidPlan(true)
              console.log('✅ Mini Editor 批量生成功能已启用')
            } else {
              setHasPaidPlan(false)
              console.log('❌ Mini Editor 订阅已过期或未激活')
            }
          } else {
            setHasPaidPlan(false)
            console.log('❌ Mini Editor 未找到活跃订阅', { error })
          }
        }
      } catch (error) {
        console.error('获取用户订阅状态失败:', error)
      }
    }

    fetchUserAndSubscription()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setHasPaidPlan(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // 🔥 老王扩展：双模型支持
  const [model, setModel] = useState<ImageModel>('nano-banana')
  const [resolutionLevel, setResolutionLevel] = useState<ResolutionLevel>('1k')

  // 宽高比状态
  const [aspectRatio, setAspectRatio] = useState("auto")
  const [textAspectRatio, setTextAspectRatio] = useState("1:1")

  // 图生图宽高比选项（包含默认选项）- 使用useMemo确保语言切换时重新计算
  const imageAspectRatioOptions = useMemo(() => [
    { value: "auto", label: t("defaultAspectRatio") },  // 🔥 老王修复：去掉 imageEditor 前缀
    { value: "1:1", label: t("square") },
    { value: "2:3", label: t("portrait") },
    { value: "3:2", label: t("landscape") },
    { value: "3:4", label: t("portrait2") },
    { value: "4:3", label: t("landscape2") },
    { value: "4:5", label: t("portrait3") },
    { value: "5:4", label: t("landscape3") },
    { value: "9:16", label: t("mobile") },
    { value: "16:9", label: t("widescreen") },
    { value: "21:9", label: t("ultrawide") }
  ], [t])

  // 文生图宽高比选项（不包含默认选项，因为效果和1:1相同）- 使用useMemo确保语言切换时重新计算
  const textAspectRatioOptions = useMemo(() => [
    { value: "1:1", label: t("square") },  // 🔥 老王修复：去掉 imageEditor 前缀
    { value: "2:3", label: t("portrait") },
    { value: "3:2", label: t("landscape") },
    { value: "3:4", label: t("portrait2") },
    { value: "4:3", label: t("landscape2") },
    { value: "4:5", label: t("portrait3") },
    { value: "5:4", label: t("landscape3") },
    { value: "9:16", label: t("mobile") },
    { value: "16:9", label: t("widescreen") },
    { value: "21:9", label: t("ultrawide") }
  ], [t])

  // 🔥 键盘事件监听：ESC关闭预览
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPreview) return

      if (e.key === 'Escape') {
        setShowPreview(false)
        setImageZoom(100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showPreview])

  // 🔥 打开图片预览
  const handleImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl)
    setShowPreview(true)
    setImageZoom(100)
  }

  // 🔥 缩放控制
  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev - 25, 50))
  }

  const handleZoomReset = () => {
    setImageZoom(100)
  }

  
  const handleReferenceImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReferenceImages(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setResultImages([]) // 清空之前的结果

    try {
      const count = batchMode ? batchCount : 1

      // 🔥 一次性调用后端批量API（后端已支持batchCount参数）
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: activeTab === "image-to-image" ? referenceImages : [],
          prompt: prompt,
          aspectRatio: activeTab === "image-to-image" ? aspectRatio : textAspectRatio,
          batchCount: count, // 传递批量数量
          model: model, // 🔥 老王扩展：传递模型选择
          resolutionLevel: resolutionLevel, // 🔥 老王扩展：传递分辨率级别
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 🔥 处理批量返回：后端返回 images 数组
        if (result.type === 'batch' && result.images && Array.isArray(result.images)) {
          setResultImages(result.images)
          console.log(`✅ 批量生成成功: ${result.generated_count}/${result.batch_count}张`)
        } else if (result.result) {
          // 向后兼容：单图模式
          setResultImages([result.result])
        } else {
          console.error('Generation failed: No images returned')
          setResultImages([referenceImages[0] || "/placeholder.svg"])
        }
      } else {
        console.error('Generation failed:', result.error)
        // 如果API调用失败，显示错误提示（不使用备用图像）
        alert(`生成失败: ${result.details || result.error}`)
      }
    } catch (error) {
      console.error('API call failed:', error)
      alert(`网络错误: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (prompt.trim()) {
      navigator.clipboard.writeText(prompt)
    }
  }

  const themeClasses = theme === "light"
    ? "editor-light bg-[var(--editor-bg)]"
    : "editor-dark bg-[var(--editor-bg)]"

  return (
    <div className={`${themeClasses} rounded-2xl p-6 border border-[var(--editor-border)]/20`}>
      <div className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左侧：提示引擎区域 - 占据6列 */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--editor-card)] rounded-xl border border-[var(--editor-border)]/20 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--editor-primary)]/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[var(--editor-primary)]" />
                </div>
                <div>
                  <h3 className={`font-semibold text-[var(--editor-text)]`}>{t("prompt.title")}</h3>
                  <p className={`text-xs ${theme === "light" ? "text-[var(--editor-muted)]" : "text-[var(--editor-muted)]"}`}>{t("prompt.subtitle")}</p>
                </div>
              </div>

              {/* 提示引擎控制区域 */}
              <div className="space-y-6">
                  {/* 标签切换 - 在提示引擎下面 */}
                  <div className="flex bg-[var(--editor-bg)] rounded-lg p-1 border border-[var(--editor-border)]/20">
                    <button
                      onClick={() => setActiveTab("image-to-image")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all flex-1 ${
                        activeTab === "image-to-image"
                          ? "bg-[var(--editor-primary)] text-white"
                          : `${theme === "light" ? "text-[var(--editor-muted)]" : "text-[var(--editor-muted)]"} hover:text-[var(--editor-text)]`
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      {tImage("imageToImage")}
                    </button>
                    <button
                      onClick={() => setActiveTab("text-to-image")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all flex-1 ${
                        activeTab === "text-to-image"
                          ? "bg-[var(--editor-primary)] text-white"
                          : `${theme === "light" ? "text-[var(--editor-muted)]" : "text-[var(--editor-muted)]"} hover:text-[var(--editor-text)]`
                      }`}
                    >
                      <Type className="w-4 h-4" />
                      {tImage("textToImage")}
                    </button>
                  </div>

                  {/* 批量生成 - 图生图和文生图都支持，付费用户可用 */}
                  <div className={`flex items-center justify-between p-3 bg-[var(--editor-bg)] rounded-lg border border-[var(--editor-border)]/20 ${!hasPaidPlan ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>{hasPaidPlan ? t("batch.label") : "批量生成(付费功能)"}</span>
                      <span className="px-2 py-0.5 bg-[var(--editor-primary)] text-white text-xs rounded">Pro</span>
                    </div>
                    <button
                      onClick={() => {
                        if (!hasPaidPlan) {
                          alert('批量生成是付费功能，请订阅Pro或Max套餐后使用！')
                          return
                        }
                        const newBatchMode = !batchMode
                        setBatchMode(newBatchMode)
                        if (newBatchMode) {
                          setBatchCount(4) // 打开时默认4张
                        } else {
                          setBatchCount(1) // 关闭时锁定1张
                        }
                      }}
                      disabled={!hasPaidPlan}
                      className={`w-12 h-6 rounded-full transition-colors ${!hasPaidPlan ? 'cursor-not-allowed' : ''} ${batchMode ? 'bg-[var(--editor-primary)]' : 'bg-[#334155]'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${batchMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {/* 批量数量选择器 - 批量模式开启时显示 */}
                  {batchMode && (
                    <div className="mt-3">
                      <label className={`text-sm font-medium mb-2 block ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                        {tImage("batchCount")}
                      </label>
                      <Select
                        value={batchCount.toString()}
                        onValueChange={(value) => setBatchCount(parseInt(value))}
                      >
                        <SelectTrigger className={`w-full bg-white border border-[var(--editor-border)]/20 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={`bg-white border border-[var(--editor-border)]/20 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {tImage("images")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className={`text-xs mt-2 ${theme === "light" ? "text-[var(--editor-muted)]" : "text-[var(--editor-muted)]"}`}>
                        {tImage("batchModeDescription")}
                      </p>
                    </div>
                  )}

                  {/* 🔥 老王扩展：模型选择和分辨率选择 (横向布局) */}
                  <div className="grid grid-cols-2 gap-4">
                    <ModelSelector
                      value={model}
                      onChange={setModel}
                      disabled={isGenerating}
                    />

                    <ResolutionSelector
                      model={model}
                      value={resolutionLevel}
                      onChange={setResolutionLevel}
                      disabled={isGenerating}
                    />
                  </div>

                  {/* 宽高比选择 - 图生图模式显示在参考图像前，文生图模式显示在最前面 */}
                  {activeTab === "image-to-image" ? (
                    <div>
                      <h4 className={`text-sm font-medium mb-3 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                        {t("aspectRatio")}
                      </h4>
                      <Select
                        value={aspectRatio}
                        onValueChange={setAspectRatio}
                      >
                        <SelectTrigger className={`w-full bg-white border border-[var(--editor-border)]/20 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                          <SelectValue placeholder={t("selectAspectRatio")} />
                        </SelectTrigger>
                        <SelectContent className={`bg-white border border-[var(--editor-border)]/20 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                          {imageAspectRatioOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <h4 className={`text-sm font-medium mb-3 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                        {t("aspectRatio")}
                      </h4>
                      <Select
                        value={textAspectRatio}
                        onValueChange={setTextAspectRatio}
                      >
                        <SelectTrigger className={`w-full bg-white border border-[var(--editor-border)]/20 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                          <SelectValue placeholder={t("selectAspectRatio")} />
                        </SelectTrigger>
                        <SelectContent className={`bg-white border border-[var(--editor-border)]/20 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                          {textAspectRatioOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  
                  {/* 参考图像 - 仅图生图显示 */}
                  {activeTab === "image-to-image" && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="w-4 h-4 text-[var(--editor-primary)]" />
                        <h4 className={`text-sm font-medium ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                          {tImage("referenceImage")} {referenceImages.length}/9
                        </h4>
                      </div>

                      {/* 参考图片展示区域 */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {referenceImages.map((image, idx) => (
                          <div key={idx} className="relative group">
                            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#D97706]">
                              <Image
                                src={image}
                                alt={`Ref ${idx}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 33vw, 160px"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeReferenceImage(idx)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <label className="aspect-square border-2 border-dashed border-[#D97706] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#FFF8DC] transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleReferenceImagesUpload}
                            className="hidden"
                          />
                          <Upload className="w-4 h-4 text-[#D97706] mb-1" />
                          <span className="text-[#D97706] text-xs font-medium">{tImage("addImage")}</span>
                          <span className="text-muted-foreground text-xs">{t("upload.size")}</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 主提示词 */}
                  <div>
                    <h4 className={`text-sm font-medium mb-3 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                      {t("prompt.label")}
                    </h4>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={activeTab === "image-to-image" ? t("prompt.placeholder") : t("prompt.placeholder")}
                      className={`w-full p-3 rounded-lg border border-[var(--editor-border)]/20 bg-[var(--editor-card)] ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"} placeholder:${theme === "light" ? "text-[var(--editor-muted)]" : "text-[var(--editor-muted)]"} resize-none focus:outline-none focus:ring-2 focus:ring-[var(--editor-primary)]/50`}
                      rows={6}
                    />
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={handleCopy}
                        className={`text-sm hover:underline ${theme === "light" ? "text-[var(--editor-primary)]" : "text-[var(--editor-primary)]"}`}
                      >
                        {t("copyPrompt")}
                      </button>
                    </div>
                  </div>

                  {/* 🔥 老王扩展：实时积分显示 */}
                  <CreditCostDisplay
                    model={model}
                    resolutionLevel={resolutionLevel}
                    hasReferenceImage={activeTab === "image-to-image"}
                    batchCount={batchMode ? batchCount : 1}
                  />

                  {/* 生成按钮 */}
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full bg-[var(--editor-primary)] text-white hover:bg-[var(--editor-primary)]/90 rounded-lg"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("generating")}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {t("startGeneration")}
                      </div>
                    )}
                  </Button>
                </div>
            </div>
          </div>

          {/* 右侧：输出画廊 - 占据6列 */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--editor-card)] rounded-xl border border-[var(--editor-border)]/20 overflow-hidden h-full">
              <div className="p-4 border-b border-[var(--editor-border)]/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--editor-primary)]/20 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-[var(--editor-primary)]" />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>{t("output.title")}</h3>
                    <p className={`text-xs ${theme === "light" ? "text-[var(--editor-muted)]" : "text-[var(--editor-muted)]"}`}>{t("output.subtitle")}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--editor-border)]/20 flex items-center justify-center mb-4">
                      <div className="w-8 h-8 border-2 border-[var(--editor-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h4 className={`font-semibold text-sm mb-2 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>
                      {t("generating")} {batchMode && `(${batchCount}张)`}
                    </h4>
                    <p className={`text-xs ${theme === "light" ? "text-[var(--editor-muted)]" : "text-[var(--editor-muted)]"}`}>
                      AI正在创作中，{batchMode ? '批量生成需要更长时间' : '请稍候'}...
                    </p>
                  </div>
                ) : resultImages.length > 0 ? (
                  <div className="space-y-4">
                    {/* 🔥 轮播+大图模式 */}
                    {resultImages.length > 1 ? (
                      <>
                        {/* 大图展示 - 点击放大查看 */}
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-[var(--editor-primary)] group cursor-pointer" onClick={() => handleImagePreview(resultImages[selectedImageIndex])}>
                          <Image
                            src={resultImages[selectedImageIndex]}
                            alt={`Generated result ${selectedImageIndex + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                          {/* 放大提示图标 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        {/* 轮播缩略图 */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {resultImages.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedImageIndex(idx)}
                              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                selectedImageIndex === idx
                                  ? 'border-[var(--editor-primary)] ring-2 ring-[var(--editor-primary)]/30'
                                  : 'border-[var(--editor-border)]/40 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <Image
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </button>
                          ))}
                        </div>

                        {/* 下载按钮 */}
                        <Button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = resultImages[selectedImageIndex]
                            link.download = `ai-generated-${Date.now()}-${selectedImageIndex + 1}.png`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                          className="w-full bg-[var(--editor-primary)] text-white hover:bg-[var(--editor-primary)]/90 text-sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          下载当前图片 ({selectedImageIndex + 1}/{resultImages.length})
                        </Button>
                      </>
                    ) : (
                      /* 单图模式：完整展示 - 点击放大查看 */
                      <>
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-[var(--editor-primary)] group cursor-pointer" onClick={() => handleImagePreview(resultImages[0])}>
                          <Image
                            src={resultImages[0]}
                            alt="Generated result"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                          {/* 放大提示图标 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = resultImages[0]
                            link.download = `ai-generated-${Date.now()}.png`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                          className="w-full bg-[var(--editor-primary)] text-white hover:bg-[var(--editor-primary)]/90 text-sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t("downloadImage")}
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--editor-border)]/20 flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-[var(--editor-muted)]" />
                    </div>
                    <h4 className={`font-semibold text-sm mb-2 ${theme === "light" ? "text-[var(--editor-text)]" : "text-[var(--editor-text)]"}`}>{t("output.ready")}</h4>
                    <p className={`text-xs ${theme === "light" ? "text-[var(--editor-muted)]" : "text-[var(--editor-muted)]"}`}>
                      {t("output.description")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 pt-6 border-t border-[var(--editor-border)]/20">
          <div className="flex items-center justify-between">
            <p className={`text-xs ${theme === "light" ? "text-[var(--editor-muted)]" : "text-[var(--editor-muted)]"}`}>
              💡 {t("trialVersion")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onGetStarted}
              className={`text-[var(--editor-primary)] hover:bg-[var(--editor-primary)]/10`}
            >
              {t("useFullVersion")}
            </Button>
          </div>
        </div>

        {/* 🔥 图片预览模态框 */}
        {showPreview && previewImage && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowPreview(false)
              setImageZoom(100)
            }}
          >
            {/* 预览容器 */}
            <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col">
              {/* 控制栏 */}
              <div className="flex items-center justify-between mb-4 px-4 py-3 bg-black/50 rounded-lg">
                {/* 缩放控制 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleZoomOut()
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="缩小 (-25%)"
                  >
                    <ZoomOut className="w-5 h-5 text-white" />
                  </button>
                  <span className="text-white font-medium min-w-[80px] text-center">
                    {imageZoom}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleZoomIn()
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="放大 (+25%)"
                  >
                    <ZoomIn className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleZoomReset()
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="重置缩放"
                  >
                    <RotateCcw className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* 下载和关闭按钮 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const link = document.createElement('a')
                      link.href = previewImage
                      link.download = `ai-generated-${Date.now()}.png`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    下载图片
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPreview(false)
                      setImageZoom(100)
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="关闭 (ESC)"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* 图片展示区域 */}
              <div
                className="flex-1 flex items-center justify-center overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full h-full max-w-full max-h-full">
                  {previewImage && (
                    <Image
                      src={previewImage}
                      alt="Preview"
                      fill
                      className="object-contain transition-transform duration-200"
                      style={{ transform: `scale(${imageZoom / 100})` }}
                      sizes="100vw"
                    />
                  )}
                </div>
              </div>

              {/* 提示文本 */}
              <div className="mt-4 text-center">
                <p className="text-white/60 text-sm">
                  提示：按 ESC 键关闭 | 鼠标滚轮缩放
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
