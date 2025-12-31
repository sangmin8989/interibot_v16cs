/**
 * Phase 6: 입력 무결성 가드
 * 
 * ⚠️ 절대 원칙:
 * - 필수 필드 누락 시 즉시 throw
 * - 기본값 생성 절대 금지
 * - 해석/추론 금지
 * - 재현성 보장
 */

import type { SpaceInfo } from '@/lib/store/spaceInfoStore'
import type { BasicInfoInput } from '../types'

/**
 * V5 입력 타입
 */
export interface V5Input {
  basicInfo: BasicInfoInput
  answers: Record<string, string>
  spaceInfo?: SpaceInfo // 원본 SpaceInfo (참고용)
}

/**
 * 입력 무결성 검증
 * 
 * ⚠️ 절대 원칙:
 * - 필수 필드 누락 시 즉시 throw
 * - 기본값 생성 절대 금지
 * 
 * @param input V5 입력
 * @throws Error 필수 필드 누락 시
 */
export function assertV5InputIntegrity(input: V5Input): void {
  // ⚠️ 절대 원칙: 필수 필드 누락 시 즉시 throw
  if (!input) {
    throw new Error('V5_INPUT_MISSING: input is required')
  }

  if (!input.basicInfo) {
    throw new Error('V5_INPUT_MISSING_BASIC_INFO: basicInfo is required')
  }

  if (!input.answers) {
    throw new Error('V5_INPUT_MISSING_ANSWERS: answers is required')
  }

  // ⚠️ 절대 원칙: 필수 필드 검증
  const { basicInfo } = input

  // basicInfo 필수 필드 검증
  if (!basicInfo.housing_type) {
    throw new Error('V5_INPUT_MISSING_FIELD: basicInfo.housing_type is required')
  }

  if (!basicInfo.pyeong_range) {
    throw new Error('V5_INPUT_MISSING_FIELD: basicInfo.pyeong_range is required')
  }

  // ⚠️ V5 헌법 원칙: building_year는 선택 필드 (V4 입력에 없을 수 있음)
  // building_year 검증 제거

  if (!basicInfo.stay_plan) {
    throw new Error('V5_INPUT_MISSING_FIELD: basicInfo.stay_plan is required')
  }

  if (!basicInfo.family_type || basicInfo.family_type.length === 0) {
    throw new Error('V5_INPUT_MISSING_FIELD: basicInfo.family_type is required')
  }

  if (!basicInfo.budget_range) {
    throw new Error('V5_INPUT_MISSING_FIELD: basicInfo.budget_range is required')
  }

  // answers 검증
  if (Object.keys(input.answers).length === 0) {
    throw new Error('V5_INPUT_MISSING_ANSWERS: answers must not be empty')
  }
}




