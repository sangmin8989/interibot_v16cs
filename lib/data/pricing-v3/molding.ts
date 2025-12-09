/**
 * 인테리봇 견적 시스템 V3 - 몰딩 & 걸레받이 단가표
 * 
 * 공간의 라인을 정리하는 마감재
 * 단위: m당 단가 (시공비 포함)
 */

import { 
  Grade, 
  GradeBrands, 
  SizeRange, 
  SIZE_QUANTITIES,
  ARGEN_RECOMMENDED 
} from './types';

// ============================================================
// 1. 몰딩 브랜드
// ============================================================

/** 몰딩 브랜드 목록 (등급별 × 3사) */
export const MOLDING_BRANDS: GradeBrands = {
  BASIC: [
    { name: '재현', product: '래핑 평몰딩', description: '기본형' },
    { name: '예지', product: '래핑 평몰딩', description: '기본형' },
    { name: '중소기업', product: '래핑 평몰딩', description: '기본형' }
  ],
  STANDARD: [
    { name: '영림', product: '마이너스 몰딩', description: '깔끔한 라인' },
    { name: '예림', product: '마이너스 몰딩', description: '깔끔한 라인' },
    { name: 'LX', product: '마이너스 몰딩', description: '깔끔한 라인' }
  ],
  ARGEN: [
    { name: '영림', product: '프리미엄 마이너스', description: '아르젠 표준' },
    { name: '예림', product: '프리미엄 마이너스', description: '아르젠 표준' },
    { name: 'LX', product: '프리미엄 마이너스', description: '아르젠 표준' }
  ],
  PREMIUM: [
    { name: '영림', product: '무몰딩/히든', description: '도장/퍼티 필수' },
    { name: '커스텀', product: '무몰딩', description: '도장/퍼티 필수' },
    { name: '커스텀', product: '히든', description: '도장/퍼티 필수' }
  ]
};

// ============================================================
// 2. 몰딩 단가 (m당, 시공비 포함)
// ============================================================

/** 등급별 m당 단가 (시공비 포함) */
export const MOLDING_PRICES: Record<Grade, number> = {
  BASIC: 4500,       // 4,500원/m (시공비 포함)
  STANDARD: 7000,    // 7,000원/m
  ARGEN: 8000,       // 8,000원/m (아르젠 표준)
  PREMIUM: 15000     // 15,000원/m (도장/퍼티 필수)
};

// ============================================================
// 3. 평형별 물량/비용 계산
// ============================================================

/** 몰딩 견적 결과 */
export interface MoldingEstimate {
  grade: Grade;
  sizeRange: SizeRange;
  py: number;
  
  // 물량
  length: number;             // 시공 길이 (m)
  
  // 비용 (시공비 포함)
  pricePerM: number;          // m당 단가
  totalCost: number;          // 총 비용
  
  // 브랜드
  brands: typeof MOLDING_BRANDS.BASIC;
  argenConcept: typeof ARGEN_RECOMMENDED;
}

/** 몰딩 견적 계산 */
export function calculateMoldingEstimate(
  grade: Grade,
  sizeRange: SizeRange,
  py: number
): MoldingEstimate {
  const quantities = SIZE_QUANTITIES[sizeRange];
  
  // 시공 길이 (평형별 기준)
  const length = quantities.moldingLength;
  
  // 비용 (m당 단가 × 길이)
  const pricePerM = MOLDING_PRICES[grade];
  const totalCost = length * pricePerM;
  
  return {
    grade,
    sizeRange,
    py,
    length,
    pricePerM,
    totalCost,
    brands: MOLDING_BRANDS[grade],
    argenConcept: ARGEN_RECOMMENDED
  };
}

// ============================================================
// 4. 평형별 기준 비용표 (미리 계산된 값)
// ============================================================

/** 평형별 몰딩 비용 */
export const MOLDING_COST_BY_SIZE: Record<SizeRange, Record<Grade, { 
  length: number; 
  totalCost: number;
}>> = {
  '10PY': {
    BASIC: { length: 40, totalCost: 180000 },
    STANDARD: { length: 40, totalCost: 280000 },
    ARGEN: { length: 40, totalCost: 320000 },
    PREMIUM: { length: 40, totalCost: 600000 }
  },
  '20PY': {
    BASIC: { length: 60, totalCost: 270000 },
    STANDARD: { length: 60, totalCost: 420000 },
    ARGEN: { length: 60, totalCost: 480000 },
    PREMIUM: { length: 60, totalCost: 900000 }
  },
  '30PY': {
    BASIC: { length: 85, totalCost: 382500 },
    STANDARD: { length: 85, totalCost: 595000 },
    ARGEN: { length: 85, totalCost: 680000 },
    PREMIUM: { length: 85, totalCost: 1275000 }
  },
  '40PY': {
    BASIC: { length: 110, totalCost: 495000 },
    STANDARD: { length: 110, totalCost: 770000 },
    ARGEN: { length: 110, totalCost: 880000 },
    PREMIUM: { length: 110, totalCost: 1650000 }
  },
  '50PY': {
    BASIC: { length: 140, totalCost: 630000 },
    STANDARD: { length: 140, totalCost: 980000 },
    ARGEN: { length: 140, totalCost: 1120000 },
    PREMIUM: { length: 140, totalCost: 2100000 }
  }
};

// ============================================================
// 5. 몰딩 종류별 설명
// ============================================================

/** 몰딩 종류 */
export const MOLDING_TYPES = {
  WRAPPING: {
    id: 'WRAPPING',
    name: '래핑 평몰딩',
    description: '가장 기본적인 몰딩. 저렴하고 무난함.',
    grades: ['BASIC'],
    width: '50mm~70mm'
  },
  MINUS: {
    id: 'MINUS',
    name: '마이너스 몰딩',
    description: '천장과 벽 사이에 숨은 듯한 깔끔함.',
    grades: ['STANDARD', 'ARGEN'],
    width: '10mm~15mm'
  },
  HIDDEN: {
    id: 'HIDDEN',
    name: '무몰딩/히든',
    description: '몰딩 없이 벽체와 천장을 1:1 마감. 도장/퍼티 필수.',
    grades: ['PREMIUM'],
    width: '0mm'
  }
};

/** 걸레받이 종류 */
export const BASEBOARD_TYPES = {
  STANDARD: {
    id: 'STANDARD',
    name: '일반 걸레받이',
    description: '바닥과 벽 사이 마감',
    height: '60mm~80mm'
  },
  SLIM: {
    id: 'SLIM',
    name: '슬림 걸레받이',
    description: '모던한 느낌의 얇은 걸레받이',
    height: '40mm~50mm'
  },
  HIDDEN: {
    id: 'HIDDEN',
    name: '매입형 걸레받이',
    description: '벽에 매입되어 튀어나오지 않음',
    height: '60mm'
  }
};

// ============================================================
// 6. 몰딩 관련 유틸리티
// ============================================================

/** 등급별 추천 문구 */
export function getMoldingRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '기본 래핑 평몰딩입니다. 가격이 저렴하고 무난합니다.';
    case 'STANDARD':
      return '마이너스 몰딩입니다. 천장과 벽 사이가 깔끔하게 정리됩니다.';
    case 'ARGEN':
      return '⭐ 아르젠 표준: 프리미엄 마이너스 몰딩! 더 정교한 마감으로 공간이 넓어 보입니다.';
    case 'PREMIUM':
      return '무몰딩/히든 마감입니다. 도장과 퍼티 작업으로 최고급 마감을 연출합니다.';
  }
}

/** 몰딩 종류 추천 */
export function getMoldingType(grade: Grade): keyof typeof MOLDING_TYPES {
  switch (grade) {
    case 'BASIC':
      return 'WRAPPING';
    case 'STANDARD':
    case 'ARGEN':
      return 'MINUS';
    case 'PREMIUM':
      return 'HIDDEN';
  }
}



