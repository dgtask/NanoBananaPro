/**
 * 后台独立登录页面
 * 使用邮箱密码认证，与前台 OAuth 登录分离
 */

'use client'

import { useState, useEffect } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'  // 🔥 老王迁移：使用next-intl替代language-context

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = useTranslations('admin')  // 🔥 老王迁移：useTranslations返回t函数，使用admin命名空间
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  // 检查用户是否已登录
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 🔥 老王修复：移除 document.cookie 检查
        // httpOnly cookie 无法被 JavaScript 读取，直接调用 API 验证
        const response = await fetch('/api/admin/auth/verify', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // 已登录且 token 有效，跳转到后台首页
            router.push('/admin')
            return
          }
        }
      } catch (err) {
        console.error('检查登录状态失败:', err)
      } finally {
        setChecking(false)
      }
    }

    checkLoginStatus()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔐 开始登录:', email)
      
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // 确保包含 cookies
      })

      const data = await response.json()
      console.log('📡 登录响应:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || '登录失败')
      }

      if (data.success) {
        console.log('✅ 登录成功，准备跳转到 /admin')
        // 登录成功，跳转到后台首页
        window.location.href = '/admin' // 使用 window.location 强制刷新
      } else {
        throw new Error(data.error || '登录失败')
      }
    } catch (err) {
      console.error('❌ 登录错误:', err)
      setError(err instanceof Error ? err.message : '登录失败，请重试')
      setLoading(false)
    }
  }

  // 显示加载状态
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">{t("login.checkingStatus")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">NB</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{t("login.title")}</CardTitle>
          <CardDescription>
            {t("login.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                {t("login.email")}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                {t("login.password")}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? t("login.signingIn") : t("login.signin")}
            </Button>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                {t("login.adminOnly")}<br />
                {t("login.visitHomepage")}{' '}
                <a href="/" className="text-blue-600 hover:underline">
                  {t("login.homepage")}
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
