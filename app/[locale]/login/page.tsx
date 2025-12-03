/**
 * 🔥 老王的用户登录页面
 * 用途: 支持邮箱/用户名登录，会话管理
 * 老王警告: 登录成功后会保存Token到localStorage，注意安全！
 */

"use client"

import { Header } from "@/components/header"
import { setRequestLocale } from 'next-intl/server'
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useTranslations } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import { Turnstile } from "@/components/turnstile"
import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, CheckCircle2, XCircle, Loader2, Github } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = useTranslations('login')  // 🔥 老王迁移：使用login命名空间
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // 表单状态
  const [formData, setFormData] = useState({
    identifier: "",  // 邮箱或用户名
    password: ""
  })

  // UI状态
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'github' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>("")

  /**
   * 🔥 处理输入变化
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  /**
   * 🔥 处理登录提交
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // 验证必填字段
    if (!formData.identifier || !formData.password) {
      setError(t('error.requiredFields'))
      return
    }

    // 检查Turnstile
    if (!turnstileToken) {
      setError(t('error.graphicVerification'))
      return
    }

    try {
      setIsLoading(true)

      console.log('🔐 提交登录...')

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
          turnstileToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t('error.loginFailed'))
        setIsLoading(false)
        return
      }

      // 登录成功 - 保存会话Token
      console.log('🎉 登录成功!')

      if (data.session && data.session.token) {
        // 保存Token到localStorage
        localStorage.setItem('session_token', data.session.token)
        localStorage.setItem('session_expires_at', data.session.expiresAt)
        localStorage.setItem('user_has_password', 'true')

        // 保存用户信息
        if (data.user) {
          localStorage.setItem('user_info', JSON.stringify(data.user))
        }

        console.log('✅ 会话Token已保存')
      }

      // ✅ 同步Supabase客户端会话，确保全局登录状态更新
      if (data.supabaseSession?.access_token && data.supabaseSession?.refresh_token) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.supabaseSession.access_token,
          refresh_token: data.supabaseSession.refresh_token
        })

        if (setSessionError) {
          console.error('设置Supabase会话失败:', setSessionError.message)
        } else {
          console.log('✅ Supabase客户端会话已同步')
        }
      }

      setSuccess(t('success.loggedIn'))

      // 1秒后跳转到首页或指定页面
      setTimeout(() => {
        // 检查是否有重定向参数
        const urlParams = new URLSearchParams(window.location.search)
        const redirectTo = urlParams.get('redirect') || '/'
        router.push(redirectTo)
      }, 1000)

    } catch (error) {
      console.error('❌ 登录异常:', error)
      setError(t('error.loginFailedRetry'))
      setIsLoading(false)
    }
  }

  /**
   * 🔥 Turnstile验证成功回调
   */
  const handleTurnstileVerify = useCallback((token: string) => {
    console.log('✅ Turnstile验证成功')
    setTurnstileToken(token)
  }, [])

  /**
   * 🔥 Turnstile验证失败回调
   */
  const handleTurnstileError = useCallback(() => {
    console.error('❌ Turnstile验证失败')
    setError(t('error.graphicVerificationFailed'))
    setTurnstileToken('')
  }, [])

  /**
   * 🔥 处理OAuth登录
   */
  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setIsOAuthLoading(provider)
      setError(null)

      console.log(`🔐 开始${provider === 'google' ? 'Google' : 'GitHub'}登录...`)

      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      })

      const data = await response.json()

      if (!response.ok) {
        const providerName = provider === 'google' ? 'Google' : 'GitHub'
        setError(data.error || t('error.oauthFailed', { provider: providerName }))
        setIsOAuthLoading(null)
        return
      }

      // 重定向到OAuth提供商
      if (data.url) {
        console.log(`✅ 正在跳转到${provider === 'google' ? 'Google' : 'GitHub'}...`)
        window.location.href = data.url
      } else {
        setError(t('error.oauthUrlFailed'))
        setIsOAuthLoading(null)
      }
    } catch (error) {
      console.error(`❌ ${provider}登录异常:`, error)
      const providerName = provider === 'google' ? 'Google' : 'GitHub'
      setError(t('error.oauthFailed', { provider: providerName }))
      setIsOAuthLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-md">
          <Card className="p-8">
            {/* 页面标题 */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🍌</div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t("title")}
              </h1>
              <p className="text-muted-foreground">
                {t("subtitleWithEmail")}
              </p>
            </div>

            {/* 错误消息 */}
            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 成功消息 */}
            {success && (
              <div className="mb-4 p-3 rounded-md bg-green-500/10 text-green-600 text-sm flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* OAuth登录区域 */}
            <div className="space-y-3 mb-6">
              {/* Google登录 */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthLogin('google')}
                disabled={isOAuthLoading !== null}
              >
                {isOAuthLoading === 'google' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("redirecting")}
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t("useGoogle")}
                  </>
                )}
              </Button>

              {/* GitHub登录 */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthLogin('github')}
                disabled={isOAuthLoading !== null}
              >
                {isOAuthLoading === 'github' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("redirecting")}
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-5 w-5" />
                    {t("useGithub")}
                  </>
                )}
              </Button>
            </div>

            {/* 分隔线 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("orEmailLogin")}
                </span>
              </div>
            </div>

            {/* 登录表单 */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* 邮箱或用户名 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("identifier")} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder={t("identifierPlaceholder")}
                  value={formData.identifier}
                  onChange={(e) => handleInputChange('identifier', e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              {/* 密码 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t("password")} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <div className="mt-2 text-right">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
              </div>

              {/* Turnstile图形验证码 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t("graphicVerification")} <span className="text-destructive">*</span>
                </label>
                <Turnstile
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  className="flex justify-center"
                />
              </div>

              {/* 登录按钮 */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || !turnstileToken}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("signingIn")}
                  </>
                ) : (
                  t("signin")
                )}
              </Button>
            </form>

            {/* 注册链接 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("noaccount")}{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  {t("signup")}
                </Link>
              </p>
            </div>

            {/* 会话安全提示 */}
            <div className="mt-6 p-3 rounded-md bg-muted/50">
              <p className="text-xs text-muted-foreground text-center">
                {t("sessionSecurityHint")}
              </p>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
