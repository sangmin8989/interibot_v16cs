/**
 * 기존 에러 타입과의 호환성 어댑터
 * 
 * 작성일: 2025-12-31
 * 목적: 기존 EstimateValidationError 등을 새로운 에러 타입으로 변환
 */

import { EstimateError, normalizeError } from './index'
import type { EstimateValidationError } from '@/lib/types/헌법_견적_타입'
import type { V5ValidationError } from '@/lib/analysis/v5/error'
import type { V4Error } from '@/lib/estimate-v4/errors'

/**
 * EstimateValidationError를 EstimateError로 변환
 */
export function adaptEstimateValidationError(
  error: EstimateValidationError
): EstimateError {
  return new EstimateError(
    error.processId,
    error.reason,
    error.failedAt,
    {
      code: error.code,
      originalError: 'EstimateValidationError',
    }
  )
}

/**
 * V5ValidationError를 AnalysisError로 변환
 */
export function adaptV5ValidationError(error: V5ValidationError) {
  const { AnalysisError } = require('./index')
  return new AnalysisError(
    'V5_VALIDATION',
    error.message,
    {
      originalError: 'V5ValidationError',
    }
  )
}

/**
 * V4Error를 적절한 에러 타입으로 변환
 */
export function adaptV4Error(error: V4Error) {
  const { EstimateError, AnalysisError, UnexpectedError } = require('./index')
  
  // 코드에 따라 적절한 에러 타입으로 변환
  if (error.code === 'ESTIMATE_CALCULATION_ERROR') {
    return new EstimateError(
      (error.context?.processId as string) || 'unknown',
      error.message,
      (error.context?.failedAt as any),
      error.context
    )
  }
  
  if (error.code === 'PERSONALITY_ANALYSIS_ERROR') {
    return new AnalysisError(
      (error.context?.step as string) || 'unknown',
      error.message,
      error.context
    )
  }
  
  return normalizeError(error)
}

/**
 * 알 수 없는 에러를 적절한 에러 타입으로 변환
 */
export function adaptUnknownError(error: unknown) {
  // EstimateValidationError인 경우
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'EstimateValidationError'
  ) {
    return adaptEstimateValidationError(error as EstimateValidationError)
  }
  
  // V5ValidationError인 경우
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'V5ValidationError'
  ) {
    return adaptV5ValidationError(error as V5ValidationError)
  }
  
  // V4Error인 경우
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'V4Error'
  ) {
    return adaptV4Error(error as V4Error)
  }
  
  // 기타는 normalizeError 사용
  return normalizeError(error)
}
