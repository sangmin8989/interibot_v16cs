/**
 * 인테리봇 견적 시스템 V3 - 타입 정의
 * 
 * 4등급 체계: BASIC / STANDARD / ARGEN / PREMIUM
 * 아르젠 컨셉: Standard 가격 + Premium 품질
 */

// ============================================================
// 1. 등급 체계
// ============================================================

/** 4등급 체계 */
export type Grade = 'BASIC' | 'STANDARD' | 'ARGEN' | 'PREMIUM';

/** 등급 정보 */
export interface GradeInfo {
  id: Grade;
  name: string;           // 한글명
  description: string;    // 설명
  targetUser: string;     // 타겟 사용자
}

/** 전체 등급 정보 */
export const GRADES: Record<Grade, GradeInfo> = {
  BASIC: {
    id: 'BASIC',
    name: '실속형',
    description: '임대용/저예산',
    targetUser: '임대용, 저예산 리모델링'
  },
  STANDARD: {
    id: 'STANDARD',
    name: '표준형',
    description: '일반 자가 거주',
    targetUser: '일반 자가 거주자'
  },
  ARGEN: {
    id: 'ARGEN',
    name: '아르젠',
    description: 'Standard 가격 + Premium 품질',
    targetUser: '품질 중시, 가성비 추구'
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: '프리미엄',
    description: '최고급/수입품',
    targetUser: '최고급 마감 원하는 고객'
  }
};

// ============================================================
// 2. 아르젠 컨셉 구분
// ============================================================

/** 아르젠 적용 방식 */
export type ArgenType = 'ARGEN_MADE' | 'ARGEN_RECOMMENDED';

/** 아르젠 컨셉 정보 */
export interface ArgenConcept {
  type: ArgenType;
  icon: string;
  label: string;
  description: string;
}

/** 아르젠 제작 품목 (맞춤가구) */
export const ARGEN_MADE: ArgenConcept = {
  type: 'ARGEN_MADE',
  icon: '🔧',
  label: '아르젠 제작',
  description: '아르젠 자체 맞춤 제작 (블룸 하드웨어)'
};

/** 아르젠 추천 자재 */
export const ARGEN_RECOMMENDED: ArgenConcept = {
  type: 'ARGEN_RECOMMENDED',
  icon: '⭐',
  label: '아르젠 추천',
  description: 'Standard 가격대 최고 품질 자재'
};

/** 공정별 아르젠 적용 방식 */
export const ARGEN_PROCESS_TYPE: Record<string, ArgenType> = {
  // 🔧 아르젠 제작 (맞춤가구)
  kitchen: 'ARGEN_MADE',           // 싱크대
  closet: 'ARGEN_MADE',            // 붙박이장
  storage: 'ARGEN_MADE',           // 수납장
  shoeRack: 'ARGEN_MADE',          // 신발장
  pantry: 'ARGEN_MADE',            // 팬트리
  bathroomCabinet: 'ARGEN_MADE',   // 욕실장
  
  // ⭐ 아르젠 추천 (자재)
  wallpaper: 'ARGEN_RECOMMENDED',  // 도배
  flooring: 'ARGEN_RECOMMENDED',   // 바닥
  film: 'ARGEN_RECOMMENDED',       // 필름
  window: 'ARGEN_RECOMMENDED',     // 샷시
  door: 'ARGEN_RECOMMENDED',       // 방문
  middleDoor: 'ARGEN_RECOMMENDED', // 중문
  tile: 'ARGEN_RECOMMENDED'        // 타일
};

// ============================================================
// 3. 평형 체계
// ============================================================

/** 평형 구간 */
export type SizeRange = '10PY' | '20PY' | '30PY' | '40PY' | '50PY';

/** 평형 구간 정보 */
export interface SizeRangeInfo {
  id: SizeRange;
  label: string;           // 라벨 (예: "10평대")
  minPy: number;           // 최소 평수
  maxPy: number;           // 최대 평수
  standardPy: number;      // 기준 평수 (계산용)
  standardM2: number;      // 기준 제곱미터
}

/** 평형 구간 정보 */
export const SIZE_RANGES: Record<SizeRange, SizeRangeInfo> = {
  '10PY': { id: '10PY', label: '10평대', minPy: 10, maxPy: 19, standardPy: 15, standardM2: 49.6 },
  '20PY': { id: '20PY', label: '20평대', minPy: 20, maxPy: 29, standardPy: 25, standardM2: 82.6 },
  '30PY': { id: '30PY', label: '30평대', minPy: 30, maxPy: 39, standardPy: 34, standardM2: 112.4 },
  '40PY': { id: '40PY', label: '40평대', minPy: 40, maxPy: 49, standardPy: 44, standardM2: 145.5 },
  '50PY': { id: '50PY', label: '50평대', minPy: 50, maxPy: 60, standardPy: 55, standardM2: 181.8 }
};

/** 평수로 평형 구간 찾기 */
export function getSizeRange(py: number): SizeRange {
  if (py < 20) return '10PY';
  if (py < 30) return '20PY';
  if (py < 40) return '30PY';
  if (py < 50) return '40PY';
  return '50PY';
}

// ============================================================
// 4. 브랜드 타입
// ============================================================

/** 브랜드 정보 */
export interface BrandInfo {
  name: string;         // 브랜드명
  product?: string;     // 제품명 (옵션)
  description?: string; // 설명
}

/** 등급별 브랜드 목록 */
export type GradeBrands = Record<Grade, BrandInfo[]>;

// ============================================================
// 5. 단가 타입
// ============================================================

/** 단위 */
export type PriceUnit = 
  | 'PER_PY'      // 평당
  | 'PER_M2'      // 제곱미터당
  | 'PER_M'       // 미터당
  | 'PER_ROLL'    // 롤당
  | 'PER_JA'      // 자당 (30cm)
  | 'PER_SET'     // 세트당
  | 'PER_EA'      // 개당
  | 'PER_PIECE'   // 짝당 (폴딩도어)
  | 'PACKAGE'     // 패키지 (샷시)
  | 'PER_TEAM'    // 팀당 (노무비)
  | 'FIXED';      // 고정가

/** 등급별 단가 */
export type GradePrices = Record<Grade, number>;

/** 기본 단가 항목 */
export interface BasePriceItem {
  id: string;
  name: string;
  unit: PriceUnit;
  prices: GradePrices;
  brands?: GradeBrands;
  argenType?: ArgenType;
  description?: string;
}

// ============================================================
// 6. 공정 카테고리
// ============================================================

/** 공정 카테고리 */
export type ProcessCategory = 
  | 'COMMON'      // 공통 (철거, 보양, 청소)
  | 'LIVING'      // 거실/복도
  | 'KITCHEN'     // 주방
  | 'BATHROOM'    // 욕실
  | 'ROOM'        // 방
  | 'STORAGE'     // 수납
  | 'WINDOW'      // 창호
  | 'ELECTRIC';   // 전기/조명

/** 공정 카테고리 정보 */
export const PROCESS_CATEGORIES: Record<ProcessCategory, string> = {
  COMMON: '공통 공사',
  LIVING: '거실/복도',
  KITCHEN: '주방',
  BATHROOM: '욕실',
  ROOM: '방',
  STORAGE: '수납/가구',
  WINDOW: '창호',
  ELECTRIC: '전기/조명'
};

// ============================================================
// 7. 평형별 물량 계산 기준
// ============================================================

/** 평형별 기본 물량 */
export interface SizeQuantities {
  /** 도배 롤 수 */
  wallpaperRolls: number;
  /** 바닥 시공 면적 (평) */
  flooringArea: number;
  /** 필름 시공 길이 (m) */
  filmLength: number;
  /** 몰딩 길이 (m) */
  moldingLength: number;
  /** 싱크대 길이 (자) */
  kitchenJa: number;
  /** 붙박이장 길이 (자) */
  closetJa: number;
  /** 신발장 길이 (자) */
  shoeRackJa: number;
  /** 방문 개수 */
  doorCount: number;
  /** 욕실 개수 */
  bathroomCount: number;
  /** 욕실 면적 (m²) */
  bathroomArea: number;
  /** 주방 타일 면적 (m²) */
  kitchenTileArea: number;
  /** 현관 타일 면적 (m²) */
  entranceTileArea: number;
  /** 샷시 틀 수 */
  windowFrames: number;
  /** 다운라이트 개수 */
  downlightCount: number;
  /** 간접조명 길이 (m) */
  indirectLightLength: number;
  /** 스위치/콘센트 개수 */
  switchCount: number;
  /** 보양재 - 플로베니아 (장) */
  protectionBoard: number;
  /** 보양재 - 텐텐지 (롤) */
  protectionRoll: number;
}

/** 평형별 기본 물량 테이블 */
export const SIZE_QUANTITIES: Record<SizeRange, SizeQuantities> = {
  '10PY': {
    wallpaperRolls: 11,
    flooringArea: 13,
    filmLength: 15,
    moldingLength: 40,
    kitchenJa: 10,
    closetJa: 8,
    shoeRackJa: 4,
    doorCount: 3,
    bathroomCount: 1,
    bathroomArea: 12,
    kitchenTileArea: 3,
    entranceTileArea: 1.5,
    windowFrames: 4,
    downlightCount: 12,
    indirectLightLength: 10,
    switchCount: 20,
    protectionBoard: 20,
    protectionRoll: 1
  },
  '20PY': {
    wallpaperRolls: 16,
    flooringArea: 22,
    filmLength: 28,
    moldingLength: 60,
    kitchenJa: 12,
    closetJa: 10,
    shoeRackJa: 5,
    doorCount: 4,
    bathroomCount: 1,
    bathroomArea: 14,
    kitchenTileArea: 4,
    entranceTileArea: 2,
    windowFrames: 6,
    downlightCount: 12,
    indirectLightLength: 10,
    switchCount: 20,
    protectionBoard: 30,
    protectionRoll: 1
  },
  '30PY': {
    wallpaperRolls: 21,
    flooringArea: 30,
    filmLength: 45,
    moldingLength: 85,
    kitchenJa: 15,
    closetJa: 12,
    shoeRackJa: 6,
    doorCount: 5,
    bathroomCount: 2,
    bathroomArea: 32,
    kitchenTileArea: 6,
    entranceTileArea: 3,
    windowFrames: 8,
    downlightCount: 17,
    indirectLightLength: 15,
    switchCount: 30,
    protectionBoard: 40,
    protectionRoll: 1
  },
  '40PY': {
    wallpaperRolls: 28,
    flooringArea: 40,
    filmLength: 60,
    moldingLength: 110,
    kitchenJa: 18,
    closetJa: 15,
    shoeRackJa: 7,
    doorCount: 6,
    bathroomCount: 2,
    bathroomArea: 36,
    kitchenTileArea: 8,
    entranceTileArea: 4,
    windowFrames: 10,
    downlightCount: 22,
    indirectLightLength: 20,
    switchCount: 40,
    protectionBoard: 50,
    protectionRoll: 2
  },
  '50PY': {
    wallpaperRolls: 35,
    flooringArea: 50,
    filmLength: 80,
    moldingLength: 140,
    kitchenJa: 22,
    closetJa: 18,
    shoeRackJa: 8,
    doorCount: 7,
    bathroomCount: 2,
    bathroomArea: 40,
    kitchenTileArea: 10,
    entranceTileArea: 5,
    windowFrames: 12,
    downlightCount: 28,
    indirectLightLength: 25,
    switchCount: 50,
    protectionBoard: 60,
    protectionRoll: 2
  }
};

// ============================================================
// 8. 도배 품수 계산
// ============================================================

/** 도배 품수 (1품 = 30만원) */
export interface WallpaperLabor {
  품수: number;
  노무비: number;
  확장형노무비: number;
}

/** 평형별 도배 노무비 */
export const WALLPAPER_LABOR: Record<SizeRange, WallpaperLabor> = {
  '10PY': { 품수: 3, 노무비: 900000, 확장형노무비: 1200000 },
  '20PY': { 품수: 5, 노무비: 1500000, 확장형노무비: 1800000 },
  '30PY': { 품수: 7, 노무비: 2100000, 확장형노무비: 2700000 },
  '40PY': { 품수: 10, 노무비: 3000000, 확장형노무비: 3600000 },
  '50PY': { 품수: 13, 노무비: 3900000, 확장형노무비: 4500000 }
};

// ============================================================
// 9. 유틸리티 함수
// ============================================================

/** 숫자 포맷 (천단위 콤마) */
export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

/** 원 단위로 포맷 */
export function formatWon(price: number): string {
  return `${formatPrice(price)}원`;
}

/** 만원 단위로 포맷 */
export function formatManWon(price: number): string {
  const man = Math.round(price / 10000);
  return `${formatPrice(man)}만원`;
}

/** VAT 계산 (10%) */
export function calculateVAT(price: number): number {
  return Math.round(price * 0.1);
}

/** VAT 포함 가격 계산 */
export function priceWithVAT(price: number): number {
  return price + calculateVAT(price);
}



