/**
 * 인테리봇 성향분석 엔진 개편 - 타입 정의
 * 
 * 명세서 vFinal 기준
 */

import type { PreferenceCategory } from '../questions/types';
import type { SpaceInfo } from '../types';

// ============================================
// 1. 성향 레벨 타입
// ============================================

/**
 * 성향 레벨 (점수로부터 파생)
 */
export type TraitLevel = 'LOW' | 'MID' | 'HIGH';

// ============================================
// 2. 성향 평가 타입
// ============================================

/**
 * 성향 평가 결과
 * - score: 1~10 점수
 * - evidenceCount: 이 성향에 영향을 준 질문 개수
 * - level: score로부터 파생된 레벨
 */
export interface TraitEvaluation {
  score: number;          // 1~10
  evidenceCount: number;  // "이 성향에 영향을 준 질문 개수"
  level: TraitLevel;      // score로부터 파생
}

// ============================================
// 3. 우선순위 그룹 타입
// ============================================

/**
 * 우선순위 그룹 (충돌 해결용)
 * traitPriority.ts에서 정의됨
 */
export type PriorityGroup = 
  | 'safety'        // 안전 / 가족 / 건강
  | 'budget'        // 예산 통제
  | 'maintenance'   // 유지관리
  | 'family'        // 가족 구성
  | 'function'      // 기능/동선
  | 'lifestyle'     // 생활/취미
  | 'aesthetic';    // 미감/취향

// ============================================
// 4. 결정 요약 타입
// ============================================

/**
 * 결정 요약 (외부 노출 결과)
 * - coreCriteria: 이번 판단의 기준 2~3개
 * - appliedChanges: 포함/제외된 공정·옵션 (사람이 읽는 문장)
 * - excludedItems: 가정/제외된 항목
 * - risks: 리스크 경고 (1~3개, 조건 기반)
 */
export interface DecisionSummary {
  coreCriteria: string[];     // 2~3개
  appliedChanges: string[];   // 공정/옵션 변화 목록(사람이 읽는 문장)
  excludedItems: string[];    // 가정/제외
  risks: string[];            // 1~3개 (조건 기반)
}

// ============================================
// 5. 영향 매핑 타입 (traitImpactMap용)
// ============================================

/**
 * 영향 허용 범위
 */
export interface ImpactAllow {
  forceProcess: boolean;      // 공정 강제 허용 여부
  defaultOptions: boolean;     // 옵션 기본값 설정 허용 여부
  excludeOptions: boolean;     // 옵션 제외 허용 여부
}

/**
 * 성향 영향 규칙
 */
export interface TraitImpactRule {
  allow: ImpactAllow;
  impacts: {
    processIncludes?: string[];   // 포함할 공정 코드 목록
    processExcludes?: string[];   // 제외할 공정 코드 목록
    optionDefaults?: string[];     // 기본값으로 설정할 옵션 코드 목록
    optionExcludes?: string[];    // 제외할 옵션 코드 목록
    riskMessage: string;          // 리스크 경고 문구 (필수)
  };
}

/**
 * 성향별 영향 정의
 * - priorityGroup: 우선순위 그룹 (필수)
 * - HIGH: HIGH 레벨일 때의 규칙 (null이면 단독 영향 폐기)
 * - LOW: LOW 레벨일 때의 규칙 (null이면 단독 영향 폐기)
 */
export interface TraitImpactDefinition {
  priorityGroup: PriorityGroup;
  HIGH?: TraitImpactRule | null;
  LOW?: TraitImpactRule | null;
}

/**
 * 전체 성향 영향 매핑 테이블
 */
export type TraitImpactMap = Record<PreferenceCategory, TraitImpactDefinition>;

// ============================================
// 6. DecisionImpactEngine 입력/출력 타입
// ============================================

/**
 * DecisionImpactEngine 입력
 */
export interface DecisionImpactInput {
  scores: Record<PreferenceCategory, number>;  // 15개 성향 점수
  evidenceCounts: Record<PreferenceCategory, number>;  // 카테고리별 질문 개수
  spaceInfo?: SpaceInfo | null;
  discomfortDetail?: string[];  // 불편 요소 상세 배열 (있으면 사용)
}

/**
 * 재질문 트리거 정보
 * 명세서 규칙 8: 재질문 트리거 (FAIL 아님)
 */
export interface RequestionTrigger {
  needsRequestion: boolean;           // 재질문 필요 여부
  reason: 'low_evidence' | 'force_process_failed';  // 재질문 이유
  validationQuestions: string[];      // 결정 검증 질문 1~2개
}

/**
 * DecisionImpactEngine 출력
 */
export interface DecisionImpactOutput {
  decisionSummary: DecisionSummary;
  traitEvaluations: Record<PreferenceCategory, TraitEvaluation>;  // 내부용 (선택)
  requestionTrigger?: RequestionTrigger;  // 재질문 트리거 정보 (선택)
}






