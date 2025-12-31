/**
 * V4 ValidationGuard - 검증 가드
 * 
 * 헌법 v1.1 검증 규칙 적용
 */

import { EstimateValidationError } from '@/lib/types/헌법_견적_타입'
import type { ProcessId } from '@/lib/types/헌법_견적_타입'
import type { MaterialItemV4, LaborItemV4 } from '../../types'

/**
 * 헌법 v1.1 검증 규칙 적용
 * - 자재 단가 0원 체크
 * - 노무 정보 누락 체크
 * - 수량 0 체크
 */
export function validateProcessBlock(
  processId: ProcessId,
  materials: MaterialItemV4[],
  labor: LaborItemV4
): void {
  // 1. 자재 단가 검증
  for (const material of materials) {
    if (material.unitPrice <= 0) {
      throw new EstimateValidationError({
        processId,
        reason: `자재 단가 없음: ${material.name}`,
      })
    }
    if (material.quantity <= 0) {
      throw new EstimateValidationError({
        processId,
        reason: `자재 수량 오류: ${material.name}`,
      })
    }
  }

  // 2. 노무 정보 검증
  if (labor.dailyOutput <= 0) {
    throw new EstimateValidationError({
      processId,
      reason: '노무 생산성 정보 없음: dailyOutput',
    })
  }
  if (labor.crewSize <= 0) {
    throw new EstimateValidationError({
      processId,
      reason: '노무 투입인원 정보 없음: crewSize',
    })
  }
  if (labor.ratePerPersonDay <= 0) {
    throw new EstimateValidationError({
      processId,
      reason: '노무 단가 정보 없음: ratePerPersonDay',
    })
  }
}

/**
 * 안전한 검증 래퍼 (에러 → 실패 결과 반환)
 */
export function safeValidateProcessBlock(
  processId: ProcessId,
  materials: MaterialItemV4[],
  labor: LaborItemV4
): { isValid: boolean; error?: string } {
  try {
    validateProcessBlock(processId, materials, labor)
    return { isValid: true }
  } catch (error) {
    if (error instanceof EstimateValidationError) {
      return { isValid: false, error: error.reason }
    }
    return { isValid: false, error: '알 수 없는 검증 오류' }
  }
}








