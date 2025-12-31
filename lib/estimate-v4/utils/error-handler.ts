/**
 * V4 에러 처리 유틸리티
 */

import { V4Error, EstimateCalculationError } from '../errors'
import type { EstimateResultV4 } from '../types'
import { logError } from './logger'

/**
 * 안전한 비동기 함수 래퍼
 * - 에러 발생 시 기본값 반환
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logError(context, error)
    return fallback
  }
}

/**
 * 견적 에러 → 실패 결과 변환
 */
export function toFailedEstimate(
  error: unknown,
  meta: Partial<EstimateResultV4['meta']>
): EstimateResultV4 {
  const failedAt =
    error instanceof EstimateCalculationError ? error.failedAt : 'UNKNOWN'

  const reason = error instanceof V4Error
    ? error.message
    : '알 수 없는 오류가 발생했습니다.'

  const processId =
    error instanceof EstimateCalculationError ? error.processId : undefined

  return {
    status: 'ESTIMATE_FAILED',
    failures: {
      failedProcesses: processId ? [processId] : [],
      reasons: [reason],
      failedAt,
    },
    meta: {
      version: 'v4.0.0',
      grade: meta.grade ?? 'ARGEN_S',
      dataSourceStats: {
        totalItems: 0,
        fromDB: 0,
        fromPreset: 0,
        dbRatio: 0,
      },
      calculatedAt: new Date().toISOString(),
    },
  }
}

/**
 * 엔진별 에러 처리 예시
 */
export async function withErrorHandling<T>(
  engineName: string,
  fn: () => Promise<T>,
  onError: (error: V4Error) => T
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof V4Error) {
      logError(engineName, error)
      return onError(error)
    }

    // 예상치 못한 에러는 V4Error로 래핑
    const wrappedError = new V4Error(
      error instanceof Error ? error.message : '알 수 없는 오류',
      'UNEXPECTED_ERROR',
      { originalError: error }
    )
    logError(engineName, wrappedError)
    return onError(wrappedError)
  }
}








