/**
 * V4 전략 결정 타입 정의
 */

/**
 * V4 등급 타입
 */
export type GradeV4 = 'ARGEN_E' | 'ARGEN_S' | 'ARGEN_O'

/**
 * 등급 메타 정보
 */
export interface GradeInfoV4 {
  /** 등급 코드 */
  code: GradeV4
  
  /** 브랜드명 */
  name: string
  
  /** 설명 */
  description: string
  
  /** 기존 등급 매핑 */
  legacyGrade: 'BASIC' | 'STANDARD' | 'ARGEN' | 'PREMIUM'
  
  /** 가격 배율 (ARGEN_S = 1.0 기준) */
  priceMultiplier: number
}

/**
 * 공정 전략 항목
 */
export interface ProcessStrategyItemV4 {
  /** 공정 ID */
  processId: string
  
  /** 우선순위 */
  priority: 'must' | 'recommended' | 'optional'
  
  /** 추천 이유 */
  reason: string
  
  /** 성향 매칭도 (0-1) */
  personalityMatch: number
}

/**
 * 옵션 전략 항목
 */
export interface OptionStrategyItemV4 {
  /** 공정 ID */
  processId: string
  
  /** 추천 옵션 목록 */
  recommendedOptions: {
    optionId: string
    reason: string
    personalityScore: number
  }[]
  
  /** 회피 옵션 목록 */
  avoidOptions: {
    optionId: string
    reason: string
  }[]
}

/**
 * 예산 전략
 */
export interface BudgetStrategyV4 {
  /** 목표 총액 */
  targetTotal: number
  
  /** 예비비 금액 */
  bufferAmount: number
  
  /** 공정별 예산 비중 */
  priorityAllocation: Record<string, number>
}

/**
 * 전략 결정 최종 결과
 */
export interface StrategyResultV4 {
  /** 추천 등급 */
  recommendedGrade: GradeV4
  
  /** 등급 선택 이유 */
  gradeReason: string
  
  /** 공정별 전략 */
  processStrategy: ProcessStrategyItemV4[]
  
  /** 옵션별 전략 */
  optionStrategy: OptionStrategyItemV4[]
  
  /** 예산 전략 */
  budgetStrategy: BudgetStrategyV4
}








