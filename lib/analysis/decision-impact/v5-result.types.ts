/**
 * V5 성향분석 결과 타입 정의
 * 
 * 명세서 STEP 2 기준:
 * - DecisionImpactOutput을 기반으로 한 단일 결과 타입
 * - 점수, 레벨, 타입, 태그 등은 절대 포함하지 않음
 * - 고객 노출 가능한 정보만 포함
 */

import type { DecisionSummary } from './types';

/**
 * V5 성향분석 결과 (단일 진실 저장소)
 * 
 * DecisionImpactOutput의 decisionSummary를 기반으로 함
 * 명세서 STEP 2 출력 형식 준수
 */
export interface PersonalityV5Result {
  /**
   * 결정 요약 (고객 노출 가능)
   * 명세서 STEP 2 출력 형식
   */
  decisionSummary: DecisionSummary;

  /**
   * 내부 검증/디버깅용 (고객 미노출)
   */
  validation: {
    passed: boolean;
    reasons?: string[];
  };
}




