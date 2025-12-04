"use client"

import { useState, useEffect, useMemo, useTransition, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Sparkles, ImageIcon as ImageIconLucide, Type, Clock, LogIn, Download, ZoomIn, ZoomOut, RotateCcw, X, Maximize2, Video, AlertCircle, Loader2 } from "lucide-react"
import { useTranslations, useLocale } from 'next-intl'
import { useTheme } from "@/lib/theme-context"
import { Header } from "@/components/header"
import { EditorSidebar } from "@/components/editor-sidebar"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
// 🔥 老王优化：工具组件动态导入，减少初始加载体积
// 用户一次只用一个工具，没必要一次性加载所有工具
const StyleTransfer = dynamic(() => import("@/components/tools/style-transfer").then(m => ({ default: m.StyleTransfer })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div></div>,
  ssr: false
})
const BackgroundRemover = dynamic(() => import("@/components/tools/background-remover").then(m => ({ default: m.BackgroundRemover })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div></div>,
  ssr: false
})
const ScenePreservation = dynamic(() => import("@/components/tools/scene-preservation").then(m => ({ default: m.ScenePreservation })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div></div>,
  ssr: false
})
const ConsistentGeneration = dynamic(() => import("@/components/tools/consistent-generation").then(m => ({ default: m.ConsistentGeneration })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div></div>,
  ssr: false
})
const TextToImageWithText = dynamic(() => import("@/components/tools/text-to-image-with-text").then(m => ({ default: m.TextToImageWithText })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div></div>,
  ssr: false
})
const ChatEdit = dynamic(() => import("@/components/tools/chat-edit").then(m => ({ default: m.ChatEdit })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div></div>,
  ssr: false
})
const SmartPrompt = dynamic(() => import("@/components/tools/smart-prompt").then(m => ({ default: m.SmartPrompt })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div></div>,
  ssr: false
})
// 🔥 老王新增：视频生成表单动态导入
const VideoGenerationForm = dynamic(() => import("@/components/video-generation-form").then(m => ({ default: m.VideoGenerationForm })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div></div>,
  ssr: false
})
// 🔥 老王Day3添加：视频播放器Modal组件
const VideoPlayerModal = dynamic(() => import("@/components/video-player-modal").then(m => ({ default: m.VideoPlayerModal })), {
  loading: () => null,
  ssr: false
})
// 🔥 老王Day3修复：视频状态追踪组件（修复Runtime ReferenceError）
const VideoStatusTracker = dynamic(() => import("@/components/video-status-tracker").then(m => ({ default: m.VideoStatusTracker })), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D97706]"></div></div>,
  ssr: false
})
import { HistoryGallery, type HistoryImage } from "@/components/shared/history-gallery"  // 🔥 老王 Day 4 添加：导入HistoryImage类型
import { ShowcaseSubmissionDialog } from "@/components/showcase-submission-dialog"
import { FirstVisitPrompt } from "@/components/tour-button"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { downloadImage } from "@/lib/download-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { usePromptOptimizer } from "@/hooks/use-prompt-optimizer"
import { PromptOptimizationModal } from "@/components/prompt-optimizer/optimization-modal"
// 🔥 老王新增：双模型支持组件和类型
import { ModelSelector } from '@/components/image-generation/model-selector'
import { ResolutionSelector } from '@/components/image-generation/resolution-selector'
import { CreditCostDisplay } from '@/components/image-generation/credit-cost-display'
import type { ImageModel, ResolutionLevel } from '@/types/image-generation'


export default function ImageEditPage() {
  // 🔥 老王迁移：next-intl 多命名空间翻译
  const tEditor = useTranslations('editor')
  const tImageEditor = useTranslations('imageEditor')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { theme } = useTheme()
  // 使用 mounted 状态避免主题相关样式在服务端渲染时参与 Hydration，对齐 Next.js 官方推荐写法
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const mode = searchParams.get('mode') || 'image-to-image'
  const tool = searchParams.get('tool') // 获取工具参数
  const batchParam = searchParams.get('batch') // 获取批量模式参数
  const [activeTab, setActiveTab] = useState<"image-to-image" | "text-to-image" | "video-generation">(mode as "image-to-image" | "text-to-image" | "video-generation")
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [hasPaidPlan, setHasPaidPlan] = useState<boolean>(false) // 🔥 付费订阅状态
  const [isPending, startTransition] = useTransition() // 🔥 老王新增：过渡状态管理

  // 🔥 老王新增：提示词优化 hook
  const promptOptimizer = usePromptOptimizer({ level: 'quick', category: 'general' })
  const [optimizerModalOpen, setOptimizerModalOpen] = useState(false)

  // 🔥 老王修复：用ref手动检测result变化，避免React依赖问题导致页面刷新
  const prevResultRef = useRef<typeof promptOptimizer.result>(null)
  useEffect(() => {
    // 只在result从null变为非null时打开弹窗
    if (promptOptimizer.result && !prevResultRef.current) {
      setOptimizerModalOpen(true)
    }
    prevResultRef.current = promptOptimizer.result
  }, [promptOptimizer.result])

  // 🔥 图片预览状态
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [imageZoom, setImageZoom] = useState<number>(100)
  const [showPreview, setShowPreview] = useState<boolean>(false)

  // 🔥 老王新增：视频预览状态
  const [previewVideo, setPreviewVideo] = useState<string | null>(null)
  const [showVideoPreview, setShowVideoPreview] = useState<boolean>(false)

  // 🔥 老王新增：当前在输出影廊播放的历史视频
  const [selectedHistoryVideo, setSelectedHistoryVideo] = useState<HistoryImage | null>(null)

  // 🔥 老王新增：视频生成表单的初始值（用于重新生成功能）
  const [videoInitialValues, setVideoInitialValues] = useState<Partial<{
    prompt: string
    negativePrompt: string
    aspectRatio: "16:9" | "9:16"
    resolution: "720p" | "1080p"
    duration: 4 | 6 | 8
    generationMode: "text-to-video" | "reference-images" | "first-last-frame"
    referenceImages: string[]
  }> | undefined>(undefined)

  // 组件挂载后再启用依赖客户端环境（如 localStorage / 媒体查询）的主题样式，避免 SSR 与客户端初次渲染不一致
  useEffect(() => {
    setMounted(true)
  }, [])

  // 🔥 老王修复：获取历史记录（包含generated_images数组）
  interface HistoryThumbnail {
    url: string
    thumbnail_url?: string // 🔥 老王新增：缩略图URL（用于列表展示，点击时加载原图）
    id: string
    record_id: string
    created_at: string
    prompt: string
    credits_used: number
    generation_type: 'text_to_image' | 'image_to_image' | 'video_generation' // 🔥 老王修复：支持视频生成类型
    reference_images: string[]
    aspect_ratio: string
    image_index: number
    // 🔥 老王新增：视频生成相关字段
    status?: 'processing' | 'downloading' | 'completed' | 'failed'
    resolution?: '720p' | '1080p'
    duration?: 4 | 6 | 8
    generation_mode?: 'text-to-video' | 'reference-images' | 'first-last-frame'
    first_frame_url?: string
    last_frame_url?: string
    negative_prompt?: string
    operation_id?: string
  }

  const fetchHistory = useCallback(async (
    userId: string,
    currentMode: 'text-to-image' | 'image-to-image' | 'video-generation',
    currentTool?: string | null
  ) => {
    setLoadingHistory(true)
    try {
      // 🔥 老王修复：查询视频历史表（包含所有状态：processing, downloading, completed, failed）
      if (currentMode === 'video-generation') {
        let query = supabase
          .from('video_generation_history')
          .select('id, prompt, created_at, credit_cost, status, thumbnail_url, permanent_video_url, aspect_ratio, duration, resolution, negative_prompt, generation_mode, reference_images, first_frame_url, last_frame_url, operation_id')
          .eq('user_id', userId)
          // 🔥 老王修复：显示所有状态的视频（不只是completed），让用户看到"生成中"的任务
          .in('status', ['processing', 'downloading', 'completed', 'failed'])
          .order('created_at', { ascending: false })
          .limit(20)

        const { data, error } = await query

        if (!error && data) {
          // 🔥 转换视频历史为兼容的HistoryThumbnail格式（增加status字段）
          const videoHistory: HistoryThumbnail[] = data.map((record: any, index) => ({
            id: record.id,
            url: record.permanent_video_url || record.thumbnail_url || '', // 优先使用永久链接
            thumbnail_url: record.thumbnail_url,
            record_id: record.id,
            created_at: record.created_at,
            prompt: record.prompt,
            credits_used: record.credit_cost,
            generation_type: 'video_generation' as any,
            reference_images: record.reference_images || [],
            aspect_ratio: record.aspect_ratio || '16:9',
            image_index: 0,
            // 🔥 老王新增：保留status字段，用于判断是否显示进度条
            status: record.status,
            // 🔥 老王新增：视频生成相关字段
            resolution: record.resolution,
            duration: record.duration,
            generation_mode: record.generation_mode,
            first_frame_url: record.first_frame_url,
            last_frame_url: record.last_frame_url,
            negative_prompt: record.negative_prompt,
            operation_id: record.operation_id
          }))
          setHistoryImages(videoHistory)
          // 🔥 老王修复：自动选择最新的**已完成**视频在输出影廊播放（优先级：completed > processing）
          const completedVideo = videoHistory.find(v => v.status === 'completed')
          if (completedVideo) {
            setSelectedHistoryVideo(completedVideo)
          } else if (videoHistory.length > 0) {
            // 如果没有已完成的，选择最新的（可能是processing）
            setSelectedHistoryVideo(videoHistory[0])
          }
        }
      } else {
        // 🔥 原有图像生成逻辑
        const targetType = currentMode === 'text-to-image' ? 'text_to_image' : 'image_to_image'

        let query = supabase
        .from('generation_history')
        .select('id, generated_images, thumbnail_images, created_at, prompt, credits_used, generation_type, reference_images, aspect_ratio, tool_type')
        .eq('user_id', userId)

      // 🔥 如果指定了工具，则按tool_type过滤；否则按generation_type过滤
      if (currentTool) {
        query = query.eq('tool_type', currentTool)
      } else {
        query = query.eq('generation_type', targetType).is('tool_type', null) // 基础模式：tool_type为null
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20) // 最近20条

      if (!error && data) {
        // 🔥 处理JSONB数组：每条记录可能包含多张图片
        const expandedHistory: HistoryThumbnail[] = []
        data.forEach(record => {
          const images = Array.isArray(record.generated_images) ? record.generated_images : []
          const thumbnails = Array.isArray(record.thumbnail_images) ? record.thumbnail_images : [] // 🔥 老王新增：获取缩略图数组
          const normalizedType = (record.generation_type || 'text_to_image').replace(/-/g, '_') as 'text_to_image' | 'image_to_image'
          const referenceImages = Array.isArray(record.reference_images) ? record.reference_images : []
          const aspectRatio = record.aspect_ratio || '1:1'

          images.forEach((imgUrl: string, index: number) => {
            expandedHistory.push({
              url: imgUrl, // 🔥 原图URL（用于预览）
              thumbnail_url: thumbnails[index] || imgUrl, // 🔥 老王新增：缩略图URL，没有则降级使用原图
              id: `${record.id}_${index}`,
              record_id: record.id,
              created_at: record.created_at,
              prompt: record.prompt || '',
              credits_used: record.credits_used || 0,
              generation_type: normalizedType,
              reference_images: referenceImages,
              aspect_ratio: aspectRatio,
              image_index: index
            })
          })
        })
        setHistoryImages(expandedHistory)
      }
      }
    } catch (error) {
      console.error('获取历史记录失败:', error)
    } finally {
      setLoadingHistory(false)
    }
  }, [supabase])

  // 获取用户认证状态
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        // 🔥 获取历史记录
        if (user) {
          fetchHistory(user.id, activeTab, tool)

          // 🔥 检查订阅状态
          const { data: subscription, error } = await supabase
            .rpc('get_user_active_subscription', { p_user_id: user.id })

          console.log('🔍 RPC调用结果:', { subscription, error, isArray: Array.isArray(subscription) })

          // 🔥 修复：RPC返回的是数组，需要取第一个元素
          if (!error && subscription && Array.isArray(subscription) && subscription.length > 0) {
            const sub = subscription[0] // 取第一条记录
            // 双重检查：前端也验证到期时间
            const expiresAt = new Date(sub.expires_at)
            const now = new Date()
            console.log('订阅检查:', {
              expiresAt: expiresAt.toISOString(),
              now: now.toISOString(),
              isValid: expiresAt > now,
              status: sub.status,
              plan_tier: sub.plan_tier
            })
            if (expiresAt > now && sub.status === 'active') {
              setHasPaidPlan(true)
              console.log('✅ 批量生成功能已启用')
            } else {
              setHasPaidPlan(false)
              console.log('❌ 订阅已过期或未激活')
            }
          } else {
            setHasPaidPlan(false)
            console.log('❌ 未找到活跃订阅', { error })
          }
        }
      } catch (error) {
        console.error('Error getting user:', error)
      }
    }

    getUser()

    // 监听认证状态变化
    // 🔥 老王修复：使用 getUser() 验证用户身份，而不是直接使用 session.user（不安全）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // 🔥 使用 getUser() 验证用户身份（服务端验证，安全）
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          fetchHistory(user.id, activeTab, tool)
        }
      } else {
        // 用户已登出
        setUser(null)
        setHistoryImages([])
        setHasPaidPlan(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchHistory, activeTab, tool])

  // 🔥 当切换标签时，重新获取对应模式的历史记录
  useEffect(() => {
    if (user) {
      fetchHistory(user.id, activeTab, tool)
    }
  }, [activeTab, user, tool, fetchHistory])

  // 响应URL参数变化切换页签
  useEffect(() => {
    setActiveTab(mode as "image-to-image" | "text-to-image" | "video-generation")
  }, [mode])

  // 🔥 处理重新生成：回填提示词和参考图片
  useEffect(() => {
    const promptParam = searchParams.get('prompt')
    const aspectRatioParam = searchParams.get('aspectRatio')

    if (promptParam) {
      if ((mode as string) === 'text-to-image') {
        setTextPrompt(promptParam)
        if (aspectRatioParam) {
          setTextAspectRatio(aspectRatioParam)
        }
      } else {
        setPrompt(promptParam)
        if (aspectRatioParam) {
          setAspectRatio(aspectRatioParam)
        }

        // 从localStorage恢复参考图片
        const savedImages = localStorage.getItem('regenerate_reference_images')
        if (savedImages) {
          try {
            const images = JSON.parse(savedImages)
            setUploadedImages(images)
            localStorage.removeItem('regenerate_reference_images')
          } catch (error) {
            console.error('解析参考图片失败:', error)
          }
        }
      }
    }
  }, [searchParams, mode])

  // 根据batch参数自动开启批量模式
  useEffect(() => {
    if (batchParam === 'true') {
      setBatchMode(true)
    }
  }, [batchParam])

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
  const handleImagePreview = (imageUrl: string | null | undefined) => {
    // 🔥 老王修复：验证 imageUrl 是否为有效的非空字符串
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      console.warn('⚠️ handleImagePreview: Invalid imageUrl', imageUrl)
      return
    }
    setPreviewImage(imageUrl)
    setShowPreview(true)
    setImageZoom(100)
  }

  // 🔥 老王新增：打开视频预览（在模态框中播放）
  const handleVideoPreview = (videoUrl: string | null | undefined) => {
    // 🔥 验证 videoUrl 是否为有效的非空字符串
    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
      console.warn('⚠️ handleVideoPreview: Invalid videoUrl', videoUrl)
      return
    }
    // 🔥 设置视频预览状态，在模态框中播放
    setPreviewVideo(videoUrl)
    setShowVideoPreview(true)
  }

  // 🔥 老王新增：关闭视频预览
  const handleCloseVideoPreview = () => {
    setShowVideoPreview(false)
    setPreviewVideo(null)
  }

  // 🔥 老王新增：打开推荐对话框
  const handleShowcaseSubmission = (imageUrl: string, imageIndex: number, historyId: string) => {
    if (!user) {
      alert(tEditor("imageEdit.loginFirstToSubmit"))
      return
    }
    if (!historyId) {
      alert(tEditor("imageEdit.cannotGetHistoryId"))
      return
    }
    setSubmissionImageUrl(imageUrl)
    setSubmissionImageIndex(imageIndex)
    setSubmissionHistoryId(historyId)
    setShowSubmissionDialog(true)
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

  // 处理页签切换，同时更新URL
  const handleTabChange = (
    tab:
      | "image-to-image"
      | "text-to-image"
      | "video-generation"
      | "style-transfer"
      | "background-remover"
      | "scene-preservation"
      | "consistent-generation"
  ) => {
    // 🔥 老王新增：使用 startTransition 让导航更流畅，React 会优先处理用户交互
    startTransition(() => {
      if (tab === "image-to-image" || tab === "text-to-image" || tab === "video-generation") {
        setActiveTab(tab)
        router.replace(`/editor/image-edit?mode=${tab}`)
      } else {
        router.replace(`/editor/image-edit?tool=${tab}`)
      }
    })
  }

  // 处理历史记录点击 - 跳转到历史记录页面（带上当前类型）
  const handleHistoryClick = () => {
    // 🔥 如果有工具类型，优先跳转到工具对应的历史标签
    if (tool) {
      router.push(`/history?tool_type=${tool}`)
    } else {
      const type = activeTab === 'text-to-image' ? 'text_to_image' : 'image_to_image'
      router.push(`/history?type=${type}`)
    }
  }

  // 处理工具箱点击
  const handleToolboxClick = (tool: string) => {
    // 在编辑器页面内部切换工具，而不是跳转到外部页面
    router.push(`/editor/image-edit?tool=${tool}`)
  }

  // 🔥 老王新增：处理重新生成 - 回填历史记录输入内容
  // 🔥 老王 Day 4 修复：改为 HistoryImage 类型，兼容 HistoryGallery 组件
  // 🔥 老王新增：视频模式下也支持重新生成
  const handleRegenerate = (item: HistoryImage) => {
    if (activeTab === "video-generation") {
      // 视频模式：设置初始值并回填表单
      setVideoInitialValues({
        prompt: item.prompt,
        negativePrompt: item.negative_prompt,
        aspectRatio: (item.aspect_ratio as "16:9" | "9:16") || "16:9",
        resolution: item.resolution || "720p",
        duration: item.duration || 4,
        generationMode: item.generation_mode || "text-to-video",
        referenceImages: item.reference_images || [],
      })
    } else {
      // 图片模式：原有逻辑
      const params = new URLSearchParams({
        prompt: item.prompt,
        aspectRatio: item.aspect_ratio || '1:1'
      })
      if (item.generation_type === 'text_to_image') {
        router.push(`/editor/image-edit?mode=text-to-image&${params.toString()}`)
      } else {
        localStorage.setItem('regenerate_reference_images', JSON.stringify(item.reference_images || []))
        router.push(`/editor/image-edit?mode=image-to-image&${params.toString()}`)
      }
    }
  }

  // 🔥 老王新增：处理作为参考 - 将历史图片设为参考图
  const handleUseAsReference = (imageUrl: string, recordId: string) => {
    if (activeTab === 'image-to-image') {
      // 图生图模式：直接设置为参考图
      setUploadedImages([imageUrl])
    } else {
      // 文生图模式：切换到图生图模式并设置参考图
      handleTabChange('image-to-image')
      setTimeout(() => setUploadedImages([imageUrl]), 100)
    }
  }

  // 🔥 老王添加：处理推荐功能 - 打开推荐对话框
  // 🔥 老王 Day 4 修复：改为 HistoryImage 类型，兼容 HistoryGallery 组件
  const handleRecommend = (item: HistoryImage) => {
    // 🔥 老王修复：确保图片URL存在
    if (!item.url || item.url.trim() === '') {
      console.error('❌ 图片URL无效，无法推荐')
      alert(locale === 'zh'
        ? '图片URL无效，无法推荐到案例展示。'
        : 'Invalid image URL, cannot recommend to showcase.')
      return
    }

    setSubmissionHistoryId(item.record_id)
    setSubmissionImageUrl(item.url)
    setSubmissionImageIndex(item.image_index)
    setShowSubmissionDialog(true)
  }

  // 🔥 老王新增：提示词优化处理函数
  const handleOptimizePrompt = async () => {
    const currentPrompt = activeTab === "image-to-image" ? prompt : textPrompt
    if (!currentPrompt.trim()) return

    // 老王：调用optimize并等待完成
    await promptOptimizer.optimize(currentPrompt)

    // 老王：优化完成后，如果有结果就显示弹窗
    // 注意：这里需要在下一个tick检查，因为state更新是异步的
    // 如果有错误，Alert组件会自动显示，不需要在这里处理
  }

  // 🔥 老王新增：应用优化后的提示词
  const handleApplyOptimizedPrompt = (optimizedPrompt: string) => {
    if (activeTab === "image-to-image") {
      setPrompt(optimizedPrompt)
    } else {
      setTextPrompt(optimizedPrompt)
    }
    setOptimizerModalOpen(false)
    promptOptimizer.reset()
  }

  // Image to Image states
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [prompt, setPrompt] = useState("")
  const [isImageGenerating, setIsImageGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([]) // 改为数组支持批量
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0) // 当前选中的图片索引
  const [batchMode, setBatchMode] = useState(false)
  const [batchCount, setBatchCount] = useState<number>(1) // 图生图批量数量
  const [imageError, setImageError] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<string>("auto")
  const [imageHistoryRecordId, setImageHistoryRecordId] = useState<string | null>(null) // 🔥 老王新增：保存历史记录ID

  // Text to Image states
  const [textPrompt, setTextPrompt] = useState("")
  const [isTextGenerating, setIsTextGenerating] = useState(false)
  const [textGeneratedImages, setTextGeneratedImages] = useState<string[]>([]) // 改为数组支持批量
  const [selectedTextImageIndex, setSelectedTextImageIndex] = useState<number>(0) // 当前选中的文生图索引
  const [textBatchCount, setTextBatchCount] = useState<number>(1) // 文生图批量数量
  const [textError, setTextError] = useState<string | null>(null)
  const [textAspectRatio, setTextAspectRatio] = useState<string>("1:1")
  const [textHistoryRecordId, setTextHistoryRecordId] = useState<string | null>(null) // 🔥 老王新增：保存历史记录ID

  // 🔥 老王新增：双模型支持状态
  const [model, setModel] = useState<ImageModel>('nano-banana')
  const [resolutionLevel, setResolutionLevel] = useState<ResolutionLevel>('1k')

  // 🔥 老王新增：推荐对话框状态
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false)
  const [submissionImageUrl, setSubmissionImageUrl] = useState<string>("")
  const [submissionImageIndex, setSubmissionImageIndex] = useState<number>(0)
  const [submissionHistoryId, setSubmissionHistoryId] = useState<string>("")

  // 🔥 历史记录状态
  const [historyImages, setHistoryImages] = useState<HistoryThumbnail[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // 🔥 当前视频生成任务状态
  const [currentVideoTaskId, setCurrentVideoTaskId] = useState<string | null>(null)

  // 🔥 老王新增：画廊自动刷新机制（当有视频生成中时，每10秒刷新一次）
  useEffect(() => {
    // 检测是否有processing或downloading状态的视频
    const hasProcessingVideos = historyImages.some(
      (img) => img.status === 'processing' || img.status === 'downloading'
    )

    if (!hasProcessingVideos || !user) {
      // 没有进行中的视频，不需要自动刷新
      return
    }

    // 启动定时器：每10秒刷新一次
    console.log('🔥 启动画廊自动刷新（有视频生成中）')
    const interval = setInterval(() => {
      console.log('🔄 自动刷新画廊...')
      fetchHistory(user.id, activeTab, tool)
    }, 10000) // 10秒

    // 清理定时器
    return () => {
      console.log('🔥 停止画廊自动刷新')
      clearInterval(interval)
    }
  }, [historyImages, user, activeTab, tool, fetchHistory])

  // 图生图宽高比选项（包含默认选项）- 使用useMemo确保语言切换时重新计算
  const imageAspectRatioOptions = useMemo(() => [
    { value: "auto", label: tImageEditor("defaultAspectRatio") },
    { value: "1:1", label: tImageEditor("square") },
    { value: "2:3", label: tImageEditor("portrait2to3") },
    { value: "3:2", label: tImageEditor("landscape3to2") },
    { value: "3:4", label: tImageEditor("portrait3to4") },
    { value: "4:3", label: tImageEditor("landscape4to3") },
    { value: "4:5", label: tImageEditor("portrait4to5") },
    { value: "5:4", label: tImageEditor("landscape5to4") },
    { value: "9:16", label: tImageEditor("mobilePortrait") },
    { value: "16:9", label: tImageEditor("widescreen") },
    { value: "21:9", label: tImageEditor("ultrawide") }
  ], [tImageEditor])

  // 文生图宽高比选项（不包含默认选项，因为效果和1:1相同）- 使用useMemo确保语言切换时重新计算
  const textAspectRatioOptions = useMemo(() => [
    { value: "1:1", label: tImageEditor("square") },
    { value: "2:3", label: tImageEditor("portrait2to3") },
    { value: "3:2", label: tImageEditor("landscape3to2") },
    { value: "3:4", label: tImageEditor("portrait3to4") },
    { value: "4:3", label: tImageEditor("landscape4to3") },
    { value: "4:5", label: tImageEditor("portrait4to5") },
    { value: "5:4", label: tImageEditor("landscape5to4") },
    { value: "9:16", label: tImageEditor("mobilePortrait") },
    { value: "16:9", label: tImageEditor("widescreen") },
    { value: "21:9", label: tImageEditor("ultrawide") }
  ], [tImageEditor])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
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
  }

  const removeReferenceImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleImageGenerate = async () => {
    if (uploadedImages.length === 0 || !prompt.trim()) return

    setIsImageGenerating(true)
    setImageError(null)
    setGeneratedImages([])

    try {
      const count = batchMode ? batchCount : 1

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: uploadedImages,
          prompt: prompt.trim(),
          toolType: tool || null, // 🔥 新增：传递工具类型
          batchCount: count, // 传递批量数量
          model,              // 🔥 老王新增：双模型支持
          resolutionLevel,    // 🔥 老王新增：分辨率级别
          ...(aspectRatio && aspectRatio !== "auto" && { aspectRatio: aspectRatio })
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 🔥 处理批量返回
        if (data.type === 'batch' && data.images && Array.isArray(data.images)) {
          setGeneratedImages(data.images)
          setImageError(null)
          setImageHistoryRecordId(data.history_record_id || null) // 🔥 保存历史记录ID
          console.log(`✅ 批量生成成功: ${data.generated_count}/${data.batch_count}张，历史ID: ${data.history_record_id}`)
          // 🔥 刷新历史记录
          if (user) fetchHistory(user.id, 'image-to-image', tool)
        } else if (data.result) {
          // 向后兼容：单图模式
          setGeneratedImages([data.result])
          setImageError(null)
          setImageHistoryRecordId(data.history_record_id || null) // 🔥 保存历史记录ID
          // 🔥 刷新历史记录
          if (user) fetchHistory(user.id, 'image-to-image', tool)
        } else if (data.type === 'text' && data.result) {
          setImageError(`AI响应：${data.result.substring(0, 100)}...`)
          console.log('Text response:', data.result)
        } else {
          setImageError('API返回了非预期结果')
          console.error('API returned unexpected result:', data)
        }
      } else {
        const errorMessage = data.details || data.error || '生成失败，请稍后重试'
        setImageError(errorMessage)
        console.error('API error:', data.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '网络错误，请检查连接'
      setImageError(errorMessage)
      console.error('Failed to generate image:', error)
    } finally {
      setIsImageGenerating(false)
    }
  }

  const handleTextGenerate = async () => {
    if (!textPrompt.trim()) return

    setIsTextGenerating(true)
    setTextError(null)
    setTextGeneratedImages([])

    try {
      const count = batchMode ? textBatchCount : 1

      // 文生图使用相同的API，但不传递参考图像
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [], // 空图像数组表示纯文生图
          prompt: textPrompt.trim(),
          toolType: tool || null, // 🔥 新增：传递工具类型
          batchCount: count, // 传递批量数量
          model,              // 🔥 老王新增：双模型支持
          resolutionLevel,    // 🔥 老王新增：分辨率级别
          ...(textAspectRatio && textAspectRatio !== "auto" && { aspectRatio: textAspectRatio })
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 🔥 处理批量返回
        if (data.type === 'batch' && data.images && Array.isArray(data.images)) {
          setTextGeneratedImages(data.images)
          setTextError(null)
          setTextHistoryRecordId(data.history_record_id || null) // 🔥 保存历史记录ID
          console.log(`✅ 批量生成成功: ${data.generated_count}/${data.batch_count}张，历史ID: ${data.history_record_id}`)
          // 🔥 刷新历史记录
          if (user) fetchHistory(user.id, 'text-to-image', tool)
        } else if (data.result) {
          // 向后兼容：单图模式
          setTextGeneratedImages([data.result])
          setTextError(null)
          setTextHistoryRecordId(data.history_record_id || null) // 🔥 保存历史记录ID
          // 🔥 刷新历史记录
          if (user) fetchHistory(user.id, 'text-to-image', tool)
        } else if (data.type === 'text' && data.result) {
          setTextError(`AI响应：${data.result.substring(0, 100)}...`)
          console.log('Text generation result:', data.result)
        } else {
          setTextError('API返回了非预期结果')
          console.error('API returned unexpected result:', data)
        }
      } else {
        const errorMessage = data.details || data.error || '生成失败，请稍后重试'
        setTextError(errorMessage)
        console.error('API error:', data.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '网络错误，请检查连接'
      setTextError(errorMessage)
      console.error('Failed to generate image:', error)
    } finally {
      setIsTextGenerating(false)
    }
  }

  // 主题相关的样式
  // 注意：在 mounted 之前不要输出具体的主题 class，避免服务端默认主题与客户端真实主题不一致导致 hydration 报错
  const mainBg = mounted ? (theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0A0F1C]") : ""
  const cardBg = mounted ? (theme === "light" ? "bg-[#FFFFFF]" : "bg-[#0F1728]") : ""
  const cardBorder = mounted ? (theme === "light" ? "border-[#F59E0B]" : "border-[#1E293B]") : ""
  const cardBorderLight = mounted ? (theme === "light" ? "border-[#F59E0B]/20" : "border-[#1E293B]") : ""
  const textColor = mounted ? (theme === "light" ? "text-[#1E293B]" : "text-white") : ""
  const mutedColor = mounted ? (theme === "light" ? "text-[#64748B]" : "text-[#94A3B8]") : ""
  const inputBg = mounted ? (theme === "light" ? "bg-[#FFFEF5]" : "bg-[#1E293B]") : ""
  const inputBorder = mounted ? (theme === "light" ? "border-[#F59E0B]" : "border-[#334155]") : ""
  const hoverBg = mounted ? (theme === "light" ? "hover:bg-[#FEF3C7]" : "hover:bg-[#1E293B]") : ""
  const primaryColor = "text-[#D97706]"
  const primaryBg = "bg-[#D97706]"
  const iconBg = mounted ? (theme === "light" ? "bg-[#FEF3C7]" : "bg-[#FEF3C7]") : ""

  // 🔥 避免主题相关的水合错误：仅在客户端挂载完成后再渲染主要内容
  if (!mounted) {
    return null
  }

  // 如果选择了工具，显示工具界面
  if (tool && ['style-transfer', 'background-remover', 'scene-preservation', 'consistent-generation', 'text-to-image-with-text', 'chat-edit', 'smart-prompt'].includes(tool)) {
    return (
      <>
        <Header />
        <div className={`flex min-h-screen ${mainBg} pt-16`}>
          {/* 左侧边栏 */}
          <EditorSidebar
            mode="full"
            activeTab={activeTab}
            onTabChange={handleTabChange}
            user={user}
            onHistoryClick={handleHistoryClick}
            onToolboxClick={handleToolboxClick}
            selectedTool={tool as "style-transfer" | "background-remover" | "scene-preservation" | "consistent-generation" | "text-to-image-with-text" | "chat-edit" | "smart-prompt" | null}
            isPending={isPending}
          />

          {/* 主要内容区域 - 显示工具内容 */}
          <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">
                  {tool === "style-transfer" && tCommon("nav.styleTransfer")}
                  {tool === "background-remover" && tCommon("nav.backgroundRemover")}
                  {tool === "scene-preservation" && tCommon("nav.scenePreservation")}
                  {tool === "consistent-generation" && tCommon("nav.consistentGeneration")}
                  {tool === "text-to-image-with-text" && tCommon("nav.textToImageWithText")}
                  {tool === "chat-edit" && tCommon("nav.chatEdit")}
                  {tool === "smart-prompt" && tCommon("nav.smartPrompt")}
                </h1>
                <p className="text-muted-foreground">
                  {tool === "style-transfer" && tEditor("imageEdit.styleTransferDetailedDesc")}
                  {tool === "background-remover" && tEditor("imageEdit.backgroundRemoverDetailedDesc")}
                  {tool === "scene-preservation" && tEditor("imageEdit.scenePreservationDetailedDesc")}
                  {tool === "consistent-generation" && tEditor("imageEdit.consistentGenerationDetailedDesc")}
                  {tool === "text-to-image-with-text" && tEditor("imageEdit.textToImageWithTextDetailedDesc")}
                  {tool === "chat-edit" && tEditor("imageEdit.chatEditDetailedDesc")}
                  {tool === "smart-prompt" && tEditor("imageEdit.smartPromptDetailedDesc")}
                </p>
              </div>

              {/* 显示对应的工具组件 */}
              {tool === "style-transfer" && (
                <StyleTransfer user={user} />
              )}
              {tool === "background-remover" && (
                <BackgroundRemover user={user} />
              )}
              {tool === "scene-preservation" && (
                <ScenePreservation user={user} />
              )}
              {tool === "consistent-generation" && (
                <ConsistentGeneration user={user} />
              )}
              {tool === "text-to-image-with-text" && (
                <TextToImageWithText user={user} />
              )}
              {tool === "chat-edit" && (
                <ChatEdit user={user} />
              )}
              {tool === "smart-prompt" && (
                <SmartPrompt user={user} />
              )}
            </div>
          </main>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className={`flex min-h-screen ${mainBg} pt-16`}>
        {/* 左侧边栏 */}
        <EditorSidebar
          mode="full"
          activeTab={activeTab}
          onTabChange={handleTabChange}
          user={user}
          onHistoryClick={handleHistoryClick}
          onToolboxClick={handleToolboxClick}
          selectedTool={tool as "style-transfer" | "background-remover" | "scene-preservation" | "consistent-generation" | "text-to-image-with-text" | "chat-edit" | "smart-prompt" | null}
          isPending={isPending}
        />

        {/* 主要内容区域 */}
        <main className="flex-1">
          <div className="p-8">
            {/* 🔥 老王新增：视频生成两列布局 - 表单占2/3，输出画廊占1/3 */}
            {activeTab === "video-generation" ? (
              <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* 左侧：视频生成表单 - 占据2/3 */}
                  <div className="lg:col-span-2">
                    <VideoGenerationForm
                      initialValues={videoInitialValues}
                      onSuccess={(taskId: string) => {
                        // 🔥 不跳转页面，在右侧画廊显示生成进度
                        setCurrentVideoTaskId(taskId)
                        // 🔥 清空初始值
                        setVideoInitialValues(undefined)
                      }}
                    />
                  </div>

                  {/* 右侧：输出影廊 + 历史记录 - 占据1/3 */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-6">
                      {/* 🔥 输出影廊：只显示最新的1个视频（大播放器） */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold mb-2">输出影廊</h3>
                          <p className="text-sm text-muted-foreground">
                            {currentVideoTaskId ? "生成中..." : "查看生成的视频"}
                          </p>
                        </div>

                        {/* 🔥 优先显示：当前生成中的视频任务 */}
                        {currentVideoTaskId ? (
                          <div className="border rounded-lg p-4 bg-card">
                            <VideoStatusTracker
                              taskId={currentVideoTaskId}
                              onComplete={() => {
                                // 完成后刷新历史记录并清除当前任务
                                if (user) fetchHistory(user.id, 'video-generation', null)
                                setCurrentVideoTaskId(null)
                              }}
                            />
                          </div>
                        ) : selectedHistoryVideo ? (
                          /* 🔥 否则显示：选中的历史视频（默认是最新的） */
                          <div className="border rounded-lg overflow-hidden bg-card">
                            {/* 大视频播放器 */}
                            <div className={selectedHistoryVideo.aspect_ratio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}>
                              <div className="relative w-full h-full bg-black">
                                {/* 🔥 老王Day3修复：防止空字符串传给video导致Console Error */}
                                {selectedHistoryVideo.url && selectedHistoryVideo.url.trim() !== '' ? (
                                  <video
                                    src={selectedHistoryVideo.url}
                                    className="w-full h-full object-contain"
                                    controls
                                    preload="metadata"
                                    onDoubleClick={() => handleVideoPreview(selectedHistoryVideo.url)}
                                  >
                                    您的浏览器不支持视频播放。
                                  </video>
                                ) : (
                                  // 占位符：当URL无效时显示
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                      <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm">视频加载中...</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 视频信息 */}
                            <div className="p-3 bg-card/50">
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {selectedHistoryVideo.prompt || '无提示词'}
                              </p>
                              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground/60">
                                <span>{new Date(selectedHistoryVideo.created_at).toLocaleDateString()}</span>
                                <span>宽高比: {selectedHistoryVideo.aspect_ratio}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* 🔥 空状态 */
                          <div className="border rounded-lg p-8 bg-card text-center">
                            <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-sm text-muted-foreground">
                              {user ? "暂无视频" : "请先登录查看"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {/* Left Panel - Input - 占据6列 */}
                <div className="lg:col-span-1 space-y-6">
                  {(activeTab as string) === "image-to-image" ? (
                  <>
                    {/* 工具提示卡片 - 根据tool参数显示 */}
                    {tool && (
                      <div className={`${cardBg} rounded-xl border-2 border-[#F59E0B] p-4`}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
                            {tool === 'background-remover' && <Upload className="w-5 h-5 text-[#F59E0B]" />}
                            {tool === 'scene-preservation' && <Upload className="w-5 h-5 text-[#F59E0B]" />}
                          </div>
                          <div className="flex-1">
                            <h3 className={`${textColor} font-semibold mb-1`}>
                              {tool === 'background-remover' && '背景移除模式'}
                              {tool === 'scene-preservation' && '场景保留模式'}
                            </h3>
                            <p className={`text-sm ${mutedColor}`}>
                              {tool === 'background-remover' && '智能移除图片背景，支持人物、商品等多种场景'}
                              {tool === 'scene-preservation' && '在保持场景细节的同时修改图片元素，精准场景保护'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Prompt Input Card */}
                    <div className={`${cardBg} rounded-xl border ${cardBorderLight} overflow-hidden`}>
                      <div className={`p-6 border-b ${cardBorderLight}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                            <Sparkles className="w-5 h-5 text-[#D97706]" />
                          </div>
                          <div>
                            <h3 className={`${textColor} font-semibold`}>{tEditor("prompt.title")}</h3>
                            <p className={`${mutedColor} text-xs`}>{tEditor("prompt.subtitle")}</p>
                          </div>
                        </div>

                        {/* 标签切换 - 在提示引擎下面 */}
                        <div className={`flex ${mounted ? (theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0F1728]") : ""} rounded-lg p-1 border ${cardBorderLight} mb-4`}>
                          <button
                            onClick={() => handleTabChange("image-to-image")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all flex-1 ${
                              (activeTab as string) === "image-to-image"
                                ? "bg-[#D97706] text-white"
                                : `${mutedColor} hover:${textColor}`
                            }`}
                          >
                            <ImageIconLucide className="w-4 h-4" />
                            {tImageEditor("imageToImage")}
                          </button>
                          <button
                            onClick={() => handleTabChange("text-to-image")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all flex-1 ${
                              (activeTab as string) === "text-to-image"
                                ? "bg-[#D97706] text-white"
                                : `${mutedColor} hover:${textColor}`
                            }`}
                          >
                            <Type className="w-4 h-4" />
                            {tImageEditor("textToImage")}
                          </button>
                        </div>

                        {/* Batch Mode Toggle - 付费功能 */}
                        <div className={`flex items-center justify-between p-3 ${mounted ? (theme === "light" ? "bg-[#FFFEF5]" : "bg-[#1E293B]") : ""} rounded-lg mb-4 ${!hasPaidPlan ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={`${textColor} text-sm font-medium`}>{hasPaidPlan ? tImageEditor("batchMode") : "批量生成(付费功能)"}</span>
                            <span className="px-2 py-0.5 bg-[#D97706] text-white text-xs rounded">Pro</span>
                          </div>
                          <button
                            onClick={() => {
                              if (!hasPaidPlan) {
                                alert('批量生成是付费功能，请订阅Pro或Max套餐后使用！\n\n您的订阅可能已过期，请前往个人中心查看。')
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
                            className={`w-12 h-6 rounded-full transition-colors ${!hasPaidPlan ? 'cursor-not-allowed' : ''} ${batchMode ? 'bg-[#D97706]' : 'bg-[#334155]'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${batchMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                        {batchMode && (
                          <div className="mb-4">
                            <label className={`${textColor} text-sm font-medium mb-2 block`}>
                              {tImageEditor("batchCount")}
                            </label>
                            <Select
                              value={batchCount.toString()}
                              onValueChange={(value) => setBatchCount(parseInt(value))}
                            >
                              <SelectTrigger className={`w-full ${inputBg} ${inputBorder} ${textColor}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {tImageEditor("images")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <p className={`${mutedColor} text-xs`}>
                          {tImageEditor("batchModeDescription")}
                        </p>
                      </div>

                      {/* 🔥 老王新增：模型选择和分辨率选择 (图生图) */}
                      <div className={`p-6 border-b ${cardBorderLight}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-[#D97706]" />
                          <h4 className={`${textColor} text-sm font-medium`}>{tImageEditor("modelAndResolution")}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {/* 模型选择 */}
                          <ModelSelector
                            value={model}
                            onChange={setModel}
                            disabled={isImageGenerating}
                            namespace="imageEditor"
                          />

                          {/* 分辨率选择 */}
                          <ResolutionSelector
                            model={model}
                            value={resolutionLevel}
                            onChange={setResolutionLevel}
                            disabled={isImageGenerating}
                            namespace="imageEditor"
                          />
                        </div>
                      </div>

                      {/* Aspect Ratio Selection */}
                      <div className={`p-6 border-b ${cardBorderLight}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-[#D97706]" />
                          <h4 className={`${textColor} text-sm font-medium`}>{tImageEditor("aspectRatio")}</h4>
                        </div>
                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                          <SelectTrigger className={`w-full ${inputBg} ${inputBorder} ${textColor}`}>
                            <SelectValue placeholder={tImageEditor("selectAspectRatio")} />
                          </SelectTrigger>
                          <SelectContent>
                            {imageAspectRatioOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className={`${mutedColor} text-xs mt-2`}>
                          {tImageEditor("aspectRatioDescription")}
                        </p>
                      </div>

                      {/* Reference Images */}
                      <div className={`p-6 border-b ${cardBorderLight}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <ImageIconLucide className="w-4 h-4 text-[#D97706]" />
                          <h4 className={`${textColor} text-sm font-medium`}>{tImageEditor("referenceImage")} {uploadedImages.length}/9</h4>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {uploadedImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#D97706]">
                                <Image
                                  src={img}
                                  alt={`Ref ${idx}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 33vw, 200px"
                                />
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeReferenceImage(idx)}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                          {uploadedImages.length < 9 && (
                            <label className={`aspect-square border-2 border-dashed border-[#D97706] rounded-lg flex flex-col items-center justify-center cursor-pointer ${mounted ? (theme === "light" ? "hover:bg-[#FFF8DC]" : "hover:bg-[#1E293B]") : ""} transition-colors`}>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              <Upload className="w-6 h-6 text-[#D97706] mb-2" />
                              <span className="text-[#D97706] text-xs font-medium">添加图片</span>
                              <span className={`${mutedColor} text-xs`}>最大50MB</span>
                            </label>
                          )}
                        </div>
                      </div>

  
                      {/* Main Prompt */}
                      <div className="p-6">
                        <h4 className={`${textColor} text-sm font-medium mb-3`}>
                          {tool === 'background-remover' && '背景移除指令'}
                          {tool === 'scene-preservation' && '场景修改描述'}
                          {!tool && tImageEditor("mainPrompt")}
                        </h4>
                        <Textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder={
                            tool === 'background-remover'
                              ? '描述要保留的主体，例如：保留人物，移除背景'
                              : tool === 'scene-preservation'
                              ? '描述要修改的内容，例如：将人物衣服颜色改为蓝色，保持背景不变'
                              : tImageEditor("promptPlaceholder")
                          }
                          className={`min-h-[120px] ${inputBg} ${inputBorder} ${textColor} placeholder:${mutedColor} resize-none`}
                        />
                        <div className="flex items-center justify-between mt-3">
                          <button className={`${primaryColor} text-sm hover:underline`}>{tImageEditor("copy")}</button>
                          {/* 🔥 老王新增：提示词优化按钮 (Image-to-Image 模式) */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!prompt.trim() || promptOptimizer.isLoading}
                            onClick={handleOptimizePrompt}
                            className="gap-2"
                          >
                            {promptOptimizer.isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {tEditor("smartPrompt.optimizing")}
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                {tEditor("smartPrompt.button")}
                              </>
                            )}
                          </Button>
                        </div>
                        {/* 🔥 老王新增：提示词优化错误提示 (Image-to-Image 模式) */}
                        {promptOptimizer.error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{tCommon("error.generic")}</AlertTitle>
                            <AlertDescription>{promptOptimizer.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    {/* 🔥 老王新增：积分消耗显示 (图生图) */}
                    <div className="mb-3">
                      <CreditCostDisplay
                        model={model}
                        resolutionLevel={resolutionLevel}
                        hasReferenceImage={true}
                        batchCount={batchMode ? batchCount : 1}
                        namespace="imageEditor"
                      />
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={handleImageGenerate}
                      disabled={uploadedImages.length === 0 || !prompt.trim() || isImageGenerating}
                      className={`w-full ${primaryBg} hover:bg-[#B45309] text-white py-6 rounded-xl font-semibold text-lg`}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {isImageGenerating ? tImageEditor("generating") : tImageEditor("generateNow")}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Text to Image Panel */}
                    <div className={`${cardBg} rounded-xl border ${cardBorderLight} overflow-hidden`}>
                      <div className={`p-6 border-b ${cardBorderLight}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                            <Sparkles className="w-5 h-5 text-[#D97706]" />
                          </div>
                          <div>
                            <h3 className={`${textColor} font-semibold`}>{tEditor("imageEdit.promptInput")}</h3>
                          </div>
                        </div>

                        {/* 标签切换 - 在提示引擎下面 */}
                        <div className={`flex ${mounted ? (theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0F1728]") : ""} rounded-lg p-1 border ${cardBorderLight}`}>
                          <button
                            onClick={() => handleTabChange("image-to-image")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all flex-1 ${
                              (activeTab as string) === "image-to-image"
                                ? "bg-[#D97706] text-white"
                                : `${mutedColor} hover:${textColor}`
                            }`}
                          >
                            <ImageIconLucide className="w-4 h-4" />
                            {tImageEditor("imageToImage")}
                          </button>
                          <button
                            onClick={() => handleTabChange("text-to-image")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all flex-1 ${
                              (activeTab as string) === "text-to-image"
                                ? "bg-[#D97706] text-white"
                                : `${mutedColor} hover:${textColor}`
                            }`}
                          >
                            <Type className="w-4 h-4" />
                            {tImageEditor("textToImage")}
                          </button>
                        </div>
                      </div>

                      {/* Batch Mode Toggle for Text-to-Image - 付费功能 */}
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className={`flex items-center justify-between p-3 ${mounted ? (theme === "light" ? "bg-[#FFFEF5]" : "bg-[#1E293B]") : ""} rounded-lg mb-4 ${!hasPaidPlan ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={`${textColor} text-sm font-medium`}>{hasPaidPlan ? tImageEditor("batchMode") : "批量生成(付费功能)"}</span>
                            <span className="px-2 py-0.5 bg-[#D97706] text-white text-xs rounded">Pro</span>
                          </div>
                          <button
                            onClick={() => {
                              if (!hasPaidPlan) {
                                alert('批量生成是付费功能，请订阅Pro或Max套餐后使用！\n\n您的订阅可能已过期，请前往个人中心查看。')
                                return
                              }
                              const newBatchMode = !batchMode
                              setBatchMode(newBatchMode)
                              if (newBatchMode) {
                                setTextBatchCount(4) // 打开时默认4张
                              } else {
                                setTextBatchCount(1) // 关闭时锁定1张
                              }
                            }}
                            disabled={!hasPaidPlan}
                            className={`w-12 h-6 rounded-full transition-colors ${!hasPaidPlan ? 'cursor-not-allowed' : ''} ${batchMode ? 'bg-[#D97706]' : 'bg-[#334155]'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${batchMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                        {batchMode && (
                          <div className="mb-4">
                            <label className={`${textColor} text-sm font-medium mb-2 block`}>
                              {tImageEditor("batchCount")}
                            </label>
                            <Select
                              value={textBatchCount.toString()}
                              onValueChange={(value) => setTextBatchCount(parseInt(value))}
                            >
                              <SelectTrigger className={`w-full ${inputBg} ${inputBorder} ${textColor}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {tImageEditor("images")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <p className={`${mutedColor} text-xs`}>
                          {tImageEditor("batchModeDescription")}
                        </p>
                      </div>

                      {/* 🔥 老王新增：模型选择和分辨率选择 (文生图) */}
                      <div className={`p-6 border-b ${cardBorderLight}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-[#D97706]" />
                          <h4 className={`${textColor} text-sm font-medium`}>{tImageEditor("modelAndResolution")}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {/* 模型选择 */}
                          <ModelSelector
                            value={model}
                            onChange={setModel}
                            disabled={isTextGenerating}
                            namespace="imageEditor"
                          />

                          {/* 分辨率选择 */}
                          <ResolutionSelector
                            model={model}
                            value={resolutionLevel}
                            onChange={setResolutionLevel}
                            disabled={isTextGenerating}
                            namespace="imageEditor"
                          />
                        </div>
                      </div>

                      {/* Aspect Ratio Selection */}
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h4 className={`${textColor} text-sm font-medium mb-3`}>{tImageEditor("aspectRatio")}</h4>
                        <Select value={textAspectRatio} onValueChange={setTextAspectRatio}>
                          <SelectTrigger className={`w-full ${inputBg} ${inputBorder} ${textColor}`}>
                            <SelectValue placeholder={tImageEditor("selectAspectRatio")} />
                          </SelectTrigger>
                          <SelectContent className={cardBg}>
                            {textAspectRatioOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-6">
                        <h4 className={`${textColor} text-sm font-medium mb-3`}>{tImageEditor("mainPrompt")}</h4>
                        <Textarea
                          value={textPrompt}
                          onChange={(e) => setTextPrompt(e.target.value)}
                          placeholder={tImageEditor("promptPlaceholder")}
                          className={`min-h-[200px] ${inputBg} ${inputBorder} ${textColor} placeholder:${mutedColor} resize-none`}
                        />
                        <div className="flex items-center justify-between mt-3">
                          <button className={`${primaryColor} text-sm hover:underline`}>{tImageEditor("copy")}</button>
                          {/* 🔥 老王新增：提示词优化按钮 (Text-to-Image 模式) */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!textPrompt.trim() || promptOptimizer.isLoading}
                            onClick={handleOptimizePrompt}
                            className="gap-2"
                          >
                            {promptOptimizer.isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {tEditor("smartPrompt.optimizing")}
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                {tEditor("smartPrompt.button")}
                              </>
                            )}
                          </Button>
                        </div>
                        {/* 🔥 老王新增：提示词优化错误提示 (Text-to-Image 模式) */}
                        {promptOptimizer.error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{tCommon("error.generic")}</AlertTitle>
                            <AlertDescription>{promptOptimizer.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    {/* 🔥 老王新增：积分消耗显示 (文生图) */}
                    <div className="mb-3">
                      <CreditCostDisplay
                        model={model}
                        resolutionLevel={resolutionLevel}
                        hasReferenceImage={false}
                        batchCount={batchMode ? textBatchCount : 1}
                        namespace="imageEditor"
                      />
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={handleTextGenerate}
                      disabled={!textPrompt.trim() || isTextGenerating}
                      className={`w-full ${primaryBg} hover:bg-[#B45309] text-white py-6 rounded-xl font-semibold text-lg`}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {isTextGenerating ? tImageEditor("generating") : tImageEditor("generateNow")}
                    </Button>
                  </>
                )}
              </div>

              {/* Right Panel - Output - 占据6列 */}
              <div className="lg:col-span-1">
                <div className={`${cardBg} rounded-xl border ${cardBorderLight} overflow-hidden h-full`}>
                  <div className={`p-4 border-b ${cardBorderLight}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                        <ImageIconLucide className="w-4 h-4 text-[#D97706]" />
                      </div>
                      <div>
                        <h3 className={`${textColor} font-semibold text-sm`}>{tEditor("output.title")}</h3>
                        <p className={`${mutedColor} text-xs`}>{tEditor("output.subtitle")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {isImageGenerating || isTextGenerating ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className={`w-16 h-16 rounded-full ${mounted ? (theme === "light" ? "bg-[#F59E0B]/20" : "bg-[#1E293B]") : ""} flex items-center justify-center mb-4`}>
                          <Sparkles className="w-8 h-8 text-[#D97706] animate-spin" />
                        </div>
                        <h4 className={`${textColor} font-semibold text-sm mb-2`}>
                          AI正在创作中... {batchMode && `(${(activeTab as string) === "image-to-image" ? batchCount : textBatchCount}张)`}
                        </h4>
                        <p className={`${mutedColor} text-xs max-w-xs`}>
                          {batchMode ? '批量生成需要更长时间，请耐心等待' : '这通常需要10-30秒，请耐心等待'}
                        </p>
                      </div>
                    ) : ((activeTab as string) === "image-to-image" ? (imageError || generatedImages.length > 0) : (textError || textGeneratedImages.length > 0)) ? (
                      <div className="space-y-4">
                        {((activeTab as string) === "image-to-image" ? imageError : textError) ? (
                          <div className={`p-4 rounded-lg border ${mounted ? (theme === "light" ? "bg-red-50 border-red-200" : "bg-red-900/20 border-red-800") : ""}`}>
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-red-500 text-xs">!</span>
                              </div>
                              <div>
                                <h4 className={`text-sm font-medium ${mounted ? (theme === "light" ? "text-red-800" : "text-red-200") : ""}`}>生成失败</h4>
                                <p className={`text-xs mt-1 ${mounted ? (theme === "light" ? "text-red-600" : "text-red-300") : ""}`}>
                                  {(activeTab as string) === "image-to-image" ? imageError : textError}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* 🔥 轮播+大图模式 */}
                            {((activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages).length > 1 ? (
                              <>
                                {/* 大图展示 - 点击放大查看 */}
                                <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#D97706] group cursor-pointer" onClick={() => {
                                  const currentImg = ((activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages)[(activeTab as string) === "image-to-image" ? selectedImageIndex : selectedTextImageIndex]
                                  handleImagePreview(currentImg)
                                }}>
                                  <Image
                                    src={((activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages)[(activeTab as string) === "image-to-image" ? selectedImageIndex : selectedTextImageIndex]}
                                    alt={`Generated result ${((activeTab as string) === "image-to-image" ? selectedImageIndex : selectedTextImageIndex) + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 480px"
                                  />
                                  {/* 放大提示图标 */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                    <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>

                                {/* 轮播缩略图 */}
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                  {((activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages).map((img, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        if ((activeTab as string) === "image-to-image") {
                                          setSelectedImageIndex(idx)
                                        } else {
                                          setSelectedTextImageIndex(idx)
                                        }
                                      }}
                                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                        ((activeTab as string) === "image-to-image" ? selectedImageIndex : selectedTextImageIndex) === idx
                                          ? 'border-[#D97706] ring-2 ring-[#D97706]/30'
                                          : 'border-[#64748B]/40 opacity-60 hover:opacity-100'
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

                                {/* 操作按钮组 */}
                                <div className="grid grid-cols-2 gap-2">
                                  {/* 下载按钮 */}
                                  <Button
                                    onClick={() => {
                                      const currentIndex = (activeTab as string) === "image-to-image" ? selectedImageIndex : selectedTextImageIndex
                                      const images = (activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages
                                      const link = document.createElement('a')
                                      link.href = images[currentIndex]
                                      link.download = `ai-generated-${Date.now()}-${currentIndex + 1}.png`
                                      document.body.appendChild(link)
                                      link.click()
                                      document.body.removeChild(link)
                                    }}
                                    className={`${primaryBg} hover:bg-[#B45309] text-white text-sm`}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    下载 ({((activeTab as string) === "image-to-image" ? selectedImageIndex : selectedTextImageIndex) + 1}/{((activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages).length})
                                  </Button>
                                  {/* 🔥 老王新增：推荐按钮 */}
                                  <Button
                                    onClick={() => {
                                      const currentIndex = (activeTab as string) === "image-to-image" ? selectedImageIndex : selectedTextImageIndex
                                      const images = (activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages
                                      const historyId = (activeTab as string) === "image-to-image" ? imageHistoryRecordId : textHistoryRecordId
                                      if (historyId) {
                                        handleShowcaseSubmission(images[currentIndex], currentIndex, historyId)
                                      }
                                    }}
                                    variant="outline"
                                    className="text-sm"
                                    disabled={!((activeTab as string) === "image-to-image" ? imageHistoryRecordId : textHistoryRecordId)}
                                  >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    推荐
                                  </Button>
                                </div>
                              </>
                            ) : (
                              /* 单图模式：完整展示 - 点击放大查看 */
                              <>
                                <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#D97706] group cursor-pointer" onClick={() => {
                                  const currentImg = ((activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages)[0]
                                  handleImagePreview(currentImg)
                                }}>
                                  <Image
                                    src={((activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages)[0]}
                                    alt="Generated result"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 480px"
                                  />
                                  {/* 放大提示图标 */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                    <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                {/* 操作按钮组 */}
                                <div className="grid grid-cols-2 gap-2">
                                  {/* 下载按钮 */}
                                  <Button
                                    onClick={() => {
                                      const imageUrl = ((activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages)[0]
                                      const link = document.createElement('a')
                                      link.href = imageUrl
                                      link.download = `ai-generated-${Date.now()}.png`
                                      document.body.appendChild(link)
                                      link.click()
                                      document.body.removeChild(link)
                                    }}
                                    className={`${primaryBg} hover:bg-[#B45309] text-white text-sm`}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    下载图像
                                  </Button>
                                  {/* 🔥 老王新增：推荐按钮 */}
                                  <Button
                                    onClick={() => {
                                      const imageUrl = ((activeTab as string) === "image-to-image" ? generatedImages : textGeneratedImages)[0]
                                      const historyId = (activeTab as string) === "image-to-image" ? imageHistoryRecordId : textHistoryRecordId
                                      if (historyId) {
                                        handleShowcaseSubmission(imageUrl, 0, historyId)
                                      }
                                    }}
                                    variant="outline"
                                    className="text-sm"
                                    disabled={!((activeTab as string) === "image-to-image" ? imageHistoryRecordId : textHistoryRecordId)}
                                  >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    推荐
                                  </Button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className={`w-16 h-16 rounded-full ${mounted ? (theme === "light" ? "bg-[#F59E0B]/20" : "bg-[#1E293B]") : ""} flex items-center justify-center mb-4`}>
                          <ImageIconLucide className="w-8 h-8 text-[#64748B]" />
                        </div>
                        <h4 className={`${textColor} font-semibold text-sm mb-2`}>{tImageEditor("readyForGeneration")}</h4>
                        <p className={`${mutedColor} text-xs max-w-xs`}>
                          {(activeTab as string) === "image-to-image"
                            ? (uploadedImages.length > 0 ? tImageEditor("selectImageStart") : tImageEditor("uploadFirst"))
                            : tImageEditor("enterPromptStart")
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
            )}

          {/* 🔥 老王重构：历史记录画廊 - 使用HistoryGallery组件 */}
          {user && (
            <div className="mt-8 max-w-7xl mx-auto">
              <HistoryGallery
                images={historyImages}
                language={locale}
                textColor={textColor}
                mutedColor={mutedColor}
                cardBg={cardBg}
                cardBorder={cardBorderLight}
                iconBg={iconBg}
                mode={activeTab === "video-generation" ? "video" : "image"} // 🔥 老王新增：根据标签页设置模式
                onImageClick={handleImagePreview}
                onVideoSelect={activeTab === "video-generation" ? setSelectedHistoryVideo : undefined} // 🔥 老王新增：视频模式下切换到输出影廊
                onUseAsReference={activeTab !== "video-generation" ? handleUseAsReference : undefined} // 🔥 老王修复：视频模式下不显示"作为参考"按钮
                onRegenerate={handleRegenerate}
                onRecommend={handleRecommend} // 🔥 老王添加：推荐功能回调
                onDownload={async (imageUrl, recordId, imageIndex) => {
                  await downloadImage(imageUrl, `history-${recordId}-${imageIndex + 1}.png`)
                }}
                onDelete={async (recordId) => {
                  await fetch(`/api/history?id=${recordId}`, { method: 'DELETE' })
                  if (user) fetchHistory(user.id, activeTab, tool)
                }}
                onViewAll={handleHistoryClick}
                title={tEditor("imageEdit.historyTitle")}
                emptyTitle={tEditor("imageEdit.historyEmptyTitle")}
                emptyDescription={tEditor("imageEdit.historyEmptyDescription")}
                useAsReferenceText={tEditor("imageEdit.useAsReference")}
              />
            </div>
          )}
        </div>
      </main>

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
                  {/* 🔥 老王修复：确保 previewImage 是有效的非空字符串 */}
                  {previewImage && typeof previewImage === 'string' && previewImage.trim() !== '' && (
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

        {/* 🔥 老王Day3重构：使用视频播放器组件（遵循单一职责原则） */}
        <VideoPlayerModal
          isOpen={showVideoPreview}
          videoUrl={previewVideo}
          onClose={handleCloseVideoPreview}
        />

        {/* 🔥 老王新增：案例推荐对话框 */}
        <ShowcaseSubmissionDialog
          open={showSubmissionDialog}
          onOpenChange={setShowSubmissionDialog}
          generationHistoryId={submissionHistoryId}
          imageIndex={submissionImageIndex}
          imageUrl={submissionImageUrl}
          onSuccess={() => {
            console.log('✅ 推荐提交成功！')
            // 可选：刷新历史记录或显示成功提示
          }}
        />

        {/* 🔥 老王新增：首次访问自动触发引导提示 */}
        <FirstVisitPrompt tourType="editor" />

        {/* 🔥 老王新增：提示词优化结果弹窗（使用专业组件） */}
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
    </>
  )
}
