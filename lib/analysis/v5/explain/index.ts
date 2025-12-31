/**
 * Phase 4-1: Explain Layer 메인 모듈
 * 
 * ⚠️ 절대 원칙:
 * - Explain Layer는 절대 판단하지 않는다
 * - 이미 확정된 태그를 문장으로 "번역"만 수행
 * - 고정 템플릿 기반 문장 조합
 * 
 * 구조:
 * V5 Core Engine
 *  ├─ tags (확정)
 *  ├─ processChanges (확정)
 *  └─ explainLayer (추가)
 *         ├─ tagReasons
 *         ├─ processReasons
 *         └─ summary
 */

import type { PersonalityTags } from '../types'
import type { TagApplicationResult } from '../tag-process-mapper'
import type { BasicInfoInput } from '../types'
import { explainTags } from './tag-explainer'
import { explainProcesses } from './process-explainer'
import { buildSummary } from './summary-builder'

/**
 * 설명 항목
 */
export interface ExplainItem {
  key: string
  title: string
  description: string
}

/**
 * Explain Layer 입력
 * 
 * ⚠️ basicInfo는 문장 표현 보조용
 * (판단/분기 절대 금지)
 */
export interface ExplainInput {
  tags: PersonalityTags
  processChanges: TagApplicationResult
  basicInfo: BasicInfoInput
}

/**
 * Explain Layer 출력
 */
export interface ExplainResult {
  tagReasons: ExplainItem[]
  processReasons: ExplainItem[]
  summary: string
}

/**
 * V5 결과 설명 생성
 * 
 * ⚠️ 절대 원칙:
 * - 태그 생성 금지
 * - 점수 계산 금지
 * - 조건 해석 금지
 * - 결과 변경 금지
 * - 기본값 생성 금지
 * 
 * 역할: 이미 확정된 결과를 문장으로 "번역"만 수행
 * 
 * @param input Explain 입력
 * @returns Explain 결과
 */
export function explainV5Result(input: ExplainInput): ExplainResult {
  // ⚠️ 절대 원칙: 판단/분기 금지
  // 이미 확정된 태그와 공정 변경만 템플릿에서 조회

  // 1. 태그 설명 생성
  const tagReasons = explainTags(input.tags)

  // 2. 공정 설명 생성
  const processReasons = explainProcesses(input.processChanges)

  // 3. 요약 문장 생성
  const summary = buildSummary(tagReasons, processReasons)

  return {
    tagReasons,
    processReasons,
    summary,
  }
}




