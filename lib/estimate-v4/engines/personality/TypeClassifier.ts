/**
 * V4 TypeClassifier - 타입 분류기
 * 
 * 성향 점수를 직관적인 타입으로 분류
 */

import type {
  TraitScoreV4,
  PreferencesV4,
  ClassifiedTypesV4,
} from '../../types'
import { logger } from '../../utils/logger'

/**
 * 타입 분류기
 * @param scores - 성향 점수 목록
 * @param preferences - 사용자 선호 설정
 * @returns 분류된 타입
 */
export function classifyTypes(
  scores: TraitScoreV4[],
  preferences: PreferencesV4
): ClassifiedTypesV4 {
  logger.debug('TypeClassifier', '타입 분류 시작')

  const lifestyle: string[] = []
  const family: string[] = []
  const personality: string[] = []

  // 점수를 맵으로 변환 (빠른 조회)
  const scoreMap = new Map<string, number>()
  for (const score of scores) {
    scoreMap.set(score.traitCode, score.score)
  }

  // 생활 유형 분류
  if (preferences.lifestyle.remoteWork) {
    lifestyle.push('remote_work')
  }
  if (preferences.lifestyle.cookOften) {
    lifestyle.push('cooking_focused')
  }
  if (preferences.lifestyle.guestsOften) {
    lifestyle.push('social_host')
  }

  // 가족 유형 분류
  if (preferences.family.hasInfant) {
    family.push('has_infant')
  }
  if (preferences.family.hasChild) {
    family.push('has_child')
  }
  if (preferences.family.hasElderly) {
    family.push('has_elderly')
  }
  if (preferences.family.hasPet) {
    family.push('has_pet')
  }

  // 성격 유형 분류
  const orgScore = scoreMap.get('organization_habit') ?? 5
  const storageScore = scoreMap.get('storage_importance') ?? 5
  const cleaningScore = scoreMap.get('cleaning_preference') ?? 5
  const noiseScore = scoreMap.get('noise_sensitivity') ?? 5
  const lightScore = scoreMap.get('light_importance') ?? 5

  if (orgScore >= 7 && cleaningScore >= 7) {
    personality.push('clean_oriented')
  }
  if (storageScore >= 7 && orgScore >= 7) {
    personality.push('storage_focused')
  }
  if (noiseScore >= 7) {
    personality.push('noise_sensitive')
  }
  if (lightScore >= 7) {
    personality.push('light_focused')
  }

  // 의사결정 유형 (기본값: solo)
  let decision: 'solo' | 'joint' | 'split' = 'solo'
  if (preferences.family.totalPeople >= 2) {
    decision = 'joint'
  }

  logger.debug('TypeClassifier', '타입 분류 완료', {
    lifestyleCount: lifestyle.length,
    familyCount: family.length,
    personalityCount: personality.length,
  })

  return {
    lifestyle,
    family,
    personality,
    decision,
  }
}

