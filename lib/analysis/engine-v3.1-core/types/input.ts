/**
 * V3.1 Core Edition - Input Layer 타입 정의
 * 
 * 범위:
 * - 아파트 20~34평
 * - 거주 중인 세대
 * - 욕실 + 거실/주방 중심
 */

// ============ Soft Input (고객 성향/생활 패턴) ============

export interface FamilyComposition {
  /** 가족 인원수 */
  count: number;
  /** 영유아 있음 */
  hasInfant: boolean;
  /** 고령자 동거 */
  hasElderly: boolean;
  /** 반려동물 있음 */
  hasPet: boolean;
  /** 반려동물 크기 (있는 경우) */
  petSize?: 'small' | 'medium' | 'large';
}

export interface LifestylePattern {
  /** 재택근무 여부 */
  hasRemoteWork: boolean;
  /** 집에 머무는 시간 */
  timeAtHome: 'low' | 'medium' | 'high';
  /** 주된 활동 패턴 */
  mainActivity?: 'tv' | 'dining' | 'sofa' | 'bedroom' | 'mixed';
}

export interface KitchenPattern {
  /** 요리 빈도 */
  cookingFrequency: 'rarely' | 'sometimes' | 'often';
  /** 기름 요리 비중 */
  oilyCooking: 'low' | 'medium' | 'high';
  /** 식재료 저장량 */
  foodStorage: 'low' | 'medium' | 'high';
}

export interface StoragePattern {
  /** 수납량 */
  storageNeeds: 'low' | 'medium' | 'high';
  /** 정리/정돈 스트레스 */
  organizationStress: 'none' | 'some' | 'high';
  /** 숨김 수납 선호 */
  prefersHiddenStorage: boolean;
}

export interface CleaningPattern {
  /** 청소 빈도 */
  cleaningFrequency: 'daily' | 'weekly-2-3' | 'weekly-1' | 'less';
  /** 관리 스트레스 */
  maintenanceStress: 'low' | 'medium' | 'high';
}

export interface LightingPreference {
  /** 전체 밝기 선호 */
  overallBrightness: 'bright' | 'medium' | 'dim';
  /** 간접 조명 선호 */
  prefersIndirectLighting: boolean;
  /** 특정 공간 밝기 불만 */
  brightnessComplaints?: string[];  // 예: ['거실', '안방']
}

export interface SoftInputCore {
  family: FamilyComposition;
  lifestyle: LifestylePattern;
  kitchen: KitchenPattern;
  storage: StoragePattern;
  cleaning: CleaningPattern;
  lighting: LightingPreference;
}

// ============ Hard Input (공간 컨텍스트/집 상태) ============

export type BuildingAge = 'new' | 'semi-new' | 'old';  // 0-5년 / 5-15년 / 15년+

export interface BuildingCondition {
  /** 연식 */
  age: BuildingAge;
  /** 주거 형태 */
  type: 'apartment' | 'villa' | 'officetel' | 'house';
  /** 거주 중 여부 (Core Edition: true 고정) */
  occupied: true;
  /** 발코니/확장 여부 */
  hasBalcony?: boolean;
  /** 누수/곰팡이 이력 */
  hasWaterDamage?: boolean;
  /** 환기 문제 */
  hasVentilationIssue?: boolean;
  /** 층/위치 */
  floor?: 'low' | 'mid' | 'high';
}

export interface HardInputCore {
  /** 평수 (Core Edition: 20-34평) */
  pyeong: number;
  /** 건물 상태 */
  building: BuildingCondition;
  /** 거주 목적 */
  livingPurpose?: '실거주' | '매도준비' | '임대' | '입력안함';
  /** 거주 기간 (년) */
  livingYears?: number;
}

// ============ Budget Input ============

export interface BudgetInputCore {
  /** 예산 레벨 */
  level: 'low' | 'medium' | 'high' | 'premium';
  /** 가격 민감도 */
  priceSensitive: boolean;
  /** 예산 금액 (만원 단위) */
  amount?: number;
}

// ============ Rooms (공간 리스트) ============

export type RoomType =
  | 'living'         // 거실
  | 'kitchen'        // 주방
  | 'dining'         // 다이닝
  | 'entrance'       // 현관
  | 'hallway'        // 복도
  | 'master-bedroom' // 안방
  | 'child-room'     // 자녀방
  | 'guest-room'     // 게스트룸
  | 'dressroom'      // 드레스룸
  | 'bathroom'       // 욕실
  | 'powder-room'    // 화장실
  | 'utility'        // 다용도실
  | 'balcony'        // 발코니
  | 'study'          // 서재
  | 'pantry'         // 팬트리
  | 'other';         // 기타

export type RoomUsageTag =
  | 'sleep'
  | 'rest'
  | 'tv'
  | 'study'
  | 'work'
  | 'cooking'
  | 'laundry'
  | 'entry'
  | 'storage'
  | 'hygiene'
  | 'play';

export interface Room {
  /** 공간 타입 */
  type: RoomType;
  /** 공간 이름/라벨 */
  label: string;
  /** 주요 용도 태그 */
  usageTags: RoomUsageTag[];
  /** 특이사항 태그 (선택) */
  specialTags?: ('child-main' | 'elderly-main' | 'pet-main')[];
  /** 현재 문제점 (선택) */
  issues?: string[];  // 예: ['곰팡이', '어두움', '수납 부족']
}

export interface RoomsCore {
  rooms: Room[];
}

// ============ Core Input 통합 ============

export interface CoreInput {
  soft: SoftInputCore;
  hard: HardInputCore;
  budget: BudgetInputCore;
  rooms: RoomsCore;
  /** 입력 생성 시점 */
  timestamp: string;
  /** 디버그용 원본 데이터 참조 (선택) */
  _source?: 'v3' | 'direct';
}

