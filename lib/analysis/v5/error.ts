/**
 * V5 성향분석 엔진 에러 타입 정의
 * 
 * Phase 3-1: V5 공통 에러 규칙 통합
 * 
 * ⚠️ 헌법 원칙:
 * - 누락 시 즉시 throw
 * - fallback 반환 금지
 * - 기본값 생성 금지
 */

/**
 * V5 검증 에러
 * 
 * 사용 시점:
 * - basicInput 누락
 * - answers 비어 있음
 * - 태그 0개
 * - 태그 타입 불일치
 */
export class V5ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'V5ValidationError'
    // TypeScript에서 Error 상속 시 필요
    Object.setPrototypeOf(this, V5ValidationError.prototype)
  }
}




