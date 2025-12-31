/**
 * V4 ProcessPicker - 공정 선택기
 * 
 * V3 ProcessEngine 래핑 + 성향 매칭도 추가
 */

import { ProcessEngine } from '@/lib/analysis/engine-v3/engines/ProcessEngine'
import type {
  PersonalityResultV4,
  ProcessStrategyItemV4,
  PreferencesV4,
} from '../../types'
import { toV3ProcessEngineInput } from '../../converters/input-converter'
import { toV4ProcessStrategy } from '../../converters/output-converter'
import { logger } from '../../utils/logger'
import { V3EngineError } from '../../errors'

/**
 * V3 ProcessEngine 래핑 + 성향 매칭도 추가
 * 
 * ProcessEngine은 TraitEngineResult를 필요로 하므로,
 * 내부에서 TraitEngine을 먼저 호출해야 함
 * 
 * 간소화 버전: selectedSpaces 기반 필수 공정 + 성향 기반 추천 공정
 */
export async function pickProcesses(
  personality: PersonalityResultV4,
  selectedSpaces: string[],
  preferences: PreferencesV4,
  traitResult?: any // TraitEngineResult (선택사항)
): Promise<ProcessStrategyItemV4[]> {
  logger.debug('ProcessPicker', '공정 선택 시작', {
    selectedSpacesCount: selectedSpaces.length,
  })

  try {
    // 간소화 버전: 직접 공정 추천
    const result = pickProcessesSimple(personality, selectedSpaces)

    // V3 ProcessEngine이 있으면 활용
    if (traitResult) {
      const v3Input = toV3ProcessEngineInput(
        traitResult,
        selectedSpaces,
        preferences.budget
      )

      const processEngine = new ProcessEngine()
      const v3Result = await logger.measure(
        'ProcessPicker',
        'V3 ProcessEngine 호출',
        () => processEngine.analyze(v3Input)
      )

      // V4 포맷으로 변환
      const v4Strategy = toV4ProcessStrategy(v3Result, personality)

      // 간소화 버전과 병합 (중복 제거)
      const merged = mergeProcessStrategies(result, v4Strategy)
      return merged
    }

    return result
  } catch (error) {
    logger.error('ProcessPicker', '공정 선택 실패', error)

    if (error instanceof Error) {
      throw new V3EngineError('ProcessEngine', error)
    }

    // 기본값 반환
    return pickProcessesSimple(personality, selectedSpaces)
  }
}

/**
 * 공정 → 공간 매핑 (버그 3 방지용)
 */
const PROCESS_TO_SPACE_MAP: Record<string, string[]> = {
  soundproof: ['living', 'bedroom'],
  storage_system: ['storage', 'entrance', 'bedroom'],
  child_safety: ['living', 'bedroom', 'kitchen'],
  kitchen_core: ['kitchen'],
  bathroom_waterproof: ['bathroom'],
  flooring: ['living', 'bedroom'],
  wallpaper: ['living', 'bedroom'],
  lighting: ['living', 'bedroom', 'kitchen'],
  window: ['living', 'bedroom'],
  door: ['living', 'bedroom', 'entrance'],
  demolition: ['common'],
}

/**
 * 간소화 버전: NeedsEngine 없이 직접 공정 추천
 */
export function pickProcessesSimple(
  personality: PersonalityResultV4,
  selectedSpaces: string[]
): ProcessStrategyItemV4[] {
  const result: ProcessStrategyItemV4[] = []

  // 공간별 필수 공정 매핑 (CostCalculator에 존재하는 공정만)
  const spaceProcessMap: Record<string, string[]> = {
    kitchen: ['kitchen_core'],
    bathroom: ['bathroom_waterproof'],
    living: ['flooring', 'wallpaper', 'lighting'],
    bedroom: ['flooring', 'wallpaper'],
    entrance: ['storage_system'],
    storage: ['storage_system'],
  }

  // 선택된 공간의 필수 공정 추가
  for (const space of selectedSpaces) {
    const processes = spaceProcessMap[space] || []
    for (const processId of processes) {
      if (!result.find(r => r.processId === processId)) {
        result.push({
          processId,
          priority: 'must',
          reason: `${space} 공간 필수 공정`,
          personalityMatch: calculatePersonalityMatchSimple(processId, personality),
        })
      }
    }
  }

  // 성향 기반 추천 공정 추가 (버그 3 방지: selectedSpaces 전달)
  const personalityProcesses = getPersonalityBasedProcesses(personality, selectedSpaces)
  for (const proc of personalityProcesses) {
    if (!result.find(r => r.processId === proc.processId)) {
      result.push(proc)
    }
  }

  // 🔒 헌법: 고객이 입력한 정보만 사용 (기본 공정 자동 추가 금지)
  if (result.length === 0) {
    logger.warn('ProcessPicker', '선택된 공간이 없어 공정이 선택되지 않음', {
      selectedSpacesCount: selectedSpaces.length,
      selectedSpaces,
      personalityTraitScores: personality.traitScores.length,
    })
  }

  return result
}

/**
 * 성향 기반 추천 공정 (버그 3 방지: selectedSpaces 체크 추가)
 */
function getPersonalityBasedProcesses(
  personality: PersonalityResultV4,
  selectedSpaces: string[]  // 버그 3 방지: 선택된 공간 체크용
): ProcessStrategyItemV4[] {
  const result: ProcessStrategyItemV4[] = []
  const { traitScores, classifiedTypes } = personality

  // 소음민감도 높으면 방음 추천
  const noiseScore = traitScores.find(t => t.traitCode === 'noise_sensitivity')?.score ?? 5
  if (noiseScore >= 7) {
    // 버그 3 방지: 선택된 공간에 방음 공정이 적용되는 공간이 있는지 체크
    const soundproofSpaces = PROCESS_TO_SPACE_MAP['soundproof'] || []
    const hasSoundproofSpace = soundproofSpaces.some(space => selectedSpaces.includes(space))
    
    if (hasSoundproofSpace) {
      result.push({
        processId: 'soundproof',
        priority: 'recommended',
        reason: '소음민감도가 높아 방음 공사 추천',
        personalityMatch: noiseScore / 10,
      })
    } else if (selectedSpaces.length > 0) {
      // 선택하지 않은 공간이면 'optional'로 낮춤
      result.push({
        processId: 'soundproof',
        priority: 'optional',
        reason: '소음민감도가 높지만 해당 공간이 선택되지 않아 선택사항으로 추천',
        personalityMatch: noiseScore / 10,
      })
    }
  }

  // 수납중요도 높으면 수납 시스템 추천
  const storageScore = traitScores.find(t => t.traitCode === 'storage_importance')?.score ?? 5
  if (storageScore >= 7) {
    // 버그 3 방지: 선택된 공간에 수납 공정이 적용되는 공간이 있는지 체크
    const storageSpaces = PROCESS_TO_SPACE_MAP['storage_system'] || []
    const hasStorageSpace = storageSpaces.some(space => selectedSpaces.includes(space))
    
    if (hasStorageSpace) {
      result.push({
        processId: 'storage_system',
        priority: 'recommended',
        reason: '수납중요도가 높아 맞춤 수납 추천',
        personalityMatch: storageScore / 10,
      })
    } else if (selectedSpaces.length > 0) {
      // 선택하지 않은 공간이면 'optional'로 낮춤
      result.push({
        processId: 'storage_system',
        priority: 'optional',
        reason: '수납중요도가 높지만 해당 공간이 선택되지 않아 선택사항으로 추천',
        personalityMatch: storageScore / 10,
      })
    }
  }

  // 가족 유형 기반 추천
  if (
    classifiedTypes.family.includes('has_infant') ||
    classifiedTypes.family.includes('has_child')
  ) {
    // 버그 3 방지: 선택된 공간에 안전 공정이 적용되는 공간이 있는지 체크
    const safetySpaces = PROCESS_TO_SPACE_MAP['child_safety'] || []
    const hasSafetySpace = safetySpaces.some(space => selectedSpaces.includes(space))
    
    if (hasSafetySpace) {
      result.push({
        processId: 'child_safety',
        priority: 'recommended',
        reason: '자녀가 있어 안전 관련 공정 추천',
        personalityMatch: 0.8,
      })
    } else if (selectedSpaces.length > 0) {
      result.push({
        processId: 'child_safety',
        priority: 'optional',
        reason: '자녀가 있지만 해당 공간이 선택되지 않아 선택사항으로 추천',
        personalityMatch: 0.8,
      })
    }
  }

  return result
}

/**
 * 성향 매칭도 계산 (간소화)
 */
function calculatePersonalityMatchSimple(
  processId: string,
  personality: PersonalityResultV4
): number {
  const { traitScores } = personality

  // 공정별 관련 V4 영문 키
  const processTraitMap: Record<string, string[]> = {
    kitchen_core: ['cooking_frequency'],
    bathroom_waterproof: ['cleaning_preference'],
    storage_system: ['storage_importance', 'organization_habit'],
    soundproof: ['noise_sensitivity'],
    lighting: ['light_importance'],
    flooring: ['cleaning_preference', 'child_safety'],
    wallpaper: ['light_importance'],
  }

  const relatedTraits = processTraitMap[processId] || []
  if (relatedTraits.length === 0) return 0.5

  const relevantScores = traitScores
    .filter(t => relatedTraits.includes(t.traitCode))
    .map(t => t.score)

  if (relevantScores.length === 0) return 0.5

  const avgScore = relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length
  return avgScore / 10
}

/**
 * 공정 전략 병합 (중복 제거)
 */
function mergeProcessStrategies(
  simple: ProcessStrategyItemV4[],
  v4Strategy: ProcessStrategyItemV4[]
): ProcessStrategyItemV4[] {
  const merged = [...simple]
  const existingIds = new Set(simple.map(s => s.processId))

  for (const proc of v4Strategy) {
    if (!existingIds.has(proc.processId)) {
      merged.push(proc)
    }
  }

  return merged
}








