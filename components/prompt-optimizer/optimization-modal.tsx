"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Sparkles, TrendingUp } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import type { OptimizationResult } from "@/hooks/use-prompt-optimizer"

interface PromptOptimizationModalProps {
  open: boolean
  onClose: () => void
  result: OptimizationResult | null
  onApply: (optimizedPrompt: string) => void
  originalScore?: number // 可选：原始提示词评分
}

/**
 * 🔥 老王的提示词优化弹窗组件
 *
 * 这个SB Modal展示优化结果，包括：
 * - 质量评分对比（原始 vs 优化后）
 * - 4维度分析（完整性、清晰度、创意性、具体性）
 * - 改进建议列表
 * - 方案选择器（主推荐 + 备选方案）
 */
export function PromptOptimizationModal({
  open,
  onClose,
  result,
  onApply,
  originalScore = 0
}: PromptOptimizationModalProps) {
  const { t } = useLanguage()
  const [selectedOption, setSelectedOption] = useState<string>("main")

  // 艹！没有结果就别tm显示了
  if (!result) return null

  const { selected, analysis, alternatives } = result

  // 老王：处理应用选中的方案
  const handleApply = () => {
    let promptToApply: string

    if (selectedOption === "main") {
      promptToApply = selected.optimizedPrompt
    } else {
      const altIndex = parseInt(selectedOption.replace("alt-", ""))
      promptToApply = alternatives[altIndex]?.optimizedPrompt || selected.optimizedPrompt
    }

    onApply(promptToApply)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {t("promptOptimizer.modal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("promptOptimizer.modal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 老王：质量评分对比卡片 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-2">
                {t("promptOptimizer.modal.originalScore")}
              </div>
              <div className="text-3xl font-bold text-orange-500">
                {originalScore || analysis.overallScore - 20}
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {t("promptOptimizer.modal.optimizedScore")}
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {selected.qualityScore}
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
          </div>

          {/* 老王：4维度质量分析 */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              📈 {t("promptOptimizer.modal.analysis")}
            </h4>
            <div className="space-y-3">
              {[
                { key: "completeness", value: analysis.completeness },
                { key: "clarity", value: analysis.clarity },
                { key: "creativity", value: analysis.creativity },
                { key: "specificity", value: analysis.specificity },
              ].map(({ key, value }) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t(`promptOptimizer.modal.${key}`)}
                    </span>
                    <span className="font-medium">{value}</span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* 老王：改进建议列表 */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              ✅ {t("promptOptimizer.modal.improvements")}
            </h4>
            <ul className="space-y-1">
              {selected.improvements.map((improvement, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 老王：方案选择器（主推荐 + 备选方案） */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              🎯 {t("promptOptimizer.modal.selectOption")}
            </h4>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {/* 主推荐方案 */}
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="main" id="main" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="main" className="cursor-pointer font-medium">
                      {t("promptOptimizer.modal.mainOption")}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {t("promptOptimizer.modal.score")}: {selected.qualityScore}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {selected.optimizedPrompt}
                  </p>
                </div>
              </div>

              {/* 备选方案 */}
              {alternatives.map((alt, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <RadioGroupItem value={`alt-${idx}`} id={`alt-${idx}`} className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`alt-${idx}`} className="cursor-pointer font-medium">
                        {t("promptOptimizer.modal.alternative")} {idx + 1}
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        {t("promptOptimizer.modal.score")}: {alt.qualityScore}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {alt.optimizedPrompt}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleApply} className="bg-gradient-to-r from-purple-500 to-blue-500">
            <Sparkles className="w-4 h-4 mr-2" />
            {t("promptOptimizer.modal.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
