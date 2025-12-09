/**
 * 인테리봇 견적 시스템 V3 - 바닥재 단가표
 * 
 * 아르젠 추천: Standard 가격대에서 광폭/텍스처 최고급 강마루
 * 단위: 평당 단가
 * 노무비: 평당 40,000원 (도급제)
 */

import { 
  Grade, 
  GradeBrands, 
  SizeRange, 
  SIZE_QUANTITIES,
  ARGEN_RECOMMENDED 
} from './types';

// ============================================================
// 1. 바닥재 브랜드
// ============================================================

/** 바닥재 브랜드 목록 (등급별 × 3사) */
export const FLOORING_BRANDS: GradeBrands = {
  BASIC: [
    { name: '동화/LX', product: 'LX 지인', description: '장판' },
    { name: '구정/현대', product: '현대 L&C', description: '장판' },
    { name: '한솔/기타', product: '재영', description: '장판' }
  ],
  STANDARD: [
    { name: '동화', product: '나투스진', description: '강마루' },
    { name: '구정', product: '강마루', description: '강마루' },
    { name: '한솔', product: 'SB마루', description: '강마루' }
  ],
  ARGEN: [
    { name: '동화', product: '그란데', description: '아르젠 추천 - 광폭 강마루' },
    { name: '구정', product: '마뷸러스', description: '아르젠 추천 - 광폭 강마루' },
    { name: 'LX', product: '에디톤', description: '아르젠 추천 - 광폭 강마루' }
  ],
  PREMIUM: [
    { name: 'LX', product: '지인 원목', description: '원목마루' },
    { name: '구정', product: '브러쉬 골드', description: '원목마루' },
    { name: '디앤메종', product: '프리미엄', description: '원목마루' }
  ]
};

// ============================================================
// 2. 바닥재 단가 (평당)
// ============================================================

/** 등급별 평당 자재비 */
export const FLOORING_MATERIAL_PRICES: Record<Grade, number> = {
  BASIC: 25000,      // 25,000원/평 (장판)
  STANDARD: 55000,   // 55,000원/평 (강마루)
  ARGEN: 65000,      // 65,000원/평 (광폭 강마루 - Standard 가격대)
  PREMIUM: 150000    // 150,000원/평 (원목마루)
};

/** 노무비 (평당 도급) */
export const FLOORING_LABOR_PRICE = 40000;  // 40,000원/평

// ============================================================
// 3. 평형별 물량/비용 계산
// ============================================================

/** 바닥재 견적 결과 */
export interface FlooringEstimate {
  grade: Grade;
  sizeRange: SizeRange;
  py: number;
  
  // 물량
  area: number;               // 시공 면적 (평)
  
  // 자재비
  pricePerPy: number;         // 평당 자재비
  materialCost: number;       // 자재비 합계
  
  // 노무비
  laborPricePerPy: number;    // 평당 노무비
  laborCost: number;          // 노무비 합계
  
  // 합계
  totalCost: number;          // 총 비용
  
  // 브랜드
  brands: typeof FLOORING_BRANDS.BASIC;
  argenConcept: typeof ARGEN_RECOMMENDED;
}

/** 바닥재 견적 계산 */
export function calculateFlooringEstimate(
  grade: Grade,
  sizeRange: SizeRange,
  py: number
): FlooringEstimate {
  const quantities = SIZE_QUANTITIES[sizeRange];
  
  // 시공 면적 (평형별 기준)
  const area = quantities.flooringArea;
  
  // 자재비
  const pricePerPy = FLOORING_MATERIAL_PRICES[grade];
  const materialCost = area * pricePerPy;
  
  // 노무비 (평당 도급)
  const laborPricePerPy = FLOORING_LABOR_PRICE;
  const laborCost = area * laborPricePerPy;
  
  // 합계
  const totalCost = materialCost + laborCost;
  
  return {
    grade,
    sizeRange,
    py,
    area,
    pricePerPy,
    materialCost,
    laborPricePerPy,
    laborCost,
    totalCost,
    brands: FLOORING_BRANDS[grade],
    argenConcept: ARGEN_RECOMMENDED
  };
}

// ============================================================
// 4. 평형별 기준 비용표 (미리 계산된 값)
// ============================================================

/** 평형별 바닥재 비용 */
export const FLOORING_COST_BY_SIZE: Record<SizeRange, Record<Grade, { 
  area: number; 
  materialCost: number; 
  laborCost: number;
  totalCost: number;
}>> = {
  '10PY': {
    BASIC: { area: 13, materialCost: 325000, laborCost: 520000, totalCost: 845000 },
    STANDARD: { area: 13, materialCost: 715000, laborCost: 520000, totalCost: 1235000 },
    ARGEN: { area: 13, materialCost: 845000, laborCost: 520000, totalCost: 1365000 },
    PREMIUM: { area: 13, materialCost: 1950000, laborCost: 520000, totalCost: 2470000 }
  },
  '20PY': {
    BASIC: { area: 22, materialCost: 550000, laborCost: 880000, totalCost: 1430000 },
    STANDARD: { area: 22, materialCost: 1210000, laborCost: 880000, totalCost: 2090000 },
    ARGEN: { area: 22, materialCost: 1430000, laborCost: 880000, totalCost: 2310000 },
    PREMIUM: { area: 22, materialCost: 3300000, laborCost: 880000, totalCost: 4180000 }
  },
  '30PY': {
    BASIC: { area: 30, materialCost: 750000, laborCost: 1200000, totalCost: 1950000 },
    STANDARD: { area: 30, materialCost: 1650000, laborCost: 1200000, totalCost: 2850000 },
    ARGEN: { area: 30, materialCost: 1950000, laborCost: 1200000, totalCost: 3150000 },
    PREMIUM: { area: 30, materialCost: 4500000, laborCost: 1200000, totalCost: 5700000 }
  },
  '40PY': {
    BASIC: { area: 40, materialCost: 1000000, laborCost: 1600000, totalCost: 2600000 },
    STANDARD: { area: 40, materialCost: 2200000, laborCost: 1600000, totalCost: 3800000 },
    ARGEN: { area: 40, materialCost: 2600000, laborCost: 1600000, totalCost: 4200000 },
    PREMIUM: { area: 40, materialCost: 6000000, laborCost: 1600000, totalCost: 7600000 }
  },
  '50PY': {
    BASIC: { area: 50, materialCost: 1250000, laborCost: 2000000, totalCost: 3250000 },
    STANDARD: { area: 50, materialCost: 2750000, laborCost: 2000000, totalCost: 4750000 },
    ARGEN: { area: 50, materialCost: 3250000, laborCost: 2000000, totalCost: 5250000 },
    PREMIUM: { area: 50, materialCost: 7500000, laborCost: 2000000, totalCost: 9500000 }
  }
};

// ============================================================
// 5. 바닥재 종류별 설명
// ============================================================

/** 바닥재 종류 */
export const FLOORING_TYPES = {
  JANGPAN: {
    id: 'JANGPAN',
    name: '장판',
    description: '가장 저렴한 바닥재. 임대용/저예산에 적합.',
    grades: ['BASIC'],
    thickness: '3mm~5mm'
  },
  GANGMARU: {
    id: 'GANGMARU',
    name: '강마루',
    description: 'HDF 합판 위 무늬목 시트. 가성비 좋고 관리 쉬움.',
    grades: ['STANDARD'],
    thickness: '8mm~10mm'
  },
  GWANGPOK: {
    id: 'GWANGPOK',
    name: '광폭 강마루',
    description: '넓은 판재로 고급스러운 느낌. 텍스처가 살아있음.',
    grades: ['ARGEN'],
    thickness: '10mm~12mm'
  },
  WONMOK: {
    id: 'WONMOK',
    name: '원목마루',
    description: '진짜 나무. 최고급 마감. 관리 필요.',
    grades: ['PREMIUM'],
    thickness: '12mm~15mm'
  }
};

// ============================================================
// 6. 바닥재 관련 유틸리티
// ============================================================

/** 등급별 추천 문구 */
export function getFlooringRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '임대용이나 저예산에 적합한 장판입니다. 가격이 저렴하고 시공이 빠릅니다.';
    case 'STANDARD':
      return '일반 가정집에 가장 많이 사용하는 강마루입니다. 내구성이 좋고 관리가 쉽습니다.';
    case 'ARGEN':
      return '⭐ 아르젠 추천: Standard 가격대에서 최고 품질의 광폭 강마루! 동화 그란데, 구정 마뷸러스 등 텍스처가 살아있는 제품입니다.';
    case 'PREMIUM':
      return '최고급 원목마루입니다. 진짜 나무의 따뜻함과 고급스러움을 느낄 수 있습니다.';
  }
}

/** 바닥재 종류 추천 */
export function getFlooringType(grade: Grade): keyof typeof FLOORING_TYPES {
  switch (grade) {
    case 'BASIC':
      return 'JANGPAN';
    case 'STANDARD':
      return 'GANGMARU';
    case 'ARGEN':
      return 'GWANGPOK';
    case 'PREMIUM':
      return 'WONMOK';
  }
}

/** 1일 시공 물량 */
export const FLOORING_DAILY_OUTPUT = {
  description: '2인 1조 기준',
  강마루: '40~50평',
  장판: '50~60평',
  원목마루: '30~40평'
};



