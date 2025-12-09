/**
 * 인테리봇 견적 시스템 V3 - 필름 단가표
 * 
 * 아르젠 추천: 현대 슈퍼매트/영림 발렌 = 도장 느낌 무광, 지문방지
 * 단위: m당 단가
 * 노무비: 1조당 600,000원
 */

import { 
  Grade, 
  GradeBrands, 
  SizeRange, 
  SIZE_QUANTITIES,
  ARGEN_RECOMMENDED 
} from './types';
import { FILM_DAYS } from './labor';

// ============================================================
// 1. 필름 브랜드
// ============================================================

/** 필름 브랜드 목록 (등급별 × 3사) */
export const FILM_BRANDS: GradeBrands = {
  BASIC: [
    { name: '현대 보닥', product: 'Basic S176', description: '솔리드' },
    { name: '영림', product: 'PS', description: '솔리드' },
    { name: '기타', product: '-', description: '솔리드' }
  ],
  STANDARD: [
    { name: '현대 보닥', product: 'W/Z 우드', description: '우드' },
    { name: '영림', product: 'PW/CW', description: '우드' },
    { name: '기타', product: '-', description: '우드' }
  ],
  ARGEN: [
    { name: '현대 보닥', product: 'SPW 슈퍼매트', description: '아르젠 추천 - 도장 느낌 무광' },
    { name: '영림', product: '발렌', description: '아르젠 추천 - 지문방지 무광' },
    { name: '기타', product: '-', description: '아르젠 추천' }
  ],
  PREMIUM: [
    { name: '3M', product: '다이노크', description: '수입 최고급' },
    { name: '기타', product: '수입필름', description: '수입' },
    { name: '기타', product: '-', description: '수입' }
  ]
};

// ============================================================
// 2. 필름 단가 (m당)
// ============================================================

/** 등급별 m당 자재비 */
export const FILM_MATERIAL_PRICES: Record<Grade, number> = {
  BASIC: 8000,       // 8,000원/m
  STANDARD: 11000,   // 11,000원/m
  ARGEN: 14000,      // 14,000원/m (Standard 가격대)
  PREMIUM: 55000     // 55,000원/m (수입)
};

/** 노무비 (1조당) */
export const FILM_LABOR_PRICE_PER_TEAM = 600000;  // 600,000원/조

// ============================================================
// 3. 평형별 물량/비용 계산
// ============================================================

/** 필름 견적 결과 */
export interface FilmEstimate {
  grade: Grade;
  sizeRange: SizeRange;
  py: number;
  
  // 물량
  length: number;             // 시공 길이 (m)
  
  // 자재비
  pricePerM: number;          // m당 자재비
  materialCost: number;       // 자재비 합계
  
  // 노무비
  days: number;               // 시공 일수
  laborCost: number;          // 노무비 합계
  
  // 합계
  totalCost: number;          // 총 비용
  
  // 브랜드
  brands: typeof FILM_BRANDS.BASIC;
  argenConcept: typeof ARGEN_RECOMMENDED;
}

/** 필름 견적 계산 */
export function calculateFilmEstimate(
  grade: Grade,
  sizeRange: SizeRange,
  py: number
): FilmEstimate {
  const quantities = SIZE_QUANTITIES[sizeRange];
  
  // 시공 길이 (평형별 기준)
  const length = quantities.filmLength;
  
  // 자재비
  const pricePerM = FILM_MATERIAL_PRICES[grade];
  const materialCost = length * pricePerM;
  
  // 노무비 (1조 60만원 × 일수)
  const days = FILM_DAYS[sizeRange];
  const laborCost = Math.round(days * FILM_LABOR_PRICE_PER_TEAM);
  
  // 합계
  const totalCost = materialCost + laborCost;
  
  return {
    grade,
    sizeRange,
    py,
    length,
    pricePerM,
    materialCost,
    days,
    laborCost,
    totalCost,
    brands: FILM_BRANDS[grade],
    argenConcept: ARGEN_RECOMMENDED
  };
}

// ============================================================
// 4. 평형별 기준 비용표 (미리 계산된 값)
// ============================================================

/** 평형별 필름 비용 */
export const FILM_COST_BY_SIZE: Record<SizeRange, Record<Grade, { 
  length: number; 
  materialCost: number; 
  laborCost: number;
  totalCost: number;
}>> = {
  '10PY': {
    BASIC: { length: 15, materialCost: 120000, laborCost: 600000, totalCost: 720000 },
    STANDARD: { length: 15, materialCost: 165000, laborCost: 600000, totalCost: 765000 },
    ARGEN: { length: 15, materialCost: 210000, laborCost: 600000, totalCost: 810000 },
    PREMIUM: { length: 15, materialCost: 825000, laborCost: 600000, totalCost: 1425000 }
  },
  '20PY': {
    BASIC: { length: 28, materialCost: 224000, laborCost: 900000, totalCost: 1124000 },
    STANDARD: { length: 28, materialCost: 308000, laborCost: 900000, totalCost: 1208000 },
    ARGEN: { length: 28, materialCost: 392000, laborCost: 900000, totalCost: 1292000 },
    PREMIUM: { length: 28, materialCost: 1540000, laborCost: 900000, totalCost: 2440000 }
  },
  '30PY': {
    BASIC: { length: 45, materialCost: 360000, laborCost: 1200000, totalCost: 1560000 },
    STANDARD: { length: 45, materialCost: 495000, laborCost: 1200000, totalCost: 1695000 },
    ARGEN: { length: 45, materialCost: 630000, laborCost: 1200000, totalCost: 1830000 },
    PREMIUM: { length: 45, materialCost: 2475000, laborCost: 1200000, totalCost: 3675000 }
  },
  '40PY': {
    BASIC: { length: 60, materialCost: 480000, laborCost: 1500000, totalCost: 1980000 },
    STANDARD: { length: 60, materialCost: 660000, laborCost: 1500000, totalCost: 2160000 },
    ARGEN: { length: 60, materialCost: 840000, laborCost: 1500000, totalCost: 2340000 },
    PREMIUM: { length: 60, materialCost: 3300000, laborCost: 1500000, totalCost: 4800000 }
  },
  '50PY': {
    BASIC: { length: 80, materialCost: 640000, laborCost: 1800000, totalCost: 2440000 },
    STANDARD: { length: 80, materialCost: 880000, laborCost: 1800000, totalCost: 2680000 },
    ARGEN: { length: 80, materialCost: 1120000, laborCost: 1800000, totalCost: 2920000 },
    PREMIUM: { length: 80, materialCost: 4400000, laborCost: 1800000, totalCost: 6200000 }
  }
};

// ============================================================
// 5. 필름 종류별 설명
// ============================================================

/** 필름 종류 */
export const FILM_TYPES = {
  SOLID: {
    id: 'SOLID',
    name: '솔리드',
    description: '단색 필름. 저렴하고 무난함.',
    grades: ['BASIC']
  },
  WOOD: {
    id: 'WOOD',
    name: '우드',
    description: '나무결 무늬. 자연스러운 느낌.',
    grades: ['STANDARD']
  },
  SUPER_MATTE: {
    id: 'SUPER_MATTE',
    name: '슈퍼매트',
    description: '도장 느낌의 무광. 지문방지 기능.',
    grades: ['ARGEN']
  },
  DINOC: {
    id: 'DINOC',
    name: '다이노크',
    description: '3M 수입 필름. 최고급 마감.',
    grades: ['PREMIUM']
  }
};

// ============================================================
// 6. 필름 관련 유틸리티
// ============================================================

/** 등급별 추천 문구 */
export function getFilmRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '기본 솔리드 필름입니다. 단색으로 깔끔하고 가격이 저렴합니다.';
    case 'STANDARD':
      return '우드 패턴 필름입니다. 나무결이 자연스럽고 분위기 있습니다.';
    case 'ARGEN':
      return '⭐ 아르젠 추천: 현대 SPW 슈퍼매트 또는 영림 발렌! 도장처럼 매끄럽고 지문이 안 남습니다.';
    case 'PREMIUM':
      return '3M 다이노크 수입 필름입니다. 최고급 질감과 내구성을 자랑합니다.';
  }
}

/** 필름 시공 부위 */
export const FILM_APPLICATION_AREAS = {
  DOOR: { name: '방문', description: '문짝 + 문틀' },
  WINDOW_FRAME: { name: '샷시 프레임', description: '창틀 마감' },
  FURNITURE: { name: '가구', description: '붙박이장, 신발장 등' },
  KITCHEN: { name: '주방', description: '싱크대 상부장 리폼' }
};

/** 1일 시공 물량 */
export const FILM_DAILY_OUTPUT = {
  description: '2인 1조 기준',
  방문세트: '3~4세트 (문+틀)',
  샷시: '3~4틀 (이중창)',
  note: '밑작업(샌딩/퍼티) 포함, 굴곡 많으면 물량 감소'
};



