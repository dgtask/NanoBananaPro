/**
 * 🔥 老王创建：分辨率选择器组件
 * 用途：根据模型动态显示可用分辨率选项
 * 日期：2025-12-04
 */

"use client"

import { useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from 'next-intl'
import type { ImageModel, ResolutionLevel } from '@/types/image-generation'
import { MODEL_CONFIGS } from '@/types/image-generation'

interface ResolutionSelectorProps {
  model: ImageModel
  value: ResolutionLevel
  onChange: (resolution: ResolutionLevel) => void
  disabled?: boolean
  namespace?: 'editor' | 'tools' // 🔥 老王扩展：支持不同的翻译命名空间
}

/**
 * 分辨率选择器组件
 *
 * 功能：
 * - 根据选择的模型动态显示可用分辨率选项
 * - Nano Banana: 1k, 2k
 * - Nano Banana Pro: 2k, 4k
 * - 自动切换：当前分辨率不可用时，自动切换到第一个可用选项
 * - 支持中英双语显示
 * - 禁用状态支持（生成图片时禁用）
 * - 支持不同的翻译命名空间（editor/tools）
 *
 * @example
 * ```tsx
 * <ResolutionSelector
 *   model={model}
 *   value={resolutionLevel}
 *   onChange={setResolutionLevel}
 *   disabled={isGenerating}
 *   namespace="tools" // 工具组件中使用 tools 命名空间
 * />
 * ```
 */
export function ResolutionSelector({ model, value, onChange, disabled, namespace = 'editor' }: ResolutionSelectorProps) {
  const t = useTranslations(namespace)
  const availableResolutions = MODEL_CONFIGS[model].resolutions

  // 🔥 老王逻辑：自动切换分辨率（如果当前选择的分辨率不在可用列表中）
  // 注意：移除 onChange 依赖避免无限循环，只在 model 变化时检查
  useEffect(() => {
    if (!availableResolutions.includes(value)) {
      console.log(`⚠️ 分辨率自动切换: ${value} -> ${availableResolutions[0]}`)
      onChange(availableResolutions[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, value, availableResolutions])

  return (
    <div className="space-y-2">
      <Label>{t('resolutionLevel')}</Label>
      <Select
        value={value}
        onValueChange={(val) => onChange(val as ResolutionLevel)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableResolutions.map((res) => (
            <SelectItem key={res} value={res}>
              {res.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
