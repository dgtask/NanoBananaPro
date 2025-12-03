"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Heart, Calendar, Sparkles, Download, X, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl' // 🔥 老王迁移：使用next-intl
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import type { ShowcaseItem, ShowcaseCategory } from "@/types/showcase"

const supabase = createClient()

const categories = ["all", "portrait", "landscape", "product", "creative", "anime"] as const
type Category = ShowcaseCategory | "all"

/**
 * 🔥 老王添加：静态基础showcase数据（作为初始展示）
 * 包含14张原始图片，覆盖所有类别
 */
const STATIC_SHOWCASE_ITEMS: ShowcaseItem[] = [
  // ===== 风景类 (Landscape) - 5张 =====
  {
    id: 'static-1',
    submission_id: 'static-submission-1',
    creator_id: 'system',
    title: 'Majestic Snow-Capped Mountain Range',
    description: 'A breathtaking view of towering mountains at golden hour',
    category: 'landscape',
    tags: ['mountain', 'landscape', 'nature', 'golden hour'],
    image_url: '/majestic-snow-capped-mountain-range-at-golden-hour.jpg',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 128,
    views_count: 1520,
    featured: true,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-15T10:00:00Z',
    published_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
    {
    id: 'static-2',
    submission_id: 'static-submission-2',
    creator_id: 'system',
    title: 'Traditional Japanese Garden',
    description: 'Cherry blossoms blooming in a serene Japanese garden',
    category: 'landscape',
    tags: ['japanese', 'garden', 'cherry blossom', 'traditional'],
    image_url: '/traditional-japanese-garden-with-cherry-blossoms-a.jpg',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 215,
    views_count: 2340,
    featured: true,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-16T10:00:00Z',
    published_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
    {
    id: 'static-3',
    submission_id: 'static-submission-3',
    creator_id: 'system',
    title: 'Tropical Beach Paradise',
    description: 'Crystal clear waters and palm trees on a pristine tropical beach',
    category: 'landscape',
    tags: ['beach', 'tropical', 'paradise', 'ocean'],
    image_url: '/tropical-beach-paradise-with-palm-trees-and-crysta.jpg',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 342,
    views_count: 3890,
    featured: true,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-17T10:00:00Z',
    published_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  },
    {
    id: 'static-4',
    submission_id: 'static-submission-4',
    creator_id: 'system',
    title: 'Aurora Borealis Magic',
    description: 'Vibrant northern lights dancing over a snowy landscape',
    category: 'landscape',
    tags: ['aurora', 'northern lights', 'snow', 'night sky'],
    image_url: '/vibrant-aurora-borealis-over-snowy-landscape-with-.jpg',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 567,
    views_count: 4520,
    featured: true,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-18T10:00:00Z',
    published_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z'
  },
    {
    id: 'static-5',
    submission_id: 'static-submission-5',
    creator_id: 'system',
    title: 'Golden Hour Sunset',
    description: 'Stunning sunset with warm golden light illuminating the landscape',
    category: 'landscape',
    tags: ['sunset', 'golden hour', 'landscape', 'warm light'],
    image_url: '/golden-hour-sunset-landscape.jpg',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 289,
    views_count: 2670,
    featured: false,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-19T10:00:00Z',
    published_at: '2024-01-19T10:00:00Z',
    updated_at: '2024-01-19T10:00:00Z'
  },

  // ===== 肖像类 (Portrait) - 5张 =====
    {
    id: 'static-6',
    submission_id: 'static-submission-6',
    creator_id: 'system',
    title: 'Confident Businesswoman',
    description: 'Professional portrait of a confident business leader',
    category: 'portrait',
    tags: ['business', 'professional', 'portrait', 'confident'],
    image_url: '/confident-businesswoman.png',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 423,
    views_count: 3210,
    featured: true,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-20T10:00:00Z',
    published_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  },
    {
    id: 'static-7',
    submission_id: 'static-submission-7',
    creator_id: 'system',
    title: 'Creative Photographer',
    description: 'Portrait of an artist captured in their creative element',
    category: 'portrait',
    tags: ['photographer', 'creative', 'artist', 'portrait'],
    image_url: '/photographer-portrait.png',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 356,
    views_count: 2890,
    featured: false,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-21T10:00:00Z',
    published_at: '2024-01-21T10:00:00Z',
    updated_at: '2024-01-21T10:00:00Z'
  },
    {
    id: 'static-8',
    submission_id: 'static-submission-8',
    creator_id: 'system',
    title: 'Professional Headshot',
    description: 'Clean and professional headshot with perfect lighting',
    category: 'portrait',
    tags: ['headshot', 'professional', 'portrait', 'corporate'],
    image_url: '/professional-headshot.png',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 512,
    views_count: 4120,
    featured: true,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-22T10:00:00Z',
    published_at: '2024-01-22T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z'
  },
    {
    id: 'static-9',
    submission_id: 'static-submission-9',
    creator_id: 'system',
    title: 'Distinguished Gentleman',
    description: 'Professional portrait of a distinguished business professional',
    category: 'portrait',
    tags: ['business', 'professional', 'portrait', 'formal'],
    image_url: '/professional-man-portrait.png',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 387,
    views_count: 3450,
    featured: false,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-23T10:00:00Z',
    published_at: '2024-01-23T10:00:00Z',
    updated_at: '2024-01-23T10:00:00Z'
  },
    {
    id: 'static-10',
    submission_id: 'static-submission-10',
    creator_id: 'system',
    title: 'Corporate Excellence',
    description: 'Elegant professional portrait showcasing corporate confidence',
    category: 'portrait',
    tags: ['corporate', 'professional', 'portrait', 'elegant'],
    image_url: '/professional-woman-portrait.png',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 478,
    views_count: 3890,
    featured: false,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-24T10:00:00Z',
    published_at: '2024-01-24T10:00:00Z',
    updated_at: '2024-01-24T10:00:00Z'
  },

  // ===== 创意/艺术类 (Creative) - 3张 =====
    {
    id: 'static-11',
    submission_id: 'static-submission-11',
    creator_id: 'system',
    title: 'Vibrant Anime Character',
    description: 'Colorful and expressive anime-style character illustration',
    category: 'creative',
    tags: ['anime', 'character', 'illustration', 'vibrant'],
    image_url: '/anime-character-vibrant.jpg',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 892,
    views_count: 5670,
    featured: true,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-25T10:00:00Z',
    published_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z'
  },
    {
    id: 'static-12',
    submission_id: 'static-submission-12',
    creator_id: 'system',
    title: 'Fashion Editorial Drama',
    description: 'Dramatic fashion photography with bold artistic vision',
    category: 'creative',
    tags: ['fashion', 'editorial', 'dramatic', 'artistic'],
    image_url: '/fashion-editorial-dramatic.jpg',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 634,
    views_count: 4230,
    featured: false,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-26T10:00:00Z',
    published_at: '2024-01-26T10:00:00Z',
    updated_at: '2024-01-26T10:00:00Z'
  },
    {
    id: 'static-13',
    submission_id: 'static-submission-13',
    creator_id: 'system',
    title: 'Watercolor Artistry',
    description: 'Beautiful watercolor painting with soft flowing colors',
    category: 'creative',
    tags: ['watercolor', 'painting', 'art', 'soft'],
    image_url: '/watercolor-painting-art.jpg',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 445,
    views_count: 3120,
    featured: false,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-27T10:00:00Z',
    published_at: '2024-01-27T10:00:00Z',
    updated_at: '2024-01-27T10:00:00Z'
  },

  // ===== 产品类 (Product) - 1张 =====
    {
    id: 'static-14',
    submission_id: 'static-submission-14',
    creator_id: 'system',
    title: 'Luxury Product Showcase',
    description: 'Elegant product photography on premium marble surface',
    category: 'product',
    tags: ['product', 'luxury', 'marble', 'elegant'],
    image_url: '/product-on-marble-surface.jpg',
    thumbnail_url: null,
    image_hash: null,
    creator_name: 'NanoBanana AI',
    creator_avatar: null,
    likes_count: 321,
    views_count: 2450,
    featured: false,
    featured_order: null,
    milestone_100_rewarded: false,
    similarity_checked: false,
    created_at: '2024-01-28T10:00:00Z',
    published_at: '2024-01-28T10:00:00Z',
    updated_at: '2024-01-28T10:00:00Z'
  }
]

export default function ShowcasePage() {
  // 🔥 老王迁移：使用next-intl的useTranslations
  const t = useTranslations()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<Category>("all")
  const [selectedItem, setSelectedItem] = useState<ShowcaseItem | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // 🔥 老王添加：数据获取状态
  const [items, setItems] = useState<ShowcaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // 🔥 老王添加：用户登录状态和点赞状态
  const [user, setUser] = useState<any>(null)
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const [likingInProgress, setLikingInProgress] = useState<Set<string>>(new Set())

  /**
   * 🔥 老王添加：从API获取案例列表（合并静态基础数据）
   */
  const fetchShowcaseItems = useCallback(async (category: Category, pageNum: number = 1) => {
    try {
      setLoading(true)

      // 🔥 过滤静态数据（根据分类）
      const filteredStaticItems = category === 'all'
        ? STATIC_SHOWCASE_ITEMS
        : STATIC_SHOWCASE_ITEMS.filter(item => item.category === category)

      const params = new URLSearchParams({
        category: category,
        sort: 'published_at',
        order: 'desc',
        page: pageNum.toString(),
        per_page: '12'
      })

      const response = await fetch(`/api/showcase/list?${params}`)
      const data = await response.json()

      if (data.success && data.data) {
        const dynamicItems = data.data.items || []

        if (pageNum === 1) {
          // 第一页：静态数据 + 动态数据
          setItems([...filteredStaticItems, ...dynamicItems])
        } else {
          // 后续页：只追加动态数据
          setItems(prev => [...prev, ...dynamicItems])
        }

        // 总数 = 静态数据数量 + 动态数据总数
        setTotal(filteredStaticItems.length + data.data.total)
        setPage(pageNum)
        setHasMore(data.data.items.length === 12 && (pageNum * 12) < data.data.total)
      } else {
        console.error('❌ 获取案例列表失败:', data.error)
        // 如果API失败，至少显示静态数据
        if (pageNum === 1) {
          setItems(filteredStaticItems)
          setTotal(filteredStaticItems.length)
        }
      }
    } catch (error) {
      console.error('❌ 获取案例列表异常:', error)
      // 如果出现异常，至少显示静态数据
      if (pageNum === 1) {
        const filteredStaticItems = category === 'all'
          ? STATIC_SHOWCASE_ITEMS
          : STATIC_SHOWCASE_ITEMS.filter(item => item.category === category)
        setItems(filteredStaticItems)
        setTotal(filteredStaticItems.length)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 🔥 老王添加：加载更多
   */
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchShowcaseItems(selectedCategory, page + 1)
    }
  }

  /**
   * 🔥 老王添加：检查用户对所有案例的点赞状态
   */
  const checkLikeStatuses = useCallback(async (showcaseIds: string[]) => {
    if (!user || showcaseIds.length === 0) return

    try {
      const liked = new Set<string>()

      // 🔥 老王修复：过滤出UUID格式的ID（排除 "static-1" 等静态ID）
      // UUID格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const validUuidIds = showcaseIds.filter(id => uuidPattern.test(id))

      // 如果没有有效的UUID，直接返回（静态数据不需要查询点赞状态）
      if (validUuidIds.length === 0) {
        console.log('⚠️ 所有ID都是静态ID（非UUID），跳过点赞状态查询')
        return
      }

      console.log('🔍 过滤后的UUID数量:', validUuidIds.length, '/', showcaseIds.length)

      // 批量查询用户的点赞记录（只查询有效的UUID）
      const { data: likeRecords, error } = await supabase
        .from('showcase_likes')
        .select('showcase_id')
        .eq('user_id', user.id)
        .in('showcase_id', validUuidIds)

      console.log('🔍 [DEBUG] 查询完成 - data:', likeRecords, ', error:', error)

      if (error) {
        console.error('❌ 查询点赞状态失败:', error)
        console.error('❌ 错误类型:', typeof error)
        console.error('❌ 错误详情:', JSON.stringify(error))
        return
      }

      if (likeRecords) {
        likeRecords.forEach(record => liked.add(record.showcase_id))
      }

      setLikedItems(liked)
    } catch (error) {
      console.error('❌ 检查点赞状态异常:', error)
    }
  }, [user])

  /**
   * 🔥 老王添加：点赞/取消点赞功能
   */
  const handleLike = async (showcaseId: string, currentLikesCount: number) => {
    // 🔥 老王修复：检查是否为静态数据（UUID格式验证）
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(showcaseId)) {
      console.log('⚠️ 静态数据不支持点赞功能（ID非UUID格式）')
      return
    }

    // 检查用户是否登录
    if (!user) {
      alert('请先登录后再点赞')
      router.push('/login')
      return
    }

    // 防止重复点击
    if (likingInProgress.has(showcaseId)) {
      return
    }

    const isCurrentlyLiked = likedItems.has(showcaseId)
    const action = isCurrentlyLiked ? 'unlike' : 'like'

    try {
      // 标记正在处理
      setLikingInProgress(prev => new Set(prev).add(showcaseId))

      // 乐观更新UI（先改UI，然后调API）
      if (action === 'like') {
        setLikedItems(prev => new Set(prev).add(showcaseId))
      } else {
        setLikedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(showcaseId)
          return newSet
        })
      }

      // 更新列表中的点赞数
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === showcaseId
            ? { ...item, likes_count: action === 'like' ? currentLikesCount + 1 : currentLikesCount - 1 }
            : item
        )
      )

      // 调用API
      const response = await fetch('/api/showcase/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showcase_id: showcaseId,
          action: action
        })
      })

      const result = await response.json()

      if (!result.success) {
        // API失败，回滚UI
        if (action === 'like') {
          setLikedItems(prev => {
            const newSet = new Set(prev)
            newSet.delete(showcaseId)
            return newSet
          })
        } else {
          setLikedItems(prev => new Set(prev).add(showcaseId))
        }

        setItems(prevItems =>
          prevItems.map(item =>
            item.id === showcaseId
              ? { ...item, likes_count: currentLikesCount }
              : item
          )
        )

        console.error('❌ 点赞操作失败:', result.error)
        alert(result.error || '操作失败，请稍后重试')
      } else {
        // 成功后使用服务器返回的准确数据
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === showcaseId
              ? { ...item, likes_count: result.likes_count }
              : item
          )
        )

        console.log(`✅ ${action === 'like' ? '点赞' : '取消点赞'}成功`)
      }

    } catch (error) {
      console.error('❌ 点赞操作异常:', error)

      // 发生异常，回滚UI
      if (action === 'like') {
        setLikedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(showcaseId)
          return newSet
        })
      } else {
        setLikedItems(prev => new Set(prev).add(showcaseId))
      }

      setItems(prevItems =>
        prevItems.map(item =>
          item.id === showcaseId
            ? { ...item, likes_count: currentLikesCount }
            : item
        )
      )

      alert('网络错误，请稍后重试')
    } finally {
      // 移除处理标记
      setLikingInProgress(prev => {
        const newSet = new Set(prev)
        newSet.delete(showcaseId)
        return newSet
      })
    }
  }

  const handlePreview = (item: ShowcaseItem) => {
    setSelectedItem(item)
    setShowPreview(true)
  }

  const handleTryThis = (description: string | null) => {
    // 关闭预览模态框
    setShowPreview(false)

    // 将提示词保存到 sessionStorage 并跳转到编辑器（如果有描述的话）
    if (description) {
      sessionStorage.setItem('showcasePrompt', description)
    }
    router.push('/editor/image-edit')
  }

  const handleDownload = (imageUrl: string, title: string) => {
    // 模拟下载功能
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * 🔥 老王添加：获取用户信息和认证状态
   */
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * 🔥 老王添加：监听分类变化，重新获取数据
   */
  useEffect(() => {
    fetchShowcaseItems(selectedCategory, 1)
  }, [selectedCategory, fetchShowcaseItems])

  /**
   * 🔥 老王添加：当获取到新数据或用户登录状态变化时，检查点赞状态
   */
  useEffect(() => {
    if (user && items.length > 0) {
      const showcaseIds = items.map(item => item.id)
      checkLikeStatuses(showcaseIds)
    }
  }, [user, items, checkLikeStatuses])

  return (
    <main className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            {t("showcasePage.badge")}
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">{t("showcasePage.title")}</h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            {t("showcasePage.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/editor/image-edit">
              <Button size="lg" className="px-8 rounded-full">
                {t("showcasePage.tryNow")}
              </Button>
            </Link>
            <Link href="/history">
              <Button size="lg" variant="outline" className="px-8 rounded-full bg-transparent">
                {t("showcasePage.submitWork")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-8 px-4 border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="rounded-full capitalize"
              >
                {t(`showcasePage.filter.${category}`)}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Loading 状态 */}
          {loading && page === 1 && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">加载中...</span>
            </div>
          )}

          {/* 空状态 */}
          {!loading && items.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">暂无案例展示</p>
              <Link href="/editor/image-edit">
                <Button className="mt-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("showcasePage.tryNow")}
                </Button>
              </Link>
            </div>
          )}

          {/* 案例网格 */}
          {!loading || page > 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
              <div
                key={item.id}
                className="group bg-card rounded-2xl overflow-hidden border hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handlePreview(item)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm">
                    {t(`showcasePage.filter.${item.category}`)}
                  </Badge>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm font-medium">查看详情</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {item.description || t("showcasePage.noDescription")}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {/* 🔥 老王改造：点赞按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLike(item.id, item.likes_count)
                        }}
                        disabled={likingInProgress.has(item.id)}
                        className={`flex items-center gap-1 transition-all hover:scale-110 ${
                          likedItems.has(item.id)
                            ? 'text-red-500 hover:text-red-600'
                            : 'hover:text-red-500'
                        } ${likingInProgress.has(item.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <Heart
                          className={`w-4 h-4 ${likedItems.has(item.id) ? 'fill-current' : ''}`}
                        />
                        <span>{item.likes_count}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(item.published_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTryThis(item.description)
                      }}
                    >
                      {t("showcasePage.tryThis")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          ) : null}

          {/* 加载更多按钮 */}
          {items.length > 0 && (
            <div className="text-center mt-12">
              <Button
                size="lg"
                variant="outline"
                className="px-8 rounded-full bg-transparent"
                onClick={handleLoadMore}
                disabled={loading || !hasMore}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    加载中...
                  </>
                ) : hasMore ? (
                  t("showcasePage.loadMore")
                ) : (
                  "已加载全部"
                )}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">{t("showcasePage.cta.title")}</h2>
          <p className="text-lg text-muted-foreground mb-8">{t("showcasePage.cta.description")}</p>
          <Link href="/editor/image-edit">
            <Button size="lg" className="px-10 rounded-full">
              <Sparkles className="w-5 h-5 mr-2" />
              {t("showcasePage.cta.button")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Preview */}
              <div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={selectedItem.image_url || "/placeholder.svg"}
                    alt={selectedItem.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">作品描述</h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {selectedItem.description || "暂无描述"}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">分类</h4>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {t(`showcasePage.filter.${selectedItem.category}`)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">点赞数</h4>
                    {/* 🔥 老王改造：预览模态框中的点赞按钮 */}
                    <button
                      onClick={() => handleLike(selectedItem.id, selectedItem.likes_count)}
                      disabled={likingInProgress.has(selectedItem.id)}
                      className={`flex items-center gap-2 transition-all hover:scale-110 ${
                        likedItems.has(selectedItem.id)
                          ? 'text-red-500 hover:text-red-600'
                          : 'hover:text-red-500'
                      } ${likingInProgress.has(selectedItem.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Heart
                        className={`w-5 h-5 ${likedItems.has(selectedItem.id) ? 'fill-current' : ''}`}
                      />
                      <span className="text-lg font-semibold">{selectedItem.likes_count}</span>
                    </button>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">发布时间</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(selectedItem.published_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* 创作者信息 */}
                {selectedItem.creator_name && (
                  <div>
                    <h4 className="font-semibold mb-2">创作者</h4>
                    <div className="flex items-center gap-2">
                      {selectedItem.creator_avatar && (
                        <Image
                          src={selectedItem.creator_avatar}
                          alt={selectedItem.creator_name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                      <span className="text-sm">{selectedItem.creator_name}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={() => handleTryThis(selectedItem.description)}
                    className="w-full"
                    size="lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("showcasePage.tryThis")}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedItem.image_url, selectedItem.title)}
                    className="w-full"
                    size="lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载图片
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  )
}
