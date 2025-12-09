/**
 * 인테리봇 견적 시스템 V3 - 붙박이장/수납장 단가표
 * 
 * 🔧 아르젠 제작: 블룸 믹스 하드웨어 = Standard 가격에 Premium 내구성
 * 단위: 자(30cm)당 단가
 */

import { 
  Grade, 
  SizeRange, 
  SIZE_QUANTITIES,
  ARGEN_MADE 
} from './types';

// ============================================================
// 1. 붙박이장 등급별 스펙
// ============================================================

/** 붙박이장 스펙 */
export interface FurnitureSpec {
  board: string;        // 보드 재질
  door: string;         // 도어 재질
  hardware: string;     // 하드웨어
}

/** 등급별 붙박이장 스펙 */
export const FURNITURE_SPECS: Record<Grade, FurnitureSpec> = {
  BASIC: {
    board: '중소기업',
    door: 'LPM',
    hardware: '일반 경첩'
  },
  STANDARD: {
    board: '예림/LX',
    door: 'PET 무광',
    hardware: '국산 댐핑'
  },
  ARGEN: {
    board: '예림 프리미엄',
    door: 'PET 무광',
    hardware: '블룸 믹스'
  },
  PREMIUM: {
    board: '고급 도장',
    door: '브론즈경',
    hardware: '블룸 정품'
  }
};

// ============================================================
// 2. 붙박이장 단가 (자당)
// ============================================================

/** 붙박이장 타입 */
export type ClosetType = 'SWING' | 'SLIDING';

/** 등급별 자당(30cm) 자재비 */
export const CLOSET_PRICES: Record<Grade, Record<ClosetType, number>> = {
  BASIC: {
    SWING: 110000,     // 여닫이 110,000원/자
    SLIDING: 140000    // 미닫이 140,000원/자
  },
  STANDARD: {
    SWING: 130000,     // 여닫이 130,000원/자
    SLIDING: 160000    // 미닫이 160,000원/자
  },
  ARGEN: {
    SWING: 160000,     // 여닫이 160,000원/자 (Standard 가격대)
    SLIDING: 200000    // 미닫이 200,000원/자
  },
  PREMIUM: {
    SWING: 250000,     // 여닫이 250,000원/자
    SLIDING: 320000    // 미닫이 320,000원/자
  }
};

/** 신발장 단가 (자당) - 붙박이장과 동일 스펙 적용 */
export const SHOERACK_PRICES: Record<Grade, number> = {
  BASIC: 110000,      // 110,000원/자
  STANDARD: 130000,   // 130,000원/자
  ARGEN: 160000,      // 160,000원/자
  PREMIUM: 250000     // 250,000원/자
};

// ============================================================
// 3. 평형별 물량/비용 계산
// ============================================================

/** 가구 견적 결과 */
export interface FurnitureEstimate {
  grade: Grade;
  sizeRange: SizeRange;
  py: number;
  
  // 붙박이장
  closetJa: number;           // 붙박이장 길이 (자)
  closetType: ClosetType;     // 타입 (여닫이/미닫이)
  closetPricePerJa: number;   // 자당 단가
  closetCost: number;         // 붙박이장 비용
  
  // 신발장
  shoeRackJa: number;         // 신발장 길이 (자)
  shoeRackPricePerJa: number; // 자당 단가
  shoeRackCost: number;       // 신발장 비용
  
  // 합계
  totalCost: number;          // 총 비용
  
  // 스펙
  spec: FurnitureSpec;
  argenConcept: typeof ARGEN_MADE;
}

/** 가구 견적 계산 */
export function calculateFurnitureEstimate(
  grade: Grade,
  sizeRange: SizeRange,
  py: number,
  closetType: ClosetType = 'SWING'
): FurnitureEstimate {
  const quantities = SIZE_QUANTITIES[sizeRange];
  
  // 붙박이장
  const closetJa = quantities.closetJa;
  const closetPricePerJa = CLOSET_PRICES[grade][closetType];
  const closetCost = closetJa * closetPricePerJa;
  
  // 신발장
  const shoeRackJa = quantities.shoeRackJa;
  const shoeRackPricePerJa = SHOERACK_PRICES[grade];
  const shoeRackCost = shoeRackJa * shoeRackPricePerJa;
  
  // 합계
  const totalCost = closetCost + shoeRackCost;
  
  return {
    grade,
    sizeRange,
    py,
    closetJa,
    closetType,
    closetPricePerJa,
    closetCost,
    shoeRackJa,
    shoeRackPricePerJa,
    shoeRackCost,
    totalCost,
    spec: FURNITURE_SPECS[grade],
    argenConcept: ARGEN_MADE
  };
}

// ============================================================
// 4. 평형별 기준 비용표 (미리 계산된 값, 여닫이 기준)
// ============================================================

/** 평형별 가구 비용 (여닫이 기준) */
export const FURNITURE_COST_BY_SIZE: Record<SizeRange, Record<Grade, { 
  closetJa: number;
  closetCost: number;
  shoeRackJa: number;
  shoeRackCost: number;
  totalCost: number;
}>> = {
  '10PY': {
    BASIC: { closetJa: 8, closetCost: 880000, shoeRackJa: 4, shoeRackCost: 440000, totalCost: 1320000 },
    STANDARD: { closetJa: 8, closetCost: 1040000, shoeRackJa: 4, shoeRackCost: 520000, totalCost: 1560000 },
    ARGEN: { closetJa: 8, closetCost: 1280000, shoeRackJa: 4, shoeRackCost: 640000, totalCost: 1920000 },
    PREMIUM: { closetJa: 8, closetCost: 2000000, shoeRackJa: 4, shoeRackCost: 1000000, totalCost: 3000000 }
  },
  '20PY': {
    BASIC: { closetJa: 10, closetCost: 1100000, shoeRackJa: 5, shoeRackCost: 550000, totalCost: 1650000 },
    STANDARD: { closetJa: 10, closetCost: 1300000, shoeRackJa: 5, shoeRackCost: 650000, totalCost: 1950000 },
    ARGEN: { closetJa: 10, closetCost: 1600000, shoeRackJa: 5, shoeRackCost: 800000, totalCost: 2400000 },
    PREMIUM: { closetJa: 10, closetCost: 2500000, shoeRackJa: 5, shoeRackCost: 1250000, totalCost: 3750000 }
  },
  '30PY': {
    BASIC: { closetJa: 12, closetCost: 1320000, shoeRackJa: 6, shoeRackCost: 660000, totalCost: 1980000 },
    STANDARD: { closetJa: 12, closetCost: 1560000, shoeRackJa: 6, shoeRackCost: 780000, totalCost: 2340000 },
    ARGEN: { closetJa: 12, closetCost: 1920000, shoeRackJa: 6, shoeRackCost: 960000, totalCost: 2880000 },
    PREMIUM: { closetJa: 12, closetCost: 3000000, shoeRackJa: 6, shoeRackCost: 1500000, totalCost: 4500000 }
  },
  '40PY': {
    BASIC: { closetJa: 15, closetCost: 1650000, shoeRackJa: 7, shoeRackCost: 770000, totalCost: 2420000 },
    STANDARD: { closetJa: 15, closetCost: 1950000, shoeRackJa: 7, shoeRackCost: 910000, totalCost: 2860000 },
    ARGEN: { closetJa: 15, closetCost: 2400000, shoeRackJa: 7, shoeRackCost: 1120000, totalCost: 3520000 },
    PREMIUM: { closetJa: 15, closetCost: 3750000, shoeRackJa: 7, shoeRackCost: 1750000, totalCost: 5500000 }
  },
  '50PY': {
    BASIC: { closetJa: 18, closetCost: 1980000, shoeRackJa: 8, shoeRackCost: 880000, totalCost: 2860000 },
    STANDARD: { closetJa: 18, closetCost: 2340000, shoeRackJa: 8, shoeRackCost: 1040000, totalCost: 3380000 },
    ARGEN: { closetJa: 18, closetCost: 2880000, shoeRackJa: 8, shoeRackCost: 1280000, totalCost: 4160000 },
    PREMIUM: { closetJa: 18, closetCost: 4500000, shoeRackJa: 8, shoeRackCost: 2000000, totalCost: 6500000 }
  }
};

// ============================================================
// 5. 가구 종류별 설명
// ============================================================

/** 붙박이장 타입 */
export const CLOSET_TYPES = {
  SWING: {
    id: 'SWING',
    name: '여닫이',
    description: '문을 앞으로 열어서 여는 방식. 내부 공간 활용도 높음.',
    pros: ['내부 전체 사용 가능', '조명 설치 용이'],
    cons: ['문 열 공간 필요', '공간 차지']
  },
  SLIDING: {
    id: 'SLIDING',
    name: '미닫이 (슬라이딩)',
    description: '문을 옆으로 밀어서 여는 방식. 공간 절약.',
    pros: ['공간 절약', '모던한 디자인'],
    cons: ['한쪽만 열림', '레일 관리 필요']
  }
};

/** 수납장 종류 */
export const STORAGE_TYPES = {
  CLOSET: { name: '붙박이장', description: '방에 설치하는 옷장' },
  SHOERACK: { name: '신발장', description: '현관에 설치하는 신발 수납장' },
  PANTRY: { name: '팬트리', description: '주방 옆 식료품 수납장' },
  DRESSINGROOM: { name: '드레스룸', description: '옷 정리 전용 공간' }
};

// ============================================================
// 6. 가구 관련 유틸리티
// ============================================================

/** 등급별 추천 문구 */
export function getFurnitureRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '기본형 붙박이장입니다. LPM 도어와 일반 경첩으로 가격이 저렴합니다.';
    case 'STANDARD':
      return '표준형 붙박이장입니다. PET 무광 도어와 국산 댐핑 경첩으로 내구성이 좋습니다.';
    case 'ARGEN':
      return '🔧 아르젠 제작: Standard 가격대에서 블룸 믹스 하드웨어 적용! Premium급 내구성을 보장합니다.';
    case 'PREMIUM':
      return '최고급 붙박이장입니다. 고급 도장 도어와 블룸 정품 하드웨어로 호텔급 품질입니다.';
  }
}

/** 아르젠 제작 특장점 */
export const ARGEN_FURNITURE_FEATURES = {
  hardware: {
    name: '블룸 믹스 하드웨어',
    description: '블룸 경첩 + 국산 레일 조합. 가성비 최적화.',
    originalPrice: '경첩 1개당 15,000원 추가'
  },
  board: {
    name: '예림 프리미엄 보드',
    description: 'E0등급 친환경. 습기에 강함.',
    originalPrice: '일반 보드 대비 20% 업그레이드'
  },
  door: {
    name: 'PET 무광 도어',
    description: '지문 안 남음. 스크래치에 강함.',
    originalPrice: '표준 사양'
  }
};

/** 노무비 안내 */
export const FURNITURE_LABOR_NOTE = {
  description: '붙박이장/신발장 설치비는 목공비에 포함',
  carpentryRate: '목공 1조당 700,000원',
  typicalDays: '12~15자 기준 0.5~1일 소요'
};



