/**
 * Phase 3: 질문 조건 게이팅
 * 
 * 질문은 조건 게이팅을 먼저 거친다
 * - 아이 관련 질문은 childrenCount > 0 일 때만 노출
 * - 질문 생략은 허용하되, 무작위는 금지
 */

import { judgmentAxesQuestions } from '../questions/judgment-axes'
import type { Question } from '../questions/types'

/**
 * 사용자 컨텍스트 (질문 게이팅용)
 */
export interface UserContext {
  /** 자녀 수 (아이 관련 질문 게이팅용) */
  childrenCount?: number
  
  /** 가족 구성원 수 */
  familySize?: number
  
  /** 기타 컨텍스트 정보 */
  [key: string]: unknown
}

/**
 * 질문 게이팅 규칙
 */
interface GatingRule {
  /** 질문 ID */
  questionId: string
  
  /** 게이팅 조건 함수 */
  condition: (context: UserContext) => boolean
  
  /** 게이팅 실패 시 메시지 */
  skipReason?: string
}

/**
 * 질문 게이팅 규칙 정의
 */
const GATING_RULES: GatingRule[] = [
  // 현재는 아이 관련 질문이 없지만, 향후 확장을 위해 구조만 준비
  // {
  //   questionId: 'judgment_children_safety',
  //   condition: (context) => (context.childrenCount || 0) > 0,
  //   skipReason: '자녀가 없어서 이 질문은 건너뜁니다.'
  // }
]

/**
 * 질문이 표시 가능한지 확인
 * 
 * @param questionId - 질문 ID
 * @param context - 사용자 컨텍스트
 * @returns 표시 가능 여부 및 건너뛴 이유
 */
export function canShowQuestion(
  questionId: string,
  context: UserContext = {}
): { canShow: boolean; skipReason?: string } {
  const rule = GATING_RULES.find(r => r.questionId === questionId)
  
  if (!rule) {
    // 규칙이 없으면 항상 표시
    return { canShow: true }
  }

  const canShow = rule.condition(context)
  
  return {
    canShow,
    skipReason: !canShow ? rule.skipReason : undefined
  }
}

/**
 * 조건 게이팅을 거친 질문 목록 반환
 * 
 * @param context - 사용자 컨텍스트
 * @returns 표시 가능한 질문 목록
 */
export function getGatedQuestions(context: UserContext = {}): Question[] {
  return judgmentAxesQuestions.filter(question => {
    const { canShow } = canShowQuestion(question.id, context)
    return canShow
  })
}

/**
 * 질문 필터링 (건너뛴 질문 제외)
 * 
 * @param questionIds - 질문 ID 목록
 * @param context - 사용자 컨텍스트
 * @returns 표시 가능한 질문 ID 목록
 */
export function filterGatedQuestionIds(
  questionIds: string[],
  context: UserContext = {}
): string[] {
  return questionIds.filter(id => {
    const { canShow } = canShowQuestion(id, context)
    return canShow
  })
}













