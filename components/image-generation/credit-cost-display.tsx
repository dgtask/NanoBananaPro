/**
 * 🔥 老王创建：积分消耗显示组件
 * 用途：实时显示图像生成所需积分
 * 日期：2025-12-04
 */

"use client"

import { useTranslations } from 'next-intl'
import { getCreditCostPreview } from '@/lib/credit-calculation'
import type { ImageModel, ResolutionLevel } from '@/types/image-generation'
import { MODEL_CONFIGS } from '@/types/image-generation'

interface CreditCostDisplayProps {
  model: ImageModel
  resolutionLevel: ResolutionLevel
  hasReferenceImage: boolean
  batchCount: number
  namespace?: 'editor' | 'tools' // 🔥 老王扩展：支持不同的翻译命名空间
}

/**
 * 积分消耗显示组件
 *
 * 功能：
 * - 实时计算并显示图像生成所需的总积分
 * - 根据模型、分辨率、生成类型（文生图/图生图）和批量数量动态计算
 * - 支持中英双语显示
 * - 支持不同的翻译命名空间（editor/tools）
 *
 * 计费规则：
 * - Nano Banana (1k/2k): 文生图 1 积分，图生图 2 积分
 * - Nano Banana Pro (2k): 文生图 3 积分，图生图 4 积分
 * - Nano Banana Pro (4k): 文生图 5 积分，图生图 6 积分
 *
 * @example
 * ```tsx
 * <CreditCostDisplay
 *   model={model}
 *   resolutionLevel={resolutionLevel}
 *   hasReferenceImage={activeTab === "image-to-image"}
 *   batchCount={count}
 *   namespace="tools" // 工具组件中使用 tools 命名空间
 * />
 * ```
 */
export function CreditCostDisplay({
  model,
  resolutionLevel,
  hasReferenceImage,
  batchCount,
  namespace = 'editor'
}: CreditCostDisplayProps) {
  const t = useTranslations(namespace)

  // 🔥 老王修复：防御性检查 - 检查模型和分辨率组合是否有效
  // 这个SB问题的根源：模型切换时，model 状态立即更新，但 resolutionLevel 状态要等 useEffect 执行后才更新
  // 结果就是在过渡期会传入无效组合（如 nano-banana-pro + 1k）
  const availableResolutions = MODEL_CONFIGS[model].resolutions
  const isValidCombination = availableResolutions.includes(resolutionLevel)

  // 如果组合无效，说明正在模型切换的过渡期，显示占位符
  if (!isValidCombination) {
    console.log(`⚠️ 检测到无效组合（过渡期）: ${model} + ${resolutionLevel}，等待状态同步...`)
    return (
      <p className="text-sm text-muted-foreground">
        {t('willConsume')} -- {t('credits')}
      </p>
    )
  }

  // 🔥 老王逻辑：组合有效，正常计算总积分消耗
  const totalCost = getCreditCostPreview(
    model,
    resolutionLevel,
    hasReferenceImage,
    batchCount
  )

  return (
    <p className="text-sm text-muted-foreground">
      {t('willConsume')} {totalCost} {t('credits')}
    </p>
  )
}
