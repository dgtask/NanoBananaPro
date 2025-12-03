/**
 * 🔥 老王的Showcase审核管理页面
 * 用途: 管理员审核用户提交的showcase推荐
 * 老王警告: 审核要认真，别tm放水让垃圾图片通过！
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  User,
  Calendar,
  Tag
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// 审核状态类型
type ReviewStatus = 'pending' | 'approved' | 'rejected'

// Showcase提交接口
interface ShowcaseSubmission {
  id: string
  generation_history_id: string
  image_index: number
  image_url: string
  title: string
  description: string | null
  category: string
  tags: string[] | null
  status: ReviewStatus // 🔥 老王修复：API返回的字段名是status
  review_status?: ReviewStatus // 兼容字段
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  user_id: string
  user_email?: string
  creator_email?: string // 🔥 老王修复：API返回的字段名
  creator_name?: string
}

export default async function ShowcaseReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const router = useRouter()
  const [submissions, setSubmissions] = useState<ShowcaseSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<ShowcaseSubmission | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'all'>('pending')

  // 获取提交列表
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const url = filterStatus === 'all'
        ? '/api/admin/showcase/submissions'
        : `/api/admin/showcase/submissions?status=${filterStatus}`

      const response = await fetch(url, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '获取提交列表失败')
      }

      // 🔥 老王修复：适配API返回的数据格式
      const submissions = result.data?.submissions || []
      setSubmissions(submissions)
    } catch (err) {
      console.error('❌ 获取提交列表失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  // 处理审核
  const handleReview = async () => {
    if (!selectedSubmission) return

    try {
      setProcessing(true)

      const response = await fetch('/api/admin/showcase/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          submission_id: selectedSubmission.id,
          action: reviewAction,
          rejection_reason: reviewAction === 'reject' ? rejectionReason : undefined
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '审核失败')
      }

      // 刷新列表
      await fetchSubmissions()

      // 关闭对话框
      setReviewDialogOpen(false)
      setSelectedSubmission(null)
      setRejectionReason('')

      alert(reviewAction === 'approve' ? '✅ 审核通过！' : '❌ 已拒绝该提交')
    } catch (err) {
      console.error('❌ 审核失败:', err)
      alert(err instanceof Error ? err.message : '审核失败')
    } finally {
      setProcessing(false)
    }
  }

  // 打开审核对话框
  const openReviewDialog = (submission: ShowcaseSubmission, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission)
    setReviewAction(action)
    setReviewDialogOpen(true)
  }

  // 初始化加载
  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  // 状态徽章样式
  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" />
          待审核
        </Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          已通过
        </Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
          <XCircle className="w-3 h-3 mr-1" />
          已拒绝
        </Badge>
    }
  }

  // 分类徽章
  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; emoji: string }> = {
      portrait: { label: '人像', emoji: '👤' },
      landscape: { label: '风景', emoji: '🏞️' },
      product: { label: '产品', emoji: '📦' },
      creative: { label: '创意', emoji: '🎨' },
      anime: { label: '动漫', emoji: '🎭' }
    }
    const cat = categoryMap[category] || { label: category, emoji: '🖼️' }
    return <Badge variant="secondary">{cat.emoji} {cat.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-[#D97706]" />
            Showcase 审核管理
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            审核用户提交的作品推荐，确保展示内容质量
          </p>
        </div>

        {/* 筛选和操作栏 */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              全部
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('pending')}
              size="sm"
            >
              <Clock className="w-4 h-4 mr-1" />
              待审核
            </Button>
            <Button
              variant={filterStatus === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('approved')}
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              已通过
            </Button>
            <Button
              variant={filterStatus === 'rejected' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('rejected')}
              size="sm"
            >
              <XCircle className="w-4 h-4 mr-1" />
              已拒绝
            </Button>
          </div>

          <div className="ml-auto">
            <Button
              variant="outline"
              onClick={fetchSubmissions}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              刷新
            </Button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <Card className="mb-6 border-red-500/50 bg-red-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-red-600">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">加载失败</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 提交列表 */}
        {loading && submissions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center text-slate-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>暂无提交记录</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission) => (
              <Card key={submission.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{submission.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(submission.created_at).toLocaleDateString('zh-CN')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(submission.status || submission.review_status || 'pending')}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* 图片预览 */}
                  <div
                    className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group"
                    onClick={() => {
                      setSelectedSubmission(submission)
                      setShowPreview(true)
                    }}
                  >
                    <Image
                      src={submission.image_url}
                      alt={submission.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* 分类和标签 */}
                  <div className="flex flex-wrap gap-2">
                    {getCategoryBadge(submission.category)}
                    {submission.tags && submission.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* 描述 */}
                  {submission.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {submission.description}
                    </p>
                  )}

                  {/* 用户信息 */}
                  {(submission.creator_email || submission.user_email) && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <User className="w-4 h-4" />
                      {submission.creator_email || submission.user_email}
                    </div>
                  )}

                  {/* 拒绝原因 */}
                  {(submission.status === 'rejected' || submission.review_status === 'rejected') && submission.rejection_reason && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-600 font-medium mb-1">拒绝原因：</p>
                      <p className="text-sm text-red-600/80">{submission.rejection_reason}</p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  {(submission.status === 'pending' || submission.review_status === 'pending') && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => openReviewDialog(submission, 'approve')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        通过
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => openReviewDialog(submission, 'reject')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        拒绝
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 图片预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.title}</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.description || '暂无描述'}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
              <Image
                src={selectedSubmission.image_url}
                alt={selectedSubmission.title}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 审核对话框 */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? '确认通过审核？' : '确认拒绝提交？'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? '通过后，该作品将在案例展示页面中展示。'
                : '拒绝后，用户可以看到拒绝原因并重新提交。'}
            </DialogDescription>
          </DialogHeader>

          {reviewAction === 'reject' && (
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                拒绝原因 <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="请说明拒绝的具体原因，帮助用户改进..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={processing}
            >
              取消
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={processing || (reviewAction === 'reject' && !rejectionReason.trim())}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : reviewAction === 'approve' ? (
                <CheckCircle className="w-4 h-4 mr-1" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              {reviewAction === 'approve' ? '确认通过' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
