// app/settings/page.tsx
// 🔥 老王创建：用户设置页面
// 功能: GDPR 数据导出和账户删除

"use client"

import { useState } from "react"
import { setRequestLocale } from 'next-intl/server'
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  Download,
  Trash2,
  Shield,
  Loader2,
  CheckCircle,
  ArrowLeft
} from "lucide-react"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = useTranslations('settings')  // 🔥 老王迁移：使用settings命名空间
  const tCommon = useTranslations('common')  // 🔥 老王迁移：公共翻译
  const router = useRouter()

  // 数据导出状态
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  // 账户删除状态
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  const [deleteError, setDeleteError] = useState("")

  // 导出用户数据
  const handleExportData = async () => {
    setIsExporting(true)
    setExportSuccess(false)

    try {
      const response = await fetch("/api/user/export")

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || t("error.exportFailed"))
      }

      // 获取文件名
      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : "user-data-export.json"

      // 下载文件
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (error: any) {
      console.error("导出失败:", error)
      alert(error.message || t("error.exportFailedRetry"))
    } finally {
      setIsExporting(false)
    }
  }

  // 删除账户
  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      setDeleteError(t("error.confirmTextInvalid"))
      return
    }

    setIsDeleting(true)
    setDeleteError("")

    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          confirmation: confirmText,
          reason: deleteReason
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || t("error.deleteFailed"))
      }

      // 删除成功，跳转到首页
      alert(t("delete.success"))
      router.push("/")
    } catch (error: any) {
      console.error("删除失败:", error)
      setDeleteError(error.message || t("error.deleteFailedContact"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{tCommon("back")}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("description")}
        </p>

        <div className="space-y-6">
          {/* 数据导出卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>{t("export.title")}</CardTitle>
                  <CardDescription>
                    {t("export.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                    {t("export.includes")}
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• {t("export.profile")}</li>
                    <li>• {t("export.subscriptions")}</li>
                    <li>• {t("export.generations")}</li>
                    <li>• {t("export.social")}</li>
                    <li>• {t("export.achievements")}</li>
                  </ul>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="flex items-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("export.exporting")}
                      </>
                    ) : exportSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {t("export.success")}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {t("export.button")}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Shield className="w-3 h-3" />
                    <span>GDPR Article 20</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 危险区域 - 删除账户 */}
          <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-red-600 dark:text-red-400">
                    {t("delete.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("delete.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>{t("delete.warning")}：</strong>{" "}
                    {t("delete.warningText")}
                  </p>
                </div>

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      {t("delete.button")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        {t("delete.confirmTitle")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("delete.confirmDescription")}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="delete-reason">
                          {t("delete.reasonLabel")}
                        </Label>
                        <Textarea
                          id="delete-reason"
                          placeholder={t("delete.reasonPlaceholder")}
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-text">
                          {t("delete.confirmLabel")}
                        </Label>
                        <Input
                          id="confirm-text"
                          placeholder="DELETE MY ACCOUNT"
                          value={confirmText}
                          onChange={(e) => {
                            setConfirmText(e.target.value)
                            setDeleteError("")
                          }}
                          className={deleteError ? "border-red-500" : ""}
                        />
                        {deleteError && (
                          <p className="text-sm text-red-600">{deleteError}</p>
                        )}
                      </div>
                    </div>

                    <DialogFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeleteDialogOpen(false)
                          setConfirmText("")
                          setDeleteReason("")
                          setDeleteError("")
                        }}
                      >
                        {tCommon("cancel")}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || confirmText !== "DELETE MY ACCOUNT"}
                        className="flex items-center gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t("delete.deleting")}
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            {t("delete.confirmButton")}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Shield className="w-3 h-3" />
                  <span>GDPR Article 17 - Right to be forgotten</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
