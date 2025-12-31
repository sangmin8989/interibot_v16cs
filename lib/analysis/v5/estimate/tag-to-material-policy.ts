/**
 * Phase 5-1: 태그 → 자재 정책 매핑
 * 
 * ⚠️ 절대 원칙:
 * - 점수 계산 없음
 * - 가격/브랜드/자재명 없음
 * - 기본값 생성 없음
 * - 해석/추론 없음
 * - 태그 → 정책 매핑만
 * - 정책은 설명 문장만 존재
 */

import type { MaterialPolicy } from './policies'

/**
 * 태그 → 자재 정책 매핑 테이블
 * 
 * ⚠️ 절대 원칙:
 * - 구체적 자재명/브랜드/가격 금지
 * - 설명 문장만 존재
 */
const TAG_TO_MATERIAL_POLICY: Record<string, MaterialPolicy> = {
  STORAGE_RISK_HIGH: {
    id: 'material_storage_focus',
    description: '수납 공간이 부족한 경우, 효율적인 수납 시스템을 위한 자재 선택이 중요합니다.',
    relatedTags: ['STORAGE_RISK_HIGH'],
  },
  OLD_RISK_HIGH: {
    id: 'material_durability_focus',
    description: '노후 건물의 경우, 내구성과 방수 성능이 우수한 자재를 고려해야 합니다.',
    relatedTags: ['OLD_RISK_HIGH'],
  },
  OLD_RISK_MEDIUM: {
    id: 'material_maintenance_focus',
    description: '건물 연식이 있는 경우, 유지보수가 쉬운 자재 선택을 권장합니다.',
    relatedTags: ['OLD_RISK_MEDIUM'],
  },
  SAFETY_RISK: {
    id: 'material_safety_focus',
    description: '안전 요소가 중요한 경우, 미끄럼 방지 및 충돌 방지 성능이 우수한 자재를 고려해야 합니다.',
    relatedTags: ['SAFETY_RISK'],
  },
  BUDGET_TIGHT: {
    id: 'material_budget_focus',
    description: '예산이 제한적인 경우, 가성비가 우수한 자재 선택을 권장합니다.',
    relatedTags: ['BUDGET_TIGHT'],
  },
  LONG_STAY: {
    id: 'material_longterm_focus',
    description: '장기 거주를 고려하는 경우, 내구성과 품질이 우수한 자재 선택이 중요합니다.',
    relatedTags: ['LONG_STAY'],
  },
  KITCHEN_IMPORTANT: {
    id: 'material_kitchen_focus',
    description: '주방 사용이 빈번한 경우, 내구성과 청소 용이성이 우수한 자재를 고려해야 합니다.',
    relatedTags: ['KITCHEN_IMPORTANT'],
  },
  BATHROOM_COMFORT: {
    id: 'material_bathroom_focus',
    description: '욕실 편의성을 중시하는 경우, 습기 저항성과 청소 용이성이 우수한 자재를 권장합니다.',
    relatedTags: ['BATHROOM_COMFORT'],
  },
  MAINTENANCE_EASY: {
    id: 'material_maintenance_easy',
    description: '관리 편의성을 중시하는 경우, 유지보수가 쉬운 자재 선택을 권장합니다.',
    relatedTags: ['MAINTENANCE_EASY'],
  },
}

/**
 * 태그 → 자재 정책 변환
 * 
 * ⚠️ 절대 원칙:
 * - 태그 기반 매핑만 수행
 * - 태그 없으면 빈 배열 반환 (throw 아님)
 * - 중복 태그 허용 (정렬/병합 금지)
 * 
 * @param tags V5 태그 배열
 * @returns 자재 정책 목록
 */
export function mapTagsToMaterialPolicy(tags: string[]): MaterialPolicy[] {
  // ⚠️ 절대 원칙: 태그 없으면 빈 배열 반환
  if (!tags || tags.length === 0) {
    return []
  }

  // ⚠️ 절대 원칙: 태그 → 정책 매핑만 수행
  // 중복 허용, 정렬/병합 금지
  const policies: MaterialPolicy[] = []
  for (const tag of tags) {
    const policy = TAG_TO_MATERIAL_POLICY[tag]
    if (policy) {
      policies.push(policy)
    }
  }

  return policies
}




