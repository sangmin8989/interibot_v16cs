/**
 * 인테리봇 철거 견적 시스템 - 폐기물 처리비
 * 
 * 평형별 최대 폐기물 톤수 및 처리비
 */

// ============================================================
// 폐기물 단가
// ============================================================

/** 폐기물 1톤당 단가 (고객용) */
export const WASTE_PRICE_PER_TON = 500000;  // 500,000원/톤

// ============================================================
// 평형별 최대 폐기물 톤수
// ============================================================

/** 평형별 최대 폐기물 톤수 */
export const WASTE_TON_BY_PYEONG: Record<number, number> = {
  20: 1.0,
  25: 1.5,
  30: 2.0,
  34: 2.2,
  40: 2.5,
  50: 3.0,
  60: 3.5,
  70: 4.0,
  80: 4.5,
  90: 5.0,
  100: 5.5
};

/**
 * 평형별 최대 폐기물 톤수 조회
 * 
 * @param pyeong - 평형
 * @returns 최대 폐기물 톤수
 */
export function getMaxWasteTon(pyeong: number): number {
  // 정확히 일치하는 평형
  if (WASTE_TON_BY_PYEONG[pyeong]) {
    return WASTE_TON_BY_PYEONG[pyeong];
  }
  
  // 범위별 가장 가까운 값 찾기
  const sortedPyeong = Object.keys(WASTE_TON_BY_PYEONG)
    .map(Number)
    .sort((a, b) => a - b);
  
  // 가장 가까운 상위 평형 찾기
  for (const py of sortedPyeong) {
    if (pyeong <= py) {
      return WASTE_TON_BY_PYEONG[py];
    }
  }
  
  // 100평 초과: 5.5톤 + 평당 0.05톤 추가
  if (pyeong > 100) {
    return 5.5 + ((pyeong - 100) * 0.05);
  }
  
  // 20평 미만: 1.0톤
  return 1.0;
}

/**
 * 폐기물 처리비 계산
 * 
 * @param pyeong - 평형
 * @returns 폐기물 처리비 (원)
 */
export function calculateWasteCost(pyeong: number): number {
  const wasteTon = getMaxWasteTon(pyeong);
  return Math.round(wasteTon * WASTE_PRICE_PER_TON);
}

/**
 * 평형별 폐기물 정보
 */
export interface WasteInfo {
  pyeong: number;
  maxTon: number;
  pricePerTon: number;
  totalCost: number;
}

/**
 * 평형별 폐기물 정보 조회
 */
export function getWasteInfo(pyeong: number): WasteInfo {
  const maxTon = getMaxWasteTon(pyeong);
  const totalCost = calculateWasteCost(pyeong);
  
  return {
    pyeong,
    maxTon,
    pricePerTon: WASTE_PRICE_PER_TON,
    totalCost
  };
}

// ============================================================
// 평형별 폐기물 처리비표 (참고용)
// ============================================================

export const WASTE_COST_BY_PYEONG: Record<number, {
  maxTon: number;
  totalCost: number;
}> = {
  20: { maxTon: 1.0, totalCost: 500000 },
  25: { maxTon: 1.5, totalCost: 750000 },
  30: { maxTon: 2.0, totalCost: 1000000 },
  34: { maxTon: 2.2, totalCost: 1100000 },
  40: { maxTon: 2.5, totalCost: 1250000 },
  50: { maxTon: 3.0, totalCost: 1500000 },
  60: { maxTon: 3.5, totalCost: 1750000 },
  70: { maxTon: 4.0, totalCost: 2000000 },
  80: { maxTon: 4.5, totalCost: 2250000 },
  90: { maxTon: 5.0, totalCost: 2500000 },
  100: { maxTon: 5.5, totalCost: 2750000 }
};













