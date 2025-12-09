/**
 * 인테리봇 견적 시스템 V3 - 노무비 기준표
 * 
 * 기준: 2025년 수도권 표준 / 2인 1조(Team) 원칙 / 식대 포함 / VAT 별도
 */

import { SizeRange, SIZE_QUANTITIES } from './types';

// ============================================================
// 1. 공정별 노무비 기준
// ============================================================

/** 공정 ID */
export type LaborProcessId = 
  | 'demolition'      // 철거
  | 'carpentry'       // 목공
  | 'tile'            // 타일
  | 'wallpaper'       // 도배
  | 'flooring'        // 바닥
  | 'film'            // 필름
  | 'plumbing'        // 설비
  | 'kitchenInstall'  // 싱크대 설치
  | 'kitchenRemove'   // 싱크대 철거
  | 'cleaning';       // 입주청소

/** 노무비 정보 */
export interface LaborInfo {
  id: LaborProcessId;
  name: string;                 // 공정명
  team: string;                 // 인원 구성
  priceType: 'PER_PY' | 'PER_TEAM' | 'PER_M2';  // 가격 타입
  pricePerUnit: number;         // 단가
  dailyOutput: string;          // 1일 시공 물량
  note?: string;                // 비고
}

/** 노무비 기준표 */
export const LABOR_PRICES: Record<LaborProcessId, LaborInfo> = {
  demolition: {
    id: 'demolition',
    name: '철거',
    team: '철거팀',
    priceType: 'PER_PY',
    pricePerUnit: 160000,  // 평당 160,000원
    dailyOutput: '25평 전체 철거: 1일',
    note: '폐기물 반출 노무 포함 (평당 고정)'
  },
  carpentry: {
    id: 'carpentry',
    name: '목공',
    team: '반장(40만)+조공(30만)',
    priceType: 'PER_TEAM',
    pricePerUnit: 700000,  // 1조당 700,000원
    dailyOutput: '천장몰딩+걸레받이: 30평',
    note: '장비대 포함. 복잡한 가벽/천장은 물량 70%'
  },
  tile: {
    id: 'tile',
    name: '타일',
    team: '기공(40만)+조공(25만)',
    priceType: 'PER_TEAM',
    pricePerUnit: 650000,  // 1조당 650,000원
    dailyOutput: '욕실(벽+바닥): 0.5~0.7실',
    note: '600각/졸리컷 시공 시 속도 30% 저하'
  },
  wallpaper: {
    id: 'wallpaper',
    name: '도배',
    team: '정배(30만)+정배(30만)',
    priceType: 'PER_TEAM',
    pricePerUnit: 600000,  // 1조당 600,000원
    dailyOutput: '합지: 40~50평, 실크: 25~30평',
    note: '퍼티 작업 시 시공물량 50% 감소'
  },
  flooring: {
    id: 'flooring',
    name: '바닥',
    team: '2인 1조',
    priceType: 'PER_PY',
    pricePerUnit: 40000,  // 평당 40,000원 도급
    dailyOutput: '강마루: 40~50평',
    note: '평당 도급 계산 (빨리 끝내도 퀄리티 동일)'
  },
  film: {
    id: 'film',
    name: '필름',
    team: '기공(30만)+기공(30만)',
    priceType: 'PER_TEAM',
    pricePerUnit: 600000,  // 1조당 600,000원
    dailyOutput: '방문세트: 3~4세트 또는 샷시: 3~4틀',
    note: '밑작업(샌딩/퍼티) 포함. 굴곡 많으면 물량 감소'
  },
  plumbing: {
    id: 'plumbing',
    name: '설비',
    team: '기공(35만)+보조(15만)',
    priceType: 'PER_TEAM',
    pricePerUnit: 500000,  // 1조당 500,000원
    dailyOutput: '방수(2차): 2개소 또는 배관이설: 2~3개소',
    note: '철거 후 설비 작업 기준'
  },
  kitchenInstall: {
    id: 'kitchenInstall',
    name: '싱크대 설치',
    team: '설치(30만)+설치(30만)',
    priceType: 'PER_TEAM',
    pricePerUnit: 600000,  // 1조당 600,000원
    dailyOutput: 'ㅡ/ㄱ자 주방(4m내외): 1세트 + 수납장 1세트',
    note: '대면형/아일랜드 추가 시 1.5일 또는 3인 투입'
  },
  kitchenRemove: {
    id: 'kitchenRemove',
    name: '싱크대 철거',
    team: '2인 1조',
    priceType: 'PER_TEAM',
    pricePerUnit: 550000,  // 1조당 550,000원
    dailyOutput: '1세트',
    note: '폐기물 포함'
  },
  cleaning: {
    id: 'cleaning',
    name: '입주청소',
    team: '청소팀',
    priceType: 'PER_PY',
    pricePerUnit: 20000,  // 평당 20,000원
    dailyOutput: '30~40평형: 1세대/일',
    note: '전문 장비 투입 팀'
  }
};

// ============================================================
// 2. 노무비 계산 함수
// ============================================================

/** 철거비 계산 (평당 16만원 고정) */
export function calculateDemolitionLabor(py: number): number {
  return py * LABOR_PRICES.demolition.pricePerUnit;
}

/** 목공비 계산 (1조당 70만원 × 일수) */
export function calculateCarpentryLabor(days: number): number {
  return days * LABOR_PRICES.carpentry.pricePerUnit;
}

/** 타일 노무비 계산 (1조당 65만원 × 일수) */
export function calculateTileLabor(days: number): number {
  return days * LABOR_PRICES.tile.pricePerUnit;
}

/** 도배 노무비 계산 (1조당 60만원 × 일수) */
export function calculateWallpaperLabor(days: number): number {
  return days * LABOR_PRICES.wallpaper.pricePerUnit;
}

/** 바닥 노무비 계산 (평당 4만원 도급) */
export function calculateFlooringLabor(py: number): number {
  return py * LABOR_PRICES.flooring.pricePerUnit;
}

/** 필름 노무비 계산 (1조당 60만원 × 일수) */
export function calculateFilmLabor(days: number): number {
  return days * LABOR_PRICES.film.pricePerUnit;
}

/** 설비 노무비 계산 (1조당 50만원 × 일수) */
export function calculatePlumbingLabor(days: number): number {
  return days * LABOR_PRICES.plumbing.pricePerUnit;
}

/** 싱크대 설치비 */
export function getKitchenInstallLabor(): number {
  return LABOR_PRICES.kitchenInstall.pricePerUnit;
}

/** 싱크대 철거비 */
export function getKitchenRemoveLabor(): number {
  return LABOR_PRICES.kitchenRemove.pricePerUnit;
}

/** 입주청소비 계산 (평당 2만원) */
export function calculateCleaningLabor(py: number): number {
  return py * LABOR_PRICES.cleaning.pricePerUnit;
}

// ============================================================
// 3. 평형별 노무비 자동 계산
// ============================================================

/** 평형별 도배 일수 */
export const WALLPAPER_DAYS: Record<SizeRange, { normal: number; extended: number }> = {
  '10PY': { normal: 1, extended: 1.5 },
  '20PY': { normal: 1.5, extended: 2 },
  '30PY': { normal: 2, extended: 3 },
  '40PY': { normal: 3, extended: 4 },
  '50PY': { normal: 4, extended: 5 }
};

/** 평형별 필름 일수 */
export const FILM_DAYS: Record<SizeRange, number> = {
  '10PY': 1,
  '20PY': 1.5,
  '30PY': 2,
  '40PY': 2.5,
  '50PY': 3
};

/** 평형별 타일 일수 (욕실 2개 기준) */
export const TILE_DAYS: Record<SizeRange, number> = {
  '10PY': 2,    // 욕실 1개
  '20PY': 2,    // 욕실 1개
  '30PY': 4,    // 욕실 2개
  '40PY': 4.5,  // 욕실 2개 (넓음)
  '50PY': 5     // 욕실 2개 (매우 넓음)
};

/** 평형별 목공 일수 */
export const CARPENTRY_DAYS: Record<SizeRange, number> = {
  '10PY': 1,
  '20PY': 1.5,
  '30PY': 2,
  '40PY': 2.5,
  '50PY': 3
};

/** 평형별 설비 일수 */
export const PLUMBING_DAYS: Record<SizeRange, number> = {
  '10PY': 1,    // 욕실 1개
  '20PY': 1.5,  // 욕실 1개
  '30PY': 2,    // 욕실 2개
  '40PY': 2.5,  // 욕실 2개
  '50PY': 3     // 욕실 2개
};

// ============================================================
// 4. 전체 노무비 계산 (평형 기준)
// ============================================================

/** 전체 노무비 결과 */
export interface TotalLaborCost {
  demolition: number;      // 철거
  carpentry: number;       // 목공
  tile: number;            // 타일
  wallpaper: number;       // 도배
  flooring: number;        // 바닥
  film: number;            // 필름
  plumbing: number;        // 설비
  kitchenInstall: number;  // 싱크대 설치
  kitchenRemove: number;   // 싱크대 철거
  cleaning: number;        // 입주청소
  total: number;           // 총 노무비
}

/** 평형별 전체 노무비 계산 */
export function calculateTotalLabor(
  py: number,
  sizeRange: SizeRange,
  options?: {
    includeKitchen?: boolean;    // 싱크대 포함 여부
    isExtendedType?: boolean;    // 확장형 여부 (도배 물량 증가)
  }
): TotalLaborCost {
  const { includeKitchen = true, isExtendedType = false } = options || {};
  const quantities = SIZE_QUANTITIES[sizeRange];
  
  // 각 공정별 노무비 계산
  const demolition = calculateDemolitionLabor(py);
  const carpentry = calculateCarpentryLabor(CARPENTRY_DAYS[sizeRange]);
  const tile = calculateTileLabor(TILE_DAYS[sizeRange]);
  
  const wallpaperDays = isExtendedType 
    ? WALLPAPER_DAYS[sizeRange].extended 
    : WALLPAPER_DAYS[sizeRange].normal;
  const wallpaper = calculateWallpaperLabor(wallpaperDays);
  
  const flooring = calculateFlooringLabor(quantities.flooringArea);
  const film = calculateFilmLabor(FILM_DAYS[sizeRange]);
  const plumbing = calculatePlumbingLabor(PLUMBING_DAYS[sizeRange]);
  const kitchenInstall = includeKitchen ? getKitchenInstallLabor() : 0;
  const kitchenRemove = includeKitchen ? getKitchenRemoveLabor() : 0;
  const cleaning = calculateCleaningLabor(py);
  
  const total = demolition + carpentry + tile + wallpaper + flooring + 
                film + plumbing + kitchenInstall + kitchenRemove + cleaning;
  
  return {
    demolition,
    carpentry,
    tile,
    wallpaper,
    flooring,
    film,
    plumbing,
    kitchenInstall,
    kitchenRemove,
    cleaning,
    total
  };
}

// ============================================================
// 5. 공사 기간 계산
// ============================================================

/** 공사 기간 결과 */
export interface ConstructionPeriod {
  demolition: number;    // 철거
  plumbing: number;      // 설비/전기
  tile: number;          // 타일
  carpentry: number;     // 목공
  wallpaper: number;     // 도배
  flooring: number;      // 바닥
  kitchen: number;       // 싱크대
  film: number;          // 필름
  window: number;        // 샷시
  finishing: number;     // 마감
  cleaning: number;      // 청소
  totalDays: number;     // 총 공사일
}

/** 평형별 공사 기간 계산 */
export function calculateConstructionPeriod(
  py: number,
  sizeRange: SizeRange
): ConstructionPeriod {
  // 철거 일수 계산 (25평당 1일)
  const demolition = Math.ceil(py / 25);
  
  const period: ConstructionPeriod = {
    demolition,
    plumbing: PLUMBING_DAYS[sizeRange],
    tile: TILE_DAYS[sizeRange],
    carpentry: CARPENTRY_DAYS[sizeRange],
    wallpaper: WALLPAPER_DAYS[sizeRange].normal,
    flooring: 1,  // 바닥은 보통 1일
    kitchen: 1,   // 싱크대 설치 1일
    film: FILM_DAYS[sizeRange],
    window: 1,    // 샷시 1일
    finishing: 3, // 마감 3일 (고정)
    cleaning: 1,  // 청소 1일
    totalDays: 0
  };
  
  // 총 공사일 계산 (일부 공정은 병행 가능)
  period.totalDays = Math.ceil(
    period.demolition +
    period.plumbing +
    period.tile +
    period.carpentry +
    period.wallpaper +
    period.flooring +
    period.kitchen +
    period.film +
    period.window +
    period.finishing +
    period.cleaning
  );
  
  return period;
}



