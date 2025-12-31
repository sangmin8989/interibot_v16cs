/**
 * V4 성향 분석 타입 정의
 */

/**
 * 성향 점수 항목
 * - 기존 V3의 점수 체계 유지
 */
export interface TraitScoreV4 {
  /** 성향 코드 (예: 'storage_importance', 'noise_sensitivity') */
  traitCode: string
  
  /** 점수 (1-10) */
  score: number
  
  /** 신뢰도 (0-1) */
  confidence: number
}

/**
 * 타입 분류 결과
 * - V4 신규: 성향을 직관적인 타입으로 분류
 */
export interface ClassifiedTypesV4 {
  /** 생활 유형 (예: ['remote_work', 'cooking_focused']) */
  lifestyle: string[]
  
  /** 가족 유형 (예: ['has_infant', 'has_elderly']) */
  family: string[]
  
  /** 성격 유형 (예: ['clean_oriented', 'minimalist']) */
  personality: string[]
  
  /** 의사결정 유형 */
  decision: 'solo' | 'joint' | 'split'
}

/**
 * 위험 평가 결과
 * - V4 신규: 후회 위험 분석
 */
export interface RiskAssessmentV4 {
  /** 총 위험 점수 (0-100) */
  totalScore: number
  
  /** 위험 수준 */
  level: 'low' | 'medium' | 'high'
  
  /** 발동된 위험 요소 목록 */
  triggeredRisks: string[]
  
  /** 권장 예비비 비율 (%) */
  bufferPercentage: number
}

/**
 * 문제 유형 분류
 * - V4 신규: 입지형 vs 공간형 불편 분류
 */
export interface ProblemClassificationV4 {
  /** 입지형 불편 점수 (0-1) */
  locationScore: number
  
  /** 공간형 불편 점수 (0-1) */
  spaceScore: number
  
  /** 권장 행동 */
  recommendation: 'move' | 'remodel' | 'both'
  
  /** 권장 이유 메시지 */
  message: string
}

/**
 * 성향 분석 최종 결과
 */
export interface PersonalityResultV4 {
  /** 성향 점수 목록 (기존 V3 호환) */
  traitScores: TraitScoreV4[]
  
  /** 분류된 타입 (V4 신규) */
  classifiedTypes: ClassifiedTypesV4
  
  /** 위험 평가 (V4 신규) */
  riskAssessment: RiskAssessmentV4
  
  /** 문제 유형 분류 (V4 신규) */
  problemClassification: ProblemClassificationV4
  
  /** 분석 시각 */
  analyzedAt: string
}








