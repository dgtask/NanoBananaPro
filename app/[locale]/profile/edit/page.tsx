"use client"

/**
 * 🔥 老王的用户资料编辑页面
 * 用途: 编辑当前登录用户的个人资料
 * 老王警告: 这个页面只能编辑自己的资料，别tm想改别人的！
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  ArrowLeft,
  Loader2,
  Save,
  MapPin,
  Globe,
  Twitter,
  Instagram,
  Github
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { UserProfile, UpdateUserProfileRequest } from '@/types/profile'

export default function ProfileEditPage() {
  const router = useRouter()

  // 1. 表单状态
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [githubHandle, setGithubHandle] = useState('')

  // 2. 加载和提交状态
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 3. 获取当前用户资料
  useEffect(() => {
    async function fetchProfile() {
      setFetchingData(true)
      setError(null)
      try {
        // 先获取当前用户ID
        const meRes = await fetch('/api/auth/me')
        const meData = await meRes.json()

        if (!meData.user) {
          router.push('/login')
          return
        }

        // 获取用户资料
        const profileRes = await fetch(`/api/profile/${meData.user.id}`)
        const profileData = await profileRes.json()

        if (profileData.success && profileData.data) {
          const p = profileData.data
          setProfile(p)
          setDisplayName(p.display_name || '')
          setAvatarUrl(p.avatar_url || '')
          setBio(p.bio || '')
          setLocation(p.location || '')
          setWebsiteUrl(p.website_url || '')
          setTwitterHandle(p.twitter_handle || '')
          setInstagramHandle(p.instagram_handle || '')
          setGithubHandle(p.github_handle || '')
        } else {
          setError('获取资料失败')
        }
      } catch (err) {
        console.error('获取资料失败:', err)
        setError('加载失败，请稍后重试')
      } finally {
        setFetchingData(false)
      }
    }

    fetchProfile()
  }, [router])

  // 4. 表单验证
  const validate = (): string | null => {
    if (displayName && displayName.length > 100) {
      return '显示名称最多100个字符'
    }
    if (bio && bio.length > 500) {
      return '个人简介最多500个字符'
    }
    if (websiteUrl && !/^https?:\/\/.+/.test(websiteUrl)) {
      return '网站URL格式不正确（需以http://或https://开头）'
    }
    return null
  }

  // 5. 提交更新
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      // 表单验证
      const validationError = validate()
      if (validationError) {
        setError(validationError)
        setLoading(false)
        return
      }

      // 构建请求数据
      const requestData: UpdateUserProfileRequest = {
        display_name: displayName,
        avatar_url: avatarUrl,
        bio,
        location,
        website_url: websiteUrl,
        twitter_handle: twitterHandle,
        instagram_handle: instagramHandle,
        github_handle: githubHandle
      }

      console.log('📤 更新用户资料:', requestData)

      // 发送请求
      const res = await fetch(`/api/profile/${profile.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const data = await res.json()

      if (data.success) {
        console.log('✅ 用户资料更新成功')
        setSuccess(true)
        // 2秒后跳转到个人主页
        setTimeout(() => {
          router.push(`/profile/${profile.user_id}`)
        }, 1500)
      } else {
        setError(data.error || '更新失败')
      }
    } catch (err) {
      console.error('❌ 更新用户资料异常:', err)
      setError('服务器错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 数据加载中
  if (fetchingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // 错误或未登录
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>

          <h1 className="text-xl font-semibold">编辑资料</h1>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存
          </Button>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 成功提示 */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✅ 资料更新成功！正在跳转...
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* 头像预览 */}
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="头像预览"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.currentTarget.src = ''
                    e.currentTarget.onerror = null
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="avatarUrl">头像URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* 显示名称 */}
          <div>
            <Label htmlFor="displayName">显示名称</Label>
            <Input
              id="displayName"
              placeholder="输入您的昵称（最多100字符）"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* 个人简介 */}
          <div>
            <Label htmlFor="bio">个人简介</Label>
            <Textarea
              id="bio"
              placeholder="介绍一下自己（最多500字符）"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-2"
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-1">
              {bio.length}/500
            </p>
          </div>

          {/* 位置 */}
          <div>
            <Label htmlFor="location" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              所在地
            </Label>
            <Input
              id="location"
              placeholder="例如：北京"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* 个人网站 */}
          <div>
            <Label htmlFor="websiteUrl" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              个人网站
            </Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://your-website.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* 社交链接 */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-4">社交链接</h3>
            <div className="space-y-4">
              {/* Twitter */}
              <div>
                <Label htmlFor="twitterHandle" className="flex items-center gap-1">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Label>
                <div className="flex mt-2">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-gray-500 text-sm">
                    @
                  </span>
                  <Input
                    id="twitterHandle"
                    placeholder="username"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              {/* Instagram */}
              <div>
                <Label htmlFor="instagramHandle" className="flex items-center gap-1">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <div className="flex mt-2">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-gray-500 text-sm">
                    @
                  </span>
                  <Input
                    id="instagramHandle"
                    placeholder="username"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              {/* GitHub */}
              <div>
                <Label htmlFor="githubHandle" className="flex items-center gap-1">
                  <Github className="h-4 w-4" />
                  GitHub
                </Label>
                <div className="flex mt-2">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-gray-500 text-sm">
                    @
                  </span>
                  <Input
                    id="githubHandle"
                    placeholder="username"
                    value={githubHandle}
                    onChange={(e) => setGithubHandle(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 提交按钮（移动端） */}
          <div className="md:hidden pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              保存更改
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 🔥 老王备注：
// 1. 进入页面先检查登录状态，未登录跳转到登录页
// 2. 加载当前用户的资料数据填充表单
// 3. 支持编辑：头像URL、昵称、简介、位置、网站、社交链接
// 4. 表单验证：昵称100字符、简介500字符、网站URL格式
// 5. 提交成功后显示成功提示，1.5秒后跳转到个人主页
// 6. 头像预览实时更新
// 7. 移动端底部有提交按钮，桌面端顶部有提交按钮
