"use client"

/**
 * 🔥 老王的博客创建页面
 * 用途: 创建新的博客文章
 * 老王警告: 这个页面要验证表单、支持富文本编辑、分类标签选择！
 * 🔥 老王修复: 添加客户端认证保护，未登录用户重定向到登录页
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Save, LogIn } from 'lucide-react'
import { BlogEditor } from '@/components/blog/blog-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BlogCategory, BlogTag, CreateBlogPostRequest } from '@/types/blog'

export default function BlogNewPage() {
  const router = useRouter()

  // 🔥 老王修复：认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)

  // 1. 表单状态
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaKeywords, setMetaKeywords] = useState('')

  // 2. 分类和标签
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  // 3. 加载和提交状态
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔥 老王修复：检查认证状态
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          console.log('🔒 用户未登录，显示登录提示')
          setIsAuthenticated(false)
          setUser(null)
        } else {
          console.log('✅ 用户已登录:', user.email)
          setIsAuthenticated(true)
          setUser(user)
        }
      } catch (err) {
        console.error('❌ 检查认证状态失败:', err)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  // 4. 获取分类和标签列表（只在认证通过后执行）
  useEffect(() => {
    // 🔥 老王修复：只有认证通过后才获取数据
    if (isAuthenticated !== true) return

    async function fetchData() {
      setFetchingData(true)
      try {
        // 并发获取分类和标签
        const [categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/blog/categories'),
          fetch('/api/blog/tags')
        ])

        const categoriesData = await categoriesRes.json()
        const tagsData = await tagsRes.json()

        if (categoriesData.success) {
          setCategories(categoriesData.data || [])
        }

        if (tagsData.success) {
          setTags(tagsData.data || [])
        }
      } catch (err) {
        console.error('获取分类/标签失败:', err)
      } finally {
        setFetchingData(false)
      }
    }

    fetchData()
  }, [isAuthenticated])

  // 5. 自动生成slug（从标题）
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为-
      .replace(/-+/g, '-') // 多个-替换为单个-
  }

  // 6. 标题变化时自动更新slug（如果slug为空）
  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slug) {
      setSlug(generateSlug(value))
    }
  }

  // 7. 表单验证
  const validate = (): string | null => {
    if (!title.trim()) return '标题不能为空'
    if (title.length < 3) return '标题至少3个字符'
    if (title.length > 200) return '标题最多200个字符'

    if (!slug.trim()) return 'Slug不能为空'
    if (slug.length < 3) return 'Slug至少3个字符'
    if (slug.length > 200) return 'Slug最多200个字符'
    if (!/^[a-z0-9-]+$/.test(slug)) return 'Slug只能包含小写字母、数字和连字符'

    if (!content.trim()) return '内容不能为空'
    if (content.length < 10) return '内容至少10个字符'

    if (excerpt && excerpt.length > 500) return '摘要最多500个字符'
    if (metaDescription && metaDescription.length > 160) return 'Meta描述最多160个字符'

    return null
  }

  // 8. 提交表单
  const handleSubmit = async (saveStatus: 'draft' | 'published') => {
    setError(null)
    setLoading(true)

    try {
      // 表单验证
      const validationError = validate()
      if (validationError) {
        setError(validationError)
        setLoading(false)
        return
      }

      // 构建请求数据
      const requestData: CreateBlogPostRequest = {
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        cover_image_url: coverImageUrl || undefined,
        status: saveStatus,
        meta_title: metaTitle || undefined,
        meta_description: metaDescription || undefined,
        meta_keywords: metaKeywords || undefined,
        category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined
      }

      console.log('📤 提交文章:', requestData)

      // 发送请求
      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const data = await res.json()

      if (data.success && data.data) {
        console.log('✅ 文章创建成功:', data.data)
        // 跳转到文章详情页
        router.push(`/blog/${data.data.slug}`)
      } else {
        setError(data.error || '创建失败')
      }
    } catch (err) {
      console.error('❌ 创建文章异常:', err)
      setError('服务器错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 🔥 老王修复：检查认证状态中
  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">验证登录状态...</span>
      </main>
    )
  }

  // 🔥 老王修复：未登录用户显示登录提示
  if (isAuthenticated === false) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <LogIn className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">需要登录</h1>
          <p className="text-gray-600 mb-6">
            创建博客文章需要先登录您的账户
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/login?redirect=/blog/new')}
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              登录 / 注册
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/blog')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回博客列表
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // 数据加载中
  if (fetchingData) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/blog')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回博客列表
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              保存草稿
            </Button>
            <Button
              onClick={() => handleSubmit('published')}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              发布文章
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 表单 */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* 标题 */}
          <div>
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              placeholder="输入文章标题（3-200字符）"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">Slug（URL友好） *</Label>
            <Input
              id="slug"
              placeholder="my-article-slug（小写字母、数字、连字符）"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              URL: /blog/{slug || 'your-slug'}
            </p>
          </div>

          {/* 摘要 */}
          <div>
            <Label htmlFor="excerpt">摘要（可选）</Label>
            <Textarea
              id="excerpt"
              placeholder="简短描述文章内容（最多500字符）"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* 封面图 */}
          <div>
            <Label htmlFor="coverImage">封面图URL（可选）</Label>
            <Input
              id="coverImage"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="mt-2"
            />
            {coverImageUrl && (
              <div className="mt-2 relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-gray-200">
                <img
                  src={coverImageUrl}
                  alt="封面预览"
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.src = ''
                    e.currentTarget.alt = '图片加载失败'
                  }}
                />
              </div>
            )}
          </div>

          {/* 分类和标签 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 分类 */}
            <div>
              <Label>分类（可多选）</Label>
              <div className="mt-2 space-y-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategoryIds([...selectedCategoryIds, category.id])
                        } else {
                          setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 标签 */}
            <div>
              <Label>标签（可多选）</Label>
              <div className="mt-2 space-y-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTagIds([...selectedTagIds, tag.id])
                        } else {
                          setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>#{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 文章内容 */}
          <div>
            <Label>文章内容 *</Label>
            <div className="mt-2">
              <BlogEditor
                content={content}
                onChange={setContent}
                placeholder="开始写作..."
              />
            </div>
          </div>

          {/* SEO元数据（折叠） */}
          <details className="border rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-gray-900">
              SEO元数据（可选）
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta标题</Label>
                <Input
                  id="metaTitle"
                  placeholder="SEO标题（默认使用文章标题）"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta描述</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="SEO描述（最多160字符）"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="mt-2"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="metaKeywords">Meta关键词</Label>
                <Input
                  id="metaKeywords"
                  placeholder="关键词1, 关键词2, 关键词3"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </details>
        </div>
      </div>
    </main>
  )
}

// 🔥 老王备注：
// 1. 支持草稿和发布两种保存方式
// 2. 自动从标题生成slug（可手动修改）
// 3. 表单验证（标题、slug、内容必填，长度限制）
// 4. 支持选择多个分类和标签
// 5. 富文本编辑器（BlogEditor组件）
// 6. 封面图预览功能
// 7. SEO元数据折叠区域（可选填）
// 8. 创建成功后跳转到详情页
