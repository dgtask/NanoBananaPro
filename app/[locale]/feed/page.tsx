// app/feed/page.tsx
// 🔥 老王创建：Activity Feed 活动信息流
// 功能: 显示关注用户的动态

"use client"

import { useEffect, useState } from "react"
import { setRequestLocale } from 'next-intl/server'
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTranslations } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import {
  Activity,
  Heart,
  MessageSquare,
  Image as ImageIcon,
  Video,
  UserPlus,
  Award,
  Loader2,
  RefreshCw
} from "lucide-react"
import Image from "next/image"

interface FeedItem {
  id: string
  type: 'artwork' | 'video' | 'comment' | 'follow' | 'achievement' | 'like'
  user: {
    id: string
    name: string
    avatar?: string
  }
  content: {
    title?: string
    thumbnail?: string
    text?: string
    target_user?: string
  }
  created_at: string
}

export default async function FeedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = useTranslations('feed')  // 🔥 老王迁移：使用feed命名空间
  const tc = useTranslations('common')  // 🔥 老王迁移：用于common.button.retry
  const router = useRouter()
  const [items, setItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeed = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/feed')

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch feed')
      }

      const data = await response.json()
      setItems(data.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load feed')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'artwork':
        return <ImageIcon className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'comment':
        return <MessageSquare className="w-4 h-4" />
      case 'follow':
        return <UserPlus className="w-4 h-4" />
      case 'achievement':
        return <Award className="w-4 h-4" />
      case 'like':
        return <Heart className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityText = (item: FeedItem) => {
    switch (item.type) {
      case 'artwork':
        return t("activity.newArtwork")
      case 'video':
        return t("activity.newVideo")
      case 'comment':
        return t("activity.commented")
      case 'follow':
        return `${t("activity.followed")} ${item.content.target_user}`
      case 'achievement':
        return `${t("activity.earned")} ${item.content.title}`
      case 'like':
        return t("activity.liked")
      default:
        return t("activity.default")
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t("time.justNow")
    if (diffMins < 60) return `${diffMins}${t("time.minsAgo")}`
    if (diffHours < 24) return `${diffHours}${t("time.hoursAgo")}`
    if (diffDays < 7) return `${diffDays}${t("time.daysAgo")}`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Activity className="w-8 h-8 text-primary" />
                {t("title")}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t("subtitle")}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchFeed}
              disabled={isLoading}
              className="w-10 h-10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchFeed}>
                {tc("button.retry")}
              </Button>
            </Card>
          ) : items.length === 0 ? (
            <Card className="p-8 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {t("empty.title")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t("empty.description")}
              </p>
              <Button onClick={() => router.push('/leaderboard')}>
                {t("empty.cta")}
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex gap-4">
                    {/* User Avatar */}
                    <div className="relative w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      {item.user.avatar ? (
                        <Image
                          src={item.user.avatar}
                          alt={item.user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {item.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {item.user.name}
                        </span>
                        <span className="text-muted-foreground">
                          {getActivityText(item)}
                        </span>
                      </div>

                      {/* Activity content preview */}
                      {item.content.title && (
                        <p className="text-sm text-foreground font-medium">
                          {item.content.title}
                        </p>
                      )}
                      {item.content.text && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.content.text}
                        </p>
                      )}

                      {/* Thumbnail */}
                      {item.content.thumbnail && (
                        <div className="relative w-full aspect-video mt-2 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={item.content.thumbnail}
                            alt="Activity preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Timestamp & type icon */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {getActivityIcon(item.type)}
                        </span>
                        <span>{formatTime(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
