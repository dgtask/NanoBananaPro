"use client"

/**
 * 🔥 老王的博客编辑页面
 * 用途: 编辑已有的博客文章
 * 老王警告: 这个页面要先加载现有数据，验证作者权限，支持更新！
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { BlogEditor } from '@/components/blog/blog-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type {
  BlogCategory,
  BlogTag,
  BlogPostDetail,
  UpdateBlogPostRequest
} from '@/types/blog'

interface BlogEditPageProps {
  params: {
    id: string
  }
}

export default function BlogEditPage({ params }: BlogEditPageProps) {
  const router = useRouter()
  const { id } = params

  // 1. 表单状态
  const [post, setPost] = useState<BlogPostDetail | null>(null)
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
  const [deleting, setDeleting] = useState(false)

  // 4. 获取文章数据和分类标签列表
  useEffect(() => {
    async function fetchData() {
      setFetchingData(true)
      setError(null)
      try {
        // 并发获取文章、分类、标签
        const [postRes, categoriesRes, tagsRes] = await Promise.all([
          fetch(`/api/blog/posts/${id}`),
          fetch('/api/blog/categories'),
          fetch('/api/blog/tags')
        ])

        const postData = await postRes.json()
        const categoriesData = await categoriesRes.json()
        const tagsData = await tagsRes.json()

        if (!postData.success || !postData.data) {
          setError(postData.error || '文章不存在')
          setFetchingData(false)
          return
        }

        const fetchedPost = postData.data

        // 填充表单
        setPost(fetchedPost)
        setTitle(fetchedPost.title)
        setSlug(fetchedPost.slug)
        setContent(fetchedPost.content)
        setExcerpt(fetchedPost.excerpt || '')
        setCoverImageUrl(fetchedPost.cover_image_url || '')
        setStatus(fetchedPost.status)
        setMetaTitle(fetchedPost.meta_title || '')
        setMetaDescription(fetchedPost.meta_description || '')
        setMetaKeywords(fetchedPost.meta_keywords || '')

        // 设置分类和标签 - 老王修复：给map回调加类型注解
        if (categoriesData.success) {
          setCategories(categoriesData.data || [])
          setSelectedCategoryIds(fetchedPost.categories?.map((c: { id: string }) => c.id) || [])
        }

        if (tagsData.success) {
          setTags(tagsData.data || [])
          setSelectedTagIds(fetchedPost.tags?.map((t: { id: string }) => t.id) || [])
        }
      } catch (err) {
        console.error('获取数据失败:', err)
        setError('加载失败，请稍后重试')
      } finally {
        setFetchingData(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  // 5. 表单验证
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

  // 6. 提交更新
  const handleSubmit = async (saveStatus: 'draft' | 'published') => {
    if (!post) return

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

      // 构建请求数据（只包含变更字段）
      const requestData: UpdateBlogPostRequest = {}

      if (title !== post.title) requestData.title = title
      if (slug !== post.slug) requestData.slug = slug
      if (content !== post.content) requestData.content = content
      if (excerpt !== (post.excerpt || '')) requestData.excerpt = excerpt
      if (coverImageUrl !== (post.cover_image_url || '')) requestData.cover_image_url = coverImageUrl
      if (saveStatus !== post.status) requestData.status = saveStatus
      if (metaTitle !== (post.meta_title || '')) requestData.meta_title = metaTitle
      if (metaDescription !== (post.meta_description || '')) requestData.meta_description = metaDescription
      if (metaKeywords !== (post.meta_keywords || '')) requestData.meta_keywords = metaKeywords

      // 分类和标签（总是传递）
      requestData.category_ids = selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined
      requestData.tag_ids = selectedTagIds.length > 0 ? selectedTagIds : undefined

      console.log('📤 更新文章:', requestData)

      // 发送请求
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const data = await res.json()

      if (data.success) {
        console.log('✅ 文章更新成功')
        // 跳转到文章详情页
        router.push(`/blog/${slug}`)
      } else {
        setError(data.error || '更新失败')
      }
    } catch (err) {
      console.error('❌ 更新文章异常:', err)
      setError('服务器错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 7. 删除文章
  const handleDelete = async () => {
    if (!post) return

    const confirmed = window.confirm('确定要删除这篇文章吗？此操作不可恢复。')
    if (!confirmed) return

    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        console.log('✅ 文章删除成功')
        router.push('/blog')
      } else {
        setError(data.error || '删除失败')
      }
    } catch (err) {
      console.error('❌ 删除文章异常:', err)
      setError('服务器错误，请稍后重试')
    } finally {
      setDeleting(false)
    }
  }

  // 数据加载中
  if (fetchingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // 错误或文章不存在
  if (error && !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">{error}</p>
          <Button onClick={() => router.push('/blog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回博客列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || loading}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              删除文章
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={loading || deleting}
            >
              <Save className="h-4 w-4 mr-2" />
              保存草稿
            </Button>

            <Button
              onClick={() => handleSubmit('published')}
              disabled={loading || deleting}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {status === 'published' ? '更新文章' : '发布文章'}
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
              onChange={(e) => setTitle(e.target.value)}
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
    </div>
  )
}

// 🔥 老王备注：
// 1. 先加载现有文章数据填充表单
// 2. 支持更新为草稿或发布状态
// 3. 支持删除文章（二次确认）
// 4. 表单验证同创建页面
// 5. 只提交变更字段（优化性能）
// 6. 更新成功后跳转到详情页
// 7. 仅作者本人可编辑（API层验证）
