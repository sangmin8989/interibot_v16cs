const isErrorInstance = (error: unknown): error is Error =>
  error instanceof Error

export interface ApiErrorPayload {
  success: false
  error: string
  details?: string
  hint?: string
  errorId: string
}

/**
 * 공통 에러 응답 생성기
 * - fallbackMessage: 사용자에게 보여줄 기본 메시지
 * - hint: 문제 해결을 위한 추가 문구
 */
export function buildErrorResponse(
  error: unknown,
  fallbackMessage: string,
  hint?: string
): ApiErrorPayload {
  const details = isErrorInstance(error) ? error.message : undefined
  return {
    success: false,
    error: fallbackMessage,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    hint,
    errorId: `err_${Date.now()}`,
  }
}











