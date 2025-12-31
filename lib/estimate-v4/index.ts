/**
 * V4 견적 계산 엔진 - 공개 API
 * 
 * 진입점: calculateEstimateV4, calculateEstimateV4ForUI
 */

import type {
  CollectedInputV4,
  EstimateResultV4,
  UIEstimateV4,
} from './types'
import { analyzePersonality } from './engines/personality'
import { determineStrategy } from './engines/strategy'
import { calculateEstimate } from './engines/estimate'
import { adaptForUI } from './adapters'
import { logger } from './utils/logger'

/**
 * V4 견적 계산 메인 함수
 * - 성향 분석 → 전략 결정 → 견적 계산 파이프라인 실행
 * 
 * @param input - 수집된 입력 정보
 * @returns 견적 결과
 */
export async function calculateEstimateV4(
  input: CollectedInputV4
): Promise<EstimateResultV4> {
  logger.info('V4Engine', '견적 계산 시작', {
    pyeong: input.spaceInfo.pyeong,
  })

  try {
    // Step 1: 성향 분석
    const personality = await logger.measure(
      'V4Engine',
      '성향 분석',
      () => analyzePersonality(input)
    )

    // Step 2: 전략 결정
    const strategy = await logger.measure(
      'V4Engine',
      '전략 결정',
      () =>
        determineStrategy(
          personality,
          input.spaceInfo,
          input.preferences,
          input.selectedSpaces
        )
    )

    // Step 3: 견적 계산
    const estimate = await logger.measure(
      'V4Engine',
      '견적 계산',
      () =>
        calculateEstimate(
          strategy,
          input.spaceInfo,
          input.selectedProcesses
        )
    )

    logger.info('V4Engine', '견적 계산 완료', {
      status: estimate.status,
      grade: estimate.meta.grade,
    })

    return estimate
  } catch (error) {
    logger.error('V4Engine', '견적 계산 실패', error)
    throw error
  }
}

/**
 * V4 견적 계산 (UI용)
 * - 프론트엔드 표시에 최적화된 결과 반환
 * 
 * @param input - 수집된 입력 정보
 * @param forceGrade - 강제 등급 지정 (선택사항)
 * @returns UI용 견적 결과
 */
export async function calculateEstimateV4ForUI(
  input: CollectedInputV4,
  forceGrade?: 'ARGEN_E' | 'ARGEN_S' | 'ARGEN_O'
): Promise<UIEstimateV4> {
  logger.info('V4Engine', 'UI용 견적 계산 시작', { forceGrade })

  try {
    // Step 1-3: 전체 파이프라인 실행
    const personality = await analyzePersonality(input)
    const strategy = await determineStrategy(
      personality,
      input.spaceInfo,
      input.preferences,
      input.selectedSpaces,
      undefined, // traitResult
      forceGrade // 강제 등급 전달
    )
    const estimate = await calculateEstimate(
      strategy,
      input.spaceInfo,
      input.selectedProcesses
    )

    // Step 4: UI 어댑터 적용 (버그 1 방지: selectedSpaces 전달)
    const uiResult = adaptForUI(estimate, personality, strategy, input.selectedSpaces)

    logger.info('V4Engine', 'UI용 견적 계산 완료', {
      isSuccess: uiResult.isSuccess,
    })

    return uiResult
  } catch (error) {
    logger.error('V4Engine', 'UI용 견적 계산 실패', error)
    
    // 실패 시 기본 UI 결과 반환
    return {
      isSuccess: false,
      grade: 'ARGEN_S',
      gradeName: '아르젠 스탠다드',
      total: { formatted: '-', perPyeong: '-' },
      breakdown: [],
      personalityMatch: { score: 0, highlights: [] },
      warnings: [],
      errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
      // ⚠️ 실패 케이스: 성향 분석 기반 추천이 아니므로 명시적으로 false/null 설정
      hasPersonalityData: false,
      personalityBasedMessage: null,
    }
  }
}

// 타입 재export
export * from './types'








