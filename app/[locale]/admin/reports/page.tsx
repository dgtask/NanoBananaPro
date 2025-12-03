"use client"

import { useEffect, useState } from "react"
import { useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl的useLocale
import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { formatRelativeTime } from "@/lib/forum-utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flag, CheckCircle, XCircle, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"

/**
 * AdminReportsPage - 管理员举报审核页面
 *
 * 功能：
 * - 显示所有举报列表（分页）
 * - 按状态筛选（pending/approved/rejected）
 * - 按类型筛选（thread/reply）
 * - 查看举报详情和被举报内容
 * - 审核操作（通过/拒绝，选择处理方式）
 * - 权限控制（仅管理员和审核员可访问）
 */

interface ForumReport {
  id: string
  target_type: "thread" | "reply"
  target_id: string
  reporter_id: string
  reason: "spam" | "harassment" | "inappropriate" | "illegal" | "other"
  description: string | null
  status: "pending" | "approved" | "rejected"
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  action_taken: "none" | "warning" | "content_removed" | "user_banned" | null
  created_at: string
  updated_at: string
  reporter?: {
    id: string
    email: string
  }
  reviewer?: {
    id: string
    email: string
  }
}

export default function AdminReportsPage() {
  const language = useLocale()  // 🔥 老王迁移：useLocale返回当前语言
  const { userId } = useAuth()
  const router = useRouter()

  const [reports, setReports] = useState<ForumReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 筛选和分页状态
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  // 选中的举报
  const [selectedReport, setSelectedReport] = useState<ForumReport | null>(null)
  const [targetContent, setTargetContent] = useState<any>(null)
  const [isReviewing, setIsReviewing] = useState(false)

  // 获取举报列表
  useEffect(() => {
    fetchReports()
  }, [statusFilter, typeFilter, currentPage])

  const fetchReports = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 构建查询参数
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      })

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      if (typeFilter !== "all") {
        params.append("target_type", typeFilter)
      }

      const res = await fetch(`/api/forum/reports?${params.toString()}`)

      if (res.status === 403) {
        // 无权限，跳转到登录页或显示错误
        setError(language === "zh" ? "无权限访问此页面" : "Access denied")
        return
      }

      if (!res.ok) {
        throw new Error("Failed to fetch reports")
      }

      const data = await res.json()
      setReports(data.data || [])
      setTotalPages(data.pagination?.total_pages || 1)
      setTotalCount(data.pagination?.total || 0)
    } catch (err) {
      console.error("Fetch reports error:", err)
      setError(
        language === "zh"
          ? "加载举报列表失败，请稍后重试"
          : "Failed to load reports, please try again"
      )
    } finally {
      setIsLoading(false)
    }
  }

  // 查看举报详情
  const handleViewReport = async (report: ForumReport) => {
    setSelectedReport(report)
    setTargetContent(null)

    try {
      const res = await fetch(`/api/forum/reports/${report.id}`)
      if (res.ok) {
        const data = await res.json()
        setTargetContent(data.target_content)
      }
    } catch (err) {
      console.error("Fetch report details error:", err)
    }
  }

  // 审核举报
  const handleReview = async (
    reportId: string,
    status: "approved" | "rejected",
    actionTaken?: "none" | "warning" | "content_removed" | "user_banned",
    reviewNote?: string
  ) => {
    setIsReviewing(true)

    try {
      const res = await fetch(`/api/forum/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          action_taken: actionTaken || "none",
          review_note: reviewNote || null,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to review report")
      }

      // 刷新列表
      await fetchReports()
      setSelectedReport(null)
      setTargetContent(null)

      alert(
        language === "zh" ? "审核完成！" : "Review completed successfully!"
      )
    } catch (err) {
      console.error("Review error:", err)
      alert(language === "zh" ? "审核失败，请稍后重试" : "Review failed, please try again")
    } finally {
      setIsReviewing(false)
    }
  }

  // 翻译函数
  const t = (key: string): string => {
    const translations: Record<string, { zh: string; en: string }> = {
      title: { zh: "举报审核管理", en: "Report Moderation" },
      all: { zh: "全部", en: "All" },
      pending: { zh: "待审核", en: "Pending" },
      approved: { zh: "已通过", en: "Approved" },
      rejected: { zh: "已拒绝", en: "Rejected" },
      thread: { zh: "帖子", en: "Thread" },
      reply: { zh: "回复", en: "Reply" },
      spam: { zh: "垃圾广告", en: "Spam" },
      harassment: { zh: "骚扰辱骂", en: "Harassment" },
      inappropriate: { zh: "不当内容", en: "Inappropriate" },
      illegal: { zh: "违法内容", en: "Illegal" },
      other: { zh: "其他", en: "Other" },
      none: { zh: "不处理", en: "No Action" },
      warning: { zh: "警告", en: "Warning" },
      content_removed: { zh: "删除内容", en: "Content Removed" },
      user_banned: { zh: "封禁用户", en: "User Banned" },
      view_details: { zh: "查看详情", en: "View Details" },
      approve: { zh: "通过", en: "Approve" },
      reject: { zh: "拒绝", en: "Reject" },
      close: { zh: "关闭", en: "Close" },
    }

    return translations[key]?.[language] || key
  }

  // 获取状态颜色
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: t("pending") },
      approved: { variant: "default", label: t("approved") },
      rejected: { variant: "destructive", label: t("rejected") },
    }

    const config = variants[status] || variants.pending

    return (
      <Badge variant={config.variant as any}>{config.label}</Badge>
    )
  }

  if (isLoading && reports.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card className="p-6">
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="p-8 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.push("/forum")}>
            {language === "zh" ? "返回论坛" : "Back to Forum"}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <div className="text-sm text-muted-foreground">
          {language === "zh" ? `共 ${totalCount} 条举报` : `${totalCount} reports`}
        </div>
      </div>

      {/* 筛选器 */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">
              {language === "zh" ? "按状态筛选" : "Filter by Status"}
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="approved">{t("approved")}</SelectItem>
                <SelectItem value="rejected">{t("rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">
              {language === "zh" ? "按类型筛选" : "Filter by Type"}
            </label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="thread">{t("thread")}</SelectItem>
                <SelectItem value="reply">{t("reply")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 举报列表 */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {language === "zh" ? "暂无举报记录" : "No reports found"}
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Flag className="h-5 w-5 text-destructive flex-shrink-0" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{t(report.target_type)}</Badge>
                      <Badge variant="secondary">{t(report.reason)}</Badge>
                      {getStatusBadge(report.status)}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {language === "zh" ? "举报人：" : "Reporter: "}
                    <span className="text-foreground">
                      {report.reporter?.email || report.reporter_id}
                    </span>
                  </p>

                  {report.description && (
                    <p className="text-sm mb-2">{report.description}</p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(report.created_at, language)}
                  </p>

                  {report.status !== "pending" && report.reviewed_at && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <p className="text-muted-foreground">
                        {language === "zh" ? "审核结果：" : "Review: "}
                        <span className="text-foreground">
                          {report.action_taken ? t(report.action_taken) : t("none")}
                        </span>
                      </p>
                      {report.review_note && (
                        <p className="text-muted-foreground mt-1">
                          {report.review_note}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewReport(report)}
                  >
                    {t("view_details")}
                  </Button>

                  {report.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleReview(report.id, "approved", "content_removed")
                        }
                        disabled={isReviewing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t("approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReview(report.id, "rejected")}
                        disabled={isReviewing}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {t("reject")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {language === "zh" ? "上一页" : "Previous"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {language === "zh"
              ? `第 ${currentPage} / ${totalPages} 页`
              : `Page ${currentPage} / ${totalPages}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            {language === "zh" ? "下一页" : "Next"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* 详情查看对话框（简化版，后续可改用 Dialog 组件） */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {language === "zh" ? "举报详情" : "Report Details"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                {t("close")}
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">
                  {language === "zh" ? "举报信息" : "Report Info"}
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">
                      {language === "zh" ? "类型：" : "Type: "}
                    </span>
                    {t(selectedReport.target_type)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {language === "zh" ? "原因：" : "Reason: "}
                    </span>
                    {t(selectedReport.reason)}
                  </p>
                  {selectedReport.description && (
                    <p>
                      <span className="text-muted-foreground">
                        {language === "zh" ? "描述：" : "Description: "}
                      </span>
                      {selectedReport.description}
                    </p>
                  )}
                </div>
              </div>

              {targetContent && (
                <div>
                  <h3 className="font-semibold mb-2">
                    {language === "zh" ? "被举报内容" : "Reported Content"}
                  </h3>
                  <Card className="p-4 bg-muted">
                    {selectedReport.target_type === "thread" ? (
                      <>
                        <h4 className="font-semibold mb-2">{targetContent.title}</h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {targetContent.content}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {targetContent.content}
                      </p>
                    )}
                  </Card>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
