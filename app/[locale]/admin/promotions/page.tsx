/**
 * 管理后台活动规则页面
 * 用途: 管理活动规则的增删改查
 * 老王警告: 这个页面要是配置错了，用户都要薅光羊毛！
 */

'use client'

import { useState, useEffect } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Settings,
  Gift,
  Calendar,
  DollarSign,
  Percent,
  Play,
  Pause
} from 'lucide-react'
import CreateRuleDialog from './create-rule-dialog'

// 活动规则接口
interface PromotionRule {
  id: string
  rule_name: string
  rule_type: 'discount' | 'bonus_credits' | 'credits_extension' | 'subscription_extension' | 'bundle'
  display_name?: string
  display_description?: string
  display_badge?: string
  display_position?: string
  apply_to: {
    type: string
    tiers?: string[]
    package_ids?: string[]
  }
  target_users: {
    type: string
  }
  discount_config?: {
    type: string
    value: number
  }
  bonus_config?: {
    credits: number
    validity_days?: number
  }
  validity?: {
    start_date?: string
    end_date?: string
    usage_limit?: number
  }
  status: 'active' | 'inactive' | 'scheduled'
  priority?: number
  created_at: string
  updated_at: string
}

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [promotions, setPromotions] = useState<PromotionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // 获取活动规则列表
  const fetchPromotions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/promotions', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '获取活动规则失败')
      }

      setPromotions(result.data || [])
    } catch (err) {
      console.error('获取活动规则失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [])

  // 规则类型映射
  const ruleTypeMap: Record<string, { label: string; color: string }> = {
    'discount': { label: '折扣优惠', color: 'bg-blue-100 text-blue-700' },
    'bonus_credits': { label: '赠送积分', color: 'bg-green-100 text-green-700' },
    'credits_extension': { label: '积分延期', color: 'bg-purple-100 text-purple-700' },
    'subscription_extension': { label: '订阅延期', color: 'bg-orange-100 text-orange-700' },
    'bundle': { label: '套餐组合', color: 'bg-pink-100 text-pink-700' }
  }

  // 状态映射
  const statusMap: Record<string, { label: string; color: string }> = {
    'active': { label: '激活', color: 'bg-green-100 text-green-700' },
    'inactive': { label: '未激活', color: 'bg-gray-100 text-gray-700' },
    'scheduled': { label: '已排期', color: 'bg-yellow-100 text-yellow-700' }
  }

  // 过滤活动规则
  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promo.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || promo.rule_type === filterType
    const matchesStatus = filterStatus === 'all' || promo.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
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
        <div className="text-red-500 mb-4">加载失败</div>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchPromotions}>重试</Button>
      </div>
    )
  }

  return (
    <>
      {/* 创建规则对话框 */}
      <CreateRuleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchPromotions}
      />

      <div className="space-y-6">
        {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">活动规则管理</h1>
          <p className="text-gray-500">管理系统的活动规则和优惠配置</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchPromotions} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建规则
          </Button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>搜索规则</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="输入规则名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>规则类型</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="discount">折扣优惠</SelectItem>
                  <SelectItem value="bonus_credits">赠送积分</SelectItem>
                  <SelectItem value="credits_extension">积分延期</SelectItem>
                  <SelectItem value="subscription_extension">订阅延期</SelectItem>
                  <SelectItem value="bundle">套餐组合</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>状态</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                  <SelectItem value="scheduled">已排期</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 活动规则列表 */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPromotions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              暂无活动规则
            </CardContent>
          </Card>
        ) : (
          filteredPromotions.map((promo) => (
            <Card key={promo.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {promo.display_name || promo.rule_name}
                      </h3>
                      <Badge className={ruleTypeMap[promo.rule_type]?.color || ''}>
                        {ruleTypeMap[promo.rule_type]?.label || promo.rule_type}
                      </Badge>
                      <Badge className={statusMap[promo.status]?.color || ''}>
                        {statusMap[promo.status]?.label || promo.status}
                      </Badge>
                    </div>
                    
                    {promo.display_description && (
                      <p className="text-sm text-gray-600 mb-3">{promo.display_description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">规则名称:</span>
                        <span className="ml-2 text-gray-900">{promo.rule_name}</span>
                      </div>
                      {promo.discount_config && (
                        <div>
                          <span className="text-gray-500">折扣:</span>
                          <span className="ml-2 text-gray-900">
                            {promo.discount_config.type === 'percentage' 
                              ? `${promo.discount_config.value}%` 
                              : `$${promo.discount_config.value}`}
                          </span>
                        </div>
                      )}
                      {promo.bonus_config && (
                        <div>
                          <span className="text-gray-500">赠送积分:</span>
                          <span className="ml-2 text-gray-900">{promo.bonus_config.credits}</span>
                        </div>
                      )}
                      {promo.priority !== undefined && (
                        <div>
                          <span className="text-gray-500">优先级:</span>
                          <span className="ml-2 text-gray-900">{promo.priority}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => alert('编辑功能开发中\n\n临时方案：在 Supabase Dashboard 中更新数据')}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const action = promo.status === 'active' ? '暂停' : '启用'
                        alert(`${action}功能开发中\n\n临时方案：使用 API PUT /api/admin/promotions 更新 status 字段`)
                      }}
                    >
                      {promo.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (confirm(`确定要删除规则 "${promo.display_name || promo.rule_name}" 吗？`)) {
                          alert('删除功能开发中\n\n临时方案：使用 API DELETE /api/admin/promotions?ids=' + promo.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
    </>
  )
}
