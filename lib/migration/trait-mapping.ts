/**
 * 트레이트 마이그레이션 매핑
 * 
 * 기존 8개 트레이트 → 신규 6축 트레이트 변환
 * 
 * ⚠️ 주의: 이 파일은 마이그레이션이 필요할 때 사용됩니다.
 * 현재는 구조만 준비되어 있으며, 실제 사용은 Phase 2 이후입니다.
 * 
 * @see Phase 3 작업 7️⃣
 */

/**
 * 기존 8개 트레이트 타입 (0~100 점수)
 */
export interface LegacyTraitScores {
  spaceEfficiency: number      // 0~100
  cleaningSensitivity: number  // 0~100
  visualSensitivity: number     // 0~100
  familyInfluence: number      // 0~100
  budgetFlexibility: number    // 0~100
  styleCommitment: number      // 0~100
  flowImportance: number       // 0~100
  independencePreference: number // 0~100
}

/**
 * 신규 6축 트레이트 타입 (-5~+5 점수)
 */
export interface Trait6Axis {
  TR_VIS: number    // 시각 자극 성향 (-5 미니멀 ~ +5 볼드)
  TR_TONE: number   // 온도감/색감 성향 (-5 웜톤 ~ +5 쿨톤)
  TR_STORE: number  // 수납 성향 (-5 숨김 ~ +5 오픈)
  TR_MAINT: number  // 유지관리 성향 (-5 최소 ~ +5 감수)
  TR_LIFE: number   // 생활 방식 (-5 집순이 ~ +5 외출)
  TR_HOST: number   // 손님/모임 성향 (-5 프라이빗 ~ +5 호스팅)
}

/**
 * 기존 8개 트레이트 → 신규 6축 트레이트 변환 함수
 * 
 * 변환 공식 (명세서 제4장 4.3):
 * - visualSensitivity (0~100) → TR_VIS: (score - 50) / 10
 * - colorTemperature (0~100) → TR_TONE: (score - 50) / 10
 * - storagePreference (0~100) → TR_STORE: (50 - score) / 10
 * - cleaningSensitivity (0~100) → TR_MAINT: (50 - score) / 10
 * - homeTime (0~100) → TR_LIFE: (50 - score) / 10
 * - socialPreference (0~100) → TR_HOST: (score - 50) / 10
 * 
 * @param legacy 기존 8개 트레이트 점수
 * @returns 신규 6축 트레이트 점수
 */
export function migrateTraitScores(legacy: LegacyTraitScores): Trait6Axis {
  // visualSensitivity → TR_VIS
  const TR_VIS = Math.max(-5, Math.min(5, (legacy.visualSensitivity - 50) / 10))

  // colorTemperature (기존에 없으면 visualSensitivity 기반 추정)
  // 또는 styleCommitment를 활용
  const estimatedColorTemp = legacy.styleCommitment || legacy.visualSensitivity
  const TR_TONE = Math.max(-5, Math.min(5, (estimatedColorTemp - 50) / 10))

  // spaceEfficiency → TR_STORE (반대 관계: 수납 효율 높으면 숨김 선호)
  const TR_STORE = Math.max(-5, Math.min(5, (50 - legacy.spaceEfficiency) / 10))

  // cleaningSensitivity → TR_MAINT (반대 관계: 청소 민감하면 관리 최소 선호)
  const TR_MAINT = Math.max(-5, Math.min(5, (50 - legacy.cleaningSensitivity) / 10))

  // flowImportance → TR_LIFE (반대 관계: 동선 중요하면 집순이)
  const TR_LIFE = Math.max(-5, Math.min(5, (50 - legacy.flowImportance) / 10))

  // familyInfluence + independencePreference → TR_HOST
  // 가족 영향 높고 독립 선호 낮으면 호스팅 성향
  const familyScore = legacy.familyInfluence
  const independenceScore = legacy.independencePreference
  const socialScore = (familyScore + (100 - independenceScore)) / 2
  const TR_HOST = Math.max(-5, Math.min(5, (socialScore - 50) / 10))

  return {
    TR_VIS,
    TR_TONE,
    TR_STORE,
    TR_MAINT,
    TR_LIFE,
    TR_HOST,
  }
}

/**
 * 마이그레이션 검증 함수
 * 
 * 변환된 점수가 유효한 범위(-5~+5) 내에 있는지 확인
 */
export function validateMigratedTraits(traits: Trait6Axis): boolean {
  const keys: Array<keyof Trait6Axis> = ['TR_VIS', 'TR_TONE', 'TR_STORE', 'TR_MAINT', 'TR_LIFE', 'TR_HOST']
  
  for (const key of keys) {
    const value = traits[key]
    if (typeof value !== 'number' || value < -5 || value > 5) {
      console.error(`[Trait Migration] Invalid trait value: ${key} = ${value}`)
      return false
    }
  }
  
  return true
}

/**
 * 마이그레이션 예시 (테스트용)
 */
export function exampleMigration(): {
  legacy: LegacyTraitScores
  migrated: Trait6Axis
  valid: boolean
} {
  const legacy: LegacyTraitScores = {
    spaceEfficiency: 70,      // 높은 수납 효율
    cleaningSensitivity: 80,   // 높은 청소 민감도
    visualSensitivity: 30,     // 낮은 시각 자극 선호 (미니멀)
    familyInfluence: 60,        // 중간 가족 영향
    budgetFlexibility: 50,     // 중간 예산 유연성
    styleCommitment: 40,        // 낮은 스타일 집착 (웜톤 추정)
    flowImportance: 70,        // 높은 동선 중요도
    independencePreference: 40, // 낮은 독립 선호
  }

  const migrated = migrateTraitScores(legacy)
  const valid = validateMigratedTraits(migrated)

  return {
    legacy,
    migrated,
    valid,
  }
}


