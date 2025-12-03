"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { EditorSidebar } from "@/components/editor-sidebar"
import { Clock, Image as ImageIcon, Wand2, Download, Trash2, ChevronDown, ChevronRight, Wrench, Sparkles, Video } from "lucide-react"
import { useTheme } from "@/lib/theme-context"
import { useTranslations, useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl替代language-context
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useRouter, useSearchParams } from "next/navigation"
import { downloadImage, downloadImagesAsZip } from "@/lib/download-utils"
import { GenerationHistoryRecord, VideoHistoryRecord, normalizeGenerationHistoryRecord, getHistoryRecordImages } from "@/lib/types/history"
import { HistoryRecordCard } from "@/components/history/history-record-card"
import { ShowcaseSubmissionDialog } from "@/components/showcase-submission-dialog" // 🔥 老王添加：推荐对话框
import { VideoExtendDialog } from "@/components/video/video-extend-dialog" // 🔥 老王添加：视频延长对话框
import { useToast } from "@/components/ui/toast" // 🔥 老王添加：Toast通知

type HistoryRecord = GenerationHistoryRecord

export default function HistoryPage() {
  const { theme } = useTheme()
  const t = useTranslations('history')  // 🔥 老王迁移：useTranslations返回t函数
  const language = useLocale()  // 🔥 老王迁移：useLocale返回当前语言
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const { addToast } = useToast() // 🔥 老王添加：Toast hook
  const [mounted, setMounted] = useState(false)

  // 避免水化不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  const [user, setUser] = useState<SupabaseUser | null>(null)

  // 🔥 老王添加：推荐功能状态管理
  const [showRecommendDialog, setShowRecommendDialog] = useState(false)
  const [recommendData, setRecommendData] = useState<{
    historyId: string
    imageUrl: string
    imageIndex: number
  } | null>(null)

  // 🔥 老王添加：视频延长对话框状态管理
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [extendVideoData, setExtendVideoData] = useState<{
    videoId: string
    currentDuration: number
    prompt: string
    resolution: string
  } | null>(null)

  // 🔥 标签类型定义
  type TabType =
    | 'text_to_image'  // 文生图
    | 'image_to_image' // 图片编辑
    | 'video'          // 视频生成
    | 'style-transfer' | 'background-remover' | 'scene-preservation' | 'consistent-generation' // 工具箱
    | 'text-to-image-with-text' | 'chat-edit' | 'smart-prompt' // 高级工具

  // 主标签组类型（用于控制二级标签显示）
  type MainTabGroup = 'basic' | 'toolbox' | 'advanced'

  // 从 URL 参数读取初始标签
  const initialTab = (searchParams.get('type') || searchParams.get('tool_type') || 'text_to_image') as TabType
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // 🔥 主标签组状态：控制当前选中的主标签组（用于显示对应的二级标签）
  const [mainTabGroup, setMainTabGroup] = useState<MainTabGroup>(() => {
    // 根据 initialTab 推断初始主标签组
    if (initialTab === 'text_to_image' || initialTab === 'image_to_image' || initialTab === 'video') return 'basic'
    const toolboxTabs: TabType[] = ['style-transfer', 'background-remover', 'scene-preservation', 'consistent-generation']
    if (toolboxTabs.includes(initialTab)) return 'toolbox'
    return 'advanced'
  })

  // 🔥 统一的历史记录数据（图像+视频）
  const [allHistory, setAllHistory] = useState<HistoryRecord[]>([])
  const [videoHistory, setVideoHistory] = useState<any[]>([]) // 🔥 老王新增：视频历史记录
  const [loading, setLoading] = useState(true)
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)

  const getRecordImages = useCallback((record: HistoryRecord) => {
    // 简化：只处理图像记录
    return getHistoryRecordImages(record)
  }, [])

  // 🔥 统一获取所有历史记录（图像+视频），不再分类
  // 🔥 老王修复race condition：支持AbortSignal来取消请求
  const fetchHistory = useCallback(async (userId: string, signal?: AbortSignal) => {
    // 🔥 老王核心修复：在调用fetch之前检查signal状态，避免浏览器记录AbortError到控制台
    if (signal?.aborted) {
      return
    }

    setLoading(true)
    try {
      // 使用原有的API获取历史记录（仅图像）
      const response = await fetch(`/api/history?limit=100`, { signal })

      // 🔥 老王修复：请求被取消时直接返回，不更新状态
      if (signal?.aborted) {
        return
      }

      const result = await response.json()

      if (result.data) {
        // 简化：所有记录都使用原有的normalize函数
        const normalizedRecords: HistoryRecord[] = result.data.map((item: any) => {
          return normalizeGenerationHistoryRecord(item)
        })
        setAllHistory(normalizedRecords)
      } else {
        console.error('获取历史记录失败:', result.error)
      }
    } catch (error) {
      // 🔥 老王修复：AbortError不是真正的错误，静默处理
      const isAbortError = (
        (error instanceof Error && error.name === 'AbortError') ||
        (error instanceof DOMException && error.name === 'AbortError') ||
        String(error).includes('Component unmounted')
      )

      if (isAbortError) {
        // 组件已unmount，请求被正常取消，不需要打印错误
        return
      }
      console.error('获取历史记录失败:', error)
    } finally {
      // 🔥 老王修复：请求被取消时不改变loading状态
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  // 🔥 老王新增：获取视频历史记录
  const fetchVideoHistory = useCallback(async (userId: string, signal?: AbortSignal) => {
    if (signal?.aborted) {
      return
    }

    try {
      const response = await fetch(`/api/history/videos?limit=100`, { signal })

      if (signal?.aborted) {
        return
      }

      const result = await response.json()

      if (result.data) {
        setVideoHistory(result.data)
      } else {
        console.error('获取视频历史记录失败:', result.error)
      }
    } catch (error) {
      const isAbortError = (
        (error instanceof Error && error.name === 'AbortError') ||
        (error instanceof DOMException && error.name === 'AbortError') ||
        String(error).includes('Component unmounted')
      )

      if (isAbortError) {
        return
      }
      console.error('获取视频历史记录失败:', error)
    }
  }, [])

  // 🔥 根据当前标签过滤历史记录（简化版本）
  const activeRecords = (() => {
    if (activeTab === 'video') {
      // 🔥 老王修复：视频标签返回视频历史记录
      return videoHistory
    }

    // 图像历史记录
    return allHistory.filter(record => {
      if (activeTab === 'text_to_image') {
        // 文生图：generation_type=text_to_image 且 tool_type=null
        return record.generation_type === 'text_to_image' && !record.tool_type
      } else if (activeTab === 'image_to_image') {
        // 图片编辑：generation_type=image_to_image 且 tool_type=null
        return record.generation_type === 'image_to_image' && !record.tool_type
      } else {
        // 工具箱和高级工具：tool_type 匹配当前标签
        return record.tool_type === activeTab
      }
    })
  })()

  // 🔥 统计各类型的记录数量（简化版本）
  const tabCounts = {
    text_to_image: allHistory.filter(r => r.generation_type === 'text_to_image' && !r.tool_type).length,
    image_to_image: allHistory.filter(r => r.generation_type === 'image_to_image' && !r.tool_type).length,
    video: videoHistory.length, // 🔥 老王修复：显示实际视频记录数量
    'style-transfer': allHistory.filter(r => r.tool_type === 'style-transfer').length,
    'background-remover': allHistory.filter(r => r.tool_type === 'background-remover').length,
    'scene-preservation': allHistory.filter(r => r.tool_type === 'scene-preservation').length,
    'consistent-generation': allHistory.filter(r => r.tool_type === 'consistent-generation').length,
    'text-to-image-with-text': allHistory.filter(r => r.tool_type === 'text-to-image-with-text').length,
    'chat-edit': allHistory.filter(r => r.tool_type === 'chat-edit').length,
    'smart-prompt': allHistory.filter(r => r.tool_type === 'smart-prompt').length,
  }

  // 🔥 定义工具箱、高级工具的子标签列表（用于后续渲染）
  const toolboxTabs: TabType[] = ['style-transfer', 'background-remover', 'scene-preservation', 'consistent-generation']
  const advancedTabs: TabType[] = ['text-to-image-with-text', 'chat-edit', 'smart-prompt']

  // 获取用户和历史记录
  // 🔥 老王修复race condition：添加cleanup函数取消pending请求
  useEffect(() => {
    // 创建AbortController来取消请求
    const abortController = new AbortController()

    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          setLoading(false)
          return
        }

        setUser(user)
        // 🔥 老王修复：传递signal参数，允许请求被取消
        await Promise.all([
          fetchHistory(user.id, abortController.signal),
          fetchVideoHistory(user.id, abortController.signal), // 🔥 老王新增：同时获取视频历史
        ])
      } catch (error) {
        // 🔥 老王修复：忽略AbortError（组件unmount时正常取消请求）
        const isAbortError = (
          (error instanceof Error && error.name === 'AbortError') ||
          (error instanceof DOMException && error.name === 'AbortError') ||
          String(error).includes('Component unmounted')
        )

        if (isAbortError) {
          // 组件已unmount，请求被正常取消，不需要打印错误
          return
        }
        console.error('获取历史记录失败:', error)
        setLoading(false)
      }
    }

    fetchData()

    // 🔥 老王修复：cleanup函数，组件unmount时取消所有pending请求
    return () => {
      abortController.abort('Component unmounted') // 🔥 老王优化：提供明确的abort原因
    }
  }, [router, supabase, fetchHistory, fetchVideoHistory])

  // 🔥 重新生成：回填提示词到对应编辑器（支持工具类型）
  const handleRegenerate = (record: GenerationHistoryRecord | VideoHistoryRecord) => {
    // 🔥 老王修复：视频记录不支持重新生成，直接返回
    // 通过检查 record_type 字段来区分视频记录（更明确的类型守卫）
    if ('record_type' in record && record.record_type === 'video') {
      // 这是 VideoHistoryRecord，不支持重新生成
      console.log('[handleRegenerate] 视频记录暂不支持重新生成')
      return
    }

    // 类型断言：经过上面的检查，TypeScript 应该知道这里是 GenerationHistoryRecord
    const imageRecord = record as GenerationHistoryRecord

    const params = new URLSearchParams({
      prompt: imageRecord.prompt,
      aspectRatio: imageRecord.aspect_ratio || '1:1'
    })

    // 如果有工具类型，则跳转到对应工具页面
    if (imageRecord.tool_type) {
      router.push(`/editor/image-edit?tool=${imageRecord.tool_type}&${params.toString()}`)
      return
    }

    // 基础模式：文生图或图片编辑（简化版本）
    if (imageRecord.generation_type === 'text_to_image') {
      router.push(`/editor/image-edit?mode=text-to-image&${params.toString()}`)
    } else {
      // 图片编辑历史，还需要传递参考图片
      localStorage.setItem('regenerate_reference_images', JSON.stringify(imageRecord.reference_images || []))
      router.push(`/editor/image-edit?mode=image-to-image&${params.toString()}`)
    }
  }

  const handleDownloadRecord = async (record: GenerationHistoryRecord | VideoHistoryRecord) => {
    // 🔥 老王修复：视频记录使用permanent_video_url下载
    if ('record_type' in record && record.record_type === 'video') {
      // 视频记录：下载视频文件或缩略图
      const videoUrl = record.permanent_video_url || record.thumbnail_url
      if (!videoUrl) {
        console.error('视频记录没有可下载的文件')
        return
      }
      try {
        const filename = record.permanent_video_url
          ? `video-${record.id}.mp4`
          : `video-thumb-${record.id}.jpg`
        await downloadImage(videoUrl, filename)
      } catch (error) {
        console.error('下载视频失败:', error)
      }
      return
    }

    // 图片记录：下载生成的图片
    const imageRecord = record as GenerationHistoryRecord
    const images = getRecordImages(imageRecord)
    if (images.length === 0) return

    try {
      if (images.length === 1) {
        await downloadImage(images[0], `history-${imageRecord.id}.png`)
      } else {
        await downloadImagesAsZip([
          { folderName: imageRecord.id, images }
        ], `history-${imageRecord.id}.zip`)
      }
    } catch (error) {
      console.error('下载图片失败:', error)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const response = await fetch(`/api/history?id=${recordId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('删除失败')
      setSelectedRecords(prev => {
        const next = new Set(prev)
        next.delete(recordId)
        return next
      })
      if (user) {
        await fetchHistory(user.id)
      }
    } catch (error) {
      console.error('删除历史记录失败:', error)
    }
  }

  // 🔥 老王添加：推荐功能处理函数
  const handleRecommend = (record: GenerationHistoryRecord | VideoHistoryRecord) => {
    // 🔥 老王修复：视频记录不支持推荐到案例展示
    if ('record_type' in record && record.record_type === 'video') {
      console.log('[handleRecommend] 视频记录暂不支持推荐到案例展示')
      return
    }

    const imageRecord = record as GenerationHistoryRecord
    const images = getHistoryRecordImages(imageRecord)

    // 🔥 老王修复：如果没有图片，给用户明确提示
    if (images.length === 0) {
      console.error('❌ 这条历史记录没有生成图片，无法推荐')

      // 可选：显示一个toast提示（如果有toast组件）
      alert(t("noImagesError"))
      return
    }

    // 默认推荐第一张图片，用户可以在对话框中选择其他图片
    setRecommendData({
      historyId: imageRecord.id,
      imageUrl: images[0],
      imageIndex: 0
    })
    setShowRecommendDialog(true)
  }

  // 🔥 老王添加：视频延长功能处理函数
  const handleExtendVideo = (record: VideoHistoryRecord) => {
    // 获取当前视频时长（优先使用duration_seconds，否则用duration）
    const currentDuration = record.duration_seconds || record.duration || 0
    // 获取分辨率（默认720p）
    const resolution = record.resolution || '720p'

    setExtendVideoData({
      videoId: record.id,
      currentDuration,
      prompt: record.prompt,
      resolution: resolution
    })
    setShowExtendDialog(true)
  }

  // 🔥 老王添加：视频延长确认API调用
  const handleExtendConfirm = async (videoId: string, extendPrompt: string) => {
    try {
      const response = await fetch('/api/video/extend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_video_id: videoId,
          prompt: extendPrompt,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || result.message || '延长视频失败')
      }

      // 成功提示
      addToast(
        language === 'zh'
          ? `✅ 延长任务已创建 - 任务ID: ${result.task_id}，消耗 ${result.credit_cost} 积分`
          : `✅ Extension Task Created - Task ID: ${result.task_id}, Cost: ${result.credit_cost} credits`,
        'success'
      )

      // 刷新视频历史
      if (user) {
        await fetchVideoHistory(user.id)
      }
    } catch (error: any) {
      // 错误提示
      addToast(
        language === 'zh' ? `❌ 延长失败 - ${error.message}` : `❌ Extension Failed - ${error.message}`,
        'error'
      )
      throw error // 重新抛出让对话框处理
    }
  }

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev => {
      const next = new Set(prev)
      if (next.has(recordId)) {
        next.delete(recordId)
      } else {
        next.add(recordId)
      }
      return next
    })
  }

  const handleBulkDownload = async (records: HistoryRecord[]) => {
    const entries = records
      .map(record => ({ folderName: record.id, images: getRecordImages(record) }))
      .filter(entry => entry.images.length > 0)

    if (entries.length === 0) return

    try {
      await downloadImagesAsZip(entries, `history-selected-${Date.now()}.zip`)
    } catch (error) {
      console.error('批量下载失败:', error)
    }
  }

  const handleBulkDelete = async (recordIds: string[]) => {
    if (recordIds.length === 0) return

    try {
      const responses = await Promise.all(recordIds.map(id =>
        fetch(`/api/history?id=${id}`, { method: 'DELETE' })
      ))

      const hasError = responses.some(res => !res.ok)
      if (hasError) {
        throw new Error('部分记录删除失败')
      }

      setSelectedRecords(new Set())
      if (user) {
        await fetchHistory(user.id)
      }
    } catch (error) {
      console.error('批量删除失败:', error)
    }
  }

  const handleSelectAllCurrent = () => {
    if (isAllSelected) {
      setSelectedRecords(new Set())
    } else {
      setSelectedRecords(new Set(activeRecords.map(record => record.id)))
    }
  }

  useEffect(() => {
    if (!bulkMode) {
      setSelectedRecords(new Set())
    }
  }, [bulkMode])

  useEffect(() => {
    setSelectedRecords(new Set())
  }, [activeTab])

  const mainBg = theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0A0F1C]"
  const cardBg = theme === "light" ? "bg-[#FFFFFF]" : "bg-[#0F1728]"
  const textColor = theme === "light" ? "text-[#1E293B]" : "text-[#F1F5F9]"
  const mutedColor = theme === "light" ? "text-[#64748B]" : "text-[#94A3B8]"
  const appearance = {
    cardBg,
    border: "border-[#64748B]/20",
    hoverBorder: "hover:border-[#D97706]/50",
    textColor,
    mutedColor,
    referenceBorder: "border-[#64748B]/20",
    accentText: "text-[#D97706]",
  }

  const activeSelectedIds = activeRecords.filter(record => selectedRecords.has(record.id))
  const selectedCount = activeSelectedIds.length
  const isAllSelected = selectedCount > 0 && selectedCount === activeRecords.length
  const hasSelection = selectedCount > 0

  // 处理左侧菜单栏点击
  const handleTabChange = (tab: string) => {
    // 🔥 老王修复：视频生成也应该使用mode参数而不是tool参数
    if (tab === "image-to-image" || tab === "text-to-image" || tab === "video-generation") {
      router.push(`/editor/image-edit?mode=${tab}`)
    } else {
      router.push(`/editor/image-edit?tool=${tab}`)
    }
  }

  const handleHistoryClick = () => {
    // 已经在历史记录页面，不需要跳转
  }

  const handleToolboxClick = (tool: string) => {
    router.push(`/editor/image-edit?tool=${tool}`)
  }

  // 🔥 避免主题相关的水合错误：仅在客户端挂载完成后再渲染主要内容
  if (!mounted) {
    return null
  }
  return (
    <>
      <Header />
      <div className={`flex min-h-screen ${mainBg} pt-16`}>
        {/* 左侧菜单栏 */}
        <EditorSidebar
          mode="full"
          activeTab={undefined}
          onTabChange={handleTabChange}
          user={user}
          onHistoryClick={handleHistoryClick}
          onToolboxClick={handleToolboxClick}
          selectedTool={null}
        />

        {/* 主要内容区域 */}
        <main className="flex-1">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#D97706]" />
              </div>
              <h1 className={`text-3xl font-bold ${textColor}`}>{t("title")}</h1>
            </div>
            <p className={`${mutedColor} ml-13`}>{t("subtitle")}</p>
          </div>

          {/* 🔥 水平主标签栏 */}
          <div className={`${cardBg} rounded-lg border border-[#64748B]/20 overflow-hidden mb-6`}>
            {/* 主标签（水平排列） */}
            <div className="flex items-center border-b border-[#64748B]/20">
              {/* 文生图 */}
              <button
                onClick={() => {
                  setMainTabGroup('basic')
                  setActiveTab('text_to_image')
                }}
                className={`flex items-center gap-2 px-4 py-3 transition-all border-b-2 ${
                  activeTab === 'text_to_image'
                    ? `border-[#D97706] ${textColor} bg-[#F59E0B]/5`
                    : `border-transparent ${mutedColor} hover:${textColor} hover:bg-[#F59E0B]/5`
                }`}
              >
                <Wand2 className="w-4 h-4" />
                <span className="font-medium">{t("tabTextToImage")}</span>
                <span className="text-xs opacity-60">({tabCounts.text_to_image})</span>
              </button>

              {/* 图片编辑 */}
              <button
                onClick={() => {
                  setMainTabGroup('basic')
                  setActiveTab('image_to_image')
                }}
                className={`flex items-center gap-2 px-4 py-3 transition-all border-b-2 ${
                  activeTab === 'image_to_image'
                    ? `border-[#D97706] ${textColor} bg-[#F59E0B]/5`
                    : `border-transparent ${mutedColor} hover:${textColor} hover:bg-[#F59E0B]/5`
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="font-medium">{t("tabImageToImage")}</span>
                <span className="text-xs opacity-60">({tabCounts.image_to_image})</span>
              </button>

              {/* 视频生成 */}
              <button
                onClick={() => {
                  setMainTabGroup('basic')
                  setActiveTab('video')
                }}
                className={`flex items-center gap-2 px-4 py-3 transition-all border-b-2 ${
                  activeTab === 'video'
                    ? `border-[#D97706] ${textColor} bg-[#F59E0B]/5`
                    : `border-transparent ${mutedColor} hover:${textColor} hover:bg-[#F59E0B]/5`
                }`}
              >
                <Video className="w-4 h-4" />
                <span className="font-medium">{t("tabVideoGeneration")}</span>
                <span className="text-xs opacity-60">({tabCounts.video})</span>
              </button>

              {/* 工具箱 */}
              <button
                onClick={() => {
                  setMainTabGroup('toolbox')
                  setActiveTab(toolboxTabs[0]) // 默认选择第一个工具箱子标签
                }}
                className={`flex items-center gap-2 px-4 py-3 transition-all border-b-2 ${
                  mainTabGroup === 'toolbox'
                    ? `border-[#D97706] ${textColor} bg-[#F59E0B]/5`
                    : `border-transparent ${mutedColor} hover:${textColor} hover:bg-[#F59E0B]/5`
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span className="font-medium">{t("tabToolbox")}</span>
                <span className="text-xs opacity-60">
                  ({tabCounts['style-transfer'] + tabCounts['background-remover'] + tabCounts['scene-preservation'] + tabCounts['consistent-generation']})
                </span>
              </button>

              {/* 高级工具 */}
              <button
                onClick={() => {
                  setMainTabGroup('advanced')
                  setActiveTab(advancedTabs[0]) // 默认选择第一个高级工具子标签
                }}
                className={`flex items-center gap-2 px-4 py-3 transition-all border-b-2 ${
                  mainTabGroup === 'advanced'
                    ? `border-[#D97706] ${textColor} bg-[#F59E0B]/5`
                    : `border-transparent ${mutedColor} hover:${textColor} hover:bg-[#F59E0B]/5`
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">{t("tabAdvanced")}</span>
                <span className="text-xs opacity-60">
                  ({tabCounts['text-to-image-with-text'] + tabCounts['chat-edit'] + tabCounts['smart-prompt']})
                </span>
              </button>
            </div>

            {/* 🔥 二级标签（仅在选择工具箱或高级工具时显示） */}
            {mainTabGroup === 'toolbox' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B]/5 border-b border-[#64748B]/20">
                <button
                  onClick={() => setActiveTab('style-transfer')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeTab === 'style-transfer'
                      ? `bg-[#D97706] text-white`
                      : `${mutedColor} hover:${textColor} hover:bg-[#D97706]/10`
                  }`}
                >
                  {t("subStyleTransfer")} ({tabCounts['style-transfer']})
                </button>
                <button
                  onClick={() => setActiveTab('background-remover')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeTab === 'background-remover'
                      ? `bg-[#D97706] text-white`
                      : `${mutedColor} hover:${textColor} hover:bg-[#D97706]/10`
                  }`}
                >
                  {t("subBackgroundRemover")} ({tabCounts['background-remover']})
                </button>
                <button
                  onClick={() => setActiveTab('scene-preservation')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeTab === 'scene-preservation'
                      ? `bg-[#D97706] text-white`
                      : `${mutedColor} hover:${textColor} hover:bg-[#D97706]/10`
                  }`}
                >
                  {t("subScenePreservation")} ({tabCounts['scene-preservation']})
                </button>
                <button
                  onClick={() => setActiveTab('consistent-generation')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeTab === 'consistent-generation'
                      ? `bg-[#D97706] text-white`
                      : `${mutedColor} hover:${textColor} hover:bg-[#D97706]/10`
                  }`}
                >
                  {t("subConsistentGeneration")} ({tabCounts['consistent-generation']})
                </button>
              </div>
            )}

            {mainTabGroup === 'advanced' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B]/5 border-b border-[#64748B]/20">
                <button
                  onClick={() => setActiveTab('text-to-image-with-text')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeTab === 'text-to-image-with-text'
                      ? `bg-[#D97706] text-white`
                      : `${mutedColor} hover:${textColor} hover:bg-[#D97706]/10`
                  }`}
                >
                  {t("subTextToImageWithText")} ({tabCounts['text-to-image-with-text']})
                </button>
                <button
                  onClick={() => setActiveTab('chat-edit')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeTab === 'chat-edit'
                      ? `bg-[#D97706] text-white`
                      : `${mutedColor} hover:${textColor} hover:bg-[#D97706]/10`
                  }`}
                >
                  {t("subChatEdit")} ({tabCounts['chat-edit']})
                </button>
                <button
                  onClick={() => setActiveTab('smart-prompt')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeTab === 'smart-prompt'
                      ? `bg-[#D97706] text-white`
                      : `${mutedColor} hover:${textColor} hover:bg-[#D97706]/10`
                  }`}
                >
                  {t("subSmartPrompt")} ({tabCounts['smart-prompt']})
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className={`${mutedColor} text-sm`}>
              {bulkMode
                ? t("selectedCount").replace('{count}', selectedCount.toString())
                : t("totalCount").replace('{count}', activeRecords.length.toString())}
            </p>
            <div className="flex items-center gap-2">
              {bulkMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllCurrent}
                  disabled={activeRecords.length === 0}
                >
                  {isAllSelected ? t("deselectAll") : t("selectAllCurrent")}
                </Button>
              )}
              <Button
                variant={bulkMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBulkMode(prev => !prev)}
                disabled={activeRecords.length === 0}
              >
                {bulkMode ? t("exitBulk") : t("bulkManage")}
              </Button>
            </div>
          </div>

          {bulkMode && (
            <div className={`${cardBg} border border-[#64748B]/20 rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3 justify-between`}>
              <div className={`${textColor} text-sm`}>{t("selectedItems").replace('{count}', selectedCount.toString())}</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkDownload(activeSelectedIds)}
                  disabled={!hasSelection}
                >
                  <Download className="w-4 h-4 mr-1" />
                  {t("bulkDownload")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkDelete(activeSelectedIds.map(item => item.id))}
                  disabled={!hasSelection}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t("bulkDelete")}
                </Button>
              </div>
            </div>
          )}

          {/* 历史记录列表 */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
                <p className={`${mutedColor} mt-4`}>{t("loading")}</p>
              </div>
            ) : activeRecords.length === 0 ? (
              <div className={`${cardBg} rounded-xl p-12 text-center border border-[#64748B]/20`}>
                <div className="w-16 h-16 rounded-full bg-[#F59E0B]/20 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-[#64748B]" />
                </div>
                <h3 className={`${textColor} font-semibold mb-2`}>{t("empty")}</h3>
                <p className={`${mutedColor} text-sm`}>
                  {activeTab === 'text_to_image' && t("emptyTextToImage")}
                  {activeTab === 'image_to_image' && t("emptyImageToImage")}
                  {activeTab === 'video' && t("emptyTextToVideo")}
                  {activeTab === 'style-transfer' && t("emptyStyleTransfer")}
                  {activeTab === 'background-remover' && t("emptyBackgroundRemover")}
                  {activeTab === 'scene-preservation' && t("emptyScenePreservation")}
                  {activeTab === 'consistent-generation' && t("emptyConsistentGeneration")}
                  {activeTab === 'text-to-image-with-text' && t("emptyTextToImageWithText")}
                  {activeTab === 'chat-edit' && t("emptyChatEdit")}
                  {activeTab === 'smart-prompt' && t("emptySmartPrompt")}
                </p>
              </div>
            ) : (
              activeRecords.map((record) => (
                <HistoryRecordCard
                  key={record.id}
                  record={record}
                  appearance={appearance}
                  bulkMode={bulkMode}
                  selected={selectedRecords.has(record.id)}
                  onToggleSelect={toggleRecordSelection}
                  onRegenerate={handleRegenerate}
                  onDownload={handleDownloadRecord}
                  onDelete={handleDeleteRecord}
                  onRecommend={handleRecommend} // 🔥 老王添加：推荐功能回调
                  onExtendVideo={handleExtendVideo} // 🔥 老王添加：视频延长功能回调
                />
              ))
            )}
          </div>
            </div>
          </div>
        </main>
      </div>

      {/* 🔥 老王添加：推荐对话框 */}
      {recommendData && (
        <ShowcaseSubmissionDialog
          open={showRecommendDialog}
          onOpenChange={setShowRecommendDialog}
          generationHistoryId={recommendData.historyId}
          imageUrl={recommendData.imageUrl}
          imageIndex={recommendData.imageIndex}
        />
      )}

      {/* 🔥 老王添加：视频延长对话框 */}
      {extendVideoData && (
        <VideoExtendDialog
          open={showExtendDialog}
          onOpenChange={setShowExtendDialog}
          videoId={extendVideoData.videoId}
          currentDuration={extendVideoData.currentDuration}
          resolution={extendVideoData.resolution}
          prompt={extendVideoData.prompt}
          sourceVideoId={null}
          extensionChain={[]}
          onConfirm={handleExtendConfirm}
        />
      )}
    </>
  )
}
