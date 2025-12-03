"use client"

/**
 * 🔥 老王的排行榜页面
 * 用途: 展示创作者排行榜，激励用户活跃
 * 老王警告: 排行榜要好看，用户才有动力往上爬！
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Users,
  Heart,
  Image as ImageIcon,
  Loader2,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  LeaderboardPeriod,
  LeaderboardCreatorEntry,
  CreatorLeaderboardResponse
} from '@/types/leaderboard'
import { getRankBadge, RANK_BADGE_CONFIG, LEADERBOARD_PERIOD_CONFIG } from '@/types/leaderboard'

export default function LeaderboardPage() {
  const router = useRouter()

  // 状态
  const [period, setPeriod] = useState<LeaderboardPeriod>('all')
  const [creators, setCreators] = useState<LeaderboardCreatorEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRank, setCurrentUserRank] = useState<{
    rank: number
    score: number
    percentile: number
  } | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // 获取排行榜数据
  const fetchLeaderboard = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        period,
        page: pageNum.toString(),
        limit: '20'
      })

      const res = await fetch(`/api/leaderboard/creators?${params}`)
      const data: CreatorLeaderboardResponse = await res.json()

      if (data.success) {
        if (reset) {
          setCreators(data.data)
        } else {
          setCreators(prev => [...prev, ...data.data])
        }
        setHasMore(data.pagination.has_more)
        setCurrentUserRank(data.current_user_rank || null)
      }
    } catch (error) {
      console.error('获取排行榜失败:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [period])

  // 切换时间范围时重新获取
  useEffect(() => {
    setPage(1)
    fetchLeaderboard(1, true)
  }, [period, fetchLeaderboard])

  // 加载更多
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchLeaderboard(nextPage, false)
  }

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>
  }

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}w`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-8 w-8" />
            <h1 className="text-2xl font-bold">创作者排行榜</h1>
          </div>
          <p className="text-purple-100">
            发现最活跃的创作者，向榜上的大神学习！
          </p>

          {/* 当前用户排名卡片 */}
          {currentUserRank && (
            <div className="mt-6 bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">你的排名</p>
                  <p className="text-3xl font-bold">#{currentUserRank.rank}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-200">超越了</p>
                  <p className="text-2xl font-bold">{currentUserRank.percentile}%</p>
                  <p className="text-xs text-purple-200">的创作者</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 时间范围切换 */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
          <TabsList className="grid w-full grid-cols-3">
            {(Object.entries(LEADERBOARD_PERIOD_CONFIG) as [LeaderboardPeriod, typeof LEADERBOARD_PERIOD_CONFIG['all']][]).map(([key, config]) => (
              <TabsTrigger key={key} value={key}>
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* 排行榜列表 */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无排行数据</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 前三名特殊展示 */}
            {creators.slice(0, 3).map((entry) => (
              <Link
                key={entry.user.id}
                href={`/profile/${entry.user.username || entry.user.id}`}
                className={`block rounded-xl p-4 transition-all hover:shadow-lg ${
                  entry.rank === 1
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300'
                    : entry.rank === 2
                    ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300'
                    : 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-amber-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* 排名 */}
                  <div className="w-12 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* 头像 */}
                  <Avatar className="h-14 w-14 border-2 border-white shadow">
                    <AvatarImage src={entry.user.avatar_url || undefined} />
                    <AvatarFallback>
                      {entry.user.display_name?.[0] || entry.user.username?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">
                      {entry.user.display_name || entry.user.username || '未知用户'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        {entry.stats.total_works}作品
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {formatNumber(entry.stats.total_likes_received)}赞
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {formatNumber(entry.stats.followers_count)}粉丝
                      </span>
                    </div>
                  </div>

                  {/* 积分 */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatNumber(entry.score)}
                    </p>
                    <p className="text-xs text-gray-400">积分</p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            ))}

            {/* 其他排名 */}
            {creators.slice(3).map((entry) => {
              const badge = getRankBadge(entry.rank)

              return (
                <Link
                  key={entry.user.id}
                  href={`/profile/${entry.user.username || entry.user.id}`}
                  className="flex items-center gap-4 bg-white rounded-lg p-4 border hover:shadow-md transition-all"
                >
                  {/* 排名 */}
                  <div className="w-12 text-center">
                    {badge && badge !== 'top100' ? (
                      <span className={`text-lg ${RANK_BADGE_CONFIG[badge].color}`}>
                        {RANK_BADGE_CONFIG[badge].icon}
                      </span>
                    ) : (
                      <span className="text-lg font-medium text-gray-500">
                        #{entry.rank}
                      </span>
                    )}
                  </div>

                  {/* 头像 */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.user.avatar_url || undefined} />
                    <AvatarFallback>
                      {entry.user.display_name?.[0] || entry.user.username?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {entry.user.display_name || entry.user.username || '未知用户'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{entry.stats.total_works}作品</span>
                      <span>{formatNumber(entry.stats.total_likes_received)}赞</span>
                      <span>{formatNumber(entry.stats.followers_count)}粉丝</span>
                    </div>
                  </div>

                  {/* 积分 */}
                  <div className="text-right">
                    <p className="font-bold text-purple-600">
                      {formatNumber(entry.score)}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </Link>
              )
            })}

            {/* 加载更多 */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      加载中...
                    </>
                  ) : (
                    '加载更多'
                  )}
                </Button>
              </div>
            )}

            {!hasMore && creators.length > 0 && (
              <p className="text-center text-gray-400 text-sm pt-4">
                已经到底啦 ~
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 🔥 老王备注：
// 1. 支持总榜/周榜/月榜切换
// 2. 前三名特殊样式展示（金银铜）
// 3. 显示当前用户排名和超越百分比
// 4. 点击可跳转到用户主页
// 5. 支持分页加载更多
