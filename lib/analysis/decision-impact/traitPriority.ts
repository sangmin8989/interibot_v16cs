/**
 * 인테리봇 성향분석 엔진 개편 - 우선순위 그룹 시스템
 * 
 * 명세서 vFinal 기준
 * - 충돌 해결을 위한 우선순위 그룹 정의
 * - 상위 그룹은 하위 그룹의 결정을 덮어씀
 */

import type { PreferenceCategory } from '../questions/types';
import type { PriorityGroup } from './types';
import { PREFERENCE_CATEGORIES } from '../questions/types';

// ============================================
// 1. 우선순위 그룹 순서 (고정)
// ============================================

/**
 * 우선순위 그룹 순서 (높을수록 우선순위 높음)
 * 상위 그룹은 하위 그룹의 결정을 덮어씀
 */
export const traitPriorityOrder: readonly PriorityGroup[] = [
  'safety',        // 안전 / 가족 / 건강
  'budget',        // 예산 통제
  'maintenance',   // 유지관리
  'family',        // 가족 구성
  'function',      // 기능/동선
  'lifestyle',     // 생활/취미
  'aesthetic',     // 미감/취향
] as const;

// ============================================
// 2. 성향 → 우선순위 그룹 매핑 (고정)
// ============================================

/**
 * 성향 카테고리별 우선순위 그룹 매핑
 * 
 * ❗ 모든 성향에 priorityGroup이 지정되어야 함
 * 지정되지 않으면 엔진은 FAIL(throw) 함
 */
export const traitToPriorityGroup: Record<PreferenceCategory, PriorityGroup> = {
  // Safety 그룹 (최우선)
  family_composition: 'safety',    // 가족 구성
  health_factors: 'safety',        // 건강 요소
  
  // Budget 그룹
  budget_sense: 'budget',          // 예산 감각
  
  // Maintenance 그룹
  cleaning_preference: 'maintenance',  // 청소 성향
  organization_habit: 'maintenance',   // 정리 습관
  
  // Family 그룹
  // (현재 family_composition이 safety에 포함되어 별도 그룹 없음)
  
  // Function 그룹
  activity_flow: 'function',           // 활동 동선
  discomfort_factors: 'function',      // 불편 요소
  space_sense: 'function',             // 공간 감각 (폐기 성향이지만 priorityGroup은 필요)
  home_purpose: 'function',            // 집 사용 목적
  sleep_pattern: 'function',           // 수면 패턴
  
  // Lifestyle 그룹
  life_routine: 'lifestyle',          // 생활 루틴 (폐기 성향)
  hobby_lifestyle: 'lifestyle',        // 취미/라이프스타일 (폐기 성향)
  
  // Aesthetic 그룹
  color_preference: 'aesthetic',      // 색감 취향
  lighting_preference: 'aesthetic',    // 조명 취향
  sensory_sensitivity: 'aesthetic',    // 시각 민감도
};

// ============================================
// 3. 유틸리티 함수
// ============================================

/**
 * 우선순위 그룹의 순서 값 반환 (높을수록 우선순위 높음)
 */
export function getPriorityOrder(group: PriorityGroup): number {
  const index = traitPriorityOrder.indexOf(group);
  if (index === -1) {
    throw new Error(`알 수 없는 우선순위 그룹: ${group}`);
  }
  return traitPriorityOrder.length - index; // 역순 (safety가 가장 높음)
}

/**
 * 두 우선순위 그룹 비교
 * @returns true면 group1이 group2보다 우선순위 높음
 */
export function isHigherPriority(
  group1: PriorityGroup,
  group2: PriorityGroup
): boolean {
  return getPriorityOrder(group1) > getPriorityOrder(group2);
}

/**
 * 모든 성향이 priorityGroup을 가지고 있는지 검증
 * @throws Error - 누락된 성향이 있으면
 */
export function validatePriorityGroups(): void {
  const missing: PreferenceCategory[] = [];
  
  for (const category of PREFERENCE_CATEGORIES as readonly PreferenceCategory[]) {
    if (!traitToPriorityGroup[category]) {
      missing.push(category);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `우선순위 그룹이 지정되지 않은 성향: ${missing.join(', ')}`
    );
  }
}






