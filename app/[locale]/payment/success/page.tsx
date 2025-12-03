"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, ArrowRight, Home } from "lucide-react"  // 🔥 老王清理：移除未使用的useLanguage import
import Link from "next/link"
import { useEffect, useState } from "react"

export default function PaymentSuccessPage() {
  // 🔥 老王清理：移除未使用的 useLanguage hook (页面文字是硬编码的)
  const [planInfo, setPlanInfo] = useState<any>(null)

  useEffect(() => {
    // 从URL参数获取支付信息
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')
    const planId = urlParams.get('plan')

    // 这里可以根据session_id从支付服务商获取详细信息
    // 暂时使用模拟数据
    setPlanInfo({
      plan: planId || 'pro',
      sessionId: sessionId,
      activatedAt: new Date().toISOString()
    })
  }, [])

  const getPlanName = (planId: string) => {
    const plans: Record<string, string> = {
      'basic': '基础版',
      'pro': '专业版',
      'max': '旗舰版'
    }
    return plans[planId] || '专业版'
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-md">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">支付成功！</h1>
              <p className="text-muted-foreground">
                恭喜您，订阅已成功激活
              </p>
            </div>

            {planInfo && (
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium text-foreground mb-3">订阅详情</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">订阅计划</span>
                      <span className="font-medium">{getPlanName(planInfo.plan)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">激活时间</span>
                      <span className="font-medium">
                        {new Date(planInfo.activatedAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">交易ID</span>
                      <span className="font-medium text-xs">
                        {planInfo.sessionId ? planInfo.sessionId.slice(0, 12) + '...' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">接下来做什么？</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 开始使用AI图像编辑功能</li>
                    <li>• 享受更高的生成限额</li>
                    <li>• 获得优先技术支持</li>
                    <li>• 解锁高级功能</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Link href="/editor/image-edit">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  开始使用
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link href="/profile">
                <Button variant="outline" className="w-full">
                  查看账户详情
                </Button>
              </Link>

              <Link href="/">
                <Button variant="ghost" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  返回首页
                </Button>
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                感谢您选择 Nano Banana！
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                如有任何问题，请联系
                <a href="mailto:support@nanobanana.ai" className="text-primary hover:underline ml-1">
                  客服团队
                </a>
              </p>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}