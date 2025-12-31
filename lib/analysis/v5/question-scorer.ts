/**
 * V5 질문 점수 계산 함수
 * 
 * 명세서 STEP 4: 질문 중요도 점수 계산
 * 
 * 점수 공식:
 * 총점 = (공정영향도 × 0.3) + (비용영향도 × 0.25) + (리스크감소 × 0.25) + (가설연관도 × 0.15) - 중복감점
 */

import type { HypothesisResult, QuestionScore } from './types'
import { QUESTION_BANK } from '@/lib/data/v5-question-bank'

/**
 * 질문 점수 계산
 * 
 * @param questionId 질문 ID
 * @param hypothesis 가설 결과
 * @param selectedQuestions 이미 선택된 질문 ID 배열
 * @returns 질문 점수
 */
export function calculateQuestionScore(
  questionId: string,
  hypothesis: HypothesisResult,
  selectedQuestions: string[]
): QuestionScore {
  const meta = QUESTION_BANK[questionId]
  
  if (!meta) {
    throw new Error(`질문 ${questionId}를 찾을 수 없습니다.`)
  }

  // 1. 공정 영향도 (최대 30점)
  const process_impact = Math.min(meta.affected_processes * 10, 30)

  // 2. 비용 영향도 (최대 25점)
  const cost_impact = Math.min(meta.cost_diff / 100, 25)

  // 3. 리스크 감소 (최대 25점)
  const risk_reduction = Math.min(meta.claim_reduction * 0.5, 25)

  // 4. 가설 연관도 (최대 15점)
  let hypothesis_match = 5 // 기본값
  if (meta.trigger_hypothesis) {
    const level = hypothesis[meta.trigger_hypothesis]
    hypothesis_match = level === 'HIGH' ? 15 : level === 'MEDIUM' ? 10 : 5
  }

  // 5. 중복 감점 (-5점)
  let overlap_penalty = 0
  for (const selected of selectedQuestions) {
    const selectedMeta = QUESTION_BANK[selected]
    if (selectedMeta && selectedMeta.category === meta.category) {
      overlap_penalty = -5
      break
    }
  }

  // 총점 계산
  const total_score =
    process_impact * 0.3 +
    cost_impact * 0.25 +
    risk_reduction * 0.25 +
    hypothesis_match * 0.15 +
    overlap_penalty

  return {
    question_id: questionId,
    process_impact,
    cost_impact,
    risk_reduction,
    hypothesis_match,
    overlap_penalty,
    total_score,
  }
}

/**
 * 여러 질문의 점수 계산
 */
export function calculateQuestionScores(
  questionIds: string[],
  hypothesis: HypothesisResult,
  selectedQuestions: string[] = []
): QuestionScore[] {
  return questionIds.map((id) =>
    calculateQuestionScore(id, hypothesis, selectedQuestions)
  )
}








