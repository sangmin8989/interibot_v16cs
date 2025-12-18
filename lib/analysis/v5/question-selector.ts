/**
 * V5 질문 선별 함수
 * 
 * 명세서 STEP 5: 상위 질문 선별 (최대 6개)
 * 
 * 규칙:
 * - 최대 6개
 * - HARD 질문 최소 2개
 * - SOFT 질문 단독 노출 금지
 */

import type { HypothesisResult } from './types'
import { QUESTION_BANK, getQuestionsByType } from '@/lib/data/v5-question-bank'
import { calculateQuestionScore } from './question-scorer'

/**
 * 질문 후보군 생성
 * 
 * 명세서 STEP 3: 가설 → 질문 매핑
 */
export function getQuestionCandidates(hypothesis: HypothesisResult): string[] {
  const candidates: string[] = []

  // 노후 리스크
  if (hypothesis.old_risk === 'HIGH') {
    candidates.push('Q01', 'Q02', 'Q03')
  } else if (hypothesis.old_risk === 'MEDIUM') {
    candidates.push('Q01', 'Q02')
  }

  // 수납 리스크
  if (hypothesis.storage_risk === 'HIGH') {
    candidates.push('Q04', 'Q05')
  } else if (hypothesis.storage_risk === 'MEDIUM') {
    candidates.push('Q04')
  }

  // 단기 거주
  if (hypothesis.short_stay === 'HIGH') {
    candidates.push('Q06', 'Q07')
  } else if (hypothesis.short_stay === 'MEDIUM') {
    candidates.push('Q06')
  }

  // 안전 리스크
  if (hypothesis.safety_risk === 'HIGH') {
    candidates.push('Q08')
  }

  // 예산 리스크
  if (hypothesis.budget_risk === 'HIGH') {
    candidates.push('Q09')
  }

  // 결정 피로
  if (hypothesis.decision_fatigue !== 'LOW') {
    candidates.push('Q10', 'Q11')
  }

  // 주방 리스크
  if (hypothesis.kitchen_risk === 'HIGH') {
    candidates.push('Q12', 'Q13')
  } else if (hypothesis.kitchen_risk === 'MEDIUM') {
    candidates.push('Q12')
  }

  // 작업공간
  if (hypothesis.workspace === 'HIGH') {
    candidates.push('Q14')
  }

  // 항상 포함 (스타일 소거)
  candidates.push('Q15')

  // 항상 포함 (관리)
  candidates.push('Q17')

  // 중복 제거
  return Array.from(new Set(candidates))
}

/**
 * 상위 질문 선별
 * 
 * @param hypothesis 가설 결과
 * @param maxCount 최대 질문 개수 (기본 6개)
 * @returns 선별된 질문 ID 배열
 */
export function selectTopQuestions(
  hypothesis: HypothesisResult,
  maxCount: number = 6
): string[] {
  // 1. 후보군 생성
  const candidates = getQuestionCandidates(hypothesis)

  // 2. 모든 후보 점수 계산
  const scores = candidates.map((qid) =>
    calculateQuestionScore(qid, hypothesis, [])
  )

  // 3. 점수 내림차순 정렬
  scores.sort((a, b) => b.total_score - a.total_score)

  // 4. HARD 질문 최소 2개 보장
  const hardQuestions = scores.filter(
    (s) => QUESTION_BANK[s.question_id].type === 'HARD'
  )
  const hardSelected = hardQuestions.slice(0, 2).map((s) => s.question_id)
  const selected: string[] = [...hardSelected]

  // 5. 나머지 점수순 선택 (최대 6개까지)
  for (const score of scores) {
    if (selected.length >= maxCount) break
    if (selected.includes(score.question_id)) continue

    const meta = QUESTION_BANK[score.question_id]

    // SOFT 단독 방지
    if (meta.type === 'SOFT') {
      const hasHardOrSemi = selected.some(
        (id) => QUESTION_BANK[id].type !== 'SOFT'
      )
      if (!hasHardOrSemi) continue
    }

    selected.push(score.question_id)
  }

  return selected
}

