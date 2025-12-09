/**
 * 인테리봇 견적 시스템 V3 - 조명 & 배선기구 단가표
 * 
 * 조명은 인테리어의 꽃
 * 개당 단가로 정확히 산출
 */

import { 
  Grade, 
  SizeRange, 
  SIZE_QUANTITIES,
  ARGEN_RECOMMENDED 
} from './types';

// ============================================================
// 1. 다운라이트 단가표
// ============================================================

/** 다운라이트 등급 */
export type DownlightGrade = 'STANDARD' | 'ARGEN' | 'PREMIUM';

/** 다운라이트 옵션 */
export const DOWNLIGHT_OPTIONS: Record<DownlightGrade, {
  brands: string[];
  price: number;
  spec: string;
  description: string;
}> = {
  STANDARD: {
    brands: ['필립스', '오스람', '시그마'],
    price: 15000,
    spec: '3인치 COB / 확산형',
    description: 'KS인증. 가장 일반적.'
  },
  ARGEN: {
    brands: ['필립스 프리미엄'],
    price: 25000,
    spec: '3인치 COB 고급형',
    description: '⭐ 아르젠 추천. 고연색성 LED.'
  },
  PREMIUM: {
    brands: ['루이스폴센(st)', '수입'],
    price: 50000,
    spec: '디자인 조명',
    description: '디자인 조명. 인테리어 포인트.'
  }
};

// ============================================================
// 2. 간접조명 단가표
// ============================================================

/** 간접조명 T5 (m당) */
export const INDIRECT_LIGHT_OPTIONS = {
  brands: ['필립스', '남영', '시그마'],
  pricePerM: 12000,  // 12,000원/m
  description: '커튼박스용 T5 조명'
};

// ============================================================
// 3. 스위치/콘센트 단가표
// ============================================================

/** 스위치/콘센트 등급 */
export type SwitchGrade = 'STANDARD' | 'ARGEN' | 'PREMIUM';

/** 스위치/콘센트 옵션 */
export const SWITCH_OPTIONS: Record<SwitchGrade, {
  brands: string[];
  price: number;
  description: string;
}> = {
  STANDARD: {
    brands: ['르그랑(아펠라)', '나노', '진흥'],
    price: 8000,
    description: '국산 고급형 (화이트/블랙)'
  },
  ARGEN: {
    brands: ['르그랑(아펠라) 프리미엄'],
    price: 12000,
    description: '⭐ 아르젠 추천. 프리미엄 디자인.'
  },
  PREMIUM: {
    brands: ['르그랑(아테오)', '융(JUNG)'],
    price: 80000,
    description: '유럽형/알루미늄/토글 스위치'
  }
};

// ============================================================
// 4. 평형별 물량/비용 계산
// ============================================================

/** 조명 견적 결과 */
export interface LightingEstimate {
  sizeRange: SizeRange;
  py: number;
  
  // 다운라이트
  downlightGrade: DownlightGrade;
  downlightCount: number;
  downlightPrice: number;
  downlightCost: number;
  
  // 간접조명
  indirectLength: number;
  indirectPricePerM: number;
  indirectCost: number;
  
  // 스위치/콘센트
  switchGrade: SwitchGrade;
  switchCount: number;
  switchPrice: number;
  switchCost: number;
  
  // 합계
  totalCost: number;
}

/** 조명 견적 계산 */
export function calculateLightingEstimate(
  sizeRange: SizeRange,
  py: number,
  downlightGrade: DownlightGrade = 'ARGEN',
  switchGrade: SwitchGrade = 'ARGEN'
): LightingEstimate {
  const quantities = SIZE_QUANTITIES[sizeRange];
  
  // 다운라이트
  const downlightCount = quantities.downlightCount;
  const downlightPrice = DOWNLIGHT_OPTIONS[downlightGrade].price;
  const downlightCost = downlightCount * downlightPrice;
  
  // 간접조명
  const indirectLength = quantities.indirectLightLength;
  const indirectPricePerM = INDIRECT_LIGHT_OPTIONS.pricePerM;
  const indirectCost = indirectLength * indirectPricePerM;
  
  // 스위치/콘센트
  const switchCount = quantities.switchCount;
  const switchPrice = SWITCH_OPTIONS[switchGrade].price;
  const switchCost = switchCount * switchPrice;
  
  // 합계
  const totalCost = downlightCost + indirectCost + switchCost;
  
  return {
    sizeRange,
    py,
    downlightGrade,
    downlightCount,
    downlightPrice,
    downlightCost,
    indirectLength,
    indirectPricePerM,
    indirectCost,
    switchGrade,
    switchCount,
    switchPrice,
    switchCost,
    totalCost
  };
}

// ============================================================
// 5. 평형별 기준 비용표 (미리 계산된 값, ARGEN 기준)
// ============================================================

/** 평형별 조명 비용 (ARGEN 기준) */
export const LIGHTING_COST_BY_SIZE: Record<SizeRange, {
  downlightCount: number;
  downlightCost: number;
  indirectLength: number;
  indirectCost: number;
  switchCount: number;
  switchCost: number;
  totalCost: number;
}> = {
  '10PY': {
    downlightCount: 12,
    downlightCost: 300000,
    indirectLength: 10,
    indirectCost: 120000,
    switchCount: 20,
    switchCost: 240000,
    totalCost: 660000
  },
  '20PY': {
    downlightCount: 12,
    downlightCost: 300000,
    indirectLength: 10,
    indirectCost: 120000,
    switchCount: 20,
    switchCost: 240000,
    totalCost: 660000
  },
  '30PY': {
    downlightCount: 17,
    downlightCost: 425000,
    indirectLength: 15,
    indirectCost: 180000,
    switchCount: 30,
    switchCost: 360000,
    totalCost: 965000
  },
  '40PY': {
    downlightCount: 22,
    downlightCost: 550000,
    indirectLength: 20,
    indirectCost: 240000,
    switchCount: 40,
    switchCost: 480000,
    totalCost: 1270000
  },
  '50PY': {
    downlightCount: 28,
    downlightCost: 700000,
    indirectLength: 25,
    indirectCost: 300000,
    switchCount: 50,
    switchCost: 600000,
    totalCost: 1600000
  }
};

// ============================================================
// 6. 등급별 비교표
// ============================================================

/** 등급별 조명 비용 비교 (30평대 기준) */
export const LIGHTING_GRADE_COMPARISON_30PY = {
  STANDARD: {
    downlight: { count: 17, price: 15000, cost: 255000 },
    indirect: { length: 15, price: 12000, cost: 180000 },
    switch: { count: 30, price: 8000, cost: 240000 },
    total: 675000
  },
  ARGEN: {
    downlight: { count: 17, price: 25000, cost: 425000 },
    indirect: { length: 15, price: 12000, cost: 180000 },
    switch: { count: 30, price: 12000, cost: 360000 },
    total: 965000
  },
  PREMIUM: {
    downlight: { count: 17, price: 50000, cost: 850000 },
    indirect: { length: 15, price: 12000, cost: 180000 },
    switch: { count: 30, price: 80000, cost: 2400000 },
    total: 3430000
  }
};

// ============================================================
// 7. 조명 관련 유틸리티
// ============================================================

/** 다운라이트 등급별 추천 문구 */
export function getDownlightRecommendation(grade: DownlightGrade): string {
  switch (grade) {
    case 'STANDARD':
      return '기본 다운라이트입니다. KS인증으로 품질이 보장됩니다.';
    case 'ARGEN':
      return '⭐ 아르젠 추천: 고연색성 LED로 공간의 색감이 더 예쁘게 보입니다!';
    case 'PREMIUM':
      return '디자인 조명입니다. 인테리어의 포인트가 됩니다.';
  }
}

/** 스위치 등급별 추천 문구 */
export function getSwitchRecommendation(grade: SwitchGrade): string {
  switch (grade) {
    case 'STANDARD':
      return '국산 고급형 스위치입니다. 화이트/블랙 선택 가능합니다.';
    case 'ARGEN':
      return '⭐ 아르젠 추천: 르그랑 프리미엄! 깔끔한 디자인과 터치감이 좋습니다.';
    case 'PREMIUM':
      return '유럽형 토글 스위치입니다. 호텔/고급 주택에서 사용하는 제품입니다.';
  }
}

/** 조명 배치 가이드 */
export const LIGHTING_PLACEMENT_GUIDE = {
  livingRoom: {
    name: '거실',
    recommendation: '메인 조명 + 간접조명 조합',
    downlightSpacing: '1.2~1.5m 간격',
    indirectLocation: '커튼박스, TV벽'
  },
  bedroom: {
    name: '침실',
    recommendation: '은은한 간접조명 중심',
    downlightSpacing: '1.5m 간격',
    indirectLocation: '헤드보드, 커튼박스'
  },
  kitchen: {
    name: '주방',
    recommendation: '밝은 다운라이트 + 싱크대 하부 조명',
    downlightSpacing: '1m 간격',
    indirectLocation: '싱크대 상부장 하단'
  },
  bathroom: {
    name: '욕실',
    recommendation: '방습형 다운라이트',
    downlightSpacing: '1m 간격',
    indirectLocation: '거울장 하부'
  }
};

/** 노무비 안내 */
export const LIGHTING_LABOR_NOTE = {
  description: '조명 설치는 전기 공사에 포함',
  electricalRate: '전기 공사 기본 300,000원~',
  note: '다운라이트 개수에 따라 추가 비용 발생 가능'
};



