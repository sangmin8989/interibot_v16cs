/**
 * V5 입력 변환 유틸리티
 * 
 * SpaceInfo (현재 시스템) → BasicInfoInput (V5 명세서) 변환
 */

import type { SpaceInfo } from '@/lib/store/spaceInfoStore'
import type { BasicInfoInput } from './types'

/**
 * HousingTypeLabel → V5 housing_type 변환
 */
function convertHousingType(
  housingType: SpaceInfo['housingType']
): BasicInfoInput['housing_type'] {
  switch (housingType) {
    case '아파트':
      return 'apartment'
    case '빌라':
      return 'villa'
    case '오피스텔':
      return 'officetel'
    case '단독주택':
      return 'detached'
    default:
      return 'apartment'
  }
}

/**
 * 평수를 구간으로 변환
 */
function convertPyeongToRange(pyeong: number): BasicInfoInput['pyeong_range'] {
  if (pyeong <= 10) return 'under10'
  if (pyeong <= 15) return '11to15'
  if (pyeong <= 25) return '16to25'
  if (pyeong <= 40) return '26to40'
  return 'over40'
}

/**
 * 점유 형태 변환
 */
function convertOwnership(
  ownership?: string | null
): BasicInfoInput['ownership'] {
  // ⚠️ 헌법 원칙 2: 기본값 생성 금지
  // ownership이 없으면 undefined 반환
  if (!ownership) {
    return undefined
  }
  // 타입 체크
  if (ownership === 'owned' || ownership === 'jeonse' || ownership === 'monthly') {
    return ownership
  }
  return undefined
}

/**
 * 거주 계획 변환
 */
function convertStayPlan(
  stayPlan?: string | null,
  livingYears?: number
): BasicInfoInput['stay_plan'] {
  // 타입 체크
  if (stayPlan === 'under1y' || stayPlan === '1to3y' || stayPlan === '3to5y' || stayPlan === 'over5y' || stayPlan === 'unknown') {
    return stayPlan
  }

  // livingYears 기반 변환
  if (livingYears !== undefined) {
    if (livingYears <= 1) return 'under1y'
    if (livingYears <= 3) return '1to3y'
    if (livingYears <= 5) return '3to5y'
    if (livingYears > 5) return 'over5y'
  }

  return 'unknown'
}

/**
 * 가족 구성 변환
 */
function convertFamilyType(
  ageRanges?: string[],
  lifestyleTags?: string[]
): BasicInfoInput['family_type'] {
  const familyType: BasicInfoInput['family_type'] = []

  // ageRanges 변환
  if (ageRanges) {
    if (ageRanges.includes('baby')) familyType.push('infant')
    if (ageRanges.includes('child')) familyType.push('child')
    if (ageRanges.includes('teen')) familyType.push('teen')
    if (ageRanges.includes('adult')) familyType.push('adult')
    if (ageRanges.includes('senior')) familyType.push('elderly')
  }

  // lifestyleTags 변환
  if (lifestyleTags) {
    if (lifestyleTags.includes('hasPets')) familyType.push('pet')
  }

  return familyType.length > 0 ? familyType : ['adult']
}

/**
 * 예산 구간 변환
 */
function convertBudgetRange(
  budget?: string,
  budgetAmount?: number
): BasicInfoInput['budget_range'] {
  if (budgetAmount !== undefined) {
    if (budgetAmount <= 2000) return 'under2000'
    if (budgetAmount <= 4000) return '2000to4000'
    if (budgetAmount <= 6000) return '4000to6000'
    return 'over6000'
  }

  // budget 문자열 기반 변환
  if (budget === 'unknown' || !budget) return 'unknown'
  if (budget.includes('2000') || budget.includes('2000만')) return 'under2000'
  if (budget.includes('4000') || budget.includes('4000만')) return '2000to4000'
  if (budget.includes('6000') || budget.includes('6000만')) return '4000to6000'
  if (budget.includes('6000') || budget.includes('6000만 이상')) return 'over6000'

  return 'unknown'
}

/**
 * 공사 목적 변환
 */
function convertPurpose(
  purpose?: string | null,
  livingPurpose?: SpaceInfo['livingPurpose']
): BasicInfoInput['purpose'] | undefined {
  // 타입 체크 및 변환
  if (purpose === 'live') return 'live';
  if (purpose === 'sell') return 'sell';
  if (purpose === 'rent') return 'rent';
  if (purpose === 'residence') return 'live';   // 역매핑
  if (purpose === 'sale') return 'sell';        // 역매핑

  // livingPurpose 기반 변환
  if (livingPurpose === '실거주') return 'live'
  if (livingPurpose === '매도준비') return 'sell'
  if (livingPurpose === '임대') return 'rent'

  return undefined
}

/**
 * 재택 근무 변환
 */
function convertRemoteWork(
  remoteWork?: string | null,
  lifestyleTags?: string[]
): BasicInfoInput['remote_work'] | undefined {
  // 타입 체크
  if (remoteWork === 'none' || remoteWork === '1to2days' || remoteWork === '3plus') {
    return remoteWork
  }

  // lifestyleTags 기반 추론
  if (lifestyleTags?.includes('remoteWork')) return '3plus'
  if (lifestyleTags?.includes('partTimeRemote')) return '1to2days'

  return undefined
}

/**
 * SpaceInfo → BasicInfoInput 변환
 */
export function convertSpaceInfoToBasicInput(
  spaceInfo: SpaceInfo
): BasicInfoInput {
  return {
    housing_type: convertHousingType(spaceInfo.housingType),
    pyeong_range: convertPyeongToRange(spaceInfo.pyeong),
    // ⚠️ V5 헌법 원칙: 기본값 생성 금지, 해석/추론 금지
    // buildingYear가 없으면 undefined 반환 (있는 것만 전달)
    building_year: spaceInfo.buildingYear ?? undefined,
    ownership: convertOwnership(spaceInfo.ownership),
    stay_plan: convertStayPlan(spaceInfo.stayPlan, spaceInfo.livingYears),
    family_type: convertFamilyType(spaceInfo.ageRanges, spaceInfo.lifestyleTags),
    budget_range: convertBudgetRange(spaceInfo.budget, spaceInfo.budgetAmount),
    purpose: convertPurpose(undefined, spaceInfo.livingPurpose),
    remote_work: convertRemoteWork(undefined, spaceInfo.lifestyleTags),
    cook_freq: spaceInfo.cookFreq === null ? undefined : spaceInfo.cookFreq,
  }
}








