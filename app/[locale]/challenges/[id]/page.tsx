/**
 * 🔥 老王的挑战详情页面
 * 用途: 显示挑战详细信息、作品列表、投票功能
 * 老王警告: 这个页面信息要是不全，用户看不懂怎么参加！
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
  Trophy,
  Calendar,
  Users,
  Clock,
  Gift,
  ArrowLeft,
  Upload,
  Heart,
  Image as ImageIcon,
  Video,
  Medal,
  AlertCircle,
  Loader2,
  CheckCircle,
  BarChart3
} from 'lucide-react'

// 挑战数据接口
interface Challenge {
  id: string
  title: string
  description: string
  theme: string
  status: 'upcoming' | 'active' | 'voting' | 'completed'
  start_date: string
  end_date: string
  voting_start_date: string
  voting_end_date: string
  submission_rules: string
  voting_mechanism: 'likes' | 'jury' | 'mixed'
  max_submissions_per_user: number
  required_artwork_type: 'image' | 'video' | 'both'
  submission_count: number
  vote_count: number
  prizes: Array<{
    rank: number
    reward_type: string
    reward_value: string
    description: string
  }>
}

// 提交作品接口
interface Submission {
  id: string
  user_id: string
  user_name: string
  user_avatar?: string
  artwork_type: 'image' | 'video'
  artwork_url: string
  thumbnail_url?: string
  title: string
  description?: string
  vote_count: number
  rank?: number
  has_voted: boolean // 当前用户是否已投票
  submitted_at: string
}

// 状态映射
const statusMap: Record<string, { label: string; color: string; description: string }> = {
  upcoming: {
    label: '即将开始',
    color: 'bg-blue-500',
    description: '挑战即将开始，敬请期待！'
  },
  active: {
    label: '进行中',
    color: 'bg-green-500',
    description: '现在可以提交作品参加挑战'
  },
  voting: {
    label: '投票中',
    color: 'bg-purple-500',
    description: '提交已结束，投票进行中'
  },
  completed: {
    label: '已完成',
    color: 'bg-gray-500',
    description: '挑战已结束，查看获奖作品'
  }
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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [votingSubmission, setVotingSubmission] = useState<string | null>(null)

  // 加载挑战数据
  const loadChallengeData = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: 调用 GraphQL API 获取挑战数据和提交列表
      // 暂时使用模拟数据
      const mockChallenge: Challenge = {
        id: challengeId,
        title: '圣诞主题创意挑战',
        description: '创作圣诞主题的作品，获得丰厚奖励！展示你的创意，赢取积分和荣誉！作品可以是图片或视频，内容必须符合圣诞主题。',
        theme: 'christmas',
        status: 'active',
        start_date: '2025-11-20T00:00:00Z',
        end_date: '2025-12-25T23:59:59Z',
        voting_start_date: '2025-12-26T00:00:00Z',
        voting_end_date: '2025-12-31T23:59:59Z',
        submission_rules: '1. 作品必须原创\n2. 内容必须符合圣诞主题\n3. 不得包含不适当内容\n4. 每人最多提交3件作品',
        voting_mechanism: 'likes',
        max_submissions_per_user: 3,
        required_artwork_type: 'both',
        submission_count: 42,
        vote_count: 156,
        prizes: [
          { rank: 1, reward_type: 'credits', reward_value: '1000', description: '一等奖 - 积分奖励' },
          { rank: 2, reward_type: 'credits', reward_value: '500', description: '二等奖 - 积分奖励' },
          { rank: 3, reward_type: 'credits', reward_value: '300', description: '三等奖 - 积分奖励' }
        ]
      }

      const mockSubmissions: Submission[] = [
        {
          id: '1',
          user_id: 'user1',
          user_name: '创意大师',
          user_avatar: undefined,
          artwork_type: 'image',
          artwork_url: '/placeholder-christmas-1.jpg',
          thumbnail_url: '/placeholder-christmas-1.jpg',
          title: '雪中圣诞树',
          description: '温馨的圣诞夜景',
          vote_count: 45,
          rank: 1,
          has_voted: false,
          submitted_at: '2025-11-21T10:30:00Z'
        },
        {
          id: '2',
          user_id: 'user2',
          user_name: '艺术家小王',
          artwork_type: 'video',
          artwork_url: '/placeholder-christmas-2.mp4',
          thumbnail_url: '/placeholder-christmas-2-thumb.jpg',
          title: '圣诞老人的礼物',
          description: '动画短片',
          vote_count: 38,
          rank: 2,
          has_voted: true,
          submitted_at: '2025-11-22T14:20:00Z'
        },
        {
          id: '3',
          user_id: 'user3',
          user_name: '设计师老李',
          artwork_type: 'image',
          artwork_url: '/placeholder-christmas-3.jpg',
          thumbnail_url: '/placeholder-christmas-3.jpg',
          title: '温暖的圣诞小屋',
          vote_count: 32,
          rank: 3,
          has_voted: false,
          submitted_at: '2025-11-23T09:15:00Z'
        }
      ]

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      setChallenge(mockChallenge)
      setSubmissions(mockSubmissions)
    } catch (err) {
      console.error('加载挑战数据失败:', err)
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChallengeData()
  }, [challengeId])

  // 投票处理
  const handleVote = async (submissionId: string) => {
    try {
      setVotingSubmission(submissionId)

      // TODO: 调用 GraphQL Mutation 投票
      console.log('Voting for submission:', submissionId)

      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 500))

      // 更新本地状态
      setSubmissions(prev => prev.map(sub => {
        if (sub.id === submissionId) {
          return {
            ...sub,
            vote_count: sub.has_voted ? sub.vote_count - 1 : sub.vote_count + 1,
            has_voted: !sub.has_voted
          }
        }
        return sub
      }))

      setVotingSubmission(null)
    } catch (err) {
      console.error('投票失败:', err)
      setVotingSubmission(null)
    }
  }

  // 计算剩余天数
  const getRemainingDays = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载挑战详情中...</p>
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

  const statusInfo = statusMap[challenge.status]
  const remainingDays = getRemainingDays(
    challenge.status === 'voting' ? challenge.voting_end_date : challenge.end_date
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 flex items-center space-x-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回挑战列表</span>
      </Button>

      {/* 挑战头部信息 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Badge className={`${statusInfo.color} text-white`}>
                  {statusInfo.label}
                </Badge>
                {remainingDays > 0 && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>还剩 {remainingDays} 天</span>
                  </Badge>
                )}
              </div>
              <CardTitle className="text-3xl mb-2">{challenge.title}</CardTitle>
              <CardDescription className="text-base">
                {challenge.description}
              </CardDescription>
            </div>
            {challenge.status === 'active' && (
              <Button
                onClick={() => router.push(`/challenges/${challengeId}/submit`)}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>提交作品</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 时间范围 */}
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">挑战时间</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(challenge.start_date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                  {' - '}
                  {new Date(challenge.end_date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                </p>
              </div>
            </div>

            {/* 参与统计 */}
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">参与统计</p>
                <p className="text-sm font-medium text-gray-900">
                  {challenge.submission_count} 件作品
                </p>
              </div>
            </div>

            {/* 作品类型 */}
            <div className="flex items-center space-x-3">
              {challenge.required_artwork_type === 'image' && <ImageIcon className="w-5 h-5 text-gray-500" />}
              {challenge.required_artwork_type === 'video' && <Video className="w-5 h-5 text-gray-500" />}
              {challenge.required_artwork_type === 'both' && <ImageIcon className="w-5 h-5 text-gray-500" />}
              <div>
                <p className="text-sm text-gray-500">作品类型</p>
                <p className="text-sm font-medium text-gray-900">
                  {challenge.required_artwork_type === 'image' && '仅图片'}
                  {challenge.required_artwork_type === 'video' && '仅视频'}
                  {challenge.required_artwork_type === 'both' && '图片或视频'}
                </p>
              </div>
            </div>

            {/* 最大提交数 */}
            <div className="flex items-center space-x-3">
              <Trophy className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">每人最多</p>
                <p className="text-sm font-medium text-gray-900">
                  {challenge.max_submissions_per_user} 件作品
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 标签页内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">挑战详情</TabsTrigger>
          <TabsTrigger value="submissions">
            参赛作品 ({submissions.length})
          </TabsTrigger>
          <TabsTrigger value="prizes">奖品设置</TabsTrigger>
        </TabsList>

        {/* 挑战详情 Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>规则说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {challenge.submission_rules}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>投票机制</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {challenge.voting_mechanism === 'likes' && '点赞投票：获得最多点赞的作品获胜'}
                {challenge.voting_mechanism === 'jury' && '评审投票：由评审团决定获奖作品'}
                {challenge.voting_mechanism === 'mixed' && '混合投票：结合点赞数和评审分数'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                投票时间: {formatDate(challenge.voting_start_date)} - {formatDate(challenge.voting_end_date)}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 参赛作品 Tab */}
        <TabsContent value="submissions" className="space-y-4">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无提交作品</p>
                {challenge.status === 'active' && (
                  <Button
                    onClick={() => router.push(`/challenges/${challengeId}/submit`)}
                    className="mt-4"
                  >
                    成为第一个提交者
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {submission.user_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {submission.user_name}
                          </p>
                          {submission.rank && submission.rank <= 3 && (
                            <div className="flex items-center space-x-1">
                              <Medal className={`w-4 h-4 ${
                                submission.rank === 1 ? 'text-yellow-500' :
                                submission.rank === 2 ? 'text-gray-400' :
                                'text-orange-600'
                              }`} />
                              <span className="text-xs text-gray-500">
                                第 {submission.rank} 名
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {submission.artwork_type === 'image' && <ImageIcon className="w-3 h-3" />}
                        {submission.artwork_type === 'video' && <Video className="w-3 h-3" />}
                        <span className="text-xs">
                          {submission.artwork_type === 'image' ? '图片' : '视频'}
                        </span>
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{submission.title}</CardTitle>
                    {submission.description && (
                      <CardDescription className="line-clamp-2">
                        {submission.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {/* 作品缩略图占位 */}
                    <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      {submission.artwork_type === 'image' ? (
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      ) : (
                        <Video className="w-12 h-12 text-gray-400" />
                      )}
                    </div>

                    {/* 投票按钮 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Heart className={`w-5 h-5 ${submission.has_voted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {submission.vote_count} 票
                        </span>
                      </div>
                      {(challenge.status === 'voting' || challenge.status === 'active') && (
                        <Button
                          variant={submission.has_voted ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleVote(submission.id)}
                          disabled={votingSubmission === submission.id}
                          className="flex items-center space-x-1"
                        >
                          {votingSubmission === submission.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>处理中...</span>
                            </>
                          ) : (
                            <>
                              <Heart className="w-4 h-4" />
                              <span>{submission.has_voted ? '取消投票' : '投票'}</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      提交于 {formatDate(submission.submitted_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 查看排行榜按钮 */}
          {submissions.length > 0 && (challenge.status === 'voting' || challenge.status === 'completed') && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/challenges/${challengeId}/leaderboard`)}
                className="flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>查看完整排行榜</span>
              </Button>
            </div>
          )}
        </TabsContent>

        {/* 奖品设置 Tab */}
        <TabsContent value="prizes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="w-5 h-5" />
                <span>奖品列表</span>
              </CardTitle>
              <CardDescription>
                获奖作品将获得以下奖励
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {challenge.prizes.map((prize, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Medal className={`w-6 h-6 ${
                        prize.rank === 1 ? 'text-yellow-500' :
                        prize.rank === 2 ? 'text-gray-400' :
                        prize.rank === 3 ? 'text-orange-600' :
                        'text-gray-300'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          第 {prize.rank} 名
                        </p>
                        <p className="text-sm text-gray-500">
                          {prize.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {prize.reward_value}
                      </p>
                      <p className="text-sm text-gray-500">
                        {prize.reward_type === 'credits' ? '积分' : prize.reward_type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
