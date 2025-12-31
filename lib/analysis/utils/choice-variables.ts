/**
 * Phase 3: 선택권 변수 계산
 * 
 * 질문 답변을 점수가 아니라 선택권 변수에 직접 반영
 * - optionCount: 선택지 개수 (2, 3, 4)
 * - lockStrength: 잠금 강도 (0~100)
 * - defaultPlan: 기본 계획 (기본값 고정 여부)
 */

import type { Question } from '../questions/types'

/**
 * 선택권 변수
 */
export interface ChoiceVariables {
  /** 선택지 개수 (2, 3, 4) */
  optionCount: 2 | 3 | 4
  
  /** 잠금 강도 (0~100, 높을수록 강한 잠금) */
  lockStrength: number
  
  /** 기본 계획 고정 여부 */
  defaultPlan: boolean
}

/**
 * 질문 답변을 선택권 변수에 직접 반영
 * 
 * @param questionId - 질문 ID
 * @param answerValue - 답변 값
 * @param allAnswers - 모든 답변 (컨텍스트용)
 * @returns 선택권 변수
 */
export function calculateChoiceVariables(
  questionId: string,
  answerValue: string,
  allAnswers: Record<string, string> = {}
): Partial<ChoiceVariables> {
  // 넘기기 선택 시 기본값 반환 (변화 없음)
  if (answerValue === 'skip') {
    return {}
  }

  const result: Partial<ChoiceVariables> = {}

  // Q1: judgment_irreversible_priority (리스크 회피도)
  if (questionId === 'judgment_irreversible_priority') {
    switch (answerValue) {
      case 'strongly_agree':
        result.lockStrength = 80
        result.optionCount = 2
        result.defaultPlan = true
        break
      case 'agree':
        result.lockStrength = 60
        result.optionCount = 3
        result.defaultPlan = true
        break
      case 'neutral':
        result.lockStrength = 40
        result.optionCount = 3
        result.defaultPlan = false
        break
      case 'disagree':
        result.lockStrength = 20
        result.optionCount = 4
        result.defaultPlan = false
        break
      case 'ai_choice':
        result.lockStrength = 70
        result.optionCount = 2
        result.defaultPlan = true
        break
    }
  }

  // Q2: judgment_construction_dislike (리스크 회피도 + 결정 지연 성향)
  if (questionId === 'judgment_construction_dislike') {
    switch (answerValue) {
      case 'defect':
        result.lockStrength = 75
        result.optionCount = 2
        result.defaultPlan = true
        break
      case 'additional_cost':
        result.lockStrength = 50
        result.optionCount = 3
        result.defaultPlan = false
        break
      case 'delay':
        result.lockStrength = 30
        result.optionCount = 3
        result.defaultPlan = false
        break
      case 'decision_stress':
        result.lockStrength = 65
        result.optionCount = 2
        result.defaultPlan = true
        break
      case 'ai_choice':
        result.lockStrength = 60
        result.optionCount = 2
        result.defaultPlan = true
        break
    }
  }

  // Q3: judgment_choice_preference (통제 욕구)
  if (questionId === 'judgment_choice_preference') {
    switch (answerValue) {
      case 'ai_recommend':
        result.lockStrength = 70
        result.optionCount = 2
        result.defaultPlan = true
        break
      case 'compare_2_3':
        result.lockStrength = 40
        result.optionCount = 3
        result.defaultPlan = false
        break
      case 'detail_select':
        result.lockStrength = 10
        result.optionCount = 4
        result.defaultPlan = false
        break
      case 'ai_choice':
        result.lockStrength = 50
        result.optionCount = 3
        result.defaultPlan = false
        break
    }
  }

  // Q4: judgment_decision_delay (결정 지연 성향)
  if (questionId === 'judgment_decision_delay') {
    switch (answerValue) {
      case 'fear_loss':
        result.lockStrength = 70
        result.optionCount = 2
        result.defaultPlan = true
        break
      case 'too_many':
        result.lockStrength = 60
        result.optionCount = 2
        result.defaultPlan = true
        break
      case 'lack_info':
        result.lockStrength = 50
        result.optionCount = 3
        result.defaultPlan = false
        break
      case 'family_opinion':
        result.lockStrength = 45
        result.optionCount = 3
        result.defaultPlan = false
        break
      case 'ai_choice':
        result.lockStrength = 55
        result.optionCount = 2
        result.defaultPlan = true
        break
    }
  }

  // Q5: judgment_inconvenience_preference (비용 민감도 + 리스크 회피도)
  if (questionId === 'judgment_inconvenience_preference') {
    switch (answerValue) {
      case 'redo_construction':
        result.lockStrength = 80
        result.optionCount = 2
        result.defaultPlan = true
        break
      case 'more_money':
        result.lockStrength = 35
        result.optionCount = 4
        result.defaultPlan = false
        break
      case 'both':
        result.lockStrength = 65
        result.optionCount = 2
        result.defaultPlan = true
        break
      case 'neither':
        result.lockStrength = 20
        result.optionCount = 4
        result.defaultPlan = false
        break
      case 'ai_choice':
        result.lockStrength = 60
        result.optionCount = 2
        result.defaultPlan = true
        break
    }
  }

  // Q6: judgment_maintenance_tradeoff (비용 민감도)
  if (questionId === 'judgment_maintenance_tradeoff') {
    switch (answerValue) {
      case 'strongly_agree':
        result.lockStrength = 30
        result.optionCount = 4
        result.defaultPlan = false
        break
      case 'agree':
        result.lockStrength = 40
        result.optionCount = 3
        result.defaultPlan = false
        break
      case 'neutral':
        result.lockStrength = 50
        result.optionCount = 3
        result.defaultPlan = false
        break
      case 'disagree':
        result.lockStrength = 60
        result.optionCount = 2
        result.defaultPlan = true
        break
      case 'ai_choice':
        result.lockStrength = 55
        result.optionCount = 2
        result.defaultPlan = true
        break
    }
  }

  return result
}

/**
 * 모든 답변을 종합하여 최종 선택권 변수 계산
 * 
 * @param answers - 모든 질문 답변
 * @returns 최종 선택권 변수
 */
export function aggregateChoiceVariables(
  answers: Record<string, string>
): ChoiceVariables {
  // 기본값
  let optionCount: 2 | 3 | 4 = 3
  let lockStrength = 50
  let defaultPlan = false

  // 각 답변의 영향 누적
  const lockStrengths: number[] = []
  const optionCounts: (2 | 3 | 4)[] = []
  const defaultPlans: boolean[] = []

  Object.entries(answers).forEach(([questionId, answerValue]) => {
    if (answerValue === 'skip') return // 넘기기는 무시

    const variables = calculateChoiceVariables(questionId, answerValue, answers)
    
    if (variables.lockStrength !== undefined) {
      lockStrengths.push(variables.lockStrength)
    }
    if (variables.optionCount !== undefined) {
      optionCounts.push(variables.optionCount)
    }
    if (variables.defaultPlan !== undefined) {
      defaultPlans.push(variables.defaultPlan)
    }
  })

  // 평균 계산
  if (lockStrengths.length > 0) {
    lockStrength = Math.round(lockStrengths.reduce((a, b) => a + b, 0) / lockStrengths.length)
  }

  // optionCount는 가장 작은 값 사용 (보수적 접근)
  if (optionCounts.length > 0) {
    optionCount = Math.min(...optionCounts) as 2 | 3 | 4
  }

  // defaultPlan은 하나라도 true면 true
  if (defaultPlans.length > 0) {
    defaultPlan = defaultPlans.some(p => p === true)
  }

  return {
    optionCount,
    lockStrength: Math.max(0, Math.min(100, lockStrength)),
    defaultPlan
  }
}




















