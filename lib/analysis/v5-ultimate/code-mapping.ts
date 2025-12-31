/**
 * 트레이트 코드 매핑
 * 기존 코드와 신규 코드 호환
 */
export function normalizeTrait(trait: string): string {
  const mapping: Record<string, string> = {
    'MODERN_STYLE': 'MODERN_LOVER',
    'NATURAL_STYLE': 'NATURAL_LOVER',
    'KID_SAFE_NEED': 'SAFETY_NEED',
    'QUIET_NEED': 'SOUNDPROOF_NEED',
    'COOKING_DAILY': 'COOKING_LOVER',
    'CLEANING_LAZY': 'CLEANING_SYSTEM_NEED',
  };
  return mapping[trait] || trait;
}

export function normalizeTraits(traits: string[]): string[] {
  return traits.map(normalizeTrait);
}

/**
 * 공정 확장 함수
 * 공정 목록 정비 완료로 단순 반환
 */
export function expandProcesses(processes: string[]): string[] {
  return processes;
}


