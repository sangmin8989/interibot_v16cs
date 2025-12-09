/**
 * 인테리봇 견적 시스템 V3 - 싱크대 단가표
 * 
 * 🔧 아르젠 제작: 블룸 경첩 + LX 오로라 상판 = Premium 퀄리티
 * 단위: 자(30cm)당 단가
 * 노무비: 설치 600,000원 / 철거 550,000원 (2인 1조)
 */

import { 
  Grade, 
  SizeRange, 
  SIZE_QUANTITIES,
  ARGEN_MADE 
} from './types';
import { getKitchenInstallLabor, getKitchenRemoveLabor } from './labor';

// ============================================================
// 1. 싱크대 등급별 스펙
// ============================================================

/** 싱크대 스펙 */
export interface KitchenSpec {
  door: string;         // 도어 재질
  countertop: string;   // 상판 재질
  hardware: string;     // 하드웨어
  brand: string;        // 브랜드 급
}

/** 등급별 싱크대 스펙 */
export const KITCHEN_SPECS: Record<Grade, KitchenSpec> = {
  BASIC: {
    door: 'LPM',
    countertop: 'PT 언더',
    hardware: '일반 경첩',
    brand: '국산 2군'
  },
  STANDARD: {
    door: 'PET (E0)',
    countertop: '인조대리석 12T',
    hardware: '국산 댐핑',
    brand: '한샘 베이직급'
  },
  ARGEN: {
    door: 'PET (E0)',
    countertop: 'LX 오로라 (하이막스)',
    hardware: '블룸 (Blum)',
    brand: '🔧 아르젠 제작'
  },
  PREMIUM: {
    door: '우레탄 도장',
    countertop: '세라믹/칸스톤',
    hardware: '블룸 풀옵션',
    brand: '독일 SieMatic급'
  }
};

// ============================================================
// 2. 싱크대 단가 (자당)
// ============================================================

/** 등급별 자당(30cm) 자재비 */
export const KITCHEN_MATERIAL_PRICES: Record<Grade, number> = {
  BASIC: 130000,     // 130,000원/자
  STANDARD: 220000,  // 220,000원/자
  ARGEN: 350000,     // 350,000원/자 (블룸+오로라 포함)
  PREMIUM: 650000    // 650,000원/자
};

/** 설치비 (2인 1조) */
export const KITCHEN_INSTALL_LABOR = 600000;  // 600,000원

/** 철거비 (2인 1조) */
export const KITCHEN_REMOVE_LABOR = 550000;   // 550,000원 (폐기물 포함)

// ============================================================
// 3. 평형별 물량/비용 계산
// ============================================================

/** 싱크대 견적 결과 */
export interface KitchenEstimate {
  grade: Grade;
  sizeRange: SizeRange;
  py: number;
  
  // 물량
  ja: number;                 // 싱크대 길이 (자)
  
  // 자재비
  pricePerJa: number;         // 자당 단가
  materialCost: number;       // 자재비 합계
  
  // 노무비
  installLabor: number;       // 설치비
  removeLabor: number;        // 철거비
  laborCost: number;          // 노무비 합계
  
  // 합계
  totalCost: number;          // 총 비용
  
  // 스펙
  spec: KitchenSpec;
  argenConcept: typeof ARGEN_MADE;
}

/** 싱크대 견적 계산 */
export function calculateKitchenEstimate(
  grade: Grade,
  sizeRange: SizeRange,
  py: number,
  includeRemove: boolean = true  // 철거 포함 여부
): KitchenEstimate {
  const quantities = SIZE_QUANTITIES[sizeRange];
  
  // 싱크대 길이 (평형별 기준)
  const ja = quantities.kitchenJa;
  
  // 자재비
  const pricePerJa = KITCHEN_MATERIAL_PRICES[grade];
  const materialCost = ja * pricePerJa;
  
  // 노무비
  const installLabor = getKitchenInstallLabor();
  const removeLabor = includeRemove ? getKitchenRemoveLabor() : 0;
  const laborCost = installLabor + removeLabor;
  
  // 합계
  const totalCost = materialCost + laborCost;
  
  return {
    grade,
    sizeRange,
    py,
    ja,
    pricePerJa,
    materialCost,
    installLabor,
    removeLabor,
    laborCost,
    totalCost,
    spec: KITCHEN_SPECS[grade],
    argenConcept: ARGEN_MADE
  };
}

// ============================================================
// 4. 평형별 기준 비용표 (미리 계산된 값)
// ============================================================

/** 평형별 싱크대 비용 (철거 포함) */
export const KITCHEN_COST_BY_SIZE: Record<SizeRange, Record<Grade, { 
  ja: number; 
  materialCost: number; 
  laborCost: number;
  totalCost: number;
}>> = {
  '10PY': {
    BASIC: { ja: 10, materialCost: 1300000, laborCost: 1150000, totalCost: 2450000 },
    STANDARD: { ja: 10, materialCost: 2200000, laborCost: 1150000, totalCost: 3350000 },
    ARGEN: { ja: 10, materialCost: 3500000, laborCost: 1150000, totalCost: 4650000 },
    PREMIUM: { ja: 10, materialCost: 6500000, laborCost: 1150000, totalCost: 7650000 }
  },
  '20PY': {
    BASIC: { ja: 12, materialCost: 1560000, laborCost: 1150000, totalCost: 2710000 },
    STANDARD: { ja: 12, materialCost: 2640000, laborCost: 1150000, totalCost: 3790000 },
    ARGEN: { ja: 12, materialCost: 4200000, laborCost: 1150000, totalCost: 5350000 },
    PREMIUM: { ja: 12, materialCost: 7800000, laborCost: 1150000, totalCost: 8950000 }
  },
  '30PY': {
    BASIC: { ja: 15, materialCost: 1950000, laborCost: 1150000, totalCost: 3100000 },
    STANDARD: { ja: 15, materialCost: 3300000, laborCost: 1150000, totalCost: 4450000 },
    ARGEN: { ja: 15, materialCost: 5250000, laborCost: 1150000, totalCost: 6400000 },
    PREMIUM: { ja: 15, materialCost: 9750000, laborCost: 1150000, totalCost: 10900000 }
  },
  '40PY': {
    BASIC: { ja: 18, materialCost: 2340000, laborCost: 1150000, totalCost: 3490000 },
    STANDARD: { ja: 18, materialCost: 3960000, laborCost: 1150000, totalCost: 5110000 },
    ARGEN: { ja: 18, materialCost: 6300000, laborCost: 1150000, totalCost: 7450000 },
    PREMIUM: { ja: 18, materialCost: 11700000, laborCost: 1150000, totalCost: 12850000 }
  },
  '50PY': {
    BASIC: { ja: 22, materialCost: 2860000, laborCost: 1150000, totalCost: 4010000 },
    STANDARD: { ja: 22, materialCost: 4840000, laborCost: 1150000, totalCost: 5990000 },
    ARGEN: { ja: 22, materialCost: 7700000, laborCost: 1150000, totalCost: 8850000 },
    PREMIUM: { ja: 22, materialCost: 14300000, laborCost: 1150000, totalCost: 15450000 }
  }
};

// ============================================================
// 5. 주방 타입별 설명
// ============================================================

/** 주방 레이아웃 타입 */
export const KITCHEN_LAYOUTS = {
  I_TYPE: {
    id: 'I_TYPE',
    name: 'ㅡ자형',
    description: '일렬 배치. 소형 주방에 적합.',
    typicalJa: '10~12자'
  },
  L_TYPE: {
    id: 'L_TYPE',
    name: 'ㄱ자형',
    description: '코너 활용. 중형 주방에 적합.',
    typicalJa: '13~17자'
  },
  U_TYPE: {
    id: 'U_TYPE',
    name: 'ㄷ자형',
    description: '3면 활용. 대형 주방에 적합.',
    typicalJa: '18~24자'
  },
  ISLAND: {
    id: 'ISLAND',
    name: '아일랜드형',
    description: '중앙에 조리대. 최고급 주방.',
    typicalJa: '20~28자'
  }
};

/** 싱크대 구성요소 */
export const KITCHEN_COMPONENTS = {
  상부장: { description: '벽에 달린 상단 수납장' },
  하부장: { description: '싱크대 아래 수납장' },
  상판: { description: '조리대 상판' },
  싱크볼: { description: '설거지 공간' },
  수전: { description: '물 나오는 부분' },
  가전장: { description: '냉장고장/전자레인지장' }
};

// ============================================================
// 6. 싱크대 관련 유틸리티
// ============================================================

/** 등급별 추천 문구 */
export function getKitchenRecommendation(grade: Grade): string {
  switch (grade) {
    case 'BASIC':
      return '기본형 싱크대입니다. LPM 도어와 PT 상판으로 가격이 저렴합니다.';
    case 'STANDARD':
      return '표준형 싱크대입니다. PET 도어와 인조대리석 상판으로 내구성이 좋습니다.';
    case 'ARGEN':
      return '🔧 아르젠 제작: Standard 가격대에서 블룸 경첩 + LX 오로라 상판! Premium 퀄리티를 Standard 가격에!';
    case 'PREMIUM':
      return '최고급 싱크대입니다. 우레탄 도장 도어와 세라믹 상판으로 호텔급 주방을 연출합니다.';
  }
}

/** 아르젠 제작 특장점 */
export const ARGEN_KITCHEN_FEATURES = {
  hardware: {
    name: '블룸 (Blum) 하드웨어',
    description: '오스트리아 명품. 부드러운 닫힘, 20년 내구성.',
    originalPrice: '경첩 1개당 25,000원 추가'
  },
  countertop: {
    name: 'LX 오로라 (하이막스) 상판',
    description: '반영구적. 스크래치에 강함. 열에 강함.',
    originalPrice: '일반 인조대리석 대비 40% 업그레이드'
  },
  door: {
    name: 'PET 무광 도어 (E0등급)',
    description: '친환경 자재. 지문 안 남음. 청소 쉬움.',
    originalPrice: '친환경 등급 최상위'
  }
};

/** 1일 시공 물량 */
export const KITCHEN_DAILY_OUTPUT = {
  description: '2인 1조 기준',
  일반: 'ㅡ/ㄱ자 주방 (4m 내외) 1세트 + 수납장 1세트',
  대형: '대면형/아일랜드 시 1.5일 또는 3인 투입',
  철거: '1세트 철거 1일 (폐기물 포함)'
};



