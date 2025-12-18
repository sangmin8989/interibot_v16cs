/**
 * V3 출력 → V4 출력 변환
 */

import type { TraitScoreV4, RiskAssessmentV4, ProcessStrategyItemV4 } from '../types'
import type {
  TraitEngineResult,
  RiskEngineResult,
  ProcessEngineResult,
} from '@/lib/analysis/engine-v3/types'
import type { TraitIndicators12 } from '@/lib/analysis/engine-v3/types'
import { V3_KO_TO_V4_EN, PROCESS_TO_V3_TRAIT_MAP } from './trait-mapper'
import { RISK_SEVERITY_MAP } from './risk-mapper'
import type { PersonalityResultV4 } from '../types'

/**
 * V3 TraitEngineOutput → V4 TraitScoreV4[] 변환
 * 
 * V3 결과는 한글 키이므로 영문 키로 변환
 */
export function toV4TraitScores(
  v3Result: TraitEngineResult
): TraitScoreV4[] {
  const { indicators, priorityAreas } = v3Result
  const confidence = priorityAreas.length > 0 ? 0.85 : 0.7

  return Object.entries(indicators).map(([koKey, score]) => {
    // V3 한글 키 → V4 영문 키로 변환
    const enKey = V3_KO_TO_V4_EN[koKey] ?? koKey

    // V3는 0-100 범위, V4는 1-10 범위이므로 변환 필요
    // V3 score (0-100) → V4 (1-10): Math.round(score / 10) 또는 score / 10
    const v4Score = Math.max(1, Math.min(10, Math.round(score / 10)))

    return {
      traitCode: enKey,
      score: v4Score,
      confidence,
    }
  })
}

/**
 * V3 RiskEngineOutput → V4 RiskAssessmentV4 변환 (기본)
 */
export function toV4RiskAssessment(
  v3Result: RiskEngineResult,
  additionalRisks: string[] = []
): Partial<RiskAssessmentV4> {
  const severityScore = v3Result.risks.length > 0
    ? RISK_SEVERITY_MAP[v3Result.risks[0].level] ?? 20
    : 10

  const totalScore = severityScore + v3Result.risks.length * 10

  // 위험 수준 결정
  let level: 'low' | 'medium' | 'high' = 'low'
  if (totalScore >= 50) level = 'high'
  else if (totalScore >= 25) level = 'medium'

  return {
    totalScore,
    level,
    triggeredRisks: [
      ...v3Result.risks.map(r => r.id),
      ...additionalRisks,
    ],
    bufferPercentage: calculateBufferPercentage(level, additionalRisks.length),
  }
}

/**
 * 예비비 비율 계산
 */
export function calculateBufferPercentage(
  level: 'low' | 'medium' | 'high',
  additionalRiskCount: number
): number {
  let base = 5 // 기본 5%

  // V3 심각도 반영
  if (level === 'medium') base += 3
  if (level === 'high') base += 5

  // 추가 위험 반영
  base += additionalRiskCount * 2

  return Math.min(base, 20) // 최대 20%
}

/**
 * V3 ProcessEngineOutput → V4 ProcessStrategyItemV4[] 변환
 */
export function toV4ProcessStrategy(
  v3Result: ProcessEngineResult,
  personality: PersonalityResultV4
): ProcessStrategyItemV4[] {
  return v3Result.recommendedProcesses.map(proc => ({
    processId: proc.id,
    priority: mapV3Priority(proc.priority),
    reason: proc.reason ?? '',
    personalityMatch: calculatePersonalityMatch(proc.id, personality),
  }))
}

/**
 * V3 우선순위 → V4 우선순위 매핑
 */
function mapV3Priority(
  v3Priority: 'essential' | 'recommended' | 'optional' | string | number
): 'must' | 'recommended' | 'optional' {
  if (typeof v3Priority === 'number') {
    if (v3Priority >= 8) return 'must'
    if (v3Priority >= 5) return 'recommended'
    return 'optional'
  }

  const priorityMap: Record<string, 'must' | 'recommended' | 'optional'> = {
    'essential': 'must',
    'recommended': 'recommended',
    'optional': 'optional',
    'high': 'must',
    'medium': 'recommended',
    'low': 'optional',
    'required': 'must',
    'suggested': 'recommended',
  }

  return priorityMap[v3Priority] ?? 'optional'
}

/**
 * 성향 매칭도 계산 (V3 한글 키 기반)
 */
function calculatePersonalityMatch(
  processId: string,
  personality: PersonalityResultV4
): number {
  const { traitScores } = personality

  // 공정 → V3 한글 키 매핑
  const relatedV3Keys = PROCESS_TO_V3_TRAIT_MAP[processId] || []
  if (relatedV3Keys.length === 0) return 0.5

  // V3 한글 키에 해당하는 V4 영문 키 찾기
  const relatedEnKeys = relatedV3Keys
    .map(koKey => {
      // V3 한글 키 → V4 영문 키 변환
      for (const [en, ko] of Object.entries(V3_KO_TO_V4_EN)) {
        if (ko === koKey) return en
      }
      return null
    })
    .filter(Boolean) as string[]

  // 관련 성향 점수 평균
  const relevantScores = traitScores
    .filter(t => relatedEnKeys.includes(t.traitCode))
    .map(t => t.score)

  if (relevantScores.length === 0) return 0.5

  const avgScore = relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length
  return avgScore / 10 // 0-1 범위로 정규화
}

