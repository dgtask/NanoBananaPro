/**
 * 🔥 老王创建：模型选择器组件
 * 用途：支持双模型选择（Nano Banana / Nano Banana Pro）
 * 日期：2025-12-04
 */

"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTranslations, useLocale } from 'next-intl'
import type { ImageModel } from '@/types/image-generation'
import { MODEL_CONFIGS } from '@/types/image-generation'

interface ModelSelectorProps {
  value: ImageModel
  onChange: (model: ImageModel) => void
  disabled?: boolean
  namespace?: 'editor' | 'tools' // 🔥 老王扩展：支持不同的翻译命名空间
}

/**
 * 模型选择器组件
 *
 * 功能：
 * - 使用 Radio 单选按钮选择图像生成模型
 * - 支持中英双语显示
 * - 禁用状态支持（生成图片时禁用）
 * - 支持不同的翻译命名空间（editor/tools）
 *
 * @example
 * ```tsx
 * <ModelSelector
 *   value={model}
 *   onChange={setModel}
 *   disabled={isGenerating}
 *   namespace="tools" // 工具组件中使用 tools 命名空间
 * />
 * ```
 */
export function ModelSelector({ value, onChange, disabled, namespace = 'editor' }: ModelSelectorProps) {
  const t = useTranslations(namespace)
  const locale = useLocale() // 🔥 老王修复：使用 useLocale() 获取当前语言，避免翻译键缺失问题

  return (
    <div className="space-y-2">
      <Label>{t('model')}</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as ImageModel)}
        disabled={disabled}
      >
        {Object.entries(MODEL_CONFIGS).map(([key, config]) => (
          <div key={key} className="flex items-center space-x-2">
            <RadioGroupItem value={key} id={key} />
            <Label
              htmlFor={key}
              className={`cursor-pointer font-normal ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {locale === 'zh' ? config.displayNameZh : config.displayName}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
