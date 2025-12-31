/**
 * Phase 6: 운영 차단 규칙
 * 
 * ⚠️ 절대 원칙:
 * - fallback 실행 시도 차단
 * - 기본값 생성 코드 발견 차단
 * - 태그 없이 정책 생성 시도 차단
 * - Explain 없이 DNA 생성 시도 차단
 * - 즉시 throw + audit log
 */

import { auditLogger } from '../audit/audit-logger'

/**
 * 운영 차단 규칙 위반 감지
 * 
 * ⚠️ 절대 원칙:
 * - 위반 시 즉시 throw + audit log
 * 
 * @param violationType 위반 타입
 * @param details 위반 상세 정보
 * @throws Error 항상 throw
 */
export function assertOperationalGuard(
  violationType: 'FALLBACK_ATTEMPT' | 'DEFAULT_VALUE_GENERATION' | 'TAG_MISSING_FOR_POLICY' | 'EXPLAIN_MISSING_FOR_DNA',
  details?: string
): never {
  const errorMessage = `OPERATIONAL_GUARD_VIOLATION: ${violationType}${details ? ` - ${details}` : ''}`

  // ⚠️ Phase 6: 감사 로그 - 운영 차단
  auditLogger.log(
    'ANALYSIS_FAILED',
    'OPERATIONAL_GUARD',
    undefined,
    undefined,
    errorMessage
  )

  throw new Error(errorMessage)
}

/**
 * Fallback 실행 시도 차단
 * 
 * @param context 컨텍스트 정보
 */
export function assertNoFallback(context?: string): never {
  assertOperationalGuard('FALLBACK_ATTEMPT', context)
}

/**
 * 기본값 생성 차단
 * 
 * @param fieldName 필드명
 */
export function assertNoDefaultValue(fieldName?: string): never {
  assertOperationalGuard('DEFAULT_VALUE_GENERATION', fieldName)
}

/**
 * 태그 없이 정책 생성 시도 차단
 * 
 * @param policyType 정책 타입
 */
export function assertTagsForPolicy(policyType?: string): never {
  assertOperationalGuard('TAG_MISSING_FOR_POLICY', policyType)
}

/**
 * Explain 없이 DNA 생성 시도 차단
 */
export function assertExplainForDNA(): never {
  assertOperationalGuard('EXPLAIN_MISSING_FOR_DNA')
}




