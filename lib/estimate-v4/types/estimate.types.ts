/**
 * V4 견적 결과 타입 정의
 */

/**
 * 견적 상태
 */
export type EstimateStatusV4 = 'SUCCESS' | 'ESTIMATE_FAILED'

/**
 * 자재 항목
 */
export interface MaterialItemV4 {
  /** 자재 ID */
  materialId: string
  
  /** 자재명 */
  name: string
  
  /** 단위 */
  unit: string
  
  /** 수량 */
  quantity: number
  
  /** 단가 */
  unitPrice: number
  
  /** 합계 */
  totalPrice: number
  
  /** 데이터 출처 */
  dataSource: 'DB' | 'PRESET'
}

/**
 * 노무 항목
 */
export interface LaborItemV4 {
  /** 노무 유형 */
  laborType: string
  
  /** 1일 작업량 */
  dailyOutput: number
  
  /** 투입 인원 */
  crewSize: number
  
  /** 1인 1일 단가 */
  ratePerPersonDay: number
  
  /** 총 작업일수 */
  totalDays: number
  
  /** 총 노무비 */
  totalCost: number
  
  /** 데이터 출처 */
  dataSource: 'DB' | 'PRESET'
}

/**
 * 공정 블록
 */
export interface ProcessBlockV4 {
  /** 공정 ID */
  processId: string
  
  /** 공정명 */
  processName: string
  
  /** 적용 공간 목록 (버그 1 방지: 선택된 공간 필터링용) */
  spaces: string[]
  
  /** 자재 목록 */
  materials: MaterialItemV4[]
  
  /** 노무 정보 */
  labor: LaborItemV4
  
  /** 자재비 소계 */
  materialSubtotal: number
  
  /** 노무비 소계 */
  laborSubtotal: number
  
  /** 공정 합계 */
  processTotal: number
}

/**
 * 견적 요약
 */
export interface EstimateSummaryV4 {
  /** 총 합계 */
  grandTotal: number
  
  /** 자재비 합계 */
  materialTotal: number
  
  /** 노무비 합계 */
  laborTotal: number
  
  /** 부가세 */
  vatAmount: number
  
  /** 예비비 */
  bufferAmount: number
  
  /** 예비비 포함 총액 */
  totalWithBuffer: number
  
  /** 평당 단가 */
  costPerPyeong: number
}

/**
 * 실패 정보
 */
export interface EstimateFailureV4 {
  /** 실패한 공정 목록 */
  failedProcesses: string[]
  
  /** 실패 사유 */
  reasons: string[]
  
  /** 실패 위치 */
  failedAt: string
}

/**
 * 데이터 소스 통계
 */
export interface DataSourceStatsV4 {
  /** 총 항목 수 */
  totalItems: number
  
  /** DB에서 조회한 항목 수 */
  fromDB: number
  
  /** 프리셋에서 가져온 항목 수 */
  fromPreset: number
  
  /** DB 사용 비율 */
  dbRatio: number
}

/**
 * 견적 메타 정보
 */
export interface EstimateMetaV4 {
  /** 버전 */
  version: string
  
  /** 적용 등급 */
  grade: GradeV4
  
  /** 데이터 소스 통계 */
  dataSourceStats: DataSourceStatsV4
  
  /** 계산 시각 */
  calculatedAt: string
}

/**
 * 견적 최종 결과
 */
export interface EstimateResultV4 {
  /** 상태 */
  status: EstimateStatusV4
  
  /** 요약 (성공 시) */
  summary?: EstimateSummaryV4
  
  /** 상세 내역 (성공 시) */
  breakdown?: ProcessBlockV4[]
  
  /** 실패 정보 (실패 시) */
  failures?: EstimateFailureV4
  
  /** 메타 정보 */
  meta: EstimateMetaV4
}

/**
 * UI용 견적 결과
 */
export interface UIEstimateV4 {
  /** 성공 여부 */
  isSuccess: boolean
  
  /** 등급 코드 */
  grade: string
  
  /** 등급 브랜드명 */
  gradeName: string
  
  /** 총액 정보 */
  total: {
    /** 포맷된 총액 (예: "3,500만원") */
    formatted: string
    /** 평당 단가 (예: "평당 120만원") */
    perPyeong: string
  }
  
  /** 공정별 내역 */
  breakdown: {
    processName: string
    amount: string
    percentage: number
    materials: {
      name: string
      quantity: string
      unitPrice: string
      totalPrice: string
    }[]
    labor: {
      type: string
      amount: string
    } | null
  }[]
  
  /** 성향 매칭 정보 */
  personalityMatch: {
    score: number
    highlights: string[]
  }
  
  /** 경고 메시지 */
  warnings: string[]
  
  /** 에러 메시지 (실패 시) */
  errorMessage?: string
  
  /** 성향 분석 반영 여부 (버그 4 개선) */
  hasPersonalityData: boolean
  
  /** 성향 분석 기반 설명 (버그 4 개선) */
  personalityBasedMessage: string
}

