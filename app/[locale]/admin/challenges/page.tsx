/**
 * 🔥 老王的挑战管理列表页面
 * 用途: 管理后台的挑战列表，显示所有挑战及其状态
 * 老王警告: 这个页面要是挑战状态显示不准确，用户肯定要投诉！
 */

'use client'

import { useState, useEffect } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Calendar,
  Trophy,
  Users,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
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
  submission_count: number
  vote_count: number
  created_at: string
  updated_at: string
}

// 状态映射
const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-500' },
  active: { label: '进行中', color: 'bg-green-500' },
  voting: { label: '投票中', color: 'bg-blue-500' },
  completed: { label: '已完成', color: 'bg-purple-500' },
  cancelled: { label: '已取消', color: 'bg-red-500' }
}

export default async function AdminChallengesPage({
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
  const [refreshing, setRefreshing] = useState(false)
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
          description: '创作圣诞主题的作品，获得丰厚奖励！',
          theme: 'christmas',
          status: 'active',
          start_date: '2025-11-20T00:00:00Z',
          end_date: '2025-12-25T23:59:59Z',
          voting_start_date: '2025-12-26T00:00:00Z',
          voting_end_date: '2025-12-31T23:59:59Z',
          submission_count: 42,
          vote_count: 156,
          created_at: '2025-11-15T10:00:00Z',
          updated_at: '2025-11-20T08:30:00Z'
        },
        {
          id: '2',
          title: '新年创意挑战',
          description: '新年新气象，用你的创意迎接2026！',
          theme: 'new_year',
          status: 'draft',
          start_date: '2025-12-28T00:00:00Z',
          end_date: '2026-01-10T23:59:59Z',
          voting_start_date: '2026-01-11T00:00:00Z',
          voting_end_date: '2026-01-15T23:59:59Z',
          submission_count: 0,
          vote_count: 0,
          created_at: '2025-11-25T14:20:00Z',
          updated_at: '2025-11-25T14:20:00Z'
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

  // 刷新列表
  const refreshList = async () => {
    setRefreshing(true)
    await fetchChallenges()
    setRefreshing(false)
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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 骨架屏 */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchChallenges}>
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">挑战管理</h1>
          <p className="text-gray-500">创建和管理创意挑战活动</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={refreshList}
            disabled={refreshing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? '刷新中...' : '刷新'}</span>
          </Button>
          <Button
            onClick={() => router.push('/admin/challenges/create')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>创建挑战</span>
          </Button>
        </div>
      </div>

      {/* 状态过滤器 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">状态过滤:</span>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          全部 ({challenges.length})
        </Button>
        {Object.entries(statusMap).map(([status, { label }]) => {
          const count = challenges.filter(c => c.status === status).length
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
      <div className="grid grid-cols-1 gap-6">
        {filteredChallenges.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {statusFilter === 'all' ? '暂无挑战' : `暂无${statusMap[statusFilter]?.label}的挑战`}
              </p>
              <Button onClick={() => router.push('/admin/challenges/create')}>
                <Plus className="w-4 h-4 mr-2" />
                创建第一个挑战
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredChallenges.map((challenge) => (
            <Card key={challenge.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{challenge.title}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                  </div>
                  <Badge className={`${statusMap[challenge.status].color} text-white`}>
                    {statusMap[challenge.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* 主题 */}
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">主题</p>
                      <p className="text-sm font-medium text-gray-900">{challenge.theme}</p>
                    </div>
                  </div>

                  {/* 挑战时间 */}
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">挑战时间</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
                      </p>
                    </div>
                  </div>

                  {/* 提交数量 */}
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">提交数量</p>
                      <p className="text-sm font-medium text-gray-900">{challenge.submission_count} 个作品</p>
                    </div>
                  </div>

                  {/* 投票数量 */}
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">投票数量</p>
                      <p className="text-sm font-medium text-gray-900">{challenge.vote_count} 票</p>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/challenges/${challenge.id}`)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>查看详情</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/challenges/${challenge.id}/edit`)}
                    className="flex items-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>编辑</span>
                  </Button>
                  {challenge.status === 'draft' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Clock className="w-4 h-4" />
                      <span>发布</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 统计摘要 */}
      {filteredChallenges.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">总挑战数</p>
                <p className="text-3xl font-bold text-gray-900">{challenges.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">总提交数</p>
                <p className="text-3xl font-bold text-gray-900">
                  {challenges.reduce((sum, c) => sum + c.submission_count, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">总投票数</p>
                <p className="text-3xl font-bold text-gray-900">
                  {challenges.reduce((sum, c) => sum + c.vote_count, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">进行中的挑战</p>
                <p className="text-3xl font-bold text-gray-900">
                  {challenges.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
