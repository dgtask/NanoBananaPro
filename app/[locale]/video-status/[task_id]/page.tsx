/**
 * 🔥 老王的视频任务状态页面
 * 用途: 显示视频生成任务的实时状态和进度
 * 老王提醒: 这个页面会自动轮询，别手动刷新！
 */

import { StaticHeader } from "@/components/static-header"
import { setRequestLocale } from 'next-intl/server'
import { StaticFooter } from "@/components/static-footer"
import { VideoStatusTracker } from "@/components/video-status-tracker"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Video Generation Status | Nano Banana",
  description: "Track your AI video generation progress in real-time",
  robots: "noindex, nofollow", // 不索引状态页面
}

interface PageProps {
  params: Promise<{
    task_id: string
  }>
}

export default async function VideoStatusPage({ params }: PageProps, {
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // 🔥 Next.js 16 要求: params 是 Promise，必须 await
  const { task_id } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <StaticHeader />

      <main className="flex-1 py-12 px-4">
        <VideoStatusTracker taskId={task_id} />
      </main>

      <StaticFooter />
    </div>
  )
}
