/**
 * 인테리봇 견적 시스템 헌법 - 타입 정의
 * 
 * 작성일: 2024년 12월
 * 목적: 헌법 문서에 따른 견적 시스템 타입 정의
 * 
 * 핵심 원칙:
 * - 등급 시스템 제거 (내부 정렬용은 유지 가능)
 * - 아르젠 기준 단일 견적
 * - MaterialRequest/LaborRequest 기반 DB 조회
 * - 노무비 계산 의무화
 * - 브랜드 상향 시 시공 난이도 증가 반영
 */

// ============================================================
// 1. 공정 및 공간 타입
// ============================================================

/** 선택 가능한 공간 (헌법 4-2: processSelections SSOT) */
export type SelectedSpace = 
  | 'living'      // 거실
  | 'kitchen'     // 주방
  | 'bathroom'    // 욕실
  | 'room'        // 방
  | 'entrance'    // 현관
  | 'balcony'     // 베란다
  | 'storage';    // 수납

/** 공정 ID (헌법 5-2: 명시적 선택만 허용) */
export type ProcessId =
  | 'demolition'   // 철거
  | 'finish'       // 마감 (도배/바닥)
  | 'electric'     // 조명/전기
  | 'kitchen'      // 주방
  | 'bathroom'     // 욕실
  | 'door'         // 문
  | 'window'       // 창호
  | 'storage'      // 수납
  | 'waterproof'   // 방수 (욕실/베란다 필수 연동)
  | 'plumbing'     // 설비 (욕실/주방 필수 연동)
  | 'waste'        // 폐기물 (목공/철거 필수 연동)
  | 'SYSTEM';      // 시스템 레벨 검증 에러 (특정 공정이 아닌 전체 시스템 문제, 엔진/입력 검증용)

/** 전체 공정 / 부분 공정 (헌법 5-2: 명시적 선택만) */
export type ProcessMode = 'FULL' | 'PARTIAL';

// ============================================================
// 1-1. 수량 산정 타입 (공정 수량 산정 레이어)
// ============================================================

/**
 * 수량 산정 타입 (공정 수량 산정 레이어 - 섹션 3)
 * 
 * - COUNT: 개수 기반 (욕실, 주방, 문/창호 등)
 * - AREA: 면적 기반 (도배, 바닥, 철거 등)
 * - FIXED: 고정값 (관리비, 기본 세팅 등)
 */
export type QuantityBasisType = 'COUNT' | 'AREA' | 'FIXED';

/**
 * 수량 산정 기준 (공정 수량 산정 레이어 - 섹션 2)
 * 
 * 모든 ProcessEstimateBlock에 필수로 포함되어야 함
 * quantityBasis 없는 공정은 견적 생성 실패
 */
export interface QuantityBasis {
  /** 수량 산정 타입 */
  type: QuantityBasisType;
  
  /** 수량 값 (반드시 숫자) */
  value: number;
  
  /** 수량 산정 근거 (사람이 이해 가능한 문장) */
  reason: string;
  
  /** 부분 공정 계수 (섹션 4) */
  partialFactor?: number;
  
  /** 옵션으로 인한 추가 수량 (섹션 5) */
  optionAdjustment?: number;
}

/**
 * 공정별 수량 계수 규칙 (AREA 타입용)
 * 
 * 별도 규칙 테이블 참조 (하드코딩 금지)
 */
export interface QuantityRule {
  /** 공정 ID */
  processId: ProcessId;
  
  /** 공정별 계수 (평수 × 계수 = 면적) */
  areaMultiplier: number;
  
  /** 부분 공정 계수 */
  partialFactor: number;
  
  /** 최소 수량 */
  minQuantity?: number;
  
  /** 최대 수량 */
  maxQuantity?: number;
}

// ============================================================
// 2. MaterialRequest (헌법 7-1)
// ============================================================

/**
 * 자재 요청 구조 (헌법 7-1)
 * 
 * DB 조회 전에 반드시 요청서를 만든다.
 * 각 공정마다 다음 정보를 가진 MaterialRequest를 생성한다.
 */
export interface MaterialRequest {
  /** 공정 ID */
  processId: ProcessId;
  
  /** 적용 공간 */
  space: SelectedSpace;
  
  /** 자재 카테고리 (3단계) */
  category: {
    category1: string;  // 예: '타일'
    category2: string;  // 예: '벽타일'
    category3?: string; // 예: '포세린'
  };
  
  /** 규격 (예: '600x600', 'EA', 'SET') */
  spec: string;
  
  /** 브랜드 조건 (헌법 3-2: 아르젠 기준) */
  brandCondition: {
    /** 아르젠 기준 자재만 사용 */
    isArgenStandard: true;
    /** 내부 우선순위 (낮을수록 우선) */
    priority?: number;
    /** 등급별 브랜드 컬럼 (V4 전용) */
    brandColumn?: 'brand_basic' | 'brand_standard' | 'brand_argen' | 'brand_premium';
  };
  
  /** 수량 산정 기준 */
  quantity: {
    /** 수량 값 */
    value: number;
    /** 단위 (㎡, EA, SET 등) */
    unit: string;
    /** 산정 근거 설명 */
    basis: string;
  };
  
  /** 추가 조건 (옵션) */
  additionalConditions?: {
    /** 최소 규격 */
    minSpec?: string;
    /** 최대 규격 */
    maxSpec?: string;
    /** 특정 브랜드 제외 */
    excludeBrands?: string[];
  };
}

// ============================================================
// 3. LaborRequest (헌법 8-1)
// ============================================================

/**
 * 노무비 요청 구조 (헌법 8-1)
 * 
 * 모든 공정은 반드시 노무비를 포함한다.
 * 노무비 계산이 불가능하면 → 견적 실패
 */
export interface LaborRequest {
  /** 공정 ID */
  processId: ProcessId;
  
  /** 노무 단위 (헌법 8-2) */
  unit: 'm2' | 'EA' | 'SET' | 'day' | 'team';
  
  /** 총 작업량 */
  totalQuantity: number;
  
  /** 1일 작업량 (헌법 8-2) */
  dailyOutput: number;
  
  /** 투입 인원 기준 (헌법 8-2) */
  crewSize: number;
  
  /** 시공 난이도 계수 (헌법 9-3: 브랜드 상향 시 증가) */
  difficultyFactor: number;  // 기본 1.0, 브랜드 상향 시 증가
  
  /** 난이도 증가 근거 (헌법 9-2) */
  difficultyBasis?: string;   // 예: '600각 이상', '수입', '대형판'
  
  /** 작업량 감소 계수 (난이도 증가 시) */
  outputFactorByDifficulty?: number;  // 기본 0.7
}

// ============================================================
// 4. DB 조회 결과 타입 (헌법 7-2, 12-1)
// ============================================================

/**
 * DB 조회 결과 상태 (헌법 7-2)
 * 
 * DB 결과는 반드시 아래 중 하나다.
 * - SUCCESS: 조회 성공
 * - NOT_FOUND: 데이터 없음 (fallback 조건 확인 필요)
 * - ERROR: 조회 실패 (즉시 견적 실패)
 */
export type DbResultStatus = 'SUCCESS' | 'NOT_FOUND' | 'ERROR';

/**
 * 자재 DB 조회 결과
 */
export interface MaterialDbResult {
  status: DbResultStatus;
  
  /** SUCCESS일 때만 존재 */
  data?: {
    materialId: string;
    materialCode: string;
    brandName: string;
    productName: string;
    spec: string;
    category1: string;
    category2: string;
    category3?: string;
    unit: string;
    price: number;  // 단가
    isArgenStandard: boolean;
    argenPriority?: number;
  };
  
  /** ERROR 또는 NOT_FOUND일 때 메시지 */
  message?: string;
  
  /** NOT_FOUND일 때 fallback 허용 여부 (헌법 6-2) */
  allowFallback?: boolean;
}

/**
 * 노무비 DB 조회 결과
 */
export interface LaborDbResult {
  status: DbResultStatus;
  
  /** SUCCESS일 때만 존재 */
  data?: {
    laborId: string;
    processId: ProcessId;
    unit: string;
    dailyOutput: number;
    crewSize: number;
    ratePerPersonDay: number;  // 1인 1일 노무 단가
    difficultyFactor: number;
    difficultyBasis?: string;
    outputFactorByDifficulty?: number;
  };
  
  /** ERROR 또는 NOT_FOUND일 때 메시지 */
  message?: string;
  
  /** 노무비는 NOT_FOUND면 즉시 실패 (헌법 6-2) */
  // allowFallback은 항상 false
}

// ============================================================
// 5. 공정별 견적 블록 (헌법 11-1)
// ============================================================

/**
 * 공정별 견적 블록 (헌법 v1 - STEP 2)
 * 
 * 공정 블록은 견적의 최소 단위다.
 * 공정이 없으면 견적도 없다.
 */
export interface ProcessEstimateBlock {
  /** 공정명 */
  processName: string;
  
  /** 공정 ID */
  processId: ProcessId;
  
  /** 공정 유형 (헌법 v1 - STEP 2) */
  processType: '필수' | '선택' | '조건부';
  
  /** 수량 산정 기준 (공정 수량 산정 레이어 - 필수) */
  quantityBasis: QuantityBasis;
  
  /** 적용 공간 */
  spaces: SelectedSpace[];
  
  /** 사용 브랜드 / 제품명 / 규격 (헌법 3-3) */
  materials: {
    brandName: string;
    productName: string;
    spec: string;
    category: {
      category1: string;
      category2: string;
      category3?: string;
    };
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    /** DB 근거 (헌법 v1 - 결과물 출력 구조) */
    dbSource: {
      table: string;
      key: string;
    };
  }[];
  
  /** 노무 구성 (헌법 11-1) */
  labor: {
    /** 노무 단위 */
    unit: string;
    /** 1일 작업량 */
    dailyOutput: number;
    /** 투입 인원 */
    crewSize: number;
    /** 작업 일수 */
    workDays: number;
    /** 1인 1일 노무 단가 */
    ratePerPersonDay: number;
    /** 시공 난이도 계수 */
    difficultyFactor: number;
    /** 산출 근거 설명 */
    calculationBasis: string;
    /** 총 노무비 */
    totalLaborCost: number;
    /** DB 근거 (헌법 v1 - 결과물 출력 구조) */
    dbSource: {
      table: string;
      key: string;
    };
  };
  
  /** 포함 항목 (헌법 v1 - STEP 5) */
  inclusions: string[];
  
  /** 제외 항목 (헌법 v1 - STEP 5) */
  exclusions: string[];
  
  /** 현장 가정 사항 (헌법 v1 - STEP 5) */
  assumptions: string[];
  
  /** 옵션 리스트 (헌법 v1 - STEP 2, STEP 4) */
  options: {
    id: string;
    name: string;
    status: '기본 포함' | '선택 가능' | '조건부 자동 포함';
    condition?: string; // 조건부인 경우 조건 설명
  }[];
  
  /** 자재 총액 */
  materialTotal: number;
  
  /** 노무 총액 */
  laborTotal: number;
  
  /** 공정 총액 (자재 + 노무) */
  processTotal: number;
}

// ============================================================
// 6. 최종 견적 출력 포맷 (헌법 11)
// ============================================================

/**
 * 최종 견적 출력 포맷 (헌법 v1 - STEP 5)
 * 
 * 결과물 출력 구조는 반드시 다음 순서로 출력한다:
 * 1. 프로젝트 요약 (입력값 그대로)
 * 2. 공정 블록 요약 리스트
 * 3. 공정별 포함 / 제외 / 가정
 * 4. 옵션 정리
 * 5. 견적 조립 결과 (규칙엔진 결과)
 */
export interface FinalEstimate {
  /** 1. 프로젝트 요약 (입력값 그대로) - 헌법 v1 STEP 5 */
  projectSummary?: {
    /** 평수 (고객 입력값, 절대 변경 금지) */
    pyeong: number;
    /** 공간 유형 */
    spaceType: '주거' | '상업' | '사무실' | '기타';
    /** 가족 구성 */
    familyComposition?: {
      adults: number;
      children: number;
      elderly: number;
      pets: boolean;
    };
    /** 특이 조건 */
    specialConditions?: string[];
    /** 공정 모드 */
    mode: ProcessMode;
    /** 선택된 공간 */
    spaces: SelectedSpace[];
    /** 선택된 공정 */
    processes: ProcessId[];
  };
  
  /** 2. 공정 블록 요약 리스트 - 헌법 v1 STEP 5 */
  processBlockSummary?: {
    processId: ProcessId;
    processName: string;
    processType: '필수' | '선택' | '조건부';
    processTotal: number;
  }[];
  
  /** 3. 공정별 포함 / 제외 / 가정 - 헌법 v1 STEP 5 */
  processBlocks: ProcessEstimateBlock[];
  
  /** 4. 옵션 정리 - 헌법 v1 STEP 5 */
  optionsSummary?: {
    processId: ProcessId;
    processName: string;
    options: {
      id: string;
      name: string;
      status: '기본 포함' | '선택 가능' | '조건부 자동 포함';
      condition?: string;
    }[];
  }[];
  
  /** 5. 견적 조립 결과 (규칙엔진 결과) - 헌법 v1 STEP 5 */
  estimateResult?: {
    /** 총 자재비 */
    totalMaterial: number;
    /** 총 노무비 */
    totalLabor: number;
    /** 총 직접비 */
    totalDirect: number;
    /** 간접비 (산재보험, 고용보험, 일반관리비, 이윤) */
    indirectCosts: {
      industrialAccident: number;  // 산재보험 (노무비의 3.07%)
      employment: number;          // 고용보험 (노무비의 1.5%)
      overhead: number;            // 일반관리비 (직접비의 3%)
      profit: number;              // 이윤 (직접비의 5%)
      total: number;
    };
    /** 부가가치세 */
    vat: number;
    /** 최종 총액 (VAT 포함) */
    totalWithVAT: number;
    /** 평당 단가 */
    costPerPyeong: number;
  };
  
  /** 견적 기준 (헌법 3-1) */
  standard: 'ARGEN';  // 항상 'ARGEN'
  
  /** 실패 정보 (헌법 v1 - 실패로 간주하는 경우) */
  failures?: {
    /** 실패한 공정 */
    failedProcesses: ProcessId[];
    /** 실패 사유 */
    reasons: string[];
    /** 추가 확인 필요 여부 */
    requiresConfirmation: boolean;
  };
  
  /** 견적 상태 */
  status?: 'SUCCESS' | 'ESTIMATE_FAILED';
  
  // ============================================================
  // 추가 속성 (constitution-estimate-engine.ts 호환용)
  // ============================================================
  
  /** 버전 정보 (헌법 10: 브랜드 상향 시 새 버전 생성) */
  version?: {
    versionNumber: number;
    isUpgrade: boolean;
    createdAt: string;
    baseVersionId?: string;
  };
  
  /** 입력 정보 요약 */
  input?: {
    pyeong: number;
    mode: ProcessMode;
    spaces: SelectedSpace[];
    processes: ProcessId[];
  };
  
  /** 비용 요약 */
  summary?: {
    processList: string[];
    totalMaterial: number;
    totalLabor: number;
    totalDirect: number;
    netTotal?: number;  // VAT 제외 총액 (순공사비)
    indirectCosts: {
      industrialAccident: number;
      employment: number;
      overhead: number;
      profit: number;
      total: number;
    };
    vat: number;
    totalWithVAT: number;
    grandTotal?: number;  // 프론트엔드 호환: grandTotal = totalWithVAT
    costPerPyeong: number;
  };
}

// ============================================================
// 7. 브랜드 상향 요청 (헌법 10)
// ============================================================

/**
 * 브랜드 상향 요청 (헌법 10)
 * 
 * 브랜드 상향 요청 = "견적 수정"이 아니라 "새 견적 생성"
 * 기존 견적 금액을 덮어쓰지 않는다.
 */
export interface BrandUpgradeRequest {
  /** 기준 견적 버전 */
  baseVersion: number;
  
  /** 상향할 공정 */
  targetProcess: ProcessId;
  
  /** 상향할 자재 카테고리 */
  targetCategory: {
    category1: string;
    category2: string;
    category3?: string;
  };
  
  /** 상향 단계 (1단계 상향) */
  upgradeLevel: 1;  // 항상 1단계
  
  /** 상향 기준 */
  upgradeBasis: 'DB_INTERNAL_PRIORITY';  // DB 내부 우선순위 기준
}

// ============================================================
// 8. 시공 난이도 증가 규칙 (헌법 9)
// ============================================================

/**
 * 시공 난이도 증가 규칙 (헌법 9-2)
 * 
 * 브랜드/자재 등급이 올라가면
 * 시공 난이도가 증가하고, 품이 증가한다.
 */
export interface DifficultyIncreaseRule {
  /** 공정 ID */
  processId: ProcessId;
  
  /** 난이도 증가 조건 */
  conditions: {
    /** 타일: 대형 포세린 타일 */
    tile?: {
      minSize?: string;  // 예: '600x600'
      isImport?: boolean;
      isSlim?: boolean;
    };
    /** 주방 상판: 엔지니어드 스톤 / 고급 인조대리석 */
    kitchen?: {
      isEngineeredStone?: boolean;
      isImport?: boolean;
    };
    /** 도장/도배: 친환경 도장, 고급 수입 벽지 */
    finish?: {
      isEcoFriendly?: boolean;
      isImport?: boolean;
    };
    /** 필름/마감: 고급 필름, 고난이도 면처리 */
    film?: {
      isPremium?: boolean;
      isComplexSurface?: boolean;
    };
  };
  
  /** 난이도 증가 효과 */
  effects: {
    /** 1일 작업량 감소율 (예: 0.7 = 30% 감소) */
    dailyOutputReduction?: number;
    /** 투입 인원 증가 */
    crewSizeIncrease?: number;
    /** 난이도 계수 증가 */
    difficultyFactorIncrease: number;  // 예: 1.0 → 1.3
  };
}

// ============================================================
// 9. 헬퍼 타입
// ============================================================

/**
 * 견적 계산 결과 (중간 단계)
 */
export interface EstimateCalculationResult {
  /** 성공 여부 */
  success: boolean;
  
  /** 공정별 결과 */
  processResults: Map<ProcessId, {
    materialResult: MaterialDbResult;
    laborResult: LaborDbResult;
    calculationSuccess: boolean;
    errorMessage?: string;
  }>;
  
  /** 전체 성공 여부 */
  allProcessesSuccess: boolean;
  
  /** 실패한 공정 목록 */
  failedProcesses: ProcessId[];
}

/**
 * 견적 생성 옵션
 */
export interface EstimateGenerationOptions {
  /** 평수 (헌법 4-1: 절대 변경 금지) */
  pyeong: number;
  
  /** 공정 모드 (헌법 5-2) */
  mode: ProcessMode;
  
  /** 선택된 공간 */
  spaces: SelectedSpace[];
  
  /** 선택된 공정 (processSelections SSOT) 
   * 형식: { [spaceId]: { [category]: value } }
   * 예: { "living": { "wall_finish": "wallpaper", "floor_finish": "laminate" } }
   */
  processSelections: Record<string, Record<string, string | string[] | null>>;
  
  /** 브랜드 상향 요청 (옵션) */
  brandUpgrade?: BrandUpgradeRequest;
}

// ============================================================
// 10. 견적 검증 에러 (헌법 v1 보강)
// ============================================================

/**
 * 견적 검증 에러 (헌법 v1 보강)
 * 
 * createSingleProcessBlock에서 발생하는 검증 실패는
 * 이 에러 타입으로 throw한다.
 * 
 * 이 에러는 "정상 실패"이며, 500이 아니라
 * ESTIMATE_FAILED JSON 응답으로 변환되어야 한다.
 */
export class EstimateValidationError extends Error {
  code: 'PROCESS_BLOCK_INVALID'
  processId: ProcessId
  reason: string
  failedAt?: 'MATERIAL_OR_LABOR_VALIDATION' | 'ENGINE_VALIDATION'

  constructor(params: {
    processId: ProcessId
    reason: string
    failedAt?: 'MATERIAL_OR_LABOR_VALIDATION' | 'ENGINE_VALIDATION'
  }) {
    super(`견적 검증 실패 [${params.processId}]: ${params.reason}`)
    this.name = 'EstimateValidationError'
    this.code = 'PROCESS_BLOCK_INVALID'
    this.processId = params.processId
    this.reason = params.reason
    this.failedAt = params.failedAt
  }
}













