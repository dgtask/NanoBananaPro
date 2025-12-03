/**
 * 🔥 老王的社区规范页面
 * 用途: 展示社区行为准则和内容规范
 * 老王提醒: 这规范覆盖了从核心价值观到违规处理的所有内容，中英双语！
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { setRequestLocale } from 'next-intl/server'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

// 🔥 老王新增：目录项类型
interface TocItem {
  id: string
  text: string
  level: number
}

export default async function CommunityGuidelinesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [markdown, setMarkdown] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const contentRef = useRef<HTMLDivElement>(null)

  // 🔥 老王新增：从markdown提取目录
  const extractToc = (text: string): TocItem[] => {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm
    const items: TocItem[] = []
    let match

    while ((match = headingRegex.exec(text)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      // 生成id：转小写、空格换成连字符、移除特殊字符
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
      items.push({ id, text, level })
    }

    return items
  }

  // 🔥 老王新增：加载社区规范markdown文件
  useEffect(() => {
    async function loadMarkdown() {
      try {
        const response = await fetch("/COMMUNITY_GUIDELINES.md")
        if (response.ok) {
          const text = await response.text()
          setMarkdown(text)
          setToc(extractToc(text))
        } else {
          console.error("❌ 加载社区规范失败:", response.status)
        }
      } catch (error) {
        console.error("❌ 加载社区规范出错:", error)
      } finally {
        setLoading(false)
      }
    }
    loadMarkdown()
  }, [])

  // 🔥 老王新增：滚动监听，高亮当前阅读的目录项
  useEffect(() => {
    if (!contentRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-100px 0px -80% 0px',
        threshold: 0
      }
    )

    const headings = contentRef.current.querySelectorAll('h2, h3')
    headings.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [markdown])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4 pt-24">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">加载中... / Loading...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* 🔥 老王美化：左侧目录导航 */}
              <aside className="lg:col-span-1 order-2 lg:order-1">
                <div className="sticky top-24 bg-card rounded-lg border shadow-sm p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
                  <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                    目录 / Contents
                  </h4>
                  <nav className="space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "block py-1.5 text-sm transition-colors rounded px-2",
                          item.level === 2 && "font-medium",
                          item.level === 3 && "pl-4 text-xs",
                          activeId === item.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        onClick={(e) => {
                          e.preventDefault()
                          document.getElementById(item.id)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          })
                        }}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* 🔥 老王美化：右侧内容区域 */}
              <article ref={contentRef} className="lg:col-span-3 order-1 lg:order-2 bg-card rounded-lg border shadow-sm p-8 chinese-typography">
                <div className="prose prose-lg max-w-none dark:prose-invert
                  prose-headings:scroll-mt-24
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-muted prose-pre:border
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-table:border-collapse prose-table:w-full
                  prose-thead:bg-muted
                  prose-th:border prose-th:border-border prose-th:p-2
                  prose-td:border prose-td:border-border prose-td:p-2
                ">
                  {/* 🔥 老王提示: 双语社区规范，从核心价值到违规处理全覆盖 */}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 🔥 老王修复：给标题添加id，方便锚点跳转（和目录中的id保持一致）
                      h1: ({node, ...props}) => {
                        const text = props.children?.toString() || ''
                        const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
                        return <h1 id={id} {...props} />
                      },
                      h2: ({node, ...props}) => {
                        const text = props.children?.toString() || ''
                        const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
                        return <h2 id={id} {...props} />
                      },
                      h3: ({node, ...props}) => {
                        const text = props.children?.toString() || ''
                        const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
                        return <h3 id={id} {...props} />
                      },
                    }}
                  >
                    {markdown}
                  </ReactMarkdown>
                </div>
              </article>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
