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
    // 등급별 브랜드 컬럼 선택 (V4 전용)
    const brandColumn = request.brandCondition?.brandColumn || 'brand_argen'
    
    // 브랜드 컬럼 목록 (select에 포함)
    const brandColumns = ['brand_basic', 'brand_standard', 'brand_argen', 'brand_premium']
    const selectFields = `id, material_code, phase_id, category_1, category_2, category_3, product_name, ${brandColumns.join(', ')}, unit, is_argen_standard, argen_priority, price_argen, price`
    
    let query = supabase
      .from('materials')
      .select(selectFields)
      .eq('is_active', true)
      .eq('category_1', request.category.category1)
      .eq('category_2', request.category.category2)

    if (request.category.category3) {
      query = query.eq('category_3', request.category.category3)
    }

    // 아르젠 기준
    query = query.eq('is_argen_standard', true)
    
    // 등급별 브랜드 컬럼이 null이 아닌 자재만 조회
    query = query.not(brandColumn, 'is', null)
    
    // 정렬: ARGEN_E는 가격 오름차순, 나머지는 내림차순
    const isAscending = brandColumn === 'brand_basic'
    query = query.order('price', { ascending: isAscending, nullsFirst: false })
    
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
    // 등급별 브랜드 컬럼에 해당하는 가격 사용
    const brandPriceKey = brandColumn === 'brand_basic' ? 'price' : 
                         brandColumn === 'brand_standard' ? 'price' :
                         brandColumn === 'brand_argen' ? 'price_argen' : 'price'
    const finalPrice = data.price ?? data.price_argen ?? null

    // ✅ 가격 검증: 0이거나 null이면 즉시 throw
    if (finalPrice === null || finalPrice === undefined || finalPrice <= 0) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (자재 가격 없음: ${data.product_name})`
      })
    }

    // ✅ SUCCESS만 반환
    // 등급별 브랜드명 선택
    const brandName = data[brandColumn] || data.brand_argen || data.brand_name || ''
    
    return {
      materialId: data.material_id || data.id,
      materialCode: data.material_code,
      brandName,
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





