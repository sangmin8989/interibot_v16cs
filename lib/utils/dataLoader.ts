/**
 * 데이터 파일 로더
 * data 폴더의 JSON 파일들을 로드하는 함수
 */

import pricingData from '@/lib/data/pricing.json'
import traitWeightsData from '@/lib/data/trait-weights.json'

type PricingData = typeof pricingData
type TraitWeightsData = typeof traitWeightsData

/**
 * 가격 마스터 데이터 로드
 */
export function loadPriceMaster(): PricingData {
  return pricingData
}

/**
 * 성향 가중치 매트릭스 데이터 로드
 */
export function loadTraitMatrix(): TraitWeightsData {
  return traitWeightsData
}

/**
 * 평형별 기본 금액 조회 (새 구조)
 */
export function getBaseAmountBySize(
  size: number,
  grade: 'basic' | 'standard' | 'premium',
  region: 'seoul' | 'gyeonggi' | 'local' = 'gyeonggi'
): number | null {
  const pricingData = loadPriceMaster()
  
  // base_by_size 사용 (우선)
  if (pricingData.base_by_size && Array.isArray(pricingData.base_by_size)) {
    const sizeData = pricingData.base_by_size.find(
      (s) => size >= s.size_min && size <= s.size_max
    )
    
    if (sizeData) {
      const baseAmount = sizeData[grade] || sizeData.standard
      const regionFactor = REGION_FACTORS[region] || 1.0
      return Math.round(baseAmount * regionFactor)
    }
  }
  
  // 하위 호환성: size_base_estimate 사용
  const sizeEstimate = pricingData.size_base_estimate?.find(
    (s) => size >= s.size_min && size <= s.size_max
  )
  
  if (!sizeEstimate) return null
  
  const regionFactor = REGION_FACTORS[region] || 1.0
  let baseAmount = 0
  
  if (grade === 'basic') {
    baseAmount = (sizeEstimate.basic_min + sizeEstimate.basic_max) / 2
  } else if (grade === 'standard') {
    baseAmount = (sizeEstimate.standard_min + sizeEstimate.standard_max) / 2
  } else {
    baseAmount = (sizeEstimate.premium_min + sizeEstimate.premium_max) / 2
  }
  
  return Math.round(baseAmount * regionFactor)
}

/**
 * 공정별 비율 조회
 */
export function getProcessRatios(
  areaSelection?: 'kitchen_only' | 'bathroom_only' | 'living_room_only' | 'full_remodeling'
): Record<string, number> {
  const pricingData = loadPriceMaster()
  
  if (!pricingData.process_ratio) {
    // 기본값 반환 (하위 호환성)
    return {
      '100': 0.22,
      '200': 0.28,
      '300': 0.09,
      '400': 0.14,
      '500': 0.06,
      '600': 0.04,
      '700': 0.02,
      '800': 0.06,
      '900': 0.04,
      '1000': 0.05,
    }
  }
  
  if (areaSelection && pricingData.process_ratio.by_area_selection) {
    // full_remodeling인 경우 기본값 반환
    if (areaSelection === 'full_remodeling') {
      return pricingData.process_ratio.default as Record<string, number>
    }
    
    // 타입 가드: full_remodeling을 제외한 경우에만 접근
    const validAreaSelection = areaSelection as 'kitchen_only' | 'bathroom_only' | 'living_room_only'
    const areaRatios = pricingData.process_ratio.by_area_selection[validAreaSelection]
    if (areaRatios) {
      return areaRatios as Record<string, number>
    }
  }
  
  return pricingData.process_ratio.default as Record<string, number>
}

/**
 * 성향 가중치 제한 규칙 조회
 */
export function getTraitWeightLimits(): {
  max_per_process: number
  max_total: number
  min_adjustment: number
  max_adjustment: number
} {
  const traitMatrix = loadTraitMatrix()
  
  if (traitMatrix.calculation_rules?.weight_limits) {
    return traitMatrix.calculation_rules.weight_limits as {
      max_per_process: number
      max_total: number
      min_adjustment: number
      max_adjustment: number
    }
  }
  
  // 기본값
  return {
    max_per_process: 30,
    max_total: 30,
    min_adjustment: -20,
    max_adjustment: 30,
  }
}

// 지역 계수 (내부 사용)
const REGION_FACTORS = {
  seoul: 1.1,
  gyeonggi: 1.0,
  local: 0.9,
}

/**
 * 데이터 로드 에러 체크
 */
export function validateDataFiles(): { valid: boolean; error?: string } {
  try {
    const priceMaster = loadPriceMaster()
    const traitMatrix = loadTraitMatrix()

    if (!priceMaster || !priceMaster.process_groups) {
      return { valid: false, error: '가격 마스터 데이터가 유효하지 않습니다' }
    }

    if (!traitMatrix || !traitMatrix.weight_matrix) {
      return { valid: false, error: '가중치 매트릭스 데이터가 유효하지 않습니다' }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: `데이터 파일 로드 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }
}



