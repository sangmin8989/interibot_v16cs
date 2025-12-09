/**
 * 인테리봇 견적 시스템 V3 - 타입 정의
 */

import { Grade, SizeRange } from '../data/pricing-v3/types';

/** V3 견적 입력 */
export interface EstimateInputV3 {
  /** 평수 */
  py: number;
  
  /** 등급 */
  grade: Grade;
  
  /** 확장형 여부 (도배 물량 증가) */
  isExtended?: boolean;
  
  /** 붙박이장 타입 */
  closetType?: 'SWING' | 'SLIDING';
  
  /** 폴딩도어 포함 여부 */
  includeFoldingDoor?: boolean;
  
  /** 폴딩도어 짝 수 */
  foldingDoorCount?: number;
  
  /** 비데 포함 여부 */
  includeBidet?: boolean;
  
  /** 욕조 포함 여부 */
  includeBathtub?: boolean;
  
  /** 도어락 포함 여부 */
  includeDoorlock?: boolean;
  
  /** 조명 포함 여부 */
  includeLighting?: boolean;
}

/** 공정 항목 */
export interface ProcessItemV3 {
  name: string;           // 공정명
  quantity?: string;      // 물량 (예: "21롤", "30평")
  materialCost: number;   // 자재비
  laborCost: number;      // 노무비
  totalCost: number;      // 합계
  brands?: string[];      // 브랜드 목록
  note?: string;          // 비고
}

/** 공간별 견적 */
export interface SpaceEstimateV3 {
  spaceName: string;      // 공간명
  items: ProcessItemV3[]; // 공정 항목들
  subtotal: number;       // 소계
}

/** 전체 견적 결과 */
export interface FullEstimateResultV3 {
  // 입력 정보
  input: {
    py: number;
    sizeRange: SizeRange;
    grade: Grade;
    gradeName: string;
  };
  
  // 공간별 견적
  spaces: {
    common: SpaceEstimateV3;      // 공통 공사
    living: SpaceEstimateV3;      // 거실/복도
    kitchen: SpaceEstimateV3;     // 주방
    bathroom: SpaceEstimateV3;    // 욕실
    storage: SpaceEstimateV3;     // 수납/가구
    window: SpaceEstimateV3;      // 창호
    lighting?: SpaceEstimateV3;   // 조명 (옵션)
  };
  
  // 합계
  summary: {
    materialTotal: number;      // 자재비 합계
    laborTotal: number;         // 노무비 합계
    netTotal: number;           // 순공사비 (VAT 별도)
    vat: number;                // VAT (10%)
    grandTotal: number;         // 총 견적 (VAT 포함)
    pricePerPy: number;         // 평당 단가
  };
  
  // 공사 기간
  duration: {
    minDays: number;
    maxDays: number;
    typical: string;
  };
  
  // 아르젠 특장점 (ARGEN 등급일 때만)
  argenFeatures?: {
    made: string[];        // 아르젠 제작 품목
    recommended: string[]; // 아르젠 추천 자재
  };
}

/** 4등급 비교 결과 */
export interface GradeComparisonV3 {
  py: number;
  sizeRange: SizeRange;
  basic: FullEstimateResultV3;
  standard: FullEstimateResultV3;
  argen: FullEstimateResultV3;
  premium: FullEstimateResultV3;
}

/** 기존 시스템과 호환을 위한 등급 타입 */
export type GradeType = 'basic' | 'standard' | 'argen' | 'premium';

/** 등급 정보 */
export const GRADE_INFO: Record<GradeType, { icon: string; title: string; description: string }> = {
  basic: { icon: '💰', title: '실속형', description: '임대용/저예산' },
  standard: { icon: '⭐', title: '표준형', description: '일반 자가 거주' },
  argen: { icon: '🏆', title: '아르젠', description: 'Standard 가격 + Premium 품질' },
  premium: { icon: '💎', title: '프리미엄', description: '최고급/수입품' }
};



