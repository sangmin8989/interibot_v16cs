/**
 * 인테리봇 견적 시스템 V3 - 보양재 단가표
 * 
 * 공사 중 바닥/벽/엘리베이터 보호용 자재
 * 공사 시작 전 필수 설치
 */

import { SizeRange, SIZE_QUANTITIES } from './types';

// ============================================================
// 1. 보양재 종류 및 단가
// ============================================================

/** 보양재 종류 */
export type ProtectionType = 'FLOVENT' | 'TENTEN' | 'ELEVATOR';

/** 보양재 정보 */
export interface ProtectionItem {
  id: ProtectionType;
  name: string;
  spec: string;
  unit: string;
  price: number;
  description: string;
}

/** 보양재 목록 */
export const PROTECTION_ITEMS: Record<ProtectionType, ProtectionItem> = {
  FLOVENT: {
    id: 'FLOVENT',
    name: '플로베니아',
    spec: '3×6 (900×1800mm)',
    unit: '장',
    price: 3500,
    description: '바닥 보호용 합판. 가장 기본적인 보양재.'
  },
  TENTEN: {
    id: 'TENTEN',
    name: '텐텐지',
    spec: '1.8m × 50M',
    unit: '롤',
    price: 50000,
    description: '바닥/벽 보호용 부직포. 충격 흡수.'
  },
  ELEVATOR: {
    id: 'ELEVATOR',
    name: '엘리베이터 보양',
    spec: '1대',
    unit: '대',
    price: 120000,
    description: '엘리베이터 내부 보호. 관리실 협의 필수.'
  }
};

// ============================================================
// 2. 평형별 보양재 물량
// ============================================================

/** 평형별 보양재 물량 */
export const PROTECTION_QUANTITY_BY_SIZE: Record<SizeRange, {
  flovent: number;    // 플로베니아 (장)
  tenten: number;     // 텐텐지 (롤)
  elevator: number;   // 엘리베이터 (대)
}> = {
  '10PY': { flovent: 20, tenten: 1, elevator: 1 },
  '20PY': { flovent: 30, tenten: 1, elevator: 1 },
  '30PY': { flovent: 40, tenten: 1, elevator: 1 },
  '40PY': { flovent: 50, tenten: 2, elevator: 1 },
  '50PY': { flovent: 60, tenten: 2, elevator: 1 }
};

// ============================================================
// 3. 보양재 견적 계산
// ============================================================

/** 보양재 견적 결과 */
export interface ProtectionEstimate {
  sizeRange: SizeRange;
  py: number;
  
  // 플로베니아
  floventCount: number;
  floventPrice: number;
  floventCost: number;
  
  // 텐텐지
  tentenCount: number;
  tentenPrice: number;
  tentenCost: number;
  
  // 엘리베이터 보양
  elevatorCount: number;
  elevatorPrice: number;
  elevatorCost: number;
  
  // 합계
  totalCost: number;
}

/** 보양재 견적 계산 */
export function calculateProtectionEstimate(
  sizeRange: SizeRange,
  py: number
): ProtectionEstimate {
  const quantities = PROTECTION_QUANTITY_BY_SIZE[sizeRange];
  
  // 플로베니아
  const floventCount = quantities.flovent;
  const floventPrice = PROTECTION_ITEMS.FLOVENT.price;
  const floventCost = floventCount * floventPrice;
  
  // 텐텐지
  const tentenCount = quantities.tenten;
  const tentenPrice = PROTECTION_ITEMS.TENTEN.price;
  const tentenCost = tentenCount * tentenPrice;
  
  // 엘리베이터 보양
  const elevatorCount = quantities.elevator;
  const elevatorPrice = PROTECTION_ITEMS.ELEVATOR.price;
  const elevatorCost = elevatorCount * elevatorPrice;
  
  // 합계
  const totalCost = floventCost + tentenCost + elevatorCost;
  
  return {
    sizeRange,
    py,
    floventCount,
    floventPrice,
    floventCost,
    tentenCount,
    tentenPrice,
    tentenCost,
    elevatorCount,
    elevatorPrice,
    elevatorCost,
    totalCost
  };
}

// ============================================================
// 4. 평형별 기준 비용표 (미리 계산된 값)
// ============================================================

/** 평형별 보양비용 */
export const PROTECTION_COST_BY_SIZE: Record<SizeRange, {
  flovent: { count: number; cost: number };
  tenten: { count: number; cost: number };
  elevator: { count: number; cost: number };
  totalCost: number;
}> = {
  '10PY': {
    flovent: { count: 20, cost: 70000 },
    tenten: { count: 1, cost: 50000 },
    elevator: { count: 1, cost: 120000 },
    totalCost: 240000
  },
  '20PY': {
    flovent: { count: 30, cost: 105000 },
    tenten: { count: 1, cost: 50000 },
    elevator: { count: 1, cost: 120000 },
    totalCost: 275000
  },
  '30PY': {
    flovent: { count: 40, cost: 140000 },
    tenten: { count: 1, cost: 50000 },
    elevator: { count: 1, cost: 120000 },
    totalCost: 310000
  },
  '40PY': {
    flovent: { count: 50, cost: 175000 },
    tenten: { count: 2, cost: 100000 },
    elevator: { count: 1, cost: 120000 },
    totalCost: 395000
  },
  '50PY': {
    flovent: { count: 60, cost: 210000 },
    tenten: { count: 2, cost: 100000 },
    elevator: { count: 1, cost: 120000 },
    totalCost: 430000
  }
};

// ============================================================
// 5. 보양재 관련 유틸리티
// ============================================================

/** 보양재 설치 순서 */
export const PROTECTION_INSTALLATION_ORDER = [
  {
    step: 1,
    name: '엘리베이터 보양',
    description: '자재 반입 전 먼저 설치',
    duration: '30분'
  },
  {
    step: 2,
    name: '현관~거실 동선 보양',
    description: '자재 운반 동선 확보',
    duration: '1시간'
  },
  {
    step: 3,
    name: '전체 바닥 보양',
    description: '철거 전 전체 바닥 보호',
    duration: '2~3시간'
  }
];

/** 보양재 주의사항 */
export const PROTECTION_NOTES = {
  flovent: [
    '합판 이음새에 테이프 처리 필수',
    '무거운 자재 이동 시 추가 보강',
    '철거 폐기물로 인한 손상 주의'
  ],
  tenten: [
    '습기가 있는 곳은 비닐 먼저 깔기',
    '모서리 부분 꼼꼼히 처리',
    '재사용 가능 (상태에 따라)'
  ],
  elevator: [
    '관리실 사전 협의 필수',
    '보증금 요구하는 경우 있음',
    '공사 종료 후 원상복구'
  ]
};

/** 관리실 협의 사항 */
export const MANAGEMENT_OFFICE_CHECKLIST = [
  {
    item: '공사 신고',
    description: '리모델링 공사 신고서 제출',
    required: true
  },
  {
    item: '입주민 동의서',
    description: '층간/인접 세대 동의',
    required: true
  },
  {
    item: '공사 보증금',
    description: '50~500만원 (단지별 상이)',
    required: true
  },
  {
    item: '엘리베이터 사용 시간',
    description: '자재 반입 가능 시간 확인',
    required: true
  },
  {
    item: '폐기물 처리',
    description: '지정 장소 및 반출 시간 확인',
    required: true
  }
];



