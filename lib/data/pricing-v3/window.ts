/**
 * 인테리봇 견적 시스템 V3 - 샷시 단가표
 * 
 * ⭐ 아르젠 추천: Standard 가격대에서 아르곤 가스 충전 = Premium급 단열
 * 단위: 평형별 패키지 가격 (철거+시공+자재 포함)
 */

import { 
  Grade, 
  GradeBrands, 
  SizeRange,
  ARGEN_RECOMMENDED 
} from './types';

// ============================================================
// 1. 샷시 브랜드
// ============================================================

/** 샷시 브랜드 목록 (등급별 × 3사) */
export const WINDOW_BRANDS: GradeBrands = {
  BASIC: [
    { name: 'PNS', product: '일반형', description: '22mm 일반 복층' },
    { name: '재현', product: '일반형', description: '22mm 일반 복층' },
    { name: '영림', product: '일반형', description: '22mm 일반 복층' }
  ],
  STANDARD: [
    { name: 'KCC', product: '표준형', description: '24mm 로이(Low-E)' },
    { name: 'LX', product: 'Power', description: '24mm 로이(Low-E)' },
    { name: 'KCC', product: '일반형', description: '24mm 로이(Low-E)' }
  ],
  ARGEN: [
    { name: 'KCC', product: '프리미엄', description: '아르젠 추천 - 24mm 로이+아르곤' },
    { name: 'LX', product: '하이브리드', description: '아르젠 추천 - 24mm 로이+아르곤' },
    { name: 'KCC', product: '고급형', description: '아르젠 추천 - 24mm 로이+아르곤' }
  ],
  PREMIUM: [
    { name: 'LX', product: 'Super', description: '26mm 로이+아르곤+단열간봉' },
    { name: 'KCC', product: 'Klenze', description: '26mm 로이+아르곤+단열간봉' },
    { name: '수입', product: '유럽형', description: '26mm 로이+아르곤+단열간봉' }
  ]
};

// ============================================================
// 2. 샷시 스펙
// ============================================================

/** 샷시 스펙 */
export interface WindowSpec {
  glassThickness: string;   // 유리 두께
  lowE: boolean;            // 로이 코팅
  argon: boolean;           // 아르곤 가스
  thermalSpacer: boolean;   // 단열 간봉
}

/** 등급별 샷시 스펙 */
export const WINDOW_SPECS: Record<Grade, WindowSpec> = {
  BASIC: {
    glassThickness: '22mm',
    lowE: false,
    argon: false,
    thermalSpacer: false
  },
  STANDARD: {
    glassThickness: '24mm',
    lowE: true,
    argon: false,
    thermalSpacer: false
  },
  ARGEN: {
    glassThickness: '24mm',
    lowE: true,
    argon: true,
    thermalSpacer: false
  },
  PREMIUM: {
    glassThickness: '26mm',
    lowE: true,
    argon: true,
    thermalSpacer: true
  }
};

// ============================================================
// 3. 평형별 샷시 패키지 가격 (철거+시공+자재 포함)
// ============================================================

/** 평형별 샷시 패키지 가격 */
export const WINDOW_PACKAGE_PRICES: Record<SizeRange, Record<Grade, number>> = {
  '10PY': {
    BASIC: 3500000,
    STANDARD: 5000000,
    ARGEN: 5800000,
    PREMIUM: 7200000
  },
  '20PY': {
    BASIC: 5500000,
    STANDARD: 7500000,
    ARGEN: 8500000,
    PREMIUM: 10500000
  },
  '30PY': {
    BASIC: 7500000,
    STANDARD: 10000000,
    ARGEN: 11500000,
    PREMIUM: 14500000
  },
  '40PY': {
    BASIC: 9500000,
    STANDARD: 13500000,
    ARGEN: 15000000,
    PREMIUM: 18000000
  },
  '50PY': {
    BASIC: 11500000,
    STANDARD: 16000000,
    ARGEN: 18500000,
    PREMIUM: 22000000
  }
};

// ============================================================
// 4. 샷시 견적 결과
// ============================================================

/** 샷시 견적 결과 */
export interface WindowEstimate {
  grade: Grade;
  sizeRange: SizeRange;
  py: number;
  
  // 물량
  frames: number;             // 샷시 틀 수 (참고용)
  
  // 패키지 가격 (철거+시공+자재 포함)
  packagePrice: number;       // 패키지 가격
  
  // 총 비용
  totalCost: number;
  
  // 스펙
  spec: WindowSpec;
  brands: typeof WINDOW_BRANDS.BASIC;
  argenConcept: typeof ARGEN_RECOMMENDED;
}

/** 샷시 견적 계산 */
export function calculateWindowEstimate(
  grade: Grade,
  sizeRange: SizeRange,
  py: number
): WindowEstimate {
  // 평형별 샷시 틀 수 (참고용)
  const framesBySize: Record<SizeRange, number> = {
    '10PY': 4,
    '20PY': 6,
    '30PY': 8,
    '40PY': 10,
    '50PY': 12
  };
  
  const frames = framesBySize[sizeRange];
  const packagePrice = WINDOW_PACKAGE_PRICES[sizeRange][grade];
  
  return {
    grade,
    sizeRange,
    py,
    frames,
    packagePrice,
    totalCost: packagePrice,
    spec: WINDOW_SPECS[grade],
    brands: WINDOW_BRANDS[grade],
    argenConcept: ARGEN_RECOMMENDED
  };
}

// ============================================================
// 5. 샷시 종류별 설명
// ============================================================

/** 유리 종류 */
export const GLASS_TYPES = {
  NORMAL: {
    id: 'NORMAL',
    name: '일반 복층',
    description: '기본 복층 유리. 단열 보통.',
    thickness: '22mm'
  },
  LOW_E: {
    id: 'LOW_E',
    name: '로이 (Low-E)',
    description: '저방사 코팅. 열 반사로 단열 향상.',
    thickness: '24mm'
  },
  LOW_E_ARGON: {
    id: 'LOW_E_ARGON',
    name: '로이+아르곤',
    description: '로이 코팅 + 아르곤 가스 충전. 최적 단열.',
    thickness: '24mm'
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: '로이+아르곤+단열간봉',
    description: '최고급. 에너지 효율 1등급.',
    thickness: '26mm'
  }
};

/** 샷시 프레임 종류 */
export const FRAME_TYPES = {
  PVC: {
    id: 'PVC',
    name: 'PVC 창호',
    description: '가장 일반적. 단열 좋고 가격 합리적.'
  },
  ALUMINUM: {
    id: 'ALUMINUM',
    name: '알루미늄 창호',
    description: '강도 높고 슬림한 디자인. 단열 보통.'
  },
  SYSTEM: {
    id: 'SYSTEM',
    name: '시스템 창호',
    description: '최고급. 유럽형 시스템. 에너지 효율 최상.'
  }
};

// ============================================================
// 6. 샷시 관련 유틸리티
// ============================================================

/** 등급별 추천 문구 */
export function getWindowRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '일반 복층 유리입니다. 기본적인 단열 성능으로 가격이 저렴합니다.';
    case 'STANDARD':
      return '로이(Low-E) 유리입니다. 저방사 코팅으로 여름/겨울 냉난방비를 절약합니다.';
    case 'ARGEN':
      return '⭐ 아르젠 추천: Standard 가격대에서 아르곤 가스 충전! Premium급 단열 성능으로 냉난방비 30% 절약!';
    case 'PREMIUM':
      return '최고급 시스템 창호입니다. 로이+아르곤+단열간봉으로 에너지 효율 1등급 수준입니다.';
  }
}

/** 단열 성능 비교 */
export const WINDOW_INSULATION_COMPARE = {
  BASIC: { 열관류율: '2.4W/m²K', 에너지등급: '4등급', 냉난방비절감: '기준' },
  STANDARD: { 열관류율: '1.8W/m²K', 에너지등급: '3등급', 냉난방비절감: '15% 절감' },
  ARGEN: { 열관류율: '1.4W/m²K', 에너지등급: '2등급', 냉난방비절감: '30% 절감' },
  PREMIUM: { 열관류율: '1.0W/m²K', 에너지등급: '1등급', 냉난방비절감: '40% 절감' }
};

/** 샷시 교체 시 포함 항목 */
export const WINDOW_PACKAGE_INCLUDES = [
  '기존 샷시 철거',
  '철거 폐기물 처리',
  '새 샷시 제작',
  '샷시 설치',
  '실리콘 마감',
  '청소'
];

/** 1일 시공 물량 */
export const WINDOW_DAILY_OUTPUT = {
  description: '전문 샷시팀 기준',
  output: '4~6틀/일',
  note: '30평대 아파트 기준 2~3일 소요'
};



