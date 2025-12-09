/**
 * 인테리봇 견적 시스템 V3 - 방문/중문/폴딩도어 단가표
 * 
 * ⭐ 아르젠 추천: Standard 가격대에서 고급 ABS 마감
 * 단위: 세트(방문), 식(중문), 짝(폴딩)당 단가
 */

import { 
  Grade, 
  GradeBrands, 
  SizeRange, 
  SIZE_QUANTITIES,
  ARGEN_RECOMMENDED 
} from './types';

// ============================================================
// 1. 방문 브랜드
// ============================================================

/** 방문 브랜드 목록 (등급별 × 3사) */
export const DOOR_BRANDS: GradeBrands = {
  BASIC: [
    { name: '재현하늘창', product: '일반형', description: '기본 ABS' },
    { name: '예지', product: '일반형', description: '기본 ABS' },
    { name: '대성', product: '일반형', description: '기본 ABS' }
  ],
  STANDARD: [
    { name: '영림', product: '표준형', description: '표준 ABS' },
    { name: 'LX Z:IN', product: '표준형', description: '표준 ABS' },
    { name: '예림', product: '표준형', description: '표준 ABS' }
  ],
  ARGEN: [
    { name: '영림', product: '프리미엄', description: '아르젠 추천 - 고급 ABS' },
    { name: 'LX Z:IN', product: '고급형', description: '아르젠 추천 - 고급 ABS' },
    { name: '예림', product: '프리미엄', description: '아르젠 추천 - 고급 ABS' }
  ],
  PREMIUM: [
    { name: '원목도어', product: '-', description: '원목' },
    { name: '수입도어', product: '-', description: '수입' },
    { name: '커스텀', product: '-', description: '맞춤 제작' }
  ]
};

// ============================================================
// 2. 방문 단가 (세트당: 문짝 + 문틀)
// ============================================================

/** 등급별 방문 세트 단가 */
export const DOOR_PRICES: Record<Grade, number> = {
  BASIC: 250000,     // 250,000원/세트
  STANDARD: 350000,  // 350,000원/세트
  ARGEN: 400000,     // 400,000원/세트 (Standard 가격대)
  PREMIUM: 650000    // 650,000원/세트
};

// ============================================================
// 3. 중문 브랜드 및 단가
// ============================================================

/** 중문 브랜드 목록 */
export const MIDDLE_DOOR_BRANDS: GradeBrands = {
  BASIC: [
    { name: '재현', product: '일반 3연동', description: '80mm바' },
    { name: '예림', product: '일반 3연동', description: '80mm바' },
    { name: '기타', product: '일반 3연동', description: '80mm바' }
  ],
  STANDARD: [
    { name: '영림', product: '초슬림 3연동', description: '22mm바' },
    { name: 'LX', product: '초슬림 3연동', description: '22mm바' },
    { name: '예림', product: '초슬림 3연동', description: '22mm바' }
  ],
  ARGEN: [
    { name: '영림', product: '프리미엄 초슬림', description: '아르젠 추천 - 22mm 고급형' },
    { name: 'LX', product: '프리미엄 초슬림', description: '아르젠 추천 - 22mm 고급형' },
    { name: '예림', product: '프리미엄 초슬림', description: '아르젠 추천 - 22mm 고급형' }
  ],
  PREMIUM: [
    { name: '이건', product: '스윙', description: '스윙도어' },
    { name: '위드지', product: '원슬라이딩', description: '원슬라이딩' },
    { name: '수입', product: '-', description: '수입' }
  ]
};

/** 등급별 중문 단가 (1식) */
export const MIDDLE_DOOR_PRICES: Record<Grade, number> = {
  BASIC: 900000,      // 900,000원/식
  STANDARD: 1300000,  // 1,300,000원/식
  ARGEN: 1450000,     // 1,450,000원/식 (Standard 가격대)
  PREMIUM: 1800000    // 1,800,000원/식~
};

// ============================================================
// 4. 폴딩도어 브랜드 및 단가
// ============================================================

/** 폴딩도어 브랜드 목록 */
export const FOLDING_DOOR_BRANDS: GradeBrands = {
  BASIC: [
    { name: '두현', product: '일반형', description: '비단열바' },
    { name: '아우스바이튼', product: '일반형', description: '비단열바' },
    { name: '이지', product: '일반형', description: '비단열바' }
  ],
  STANDARD: [
    { name: 'NS폴딩', product: '단열형', description: '단열바 22mm' },
    { name: '폴링', product: '단열형', description: '단열바 22mm' },
    { name: 'LX', product: '단열형', description: '단열바 22mm' }
  ],
  ARGEN: [
    { name: 'NS폴딩', product: '프리미엄', description: '아르젠 추천 - 단열바 22mm 고급' },
    { name: '폴링', product: '프리미엄', description: '아르젠 추천 - 단열바 22mm 고급' },
    { name: 'LX', product: '프리미엄', description: '아르젠 추천 - 단열바 22mm 고급' }
  ],
  PREMIUM: [
    { name: '이건창호', product: '고단열', description: '24mm 시스템 창호급' },
    { name: 'LX Z:IN', product: '고단열', description: '24mm 시스템 창호급' },
    { name: '윈체', product: '고단열', description: '24mm 시스템 창호급' }
  ]
};

/** 등급별 폴딩도어 단가 (1짝당) */
export const FOLDING_DOOR_PRICES: Record<Grade, number> = {
  BASIC: 350000,     // 350,000원/짝
  STANDARD: 550000,  // 550,000원/짝
  ARGEN: 650000,     // 650,000원/짝 (Standard 가격대)
  PREMIUM: 800000    // 800,000원/짝~
};

// ============================================================
// 5. 평형별 물량/비용 계산
// ============================================================

/** 도어 견적 결과 */
export interface DoorEstimate {
  grade: Grade;
  sizeRange: SizeRange;
  py: number;
  
  // 방문
  doorCount: number;          // 방문 개수
  doorPricePerSet: number;    // 세트당 단가
  doorCost: number;           // 방문 총 비용
  
  // 중문 (1식 고정)
  middleDoorCost: number;     // 중문 비용
  
  // 폴딩도어 (옵션)
  foldingDoorCount: number;   // 폴딩도어 짝 수
  foldingDoorPricePerPiece: number;  // 짝당 단가
  foldingDoorCost: number;    // 폴딩도어 총 비용
  
  // 합계
  totalCost: number;          // 총 비용 (폴딩도어 미포함)
  totalWithFolding: number;   // 총 비용 (폴딩도어 포함)
  
  // 브랜드
  doorBrands: typeof DOOR_BRANDS.BASIC;
  middleDoorBrands: typeof MIDDLE_DOOR_BRANDS.BASIC;
  foldingDoorBrands: typeof FOLDING_DOOR_BRANDS.BASIC;
  argenConcept: typeof ARGEN_RECOMMENDED;
}

/** 도어 견적 계산 */
export function calculateDoorEstimate(
  grade: Grade,
  sizeRange: SizeRange,
  py: number,
  includeFoldingDoor: boolean = false,
  foldingDoorCount: number = 0
): DoorEstimate {
  const quantities = SIZE_QUANTITIES[sizeRange];
  
  // 방문
  const doorCount = quantities.doorCount;
  const doorPricePerSet = DOOR_PRICES[grade];
  const doorCost = doorCount * doorPricePerSet;
  
  // 중문 (1식)
  const middleDoorCost = MIDDLE_DOOR_PRICES[grade];
  
  // 폴딩도어 (옵션)
  const foldingDoorPricePerPiece = FOLDING_DOOR_PRICES[grade];
  const actualFoldingCount = includeFoldingDoor ? foldingDoorCount : 0;
  const foldingDoorCost = actualFoldingCount * foldingDoorPricePerPiece;
  
  // 합계
  const totalCost = doorCost + middleDoorCost;
  const totalWithFolding = totalCost + foldingDoorCost;
  
  return {
    grade,
    sizeRange,
    py,
    doorCount,
    doorPricePerSet,
    doorCost,
    middleDoorCost,
    foldingDoorCount: actualFoldingCount,
    foldingDoorPricePerPiece,
    foldingDoorCost,
    totalCost,
    totalWithFolding,
    doorBrands: DOOR_BRANDS[grade],
    middleDoorBrands: MIDDLE_DOOR_BRANDS[grade],
    foldingDoorBrands: FOLDING_DOOR_BRANDS[grade],
    argenConcept: ARGEN_RECOMMENDED
  };
}

// ============================================================
// 6. 평형별 기준 비용표 (미리 계산된 값, 폴딩도어 미포함)
// ============================================================

/** 평형별 도어 비용 (중문 포함, 폴딩도어 미포함) */
export const DOOR_COST_BY_SIZE: Record<SizeRange, Record<Grade, { 
  doorCount: number;
  doorCost: number;
  middleDoorCost: number;
  totalCost: number;
}>> = {
  '10PY': {
    BASIC: { doorCount: 3, doorCost: 750000, middleDoorCost: 900000, totalCost: 1650000 },
    STANDARD: { doorCount: 3, doorCost: 1050000, middleDoorCost: 1300000, totalCost: 2350000 },
    ARGEN: { doorCount: 3, doorCost: 1200000, middleDoorCost: 1450000, totalCost: 2650000 },
    PREMIUM: { doorCount: 3, doorCost: 1950000, middleDoorCost: 1800000, totalCost: 3750000 }
  },
  '20PY': {
    BASIC: { doorCount: 4, doorCost: 1000000, middleDoorCost: 900000, totalCost: 1900000 },
    STANDARD: { doorCount: 4, doorCost: 1400000, middleDoorCost: 1300000, totalCost: 2700000 },
    ARGEN: { doorCount: 4, doorCost: 1600000, middleDoorCost: 1450000, totalCost: 3050000 },
    PREMIUM: { doorCount: 4, doorCost: 2600000, middleDoorCost: 1800000, totalCost: 4400000 }
  },
  '30PY': {
    BASIC: { doorCount: 5, doorCost: 1250000, middleDoorCost: 900000, totalCost: 2150000 },
    STANDARD: { doorCount: 5, doorCost: 1750000, middleDoorCost: 1300000, totalCost: 3050000 },
    ARGEN: { doorCount: 5, doorCost: 2000000, middleDoorCost: 1450000, totalCost: 3450000 },
    PREMIUM: { doorCount: 5, doorCost: 3250000, middleDoorCost: 1800000, totalCost: 5050000 }
  },
  '40PY': {
    BASIC: { doorCount: 6, doorCost: 1500000, middleDoorCost: 900000, totalCost: 2400000 },
    STANDARD: { doorCount: 6, doorCost: 2100000, middleDoorCost: 1300000, totalCost: 3400000 },
    ARGEN: { doorCount: 6, doorCost: 2400000, middleDoorCost: 1450000, totalCost: 3850000 },
    PREMIUM: { doorCount: 6, doorCost: 3900000, middleDoorCost: 1800000, totalCost: 5700000 }
  },
  '50PY': {
    BASIC: { doorCount: 7, doorCost: 1750000, middleDoorCost: 900000, totalCost: 2650000 },
    STANDARD: { doorCount: 7, doorCost: 2450000, middleDoorCost: 1300000, totalCost: 3750000 },
    ARGEN: { doorCount: 7, doorCost: 2800000, middleDoorCost: 1450000, totalCost: 4250000 },
    PREMIUM: { doorCount: 7, doorCost: 4550000, middleDoorCost: 1800000, totalCost: 6350000 }
  }
};

// ============================================================
// 7. 평형별 폴딩도어 비용표
// ============================================================

/** 평형별 폴딩도어 기본 짝수 */
export const FOLDING_DOOR_COUNT_BY_SIZE: Record<SizeRange, number> = {
  '10PY': 3,
  '20PY': 4,
  '30PY': 5,
  '40PY': 6,
  '50PY': 7
};

/** 평형별 폴딩도어 비용 */
export const FOLDING_DOOR_COST_BY_SIZE: Record<SizeRange, Record<Grade, { 
  count: number;
  totalCost: number;
}>> = {
  '10PY': {
    BASIC: { count: 3, totalCost: 1050000 },
    STANDARD: { count: 3, totalCost: 1650000 },
    ARGEN: { count: 3, totalCost: 1950000 },
    PREMIUM: { count: 3, totalCost: 2400000 }
  },
  '20PY': {
    BASIC: { count: 4, totalCost: 1400000 },
    STANDARD: { count: 4, totalCost: 2200000 },
    ARGEN: { count: 4, totalCost: 2600000 },
    PREMIUM: { count: 4, totalCost: 3200000 }
  },
  '30PY': {
    BASIC: { count: 5, totalCost: 1750000 },
    STANDARD: { count: 5, totalCost: 2750000 },
    ARGEN: { count: 5, totalCost: 3250000 },
    PREMIUM: { count: 5, totalCost: 4000000 }
  },
  '40PY': {
    BASIC: { count: 6, totalCost: 2100000 },
    STANDARD: { count: 6, totalCost: 3300000 },
    ARGEN: { count: 6, totalCost: 3900000 },
    PREMIUM: { count: 6, totalCost: 4800000 }
  },
  '50PY': {
    BASIC: { count: 7, totalCost: 2450000 },
    STANDARD: { count: 7, totalCost: 3850000 },
    ARGEN: { count: 7, totalCost: 4550000 },
    PREMIUM: { count: 7, totalCost: 5600000 }
  }
};

// ============================================================
// 8. 도어 종류별 설명
// ============================================================

/** 방문 종류 */
export const DOOR_TYPES = {
  ABS: {
    id: 'ABS',
    name: 'ABS 도어',
    description: '플라스틱 코팅. 가장 일반적.',
    grades: ['BASIC', 'STANDARD', 'ARGEN']
  },
  WOOD: {
    id: 'WOOD',
    name: '원목 도어',
    description: '진짜 나무. 최고급.',
    grades: ['PREMIUM']
  }
};

/** 중문 종류 */
export const MIDDLE_DOOR_TYPES = {
  SLIDING_3: {
    id: 'SLIDING_3',
    name: '3연동',
    description: '가장 일반적. 3개 문짝이 겹쳐서 열림.',
    barWidth: '22~80mm'
  },
  SWING: {
    id: 'SWING',
    name: '스윙',
    description: '문이 안팎으로 열림. 고급스러움.',
    barWidth: 'N/A'
  },
  ONE_SLIDING: {
    id: 'ONE_SLIDING',
    name: '원슬라이딩',
    description: '하나의 큰 문짝. 모던한 디자인.',
    barWidth: 'N/A'
  }
};

// ============================================================
// 9. 도어 관련 유틸리티
// ============================================================

/** 등급별 추천 문구 - 방문 */
export function getDoorRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '기본형 ABS 도어입니다. 가격이 저렴하고 무난합니다.';
    case 'STANDARD':
      return '표준형 ABS 도어입니다. 내구성이 좋고 디자인이 다양합니다.';
    case 'ARGEN':
      return '⭐ 아르젠 추천: Standard 가격대에서 고급 ABS 마감! 프리미엄 디자인과 내구성!';
    case 'PREMIUM':
      return '원목 도어입니다. 진짜 나무의 따뜻함과 고급스러움을 느낄 수 있습니다.';
  }
}

/** 등급별 추천 문구 - 중문 */
export function getMiddleDoorRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '일반 3연동 중문입니다. 80mm 바로 무난한 디자인입니다.';
    case 'STANDARD':
      return '초슬림 3연동 중문입니다. 22mm 바로 세련된 느낌입니다.';
    case 'ARGEN':
      return '⭐ 아르젠 추천: 영림 프리미엄 초슬림! 22mm 고급형으로 공간이 넓어 보입니다.';
    case 'PREMIUM':
      return '스윙/원슬라이딩 중문입니다. 최고급 디자인으로 공간의 품격을 높입니다.';
  }
}

/** 노무비 안내 */
export const DOOR_LABOR_NOTE = {
  description: '방문/중문 설치비는 목공비에 포함',
  carpentryRate: '목공 1조당 700,000원',
  typicalDays: '방문 5세트 + 중문 1식 기준 0.5~1일 소요'
};



