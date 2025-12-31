/**
 * V5 성향 태그 확정 함수
 * 
 * Phase 3-1: confirmPersonalityTags 엔진 가드 강화
 * 
 * 명세서 STEP 8: 성향 태그 확정 규칙
 * 
 * ⚠️ 헌법 원칙:
 * - 점수 계산 금지
 * - 기본값 생성 금지
 * - 해석/추론/보정 로직 금지
 * - fallback 반환 금지
 * - 태그 기반 결정만 허용
 * - 누락 시 즉시 throw
 * - 동일 입력 → 동일 출력 100% 보장
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
import { V5ValidationError } from './error'
import { applyTagPriority } from './tag-rules'

/**
 * 성향 태그 확정
 * 
 * Phase 3-1: "태그 확정자" 역할
 * - 점수 계산 ❌
 * - 중요도 판단 ❌
 * - 추론 ❌
 * 
 * @param answers 질문 답변 (questionId -> answer)
 * @param basicInfo 기본 정보
 * @returns 성향 태그 및 트리거 정보
 * @throws {V5ValidationError} 입력 누락 또는 태그 0개 시
 */
export function confirmPersonalityTags(
  answers: Record<string, string>,
  basicInfo: BasicInfoInput
): PersonalityTags {
  // ⚠️ Phase 3-1 필수 가드 1: answers 비어 있음
  if (!answers || Object.keys(answers).length === 0) {
    return {
      tags: [],
      triggered_by: {},
    }
  }

  // ⚠️ Phase 3-1 필수 가드 2: basicInfo 누락
  if (!basicInfo) {
    throw new V5ValidationError('Basic input missing')
  }

  const tags: string[] = []
  const triggered_by: Record<string, string> = {}

  // ⚠️ V5 헌법 원칙: building_year는 선택 필드
  // building_year가 없으면 buildingAge 계산 불가 → OLD_RISK 태그 생성 불가
  const currentYear = new Date().getFullYear()
  const buildingAge = basicInfo.building_year !== undefined && basicInfo.building_year !== null
    ? currentYear - basicInfo.building_year
    : undefined

  // OLD_RISK_HIGH: Q01 >= 20년 AND Q02 선택 2개+
  // ⚠️ 헌법 원칙: 기본값 생성 금지 (|| '' 제거)
  // ⚠️ V5 헌법 원칙: building_year가 없으면 OLD_RISK 태그 생성 불가
  const q02Value = answers.Q02
  const q02Answers = q02Value
    ? q02Value
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a && a !== '없음')
    : []
  
  // buildingAge가 undefined면 OLD_RISK 태그 생성 불가 (해석/추론 금지)
  if (buildingAge !== undefined) {
    if (buildingAge >= 20 && q02Answers.length >= 2) {
      tags.push('OLD_RISK_HIGH')
      triggered_by['OLD_RISK_HIGH'] = 'Q01, Q02'
    } else if (buildingAge >= 15) {
      tags.push('OLD_RISK_MEDIUM')
      triggered_by['OLD_RISK_MEDIUM'] = 'Q01'
    }
  }

  // STORAGE_RISK_HIGH: Q04 = '자주' AND Q05 = '예'
  if (answers.Q04 === '자주' && answers.Q05 === '예') {
    tags.push('STORAGE_RISK_HIGH')
    triggered_by['STORAGE_RISK_HIGH'] = 'Q04, Q05'
  }

  // SHORT_STAY: Q06 = '1년이하' OR '1-3년' OR Q07 = '마감위주'
  // ⚠️ 헌법 원칙: 기본값 생성 금지 (|| '' 제거)
  const q06Value = answers.Q06
  if (
    (q06Value && ['1년이하', '1-3년'].includes(q06Value)) ||
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

  // ⚠️ Phase 3-1 필수 가드 4: 태그 0개
  if (tags.length === 0) {
    throw new V5ValidationError('No personality tags generated')
  }

  // ⚠️ Phase 3-1: 태그 우선순위 규칙 적용
  // 동일 속성 중복 매핑 시 우선순위 규칙 적용
  const prioritizedTags = applyTagPriority(tags)

  // triggered_by도 우선순위 적용된 태그에 맞게 필터링
  const prioritizedTriggeredBy: Record<string, string> = {}
  for (const tag of prioritizedTags) {
    if (triggered_by[tag]) {
      prioritizedTriggeredBy[tag] = triggered_by[tag]
    }
  }

  return { tags: prioritizedTags, triggered_by: prioritizedTriggeredBy }
}








