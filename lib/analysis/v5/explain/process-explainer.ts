/**
 * Phase 4-1: 공정/옵션 설명 로직
 * 
 * ⚠️ 절대 원칙:
 * - 태그 생성 금지
 * - 점수 계산 금지
 * - 조건 해석 금지
 * - 결과 변경 금지
 * - 기본값 생성 금지
 * 
 * 역할: 이미 확정된 공정 변경을 문장으로 "번역"만 수행
 */

import type { TagApplicationResult } from '../tag-process-mapper'
import type { ExplainItem } from './index'
import { PROCESS_TEMPLATES } from './templates'

/**
 * 공정 설명 생성
 * 
 * 설명 대상:
 * - required / recommend / enable 만 설명
 * - disable은 설명하지 않음
 * 
 * @param processChanges 공정 변경 결과
 * @returns 공정 설명 배열
 */
export function explainProcesses(
  processChanges: TagApplicationResult
): ExplainItem[] {
  // ⚠️ 절대 원칙: 공정 생성 금지, 판단 금지
  // 이미 확정된 공정 변경만 템플릿에서 조회하여 반환

  const explanations: ExplainItem[] = []

  // required / recommend / enable 공정만 설명
  for (const change of processChanges.processChanges) {
    if (
      change.action === 'required' ||
      change.action === 'recommend' ||
      change.action === 'enable'
    ) {
      const template = PROCESS_TEMPLATES[change.processId]
      if (template) {
        explanations.push({
          key: change.processId,
          ...template,
        })
      }
      // ⚠️ 템플릿에 없으면 설명 없음 (기본값 생성 금지)
    }
    // ⚠️ disable은 설명하지 않음
  }

  return explanations
}




