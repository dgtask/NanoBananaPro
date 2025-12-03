/**
 * 🔥 老王的一键编辑工具页面
 * 用途: SEO优化，展示一键编辑功能和快速修图场景
 * 老王提醒: 这个工具就是图快，3秒出结果，别磨叽！
 */

import type { Metadata } from "next"
import { setRequestLocale } from 'next-intl/server'
import Link from "next/link"
import { StaticHeader } from "@/components/static-header"
import { StaticFooter } from "@/components/static-footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, CheckCircle, Clock } from "lucide-react"

// 🔥 SEO优化：精准的meta标签
export const metadata: Metadata = {
  title: "One-Shot AI Image Editor - Quick Edits in 3 Seconds | Nano Banana",
  description:
    "Edit images instantly with one-shot AI editing. No complex tools, no learning curve. Just describe what you want and get perfect results in seconds. Try free now!",
  keywords: [
    "one-shot editing",
    "quick image edit",
    "instant photo editor",
    "AI image transform",
    "fast editing tool",
    "simple image editor",
  ],
  openGraph: {
    title: "One-Shot AI Image Editor - Edit Images in Seconds",
    description: "The fastest way to edit images with AI. One prompt, perfect results.",
    type: "website",
  },
}

export default async function OneShotPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="min-h-screen flex flex-col">
      <StaticHeader />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-muted/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Clock className="w-4 h-4" />
                3-Second Edits
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Edit Images
                <br />
                with <span className="text-primary">One Prompt</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                No complex tools, no layers, no hassle. Just tell the AI what you want, and watch your image transform
                in seconds. The fastest way to edit images.
              </p>

              {/* CTA按钮 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/editor/image-edit?tool=style-transfer">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                    Try One-Shot Editing
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/showcase">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                    See Examples
                  </Button>
                </Link>
              </div>

              {/* 快速功能点 */}
              <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>One prompt only</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>3-second results</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No learning curve</span>
                </div>
              </div>
            </div>

            {/* 预览图区域 */}
            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-muted/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Zap className="w-20 h-20 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-lg font-semibold">One-Shot Magic</p>
                    <p className="text-sm text-muted-foreground mt-2">Type what you want, get instant results</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How One-Shot Editing Works</h2>
            <p className="text-xl text-muted-foreground">The simplest editing workflow ever</p>
          </div>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Upload Your Image</h3>
                <p className="text-muted-foreground">
                  Drop any image you want to edit. Works with photos, graphics, screenshots - anything.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Describe What You Want</h3>
                <p className="text-muted-foreground">
                  Type one simple prompt like "make the sky sunset orange" or "add a mountain in background". That's
                  it.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get Perfect Result</h3>
                <p className="text-muted-foreground">
                  AI understands your intent and applies the edit perfectly. Download the result instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Prompts */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Example One-Shot Prompts</h2>
            <p className="text-xl text-muted-foreground">Get inspired by what others are creating</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { prompt: "Make the sky dramatic sunset", category: "Color Adjustment" },
              { prompt: "Add snow on the ground", category: "Scene Addition" },
              { prompt: "Change shirt color to red", category: "Object Edit" },
              { prompt: "Remove all people from background", category: "Object Removal" },
              { prompt: "Make it look like autumn", category: "Style Transfer" },
              { prompt: "Add lens flare effect", category: "Effects" },
            ].map((example, i) => (
              <div key={i} className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
                <div className="text-xs font-medium text-primary mb-2">{example.category}</div>
                <p className="font-mono text-sm bg-muted p-3 rounded">"{example.prompt}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Perfect For Quick Fixes</h2>
            <p className="text-xl text-muted-foreground">When you need results fast</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Use Case 1 */}
            <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Social Media</h3>
              <p className="text-muted-foreground">
                Quick touch-ups for Instagram, TikTok, LinkedIn posts. No need to open Photoshop for simple edits.
              </p>
            </div>

            {/* Use Case 2 */}
            <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Work Presentations</h3>
              <p className="text-muted-foreground">
                Fix slides, adjust colors, remove unwanted objects from presentation images in seconds.
              </p>
            </div>

            {/* Use Case 3 */}
            <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Personal Photos</h3>
              <p className="text-muted-foreground">
                Enhance vacation photos, fix lighting issues, or add creative effects to your memories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why One-Shot Editing?</h2>
            <p className="text-xl text-muted-foreground">The benefits of AI-powered simplicity</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "Instant Results", desc: "Get edits in 3 seconds, not 3 minutes" },
              { icon: "🎯", title: "Zero Learning", desc: "No tutorials, no complex tools to master" },
              { icon: "💬", title: "Natural Language", desc: "Just type what you want in plain English" },
              { icon: "🎨", title: "Smart AI", desc: "Understands context and creative intent" },
              { icon: "📐", title: "Precise Control", desc: "AI knows exactly what to change and what to keep" },
              { icon: "🔄", title: "Iterate Fast", desc: "Try multiple variations in seconds" },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-lg border bg-card">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">Ready for Lightning-Fast Edits?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join creators who are editing images 10x faster with one-shot AI
          </p>
          <Link href="/editor/image-edit?tool=style-transfer">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Try One-Shot Editing Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <StaticFooter />
    </div>
  )
}
