/**
 * LaborService Strict - 헌법 v1.1 전용 노무비 조회 서비스
 * 
 * ⚠️ 헌법 v1.1 봉인 규칙:
 * - constitution-v1-engine.ts에서만 호출 가능
 * - 외부 호출 전면 금지
 * - export 함수는 단 1개만: getLaborRateStrict
 * - 실패 = 무조건 throw EstimateValidationError
 * - NOT_FOUND 반환 ❌
 * - null 반환 ❌
 * - SUCCESS 외 상태 존재 ❌
 */

import { supabase } from '@/lib/db/supabase'
import type { LaborRequest, LaborDbResult } from '@/lib/types/헌법_견적_타입'
import { EstimateValidationError } from '@/lib/types/헌법_견적_타입'

/**
 * 헌법 v1.1 전용 노무비 조회 (Strict)
 * 
 * @param request - LaborRequest
 * @returns LaborDbResult.data (SUCCESS만 반환)
 * @throws EstimateValidationError - 실패 시 무조건 throw
 * 
 * ⚠️ 이 함수는 constitution-v1-engine.ts에서만 호출 가능합니다.
 */
export async function getLaborRateStrict(
  request: LaborRequest
): Promise<NonNullable<LaborDbResult['data']>> {
  try {
    // 헌법 v1: DB 값 그대로 호출
    // 실제 DB 컬럼명: phase_id (process_id 대신)
    const { data: productivityData, error: productivityError } = await supabase
      .from('labor_productivity')
      .select('*')
      .eq('phase_id', request.processId)
      .eq('is_active', true)
      .maybeSingle()

    // ✅ 생산성 DB 조회 오류 → 즉시 throw
    if (productivityError) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (노무 생산성 DB 조회 오류: ${productivityError.message})`
      })
    }

    // ✅ 생산성 데이터 없음 → 즉시 throw
    if (!productivityData) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (노무 생산성 데이터 없음: ${request.processId})`
      })
    }

    // 실제 DB 컬럼명: phase_id (process_id 대신)
    const { data: costData, error: costError } = await supabase
      .from('labor_costs')
      .select('*')
      .eq('phase_id', request.processId)
      .eq('is_current', true)
      .maybeSingle()

    // ✅ 단가 DB 조회 오류 → 즉시 throw
    if (costError) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (노무 단가 DB 조회 오류: ${costError.message})`
      })
    }

    // ✅ 단가 데이터 없음 → 즉시 throw
    if (!costData) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (노무 단가 데이터 없음: ${request.processId})`
      })
    }

    let difficultyFactor = request.difficultyFactor || 1.0
    let difficultyBasis: string | undefined

    if (request.difficultyBasis) {
      // 실제 DB 컬럼명: category_1 (process_id 대신), upgrade_condition (difficulty_basis 대신)
      const { data: difficultyData } = await supabase
        .from('labor_difficulty_rules')
        .select('*')
        .eq('category_1', request.processId)
        .eq('upgrade_condition', request.difficultyBasis)
        .eq('is_active', true)
        .maybeSingle()

      if (difficultyData) {
        // 실제 컬럼명: difficulty_multiplier (difficulty_factor 대신)
        difficultyFactor = difficultyData.difficulty_multiplier || difficultyFactor
        difficultyBasis = difficultyData.upgrade_condition
      }
    }

    // ✅ 헌법 v1 봉인: 노무 정보 검증 (0이거나 null이면 즉시 실패)
    const dailyOutput = productivityData.daily_output ?? request.dailyOutput ?? null
    const crewSize = productivityData.crew_size ?? request.crewSize ?? null
    const ratePerPersonDay = costData.daily_rate ?? null

    // ✅ 노무 검증: 하나라도 0이거나 null이면 즉시 throw
    if (dailyOutput === null || dailyOutput === undefined || dailyOutput <= 0) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (노무 생산성 정보 없음: dailyOutput)`
      })
    }

    if (crewSize === null || crewSize === undefined || crewSize <= 0) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (노무 생산성 정보 없음: crewSize)`
      })
    }

    if (ratePerPersonDay === null || ratePerPersonDay === undefined || ratePerPersonDay <= 0) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (노무 단가 정보 없음: ratePerPersonDay)`
      })
    }

    // ✅ SUCCESS만 반환
    return {
      laborId: productivityData.id || costData.id,
      processId: request.processId,
      unit: productivityData.labor_unit || request.unit,
      dailyOutput, // 반드시 > 0
      crewSize, // 반드시 > 0
      ratePerPersonDay, // 반드시 > 0
      difficultyFactor,
      difficultyBasis,
      outputFactorByDifficulty: productivityData.base_difficulty || request.outputFactorByDifficulty,
    }
  } catch (error) {
    // ✅ EstimateValidationError는 그대로 throw
    if (error instanceof EstimateValidationError) {
      throw error
    }
    // ✅ 기타 에러는 EstimateValidationError로 변환
    throw new EstimateValidationError({
      processId: request.processId,
      reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (노무 조회 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'})`
    })
  }
}





