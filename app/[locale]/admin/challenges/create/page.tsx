/**
 * 🔥 老王的挑战创建表单页面
 * 用途: 管理后台创建新的创意挑战活动
 * 老王警告: 这个表单要是提交失败，老王要把这个SB代码扔垃圾桶！
 */

'use client'

import { useState } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Calendar,
  Trophy,
  Gift,
  FileText,
  Settings
} from 'lucide-react'

// 表单数据接口
interface ChallengeFormData {
  title: string
  description: string
  theme: string
  start_date: string
  end_date: string
  voting_start_date: string
  voting_end_date: string
  prizes: string // JSON 字符串
  submission_rules: string
  voting_mechanism: 'likes' | 'jury' | 'mixed'
  max_submissions_per_user: number
  required_artwork_type: 'image' | 'video' | 'both'
}

export default async function CreateChallengePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    theme: '',
    start_date: '',
    end_date: '',
    voting_start_date: '',
    voting_end_date: '',
    prizes: '[]',
    submission_rules: '',
    voting_mechanism: 'likes',
    max_submissions_per_user: 3,
    required_artwork_type: 'both'
  })

  // 更新表单字段
  const handleFieldChange = (field: keyof ChallengeFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 验证表单
  const validateForm = (): boolean => {
    // 基础字段验证
    if (!formData.title || formData.title.length < 3) {
      setError('标题不能少于3个字符')
      return false
    }

    if (!formData.description || formData.description.length < 10) {
      setError('描述不能少于10个字符')
      return false
    }

    if (!formData.theme) {
      setError('主题不能为空')
      return false
    }

    // 日期验证
    if (!formData.start_date || !formData.end_date) {
      setError('挑战开始和结束日期不能为空')
      return false
    }

    if (!formData.voting_start_date || !formData.voting_end_date) {
      setError('投票开始和结束日期不能为空')
      return false
    }

    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)
    const votingStartDate = new Date(formData.voting_start_date)
    const votingEndDate = new Date(formData.voting_end_date)

    if (startDate >= endDate) {
      setError('挑战结束日期必须晚于开始日期')
      return false
    }

    if (votingStartDate >= votingEndDate) {
      setError('投票结束日期必须晚于开始日期')
      return false
    }

    if (votingStartDate < endDate) {
      setError('投票开始日期必须晚于或等于挑战结束日期')
      return false
    }

    // 奖品配置验证
    try {
      const prizes = JSON.parse(formData.prizes)
      if (!Array.isArray(prizes)) {
        setError('奖品配置必须是数组格式')
        return false
      }
    } catch (e) {
      setError('奖品配置JSON格式错误')
      return false
    }

    setError(null)
    return true
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      // TODO: 调用 GraphQL Mutation 创建挑战
      console.log('Creating challenge:', {
        ...formData,
        status: asDraft ? 'draft' : 'active'
      })

      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 创建成功，跳转回列表页
      router.push('/admin/challenges')
    } catch (err) {
      console.error('创建挑战失败:', err)
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
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
            <h1 className="text-2xl font-bold text-gray-900">创建挑战</h1>
            <p className="text-gray-500">填写挑战信息并发布</p>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* 基础信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>基础信息</span>
            </CardTitle>
            <CardDescription>挑战的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 标题 */}
            <div className="space-y-2">
              <Label htmlFor="title">挑战标题 *</Label>
              <Input
                id="title"
                placeholder="例如: 圣诞主题创意挑战"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">3-100个字符</p>
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">挑战描述 *</Label>
              <Textarea
                id="description"
                placeholder="详细描述挑战的主题、要求和目标..."
                rows={4}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">至少10个字符</p>
            </div>

            {/* 主题 */}
            <div className="space-y-2">
              <Label htmlFor="theme">挑战主题 *</Label>
              <Input
                id="theme"
                placeholder="例如: christmas, new_year, halloween"
                value={formData.theme}
                onChange={(e) => handleFieldChange('theme', e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">使用小写字母和下划线</p>
            </div>
          </CardContent>
        </Card>

        {/* 时间设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>时间设置</span>
            </CardTitle>
            <CardDescription>设置挑战和投票的时间范围</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 挑战开始日期 */}
              <div className="space-y-2">
                <Label htmlFor="start_date">挑战开始日期 *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => handleFieldChange('start_date', e.target.value)}
                  required
                />
              </div>

              {/* 挑战结束日期 */}
              <div className="space-y-2">
                <Label htmlFor="end_date">挑战结束日期 *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => handleFieldChange('end_date', e.target.value)}
                  required
                />
              </div>

              {/* 投票开始日期 */}
              <div className="space-y-2">
                <Label htmlFor="voting_start_date">投票开始日期 *</Label>
                <Input
                  id="voting_start_date"
                  type="datetime-local"
                  value={formData.voting_start_date}
                  onChange={(e) => handleFieldChange('voting_start_date', e.target.value)}
                  required
                />
              </div>

              {/* 投票结束日期 */}
              <div className="space-y-2">
                <Label htmlFor="voting_end_date">投票结束日期 *</Label>
                <Input
                  id="voting_end_date"
                  type="datetime-local"
                  value={formData.voting_end_date}
                  onChange={(e) => handleFieldChange('voting_end_date', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 规则设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>规则设置</span>
            </CardTitle>
            <CardDescription>设置提交和投票规则</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 提交规则 */}
            <div className="space-y-2">
              <Label htmlFor="submission_rules">提交规则</Label>
              <Textarea
                id="submission_rules"
                placeholder="描述作品提交的具体要求和限制..."
                rows={3}
                value={formData.submission_rules}
                onChange={(e) => handleFieldChange('submission_rules', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 投票机制 */}
              <div className="space-y-2">
                <Label htmlFor="voting_mechanism">投票机制 *</Label>
                <Select
                  value={formData.voting_mechanism}
                  onValueChange={(value) => handleFieldChange('voting_mechanism', value as 'likes' | 'jury' | 'mixed')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择投票机制" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="likes">点赞投票</SelectItem>
                    <SelectItem value="jury">评审投票</SelectItem>
                    <SelectItem value="mixed">混合投票</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 每人最大提交数 */}
              <div className="space-y-2">
                <Label htmlFor="max_submissions">每人最大提交数 *</Label>
                <Input
                  id="max_submissions"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.max_submissions_per_user}
                  onChange={(e) => handleFieldChange('max_submissions_per_user', parseInt(e.target.value))}
                  required
                />
              </div>

              {/* 作品类型 */}
              <div className="space-y-2">
                <Label htmlFor="artwork_type">作品类型 *</Label>
                <Select
                  value={formData.required_artwork_type}
                  onValueChange={(value) => handleFieldChange('required_artwork_type', value as 'image' | 'video' | 'both')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择作品类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">仅图片</SelectItem>
                    <SelectItem value="video">仅视频</SelectItem>
                    <SelectItem value="both">图片和视频</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 奖品配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="w-5 h-5" />
              <span>奖品配置</span>
            </CardTitle>
            <CardDescription>配置挑战的奖品（JSON格式）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prizes">奖品配置 (JSON) *</Label>
              <Textarea
                id="prizes"
                placeholder='[{"rank":1,"reward_type":"credits","reward_value":"1000","description":"一等奖"}]'
                rows={6}
                value={formData.prizes}
                onChange={(e) => handleFieldChange('prizes', e.target.value)}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500">
                JSON数组格式，每个奖品包含 rank（排名）, reward_type（奖品类型）, reward_value（奖品值）, description（描述）
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex items-center justify-end space-x-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
          >
            保存为草稿
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? '发布中...' : '发布挑战'}</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
