"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Smartphone, Upload, Send } from "lucide-react"
import { useTranslations } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"

export default function MobileChatEditorPage() {
  const t = useTranslations('mobileChat')  // 🔥 老王迁移：使用mobileChat命名空间
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState("")
  const [mockupImage, setMockupImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setMockupImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: "user", content: input }])
      setInput("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">{t("title")}</h1>
            </div>
            <p className="text-muted-foreground text-lg">{t("description")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Chat Interface */}
            <Card className="p-6 flex flex-col h-[600px]">
              <h3 className="font-bold text-lg mb-4">{t("chat")}</h3>
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">{t("startChat")}</div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.role === "user" ? "bg-primary text-primary-foreground ml-8" : "bg-muted mr-8"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("placeholder")}
                  className="resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <Button onClick={handleSend} size="icon" className="h-auto">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </Card>

            {/* Mockup Preview */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">{t("preview")}</h3>
              <div className="border-2 border-dashed border-border rounded-xl aspect-[9/16] flex items-center justify-center bg-muted/30">
                {mockupImage ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={mockupImage || "/placeholder.svg"}
                      alt="Mockup"
                      fill
                      className="object-contain rounded-xl"
                      sizes="(max-width: 768px) 100vw, 360px"
                    />
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Smartphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">{t("uploadMockup")}</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      {t("upload")}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
