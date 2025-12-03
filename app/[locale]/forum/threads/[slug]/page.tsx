"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useTranslations, useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import { useAuth } from "@/lib/hooks/use-auth"
import { formatRelativeTime } from "@/lib/forum-utils"
import { ForumReplyList } from "@/components/forum/reply-list"
import { ReportDialog } from "@/components/forum/report-dialog"
// 🔥 老王性能优化：动态导入 MarkdownPreview，避免首屏加载1.5MB的highlight.js
const MarkdownPreview = dynamic(() => import("@/components/forum/markdown-preview").then(m => ({ default: m.MarkdownPreview })), {
  loading: () => <div className="animate-pulse h-32 bg-muted rounded" />,
  ssr: true,
})
import { ForumVoteButtons } from "@/components/forum/vote-buttons"
import { ForumBreadcrumb } from "@/components/forum/breadcrumb"
import { ForumModeratorActions } from "@/components/forum/moderator-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Eye,
  MessageSquare,
  Pin,
  Star,
  Lock,
  Flag,
  Edit,
  Trash2
} from "lucide-react"
import Link from "next/link"
import type { ForumThread, ForumReply } from "@/types/forum"

/**
 * 🔥 老王优化：论坛帖子详情页（Stage 2）
 * 用途：显示帖子完整内容和回复列表
 * 日期：2025-11-25
 * 优化点：
 * - 集成 ForumVoteButtons（替换原始手动投票按钮，优化UI体验）
 * - 集成 ForumBreadcrumb（替换简陋的"返回论坛"按钮，显示完整导航路径）
 * - 集成 ForumModeratorActions（管理员操作：置顶/精华/锁定/归档/删除）
 * - 删除手动投票逻辑代码，改用ForumVoteButtons的optimistic UI
 * - 删除isVoting状态（ForumVoteButtons自己管理loading状态）
 *
 * Features:
 * - 显示帖子完整内容（Markdown 渲染）
 * - 投票功能（ForumVoteButtons组件，支持optimistic UI）
 * - 回复列表和发布回复
 * - 编辑和删除帖子（仅作者）
 * - 举报功能
 * - 最佳答案标记
 * - 面包屑导航（ForumBreadcrumb组件）
 * - 管理员操作（ForumModeratorActions组件）
 * - SEO 优化
 * - 响应式设计
 */

export default function ThreadDetailPage({
  params
}: {
  params: { slug: string }
}) {
  const router = useRouter()
  const t = useTranslations('forum')  // 🔥 老王迁移：使用forum命名空间
  const locale = useLocale()  // 🔥 老王迁移：获取当前语言
  const { user, userId } = useAuth()
  const [thread, setThread] = useState<ForumThread | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 举报对话框状态
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<{
    type: "thread" | "reply"
    id: string
  } | null>(null)

  // 获取帖子详情
  useEffect(() => {
    const fetchThread = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // 获取帖子详情
        const threadRes = await fetch(`/api/forum/threads/${params.slug}`)
        if (!threadRes.ok) {
          throw new Error('Failed to fetch thread')
        }
        const threadData = await threadRes.json()
        setThread(threadData)

        // 获取回复列表
        const repliesRes = await fetch(
          `/api/forum/threads/${threadData.id}/replies?page=1&page_size=50`
        )
        if (!repliesRes.ok) {
          throw new Error('Failed to fetch replies')
        }
        const repliesData = await repliesRes.json()
        setReplies(repliesData.data || [])
      } catch (err) {
        setError(t("threadDetail.loadFailed"))  // 🔥 老王迁移：使用翻译key
      } finally {
        setIsLoading(false)
      }
    }

    fetchThread()
  }, [params.slug])

  const handleReplyVote = async (replyId: string, voteType: 'up' | 'down') => {
    try {
      const res = await fetch('/api/forum/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'reply',
          target_id: replyId,
          vote_type: voteType
        })
      })

      if (res.ok) {
        // 更新回复的投票数 - 🔥 老王修复：字段名应为upvote_count/downvote_count
        setReplies((prev) =>
          prev.map((reply) =>
            reply.id === replyId
              ? {
                  ...reply,
                  upvote_count:
                    voteType === 'up' ? (reply.upvote_count || 0) + 1 : reply.upvote_count,
                  downvote_count:
                    voteType === 'down'
                      ? (reply.downvote_count || 0) + 1
                      : reply.downvote_count
                }
              : reply
          )
        )
      }
    } catch (err) {
      console.error('Vote failed:', err)
    }
  }

  const handleMarkBest = async (replyId: string) => {
    if (!thread) return

    try {
      const res = await fetch(`/api/forum/threads/${thread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ best_answer_id: replyId })
      })

      if (res.ok) {
        setThread((prev) =>
          prev ? { ...prev, best_answer_id: replyId } : null
        )
      }
    } catch (err) {
      console.error('Mark best failed:', err)
    }
  }

  const handleReport = (targetId: string, targetType: "thread" | "reply" = "reply") => {
    // 打开举报对话框
    setReportTarget({ type: targetType, id: targetId })
    setIsReportDialogOpen(true)
  }

  const handleReportSuccess = () => {
    // 举报成功后的回调（可选：刷新数据或显示提示）
    // 这里可以选择重新获取帖子数据，或者只是显示成功提示
  }

  const handleDeleteThread = async () => {
    if (!thread || !userId || userId !== thread.author?.id) return

    if (!confirm(t("threadDetail.confirmDelete"))) return  // 🔥 老王迁移：使用翻译key

    setIsDeleting(true)

    try {
      const res = await fetch(`/api/forum/threads/${thread.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        // 跳转回论坛首页
        router.push('/forum')
      } else {
        throw new Error('Failed to delete thread')
      }
    } catch (err) {
      console.error('Delete failed:', err)
      alert(t("threadDetail.deleteFailed"))  // 🔥 老王迁移：使用翻译key
      setIsDeleting(false)
    }
  }

  const handlePostReply = async (content: string, parentReplyId?: string) => {
    if (!thread) return

    try {
      const res = await fetch(`/api/forum/threads/${thread.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          parent_reply_id: parentReplyId
        })
      })

      if (res.ok) {
        const newReply = await res.json()
        setReplies((prev) => [...prev, newReply])
        // 更新帖子回复数
        setThread((prev) =>
          prev ? { ...prev, reply_count: (prev.reply_count || 0) + 1 } : null
        )
      }
    } catch (err) {
      throw err
    }
  }

  const handleEditReply = async (replyId: string, newContent: string) => {
    try {
      const res = await fetch(`/api/forum/replies/${replyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      })

      if (res.ok) {
        const updatedReply = await res.json()
        setReplies((prev) =>
          prev.map((reply) =>
            reply.id === replyId
              ? { ...reply, content: updatedReply.content, updated_at: updatedReply.updated_at }
              : reply
          )
        )
      } else {
        throw new Error('Failed to update reply')
      }
    } catch (err) {
      console.error('Edit reply failed:', err)
      throw err
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    try {
      const res = await fetch(`/api/forum/replies/${replyId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setReplies((prev) => prev.filter((reply) => reply.id !== replyId))
        // 更新帖子回复数
        setThread((prev) =>
          prev && prev.reply_count
            ? { ...prev, reply_count: prev.reply_count - 1 }
            : prev
        )
      } else {
        throw new Error('Failed to delete reply')
      }
    } catch (err) {
      console.error('Delete reply failed:', err)
      throw err
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card className="p-6 mb-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="p-8 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Link href="/forum">
            <Button variant="outline">
              {t("threadDetail.returnToForum")}
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const getAuthorInitials = () => {
    // 🔥 老王修复：author类型没有username字段，改用display_name或email
    const name = thread.author?.display_name || thread.author?.email
    if (!name) return "?"
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 面包屑导航 */}
      <div className="mb-6">
        <ForumBreadcrumb thread={thread} />
      </div>

      {/* 帖子内容 */}
      <Card className="p-6 mb-6">
        {/* 帖子标题 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {thread.is_pinned && (
              <Pin className="h-4 w-4 text-primary" />
            )}
            {thread.best_answer_id && (
              <Star className="h-4 w-4 text-green-600 fill-current" />
            )}
            {thread.is_locked && (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <h1 className="text-3xl font-bold mb-3">{thread.title}</h1>
          <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
            <Badge variant="secondary">{thread.category?.name}</Badge>
            <span>{formatRelativeTime(thread.created_at, locale)}</span>
            {thread.updated_at && thread.updated_at !== thread.created_at && (
              <span>({t("threadDetail.edited")})</span>
            )}
          </div>
        </div>

        {/* 作者信息 */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b">
          <Avatar className="h-12 w-12">
            <AvatarImage src={thread.author?.avatar_url} />
            <AvatarFallback>{getAuthorInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">
              {/* 🔥 老王修复：author类型没有username字段，改用display_name或email */}
              {thread.author?.display_name || thread.author?.email || t("threadDetail.anonymous")}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("threadDetail.threadAuthor")}
            </div>
          </div>
        </div>

        {/* 帖子内容（Markdown 渲染） */}
        <div className="mb-6">
          <MarkdownPreview content={thread.content} />
        </div>

        {/* 统计和操作 */}
        <div className="flex items-center gap-4 pt-6 border-t flex-wrap">
          {/* 投票按钮（使用ForumVoteButtons组件）- 🔥 老王修复：组件实际用snake_case prop名 */}
          <ForumVoteButtons
            target_type="thread"
            target_id={thread.id}
            upvote_count={thread.upvote_count || 0}
            downvote_count={thread.downvote_count || 0}
            user_vote={thread.user_vote}
            onVoteChange={(newVote, upvotes, downvotes) => {
              setThread((prev) =>
                prev
                  ? {
                      ...prev,
                      upvote_count: upvotes,
                      downvote_count: downvotes,
                      user_vote: newVote
                    }
                  : null
              )
            }}
          />

          {/* 统计 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {thread.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {thread.reply_count || 0}
            </span>
          </div>

          {/* 编辑和删除按钮（仅作者可见） */}
          {userId === thread.author?.id && (
            <div className="flex items-center gap-2 ml-auto">
              <Link href={`/forum/threads/${params.slug}/edit`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  {t("threadDetail.edit")}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteThread}
                disabled={isDeleting}
                className="gap-2 text-destructive hover:text-destructive/90 border-destructive/50 hover:border-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {t("threadDetail.delete")}
              </Button>
            </div>
          )}

          {/* 举报 */}
          {userId && userId !== thread.author?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReport(thread.id, "thread")}
              className="text-destructive hover:text-destructive/90"
            >
              <Flag className="h-4 w-4 mr-1" />
              {t("threadDetail.report")}
            </Button>
          )}

          {/* 管理员操作（仅管理员可见） */}
          {user?.role === 'admin' || user?.role === 'moderator' ? (
            <div className="ml-auto">
              <ForumModeratorActions
                target_type="thread"
                target_id={thread.id}
                is_pinned={thread.is_pinned}
                is_featured={thread.is_featured}
                is_locked={thread.is_locked}
                status={thread.status}
                onAction={(action, success) => {
                  if (success) {
                    // 刷新页面数据
                    window.location.reload()
                  }
                }}
              />
            </div>
          ) : null}
        </div>
      </Card>

      {/* 回复列表 */}
      <ForumReplyList
        threadId={thread.id}
        threadAuthorId={thread.author?.id || ''}
        currentUserId={userId}
        replies={replies}
        bestAnswerId={thread.best_answer_id}
        totalCount={thread.reply_count || 0}
        onVote={handleReplyVote}
        onMarkBest={handleMarkBest}
        onReport={(replyId) => handleReport(replyId, "reply")}
        onPostReply={handlePostReply}
        onEditReply={handleEditReply}
        onDeleteReply={handleDeleteReply}
      />

      {/* 举报对话框 */}
      {reportTarget && (
        <ReportDialog
          open={isReportDialogOpen}
          onOpenChange={setIsReportDialogOpen}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onReportSuccess={handleReportSuccess}
        />
      )}
    </div>
  )
}
