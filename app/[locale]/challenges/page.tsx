/**
 * 🔥 老王的用户挑战列表页面
 * 用途: 显示所有进行中和即将开始的创意挑战
 * 老王警告: 这个页面要是挑战信息显示不清楚，用户肯定不参加！
 */

'use client'

import { useState, useEffect } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Calendar,
  Users,
  Clock,
  Gift,
  ArrowRight,
  Filter,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Video
} from 'lucide-react'

// 挑战数据接口
interface Challenge {
  id: string
  title: string
  description: string
  theme: string
  status: 'upcoming' | 'active' | 'voting'
  start_date: string
  end_date: string
  voting_start_date: string
  voting_end_date: string
  submission_count: number
  vote_count: number
  max_submissions_per_user: number
  required_artwork_type: 'image' | 'video' | 'both'
  prizes: Array<{
    rank: number
    reward_type: string
    reward_value: string
    description: string
  }>
}

// 状态映射
const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  upcoming: {
    label: '即将开始',
    color: 'bg-blue-500',
    icon: <Clock className="w-4 h-4" />
  },
  active: {
    label: '进行中',
    color: 'bg-green-500',
    icon: <Trophy className="w-4 h-4" />
  },
  voting: {
    label: '投票中',
    color: 'bg-purple-500',
    icon: <Users className="w-4 h-4" />
  }
}

export default async function ChallengesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 获取挑战列表
  const fetchChallenges = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: 调用 GraphQL API 获取挑战列表
      // 暂时使用模拟数据
      const mockChallenges: Challenge[] = [
        {
          id: '1',
          title: '圣诞主题创意挑战',
          description: '创作圣诞主题的作品，获得丰厚奖励！展示你的创意，赢取积分和荣誉！',
          theme: 'christmas',
          status: 'active',
          start_date: '2025-11-20T00:00:00Z',
          end_date: '2025-12-25T23:59:59Z',
          voting_start_date: '2025-12-26T00:00:00Z',
          voting_end_date: '2025-12-31T23:59:59Z',
          submission_count: 42,
          vote_count: 156,
          max_submissions_per_user: 3,
          required_artwork_type: 'both',
          prizes: [
            { rank: 1, reward_type: 'credits', reward_value: '1000', description: '一等奖' },
            { rank: 2, reward_type: 'credits', reward_value: '500', description: '二等奖' },
            { rank: 3, reward_type: 'credits', reward_value: '300', description: '三等奖' }
          ]
        },
        {
          id: '2',
          title: '新年创意挑战',
          description: '新年新气象，用你的创意迎接2026！',
          theme: 'new_year',
          status: 'upcoming',
          start_date: '2025-12-28T00:00:00Z',
          end_date: '2026-01-10T23:59:59Z',
          voting_start_date: '2026-01-11T00:00:00Z',
          voting_end_date: '2026-01-15T23:59:59Z',
          submission_count: 0,
          vote_count: 0,
          max_submissions_per_user: 5,
          required_artwork_type: 'both',
          prizes: [
            { rank: 1, reward_type: 'credits', reward_value: '2000', description: '一等奖' },
            { rank: 2, reward_type: 'credits', reward_value: '1000', description: '二等奖' },
            { rank: 3, reward_type: 'credits', reward_value: '500', description: '三等奖' }
          ]
        },
        {
          id: '3',
          title: '冬日风景摄影挑战',
          description: '捕捉冬日的美丽瞬间，分享你眼中的冬天！',
          theme: 'winter',
          status: 'voting',
          start_date: '2025-11-01T00:00:00Z',
          end_date: '2025-11-30T23:59:59Z',
          voting_start_date: '2025-12-01T00:00:00Z',
          voting_end_date: '2025-12-07T23:59:59Z',
          submission_count: 87,
          vote_count: 342,
          max_submissions_per_user: 3,
          required_artwork_type: 'image',
          prizes: [
            { rank: 1, reward_type: 'credits', reward_value: '1500', description: '一等奖' },
            { rank: 2, reward_type: 'credits', reward_value: '800', description: '二等奖' },
            { rank: 3, reward_type: 'credits', reward_value: '400', description: '三等奖' }
          ]
        }
      ]

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      setChallenges(mockChallenges)
    } catch (err) {
      console.error('获取挑战列表失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenges()
  }, [])

  // 过滤挑战列表
  const filteredChallenges = statusFilter === 'all'
    ? challenges
    : challenges.filter(c => c.status === statusFilter)

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 计算剩余天数
  const getRemainingDays = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载挑战列表中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchChallenges}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Trophy className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-900">创意挑战</h1>
        </div>
        <p className="text-gray-600">
          参加创意挑战，展示你的才华，赢取丰厚奖励！
        </p>
      </div>

      {/* 状态过滤器 */}
      <div className="flex items-center space-x-2 mb-6">
        <Filter className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">筛选:</span>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          全部 ({challenges.length})
        </Button>
        {Object.entries(statusMap).map(([status, { label }]) => {
          const count = challenges.filter(c => c.status === status).length
          if (count === 0) return null
          return (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {label} ({count})
            </Button>
          )
        })}
      </div>

      {/* 挑战列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {statusFilter === 'all' ? '暂无挑战' : `暂无${statusMap[statusFilter]?.label}的挑战`}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredChallenges.map((challenge) => {
            const statusInfo = statusMap[challenge.status]
            const remainingDays = getRemainingDays(
              challenge.status === 'voting' ? challenge.voting_end_date : challenge.end_date
            )

            return (
              <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${statusInfo.color} text-white flex items-center space-x-1`}>
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </Badge>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      {challenge.required_artwork_type === 'image' && (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      {challenge.required_artwork_type === 'video' && (
                        <Video className="w-4 h-4" />
                      )}
                      {challenge.required_artwork_type === 'both' && (
                        <>
                          <ImageIcon className="w-4 h-4" />
                          <Video className="w-4 h-4" />
                        </>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{challenge.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {challenge.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* 时间信息 */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {challenge.status === 'voting'
                          ? `投票截止: ${formatDate(challenge.voting_end_date)}`
                          : `截止: ${formatDate(challenge.end_date)}`
                        }
                      </span>
                    </div>

                    {/* 剩余天数 */}
                    {remainingDays > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-orange-600">
                        <Clock className="w-4 h-4" />
                        <span>还剩 {remainingDays} 天</span>
                      </div>
                    )}

                    {/* 参与统计 */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {challenge.submission_count} 件作品
                        {challenge.status === 'voting' && ` · ${challenge.vote_count} 票`}
                      </span>
                    </div>

                    {/* 奖品信息 */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Gift className="w-4 h-4" />
                      <span>
                        {challenge.prizes.length} 个奖项 · 最高 {challenge.prizes[0]?.reward_value} 积分
                      </span>
                    </div>

                    {/* 操作按钮 */}
                    <div className="pt-3 border-t border-gray-200">
                      <Button
                        onClick={() => router.push(`/challenges/${challenge.id}`)}
                        className="w-full flex items-center justify-center space-x-2"
                      >
                        <span>
                          {challenge.status === 'upcoming' && '查看详情'}
                          {challenge.status === 'active' && '立即参加'}
                          {challenge.status === 'voting' && '参与投票'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 底部提示 */}
      {filteredChallenges.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            共 {filteredChallenges.length} 个挑战
            {statusFilter !== 'all' && ` · ${statusMap[statusFilter]?.label}`}
          </p>
        </div>
      )}
    </div>
  )
}
