/**
 * Phase 4-1: 태그 설명 로직
 * 
 * ⚠️ 절대 원칙:
 * - 태그 생성 금지
 * - 점수 계산 금지
 * - 조건 해석 금지
 * - 결과 변경 금지
 * - 기본값 생성 금지
 * 
 * 역할: 이미 확정된 태그를 문장으로 "번역"만 수행
 */

import type { PersonalityTags } from '../types'
import type { ExplainItem } from './index'
import { TAG_TEMPLATES } from './templates'

/**
 * 태그 설명 생성
 * 
 * 핵심 원칙:
 * - 1 태그 → 1 설명
 * - 태그 없으면 설명 없음
 * - 순서 고정 (태그 입력 순서 유지)
 * 
 * @param tags V5 성향 태그
 * @returns 태그 설명 배열
 */
export function explainTags(tags: PersonalityTags): ExplainItem[] {
  // ⚠️ 절대 원칙: 태그 생성 금지, 판단 금지
  // 이미 확정된 태그만 템플릿에서 조회하여 반환

  return tags.tags
    .map((tag) => TAG_TEMPLATES[tag])
    .filter((item): item is ExplainItem => item !== undefined)
  // ⚠️ 태그가 템플릿에 없으면 설명 없음 (기본값 생성 금지)
}




