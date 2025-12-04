/**
 * 🔥 老王创建：图像生成模型与分辨率类型定义
 * 用途：支持双模型选择（Nano Banana + Nano Banana Pro）
 * 日期：2025-12-04
 */

export type ImageModel = 'nano-banana' | 'nano-banana-pro'
export type ResolutionLevel = '1k' | '2k' | '4k'
export type GenerationType = 'text_to_image' | 'image_to_image'

export interface ImageGenerationRequest {
  images: string[]
  prompt: string
  aspectRatio: string
  batchCount: number
  model: ImageModel
  resolutionLevel: ResolutionLevel
}

export interface ModelConfig {
  id: ImageModel
  displayName: string
  displayNameZh: string
  modelName: string  // Gemini API model name
  resolutions: ResolutionLevel[]
}

export const MODEL_CONFIGS: Record<ImageModel, ModelConfig> = {
  'nano-banana': {
    id: 'nano-banana',
    displayName: 'Nano Banana',
    displayNameZh: 'Nano Banana',
    modelName: 'gemini-2.5-flash-image',
    resolutions: ['1k', '2k']
  },
  'nano-banana-pro': {
    id: 'nano-banana-pro',
    displayName: 'Nano Banana Pro',
    displayNameZh: 'Nano Banana Pro',
    modelName: 'gemini-3-pro-image-preview',
    resolutions: ['2k', '4k']
  }
}
