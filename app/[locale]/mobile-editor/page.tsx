"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { EditorSection } from "@/components/editor-section"

export default function MobileEditorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <EditorSection />
      </main>
      <Footer />
    </div>
  )
}
