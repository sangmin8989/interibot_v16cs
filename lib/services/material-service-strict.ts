/**
 * MaterialService Strict - 헌법 v1.1 전용 자재 가격 조회 서비스
 * 
 * ⚠️ 헌법 v1.1 봉인 규칙:
 * - constitution-v1-engine.ts에서만 호출 가능
 * - 외부 호출 전면 금지
 * - export 함수는 단 1개만: getMaterialPriceStrict
 * - 실패 = 무조건 throw EstimateValidationError
 * - NOT_FOUND 반환 ❌
 * - null 반환 ❌
 * - SUCCESS 외 상태 존재 ❌
 */

import { supabase } from '@/lib/db/supabase'
import type { MaterialRequest, MaterialDbResult } from '@/lib/types/헌법_견적_타입'
import { EstimateValidationError } from '@/lib/types/헌법_견적_타입'

/**
 * 헌법 v1.1 전용 자재 가격 조회 (Strict)
 * 
 * @param request - MaterialRequest
 * @returns MaterialDbResult.data (SUCCESS만 반환)
 * @throws EstimateValidationError - 실패 시 무조건 throw
 * 
 * ⚠️ 이 함수는 constitution-v1-engine.ts에서만 호출 가능합니다.
 */
export async function getMaterialPriceStrict(
  request: MaterialRequest
): Promise<NonNullable<MaterialDbResult['data']>> {
  try {
    // 헌법 v1: DB 값 그대로 호출, 추정/보정/평균 금지
    let query = supabase
      .from('materials')
      .select('id, material_code, phase_id, category_1, category_2, category_3, product_name, brand_argen, unit, is_argen_standard, argen_priority, price_argen, price')
      .eq('is_active', true)
      .eq('category_1', request.category.category1)
      .eq('category_2', request.category.category2)

    if (request.category.category3) {
      query = query.eq('category_3', request.category.category3)
    }

    // 아르젠 기준
    query = query.eq('is_argen_standard', true)
    query = query.order('argen_priority', { ascending: true, nullsFirst: false })
    query = query.limit(1)

    const { data, error } = await query.maybeSingle()

    // ✅ DB 조회 오류 → 즉시 throw
    if (error) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (자재 DB 조회 오류: ${error.message})`
      })
    }

    // ✅ 데이터 없음 → 즉시 throw
    if (!data) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (자재: ${request.category.category1}/${request.category.category2})`
      })
    }

    // ✅ 헌법 v1 봉인: 가격이 없거나 0이면 즉시 실패
    const finalPrice = data.price ?? data.price_argen ?? null

    // ✅ 가격 검증: 0이거나 null이면 즉시 throw
    if (finalPrice === null || finalPrice === undefined || finalPrice <= 0) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (자재 가격 없음: ${data.product_name})`
      })
    }

    // ✅ SUCCESS만 반환
    return {
      materialId: data.material_id || data.id,
      materialCode: data.material_code,
      brandName: data.brand_argen || data.brand_name || '',
      productName: data.product_name,
      spec: request.spec || '',
      category1: data.category_1,
      category2: data.category_2,
      category3: data.category_3,
      unit: data.unit || request.quantity.unit,
      price: finalPrice, // 반드시 > 0
      isArgenStandard: data.is_argen_standard || false,
      argenPriority: data.argen_priority,
    }
  } catch (error) {
    // ✅ EstimateValidationError는 그대로 throw
    if (error instanceof EstimateValidationError) {
      throw error
    }
    // ✅ 기타 에러는 EstimateValidationError로 변환
    throw new EstimateValidationError({
      processId: request.processId,
      reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (자재 조회 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'})`
    })
  }
}




