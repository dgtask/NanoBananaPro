/**
 * 🔥 老王优化：论坛首页（Stage 2）
 * 用途：展示论坛分类和帖子列表
 * 日期：2025-11-25
 * 优化点：
 * - 集成 ForumFilterBar（替换原始select筛选）
 * - 集成 ForumPagination（智能分页）
 * - 集成 ForumStatsCard（统计卡片）
 * - 集成 ForumBreadcrumb（面包屑导航）
 * - 优化布局和响应式设计
 * - 🔥 2025-12-01：添加Header和Footer（和其他页面保持一致）
 */

"use client"

import { useState, useEffect } from "react"
import { setRequestLocale } from 'next-intl/server'
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { useTranslations, useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import {
  ForumCategoryList,
  ForumThreadList,
  ForumSidebar,
} from "@/components/forum"
import { ForumSearchBar } from "@/components/forum/search-bar"
import { ForumFilterBar } from "@/components/forum/filter-bar"
import { ForumPagination } from "@/components/forum/pagination"
import { ForumStatsCard } from "@/components/forum/stats-card"
import { ForumBreadcrumb } from "@/components/forum/breadcrumb"
import type {
  ForumCategory,
  ForumThread,
  ForumTag,
  PaginatedResponse,
  GetThreadsParams,
} from "@/types/forum"

// 🔥 老王优化：Footer动态加载（非首屏内容）
const Footer = dynamic(() => import("@/components/footer").then(m => ({ default: m.Footer })), {
  loading: () => <div className="min-h-[200px]"></div>
})

/**
 * 论坛首页
 *
 * Features:
 * - 显示分类列表
 * - 显示帖子列表（支持分页、筛选、排序）
 * - 显示侧边栏（分类导航、热门标签）
 * - 统计卡片（论坛数据概览）
 * - 面包屑导航
 * - 创建新帖子按钮
 * - 响应式布局
 */
export default async function ForumPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = useTranslations('forum')  // 🔥 老王迁移：使用forum命名空间
  const locale = useLocale()  // 🔥 老王迁移：获取当前语言（用于动态数据）
  const searchParams = useSearchParams()

  // 状态管理
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [pagination, setPagination] = useState<PaginatedResponse<ForumThread>['pagination'] | null>(null)
  const [popularTags, setPopularTags] = useState<ForumTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // URL参数
  const categoryId = searchParams.get('category_id') || ''
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
        // 获取分类列表
        const categoriesRes = await fetch('/api/forum/categories')
        const categoriesData = await categoriesRes.json()

        if (categoriesData.success) {
          setCategories(categoriesData.data)
        }

        // 如果有搜索查询，使用搜索API
        if (searchQuery && searchQuery.trim().length >= 2) {
          const searchParams: any = {
            q: searchQuery.trim(),
            page: page.toString(),
            limit: '20',
            sort
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
          // 正常获取帖子列表
          const params: GetThreadsParams = {
            page,
            limit: 20,
            sort,
          }

          if (categoryId) {
            params.category_id = categoryId
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

        // 获取热门标签
        const tagsRes = await fetch('/api/forum/tags?limit=10')
        const tagsData = await tagsRes.json()

        if (tagsData.success) {
          setPopularTags(tagsData.data)
        }

      } catch (err: any) {
        console.error('❌ 获取论坛数据失败:', err)
        setError(err.message || 'Failed to load forum data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categoryId, tagSlug, searchQuery, sort, page])

  // 当前分类对象
  const currentCategory = categoryId
    ? categories.find((cat) => cat.id === categoryId)
    : undefined

  // 当前标签对象
  const currentTag = tagSlug
    ? popularTags.find((tag) => tag.slug === tagSlug)
    : undefined

  return (
    <main className="min-h-screen">
      {/* 🔥 老王修复：添加Header（fixed定位） */}
      <Header />

      {/* 🔥 老王修复：主内容区域添加pt-16，避免被fixed Header遮挡 */}
      <div className="container mx-auto px-4 py-6 pt-24">
        {/* 面包屑导航 */}
        <div className="mb-4">
          <ForumBreadcrumb
            category={currentCategory}
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
                : currentCategory
                  ? (locale === 'zh' ? currentCategory.name : (currentCategory.name_en || currentCategory.name))
                  : currentTag
                    ? currentTag.name // 🔥 老王修复：forum_tags表没有name_en字段，直接用name
                    : t("communityForum")
              }
            </h1>
            <p className="mt-2 text-muted-foreground">
              {searchQuery
                ? t("resultsFor", { query: searchQuery })
                : currentCategory
                  ? (locale === 'zh' ? currentCategory.description : (currentCategory.description_en || currentCategory.description))
                  : t("shareExperience")
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

      {/* 统计卡片（仅在首页显示） */}
      {!categoryId && !tagSlug && !searchQuery && (
        <div className="mb-6">
          {loading ? (
            <Skeleton className="h-40" />
          ) : (
            <ForumStatsCard />
          )}
        </div>
      )}

      {/* 分类列表（仅在非搜索状态下显示） */}
      {!categoryId && !tagSlug && !searchQuery && (
        <div className="mb-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : (
            <ForumCategoryList
              categories={categories}
              currentCategoryId={categoryId}
            />
          )}
        </div>
      )}

      {/* 主内容区域 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* 左侧：帖子列表 */}
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

          {/* 帖子列表 */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : pagination ? (
            threads.length > 0 ? (
              // 🔥 老王修复：ForumThreadList需要pagination和onPageChange
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
                  {searchQuery ? t("noThreadsForQuery") : t("noThreads")}
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
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <ForumSidebar
              categories={categories}
              popularTags={popularTags}
              currentCategoryId={categoryId}
              currentTagSlug={tagSlug || undefined}
            />
          )}
        </aside>
      </div>
      </div>

      {/* 🔥 老王修复：添加Footer */}
      <Footer />
    </main>
  )
}
