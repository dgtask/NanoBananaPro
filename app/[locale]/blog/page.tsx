"use client"

/**
 * 🔥 老王的博客列表页
 * 用途: 展示所有已发布的博客文章，支持分页、筛选、搜索
 * 老王警告: 这个页面功能强大，分类筛选、标签筛选、全文搜索都有！
 */

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'
import type { BlogPostDetail, GetBlogPostsResponse } from '@/types/blog'

export default function BlogListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 1. 状态管理
  const [posts, setPosts] = useState<BlogPostDetail[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [likingPostId, setLikingPostId] = useState<string | null>(null)

  // 2. 查询参数
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = 12
  const categorySlug = searchParams.get('category')
  const tagSlug = searchParams.get('tag')
  const sort = searchParams.get('sort') || 'published_at'
  const order = searchParams.get('order') || 'desc'

  // 3. 获取文章列表
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      try {
        // 构建查询参数
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: perPage.toString(),
          status: 'published',
          sort,
          order
        })

        if (searchQuery) params.set('search', searchQuery)
        if (categorySlug) params.set('category_slug', categorySlug)
        if (tagSlug) params.set('tag_slug', tagSlug)

        const res = await fetch(`/api/blog/posts?${params}`)
        const data: GetBlogPostsResponse = await res.json()

        if (data.success && data.data) {
          setPosts(data.data.items)
          setTotal(data.data.total)
        } else {
          console.error('获取文章列表失败:', data.error)
        }
      } catch (error) {
        console.error('获取文章列表异常:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [page, searchQuery, categorySlug, tagSlug, sort, order])

  // 4. 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchQuery) {
      params.set('search', searchQuery)
    } else {
      params.delete('search')
    }
    params.set('page', '1') // 重置到第一页
    router.push(`/blog?${params}`)
  }

  // 5. 点赞处理
  const handleLike = async (postId: string) => {
    setLikingPostId(postId)
    try {
      const post = posts.find(p => p.id === postId)
      if (!post) return

      const method = post.is_liked ? 'DELETE' : 'POST'
      const res = await fetch(`/api/blog/posts/${postId}/like`, { method })
      const data = await res.json()

      if (data.success) {
        // 更新本地状态
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, is_liked: data.data.is_liked, like_count: data.data.like_count }
            : p
        ))
      } else {
        console.error('点赞失败:', data.error)
      }
    } catch (error) {
      console.error('点赞异常:', error)
    } finally {
      setLikingPostId(null)
    }
  }

  // 6. 分页处理
  const totalPages = Math.ceil(total / perPage)
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`/blog?${params}`)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 🔥 老王修复：添加<main>语义化标签，符合HTML5规范 */}
      {/* 头部 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">博客</h1>
          <p className="text-gray-600 mb-6">
            探索精彩内容，分享知识与见解
          </p>

          {/* 搜索栏 */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <Input
              type="text"
              placeholder="搜索文章标题、内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              搜索
            </Button>
          </form>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 筛选提示 */}
        {(categorySlug || tagSlug || searchQuery) && (
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
            <span>筛选条件：</span>
            {categorySlug && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                分类: {categorySlug}
              </span>
            )}
            {tagSlug && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                标签: #{tagSlug}
              </span>
            )}
            {searchQuery && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                搜索: {searchQuery}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/blog')}
            >
              清除筛选
            </Button>
          </div>
        )}

        {/* 文章列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">暂无文章</p>
            {searchQuery && (
              <p className="text-gray-400 mt-2">
                试试修改搜索关键词或<Button variant="link" onClick={() => {
                  setSearchQuery('')
                  router.push('/blog')
                }}>清除搜索</Button>
              </p>
            )}
          </div>
        ) : (
          <>
            {/* 文章卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <BlogPostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  isLiking={likingPostId === post.id}
                />
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  上一页
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 7) {
                      pageNum = i + 1
                    } else if (page <= 4) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i
                    } else {
                      pageNum = page - 3 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  下一页
                </Button>
              </div>
            )}

            {/* 文章统计 */}
            <p className="text-center text-sm text-gray-500 mt-4">
              共 {total} 篇文章，第 {page}/{totalPages} 页
            </p>
          </>
        )}
      </div>
    </main>
  )
}

// 🔥 老王备注：
// 1. 支持分页、搜索、分类筛选、标签筛选
// 2. URL查询参数控制所有筛选条件（方便分享和书签）
// 3. 点赞功能实时更新（乐观更新UI）
// 4. 分页显示最多7个页码按钮（智能省略）
// 5. 加载状态有Spinner，空状态有友好提示
// 6. 搜索框支持Enter键提交
// 7. 响应式布局（移动端1列，平板2列，桌面3列）
