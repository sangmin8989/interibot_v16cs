/**
 * 인테리봇 견적 시스템 V3 - 공통 항목
 * 
 * 철거, 입주청소, 공사보증금 등 공통 비용
 */

import { SizeRange } from './types';

// ============================================================
// 1. 철거 비용
// ============================================================

/** 철거 단가 (평당 고정) */
export const DEMOLITION_PRICE_PER_PY = 160000;  // 160,000원/평

/** 철거 정보 */
export const DEMOLITION_INFO = {
  pricePerPy: DEMOLITION_PRICE_PER_PY,
  unit: '평',
  description: '폐기물 반출 노무 포함',
  note: '평당 고정 단가로 계산',
  dailyOutput: '25평 전체 철거: 1일 소요'
};

/** 철거비 계산 */
export function calculateDemolitionCost(py: number): number {
  return py * DEMOLITION_PRICE_PER_PY;
}

/** 평형별 철거비 */
export const DEMOLITION_COST_BY_SIZE: Record<SizeRange, {
  py: number;
  cost: number;
  days: number;
}> = {
  '10PY': { py: 15, cost: 2400000, days: 1 },
  '20PY': { py: 25, cost: 4000000, days: 1 },
  '30PY': { py: 34, cost: 5440000, days: 1.5 },
  '40PY': { py: 44, cost: 7040000, days: 2 },
  '50PY': { py: 55, cost: 8800000, days: 2.5 }
};

// ============================================================
// 2. 입주청소 비용
// ============================================================

/** 입주청소 단가 (평당) */
export const CLEANING_PRICE_PER_PY = 20000;  // 20,000원/평

/** 입주청소 정보 */
export const CLEANING_INFO = {
  pricePerPy: CLEANING_PRICE_PER_PY,
  unit: '평',
  description: '준공정밀청소',
  note: '전문 장비 투입 팀',
  dailyOutput: '30~40평형: 1세대/일'
};

/** 입주청소비 계산 */
export function calculateCleaningCost(py: number): number {
  return py * CLEANING_PRICE_PER_PY;
}

/** 평형별 입주청소비 */
export const CLEANING_COST_BY_SIZE: Record<SizeRange, {
  py: number;
  cost: number;
}> = {
  '10PY': { py: 15, cost: 300000 },
  '20PY': { py: 25, cost: 500000 },
  '30PY': { py: 34, cost: 680000 },
  '40PY': { py: 44, cost: 880000 },
  '50PY': { py: 55, cost: 1100000 }
};

// ============================================================
// 3. 공사 보증금
// ============================================================

/** 공사 보증금 범위 */
export const CONSTRUCTION_DEPOSIT = {
  min: 500000,       // 최소 50만원
  max: 5000000,      // 최대 500만원
  typical: 2000000,  // 일반적으로 200만원
  description: '관리실 예치',
  note: '단지별 상이. 공사 완료 후 반환.',
  refundCondition: '원상복구 및 민원 없을 시 전액 반환'
};

// ============================================================
// 4. 기타 공통 비용
// ============================================================

/** 기타 공통 비용 */
export const OTHER_COMMON_COSTS = {
  /**
   * 관리비 추가 (공사 기간 중)
   * - 일부 단지에서 공사 기간 동안 관리비 추가 청구
   */
  managementFee: {
    name: '공사 관리비',
    description: '공사 기간 중 추가 관리비',
    typical: 100000,  // 월 10만원 내외
    note: '단지별 상이'
  },
  
  /**
   * 주차 비용
   * - 자재 운반 차량 주차
   */
  parking: {
    name: '주차 비용',
    description: '자재 운반 차량 주차',
    typical: 50000,  // 1일 5만원 내외
    note: '무료인 경우 많음'
  },
  
  /**
   * 야간 작업 할증
   * - 6시 이후 작업 시
   */
  nightSurcharge: {
    name: '야간 작업 할증',
    description: '6시 이후 작업 시',
    rate: 1.5,  // 1.5배
    note: '일반적으로 야간 작업 지양'
  }
};

// ============================================================
// 5. 공통 공사 견적 계산
// ============================================================

/** 공통 공사 견적 결과 */
export interface CommonEstimate {
  sizeRange: SizeRange;
  py: number;
  
  // 철거
  demolitionCost: number;
  
  // 입주청소
  cleaningCost: number;
  
  // 합계 (보증금 제외)
  totalCost: number;
  
  // 참고 (보증금)
  depositTypical: number;
}

/** 공통 공사 견적 계산 */
export function calculateCommonEstimate(
  sizeRange: SizeRange,
  py: number
): CommonEstimate {
  const demolitionCost = calculateDemolitionCost(py);
  const cleaningCost = calculateCleaningCost(py);
  const totalCost = demolitionCost + cleaningCost;
  
  return {
    sizeRange,
    py,
    demolitionCost,
    cleaningCost,
    totalCost,
    depositTypical: CONSTRUCTION_DEPOSIT.typical
  };
}

// ============================================================
// 6. 평형별 공통 비용표
// ============================================================

/** 평형별 공통 비용 */
export const COMMON_COST_BY_SIZE: Record<SizeRange, {
  demolitionCost: number;
  cleaningCost: number;
  totalCost: number;
}> = {
  '10PY': {
    demolitionCost: 2400000,
    cleaningCost: 300000,
    totalCost: 2700000
  },
  '20PY': {
    demolitionCost: 4000000,
    cleaningCost: 500000,
    totalCost: 4500000
  },
  '30PY': {
    demolitionCost: 5440000,
    cleaningCost: 680000,
    totalCost: 6120000
  },
  '40PY': {
    demolitionCost: 7040000,
    cleaningCost: 880000,
    totalCost: 7920000
  },
  '50PY': {
    demolitionCost: 8800000,
    cleaningCost: 1100000,
    totalCost: 9900000
  }
};

// ============================================================
// 7. 공사 일정 관련
// ============================================================

/** 공사 단계 */
export const CONSTRUCTION_PHASES = [
  {
    phase: 1,
    name: '사전 준비',
    tasks: ['관리실 협의', '보증금 예치', '입주민 동의서'],
    duration: '1~3일'
  },
  {
    phase: 2,
    name: '철거',
    tasks: ['기존 마감재 철거', '폐기물 반출'],
    duration: '1~2일'
  },
  {
    phase: 3,
    name: '설비/전기',
    tasks: ['배관 이설', '전기 배선', '방수 공사'],
    duration: '3~5일'
  },
  {
    phase: 4,
    name: '타일',
    tasks: ['욕실 타일', '현관 타일', '주방 타일'],
    duration: '3~5일'
  },
  {
    phase: 5,
    name: '목공',
    tasks: ['몰딩', '걸레받이', '문선 리폼'],
    duration: '2~3일'
  },
  {
    phase: 6,
    name: '도배/바닥',
    tasks: ['도배', '바닥 시공'],
    duration: '2~3일'
  },
  {
    phase: 7,
    name: '가구/설치',
    tasks: ['싱크대', '붙박이장', '욕실 도기'],
    duration: '2~3일'
  },
  {
    phase: 8,
    name: '마감',
    tasks: ['필름', '샷시', '도어락'],
    duration: '2~3일'
  },
  {
    phase: 9,
    name: '청소/검수',
    tasks: ['입주청소', '최종 검수', '하자 보수'],
    duration: '1~2일'
  }
];

/** 평형별 총 공사 기간 */
export const CONSTRUCTION_DURATION_BY_SIZE: Record<SizeRange, {
  minDays: number;
  maxDays: number;
  typical: string;
}> = {
  '10PY': { minDays: 15, maxDays: 20, typical: '약 15~20일' },
  '20PY': { minDays: 20, maxDays: 25, typical: '약 20~25일' },
  '30PY': { minDays: 25, maxDays: 30, typical: '약 25~30일' },
  '40PY': { minDays: 30, maxDays: 40, typical: '약 30~40일' },
  '50PY': { minDays: 35, maxDays: 45, typical: '약 35~45일' }
};



