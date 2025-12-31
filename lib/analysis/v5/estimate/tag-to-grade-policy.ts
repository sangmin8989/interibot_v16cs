/**
 * Phase 5-1: 태그 → 등급 정책 매핑
 * 
 * ⚠️ 절대 원칙:
 * - 점수 계산 없음
 * - 가격/등급명 없음
 * - 기본값 생성 없음
 * - 해석/추론 없음
 * - 태그 → 정책 매핑만
 * - 정책은 설명 문장만 존재
 */

import type { GradePolicy } from './policies'

/**
 * 태그 → 등급 정책 매핑 테이블
 * 
 * ⚠️ 절대 원칙:
 * - 구체적 등급명/가격 금지
 * - 설명 문장만 존재
 */
const TAG_TO_GRADE_POLICY: Record<string, GradePolicy> = {
  OLD_RISK_HIGH: {
    id: 'grade_durability_focus',
    description: '노후 건물의 경우, 내구성과 품질이 우수한 등급 선택을 권장합니다.',
    relatedTags: ['OLD_RISK_HIGH'],
  },
  LONG_STAY: {
    id: 'grade_longterm_focus',
    description: '장기 거주를 고려하는 경우, 품질과 내구성이 우수한 등급 선택이 중요합니다.',
    relatedTags: ['LONG_STAY'],
  },
  BUDGET_TIGHT: {
    id: 'grade_budget_focus',
    description: '예산이 제한적인 경우, 가성비가 우수한 등급 선택을 권장합니다.',
    relatedTags: ['BUDGET_TIGHT'],
  },
  SHORT_STAY: {
    id: 'grade_shortterm_focus',
    description: '단기 거주를 고려하는 경우, 기본적인 등급 선택으로도 충분할 수 있습니다.',
    relatedTags: ['SHORT_STAY'],
  },
  SAFETY_RISK: {
    id: 'grade_safety_focus',
    description: '안전 요소가 중요한 경우, 안전 기준을 충족하는 등급 선택을 권장합니다.',
    relatedTags: ['SAFETY_RISK'],
  },
}

/**
 * 태그 → 등급 정책 변환
 * 
 * ⚠️ 절대 원칙:
 * - 태그 기반 매핑만 수행
 * - 태그 없으면 빈 배열 반환 (throw 아님)
 * - 중복 태그 허용 (정렬/병합 금지)
 * 
 * @param tags V5 태그 배열
 * @returns 등급 정책 목록
 */
export function mapTagsToGradePolicy(tags: string[]): GradePolicy[] {
  // ⚠️ 절대 원칙: 태그 없으면 빈 배열 반환
  if (!tags || tags.length === 0) {
    return []
  }

  // ⚠️ 절대 원칙: 태그 → 정책 매핑만 수행
  // 중복 허용, 정렬/병합 금지
  const policies: GradePolicy[] = []
  for (const tag of tags) {
    const policy = TAG_TO_GRADE_POLICY[tag]
    if (policy) {
      policies.push(policy)
    }
  }

  return policies
}




