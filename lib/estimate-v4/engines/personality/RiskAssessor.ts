/**
 * V4 RiskAssessor - 위험 평가기
 * 
 * V3 RiskEngine 래핑 + 후회위험 평가 확장
 */

import { RiskEngine } from '@/lib/analysis/engine-v3/engines/RiskEngine'
import type {
  TraitScoreV4,
  PreferencesV4,
  SpaceInfoV4,
  RiskAssessmentV4,
  ClassifiedTypesV4,
} from '../../types'
import { toV3Indicators, toV3RiskEngineInput } from '../../converters/input-converter'
import { toV4RiskAssessment, calculateBufferPercentage } from '../../converters/output-converter'
import { REGRET_RISK_CODES } from '../../converters/risk-mapper'
import { logger } from '../../utils/logger'
import { V3EngineError } from '../../errors'

/**
 * V3 RiskEngine 래핑 + 후회위험 평가 확장
 * 
 * 동기 버전: processResult 없이 기본 위험 평가만 수행
 */
export function assessRisk(
  scores: TraitScoreV4[],
  classifiedTypes: ClassifiedTypesV4,
  preferences: PreferencesV4,
  spaceInfo: SpaceInfoV4
): RiskAssessmentV4 {
  logger.debug('RiskAssessor', '위험 평가 시작 (동기)')

  // V4 신규: 후회위험 평가
  const regretRisks = assessRegretRisks(preferences, spaceInfo, classifiedTypes)

  // 기본 위험 점수 계산
  let totalScore = 20 // 기본값
  let level: 'low' | 'medium' | 'high' = 'low'

  // 후회위험 반영
  for (const risk of regretRisks) {
    const riskInfo = REGRET_RISK_CODES[risk as keyof typeof REGRET_RISK_CODES]
    if (riskInfo) {
      totalScore += riskInfo.bufferAdd * 5
    }
  }

  // 위험 수준 결정
  if (totalScore >= 50) level = 'high'
  else if (totalScore >= 30) level = 'medium'

  // 예비비 비율 계산
  const bufferPercentage = calculateBufferPercentage(level, regretRisks.length)

  return {
    totalScore,
    level,
    triggeredRisks: regretRisks,
    bufferPercentage,
  }
}

/**
 * V4 신규: 후회위험 평가
 * - 첫 인테리어, 빠듯한 예산, 스타일 미정 등
 */
function assessRegretRisks(
  preferences: PreferencesV4,
  spaceInfo: SpaceInfoV4,
  classifiedTypes: ClassifiedTypesV4
): string[] {
  const risks: string[] = []

  // 빠듯한 예산
  if (preferences.budget.flexibility === 'strict') {
    risks.push('tight_budget')
  }

  // 오래된 건물
  if (spaceInfo.buildingAge && spaceInfo.buildingAge >= 20) {
    risks.push('old_building')
  }

  // 대가족
  if (preferences.family.totalPeople >= 5) {
    risks.push('large_family')
  }

  // 공동 의사결정
  if (classifiedTypes.decision === 'joint') {
    risks.push('joint_decision')
  }

  return risks
}

/**
 * 비동기 버전 (ProcessEngine 결과 필요 시)
 */
export async function assessRiskAsync(
  scores: TraitScoreV4[],
  classifiedTypes: ClassifiedTypesV4,
  preferences: PreferencesV4,
  spaceInfo: SpaceInfoV4,
  processResult: any // ProcessEngineResult
): Promise<RiskAssessmentV4> {
  logger.debug('RiskAssessor', '비동기 위험 평가 시작')

  try {
    // 1. V3 RiskEngine 호출
    const v3Indicators = toV3Indicators(scores)
    const v3Input = toV3RiskEngineInput(v3Indicators, processResult, spaceInfo)

    const riskEngine = new RiskEngine()
    const v3Result = await logger.measure(
      'RiskAssessor',
      'V3 RiskEngine 호출',
      () => riskEngine.analyze(v3Input)
    )

    // 2. 후회위험 평가
    const regretRisks = assessRegretRisks(preferences, spaceInfo, classifiedTypes)

    // 3. 통합 결과
    const baseAssessment = toV4RiskAssessment(v3Result, regretRisks)

    return {
      totalScore: baseAssessment.totalScore ?? 20,
      level: baseAssessment.level ?? 'low',
      triggeredRisks: baseAssessment.triggeredRisks ?? [],
      bufferPercentage: baseAssessment.bufferPercentage ?? 5,
    }
  } catch (error) {
    logger.error('RiskAssessor', '비동기 위험 평가 실패', error)
    
    if (error instanceof Error) {
      throw new V3EngineError('RiskEngine', error)
    }
    
    // 기본값 반환
    return {
      totalScore: 20,
      level: 'low',
      triggeredRisks: [],
      bufferPercentage: 5,
    }
  }
}








