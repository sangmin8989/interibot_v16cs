/**
 * V3.1 Core Edition - 유틸리티 함수
 * 
 * 공통 헬퍼 함수 모음
 */

import { NeedsLevel, NeedsId } from '../types/needs';

/**
 * Needs Level 우선순위 비교
 */
export function compareNeedsLevel(level1: NeedsLevel, level2: NeedsLevel): number {
  const priority = { high: 3, mid: 2, low: 1 };
  return priority[level2] - priority[level1];
}

/**
 * Needs Level 병합 (높은 쪽 선택)
 */
export function mergeNeedsLevel(level1: NeedsLevel, level2: NeedsLevel): NeedsLevel {
  const priority = { high: 3, mid: 2, low: 1 };
  return priority[level1] >= priority[level2] ? level1 : level2;
}

/**
 * Needs Level 업그레이드
 */
export function upgradeNeedsLevel(currentLevel: NeedsLevel): NeedsLevel {
  if (currentLevel === 'low') return 'mid';
  if (currentLevel === 'mid') return 'high';
  return 'high';
}

/**
 * Needs Level 다운그레이드
 */
export function downgradeNeedsLevel(currentLevel: NeedsLevel): NeedsLevel {
  if (currentLevel === 'high') return 'mid';
  if (currentLevel === 'mid') return 'low';
  return 'low';
}

/**
 * Needs ID를 한글 이름으로 변환
 */
export function getNeedsKoreanName(needsId: NeedsId): string {
  const nameMap: Record<NeedsId, string> = {
    safety: '안전성 강화',
    storage: '수납 강화',
    flow: '동선 최적화',
    durability: '내구성 강화',
    maintenance: '청소/관리 편의성',
    brightness: '채광·밝기 향상',
  };
  return nameMap[needsId] || needsId;
}

/**
 * Needs Level을 한글로 변환
 */
export function getNeedsLevelKorean(level: NeedsLevel): string {
  const levelMap: Record<NeedsLevel, string> = {
    high: '높음',
    mid: '중간',
    low: '낮음',
  };
  return levelMap[level];
}





















