/**
 * V3.1 Core Edition - 범위 설정
 * 
 * Extended Edition: 모든 평수 지원 (10평~80평)
 * 평수별로 Needs 강도와 추천 로직을 자동 조정합니다.
 */

// ============ 평형 범위 ============

export const CORE_PYEONG_RANGE = {
  min: 10,  // 확장: 10평부터
  max: 80,  // 확장: 80평까지
  primary: {
    min: 20,
    max: 34,
  },
  extended: {
    min: 10,
    max: 80,
  },
} as const;

// ============ 주거 형태 ============

export const CORE_HOUSING_TYPES = {
  // 영문 + 한글 모두 허용
  allowed: [
    'apartment', 'villa', 'officetel', 'house',
    '아파트', '빌라', '오피스텔', '주택', '단독주택', '다세대', '연립'
  ] as const,
  excluded: ['commercial', '상가'] as const,
} as const;

// 한글 → 영문 매핑
export const HOUSING_TYPE_MAP: Record<string, string> = {
  '아파트': 'apartment',
  '빌라': 'villa',
  '오피스텔': 'officetel',
  '주택': 'house',
  '단독주택': 'house',
  '다세대': 'villa',
  '연립': 'villa',
  'apartment': 'apartment',
  'villa': 'villa',
  'officetel': 'officetel',
  'house': 'house',
};

// 주거 형태 정규화 함수
export function normalizeHousingType(type: string): string {
  return HOUSING_TYPE_MAP[type] || type;
}

// ============ 거주 상태 ============

export const CORE_OCCUPANCY = {
  required: true, // 거주 중 우선
  allowEmpty: true, // 확장: 빈집도 허용
} as const;

// ============ 공간 범위 ============

export const CORE_SPACES = {
  // Core Edition에서 우선 처리하는 공간
  primary: ['bathroom', 'living', 'kitchen'] as const,
  
  // 전체 공간 (입력 가능, 향후 확장용)
  all: [
    'living',
    'kitchen',
    'dining',
    'entrance',
    'hallway',
    'master-bedroom',
    'child-room',
    'guest-room',
    'dressroom',
    'bathroom',
    'powder-room',
    'utility',
    'balcony',
    'study',
    'pantry',
  ] as const,
} as const;

// ============ Needs 범위 ============

export const CORE_NEEDS = {
  // Core Edition: 6개 Core Needs만 사용
  core: [
    'safety',       // 안전성 강화
    'storage',      // 수납 강화
    'flow',         // 동선 최적화
    'durability',   // 내구성 강화
    'maintenance',  // 청소/관리 편의성
    'brightness',   // 채광·밝기 향상
  ] as const,
  
  // Extended (향후 확장)
  extended: [
    'soundproof',      // 방음
    'child-space',     // 아이 공간 강화
    'pet-friendly',    // 반려동물 대응
    'work-space',      // 작업 공간 강화
    'mood-lighting',   // 분위기 조명
    'style-preference', // 스타일 선호
  ] as const,
} as const;

// ============ 평형대별 규칙 ============

export const HOUSE_SIZE_RULES = {
  // 10-19평: 원룸/소형
  verySmall: {
    range: { min: 10, max: 19 },
    needsAdjustment: {
      storage: 'critical',   // 수납이 매우 중요
      flow: 'critical',      // 동선 최적화 필수
      brightness: 'increase', // 밝기 중요
    },
    label: '소형 (10-19평)',
  },
  // 20-25평: 소형 아파트
  small: {
    range: { min: 20, max: 25 },
    needsAdjustment: {
      storage: 'increase',   // 수납 강화 중요도 상승
      flow: 'increase',      // 동선 최적화도 중요
    },
    label: '소형 아파트 (20-25평)',
  },
  // 26-32평: 중소형
  medium: {
    range: { min: 26, max: 32 },
    needsAdjustment: {
      storage: 'neutral',
      flow: 'neutral',
    },
    label: '중소형 (26-32평)',
  },
  // 33-40평: 중형
  large: {
    range: { min: 33, max: 40 },
    needsAdjustment: {
      flow: 'increase',      // 동선 최적화 중요도 상승
      storage: 'neutral',
    },
    label: '중형 (33-40평)',
  },
  // 41-59평: 대형
  veryLarge: {
    range: { min: 41, max: 59 },
    needsAdjustment: {
      flow: 'critical',      // 동선 최적화 매우 중요
      durability: 'increase', // 넓은 공간 = 내구성 중요
      storage: 'increase',   // 수납도 많이 필요
    },
    label: '대형 (41-59평)',
  },
  // 60평 이상: 초대형
  luxury: {
    range: { min: 60, max: 80 },
    needsAdjustment: {
      flow: 'critical',
      durability: 'critical',
      maintenance: 'increase', // 관리 면적 증가
    },
    label: '초대형 (60평 이상)',
  },
} as const;

// ============ 범위 검증 함수 ============

export function isInCoreScope(pyeong: number, housingType: string, occupied: boolean): boolean {
  const pyeongInRange = pyeong >= CORE_PYEONG_RANGE.min && pyeong <= CORE_PYEONG_RANGE.max;
  
  // 한글/영문 모두 허용 (정규화 후 확인)
  const normalizedType = normalizeHousingType(housingType);
  const typeAllowed = CORE_HOUSING_TYPES.allowed.includes(housingType as any) || 
                      CORE_HOUSING_TYPES.allowed.includes(normalizedType as any);
  
  console.log('🏠 [isInCoreScope] 검증:', { 
    pyeong, 
    housingType, 
    normalizedType, 
    pyeongInRange, 
    typeAllowed 
  });
  
  return pyeongInRange && typeAllowed;
}

export function getPyeongCategory(pyeong: number): 'verySmall' | 'small' | 'medium' | 'large' | 'veryLarge' | 'luxury' | 'out-of-range' {
  if (pyeong >= HOUSE_SIZE_RULES.verySmall.range.min && pyeong <= HOUSE_SIZE_RULES.verySmall.range.max) {
    return 'verySmall';
  }
  if (pyeong >= HOUSE_SIZE_RULES.small.range.min && pyeong <= HOUSE_SIZE_RULES.small.range.max) {
    return 'small';
  }
  if (pyeong >= HOUSE_SIZE_RULES.medium.range.min && pyeong <= HOUSE_SIZE_RULES.medium.range.max) {
    return 'medium';
  }
  if (pyeong >= HOUSE_SIZE_RULES.large.range.min && pyeong <= HOUSE_SIZE_RULES.large.range.max) {
    return 'large';
  }
  if (pyeong >= HOUSE_SIZE_RULES.veryLarge.range.min && pyeong <= HOUSE_SIZE_RULES.veryLarge.range.max) {
    return 'veryLarge';
  }
  if (pyeong >= HOUSE_SIZE_RULES.luxury.range.min && pyeong <= HOUSE_SIZE_RULES.luxury.range.max) {
    return 'luxury';
  }
  return 'out-of-range';
}

export function getPyeongLabel(pyeong: number): string {
  const category = getPyeongCategory(pyeong);
  if (category === 'out-of-range') return `${pyeong}평 (범위 밖)`;
  return HOUSE_SIZE_RULES[category].label;
}

