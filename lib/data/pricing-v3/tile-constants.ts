/**
 * 타일 상수 정의 (순환 참조 방지)
 * 
 * TILE_MATERIAL_PRICES와 관련 상수들을 별도 파일로 분리하여
 * tile.ts와 material-service.ts 간 순환 참조를 완전히 제거
 */

import type { Grade } from './types'

/** 등급별 m²당 자재비 */
export const TILE_MATERIAL_PRICES: Record<Grade, number> = {
  BASIC: 20000,      // 20,000원/m²
  STANDARD: 35000,   // 35,000원/m² (아르젠 표준)
  ARGEN: 45000,      // 45,000원/m²
  PREMIUM: 75000     // 75,000원/m² (수입)
}

/** 노무비 (1조당) */
export const TILE_LABOR_PRICE_PER_TEAM = 650000  // 650,000원/조




