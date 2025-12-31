/**
 * Phase 5-1: 태그 → 예비비 정책 매핑
 * 
 * ⚠️ 절대 원칙:
 * - 점수 계산 없음
 * - 금액/비율 없음
 * - 기본값 생성 없음
 * - 해석/추론 없음
 * - 태그 → 정책 매핑만
 * - 정책은 설명 문장만 존재
 */

import type { ContingencyPolicy } from './policies'

/**
 * 태그 → 예비비 정책 매핑 테이블
 * 
 * ⚠️ 절대 원칙:
 * - 구체적 금액/비율 금지
 * - 설명 문장만 존재
 */
const TAG_TO_CONTINGENCY_POLICY: Record<string, ContingencyPolicy> = {
  OLD_RISK_HIGH: {
    id: 'contingency_old_risk',
    description: '노후 건물의 경우, 예상치 못한 보수 작업에 대비한 예비비 고려가 필요합니다.',
    relatedTags: ['OLD_RISK_HIGH'],
  },
  OLD_RISK_MEDIUM: {
    id: 'contingency_old_risk_medium',
    description: '건물 연식이 있는 경우, 추가 보수 작업 가능성을 고려한 예비비를 권장합니다.',
    relatedTags: ['OLD_RISK_MEDIUM'],
  },
  BUDGET_TIGHT: {
    id: 'contingency_budget_focus',
    description: '예산이 제한적인 경우, 예비비 계획을 신중하게 수립하는 것이 중요합니다.',
    relatedTags: ['BUDGET_TIGHT'],
  },
  DECISION_FATIGUE_HIGH: {
    id: 'contingency_decision_fatigue',
    description: '선택 피로가 높은 경우, 예비비 계획을 명확히 수립하여 추가 결정을 최소화하는 것이 좋습니다.',
    relatedTags: ['DECISION_FATIGUE_HIGH'],
  },
}

/**
 * 태그 → 예비비 정책 변환
 * 
 * ⚠️ 절대 원칙:
 * - 태그 기반 매핑만 수행
 * - 태그 없으면 빈 배열 반환 (throw 아님)
 * - 중복 태그 허용 (정렬/병합 금지)
 * 
 * @param tags V5 태그 배열
 * @returns 예비비 정책 목록
 */
export function mapTagsToContingencyPolicy(tags: string[]): ContingencyPolicy[] {
  // ⚠️ 절대 원칙: 태그 없으면 빈 배열 반환
  if (!tags || tags.length === 0) {
    return []
  }

  // ⚠️ 절대 원칙: 태그 → 정책 매핑만 수행
  // 중복 허용, 정렬/병합 금지
  const policies: ContingencyPolicy[] = []
  for (const tag of tags) {
    const policy = TAG_TO_CONTINGENCY_POLICY[tag]
    if (policy) {
      policies.push(policy)
    }
  }

  return policies
}




