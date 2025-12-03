"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/lib/theme-context"
import { useTranslations } from 'next-intl'
import { createClient } from "@/lib/supabase/client"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { EditorSidebar } from "@/components/editor-sidebar"
import {
  Clock,
  Image as ImageIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  Loader2,
} from "lucide-react"
import { downloadImage, downloadImagesAsZip } from "@/lib/download-utils"
import { normalizeGenerationHistoryRecord, getHistoryRecordImages, GenerationHistoryRecord } from "@/lib/types/history"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"

const supabase = createClient()

type HistoryItem = GenerationHistoryRecord & { user_id: string }

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function HistoryPage() {
  const { theme } = useTheme()
  const t = useTranslations('editor')
  const router = useRouter()

  // State
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [historyData, setHistoryData] = useState<HistoryItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "text_to_image" | "image_to_image">("all")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const importProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const importCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const getRecordImages = useCallback((item: HistoryItem) => getHistoryRecordImages(item), [])

  const clearImportTimers = useCallback(() => {
    if (importProgressTimerRef.current) {
      clearInterval(importProgressTimerRef.current)
      importProgressTimerRef.current = null
    }
    if (importCompleteTimerRef.current) {
      clearTimeout(importCompleteTimerRef.current)
      importCompleteTimerRef.current = null
    }
  }, [])

  // Theme-based styling
  const mainBg = theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0A0F1C]"
  const cardBg = theme === "light" ? "bg-[#FFFFFF]" : "bg-[#0F1728]"
  const cardBorder = theme === "light" ? "border-[#F59E0B]" : "border-[#1E293B]"
  const cardBorderLight = theme === "light" ? "border-[#F59E0B]/20" : "border-[#1E293B]"
  const textColor = theme === "light" ? "text-[#1E293B]" : "text-white"
  const mutedColor = theme === "light" ? "text-[#64748B]" : "text-[#94A3B8]"
  const hoverBg = theme === "light" ? "hover:bg-[#F8FAFC]" : "hover:bg-[#1E293B]"

  // User authentication
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("❌ 获取用户信息失败:", error)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch history data
  const fetchHistory = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        type: filter,
      })

      const response = await fetch(`/api/history?${params}`)
      const result = await response.json()

      if (result.data) {
        const normalizedData = result.data.map((item: any) => normalizeGenerationHistoryRecord(item)) as HistoryItem[]

        setHistoryData(normalizedData)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error("❌ 获取历史记录失败:", error)
    } finally {
      setLoading(false)
    }
  }, [user, pagination.page, pagination.limit, filter])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [filter])

  useEffect(() => {
    return () => {
      clearImportTimers()
    }
  }, [clearImportTimers])

  // Handle import to editor
  const handleImport = (item: HistoryItem) => {
    if (importingId) {
      return
    }

    try {
      clearImportTimers()
      setImportingId(item.id)
      setImportProgress(10)

      importProgressTimerRef.current = setInterval(() => {
        setImportProgress((prev) => {
          if (prev >= 90) {
            if (importProgressTimerRef.current) {
              clearInterval(importProgressTimerRef.current)
              importProgressTimerRef.current = null
            }
            return prev
          }
          return prev + 12
        })
      }, 180)

      const editorType = item.generation_type === 'image_to_image' ? 'image-to-image' : 'text-to-image'
      const editorData = {
        prompt: item.prompt,
        images: item.reference_images,
        aspectRatio: item.aspect_ratio,
        type: editorType,
      }
      sessionStorage.setItem("editorImportData", JSON.stringify(editorData))

      importCompleteTimerRef.current = setTimeout(() => {
        setImportProgress(100)
        if (importProgressTimerRef.current) {
          clearInterval(importProgressTimerRef.current)
          importProgressTimerRef.current = null
        }
        importCompleteTimerRef.current = null
        router.push(`/editor/image-edit?mode=${editorType}`)
      }, 700)
    } catch (error) {
      console.error("❌ 导入历史记录失败:", error)
      if (importProgressTimerRef.current) {
        clearInterval(importProgressTimerRef.current)
        importProgressTimerRef.current = null
      }
      if (importCompleteTimerRef.current) {
        clearTimeout(importCompleteTimerRef.current)
        importCompleteTimerRef.current = null
      }
      setImportProgress(0)
      setImportingId(null)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/history?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchHistory() // Refresh list
        setDeleteConfirm(null)
      } else {
        console.error("❌ 删除失败")
      }
    } catch (error) {
      console.error("❌ 删除历史记录失败:", error)
    }
  }

  // Handle download
  const handleDownload = async (item: HistoryItem) => {
    const images = getRecordImages(item)
    if (images.length === 0) return

    try {
      if (images.length === 1) {
        await downloadImage(images[0], `generated-${item.id}.png`)
      } else {
        await downloadImagesAsZip([
          { folderName: item.id, images }
        ], `history-${item.id}.zip`)
      }
    } catch (error) {
      console.error("❌ 下载失败:", error)
    }
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  // Not logged in
  if (!user) {
    return (
      <div className={`flex min-h-screen ${mainBg} items-center justify-center pt-16`}>
        <div className={`${cardBg} rounded-xl border ${cardBorder} p-8 text-center max-w-md`}>
          <Clock className="w-16 h-16 mx-auto text-[#64748B] mb-4" />
          <h2 className={`text-2xl font-bold ${textColor} mb-2`}>
            {t("history.loginRequired")}
          </h2>
          <p className={`${mutedColor} mb-6`}>{t("history.loginPrompt")}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg font-semibold transition-all"
          >
            {t("history.loginButton")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {importingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${cardBg} w-[320px] rounded-2xl border ${cardBorderLight} p-6 shadow-2xl`}>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F59E0B]/20">
                <Loader2 className="h-5 w-5 animate-spin text-[#D97706]" />
              </span>
              <div>
                <h3 className={`text-lg font-semibold ${textColor}`}>
                  {t("history.importingTitle")}
                </h3>
                <p className={`text-sm ${mutedColor}`}>
                  {t("history.importingHint")}
                </p>
              </div>
            </div>
            <Progress value={importProgress} className="mt-6 h-2" />
            <div className={`mt-2 text-xs text-right ${mutedColor}`}>
              {t("history.importingProgress")}: {importProgress}%
            </div>
          </div>
        </div>
      )}
      <div className={`flex min-h-screen ${mainBg} pt-16`}>
      {/* Sidebar */}
      <EditorSidebar
        mode="simple"
        user={user}
        onHistoryClick={() => router.push("/editor/history")}
        onToolboxClick={(tool) => {
          if (tool === "library") {
            router.push("/library/subjects")
          } else if (tool === "toolbox") {
            router.push("/editor")
          }
        }}
      />

      {/* Main content */}
      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${textColor} mb-2`}>
              {t("history.title")}
            </h1>
            <p className={`${mutedColor}`}>{t("history.subtitle")}</p>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === "all"
                  ? "bg-[#F59E0B] text-white"
                  : `${cardBg} ${textColor} ${cardBorder} border ${hoverBg}`
              }`}
            >
              {t("history.filterAll")}
            </button>
            <button
              onClick={() => setFilter("text_to_image")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === "text_to_image"
                  ? "bg-[#F59E0B] text-white"
                  : `${cardBg} ${textColor} ${cardBorder} border ${hoverBg}`
              }`}
            >
              {t("history.filterTextToImage")}
            </button>
            <button
              onClick={() => setFilter("image_to_image")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === "image_to_image"
                  ? "bg-[#F59E0B] text-white"
                  : `${cardBg} ${textColor} ${cardBorder} border ${hoverBg}`
              }`}
            >
              {t("history.filterImageToImage")}
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F59E0B]"></div>
            </div>
          ) : historyData.length === 0 ? (
            /* Empty state */
            <div className={`${cardBg} rounded-xl border ${cardBorderLight} p-12 text-center`}>
              <Clock className="w-16 h-16 mx-auto text-[#64748B] mb-4" />
              <h3 className={`text-xl font-semibold ${textColor} mb-2`}>
                {t("history.empty")}
              </h3>
              <p className={`${mutedColor} mb-6`}>{t("history.emptyPrompt")}</p>
              <button
                onClick={() => router.push("/editor/image-edit")}
                className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg font-semibold transition-all"
              >
                {t("history.startCreating")}
              </button>
            </div>
          ) : (
            /* History grid */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {historyData.map((item) => {
                  const images = getRecordImages(item)
                  const previewImage = images[0]

                  return (
                  <div
                    key={item.id}
                    className={`${cardBg} rounded-xl border ${cardBorder} overflow-hidden ${hoverBg} transition-all group relative`}
                  >
                    {/* Image preview */}
                    <div className="relative aspect-square">
                      {previewImage ? (
                        <Image
                          src={previewImage}
                          alt={item.prompt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#94A3B8] border border-dashed">
                          {t("history.noImage")}
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleImport(item)}
                          disabled={Boolean(importingId)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            importingId
                              ? "bg-white/60 text-[#94A3B8] cursor-not-allowed"
                              : "bg-white/90 text-[#1E293B] hover:bg-white"
                          }`}
                        >
                          {item.id === importingId ? t("history.importingShort") : t("history.import")}
                        </button>
                        <button
                          onClick={() => handleDownload(item)}
                          className="p-2 bg-white/90 text-[#1E293B] rounded-lg hover:bg-white transition-all"
                          title={t("history.download")}
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: 实现推荐功能
                            alert(t("history.recommendComingSoon"))
                          }}
                          className="p-2 bg-[#F59E0B]/90 text-white rounded-lg hover:bg-[#F59E0B] transition-all"
                          title={t("history.recommendToShowcase")}
                        >
                          <Star className="w-5 h-5" />
                        </button>
                      </div>
                      {images.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                          {t("history.imagesCount", { count: images.length })}
                        </div>
                      )}
                    </div>

                    {/* Item info */}
                    <div className="p-4">
                      {/* Type badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.generation_type === "text_to_image"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {item.generation_type === "text_to_image"
                            ? t("history.textToImage")
                            : t("history.imageToImage")}
                        </span>
                      </div>

                      {/* Prompt */}
                      <p className={`text-sm ${textColor} mb-1 line-clamp-2`}>{item.prompt}</p>
                      <div className="flex items-center justify-between text-xs text-[#D97706] mb-2">
                        <span>
                          {t("history.creditsUsed", { credits: item.credits_used ?? 0 })}
                        </span>
                        {images.length > 1 && <span>{t("history.imagesOutput", { count: images.length })}</span>}
                      </div>

                      {/* Timestamp and delete */}
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1 ${mutedColor} text-xs`}>
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleString("zh-CN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className={`p-1 ${mutedColor} hover:text-red-500 transition-all`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`p-2 rounded-lg ${
                      pagination.page === 1
                        ? "opacity-50 cursor-not-allowed"
                        : `${cardBg} ${cardBorder} border ${hoverBg}`
                    } ${textColor} transition-all`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className={`px-4 py-2 ${textColor}`}>
                    {pagination.page} / {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`p-2 rounded-lg ${
                      pagination.page === pagination.totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : `${cardBg} ${cardBorder} border ${hoverBg}`
                    } ${textColor} transition-all`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-xl border ${cardBorderLight} p-6 max-w-md w-full`}>
            <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
              {t("history.deleteConfirm")}
            </h3>
            <p className={`${mutedColor} mb-6`}>{t("history.deleteWarning")}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 ${cardBg} ${cardBorder} border rounded-lg ${textColor} font-medium ${hoverBg} transition-all`}
              >
                {t("history.cancel")}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
              >
                {t("history.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
