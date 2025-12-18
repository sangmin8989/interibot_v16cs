/**
 * V4 GradeSelector - 등급 선택기
 * 
 * 성향과 예산에 맞는 등급 선택
 */

import type { PersonalityResultV4, PreferencesV4, GradeV4 } from '../../types'
import { GRADE_INFO } from '../../converters/grade-mapper'
import { logger } from '../../utils/logger'

/**
 * 등급 선택기
 * @param personality - 성향 분석 결과
 * @param preferences - 사용자 선호
 * @returns 추천 등급과 이유
 */
export function selectGrade(
  personality: PersonalityResultV4,
  preferences: PreferencesV4
): { grade: GradeV4; reason: string } {
  logger.debug('GradeSelector', '등급 선택 시작')

  const { budget, purpose } = preferences
  const { traitScores, classifiedTypes } = personality

  // 1. 예산 기준 초기 등급 결정
  const budgetPerPyeong = budget.max / 32 // 평균 32평 기준
  let grade: GradeV4 = 'ARGEN_S' // 기본값
  let reason = ''

  if (budgetPerPyeong < 1000000) {
    grade = 'ARGEN_E'
    reason = '예산 기준 에센셜 등급 추천'
  } else if (budgetPerPyeong < 1500000) {
    grade = 'ARGEN_S'
    reason = '예산 기준 스탠다드 등급 추천'
  } else {
    grade = 'ARGEN_O'
    reason = '예산 기준 오퍼스 등급 추천'
  }

  // 2. 성향 조정
  const cleaningScore = getTraitScore(traitScores, 'cleaning_preference')
  const orgScore = getTraitScore(traitScores, 'organization_habit')

  // 청결/정리 성향 높으면 업그레이드 고려
  if (
    cleaningScore >= 8 &&
    orgScore >= 8 &&
    budget.flexibility !== 'strict'
  ) {
    if (grade === 'ARGEN_E') {
      grade = 'ARGEN_S'
      reason = '청결/정리 성향 반영하여 스탠다드로 업그레이드'
    } else if (grade === 'ARGEN_S') {
      grade = 'ARGEN_O'
      reason = '청결/정리 성향 반영하여 오퍼스로 업그레이드'
    }
  }

  // 3. 목적 조정
  if (purpose === 'sell' && grade === 'ARGEN_E') {
    grade = 'ARGEN_S'
    reason = '매도 목적으로 스탠다드 이상 추천'
  }

  logger.debug('GradeSelector', '등급 선택 완료', { grade, reason })

  return { grade, reason }
}

function getTraitScore(
  scores: PersonalityResultV4['traitScores'],
  code: string
): number {
  return scores.find(s => s.traitCode === code)?.score ?? 5
}

