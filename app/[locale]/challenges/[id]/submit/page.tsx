/**
 * 🔥 老王的作品提交页面
 * 用途: 允许用户上传作品参加挑战
 * 老王警告: 这个表单要是验证不严格，垃圾作品就进来了！
 */

'use client'

import { useState, useEffect } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { useRouter, useParams } from 'next/navigation'
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
  Upload,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Video,
  X,
  CheckCircle,
  FileWarning
} from 'lucide-react'

// 挑战数据接口
interface Challenge {
  id: string
  title: string
  description: string
  required_artwork_type: 'image' | 'video' | 'both'
  max_submissions_per_user: number
  user_submission_count: number // 用户已提交数量
  status: 'upcoming' | 'active' | 'voting' | 'completed'
}

// 提交表单数据
interface SubmissionFormData {
  artwork_type: 'image' | 'video'
  title: string
  description: string
  file: File | null
  file_url: string
}

export default async function SubmitArtworkPage({
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)

  const [formData, setFormData] = useState<SubmissionFormData>({
    artwork_type: 'image',
    title: '',
    description: '',
    file: null,
    file_url: ''
  })

  const [filePreview, setFilePreview] = useState<string | null>(null)

  // 加载挑战信息
  const loadChallengeInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: 调用 GraphQL API 获取挑战信息和用户提交统计
      const mockChallenge: Challenge = {
        id: challengeId,
        title: '圣诞主题创意挑战',
        description: '创作圣诞主题的作品，获得丰厚奖励！',
        required_artwork_type: 'both',
        max_submissions_per_user: 3,
        user_submission_count: 1, // 用户已提交1件
        status: 'active'
      }

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))

      // 检查挑战状态
      if (mockChallenge.status !== 'active') {
        throw new Error('该挑战当前不接受提交')
      }

      // 检查提交次数限制
      if (mockChallenge.user_submission_count >= mockChallenge.max_submissions_per_user) {
        throw new Error(`您已达到最大提交次数限制 (${mockChallenge.max_submissions_per_user} 件)`)
      }

      setChallenge(mockChallenge)

      // 设置默认作品类型
      if (mockChallenge.required_artwork_type !== 'both') {
        setFormData(prev => ({
          ...prev,
          artwork_type: mockChallenge.required_artwork_type as 'image' | 'video'
        }))
      }
    } catch (err) {
      console.error('加载挑战信息失败:', err)
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChallengeInfo()
  }, [challengeId])

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (formData.artwork_type === 'image' && !isImage) {
      setError('请选择图片文件')
      return
    }

    if (formData.artwork_type === 'video' && !isVideo) {
      setError('请选择视频文件')
      return
    }

    // 验证文件大小 (图片 5MB, 视频 50MB)
    const maxSize = formData.artwork_type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`文件大小不能超过 ${formData.artwork_type === 'image' ? '5MB' : '50MB'}`)
      return
    }

    setError(null)
    setFormData(prev => ({ ...prev, file }))

    // 生成预览
    if (isImage) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  // 清除文件
  const clearFile = () => {
    setFormData(prev => ({ ...prev, file: null, file_url: '' }))
    setFilePreview(null)
  }

  // 验证表单
  const validateForm = (): boolean => {
    if (!formData.title || formData.title.length < 3) {
      setError('作品标题不能少于3个字符')
      return false
    }

    if (formData.title.length > 100) {
      setError('作品标题不能超过100个字符')
      return false
    }

    if (!formData.file) {
      setError('请选择要上传的文件')
      return false
    }

    setError(null)
    return true
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // TODO: 上传文件到存储服务
      console.log('Uploading file:', formData.file)

      // TODO: 调用 GraphQL Mutation 创建提交记录
      console.log('Creating submission:', {
        challenge_id: challengeId,
        artwork_type: formData.artwork_type,
        title: formData.title,
        description: formData.description
      })

      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 2000))

      setSuccess(true)

      // 3秒后跳转回挑战详情页
      setTimeout(() => {
        router.push(`/challenges/${challengeId}`)
      }, 3000)
    } catch (err) {
      console.error('提交失败:', err)
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载挑战信息中...</p>
        </div>
      </div>
    )
  }

  if (error && !challenge) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">无法提交作品</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            返回
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">提交成功！</h3>
            <p className="text-gray-600 mb-4">
              您的作品已成功提交到挑战中
            </p>
            <p className="text-sm text-gray-500">
              3秒后自动返回挑战详情页...
            </p>
            <Button
              onClick={() => router.push(`/challenges/${challengeId}`)}
              className="mt-4"
            >
              立即查看
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 flex items-center space-x-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回挑战详情</span>
      </Button>

      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">提交作品</h1>
        <p className="text-gray-600">
          {challenge?.title}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          您已提交 {challenge?.user_submission_count} / {challenge?.max_submissions_per_user} 件作品
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 作品类型选择 */}
        <Card>
          <CardHeader>
            <CardTitle>作品类型</CardTitle>
            <CardDescription>
              选择您要提交的作品类型
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.artwork_type}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, artwork_type: value as 'image' | 'video' }))
                clearFile() // 切换类型时清除已选文件
              }}
              disabled={challenge?.required_artwork_type !== 'both'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(challenge?.required_artwork_type === 'image' || challenge?.required_artwork_type === 'both') && (
                  <SelectItem value="image">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>图片</span>
                    </div>
                  </SelectItem>
                )}
                {(challenge?.required_artwork_type === 'video' || challenge?.required_artwork_type === 'both') && (
                  <SelectItem value="video">
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4" />
                      <span>视频</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {challenge?.required_artwork_type !== 'both' && (
              <p className="text-xs text-gray-500 mt-2">
                该挑战仅接受{challenge?.required_artwork_type === 'image' ? '图片' : '视频'}作品
              </p>
            )}
          </CardContent>
        </Card>

        {/* 文件上传 */}
        <Card>
          <CardHeader>
            <CardTitle>上传文件</CardTitle>
            <CardDescription>
              {formData.artwork_type === 'image' ? '支持 JPG, PNG, GIF 格式，最大 5MB' : '支持 MP4, MOV, AVI 格式，最大 50MB'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!formData.file ? (
              <div>
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">点击上传</span> 或拖拽文件到此处
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.artwork_type === 'image' ? 'JPG, PNG, GIF (最大 5MB)' : 'MP4, MOV, AVI (最大 50MB)'}
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept={formData.artwork_type === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 文件预览 */}
                {formData.artwork_type === 'image' && filePreview && (
                  <div className="relative">
                    <img
                      src={filePreview}
                      alt="预览"
                      className="w-full h-auto max-h-96 rounded-lg object-contain bg-gray-100"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={clearFile}
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* 文件信息 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {formData.artwork_type === 'image' ? (
                      <ImageIcon className="w-6 h-6 text-gray-500" />
                    ) : (
                      <Video className="w-6 h-6 text-gray-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 作品信息 */}
        <Card>
          <CardHeader>
            <CardTitle>作品信息</CardTitle>
            <CardDescription>
              填写作品的标题和描述
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 作品标题 */}
            <div className="space-y-2">
              <Label htmlFor="title">作品标题 *</Label>
              <Input
                id="title"
                placeholder="给您的作品起个名字"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                {formData.title.length}/100 字符
              </p>
            </div>

            {/* 作品描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">作品描述（可选）</Label>
              <Textarea
                id="description"
                placeholder="介绍一下您的创作思路和灵感..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {formData.description.length}/500 字符
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 提交须知 */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <FileWarning className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">提交须知</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 作品必须为原创内容</li>
                  <li>• 提交后无法修改或删除</li>
                  <li>• 不得包含不适当内容</li>
                  <li>• 每人最多提交 {challenge?.max_submissions_per_user} 件作品</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>提交中...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>提交作品</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
