/**
 * V4 에러 타입 정의
 */

/**
 * V4 기본 에러 클래스
 */
export class V4Error extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'V4Error'
  }
}

/**
 * 입력 검증 에러
 */
export class InputValidationError extends V4Error {
  constructor(field: string, reason: string) {
    super(
      `입력 검증 실패: ${field} - ${reason}`,
      'INPUT_VALIDATION_ERROR',
      { field, reason }
    )
    this.name = 'InputValidationError'
  }
}

/**
 * 성향 분석 에러
 */
export class PersonalityAnalysisError extends V4Error {
  constructor(step: string, reason: string) {
    super(
      `성향 분석 실패: ${step} - ${reason}`,
      'PERSONALITY_ANALYSIS_ERROR',
      { step, reason }
    )
    this.name = 'PersonalityAnalysisError'
  }
}

/**
 * 견적 계산 에러 (헌법 v1.1 호환)
 */
export class EstimateCalculationError extends V4Error {
  constructor(
    public processId: string,
    reason: string,
    public failedAt: string
  ) {
    super(
      `견적 계산 실패: ${processId} - ${reason}`,
      'ESTIMATE_CALCULATION_ERROR',
      { processId, reason, failedAt }
    )
    this.name = 'EstimateCalculationError'
  }
}

/**
 * V3 엔진 호출 에러
 */
export class V3EngineError extends V4Error {
  constructor(engine: string, originalError: Error) {
    super(
      `V3 엔진 호출 실패: ${engine}`,
      'V3_ENGINE_ERROR',
      { engine, originalMessage: originalError.message }
    )
    this.name = 'V3EngineError'
  }
}








