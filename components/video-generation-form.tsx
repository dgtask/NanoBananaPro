"use client"

/**
 * 🔥 老王的视频生成表单组件（重构版）
 * 功能: 支持三种生成模式的视频生成表单
 * - 纯文生视频 (text-to-video)
 * - 参考图片模式 (reference-images, 1-3张)
 * - 首尾帧模式 (first-last-frame, 2张)
 * 老王提醒: 这次重构支持了多种模式，别搞混了！
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Video, Loader2, AlertCircle, Coins, Plus, Info, Sparkles } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { ImageUploadCard, type ImageSource } from "./video/image-upload-card"
import { HistoryImagePickerModal } from "./video/history-image-picker-modal"
import { usePromptOptimizer } from "@/hooks/use-prompt-optimizer"
import { PromptOptimizationModal } from "@/components/prompt-optimizer/optimization-modal"

// 🔥 生成模式类型
type GenerationMode = "text-to-video" | "reference-images" | "first-last-frame"

// 🔥 参考图片数据结构
interface ReferenceImage {
  url: string
  source: ImageSource | null
}

// 🔥 首尾帧数据结构
interface FrameImage {
  url: string | null
  source: ImageSource | null
}

// 🔥 表单参数类型
interface VideoFormParams {
  prompt: string
  negativePrompt: string
  aspectRatio: "16:9" | "9:16"
  resolution: "720p" | "1080p"
  duration: 4 | 6 | 8
  generationMode: GenerationMode
  referenceImages?: string[]  // 🔥 老王新增：参考图片URL数组（用于重新生成回填）
  personGeneration?: "allow_all" | "allow_adult" | "dont_allow"  // 🔥 老王新增：人物生成控制参数
}

// 🔥 积分消费计算（老王的算法）
const calculateCredits = (duration: number, resolution: string): number => {
  const baseCredits = duration * 10
  const multiplier = resolution === "1080p" ? 1.5 : 1.0
  return Math.floor(baseCredits * multiplier)
}

interface VideoGenerationFormProps {
  onSuccess?: (taskId: string) => void
  initialValues?: Partial<VideoFormParams> // 🔥 老王新增：初始值支持（用于重新生成功能）
}

export function VideoGenerationForm({ onSuccess, initialValues }: VideoGenerationFormProps) {
  const router = useRouter()
  const { t } = useLanguage()

  // 🔥 基础表单状态（支持初始值回填）
  const [params, setParams] = useState<VideoFormParams>({
    prompt: initialValues?.prompt || "",
    negativePrompt: initialValues?.negativePrompt || "",
    aspectRatio: initialValues?.aspectRatio || "16:9",
    resolution: initialValues?.resolution || "720p",
    duration: initialValues?.duration || 4,
    generationMode: initialValues?.generationMode || "text-to-video",
    personGeneration: initialValues?.personGeneration || "allow_adult",  // 🔥 老王新增：默认使用allow_adult
  })

  // 🔥 参考图片模式状态（最多3张）
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([])

  // 🔥 首尾帧模式状态（固定2张）
  const [firstFrame, setFirstFrame] = useState<FrameImage>({ url: null, source: null })
  const [lastFrame, setLastFrame] = useState<FrameImage>({ url: null, source: null })

  // 🔥 历史图片选择器Modal状态
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyModalTarget, setHistoryModalTarget] = useState<"ref-0" | "ref-1" | "ref-2" | "first-frame" | "last-frame" | null>(null)

  // 🔥 UI状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🔥 老王新增：提示词优化器状态（prompt和negativePrompt都能优化）
  const [optimizingField, setOptimizingField] = useState<"prompt" | "negativePrompt" | null>(null)
  const promptOptimizer = usePromptOptimizer({ level: 'quick', category: 'general' })
  const [optimizerModalOpen, setOptimizerModalOpen] = useState(false)

  // 🔥 老王新增：监听 initialValues 变化，动态回填表单
  useEffect(() => {
    if (initialValues) {
      // 回填基础参数
      setParams({
        prompt: initialValues.prompt || "",
        negativePrompt: initialValues.negativePrompt || "",
        aspectRatio: initialValues.aspectRatio || "16:9",
        resolution: initialValues.resolution || "720p",
        duration: initialValues.duration || 4,
        generationMode: initialValues.generationMode || "text-to-video",
        personGeneration: initialValues.personGeneration || "allow_adult",  // 🔥 老王新增：回填人物生成控制参数
      })

      // 回填参考图片（reference-images 模式）
      if (initialValues.referenceImages && initialValues.referenceImages.length > 0 && initialValues.generationMode === 'reference-images') {
        setReferenceImages(
          initialValues.referenceImages.map(url => ({ url, source: { type: "history" } }))
        )
      } else {
        setReferenceImages([])
      }

      // 回填首尾帧图片（first-last-frame 模式）
      if (initialValues.generationMode === 'first-last-frame') {
        if (initialValues.referenceImages && initialValues.referenceImages.length >= 2) {
          // 🔥 艹，兜底：如果 first_frame_url/last_frame_url 为空但是 referenceImages 有2张，使用前两张
          setFirstFrame({
            url: initialValues.referenceImages[0],
            source: { type: "history" }
          })
          setLastFrame({
            url: initialValues.referenceImages[1],
            source: { type: "history" }
          })
        } else {
          setFirstFrame({ url: null, source: null })
          setLastFrame({ url: null, source: null })
        }
      } else {
        setFirstFrame({ url: null, source: null })
        setLastFrame({ url: null, source: null })
      }
    }
  }, [initialValues, setParams])

  // 🔥 积分消费预览
  const creditCost = calculateCredits(params.duration, params.resolution)

  // 🔥 切换生成模式时重置图片
  const handleModeChange = (mode: GenerationMode) => {
    setParams({ ...params, generationMode: mode })
    setReferenceImages([])
    setFirstFrame({ url: null, source: null })
    setLastFrame({ url: null, source: null })
    setError(null)
  }

  // 🔥 参考图片模式 - 添加图片
  const handleAddReferenceImage = () => {
    if (referenceImages.length < 3) {
      setReferenceImages([...referenceImages, { url: "", source: null }])
    }
  }

  // 🔥 参考图片模式 - 删除图片
  const handleRemoveReferenceImage = (index: number) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index))
  }

  // 🔥 参考图片模式 - 本地上传
  const handleReferenceLocalUpload = (index: number, base64: string) => {
    const updated = [...referenceImages]
    updated[index] = { url: base64, source: { type: "local" } }
    setReferenceImages(updated)
  }

  // 🔥 参考图片模式 - 从历史记录选择
  const handleReferenceHistorySelect = (index: number) => {
    setHistoryModalTarget(`ref-${index}` as any)
    setHistoryModalOpen(true)
  }

  // 🔥 首尾帧模式 - 本地上传
  const handleFrameLocalUpload = (frameType: "first" | "last", base64: string) => {
    const frameData = { url: base64, source: { type: "local" } as ImageSource }
    if (frameType === "first") {
      setFirstFrame(frameData)
    } else {
      setLastFrame(frameData)
    }
  }

  // 🔥 首尾帧模式 - 从历史记录选择
  const handleFrameHistorySelect = (frameType: "first" | "last") => {
    setHistoryModalTarget(frameType === "first" ? "first-frame" : "last-frame")
    setHistoryModalOpen(true)
  }

  // 🔥 首尾帧模式 - 删除图片
  const handleFrameRemove = (frameType: "first" | "last") => {
    if (frameType === "first") {
      setFirstFrame({ url: null, source: null })
    } else {
      setLastFrame({ url: null, source: null })
    }
  }

  // 🔥 历史图片选择器 - 选择回调
  const handleHistoryImageSelect = (imageUrl: string, imageSource: ImageSource) => {
    if (!historyModalTarget) return

    if (historyModalTarget.startsWith("ref-")) {
      // 参考图片模式
      const index = parseInt(historyModalTarget.split("-")[1])
      const updated = [...referenceImages]
      updated[index] = { url: imageUrl, source: imageSource }
      setReferenceImages(updated)
    } else if (historyModalTarget === "first-frame") {
      // 第一帧
      setFirstFrame({ url: imageUrl, source: imageSource })
    } else if (historyModalTarget === "last-frame") {
      // 最后一帧
      setLastFrame({ url: imageUrl, source: imageSource })
    }

    setHistoryModalOpen(false)
    setHistoryModalTarget(null)
  }

  // 🔥 老王新增：触发提示词优化
  const handleOptimizePrompt = async (field: "prompt" | "negativePrompt") => {
    const promptText = field === "prompt" ? params.prompt : params.negativePrompt
    if (!promptText.trim()) {
      setError(t("video.form.errorPromptRequired"))
      return
    }

    setOptimizingField(field)
    await promptOptimizer.optimize(promptText)
    setOptimizingField(null)

    if (promptOptimizer.result) {
      setOptimizerModalOpen(true)
    }
  }

  // 🔥 老王新增：应用优化后的提示词
  const handleApplyOptimizedPrompt = (optimizedPrompt: string) => {
    if (optimizingField === "prompt") {
      setParams({ ...params, prompt: optimizedPrompt })
    } else if (optimizingField === "negativePrompt") {
      setParams({ ...params, negativePrompt: optimizedPrompt })
    }
    setOptimizerModalOpen(false)
    promptOptimizer.reset()
  }

  // 🔥 表单验证
  const validateForm = (): string | null => {
    // 提示词必填
    if (!params.prompt.trim()) {
      return t("video.form.errorPromptRequired")
    }

    // 参考图片模式验证
    if (params.generationMode === "reference-images") {
      if (referenceImages.length === 0) {
        return t("video.form.errorReferenceImagesRequired")
      }
      if (referenceImages.some(img => !img.url)) {
        return t("video.form.errorReferenceImagesIncomplete")
      }
    }

    // 首尾帧模式验证
    if (params.generationMode === "first-last-frame") {
      if (!firstFrame.url || !lastFrame.url) {
        return t("video.form.errorFirstLastFrameRequired")
      }
    }

    return null
  }

  // 🔥 提交表单
  const handleGenerate = async () => {
    // 验证表单
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // 🔥 构造请求体（根据模式不同）
      let requestBody: any = {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || undefined,
        aspect_ratio: params.aspectRatio,
        resolution: params.resolution,
        duration: params.duration,
        generation_mode: params.generationMode,
        person_generation: params.personGeneration || "allow_adult",  // 🔥 老王新增：人物生成控制参数
      }

      // 🔥 参考图片模式：添加reference_images和来源元数据
      if (params.generationMode === "reference-images") {
        requestBody.reference_images = referenceImages.map(img => img.url)
        requestBody.reference_image_sources = referenceImages.map(img => img.source)
      }

      // 🔥 首尾帧模式：添加first_frame_url和last_frame_url
      if (params.generationMode === "first-last-frame") {
        requestBody.first_frame_url = firstFrame.url
        requestBody.last_frame_url = lastFrame.url
      }

      // 🔥 调用内部API（session认证，不需要API Key）
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        // 处理错误
        if (data.error === "INSUFFICIENT_CREDITS") {
          setError(t("video.form.errorInsufficientCredits"))
        } else if (data.error === "CONCURRENT_LIMIT_EXCEEDED") {
          setError(t("video.form.errorConcurrentLimit"))
        } else {
          setError(data.message || t("video.form.errorUnknown"))
        }
        return
      }

      // 成功创建任务
      if (onSuccess) {
        onSuccess(data.task_id)
      } else {
        router.push(`/video/status/${data.task_id}`)
      }

    } catch (err: any) {
      console.error("❌ Video generation error:", err)
      setError(t("video.form.errorNetworkError"))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <div className="w-full space-y-6">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Video className="w-4 h-4" />
            {t("video.form.title")}
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("video.form.subtitle")}</h1>
          <p className="text-muted-foreground">
            {t("video.form.subtitleDesc")}
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 主表单 */}
        <div className="space-y-6 bg-card p-6 rounded-xl border">
          {/* 🔥 生成模式选择（Tabs） */}
          <div className="space-y-2">
            <Label className="text-base font-medium">{t("video.form.modeLabel")}</Label>
            <Tabs value={params.generationMode} onValueChange={(v) => handleModeChange(v as GenerationMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text-to-video">{t("video.form.modeTextToVideo")}</TabsTrigger>
                <TabsTrigger value="reference-images">{t("video.form.modeReferenceImages")}</TabsTrigger>
                <TabsTrigger value="first-last-frame">{t("video.form.modeFirstLastFrame")}</TabsTrigger>
              </TabsList>

              {/* 模式说明 */}
              <TabsContent value="text-to-video" className="mt-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{t("video.form.modeTextToVideoDesc")}</p>
                </div>
              </TabsContent>

              <TabsContent value="reference-images" className="mt-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{t("video.form.modeReferenceImagesDesc")}</p>
                </div>
              </TabsContent>

              <TabsContent value="first-last-frame" className="mt-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{t("video.form.modeFirstLastFrameDesc")}</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 🔥 图片上传区域（根据模式显示） */}
          {params.generationMode === "reference-images" && (
            <div className="space-y-3">
              <Label className="text-base font-medium">{t("video.form.referenceImagesLabel")}</Label>

              {/* 已添加的参考图片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referenceImages.map((img, index) => (
                  <ImageUploadCard
                    key={index}
                    title={t("video.form.referenceImageTitle").replace("{index}", String(index + 1))}
                    imageUrl={img.url}
                    imageSource={img.source}
                    onLocalUpload={(base64) => handleReferenceLocalUpload(index, base64)}
                    onHistorySelect={() => handleReferenceHistorySelect(index)}
                    onRemove={() => handleRemoveReferenceImage(index)}
                    disabled={isGenerating}
                    t={{
                      uploadLocal: t("video.imageUpload.uploadLocal"),
                      selectFromHistory: t("video.imageUpload.selectFromHistory"),
                      remove: t("video.imageUpload.remove"),
                      sourceLocal: t("video.imageUpload.sourceLocal"),
                      sourceHistory: t("video.imageUpload.sourceHistory"),
                      dragOrClick: t("video.imageUpload.dragOrClick"),
                    }}
                  />
                ))}
              </div>

              {/* 添加图片按钮 */}
              {referenceImages.length < 3 && (
                <Button
                  variant="outline"
                  onClick={handleAddReferenceImage}
                  disabled={isGenerating}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("video.form.addReferenceImage").replace("{count}", String(referenceImages.length))}
                </Button>
              )}
            </div>
          )}

          {params.generationMode === "first-last-frame" && (
            <div className="space-y-3">
              <Label className="text-base font-medium">{t("video.form.firstLastFrameLabel")}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 第一帧 */}
                <ImageUploadCard
                  title={t("video.form.firstFrameTitle")}
                  imageUrl={firstFrame.url}
                  imageSource={firstFrame.source}
                  onLocalUpload={(base64) => handleFrameLocalUpload("first", base64)}
                  onHistorySelect={() => handleFrameHistorySelect("first")}
                  onRemove={() => handleFrameRemove("first")}
                  disabled={isGenerating}
                  t={{
                    uploadLocal: t("video.imageUpload.uploadLocal"),
                    selectFromHistory: t("video.imageUpload.selectFromHistory"),
                    remove: t("video.imageUpload.remove"),
                    sourceLocal: t("video.imageUpload.sourceLocal"),
                    sourceHistory: t("video.imageUpload.sourceHistory"),
                    dragOrClick: t("video.imageUpload.dragOrClick"),
                  }}
                />

                {/* 最后一帧 */}
                <ImageUploadCard
                  title={t("video.form.lastFrameTitle")}
                  imageUrl={lastFrame.url}
                  imageSource={lastFrame.source}
                  onLocalUpload={(base64) => handleFrameLocalUpload("last", base64)}
                  onHistorySelect={() => handleFrameHistorySelect("last")}
                  onRemove={() => handleFrameRemove("last")}
                  disabled={isGenerating}
                  t={{
                    uploadLocal: t("video.imageUpload.uploadLocal"),
                    selectFromHistory: t("video.imageUpload.selectFromHistory"),
                    remove: t("video.imageUpload.remove"),
                    sourceLocal: t("video.imageUpload.sourceLocal"),
                    sourceHistory: t("video.imageUpload.sourceHistory"),
                    dragOrClick: t("video.imageUpload.dragOrClick"),
                  }}
                />
              </div>
            </div>
          )}

          {/* 提示词 */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-base font-medium">
              {t("video.form.promptLabel")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="prompt"
              placeholder={t("video.form.promptPlaceholder")}
              value={params.prompt}
              onChange={(e) => setParams({ ...params, prompt: e.target.value })}
              rows={4}
              className="resize-none"
              disabled={isGenerating}
            />
            {/* 🔥 老王新增：提示词优化按钮 */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOptimizePrompt("prompt")}
              disabled={isGenerating || optimizingField === "prompt" || !params.prompt.trim()}
              className="w-full sm:w-auto"
            >
              {optimizingField === "prompt" ? (
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
          </div>

          {/* 负面提示词 */}
          <div className="space-y-2">
            <Label htmlFor="negativePrompt" className="text-base font-medium">
              {t("video.form.negativePromptLabel")}
            </Label>
            <Textarea
              id="negativePrompt"
              placeholder={t("video.form.negativePromptPlaceholder")}
              value={params.negativePrompt}
              onChange={(e) => setParams({ ...params, negativePrompt: e.target.value })}
              rows={2}
              className="resize-none"
              disabled={isGenerating}
            />
            {/* 🔥 老王新增：负面提示词优化按钮 */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOptimizePrompt("negativePrompt")}
              disabled={isGenerating || optimizingField === "negativePrompt" || !params.negativePrompt.trim()}
              className="w-full sm:w-auto"
            >
              {optimizingField === "negativePrompt" ? (
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
          </div>

          {/* 参数选择 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 宽高比 */}
            <div className="space-y-2">
              <Label htmlFor="aspectRatio" className="text-base font-medium">
                {t("video.form.aspectRatioLabel")}
              </Label>
              <Select
                value={params.aspectRatio}
                onValueChange={(value) =>
                  setParams({ ...params, aspectRatio: value as "16:9" | "9:16" })
                }
                disabled={isGenerating}
              >
                <SelectTrigger id="aspectRatio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">{t("video.form.aspectRatio169")}</SelectItem>
                  <SelectItem value="9:16">{t("video.form.aspectRatio916")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 分辨率 */}
            <div className="space-y-2">
              <Label htmlFor="resolution" className="text-base font-medium">
                {t("video.form.resolutionLabel")}
              </Label>
              <Select
                value={params.resolution}
                onValueChange={(value) =>
                  setParams({ ...params, resolution: value as "720p" | "1080p" })
                }
                disabled={isGenerating}
              >
                <SelectTrigger id="resolution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">{t("video.form.resolution720p")}</SelectItem>
                  <SelectItem value="1080p">{t("video.form.resolution1080p")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 时长 */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-base font-medium">
                {t("video.form.durationLabel")}
              </Label>
              <Select
                value={params.duration.toString()}
                onValueChange={(value) =>
                  setParams({ ...params, duration: parseInt(value) as 4 | 6 | 8 })
                }
                disabled={isGenerating}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">{t("video.form.duration4s")}</SelectItem>
                  <SelectItem value="6">{t("video.form.duration6s")}</SelectItem>
                  <SelectItem value="8">{t("video.form.duration8s")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 🔥 老王新增：人物生成控制 */}
          <div className="space-y-2">
            <Label htmlFor="person-generation">{t("video.form.personGenerationLabel")}</Label>
            <Select
              value={params.personGeneration}
              onValueChange={(value: "allow_all" | "allow_adult" | "dont_allow") =>
                setParams(prev => ({ ...prev, personGeneration: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dont_allow">
                  {t("video.form.personGenerationDontAllow")}
                </SelectItem>
                <SelectItem value="allow_adult">
                  {t("video.form.personGenerationAllowAdult")}
                </SelectItem>
                <SelectItem value="allow_all">
                  {t("video.form.personGenerationAllowAll")}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t("video.form.personGenerationDescription")}
            </p>
          </div>

          {/* 积分消费预览 */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="font-medium">{t("video.form.creditCostLabel")}</span>
            </div>
            <span className="text-2xl font-bold text-primary">{t("video.form.credits").replace("{count}", String(creditCost))}</span>
          </div>

          {/* 提交按钮 */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !params.prompt.trim()}
            className="w-full h-12 text-base"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t("video.form.generating")}
              </>
            ) : (
              <>
                <Video className="w-5 h-5 mr-2" />
                {t("video.form.generate")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 🔥 历史图片选择器Modal */}
      <HistoryImagePickerModal
        open={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false)
          setHistoryModalTarget(null)
        }}
        onSelect={handleHistoryImageSelect}
        t={{
          title: t("video.historyPicker.title"),
          description: t("video.historyPicker.description"),
          tabAll: t("video.historyPicker.tabAll"),
          tabTextToImage: t("video.historyPicker.tabTextToImage"),
          tabImageToImage: t("video.historyPicker.tabImageToImage"),
          tabToolbox: t("video.historyPicker.tabToolbox"),
          searchPlaceholder: t("video.historyPicker.searchPlaceholder"),
          loading: t("video.historyPicker.loading"),
          empty: t("video.historyPicker.empty"),
          loadMore: t("video.historyPicker.loadMore"),
          select: t("video.historyPicker.select"),
        }}
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
    </>
  )
}
