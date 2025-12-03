/**
 * 🔥 老王的i18n迁移：Locale Layout
 * 为每个语言路由提供翻译上下文
 */

import type React from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { locales, type Locale, localeLabels } from "@/i18n/config"

// 生成静态路由参数
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

// 动态生成metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  return {
    title: locale === 'zh' ? "Nano Banana - AI图像编辑器" : "Nano Banana - AI Image Editor",
    description: locale === 'zh'
      ? "用简单的文字描述转换任何图像。先进的AI图像编辑，支持角色一致性和场景保留。"
      : "Transform any image with simple text prompts. Advanced AI-powered image editing with character consistency and scene preservation.",
    alternates: {
      languages: {
        'en-US': '/en',
        'zh-CN': '/zh',
      },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // 验证locale是否有效
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // 🔥 老王注解：启用静态渲染
  setRequestLocale(locale)

  // 获取翻译消息
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
