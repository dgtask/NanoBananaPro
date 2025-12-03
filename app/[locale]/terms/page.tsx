/**
 * 🔥 老王的服务条款页面
 * 用途: 法律合规，明确用户和平台的权利义务
 * 老王提醒: 别tm随便抄别人的ToS，要根据实际业务调整！
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
  legal_email: string
  support_email: string
  billing_email: string
  effective_date_zh: string
  effective_date_en: string
  version: string
}

export default async function TermsPage({
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
            {language === "zh" ? "服务条款" : "Terms of Service"}
          </h1>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {language === "zh" ? (
              <>
                <p className="text-muted-foreground mb-6">
                  <strong>生效日期：</strong>{settings?.effective_date_zh || "加载中..."}
                </p>
                <p className="mb-6">
                  欢迎使用 Nano Banana！在使用我们的服务之前，请仔细阅读以下服务条款。使用本服务即表示您同意接受这些条款的约束。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">1. 条款接受</h2>
                <p className="mb-6">
                  通过访问或使用 Nano Banana 的网站、应用程序或服务（统称"服务"），您同意受本服务条款的约束。如果您不同意这些条款，请不要使用我们的服务。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">2. 服务描述</h2>
                <p className="mb-4">Nano Banana 提供以下服务：</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>基于AI的图像编辑工具（背景移除、场景保留、角色一致性等）</li>
                  <li>自然语言图像编辑功能</li>
                  <li>图像生成与创作工具</li>
                  <li>API接口服务（付费订阅）</li>
                </ul>
                <p className="mb-6">
                  我们保留随时修改、暂停或终止部分或全部服务的权利，恕不另行通知。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">3. 用户账户</h2>
                <p className="mb-4">要使用某些功能，您需要创建账户：</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>注册信息准确性：</strong>您必须提供准确、完整的信息，并及时更新</li>
                  <li><strong>账户安全：</strong>您对账户的所有活动负责，请妥善保管密码</li>
                  <li><strong>账户共享：</strong>禁止共享账户或允许他人使用您的账户</li>
                  <li><strong>年龄限制：</strong>您必须年满13岁才能使用我们的服务</li>
                </ul>
                <p className="mb-6">
                  如发现未经授权使用您的账户，请立即通知我们：<a href={`mailto:${settings?.support_email || "support@nanobanana.ai"}`} className="text-primary hover:underline">{settings?.support_email || "support@nanobanana.ai"}</a>
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">4. 订阅与计费</h2>
                <p className="mb-4"><strong>订阅计划：</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>免费计划：</strong>基础功能，每月50次编辑额度</li>
                  <li><strong>Basic计划：</strong>$9.9/月或$99/年，500次/月</li>
                  <li><strong>Pro计划：</strong>$29.9/月或$299/年，无限次数</li>
                  <li><strong>Max计划：</strong>$99.9/月或$999/年，企业级支持</li>
                </ul>
                <p className="mb-4"><strong>计费规则：</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>订阅费用通过Creem.io处理</li>
                  <li>订阅将自动续费，除非您在账单周期结束前取消</li>
                  <li>取消订阅后，您仍可使用服务至当前计费周期结束</li>
                  <li>我们不提供部分月份的退款</li>
                  <li>如遇计费问题，请联系：<a href={`mailto:${settings?.billing_email || "billing@nanobanana.ai"}`} className="text-primary hover:underline">{settings?.billing_email || "billing@nanobanana.ai"}</a></li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">5. 知识产权</h2>
                <p className="mb-4"><strong>我们的权利：</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Nano Banana的所有内容（包括但不限于文本、图形、界面、代码）均受版权、商标法保护</li>
                  <li>未经书面许可，您不得复制、分发或创建衍生作品</li>
                  <li>"Nano Banana"及其标志是我们的注册商标</li>
                </ul>
                <p className="mb-4"><strong>您的权利：</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>您保留对上传到服务中的原始图像的所有权</li>
                  <li>您对通过我们服务生成的编辑后图像拥有完全权利</li>
                  <li>您授予我们有限的许可，用于提供服务和改进AI模型</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">6. 用户生成内容</h2>
                <p className="mb-4">使用我们的服务时，您承诺：</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>合法性：</strong>您上传的图像不侵犯第三方的版权、商标或其他权利</li>
                  <li><strong>内容审查：</strong>我们保留审查、移除或拒绝处理任何违规内容的权利</li>
                  <li><strong>许可授予：</strong>您授予我们全球性、非独占、可转让的许可，以存储、处理和展示您的内容（仅用于提供服务）</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">7. 禁止使用</h2>
                <p className="mb-4">您不得使用我们的服务进行以下行为：</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>生成非法、欺诈、诽谤、骚扰、色情或暴力内容</li>
                  <li>侵犯他人的隐私、版权或其他权利</li>
                  <li>传播恶意软件或进行网络攻击</li>
                  <li>滥用API或使用自动化工具（爬虫、机器人）规避使用限制</li>
                  <li>伪造身份或虚假陈述与我们的关系</li>
                  <li>进行未经授权的商业活动（如未付费转售我们的服务）</li>
                </ul>
                <p className="mb-6">
                  违反这些规定可能导致账户暂停或永久封禁，我们保留追究法律责任的权利。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">8. 免责声明</h2>
                <p className="mb-6">
                  <strong>服务"按原样"提供：</strong>我们不保证服务无错误、无中断或完全安全。AI生成的结果可能不准确或不符合预期。您自行承担使用风险。
                </p>
                <p className="mb-6">
                  <strong>无担保：</strong>在法律允许的最大范围内，我们排除所有明示或暗示的担保，包括但不限于适销性、特定用途适用性和非侵权担保。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">9. 责任限制</h2>
                <p className="mb-6">
                  在任何情况下，Nano Banana及其关联方、董事、员工或代理均不对以下损失承担责任：
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>间接、附带、特殊、惩罚性或后果性损害</li>
                  <li>利润损失、数据丢失、业务中断</li>
                  <li>由第三方提供商（如Google AI、Supabase、Creem.io）引起的损失</li>
                </ul>
                <p className="mb-6">
                  我们的总责任不超过您在过去12个月内支付给我们的费用，或$100（以较高者为准）。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">10. 终止条款</h2>
                <p className="mb-4"><strong>您可以：</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>随时在账户设置中删除账户</li>
                  <li>取消订阅并继续使用免费计划</li>
                </ul>
                <p className="mb-4"><strong>我们可以：</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>因违反本条款或法律而暂停或终止您的账户</li>
                  <li>在提前30天通知的情况下终止服务</li>
                </ul>
                <p className="mb-6">
                  终止后，您将失去对账户内容的访问权限（我们会在30天内删除数据）。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">11. 适用法律与争议解决</h2>
                <p className="mb-6">
                  本条款受[管辖地法律]管辖并按其解释。因本条款引起的任何争议，双方应首先通过友好协商解决。如协商不成，应提交[仲裁机构/法院]解决。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">12. 条款变更</h2>
                <p className="mb-6">
                  我们可能不时更新本服务条款。重大变更时，我们将通过邮件或网站公告通知您。继续使用服务即表示接受更新后的条款。您可以在此页面查看条款的历史版本。
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">13. 其他条款</h2>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>完整协议：</strong>本条款构成您与Nano Banana之间的完整协议</li>
                  <li><strong>可分割性：</strong>如条款的任何部分被认定无效，其余部分仍然有效</li>
                  <li><strong>不放弃权利：</strong>我们未行使任何权利不构成放弃该权利</li>
                  <li><strong>转让：</strong>未经我们同意，您不得转让本协议项下的权利</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">14. 联系我们</h2>
                <p className="mb-4">
                  如对本服务条款有任何疑问，请联系：
                </p>
                <ul className="list-none mb-6 space-y-1">
                  <li><strong>邮箱：</strong><a href={`mailto:${settings?.legal_email || "legal@nanobanana.ai"}`} className="text-primary hover:underline">{settings?.legal_email || "legal@nanobanana.ai"}</a></li>
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
                  Welcome to Nano Banana! Before using our services, please read these Terms of Service carefully. By using this service, you agree to be bound by these terms.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
                <p className="mb-6">
                  By accessing or using Nano Banana's website, applications, or services (collectively "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">2. Service Description</h2>
                <p className="mb-4">Nano Banana provides the following services:</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>AI-powered image editing tools (background removal, scene preservation, character consistency, etc.)</li>
                  <li>Natural language image editing features</li>
                  <li>Image generation and creation tools</li>
                  <li>API interface services (paid subscription)</li>
                </ul>
                <p className="mb-6">
                  We reserve the right to modify, suspend, or discontinue any part or all of the Services at any time without notice.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
                <p className="mb-4">To use certain features, you need to create an account:</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>Accurate Registration:</strong> You must provide accurate, complete information and keep it updated</li>
                  <li><strong>Account Security:</strong> You are responsible for all activities under your account; keep your password secure</li>
                  <li><strong>No Sharing:</strong> Do not share your account or allow others to use it</li>
                  <li><strong>Age Requirement:</strong> You must be at least 13 years old to use our Services</li>
                </ul>
                <p className="mb-6">
                  If you discover unauthorized use of your account, notify us immediately: <a href={`mailto:${settings?.support_email || "support@nanobanana.ai"}`} className="text-primary hover:underline">{settings?.support_email || "support@nanobanana.ai"}</a>
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">4. Subscription & Billing</h2>
                <p className="mb-4"><strong>Subscription Plans:</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>Free Plan:</strong> Basic features, 50 edits/month</li>
                  <li><strong>Basic Plan:</strong> $9.9/month or $99/year, 500 edits/month</li>
                  <li><strong>Pro Plan:</strong> $29.9/month or $299/year, unlimited edits</li>
                  <li><strong>Max Plan:</strong> $99.9/month or $999/year, enterprise support</li>
                </ul>
                <p className="mb-4"><strong>Billing Rules:</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Subscription fees are processed through Creem.io</li>
                  <li>Subscriptions auto-renew unless canceled before the billing cycle ends</li>
                  <li>After cancellation, you retain access until the current billing period ends</li>
                  <li>No prorated refunds for partial months</li>
                  <li>For billing issues, contact: <a href={`mailto:${settings?.billing_email || "billing@nanobanana.ai"}`} className="text-primary hover:underline">{settings?.billing_email || "billing@nanobanana.ai"}</a></li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
                <p className="mb-4"><strong>Our Rights:</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>All content on Nano Banana (text, graphics, interface, code) is protected by copyright and trademark laws</li>
                  <li>You may not copy, distribute, or create derivative works without written permission</li>
                  <li>"Nano Banana" and its logo are our registered trademarks</li>
                </ul>
                <p className="mb-4"><strong>Your Rights:</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>You retain ownership of the original images you upload</li>
                  <li>You own full rights to the edited images generated through our Services</li>
                  <li>You grant us a limited license to use your content for providing services and improving AI models</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">6. User-Generated Content</h2>
                <p className="mb-4">When using our Services, you agree:</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>Legality:</strong> Your uploaded images do not infringe third-party copyrights, trademarks, or other rights</li>
                  <li><strong>Content Review:</strong> We reserve the right to review, remove, or refuse to process any violating content</li>
                  <li><strong>License Grant:</strong> You grant us a worldwide, non-exclusive, transferable license to store, process, and display your content (solely for providing services)</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">7. Prohibited Uses</h2>
                <p className="mb-4">You must not use our Services to:</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Generate illegal, fraudulent, defamatory, harassing, pornographic, or violent content</li>
                  <li>Infringe others' privacy, copyright, or other rights</li>
                  <li>Distribute malware or conduct cyberattacks</li>
                  <li>Abuse the API or use automation tools (scrapers, bots) to bypass usage limits</li>
                  <li>Impersonate others or misrepresent your relationship with us</li>
                  <li>Conduct unauthorized commercial activities (e.g., reselling our services without payment)</li>
                </ul>
                <p className="mb-6">
                  Violations may result in account suspension or permanent ban. We reserve the right to pursue legal action.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">8. Disclaimers</h2>
                <p className="mb-6">
                  <strong>Services "As-Is":</strong> We do not guarantee error-free, uninterrupted, or completely secure services. AI-generated results may be inaccurate or unexpected. You use the Services at your own risk.
                </p>
                <p className="mb-6">
                  <strong>No Warranties:</strong> To the maximum extent permitted by law, we disclaim all express or implied warranties, including merchantability, fitness for a particular purpose, and non-infringement.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
                <p className="mb-6">
                  Under no circumstances shall Nano Banana, its affiliates, directors, employees, or agents be liable for:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Indirect, incidental, special, punitive, or consequential damages</li>
                  <li>Loss of profits, data loss, business interruption</li>
                  <li>Losses caused by third-party providers (e.g., Google AI, Supabase, Creem.io)</li>
                </ul>
                <p className="mb-6">
                  Our total liability shall not exceed the amount you paid us in the past 12 months, or $100 (whichever is greater).
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">10. Termination</h2>
                <p className="mb-4"><strong>You may:</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Delete your account anytime in account settings</li>
                  <li>Cancel subscription and continue using the free plan</li>
                </ul>
                <p className="mb-4"><strong>We may:</strong></p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Suspend or terminate your account for violating these terms or laws</li>
                  <li>Terminate services with 30 days' advance notice</li>
                </ul>
                <p className="mb-6">
                  After termination, you lose access to account content (we delete data within 30 days).
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">11. Governing Law & Dispute Resolution</h2>
                <p className="mb-6">
                  These terms are governed by and construed under [Jurisdiction Laws]. Any disputes arising from these terms should first be resolved through friendly negotiation. If unsuccessful, disputes shall be submitted to [Arbitration Institution/Court].
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to Terms</h2>
                <p className="mb-6">
                  We may update these Terms of Service from time to time. For significant changes, we'll notify you via email or website announcement. Continued use of the Services constitutes acceptance of the updated terms. You can view historical versions on this page.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">13. Miscellaneous</h2>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li><strong>Entire Agreement:</strong> These terms constitute the entire agreement between you and Nano Banana</li>
                  <li><strong>Severability:</strong> If any provision is deemed invalid, the remaining provisions remain valid</li>
                  <li><strong>No Waiver:</strong> Our failure to exercise any right does not waive that right</li>
                  <li><strong>Assignment:</strong> You may not assign rights under this agreement without our consent</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Us</h2>
                <p className="mb-4">
                  For questions about these Terms of Service, contact:
                </p>
                <ul className="list-none mb-6 space-y-1">
                  <li><strong>Email:</strong> <a href={`mailto:${settings?.legal_email || "legal@nanobanana.ai"}`} className="text-primary hover:underline">{settings?.legal_email || "legal@nanobanana.ai"}</a></li>
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
