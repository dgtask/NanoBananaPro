"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/lib/theme-context"
import { useTranslations } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import { createClient } from "@/lib/supabase/client"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { EditorSidebar } from "@/components/editor-sidebar"
import {
  Library,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Image as ImageIcon,
  Plus,
  X,
  Loader2,
} from "lucide-react"
import Image from "next/image"

const supabase = createClient()

interface SubjectItem {
  id: string
  user_id: string
  name: string
  description: string | null
  subject_type: "person" | "object" | "pet" | "other"
  image_url: string
  metadata: any
  created_at: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function SubjectLibraryPage() {
  const { theme } = useTheme()
  const t = useTranslations('library')  // 🔥 老王迁移：使用library命名空间
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "person" | "object" | "pet" | "other">("all")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    type: "person" as "person" | "object" | "pet" | "other",
    file: null as File | null,
    preview: null as string | null,
  })
  const [isUploading, setIsUploading] = useState(false)

  // Theme-based styling
  const mainBg = theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0A0F1C]"
  const cardBg = theme === "light" ? "bg-[#FFFFFF]" : "bg-[#0F1728]"
  const cardBorder = theme === "light" ? "border-[#F59E0B]" : "border-[#1E293B]"
  const cardBorderLight = theme === "light" ? "border-[#F59E0B]/20" : "border-[#1E293B]"
  const textColor = theme === "light" ? "text-[#1E293B]" : "text-white"
  const mutedColor = theme === "light" ? "text-[#64748B]" : "text-[#94A3B8]"
  const hoverBg = theme === "light" ? "hover:bg-[#F8FAFC]" : "hover:bg-[#1E293B]"
  const inputBg = theme === "light" ? "bg-[#FFFFFF]" : "bg-[#1E293B]"
  const inputBorder = theme === "light" ? "border-[#E2E8F0]" : "border-[#334155]"

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

  // Fetch subjects
  const fetchSubjects = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        type: filterType,
        search: searchQuery,
      })

      const response = await fetch(`/api/subjects?${params}`)
      const result = await response.json()

      if (result.data) {
        setSubjects(result.data)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error("❌ 获取主体库失败:", error)
    } finally {
      setLoading(false)
    }
  }, [user, pagination.page, pagination.limit, filterType, searchQuery])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(t("subjects.error.fileTooLarge"))
        return
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert(t("subjects.error.invalidFileType"))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadForm((prev) => ({
          ...prev,
          file,
          preview: e.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle upload
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name || !user) {
      alert(t("subjects.uploadModal.nameRequired"))
      return
    }

    setIsUploading(true)

    try {
      // Read file as base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string

        const response = await fetch("/api/subjects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: uploadForm.name,
            description: uploadForm.description || null,
            subject_type: uploadForm.type,
            image: base64,
          }),
        })

        if (response.ok) {
          // Reset form and close modal
          setUploadForm({
            name: "",
            description: "",
            type: "person",
            file: null,
            preview: null,
          })
          setUploadModalOpen(false)
          // Refresh list
          fetchSubjects()
        } else {
          const error = await response.json()
          alert(t("subjects.error.uploadFailed"))
        }
      }
      reader.readAsDataURL(uploadForm.file)
    } catch (error) {
      console.error("❌ 上传主体失败:", error)
      alert(t("subjects.error.uploadFailed"))
    } finally {
      setIsUploading(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/subjects?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchSubjects()
        setDeleteConfirm(null)
      } else {
        alert(t("subjects.error.deleteFailed"))
      }
    } catch (error) {
      console.error("❌ 删除主体失败:", error)
      alert(t("subjects.error.deleteFailed"))
    }
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  // Get type badge color
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "person":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
      case "object":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
      case "pet":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  // Not logged in
  if (!user) {
    return (
      <div className={`flex min-h-screen ${mainBg} items-center justify-center pt-16`}>
        <div className={`${cardBg} rounded-xl border ${cardBorder} p-8 text-center max-w-md`}>
          <Library className="w-16 h-16 mx-auto text-[#64748B] mb-4" />
          <h2 className={`text-2xl font-bold ${textColor} mb-2`}>{t("subjects.loginRequired")}</h2>
          <p className={`${mutedColor} mb-6`}>{t("subjects.loginMessage")}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg font-semibold transition-all"
          >
            {t("subjects.loginButton")}
          </button>
        </div>
      </div>
    )
  }

  return (
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
            <h1 className={`text-3xl font-bold ${textColor} mb-2`}>{t("subjects.title")}</h1>
            <p className={`${mutedColor}`}>{t("subjects.subtitle")}</p>
          </div>

          {/* Actions bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${mutedColor}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("subjects.searchPlaceholder")}
                className={`w-full pl-10 pr-4 py-2.5 ${inputBg} border ${inputBorder} rounded-lg ${textColor} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]`}
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2">
              {["all", "person", "object", "pet", "other"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterType === type
                      ? "bg-[#F59E0B] text-white"
                      : `${cardBg} ${textColor} ${cardBorder} border ${hoverBg}`
                  }`}
                >
                  {t(`library.subjects.filter.${type}`)}
                </button>
              ))}
            </div>

            {/* Upload button */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-6 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t("subjects.uploadButton")}
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F59E0B]"></div>
            </div>
          ) : subjects.length === 0 ? (
            /* Empty state */
            <div className={`${cardBg} rounded-xl border ${cardBorderLight} p-12 text-center`}>
              <Library className="w-16 h-16 mx-auto text-[#64748B] mb-4" />
              <h3 className={`text-xl font-semibold ${textColor} mb-2`}>{t("subjects.empty.title")}</h3>
              <p className={`${mutedColor} mb-6`}>{t("subjects.empty.message")}</p>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg font-semibold transition-all"
              >
                {t("subjects.uploadButton")}
              </button>
            </div>
          ) : (
            /* Subjects grid */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className={`${cardBg} rounded-xl border ${cardBorder} overflow-hidden ${hoverBg} transition-all group relative`}
                  >
                    {/* Image */}
                    <div className="relative aspect-square">
                      <Image
                        src={subject.image_url}
                        alt={subject.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                      {/* Delete button overlay */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setDeleteConfirm(subject.id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      {/* Type badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadge(subject.subject_type)}`}>
                          {subject.subject_type === "person" ? "人物" : subject.subject_type === "object" ? "物体" : subject.subject_type === "pet" ? "宠物" : "其他"}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className={`text-lg font-semibold ${textColor} mb-1`}>{subject.name}</h3>

                      {/* Description */}
                      {subject.description && (
                        <p className={`text-sm ${mutedColor} line-clamp-2`}>{subject.description}</p>
                      )}

                      {/* Created date */}
                      <p className={`text-xs ${mutedColor} mt-2`}>
                        {new Date(subject.created_at).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>
                ))}
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

      {/* Upload modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-xl border ${cardBorder} p-6 max-w-lg w-full`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${textColor}`}>{t("subjects.uploadModal.title")}</h3>
              <button
                onClick={() => {
                  setUploadModalOpen(false)
                  setUploadForm({
                    name: "",
                    description: "",
                    type: "person",
                    file: null,
                    preview: null,
                  })
                }}
                className={`p-1 ${mutedColor} hover:text-red-500 transition-all`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Image preview/upload */}
              {uploadForm.preview ? (
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={uploadForm.preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                  <button
                    onClick={() => {
                      setUploadForm((prev) => ({ ...prev, file: null, preview: null }))
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed ${cardBorderLight} rounded-lg p-8 text-center cursor-pointer ${hoverBg} transition-all`}
                >
                  <Upload className={`w-12 h-12 mx-auto ${mutedColor} mb-2`} />
                  <p className={`text-sm ${textColor} mb-1`}>{t("subjects.uploadModal.clickToUpload")}</p>
                  <p className={`text-xs ${mutedColor}`}>支持 JPG、PNG、WebP，最大 5MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Name */}
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  {t("subjects.uploadModal.name")} *
                </label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t("subjects.uploadModal.namePlaceholder")}
                  className={`w-full px-4 py-2.5 ${inputBg} border ${inputBorder} rounded-lg ${textColor} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  {t("subjects.uploadModal.description")}
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t("subjects.uploadModal.descriptionPlaceholder")}
                  className={`w-full px-4 py-2.5 ${inputBg} border ${inputBorder} rounded-lg ${textColor} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] resize-none`}
                  rows={3}
                />
              </div>

              {/* Type */}
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  {t("subjects.uploadModal.type")} *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["person", "object", "pet", "other"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setUploadForm((prev) => ({ ...prev, type: type as any }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        uploadForm.type === type
                          ? "bg-[#F59E0B] text-white"
                          : `${cardBg} ${textColor} ${cardBorder} border ${hoverBg}`
                      }`}
                    >
                      {t(`subjects.types.${type}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setUploadModalOpen(false)
                    setUploadForm({
                      name: "",
                      description: "",
                      type: "person",
                      file: null,
                      preview: null,
                    })
                  }}
                  className={`flex-1 px-4 py-2.5 ${cardBg} ${cardBorder} border rounded-lg ${textColor} font-medium ${hoverBg} transition-all`}
                >
                  {t("subjects.uploadModal.cancelButton")}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadForm.file || !uploadForm.name || isUploading}
                  className="flex-1 px-4 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 inline-block mr-2 animate-spin" />
                      {t("subjects.uploadModal.uploadingButton")}
                    </>
                  ) : (
                    t("subjects.uploadModal.uploadButton")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-xl border ${cardBorderLight} p-6 max-w-md w-full`}>
            <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
              {t("subjects.deleteModal.title")}
            </h3>
            <p className={`${mutedColor} mb-6`}>{t("subjects.deleteModal.message")}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 ${cardBg} ${cardBorder} border rounded-lg ${textColor} font-medium ${hoverBg} transition-all`}
              >
                {t("subjects.deleteModal.cancelButton")}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
              >
                {t("subjects.deleteModal.deleteButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
