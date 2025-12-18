/**
 * V5 성향분석 엔진 타입 정의
 * 
 * 인테리봇 성향분석 엔진 v5 명세서 기반
 */

/**
 * 기본 정보 입력 (V5 명세서 STEP 1)
 */
export interface BasicInfoInput {
  // 필수 필드 (7개)
  housing_type: 'apartment' | 'villa' | 'officetel' | 'detached'
  pyeong_range: 'under10' | '11to15' | '16to25' | '26to40' | 'over40'
  building_year: number // 예: 2000
  ownership: 'owned' | 'jeonse' | 'monthly'
  stay_plan: 'under1y' | '1to3y' | '3to5y' | 'over5y' | 'unknown'
  family_type: ('infant' | 'child' | 'teen' | 'adult' | 'elderly' | 'pet')[]
  budget_range: 'under2000' | '2000to4000' | '4000to6000' | 'over6000' | 'unknown'
  
  // 선택 필드 (3개)
  purpose?: 'live' | 'sell' | 'rent'
  remote_work?: 'none' | '1to2days' | '3plus'
  cook_freq?: 'rarely' | 'sometimes' | 'daily'
}

/**
 * 가설 결과 (V5 명세서 STEP 2)
 */
export interface HypothesisResult {
  old_risk: 'HIGH' | 'MEDIUM' | 'LOW' // 노후 리스크
  storage_risk: 'HIGH' | 'MEDIUM' | 'LOW' // 수납 리스크
  short_stay: 'HIGH' | 'MEDIUM' | 'LOW' // 단기 거주
  safety_risk: 'HIGH' | 'MEDIUM' | 'LOW' // 안전 리스크
  budget_risk: 'HIGH' | 'MEDIUM' | 'LOW' // 예산 리스크
  decision_fatigue: 'HIGH' | 'MEDIUM' | 'LOW' // 결정 피로
  kitchen_risk: 'HIGH' | 'MEDIUM' | 'LOW' // 주방 리스크
  workspace: 'HIGH' | 'MEDIUM' | 'LOW' // 작업공간
}

/**
 * 질문 타입
 */
export type QuestionType = 'HARD' | 'SEMI' | 'SOFT'

/**
 * 질문 메타데이터
 */
export interface QuestionMetadata {
  id: string
  text: string
  type: QuestionType
  category: string
  trigger_hypothesis: keyof HypothesisResult | null
  affected_processes: number
  cost_diff: number // 만원 단위
  claim_reduction: number // 퍼센트
  options: string[]
}

/**
 * 질문 점수
 */
export interface QuestionScore {
  question_id: string
  process_impact: number
  cost_impact: number
  risk_reduction: number
  hypothesis_match: number
  overlap_penalty: number
  total_score: number
}

/**
 * 성향 태그
 */
export interface PersonalityTags {
  tags: string[]
  triggered_by: Record<string, string> // 태그 -> 트리거 질문
}

