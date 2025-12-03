/**
 * 🔥 老王的挑战详情/管理页面
 * 用途: 管理后台查看和管理单个挑战的详细信息、提交作品、投票结果
 * 老王警告: 这个页面要是数据加载失败，老王要把代码扔垃圾桶！
 */

'use client'

import { useState, useEffect } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Users,
  Trophy,
  Image as ImageIcon,
  Video,
  ThumbsUp,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings
} from 'lucide-react'

// 挑战数据接口
interface Challenge {
  id: string
  title: string
  description: string
  theme: string
  status: 'draft' | 'active' | 'voting' | 'completed' | 'cancelled'
  start_date: string
  end_date: string
  voting_start_date: string
  voting_end_date: string
  prizes: string
  submission_rules: string
  voting_mechanism: string
  max_submissions_per_user: number
  required_artwork_type: string
  submission_count: number
  vote_count: number
  created_at: string
  updated_at: string
}

// 提交作品接口
interface Submission {
  id: string
  user_id: string
  user_name: string
  artwork_id: string
  artwork_type: 'image' | 'video'
  artwork_url: string
  vote_count: number
  rank: number | null
  submitted_at: string
}

// 状态映射
const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-500' },
  active: { label: '进行中', color: 'bg-green-500' },
  voting: { label: '投票中', color: 'bg-blue-500' },
  completed: { label: '已完成', color: 'bg-purple-500' },
  cancelled: { label: '已取消', color: 'bg-red-500' }
}

export default async function ChallengeDetailPage({
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
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // 获取挑战详情
  const fetchChallengeDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: 调用 GraphQL API 获取挑战详情
      // 暂时使用模拟数据
      const mockChallenge: Challenge = {
        id: challengeId,
        title: '圣诞主题创意挑战',
        description: '创作圣诞主题的作品，获得丰厚奖励！展示你的创意，赢取积分和订阅奖励。',
        theme: 'christmas',
        status: 'active',
        start_date: '2025-11-20T00:00:00Z',
        end_date: '2025-12-25T23:59:59Z',
        voting_start_date: '2025-12-26T00:00:00Z',
        voting_end_date: '2025-12-31T23:59:59Z',
        prizes: JSON.stringify([
          { rank: 1, reward_type: 'credits', reward_value: '1000', description: '一等奖' },
          { rank: 2, reward_type: 'credits', reward_value: '500', description: '二等奖' },
          { rank: 3, reward_type: 'credits', reward_value: '300', description: '三等奖' }
        ]),
        submission_rules: '作品必须符合圣诞主题，不得包含不适当内容。每人最多提交3件作品。',
        voting_mechanism: 'likes',
        max_submissions_per_user: 3,
        required_artwork_type: 'both',
        submission_count: 42,
        vote_count: 156,
        created_at: '2025-11-15T10:00:00Z',
        updated_at: '2025-11-20T08:30:00Z'
      }

      const mockSubmissions: Submission[] = [
        {
          id: '1',
          user_id: 'user1',
          user_name: '用户1',
          artwork_id: 'artwork1',
          artwork_type: 'image',
          artwork_url: '/placeholder-image.jpg',
          vote_count: 45,
          rank: 1,
          submitted_at: '2025-11-22T14:30:00Z'
        },
        {
          id: '2',
          user_id: 'user2',
          user_name: '用户2',
          artwork_id: 'artwork2',
          artwork_type: 'video',
          artwork_url: '/placeholder-video.mp4',
          vote_count: 38,
          rank: 2,
          submitted_at: '2025-11-23T09:15:00Z'
        },
        {
          id: '3',
          user_id: 'user3',
          user_name: '用户3',
          artwork_id: 'artwork3',
          artwork_type: 'image',
          artwork_url: '/placeholder-image-2.jpg',
          vote_count: 32,
          rank: 3,
          submitted_at: '2025-11-24T16:45:00Z'
        }
      ]

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      setChallenge(mockChallenge)
      setSubmissions(mockSubmissions)
    } catch (err) {
      console.error('获取挑战详情失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  // 刷新数据
  const refreshData = async () => {
    setRefreshing(true)
    await fetchChallengeDetail()
    setRefreshing(false)
  }

  // 更新挑战状态
  const updateChallengeStatus = async (newStatus: string) => {
    try {
      console.log(`Updating challenge status to: ${newStatus}`)
      // TODO: 调用 GraphQL Mutation 更新状态
      await new Promise(resolve => setTimeout(resolve, 500))
      // 重新获取数据
      await fetchChallengeDetail()
    } catch (err) {
      console.error('更新状态失败:', err)
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  useEffect(() => {
    fetchChallengeDetail()
  }, [challengeId])

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 解析奖品JSON
  const parsePrizes = (prizesJson: string) => {
    try {
      return JSON.parse(prizesJson)
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 骨架屏 */}
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-white rounded-lg shadow animate-pulse"></div>
        <div className="h-96 bg-white rounded-lg shadow animate-pulse"></div>
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
        <p className="text-gray-500 mb-4">{error || '挑战不存在'}</p>
        <div className="flex items-center justify-center space-x-3">
          <Button variant="outline" onClick={() => router.back()}>
            返回列表
          </Button>
          <Button onClick={fetchChallengeDetail}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
              <Badge className={`${statusMap[challenge.status].color} text-white`}>
                {statusMap[challenge.status].label}
              </Badge>
            </div>
            <p className="text-gray-500">挑战详情和管理</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? '刷新中...' : '刷新'}</span>
          </Button>
          <Button
            onClick={() => router.push(`/admin/challenges/${challengeId}/edit`)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>编辑</span>
          </Button>
        </div>
      </div>

      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">提交作品</p>
                <p className="text-3xl font-bold text-gray-900">{challenge.submission_count}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">总投票数</p>
                <p className="text-3xl font-bold text-gray-900">{challenge.vote_count}</p>
              </div>
              <ThumbsUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">挑战主题</p>
                <p className="text-lg font-bold text-gray-900">{challenge.theme}</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">作品类型</p>
                <p className="text-lg font-bold text-gray-900">
                  {challenge.required_artwork_type === 'image' ? '图片' :
                   challenge.required_artwork_type === 'video' ? '视频' : '图片+视频'}
                </p>
              </div>
              {challenge.required_artwork_type === 'image' ? (
                <ImageIcon className="w-8 h-8 text-purple-500" />
              ) : challenge.required_artwork_type === 'video' ? (
                <Video className="w-8 h-8 text-orange-500" />
              ) : (
                <ImageIcon className="w-8 h-8 text-purple-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览信息</TabsTrigger>
          <TabsTrigger value="submissions">提交作品 ({submissions.length})</TabsTrigger>
          <TabsTrigger value="prizes">奖品配置</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>

        {/* 概览信息 */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>挑战描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{challenge.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>提交规则</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{challenge.submission_rules || '无特殊规则'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>时间安排</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">挑战时间</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">投票时间</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(challenge.voting_start_date)} - {formatDate(challenge.voting_end_date)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 提交作品 */}
        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>提交的作品列表</CardTitle>
              <CardDescription>所有参与挑战的用户作品</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无作品提交</p>
                ) : (
                  submissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded flex items-center justify-center ${
                          submission.artwork_type === 'image' ? 'bg-purple-100' : 'bg-orange-100'
                        }`}>
                          {submission.artwork_type === 'image' ? (
                            <ImageIcon className="w-6 h-6 text-purple-500" />
                          ) : (
                            <Video className="w-6 h-6 text-orange-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{submission.user_name}</p>
                          <p className="text-xs text-gray-500">提交时间: {formatDate(submission.submitted_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{submission.vote_count} 票</p>
                          {submission.rank && (
                            <p className="text-xs text-gray-500">排名: 第{submission.rank}名</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>查看</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 奖品配置 */}
        <TabsContent value="prizes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>奖品配置</CardTitle>
              <CardDescription>挑战的奖励设置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {parsePrizes(challenge.prizes).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无奖品配置</p>
                ) : (
                  parsePrizes(challenge.prizes).map((prize: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            第{prize.rank}名 - {prize.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            奖励: {prize.reward_value} {prize.reward_type === 'credits' ? '积分' : prize.reward_type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 设置 */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>状态管理</CardTitle>
              <CardDescription>管理挑战的当前状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">当前状态</p>
                  <Badge className={`${statusMap[challenge.status].color} text-white`}>
                    {statusMap[challenge.status].label}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {challenge.status === 'draft' && (
                    <Button
                      onClick={() => updateChallengeStatus('active')}
                      variant="default"
                    >
                      发布挑战
                    </Button>
                  )}
                  {challenge.status === 'active' && (
                    <>
                      <Button
                        onClick={() => updateChallengeStatus('voting')}
                        variant="default"
                      >
                        开始投票
                      </Button>
                      <Button
                        onClick={() => updateChallengeStatus('cancelled')}
                        variant="outline"
                      >
                        取消挑战
                      </Button>
                    </>
                  )}
                  {challenge.status === 'voting' && (
                    <Button
                      onClick={() => updateChallengeStatus('completed')}
                      variant="default"
                    >
                      结束挑战
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>其他设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">投票机制</p>
                  <p className="text-xs text-gray-500">
                    {challenge.voting_mechanism === 'likes' ? '点赞投票' :
                     challenge.voting_mechanism === 'jury' ? '评审投票' : '混合投票'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">每人最大提交数</p>
                  <p className="text-xs text-gray-500">{challenge.max_submissions_per_user} 件作品</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
