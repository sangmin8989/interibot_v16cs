/**
 * V5 가설 생성 함수
 * 
 * 명세서 STEP 2: AI 1차 성향 가설 생성
 * 규칙 기반 if-then 로직
 */

import type { BasicInfoInput, HypothesisResult } from './types'

/**
 * 평형 구간을 숫자로 변환
 */
function convertPyeongToNumber(range: string): number {
  switch (range) {
    case 'under10':
      return 8
    case '11to15':
      return 13
    case '16to25':
      return 20
    case '26to40':
      return 33
    case 'over40':
      return 45
    default:
      return 25
  }
}

/**
 * 가설 생성 함수
 * 
 * 명세서 규칙 그대로 구현:
 * - 노후 리스크: 준공연도 기반
 * - 수납 리스크: 평형 기반
 * - 단기 거주: 점유 형태 + 거주 계획
 * - 안전 리스크: 가족 구성
 * - 예산 리스크: 예산 + 평형
 * - 결정 피로: 예산 모름
 * - 주방 리스크: 요리 빈도
 * - 작업공간: 재택 근무
 */
export function generateHypothesis(input: BasicInfoInput): HypothesisResult {
  const currentYear = new Date().getFullYear()
  // ⚠️ V5 헌법 원칙: building_year는 선택 필드
  const buildingAge = input.building_year !== undefined && input.building_year !== null
    ? currentYear - input.building_year
    : undefined
  const pyeongNum = convertPyeongToNumber(input.pyeong_range)

  return {
    // 노후 리스크
    // ⚠️ V5 헌법 원칙: building_year가 없으면 'LOW' (해석/추론 금지)
    old_risk:
      buildingAge === undefined
        ? 'LOW'
        : buildingAge >= 20
          ? 'HIGH'
          : buildingAge >= 15
            ? 'MEDIUM'
            : 'LOW',

    // 수납 리스크
    storage_risk:
      pyeongNum <= 25
        ? 'HIGH'
        : pyeongNum <= 32
          ? 'MEDIUM'
          : 'LOW',

    // 단기 거주
    short_stay:
      input.ownership === 'monthly' &&
      (input.stay_plan === 'under1y' || input.stay_plan === '1to3y')
        ? 'HIGH'
        : input.ownership === 'jeonse' && input.stay_plan === 'under1y'
          ? 'MEDIUM'
          : 'LOW',

    // 안전 리스크
    safety_risk:
      input.family_type.includes('infant') || input.family_type.includes('elderly')
        ? 'HIGH'
        : input.family_type.includes('child')
          ? 'MEDIUM'
          : 'LOW',

    // 예산 리스크
    budget_risk:
      input.budget_range === 'under2000' && pyeongNum >= 25
        ? 'HIGH'
        : input.budget_range === 'unknown'
          ? 'MEDIUM'
          : 'LOW',

    // 결정 피로
    decision_fatigue:
      input.budget_range === 'unknown' ? 'MEDIUM' : 'LOW',

    // 주방 리스크
    kitchen_risk:
      input.cook_freq === 'daily'
        ? 'HIGH'
        : input.cook_freq === 'sometimes'
          ? 'MEDIUM'
          : 'LOW',

    // 작업공간
    workspace:
      input.remote_work === '3plus'
        ? 'HIGH'
        : input.remote_work === '1to2days'
          ? 'MEDIUM'
          : 'LOW',
  }
}








