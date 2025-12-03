"use client"

/**
 * 🔥 老王的关注列表页面
 * 用途: 显示用户的关注列表或粉丝列表
 * URL: /profile/[userId]/follows?type=following|followers
 * 老王警告: 这个页面支持无限滚动，别tm一次加载太多数据！
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  ArrowLeft,
  Loader2,
  UserPlus,
  UserMinus,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { FollowUser } from '@/types/profile'

interface FollowsPageProps {
  params: { userId: string }
}

export default function FollowsPage({ params }: FollowsPageProps) {
  const { userId } = params
  const router = useRouter()
  const searchParams = useSearchParams()

  // 1. 状态管理
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(
    (searchParams.get('type') as 'following' | 'followers') || 'followers'
  )
  const [users, setUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [userName, setUserName] = useState<string>('')

  // 无限滚动ref
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 2. 获取当前登录用户
  useEffect(() => {
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
    fetchCurrentUser()
  }, [])

  // 3. 获取目标用户信息
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch(`/api/profile/${userId}`)
        const data = await res.json()
        if (data.success && data.data) {
          setUserName(data.data.display_name || '用户')
        }
      } catch (err) {
        console.error('获取用户信息失败:', err)
      }
    }
    fetchUserInfo()
  }, [userId])

  // 4. 获取关注/粉丝列表
  const fetchFollows = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const res = await fetch(
        `/api/profile/${userId}/follows?type=${activeTab}&page=${pageNum}&limit=20`
      )
      const data = await res.json()

      if (data.success && data.data) {
        if (reset) {
          setUsers(data.data)
        } else {
          setUsers(prev => [...prev, ...data.data])
        }
        setHasMore(data.pagination?.has_more || false)
      }
    } catch (err) {
      console.error('获取关注列表失败:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [userId, activeTab])

  // 5. 获取当前用户的关注列表（用于判断是否已关注）
  useEffect(() => {
    async function fetchMyFollowing() {
      if (!currentUserId) return

      try {
        const res = await fetch(`/api/profile/${currentUserId}/follows?type=following&limit=1000`)
        const data = await res.json()
        if (data.success && data.data) {
          const ids = new Set<string>(data.data.map((u: FollowUser) => u.user_id))
          setFollowingIds(ids)
        }
      } catch (err) {
        console.error('获取我的关注列表失败:', err)
      }
    }
    fetchMyFollowing()
  }, [currentUserId])

  // 6. 切换Tab或初始加载时重新获取数据
  useEffect(() => {
    setPage(1)
    fetchFollows(1, true)
  }, [activeTab, fetchFollows])

  // 7. 处理Tab切换
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'following' | 'followers')
    // 更新URL参数
    router.replace(`/profile/${userId}/follows?type=${value}`, { scroll: false })
  }

  // 8. 加载更多
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchFollows(nextPage, false)
  }, [loadingMore, hasMore, page, fetchFollows])

  // 9. 无限滚动 - IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore && !loadingMore && !loading) {
          handleLoadMore()
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
  }, [hasMore, loadingMore, loading, handleLoadMore])

  // 9. 处理关注/取关
  const handleFollow = async (targetUserId: string, isFollowing: boolean) => {
    if (!currentUserId) {
      router.push('/login')
      return
    }

    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/profile/${targetUserId}/follow`, { method })
      const data = await res.json()

      if (data.success) {
        // 更新本地状态
        if (isFollowing) {
          setFollowingIds(prev => {
            const next = new Set(prev)
            next.delete(targetUserId)
            return next
          })
        } else {
          setFollowingIds(prev => {
            const next = new Set(prev)
            next.add(targetUserId)
            return next
          })
        }
      }
    } catch (err) {
      console.error('关注操作失败:', err)
    }
  }

  // 10. 渲染用户卡片
  const renderUserCard = (user: FollowUser) => {
    const isFollowing = followingIds.has(user.user_id)
    const isMe = user.user_id === currentUserId

    return (
      <div
        key={user.user_id}
        className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow"
      >
        {/* 用户信息 */}
        <Link
          href={`/profile/${user.user_id}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name || '用户'}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">
              {user.display_name || '未设置昵称'}
            </p>
            {user.bio && (
              <p className="text-sm text-gray-500 truncate">{user.bio}</p>
            )}
          </div>
        </Link>

        {/* 关注按钮 */}
        {!isMe && currentUserId && (
          <Button
            variant={isFollowing ? 'outline' : 'default'}
            size="sm"
            onClick={() => handleFollow(user.user_id, isFollowing)}
            className="flex-shrink-0 ml-3"
          >
            {isFollowing ? (
              <>
                <UserMinus className="h-4 w-4 mr-1" />
                取消关注
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1" />
                关注
              </>
            )}
          </Button>
        )}

        {isMe && (
          <span className="text-sm text-gray-400 flex-shrink-0 ml-3">我自己</span>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{userName}</h1>
              <p className="text-sm text-gray-500">
                {activeTab === 'following' ? '关注列表' : '粉丝列表'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="followers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                粉丝
              </TabsTrigger>
              <TabsTrigger value="following" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                关注
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {activeTab === 'following' ? '还没有关注任何人' : '还没有粉丝'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(renderUserCard)}

            {/* 无限滚动触发器 - 老王改造：滚动到底自动加载，体验更丝滑 */}
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {loadingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>加载中...</span>
                </div>
              )}
              {!hasMore && users.length > 0 && (
                <p className="text-gray-400 text-sm">已经到底啦 ~</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 🔥 老王备注：
// 1. URL参数type控制显示关注列表还是粉丝列表
// 2. IntersectionObserver实现无限滚动，滚到底自动加载，体验丝滑
// 3. 获取当前用户的关注列表，用于判断每个用户是否已关注
// 4. 关注/取关后即时更新UI状态，不需要刷新页面
// 5. 点击用户头像/昵称可以跳转到该用户的主页
// 6. 如果是自己则显示"我自己"，不显示关注按钮
// 7. useCallback包装handleLoadMore防止useEffect无限循环，这个坑老王踩过
