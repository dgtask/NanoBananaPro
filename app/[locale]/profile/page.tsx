"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from 'next-intl'  // 🔥 老王迁移：使用next-intl
import { Header } from "@/components/header"
import { useTheme } from "@/lib/theme-context"
import Link from "next/link"
import {
  User as UserIcon,
  CreditCard,
  Key,
  Copy,
  RefreshCw,
  Check,
  X,
  Calendar,
  TrendingUp,
  Download,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Clock,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Image as ImageIcon,
  Trash2,
  Power
} from "lucide-react"
import { ProfileHistorySection } from "@/components/history/profile-history-section"
import { ProfileInfoSection } from "@/components/profile/profile-info-section"
import { UsageStatsSection } from "@/components/profile/usage-stats-section"
import { ProfileSubmissionsSection } from "@/components/profile/profile-submissions-section"
import { SubscriptionManagementSection } from "@/components/profile/subscription-management-section"
import { SubscriptionManagementSectionV2 } from "@/components/profile/subscription-management-section-v2"
import { useProfileData, ApiKeyData } from "@/hooks/use-profile-data"
import { getTransactionDescription } from "@/lib/credit-transaction-i18n"  // 🔥 老王新增：积分交易国际化解析器

export default function ProfilePage() {
  const t = useTranslations('profile')  // 🔥 老王迁移：使用profile命名空间
  const { theme } = useTheme()
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [rotatingKeyId, setRotatingKeyId] = useState<string | null>(null)
  const [togglingKeyId, setTogglingKeyId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newApiKeyName, setNewApiKeyName] = useState("")
  const [creatingKey, setCreatingKey] = useState(false)

  const {
    loading,
    user,
    subscription,
    subscriptions,  // 🔥 老王新增：所有订阅列表
    credits,
    apiKeys,
    stats,
    filterType,
    currentPage,
    loadingMore,
    handleFilterChange,
    handleLoadMore,
    createApiKey,
    deleteApiKey,
    toggleApiKeyStatus,
    rotateApiKey
  } = useProfileData()

  const mainBg = theme === "light" ? "bg-[#FFFEF5]" : "bg-[#0A0F1C]"
  const cardBg = theme === "light" ? "bg-[#FFFFFF]" : "bg-[#0F1728]"
  const textColor = theme === "light" ? "text-[#1E293B]" : "text-white"

  const handleCopyApiKey = (key?: string) => {
    if (!key) {
      console.warn('⚠️ 当前密钥仅在创建时可复制，请重新生成')
      return
    }
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateApiKey = async () => {
    const sanitizedName = newApiKeyName.trim() || `API Key ${apiKeys.length + 1}`
    setCreatingKey(true)
    const newKey = await createApiKey(sanitizedName)
    setCreatingKey(false)
    if (newKey?.secret) {
      setShowApiKey(newKey.id)
      setCreateDialogOpen(false)
      setNewApiKeyName("")
      setCopied(false)
    }
  }

  const handleDeleteApiKey = async (id: string) => {
    const success = await deleteApiKey(id)
    if (success && showApiKey === id) {
      setShowApiKey(null)
    }
    setCopied(false)
  }

  const handleToggleApiKeyStatus = async (key: ApiKeyData) => {
    const nextStatus = key.status === 'active' ? 'inactive' : 'active'
    setTogglingKeyId(key.id)
    const success = await toggleApiKeyStatus(key.id, nextStatus)
    setTogglingKeyId(null)
    if (success && nextStatus === 'inactive' && showApiKey === key.id) {
      setShowApiKey(null)
    }
  }

  const handleRotateApiKey = async (id: string) => {
    setRotatingKeyId(id)
    const rotated = await rotateApiKey(id)
    setRotatingKeyId(null)
    setCopied(false)
    if (rotated?.secret) {
      setShowApiKey(id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPlanName = (plan: string) => {
    const planNames: Record<string, string> = {
      basic: t("plan.basic"),
      pro: t("plan.pro"),
      max: t("plan.max")
    }
    return planNames[plan] || plan
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      expired: "bg-red-100 text-red-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${mainBg} pt-16`}>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">{t("loading")}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${mainBg} pt-16`}>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className={`text-2xl font-bold ${textColor} mb-4`}>{t("pleaseLogin")}</h1>
            <p className="text-muted-foreground">{t("needLoginMessage")}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${mainBg} pt-16`}>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 🔥 老王优化：Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${textColor} mb-2`}>{t("pageTitle")}</h1>
          <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className={`grid w-full grid-cols-6 ${cardBg} border`}>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              {t("tabs.profile")}
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {t("tabs.subscription")}
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {t("tabs.credits")}
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              {t("tabs.submissions")}
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {t("tabs.stats")}
            </TabsTrigger>
            <TabsTrigger value="apiKeys" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              {t("tabs.apiKeys")}
            </TabsTrigger>
          </TabsList>

          {/* 🔥 老王新增：个人资料 Tab */}
          <TabsContent value="profile">
            <ProfileInfoSection
              user={user}
              credits={credits ? {
                currentCredits: credits.currentCredits,
                totalEarned: credits.totalEarned,
                totalUsed: credits.totalUsed
              } : undefined}
              stats={stats || undefined}
            />
          </TabsContent>

          {/* 🔥 老王重构：订阅管理 Tab - 使用V2组件显示所有订阅 */}
          <TabsContent value="subscription">
            <SubscriptionManagementSectionV2
              subscriptions={subscriptions}
              loading={loading}
            />
          </TabsContent>

          {/* Credits Tab - 🔥 老王重构版 */}
          <TabsContent value="credits">
            <div className="space-y-6">
              {/* 🔥 过期提醒警告框 */}
              {credits?.expiringSoon && credits.expiringSoon.credits > 0 && (
                <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          {t("credits.expiringWarning")}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          {t("credits.expiringMessage").replace('{credits}', credits.expiringSoon.credits.toString())}
                        </p>
                        {credits.expiringSoon.items && credits.expiringSoon.items.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {credits.expiringSoon.items.map((item, index) => (
                              <div key={item.date ?? `unknown-${index}`} className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                                <span>
                                  {item.date ? t("credits.expiresOn").replace('{date}', formatDateOnly(item.date)) : t("credits.expiryTBD")}
                                </span>
                                <span className="font-semibold">{item.credits} {t("credits.unit")}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
                {/* 🔥 老王优化：左侧积分概览占1/3，右侧交易记录占2/3 */}
                <Card className={`${cardBg} border`}>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Zap className="w-6 h-6 text-[#F5A623]" />
                      <h2 className={`text-xl font-semibold ${textColor}`}>{t("credits.overview")}</h2>
                    </div>

                    {credits ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-[#F5A623] mb-2">
                            {credits.currentCredits}
                          </div>
                          <p className="text-sm text-muted-foreground">{t("credits.current")}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="text-center">
                            <div className={`text-2xl font-semibold text-green-600 mb-1`}>
                              {credits.totalEarned}
                            </div>
                            <p className="text-sm text-muted-foreground">{t("credits.totalEarned")}</p>
                          </div>
                          <div className="text-center">
                            <div className={`text-2xl font-semibold text-orange-600 mb-1`}>
                              {credits.totalUsed}
                            </div>
                            <p className="text-sm text-muted-foreground">{t("credits.totalUsed")}</p>
                          </div>
                        </div>

                        {/* 🔥 老王新增：积分过期时间列表 */}
                        {credits.allExpiry && credits.allExpiry.items && credits.allExpiry.items.length > 0 && (
                          <div className="pt-4 border-t">
                            <h3 className={`text-sm font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                              <Clock className="w-4 h-4" />
                              {t("credits.expiryTime")}
                            </h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {credits.allExpiry.items.map((item, index) => (
                                <div key={item.date ?? `permanent-${index}`} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {item.date ? formatDateOnly(item.date) : t("credits.permanent")}
                                  </span>
                                  <span className={`font-semibold ${textColor}`}>
                                    {item.credits} {t("credits.unit")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="w-4 h-4" />
                            <span>{t("credits.costInfo")}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">{t("credits.loadingInfo")}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* 右侧：交易记录 */}
                <Card className={`${cardBg} border`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-xl font-semibold ${textColor}`}>{t("credits.transactionHistory")}</h2>
                      <div className="flex items-center gap-2">
                        {credits?.pagination && (
                          <span className="text-xs text-muted-foreground">
                            {t("credits.totalRecords").replace('{count}', credits.pagination.totalCount.toString())}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 🔥 筛选按钮组 */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={filterType === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('all')}
                        className={filterType === 'all' ? 'bg-[#F5A623] hover:bg-[#F5A623]/90' : ''}
                      >
                        <Filter className="w-3 h-3 mr-1" />
                        {t("credits.filterAll")}
                      </Button>
                      <Button
                        variant={filterType === 'earned' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('earned')}
                        className={filterType === 'earned' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {t("credits.filterEarned")}
                      </Button>
                      <Button
                        variant={filterType === 'used' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('used')}
                        className={filterType === 'used' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        {t("credits.filterUsed")}
                      </Button>
                    </div>

                    {credits?.transactions && credits.transactions.length > 0 ? (
                      <>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {(credits?.transactions || []).map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  transaction.type === 'earned'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                  {transaction.type === 'earned' ? '+' : '-'}
                                </div>
                                <div>
                                  <p className={`font-medium ${textColor} text-sm`}>
                                    {getTransactionDescription(transaction as any, t)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(transaction.timestamp)}
                                  </p>
                                </div>
                              </div>
                              <span className={`font-semibold ${
                                transaction.type === 'earned'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* 🔥 加载更多按钮 */}
                        {credits.pagination?.hasMore && (
                          <div className="mt-4 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleLoadMore}
                              disabled={loadingMore}
                              className="w-full"
                            >
                              {loadingMore ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  {t("credits.loadingMore")}
                                </>
                              ) : (
                                <>
                                  {t("credits.loadMore").replace('{current}', credits.pagination.currentPage.toString()).replace('{total}', credits.pagination.totalPages.toString())}
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">{t("credits.noTransactions")}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="apiKeys">
            <Card className={`${cardBg} border`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Key className="w-6 h-6 text-[#F5A623]" />
                    <h2 className={`text-xl font-semibold ${textColor}`}>{t("apiKeys.title")}</h2>
                  </div>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-white"
                  >
                    {t("apiKeys.createNew")}
                  </Button>
                </div>

                <div className="space-y-4">
                  {apiKeys.length > 0 ? (
                    apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className={`font-semibold ${textColor}`}>
                                {apiKey.name}
                              </h3>
                              <Badge className={getStatusBadge(apiKey.status)}>
                                {apiKey.status === 'active' ? t("apiKeys.active") : t("apiKeys.inactive")}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-muted-foreground" />
                                <div className="flex items-center gap-2 flex-1">
                                  <span className={`font-mono text-sm ${textColor}`}>
                                    {showApiKey === apiKey.id && apiKey.secret
                                      ? apiKey.secret
                                      : apiKey.maskedKey}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => apiKey.secret && setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                                    disabled={!apiKey.secret}
                                  >
                                    {showApiKey === apiKey.id ?
                                      <EyeOff className="w-4 h-4" /> :
                                      <Eye className="w-4 h-4" />
                                    }
                                  </Button>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyApiKey(apiKey.secret)}
                                  className="text-green-600 hover:text-green-700"
                                  disabled={!apiKey.secret}
                                >
                                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </div>
                              {!apiKey.secret && (
                                <p className="text-xs text-muted-foreground">
                                  {t("apiKeys.securityNote")}
                                </p>
                              )}
                              <div className="text-sm text-muted-foreground">
                                {t("apiKeys.createdAt").replace('{date}', formatDate(apiKey.createdAt))}
                                {apiKey.lastUsed && (
                                  <span className="ml-4">
                                    {t("apiKeys.lastUsed").replace('{date}', formatDate(apiKey.lastUsed))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRotateApiKey(apiKey.id)}
                              disabled={rotatingKeyId === apiKey.id}
                            >
                              <RefreshCw className={`w-4 h-4 mr-2 ${rotatingKeyId === apiKey.id ? 'animate-spin' : ''}`} />
                              {rotatingKeyId === apiKey.id ? t("apiKeys.rotating") : t("apiKeys.rotate")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleApiKeyStatus(apiKey)}
                              disabled={togglingKeyId === apiKey.id}
                              className={`border ${apiKey.status === 'active'
                                ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50'
                                : 'border-green-500 text-green-600 hover:bg-green-50'}`}
                            >
                              <Power className="w-4 h-4 mr-2" />
                              {togglingKeyId === apiKey.id
                                ? t("apiKeys.updating")
                                : apiKey.status === 'active'
                                  ? t("apiKeys.pause")
                                  : t("apiKeys.enable")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteApiKey(apiKey.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Key className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className={`text-lg font-semibold ${textColor} mb-2`}>{t("apiKeys.noKeys")}</h3>
                      <p className="text-muted-foreground mb-6">{t("apiKeys.noKeysMessage")}</p>
                    </div>
                  )}
                </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {t("apiKeys.securityTip")}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {t("apiKeys.securityMessage")}
                    </p>
                  </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 🔥 老王新增：我的推荐 Tab */}
          <TabsContent value="submissions">
            <ProfileSubmissionsSection theme={theme} />
          </TabsContent>

          {/* 🔥 老王新增：使用统计 Tab */}
          <TabsContent value="stats">
            <UsageStatsSection />
          </TabsContent>
        </Tabs>

        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open)
            if (!open) {
              setNewApiKeyName("")
              setCreatingKey(false)
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("apiKeys.dialog.title")}</DialogTitle>
              <DialogDescription>
                {t("apiKeys.dialog.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="api-key-name">{t("apiKeys.dialog.nameLabel")}</Label>
                <Input
                  id="api-key-name"
                  placeholder={t("apiKeys.dialog.namePlaceholder").replace('{number}', (apiKeys.length + 1).toString())}
                  value={newApiKeyName}
                  onChange={(event) => setNewApiKeyName(event.target.value)}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{t("apiKeys.dialog.nameHint")}</p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={creatingKey}
              >
                {t("apiKeys.dialog.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleCreateApiKey}
                disabled={creatingKey}
              >
                {creatingKey ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t("apiKeys.dialog.creating")}
                  </>
                ) : (
                  t("apiKeys.dialog.create")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
