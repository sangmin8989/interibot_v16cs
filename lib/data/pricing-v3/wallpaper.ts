/**
 * 인테리봇 견적 시스템 V3 - 도배 단가표
 * 
 * 아르젠 추천: Standard 가격대에서 가장 품질 좋은 프리미엄 실크
 * 단위: 롤당 단가
 */

import { 
  Grade, 
  GradeBrands, 
  SizeRange, 
  SIZE_QUANTITIES,
  ARGEN_RECOMMENDED 
} from './types';
import { WALLPAPER_DAYS } from './labor';

// ============================================================
// 1. 도배 브랜드
// ============================================================

/** 도배 브랜드 목록 (등급별 × 3사) */
export const WALLPAPER_BRANDS: GradeBrands = {
  BASIC: [
    { name: 'LX하우시스', product: '휘앙세', description: '합지' },
    { name: '신한', product: '아이리스', description: '합지' },
    { name: '개나리', product: '트렌디', description: '합지' }
  ],
  STANDARD: [
    { name: 'LX하우시스', product: '베스띠', description: '일반 실크' },
    { name: '신한', product: '스케치', description: '일반 실크' },
    { name: '개나리', product: '아트북', description: '일반 실크' }
  ],
  ARGEN: [
    { name: 'LX하우시스', product: '지인 테라', description: '아르젠 추천 - 프리미엄 실크' },
    { name: '신한', product: '조용한', description: '아르젠 추천 - 프리미엄 실크' },
    { name: '개나리', product: '에비뉴', description: '아르젠 추천 - 프리미엄 실크' }
  ],
  PREMIUM: [
    { name: 'LX하우시스', product: '디아망', description: '하이엔드' },
    { name: '신한', product: '리얼스', description: '하이엔드' },
    { name: '개나리', product: '노블', description: '하이엔드' }
  ]
};

// ============================================================
// 2. 도배 단가 (롤당)
// ============================================================

/** 등급별 롤당 단가 */
export const WALLPAPER_PRICES: Record<Grade, number> = {
  BASIC: 25000,      // 25,000원/롤
  STANDARD: 40000,   // 40,000원/롤
  ARGEN: 45000,      // 45,000원/롤 (Standard 가격대)
  PREMIUM: 80000     // 80,000원/롤
};

// ============================================================
// 3. 평형별 물량/비용 계산
// ============================================================

/** 도배 견적 결과 */
export interface WallpaperEstimate {
  grade: Grade;
  sizeRange: SizeRange;
  py: number;
  
  // 물량
  rolls: number;              // 롤 수
  
  // 자재비
  pricePerRoll: number;       // 롤당 단가
  materialCost: number;       // 자재비 합계
  
  // 노무비
  days: number;               // 시공 일수
  laborCost: number;          // 노무비 (1조 60만원 × 일수)
  
  // 합계
  totalCost: number;          // 총 비용
  
  // 브랜드
  brands: typeof WALLPAPER_BRANDS.BASIC;
  argenConcept: typeof ARGEN_RECOMMENDED;
}

/** 도배 견적 계산 */
export function calculateWallpaperEstimate(
  grade: Grade,
  sizeRange: SizeRange,
  py: number,
  isExtended: boolean = false
): WallpaperEstimate {
  const quantities = SIZE_QUANTITIES[sizeRange];
  
  // 롤 수 (평형별 기준)
  const rolls = quantities.wallpaperRolls;
  
  // 자재비
  const pricePerRoll = WALLPAPER_PRICES[grade];
  const materialCost = rolls * pricePerRoll;
  
  // 노무비 (1조 60만원 × 일수)
  const laborPricePerTeam = 600000;
  const days = isExtended 
    ? WALLPAPER_DAYS[sizeRange].extended 
    : WALLPAPER_DAYS[sizeRange].normal;
  const laborCost = Math.round(days * laborPricePerTeam);
  
  // 합계
  const totalCost = materialCost + laborCost;
  
  return {
    grade,
    sizeRange,
    py,
    rolls,
    pricePerRoll,
    materialCost,
    days,
    laborCost,
    totalCost,
    brands: WALLPAPER_BRANDS[grade],
    argenConcept: ARGEN_RECOMMENDED
  };
}

// ============================================================
// 4. 평형별 기준 비용표 (미리 계산된 값)
// ============================================================

/** 평형별 도배 비용 (표준형 기준) */
export const WALLPAPER_COST_BY_SIZE: Record<SizeRange, Record<Grade, { 
  rolls: number; 
  materialCost: number; 
  laborCost: number;
  totalCost: number;
}>> = {
  '10PY': {
    BASIC: { rolls: 11, materialCost: 275000, laborCost: 600000, totalCost: 875000 },
    STANDARD: { rolls: 11, materialCost: 440000, laborCost: 600000, totalCost: 1040000 },
    ARGEN: { rolls: 11, materialCost: 495000, laborCost: 600000, totalCost: 1095000 },
    PREMIUM: { rolls: 11, materialCost: 880000, laborCost: 600000, totalCost: 1480000 }
  },
  '20PY': {
    BASIC: { rolls: 16, materialCost: 400000, laborCost: 900000, totalCost: 1300000 },
    STANDARD: { rolls: 16, materialCost: 640000, laborCost: 900000, totalCost: 1540000 },
    ARGEN: { rolls: 16, materialCost: 720000, laborCost: 900000, totalCost: 1620000 },
    PREMIUM: { rolls: 16, materialCost: 1280000, laborCost: 900000, totalCost: 2180000 }
  },
  '30PY': {
    BASIC: { rolls: 21, materialCost: 525000, laborCost: 1200000, totalCost: 1725000 },
    STANDARD: { rolls: 21, materialCost: 840000, laborCost: 1200000, totalCost: 2040000 },
    ARGEN: { rolls: 21, materialCost: 945000, laborCost: 1200000, totalCost: 2145000 },
    PREMIUM: { rolls: 21, materialCost: 1680000, laborCost: 1200000, totalCost: 2880000 }
  },
  '40PY': {
    BASIC: { rolls: 28, materialCost: 700000, laborCost: 1800000, totalCost: 2500000 },
    STANDARD: { rolls: 28, materialCost: 1120000, laborCost: 1800000, totalCost: 2920000 },
    ARGEN: { rolls: 28, materialCost: 1260000, laborCost: 1800000, totalCost: 3060000 },
    PREMIUM: { rolls: 28, materialCost: 2240000, laborCost: 1800000, totalCost: 4040000 }
  },
  '50PY': {
    BASIC: { rolls: 35, materialCost: 875000, laborCost: 2400000, totalCost: 3275000 },
    STANDARD: { rolls: 35, materialCost: 1400000, laborCost: 2400000, totalCost: 3800000 },
    ARGEN: { rolls: 35, materialCost: 1575000, laborCost: 2400000, totalCost: 3975000 },
    PREMIUM: { rolls: 35, materialCost: 2800000, laborCost: 2400000, totalCost: 5200000 }
  }
};

// ============================================================
// 5. 도배 종류별 설명
// ============================================================

/** 도배 종류 */
export const WALLPAPER_TYPES = {
  HAPJI: {
    id: 'HAPJI',
    name: '합지',
    description: '가장 기본적인 벽지. 저렴하고 내구성 보통.',
    grades: ['BASIC']
  },
  SILK: {
    id: 'SILK',
    name: '실크',
    description: '표면이 코팅되어 청소가 쉽고 오래감.',
    grades: ['STANDARD', 'ARGEN']
  },
  PREMIUM_SILK: {
    id: 'PREMIUM_SILK',
    name: '프리미엄 실크',
    description: '고급 질감과 패턴. 하이엔드 인테리어용.',
    grades: ['PREMIUM']
  }
};

// ============================================================
// 6. 도배 관련 유틸리티
// ============================================================

/** 등급별 추천 문구 */
export function getWallpaperRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '임대용이나 저예산 리모델링에 적합한 합지입니다. 내구성은 보통이지만 가격이 저렴합니다.';
    case 'STANDARD':
      return '일반 가정집에 가장 많이 사용하는 실크 벽지입니다. 청소가 쉽고 오래갑니다.';
    case 'ARGEN':
      return '⭐ 아르젠 추천: Standard 가격대에서 가장 품질 좋은 프리미엄 실크입니다. 지인 테라, 신한 조용한 등 인기 제품!';
    case 'PREMIUM':
      return '하이엔드 인테리어를 위한 최고급 벽지입니다. 고급 질감과 독특한 패턴이 특징입니다.';
  }
}

/** 브랜드별 특징 */
export function getBrandFeature(brandName: string): string {
  const features: Record<string, string> = {
    'LX하우시스': '국내 1위 건자재 브랜드. 다양한 라인업.',
    '신한': '가성비와 품질의 균형. 인기 패턴 다수.',
    '개나리': '합리적 가격. 트렌디한 디자인.'
  };
  return features[brandName] || '';
}



