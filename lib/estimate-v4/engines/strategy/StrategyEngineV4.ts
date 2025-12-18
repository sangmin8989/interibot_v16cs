/**
 * V4 StrategyEngine - 전략 결정 엔진
 * 
 * GradeSelector, ProcessPicker를 통합
 */

import type {
  PersonalityResultV4,
  SpaceInfoV4,
  PreferencesV4,
  StrategyResultV4,
} from '../../types'
import { selectGrade } from './GradeSelector'
import { pickProcesses } from './ProcessPicker'
import { logger } from '../../utils/logger'

/**
 * 전략 결정 메인 함수
 */
export async function determineStrategy(
  personality: PersonalityResultV4,
  spaceInfo: SpaceInfoV4,
  preferences: PreferencesV4,
  selectedSpaces: string[],
  traitResult?: any, // TraitEngineResult (선택사항)
  forceGrade?: 'ARGEN_E' | 'ARGEN_S' | 'ARGEN_O' // 강제 등급 지정
): Promise<StrategyResultV4> {
  logger.info('StrategyEngine', '전략 결정 시작', {
    selectedSpacesCount: selectedSpaces.length,
    forceGrade,
  })

  // 1. 등급 선택 (강제 등급이 있으면 사용)
  const { grade, reason: gradeReason } = await logger.measure(
    'StrategyEngine',
    '등급 선택',
    () => {
      if (forceGrade) {
        return Promise.resolve({
          grade: forceGrade,
          reason: `사용자 선택: ${forceGrade}`,
        })
      }
      return Promise.resolve(selectGrade(personality, preferences))
    }
  )

  // 2. 공정 선택
  const processStrategy = await logger.measure(
    'StrategyEngine',
    '공정 선택',
    () => pickProcesses(personality, selectedSpaces, preferences, traitResult)
  )

  // 3. 예산 전략 계산
  const budgetStrategy = calculateBudgetStrategy(
    preferences,
    processStrategy.length
  )

  logger.info('StrategyEngine', '전략 결정 완료', {
    grade,
    processCount: processStrategy.length,
  })

  return {
    recommendedGrade: grade,
    gradeReason,
    processStrategy,
    optionStrategy: [], // 옵션 전략은 추후 구현
    budgetStrategy,
  }
}

/**
 * 예산 전략 계산
 */
function calculateBudgetStrategy(
  preferences: PreferencesV4,
  processCount: number
): StrategyResultV4['budgetStrategy'] {
  const targetTotal = preferences.budget.max
  const bufferAmount = Math.round(targetTotal * 0.1) // 기본 10%

  // 공정별 예산 비중 (균등 분배)
  const priorityAllocation: Record<string, number> = {}
  const perProcess = targetTotal / Math.max(processCount, 1)

  // 실제로는 공정별 우선순위에 따라 다르게 할당해야 함
  // 여기서는 간소화
  for (let i = 0; i < processCount; i++) {
    priorityAllocation[`process_${i}`] = perProcess
  }

  return {
    targetTotal,
    bufferAmount,
    priorityAllocation,
  }
}

