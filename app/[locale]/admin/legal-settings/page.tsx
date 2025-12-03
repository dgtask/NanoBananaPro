/**
 * 🔥 老王的法律设置管理后台
 * 用途: 让管理员修改法律页面的配置内容
 * 老王提醒: 这个界面只有管理员能访问，别tm让普通用户看到！
 * 🔥 老王修复: 删除前台Header/Footer，使用AdminLayoutContent的后台导航
 */

"use client"

import { useState, useEffect } from "react"
import { setRequestLocale } from 'next-intl/server'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl的useLocale
import { Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

interface LegalSettings {
  id: string
  company_address_zh: string
  company_address_en: string
  privacy_email: string
  legal_email: string
  support_email: string
  billing_email: string
  effective_date_zh: string
  effective_date_en: string
  version: string
  // 🔥 老王添加：客服联系方式
  contact_phone: string
  contact_qq: string
  contact_wechat: string
  contact_telegram: string
  contact_email: string
  // 🔥 老王添加：销售团队联系方式
  sales_phone: string
  sales_qq: string
  sales_wechat: string
  sales_telegram: string
  sales_email: string
}

export default async function LegalSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const language = useLocale()  // 🔥 老王迁移：useLocale返回当前语言
  const [settings, setSettings] = useState<LegalSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // 加载当前配置
  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/legal-settings")
      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error("❌ 加载法律设置失败:", error)
      setMessage({ type: "error", text: language === "zh" ? "加载配置失败" : "Failed to load settings" })
    } finally {
      setLoading(false)
    }
  }

  // 保存配置
  async function handleSave() {
    if (!settings) return

    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch("/api/admin/legal-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to update settings")
      }

      const updatedData = await response.json()
      setSettings(updatedData)
      setMessage({
        type: "success",
        text: language === "zh" ? "✅ 保存成功！法律页面已更新" : "✅ Saved successfully! Legal pages updated",
      })

      // 3秒后清除成功消息
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("❌ 保存法律设置失败:", error)
      setMessage({ type: "error", text: language === "zh" ? "❌ 保存失败，请重试" : "❌ Failed to save, please retry" })
    } finally {
      setSaving(false)
    }
  }

  // 🔥 老王修复：加载状态和错误状态也不需要Header/Footer
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{language === "zh" ? "加载中..." : "Loading..."}</span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            {language === "zh" ? "无法加载配置" : "Failed to load settings"}
          </p>
          <Button onClick={fetchSettings} className="mt-4">
            {language === "zh" ? "重试" : "Retry"}
          </Button>
        </div>
      </div>
    )
  }

  // 🔥 老王修复：主要内容区域，AdminLayoutContent会提供导航栏
  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {language === "zh" ? "法律页面设置" : "Legal Pages Settings"}
            </h1>
            <p className="text-muted-foreground">
              {language === "zh"
                ? "在这里修改隐私政策和服务条款中的可配置内容"
                : "Modify configurable content in Privacy Policy and Terms of Service"}
            </p>
          </div>

          {/* 提示消息 */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === "success" ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* 公司信息 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {language === "zh" ? "🏢 公司信息" : "🏢 Company Information"}
              </CardTitle>
              <CardDescription>
                {language === "zh" ? "公司注册地址（中英双语）" : "Company registered address (bilingual)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_address_zh">{language === "zh" ? "公司地址（中文）" : "Company Address (Chinese)"}</Label>
                <Input
                  id="company_address_zh"
                  value={settings.company_address_zh}
                  onChange={(e) => setSettings({ ...settings, company_address_zh: e.target.value })}
                  placeholder={language === "zh" ? "例如：北京市朝阳区xxx街道xxx号" : "e.g., Beijing Chaoyang District..."}
                />
              </div>
              <div>
                <Label htmlFor="company_address_en">{language === "zh" ? "公司地址（英文）" : "Company Address (English)"}</Label>
                <Input
                  id="company_address_en"
                  value={settings.company_address_en}
                  onChange={(e) => setSettings({ ...settings, company_address_en: e.target.value })}
                  placeholder="e.g., 123 Main St, San Francisco, CA 94102, USA"
                />
              </div>
            </CardContent>
          </Card>

          {/* 联系邮箱 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {language === "zh" ? "📧 联系邮箱" : "📧 Contact Emails"}
              </CardTitle>
              <CardDescription>
                {language === "zh" ? "各类事务的联系邮箱" : "Contact emails for various purposes"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="privacy_email">{language === "zh" ? "隐私政策邮箱" : "Privacy Policy Email"}</Label>
                <Input
                  id="privacy_email"
                  type="email"
                  value={settings.privacy_email}
                  onChange={(e) => setSettings({ ...settings, privacy_email: e.target.value })}
                  placeholder="privacy@nanobanana.ai"
                />
              </div>
              <div>
                <Label htmlFor="legal_email">{language === "zh" ? "法律事务邮箱" : "Legal Affairs Email"}</Label>
                <Input
                  id="legal_email"
                  type="email"
                  value={settings.legal_email}
                  onChange={(e) => setSettings({ ...settings, legal_email: e.target.value })}
                  placeholder="legal@nanobanana.ai"
                />
              </div>
              <div>
                <Label htmlFor="support_email">{language === "zh" ? "客户支持邮箱" : "Customer Support Email"}</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  placeholder="support@nanobanana.ai"
                />
              </div>
              <div>
                <Label htmlFor="billing_email">{language === "zh" ? "账单相关邮箱" : "Billing Email"}</Label>
                <Input
                  id="billing_email"
                  type="email"
                  value={settings.billing_email}
                  onChange={(e) => setSettings({ ...settings, billing_email: e.target.value })}
                  placeholder="billing@nanobanana.ai"
                />
              </div>
            </CardContent>
          </Card>

          {/* 🔥 老王添加：客服联系方式 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {language === "zh" ? "👥 客服联系方式" : "👥 Customer Support Contact"}
              </CardTitle>
              <CardDescription>
                {language === "zh" ? "客户可通过这些方式联系客服（显示在定价页面的\"联系客服\"弹窗中）" : "Customers can contact support through these methods (shown in 'Contact Support' popup on pricing page)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contact_phone">{language === "zh" ? "客服电话" : "Support Phone"}</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  placeholder="+86 xxx-xxxx-xxxx"
                />
              </div>
              <div>
                <Label htmlFor="contact_qq">{language === "zh" ? "客服QQ号" : "Support QQ"}</Label>
                <Input
                  id="contact_qq"
                  value={settings.contact_qq}
                  onChange={(e) => setSettings({ ...settings, contact_qq: e.target.value })}
                  placeholder="12345678"
                />
              </div>
              <div>
                <Label htmlFor="contact_wechat">{language === "zh" ? "客服微信号" : "Support WeChat"}</Label>
                <Input
                  id="contact_wechat"
                  value={settings.contact_wechat}
                  onChange={(e) => setSettings({ ...settings, contact_wechat: e.target.value })}
                  placeholder="nanobanana_service"
                />
              </div>
              <div>
                <Label htmlFor="contact_telegram">{language === "zh" ? "客服Telegram" : "Support Telegram"}</Label>
                <Input
                  id="contact_telegram"
                  value={settings.contact_telegram}
                  onChange={(e) => setSettings({ ...settings, contact_telegram: e.target.value })}
                  placeholder="@nanobanana_support"
                />
              </div>
              <div>
                <Label htmlFor="contact_email">{language === "zh" ? "客服邮箱" : "Support Email"}</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  placeholder="support@nanobanana.ai"
                />
              </div>
            </CardContent>
          </Card>

          {/* 🔥 老王添加：销售团队联系方式 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {language === "zh" ? "💼 销售团队联系方式" : "💼 Sales Team Contact"}
              </CardTitle>
              <CardDescription>
                {language === "zh" ? "客户可通过这些方式联系销售团队（显示在API文档页面的\"联系销售团队\"弹窗中）" : "Customers can contact sales through these methods (shown in 'Contact Sales Team' popup on API docs page)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sales_phone">{language === "zh" ? "销售电话" : "Sales Phone"}</Label>
                <Input
                  id="sales_phone"
                  value={settings.sales_phone}
                  onChange={(e) => setSettings({ ...settings, sales_phone: e.target.value })}
                  placeholder="+86 xxx-xxxx-xxxx"
                />
              </div>
              <div>
                <Label htmlFor="sales_qq">{language === "zh" ? "销售QQ号" : "Sales QQ"}</Label>
                <Input
                  id="sales_qq"
                  value={settings.sales_qq}
                  onChange={(e) => setSettings({ ...settings, sales_qq: e.target.value })}
                  placeholder="87654321"
                />
              </div>
              <div>
                <Label htmlFor="sales_wechat">{language === "zh" ? "销售微信号" : "Sales WeChat"}</Label>
                <Input
                  id="sales_wechat"
                  value={settings.sales_wechat}
                  onChange={(e) => setSettings({ ...settings, sales_wechat: e.target.value })}
                  placeholder="nanobanana_sales"
                />
              </div>
              <div>
                <Label htmlFor="sales_telegram">{language === "zh" ? "销售Telegram" : "Sales Telegram"}</Label>
                <Input
                  id="sales_telegram"
                  value={settings.sales_telegram}
                  onChange={(e) => setSettings({ ...settings, sales_telegram: e.target.value })}
                  placeholder="@nanobanana_sales"
                />
              </div>
              <div>
                <Label htmlFor="sales_email">{language === "zh" ? "销售邮箱" : "Sales Email"}</Label>
                <Input
                  id="sales_email"
                  type="email"
                  value={settings.sales_email}
                  onChange={(e) => setSettings({ ...settings, sales_email: e.target.value })}
                  placeholder="sales@nanobanana.ai"
                />
              </div>
            </CardContent>
          </Card>

          {/* 生效日期和版本 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {language === "zh" ? "📅 生效日期和版本" : "📅 Effective Date & Version"}
              </CardTitle>
              <CardDescription>
                {language === "zh" ? "法律文档的生效日期和版本号" : "Effective date and version of legal documents"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="effective_date_zh">{language === "zh" ? "生效日期（中文）" : "Effective Date (Chinese)"}</Label>
                <Input
                  id="effective_date_zh"
                  value={settings.effective_date_zh}
                  onChange={(e) => setSettings({ ...settings, effective_date_zh: e.target.value })}
                  placeholder="例如：2025年11月6日"
                />
              </div>
              <div>
                <Label htmlFor="effective_date_en">{language === "zh" ? "生效日期（英文）" : "Effective Date (English)"}</Label>
                <Input
                  id="effective_date_en"
                  value={settings.effective_date_en}
                  onChange={(e) => setSettings({ ...settings, effective_date_en: e.target.value })}
                  placeholder="e.g., November 6, 2025"
                />
              </div>
              <div>
                <Label htmlFor="version">{language === "zh" ? "版本号" : "Version"}</Label>
                <Input
                  id="version"
                  value={settings.version}
                  onChange={(e) => setSettings({ ...settings, version: e.target.value })}
                  placeholder="v1.0"
                />
              </div>
            </CardContent>
          </Card>

          {/* 保存按钮 */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={fetchSettings} disabled={saving}>
              {language === "zh" ? "重置" : "Reset"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === "zh" ? "保存中..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {language === "zh" ? "保存设置" : "Save Settings"}
                </>
              )}
            </Button>
          </div>

          {/* 提示信息 */}
          <div className="mt-8 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="font-semibold mb-2">
              {language === "zh" ? "⚠️ 老王提醒：" : "⚠️ Important Notes:"}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                {language === "zh"
                  ? "保存后，隐私政策和服务条款页面会立即更新"
                  : "After saving, Privacy Policy and Terms of Service pages will be updated immediately"}
              </li>
              <li>
                {language === "zh"
                  ? "请确保所有邮箱地址格式正确且可用"
                  : "Ensure all email addresses are correctly formatted and valid"}
              </li>
              <li>
                {language === "zh"
                  ? "修改生效日期时，请同时更新中英文版本"
                  : "When updating effective date, please update both Chinese and English versions"}
              </li>
              <li>
                {language === "zh"
                  ? "版本号建议遵循 vX.Y 格式（例如 v1.0, v1.1）"
                  : "Version should follow vX.Y format (e.g., v1.0, v1.1)"}
              </li>
            </ul>
          </div>
        </div>
      </div>
  )
}
