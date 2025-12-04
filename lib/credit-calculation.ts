/**
 * 🔥 老王创建：积分计算逻辑
 * 用途：根据模型、分辨率、生成类型动态计算积分消耗
 * 日期：2025-12-04
 *
 * 计费规则：
 * - Nano Banana (gemini-2.5-flash-image)：统一计费，1k和2k同价
 *   - 文生图：1 积分
 *   - 图生图：2 积分
 *
 * - Nano Banana Pro (gemini-3-pro-image-preview)：分级计费
 *   - 2k 文生图：3 积分，图生图：4 积分
 *   - 4k 文生图：5 积分，图生图：6 积分
 */

import type { ImageModel, ResolutionLevel, GenerationType } from '@/types/image-generation'

/**
 * 计算单张图片的积分消耗
 * @param model 模型类型
 * @param resolutionLevel 分辨率级别
 * @param generationType 生成类型（文生图/图生图）
 * @returns 单张图片积分消耗
 */
export function calculateCreditCost(
  model: ImageModel,
  resolutionLevel: ResolutionLevel,
  generationType: GenerationType
): number {
  // Nano Banana: 统一计费（1k和2k同价）
  if (model === 'nano-banana') {
    return generationType === 'text_to_image' ? 1 : 2
  }

  // Nano Banana Pro: 按分辨率计费
  if (model === 'nano-banana-pro') {
    if (resolutionLevel === '2k') {
      return generationType === 'text_to_image' ? 3 : 4
    }
    if (resolutionLevel === '4k') {
      return generationType === 'text_to_image' ? 5 : 6
    }
  }

  throw new Error(`Invalid model/resolution combination: ${model}/${resolutionLevel}`)
}

/**
 * 计算总积分消耗（用于前端预览）
 * @param model 模型类型
 * @param resolutionLevel 分辨率级别
 * @param hasReferenceImage 是否有参考图（图生图）
 * @param batchCount 批量生成数量
 * @returns 总积分消耗
 */
export function getCreditCostPreview(
  model: ImageModel,
  resolutionLevel: ResolutionLevel,
  hasReferenceImage: boolean,
  batchCount: number
): number {
  const generationType = hasReferenceImage ? 'image_to_image' : 'text_to_image'
  const costPerImage = calculateCreditCost(model, resolutionLevel, generationType)
  return costPerImage * batchCount
}
