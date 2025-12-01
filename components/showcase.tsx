"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import Image from "next/image"

export function Showcase() {
  const { t } = useLanguage()

  const showcaseItems = [
    {
      image: "/majestic-snow-capped-mountain-range-at-golden-hour.jpg",
      title: t("showcase.mountain.title"),
      description: t("showcase.mountain.description"),
      badge: t("showcase.mountain.badge"),
      slug: "mountain-generation",
    },
    {
      image: "/traditional-japanese-garden-with-cherry-blossoms-a.jpg",
      title: t("showcase.garden.title"),
      description: t("showcase.garden.description"),
      badge: t("showcase.garden.badge"),
      slug: "garden-creation",
    },
    {
      image: "/tropical-beach-paradise-with-palm-trees-and-crysta.jpg",
      title: t("showcase.beach.title"),
      description: t("showcase.beach.description"),
      badge: t("showcase.beach.badge"),
      slug: "beach-paradise",
    },
    {
      image: "/vibrant-aurora-borealis-over-snowy-landscape-with-.jpg",
      title: t("showcase.aurora.title"),
      description: t("showcase.aurora.description"),
      badge: t("showcase.aurora.badge"),
      slug: "aurora-magic",
    },
  ]

  return (
    <section id="showcase" className="py-24 px-4 bg-gradient-to-b from-secondary/20 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t("showcase.label")}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">{t("showcase.title")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">{t("showcase.description")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {showcaseItems.map((item, index) => (
            <Link key={index} href="/showcase">
              <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-card border border-border cursor-pointer">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <Badge className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground shadow-lg font-semibold">
                    {item.badge}
                  </Badge>
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    fill
                    priority={index < 2}
                    quality={85}
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
