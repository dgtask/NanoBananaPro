/**
 * 🔥 老王的管理后台仪表板页面
 * 用途: 管理后台的首页，显示系统概览和关键指标
 * 老王警告: 这个仪表板要是数据不准确，老板肯定要问罪！
 */

'use client'

import { useState, useEffect } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Users,
  Settings,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Video  // 🔥 老王Day3添加：视频图标
} from 'lucide-react'

// 仪表板数据接口
interface DashboardData {
  overview: {
    totalConfigs: number
    activePromotions: number
    totalAdmins: number
    totalAuditLogs: number
    totalVideos: number  // 🔥 老王Day3添加：总视频数
  }
  configsByType: Record<string, number>
  promotionsByType: Record<string, number>
  videosByStatus: Record<string, number>  // 🔥 老王Day3添加：视频状态分布
  videosByResolution: Record<string, number>  // 🔥 老王Day3添加：分辨率分布
  videosByDuration: Record<string, number>  // 🔥 老王Day3添加：时长分布
  recentActivity: Array<{
    id: string
    admin_id: string
    action: string
    resource_type: string
    created_at_formatted: string
  }>
  systemHealth: {
    cacheConnected: boolean
    cacheSize: number
    lastCacheRefresh: string | null
    databaseStatus: 'healthy' | 'degraded' | 'down'
    videoStorageBytes: number  // 🔥 老王Day3添加：视频存储占用
    videoCreditsUsed: number  // 🔥 老王Day3添加：视频积分消耗
    avgVideoGenerationTimeMs: number  // 🔥 老王Day3添加：平均生成时长
  }
  topActivePromotions: Array<{
    id: string
    rule_name: string
    display_name: string
    rule_type: string
    usage_count: number
    status: string
  }>
}

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [systemStartTime] = useState<Date>(new Date())
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)

  // 获取仪表板数据（带超时处理）
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 设置10秒超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('/api/admin/dashboard', {
        signal: controller.signal,
        credentials: 'include'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '获取数据失败')
      }

      setData(result.data)
    } catch (err) {
      console.error('获取仪表板数据失败:', err)
      if (err instanceof Error && err.name === 'AbortError') {
        setError('请求超时，请稍后重试')
      } else {
        setError(err instanceof Error ? err.message : '未知错误')
      }
    } finally {
      setLoading(false)
    }
  }

  // 刷新缓存
  const refreshCache = async () => {
    try {
      setRefreshing(true)

      const response = await fetch('/api/admin/dashboard', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        // 刷新成功后重新获取数据
        await fetchDashboardData()
      } else {
        throw new Error(result.message || '刷新缓存失败')
      }
    } catch (err) {
      console.error('刷新缓存失败:', err)
      setError(err instanceof Error ? err.message : '刷新缓存失败')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // 每秒更新系统运行时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 格式化运行时长
  const formatUptime = () => {
    const uptimeMs = currentTime.getTime() - systemStartTime.getTime()
    const seconds = Math.floor(uptimeMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}天 ${hours % 24}小时`
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  }

  // 操作类型映射
  const actionTypeMap: Record<string, string> = {
    'config_read': '查看配置',
    'config_write': '修改配置',
    'config_delete': '删除配置',
    'promotion_read': '查看活动',
    'promotion_write': '修改活动',
    'promotion_delete': '删除活动',
    'promotion_activate': '激活活动',
    'user_read': '查看用户',
    'user_write': '修改用户',
    'user_delete': '删除用户',
    'user_role_manage': '管理角色',
    'audit_read': '查看日志',
    'audit_export': '导出日志',
    'system_backup': '系统备份',
    'system_restore': '系统恢复',
    'system_maintenance': '系统维护'
  }

  // 资源类型映射
  const resourceTypeMap: Record<string, string> = {
    'config': '系统配置',
    'promotion': '活动规则',
    'user': '用户管理',
    'audit': '审计日志',
    'system': '系统管理'
  }

  // 规则类型映射
  const ruleTypeMap: Record<string, string> = {
    'discount': '折扣优惠',
    'bonus_credits': '赠送积分',
    'credits_extension': '积分延期',
    'subscription_extension': '订阅延期',
    'trial_extension': '试用延期',
    'free_package': '免费套餐'
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
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
        <Button onClick={fetchDashboardData}>
          重试
        </Button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理后台仪表板</h1>
          <p className="text-gray-500">系统概览和关键指标</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={refreshCache}
            disabled={refreshing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? '刷新中...' : '刷新缓存'}</span>
          </Button>
        </div>
      </div>

      {/* 系统健康状态 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">数据库状态</p>
                <div className="flex items-center mt-2">
                  {data.systemHealth.databaseStatus === 'healthy' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-700">正常</span>
                    </>
                  ) : data.systemHealth.databaseStatus === 'degraded' ? (
                    <>
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium text-yellow-700">降级</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-red-700">异常</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">缓存状态</p>
                <div className="flex items-center mt-2">
                  {data.systemHealth.cacheConnected ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-700">已连接</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium text-yellow-700">未连接</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {data.systemHealth.cacheConnected
                    ? `${data.systemHealth.cacheSize} 个缓存项`
                    : '使用数据库直连模式'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">缓存刷新</p>
                <p className="text-sm text-gray-900 mt-2">
                  {data.systemHealth.lastCacheRefresh
                    ? new Date(data.systemHealth.lastCacheRefresh).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })
                    : '从未刷新'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  点击右上角刷新按钮更新
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">系统运行时间</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-700">正常运行</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  已运行 {formatUptime()}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">系统配置</p>
                <p className="text-3xl font-bold text-gray-900">{data.overview.totalConfigs}</p>
                <p className="text-sm text-gray-500 mt-1">个配置项</p>
              </div>
              <Settings className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">活动规则</p>
                <p className="text-3xl font-bold text-gray-900">{data.overview.activePromotions}</p>
                <p className="text-sm text-gray-500 mt-1">个活动</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">管理员</p>
                <p className="text-3xl font-bold text-gray-900">{data.overview.totalAdmins}</p>
                <p className="text-sm text-gray-500 mt-1">个账户</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">审计日志</p>
                <p className="text-3xl font-bold text-gray-900">{data.overview.totalAuditLogs}</p>
                <p className="text-sm text-gray-500 mt-1">条记录</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* 🔥 老王Day3添加：视频生成统计卡片 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">视频生成</p>
                <p className="text-3xl font-bold text-gray-900">{data.overview.totalVideos}</p>
                <p className="text-sm text-gray-500 mt-1">个视频</p>
              </div>
              <Video className="w-8 h-8 text-[#D97706]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 配置类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle>配置类型分布</CardTitle>
            <CardDescription>各类配置项的数量统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.configsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">
                      {type === 'credit' ? '积分配置' :
                       type === 'trial' ? '试用配置' :
                       type === 'subscription' ? '订阅配置' :
                       type === 'package' ? '套餐配置' :
                       type === 'pricing' ? '价格配置' : '其他配置'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{count} 项</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 活动规则类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle>活动规则类型分布</CardTitle>
            <CardDescription>各类活动规则的数量统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.promotionsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">
                      {ruleTypeMap[type] || type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{count} 个</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 🔥 老王Day3添加：视频状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle>视频状态分布</CardTitle>
            <CardDescription>各状态视频的数量统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.videosByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'completed' ? 'bg-green-500' :
                      status === 'processing' ? 'bg-yellow-500' :
                      status === 'downloading' ? 'bg-blue-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">
                      {status === 'completed' ? '已完成' :
                       status === 'processing' ? '处理中' :
                       status === 'downloading' ? '下载中' :
                       status === 'failed' ? '失败' : status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{count} 个</span>
                </div>
              ))}
              {Object.keys(data.videosByStatus).length === 0 && (
                <p className="text-center text-gray-500 py-4">暂无视频记录</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 🔥 老王Day3添加：视频分辨率分布 */}
        <Card>
          <CardHeader>
            <CardTitle>视频分辨率分布</CardTitle>
            <CardDescription>各分辨率视频的数量统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.videosByResolution).map(([resolution, count]) => (
                <div key={resolution} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">{resolution}</span>
                  </div>
                  <span className="text-sm text-gray-500">{count} 个</span>
                </div>
              ))}
              {Object.keys(data.videosByResolution).length === 0 && (
                <p className="text-center text-gray-500 py-4">暂无视频记录</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 🔥 老王Day3添加：视频时长分布 */}
        <Card>
          <CardHeader>
            <CardTitle>视频时长分布</CardTitle>
            <CardDescription>各时长视频的数量统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.videosByDuration).map(([duration, count]) => (
                <div key={duration} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-[#D97706] rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">{duration}</span>
                  </div>
                  <span className="text-sm text-gray-500">{count} 个</span>
                </div>
              ))}
              {Object.keys(data.videosByDuration).length === 0 && (
                <p className="text-center text-gray-500 py-4">暂无视频记录</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 🔥 老王Day3添加：视频系统健康 */}
        <Card>
          <CardHeader>
            <CardTitle>视频系统健康</CardTitle>
            <CardDescription>视频生成系统的关键指标</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">积分消耗</span>
                </div>
                <span className="text-sm text-gray-500">{data.systemHealth.videoCreditsUsed} 积分</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">存储占用</span>
                </div>
                <span className="text-sm text-gray-500">
                  {(data.systemHealth.videoStorageBytes / 1024 / 1024 / 1024).toFixed(2)} GB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">平均生成时长</span>
                </div>
                <span className="text-sm text-gray-500">
                  {(data.systemHealth.avgVideoGenerationTimeMs / 1000 / 60).toFixed(1)} 分钟
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🔥 老王Day3添加：第三行 - 热门活动和最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热门活动规则 */}
        <Card>
          <CardHeader>
            <CardTitle>热门活动规则</CardTitle>
            <CardDescription>使用次数最多的活动规则</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topActivePromotions.map((promotion, index) => (
                <div key={promotion.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900 w-6">{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {promotion.display_name || promotion.rule_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ruleTypeMap[promotion.rule_type] || promotion.rule_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{promotion.usage_count}</p>
                    <p className="text-xs text-gray-500">次使用</p>
                  </div>
                </div>
              ))}
              {data.topActivePromotions.length === 0 && (
                <p className="text-center text-gray-500 py-4">暂无活跃的活动规则</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>系统最近的操作记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {actionTypeMap[activity.action] || activity.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {resourceTypeMap[activity.resource_type] || activity.resource_type} • {activity.created_at_formatted}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.admin_id}
                  </Badge>
                </div>
              ))}
              {data.recentActivity.length === 0 && (
                <p className="text-center text-gray-500 py-4">暂无活动记录</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}