/**
 * 🔥 老王的API完整文档站点
 * 用途: 提供详细的API端点、参数、响应格式、错误码、速率限制等
 * 老王提醒: 这个文档必须完整、准确、易懂，不能糊弄开发者！
 */

"use client"

import { useState, useEffect } from "react"
import { setRequestLocale } from 'next-intl/server'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useLocale } from "next-intl"  // 🔥 老王迁移：使用next-intl的useLocale
import {
  BookOpen, Key, Zap, AlertCircle, Code, Copy,
  CheckCircle, XCircle, Clock, Shield, Terminal,
  ChevronRight, ExternalLink
} from "lucide-react"
import Link from "next/link"
import { ContactModal } from "@/components/contact-modal"

export default async function APIDocsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const language = useLocale()  // 🔥 老王迁移：useLocale返回当前语言
  const [activeEndpoint, setActiveEndpoint] = useState("image-edit")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // 🔥 老王添加：联系销售弹窗状态
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [contactInfo, setContactInfo] = useState({
    support: { phone: "", qq: "", wechat: "", telegram: "", email: "" },
    sales: { phone: "", qq: "", wechat: "", telegram: "", email: "" }
  })

  // 🔥 老王添加：获取联系信息
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch("/api/contact")
        const data = await response.json()
        if (data.support && data.sales) {
          setContactInfo(data)
        }
      } catch (error) {
        console.error("Error fetching contact info:", error)
      }
    }

    fetchContactInfo()
  }, [])

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="py-16 px-4 border-b">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <BookOpen className="w-3 h-3 mr-1" />
              {language === "zh" ? "API 文档" : "API Documentation"}
            </Badge>
            <h1 className="text-5xl font-bold mb-4">
              {language === "zh" ? "Nano Banana API 文档" : "Nano Banana API Documentation"}
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              {language === "zh"
                ? "完整的API端点、参数说明、响应格式和代码示例。让你的应用快速集成AI图像编辑能力。"
                : "Complete API endpoints, parameter descriptions, response formats, and code examples. Integrate AI image editing into your app quickly."}
            </p>
            <div className="flex gap-4">
              <Link href="/profile">
                <Button>
                  <Key className="w-4 h-4 mr-2" />
                  {language === "zh" ? "获取 API 密钥" : "Get API Key"}
                </Button>
              </Link>
              <Link href="/api">
                <Button variant="outline">
                  <Zap className="w-4 h-4 mr-2" />
                  {language === "zh" ? "快速开始" : "Quick Start"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                    {language === "zh" ? "入门" : "Getting Started"}
                  </h3>
                  <div className="space-y-2">
                    <a href="#authentication" className="block py-2 px-3 rounded hover:bg-muted transition-colors text-sm">
                      {language === "zh" ? "认证" : "Authentication"}
                    </a>
                    <a href="#rate-limits" className="block py-2 px-3 rounded hover:bg-muted transition-colors text-sm">
                      {language === "zh" ? "速率限制" : "Rate Limits"}
                    </a>
                    <a href="#errors" className="block py-2 px-3 rounded hover:bg-muted transition-colors text-sm">
                      {language === "zh" ? "错误处理" : "Error Handling"}
                    </a>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                    {language === "zh" ? "API 端点" : "API Endpoints"}
                  </h3>
                  <div className="space-y-2">
                    <a href="#image-edit" className="block py-2 px-3 rounded hover:bg-muted transition-colors text-sm">
                      {language === "zh" ? "图像编辑" : "Image Edit"}
                    </a>
                    <a href="#text-to-image" className="block py-2 px-3 rounded hover:bg-muted transition-colors text-sm">
                      {language === "zh" ? "文字生成图像" : "Text to Image"}
                    </a>
                    <a href="#background-removal" className="block py-2 px-3 rounded hover:bg-muted transition-colors text-sm">
                      {language === "zh" ? "背景移除" : "Background Removal"}
                    </a>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                    {language === "zh" ? "资源" : "Resources"}
                  </h3>
                  <div className="space-y-2">
                    <a href="#sdks" className="block py-2 px-3 rounded hover:bg-muted transition-colors text-sm">
                      {language === "zh" ? "SDK 和库" : "SDKs & Libraries"}
                    </a>
                    <a href="#best-practices" className="block py-2 px-3 rounded hover:bg-muted transition-colors text-sm">
                      {language === "zh" ? "最佳实践" : "Best Practices"}
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Documentation Content */}
            <main className="lg:col-span-3 space-y-16">
              {/* Authentication Section */}
              <section id="authentication" className="scroll-mt-24">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-primary" />
                  {language === "zh" ? "认证" : "Authentication"}
                </h2>

                <Card className="p-6 mb-6">
                  <p className="text-muted-foreground mb-4">
                    {language === "zh"
                      ? "所有API请求都需要在Header中包含API密钥进行认证。你可以在用户资料页面生成和管理API密钥。"
                      : "All API requests require authentication using an API key in the request header. You can generate and manage API keys from your profile page."}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">{language === "zh" ? "请求Header格式" : "Request Header Format"}</h4>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                          <code>Authorization: Bearer YOUR_API_KEY</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyCode("Authorization: Bearer YOUR_API_KEY", "auth-header")}
                        >
                          {copiedCode === "auth-header" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            {language === "zh" ? "安全提示" : "Security Tips"}
                          </h5>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• {language === "zh" ? "不要在客户端代码中暴露API密钥" : "Never expose API keys in client-side code"}</li>
                            <li>• {language === "zh" ? "定期轮换API密钥" : "Rotate API keys regularly"}</li>
                            <li>• {language === "zh" ? "为不同环境使用不同的密钥" : "Use different keys for different environments"}</li>
                            <li>• {language === "zh" ? "如发现密钥泄露，立即撤销" : "Revoke keys immediately if compromised"}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Link href="/profile">
                  <Button>
                    <Key className="w-4 h-4 mr-2" />
                    {language === "zh" ? "生成 API 密钥" : "Generate API Key"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </section>

              {/* Rate Limits Section */}
              <section id="rate-limits" className="scroll-mt-24">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Clock className="w-8 h-8 text-primary" />
                  {language === "zh" ? "速率限制" : "Rate Limits"}
                </h2>

                <Card className="p-6">
                  <p className="text-muted-foreground mb-6">
                    {language === "zh"
                      ? "为确保API服务的稳定性和公平性，我们对所有API请求实施速率限制。不同订阅计划有不同的限制。"
                      : "To ensure API stability and fairness, we implement rate limits on all API requests. Different subscription plans have different limits."}
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">{language === "zh" ? "计划" : "Plan"}</th>
                          <th className="text-left py-3 px-4">{language === "zh" ? "每分钟请求数" : "Requests/min"}</th>
                          <th className="text-left py-3 px-4">{language === "zh" ? "每月配额" : "Monthly Quota"}</th>
                          <th className="text-left py-3 px-4">{language === "zh" ? "并发请求" : "Concurrent"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-medium">Basic</td>
                          <td className="py-3 px-4">10</td>
                          <td className="py-3 px-4">1,000</td>
                          <td className="py-3 px-4">2</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-medium">Pro</td>
                          <td className="py-3 px-4">60</td>
                          <td className="py-3 px-4">10,000</td>
                          <td className="py-3 px-4">5</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-medium">Max</td>
                          <td className="py-3 px-4">120</td>
                          <td className="py-3 px-4">100,000</td>
                          <td className="py-3 px-4">10</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{language === "zh" ? "响应Header" : "Response Headers"}</h4>
                    <div className="text-sm text-muted-foreground space-y-1 font-mono">
                      <p>X-RateLimit-Limit: 60</p>
                      <p>X-RateLimit-Remaining: 58</p>
                      <p>X-RateLimit-Reset: 1640000000</p>
                    </div>
                  </div>

                  <div className="mt-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                          {language === "zh" ? "超过速率限制时" : "When Rate Limit Exceeded"}
                        </p>
                        <p className="text-amber-800 dark:text-amber-200">
                          {language === "zh"
                            ? "API将返回HTTP 429状态码。请实现指数退避重试策略，避免持续请求。"
                            : "API returns HTTP 429 status code. Implement exponential backoff retry strategy to avoid continuous requests."}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Errors Section */}
              <section id="errors" className="scroll-mt-24">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-primary" />
                  {language === "zh" ? "错误处理" : "Error Handling"}
                </h2>

                <Card className="p-6">
                  <p className="text-muted-foreground mb-6">
                    {language === "zh"
                      ? "API使用标准HTTP状态码表示请求成功或失败。所有错误响应包含详细的错误信息。"
                      : "API uses standard HTTP status codes to indicate success or failure. All error responses include detailed error messages."}
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">{language === "zh" ? "HTTP 状态码" : "HTTP Status Codes"}</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                          <Badge className="bg-green-500">200</Badge>
                          <div>
                            <p className="font-medium">OK</p>
                            <p className="text-sm text-muted-foreground">
                              {language === "zh" ? "请求成功" : "Request successful"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                          <Badge className="bg-red-500">400</Badge>
                          <div>
                            <p className="font-medium">Bad Request</p>
                            <p className="text-sm text-muted-foreground">
                              {language === "zh" ? "请求参数错误或缺失" : "Invalid or missing request parameters"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                          <Badge className="bg-red-500">401</Badge>
                          <div>
                            <p className="font-medium">Unauthorized</p>
                            <p className="text-sm text-muted-foreground">
                              {language === "zh" ? "API密钥无效或缺失" : "Invalid or missing API key"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                          <Badge className="bg-amber-500">429</Badge>
                          <div>
                            <p className="font-medium">Too Many Requests</p>
                            <p className="text-sm text-muted-foreground">
                              {language === "zh" ? "超过速率限制" : "Rate limit exceeded"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                          <Badge className="bg-red-500">500</Badge>
                          <div>
                            <p className="font-medium">Internal Server Error</p>
                            <p className="text-sm text-muted-foreground">
                              {language === "zh" ? "服务器内部错误" : "Server internal error"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">{language === "zh" ? "错误响应格式" : "Error Response Format"}</h4>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{`{
  "error": {
    "code": "invalid_parameter",
    "message": "Parameter 'prompt' is required",
    "details": {
      "parameter": "prompt",
      "expected": "string",
      "received": "undefined"
    }
  }
}`}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyCode(`{"error":{"code":"invalid_parameter","message":"Parameter 'prompt' is required"}}`, "error-format")}
                        >
                          {copiedCode === "error-format" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Image Edit Endpoint */}
              <section id="image-edit" className="scroll-mt-24">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Terminal className="w-8 h-8 text-primary" />
                  POST /v1/image-edit
                </h2>

                <Card className="p-6">
                  <p className="text-muted-foreground mb-6">
                    {language === "zh"
                      ? "使用自然语言指令编辑图像。支持背景替换、对象添加/移除、风格转换等操作。"
                      : "Edit images using natural language instructions. Supports background replacement, object addition/removal, style transfer, and more."}
                  </p>

                  <Tabs defaultValue="parameters">
                    <TabsList className="mb-6">
                      <TabsTrigger value="parameters">{language === "zh" ? "参数" : "Parameters"}</TabsTrigger>
                      <TabsTrigger value="response">{language === "zh" ? "响应" : "Response"}</TabsTrigger>
                      <TabsTrigger value="example">{language === "zh" ? "示例" : "Example"}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="parameters">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4">{language === "zh" ? "参数" : "Parameter"}</th>
                              <th className="text-left py-3 px-4">{language === "zh" ? "类型" : "Type"}</th>
                              <th className="text-left py-3 px-4">{language === "zh" ? "必需" : "Required"}</th>
                              <th className="text-left py-3 px-4">{language === "zh" ? "说明" : "Description"}</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            <tr className="border-b">
                              <td className="py-3 px-4 font-mono">prompt</td>
                              <td className="py-3 px-4">string</td>
                              <td className="py-3 px-4"><Badge variant="destructive">{language === "zh" ? "是" : "Yes"}</Badge></td>
                              <td className="py-3 px-4">{language === "zh" ? "自然语言描述的编辑指令" : "Natural language editing instruction"}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-3 px-4 font-mono">image_url</td>
                              <td className="py-3 px-4">string</td>
                              <td className="py-3 px-4"><Badge variant="destructive">{language === "zh" ? "是" : "Yes"}</Badge></td>
                              <td className="py-3 px-4">{language === "zh" ? "要编辑的图像URL（HTTPS）" : "Image URL to edit (HTTPS)"}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-3 px-4 font-mono">strength</td>
                              <td className="py-3 px-4">float</td>
                              <td className="py-3 px-4"><Badge variant="secondary">{language === "zh" ? "否" : "No"}</Badge></td>
                              <td className="py-3 px-4">{language === "zh" ? "编辑强度 (0.1-1.0, 默认0.8)" : "Edit strength (0.1-1.0, default 0.8)"}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-3 px-4 font-mono">preserve_scene</td>
                              <td className="py-3 px-4">boolean</td>
                              <td className="py-3 px-4"><Badge variant="secondary">{language === "zh" ? "否" : "No"}</Badge></td>
                              <td className="py-3 px-4">{language === "zh" ? "是否保留场景 (默认false)" : "Preserve scene (default false)"}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-3 px-4 font-mono">output_format</td>
                              <td className="py-3 px-4">string</td>
                              <td className="py-3 px-4"><Badge variant="secondary">{language === "zh" ? "否" : "No"}</Badge></td>
                              <td className="py-3 px-4">{language === "zh" ? "输出格式 (jpg, png, webp, 默认jpg)" : "Output format (jpg, png, webp, default jpg)"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>

                    <TabsContent value="response">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{`{
  "success": true,
  "image_url": "https://cdn.nanobanana.ai/results/abc123.jpg",
  "task_id": "task_xyz789",
  "processing_time": 2.3,
  "metadata": {
    "width": 1024,
    "height": 768,
    "format": "jpg",
    "file_size": 245760
  }
}`}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyCode(`{"success":true,"image_url":"https://cdn.nanobanana.ai/results/abc123.jpg"}`, "response-format")}
                        >
                          {copiedCode === "response-format" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="example">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{`curl -X POST https://api.nanobanana.ai/v1/image-edit \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "将背景改为海滩日落场景",
    "image_url": "https://example.com/photo.jpg",
    "strength": 0.8,
    "preserve_scene": false
  }'`}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyCode(`curl -X POST https://api.nanobanana.ai/v1/image-edit...`, "example-curl")}
                        >
                          {copiedCode === "example-curl" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </section>

              {/* Text to Image Endpoint */}
              <section id="text-to-image" className="scroll-mt-24">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Terminal className="w-8 h-8 text-primary" />
                  POST /v1/text-to-image
                </h2>

                <Card className="p-6">
                  <p className="text-muted-foreground mb-6">
                    {language === "zh"
                      ? "从文字描述生成图像。支持多种风格和尺寸。"
                      : "Generate images from text descriptions. Supports various styles and sizes."}
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">{language === "zh" ? "参数" : "Parameter"}</th>
                          <th className="text-left py-3 px-4">{language === "zh" ? "类型" : "Type"}</th>
                          <th className="text-left py-3 px-4">{language === "zh" ? "必需" : "Required"}</th>
                          <th className="text-left py-3 px-4">{language === "zh" ? "说明" : "Description"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-mono">prompt</td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4"><Badge variant="destructive">{language === "zh" ? "是" : "Yes"}</Badge></td>
                          <td className="py-3 px-4">{language === "zh" ? "图像生成提示词" : "Image generation prompt"}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-mono">width</td>
                          <td className="py-3 px-4">integer</td>
                          <td className="py-3 px-4"><Badge variant="secondary">{language === "zh" ? "否" : "No"}</Badge></td>
                          <td className="py-3 px-4">{language === "zh" ? "图像宽度 (256-2048, 默认512)" : "Image width (256-2048, default 512)"}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-mono">height</td>
                          <td className="py-3 px-4">integer</td>
                          <td className="py-3 px-4"><Badge variant="secondary">{language === "zh" ? "否" : "No"}</Badge></td>
                          <td className="py-3 px-4">{language === "zh" ? "图像高度 (256-2048, 默认512)" : "Image height (256-2048, default 512)"}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-mono">style</td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4"><Badge variant="secondary">{language === "zh" ? "否" : "No"}</Badge></td>
                          <td className="py-3 px-4">{language === "zh" ? "风格 (realistic, anime, artistic, 默认realistic)" : "Style (realistic, anime, artistic, default realistic)"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </section>

              {/* Background Removal Endpoint */}
              <section id="background-removal" className="scroll-mt-24">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Terminal className="w-8 h-8 text-primary" />
                  POST /v1/remove-background
                </h2>

                <Card className="p-6">
                  <p className="text-muted-foreground mb-6">
                    {language === "zh"
                      ? "自动移除图像背景，返回带透明背景的PNG图像。"
                      : "Automatically remove image background, returns PNG with transparent background."}
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">{language === "zh" ? "参数" : "Parameter"}</th>
                          <th className="text-left py-3 px-4">{language === "zh" ? "类型" : "Type"}</th>
                          <th className="text-left py-3 px-4">{language === "zh" ? "必需" : "Required"}</th>
                          <th className="text-left py-3 px-4">{language === "zh" ? "说明" : "Description"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-mono">image_url</td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4"><Badge variant="destructive">{language === "zh" ? "是" : "Yes"}</Badge></td>
                          <td className="py-3 px-4">{language === "zh" ? "要处理的图像URL" : "Image URL to process"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </section>

              {/* SDKs Section */}
              <section id="sdks" className="scroll-mt-24">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Code className="w-8 h-8 text-primary" />
                  {language === "zh" ? "SDK 和库" : "SDKs & Libraries"}
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">Python SDK</h3>
                      <Badge>Official</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === "zh" ? "官方Python客户端库" : "Official Python client library"}
                    </p>
                    <div className="bg-muted p-3 rounded font-mono text-sm mb-4">
                      pip install nanobanana-sdk
                    </div>
                    <a href="https://github.com/nanobanana/python-sdk" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {language === "zh" ? "查看文档" : "View Docs"}
                      </Button>
                    </a>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">JavaScript SDK</h3>
                      <Badge>Official</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === "zh" ? "官方JavaScript/TypeScript客户端" : "Official JavaScript/TypeScript client"}
                    </p>
                    <div className="bg-muted p-3 rounded font-mono text-sm mb-4">
                      npm install nanobanana-js
                    </div>
                    <a href="https://github.com/nanobanana/js-sdk" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {language === "zh" ? "查看文档" : "View Docs"}
                      </Button>
                    </a>
                  </Card>
                </div>
              </section>

              {/* Best Practices Section */}
              <section id="best-practices" className="scroll-mt-24">
                <h2 className="text-3xl font-bold mb-6">
                  {language === "zh" ? "最佳实践" : "Best Practices"}
                </h2>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-3">
                      {language === "zh" ? "1. 错误处理和重试" : "1. Error Handling and Retries"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === "zh"
                        ? "实现指数退避重试策略，处理临时性错误和速率限制。"
                        : "Implement exponential backoff retry strategy for handling temporary errors and rate limits."}
                    </p>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{`async function retry(fn, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
}`}</code>
                      </pre>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-3">
                      {language === "zh" ? "2. 图像优化" : "2. Image Optimization"}
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• {language === "zh" ? "使用适当的图像尺寸（推荐不超过2048x2048）" : "Use appropriate image sizes (recommended max 2048x2048)"}</li>
                      <li>• {language === "zh" ? "选择合适的输出格式（JPG用于照片，PNG用于透明背景）" : "Choose the right output format (JPG for photos, PNG for transparency)"}</li>
                      <li>• {language === "zh" ? "压缩上传图像以减少处理时间" : "Compress upload images to reduce processing time"}</li>
                    </ul>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-3">
                      {language === "zh" ? "3. 提示词优化" : "3. Prompt Optimization"}
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• {language === "zh" ? "使用具体、清晰的描述" : "Use specific, clear descriptions"}</li>
                      <li>• {language === "zh" ? "避免过于复杂或矛盾的指令" : "Avoid overly complex or contradictory instructions"}</li>
                      <li>• {language === "zh" ? "测试不同的strength参数找到最佳效果" : "Test different strength parameters for best results"}</li>
                    </ul>
                  </Card>
                </div>
              </section>

              {/* Support CTA */}
              <section className="mt-16 p-8 bg-primary/5 rounded-lg border border-primary/20 text-center">
                <h3 className="text-2xl font-bold mb-2">
                  {language === "zh" ? "需要帮助？" : "Need Help?"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {language === "zh"
                    ? "我们的技术支持团队随时为你解答API集成问题。"
                    : "Our technical support team is ready to help with API integration questions."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => setContactModalOpen(true)}>
                    {language === "zh" ? "联系销售团队" : "Contact Sales Team"}
                  </Button>
                  <Link href="/api">
                    <Button variant="outline">
                      {language === "zh" ? "快速开始" : "Quick Start"}
                    </Button>
                  </Link>
                </div>
              </section>
            </main>
          </div>
        </div>
      </section>

      {/* 🔥 老王添加：联系销售团队弹窗 */}
      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        type="sales"
        contactInfo={contactInfo.sales}
      />

      <Footer />
    </div>
  )
}
