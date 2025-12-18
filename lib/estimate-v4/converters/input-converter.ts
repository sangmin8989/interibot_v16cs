/**
 * V4 입력 → V3 입력 변환
 */

import type {
  CollectedInputV4,
  SpaceInfoV4,
  UserAnswerV4,
} from '../types'
import type {
  TraitEngineInput,
  RiskEngineInput,
  ProcessEngineInput,
} from '@/lib/analysis/engine-v3/types'
import type { TraitIndicators12 } from '@/lib/analysis/engine-v3/types'
import { V4_EN_TO_V3_KO } from './trait-mapper'
import type { TraitScoreV4 } from '../types'

/**
 * V4 SpaceInfo → V3 SpaceInfo 변환
 */
export function toV3SpaceInfo(spaceInfo: SpaceInfoV4) {
  return {
    housingType: spaceInfo.housingType,
    pyeong: spaceInfo.pyeong,
    rooms: spaceInfo.rooms,
    bathrooms: spaceInfo.bathrooms,
    buildingAge: spaceInfo.buildingAge ?? 0,
    floor: spaceInfo.floor,
  }
}

/**
 * V4 입력 → V3 TraitEngine 입력 변환
 */
export function toV3TraitEngineInput(
  input: CollectedInputV4
): TraitEngineInput {
  // V4 answers 배열을 V3 Record 형식으로 변환
  const answers: Record<string, string> = {}
  for (const answer of input.answers) {
    // answerId를 문자열로 변환
    answers[answer.questionId] = String(answer.answerId)
  }

  return {
    answers,
    spaceInfo: toV3SpaceInfo(input.spaceInfo),
  }
}

/**
 * V4 TraitScoreV4[] → V3 TraitIndicators12 변환 (한글 키)
 * 
 * V3는 한글 키를 사용하므로 반드시 변환 필요
 */
export function toV3Indicators(scores: TraitScoreV4[]): TraitIndicators12 {
  const result: Record<string, number> = {}

  for (const score of scores) {
    // V4 영문 키 → V3 한글 키로 변환
    const v3Key = V4_EN_TO_V3_KO[score.traitCode]
    if (v3Key) {
      // V3는 0-100 범위, V4는 1-10 범위이므로 변환 필요
      // V4 score (1-10) → V3 (0-100): score * 10
      result[v3Key] = score.score * 10
    }
  }

  // 누락된 필드는 기본값 50 (V3 한글 키로)
  const requiredKoFields = [
    '수납중요도',
    '동선중요도',
    '조명취향',
    '소음민감도',
    '관리민감도',
    '스타일고집도',
    '색감취향',
    '가족영향도',
    '반려동물영향도',
    '예산탄력성',
    '공사복잡도수용성',
    '집값방어의식',
  ]

  for (const field of requiredKoFields) {
    if (!(field in result)) {
      result[field] = 50 // V3 기본값
    }
  }

  return result as TraitIndicators12
}

/**
 * V4 입력 → V3 RiskEngine 입력 변환
 * 
 * 주의: RiskEngine은 adjustedIndicators와 processResult를 필요로 함
 * 따라서 TraitEngine과 ProcessEngine 실행 후에만 호출 가능
 */
export function toV3RiskEngineInput(
  adjustedIndicators: TraitIndicators12,
  processResult: any, // ProcessEngineResult
  spaceInfo: SpaceInfoV4
): RiskEngineInput {
  return {
    adjustedIndicators,
    processResult,
    spaceInfo: toV3SpaceInfo(spaceInfo),
  }
}

/**
 * V4 입력 → V3 ProcessEngine 입력 변환
 * 
 * 주의: ProcessEngine은 traitResult를 필요로 함
 * 따라서 TraitEngine 실행 후에만 호출 가능
 */
export function toV3ProcessEngineInput(
  traitResult: any, // TraitEngineResult
  selectedSpaces: string[],
  budget: { min: number; max: number; flexibility: string }
): ProcessEngineInput {
  return {
    traitResult,
    selectedSpaces,
    budget: budget.flexibility as 'low' | 'medium' | 'high' | 'premium',
  }
}

