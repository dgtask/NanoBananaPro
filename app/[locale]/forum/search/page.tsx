/**
 * 🔥 老王创建：论坛搜索结果页（Stage 2）
 * 用途：展示搜索结果
 * 日期：2025-11-25
 * 优化点：
 * - 基于标签页代码改造（DRY原则，复用逻辑）
 * - 从query参数获取搜索关键词（而非动态路由）
 * - 必须有搜索查询才能显示结果
 * - 支持在特定分类/标签内搜索
 * - 使用 ForumFilterBar（替换原始select筛选）
 * - 使用 ForumPagination（智能分页）
 * - 使用 ForumBreadcrumb（面包屑导航，自动生成搜索路径）
 * - 优化布局和响应式设计
 *
 * Features:
 * - 显示搜索关键词和结果数量
 * - 显示搜索结果列表（支持分页、筛选、排序）
 * - 支持在特定分类/标签内搜索
 * - 显示侧边栏（分类导航、热门标签）
 * - 面包屑导航（首页 → 论坛 → 搜索结果）
 * - 创建新帖子按钮
 * - 双语支持
 * - 响应式布局
 */

"use client"

import { useState, useEffect } from "react"
import { setRequestLocale } from 'next-intl/server'
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslations, useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { PlusCircle, AlertCircle, Search } from "lucide-react"
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
} from "@/types/forum"

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const router = useRouter()
  const t = useTranslations('forum')  // 🔥 老王迁移：使用forum命名空间
  const locale = useLocale()  // 🔥 老王迁移：获取当前语言
  const searchParams = useSearchParams()

  // 状态管理
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [pagination, setPagination] = useState<PaginatedResponse<ForumThread>['pagination'] | null>(null)
  const [popularTags, setPopularTags] = useState<ForumTag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // URL参数
  const searchQuery = searchParams.get('q') || ''
  const categoryId = searchParams.get('category_id') || ''
  const tagSlug = searchParams.get('tag_slug') || ''
  const sort = (searchParams.get('sort') || 'latest') as 'latest' | 'hot' | 'top' | 'unanswered'
  const page = parseInt(searchParams.get('page') || '1')

  // 获取基础数据（分类和标签列表）
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        // 并行获取分类列表和热门标签
        const [categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/forum/categories'),
          fetch('/api/forum/tags?limit=10')
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

      } catch (err: any) {
        console.error('❌ 获取基础数据失败:', err)
      }
    }

    fetchBaseData()
  }, [])

  // 获取搜索结果
  useEffect(() => {
    // 如果没有搜索查询，不执行搜索
    if (!searchQuery || searchQuery.trim().length < 2) {
      setThreads([])
      setPagination(null)
      setLoading(false)
      return
    }

    const fetchSearchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const params: any = {
          q: searchQuery.trim(),
          page: page.toString(),
          limit: '20',
          sort
        }

        if (categoryId) {
          params.category_id = categoryId
        }

        if (tagSlug) {
          params.tag_slug = tagSlug
        }

        const searchRes = await fetch(
          '/api/forum/search?' + new URLSearchParams(params)
        )
        const searchData = await searchRes.json()

        if (searchData.success) {
          setThreads(searchData.data)
          setPagination(searchData.pagination)
        } else {
          throw new Error(searchData.error || 'Failed to search')
        }

      } catch (err: any) {
        console.error('❌ 搜索失败:', err)
        setError(err.message || 'Failed to search')
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [searchQuery, categoryId, tagSlug, sort, page])

  // 当前分类对象
  const currentCategory = categoryId
    ? categories.find((cat) => cat.id === categoryId)
    : undefined

  // 当前标签对象
  const currentTag = tagSlug
    ? popularTags.find((tag) => tag.slug === tagSlug)
    : undefined

  // 没有搜索查询时的提示页面
  if (!searchQuery || searchQuery.trim().length < 2) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <ForumBreadcrumb searchQuery="" />
        </div>

        <Card className="p-8 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {t("searchForum")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t("searchHint")}
          </p>

          {/* 搜索栏 */}
          <div className="max-w-xl mx-auto">
            <ForumSearchBar />
          </div>

          <div className="mt-8">
            <Link href="/forum">
              <Button variant="outline">
                {t("backToForum")}
              </Button>
            </Link>
          </div>
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
          tag={currentTag}
          searchQuery={searchQuery}
        />
      </div>

      {/* 页头 */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {t("searchResults")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {/* 🔥 老王修复：forum_tags表没有name_en字段，标签名直接用name */}
              {/* 🔥 老王迁移：使用next-intl翻译 */}
              {currentCategory && currentTag
                ? t("searchInWithTag", {
                    query: searchQuery,
                    category: locale === 'zh' ? currentCategory.name : (currentCategory.name_en || currentCategory.name),
                    tag: currentTag.name
                  })
                : currentCategory
                  ? t("searchIn", {
                      query: searchQuery,
                      category: locale === 'zh' ? currentCategory.name : (currentCategory.name_en || currentCategory.name)
                    })
                  : currentTag
                    ? t("searchInTag", { query: searchQuery, tag: currentTag.name })
                    : t("resultsFor", { query: searchQuery })}
            </p>
            {pagination && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("foundThreads", { count: pagination.total })}
              </p>
            )}
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
          <p className="font-medium">{t("searchFailed")}</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* 左侧：搜索结果列表 */}
        <div className="min-w-0">
          {/* 筛选和排序栏 */}
          <div className="mb-4">
            {loading ? (
              <Skeleton className="h-12" />
            ) : (
              <ForumFilterBar
                categories={categories}
                tags={popularTags}
                showStatusFilter={false}
              />
            )}
          </div>

          {/* 搜索结果列表 - 🔥 老王修复：ForumThreadList需要pagination和onPageChange */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : pagination ? (
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
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {t("noResultsFor", { query: searchQuery })}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("tryOtherKeywords")}
                </p>
                <Button asChild>
                  <Link href="/forum/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t("createNewThread")}
                  </Link>
                </Button>
              </div>
            )
          ) : null}
        </div>

        {/* 右侧：侧边栏 */}
        <aside className="hidden lg:block">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <ForumSidebar
              categories={categories}
              popularTags={popularTags}
              currentCategoryId={categoryId || undefined}
              currentTagSlug={tagSlug || undefined}
            />
          )}
        </aside>
      </div>
    </div>
  )
}
