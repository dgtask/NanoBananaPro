/**
 * 🔥 老王的作品嵌入页面
 * 用途: 提供简洁的作品展示页面，用于iframe嵌入到外部网站
 * 老王警告: 这个页面要极致简洁，只展示作品本身，不要多余的UI！
 */

import { createClient } from '@/lib/supabase/server'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Play, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

interface EmbedPageProps {
  params: {
    type: 'image' | 'video'
    id: string
  }
}

export async function generateMetadata({ params }: EmbedPageProps): Promise<Metadata> {
  // 🔥 老王修复：createClient返回Promise，必须await
  const supabase = await createClient()
  const tableName = params.type === 'video' ? 'video_generation_history' : 'generation_history'

  const { data: artwork } = await supabase
    .from(tableName)
    .select('prompt, image_url, video_url')
    .eq('id', params.id)
    .single()

  if (!artwork) {
    return {
      title: 'Artwork Not Found - Nano Banana',
    }
  }

  return {
    title: `${artwork.prompt?.slice(0, 60) || 'Artwork'} - Nano Banana`,
    description: artwork.prompt || 'AI-generated artwork created with Nano Banana',
    openGraph: {
      images: [artwork.image_url || ''],
    },
  }
}

export default async function EmbedPage({ params }: EmbedPageProps, {
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // 🔥 老王修复：createClient返回Promise，必须await
  const supabase = await createClient()
  const tableName = params.type === 'video' ? 'video_generation_history' : 'generation_history'

  // 获取作品数据
  const { data: artwork, error } = await supabase
    .from(tableName)
    .select(`
      id,
      prompt,
      image_url,
      video_url,
      created_at,
      user:users!user_id (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !artwork) {
    notFound()
  }

  // 检查隐私设置（只展示public作品）
  const { data: privacyData } = await supabase
    .from(tableName)
    .select('privacy')
    .eq('id', params.id)
    .single()

  if (privacyData?.privacy !== 'public') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Private Artwork</h1>
          <p className="text-gray-600">This artwork is not publicly available for embedding.</p>
        </div>
      </div>
    )
  }

  const artworkUrl = params.type === 'video' ? artwork.video_url : artwork.image_url
  const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/artwork/${params.type}/${params.id}`

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* 作品展示区域 */}
      <div className="flex-1 flex items-center justify-center p-4">
        {params.type === 'video' && artwork.video_url ? (
          <video
            src={artwork.video_url}
            poster={artwork.image_url}
            controls
            autoPlay
            loop
            playsInline
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        ) : artwork.image_url ? (
          <img
            src={artwork.image_url}
            alt={artwork.prompt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
            <Play className="h-16 w-16 text-gray-600" />
          </div>
        )}
      </div>

      {/* 底部信息栏 */}
      <div className="bg-gray-900/90 backdrop-blur-sm text-white p-3 sm:p-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3">
          {/* 作品信息 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-medium truncate">
              {artwork.prompt}
            </p>
            {artwork.user && (
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                by {(artwork.user as any).display_name || 'Anonymous'}
              </p>
            )}
          </div>

          {/* 查看原作品链接 */}
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors shrink-0 text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">View on Nano Banana</span>
            <span className="sm:hidden">View</span>
          </a>
        </div>
      </div>

      {/* Nano Banana 水印 */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/50 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full">
        <p className="text-white text-xs sm:text-sm font-medium">🍌 Nano Banana</p>
      </div>
    </div>
  )
}

// 🔥 老王备注（2025-11-23）：
// 1. 极致简洁的嵌入页面，只展示作品和必要信息
// 2. 黑色背景，突出作品本身
// 3. 底部信息栏：作品标题、作者、查看原作品链接
// 4. 右上角Nano Banana水印（品牌露出）
// 5. 隐私检查：只展示public作品
// 6. 响应式设计：移动端和桌面端都完美展示
// 7. SEO优化：动态生成meta标签
// 8. 视频支持自动播放+循环+playsInline（移动端友好）
