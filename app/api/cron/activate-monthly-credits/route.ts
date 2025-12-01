import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * 🔥 老王实现：定时任务 - 自动激活每月积分 + 年付订阅自动充值（合并版）
 *
 * GET/POST /api/cron/activate-monthly-credits
 *
 * 功能（合并了原 refill-credits 和 activate-monthly-credits）：
 *
 * 第一部分：年付订阅自动充值 (原 refill-credits)
 * 1. 调用数据库函数 check_and_refill_expired_subscriptions
 * 2. 查找 next_refill_date <= NOW() 且 remaining_refills > 0 的年付订阅
 * 3. 自动充值当月积分（30天有效）
 * 4. remaining_refills -= 1, next_refill_date = 新积分过期时间
 *
 * 第二部分：月付订阅激活下一月积分 (原逻辑)
 * 1. 查询所有有未激活月份的活跃订阅 (unactivated_months > 0 && status = 'active')
 * 2. 检查当前月积分是否快要过期（剩余 <= 3天）
 * 3. 如果快要过期，激活下一个月的积分：
 *    - 充值下一个月积分（30天有效期）
 *    - unactivated_months -= 1
 *
 * 调用方式：
 * - Vercel Cron: 配置在 vercel.json 中，每天凌晨0点运行
 * - 手动触发: curl -X POST http://localhost:3000/api/cron/activate-monthly-credits \
 *              -H "Authorization: Bearer YOUR_CRON_SECRET"
 * - GitHub Actions: 见 .github/workflows/cron-jobs.yml
 *
 * 安全：
 * - 生产环境：需要验证 Vercel Cron Secret (CRON_SECRET)
 * - 开发环境：允许直接调用
 */

export async function GET(request: NextRequest) {
  return handleCronJob(request)
}

export async function POST(request: NextRequest) {
  return handleCronJob(request)
}

async function handleCronJob(request: NextRequest) {
  try {
    // 🔥 老王添加：安全验证（生产环境需要验证 Cron Secret）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    console.log('🔄 [Cron] 开始自动激活每月积分 + 年付订阅自动充值...')

    const supabase = createServiceClient()

    // ========== 第一部分：年付订阅自动充值 (原 refill-credits 逻辑) ==========
    console.log('📦 [Cron] 执行年付订阅自动充值...')

    const { data: refillData, error: refillError } = await supabase.rpc('check_and_refill_expired_subscriptions')

    if (refillError) {
      console.error('❌ [Cron] 年付订阅自动充值失败:', refillError)
    } else {
      const refilledCount = refillData?.length || 0
      console.log(`✅ [Cron] 年付订阅自动充值完成: ${refilledCount} 个订阅`)
    }

    // ========== 第二部分：月付订阅激活下一月积分 (原逻辑) ==========
    console.log('📦 [Cron] 执行月付订阅激活下一月积分...')

    // 1. 查询所有有未激活月份的活跃订阅
    const { data: subscriptions, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .gt('unactivated_months', 0)

    if (fetchError) {
      console.error('❌ [Cron] 查询订阅失败:', fetchError)
      return NextResponse.json(
        { success: false, error: '查询订阅失败', details: fetchError },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('✅ [Cron] 没有需要激活的订阅')
      return NextResponse.json({
        success: true,
        message: '没有需要激活的订阅',
        activated: 0,
      })
    }

    console.log(`📋 [Cron] 找到 ${subscriptions.length} 个有未激活月份的订阅`)

    // 2. 遍历每个订阅，检查是否需要激活
    const results = []
    for (const sub of subscriptions) {
      try {
        // 查询当前订阅最近的积分充值记录
        const { data: recentCredits, error: creditsError } = await supabase
          .from('credit_transactions')
          .select('expires_at')
          .eq('user_id', sub.user_id)
          .eq('related_entity_id', sub.id)
          .eq('transaction_type', 'subscription_refill')
          .gt('amount', 0)  // 只查充值记录
          .not('expires_at', 'is', null)
          .order('expires_at', { ascending: false })
          .limit(1)

        if (creditsError) {
          console.error(`❌ [Cron] 查询积分失败 (订阅=${sub.id}):`, creditsError)
          results.push({ subscriptionId: sub.id, status: 'error', error: creditsError.message })
          continue
        }

        // 如果没有找到积分记录，跳过（可能是首次购买还未激活）
        if (!recentCredits || recentCredits.length === 0) {
          console.log(`⏭️ [Cron] 跳过 (订阅=${sub.id})：没有找到积分记录`)
          results.push({ subscriptionId: sub.id, status: 'skipped', reason: '没有积分记录' })
          continue
        }

        const latestExpiresAt = new Date(recentCredits[0].expires_at!)
        const now = new Date()
        const daysUntilExpiry = Math.ceil((latestExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        console.log(`🔍 [Cron] 订阅 ${sub.id}：当前积分还有 ${daysUntilExpiry} 天过期`)

        // 3. 如果剩余 <= 3天，激活下一个月的积分
        if (daysUntilExpiry <= 3) {
          console.log(`⚡ [Cron] 激活下一个月积分 (订阅=${sub.id}, 用户=${sub.user_id})`)

          // 导入 CreditService
          const { createCreditService } = await import('@/lib/credit-service')
          const creditService = await createCreditService(true)  // 使用 Service Role Client

          // 充值下一个月的积分（30天有效期）
          const { SUBSCRIPTION_MONTHLY_CREDITS } = await import('@/lib/credit-types')
          const monthlyCredits = SUBSCRIPTION_MONTHLY_CREDITS[sub.plan_tier as keyof typeof SUBSCRIPTION_MONTHLY_CREDITS]

          // 从最近的积分包过期时间开始延长30天
          const newExpiresAt = new Date(latestExpiresAt)
          newExpiresAt.setDate(newExpiresAt.getDate() + 30)

          await creditService.addCredits({
            user_id: sub.user_id,
            amount: monthlyCredits,
            transaction_type: 'subscription_refill',
            expires_at: newExpiresAt,
            related_entity_id: sub.id,
            description: `自动激活下一个月积分 - ${sub.plan_tier}套餐 (${monthlyCredits}积分，30天有效) / Auto-activate next month credits - ${sub.plan_tier} plan (${monthlyCredits} credits, valid for 30 days)`,
          })

          // 更新未激活月份 -1
          const newUnactivated = sub.unactivated_months - 1
          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({ unactivated_months: newUnactivated })
            .eq('id', sub.id)

          if (updateError) {
            console.error(`❌ [Cron] 更新未激活月份失败 (订阅=${sub.id}):`, updateError)
            results.push({ subscriptionId: sub.id, status: 'error', error: updateError.message })
            continue
          }

          console.log(`✅ [Cron] 激活成功 (订阅=${sub.id})：充值 ${monthlyCredits} 积分，未激活月份 ${sub.unactivated_months} → ${newUnactivated}`)
          results.push({
            subscriptionId: sub.id,
            userId: sub.user_id,
            status: 'activated',
            creditsAdded: monthlyCredits,
            expiresAt: newExpiresAt.toISOString(),
            unactivatedMonths: newUnactivated,
          })
        } else {
          console.log(`⏭️ [Cron] 跳过 (订阅=${sub.id})：当前积分还有 ${daysUntilExpiry} 天，无需激活`)
          results.push({ subscriptionId: sub.id, status: 'skipped', reason: `还有${daysUntilExpiry}天` })
        }
      } catch (error) {
        console.error(`❌ [Cron] 处理订阅失败 (订阅=${sub.id}):`, error)
        results.push({
          subscriptionId: sub.id,
          status: 'error',
          error: error instanceof Error ? error.message : '未知错误',
        })
      }
    }

    // 统计结果
    const activated = results.filter(r => r.status === 'activated').length
    const skipped = results.filter(r => r.status === 'skipped').length
    const errors = results.filter(r => r.status === 'error').length
    const refilledCount = refillData?.length || 0

    console.log(`✅ [Cron] 总计完成：年付充值=${refilledCount}, 月付激活=${activated}, 跳过=${skipped}, 错误=${errors}`)

    return NextResponse.json({
      success: true,
      message: `Cron任务完成：年付充值=${refilledCount}, 月付激活=${activated}, 跳过=${skipped}, 错误=${errors}`,
      refill: {
        count: refilledCount,
        subscriptions: refillData || [],
      },
      activate: {
        activated,
        skipped,
        errors,
        results,
      },
    })

  } catch (error) {
    console.error('❌ [Cron] 定时任务失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '定时任务失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
