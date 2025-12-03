/**
 * 🔥 老王的用户推荐历史页面
 * 用途: 用户查看自己提交的showcase推荐历史
 * 老王警告: 数据要准确，别tm给用户看错的状态！
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Calendar,
  Tag,
  AlertCircle,
  Trash2
} from 'lucide-react'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl的useLocale
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

// 推荐状态类型
type SubmissionStatus = 'pending' | 'approved' | 'rejected'

// 推荐接口
interface Submission {
  id: string
  generation_history_id: string
  image_index: number
  image_url: string
  title: string
  description: string | null
  category: string
  tags: string[] | null
  status: SubmissionStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
}

export default async function MySubmissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const language = useLocale()  // 🔥 老王迁移：useLocale返回当前语言
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [user, setUser] = useState<any>(null)

  // 获取用户信息
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }

    getUser()
  }, [router])

  // 获取推荐列表
  const fetchSubmissions = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/showcase/my-submissions', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || language === 'zh' ? '获取推荐列表失败' : 'Failed to fetch submissions')
      }

      setSubmissions(result.data || [])
    } catch (err) {
      console.error('❌ 获取推荐列表失败:', err)
      setError(err instanceof Error ? err.message : language === 'zh' ? '未知错误' : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [user, language])

  // 删除推荐
  const handleDelete = async (id: string) => {
    if (!confirm(language === 'zh' ? '确定要删除这个推荐吗？' : 'Are you sure you want to delete this submission?')) {
      return
    }

    try {
      const response = await fetch(`/api/showcase/my-submissions?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || language === 'zh' ? '删除失败' : 'Failed to delete')
      }

      // 刷新列表
      await fetchSubmissions()

      alert(language === 'zh' ? '✅ 删除成功！' : '✅ Deleted successfully!')
    } catch (err) {
      console.error('❌ 删除失败:', err)
      alert(err instanceof Error ? err.message : language === 'zh' ? '删除失败' : 'Failed to delete')
    }
  }

  // 初始化加载
  useEffect(() => {
    if (user) {
      fetchSubmissions()
    }
  }, [user, fetchSubmissions])

  // 状态徽章样式
  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" />
          {language === 'zh' ? '审核中' : 'Pending'}
        </Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          {language === 'zh' ? '已通过' : 'Approved'}
        </Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
          <XCircle className="w-3 h-3 mr-1" />
          {language === 'zh' ? '已拒绝' : 'Rejected'}
        </Badge>
    }
  }

  // 分类徽章
  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; emoji: string }> = {
      portrait: { label: language === 'zh' ? '人像' : 'Portrait', emoji: '👤' },
      landscape: { label: language === 'zh' ? '风景' : 'Landscape', emoji: '🏞️' },
      product: { label: language === 'zh' ? '产品' : 'Product', emoji: '📦' },
      creative: { label: language === 'zh' ? '创意' : 'Creative', emoji: '🎨' },
      anime: { label: language === 'zh' ? '动漫' : 'Anime', emoji: '🎭' }
    }
    const cat = categoryMap[category] || { label: category, emoji: '🖼️' }
    return <Badge variant="secondary">{cat.emoji} {cat.label}</Badge>
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-6xl px-4 py-24">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-[#D97706]" />
            {language === 'zh' ? '我的推荐' : 'My Submissions'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'zh'
              ? '查看你提交到案例展示的作品和审核状态'
              : 'View your submitted works and review status'}
          </p>
        </div>

        {/* 操作栏 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {language === 'zh' ? `共 ${submissions.length} 个推荐` : `${submissions.length} submissions total`}
          </div>

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
            {language === 'zh' ? '刷新' : 'Refresh'}
          </Button>
        </div>

        {/* 错误提示 */}
        {error && (
          <Card className="mb-6 border-red-500/50 bg-red-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-red-600">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{language === 'zh' ? '加载失败' : 'Failed to load'}</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 推荐列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="mb-4">{language === 'zh' ? '还没有提交任何推荐' : 'No submissions yet'}</p>
              <Button onClick={() => router.push('/editor/image-edit')}>
                {language === 'zh' ? '去创作' : 'Create Now'}
              </Button>
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
                        {new Date(submission.created_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(submission.status)}
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
                      sizes="(min-width: 1024px) 300px, 50vw"
                      loading="lazy"
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

                  {/* 拒绝原因 */}
                  {submission.status === 'rejected' && submission.rejection_reason && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-600 font-medium mb-1">
                        {language === 'zh' ? '拒绝原因：' : 'Rejection reason:'}
                      </p>
                      <p className="text-sm text-red-600/80">{submission.rejection_reason}</p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-2">
                    {submission.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(submission.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {language === 'zh' ? '取消' : 'Cancel'}
                      </Button>
                    )}
                    {submission.status === 'approved' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push('/showcase')}
                      >
                        {language === 'zh' ? '在展示页查看' : 'View in Showcase'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* 图片预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.title}</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.description || (language === 'zh' ? '暂无描述' : 'No description')}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
              <Image
                src={selectedSubmission.image_url}
                alt={selectedSubmission.title}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
