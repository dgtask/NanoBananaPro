/**
 * 🔥 老王的用户指南页面
 * 用途: 展示完整的用户指南文档（Version 2.0），包含社交功能教程
 * 老王提醒: 这文档巨tm详细，从快速入门到高级功能全都有！
 */

"use client"

import { useState, useEffect } from "react"
import { setRequestLocale } from 'next-intl/server'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default async function UserGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [markdown, setMarkdown] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // 🔥 老王新增：加载用户指南markdown文件
  useEffect(() => {
    async function loadMarkdown() {
      try {
        const response = await fetch("/USER_GUIDE.md")
        if (response.ok) {
          const text = await response.text()
          setMarkdown(text)
        } else {
          console.error("❌ 加载用户指南失败:", response.status)
        }
      } catch (error) {
        console.error("❌ 加载用户指南出错:", error)
      } finally {
        setLoading(false)
      }
    }
    loadMarkdown()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">加载中... / Loading...</p>
            </div>
          ) : (
            <article className="prose prose-lg max-w-none dark:prose-invert">
              {/* 🔥 老王提示: react-markdown + remark-gfm 完美渲染GitHub风格markdown */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
