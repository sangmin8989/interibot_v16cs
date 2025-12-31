/**
 * 인테리봇 통일된 에러 타입 체계
 * 
 * 작성일: 2025-12-31
 * 목적: 프로젝트 전반에 걸친 일관된 에러 처리
 */

/**
 * 기본 에러 코드 타입
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'ESTIMATE_ERROR'
  | 'ANALYSIS_ERROR'
  | 'DATABASE_ERROR'
  | 'API_ERROR'
  | 'UNEXPECTED_ERROR'

/**
 * 에러 컨텍스트 정보
 */
export interface ErrorContext {
  [key: string]: unknown
  processId?: string
  step?: string
  field?: string
  reason?: string
}

/**
 * 기본 에러 클래스
 */
export class InteriBotError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public context?: ErrorContext
  ) {
    super(message)
    this.name = 'InteriBotError'
    // TypeScript에서 Error 상속 시 필요
    Object.setPrototypeOf(this, InteriBotError.prototype)
  }

  /**
   * 사용자 친화적 에러 메시지 반환
   */
  getUserMessage(): string {
    switch (this.code) {
      case 'VALIDATION_ERROR':
        return '입력 정보를 확인해주세요.'
      case 'ESTIMATE_ERROR':
        return '견적 생성 중 오류가 발생했습니다.'
      case 'ANALYSIS_ERROR':
        return '분석 중 오류가 발생했습니다.'
      case 'DATABASE_ERROR':
        return '데이터 처리 중 오류가 발생했습니다.'
      case 'API_ERROR':
        return '서비스 연결 중 오류가 발생했습니다.'
      case 'UNEXPECTED_ERROR':
      default:
        return '예상치 못한 오류가 발생했습니다.'
    }
  }

  /**
   * 에러를 JSON으로 직렬화
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.getUserMessage(),
      context: this.context,
    }
  }
}

/**
 * 검증 에러
 */
export class ValidationError extends InteriBotError {
  constructor(field: string, reason: string, context?: ErrorContext) {
    super(
      `검증 실패: ${field} - ${reason}`,
      'VALIDATION_ERROR',
      { ...context, field, reason }
    )
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * 견적 에러
 */
export class EstimateError extends InteriBotError {
  constructor(
    processId: string,
    reason: string,
    failedAt?: 'MATERIAL_OR_LABOR_VALIDATION' | 'ENGINE_VALIDATION',
    context?: ErrorContext
  ) {
    super(
      `견적 생성 실패 [${processId}]: ${reason}`,
      'ESTIMATE_ERROR',
      { ...context, processId, reason, failedAt }
    )
    this.name = 'EstimateError'
    Object.setPrototypeOf(this, EstimateError.prototype)
  }
}

/**
 * 분석 에러
 */
export class AnalysisError extends InteriBotError {
  constructor(step: string, reason: string, context?: ErrorContext) {
    super(
      `분석 실패: ${step} - ${reason}`,
      'ANALYSIS_ERROR',
      { ...context, step, reason }
    )
    this.name = 'AnalysisError'
    Object.setPrototypeOf(this, AnalysisError.prototype)
  }
}

/**
 * 데이터베이스 에러
 */
export class DatabaseError extends InteriBotError {
  constructor(operation: string, reason: string, context?: ErrorContext) {
    super(
      `DB 오류: ${operation} - ${reason}`,
      'DATABASE_ERROR',
      { ...context, operation, reason }
    )
    this.name = 'DatabaseError'
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

/**
 * API 에러
 */
export class ApiError extends InteriBotError {
  constructor(endpoint: string, reason: string, context?: ErrorContext) {
    super(
      `API 오류: ${endpoint} - ${reason}`,
      'API_ERROR',
      { ...context, endpoint, reason }
    )
    this.name = 'ApiError'
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

/**
 * 예상치 못한 에러
 */
export class UnexpectedError extends InteriBotError {
  constructor(originalError: unknown, context?: ErrorContext) {
    const message = originalError instanceof Error
      ? originalError.message
      : '알 수 없는 오류'
    
    super(
      `예상치 못한 오류: ${message}`,
      'UNEXPECTED_ERROR',
      {
        ...context,
        originalError: originalError instanceof Error
          ? {
              name: originalError.name,
              message: originalError.message,
              stack: originalError.stack,
            }
          : String(originalError),
      }
    )
    this.name = 'UnexpectedError'
    Object.setPrototypeOf(this, UnexpectedError.prototype)
  }
}

/**
 * 에러 타입 가드 함수들
 */
export function isInteriBotError(error: unknown): error is InteriBotError {
  return error instanceof InteriBotError
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

export function isEstimateError(error: unknown): error is EstimateError {
  return error instanceof EstimateError
}

export function isAnalysisError(error: unknown): error is AnalysisError {
  return error instanceof AnalysisError
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * 알 수 없는 에러를 InteriBotError로 변환
 */
export function normalizeError(error: unknown): InteriBotError {
  if (isInteriBotError(error)) {
    return error
  }
  
  if (error instanceof Error) {
    return new UnexpectedError(error)
  }
  
  return new UnexpectedError(error)
}
