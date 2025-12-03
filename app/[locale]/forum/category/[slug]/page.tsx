/**
 * 🔥 老王创建：论坛分类页（Stage 2）
 * 用途：展示某个分类下的所有帖子
 * 日期：2025-11-25
 * 优化点：
 * - 基于论坛首页代码改造（DRY原则，复用逻辑）
 * - 从动态路由获取分类slug（而非query参数）
 * - 不显示分类列表和统计卡片（已在具体分类中）
 * - 使用 ForumFilterBar（替换原始select筛选）
 * - 使用 ForumPagination（智能分页）
 * - 使用 ForumBreadcrumb（面包屑导航，自动生成分类路径）
 * - 优化布局和响应式设计
 *
 * Features:
 * - 显示当前分类信息（标题、描述）
 * - 显示该分类下的帖子列表（支持分页、筛选、排序）
 * - 显示侧边栏（分类导航、热门标签）
 * - 面包屑导航（首页 → 论坛 → 分类名）
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

export default async function CategoryPage({
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
  const [category, setCategory] = useState<ForumCategory | null>(null)
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [pagination, setPagination] = useState<PaginatedResponse<ForumThread>['pagination'] | null>(null)
  const [popularTags, setPopularTags] = useState<ForumTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // URL参数
  const tagSlug = searchParams.get('tag_slug') || ''
  const searchQuery = searchParams.get('q')
  const sort = (searchParams.get('sort') || 'latest') as 'latest' | 'hot' | 'top' | 'unanswered'
  const page = parseInt(searchParams.get('page') || '1')

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // 并行获取分类列表和当前分类
        const [categoriesRes, categoryRes] = await Promise.all([
          fetch('/api/forum/categories'),
          fetch(`/api/forum/categories/${params.slug}`)
        ])

        // 处理分类列表
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.success ? categoriesData.data : categoriesData)
        }

        // 处理当前分类
        if (categoryRes.ok) {
          const categoryData = await categoryRes.json()
          const currentCategory = categoryData.success ? categoryData.data : categoryData
          setCategory(currentCategory)

          // 如果有搜索查询，使用搜索API
          if (searchQuery && searchQuery.trim().length >= 2) {
            const searchParams: any = {
              q: searchQuery.trim(),
              page: page.toString(),
              limit: '20',
              sort,
              category_id: currentCategory.id
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
            // 正常获取该分类下的帖子列表
            const params: GetThreadsParams = {
              page,
              limit: 20,
              sort,
              category_id: currentCategory.id
            }

            if (tagSlug) {
              params.tag_slug = tagSlug
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
          throw new Error('Category not found')
        }

        // 获取热门标签
        const tagsRes = await fetch('/api/forum/tags?limit=10')
        const tagsData = await tagsRes.json()

        if (tagsData.success) {
          setPopularTags(tagsData.data)
        }

      } catch (err: any) {
        console.error('❌ 获取分类数据失败:', err)
        setError(err.message || 'Failed to load category data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.slug, tagSlug, searchQuery, sort, page])

  // 当前标签对象
  const currentTag = tagSlug
    ? popularTags.find((tag) => tag.slug === tagSlug)
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

  // 错误状态（分类不存在）
  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <ForumBreadcrumb />
        </div>
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4 font-medium">
            {error || t("categoryPage.notFound")}
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
          category={category}
          tag={currentTag}
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
                : currentTag
                  ? currentTag.name // 🔥 老王修复：forum_tags表没有name_en字段，直接用name
                  : (locale === 'zh' ? category.name : (category.name_en || category.name))
              }
            </h1>
            <p className="mt-2 text-muted-foreground">
              {searchQuery
                ? t("categoryPage.searchInCategory", {
                    query: searchQuery,
                    category: locale === 'zh' ? category.name : (category.name_en || category.name)
                  })
                : (locale === 'zh' ? category.description : (category.description_en || category.description))
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
                    ? t("categoryPage.noThreadsFound")
                    : t("categoryPage.noThreadsInCategory")}
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
            currentCategoryId={category.id}
            currentTagSlug={tagSlug || undefined}
          />
        </aside>
      </div>
    </div>
  )
}
