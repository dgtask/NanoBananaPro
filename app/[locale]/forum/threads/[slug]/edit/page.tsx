/**
 * 🔥 老王重写：编辑帖子页面（Stage 2）
 * 用途：编辑现有帖子
 * 日期：2025-11-25
 * 优化点：
 * - 使用 ForumThreadForm 组件（替换所有手动表单代码，edit模式）
 * - 使用 ForumBreadcrumb 组件（替换简陋的"返回帖子"按钮）
 * - 删除手动验证逻辑（ForumThreadForm内置验证）
 * - 删除手动标签选择UI（使用ForumTagSelector组件）
 * - 删除手动分类选择UI（ForumThreadForm内置，edit模式下禁用）
 * - 权限检查：仅作者可编辑
 * - 代码行数从409行减少到约220行（DRY原则）
 *
 * Features:
 * - 加载现有帖子数据
 * - 帖子编辑表单（ForumThreadForm组件，edit模式）
 * - 权限检查（仅作者可编辑）
 * - 标题验证（3-200字符）
 * - 内容验证（20-10000字符）
 * - Markdown编辑器（支持图片上传）
 * - 分类显示（禁用，不可修改）
 * - 标签多选（最多5个）
 * - Draft自动保存到localStorage
 * - 面包屑导航（ForumBreadcrumb组件）
 * - 双语支持
 * - 响应式设计
 */

"use client"

import { useState, useEffect } from "react"
import { setRequestLocale } from 'next-intl/server'
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import { useAuth } from "@/lib/hooks/use-auth"
import { ForumThreadForm } from "@/components/forum/thread-form"
import { ForumBreadcrumb } from "@/components/forum/breadcrumb"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import type { ForumCategory, ForumTag, ForumThread, UpdateThreadRequest } from "@/types/forum"

export default async function EditThreadPage({
  params
}: {
  params: { slug: string }
}, {
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const router = useRouter()
  const t = useTranslations('forum')  // 🔥 老王迁移：使用forum命名空间
  const locale = useLocale()  // 🔥 老王迁移：获取当前语言
  const { userId } = useAuth()

  // 状态管理
  const [thread, setThread] = useState<ForumThread | null>(null)
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [tags, setTags] = useState<ForumTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取帖子数据、分类和标签列表
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // 并行获取帖子、分类和标签
        const [threadRes, categoriesRes, tagsRes] = await Promise.all([
          fetch(`/api/forum/threads/${params.slug}`),
          fetch('/api/forum/categories'),
          fetch('/api/forum/tags?limit=50')
        ])

        // 处理帖子数据
        if (threadRes.ok) {
          const threadData = await threadRes.json()
          const threadResult = threadData.success ? threadData.data : threadData
          setThread(threadResult)

          // 权限检查：仅作者可编辑
          if (userId && threadResult.author?.id !== userId) {
            setError(t("editThread.noPermission"))  // 🔥 老王迁移：使用翻译key
          }
        } else {
          throw new Error('Thread not found')
        }

        // 处理分类数据
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.success ? categoriesData.data : categoriesData)
        }

        // 处理标签数据
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json()
          setTags(tagsData.success ? tagsData.data : tagsData)
        }

      } catch (err: any) {
        console.error('❌ 获取数据失败:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.slug, userId])

  // 提交处理
  const handleSubmit = async (data: UpdateThreadRequest) => {
    if (!thread) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/forum/threads/${thread.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update thread')
      }

      // 成功：跳转回帖子详情页
      router.push(`/forum/threads/${params.slug}`)

    } catch (err: any) {
      console.error('❌ 更新帖子失败:', err)
      setError(err.message || t("editThread.updateFailed"))  // 🔥 老王迁移：使用翻译key
      setIsSubmitting(false)
    }
  }

  // 取消处理
  const handleCancel = () => {
    router.push(`/forum/threads/${params.slug}`)
  }

  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-5 w-64 mb-6" />
        <Skeleton className="h-10 w-48 mb-6" />
        <Card className="p-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-64 w-full mb-6" />
        </Card>
      </div>
    )
  }

  // 错误状态（权限不足或帖子不存在）
  if (error || !thread) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <ForumBreadcrumb
            customPath={[
              { label: '编辑帖子', label_en: 'Edit Thread' }
            ]}
          />
        </div>
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4 font-medium">
            {error || t("editThread.notFound")}
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/forum">
              <Button variant="outline">
                {t("backToForum")}
              </Button>
            </Link>
            {thread && (
              <Link href={`/forum/threads/${params.slug}`}>
                <Button variant="outline">
                  {t("editThread.viewThread")}
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 面包屑导航 */}
      <div className="mb-6">
        <ForumBreadcrumb thread={thread} customPath={[{ label: '编辑', label_en: 'Edit' }]} />
      </div>

      {/* 页头 */}
      <h1 className="text-3xl font-bold mb-6">
        {t("editThread.title")}
      </h1>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-950/50 dark:text-red-200">
          <p className="font-medium">{t("editThread.updateFailed")}</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 编辑帖子表单（使用ForumThreadForm组件） */}
      <ForumThreadForm
        mode="edit"
        initialData={{
          id: thread.id,
          title: thread.title,
          content: thread.content,
          category_id: thread.category?.id || '',
          tag_ids: thread.tags?.map(tag => tag.id) || []
        }}
        categories={categories}
        tags={tags}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
