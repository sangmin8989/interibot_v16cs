/**
 * V3 엔진 타입 정의
 * 
 * 5개 서브 엔진 (성향/공정/리스크/시나리오/설명)의
 * 입출력 타입을 정의합니다.
 */

import { SpaceInfo, VibeInput } from '../types'
import type { ChoiceVariables } from '../utils/choice-variables'

// ============================================================
// 1. 12개 성향 지표 (V3)
// ============================================================

export interface TraitIndicators12 {
  수납중요도: number        // T01: 0-100
  동선중요도: number        // T02: 0-100
  조명취향: number          // T03: 0-100
  소음민감도: number        // T04: 0-100
  관리민감도: number        // T05: 0-100
  스타일고집도: number      // T06: 0-100
  색감취향: number          // T07: 0-100
  가족영향도: number        // T08: 0-100
  반려동물영향도: number    // T09: 0-100
  예산탄력성: number        // T10: 0-100 (낮음=최소, 높음=투자)
  공사복잡도수용성: number  // T11: 0-100
  집값방어의식: number      // T12: 0-100
}

export type LifestyleType = 
  | 'morning'      // 아침형
  | 'evening'      // 저녁형
  | 'weekend'      // 주말형
  | 'focus'        // 집중형
  | 'general'      // 일반

export type ToneType =
  | 'empathetic'   // 공감형
  | 'logical'      // 논리형
  | 'direct'       // 직설형
  | 'warm'         // 정감형

export type BudgetRange =
  | 'low'          // 최소
  | 'medium'       // 중간
  | 'high'         // 높음
  | 'premium'      // 프리미엄

export type Grade =
  | 'basic'        // 기본형
  | 'standard'     // 스탠다드
  | 'argen'        // 아르젠
  | 'premium'      // 프리미엄

// ============================================================
// 2. 성향 엔진 (TraitEngine)
// ============================================================

export interface TraitEngineInput {
  answers: Record<string, string>  // 질문 ID → 답변 ID
  spaceInfo: SpaceInfo
  vibeInput?: VibeInput
}

export interface TraitEngineResult {
  indicators: TraitIndicators12    // 12개 성향 지표 (0-100)
  keywords: string[]                // 3-7개 성향 키워드
  priorityAreas: string[]          // 우선 문제 영역 (예: ['수납', '동선', '조명'])
  lifestyleType: LifestyleType      // 생활 루틴 유형
}

// ============================================================
// 3. 공정 엔진 (ProcessEngine)
// ============================================================

export interface ProcessEngineInput {
  traitResult: TraitEngineResult
  selectedSpaces: string[]         // 고객이 선택한 공간
  selectedProcesses?: string[]     // 고객이 선택한 공정 (옵션)
  budget: BudgetRange
}

export interface PrioritySpace {
  spaceId: string
  label: string
  priority: number                 // 1, 2, 3...
  score: number                    // 0-100
  reason: string
}

export type ProcessPriorityLevel = 'essential' | 'recommended' | 'optional'

export interface RecommendedProcess {
  id: string
  label: string
  category: string                 // 예: '주방', '욕실', '거실'
  priority: ProcessPriorityLevel
  score: number
  reason: string
  estimatedCost?: {
    basic: number
    standard: number
    argen: number
    premium: number
  }
}

export interface ProcessEngineResult {
  prioritySpaces: PrioritySpace[]           // 우선 공간 순위
  recommendedProcesses: RecommendedProcess[] // 추천 공정 리스트
  gradeRecommendation: Grade                 // 예산 등급 추천
  adjustedIndicators: TraitIndicators12      // ✅ 재보정된 성향 (양방향 모델)
}

// ============================================================
// 4. 리스크 엔진 (RiskEngine)
// ============================================================

export interface RiskEngineInput {
  adjustedIndicators: TraitIndicators12  // 재보정된 성향
  processResult: ProcessEngineResult
  spaceInfo: SpaceInfo
}

export type RiskType = 'current' | 'future' | 'missing'
export type RiskLevel = 'low' | 'medium' | 'high'
export type RiskTiming = 'immediate' | 'short_term' | 'mid_term' | 'long_term'

export interface Risk {
  id: string
  type: RiskType                    // 현재 문제 / 미래 예측 / 공정 누락
  title: string
  level: RiskLevel                  // 낮음 / 중간 / 높음
  timing: RiskTiming                // 즉시 / 단기 / 중기 / 장기
  description: string               // 리스크 설명
  impact: string                    // 예상 영향
  solution1: string                 // 1차 해결 방안
  solution2?: string                // 2차 해결 방안 (옵션)
}

export interface RiskEngineResult {
  risks: Risk[]
}

// ============================================================
// 5. 시나리오 엔진 (ScenarioEngine)
// ============================================================

export interface ScenarioEngineInput {
  adjustedIndicators: TraitIndicators12
  lifestyleType: LifestyleType
  processResult: ProcessEngineResult
  riskResult: RiskEngineResult
}

export interface LifestyleScenario {
  id: string
  category: string                  // 예: '주방', '거실', '안방', '욕실'
  title: string                     // 예: '아침전쟁형 주방'
  current: string                   // 현재 생활 모습
  futureWithout: string             // 그대로 갔을 때
  futureWith: string                // 개선 후 모습
  keyPoints: string[]               // 핵심 포인트
}

export interface ScenarioEngineResult {
  scenarios: LifestyleScenario[]    // 3-5개 시나리오
}

// ============================================================
// 6. 설명 엔진 (ExplanationEngine)
// ============================================================

export interface ExplanationEngineInput {
  traitResult: TraitEngineResult
  processResult: ProcessEngineResult
  riskResult: RiskEngineResult
  scenarioResult: ScenarioEngineResult
  toneType: ToneType
}

export interface ExplanationEngineResult {
  summary: string                   // 시작 인사 + 공감 한 문단
  traitInterpretation: string       // 고객 성향 요약 (1-2문단)
  processRecommendation: string     // 우선 공간/공정 추천 설명 (2-3문단)
  riskExplanation: string           // 리스크 설명 + 이유 + 해결안 (1-2문단)
  lifestyleStory: string            // 생활 시나리오 예시 (1-2개)
  conclusion: string                // 예산/현실 조정 + 마무리 멘트
}

// ============================================================
// 7. V3 엔진 통합 결과
// ============================================================

export interface V3EngineInput {
  answers: Record<string, string>
  spaceInfo: SpaceInfo
  vibeInput?: VibeInput
  selectedSpaces: string[]
  selectedProcesses?: string[]
  budget: BudgetRange
  // ✅ Integration Step: choiceVariables 추가
  choiceVariables?: ChoiceVariables
}

export interface V3AnalysisResult {
  // 엔진 버전
  version: '3.0.0'
  
  // 5개 엔진 결과
  traitResult: TraitEngineResult
  processResult: ProcessEngineResult
  riskResult: RiskEngineResult
  scenarioResult: ScenarioEngineResult
  explanationResult: ExplanationEngineResult
  
  // 메타데이터
  analysisId: string
  createdAt: string
  executionTime?: {
    traitEngine: number
    processEngine: number
    interventionEngine: number
    riskEngine: number
    scenarioEngine: number
    explanationEngine: number
    total: number
  }
}

// ============================================================
// 8. JSON 데이터 구조 (기준표)
// ============================================================

export interface QuestionCriteriaV3 {
  version: string
  questions: {
    quick: Record<string, QuestionDefinition>
    standard: Record<string, QuestionDefinition>
    deep: Record<string, QuestionDefinition>
  }
}

export interface QuestionDefinition {
  id: string
  text: string
  mode: 'quick' | 'standard' | 'deep'
  options: Record<string, OptionDefinition>
}

export interface OptionDefinition {
  text: string
  impact: {
    indicators?: Partial<Record<keyof TraitIndicators12, ImpactValue>>
    lifestyleType?: LifestyleType
    keywords?: string[]
  }
}

export interface ImpactValue {
  change: 'small' | 'medium' | 'large' | 'very_large'  // 영향 강도
  value: number  // -50 ~ +50
}

export interface TraitIndicatorDefinition {
  id: keyof TraitIndicators12
  name: string
  description: string
  min: number
  max: number
  default: number
  unit?: string
}

export interface ScenarioConditions {
  indicators?: Partial<Record<keyof TraitIndicators12, { min?: number; max?: number }>>
  lifestyleType?: LifestyleType | LifestyleType[]
  familySize?: { min?: number; max?: number }
  hasPets?: boolean
  hasKids?: boolean
  [key: string]: any
}

export interface LifestyleScenarioData {
  id: string
  category: string
  title: string
  conditions: ScenarioConditions
  recommendation: {
    direction: string
    priorityProcesses: string[]
    prioritySpaces: string[]
    keyPoints: string[]
  }
  scenario: {
    current: string
    futureWithout: string
    futureWith: string
  }
}

// ============================================================
// 9. V2 호환 타입 (마이그레이션용)
// ============================================================

export interface V2ToV3Adapter {
  convertV2Preferences(v2Preferences: Record<string, number>): Partial<TraitIndicators12>
  convertV3ToV2Format(v3Result: V3AnalysisResult): any
}



























