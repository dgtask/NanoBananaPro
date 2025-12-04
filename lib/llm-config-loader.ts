/**
 * 🔥 老王的LLM配置加载器
 * 用途: 从数据库加载LLM配置（支持加密的API Key）
 * 老王备注: 这个SB配置加载器统一管理所有LLM服务配置
 */

import { configCache } from './config-cache'
import { decrypt, maskSensitiveData } from './crypto-utils'

// LLM服务类型
export type LLMServiceType = 'image_generation' | 'prompt_optimization'

// LLM Provider类型
export type LLMProvider = 'google' | 'ollama' | 'openai' | 'anthropic' | 'GLM' | 'custom'

// LLM配置接口（图像生成）
export interface ImageGenerationConfig {
  provider: LLMProvider
  service_type: 'image_generation'
  api_url: string
  api_key: string  // 已解密
  model_name: string
  timeout?: number
  description?: string
}

// LLM配置接口（提示词优化）
export interface PromptOptimizationConfig {
  provider: LLMProvider
  service_type: 'prompt_optimization'
  api_url: string
  api_key?: string  // 已解密（Ollama可能不需要）
  quick_model: string
  detailed_model: string
  timeout?: number
  headers?: Record<string, string>
  description?: string
}

// 联合类型
export type LLMConfig = ImageGenerationConfig | PromptOptimizationConfig

/**
 * 🔥 LLM配置管理器
 */
export class LLMConfigLoader {
  /**
   * 获取图像生成配置
   * @param provider 指定provider（可选，不指定则返回激活的配置）
   */
  async getImageGenerationConfig(provider?: LLMProvider): Promise<ImageGenerationConfig | null> {
    try {
      // 构建配置key
      const configKey = provider
        ? `llm.image_generation.${provider}`
        : await this.findActiveConfig('image_generation')

      if (!configKey) {
        console.warn('⚠️ 未找到激活的图像生成配置')
        return null
      }

      // 从缓存加载配置
      const rawConfig = await configCache.getConfig<any>(configKey, null)

      if (!rawConfig) {
        console.warn(`⚠️ LLM配置不存在: ${configKey}`)
        return null
      }

      // 解密API Key
      const decryptedConfig: ImageGenerationConfig = {
        ...rawConfig,
        api_key: rawConfig.api_key_encrypted ? decrypt(rawConfig.api_key_encrypted) : ''
      }

      // 移除加密字段
      delete (decryptedConfig as any).api_key_encrypted

      console.log('✅ 图像生成配置加载成功')
      console.log(`  Provider: ${decryptedConfig.provider}`)
      console.log(`  API URL: ${decryptedConfig.api_url}`)
      console.log(`  Model: ${decryptedConfig.model_name}`)
      console.log(`  API Key: ${maskSensitiveData(decryptedConfig.api_key)}`)

      return decryptedConfig
    } catch (error) {
      console.error('❌ 加载图像生成配置失败:', error)
      return null
    }
  }

  /**
   * 🔥 老王扩展：根据模型类型获取图像生成配置
   * @param model 模型类型（nano-banana / nano-banana-pro）
   */
  async getImageGenerationConfigByModel(
    model: 'nano-banana' | 'nano-banana-pro'
  ): Promise<ImageGenerationConfig | null> {
    try {
      // 构建配置key（flash对应原模型，pro对应新模型）
      const configKey = model === 'nano-banana'
        ? 'llm.image_generation.google.flash'
        : 'llm.image_generation.google.pro'

      console.log(`🔍 正在加载模型配置: ${model} (${configKey})`)

      // 从缓存加载配置
      const rawConfig = await configCache.getConfig<any>(configKey, null)

      if (!rawConfig) {
        console.warn(`⚠️ 数据库中未找到模型配置: ${configKey}，使用降级配置`)
        return getFallbackImageGenerationConfigByModel(model)
      }

      // 解密API Key
      const decryptedConfig: ImageGenerationConfig = {
        ...rawConfig,
        api_key: rawConfig.api_key_encrypted ? decrypt(rawConfig.api_key_encrypted) : ''
      }

      // 移除加密字段
      delete (decryptedConfig as any).api_key_encrypted

      console.log('✅ 模型配置加载成功')
      console.log(`  Model: ${model}`)
      console.log(`  Gemini Model: ${decryptedConfig.model_name}`)
      console.log(`  API URL: ${decryptedConfig.api_url}`)
      console.log(`  API Key: ${maskSensitiveData(decryptedConfig.api_key)}`)

      return decryptedConfig
    } catch (error) {
      console.error(`❌ 加载模型配置失败 (${model}):`, error)
      return null
    }
  }

  /**
   * 获取提示词优化配置
   * @param provider 指定provider（可选，不指定则返回激活的配置）
   */
  async getPromptOptimizationConfig(provider?: LLMProvider): Promise<PromptOptimizationConfig | null> {
    try {
      // 构建配置key
      const configKey = provider
        ? `llm.prompt_optimization.${provider}`
        : await this.findActiveConfig('prompt_optimization')

      if (!configKey) {
        console.warn('⚠️ 未找到激活的提示词优化配置')
        return null
      }

      // 从缓存加载配置
      const rawConfig = await configCache.getConfig<any>(configKey, null)

      if (!rawConfig) {
        console.warn(`⚠️ LLM配置不存在: ${configKey}`)
        return null
      }

      // 解密API Key（如果有）
      const decryptedConfig: PromptOptimizationConfig = {
        ...rawConfig,
        api_key: rawConfig.api_key_encrypted ? decrypt(rawConfig.api_key_encrypted) : undefined
      }

      // 移除加密字段
      delete (decryptedConfig as any).api_key_encrypted

      console.log('✅ 提示词优化配置加载成功')
      console.log(`  Provider: ${decryptedConfig.provider}`)
      console.log(`  API URL: ${decryptedConfig.api_url}`)
      console.log(`  Quick Model: ${decryptedConfig.quick_model}`)
      console.log(`  Detailed Model: ${decryptedConfig.detailed_model}`)
      console.log(`  API Key: ${decryptedConfig.api_key ? maskSensitiveData(decryptedConfig.api_key) : 'N/A'}`)

      return decryptedConfig
    } catch (error) {
      console.error('❌ 加载提示词优化配置失败:', error)
      return null
    }
  }

  /**
   * 🔥 老王优化：查找激活的配置key
   * 从所有配置中找出is_active=true的那个
   */
  private async findActiveConfig(serviceType: LLMServiceType): Promise<string | null> {
    try {
      // 获取所有配置
      const allConfigs = await configCache.getAllActiveConfigs()

      // 筛选LLM配置
      const llmConfigs = Object.entries(allConfigs).filter(([key, value]) => {
        return key.startsWith('llm.') && value.service_type === serviceType
      })

      // 返回第一个匹配的（应该只有一个is_active=true）
      if (llmConfigs.length > 0) {
        return llmConfigs[0][0]
      }

      return null
    } catch (error) {
      console.error('❌ 查找激活配置失败:', error)
      return null
    }
  }

  /**
   * 获取所有可用的provider列表（按服务类型）
   */
  async getAvailableProviders(serviceType: LLMServiceType): Promise<Array<{
    provider: LLMProvider
    configKey: string
    isActive: boolean
    description?: string
  }>> {
    try {
      const allConfigs = await configCache.getAllActiveConfigs()

      const providers = Object.entries(allConfigs)
        .filter(([key, value]) => {
          return key.startsWith('llm.') && value.service_type === serviceType
        })
        .map(([key, value]) => ({
          provider: value.provider as LLMProvider,
          configKey: key,
          isActive: true,  // getAllActiveConfigs只返回is_active=true的
          description: value.description
        }))

      console.log(`✅ 找到${providers.length}个${serviceType}服务配置`)
      return providers
    } catch (error) {
      console.error('❌ 获取可用provider列表失败:', error)
      return []
    }
  }

  /**
   * 健康检查：验证配置是否完整
   */
  async healthCheck(): Promise<{
    imageGeneration: boolean
    promptOptimization: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    // 检查图像生成配置
    const imgConfig = await this.getImageGenerationConfig()
    const imgHealthy = !!(imgConfig && imgConfig.api_key && imgConfig.model_name)
    if (!imgHealthy) {
      errors.push('图像生成配置缺失或不完整')
    }

    // 检查提示词优化配置
    const promptConfig = await this.getPromptOptimizationConfig()
    const promptHealthy = !!(promptConfig && promptConfig.quick_model && promptConfig.detailed_model)
    if (!promptHealthy) {
      errors.push('提示词优化配置缺失或不完整')
    }

    const overall = imgHealthy && promptHealthy

    if (overall) {
      console.log('✅ LLM配置健康检查通过')
    } else {
      console.warn('⚠️ LLM配置健康检查失败:', errors)
    }

    return {
      imageGeneration: imgHealthy,
      promptOptimization: promptHealthy,
      errors
    }
  }
}

/**
 * 🔥 导出单例实例
 */
export const llmConfigLoader = new LLMConfigLoader()

/**
 * 🔥 老王工具：降级配置（当数据库配置不可用时）
 * 从环境变量读取配置作为fallback
 */
export function getFallbackImageGenerationConfig(): ImageGenerationConfig | null {
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.warn('⚠️ 降级配置：环境变量 GOOGLE_AI_API_KEY 未设置')
    return null
  }

  console.log('🔄 使用降级配置：从环境变量加载图像生成配置')
  return {
    provider: 'google',
    service_type: 'image_generation',
    api_url: 'https://generativelanguage.googleapis.com',
    api_key: process.env.GOOGLE_AI_API_KEY,
    model_name: 'gemini-2.5-flash-image',
    timeout: 60000,
    description: '降级配置（从环境变量）'
  }
}

/**
 * 🔥 老王扩展：根据模型类型获取降级配置
 * @param model 模型类型
 */
export function getFallbackImageGenerationConfigByModel(
  model: 'nano-banana' | 'nano-banana-pro'
): ImageGenerationConfig {
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.warn('⚠️ 降级配置：环境变量 GOOGLE_AI_API_KEY 未设置，将使用空API Key')
  }

  const modelName = model === 'nano-banana'
    ? 'gemini-2.5-flash-image'
    : 'gemini-3-pro-image-preview'

  console.log(`🔄 使用降级配置：从环境变量加载${model}配置`)
  return {
    provider: 'google',
    service_type: 'image_generation',
    api_url: 'https://generativelanguage.googleapis.com',
    api_key: process.env.GOOGLE_AI_API_KEY || '',
    model_name: modelName,
    timeout: 60000,
    description: `降级配置（${model} - 从环境变量）`
  }
}

/**
 * 🔥 老王工具：降级配置（提示词优化 - 智谱AI）
 */
export function getFallbackPromptOptimizationConfig(): PromptOptimizationConfig | null {
  // 优先使用智谱AI配置
  if (process.env.GLM_API_KEY) {
    console.log('🔄 使用降级配置：智谱AI（从环境变量）')
    return {
      provider: 'GLM',
      service_type: 'prompt_optimization',
      api_url: process.env.GLM_API_URL || 'https://open.bigmodel.cn/api/coding/paas/v4',
      api_key: process.env.GLM_API_KEY,
      quick_model: process.env.GLM_QUICK_MODEL || 'glm-4.5-air',
      detailed_model: process.env.GLM_DETAILED_MODEL || 'glm-4.6',
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      },
      description: '降级配置（智谱AI - 从环境变量）'
    }
  }

  // 如果没有GLM配置，返回null（强制从数据库读取）
  console.warn('⚠️ 环境变量中未配置GLM_API_KEY，无法使用降级配置')
  console.warn('  请在数据库中配置提示词优化服务，或设置环境变量：')
  console.warn('  GLM_API_KEY=your_api_key')
  console.warn('  GLM_API_URL=https://open.bigmodel.cn/api/coding/paas/v4')
  return null
}

console.log('🔥 LLM配置加载器模块加载完成')
