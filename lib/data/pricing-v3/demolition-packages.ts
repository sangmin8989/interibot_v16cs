/**
 * 인테리봇 철거 견적 시스템 - 전체 철거 패키지
 * 
 * 전체 철거 패키지 가격 조회 및 분해
 */

import {
  getFullDemolitionPackageFromDB,
  getWasteConfigFromDB,
  calculateFromConfig,
  calculateWasteConfigFallback,
  calculateProtectionCostFromDB
} from '@/lib/db/adapters/demolition-adapter'
import { getMaxWasteTon, WASTE_PRICE_PER_TON } from './waste'

// ============================================================
// 전체 철거 패키지 가격 조회
// ============================================================

/**
 * 전체 철거 패키지 가격 조회 (DB 우선, Fallback)
 * 
 * @param pyeong - 평형
 * @param propertyType - 건물 유형 ('apartment' | 'commercial')
 * @returns 전체 철거 패키지 가격 (원)
 */
export async function getFullDemolitionPackagePrice(
  pyeong: number,
  propertyType: string = 'apartment'
): Promise<number> {
  try {
    // 1. DB에서 조회 시도
    const packageData = await getFullDemolitionPackageFromDB(pyeong, propertyType)
    if (packageData) {
      return packageData.total_price
    }

    // 2. Fallback: Config 기반 계산
    console.warn(`⚠️ ${pyeong}평 전체 철거 패키지 DB 없음, Fallback 사용`)
    return calculateFromConfig(pyeong, propertyType)
  } catch (err: any) {
    console.error('❌ getFullDemolitionPackagePrice 에러:', err)
    return calculateFromConfig(pyeong, propertyType)
  }
}

/**
 * 하드코딩된 전체 철거 패키지 가격 (Fallback용)
 * 
 * @param pyeong - 평형
 * @param propertyType - 건물 유형
 * @returns 전체 철거 패키지 가격 (원)
 */
export function getHardcodedPackagePrice(
  pyeong: number,
  propertyType: string = 'apartment'
): number {
  const pricePerPyeong = propertyType === 'apartment' ? 130000 : 150000
  
  // 평형별 가격표 (하드코딩)
  const packagePrices: Record<number, number> = {
    20: 2600000,
    25: 3350000,
    30: 3950000,
    34: 4450000,
    40: 5200000,
    43: 5600000,
    50: 6500000,
    60: 7800000,
    70: 9100000,
    80: 10400000,
    100: 13000000,
    120: 15600000,
    150: 19500000,
    200: 26000000
  }

  // 정확히 일치하는 평형
  if (packagePrices[pyeong]) {
    return packagePrices[pyeong]
  }

  // 가장 가까운 상위 평형 찾기
  const sortedPyeong = Object.keys(packagePrices)
    .map(Number)
    .sort((a, b) => a - b)

  for (const py of sortedPyeong) {
    if (pyeong <= py) {
      return packagePrices[py]
    }
  }

  // 200평 초과: 평당 단가 적용
  return Math.round(pyeong * pricePerPyeong)
}

// ============================================================
// 전체 철거 패키지 분해 (인건비/폐기물/보양)
// ============================================================

export interface FullDemolitionBreakdown {
  packagePrice: number      // 전체 패키지 가격
  wasteTon: number          // 폐기물 톤수
  wasteCost: number         // 폐기물 처리비
  laborCost: number         // 인건비 (노무비)
  protectionCost: number    // 보양비
  elevatorCost: number      // 엘리베이터 보양비
}

/**
 * 전체 철거 패키지 분해 (인건비/폐기물/보양)
 * 
 * @param pyeong - 평형
 * @param propertyType - 건물 유형
 * @param hasElevator - 엘리베이터 유무
 * @param hallwaySheets - 복도 보양재 장수
 * @returns 전체 철거 패키지 분해 정보
 */
export async function calculateFullDemolitionBreakdown(
  pyeong: number,
  propertyType: string = 'apartment',
  hasElevator: boolean = true,
  hallwaySheets: number = 5
): Promise<FullDemolitionBreakdown> {
  // 1. 전체 패키지 가격 조회
  const packagePrice = await getFullDemolitionPackagePrice(pyeong, propertyType)

  // 2. 폐기물 Config 조회
  const wasteConfig = await getWasteConfigFromDB(pyeong)
  const wasteTon = wasteConfig ? wasteConfig.max_ton : getMaxWasteTon(pyeong)
  const wasteCost = wasteConfig 
    ? wasteConfig.total_cost 
    : Math.round(wasteTon * WASTE_PRICE_PER_TON)

  // 3. 보양비 계산
  const protection = await calculateProtectionCostFromDB(hasElevator, hallwaySheets)
  const protectionCost = protection.items
    .filter(item => !item.name.includes('엘리베이터'))
    .reduce((sum, item) => sum + item.cost, 0)
  const elevatorCost = protection.items
    .find(item => item.name.includes('엘리베이터'))?.cost || 0

  // 4. 인건비 계산 (패키지 가격 - 폐기물 - 보양)
  // 보양비는 패키지에 포함되어 있지 않을 수 있으므로, 인건비를 조정
  const laborCost = Math.max(0, packagePrice - wasteCost - protectionCost - elevatorCost)

  // 5. 패키지 가격이 인건비+폐기물+보양 합보다 작으면 인건비 조정
  const totalCalculated = laborCost + wasteCost + protectionCost + elevatorCost
  if (totalCalculated > packagePrice) {
    // 인건비를 줄여서 패키지 가격에 맞춤
    const adjustedLaborCost = Math.max(0, packagePrice - wasteCost - protectionCost - elevatorCost)
    return {
      packagePrice,
      wasteTon,
      wasteCost,
      laborCost: adjustedLaborCost,
      protectionCost,
      elevatorCost
    }
  }

  return {
    packagePrice,
    wasteTon,
    wasteCost,
    laborCost,
    protectionCost,
    elevatorCost
  }
}












