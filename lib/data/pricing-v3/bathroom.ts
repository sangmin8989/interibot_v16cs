/**
 * 인테리봇 견적 시스템 V3 - 욕실 단가표
 * 
 * 위생도기/욕실장/액세서리/비데/욕조
 * "욕실은 '타일'과 '수전'이 분위기의 80%를 좌우합니다"
 * 
 * 🔧 아르젠 제작: 욕실장 (슬라이딩 + LED 간접조명)
 */

import { 
  Grade, 
  SizeRange, 
  SIZE_QUANTITIES,
  ARGEN_MADE,
  ARGEN_RECOMMENDED
} from './types';

// ============================================================
// 1. 양변기 단가표
// ============================================================

/** 양변기 브랜드 및 단가 */
export const TOILET_OPTIONS: Record<Grade, {
  brands: string[];
  price: number;
  description: string;
}> = {
  BASIC: {
    brands: ['대림 도비도스', '크린스', '인토'],
    price: 180000,
    description: '투피스 (물탱크 분리형). 디자인보다 기능 위주.'
  },
  STANDARD: {
    brands: ['아메리칸스탠다드', '대림바스'],
    price: 350000,
    description: '치마형 투피스/원피스. 청소 용이.'
  },
  ARGEN: {
    brands: ['아메리칸스탠다드 프리미엄'],
    price: 450000,
    description: '⭐ 아르젠 추천. 프리미엄 원피스.'
  },
  PREMIUM: {
    brands: ['TOTO', '콜러', '듀라빗'],
    price: 800000,
    description: '비데일체형/직수형. 자동 물내림 등 편의기능.'
  }
};

// ============================================================
// 2. 세면대 단가표
// ============================================================

/** 세면대 브랜드 및 단가 */
export const BASIN_OPTIONS: Record<Grade, {
  brands: string[];
  price: number;
  description: string;
}> = {
  BASIC: {
    brands: ['계림', '대림', '로얄'],
    price: 120000,
    description: '긴다리/반다리 (일반형)'
  },
  STANDARD: {
    brands: ['아메리칸스탠다드 (플랫/웨이브)'],
    price: 250000,
    description: '일체형 라운드/스퀘어 디자인'
  },
  ARGEN: {
    brands: ['아메리칸스탠다드 프리미엄'],
    price: 320000,
    description: '⭐ 아르젠 추천. 프리미엄 디자인.'
  },
  PREMIUM: {
    brands: ['듀라빗', '콜러', '새턴바스'],
    price: 500000,
    description: '박스형/액상아크릴(LAR). 호텔 스위트룸 사양.'
  }
};

// ============================================================
// 3. 수전 단가표 (세면+샤워)
// ============================================================

/** 수전 브랜드 및 단가 */
export const FAUCET_OPTIONS: Record<Grade, {
  brands: string[];
  price: number;
  description: string;
}> = {
  BASIC: {
    brands: ['한양', '대림통상', '워터웍스'],
    price: 50000,
    description: '크롬(유광) 기본 수전'
  },
  STANDARD: {
    brands: ['아메리칸스탠다드', '더죤테크'],
    price: 120000,
    description: '무광 니켈 (SUS304). 물자국 안 남고 고급스러움.'
  },
  ARGEN: {
    brands: ['아메리칸스탠다드 프리미엄', '더죤테크 프리미엄'],
    price: 180000,
    description: '⭐ 아르젠 추천. SUS304 무광 프리미엄.'
  },
  PREMIUM: {
    brands: ['그로헤', '한스그로헤', '콜러'],
    price: 400000,
    description: '독일/미국 수입 명품. 디자인과 내구성의 정점.'
  }
};

// ============================================================
// 4. 욕실장 단가표 (🔧 아르젠 제작)
// ============================================================

/** 욕실장 브랜드 및 단가 */
export const BATHROOM_CABINET_OPTIONS: Record<Grade, {
  brands: string[];
  price: number;
  type: string;
  description: string;
}> = {
  BASIC: {
    brands: ['대림', '카비원', '중소기업'],
    price: 150000,
    type: '거울장 세트',
    description: '거울장+누드거울. 가장 일반적이고 저렴함.'
  },
  STANDARD: {
    brands: ['계림', '카비원'],
    price: 250000,
    type: '슬라이딩장',
    description: '댐핑 기능. 1200×800'
  },
  ARGEN: {
    brands: ['🔧 아르젠 제작'],
    price: 350000,
    type: '슬라이딩장 + LED',
    description: '🔧 아르젠 제작. 하부 간접조명 타공.'
  },
  PREMIUM: {
    brands: ['새턴', '콜러'],
    price: 600000,
    type: '하부장',
    description: '대리석 상판 + 도장/PET 마감. 파우더룸 같은 럭셔리함.'
  }
};

// ============================================================
// 5. 욕실 액세서리 단가표
// ============================================================

/** 욕실 액세서리 (4품 세트: 수건/휴지/컵/비누) */
export const ACCESSORY_OPTIONS: Record<Grade, {
  brands: string[];
  price: number;
  description: string;
}> = {
  BASIC: {
    brands: ['한양', '대림통상', '중소기업'],
    price: 50000,
    description: '일반 크롬(유광) 재질'
  },
  STANDARD: {
    brands: ['아메리칸스탠다드', '더죤테크', '수성'],
    price: 120000,
    description: '무광 니켈/블랙/골드 등 컬러 선택. 수전과 컬러 매칭 필수.'
  },
  ARGEN: {
    brands: ['더죤테크 프리미엄'],
    price: 150000,
    description: '⭐ 아르젠 추천. 무광 4품 + 수전 컬러 매칭.'
  },
  PREMIUM: {
    brands: ['그로헤', '한스그로헤', '폰타나'],
    price: 350000,
    description: '묵직한 무게감과 마감 퀄리티. 변색이나 녹이 슬지 않음.'
  }
};

// ============================================================
// 6. 비데 단가표
// ============================================================

/** 비데 타입 */
export type BidetType = 'STANDARD' | 'ARGEN' | 'PREMIUM';

/** 비데 옵션 */
export const BIDET_OPTIONS: Record<BidetType, {
  brands: string[];
  price: number;
  description: string;
}> = {
  STANDARD: {
    brands: ['대림', '이누스', '노비타'],
    price: 250000,
    description: '방수 비데, 스테인리스 노즐'
  },
  ARGEN: {
    brands: ['노비타 프리미엄'],
    price: 350000,
    description: '⭐ 아르젠 추천. 프리미엄 기능.'
  },
  PREMIUM: {
    brands: ['아메리칸스탠다드', 'TOTO'],
    price: 500000,
    description: '양변기 일체형 디자인 (자동 물내림)'
  }
};

// ============================================================
// 7. 욕조 단가표
// ============================================================

/** 욕조 타입 */
export type BathtubType = 'SMC' | 'ACRYLIC' | 'MASONRY';

/** 욕조 옵션 */
export const BATHTUB_OPTIONS: Record<BathtubType, {
  brands: string[];
  price: number;
  description: string;
}> = {
  SMC: {
    brands: ['대림', '인터바스'],
    price: 300000,
    description: '일반적인 플라스틱 욕조. 가볍고 저렴.'
  },
  ACRYLIC: {
    brands: ['아메리칸스탠다드', '새턴'],
    price: 600000,
    description: '⭐ 아르젠 추천. 표면 광택이 좋고 단단함. 오염에 강함.'
  },
  MASONRY: {
    brands: ['조적+타일'],
    price: 800000,
    description: '호텔식 타일 욕조. 조적+방수+타일 마감.'
  }
};

// ============================================================
// 8. 욕실 1세트 견적 계산
// ============================================================

/** 욕실 1세트 견적 결과 */
export interface BathroomSetEstimate {
  grade: Grade;
  
  // 개별 항목
  toilet: { price: number; brands: string[] };
  basin: { price: number; brands: string[] };
  faucet: { price: number; brands: string[] };
  cabinet: { price: number; brands: string[]; type: string };
  accessory: { price: number; brands: string[] };
  
  // 합계 (비데/욕조 미포함)
  setTotal: number;
  
  // 옵션
  bidet?: { price: number; brands: string[] };
  bathtub?: { price: number; brands: string[] };
  
  // 총계 (옵션 포함)
  grandTotal: number;
}

/** 욕실 1세트 견적 계산 */
export function calculateBathroomSetEstimate(
  grade: Grade,
  options?: {
    includeBidet?: boolean;
    bidetType?: BidetType;
    includeBathtub?: boolean;
    bathtubType?: BathtubType;
  }
): BathroomSetEstimate {
  const toilet = TOILET_OPTIONS[grade];
  const basin = BASIN_OPTIONS[grade];
  const faucet = FAUCET_OPTIONS[grade];
  const cabinet = BATHROOM_CABINET_OPTIONS[grade];
  const accessory = ACCESSORY_OPTIONS[grade];
  
  const setTotal = toilet.price + basin.price + faucet.price + cabinet.price + accessory.price;
  
  let grandTotal = setTotal;
  let bidet: { price: number; brands: string[] } | undefined;
  let bathtub: { price: number; brands: string[] } | undefined;
  
  if (options?.includeBidet) {
    const bidetType = options.bidetType || 'STANDARD';
    const bidetOption = BIDET_OPTIONS[bidetType];
    bidet = { price: bidetOption.price, brands: bidetOption.brands };
    grandTotal += bidetOption.price;
  }
  
  if (options?.includeBathtub) {
    const bathtubType = options.bathtubType || 'SMC';
    const bathtubOption = BATHTUB_OPTIONS[bathtubType];
    bathtub = { price: bathtubOption.price, brands: bathtubOption.brands };
    grandTotal += bathtubOption.price;
  }
  
  return {
    grade,
    toilet: { price: toilet.price, brands: toilet.brands },
    basin: { price: basin.price, brands: basin.brands },
    faucet: { price: faucet.price, brands: faucet.brands },
    cabinet: { price: cabinet.price, brands: cabinet.brands, type: cabinet.type },
    accessory: { price: accessory.price, brands: accessory.brands },
    setTotal,
    bidet,
    bathtub,
    grandTotal
  };
}

// ============================================================
// 9. 평형별 욕실 비용 (욕실 개수 기준)
// ============================================================

/** 평형별 욕실 비용 (위생도기+욕실장+액세서리, 타일/설비 별도) */
export const BATHROOM_COST_BY_SIZE: Record<SizeRange, Record<Grade, {
  bathroomCount: number;
  perSetCost: number;
  totalCost: number;
}>> = {
  '10PY': {
    BASIC: { bathroomCount: 1, perSetCost: 550000, totalCost: 550000 },
    STANDARD: { bathroomCount: 1, perSetCost: 1090000, totalCost: 1090000 },
    ARGEN: { bathroomCount: 1, perSetCost: 1450000, totalCost: 1450000 },
    PREMIUM: { bathroomCount: 1, perSetCost: 2850000, totalCost: 2850000 }
  },
  '20PY': {
    BASIC: { bathroomCount: 1, perSetCost: 550000, totalCost: 550000 },
    STANDARD: { bathroomCount: 1, perSetCost: 1090000, totalCost: 1090000 },
    ARGEN: { bathroomCount: 1, perSetCost: 1450000, totalCost: 1450000 },
    PREMIUM: { bathroomCount: 1, perSetCost: 2850000, totalCost: 2850000 }
  },
  '30PY': {
    BASIC: { bathroomCount: 2, perSetCost: 550000, totalCost: 1100000 },
    STANDARD: { bathroomCount: 2, perSetCost: 1090000, totalCost: 2180000 },
    ARGEN: { bathroomCount: 2, perSetCost: 1450000, totalCost: 2900000 },
    PREMIUM: { bathroomCount: 2, perSetCost: 2850000, totalCost: 5700000 }
  },
  '40PY': {
    BASIC: { bathroomCount: 2, perSetCost: 550000, totalCost: 1100000 },
    STANDARD: { bathroomCount: 2, perSetCost: 1090000, totalCost: 2180000 },
    ARGEN: { bathroomCount: 2, perSetCost: 1450000, totalCost: 2900000 },
    PREMIUM: { bathroomCount: 2, perSetCost: 2850000, totalCost: 5700000 }
  },
  '50PY': {
    BASIC: { bathroomCount: 2, perSetCost: 550000, totalCost: 1100000 },
    STANDARD: { bathroomCount: 2, perSetCost: 1090000, totalCost: 2180000 },
    ARGEN: { bathroomCount: 2, perSetCost: 1450000, totalCost: 2900000 },
    PREMIUM: { bathroomCount: 2, perSetCost: 2850000, totalCost: 5700000 }
  }
};

// ============================================================
// 10. 욕실 관련 유틸리티
// ============================================================

/** 등급별 추천 문구 */
export function getBathroomRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '가성비 욕실입니다. 전세용이라면 대림 도비도스 + 국산 수전 조합이 딱입니다.';
    case 'STANDARD':
      return '가장 많이 하시는 조합! 아메리칸스탠다드 도기 + 무광 수전. 호텔 느낌 나면서 관리도 편합니다.';
    case 'ARGEN':
      return '⭐ 아르젠 추천: 아메리칸스탠다드 프리미엄 도기 + SUS304 무광 수전 + 🔧아르젠 제작 LED 욕실장!';
    case 'PREMIUM':
      return '진짜 호텔을 원하시면 그로헤 매립 수전 + TOTO 양변기! 샤워할 때마다 5성급 호텔 기분!';
  }
}

/** 노무비 안내 */
export const BATHROOM_LABOR_NOTE = {
  description: '욕실 위생도기 설치는 설비 노무비에 포함',
  plumbingRate: '설비 1조당 500,000원',
  note: '방수 2개소 또는 배관이설 2~3개소 기준'
};

/** 아르젠 욕실장 특장점 */
export const ARGEN_BATHROOM_CABINET_FEATURES = {
  type: '슬라이딩장 + LED 간접조명',
  size: '1200×800',
  features: [
    '댐핑 기능 (부드럽게 닫힘)',
    '하부 간접조명 타공',
    'LED 조명 포함',
    '습기 방지 코팅'
  ],
  advantage: 'Standard 가격에 Premium 기능!'
};



