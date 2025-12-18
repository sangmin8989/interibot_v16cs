/**
 * V3 엔진 점수 검증 유틸리티
 * 성향 지표 점수의 범위를 검증하고 정규화합니다.
 */

import { TraitIndicators12 } from '../types'

/**
 * 성향 지표 범위 검증 (0-100)
 */
export function validateIndicatorRange(
  indicator: keyof TraitIndicators12,
  value: number
): number {
  const min = 0
  const max = 100
  
  if (value < min) {
    console.warn(`[ScoreValidator] ${indicator} 값이 최소값보다 낮음: ${value} → ${min}`)
    return min
  }
  
  if (value > max) {
    console.warn(`[ScoreValidator] ${indicator} 값이 최대값보다 높음: ${value} → ${max}`)
    return max
  }
  
  return Math.round(value)
}

/**
 * 모든 지표 검증
 */
export function validateAllIndicators(
  indicators: TraitIndicators12
): TraitIndicators12 {
  const validated: any = {}
  
  for (const [key, value] of Object.entries(indicators)) {
    validated[key] = validateIndicatorRange(key as keyof TraitIndicators12, value)
  }
  
  return validated as TraitIndicators12
}

/**
 * 영향 강도를 점수로 변환
 */
export function impactToValue(change: 'small' | 'medium' | 'large' | 'very_large'): number {
  const mapping = {
    small: 10,
    medium: 15,
    large: 20,
    very_large: 25
  }
  return mapping[change] || 0
}

/**
 * 점수를 해석 레벨로 변환 (low/medium/high)
 */
export function scoreToLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 34) return 'low'
  if (score < 67) return 'medium'
  return 'high'
}

/**
 * 초기 성향 지표 생성 (모두 50점 기본값)
 */
export function createDefaultIndicators(): TraitIndicators12 {
  return {
    수납중요도: 50,
    동선중요도: 50,
    조명취향: 50,
    소음민감도: 50,
    관리민감도: 50,
    스타일고집도: 50,
    색감취향: 50,
    가족영향도: 50,
    반려동물영향도: 0,  // 기본값 0 (없는 경우)
    예산탄력성: 50,
    공사복잡도수용성: 50,
    집값방어의식: 50
  }
}

/**
 * 점수 차이 계산 (디버깅용)
 */
export function calculateIndicatorDiff(
  before: TraitIndicators12,
  after: TraitIndicators12
): Partial<Record<keyof TraitIndicators12, number>> {
  const diff: any = {}
  
  for (const key of Object.keys(before) as Array<keyof TraitIndicators12>) {
    const change = after[key] - before[key]
    if (change !== 0) {
      diff[key] = change
    }
  }
  
  return diff
}

/**
 * 상위 N개 지표 추출
 */
export function getTopIndicators(
  indicators: TraitIndicators12,
  count: number = 3
): Array<{ indicator: keyof TraitIndicators12; score: number }> {
  const entries = Object.entries(indicators) as Array<[keyof TraitIndicators12, number]>
  
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([indicator, score]) => ({ indicator, score }))
}





















