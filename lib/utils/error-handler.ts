/**
 * 인테리봇 통일된 에러 핸들러
 * 
 * 작성일: 2025-12-31
 * 목적: API 라우트에서 일관된 에러 처리
 */

import { NextResponse } from 'next/server'
import {
  InteriBotError,
  EstimateError,
  AnalysisError,
  ValidationError,
  DatabaseError,
  ApiError,
  UnexpectedError,
  normalizeError,
  isInteriBotError,
} from '@/lib/errors'
import { logger } from './logger'

/**
 * HTTP 상태 코드 매핑
 */
function getStatusCode(error: InteriBotError): number {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 400
    case 'ESTIMATE_ERROR':
      return 422
    case 'ANALYSIS_ERROR':
      return 422
    case 'DATABASE_ERROR':
      return 500
    case 'API_ERROR':
      return 502
    case 'UNEXPECTED_ERROR':
    default:
      return 500
  }
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(error: unknown): NextResponse {
  const normalizedError = normalizeError(error)
  
  // 에러 로깅
  logger.logError(normalizedError, {
    code: normalizedError.code,
    context: normalizedError.context,
  })

  const statusCode = getStatusCode(normalizedError)
  
  // 프로덕션에서는 상세 정보 제한
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code: normalizedError.code,
        message: normalizedError.getUserMessage(),
        details: isDevelopment ? normalizedError.message : undefined,
        context: isDevelopment ? normalizedError.context : undefined,
      },
    },
    { status: statusCode }
  )
}

/**
 * 견적 에러 응답 생성 (헌법 v1.1 호환)
 */
export function createEstimateErrorResponse(error: unknown): NextResponse {
  const normalizedError = normalizeError(error)
  
  // EstimateError인 경우 특별 처리
  if (normalizedError instanceof EstimateError) {
    const failedAt = normalizedError.context?.failedAt as
      | 'MATERIAL_OR_LABOR_VALIDATION'
      | 'ENGINE_VALIDATION'
      | undefined
    
    logger.logError(normalizedError, {
      processId: normalizedError.context?.processId,
      failedAt,
    })

    // 자재/노무 관련 실패인 경우 통일된 메시지
    const isMaterialOrLaborError =
      failedAt === 'MATERIAL_OR_LABOR_VALIDATION'
    
    return NextResponse.json(
      {
        status: 'ESTIMATE_FAILED',
        failedAt: failedAt || 'ENGINE_VALIDATION',
        reason: isMaterialOrLaborError
          ? '견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다.'
          : normalizedError.context?.reason || normalizedError.message,
        failedProcesses: normalizedError.context?.processId
          ? [normalizedError.context.processId]
          : ['system'],
      },
      { status: 422 }
    )
  }

  // 기타 에러는 일반 에러 응답
  return createErrorResponse(error)
}

/**
 * 분석 에러 응답 생성
 */
export function createAnalysisErrorResponse(error: unknown): NextResponse {
  const normalizedError = normalizeError(error)
  
  logger.logError(normalizedError, {
    step: normalizedError.context?.step,
  })

  return NextResponse.json(
    {
      success: false,
      error: {
        code: normalizedError.code,
        message: normalizedError.getUserMessage(),
        step: normalizedError.context?.step,
      },
    },
    { status: 422 }
  )
}

/**
 * 안전한 비동기 실행 래퍼
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logger.logError(error, { context, operation: 'safeAsync' })
    return fallback
  }
}

/**
 * 에러를 throw하지 않고 로깅만 수행
 */
export function logErrorOnly(error: unknown, context?: string): void {
  logger.logError(error, { context, operation: 'logErrorOnly' })
}
