"use client"

/**
 * 🔥 老王新增：独立视频输出影廊页面
 *
 * 功能特性：
 * - 展示用户生成的所有视频历史记录
 * - 支持状态筛选（全部/生成中/下载中/已完成/失败）
 * - 支持分页加载
 * - 视频播放预览（Modal）
 * - 视频下载和删除
 * - 响应式网格布局
 * - 中英双语支持
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl的useLocale
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Video,
  Loader2,
  Download,
  Trash2,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Share2,
  Plus,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { VideoShareModal } from "@/components/video-share-modal"
import { VideoExtendDialog } from "@/components/video/video-extend-dialog"

// 视频记录类型
interface VideoRecord {
  id: string
  user_id: string
  prompt: string
  negative_prompt?: string
  generation_mode: 'text-to-video' | 'reference-images' | 'first-last-frame'
  duration: 4 | 6 | 8
  resolution: '720p' | '1080p'
  aspect_ratio: '16:9' | '9:16'
  status: 'processing' | 'downloading' | 'completed' | 'failed'
  operation_id?: string
  google_video_url?: string
  permanent_video_url?: string
  first_frame_url?: string
  last_frame_url?: string
  reference_image_url?: string
  credits_used: number
  error_message?: string
  created_at: string
  updated_at: string
  // 🔥 老王添加的计算字段
  record_type: 'video'
  progress: number
  elapsed_time?: string
}

// 状态筛选选项
const STATUS_OPTIONS = ['all', 'processing', 'downloading', 'completed', 'failed'] as const
type StatusFilter = typeof STATUS_OPTIONS[number]

const supabase = createClient()

export default function VideoGalleryPage() {
  const router = useRouter()
  const language = useLocale()  // 🔥 老王迁移：useLocale返回当前语言
  const { addToast } = useToast()
  const { confirm } = useConfirm()

  // 状态管理
  const [videos, setVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // 视频播放模态框
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // 删除中状态
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 🔥 老王新增：分享Modal状态
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareVideoId, setShareVideoId] = useState<string | null>(null)
  const [shareVideoPrompt, setShareVideoPrompt] = useState<string>('')

  // 🔥 老王新增：视频延长Dialog状态
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false)
  const [extendVideo, setExtendVideo] = useState<VideoRecord | null>(null)

  // 用户认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // 检查用户认证
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [])

  // 获取视频列表
  const fetchVideos = useCallback(async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        status: statusFilter,
      })

      const response = await fetch(`/api/history/videos?${params}`)
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false)
          return
        }
        throw new Error('获取视频列表失败')
      }

      const data = await response.json()
      setVideos(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCount(data.pagination?.total || 0)
    } catch (error) {
      console.error('❌ 获取视频列表失败:', error)
      addToast(
        language === 'zh' ? '获取视频列表失败' : 'Failed to load videos',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, page, statusFilter, language, addToast])

  // 监听筛选和分页变化
  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // 轮询处理中的视频状态
  useEffect(() => {
    const processingVideos = videos.filter(
      v => v.status === 'processing' || v.status === 'downloading'
    )

    if (processingVideos.length === 0) return

    const pollInterval = setInterval(() => {
      fetchVideos()
    }, 15000) // 每15秒刷新一次

    return () => clearInterval(pollInterval)
  }, [videos, fetchVideos])

  // 删除视频
  const handleDelete = async (video: VideoRecord) => {
    const confirmed = await confirm({
      title: language === 'zh' ? '确认删除' : 'Confirm Delete',
      message: language === 'zh'
        ? '确定要删除这个视频吗？此操作不可撤销。'
        : 'Are you sure you want to delete this video? This action cannot be undone.',
      variant: 'destructive',
      confirmText: language === 'zh' ? '删除' : 'Delete',
      cancelText: language === 'zh' ? '取消' : 'Cancel',
    })

    if (!confirmed) return

    setDeletingId(video.id)
    try {
      const response = await fetch(`/api/history/videos?id=${video.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      addToast(
        language === 'zh' ? '视频已删除' : 'Video deleted',
        'success'
      )

      // 刷新列表
      fetchVideos()
    } catch (error) {
      console.error('❌ 删除视频失败:', error)
      addToast(
        language === 'zh' ? '删除失败' : 'Delete failed',
        'error'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // 下载视频
  const handleDownload = async (video: VideoRecord) => {
    const videoUrl = video.permanent_video_url || video.google_video_url
    if (!videoUrl) {
      addToast(
        language === 'zh' ? '视频URL不可用' : 'Video URL not available',
        'error'
      )
      return
    }

    try {
      // 尝试使用download API
      const response = await fetch('/api/video/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `video-${video.id.slice(0, 8)}-${Date.now()}.mp4`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // 回退：直接打开视频URL
        window.open(videoUrl, '_blank')
      }

      addToast(
        language === 'zh' ? '开始下载视频' : 'Download started',
        'success'
      )
    } catch (error) {
      console.error('❌ 下载视频失败:', error)
      // 回退：直接打开
      window.open(videoUrl, '_blank')
    }
  }

  // 🔥 老王新增：检查视频是否可以延长
  const canExtendVideo = (video: VideoRecord) => {
    // 只支持720p视频延长
    if (video.resolution !== '720p') return false
    // 必须是已完成状态
    if (video.status !== 'completed') return false
    // 时长不能超过141秒（延长7秒后不超过148秒）
    if (video.duration >= 141) return false
    // 必须有永久视频URL
    if (!video.permanent_video_url && !video.google_video_url) return false

    return true
  }

  // 🔥 老王新增：打开延长Dialog
  const handleOpenExtend = (video: VideoRecord) => {
    if (!canExtendVideo(video)) {
      addToast(
        language === 'zh' ? '此视频无法延长' : 'This video cannot be extended',
        'warning'
      )
      return
    }

    setExtendVideo(video)
    setIsExtendDialogOpen(true)
  }

  // 🔥 老王新增：确认延长视频
  const handleConfirmExtend = async (videoId: string, extendPrompt: string) => {
    try {
      const response = await fetch('/api/video/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_video_id: videoId,
          prompt: extendPrompt,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || '延长失败')
      }

      const result = await response.json()

      addToast(
        language === 'zh' ? '视频延长任务已创建' : 'Video extension task created',
        'success'
      )

      // 刷新视频列表
      fetchVideos()
    } catch (error: any) {
      console.error('❌ 延长视频失败:', error)
      addToast(
        error.message || (language === 'zh' ? '延长失败，请重试' : 'Extension failed, please try again'),
        'error'
      )
      throw error // 重新抛出错误，让Dialog组件处理
    }
  }

  // 打开视频预览
  const handlePreview = (video: VideoRecord) => {
    if (video.status !== 'completed') {
      addToast(
        language === 'zh' ? '视频尚未生成完成' : 'Video is not ready yet',
        'warning'
      )
      return
    }
    setSelectedVideo(video)
    setIsPreviewOpen(true)
  }

  // 🔥 老王新增：打开分享Modal
  const handleOpenShare = (video: VideoRecord) => {
    if (video.status !== 'completed') {
      addToast(
        language === 'zh' ? '只能分享已完成的视频' : 'Can only share completed videos',
        'warning'
      )
      return
    }
    setShareVideoId(video.id)
    setShareVideoPrompt(video.prompt)
    setIsShareModalOpen(true)
  }

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'processing':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: language === 'zh' ? '生成中' : 'Processing',
          color: 'bg-blue-500',
        }
      case 'downloading':
        return {
          icon: <Download className="w-4 h-4 animate-pulse" />,
          text: language === 'zh' ? '下载中' : 'Downloading',
          color: 'bg-yellow-500',
        }
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: language === 'zh' ? '已完成' : 'Completed',
          color: 'bg-green-500',
        }
      case 'failed':
        return {
          icon: <XCircle className="w-4 h-4" />,
          text: language === 'zh' ? '失败' : 'Failed',
          color: 'bg-red-500',
        }
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          text: language === 'zh' ? '未知' : 'Unknown',
          color: 'bg-gray-500',
        }
    }
  }

  // 状态筛选按钮文本
  const getStatusFilterText = (status: StatusFilter) => {
    switch (status) {
      case 'all': return language === 'zh' ? '全部' : 'All'
      case 'processing': return language === 'zh' ? '生成中' : 'Processing'
      case 'downloading': return language === 'zh' ? '下载中' : 'Downloading'
      case 'completed': return language === 'zh' ? '已完成' : 'Completed'
      case 'failed': return language === 'zh' ? '失败' : 'Failed'
    }
  }

  // 未登录状态
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-[#FEF9E7] to-[#FFFBEB] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <AlertCircle className="w-16 h-16 text-[#D97706] mb-4" />
            <h1 className="text-2xl font-bold text-[#1E293B] dark:text-white mb-2">
              {language === 'zh' ? '请先登录' : 'Please Login First'}
            </h1>
            <p className="text-[#64748B] dark:text-gray-400 mb-6">
              {language === 'zh'
                ? '您需要登录才能查看视频输出影廊'
                : 'You need to login to view your video gallery'}
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="bg-[#D97706] hover:bg-[#B45309] text-white"
            >
              {language === 'zh' ? '前往登录' : 'Go to Login'}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // 加载中状态（首次检查认证）
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-[#FEF9E7] to-[#FFFBEB] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-[#D97706] animate-spin" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-[#FEF9E7] to-[#FFFBEB] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* 🔥 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-[#D97706]" />
            </div>
            <h1 className="text-3xl font-bold text-[#1E293B] dark:text-white">
              {language === 'zh' ? '视频输出影廊' : 'Video Output Gallery'}
            </h1>
          </div>
          <p className="text-[#64748B] dark:text-gray-400 ml-13">
            {language === 'zh'
              ? `共 ${totalCount} 个视频`
              : `${totalCount} videos in total`}
          </p>
        </div>

        {/* 🔥 状态筛选 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-[#64748B]" />
            {STATUS_OPTIONS.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
                className={
                  statusFilter === status
                    ? 'bg-[#D97706] hover:bg-[#B45309] text-white'
                    : 'border-[#D97706]/30 text-[#1E293B] dark:text-white hover:bg-[#D97706]/10'
                }
              >
                {getStatusFilterText(status)}
              </Button>
            ))}

            {/* 刷新按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchVideos()}
              disabled={loading}
              className="ml-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {language === 'zh' ? '刷新' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* 🔥 视频网格 */}
        {loading && videos.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#D97706] animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#D97706]/10 flex items-center justify-center mb-4">
              <Video className="w-10 h-10 text-[#64748B]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E293B] dark:text-white mb-2">
              {language === 'zh' ? '暂无视频' : 'No Videos Yet'}
            </h2>
            <p className="text-[#64748B] dark:text-gray-400 mb-6">
              {language === 'zh'
                ? '您还没有生成任何视频，去创建第一个吧！'
                : 'You haven\'t generated any videos yet. Create your first one!'}
            </p>
            <Button
              onClick={() => router.push('/editor/video')}
              className="bg-[#D97706] hover:bg-[#B45309] text-white"
            >
              {language === 'zh' ? '开始创建视频' : 'Start Creating Videos'}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => {
                const statusDisplay = getStatusDisplay(video.status)
                const videoUrl = video.permanent_video_url || video.google_video_url

                return (
                  <div
                    key={video.id}
                    className="group relative bg-white dark:bg-gray-800 rounded-xl border border-[#D97706]/20 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* 视频预览/封面 */}
                    <div
                      className="relative aspect-video bg-black cursor-pointer"
                      onClick={() => handlePreview(video)}
                    >
                      {video.status === 'completed' && videoUrl ? (
                        <>
                          <video
                            src={videoUrl}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted
                            playsInline
                          />
                          {/* 播放按钮叠加层 */}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="w-6 h-6 text-[#D97706] ml-1" />
                            </div>
                          </div>
                        </>
                      ) : video.status === 'processing' || video.status === 'downloading' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#D97706]/20 to-[#F59E0B]/20">
                          <Loader2 className="w-10 h-10 text-[#F59E0B] animate-spin mb-2" />
                          <span className="text-white text-sm font-medium">
                            {statusDisplay.text}
                          </span>
                          {video.progress > 0 && (
                            <div className="w-24 h-1.5 bg-white/30 rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-[#F59E0B] rounded-full transition-all"
                                style={{ width: `${video.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                          <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                      )}

                      {/* 状态徽章 */}
                      <Badge
                        className={`absolute top-2 right-2 ${statusDisplay.color} text-white`}
                      >
                        {statusDisplay.icon}
                        <span className="ml-1">{statusDisplay.text}</span>
                      </Badge>

                      {/* 时长显示 */}
                      <Badge
                        variant="secondary"
                        className="absolute bottom-2 left-2 bg-black/60 text-white"
                      >
                        {video.duration}s • {video.resolution}
                      </Badge>
                    </div>

                    {/* 视频信息 */}
                    <div className="p-4">
                      <p className="text-sm text-[#1E293B] dark:text-white line-clamp-2 mb-2">
                        {video.prompt.length > 80
                          ? video.prompt.substring(0, 80) + '...'
                          : video.prompt}
                      </p>

                      <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(video.created_at).toLocaleDateString(
                            language === 'zh' ? 'zh-CN' : 'en-US',
                            { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                          )}
                        </span>
                        <span>
                          {video.aspect_ratio} • {video.credits_used}{language === 'zh' ? '积分' : ' credits'}
                        </span>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2 flex-wrap">
                        {video.status === 'completed' && (
                          <>
                            {/* 🔥 老王新增：分享按钮 */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/30 hover:bg-primary/10 text-primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenShare(video)
                              }}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>

                            {/* 🔥 老王新增：延长按钮（仅720p视频显示） */}
                            {canExtendVideo(video) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#7C3AED]/30 hover:bg-[#7C3AED]/10 text-[#7C3AED]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenExtend(video)
                                }}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                {language === 'zh' ? '延长' : 'Extend'}
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-[#D97706]/30 hover:bg-[#D97706]/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(video)
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              {language === 'zh' ? '下载' : 'Download'}
                            </Button>
                          </>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(video)
                          }}
                          disabled={deletingId === video.id}
                        >
                          {deletingId === video.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 🔥 分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="border-[#D97706]/30"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {language === 'zh' ? '上一页' : 'Previous'}
                </Button>

                <span className="text-sm text-[#64748B] dark:text-gray-400">
                  {language === 'zh'
                    ? `第 ${page} 页，共 ${totalPages} 页`
                    : `Page ${page} of ${totalPages}`}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="border-[#D97706]/30"
                >
                  {language === 'zh' ? '下一页' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 🔥 视频播放模态框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl bg-black/95 border-[#D97706]/30">
          <DialogHeader>
            <DialogTitle className="text-white">
              {language === 'zh' ? '视频预览' : 'Video Preview'}
            </DialogTitle>
          </DialogHeader>

          {selectedVideo && (
            <div className="space-y-4">
              {/* 视频播放器 */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={selectedVideo.permanent_video_url || selectedVideo.google_video_url}
                  controls
                  autoPlay
                  className="w-full h-full"
                  controlsList="nodownload"
                >
                  {language === 'zh'
                    ? '您的浏览器不支持视频播放。'
                    : 'Your browser does not support video playback.'}
                </video>
              </div>

              {/* 视频信息 */}
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">
                  {language === 'zh' ? '提示词' : 'Prompt'}
                </h3>
                <p className="text-gray-300 text-sm">
                  {selectedVideo.prompt}
                </p>

                {selectedVideo.negative_prompt && (
                  <>
                    <h3 className="text-white font-medium mt-3 mb-2">
                      {language === 'zh' ? '负面提示词' : 'Negative Prompt'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {selectedVideo.negative_prompt}
                    </p>
                  </>
                )}

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-400">
                  <span>{selectedVideo.duration}s</span>
                  <span>{selectedVideo.resolution}</span>
                  <span>{selectedVideo.aspect_ratio}</span>
                  <span>
                    {selectedVideo.credits_used}{language === 'zh' ? '积分' : ' credits'}
                  </span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 flex-wrap">
                {/* 🔥 老王新增：分享按钮 */}
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => {
                    setIsPreviewOpen(false)
                    handleOpenShare(selectedVideo)
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '分享' : 'Share'}
                </Button>

                {/* 🔥 老王新增：延长按钮（仅720p视频显示） */}
                {canExtendVideo(selectedVideo) && (
                  <Button
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                    onClick={() => {
                      setIsPreviewOpen(false)
                      handleOpenExtend(selectedVideo)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '延长视频 (+7秒)' : 'Extend (+7s)'}
                  </Button>
                )}

                <Button
                  className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white"
                  onClick={() => handleDownload(selectedVideo)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '下载视频' : 'Download Video'}
                </Button>
                <Button
                  variant="outline"
                  className="border-red-400 text-red-400 hover:bg-red-500/20"
                  onClick={() => {
                    setIsPreviewOpen(false)
                    handleDelete(selectedVideo)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '删除' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🔥 老王新增：视频分享Modal */}
      {shareVideoId && (
        <VideoShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false)
            setShareVideoId(null)
          }}
          videoId={shareVideoId}
          videoPrompt={shareVideoPrompt}
          onSuccess={() => {
            addToast(
              language === 'zh' ? '视频已提交审核！' : 'Video submitted for review!',
              'success'
            )
          }}
        />
      )}

      {/* 🔥 老王新增：视频延长Dialog */}
      {extendVideo && (
        <VideoExtendDialog
          open={isExtendDialogOpen}
          onOpenChange={setIsExtendDialogOpen}
          videoId={extendVideo.id}
          currentDuration={extendVideo.duration}
          resolution={extendVideo.resolution}
          prompt={extendVideo.prompt}
          onConfirm={handleConfirmExtend}
        />
      )}

      <Footer />
    </div>
  )
}
