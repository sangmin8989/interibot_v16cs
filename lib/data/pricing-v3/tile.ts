/**
 * 인테리봇 견적 시스템 V3 - 타일 단가표
 * 
 * 타일은 원산지와 규격이 가격을 결정
 * 브랜드보다 '디자인과 강도'가 중요
 * 단위: m²당 단가
 * 노무비: 1조당 650,000원 (기공40+조공25)
 */

import { 
  Grade, 
  GradeBrands, 
  SizeRange, 
  SIZE_QUANTITIES,
  ARGEN_RECOMMENDED 
} from './types';
import { TILE_DAYS } from './labor';

// ============================================================
// 1. 타일 브랜드
// ============================================================

/** 타일 브랜드 목록 (등급별 × 3사) */
export const TILE_BRANDS: GradeBrands = {
  BASIC: [
    { name: '대보', product: '도기질/자기질', description: '300×600' },
    { name: '태영', product: '도기질/자기질', description: '300×600' },
    { name: '이화', product: '도기질/자기질', description: '300×600' }
  ],
  STANDARD: [
    { name: '아이에스동서', product: '포세린', description: '600×600' },
    { name: '대림', product: '포세린', description: '600×600' },
    { name: '성일', product: '포세린', description: '600×600' }
  ],
  ARGEN: [
    { name: '아이에스동서', product: '프리미엄 포세린', description: '아르젠 추천 - 600×600' },
    { name: '대림', product: '고급 포세린', description: '아르젠 추천 - 600×600' },
    { name: '성일', product: '프리미엄 포세린', description: '아르젠 추천 - 600×600' }
  ],
  PREMIUM: [
    { name: '윤현상재', product: '수입 포세린', description: '600×1200 (이태리/스페인)' },
    { name: '유로', product: '수입 포세린', description: '600×1200 (이태리/스페인)' },
    { name: '상아', product: '수입 포세린', description: '600×1200 (이태리/스페인)' }
  ]
};

// ============================================================
// 2. 타일 단가 (m²당)
// ============================================================

/** 등급별 m²당 자재비 */
export const TILE_MATERIAL_PRICES: Record<Grade, number> = {
  BASIC: 20000,      // 20,000원/m²
  STANDARD: 35000,   // 35,000원/m² (아르젠 표준)
  ARGEN: 45000,      // 45,000원/m²
  PREMIUM: 75000     // 75,000원/m² (수입)
};

/** 노무비 (1조당) */
export const TILE_LABOR_PRICE_PER_TEAM = 650000;  // 650,000원/조

// ============================================================
// 3. 타일 시공 위치
// ============================================================

/** 타일 시공 위치 */
export type TileLocation = 'BATHROOM' | 'KITCHEN' | 'ENTRANCE';

/** 위치별 기본 면적 */
export const TILE_AREA_BY_LOCATION: Record<TileLocation, Record<SizeRange, number>> = {
  BATHROOM: {
    '10PY': 12,    // 욕실 1개
    '20PY': 14,    // 욕실 1개
    '30PY': 32,    // 욕실 2개 (각 16m²)
    '40PY': 36,    // 욕실 2개 (각 18m²)
    '50PY': 40     // 욕실 2개 (각 20m²)
  },
  KITCHEN: {
    '10PY': 3,
    '20PY': 4,
    '30PY': 6,
    '40PY': 8,
    '50PY': 10
  },
  ENTRANCE: {
    '10PY': 1.5,
    '20PY': 2,
    '30PY': 3,
    '40PY': 4,
    '50PY': 5
  }
};

// ============================================================
// 4. 평형별 물량/비용 계산
// ============================================================

/** 타일 견적 결과 */
export interface TileEstimate {
  grade: Grade;
  sizeRange: SizeRange;
  py: number;
  
  // 욕실 타일
  bathroomArea: number;       // 욕실 면적 (m²)
  bathroomMaterialCost: number;
  bathroomLaborCost: number;
  bathroomTotalCost: number;
  
  // 주방 타일
  kitchenArea: number;        // 주방 면적 (m²)
  kitchenMaterialCost: number;
  kitchenLaborCost: number;
  kitchenTotalCost: number;
  
  // 현관 타일
  entranceArea: number;       // 현관 면적 (m²)
  entranceMaterialCost: number;
  entranceLaborCost: number;
  entranceTotalCost: number;
  
  // 합계
  totalArea: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalCost: number;
  
  // 브랜드
  brands: typeof TILE_BRANDS.BASIC;
  argenConcept: typeof ARGEN_RECOMMENDED;
}

/** 타일 견적 계산 */
export function calculateTileEstimate(
  grade: Grade,
  sizeRange: SizeRange,
  py: number
): TileEstimate {
  const pricePerM2 = TILE_MATERIAL_PRICES[grade];
  
  // 각 위치별 면적
  const bathroomArea = TILE_AREA_BY_LOCATION.BATHROOM[sizeRange];
  const kitchenArea = TILE_AREA_BY_LOCATION.KITCHEN[sizeRange];
  const entranceArea = TILE_AREA_BY_LOCATION.ENTRANCE[sizeRange];
  const totalArea = bathroomArea + kitchenArea + entranceArea;
  
  // 자재비
  const bathroomMaterialCost = bathroomArea * pricePerM2;
  const kitchenMaterialCost = kitchenArea * pricePerM2;
  const entranceMaterialCost = entranceArea * pricePerM2;
  const totalMaterialCost = bathroomMaterialCost + kitchenMaterialCost + entranceMaterialCost;
  
  // 노무비 (타일 일수 × 65만원)
  const tileDays = TILE_DAYS[sizeRange];
  const totalLaborCost = Math.round(tileDays * TILE_LABOR_PRICE_PER_TEAM);
  
  // 위치별 노무비 배분 (욕실 80%, 주방 15%, 현관 5%)
  const bathroomLaborCost = Math.round(totalLaborCost * 0.8);
  const kitchenLaborCost = Math.round(totalLaborCost * 0.15);
  const entranceLaborCost = Math.round(totalLaborCost * 0.05);
  
  // 위치별 총비용
  const bathroomTotalCost = bathroomMaterialCost + bathroomLaborCost;
  const kitchenTotalCost = kitchenMaterialCost + kitchenLaborCost;
  const entranceTotalCost = entranceMaterialCost + entranceLaborCost;
  const totalCost = totalMaterialCost + totalLaborCost;
  
  return {
    grade,
    sizeRange,
    py,
    bathroomArea,
    bathroomMaterialCost,
    bathroomLaborCost,
    bathroomTotalCost,
    kitchenArea,
    kitchenMaterialCost,
    kitchenLaborCost,
    kitchenTotalCost,
    entranceArea,
    entranceMaterialCost,
    entranceLaborCost,
    entranceTotalCost,
    totalArea,
    totalMaterialCost,
    totalLaborCost,
    totalCost,
    brands: TILE_BRANDS[grade],
    argenConcept: ARGEN_RECOMMENDED
  };
}

// ============================================================
// 5. 평형별 기준 비용표 (미리 계산된 값)
// ============================================================

/** 평형별 타일 비용 (욕실+주방+현관) */
export const TILE_COST_BY_SIZE: Record<SizeRange, Record<Grade, { 
  totalArea: number;
  materialCost: number; 
  laborCost: number;
  totalCost: number;
}>> = {
  '10PY': {
    BASIC: { totalArea: 16.5, materialCost: 330000, laborCost: 1300000, totalCost: 1630000 },
    STANDARD: { totalArea: 16.5, materialCost: 577500, laborCost: 1300000, totalCost: 1877500 },
    ARGEN: { totalArea: 16.5, materialCost: 742500, laborCost: 1300000, totalCost: 2042500 },
    PREMIUM: { totalArea: 16.5, materialCost: 1237500, laborCost: 1300000, totalCost: 2537500 }
  },
  '20PY': {
    BASIC: { totalArea: 20, materialCost: 400000, laborCost: 1300000, totalCost: 1700000 },
    STANDARD: { totalArea: 20, materialCost: 700000, laborCost: 1300000, totalCost: 2000000 },
    ARGEN: { totalArea: 20, materialCost: 900000, laborCost: 1300000, totalCost: 2200000 },
    PREMIUM: { totalArea: 20, materialCost: 1500000, laborCost: 1300000, totalCost: 2800000 }
  },
  '30PY': {
    BASIC: { totalArea: 41, materialCost: 820000, laborCost: 2600000, totalCost: 3420000 },
    STANDARD: { totalArea: 41, materialCost: 1435000, laborCost: 2600000, totalCost: 4035000 },
    ARGEN: { totalArea: 41, materialCost: 1845000, laborCost: 2600000, totalCost: 4445000 },
    PREMIUM: { totalArea: 41, materialCost: 3075000, laborCost: 2600000, totalCost: 5675000 }
  },
  '40PY': {
    BASIC: { totalArea: 48, materialCost: 960000, laborCost: 2925000, totalCost: 3885000 },
    STANDARD: { totalArea: 48, materialCost: 1680000, laborCost: 2925000, totalCost: 4605000 },
    ARGEN: { totalArea: 48, materialCost: 2160000, laborCost: 2925000, totalCost: 5085000 },
    PREMIUM: { totalArea: 48, materialCost: 3600000, laborCost: 2925000, totalCost: 6525000 }
  },
  '50PY': {
    BASIC: { totalArea: 55, materialCost: 1100000, laborCost: 3250000, totalCost: 4350000 },
    STANDARD: { totalArea: 55, materialCost: 1925000, laborCost: 3250000, totalCost: 5175000 },
    ARGEN: { totalArea: 55, materialCost: 2475000, laborCost: 3250000, totalCost: 5725000 },
    PREMIUM: { totalArea: 55, materialCost: 4125000, laborCost: 3250000, totalCost: 7375000 }
  }
};

// ============================================================
// 6. 타일 종류별 설명
// ============================================================

/** 타일 종류 */
export const TILE_TYPES = {
  CERAMIC: {
    id: 'CERAMIC',
    name: '도기질/자기질',
    description: '가장 기본적인 타일. 국산 보급형.',
    size: '300×600',
    grades: ['BASIC']
  },
  PORCELAIN: {
    id: 'PORCELAIN',
    name: '포세린',
    description: '내구성 강하고 모던한 디자인. 호텔식 욕실의 기본.',
    size: '600×600',
    grades: ['STANDARD', 'ARGEN']
  },
  IMPORTED: {
    id: 'IMPORTED',
    name: '수입 포세린',
    description: '압도적인 텍스처와 컬러감. 졸리컷 시공 시 퀄리티 최상.',
    size: '600×1200',
    grades: ['PREMIUM']
  }
};

/** 시공 방식 */
export const TILE_INSTALLATION_TYPES = {
  STANDARD: {
    id: 'STANDARD',
    name: '일반 시공',
    description: '줄눈 있음. 일반적인 방식.'
  },
  JOLLY_CUT: {
    id: 'JOLLY_CUT',
    name: '졸리컷',
    description: '모서리를 45도로 깎아 붙임. 줄눈 없는 깔끔함.',
    laborIncrease: '시공 속도 30% 저하'
  }
};

// ============================================================
// 7. 타일 관련 유틸리티
// ============================================================

/** 등급별 추천 문구 */
export function getTileRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '국산 도기질 타일입니다. 디자인은 무난하고 가격이 저렴합니다.';
    case 'STANDARD':
      return '600각 포세린 타일입니다. 내구성이 강하고 모던한 디자인입니다.';
    case 'ARGEN':
      return '⭐ 아르젠 표준: 프리미엄 포세린 타일! 호텔식 욕실의 기본이 되는 고급 타일입니다.';
    case 'PREMIUM':
      return '이태리/스페인 수입 포세린입니다. 압도적인 텍스처와 컬러감으로 5성급 호텔 느낌!';
  }
}

/** 1일 시공 물량 */
export const TILE_DAILY_OUTPUT = {
  description: '2인 1조 (기공+조공) 기준',
  bathroom: '욕실(벽+바닥): 0.5~0.7실',
  kitchenEntrance: '현관/주방 타일: 2~3개소',
  note: '600각/졸리컷 시공 시 속도 30% 저하'
};



