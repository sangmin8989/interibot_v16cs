/**
 * V5 성향 분석 검증 함수
 * 
 * 명세서 STEP 10: 성향 분석 검증 (PASS / FAIL)
 */

import { QUESTION_BANK } from '@/lib/data/v5-question-bank'
import type { TagApplicationResult } from './tag-process-mapper'

/**
 * 검증 결과
 */
export interface ValidationResult {
  passed: boolean
  reason?: string
  details: {
    question_count: number
    tag_count: number
    process_changes: number
    risk_messages: number
    hard_question_count: number
  }
}

/**
 * 성향 분석 검증
 * 
 * PASS 조건 (모두 충족):
 * - 질문 수 ≤ 6개
 * - 성향 태그 ≥ 2개
 * - 공정 또는 옵션 변경 ≥ 1개
 * - 리스크 문구 ≥ 1개
 * - HARD 질문 ≥ 2개
 * 
 * @param selectedQuestions 선택된 질문 ID 배열
 * @param tags 성향 태그 배열
 * @param processChanges 공정/옵션 변경 결과
 * @param riskMessages 리스크 문구 배열
 * @returns 검증 결과
 */
export function validateAnalysis(
  selectedQuestions: string[],
  tags: string[],
  processChanges: TagApplicationResult,
  riskMessages: string[]
): ValidationResult {
  const details = {
    question_count: selectedQuestions.length,
    tag_count: tags.length,
    process_changes:
      processChanges.processChanges.length + processChanges.optionChanges.length,
    risk_messages: riskMessages.length,
    hard_question_count: selectedQuestions.filter(
      (id) => QUESTION_BANK[id]?.type === 'HARD'
    ).length,
  }

  // FAIL 조건 체크
  if (details.question_count > 6) {
    return {
      passed: false,
      reason: '질문 7개 이상 (최대 6개)',
      details,
    }
  }

  if (details.tag_count < 2) {
    return {
      passed: false,
      reason: '태그 1개 이하 (최소 2개)',
      details,
    }
  }

  if (details.process_changes < 1) {
    return {
      passed: false,
      reason: '공정/옵션 변경 없음 (최소 1개)',
      details,
    }
  }

  if (details.risk_messages < 1) {
    return {
      passed: false,
      reason: '리스크 문구 없음 (최소 1개)',
      details,
    }
  }

  // HARD 질문 2개 이상 체크
  if (details.hard_question_count < 2) {
    return {
      passed: false,
      reason: 'HARD 질문 부족 (최소 2개)',
      details,
    }
  }

  return {
    passed: true,
    details,
  }
}

