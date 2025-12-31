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
    const selectFields = `id, material_code, phase_id, category_1, category_2, category_3, product_name, grade, ${brandColumns.join(', ')}, unit, is_argen_standard, argen_priority, price_argen, price`
    
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
    
    // 등급별 자재 필터링
    // 1. grade 컬럼이 설정된 자재: grade로 필터
    // 2. grade 없는 자재: brandColumn으로 폴백
    const gradeValue = 
      brandColumn === 'brand_basic' ? 'basic' :
      brandColumn === 'brand_argen' ? 'argen' :
      brandColumn === 'brand_premium' ? 'premium' :
      'argen' // 기본값

    // grade 우선, 없으면 brandColumn 폴백
    query = query.or(`grade.eq.${gradeValue},and(grade.is.null,${brandColumn}.not.is.null)`)

    // 정렬: basic은 저가순, 나머지는 고가순
    const isAscending = gradeValue === 'basic'
    query = query
      .order('price_argen', { ascending: isAscending, nullsFirst: false })
      .limit(1)

    const { data, error } = await query.maybeSingle()

    // ✅ DB 조회 오류 → 즉시 throw
    if (error) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (자재 DB 조회 오류: ${error.message})`,
        failedAt: 'MATERIAL_OR_LABOR_VALIDATION'
      })
    }

    // ✅ 데이터 없음 → 즉시 throw
    if (!data) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (자재: ${request.category.category1}/${request.category.category2})`,
        failedAt: 'MATERIAL_OR_LABOR_VALIDATION'
      })
    }

    // ✅ 타입 안정성: data는 null 체크를 통과했으므로 타입 단언 사용
    type MaterialRow = {
      id: string
      material_code: string
      product_name: string
      category_1: string
      category_2: string
      category_3?: string
      grade?: string
      brand_basic?: string
      brand_standard?: string
      brand_argen?: string
      brand_premium?: string
      brand_name?: string
      unit: string
      price?: number
      price_argen?: number
      is_argen_standard: boolean
      argen_priority?: number
    }
    // ⚠️ Supabase 타입 추론 이슈로 인해 unknown을 거쳐 타입 단언
    const materialData = data as unknown as MaterialRow

    // ✅ 헌법 v1 봉인: 가격이 없거나 0이면 즉시 실패
    // 등급별 브랜드 컬럼에 해당하는 가격 사용
    const brandPriceKey = brandColumn === 'brand_basic' ? 'price' : 
                         brandColumn === 'brand_standard' ? 'price' :
                         brandColumn === 'brand_argen' ? 'price_argen' : 'price'
    const finalPrice = materialData.price ?? materialData.price_argen ?? null

    // ✅ 가격 검증: 0이거나 null이면 즉시 throw
    if (finalPrice === null || finalPrice === undefined || finalPrice <= 0) {
      throw new EstimateValidationError({
        processId: request.processId,
        reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (자재 가격 없음: ${materialData.product_name})`,
        failedAt: 'MATERIAL_OR_LABOR_VALIDATION'
      })
    }

    // ✅ SUCCESS만 반환
    // 등급별 브랜드명 선택
    const brandColumnValue = materialData[brandColumn as keyof MaterialRow]
    const brandName: string = (typeof brandColumnValue === 'string' ? brandColumnValue : '') 
      || materialData.brand_argen 
      || materialData.brand_name 
      || ''
    
    // ✅ 디버깅 로그 추가
    console.log('✅ [헌법] 자재 선택 완료:', {
      brandColumn,
      gradeValue,
      materialGrade: materialData.grade || '(null)',
      selectedBrand: brandName,
      productName: materialData.product_name,
      price: finalPrice,
      category: `${materialData.category_1}/${materialData.category_2}`,
    })
    
    return {
      materialId: materialData.id,
      materialCode: materialData.material_code,
      brandName,
      productName: materialData.product_name,
      spec: request.spec || '',
      category1: materialData.category_1,
      category2: materialData.category_2,
      category3: materialData.category_3,
      unit: materialData.unit || request.quantity.unit,
      price: finalPrice, // 반드시 > 0
      isArgenStandard: materialData.is_argen_standard || false,
      argenPriority: materialData.argen_priority,
    }
  } catch (error) {
    // ✅ EstimateValidationError는 그대로 throw
    if (error instanceof EstimateValidationError) {
      throw error
    }
    // ✅ 기타 에러는 EstimateValidationError로 변환
    throw new EstimateValidationError({
      processId: request.processId,
      reason: `견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다. (자재 조회 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'})`,
      failedAt: 'MATERIAL_OR_LABOR_VALIDATION'
    })
  }
}












