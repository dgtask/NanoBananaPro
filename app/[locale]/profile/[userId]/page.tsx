"use client"

/**
 * 🔥 老王的用户主页
 * 用途: 展示用户资料、统计数据、作品画廊
 * 老王警告: 这个页面要做得好看，别tm搞得像90年代的网页！
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Masonry from 'react-masonry-css'
import {
  User,
  MapPin,
  Globe,
  Twitter,
  Instagram,
  Github,
  Heart,
  Eye,
  ImageIcon,
  Video,
  FileText,
  Users,
  UserPlus,
  UserCheck,
  Settings,
  Loader2,
  ArrowLeft,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ArtworkDetailModal from '@/components/artwork-detail-modal'
import type { UserProfileDetail, ArtworkItem } from '@/types/profile'

interface ProfilePageProps {
  params: {
    userId: string
  }
}

/**
 * 格式化数字（1000+ 显示为 1K）
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K'
  }
  return count.toString()
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const router = useRouter()
  const { userId } = params

  // 1. 状态管理
  const [profile, setProfile] = useState<UserProfileDetail | null>(null)
  const [artworks, setArtworks] = useState<ArtworkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [artworksLoading, setArtworksLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [following, setFollowing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // 2. 作品筛选和排序
  const [artworkType, setArtworkType] = useState<'all' | 'image' | 'video'>('all')
  const [artworkSort, setArtworkSort] = useState<'latest' | 'popular'>('latest')
  const [hasMoreArtworks, setHasMoreArtworks] = useState(true)
  const [artworkPage, setArtworkPage] = useState(1)

  // 3. 作品详情弹窗
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 4. 无限滚动相关
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 3. 获取用户资料
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/profile/${userId}`)
        const data = await res.json()

        if (data.success && data.data) {
          setProfile(data.data)
          setFollowing(data.data.is_following || false)
        } else {
          setError(data.error || '用户不存在')
        }
      } catch (err) {
        console.error('获取用户资料失败:', err)
        setError('加载失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    // 获取当前登录用户ID
    async function fetchCurrentUser() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.user) {
          setCurrentUserId(data.user.id)
        }
      } catch (err) {
        console.error('获取当前用户失败:', err)
      }
    }

    if (userId) {
      fetchProfile()
      fetchCurrentUser()
    }
  }, [userId])

  // 4. 获取作品画廊
  useEffect(() => {
    async function fetchArtworks() {
      setArtworksLoading(true)
      try {
        const res = await fetch(
          `/api/profile/${userId}/artworks?type=${artworkType}&sort=${artworkSort}&page=1&limit=20`
        )
        const data = await res.json()

        if (data.success) {
          setArtworks(data.data || [])
          setHasMoreArtworks(data.pagination?.has_more || false)
          setArtworkPage(1)
        }
      } catch (err) {
        console.error('获取作品失败:', err)
      } finally {
        setArtworksLoading(false)
      }
    }

    if (userId) {
      fetchArtworks()
    }
  }, [userId, artworkType, artworkSort])

  // 5. 加载更多作品（使用useCallback避免无限循环）
  const loadMoreArtworks = useCallback(async () => {
    if (artworksLoading || !hasMoreArtworks) return

    setArtworksLoading(true)
    try {
      const nextPage = artworkPage + 1
      const res = await fetch(
        `/api/profile/${userId}/artworks?type=${artworkType}&sort=${artworkSort}&page=${nextPage}&limit=20`
      )
      const data = await res.json()

      if (data.success) {
        setArtworks(prev => [...prev, ...(data.data || [])])
        setHasMoreArtworks(data.pagination?.has_more || false)
        setArtworkPage(nextPage)
      }
    } catch (err) {
      console.error('加载更多作品失败:', err)
    } finally {
      setArtworksLoading(false)
    }
  }, [artworksLoading, hasMoreArtworks, artworkPage, userId, artworkType, artworkSort])

  // 6. 无限滚动 - IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMoreArtworks && !artworksLoading) {
          loadMoreArtworks()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMoreArtworks, artworksLoading, loadMoreArtworks])

  // 6. 关注/取关处理
  const handleFollow = async () => {
    if (!profile) return

    const method = following ? 'DELETE' : 'POST'
    try {
      const res = await fetch(`/api/profile/${userId}/follow`, { method })
      const data = await res.json()

      if (data.success) {
        setFollowing(data.data.is_following)
        setProfile(prev => prev ? {
          ...prev,
          follower_count: data.data.follower_count
        } : null)
      } else {
        console.error('关注操作失败:', data.error)
      }
    } catch (err) {
      console.error('关注操作异常:', err)
    }
  }

  // 7. 作品点赞处理
  const handleLikeArtwork = async (artwork: ArtworkItem) => {
    const method = artwork.is_liked ? 'DELETE' : 'POST'
    try {
      const res = await fetch(
        `/api/artworks/${artwork.id}/like?type=${artwork.type}`,
        { method }
      )
      const data = await res.json()

      if (data.success) {
        setArtworks(prev => prev.map(a =>
          a.id === artwork.id
            ? { ...a, is_liked: data.data.is_liked, like_count: data.data.like_count }
            : a
        ))
      }
    } catch (err) {
      console.error('点赞操作异常:', err)
    }
  }

  // 8. 打开作品详情弹窗
  const openArtworkModal = (artwork: ArtworkItem) => {
    setSelectedArtwork(artwork)
    setIsModalOpen(true)
  }

  // 9. 弹窗内点赞状态变化的回调
  const handleModalLikeChange = (artworkId: string, isLiked: boolean, newCount: number) => {
    setArtworks(prev => prev.map(a =>
      a.id === artworkId
        ? { ...a, is_liked: isLiked, like_count: newCount }
        : a
    ))
    // 同步更新selectedArtwork
    if (selectedArtwork && selectedArtwork.id === artworkId) {
      setSelectedArtwork(prev => prev ? { ...prev, is_liked: isLiked, like_count: newCount } : null)
    }
  }

  // 瀑布流响应式断点
  const breakpointColumns = {
    default: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 2
  }

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // 错误状态
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">{error || '用户不存在'}</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUserId === userId

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 用户资料头部 */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* 头像 */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || '用户头像'}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* 用户信息 */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {profile.display_name || '未设置昵称'}
                </h1>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  {isOwnProfile ? (
                    <Button
                      variant="outline"
                      onClick={() => router.push('/profile/edit')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      编辑资料
                    </Button>
                  ) : (
                    <Button
                      variant={following ? 'outline' : 'default'}
                      onClick={handleFollow}
                    >
                      {following ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          已关注
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          关注
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* 简介 */}
              {profile.bio && (
                <p className="text-gray-600 mb-4 max-w-2xl">{profile.bio}</p>
              )}

              {/* 社交链接和位置 */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    <Globe className="h-4 w-4" />
                    网站
                  </a>
                )}
                {profile.twitter_handle && (
                  <a
                    href={`https://twitter.com/${profile.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-400"
                  >
                    <Twitter className="h-4 w-4" />
                    @{profile.twitter_handle}
                  </a>
                )}
                {profile.instagram_handle && (
                  <a
                    href={`https://instagram.com/${profile.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-pink-500"
                  >
                    <Instagram className="h-4 w-4" />
                    @{profile.instagram_handle}
                  </a>
                )}
                {profile.github_handle && (
                  <a
                    href={`https://github.com/${profile.github_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    <Github className="h-4 w-4" />
                    @{profile.github_handle}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <Link
              href={`/profile/${userId}/follows?type=followers`}
              className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors"
            >
              <div className="text-2xl font-bold text-gray-900">
                {formatCount(profile.follower_count)}
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                粉丝
              </div>
            </Link>

            <Link
              href={`/profile/${userId}/follows?type=following`}
              className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors"
            >
              <div className="text-2xl font-bold text-gray-900">
                {formatCount(profile.following_count)}
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <UserPlus className="h-4 w-4" />
                关注
              </div>
            </Link>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCount(profile.artwork_count)}
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <ImageIcon className="h-4 w-4" />
                作品
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCount(profile.post_count)}
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <FileText className="h-4 w-4" />
                文章
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCount(profile.total_likes)}
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <Heart className="h-4 w-4" />
                获赞
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 作品画廊 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 筛选和排序 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Tabs value={artworkType} onValueChange={(v) => setArtworkType(v as any)}>
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-1">
                全部
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                图片
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                视频
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">排序：</span>
            <Button
              variant={artworkSort === 'latest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setArtworkSort('latest')}
            >
              最新
            </Button>
            <Button
              variant={artworkSort === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setArtworkSort('popular')}
            >
              最热
            </Button>
          </div>
        </div>

        {/* 瀑布流画廊 */}
        {artworksLoading && artworks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">还没有作品</p>
          </div>
        ) : (
          <>
            <Masonry
              breakpointCols={breakpointColumns}
              className="flex -ml-4 w-auto"
              columnClassName="pl-4 bg-clip-padding"
            >
              {artworks.map((artwork) => (
                <div
                  key={`${artwork.type}-${artwork.id}`}
                  className="mb-4 group relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
                  onClick={() => openArtworkModal(artwork)}
                >
                  {/* 作品图片/视频缩略图 */}
                  <div className="relative">
                    {artwork.image_url ? (
                      <img
                        src={artwork.image_url}
                        alt={artwork.prompt}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* 视频标识 */}
                    {artwork.type === 'video' && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        视频
                      </div>
                    )}

                    {/* 悬浮层 */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-white text-sm line-clamp-2 mb-2">
                        {artwork.prompt}
                      </p>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLikeArtwork(artwork)
                          }}
                          className={`flex items-center gap-1 text-sm ${
                            artwork.is_liked ? 'text-red-500' : 'text-white'
                          }`}
                        >
                          <Heart
                            className={`h-5 w-5 ${artwork.is_liked ? 'fill-current' : ''}`}
                          />
                          {artwork.like_count}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Masonry>

            {/* 无限滚动触发器 */}
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {artworksLoading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>加载中...</span>
                </div>
              )}
              {!hasMoreArtworks && artworks.length > 0 && (
                <p className="text-gray-400 text-sm">已经到底啦 ~</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* 作品详情弹窗 */}
      {selectedArtwork && (
        <ArtworkDetailModal
          artwork={selectedArtwork}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedArtwork(null)
          }}
          onLikeChange={handleModalLikeChange}
        />
      )}
    </div>
  )
}

// 🔥 老王备注：
// 1. 使用react-masonry-css实现瀑布流布局（Pinterest风格）
// 2. 支持按类型筛选（全部/图片/视频）和排序（最新/最热）
// 3. 懒加载图片（loading="lazy"）提升性能
// 4. 响应式断点：默认4列，1280px以下3列，768px以下2列
// 5. 悬浮层显示作品描述和点赞按钮
// 6. 点击粉丝/关注数跳转到关注列表页
// 7. 自己的主页显示"编辑资料"按钮，别人的主页显示"关注"按钮
// 8. 统计数据格式化显示（1000+ -> 1K）
// 9. 无限滚动：使用IntersectionObserver检测滚动触底自动加载更多
// 10. 点击作品打开详情弹窗，支持点赞/分享/下载
