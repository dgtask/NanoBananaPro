"use client"

/**
 * 🔥 老王的通知中心页面
 * 用途: 显示用户所有通知，支持筛选和标记已读
 * 老王警告: 这个页面支持无限滚动，别tm一次加载太多！
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  ArrowLeft,
  Loader2,
  Check,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { NotificationItem } from '@/components/notifications'
import type { NotificationWithUser, NotificationType } from '@/types/notification'

export default function NotificationsPage() {
  const router = useRouter()

  // 1. 状态管理
  const [notifications, setNotifications] = useState<NotificationWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  // 无限滚动ref
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 2. 获取当前用户
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.user) {
          setCurrentUserId(data.user.id)
        } else {
          // 未登录，跳转登录页
          router.push('/login')
        }
      } catch (err) {
        console.error('获取当前用户失败:', err)
        router.push('/login')
      }
    }
    fetchCurrentUser()
  }, [router])

  // 3. 获取通知列表
  const fetchNotifications = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (!currentUserId) return

    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20'
      })

      if (typeFilter !== 'all') {
        params.set('type', typeFilter)
      }

      if (readFilter !== 'all') {
        params.set('is_read', readFilter === 'read' ? 'true' : 'false')
      }

      const res = await fetch(`/api/notifications?${params}`)
      const data = await res.json()

      if (data.success && data.data) {
        if (reset) {
          setNotifications(data.data)
        } else {
          setNotifications(prev => [...prev, ...data.data])
        }
        setHasMore(data.pagination?.has_more || false)
        setTotal(data.pagination?.total || 0)
      }
    } catch (err) {
      console.error('获取通知失败:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [currentUserId, typeFilter, readFilter])

  // 4. 筛选条件变化时重新获取
  useEffect(() => {
    if (currentUserId) {
      setPage(1)
      fetchNotifications(1, true)
    }
  }, [currentUserId, typeFilter, readFilter, fetchNotifications])

  // 5. 加载更多
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchNotifications(nextPage, false)
  }, [loadingMore, hasMore, page, fetchNotifications])

  // 6. 无限滚动 - IntersectionObserver
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

  // 7. 标记全部已读
  const handleMarkAllRead = async () => {
    if (markingAllRead) return

    setMarkingAllRead(true)
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await res.json()

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        )
      }
    } catch (err) {
      console.error('标记已读失败:', err)
    } finally {
      setMarkingAllRead(false)
    }
  }

  // 8. 点击单条通知
  const handleNotificationClick = async (notification: NotificationWithUser) => {
    if (notification.is_read) return

    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [notification.id] })
      })

      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )
    } catch (err) {
      console.error('标记已读失败:', err)
    }
  }

  // 计算未读数量
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  通知中心
                </h1>
                <p className="text-sm text-gray-500">
                  共 {total} 条通知
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
              >
                {markingAllRead ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                全部已读
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">筛选：</span>
            </div>

            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as NotificationType | 'all')}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="follow">关注</SelectItem>
                <SelectItem value="like">点赞</SelectItem>
                <SelectItem value="comment">评论</SelectItem>
                <SelectItem value="mention">提及</SelectItem>
                <SelectItem value="reply">回复</SelectItem>
                <SelectItem value="system">系统</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={readFilter}
              onValueChange={(v) => setReadFilter(v as 'all' | 'unread' | 'read')}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="unread">未读</SelectItem>
                <SelectItem value="read">已读</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无通知</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}

            {/* 无限滚动触发器 */}
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {loadingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>加载中...</span>
                </div>
              )}
              {!hasMore && notifications.length > 0 && (
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
// 1. 支持按类型和已读状态筛选
// 2. IntersectionObserver 实现无限滚动
// 3. 点击通知自动标记已读
// 4. 支持全部标记已读
// 5. 未登录自动跳转登录页
