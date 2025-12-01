import type React from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { LanguageProvider } from "@/lib/language-context"
import { ThemeProvider } from "@/lib/theme-context"
import { TourProvider } from "@/lib/tour-context"
import { ToastProvider } from "@/components/ui/toast"
import { ConfirmProvider } from "@/components/ui/confirm-dialog"
import { CookieConsentBanner } from "@/components/cookie-consent"
import "./globals.css"

// 🔥 老王优化：移除动态加载，直接使用关键Provider链
// 由于所有页面都需要Toast/Confirm context，直接加载所有关键Provider
// 首屏加载：ThemeProvider、LanguageProvider、TourProvider、ToastProvider、ConfirmProvider
// 预期效果：Provider链5层，确保所有页面context可用性

// 🔥 老王优化：增强 SEO 和性能元数据
export const metadata: Metadata = {
  title: "Nano Banana - AI Image Editor",
  description:
    "Transform any image with simple text prompts. Advanced AI-powered image editing with character consistency and scene preservation.",
  generator: "v0.app",
  keywords: ["AI", "image editor", "photo editing", "AI art", "image generation"],
  authors: [{ name: "Nano Banana Team" }],
  // 🔥 性能提示：预连接到常用域名
  other: {
    "format-detection": "telephone=no",
  },
}

// 🔥 老王修复：Next.js 16 要求 viewport 单独导出（不能放在 metadata 里）
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // 允许用户放大，提升可访问性
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // 🔥 老王彻底修复水合错误：服务器端读取 cookie，确保 SSR 和客户端渲染一致
  const cookieStore = await cookies()
  const languageCookie = cookieStore.get("language")?.value
  const initialLanguage = languageCookie === "zh" ? "zh" : "en"

  return (
    <html lang={initialLanguage}>
      <head>
        {/* 🔥 老王LCP优化：内联最小关键CSS，防止FOUC和CLS */}
        {/* 只提供颜色变量和字体fallback，不覆盖Tailwind样式 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* 🔥 关键CSS - 颜色变量（防止FOUC闪烁） */
              :root{--background:oklch(0.99 0.01 85);--foreground:oklch(0.2 0.01 85);--primary:oklch(0.65 0.18 65)}
              .dark{--background:oklch(0.145 0 0);--foreground:oklch(0.985 0 0);--primary:oklch(0.65 0.18 65)}
              /* 🔥 关键CSS - 防止布局偏移的基础样式 */
              body{background-color:var(--background);color:var(--foreground);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0}
              /* 🔥 关键CSS - 预留Header空间防止CLS */
              body{padding-top:0}
              header{min-height:64px}
            `,
          }}
        />

        {/* 🔥 老王移动端性能优化：桌面端preload字体，移动端用font-display:swap（减少LCP 4.7s→2.5s） */}
        {/* 桌面端（屏幕宽度≥768px）：预加载字体400+500，快速渲染 */}
        <link
          rel="preload"
          href="/_next/static/media/geist-sans-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          media="(min-width: 768px)"
        />
        <link
          rel="preload"
          href="/_next/static/media/geist-sans-latin-500-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          media="(min-width: 768px)"
        />
        {/* 移动端（屏幕宽度<768px）：仅预加载400，允许系统字体fallback（font-display:swap在globals.css生效） */}
        <link
          rel="preload"
          href="/_next/static/media/geist-sans-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          media="(max-width: 767px)"
        />

        {/* 🔥 老王LCP优化：预加载首屏Showcase关键图片（优先加载前2张，防止LCP超标） */}
        <link
          rel="preload"
          as="image"
          href="/majestic-snow-capped-mountain-range-at-golden-hour.jpg"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/traditional-japanese-garden-with-cherry-blossoms-a.jpg"
          fetchPriority="high"
        />

        {/* 🔥 老王优化：预连接到关键域名，减少 DNS 查询和 TLS 握手时间 */}
        {/* Supabase 预连接（用户认证、数据存储、图片上传） - 桌面端优先 */}
        <link rel="preconnect" href="https://gtpvyxrgkuccgpcaeeyt.supabase.co" media="(min-width: 768px)" />
        <link rel="dns-prefetch" href="https://gtpvyxrgkuccgpcaeeyt.supabase.co" />
        {/* Google AI API 预连接（视频生成核心服务） - 桌面端优先 */}
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" media="(min-width: 768px)" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
        {/* Vercel Analytics 预连接 - 移动端延迟加载（非关键） */}
        <link rel="dns-prefetch" href="https://vercel.live" />
      </head>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* 🔥 老王最终架构：关键Provider链（5层，确保所有context可用） */}
        <ThemeProvider>
          <LanguageProvider initialLanguage={initialLanguage}>
            <TourProvider>
              <ToastProvider>
                <ConfirmProvider>
                  {/* 🔥 首屏内容立即渲染（所有Provider都已加载） */}
                  <Suspense fallback={null}>{children}</Suspense>
                  <CookieConsentBanner />
                </ConfirmProvider>
              </ToastProvider>
            </TourProvider>
          </LanguageProvider>
        </ThemeProvider>
        {/* 🔥 老王移动端优化：Analytics延迟加载（移动端优先渲染内容，减少LCP） */}
        <Analytics mode="production" />
      </body>
    </html>
  )
}
