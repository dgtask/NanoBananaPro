/**
 * 🔥 老王的挑战排行榜页面
 * 用途: 显示挑战作品的排名榜单,展示投票结果
 * 老王警告: 这个页面要是排名显示不清楚,用户肯定不服气！
 */

'use client'

import { useState, useEffect } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Trophy,
  Medal,
  Heart,
  Users,
  Calendar,
  AlertCircle,
  Loader2,
  Crown,
  TrendingUp,
  Image as ImageIcon,
  Video,
  Filter
} from 'lucide-react'

// 挑战数据接口
interface Challenge {
  id: string
  title: string
  description: string
  status: 'upcoming' | 'active' | 'voting' | 'completed'
  voting_end_date: string
  prizes: Array<{
    rank: number
    reward_type: string
    reward_value: string
    description: string
  }>
}

// 排行榜条目接口
interface LeaderboardEntry {
  rank: number
  submission_id: string
  user_id: string
  user_name: string
  user_avatar?: string
  artwork_type: 'image' | 'video'
  artwork_url: string
  thumbnail_url?: string
  title: string
  description?: string
  vote_count: number
  submitted_at: string
  prize?: {
    rank: number
    reward_type: string
    reward_value: string
    description: string
  }
}

// 排序方式
type SortBy = 'votes' | 'time'

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const router = useRouter()
  const params = useParams()
  const challengeId = params.id as string

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('votes')

  // 加载挑战和排行榜数据
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: 调用 GraphQL API 获取挑战和排行榜数据
      // 暂时使用模拟数据
      const mockChallenge: Challenge = {
        id: challengeId,
        title: '圣诞主题创意挑战',
        description: '创作圣诞主题的作品,获得丰厚奖励！',
        status: 'voting',
        voting_end_date: '2025-12-31T23:59:59Z',
        prizes: [
          { rank: 1, reward_type: 'credits', reward_value: '1000', description: '一等奖' },
          { rank: 2, reward_type: 'credits', reward_value: '500', description: '二等奖' },
          { rank: 3, reward_type: 'credits', reward_value: '300', description: '三等奖' }
        ]
      }

      const mockLeaderboard: LeaderboardEntry[] = [
        {
          rank: 1,
          submission_id: '1',
          user_id: 'u1',
          user_name: 'Alice',
          artwork_type: 'image',
          artwork_url: 'https://placehold.co/400x300',
          thumbnail_url: 'https://placehold.co/400x300',
          title: '雪夜圣诞树',
          description: '温馨的圣诞夜晚,雪花飘落在装饰华丽的圣诞树上',
          vote_count: 342,
          submitted_at: '2025-11-25T10:00:00Z',
          prize: mockChallenge.prizes[0]
        },
        {
          rank: 2,
          submission_id: '2',
          user_id: 'u2',
          user_name: 'Bob',
          artwork_type: 'image',
          artwork_url: 'https://placehold.co/400x300',
          thumbnail_url: 'https://placehold.co/400x300',
          title: '圣诞老人的礼物工坊',
          description: '忙碌的圣诞老人和精灵们在准备礼物',
          vote_count: 287,
          submitted_at: '2025-11-26T14:30:00Z',
          prize: mockChallenge.prizes[1]
        },
        {
          rank: 3,
          submission_id: '3',
          user_id: 'u3',
          user_name: 'Carol',
          artwork_type: 'video',
          artwork_url: 'https://example.com/video3.mp4',
          thumbnail_url: 'https://placehold.co/400x300',
          title: '圣诞音乐盒',
          description: '精美的圣诞音乐盒,伴随着悠扬的音乐',
          vote_count: 256,
          submitted_at: '2025-11-27T09:15:00Z',
          prize: mockChallenge.prizes[2]
        },
        {
          rank: 4,
          submission_id: '4',
          user_id: 'u4',
          user_name: 'David',
          artwork_type: 'image',
          artwork_url: 'https://placehold.co/400x300',
          thumbnail_url: 'https://placehold.co/400x300',
          title: '温馨的圣诞家庭聚会',
          description: '一家人围坐在壁炉旁,享受圣诞时光',
          vote_count: 198,
          submitted_at: '2025-11-28T16:45:00Z'
        },
        {
          rank: 5,
          submission_id: '5',
          user_id: 'u5',
          user_name: 'Emma',
          artwork_type: 'image',
          artwork_url: 'https://placehold.co/400x300',
          thumbnail_url: 'https://placehold.co/400x300',
          title: '雪中的驯鹿',
          description: '可爱的驯鹿在雪地里奔跑',
          vote_count: 167,
          submitted_at: '2025-11-29T11:20:00Z'
        },
        {
          rank: 6,
          submission_id: '6',
          user_id: 'u6',
          user_name: 'Frank',
          artwork_type: 'video',
          artwork_url: 'https://example.com/video6.mp4',
          thumbnail_url: 'https://placehold.co/400x300',
          title: '圣诞烟火秀',
          description: '璀璨的圣诞烟火照亮夜空',
          vote_count: 142,
          submitted_at: '2025-11-30T13:10:00Z'
        }
      ]

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      setChallenge(mockChallenge)
      setLeaderboard(mockLeaderboard)
    } catch (err) {
      console.error('加载排行榜失败:', err)
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [challengeId])

  // 排序排行榜
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.vote_count - a.vote_count
    } else {
      return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    }
  })

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 获取奖牌颜色和图标
  const getMedalDisplay = (rank: number) => {
    if (rank === 1) {
      return {
        icon: <Crown className="w-6 h-6 text-yellow-500" />,
        bgColor: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
        borderColor: 'border-yellow-400',
        textColor: 'text-yellow-700'
      }
    } else if (rank === 2) {
      return {
        icon: <Medal className="w-6 h-6 text-gray-500" />,
        bgColor: 'bg-gradient-to-br from-gray-100 to-gray-200',
        borderColor: 'border-gray-400',
        textColor: 'text-gray-700'
      }
    } else if (rank === 3) {
      return {
        icon: <Medal className="w-6 h-6 text-orange-600" />,
        bgColor: 'bg-gradient-to-br from-orange-100 to-orange-200',
        borderColor: 'border-orange-400',
        textColor: 'text-orange-700'
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载排行榜中...</p>
        </div>
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-4">{error || '挑战不存在'}</p>
          <Button onClick={() => router.back()}>
            返回
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面头部 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center space-x-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">挑战排行榜</h1>
            </div>
            <p className="text-gray-600">{challenge.title}</p>
          </div>

          {/* 排序选择器 */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="votes">按票数排序</SelectItem>
                <SelectItem value="time">按时间排序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 统计信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">参赛作品</p>
                <p className="text-2xl font-bold text-gray-900">{leaderboard.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总投票数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaderboard.reduce((sum, entry) => sum + entry.vote_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {challenge.status === 'completed' ? '已结束' : '截止日期'}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(challenge.voting_end_date)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 排行榜列表 */}
      <div className="space-y-4">
        {sortedLeaderboard.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无作品</p>
            </CardContent>
          </Card>
        ) : (
          sortedLeaderboard.map((entry) => {
            const medalDisplay = getMedalDisplay(entry.rank)

            return (
              <Card
                key={entry.submission_id}
                className={`hover:shadow-lg transition-shadow ${
                  medalDisplay ? `border-2 ${medalDisplay.borderColor}` : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* 排名徽章 */}
                    <div className="flex-shrink-0">
                      {medalDisplay ? (
                        <div className={`w-16 h-16 rounded-full ${medalDisplay.bgColor} flex items-center justify-center border-2 ${medalDisplay.borderColor}`}>
                          {medalDisplay.icon}
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-300">
                          <span className="text-2xl font-bold text-gray-600">
                            {entry.rank}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 作品缩略图 */}
                    <div className="flex-shrink-0">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-200">
                        {entry.thumbnail_url && (
                          <img
                            src={entry.thumbnail_url}
                            alt={entry.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-1">
                          {entry.artwork_type === 'image' ? (
                            <ImageIcon className="w-4 h-4 text-white" />
                          ) : (
                            <Video className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 作品信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {entry.title}
                          </h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {entry.user_name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">{entry.user_name}</span>
                          </div>
                          {entry.description && (
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {entry.description}
                            </p>
                          )}
                        </div>

                        {/* 投票数显示 */}
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex items-center space-x-2">
                            <Heart className="w-5 h-5 text-red-500 fill-current" />
                            <span className="text-xl font-bold text-gray-900">
                              {entry.vote_count}
                            </span>
                          </div>
                          {entry.rank <= 3 && (
                            <Badge
                              className={`${
                                medalDisplay?.bgColor || 'bg-gray-100'
                              } ${
                                medalDisplay?.textColor || 'text-gray-700'
                              } border-0`}
                            >
                              第 {entry.rank} 名
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* 奖品信息 */}
                      {entry.prize && (
                        <div className={`mt-3 p-3 rounded-lg ${medalDisplay?.bgColor || 'bg-gray-100'}`}>
                          <div className="flex items-center space-x-2">
                            <Trophy className={`w-4 h-4 ${medalDisplay?.textColor || 'text-gray-600'}`} />
                            <span className={`text-sm font-medium ${medalDisplay?.textColor || 'text-gray-700'}`}>
                              {entry.prize.description}: {entry.prize.reward_value} 积分
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 提交时间 */}
                      <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>提交于 {formatDate(entry.submitted_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 底部说明 */}
      {sortedLeaderboard.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            共 {sortedLeaderboard.length} 件作品参赛
            {challenge.status === 'completed' && ' · 挑战已结束'}
            {challenge.status === 'voting' && ' · 投票进行中'}
          </p>
        </div>
      )}
    </div>
  )
}
