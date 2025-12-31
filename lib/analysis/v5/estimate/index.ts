/**
 * Phase 5-1: 견적 최적화 정책 통합 모듈
 * 
 * ⚠️ 절대 원칙:
 * - 점수 계산 없음
 * - 가격/브랜드/자재명 없음
 * - 기본값 생성 없음
 * - 해석/추론 없음
 * - 태그 → 정책 매핑만
 * - 정책은 설명 문장만 존재
 */

export type { EstimateOptimization } from './policies'
import type { EstimateOptimization } from './policies'
import { mapTagsToMaterialPolicy } from './tag-to-material-policy'
import { mapTagsToGradePolicy } from './tag-to-grade-policy'
import { mapTagsToContingencyPolicy } from './tag-to-contingency-policy'

/**
 * 견적 최적화 정책 생성
 * 
 * ⚠️ 절대 원칙:
 * - 태그 기반 매핑만 수행
 * - 태그 없으면 빈 배열 반환 (throw 아님)
 * - 중복 태그 허용 (정렬/병합 금지)
 * - 정책 우선순위 정의하지 않음 (UI/견적 엔진에 위임)
 * 
 * @param tags V5 태그 배열
 * @returns 견적 최적화 정책
 */
export function buildEstimateOptimization(tags: string[]): EstimateOptimization {
  // ⚠️ 절대 원칙: 태그 없으면 빈 배열 반환
  if (!tags || tags.length === 0) {
    return {
      materialPolicy: [],
      gradePolicy: [],
      contingencyPolicy: [],
    }
  }

  // ⚠️ 절대 원칙: 태그 → 정책 매핑만 수행
  // 중복 허용, 정렬/병합 금지
  const materialPolicy = mapTagsToMaterialPolicy(tags)
  const gradePolicy = mapTagsToGradePolicy(tags)
  const contingencyPolicy = mapTagsToContingencyPolicy(tags)

  return {
    materialPolicy,
    gradePolicy,
    contingencyPolicy,
  }
}




