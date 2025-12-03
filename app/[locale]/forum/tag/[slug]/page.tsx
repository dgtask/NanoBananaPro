/**
 * 🔥 老王创建：论坛标签页（Stage 2）
 * 用途：展示某个标签下的所有帖子
 * 日期：2025-11-25
 * 优化点：
 * - 基于分类页代码改造（DRY原则，复用逻辑）
 * - 从动态路由获取标签slug（而非query参数）
 * - 不显示分类列表和统计卡片（已在具体标签中）
 * - 使用 ForumFilterBar（替换原始select筛选）
 * - 使用 ForumPagination（智能分页）
 * - 使用 ForumBreadcrumb（面包屑导航，自动生成标签路径）
 * - 优化布局和响应式设计
 *
 * Features:
 * - 显示当前标签信息（标题、描述）
 * - 显示该标签下的帖子列表（支持分页、筛选、排序）
 * - 显示侧边栏（分类导航、热门标签）
 * - 面包屑导航（首页 → 论坛 → 标签名）
 * - 创建新帖子按钮
 * - 双语支持
 * - 响应式布局
 */

"use client"

import { useState, useEffect } from "react"
import { setRequestLocale } from 'next-intl/server'
import { useSearchParams } from "next/navigation"
import { useTranslations, useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { PlusCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import {
  ForumThreadList,
  ForumSidebar,
} from "@/components/forum"
import { ForumSearchBar } from "@/components/forum/search-bar"
import { ForumFilterBar } from "@/components/forum/filter-bar"
import { ForumPagination } from "@/components/forum/pagination"
import { ForumBreadcrumb } from "@/components/forum/breadcrumb"
import type {
  ForumCategory,
  ForumThread,
  ForumTag,
  PaginatedResponse,
  GetThreadsParams,
} from "@/types/forum"

export default async function TagPage({
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

  const t = useTranslations('forum')  // 🔥 老王迁移：使用forum命名空间
  const locale = useLocale()  // 🔥 老王迁移：获取当前语言
  const searchParams = useSearchParams()

  // 状态管理
  const [tag, setTag] = useState<ForumTag | null>(null)
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [pagination, setPagination] = useState<PaginatedResponse<ForumThread>['pagination'] | null>(null)
  const [popularTags, setPopularTags] = useState<ForumTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // URL参数
  const categoryId = searchParams.get('category_id') || ''
  const searchQuery = searchParams.get('q')
  const sort = (searchParams.get('sort') || 'latest') as 'latest' | 'hot' | 'top' | 'unanswered'
  const page = parseInt(searchParams.get('page') || '1')

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // 并行获取分类列表、热门标签和当前标签详情
        const [categoriesRes, tagsRes, tagRes] = await Promise.all([
          fetch('/api/forum/categories'),
          fetch('/api/forum/tags?limit=10'),
          fetch(`/api/forum/tags/${params.slug}`)
        ])

        // 处理分类列表
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.success ? categoriesData.data : categoriesData)
        }

        // 处理热门标签列表
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json()
          setPopularTags(tagsData.success ? tagsData.data : tagsData)
        }

        // 处理当前标签
        if (tagRes.ok) {
          const tagData = await tagRes.json()
          const currentTag = tagData.success ? tagData.data : tagData
          setTag(currentTag)

          // 如果有搜索查询，使用搜索API
          if (searchQuery && searchQuery.trim().length >= 2) {
            const searchParams: any = {
              q: searchQuery.trim(),
              page: page.toString(),
              limit: '20',
              sort,
              tag_slug: currentTag.slug
            }

            if (categoryId) {
              searchParams.category_id = categoryId
            }

            const searchRes = await fetch(
              '/api/forum/search?' + new URLSearchParams(searchParams)
            )
            const searchData = await searchRes.json()

            if (searchData.success) {
              setThreads(searchData.data)
              setPagination(searchData.pagination)
            }
          } else {
            // 正常获取该标签下的帖子列表
            const params: GetThreadsParams = {
              page,
              limit: 20,
              sort,
              tag_slug: currentTag.slug
            }

            if (categoryId) {
              params.category_id = categoryId
            }

            // 获取帖子列表
            const threadsRes = await fetch(
              '/api/forum/threads?' + new URLSearchParams(params as any)
            )
            const threadsData = await threadsRes.json()

            if (threadsData.success) {
              setThreads(threadsData.data.data)
              setPagination(threadsData.data.pagination)
            }
          }
        } else {
          throw new Error('Tag not found')
        }

      } catch (err: any) {
        console.error('❌ 获取标签数据失败:', err)
        setError(err.message || 'Failed to load tag data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.slug, categoryId, searchQuery, sort, page])

  // 当前分类对象
  const currentCategory = categoryId
    ? categories.find((cat) => cat.id === categoryId)
    : undefined

  // 骨架屏加载状态
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-5 w-96 mb-4" />
        <Skeleton className="h-12 w-full mb-6" />
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <Skeleton className="h-12" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  // 错误状态（标签不存在）
  if (error || !tag) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <ForumBreadcrumb />
        </div>
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4 font-medium">
            {error || t("tagPage.notFound")}
          </p>
          <Link href="/forum">
            <Button variant="outline">
              {t("backToForum")}
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 面包屑导航 */}
      <div className="mb-4">
        <ForumBreadcrumb
          category={currentCategory}
          tag={tag}
          searchQuery={searchQuery || undefined}
        />
      </div>

      {/* 页头 */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {searchQuery
                ? t("searchResults")
                : currentCategory
                  ? (locale === 'zh' ? currentCategory.name : (currentCategory.name_en || currentCategory.name))
                  : tag.name // 🔥 老王修复：forum_tags表没有name_en字段，直接用name
              }
            </h1>
            <p className="mt-2 text-muted-foreground">
              {searchQuery
                ? t("tagPage.searchInTag", { query: searchQuery, tag: tag.name })
                : t("tagPage.allTaggedWith", { tag: tag.name })
              }
            </p>
          </div>

          <Button asChild>
            <Link href="/forum/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("newThread")}
            </Link>
          </Button>
        </div>

        {/* 搜索栏 */}
        <div className="mt-4">
          <ForumSearchBar />
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-950/50 dark:text-red-200">
          <p className="font-medium">{t("loadFailed")}</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* 左侧：帖子列表 */}
        <div className="min-w-0">
          {/* 筛选和排序栏 */}
          <div className="mb-4">
            <ForumFilterBar
              categories={categories}
              tags={popularTags}
              showStatusFilter={false}
            />
          </div>

          {/* 帖子列表 - 🔥 老王修复：ForumThreadList需要pagination和onPageChange */}
          {pagination ? (
            threads.length > 0 ? (
              <ForumThreadList
                threads={threads}
                pagination={pagination}
                onPageChange={(page) => {
                  const params = new URLSearchParams(window.location.search)
                  params.set('page', page.toString())
                  window.location.href = `${window.location.pathname}?${params.toString()}`
                }}
              />
            ) : (
              <div className="text-center py-12 rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? t("tagPage.noThreadsFound")
                    : t("tagPage.noThreadsWithTag")}
                </p>
                {!searchQuery && (
                  <Button asChild className="mt-4">
                    <Link href="/forum/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t("createFirst")}
                    </Link>
                  </Button>
                )}
              </div>
            )
          ) : null}
        </div>

        {/* 右侧：侧边栏 */}
        <aside className="hidden lg:block">
          <ForumSidebar
            categories={categories}
            popularTags={popularTags}
            currentCategoryId={categoryId || undefined}
            currentTagSlug={tag.slug}
          />
        </aside>
      </div>
    </div>
  )
}
