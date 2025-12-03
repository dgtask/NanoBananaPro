/**
 * 🔥 老王的隐私政策页面
 * 用途: GDPR合规，告知用户数据处理方式
 * 老王提醒: 别tm乱收集用户数据，合规是底线！
 * 最新改进: 从数据库读取配置内容，管理员可在后台修改
 */

"use client"

import { useState, useEffect } from "react"
import { setRequestLocale } from 'next-intl/server'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useLocale } from 'next-intl'  // 🔥 老王迁移：使用next-intl的useLocale

interface LegalSettings {
  company_address_zh: string
  company_address_en: string
  privacy_email: string
  effective_date_zh: string
  effective_date_en: string
  version: string
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const language = useLocale()  // 🔥 老王迁移：useLocale返回当前语言
  const [settings, setSettings] = useState<LegalSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载法律设置
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/legal-settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("❌ 加载法律设置失败:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">
            {language === "zh" ? "隐私政策" : "Privacy Policy"}
          </h1>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {language === "zh" ? (
              <>
                <p className="text-muted-foreground mb-6">
                  <strong>生效日期：</strong>{settings?.effective_date_zh || "加载中..."}
                </p>
                <p className="mb-6">
                  欢迎使用 Nano Banana！我们非常重视您的隐私，并承诺保护您的个人信息。本隐私政策说明了我们如何收集、使用、存储和保护您的数据。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">1. 信息收集</h2>
                <p className="mb-4">我们收集以下类型的信息：</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>账户信息</strong>：邮箱地址、用户名、密码（加密存储）</li>
                  <li><strong>使用数据</strong>：生成的图片、编辑历史、API调用记录</li>
                  <li><strong>支付信息</strong>：通过Creem.io处理，我们不直接存储您的支付卡信息</li>
                  <li><strong>技术信息</strong>：IP地址、浏览器类型、设备信息、Cookies</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">2. 信息使用</h2>
                <p className="mb-4">我们使用收集的信息用于：</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>提供和改进AI图像编辑服务</li>
                  <li>处理您的订阅和支付</li>
                  <li>发送服务更新和重要通知</li>
                  <li>分析服务使用情况以优化性能</li>
                  <li>防止欺诈和滥用行为</li>
                  <li>遵守法律法规要求</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">3. 数据共享</h2>
                <p className="mb-4">
                  我们<strong>不会出售</strong>您的个人信息。我们仅在以下情况下共享数据：
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>服务提供商</strong>：Google AI API（图像处理）、Supabase（认证和数据库）、Creem.io（支付处理）</li>
                  <li><strong>法律要求</strong>：响应法院传票或合法的政府请求</li>
                  <li><strong>业务转让</strong>：在合并、收购或资产出售的情况下</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">4. 数据安全</h2>
                <p className="mb-6">
                  我们采取行业标准的安全措施保护您的数据：
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>密码使用bcrypt加密存储</li>
                  <li>HTTPS加密传输所有数据</li>
                  <li>定期安全审计和漏洞扫描</li>
                  <li>限制员工访问权限（最小权限原则）</li>
                  <li>数据备份和灾难恢复机制</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cookies和跟踪技术</h2>
                <p className="mb-4">我们使用Cookies来：</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>保持您的登录状态</li>
                  <li>记住您的语言偏好</li>
                  <li>分析网站流量（通过Vercel Analytics）</li>
                </ul>
                <p className="mb-6">
                  您可以通过浏览器设置管理Cookies，但禁用可能影响部分功能。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">6. 您的权利（GDPR & CCPA）</h2>
                <p className="mb-4">您有以下权利：</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>访问权</strong>：请求查看我们持有的您的数据</li>
                  <li><strong>更正权</strong>：更新不准确的个人信息</li>
                  <li><strong>删除权</strong>：要求删除您的账户和数据</li>
                  <li><strong>限制处理权</strong>：限制我们如何使用您的数据</li>
                  <li><strong>数据可携权</strong>：以机器可读格式导出您的数据</li>
                  <li><strong>反对权</strong>：反对基于合法利益的数据处理</li>
                </ul>
                <p className="mb-6">
                  要行使这些权利，请发送邮件至：<a href={`mailto:${settings?.privacy_email || "privacy@nanobanana.ai"}`} className="text-primary hover:underline">{settings?.privacy_email || "privacy@nanobanana.ai"}</a>
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">7. 数据保留</h2>
                <p className="mb-6">
                  我们保留您的数据直到：
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>您删除账户（我们将在30天内删除所有数据）</li>
                  <li>账户闲置超过2年（我们将发送通知后删除）</li>
                  <li>完成特定的法律或财务义务</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">8. 儿童隐私</h2>
                <p className="mb-6">
                  Nano Banana不适用于13岁以下儿童。我们不会故意收集儿童的个人信息。如果您发现我们收集了儿童数据，请立即联系我们。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">9. 国际数据传输</h2>
                <p className="mb-6">
                  您的数据可能被传输到您所在国家/地区以外的服务器。我们确保通过标准合同条款（SCC）或其他合法机制保护这些传输。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">10. 政策更新</h2>
                <p className="mb-6">
                  我们可能会不时更新本隐私政策。重大变更时，我们将通过邮件或网站公告通知您。继续使用服务即表示接受更新后的政策。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">11. 联系我们</h2>
                <p className="mb-4">
                  如有隐私相关问题，请联系：
                </p>
                <ul className="list-none mb-6 space-y-1">
                  <li><strong>邮箱：</strong><a href={`mailto:${settings?.privacy_email || "privacy@nanobanana.ai"}`} className="text-primary hover:underline">{settings?.privacy_email || "privacy@nanobanana.ai"}</a></li>
                  <li><strong>地址：</strong>{settings?.company_address_zh || "加载中..."}</li>
                </ul>

                <div className="mt-12 p-6 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>最后更新：</strong>{settings?.effective_date_zh || "加载中..."} <br />
                    <strong>版本：</strong>{settings?.version || "v1.0"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-6">
                  <strong>Effective Date:</strong> {settings?.effective_date_en || "Loading..."}
                </p>
                <p className="mb-6">
                  Welcome to Nano Banana! We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
                <p className="mb-4">We collect the following types of information:</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>Account Information</strong>: Email address, username, password (encrypted)</li>
                  <li><strong>Usage Data</strong>: Generated images, editing history, API call records</li>
                  <li><strong>Payment Information</strong>: Processed through Creem.io, we do not directly store your payment card details</li>
                  <li><strong>Technical Information</strong>: IP address, browser type, device information, Cookies</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
                <p className="mb-4">We use the collected information to:</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Provide and improve our AI image editing services</li>
                  <li>Process your subscriptions and payments</li>
                  <li>Send service updates and important notifications</li>
                  <li>Analyze usage to optimize performance</li>
                  <li>Prevent fraud and abuse</li>
                  <li>Comply with legal obligations</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Sharing</h2>
                <p className="mb-4">
                  We <strong>do not sell</strong> your personal information. We only share data in the following circumstances:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>Service Providers</strong>: Google AI API (image processing), Supabase (auth & database), Creem.io (payment processing)</li>
                  <li><strong>Legal Requirements</strong>: In response to court orders or lawful government requests</li>
                  <li><strong>Business Transfers</strong>: In the event of a merger, acquisition, or asset sale</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
                <p className="mb-6">
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Passwords encrypted with bcrypt</li>
                  <li>HTTPS encryption for all data transmission</li>
                  <li>Regular security audits and vulnerability scans</li>
                  <li>Limited employee access (principle of least privilege)</li>
                  <li>Data backup and disaster recovery mechanisms</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cookies and Tracking Technologies</h2>
                <p className="mb-4">We use Cookies to:</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Keep you logged in</li>
                  <li>Remember your language preference</li>
                  <li>Analyze website traffic (via Vercel Analytics)</li>
                </ul>
                <p className="mb-6">
                  You can manage Cookies through your browser settings, but disabling them may affect some functionality.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights (GDPR & CCPA)</h2>
                <p className="mb-4">You have the following rights:</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>Access</strong>: Request to see the data we hold about you</li>
                  <li><strong>Rectification</strong>: Update inaccurate personal information</li>
                  <li><strong>Erasure</strong>: Request deletion of your account and data</li>
                  <li><strong>Restriction</strong>: Limit how we use your data</li>
                  <li><strong>Data Portability</strong>: Export your data in a machine-readable format</li>
                  <li><strong>Object</strong>: Object to data processing based on legitimate interests</li>
                </ul>
                <p className="mb-6">
                  To exercise these rights, email us at: <a href={`mailto:${settings?.privacy_email || "privacy@nanobanana.ai"}`} className="text-primary hover:underline">{settings?.privacy_email || "privacy@nanobanana.ai"}</a>
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Retention</h2>
                <p className="mb-6">
                  We retain your data until:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>You delete your account (we'll delete all data within 30 days)</li>
                  <li>Your account is inactive for over 2 years (we'll notify you before deletion)</li>
                  <li>We complete specific legal or financial obligations</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
                <p className="mb-6">
                  Nano Banana is not intended for children under 13. We do not knowingly collect personal information from children. If you believe we've collected data from a child, please contact us immediately.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">9. International Data Transfers</h2>
                <p className="mb-6">
                  Your data may be transferred to servers outside your country/region. We ensure these transfers are protected through Standard Contractual Clauses (SCC) or other lawful mechanisms.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">10. Policy Updates</h2>
                <p className="mb-6">
                  We may update this Privacy Policy from time to time. For significant changes, we'll notify you via email or website announcement. Continued use of the service constitutes acceptance of the updated policy.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Us</h2>
                <p className="mb-4">
                  For privacy-related questions, please contact:
                </p>
                <ul className="list-none mb-6 space-y-1">
                  <li><strong>Email:</strong> <a href={`mailto:${settings?.privacy_email || "privacy@nanobanana.ai"}`} className="text-primary hover:underline">{settings?.privacy_email || "privacy@nanobanana.ai"}</a></li>
                  <li><strong>Address:</strong> {settings?.company_address_en || "Loading..."}</li>
                </ul>

                <div className="mt-12 p-6 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Last Updated:</strong> {settings?.effective_date_en || "Loading..."} <br />
                    <strong>Version:</strong> {settings?.version || "v1.0"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
