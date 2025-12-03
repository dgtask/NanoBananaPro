/**
 * 🔥 老王的角色一致性工具页面
 * 用途: SEO优化，展示跨图片角色一致性保持功能
 * 老王提醒: 这个功能是核心竞争力，同一角色多个场景，必须保持外观一致！
 */

import type { Metadata} from "next"
import { setRequestLocale } from 'next-intl/server'
import Link from "next/link"
import { StaticHeader } from "@/components/static-header"
import { StaticFooter } from "@/components/static-footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Sparkles, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Character Consistency AI - Keep Characters Identical Across Images | Nano Banana",
  description:
    "Maintain perfect character consistency across multiple images with AI. Same face, same style, different scenes. Perfect for comics, storyboards, and content creation.",
  keywords: [
    "character consistency",
    "same character multiple images",
    "AI character generator",
    "consistent character",
    "story character",
    "comic character",
  ],
  openGraph: {
    title: "Character Consistency AI - Same Character, Different Scenes",
    description: "Generate multiple images with the same character. Perfect for storytelling and content series.",
    type: "website",
  },
}

export default async function CharacterConsistencyPage({
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
                <Users className="w-4 h-4" />
                Character AI
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Keep Characters
                <br />
                <span className="text-primary">Identical</span>
                <br />
                Across Images
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Create a character once, use it everywhere. Same face, same style, unlimited scenes. Perfect for
                comics, storyboards, marketing campaigns, and content series.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/editor/image-edit?tool=consistent-generation">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                    Create Consistent Character
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Same face every time</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Unlimited scenes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Style preserved</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-muted/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-20 h-20 text-primary mx-auto mb-4" />
                    <p className="text-lg font-semibold">Character Consistency Magic</p>
                    <p className="text-sm text-muted-foreground mt-2">Same hero, different adventures</p>
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
            <h2 className="text-4xl font-bold mb-4">How Character Consistency Works</h2>
            <p className="text-xl text-muted-foreground">3 simple steps to consistent characters</p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Define Your Character</h3>
                <p className="text-muted-foreground">
                  Upload a reference image or describe your character in detail (age, features, style, clothing, etc.).
                  AI learns the character's unique traits.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Generate Multiple Scenes</h3>
                <p className="text-muted-foreground">
                  Create the character in different poses, expressions, backgrounds, and situations. AI maintains
                  facial features and style perfectly.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Build Your Story</h3>
                <p className="text-muted-foreground">
                  Use the consistent character across your entire project - comics, marketing, social media, videos.
                  Unlimited possibilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Perfect For</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Comics & Manga</h3>
              <p className="text-muted-foreground">
                Create entire comic books with consistent characters. Same hero, hundreds of panels, perfect continuity.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🎬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Storyboards & Films</h3>
              <p className="text-muted-foreground">
                Visualize your script with consistent actors. Generate storyboard frames with the same characters
                throughout.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Marketing Campaigns</h3>
              <p className="text-muted-foreground">
                Create a brand mascot and use it across all materials. Consistent character = stronger brand identity.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Game Development</h3>
              <p className="text-muted-foreground">
                Design game characters and generate concept art with consistent appearance across different poses and
                outfits.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Book Illustrations</h3>
              <p className="text-muted-foreground">
                Illustrate children's books or novels with the same protagonist throughout the entire story.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📺</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">YouTube Series</h3>
              <p className="text-muted-foreground">
                Create consistent thumbnails and channel art with your brand character appearing in every video.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Advanced Character Control</h2>
            <p className="text-xl text-muted-foreground">Professional-grade consistency tools</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🎭", title: "Facial Recognition", desc: "AI locks onto key facial features" },
              { icon: "🎨", title: "Style Matching", desc: "Maintains art style and rendering" },
              { icon: "👕", title: "Outfit Control", desc: "Keep or change clothing as needed" },
              { icon: "💡", title: "Lighting Adapt", desc: "Character adapts to any lighting" },
              { icon: "📐", title: "Pose Flexibility", desc: "Any angle, any pose - consistent" },
              { icon: "🌈", title: "Expression Range", desc: "Happy, sad, angry - same character" },
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
          <h2 className="text-4xl font-bold mb-4">Ready to Create Your Character?</h2>
          <p className="text-xl mb-8 opacity-90">Build stories with characters that never change (unless you want them to)</p>
          <Link href="/editor/image-edit?tool=consistent-generation">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Creating Consistent Characters
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <StaticFooter />
    </div>
  )
}
