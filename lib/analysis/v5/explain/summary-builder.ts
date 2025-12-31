/**
 * Phase 4-1: 요약 문장 생성
 * 
 * ⚠️ 절대 원칙:
 * - 태그 + 공정 설명 결과만 사용
 * - 최대 2~3문장
 * - 감정·과장 표현 금지
 * 
 * 역할: 이미 생성된 설명을 조합하여 요약만 수행
 */

import type { ExplainItem } from './index'

/**
 * 요약 문장 생성
 * 
 * 원칙:
 * - 태그 + 공정 설명 결과만 사용
 * - 최대 2~3문장
 * - 감정·과장 표현 금지
 * 
 * @param tagReasons 태그 설명 배열
 * @param processReasons 공정 설명 배열
 * @returns 요약 문장
 */
export function buildSummary(
  tagReasons: ExplainItem[],
  processReasons: ExplainItem[]
): string {
  // ⚠️ 절대 원칙: 판단/분기 금지
  // 이미 생성된 설명만 조합

  // ⚠️ 절대 원칙: 기본값 생성 금지
  // 설명이 없으면 빈 문자열 반환 (없는 정보는 없다)
  if (tagReasons.length === 0 && processReasons.length === 0) {
    return ''
  }

  const parts: string[] = []

  // 태그 설명 첫 번째 항목 사용
  if (tagReasons.length > 0) {
    parts.push(tagReasons[0].title)
  }

  // 공정 설명 첫 번째 항목 사용
  if (processReasons.length > 0) {
    parts.push(processReasons[0].title)
  }

  // 요약 문장 조합
  // ⚠️ 절대 원칙: 기본값 생성 금지
  if (parts.length === 0) {
    return ''
  }

  if (parts.length === 1) {
    return `이번 인테리어에서는 ${parts[0]}을 중심으로 설계가 구성되었습니다.`
  }

  return `이번 인테리어에서는 ${parts[0]}을 중심으로, ${parts[1]} 방향으로 설계가 구성되었습니다.`
}




