/**
 * 인테리봇 견적 시스템 V3 - 통합 견적 계산 엔진
 * 
 * 4등급 체계: BASIC / STANDARD / ARGEN / PREMIUM
 * 공간별 분리 견적 (거실, 주방, 욕실 등)
 * 자재비 + 노무비 분리 표시
 */

import {
  Grade,
  SizeRange,
  getSizeRange,
  calculateVAT,
  priceWithVAT,
  formatWon,
  formatManWon,
  
  // 각 공정별 계산 함수
  calculateWallpaperEstimate,
  calculateFlooringEstimate,
  calculateFilmEstimate,
  calculateMoldingEstimate,
  calculateKitchenEstimate,
  calculateFurnitureEstimate,
  calculateWindowEstimate,
  calculateDoorEstimate,
  calculateTileEstimate,
  calculateBathroomSetEstimate,
  calculateLightingEstimate,
  calculateProtectionEstimate,
  calculateCommonEstimate,
  calculateConstructionPeriod,
  
  // 상수
  CONSTRUCTION_DURATION_BY_SIZE,
  SIZE_QUANTITIES,
  ClosetType
} from '../data/pricing-v3';
import type { PreferenceScores } from '../analysis/types';

// ============================================================
// 1. 견적 입력 옵션
// ============================================================

/** 성향 분석 결과 요약 (견적에 반영용) */
export interface PersonalitySummary {
  /** 성향 점수 (15개 카테고리) */
  scores: PreferenceScores;
  /** 상위 니즈 목록 (예: ['수납', '안전', '단열']) */
  topNeeds?: string[];
  /** 특수 플래그 (예: ['영유아', '반려동물', '노인']) */
  flags?: string[];
  /** 스타일 선호도 (예: ['minimal', 'natural']) */
  styleBias?: string[];
}

/** 선택 가능한 공간 */
export type SelectedSpace = 
  | 'living'      // 거실
  | 'kitchen'     // 주방
  | 'bathroom'    // 욕실
  | 'room'        // 방
  | 'entrance'    // 현관
  | 'balcony'     // 베란다
  | 'storage';    // 수납

/** 선택 가능한 공정 ID */
export type ProcessId = 
  | 'demolition'   // 철거
  | 'finish'       // 마감 (도배/바닥)
  | 'electric'     // 조명/전기
  | 'kitchen'      // 주방
  | 'bathroom'     // 욕실
  | 'door'         // 문
  | 'window'       // 창호
  | 'storage';     // 수납

/** 욕실 옵션 타입 (공통) */
export interface BathroomDetailOptions {
  스타일?: string;
  벽타일사이즈?: string;
  바닥타일사이즈?: string;
  양변기등급?: string;
  세면대등급?: string;
  욕조?: boolean;
  샤워부스?: boolean;
  샤워부스타입?: string;
  비데?: boolean;
  비데등급?: string;
  욕실장타입?: string;
  젠다이?: boolean;
  파티션?: boolean;
  바닥난방?: boolean;
  환풍기등급?: string;
}

/** 주방 옵션 타입 (공통) */
export interface KitchenDetailOptions {
  형태?: string;
  상판재질?: string;
  냉장고장?: boolean;
  키큰장?: boolean;
  아일랜드장?: boolean;
  팬트리?: boolean;
  상부장LED?: boolean;
  하부장LED?: boolean;
  설비?: {
    쿡탑?: string;
    식기세척기?: boolean;
    빌트인오븐?: boolean;
    빌트인정수기?: boolean;
  };
}

/** 세부 옵션 (localStorage에서 로드) */
export interface DetailOptions {
  주방옵션?: KitchenDetailOptions;
  보조주방옵션?: KitchenDetailOptions; // 30평 이상일 때 - 보조주방(팬트리)
  보조주방사용?: boolean; // 보조주방 사용 여부
  욕실옵션?: BathroomDetailOptions; // 욕실 1개일 때 사용
  안방욕실옵션?: BathroomDetailOptions; // 욕실 2개 이상일 때 - 안방욕실
  공용욕실옵션?: BathroomDetailOptions; // 욕실 2개 이상일 때 - 공용욕실
  거실옵션?: {
    벽지종류?: string;
    바닥재종류?: string;
    조명타입?: string;
    포인트벽지?: boolean;
    천장도배?: boolean;
    걸레받이?: boolean;
    디밍가능?: boolean;
    아트월?: boolean;
    몰딩?: boolean;
  };
  안방옵션?: {
    벽지종류?: string;
    바닥재종류?: string;
    조명타입?: string;
    포인트벽지?: boolean;
    천장도배?: boolean;
    걸레받이?: boolean;
    디밍가능?: boolean;
  };
  방옵션?: {
    벽지종류?: string;
    바닥재종류?: string;
    조명타입?: string;
    천장도배?: boolean;
  };
  현관옵션?: {
    타일사이즈?: string;
    타일패턴?: string;
    신발장교체?: boolean;
    신발장크기?: string;
    중문설치?: boolean;
  };
  발코니옵션?: {
    타일사이즈?: string;
    타일패턴?: string;
  };
}

/** ✅ 공간별 공정 선택 (process 페이지에서 저장) */
export type SpaceProcessSelection = Record<string, string | string[] | null>;
export type SelectedProcessesBySpace = Record<string, SpaceProcessSelection>;

/** 견적 입력 옵션 */
export interface EstimateInputV3 {
  /** 평수 */
  py: number;
  
  /** 등급 */
  grade: Grade;
  
  /** 욕실 개수 (기본값: 2) */
  bathroomCount?: number;
  
  /** 선택된 공간 목록 (없으면 전체) */
  selectedSpaces?: SelectedSpace[];
  
  /** ✅ 선택된 공정 목록 (없으면 전체) */
  enabledProcessIds?: string[];
  
  /** ✅ 세부 옵션 (주방/욕실/거실 등) */
  detailOptions?: DetailOptions;
  
  /** ✅ 공간별 공정 선택 (process 페이지에서 저장) */
  processSelections?: SelectedProcessesBySpace;
  
  /** 확장형 여부 (도배 물량 증가) */
  isExtended?: boolean;
  
  /** 붙박이장 타입 */
  closetType?: ClosetType;
  
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
  
  /** ✅ 성향 분석 결과 요약 (견적에 반영) */
  personalitySummary?: PersonalitySummary;
}

// ============================================================
// 2. 공간별 견적 결과
// ============================================================

/** 공정 항목 */
export interface ProcessItem {
  name: string;           // 공정명
  quantity?: string;      // 물량 (예: "21롤", "30평")
  materialCost: number;   // 자재비
  laborCost: number;      // 노무비
  totalCost: number;      // 합계
  brands?: string[];      // 브랜드 목록
  note?: string;          // 비고
  // ✅ Phase 2: LOCK 공정 정보
  isLocked?: boolean;     // LOCK 상태 여부
  lockReason?: string;    // LOCK 사유
  canOverride?: boolean;  // 사용자 변경 가능 여부 (LOCK은 false)
}

/** 공간별 견적 */
export interface SpaceEstimate {
  spaceName: string;      // 공간명
  items: ProcessItem[];   // 공정 항목들
  subtotal: number;       // 소계
}

/** 전체 견적 결과 */
export interface FullEstimateV3 {
  // 입력 정보
  input: {
    py: number;
    sizeRange: SizeRange;
    grade: Grade;
    gradeName: string;
  };
  
  // 공간별 견적
  spaces: {
    common: SpaceEstimate;           // 공통 공사
    living: SpaceEstimate;           // 거실/복도
    kitchen: SpaceEstimate;          // 주방 (메인)
    subKitchen?: SpaceEstimate;      // 보조주방 (30평 이상, 선택 시)
    bathroom: SpaceEstimate;         // 욕실 (1개일 때)
    masterBathroom?: SpaceEstimate;  // 안방욕실 (2개 이상일 때)
    commonBathroom?: SpaceEstimate;  // 공용욕실 (2개 이상일 때)
    storage: SpaceEstimate;          // 수납/가구
    window: SpaceEstimate;           // 창호
    lighting?: SpaceEstimate;        // 조명 (옵션)
    balcony?: SpaceEstimate;         // 발코니 (옵션)
    entrance?: SpaceEstimate;        // 현관 (옵션)
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
  
  // ✅ Phase 2: LOCK 공정 정보
  lockedProcesses?: {
    processId: string;
    processLabel: string;
    lockReason: string;
    canOverride: boolean;
  }[];
}

// ============================================================
// 3. 통합 견적 계산 함수
// ============================================================

/**
 * 성향 점수에 따라 등급을 조정합니다.
 * 
 * @param baseGrade - 기본 등급
 * @param personalitySummary - 성향 분석 결과
 * @returns 조정된 등급
 */
function adjustGradeByPersonality(
  baseGrade: Grade,
  personalitySummary?: PersonalitySummary
): Grade {
  if (!personalitySummary?.scores) {
    return baseGrade;
  }

  const scores = personalitySummary.scores;
  const gradeOrder: Grade[] = ['BASIC', 'STANDARD', 'ARGEN', 'PREMIUM'];
  let currentIndex = gradeOrder.indexOf(baseGrade);
  
  // 정리정돈 습관 높음 (≥7) → 수납 강화 → 등급 업그레이드 고려
  if (scores.organization_habit >= 7 && currentIndex < gradeOrder.length - 1) {
    currentIndex = Math.min(currentIndex + 1, gradeOrder.length - 1);
  }
  
  // 조명 취향 높음 (≥7) → 조명 강화 → 등급 업그레이드 고려
  if (scores.lighting_preference >= 7 && currentIndex < gradeOrder.length - 1) {
    currentIndex = Math.min(currentIndex + 1, gradeOrder.length - 1);
  }
  
  // 예산 감각 낮음 (≤3) → 가성비 중시 → 등급 다운그레이드 고려
  if (scores.budget_sense <= 3 && currentIndex > 0) {
    currentIndex = Math.max(currentIndex - 1, 0);
  }
  
  return gradeOrder[currentIndex];
}

/**
 * 성향 점수에 따라 옵션을 자동 추가합니다.
 * 
 * @param input - 견적 입력
 * @param personalitySummary - 성향 분석 결과
 * @returns 옵션이 추가된 견적 입력
 */
function applyPersonalityOptions(
  input: EstimateInputV3,
  personalitySummary?: PersonalitySummary
): EstimateInputV3 {
  if (!personalitySummary?.scores) {
    return input;
  }

  const scores = personalitySummary.scores;
  const flags = personalitySummary.flags || [];
  const updatedInput = { ...input };
  const updatedOptions = input.detailOptions ? { ...input.detailOptions } : {};

  // 안전 플래그 (영유아, 노인) → 욕실 안전 옵션 추가
  if (flags.includes('영유아') || flags.includes('노인')) {
    // 욕실 옵션이 없으면 기본값 생성
    if (!updatedOptions.욕실옵션) {
      updatedOptions.욕실옵션 = {};
    }
    // 안전 손잡이, 논슬립 타일 등은 detailOptions에 반영
    // (구체적인 옵션 필드는 detailOptions 구조에 따라 조정 필요)
  }

  // 조명 취향 높음 → 조명 공정 강제 활성화
  if (scores.lighting_preference >= 7) {
    updatedInput.includeLighting = true;
  }

  // 정리정돈 습관 높음 → 수납 옵션 강화
  if (scores.organization_habit >= 7) {
    // 붙박이장 타입을 더 고급으로 조정 가능
    // (현재는 closetType만 있으므로 추가 옵션 필요 시 확장)
  }

  return {
    ...updatedInput,
    detailOptions: updatedOptions,
  };
}

/** 전체 견적 계산 (비동기) */
export async function calculateFullEstimateV3(input: EstimateInputV3): Promise<FullEstimateV3> {
  // ✅ 성향 점수에 따라 입력값 조정
  const adjustedInput = applyPersonalityOptions(input, input.personalitySummary);
  
  // ✅ 성향 점수에 따라 등급 조정
  const adjustedGrade = adjustGradeByPersonality(
    adjustedInput.grade,
    adjustedInput.personalitySummary
  );
  
  const {
    py,
    grade: _originalGrade, // 원본 등급은 보관하되 사용하지 않음
    bathroomCount: inputBathroomCount, // ✅ 욕실 개수 (입력값)
    selectedSpaces,  // 선택된 공간 (없으면 전체)
    enabledProcessIds,  // ✅ 선택된 공정 (없으면 전체)
    detailOptions,  // ✅ 세부 옵션
    processSelections,  // ✅ 공간별 공정 선택 (process 페이지)
    isExtended = false,
    closetType = 'SWING',
    includeFoldingDoor = false,
    foldingDoorCount = 5,
    includeBidet = false,
    includeBathtub = false,
    includeDoorlock = true,
    includeLighting = false  // ✅ 기본값을 false로 변경: 고객이 선택하지 않으면 포함하지 않음
  } = adjustedInput;
  
  // ✅ 조정된 등급 사용
  const grade = adjustedGrade;
  
  const sizeRange = getSizeRange(py);
  const quantities = SIZE_QUANTITIES[sizeRange];
  
  // ✅ 폴백 근절: processSelections가 단일 진실 소스
  // processSelections가 없으면 이미 API에서 에러 처리됨
  // mode="FULL"일 때만 전체 시공 허용
  const isFullMode = (input as any).mode === 'FULL'
  
  // ✅ throw 제거 → FULL 모드로 자동 전환
  let finalIsFullMode = isFullMode;
  if (!processSelections && !isFullMode) {
    console.warn('⚠️ processSelections 없음 → FULL 모드로 자동 전환');
    finalIsFullMode = true;
  }

  // ✅ processSelections에서 실제 선택된 공정 추출 함수 (단일 진실 소스)
  const extractProcessesFromSelections = (): { 
    processIds: string[], 
    spaceIds: string[],
    hasWallFinish: boolean,
    hasFloorFinish: boolean,
    hasDoorFinish: boolean,
    hasWindowFinish: boolean,  // ✅ 창호(샤시) 별도 플래그 추가
    hasElectricLighting: boolean,
    hasKitchenCore: boolean,
    hasBathroomCore: boolean,
    hasEntranceCore: boolean,
    hasBalconyCore: boolean,
    hasFurniture: boolean,
    hasFilm: boolean
  } => {
    const processIds: string[] = [];
    const spaceIds: string[] = [];
    let hasWallFinish = false;
    let hasFloorFinish = false;
    let hasDoorFinish = false;
    let hasWindowFinish = false;  // ✅ 창호(샤시) 별도 플래그
    let hasElectricLighting = false;
    let hasKitchenCore = false;
    let hasBathroomCore = false;
    let hasEntranceCore = false;
    let hasBalconyCore = false;
    let hasFurniture = false;
    let hasFilm = false;
    
    if (processSelections) {
      Object.entries(processSelections).forEach(([spaceId, selections]) => {
        if (!selections) return;
        
        Object.entries(selections).forEach(([category, value]) => {
          if (value !== null && value !== 'none') {
            if (!spaceIds.includes(spaceId)) {
              spaceIds.push(spaceId);
            }
            
            // 카테고리별로 공정 추출
            if (category === 'wall_finish' && value) {
              hasWallFinish = true;
              if (!processIds.includes('finish')) processIds.push('finish');
            }
            if (category === 'floor_finish' && value) {
              hasFloorFinish = true;
              if (!processIds.includes('finish')) processIds.push('finish');
            }
            if (category === 'door_finish' && value) {
              hasDoorFinish = true;
              if (!processIds.includes('door')) processIds.push('door');  // ✅ door만 추가 (window 분리)
            }
            // ✅ 창호(샤시) 명시적 선택 확인
            if (category === 'window_finish' && value) {
              hasWindowFinish = true;
              if (!processIds.includes('window')) processIds.push('window');
            }
            if (category === 'electric_lighting' && value) {
              hasElectricLighting = true;
              if (!processIds.includes('electric')) processIds.push('electric');
            }
            if ((category === 'kitchen_core' || category === 'kitchen_countertop') && value) {
              hasKitchenCore = true;
              if (!processIds.includes('kitchen')) processIds.push('kitchen');
            }
            if (category === 'bathroom_core' && value) {
              hasBathroomCore = true;
              if (!processIds.includes('bathroom')) processIds.push('bathroom');
            }
            if (category === 'entrance_core' && value) {
              hasEntranceCore = true;
              if (!processIds.includes('entrance')) processIds.push('entrance');
            }
            if (category === 'balcony_core' && value) {
              hasBalconyCore = true;
              if (!processIds.includes('balcony')) processIds.push('balcony');
            }
            if (category === 'options') {
              // 옵션 배열 처리
              const opts = Array.isArray(value) ? value : [value];
              if (opts.includes('furniture') || opts.includes('builtin_closet')) {
                hasFurniture = true;
                if (!processIds.includes('furniture')) processIds.push('furniture');
              }
              if (opts.includes('film')) {
                hasFilm = true;
                if (!processIds.includes('film')) processIds.push('film');
              }
            }
          }
        });
      });
    }
    
    return { 
      processIds, spaceIds, 
      hasWallFinish, hasFloorFinish, hasDoorFinish, hasWindowFinish,  // ✅ 창호 플래그 추가
      hasElectricLighting,
      hasKitchenCore, hasBathroomCore, hasEntranceCore, hasBalconyCore,
      hasFurniture, hasFilm
    };
  };
  
  // ✅ 폴백 근절: processSelections가 단일 진실 소스
  // selectedSpaces는 UI 표시용으로만 사용, 계산에는 사용하지 않음
  let finalEnabledProcessIds: string[] = []
  let extractedData: ReturnType<typeof extractProcessesFromSelections>
  
  if (finalIsFullMode) {
    // mode="FULL" 명시적 선택: 전체 시공
    finalEnabledProcessIds = []
    extractedData = {
      processIds: [],
      spaceIds: [],
      hasWallFinish: false,
      hasFloorFinish: false,
      hasDoorFinish: false,
      hasWindowFinish: false,
      hasElectricLighting: false,
      hasKitchenCore: false,
      hasBathroomCore: false,
      hasEntranceCore: false,
      hasBalconyCore: false,
      hasFurniture: false,
      hasFilm: false
    }
    console.log('✅ mode="FULL": 전체 시공 모드')
  } else if (processSelections && Object.keys(processSelections).length > 0) {
    // processSelections에서 공정 추출 (단일 진실 소스)
    extractedData = extractProcessesFromSelections()
    finalEnabledProcessIds = extractedData.processIds
    console.log('✅ processSelections에서 공정 추출:', finalEnabledProcessIds)
  } else {
    // ✅ processSelections가 없으면 FULL 모드로 자동 전환 (throw 제거)
    console.warn('⚠️ processSelections가 비어있음 → FULL 모드로 자동 전환')
    finalEnabledProcessIds = []
    extractedData = {
      processIds: [],
      spaceIds: [],
      hasWallFinish: false,
      hasFloorFinish: false,
      hasDoorFinish: false,
      hasWindowFinish: false,
      hasElectricLighting: false,
      hasKitchenCore: false,
      hasBathroomCore: false,
      hasEntranceCore: false,
      hasBalconyCore: false,
      hasFurniture: false,
      hasFilm: false
    }
    finalIsFullMode = true
  }
  
  // ✅ 폴백 근절: hasAllProcesses 제거, mode="FULL"일 때만 전체 계산
  const hasAllProcesses = finalIsFullMode
  
  // ✅ 폴백 근절: selectedSpaces는 UI 표시용으로만 사용, 계산에는 extractedData.spaceIds만 사용
  // hasAllSpaces는 mode="FULL"일 때만 true
  const hasAllSpaces = finalIsFullMode
  const hasLiving = hasAllSpaces || extractedData.spaceIds.includes('living')
  const hasKitchen = hasAllSpaces || extractedData.spaceIds.includes('kitchen')
  const hasBathroom = hasAllSpaces || extractedData.spaceIds.includes('bathroom') || extractedData.spaceIds.includes('masterBathroom') || extractedData.spaceIds.includes('commonBathroom')
  
  // ✅ 안방/일반방 분리: 원본 spaceId로 정확히 구분
  const hasMasterBedroom = extractedData.spaceIds.includes('masterBedroom');
  // ✅ 일반 방: room1, room2, room3, room4, room5만 (안방 제외)
  // selectedSpaces는 'room'으로 변환되어 있으므로, extractedData.spaceIds로만 판단
  const hasOtherRooms = hasAllSpaces || extractedData.spaceIds.some(id => 
    id === 'room1' || id === 'room2' || id === 'room3' || id === 'room4' || id === 'room5'
  );
  // ✅ 거실이 선택되었는지 확인 (selectedSpaces에서 'living' 또는 extractedData에서 'living')
  const hasLivingSelected = hasAllSpaces || hasLiving;
  const hasRoom = hasAllSpaces || hasMasterBedroom || hasOtherRooms;
  const hasEntrance = hasAllSpaces || extractedData.spaceIds.includes('entrance')
  // ✅ 발코니: 정확한 spaceId 매칭 (대소문자 구분)
  const hasBalcony = hasAllSpaces || extractedData.spaceIds.includes('balcony')
  const hasStorage = hasAllSpaces || extractedData.spaceIds.includes('dressRoom')
  
  // ✅ 욕실 선택 여부 구분 (안방욕실/공용욕실/단일욕실)
  const hasMasterBathroomSelected = extractedData.spaceIds.includes('masterBathroom');
  const hasCommonBathroomSelected = extractedData.spaceIds.includes('commonBathroom');
  const hasSingleBathroomSelected = extractedData.spaceIds.includes('bathroom');
  
  console.log('🎯 공정 활성화 판단:', { hasAllProcesses, finalEnabledProcessIds, selectedSpaces });
  console.log('🏠 공간 선택 상태:', { hasAllSpaces, hasLiving, hasKitchen, hasBathroom, hasMasterBedroom, hasOtherRooms, hasRoom, hasEntrance, hasBalcony, hasStorage });
  
  // ========================================
  // ✅ 공정별 활성화 여부 (엄격한 로직)
  // 규칙: 선택된 공간이 있으면 해당 공간 관련 공정만 활성화
  // ========================================
  
  // ✅ 안방만 선택되었는지 확인: extractedData.spaceIds에 안방만 있고 거실/일반방이 없으면 안방만 선택
  // 안방욕실(masterBathroom)이 함께 선택되어도 안방만 선택으로 간주
  const onlyMasterBedroomSelected = hasMasterBedroom && !hasLiving && !hasOtherRooms && 
    (extractedData.spaceIds.length === 1 || 
     (extractedData.spaceIds.length === 2 && extractedData.spaceIds.includes('masterBathroom')));
  
  // ✅ 안방 마감 공정 확인: 안방에서 마감 공정이 선택되었는지
  const hasMasterBedroomFinish = hasMasterBedroom && (
    extractedData.spaceIds.includes('masterBedroom') && 
    (extractedData.hasWallFinish || extractedData.hasFloorFinish || finalEnabledProcessIds.includes('finish'))
  );
  
  // ✅ 마감 공정: 거실 또는 일반 방이 선택되었을 때만 (안방만 선택하면 거실/복도 마감 제외)
  // 단, 안방의 마감 공정은 별도로 처리 (hasMasterBedroomFinish)
  const hasFinish = hasAllProcesses || (
    !onlyMasterBedroomSelected && // ✅ 안방만 선택되었으면 거실/복도 마감 제외
    (hasLiving || hasOtherRooms) && (
      finalEnabledProcessIds.includes('finish') || 
      extractedData.hasWallFinish || 
      extractedData.hasFloorFinish
    )
  );
  
  // 주방 공정: 주방이 선택되었을 때만
  const hasKitchenProcess = hasAllProcesses || (
    hasKitchen && (
      finalEnabledProcessIds.includes('kitchen') || 
      extractedData.hasKitchenCore
    )
  );
  
  // 욕실 공정: 욕실이 선택되었을 때만
  const hasBathroomProcess = hasAllProcesses || (
    hasBathroom && (
      finalEnabledProcessIds.includes('bathroom') || 
      extractedData.hasBathroomCore
    )
  );
  
  // 전기/조명 공정: 고객이 명시적으로 선택한 경우에만 포함
  // ✅ 수정: 공간이 선택되었다고 자동 포함하지 않음, processSelections에서 electric_lighting이 선택되었을 때만
  const hasElectric = hasAllProcesses || (
    finalEnabledProcessIds.includes('electric') || 
    extractedData.hasElectricLighting
  );
  
  // ✅ 도어(방문) 공정: 거실 또는 일반 방이 선택되었을 때만 (안방도 포함)
  // 안방에서 도어 공정이 선택되었는지 확인
  const hasMasterBedroomDoor = hasMasterBedroom && extractedData.hasDoorFinish;
  const hasDoor = hasAllProcesses || (
    (hasLiving || hasOtherRooms || hasMasterBedroomDoor) && (
      finalEnabledProcessIds.includes('door_window') || 
      finalEnabledProcessIds.includes('door') || 
      extractedData.hasDoorFinish
    )
  );
  
  // ✅ 창호(샤시) 공정: 명시적으로 선택했을 때만 (비용이 크므로 분리)
  const hasWindow = hasAllProcesses || (
    finalEnabledProcessIds.includes('window') ||
    extractedData.hasWindowFinish
  );
  
  // ✅ 수납/가구 공정: 일반 방/드레스룸이 선택되었을 때만 (안방도 포함)
  // 안방에서 가구 공정이 선택되었는지 확인
  const hasMasterBedroomFurniture = hasMasterBedroom && extractedData.hasFurniture;
  const hasStorageProcess = hasAllProcesses || (
    (hasOtherRooms || hasStorage || hasMasterBedroomFurniture) && (
      finalEnabledProcessIds.includes('furniture') || 
      finalEnabledProcessIds.includes('storage') || 
      extractedData.hasFurniture
    )
  );
  
  // 발코니 공정: 발코니가 선택되었을 때만
  const hasBalconyProcess = hasAllProcesses || (
    hasBalcony && (
      finalEnabledProcessIds.includes('balcony') || 
      extractedData.hasBalconyCore
    )
  );
  
  // 현관 공정: 현관이 선택되었을 때만
  const hasEntranceProcess = hasAllProcesses || (
    hasEntrance && (
      finalEnabledProcessIds.includes('entrance') || 
      extractedData.hasEntranceCore
    )
  );
  
  // ✅ 필름 공정: 거실 또는 일반 방이 선택되었을 때만 (안방만 선택하면 필름 제외)
  const hasFilmProcess = hasAllProcesses || (
    !onlyMasterBedroomSelected && // ✅ 안방만 선택되었으면 필름 제외
    (hasLiving || hasOtherRooms) && (
      finalEnabledProcessIds.includes('film') || 
      extractedData.hasFilm
    )
  );
  
  // ✅ 세부 공정 확인 (바닥재/도배 분리)
  const hasWallFinishOnly = extractedData.hasWallFinish && !extractedData.hasFloorFinish;
  const hasFloorFinishOnly = extractedData.hasFloorFinish;
  
  // ✅ 바닥재 교체 여부 확인 (도배만 하면 철거 불필요)
  const livingFloorType = detailOptions?.거실옵션?.바닥재종류;
  const roomFloorType = detailOptions?.방옵션?.바닥재종류;
  // processSelections에서 floor_finish가 선택되었거나 detailOptions에서 바닥재 선택
  const needsFloorDemolition = hasFloorFinishOnly || 
    ((hasLiving || hasRoom) && hasFinish && (livingFloorType || roomFloorType) && 
     livingFloorType !== '없음' && roomFloorType !== '없음');
  
  // ✅ 세부옵션에서 비데/욕조 확인
  const finalIncludeBidet = includeBidet || detailOptions?.욕실옵션?.비데 || false;
  const finalIncludeBathtub = includeBathtub || detailOptions?.욕실옵션?.욕조 || false;
  
  // ✅ 폴딩도어 확인 (세부옵션 또는 발코니 공정에서)
  const finalIncludeFoldingDoor = includeFoldingDoor || hasBalconyProcess;
  
  // ✅ 도어락 확인
  const finalIncludeDoorlock = includeDoorlock || hasDoor;
  
  // ✅ 조명 확인
  const finalIncludeLighting = includeLighting || hasElectric;
  
  // ✅ 평수별 철거 비율 조정
  const getDemolitionRate = (pyeong: number): number => {
    if (pyeong <= 20) return 1.0;     // 100%
    if (pyeong <= 30) return 0.95;    // 95%
    if (pyeong <= 40) return 0.90;    // 90%
    if (pyeong <= 50) return 0.85;    // 85%
    return 0.80;                       // 80%
  };
  
  const demolitionRate = getDemolitionRate(py);
  
  console.log('🏠 선택된 공간:', { 
    selectedSpaces, 
    extractedSpaces: extractedData.spaceIds,
    hasLiving, hasKitchen, hasBathroom, hasRoom, hasEntrance, hasStorage, hasBalcony
  });
  console.log('🔧 선택된 공정:', { 
    enabledProcessIds,
    finalEnabledProcessIds,
    extractedProcesses: extractedData,
    hasAllProcesses, hasFinish, hasKitchenProcess, hasBathroomProcess, hasElectric, 
    hasDoor, hasWindow,  // ✅ 도어/창호 분리 로그
    hasStorageProcess,
    hasWallFinishOnly, hasFloorFinishOnly, needsFloorDemolition
  });
  console.log('📦 세부옵션:', detailOptions);
  console.log('📊 공간별 공정 선택:', processSelections);
  
  // 등급명
  const gradeNames: Record<Grade, string> = {
    BASIC: '실속형',
    STANDARD: '표준형',
    ARGEN: '아르젠',
    PREMIUM: '프리미엄'
  };
  
  // 각 공정별 견적 계산
  const wallpaper = calculateWallpaperEstimate(grade, sizeRange, py, isExtended);
  const flooring = calculateFlooringEstimate(grade, sizeRange, py);
  const film = calculateFilmEstimate(grade, sizeRange, py);
  const molding = calculateMoldingEstimate(grade, sizeRange, py);
  const kitchen = calculateKitchenEstimate(grade, sizeRange, py, true);
  const furniture = calculateFurnitureEstimate(grade, sizeRange, py, closetType);
  const window = calculateWindowEstimate(grade, sizeRange, py);
  const door = calculateDoorEstimate(grade, sizeRange, py, includeFoldingDoor, foldingDoorCount);
  const tile = await calculateTileEstimate(grade, sizeRange, py);
  const bathroom = calculateBathroomSetEstimate(grade, {
    includeBidet,
    includeBathtub
  });
  const protection = calculateProtectionEstimate(sizeRange, py);
  const common = calculateCommonEstimate(sizeRange, py);
  
  // 조명 (옵션) - ✅ 전기 공정 반영
  const lighting = finalIncludeLighting 
    ? calculateLightingEstimate(sizeRange, py, 'ARGEN', 'ARGEN')
    : null;
  
  // 도어락 비용 (ARGEN 등급 기준 380,000원)
  const doorlockCost = includeDoorlock ? 380000 : 0;
  
  // =========================================================
  // 공간별 견적 구성
  // =========================================================
  
  // ✅ 철거/보양/청소 비용 계산 (공정 선택에 따라) - DB 통합 버전
  const calculateCommonCosts = async () => {
    let demolitionCost = 0;
    let demolitionNote = '';
    const demolitionItems: Array<{ name: string; cost: number; includes?: string | null }> = [];
    let protectionCost = 0;
    let elevatorCost = 0;
    let cleaningCost = 0;
    let cleaningArea = py;
    let wasteTon = 0;
    let wasteCost = 0;
    let laborCost = 0;
    
    if (hasAllProcesses) {
      // ✅ 전체 공정: DB에서 패키지 조회 후 폐기물/인건비 분리
      const { calculateFullDemolitionBreakdown } = await import('@/lib/data/pricing-v3/demolition-packages');
      const breakdown = await calculateFullDemolitionBreakdown(
        py, 
        'apartment',
        true, // hasElevator
        5     // hallwaySheets
      );
      
      demolitionCost = breakdown.packagePrice;
      wasteTon = breakdown.wasteTon;
      wasteCost = breakdown.wasteCost;
      laborCost = breakdown.laborCost;
      protectionCost = breakdown.protectionCost;
      elevatorCost = breakdown.elevatorCost;
      
      demolitionNote = `전체 철거 패키지 (바닥+천장+욕실+주방+가구+문 포함)`;
      cleaningCost = common.cleaningCost;
    } else {
      // ✅ 부분 공정: DB에서 항목별 조회
      const {
        getBathroomItemByPyeong,
        getKitchenItemByPyeong,
        getDemolitionItemsByCategory,
        getWasteConfigFromDB,
        calculateProtectionCostFromDB
      } = await import('@/lib/db/adapters/demolition-adapter');
      
      // 1️⃣ 욕실: DB에서 조회
      if (hasBathroomProcess) {
        const bathroomItem = await getBathroomItemByPyeong(py);
        if (bathroomItem) {
          demolitionItems.push({
            name: bathroomItem.item_name,
            cost: bathroomItem.unit_price,
            includes: bathroomItem.includes // DB 항목의 includes 정보 저장
          });
          demolitionCost += bathroomItem.unit_price;
        } else {
          // Fallback: 하드코딩 값
          const bathroomDemolition = Math.round(py * 0.15 * 160000 * 0.5);
          demolitionItems.push({
            name: '욕실 전체 철거',
            cost: bathroomDemolition
          });
          demolitionCost += bathroomDemolition;
        }
      }
      
      // 2️⃣ 주방: DB에서 조회
      if (hasKitchenProcess) {
        const kitchenItem = await getKitchenItemByPyeong(py);
        if (kitchenItem) {
          demolitionItems.push({
            name: kitchenItem.item_name,
            cost: kitchenItem.unit_price,
            includes: kitchenItem.includes // DB 항목의 includes 정보 저장
          });
          demolitionCost += kitchenItem.unit_price;
        }
        // 주방은 싱크대 철거비가 설치비에 포함되어 있음 (별도 철거비 없음)
      }
      
      // 3️⃣ 바닥재: DB에서 조회
      if (hasFinish && needsFloorDemolition) {
        const floorItems = await getDemolitionItemsByCategory('DEM-FLOOR', py);
        const floorPackage = floorItems.find(item => item.is_package && item.pyeong_min && item.pyeong_max && py >= item.pyeong_min && py <= item.pyeong_max);
        if (floorPackage) {
          demolitionItems.push({
            name: floorPackage.item_name,
            cost: floorPackage.unit_price,
            includes: floorPackage.includes // DB 항목의 includes 정보 저장
          });
          demolitionCost += floorPackage.unit_price;
        } else {
          // Fallback: 하드코딩 값
          const floorDemolition = Math.round(py * 0.3 * 160000 * 0.25);
          demolitionItems.push({
            name: '바닥재 철거',
            cost: floorDemolition
          });
          demolitionCost += floorDemolition;
        }
      }
      
      // 4️⃣ 천장: DB에서 조회 (필요시)
      // 현재는 천장만 단독으로 철거하는 경우가 거의 없으므로 생략
      
      // 5️⃣ 베란다: 기존 마감재 철거 필요 (DB 항목 없음, 하드코딩)
      if (hasBalconyProcess && hasBalcony) {
        const balconyDemolition = Math.round(py * 0.08 * 160000 * 0.3);
        demolitionItems.push({
          name: '베란다 철거',
          cost: balconyDemolition
        });
        demolitionCost += balconyDemolition;
      }
      
      // 6️⃣ 현관: 타일 교체 시 철거 필요 (DB 항목 없음, 하드코딩)
      if (hasEntranceProcess && hasEntrance) {
        const entranceDemolition = Math.round(py * 0.05 * 160000 * 0.3);
        demolitionItems.push({
          name: '현관 타일 철거',
          cost: entranceDemolition
        });
        demolitionCost += entranceDemolition;
      }
      
      // 7️⃣ 가구: 붙박이장 철거+설치가 공사비에 포함 (별도 철거비 없음)
      
      // 철거 항목 정리
      if (demolitionItems.length > 0) {
        demolitionNote = demolitionItems.map(item => item.name).join(' + ') + ' 철거';
      }
      
      // ✅ 폐기물 비용 계산: 현장 단위로 1회만 계산
      // 철거 공정이 1개 이상 존재하면 폐기물 비용은 1회만 추가
      // 부분 철거/전체 철거 구분 없이 철거가 있으면 폐기물 비용 포함
      if (demolitionItems.length > 0) {
        const wasteConfig = await getWasteConfigFromDB(py);
        // 폐기물 톤수는 평형 기준으로 계산 (공정 개수와 무관하게 1회만)
        wasteTon = wasteConfig ? wasteConfig.max_ton : Math.ceil(py * 0.04 * 10) / 10;
        wasteCost = wasteTon * (wasteConfig ? wasteConfig.price_per_ton : 500000);
        // 폐기물 비용은 demolitionCost에 포함하지 않고 별도 관리
        // (표시 시 별도 항목으로 표시하기 위함)
      }
      
      // 보양: 철거 공정이 있을 때만 (DB 조회)
      if (demolitionCost > 0) {
        const protection = await calculateProtectionCostFromDB(true, 5);
        protectionCost = protection.items.find(i => i.name.includes('복도'))?.cost || 0;
        elevatorCost = protection.items.find(i => i.name.includes('엘리베이터'))?.cost || 0;
      }
      
      // ✅ 청소 면적: 고객이 입력한 평수로 무조건 계산 (선택된 공간 비율 무시)
      cleaningArea = py;  // 고객 입력 평수 그대로 사용
      cleaningCost = cleaningArea * 20000;  // 평당 2만원
    }
    
    // 철거가 없으면 보양도 필요 없음
    if (demolitionCost === 0) {
      protectionCost = 0;
      elevatorCost = 0;
    }
    
    console.log('🔨 철거 계산:', { 
      hasAllProcesses, 
      hasBathroomProcess, 
      hasBalconyProcess,
      hasEntranceProcess,
      needsFloorDemolition,
      demolitionItems,
      demolitionCost,
      wasteTon,
      wasteCost,
      laborCost
    });
    
    return { 
      demolitionCost, 
      demolitionNote, 
      protectionCost, 
      elevatorCost, 
      cleaningCost, 
      cleaningArea,
      demolitionItems,
      wasteTon,
      wasteCost,
      laborCost
    };
  };
  
  const commonCosts = await calculateCommonCosts();
  
  // 1. 공통 공사 (조건부 항목)
  const commonItems: ProcessItem[] = [];
  
  // 철거 항목 표시 (개선)
  // ✅ Phase 2: 철거 공정은 LOCK 상태로 표시
  if (commonCosts.demolitionCost > 0) {
    if (hasAllProcesses) {
      // ✅ 전체 철거: 패키지 가격 + 폐기물 + 인건비 분리 표시
      // 1. 전체 철거 패키지 (노무비로 표시) - LOCK 상태
      commonItems.push({
        name: '전체 철거',
        quantity: '1식',
        materialCost: 0,
        laborCost: commonCosts.laborCost,
        totalCost: commonCosts.laborCost,
        note: '바닥+천장+욕실+주방+가구+문 철거',
        isLocked: true,
        lockReason: '이 공정은 공사 후 변경이 어렵습니다',
        canOverride: false
      });
      
      // 2. 폐기물 처리
      commonItems.push({
        name: '폐기물 처리',
        quantity: `${commonCosts.wasteTon.toFixed(1)}톤`,
        materialCost: 0,
        laborCost: commonCosts.wasteCost,
        totalCost: commonCosts.wasteCost,
        note: '예상 톤수 (초과 시 실비 정산)'
      });
    } else {
      // ✅ 부분 철거: 필요한 항목만 상세 표시
      // 각 철거 항목 표시 (폐기물 비용은 별도 항목으로 표시)
      // ✅ Phase 2: 철거 항목은 모두 LOCK 상태
      commonCosts.demolitionItems.forEach((item) => {
        commonItems.push({
          name: item.name,
          quantity: '1식',
          materialCost: 0,
          laborCost: item.cost,
          totalCost: item.cost,
          note: undefined,
          isLocked: true,
          lockReason: '이 공정은 공사 후 변경이 어렵습니다',
          canOverride: false
        });
      });
      
      // ✅ 폐기물 처리: 현장 단위로 1회만 표시
      // 철거 공정이 1개 이상이면 폐기물 비용은 항상 1회만 표시
      if (commonCosts.demolitionItems.length > 0 && commonCosts.wasteCost > 0) {
        commonItems.push({
          name: '폐기물 처리',
          quantity: `${commonCosts.wasteTon.toFixed(1)}톤`,
          materialCost: 0,
          laborCost: commonCosts.wasteCost,
          totalCost: commonCosts.wasteCost,
          note: '예상 톤수 (초과 시 실비 정산)'
        });
      }
    }
  }
  
  // 보양 (철거가 있는 경우만)
  if (commonCosts.protectionCost > 0) {
    commonItems.push({
      name: '보양',
      quantity: hasAllProcesses 
        ? `플로베니아 ${protection.floventCount}장 + 텐텐지 ${protection.tentenCount}롤`
        : '부분 보양',
      materialCost: commonCosts.protectionCost,
      laborCost: 0,
      totalCost: commonCosts.protectionCost
    });
  }
  
  // 엘리베이터 보양 (철거가 있는 경우만)
  if (commonCosts.elevatorCost > 0) {
    commonItems.push({
      name: '엘리베이터 보양',
      quantity: '1대',
      materialCost: commonCosts.elevatorCost,
      laborCost: 0,
      totalCost: commonCosts.elevatorCost
    });
  }
  
  // 입주청소 (항상 포함)
  commonItems.push({
    name: '입주청소',
    quantity: `${commonCosts.cleaningArea}평`,
    materialCost: 0,
    laborCost: commonCosts.cleaningCost,
    totalCost: commonCosts.cleaningCost,
    note: `준공정밀청소 (평당 20,000원)`
  });
  
  const commonSpace: SpaceEstimate = {
    spaceName: '공통 공사',
    items: commonItems,
    subtotal: commonCosts.demolitionCost + commonCosts.protectionCost + commonCosts.elevatorCost + commonCosts.cleaningCost
  };
  
  // ✅ 안방 마감 공정 계산 (안방만 선택되었을 때)
  const masterBedroomArea = Math.round(py * 0.15); // 안방 면적 (전체의 15%)
  const masterBedroomWallpaper = hasMasterBedroomFinish && extractedData.hasWallFinish
    ? calculateWallpaperEstimate(grade, sizeRange, masterBedroomArea, isExtended)
    : null;
  const masterBedroomFlooring = hasMasterBedroomFinish && extractedData.hasFloorFinish
    ? calculateFlooringEstimate(grade, sizeRange, masterBedroomArea)
    : null;
  
  // 2. 거실/복도
  const livingSpace: SpaceEstimate = {
    spaceName: '거실/복도',
    items: [
      {
        name: '도배',
        quantity: `${wallpaper.rolls}롤`,
        materialCost: wallpaper.materialCost,
        laborCost: wallpaper.laborCost,
        totalCost: wallpaper.totalCost,
        brands: wallpaper.brands.map(b => `${b.name} ${b.product}`)
      },
      {
        name: '바닥',
        quantity: `${flooring.area}평`,
        materialCost: flooring.materialCost,
        laborCost: flooring.laborCost,
        totalCost: flooring.totalCost,
        brands: flooring.brands.map(b => `${b.name} ${b.product}`)
      },
      {
        name: '방문',
        quantity: `${door.doorCount}세트`,
        materialCost: door.doorCost,
        laborCost: 0,  // 목공비에 포함
        totalCost: door.doorCost,
        brands: door.doorBrands.map(b => `${b.name} ${b.product}`)
      },
      {
        name: '중문',
        quantity: '1식',
        materialCost: door.middleDoorCost,
        laborCost: 0,  // 포함
        totalCost: door.middleDoorCost,
        brands: door.middleDoorBrands.map(b => `${b.name} ${b.product}`)
      },
      {
        name: '몰딩/걸레받이',
        quantity: `${molding.length}m`,
        materialCost: molding.totalCost,
        laborCost: 0,  // 시공비 포함
        totalCost: molding.totalCost,
        brands: molding.brands.map(b => `${b.name} ${b.product}`)
      }
    ],
    subtotal: wallpaper.totalCost + flooring.totalCost + door.doorCost + 
              door.middleDoorCost + molding.totalCost
  };
  
  // 폴딩도어 추가 (옵션) - ✅ 세부옵션/발코니 공정 반영
  if (finalIncludeFoldingDoor && door.foldingDoorCost > 0) {
    livingSpace.items.push({
      name: '폴딩도어',
      quantity: `${door.foldingDoorCount}짝`,
      materialCost: door.foldingDoorCost,
      laborCost: 0,
      totalCost: door.foldingDoorCost,
      brands: door.foldingDoorBrands.map(b => `${b.name} ${b.product}`)
    });
    livingSpace.subtotal += door.foldingDoorCost;
  }
  
  // 도어락 추가 (옵션) - ✅ 도어 공정 반영
  if (finalIncludeDoorlock && hasDoor) {
    livingSpace.items.push({
      name: '도어락',
      quantity: '1개',
      materialCost: doorlockCost,
      laborCost: 0,  // 설치비 포함
      totalCost: doorlockCost,
      brands: ['직방 푸시풀'],
      note: '⭐ 아르젠 추천'
    });
    livingSpace.subtotal += doorlockCost;
  }
  
  // 3. 주방
  const kitchenSpace: SpaceEstimate = {
    spaceName: '주방',
    items: [
      {
        name: grade === 'ARGEN' ? '싱크대 (🔧아르젠 제작)' : '싱크대',
        quantity: `${kitchen.ja}자`,
        materialCost: kitchen.materialCost,
        laborCost: kitchen.installLabor,
        totalCost: kitchen.materialCost + kitchen.installLabor,
        brands: [kitchen.spec.brand],
        note: grade === 'ARGEN' 
          ? '블룸 경첩 + LX 오로라 상판' 
          : `${kitchen.spec.door} + ${kitchen.spec.countertop}`
      },
      {
        name: '주방 타일',
        quantity: `${tile.kitchenArea}m²`,
        materialCost: tile.kitchenMaterialCost,
        laborCost: tile.kitchenLaborCost,
        totalCost: tile.kitchenTotalCost,
        brands: tile.brands.map(b => `${b.name} ${b.product}`)
      }
    ],
    subtotal: kitchen.totalCost + tile.kitchenTotalCost
  };
  
  // 3-2. 보조주방 (30평 이상 + 옵션 선택 시) - ✅ 추가
  const hasSubKitchen = py >= 30 && detailOptions?.보조주방사용 === true;
  let subKitchenSpace: SpaceEstimate | undefined;
  
  if (hasSubKitchen) {
    // 보조주방은 메인 주방의 약 60% 규모로 계산
    const subKitchenRatio = 0.6;
    const subKitchenJa = Math.max(Math.round(kitchen.ja * subKitchenRatio), 4); // 최소 4자
    
    subKitchenSpace = {
      spaceName: '🥗 보조 주방 (팬트리)',
      items: [
        {
          name: grade === 'ARGEN' ? '싱크대 (🔧아르젠 제작)' : '싱크대',
          quantity: `${subKitchenJa}자`,
          materialCost: Math.round(kitchen.materialCost * subKitchenRatio),
          laborCost: Math.round(kitchen.installLabor * subKitchenRatio),
          totalCost: Math.round((kitchen.materialCost + kitchen.installLabor) * subKitchenRatio),
          brands: [kitchen.spec.brand],
          note: '보조주방 (간이 설비)'
        },
        {
          name: '보조주방 타일',
          quantity: `${Math.round(tile.kitchenArea * subKitchenRatio)}m²`,
          materialCost: Math.round(tile.kitchenMaterialCost * subKitchenRatio),
          laborCost: Math.round(tile.kitchenLaborCost * subKitchenRatio),
          totalCost: Math.round(tile.kitchenTotalCost * subKitchenRatio),
          brands: tile.brands.map(b => `${b.name} ${b.product}`)
        }
      ],
      subtotal: Math.round((kitchen.totalCost + tile.kitchenTotalCost) * subKitchenRatio)
    };
  }
  
  // 4. 욕실 - ✅ 개수에 따라 분리 (안방욕실/공용욕실)
  const bathroomCount = inputBathroomCount || quantities.bathroomCount;
  const hasTwoBathrooms = bathroomCount >= 2;
  
  // 욕실별 옵션 가져오기
  const masterBathroomOptions = detailOptions?.안방욕실옵션 || detailOptions?.욕실옵션;
  const commonBathroomOptions = detailOptions?.공용욕실옵션 || detailOptions?.욕실옵션;
  const singleBathroomOptions = detailOptions?.욕실옵션;
  
  // 안방욕실 비데/욕조 옵션
  const masterIncludeBidet = hasTwoBathrooms 
    ? (masterBathroomOptions?.비데 ?? finalIncludeBidet)
    : finalIncludeBidet;
  const masterIncludeBathtub = hasTwoBathrooms 
    ? (masterBathroomOptions?.욕조 ?? finalIncludeBathtub)
    : finalIncludeBathtub;
  
  // 공용욕실 비데/욕조 옵션
  const commonIncludeBidet = hasTwoBathrooms 
    ? (commonBathroomOptions?.비데 ?? finalIncludeBidet)
    : finalIncludeBidet;
  const commonIncludeBathtub = hasTwoBathrooms 
    ? (commonBathroomOptions?.욕조 ?? false) // 공용욕실은 기본 욕조 없음
    : finalIncludeBathtub;
  
  // 단일 욕실용 견적 생성 함수
  const createSingleBathroomEstimate = (
    name: string, 
    includeBidet: boolean, 
    includeBathtub: boolean,
    tileAreaRatio: number = 1  // 타일 면적 비율 (안방/공용 분리 시)
  ): SpaceEstimate => {
    const space: SpaceEstimate = {
      spaceName: name,
      items: [
        {
          name: '타일',
          quantity: `${Math.round(tile.bathroomArea * tileAreaRatio)}m²`,
          materialCost: Math.round(tile.bathroomMaterialCost * tileAreaRatio),
          laborCost: Math.round(tile.bathroomLaborCost * tileAreaRatio),
          totalCost: Math.round(tile.bathroomTotalCost * tileAreaRatio),
          brands: tile.brands.map(b => `${b.name} ${b.product}`)
        },
        {
          name: '양변기',
          quantity: '1개',
          materialCost: bathroom.toilet.price,
          laborCost: 0,
          totalCost: bathroom.toilet.price,
          brands: bathroom.toilet.brands
        },
        {
          name: '세면대',
          quantity: '1개',
          materialCost: bathroom.basin.price,
          laborCost: 0,
          totalCost: bathroom.basin.price,
          brands: bathroom.basin.brands
        },
        {
          name: '수전',
          quantity: '1세트',
          materialCost: bathroom.faucet.price,
          laborCost: 0,
          totalCost: bathroom.faucet.price,
          brands: bathroom.faucet.brands
        },
        {
          name: grade === 'ARGEN' ? '욕실장 (🔧아르젠 제작)' : '욕실장',
          quantity: '1개',
          materialCost: bathroom.cabinet.price,
          laborCost: 0,
          totalCost: bathroom.cabinet.price,
          brands: bathroom.cabinet.brands,
          note: grade === 'ARGEN' ? 'LED 간접조명 포함' : bathroom.cabinet.type
        },
        {
          name: '액세서리',
          quantity: '1세트',
          materialCost: bathroom.accessory.price,
          laborCost: 0,
          totalCost: bathroom.accessory.price,
          brands: bathroom.accessory.brands
        }
      ],
      subtotal: Math.round(tile.bathroomTotalCost * tileAreaRatio) + bathroom.setTotal
    };
    
    // 비데 추가 (옵션)
    if (includeBidet && bathroom.bidet) {
      space.items.push({
        name: '비데',
        quantity: '1개',
        materialCost: bathroom.bidet.price,
        laborCost: 0,
        totalCost: bathroom.bidet.price,
        brands: bathroom.bidet.brands
      });
      space.subtotal += bathroom.bidet.price;
    }
    
    // 욕조 추가 (옵션)
    if (includeBathtub && bathroom.bathtub) {
      space.items.push({
        name: '욕조',
        quantity: '1개',
        materialCost: bathroom.bathtub.price,
        laborCost: 0,
        totalCost: bathroom.bathtub.price,
        brands: bathroom.bathtub.brands
      });
      space.subtotal += bathroom.bathtub.price;
    }
    
    return space;
  };
  
  // ✅ 욕실 견적 생성 (개수에 따라 분리, 선택된 욕실만)
  let bathroomSpace: SpaceEstimate;
  let masterBathroomSpace: SpaceEstimate | undefined;
  let commonBathroomSpace: SpaceEstimate | undefined;
  
  if (hasTwoBathrooms) {
    // 2개 이상: 선택된 욕실만 생성
    if (hasMasterBathroomSelected) {
      masterBathroomSpace = createSingleBathroomEstimate(
        '🛁 안방 욕실', 
        masterIncludeBidet, 
        masterIncludeBathtub,
        0.55  // 안방욕실이 보통 더 큼 (55%)
      );
    }
    
    if (hasCommonBathroomSelected) {
      commonBathroomSpace = createSingleBathroomEstimate(
        '🚿 공용 욕실', 
        commonIncludeBidet, 
        commonIncludeBathtub,
        0.45  // 공용욕실 (45%)
      );
    }
    
    // 기존 bathroomSpace는 빈 값으로 (호환성 유지)
    bathroomSpace = {
      spaceName: '욕실 (분리 견적)',
      items: [],
      subtotal: 0
    };
  } else if (hasSingleBathroomSelected) {
    // 1개: 단일 욕실 선택된 경우
    bathroomSpace = createSingleBathroomEstimate(
      '욕실',
      finalIncludeBidet,
      finalIncludeBathtub,
      1  // 전체 면적
    );
  } else {
    // 선택되지 않은 경우 빈 견적
    bathroomSpace = {
      spaceName: '욕실 (미선택)',
      items: [],
      subtotal: 0
    };
  }
  
  // 현관 타일 항목 생성
  const entranceTileItem: ProcessItem = {
    name: '현관 타일',
    quantity: `${tile.entranceArea}m²`,
    materialCost: tile.entranceMaterialCost,
    laborCost: tile.entranceLaborCost,
    totalCost: tile.entranceTotalCost,
    brands: tile.brands.map(b => `${b.name} ${b.product}`)
  };
  
  // ✅ 현관 공간 견적 생성 (현관 공정이 활성화된 경우)
  let entranceSpace: SpaceEstimate | undefined;
  if (hasEntranceProcess) {
    entranceSpace = {
      spaceName: '현관',
      items: [entranceTileItem],
      subtotal: tile.entranceTotalCost
    };
  } else {
    // 현관 공정이 없으면 기존 방식대로 욕실에 포함 (호환성 유지)
    if (hasTwoBathrooms && hasCommonBathroomSelected && commonBathroomSpace) {
      commonBathroomSpace.items.push(entranceTileItem);
      commonBathroomSpace.subtotal += tile.entranceTotalCost;
    } else if (hasSingleBathroomSelected && bathroomSpace && bathroomSpace.items.length > 0) {
      bathroomSpace.items.push(entranceTileItem);
      bathroomSpace.subtotal += tile.entranceTotalCost;
    }
  }
  
  // 5. 수납/가구
  const storageSpace: SpaceEstimate = {
    spaceName: '수납/가구',
    items: [
      {
        name: grade === 'ARGEN' ? '붙박이장 (🔧아르젠 제작)' : '붙박이장',
        quantity: `${furniture.closetJa}자 ${furniture.closetType === 'SWING' ? '여닫이' : '미닫이'}`,
        materialCost: furniture.closetCost,
        laborCost: 0,  // 목공비에 포함
        totalCost: furniture.closetCost,
        note: grade === 'ARGEN' ? '블룸 믹스 하드웨어' : `${furniture.spec.door}`
      },
      {
        name: grade === 'ARGEN' ? '신발장 (🔧아르젠 제작)' : '신발장',
        quantity: `${furniture.shoeRackJa}자`,
        materialCost: furniture.shoeRackCost,
        laborCost: 0,
        totalCost: furniture.shoeRackCost
      }
    ],
    subtotal: furniture.totalCost
  };
  
  // 6. 창호
  const windowSpace: SpaceEstimate = {
    spaceName: '창호',
    items: [
      {
        name: '샷시',
        quantity: `${window.frames}틀`,
        materialCost: window.packagePrice,  // 패키지 가격
        laborCost: 0,  // 포함
        totalCost: window.packagePrice,
        brands: window.brands.map(b => `${b.name} ${b.product}`),
        note: `${window.spec.glassThickness} ${window.spec.lowE ? '로이' : '복층'}${window.spec.argon ? '+아르곤' : ''}`
      }
    ],
    subtotal: window.packagePrice
  };
  
  // ✅ 필름은 hasFilmProcess일 때만 추가
  if (hasFilmProcess) {
    windowSpace.items.push({
      name: '필름',
      quantity: `${film.length}m`,
      materialCost: film.materialCost,
      laborCost: film.laborCost,
      totalCost: film.totalCost,
      brands: film.brands.map(b => `${b.name} ${b.product}`)
    });
    windowSpace.subtotal += film.totalCost;
  }
  
  // 7. 조명 (옵션)
  let lightingSpace: SpaceEstimate | undefined;
  if (lighting) {
    lightingSpace = {
      spaceName: '조명/전기',
      items: [
        {
          name: '다운라이트',
          quantity: `${lighting.downlightCount}개`,
          materialCost: lighting.downlightCost,
          laborCost: 0,
          totalCost: lighting.downlightCost,
          note: '고연색성 LED'
        },
        {
          name: '간접조명',
          quantity: `${lighting.indirectLength}m`,
          materialCost: lighting.indirectCost,
          laborCost: 0,
          totalCost: lighting.indirectCost,
          note: 'T5 조명'
        },
        {
          name: '스위치/콘센트',
          quantity: `${lighting.switchCount}개`,
          materialCost: lighting.switchCost,
          laborCost: 0,
          totalCost: lighting.switchCost,
          brands: ['르그랑(아펠라)']
        }
      ],
      subtotal: lighting.totalCost
    };
  }
  
  // 8. 발코니 (발코니 공정이 활성화된 경우)
  let balconySpace: SpaceEstimate | undefined;
  if (hasBalconyProcess) {
    balconySpace = {
      spaceName: '발코니',
      items: [
        {
          name: '발코니 공사',
          quantity: '1식',
          materialCost: 0,  // TODO: 발코니 자재비 계산 필요
          laborCost: 0,      // TODO: 발코니 노무비 계산 필요
          totalCost: 0,
          note: '발코니 공사 (자재비/노무비 별도 계산 필요)'
        }
      ],
      subtotal: 0
    };
  }
  
  // =========================================================
  // 합계 계산 (선택된 공간/공정만 - 엄격한 로직)
  // =========================================================
  
  console.log('💰 합계 계산 - 활성화된 공정:', {
    hasFinish, hasKitchenProcess, hasBathroomProcess, hasElectric,
    hasDoor, hasWindow,  // ✅ 도어/창호 분리
    hasStorageProcess, hasBalconyProcess, hasEntranceProcess, hasFilmProcess
  });
  
  // 자재비 합계 (선택된 공정만)
  let materialTotal = commonCosts.protectionCost + commonCosts.elevatorCost; // 보양비
  
  // ✅ 안방 마감 (안방만 선택되었을 때)
  if (hasMasterBedroomFinish && onlyMasterBedroomSelected) {
    if (masterBedroomWallpaper) {
      materialTotal += masterBedroomWallpaper.materialCost;
    }
    if (masterBedroomFlooring) {
      materialTotal += masterBedroomFlooring.materialCost;
    }
  }
  
  // 거실/복도 마감 (마감 공정이 활성화되었을 때만, 안방만 선택 시 제외)
  if (hasFinish && !onlyMasterBedroomSelected) {
    // 도배
    if (extractedData.hasWallFinish || hasAllProcesses) {
      materialTotal += wallpaper.materialCost;
    }
    // 바닥
    if (extractedData.hasFloorFinish || hasAllProcesses) {
      materialTotal += flooring.materialCost;
    }
    // 몰딩
    materialTotal += molding.totalCost;
  }
  
  // ✅ 안방 도어 (안방만 선택되었을 때)
  if (hasMasterBedroomDoor && onlyMasterBedroomSelected) {
    const masterBedroomDoor = calculateDoorEstimate(grade, sizeRange, masterBedroomArea, false, 1);
    materialTotal += masterBedroomDoor.doorCost;
  }
  
  // 도어/창호 (도어/창호 공정이 활성화되었을 때만, 안방만 선택 시 제외)
  if (hasDoor && !onlyMasterBedroomSelected) {
    materialTotal += door.doorCost + door.middleDoorCost;
    materialTotal += (finalIncludeFoldingDoor ? door.foldingDoorCost : 0);
    materialTotal += (finalIncludeDoorlock ? doorlockCost : 0);
  }
  
  // 주방 (주방 공정이 활성화되었을 때만)
  if (hasKitchenProcess) {
    materialTotal += kitchen.materialCost;
    materialTotal += tile.kitchenMaterialCost;
    
    // ✅ 보조주방 비용 추가
    if (hasSubKitchen && subKitchenSpace) {
      materialTotal += subKitchenSpace.subtotal;
    }
  }
  
  // 욕실 (욕실 공정이 활성화되었을 때만, 선택된 욕실만 계산)
  if (hasBathroomProcess) {
    // 선택된 욕실 개수만 계산
    let selectedBathroomCount = 0;
    if (hasTwoBathrooms) {
      if (hasMasterBathroomSelected) selectedBathroomCount++;
      if (hasCommonBathroomSelected) selectedBathroomCount++;
    } else if (hasSingleBathroomSelected) {
      selectedBathroomCount = 1;
    }
    
    // 타일 비용은 선택된 욕실에 따라 계산
    if (hasTwoBathrooms) {
      if (hasMasterBathroomSelected) {
        materialTotal += Math.round(tile.bathroomMaterialCost * 0.55); // 안방욕실 비율
      }
      if (hasCommonBathroomSelected) {
        materialTotal += Math.round(tile.bathroomMaterialCost * 0.45); // 공용욕실 비율
      }
    } else if (hasSingleBathroomSelected) {
      materialTotal += tile.bathroomMaterialCost; // 단일 욕실
    }
    
    // 욕실 세트 비용은 선택된 욕실 개수만큼
    materialTotal += (bathroom.setTotal * selectedBathroomCount);
    materialTotal += (finalIncludeBidet && bathroom.bidet ? bathroom.bidet.price * selectedBathroomCount : 0);
    materialTotal += (finalIncludeBathtub && bathroom.bathtub ? bathroom.bathtub.price : 0);
  }
  
  // 현관 (현관 공정이 활성화되었을 때만)
  if (hasEntranceProcess) {
    materialTotal += tile.entranceMaterialCost;
  }
  
  // 수납/가구 (가구 공정이 활성화되었을 때만)
  if (hasStorageProcess) {
    materialTotal += furniture.totalCost;
  }
  
  // 창호 (도어/창호 공정이 활성화되었을 때만)
  if (hasWindow) {
    materialTotal += window.packagePrice;
  }
  
  // 필름 (필름 공정이 활성화되었을 때만)
  if (hasFilmProcess) {
    materialTotal += film.materialCost;
  }
  
  // 조명 (전기 공정이 활성화되었을 때만)
  if (lighting && hasElectric) {
    materialTotal += lighting.totalCost;
  }
  
  // 노무비 합계 (선택된 공정만)
  let laborTotal = 0;
  
  // 철거/청소
  laborTotal += commonCosts.demolitionCost;
  laborTotal += commonCosts.cleaningCost;
  
  // ✅ 안방 마감 노무비 (안방만 선택되었을 때)
  if (hasMasterBedroomFinish && onlyMasterBedroomSelected) {
    if (masterBedroomWallpaper) {
      laborTotal += masterBedroomWallpaper.laborCost;
    }
    if (masterBedroomFlooring) {
      laborTotal += masterBedroomFlooring.laborCost;
    }
  }
  
  // 거실/복도 마감 노무비 (안방만 선택 시 제외)
  if (hasFinish && !onlyMasterBedroomSelected) {
    if (extractedData.hasWallFinish || hasAllProcesses) {
      laborTotal += wallpaper.laborCost;
    }
    if (extractedData.hasFloorFinish || hasAllProcesses) {
      laborTotal += flooring.laborCost;
    }
  }
  
  // 필름 노무비
  if (hasFilmProcess) {
    laborTotal += film.laborCost;
  }
  
  // 주방 노무비
  if (hasKitchenProcess) {
    laborTotal += kitchen.laborCost;
    laborTotal += tile.kitchenLaborCost;
  }
  
  // 욕실 노무비 (선택된 욕실만 계산)
  if (hasBathroomProcess) {
    if (hasTwoBathrooms) {
      if (hasMasterBathroomSelected) {
        laborTotal += Math.round(tile.bathroomLaborCost * 0.55); // 안방욕실 비율
      }
      if (hasCommonBathroomSelected) {
        laborTotal += Math.round(tile.bathroomLaborCost * 0.45); // 공용욕실 비율
      }
    } else if (hasSingleBathroomSelected) {
      laborTotal += tile.bathroomLaborCost; // 단일 욕실
    }
  }
  
  // 현관 노무비
  if (hasEntranceProcess) {
    laborTotal += tile.entranceLaborCost;
  }
  
  // 순공사비 (VAT 별도)
  const netTotal = materialTotal + laborTotal;
  
  // VAT
  const vat = calculateVAT(netTotal);
  
  // 총 견적
  const grandTotal = priceWithVAT(netTotal);
  
  // 평당 단가
  const pricePerPy = Math.round(grandTotal / py);
  
  // 공사 기간
  const duration = CONSTRUCTION_DURATION_BY_SIZE[sizeRange];
  
  // =========================================================
  // 아르젠 특장점 (ARGEN 등급일 때만)
  // =========================================================
  
  let argenFeatures: FullEstimateV3['argenFeatures'] | undefined;
  if (grade === 'ARGEN') {
    argenFeatures = {
      made: [
        '싱크대 (블룸 경첩 + LX 오로라 상판)',
        '붙박이장 (블룸 믹스 하드웨어)',
        '신발장 (맞춤 제작)',
        '욕실장 (슬라이딩 + LED 간접조명)'
      ],
      recommended: [
        '도배: LX 지인 테라 (프리미엄 실크)',
        '바닥: 동화 그란데 (광폭 강마루)',
        '필름: 현대 SPW (슈퍼매트 무광)',
        '샷시: KCC 프리미엄 (로이+아르곤)',
        '방문: 영림 프리미엄',
        '중문: 영림 초슬림 고급형'
      ]
    };
  }
  
  // =========================================================
  // 결과 반환 (선택된 공간만 포함)
  // =========================================================
  
  // ✅ 조건부 공간 생성 - 선택되지 않은 공간은 빈 견적으로 표시
  const createEmptySpace = (name: string): SpaceEstimate => ({
    spaceName: name,
    items: [],
    subtotal: 0
  });
  
  // 공통 공사는 항상 포함 (철거/보양이 있을 때만 항목 표시)
  const finalCommonSpace = commonSpace;
  
  // ✅ 안방 마감 공간 생성 (안방이 선택되었을 때 - 안방욕실과 함께 선택되어도 포함)
  let masterBedroomFinishSpace: SpaceEstimate | undefined;
  if (hasMasterBedroomFinish && (onlyMasterBedroomSelected || (hasMasterBedroom && !hasLiving && !hasOtherRooms))) {
    const items: ProcessItem[] = [];
    let subtotal = 0;
    
    // 도배
    if (masterBedroomWallpaper) {
      items.push({
        name: '도배',
        quantity: `${masterBedroomWallpaper.rolls}롤`,
        materialCost: masterBedroomWallpaper.materialCost,
        laborCost: masterBedroomWallpaper.laborCost,
        totalCost: masterBedroomWallpaper.totalCost,
        brands: masterBedroomWallpaper.brands.map(b => `${b.name} ${b.product}`)
      });
      subtotal += masterBedroomWallpaper.totalCost;
    }
    
    // 바닥
    if (masterBedroomFlooring) {
      items.push({
        name: '바닥',
        quantity: `${masterBedroomFlooring.area}평`,
        materialCost: masterBedroomFlooring.materialCost,
        laborCost: masterBedroomFlooring.laborCost,
        totalCost: masterBedroomFlooring.totalCost,
        brands: masterBedroomFlooring.brands.map(b => `${b.name} ${b.product}`)
      });
      subtotal += masterBedroomFlooring.totalCost;
    }
    
    // 문/문틀 (안방 도어)
    if (hasMasterBedroomDoor) {
      const masterBedroomDoor = calculateDoorEstimate(grade, sizeRange, masterBedroomArea, false, 1);
      items.push({
        name: '방문',
        quantity: '1세트',
        materialCost: masterBedroomDoor.doorCost,
        laborCost: 0,
        totalCost: masterBedroomDoor.doorCost,
        brands: masterBedroomDoor.doorBrands.map(b => `${b.name} ${b.product}`)
      });
      subtotal += masterBedroomDoor.doorCost;
    }
    
    masterBedroomFinishSpace = {
      spaceName: '안방',
      items,
      subtotal
    };
  }
  
  // 거실/복도 - 마감 공정이 활성화되었을 때만 (안방만 선택 시 안방 마감으로 대체)
  // ✅ 안방과 안방욕실이 함께 선택되어도 안방 마감 공간 포함
  const finalLivingSpace = (hasMasterBedroomFinish && masterBedroomFinishSpace && (onlyMasterBedroomSelected || (hasMasterBedroom && !hasLiving && !hasOtherRooms)))
    ? masterBedroomFinishSpace
    : (hasFinish && !onlyMasterBedroomSelected) 
      ? livingSpace 
      : createEmptySpace('거실/복도 (미선택)');
  
  // 주방 - 주방 공정이 활성화되었을 때만
  const finalKitchenSpace = hasKitchenProcess ? kitchenSpace : createEmptySpace('주방 (미선택)');
  
  // ✅ 보조주방 - 30평 이상 + 옵션 선택 시
  const finalSubKitchenSpace = (hasKitchenProcess && hasSubKitchen && subKitchenSpace) 
    ? subKitchenSpace 
    : undefined;
  
  // 욕실 - 욕실 공정이 활성화되었을 때만
  const finalBathroomSpace = hasBathroomProcess ? bathroomSpace : createEmptySpace('욕실 (미선택)');
  
  // ✅ 안방욕실/공용욕실 - 2개 이상일 때만 분리, 선택된 것만
  const finalMasterBathroomSpace = (
    hasBathroomProcess && 
    hasTwoBathrooms && 
    hasMasterBathroomSelected && 
    masterBathroomSpace
  ) ? masterBathroomSpace : undefined;
  
  const finalCommonBathroomSpace = (
    hasBathroomProcess && 
    hasTwoBathrooms && 
    hasCommonBathroomSelected && 
    commonBathroomSpace
  ) ? commonBathroomSpace : undefined;
  
  // 수납/가구 - 가구 공정이 활성화되었을 때만
  const finalStorageSpace = hasStorageProcess ? storageSpace : createEmptySpace('수납/가구 (미선택)');
  
  // ✅ 창호(샤시) - 명시적으로 선택했을 때만 (hasDoor와 분리)
  const finalWindowSpace = hasWindow ? windowSpace : createEmptySpace('창호 (미선택)');
  
  // 조명 - 전기 공정이 활성화되었을 때만
  const finalLightingSpace = (lighting && hasElectric) ? lightingSpace : undefined;
  
  // ✅ 발코니 - 발코니 공정이 활성화되었을 때만
  const finalBalconySpace = hasBalconyProcess && balconySpace 
    ? balconySpace 
    : undefined;
  
  // ✅ 현관 - 현관 공정이 활성화되었을 때만
  const finalEntranceSpace = hasEntranceProcess && entranceSpace 
    ? entranceSpace 
    : undefined;
  
  console.log('📋 최종 견적 결과:', {
    hasFinish, hasKitchenProcess, hasBathroomProcess, hasStorageProcess, hasDoor, hasWindow, hasElectric,
    hasBalconyProcess, hasEntranceProcess, hasFilmProcess,
    materialTotal, laborTotal, grandTotal
  });
  // ✅ 각 공간별 최종 견적 포함 여부 확인
  console.log('🏠 최종 견적 공간 포함 여부:', {
    거실복도: finalLivingSpace.spaceName !== '거실/복도 (미선택)',
    주방: finalKitchenSpace.spaceName !== '주방 (미선택)',
    욕실: finalBathroomSpace.spaceName !== '욕실 (미선택)',
    안방욕실: !!finalMasterBathroomSpace,
    공용욕실: !!finalCommonBathroomSpace,
    수납가구: finalStorageSpace.spaceName !== '수납/가구 (미선택)',
    창호: finalWindowSpace.spaceName !== '창호 (미선택)',
    조명: !!finalLightingSpace,
    발코니: !!finalBalconySpace,
    현관: !!finalEntranceSpace
  });
  
  // ✅ Phase 2: LOCK 공정 정보 수집 (철거 공정)
  const lockedProcesses: Array<{
    processId: string;
    processLabel: string;
    lockReason: string;
    canOverride: boolean;
  }> = [];
  
  // 철거 공정이 있으면 LOCK 상태로 추가
  if (commonCosts.demolitionCost > 0) {
    lockedProcesses.push({
      processId: 'demolition',
      processLabel: hasAllProcesses ? '전체 철거' : '부분 철거',
      lockReason: '이 공정은 공사 후 변경이 어렵습니다',
      canOverride: false
    });
  }
  
  const result = {
    input: {
      py,
      sizeRange,
      grade,
      gradeName: gradeNames[grade]
    },
    spaces: {
      common: finalCommonSpace,
      living: finalLivingSpace,
      kitchen: finalKitchenSpace,
      subKitchen: finalSubKitchenSpace,           // ✅ 보조주방 (30평 이상, 선택 시)
      bathroom: finalBathroomSpace,
      masterBathroom: finalMasterBathroomSpace,   // ✅ 안방욕실 (2개 이상일 때)
      commonBathroom: finalCommonBathroomSpace,   // ✅ 공용욕실 (2개 이상일 때)
      storage: finalStorageSpace,
      window: finalWindowSpace,
      lighting: finalLightingSpace,
      balcony: finalBalconySpace,                 // ✅ 발코니 (옵션)
      entrance: finalEntranceSpace                 // ✅ 현관 (옵션)
    },
    summary: {
      materialTotal,
      laborTotal,
      netTotal,
      vat,
      grandTotal,
      pricePerPy
    },
    duration,
    argenFeatures,
    // ✅ Phase 2: LOCK 공정 정보
    lockedProcesses: lockedProcesses.length > 0 ? lockedProcesses : undefined
  };
  
  return result;
}

// ============================================================
// 4. 4등급 비교 견적 계산
// ============================================================

/** 4등급 비교 결과 */
export interface GradeComparison {
  py: number;
  sizeRange: SizeRange;
  grades: {
    BASIC: { netTotal: number; grandTotal: number; pricePerPy: number };
    STANDARD: { netTotal: number; grandTotal: number; pricePerPy: number };
    ARGEN: { netTotal: number; grandTotal: number; pricePerPy: number };
    PREMIUM: { netTotal: number; grandTotal: number; pricePerPy: number };
  };
}

/** 4등급 비교 견적 계산 (비동기) */
export async function calculateGradeComparison(py: number): Promise<GradeComparison> {
  const sizeRange = getSizeRange(py);
  
  const baseInput: Omit<EstimateInputV3, 'grade'> = {
    py,
    isExtended: false,
    closetType: 'SWING',
    includeFoldingDoor: false,
    includeBidet: false,
    includeBathtub: false,
    includeDoorlock: true,
    includeLighting: true
  };
  
  const [basic, standard, argen, premium] = await Promise.all([
    calculateFullEstimateV3({ ...baseInput, grade: 'BASIC' }),
    calculateFullEstimateV3({ ...baseInput, grade: 'STANDARD' }),
    calculateFullEstimateV3({ ...baseInput, grade: 'ARGEN' }),
    calculateFullEstimateV3({ ...baseInput, grade: 'PREMIUM' })
  ]);
  
  return {
    py,
    sizeRange,
    grades: {
      BASIC: {
        netTotal: basic.summary.netTotal,
        grandTotal: basic.summary.grandTotal,
        pricePerPy: basic.summary.pricePerPy
      },
      STANDARD: {
        netTotal: standard.summary.netTotal,
        grandTotal: standard.summary.grandTotal,
        pricePerPy: standard.summary.pricePerPy
      },
      ARGEN: {
        netTotal: argen.summary.netTotal,
        grandTotal: argen.summary.grandTotal,
        pricePerPy: argen.summary.pricePerPy
      },
      PREMIUM: {
        netTotal: premium.summary.netTotal,
        grandTotal: premium.summary.grandTotal,
        pricePerPy: premium.summary.pricePerPy
      }
    }
  };
}

// ============================================================
// 5. 견적서 텍스트 생성
// ============================================================

/** 견적서 텍스트 생성 */
export function generateEstimateTextV3(estimate: FullEstimateV3): string {
  const { input, spaces, summary, duration, argenFeatures } = estimate;
  
  let text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🏠 인테리봇 견적서
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  평형: ${input.py}평 (${input.sizeRange}) | 등급: ${input.gradeName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  // 공간별 견적 (안방욕실/공용욕실/보조주방 분리 지원)
  // ✅ 안방 마감 공간이 finalLivingSpace에 포함되어 있으면 별도로 표시하지 않음 (이미 거실/복도에 포함됨)
  const allSpaces = [
    spaces.common,
    spaces.living, // ✅ 안방 마감이 포함되어 있을 수 있음
    spaces.kitchen,
    spaces.subKitchen, // ✅ 보조주방 (있으면 표시)
    // 욕실: 분리된 경우 안방/공용 따로, 아니면 통합
    ...(spaces.masterBathroom && spaces.commonBathroom 
      ? [spaces.masterBathroom, spaces.commonBathroom] 
      : [spaces.bathroom]),
    spaces.storage,
    spaces.window,
    spaces.lighting
  ].filter(Boolean) as SpaceEstimate[];
  
  for (const space of allSpaces) {
    text += `\n  ▶ ${space.spaceName}\n`;
    for (const item of space.items) {
      const qty = item.quantity ? ` (${item.quantity})` : '';
      text += `    ├─ ${item.name}${qty}: ${formatWon(item.totalCost)}\n`;
      if (item.note) {
        text += `    │   └─ ${item.note}\n`;
      }
    }
    text += `    └─ 소계: ${formatWon(space.subtotal)}\n`;
  }
  
  // 합계
  text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  💰 견적 합계
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  자재비 합계: ${formatWon(summary.materialTotal)}
  노무비 합계: ${formatWon(summary.laborTotal)}
  ─────────────────────────────────────────
  순공사비: ${formatWon(summary.netTotal)}
  부가세 (10%): ${formatWon(summary.vat)}
  ─────────────────────────────────────────
  총 견적: ${formatWon(summary.grandTotal)}
  
  평당 단가: 약 ${formatManWon(summary.pricePerPy)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📅 예상 공사 기간: ${duration.typical}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  // 아르젠 특장점
  if (argenFeatures) {
    text += `
  🔧 아르젠 제작 품목:
${argenFeatures.made.map(item => `     • ${item}`).join('\n')}

  ⭐ 아르젠 추천 자재:
${argenFeatures.recommended.map(item => `     • ${item}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }
  
  return text;
}
