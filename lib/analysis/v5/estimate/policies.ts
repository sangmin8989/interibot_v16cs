/**
 * Phase 5-1: 견적 최적화 정책 타입 정의
 * 
 * ⚠️ 절대 원칙:
 * - 점수 계산 없음
 * - 가격/브랜드/자재명 없음
 * - 기본값 생성 없음
 * - 해석/추론 없음
 * - 태그 → 정책 매핑만
 * - 정책은 설명 문장만 존재
 */

/**
 * 자재 정책
 * 
 * 태그 기반으로 자재 선택 방향을 제시
 * (구체적 자재명/브랜드/가격 없음)
 */
export interface MaterialPolicy {
  /** 정책 ID (태그 기반) */
  id: string
  /** 정책 설명 (문장만) */
  description: string
  /** 관련 태그 */
  relatedTags: string[]
}

/**
 * 등급 정책
 * 
 * 태그 기반으로 등급 선택 방향을 제시
 * (구체적 등급명/가격 없음)
 */
export interface GradePolicy {
  /** 정책 ID (태그 기반) */
  id: string
  /** 정책 설명 (문장만) */
  description: string
  /** 관련 태그 */
  relatedTags: string[]
}

/**
 * 예비비 정책
 * 
 * 태그 기반으로 예비비 고려 방향을 제시
 * (구체적 금액/비율 없음)
 */
export interface ContingencyPolicy {
  /** 정책 ID (태그 기반) */
  id: string
  /** 정책 설명 (문장만) */
  description: string
  /** 관련 태그 */
  relatedTags: string[]
}

/**
 * 견적 최적화 정책 통합 결과
 */
export interface EstimateOptimization {
  /** 자재 정책 목록 */
  materialPolicy: MaterialPolicy[]
  /** 등급 정책 목록 */
  gradePolicy: GradePolicy[]
  /** 예비비 정책 목록 */
  contingencyPolicy: ContingencyPolicy[]
}




