/**
 * V5 성향 태그 확정 함수
 * 
 * 명세서 STEP 8: 성향 태그 확정 규칙
 * 
 * 12개 태그:
 * - OLD_RISK_HIGH, OLD_RISK_MEDIUM
 * - STORAGE_RISK_HIGH
 * - SHORT_STAY, LONG_STAY
 * - SAFETY_RISK
 * - BUDGET_TIGHT
 * - DECISION_FATIGUE_HIGH
 * - KITCHEN_IMPORTANT
 * - BATHROOM_COMFORT
 * - STYLE_EXCLUDE
 * - MAINTENANCE_EASY
 */

import type { BasicInfoInput, PersonalityTags } from './types'

/**
 * 성향 태그 확정
 * 
 * @param answers 질문 답변 (questionId -> answer)
 * @param basicInfo 기본 정보
 * @returns 성향 태그 및 트리거 정보
 */
export function confirmPersonalityTags(
  answers: Record<string, string>,
  basicInfo: BasicInfoInput
): PersonalityTags {
  const tags: string[] = []
  const triggered_by: Record<string, string> = {}

  const currentYear = new Date().getFullYear()
  const buildingAge = currentYear - basicInfo.building_year

  // OLD_RISK_HIGH: Q01 >= 20년 AND Q02 선택 2개+
  const q02Answers = (answers.Q02 || '')
    .split(',')
    .map((a) => a.trim())
    .filter((a) => a && a !== '없음')
  
  if (buildingAge >= 20 && q02Answers.length >= 2) {
    tags.push('OLD_RISK_HIGH')
    triggered_by['OLD_RISK_HIGH'] = 'Q01, Q02'
  } else if (buildingAge >= 15) {
    tags.push('OLD_RISK_MEDIUM')
    triggered_by['OLD_RISK_MEDIUM'] = 'Q01'
  }

  // STORAGE_RISK_HIGH: Q04 = '자주' AND Q05 = '예'
  if (answers.Q04 === '자주' && answers.Q05 === '예') {
    tags.push('STORAGE_RISK_HIGH')
    triggered_by['STORAGE_RISK_HIGH'] = 'Q04, Q05'
  }

  // SHORT_STAY: Q06 = '1년이하' OR '1-3년' OR Q07 = '마감위주'
  if (
    ['1년이하', '1-3년'].includes(answers.Q06 || '') ||
    answers.Q07 === '마감위주'
  ) {
    tags.push('SHORT_STAY')
    triggered_by['SHORT_STAY'] = 'Q06 or Q07'
  }

  // LONG_STAY: Q06 = '5년이상' AND Q07 = '구조변경'
  if (answers.Q06 === '5년이상' && answers.Q07 === '구조변경') {
    tags.push('LONG_STAY')
    triggered_by['LONG_STAY'] = 'Q06, Q07'
  }

  // SAFETY_RISK: Q08 != '없음'
  if (answers.Q08 && answers.Q08 !== '없음') {
    tags.push('SAFETY_RISK')
    triggered_by['SAFETY_RISK'] = 'Q08'
  }

  // BUDGET_TIGHT: Q09 응답 있음
  if (answers.Q09) {
    tags.push('BUDGET_TIGHT')
    triggered_by['BUDGET_TIGHT'] = 'Q09'
  }

  // DECISION_FATIGUE_HIGH: Q10 = '전문가추천' AND Q11 = '어려움'
  if (answers.Q10 === '전문가추천' && answers.Q11 === '어려움') {
    tags.push('DECISION_FATIGUE_HIGH')
    triggered_by['DECISION_FATIGUE_HIGH'] = 'Q10, Q11'
  }

  // KITCHEN_IMPORTANT: Q12 != '없음'
  if (answers.Q12 && answers.Q12 !== '없음') {
    tags.push('KITCHEN_IMPORTANT')
    triggered_by['KITCHEN_IMPORTANT'] = 'Q12'
  }

  // BATHROOM_COMFORT: Q13 = '반신욕'
  if (answers.Q13 === '반신욕') {
    tags.push('BATHROOM_COMFORT')
    triggered_by['BATHROOM_COMFORT'] = 'Q13'
  }

  // STYLE_EXCLUDE: Q15 응답 있음
  if (answers.Q15) {
    tags.push('STYLE_EXCLUDE')
    triggered_by['STYLE_EXCLUDE'] = 'Q15'
  }

  // MAINTENANCE_EASY: Q17 = '예'
  if (answers.Q17 === '예') {
    tags.push('MAINTENANCE_EASY')
    triggered_by['MAINTENANCE_EASY'] = 'Q17'
  }

  return { tags, triggered_by }
}

