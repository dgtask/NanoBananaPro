/**
 * 🔥 老王的系统配置管理页面 - 智能表单版本
 * 用途: 管理系统配置的增删改查界面
 * 老王修复: 根据配置类型自动显示对应字段，不要让用户手写JSON！
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Settings,
  CreditCard,
  Gift,
  Calendar,
  Package,
  DollarSign,
  Eye,
  Cpu
} from 'lucide-react'

// 配置项接口
interface ConfigItem {
  config_key: string
  config_value: any
  config_type: string
  description?: string
  version: number
  is_active: boolean
  updated_at: string
  created_at: string
}

// 智能表单字段状态
interface SmartFormFields {
  // 通用字段
  config_key: string
  config_type: string
  description: string

  // 积分消耗配置 (credit_cost)
  amount?: number
  unit?: string

  // 试用配置 (trial)
  trial_credits?: number
  trial_validity_days?: number

  // 订阅配置 (subscription)
  tier?: string
  billing_cycle?: 'monthly' | 'yearly'
  price?: number
  currency?: string
  monthly_credits?: number
  validity_days?: number
  monthly_validity_days?: number
  bonus_percentage?: number
  bonus_credits?: number
  total_credits?: number

  // 积分包配置 (package)
  package_name?: string
  credits?: number
  package_validity_days?: number

  // 价格配置 (pricing)
  subscription_order?: string
  package_order?: string

  // LLM配置 (llm)
  llm_provider?: string
  llm_service_type?: string
  llm_api_url?: string
  llm_api_key?: string
  llm_model_name?: string
  llm_quick_model?: string
  llm_detailed_model?: string
  llm_timeout?: number
}

// 配置类型映射
const configTypeMap: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  'credit_cost': {
    name: '积分消耗',
    icon: <CreditCard className="w-4 h-4" />,
    color: 'blue'
  },
  'trial': {
    name: '试用配置',
    icon: <Calendar className="w-4 h-4" />,
    color: 'green'
  },
  'subscription': {
    name: '订阅配置',
    icon: <Package className="w-4 h-4" />,
    color: 'purple'
  },
  'package': {
    name: '套餐配置',
    icon: <Gift className="w-4 h-4" />,
    color: 'orange'
  },
  'pricing': {
    name: '价格配置',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'red'
  },
  'llm': {
    name: 'LLM配置',
    icon: <Cpu className="w-4 h-4" />,
    color: 'cyan'
  }
}

export default async function ConfigManagement({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [filteredConfigs, setFilteredConfigs] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ConfigItem | null>(null)
  const [showJsonPreview, setShowJsonPreview] = useState(false)

  // 🔥 智能表单状态
  const [formFields, setFormFields] = useState<SmartFormFields>({
    config_key: '',
    config_type: 'credit_cost',
    description: '',
    currency: 'USD',
    unit: 'credits'
  })

  // 获取配置列表
  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/config?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '获取配置失败')
      }

      setConfigs(result.data)
      setFilteredConfigs(result.data)
    } catch (err) {
      console.error('获取配置失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, searchTerm])

  // 🔥 根据字段生成配置值JSON
  const generateConfigValue = (): any => {
    const { config_type } = formFields

    switch (config_type) {
      case 'credit_cost':
        return {
          amount: formFields.amount || 0,
          unit: formFields.unit || 'credits',
          description: `每次消耗${formFields.amount || 0}积分`
        }

      case 'trial':
        return {
          credits: formFields.trial_credits || 0,
          validity_days: formFields.trial_validity_days || 0,
          description: `新用户试用：${formFields.trial_credits}积分（${formFields.trial_validity_days}天有效）`
        }

      case 'subscription':
        if (formFields.billing_cycle === 'monthly') {
          return {
            tier: formFields.tier || 'basic',
            billing_cycle: 'monthly',
            price: formFields.price || 0,
            currency: formFields.currency || 'USD',
            monthly_credits: formFields.monthly_credits || 0,
            validity_days: 30,
            description: `${formFields.tier}套餐月付：每月${formFields.monthly_credits}积分（30天有效）`
          }
        } else {
          const monthlyCredits = formFields.monthly_credits || 0
          const bonusPercentage = formFields.bonus_percentage || 0
          const bonusCredits = Math.round(monthlyCredits * 12 * bonusPercentage / 100)
          const totalCredits = monthlyCredits * 12 + bonusCredits

          return {
            tier: formFields.tier || 'basic',
            billing_cycle: 'yearly',
            price: formFields.price || 0,
            currency: formFields.currency || 'USD',
            monthly_credits: monthlyCredits,
            monthly_validity_days: 30,
            bonus_credits: bonusCredits,
            bonus_validity_days: 365,
            total_credits: totalCredits,
            bonus_percentage: bonusPercentage,
            description: `${formFields.tier}套餐年付：每月${monthlyCredits}积分（30天有效），一次性赠送${bonusCredits}积分（365天有效）`
          }
        }

      case 'package':
        const credits = formFields.credits || 0
        const bonusPercentage = formFields.bonus_percentage || 0
        const bonusCredits = Math.round(credits * bonusPercentage / 100)
        const totalCredits = credits + bonusCredits

        if (bonusPercentage > 0) {
          return {
            name: formFields.package_name || '',
            price: formFields.price || 0,
            currency: formFields.currency || 'USD',
            credits,
            bonus_credits: bonusCredits,
            total_credits: totalCredits,
            validity_days: formFields.package_validity_days || 365,
            bonus_percentage: bonusPercentage,
            description: `${formFields.package_name}积分包：${credits}积分+${bonusPercentage}%赠送（${formFields.package_validity_days}天有效）`
          }
        } else {
          return {
            name: formFields.package_name || '',
            price: formFields.price || 0,
            currency: formFields.currency || 'USD',
            credits,
            validity_days: formFields.package_validity_days || 365,
            bonus_percentage: 0,
            description: `${formFields.package_name}积分包：${credits}积分（${formFields.package_validity_days}天有效）`
          }
        }

      case 'pricing':
        return {
          subscription: formFields.subscription_order?.split(',').map(s => s.trim()) || [],
          package: formFields.package_order?.split(',').map(s => s.trim()) || []
        }

      case 'llm':
        const baseConfig: any = {
          provider: formFields.llm_provider || 'google',
          service_type: formFields.llm_service_type || 'image_generation',
          api_url: formFields.llm_api_url || '',
          api_key: formFields.llm_api_key || '',  // 🔥 明文传递，后端会自动加密
          timeout: formFields.llm_timeout || 60000,
          description: formFields.description || ''
        }

        // 根据服务类型添加专用字段
        if (formFields.llm_service_type === 'image_generation') {
          baseConfig.model_name = formFields.llm_model_name || ''
        } else if (formFields.llm_service_type === 'prompt_optimization') {
          baseConfig.quick_model = formFields.llm_quick_model || ''
          baseConfig.detailed_model = formFields.llm_detailed_model || ''
        }

        return baseConfig

      default:
        return {}
    }
  }

  // 创建配置
  const createConfig = async () => {
    try {
      const config_value = generateConfigValue()

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config_key: formFields.config_key,
          config_value,
          config_type: formFields.config_type,
          description: formFields.description,
          updated_by: 'admin'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '创建配置失败')
      }

      await fetchConfigs()
      setShowCreateModal(false)
      resetForm()
      alert('配置创建成功！')
    } catch (err) {
      console.error('创建配置失败:', err)
      alert('创建配置失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  // 更新配置
  const updateConfig = async () => {
    if (!editingConfig) return

    try {
      const config_value = generateConfigValue()

      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          updates: [{
            config_key: formFields.config_key,
            config_value,
            updated_by: 'admin'
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '更新配置失败')
      }

      await fetchConfigs()
      setEditingConfig(null)
      resetForm()
      alert('配置更新成功！')
    } catch (err) {
      console.error('更新配置失败:', err)
      alert('更新配置失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormFields({
      config_key: '',
      config_type: 'credit_cost',
      description: '',
      currency: 'USD',
      unit: 'credits'
    })
    setShowJsonPreview(false)
  }

  // 编辑配置
  const handleEdit = (config: ConfigItem) => {
    setEditingConfig(config)

    // 🔥 老王修复：从配置值反向填充表单字段
    const value = config.config_value
    const baseFields: SmartFormFields = {
      config_key: config.config_key,
      config_type: config.config_type,
      description: config.description || ''
    }

    switch (config.config_type) {
      case 'credit_cost':
        setFormFields({
          ...baseFields,
          amount: value.amount,
          unit: value.unit
        })
        break

      case 'trial':
        setFormFields({
          ...baseFields,
          trial_credits: value.credits,
          trial_validity_days: value.validity_days
        })
        break

      case 'subscription':
        setFormFields({
          ...baseFields,
          tier: value.tier,
          billing_cycle: value.billing_cycle,
          price: value.price,
          currency: value.currency,
          monthly_credits: value.monthly_credits,
          bonus_percentage: value.bonus_percentage || 0
        })
        break

      case 'package':
        setFormFields({
          ...baseFields,
          package_name: value.name,
          price: value.price,
          currency: value.currency,
          credits: value.credits,
          package_validity_days: value.validity_days,
          bonus_percentage: value.bonus_percentage || 0
        })
        break

      case 'pricing':
        setFormFields({
          ...baseFields,
          subscription_order: value.subscription?.join(', ') || '',
          package_order: value.package?.join(', ') || ''
        })
        break

      case 'llm':
        // 🔥 老王警告：后端返回的API Key已经脱敏了（_masked: true），不要尝试回显
        const llmFields: SmartFormFields = {
          ...baseFields,
          llm_provider: value.provider,
          llm_service_type: value.service_type,
          llm_api_url: value.api_url,
          llm_timeout: value.timeout
        }

        // 根据服务类型回填对应字段
        if (value.service_type === 'image_generation') {
          llmFields.llm_model_name = value.model_name
        } else if (value.service_type === 'prompt_optimization') {
          llmFields.llm_quick_model = value.quick_model
          llmFields.llm_detailed_model = value.detailed_model
        }

        // 🔥 API Key 不回显（已脱敏），需要重新输入
        llmFields.llm_api_key = ''

        setFormFields(llmFields)
        break
    }
  }

  // 删除配置
  const handleDelete = async (config: ConfigItem) => {
    if (!confirm(`确定要删除配置 "${config.config_key}" 吗？`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/config?key=${config.config_key}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success && result.error !== '功能暂未实现') {
        throw new Error(result.message || '删除配置失败')
      }

      if (result.error === '功能暂未实现') {
        alert('删除功能正在开发中，敬请期待！')
        return
      }

      await fetchConfigs()
    } catch (err) {
      console.error('删除配置失败:', err)
      alert('删除配置失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  // 过滤配置
  useEffect(() => {
    let filtered = configs

    if (searchTerm) {
      filtered = filtered.filter(config =>
        config.config_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (config.description && config.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(config => config.config_type === typeFilter)
    }

    setFilteredConfigs(filtered)
  }, [configs, searchTerm, typeFilter])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  // 🔥 渲染智能表单字段
  const renderSmartFields = () => {
    const { config_type, billing_cycle } = formFields

    return (
      <div className="space-y-4">
        {/* 配置键 */}
        <div>
          <Label htmlFor="config_key">配置键 *</Label>
          <Input
            id="config_key"
            value={formFields.config_key}
            onChange={(e) => setFormFields({ ...formFields, config_key: e.target.value })}
            placeholder="例如: credit.text_to_image.cost"
            disabled={!!editingConfig}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            格式: {config_type}.名称 (例如: credit.video.cost)
          </p>
        </div>

        {/* 配置类型 */}
        <div>
          <Label htmlFor="config_type">配置类型 *</Label>
          <Select
            value={formFields.config_type}
            onValueChange={(value) => setFormFields({ ...formFields, config_type: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit_cost">积分消耗</SelectItem>
              <SelectItem value="trial">试用配置</SelectItem>
              <SelectItem value="subscription">订阅配置</SelectItem>
              <SelectItem value="package">套餐配置</SelectItem>
              <SelectItem value="pricing">价格配置</SelectItem>
              <SelectItem value="llm">LLM配置</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 积分消耗配置字段 */}
        {config_type === 'credit_cost' && (
          <>
            <div>
              <Label htmlFor="amount">消耗数量 *</Label>
              <Input
                id="amount"
                type="number"
                value={formFields.amount || ''}
                onChange={(e) => setFormFields({ ...formFields, amount: parseInt(e.target.value) || 0 })}
                placeholder="例如: 1"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="unit">单位</Label>
              <Input
                id="unit"
                value={formFields.unit || 'credits'}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>
          </>
        )}

        {/* 试用配置字段 */}
        {config_type === 'trial' && (
          <>
            <div>
              <Label htmlFor="trial_credits">试用积分 *</Label>
              <Input
                id="trial_credits"
                type="number"
                value={formFields.trial_credits || ''}
                onChange={(e) => setFormFields({ ...formFields, trial_credits: parseInt(e.target.value) || 0 })}
                placeholder="例如: 50"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="trial_validity_days">有效天数 *</Label>
              <Input
                id="trial_validity_days"
                type="number"
                value={formFields.trial_validity_days || ''}
                onChange={(e) => setFormFields({ ...formFields, trial_validity_days: parseInt(e.target.value) || 0 })}
                placeholder="例如: 15"
                className="mt-1"
              />
            </div>
          </>
        )}

        {/* 订阅配置字段 */}
        {config_type === 'subscription' && (
          <>
            <div>
              <Label htmlFor="tier">套餐等级 *</Label>
              <Select
                value={formFields.tier || 'basic'}
                onValueChange={(value) => setFormFields({ ...formFields, tier: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="billing_cycle">计费周期 *</Label>
              <Select
                value={formFields.billing_cycle || 'monthly'}
                onValueChange={(value: 'monthly' | 'yearly') => setFormFields({ ...formFields, billing_cycle: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">月付</SelectItem>
                  <SelectItem value="yearly">年付</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">价格 *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formFields.price || ''}
                onChange={(e) => setFormFields({ ...formFields, price: parseFloat(e.target.value) || 0 })}
                placeholder="例如: 9.99"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="monthly_credits">每月积分 *</Label>
              <Input
                id="monthly_credits"
                type="number"
                value={formFields.monthly_credits || ''}
                onChange={(e) => setFormFields({ ...formFields, monthly_credits: parseInt(e.target.value) || 0 })}
                placeholder="例如: 100"
                className="mt-1"
              />
            </div>
            {billing_cycle === 'yearly' && (
              <>
                <div>
                  <Label htmlFor="bonus_percentage">赠送比例 (%)</Label>
                  <Input
                    id="bonus_percentage"
                    type="number"
                    value={formFields.bonus_percentage || ''}
                    onChange={(e) => setFormFields({ ...formFields, bonus_percentage: parseInt(e.target.value) || 0 })}
                    placeholder="例如: 20"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    赠送积分 = 月积分 × 12 × 赠送比例
                  </p>
                </div>
                {formFields.monthly_credits && formFields.bonus_percentage && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      💡 自动计算：赠送 {Math.round(formFields.monthly_credits * 12 * formFields.bonus_percentage / 100)} 积分，
                      全年共 {formFields.monthly_credits * 12 + Math.round(formFields.monthly_credits * 12 * formFields.bonus_percentage / 100)} 积分
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* 积分包配置字段 */}
        {config_type === 'package' && (
          <>
            <div>
              <Label htmlFor="package_name">包名 *</Label>
              <Input
                id="package_name"
                value={formFields.package_name || ''}
                onChange={(e) => setFormFields({ ...formFields, package_name: e.target.value })}
                placeholder="例如: Starter"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="price">价格 *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formFields.price || ''}
                onChange={(e) => setFormFields({ ...formFields, price: parseFloat(e.target.value) || 0 })}
                placeholder="例如: 12.99"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="credits">基础积分 *</Label>
              <Input
                id="credits"
                type="number"
                value={formFields.credits || ''}
                onChange={(e) => setFormFields({ ...formFields, credits: parseInt(e.target.value) || 0 })}
                placeholder="例如: 100"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="package_validity_days">有效天数 *</Label>
              <Input
                id="package_validity_days"
                type="number"
                value={formFields.package_validity_days || 365}
                onChange={(e) => setFormFields({ ...formFields, package_validity_days: parseInt(e.target.value) || 365 })}
                placeholder="例如: 365"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bonus_percentage">赠送比例 (%，可选)</Label>
              <Input
                id="bonus_percentage"
                type="number"
                value={formFields.bonus_percentage || ''}
                onChange={(e) => setFormFields({ ...formFields, bonus_percentage: parseInt(e.target.value) || 0 })}
                placeholder="例如: 15"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                如果有赠送，会自动计算赠送积分
              </p>
            </div>
            {formFields.credits && formFields.bonus_percentage && formFields.bonus_percentage > 0 && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  💡 自动计算：赠送 {Math.round(formFields.credits * formFields.bonus_percentage / 100)} 积分，
                  共 {formFields.credits + Math.round(formFields.credits * formFields.bonus_percentage / 100)} 积分
                </p>
              </div>
            )}
          </>
        )}

        {/* 价格配置字段 */}
        {config_type === 'pricing' && (
          <>
            <div>
              <Label htmlFor="subscription_order">订阅显示顺序</Label>
              <Input
                id="subscription_order"
                value={formFields.subscription_order || ''}
                onChange={(e) => setFormFields({ ...formFields, subscription_order: e.target.value })}
                placeholder="例如: basic, pro, max"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                用逗号分隔，例如: basic, pro, max
              </p>
            </div>
            <div>
              <Label htmlFor="package_order">积分包显示顺序</Label>
              <Input
                id="package_order"
                value={formFields.package_order || ''}
                onChange={(e) => setFormFields({ ...formFields, package_order: e.target.value })}
                placeholder="例如: starter, popular, pro, ultimate"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                用逗号分隔，例如: starter, popular, pro, ultimate
              </p>
            </div>
          </>
        )}

        {/* LLM配置字段 */}
        {config_type === 'llm' && (
          <>
            <div>
              <Label htmlFor="llm_provider">Provider *</Label>
              <Select
                value={formFields.llm_provider || 'google'}
                onValueChange={(value) => setFormFields({ ...formFields, llm_provider: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="GLM">GLM</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="llm_service_type">服务类型 *</Label>
              <Select
                value={formFields.llm_service_type || 'image_generation'}
                onValueChange={(value) => setFormFields({ ...formFields, llm_service_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image_generation">图像生成</SelectItem>
                  <SelectItem value="prompt_optimization">提示词优化</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="llm_api_url">API URL *</Label>
              <Input
                id="llm_api_url"
                value={formFields.llm_api_url || ''}
                onChange={(e) => setFormFields({ ...formFields, llm_api_url: e.target.value })}
                placeholder="例如: https://generativelanguage.googleapis.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="llm_api_key">API Key *</Label>
              <Input
                id="llm_api_key"
                type="password"
                value={formFields.llm_api_key || ''}
                onChange={(e) => setFormFields({ ...formFields, llm_api_key: e.target.value })}
                placeholder="输入明文API Key（保存时自动加密）"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                🔐 API Key将自动加密存储，请放心输入明文
              </p>
            </div>
            {formFields.llm_service_type === 'image_generation' && (
              <div>
                <Label htmlFor="llm_model_name">模型名称 *</Label>
                <Input
                  id="llm_model_name"
                  value={formFields.llm_model_name || ''}
                  onChange={(e) => setFormFields({ ...formFields, llm_model_name: e.target.value })}
                  placeholder="例如: gemini-2.5-flash-image"
                  className="mt-1"
                />
              </div>
            )}
            {formFields.llm_service_type === 'prompt_optimization' && (
              <>
                <div>
                  <Label htmlFor="llm_quick_model">快速模型 *</Label>
                  <Input
                    id="llm_quick_model"
                    value={formFields.llm_quick_model || ''}
                    onChange={(e) => setFormFields({ ...formFields, llm_quick_model: e.target.value })}
                    placeholder="例如: gpt-4o-mini"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="llm_detailed_model">详细模型 *</Label>
                  <Input
                    id="llm_detailed_model"
                    value={formFields.llm_detailed_model || ''}
                    onChange={(e) => setFormFields({ ...formFields, llm_detailed_model: e.target.value })}
                    placeholder="例如: gpt-4o"
                    className="mt-1"
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="llm_timeout">超时时间（毫秒）</Label>
              <Input
                id="llm_timeout"
                type="number"
                value={formFields.llm_timeout || 60000}
                onChange={(e) => setFormFields({ ...formFields, llm_timeout: parseInt(e.target.value) || 60000 })}
                placeholder="例如: 60000"
                className="mt-1"
              />
            </div>
          </>
        )}

        {/* 描述 */}
        <div>
          <Label htmlFor="description">描述 *</Label>
          <Textarea
            id="description"
            value={formFields.description}
            onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
            placeholder="配置项的描述信息"
            className="mt-1"
            rows={3}
          />
        </div>

        {/* JSON 预览 */}
        {showJsonPreview && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>JSON 预览</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowJsonPreview(false)}
              >
                隐藏
              </Button>
            </div>
            <Textarea
              value={JSON.stringify(generateConfigValue(), null, 2)}
              readOnly
              className="font-mono text-xs bg-gray-50"
              rows={10}
            />
          </div>
        )}

        {!showJsonPreview && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJsonPreview(true)}
            className="flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>预览生成的JSON</span>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统配置管理</h1>
          <p className="text-gray-500">管理系统参数和业务规则配置</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>新建配置</span>
          </Button>
          <Button
            variant="outline"
            onClick={fetchConfigs}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </Button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索配置..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="配置类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="credit_cost">积分消耗</SelectItem>
                  <SelectItem value="trial">试用配置</SelectItem>
                  <SelectItem value="subscription">订阅配置</SelectItem>
                  <SelectItem value="package">套餐配置</SelectItem>
                  <SelectItem value="pricing">价格配置</SelectItem>
                  <SelectItem value="llm">LLM配置</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 配置列表 */}
      <Card>
        <CardHeader>
          <CardTitle>配置列表</CardTitle>
          <CardDescription>
            共 {filteredConfigs.length} 个配置项
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">加载中...</span>
            </div>
          ) : filteredConfigs.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无配置</h3>
              <p className="text-gray-500">开始创建您的第一个系统配置</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
              >
                创建配置
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      配置键
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      值
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      描述
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      更新时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConfigs.map((config) => (
                    <tr key={config.config_key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                            {configTypeMap[config.config_type]?.icon || <Settings className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {config.config_key}
                            </div>
                            <div className="text-sm text-gray-500">
                              版本 {config.version}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">
                          {configTypeMap[config.config_type]?.name || config.config_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-900 truncate">
                          {typeof config.config_value === 'object'
                            ? JSON.stringify(config.config_value)
                            : String(config.config_value)}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="text-sm text-gray-500">
                          {config.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(config.updated_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(config)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑配置模态框 */}
      {(showCreateModal || editingConfig) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingConfig ? '编辑配置' : '创建新配置'}
              </CardTitle>
              <CardDescription>
                {editingConfig ? '修改系统配置参数' : '添加新的系统配置参数（填写表单自动生成JSON）'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSmartFields()}
            </CardContent>
            <div className="flex justify-end space-x-3 p-6 pt-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingConfig(null)
                  resetForm()
                }}
              >
                取消
              </Button>
              <Button
                onClick={editingConfig ? updateConfig : createConfig}
              >
                {editingConfig ? '更新' : '创建'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
