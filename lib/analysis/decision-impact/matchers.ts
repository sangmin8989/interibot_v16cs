/**
 * 인테리봇 성향분석 엔진 개편 - 매칭 함수
 * 
 * 명세서 vFinal 기준
 * - spaceInfoMatch: 공정 강제 조건 1
 * - discomfortMatch: 공정 강제 조건 2
 * - canForceProcess: 공정 강제 락 규칙
 */

import type { SpaceInfo } from '../types';
import type { TraitEvaluation } from './types';

// ============================================
// 1. spaceInfoMatch 기준 (명세 확정)
// ============================================

/**
 * spaceInfo 기반 매칭 검사
 * 
 * 아래 중 하나라도 만족하면 true:
 * - 가족 인원: spaceInfo.totalPeople >= 4
 * - 영유아/고령: spaceInfo.ageRanges에 'baby' 포함 또는 lifestyleTags에 'hasElderly'
 * - 반려동물: spaceInfo.lifestyleTags에 'hasPets' 포함
 * 
 * @param spaceInfo - 공간 정보 (없으면 false)
 * @returns true면 공정 강제 조건 1 만족
 */
export function computeSpaceInfoMatch(spaceInfo: SpaceInfo | undefined | null): boolean {
  if (!spaceInfo) return false;
  
  // 1. 가족 인원 >= 4
  if ((spaceInfo.totalPeople ?? 0) >= 4) {
    return true;
  }
  
  // 2. 영유아: ageRanges에 'baby' 포함
  if (spaceInfo.ageRanges?.includes('baby')) {
    return true;
  }
  
  // 3. 고령: ageRanges에 'senior' 포함 또는 lifestyleTags에 'hasElderly'
  if (spaceInfo.ageRanges?.includes('senior') || 
      spaceInfo.lifestyleTags?.includes('hasElderly')) {
    return true;
  }
  
  // 4. 반려동물: lifestyleTags에 'hasPets' 포함
  if (spaceInfo.lifestyleTags?.includes('hasPets')) {
    return true;
  }
  
  return false;
}

// ============================================
// 2. discomfortMatch 기준 (명세 확정)
// ============================================

/**
 * 불편 요소 기반 매칭 검사
 * 
 * 아래 중 하나라도 만족하면 true:
 * - discomfort_factors 점수가 HIGH (level === 'HIGH')
 * - "불편 요소"가 구조적으로 입력된 경우(있다면) 1개 이상
 * 
 * @param trait - discomfort_factors 성향 평가
 * @param discomfortDetail - 불편 요소 상세 배열 (있으면 사용, 없으면 미사용)
 * @returns true면 공정 강제 조건 2 만족
 */
export function computeDiscomfortMatch(
  trait: TraitEvaluation,
  discomfortDetail?: string[]
): boolean {
  // 1. discomfort_factors 점수가 HIGH
  if (trait.level === 'HIGH') {
    return true;
  }
  
  // 2. 불편 요소 상세 배열이 있고 1개 이상
  if (discomfortDetail && discomfortDetail.length > 0) {
    return true;
  }
  
  return false;
}

// ============================================
// 3. 공정 강제 락 규칙 (최종 규칙)
// ============================================

/**
 * 공정 강제 가능 여부 검사
 * 
 * 3조건을 모두 만족해야 함:
 * 1. trait.level === 'HIGH'
 * 2. trait.evidenceCount >= 2
 * 3. spaceInfoMatch === true || discomfortMatch === true
 * 
 * ❗ 하나라도 실패하면 공정 강제 불가 (옵션만 가능하면 옵션만 적용)
 * 
 * @param trait - 성향 평가 결과
 * @param spaceInfo - 공간 정보
 * @param discomfortDetail - 불편 요소 상세 배열
 * @returns true면 공정 강제 가능
 */
export function canForceProcess(
  trait: TraitEvaluation,
  spaceInfo?: SpaceInfo | null,
  discomfortDetail?: string[]
): boolean {
  // 조건 1: level이 HIGH여야 함
  if (trait.level !== 'HIGH') {
    return false;
  }
  
  // 조건 2: evidenceCount >= 2
  if (trait.evidenceCount < 2) {
    return false;
  }
  
  // 조건 3: spaceInfoMatch 또는 discomfortMatch
  const spaceMatch = computeSpaceInfoMatch(spaceInfo);
  const discomfortMatch = computeDiscomfortMatch(trait, discomfortDetail);
  
  if (!spaceMatch && !discomfortMatch) {
    return false;
  }
  
  return true;
}






