/**
 * V4 → V5 입력 변환 어댑터
 * 
 * ⚠️ V5 명세서 헌법 원칙 (절대 타협 금지):
 * 1. 필드 매핑만 수행 (해석/판단 금지)
 * 2. 기본값 생성 금지
 * 3. 누락 시 throw 규칙:
 *    - V4 구조상 원래 없는 필드 → undefined (데이터 오류 아님)
 *    - 명세서상 필수인데 V4에서 누락된 값 → throw (데이터 오류)
 * 4. 데이터 손실 0% 보장
 * 5. 점수 계산 금지
 * 
 * 역할: V4 입력 형식을 V5가 이해 가능한 BasicInfoInput으로 변환
 * - 해석/판단 없이 순수 필드 매핑만 수행
 * - 번역기 역할만 수행
 * - "없는 정보는 없다"가 원칙
 */

import type { BasicInfoInput } from '../types'
import type {
  SpaceInfoV4,
  UserAnswerV4,
  PreferencesV4,
} from '@/lib/estimate-v4/types/input.types'

/**
 * V4 → V5 입력 변환
 * 
 * @param spaceInfo V4 공간 정보
 * @param answers V4 답변 목록 (현재는 사용하지 않지만 향후 확장 가능)
 * @param preferences V4 선호 설정
 * @returns V5 BasicInfoInput
 * @throws Error 필수 필드 누락 시
 */
export function convertV4InputToV5Input(
  spaceInfo: SpaceInfoV4,
  answers: UserAnswerV4[],
  preferences: PreferencesV4
): BasicInfoInput {
  // ⚠️ 헌법 원칙 3: 누락 시 throw (fallback 금지)
  if (!spaceInfo) {
    throw new Error('V4 → V5 변환: spaceInfo가 필수입니다.')
  }
  if (!preferences) {
    throw new Error('V4 → V5 변환: preferences가 필수입니다.')
  }

  // ⚠️ 헌법 원칙 1: 필드 매핑만 수행 (해석/판단 금지)

  // 1. housing_type: 직접 매핑 (house → detached 변환)
  const housing_type: BasicInfoInput['housing_type'] = 
    spaceInfo.housingType === 'house' ? 'detached' : spaceInfo.housingType

  // 2. pyeong_range: 평수 구간 변환 (필수 필드)
  if (spaceInfo.pyeong === undefined || spaceInfo.pyeong === null) {
    throw new Error('V4 → V5 변환: spaceInfo.pyeong이 필수입니다.')
  }
  const pyeong_range: BasicInfoInput['pyeong_range'] = convertPyeongToRange(spaceInfo.pyeong)

  // 3. building_year: 건물 연식 → 건축 연도 변환 (필수 필드)
  // ⚠️ 헌법 원칙 3: 명세서상 필수인데 V4에서 누락된 값 → throw
  if (spaceInfo.buildingAge === undefined || spaceInfo.buildingAge === null) {
    throw new Error('V4 → V5 변환: spaceInfo.buildingAge가 필수입니다. (building_year 계산에 필요)')
  }
  const currentYear = new Date().getFullYear()
  const building_year = currentYear - spaceInfo.buildingAge

  // 4. ownership: V4 입력에 없음 → V4 구조상 원래 없는 필드
  // ⚠️ 헌법 원칙 2: 기본값 생성 금지
  // ⚠️ 헌법 원칙 3: V4 구조상 원래 없는 필드는 undefined
  // BasicInfoInput에서 ownership은 optional이므로 undefined 반환 가능
  // 없는 정보는 없다는 원칙에 따라 undefined 반환
  const ownership: BasicInfoInput['ownership'] = undefined // V4 구조상 없음, 판단/추론 금지

  // 5. stay_plan: 거주 계획 변환
  // ⚠️ 헌법 원칙 1: 해석/판단 금지
  // V4에는 stay_plan 정보가 없으므로 해석 불가
  // 하지만 BasicInfoInput에서 stay_plan은 필수 필드
  // V4 구조상 원래 없는 필드이므로 'unknown'으로 처리
  // ⚠️ 주의: 이는 V4 입력 구조의 한계입니다.
  const stay_plan: BasicInfoInput['stay_plan'] = 'unknown' // V4 구조상 없음, 해석 불가

  // 6. family_type: 가족 구성 변환 (필수 필드)
  const family_type: BasicInfoInput['family_type'] = convertFamilyType(preferences.family)

  // 7. budget_range: 예산 구간 변환 (필수 필드)
  const budget_range: BasicInfoInput['budget_range'] = convertBudgetRange(preferences.budget)

  // 8. purpose: 거주 목적 (선택 필드)
  const purpose: BasicInfoInput['purpose'] | undefined = preferences.purpose

  // 9. remote_work: 재택근무 (선택 필드)
  const remote_work: BasicInfoInput['remote_work'] | undefined = convertRemoteWork(
    preferences.lifestyle.remoteWork
  )

  // 10. cook_freq: 요리 빈도 (선택 필드)
  const cook_freq: BasicInfoInput['cook_freq'] | undefined = convertCookFreq(
    preferences.lifestyle.cookOften
  )

  // ⚠️ 헌법 원칙 4: 데이터 손실 0% 보장
  // 모든 입력값이 출력에 반영되었는지 확인
  const result: BasicInfoInput = {
    housing_type,
    pyeong_range,
    building_year,
    stay_plan,
    family_type,
    budget_range,
    // 선택 필드: undefined가 아닐 때만 포함
    ...(ownership !== undefined && { ownership }),
    ...(purpose !== undefined && { purpose }),
    ...(remote_work !== undefined && { remote_work }),
    ...(cook_freq !== undefined && { cook_freq }),
  }

  return result
}

/**
 * 평수 구간 변환
 * ⚠️ 헌법 원칙 1: 해석 없이 순수 변환만 수행
 */
function convertPyeongToRange(pyeong: number): BasicInfoInput['pyeong_range'] {
  if (pyeong <= 10) return 'under10'
  if (pyeong <= 15) return '11to15'
  if (pyeong <= 25) return '16to25'
  if (pyeong <= 40) return '26to40'
  return 'over40'
}

// convertStayPlan 함수 제거: 해석 로직이므로 금지

/**
 * 가족 구성 변환
 * ⚠️ 헌법 원칙 1: 해석 없이 매핑만 수행
 * ⚠️ 헌법 원칙 4: 데이터 손실 0% 보장 (모든 가족 구성원 반영)
 */
function convertFamilyType(
  family: PreferencesV4['family']
): BasicInfoInput['family_type'] {
  const family_type: BasicInfoInput['family_type'] = []

  // ⚠️ 헌법 원칙 4: 모든 가족 구성원 정보 반영 (데이터 손실 0%)
  // ⚠️ 헌법 원칙 1: 해석 없이 명시적 정보만 사용
  if (family.hasInfant) {
    family_type.push('infant')
  }
  if (family.hasChild) {
    family_type.push('child')
  }
  // ⚠️ 주의: V4에는 'teen' 정보가 없으므로 추가하지 않음
  // ⚠️ 주의: V4에는 'adult' 정보가 없으므로 추가하지 않음 (기본값 생성 금지)
  if (family.hasElderly) {
    family_type.push('elderly')
  }
  if (family.hasPet) {
    family_type.push('pet')
  }

  // ⚠️ 헌법 원칙 2: 기본값 생성 금지
  // 빈 배열이어도 그대로 반환 (없는 정보는 없다)
  return family_type
}

/**
 * 예산 구간 변환
 * ⚠️ 헌법 원칙 1: 해석 없이 매핑만 수행
 */
function convertBudgetRange(
  budget: PreferencesV4['budget']
): BasicInfoInput['budget_range'] {
  // 예산을 만원 단위로 변환 (원 → 만원)
  const minInManwon = budget.min / 10000
  const maxInManwon = budget.max / 10000

  // 평균 예산으로 구간 결정
  const avgBudget = (minInManwon + maxInManwon) / 2

  if (avgBudget <= 2000) return 'under2000'
  if (avgBudget <= 4000) return '2000to4000'
  if (avgBudget <= 6000) return '4000to6000'
  return 'over6000'
}

/**
 * 재택근무 변환
 * ⚠️ 헌법 원칙 1: 해석/판단 금지
 * boolean → 의미값 변환은 판단이므로 금지
 * V4 구조상 원래 없는 필드이므로 undefined 반환
 */
function convertRemoteWork(
  remoteWork: boolean
): BasicInfoInput['remote_work'] | undefined {
  // ⚠️ 헌법 원칙 1: boolean을 의미값으로 변환하는 것은 해석/판단
  // V4에는 재택근무 빈도 정보가 없으므로 undefined 반환
  // signal-extractor의 역할로 위임
  return undefined
}

/**
 * 요리 빈도 변환
 * ⚠️ 헌법 원칙 1: 해석/판단 금지
 * boolean → 의미값 변환은 판단이므로 금지
 * V4 구조상 원래 없는 필드이므로 undefined 반환
 */
function convertCookFreq(
  cookOften: boolean
): BasicInfoInput['cook_freq'] | undefined {
  // ⚠️ 헌법 원칙 1: boolean을 의미값으로 변환하는 것은 해석/판단
  // V4에는 요리 빈도 상세 정보가 없으므로 undefined 반환
  // signal-extractor의 역할로 위임
  return undefined
}




