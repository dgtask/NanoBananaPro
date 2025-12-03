/**
 * 🔥 老王重写：创建帖子页面（Stage 2）
 * 用途：用户创建新帖子
 * 日期：2025-11-25
 * 优化点：
 * - 使用 ForumThreadForm 组件（替换所有手动表单代码）
 * - 使用 ForumBreadcrumb 组件（替换简陋的"返回论坛"按钮）
 * - 删除手动验证逻辑（ForumThreadForm内置验证）
 * - 删除手动标签选择UI（使用ForumTagSelector组件）
 * - 删除手动分类选择UI（ForumThreadForm内置）
 * - 代码行数从365行减少到约100行（DRY原则）
 *
 * Features:
 * - 帖子创建表单（ForumThreadForm组件）
 * - 标题验证（3-200字符）
 * - 内容验证（20-10000字符）
 * - Markdown编辑器（支持图片上传）
 * - 分类选择（下拉菜单）
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
import { ForumThreadForm } from "@/components/forum/thread-form"
import { ForumBreadcrumb } from "@/components/forum/breadcrumb"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { ForumCategory, ForumTag, CreateThreadRequest, UpdateThreadRequest } from "@/types/forum"

export default async function NewThreadPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const router = useRouter()
  const t = useTranslations('forum')  // 🔥 老王迁移：使用forum命名空间
  const locale = useLocale()  // 🔥 老王迁移：获取当前语言

  // 状态管理
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [tags, setTags] = useState<ForumTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取分类和标签列表
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // 并行获取分类和标签
        const [categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/forum/categories'),
          fetch('/api/forum/tags?limit=50')
        ])

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.success ? categoriesData.data : categoriesData)
        }

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
  }, [])

  // 提交处理 - 🔥 老王修复：类型签名兼容ThreadForm组件要求
  const handleSubmit = async (data: CreateThreadRequest | UpdateThreadRequest) => {
    // 在new页面，data一定是CreateThreadRequest类型
    if (!('category_id' in data)) {
      throw new Error('category_id is required for creating threads')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create thread')
      }

      // 成功：跳转到新帖子详情页
      router.push(`/forum/threads/${result.data.slug}`)

    } catch (err: any) {
      console.error('❌ 创建帖子失败:', err)
      setError(err.message || t("createFailed"))
      setIsSubmitting(false)
    }
  }

  // 取消处理
  const handleCancel = () => {
    router.push('/forum')
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

  // 错误状态
  if (error && categories.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <ForumBreadcrumb
            customPath={[
              { label: '发表新帖', label_en: 'Create New Thread' }
            ]}
          />
        </div>
        <Card className="p-8 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-muted-foreground">
            {t("failedLoadCategories")}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 面包屑导航 */}
      <div className="mb-6">
        <ForumBreadcrumb
          customPath={[
            { label: '发表新帖', label_en: 'Create New Thread' }
          ]}
        />
      </div>

      {/* 页头 */}
      <h1 className="text-3xl font-bold mb-6">
        {t("createNew")}
      </h1>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-950/50 dark:text-red-200">
          <p className="font-medium">{t("createFailed")}</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 创建帖子表单（使用ForumThreadForm组件） */}
      <ForumThreadForm
        mode="create"
        categories={categories}
        tags={tags}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
