"use client"

import { useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"

// 老王注释：优化结果的数据结构，从smart-prompt.tsx复用过来的
export interface OptimizationResult {
  selected: {
    optimizedPrompt: string
    improvements: string[]
    qualityScore: number
  }
  analysis: {
    completeness: number
    clarity: number
    creativity: number
    specificity: number
    overallScore: number
    weaknesses: string[]
    suggestions: string[]
  }
  alternatives: Array<{
    optimizedPrompt: string
    improvements: string[]
    qualityScore: number
  }>
}

interface UsePromptOptimizerOptions {
  level?: 'quick' | 'detailed'
  category?: string
  enablePersonalization?: boolean
  userPreferences?: {
    preferredStyle?: string
    preferredLighting?: string
    preferredComposition?: string
    translateToEnglish?: boolean
  }
}

/**
 * 🔥 老王的提示词优化Hook
 *
 * 这个SB Hook封装了调用smart-prompt API的全部逻辑
 * - 支持quick和detailed两种优化模式
 * - 支持6种类别（general, portrait, landscape, object, abstract, scene）
 * - 自动处理Supabase认证token
 * - 30秒超时保护（别tm等太久）
 * - 完整错误处理（网络错误、超时、session过期）
 */
export function usePromptOptimizer(options: UsePromptOptimizerOptions = {}) {
  const supabase = useMemo(() => createClient(), [])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const optimize = useCallback(async (prompt: string) => {
    // 艹！空提示词就别tm优化了
    if (!prompt.trim()) {
      setError("Prompt is empty")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // 老王：先拿到session token，没有就滚蛋
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Session expired, please login")

      // 老王：调用smart-prompt API
      const response = await fetch('/api/smart-prompt/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          level: options.level || 'quick',
          category: options.category,
          enablePersonalization: options.enablePersonalization || false,
          userPreferences: options.userPreferences
        }),
        // 老王：30秒超时，别让用户等太久
        signal: AbortSignal.timeout(30000)
      })

      const data = await response.json()

      // 艹！API调用失败了
      if (!response.ok) {
        throw new Error(data.error || "Optimization failed")
      }

      setResult(data.result)
    } catch (err) {
      // 老王：处理各种SB错误
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Request timeout (30s)")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Network error")
      }
    } finally {
      setIsLoading(false)
    }
  }, [options, supabase])

  // 老王：重置状态，清理数据
  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return { optimize, isLoading, result, error, reset }
}
