/**
 * 🔥 老王的用户注册页面
 * 用途: 完整的邮箱验证码注册流程
 * 老王警告: 这个页面包含多层安全验证，别tm乱改逻辑！
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
import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, User, CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = useTranslations('register')  // 🔥 老王迁移：使用register命名空间
  const router = useRouter()

  // 表单状态
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    verificationCode: ""
  })

  // UI状态
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>("")

  // 验证码倒计时
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  /**
   * 🔥 处理输入变化
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  /**
   * 🔥 发送邮箱验证码
   */
  const handleSendCode = async () => {
    try {
      // 验证邮箱格式
      if (!formData.email) {
        setError(t('error.enterEmail'))
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError(t('error.invalidEmail'))
        return
      }

      // 检查Turnstile
      if (!turnstileToken) {
        setError(t('error.graphicVerification'))
        return
      }

      setIsSendingCode(true)
      setError(null)

      console.log('📧 发送验证码到:', formData.email)

      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          purpose: 'register',
          turnstileToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t('error.sendCodeFailed'))
        setIsSendingCode(false)
        return
      }

      // 开发环境显示验证码
      if (data.code) {
        console.log('🔑 验证码（开发模式）:', data.code)
        setSuccess(t('codeSentSuccessDev').replace('{code}', data.code))
      } else {
        setSuccess(t('codeSentSuccess'))
      }

      // 开始倒计时
      setCodeSent(true)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setCodeSent(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setIsSendingCode(false)
    } catch (error) {
      console.error('❌ 发送验证码异常:', error)
      setError(t('error.sendCodeFailed'))
      setIsSendingCode(false)
    }
  }

  /**
   * 🔥 处理注册提交
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // 验证必填字段
    if (!formData.email || !formData.password || !formData.verificationCode) {
      setError(t('error.requiredFields'))
      return
    }

    // 验证密码强度
    if (formData.password.length < 8) {
      setError(t('error.passwordLength'))
      return
    }

    const hasUppercase = /[A-Z]/.test(formData.password)
    const hasLowercase = /[a-z]/.test(formData.password)
    const hasNumber = /[0-9]/.test(formData.password)
    const hasSpecial = /[^A-Za-z0-9]/.test(formData.password)

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setError(t('error.passwordComplexity'))
      return
    }

    // 检查Turnstile
    if (!turnstileToken) {
      setError(t('error.graphicVerification'))
      return
    }

    try {
      setIsLoading(true)

      console.log('📝 提交注册...')

      const passwordCheckResponse = await fetch('/api/security/password-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: formData.password })
      })

      if (!passwordCheckResponse.ok) {
        const passwordCheckResult = await passwordCheckResponse.json().catch(() => ({}))
        setError(passwordCheckResult.message || t('error.passwordSecurityFailed'))
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username || undefined,
          verificationCode: formData.verificationCode,
          turnstileToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t('error.registerFailed'))
        setIsLoading(false)
        return
      }

      // 注册成功
      console.log('🎉 注册成功!')
      setSuccess(t('success.registered'))

      // 3秒后跳转到登录页面
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error) {
      console.error('❌ 注册异常:', error)
      setError(t('error.registerFailedRetry'))
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

            {/* 注册表单 */}
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Turnstile图形验证码（第一步） */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t("graphicVerification")} <span className="text-destructive">*</span>
                </label>
                <Turnstile
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  className="flex justify-center"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("graphicVerificationHint")}
                </p>
              </div>

              {/* 邮箱地址（第二步） */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("email")} <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={isLoading || !turnstileToken}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={isSendingCode || codeSent || isLoading || !formData.email || !turnstileToken}
                    className="w-32"
                  >
                    {isSendingCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : codeSent ? (
                      t("resendIn").replace('{seconds}', countdown.toString())
                    ) : (
                      t("sendCode")
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("codeValidityHint")}
                </p>
              </div>

              {/* 邮箱验证码 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("verificationCode")} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder={t("verificationCodePlaceholder")}
                  value={formData.verificationCode}
                  onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  pattern="[0-9]{6}"
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
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("passwordHint")}
                </p>
              </div>

              {/* 用户名（可选） */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("username")}
                </label>
                <Input
                  type="text"
                  placeholder={t("usernamePlaceholder")}
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* 注册按钮 */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || !turnstileToken}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("registering")}
                  </>
                ) : (
                  t("registerButton")
                )}
              </Button>
            </form>

            {/* 服务条款 */}
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                {t("termsPrefix")}{" "}
                <a href="/terms" className="text-primary hover:underline">
                  {t("termsOfService")}
                </a>{" "}
                {t("termsAnd")}{" "}
                <a href="/privacy" className="text-primary hover:underline">
                  {t("privacyPolicy")}
                </a>
              </p>
            </div>

            {/* 登录链接 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("haveaccount")}{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  {t("signin")}
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
