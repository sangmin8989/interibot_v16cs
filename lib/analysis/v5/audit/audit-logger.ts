/**
 * Phase 6: 감사 로그 (Audit Log)
 * 
 * ⚠️ 절대 원칙:
 * - 개인정보 저장 금지
 * - 원문 답변 저장 금지
 * - 해시만 저장
 * - 재현성 보장
 */

/**
 * 감사 로그 이벤트 타입
 */
export type AuditEvent =
  | 'ANALYSIS_REQUESTED'
  | 'TAGS_CONFIRMED'
  | 'DNA_DETERMINED'
  | 'ESTIMATE_POLICY_BUILT'
  | 'ANALYSIS_COMPLETED'
  | 'ANALYSIS_FAILED'

/**
 * 감사 로그 스키마
 * 
 * ⚠️ 절대 원칙:
 * - 개인정보 저장 금지
 * - 원문 답변 저장 금지
 * - 해시만 저장
 */
export interface AuditLog {
  /** 요청 ID (UUID) */
  requestId: string
  /** 이벤트 타입 */
  event: AuditEvent
  /** 입력 해시 */
  inputHash: string
  /** 출력 해시 (선택) */
  outputHash?: string
  /** 타임스탬프 */
  timestamp: string
  /** 버전 */
  version: 'v5'
  /** 에러 메시지 (실패 시) */
  errorMessage?: string
}

/**
 * 감사 로그 저장소
 * 
 * ⚠️ 운영 환경에서는 실제 DB/파일 시스템에 저장
 * 개발 환경에서는 메모리/콘솔에 저장
 */
class AuditLogger {
  private logs: AuditLog[] = []

  /**
   * 감사 로그 기록
   * 
   * ⚠️ 절대 원칙:
   * - 개인정보 저장 금지
   * - 원문 답변 저장 금지
   * - 해시만 저장
   * 
   * @param event 이벤트 타입
   * @param inputHash 입력 해시
   * @param outputHash 출력 해시 (선택)
   * @param requestId 요청 ID (선택, 없으면 생성)
   * @param errorMessage 에러 메시지 (실패 시)
   */
  log(
    event: AuditEvent,
    inputHash: string,
    outputHash?: string,
    requestId?: string,
    errorMessage?: string
  ): void {
    const log: AuditLog = {
      requestId: requestId || this.generateRequestId(),
      event,
      inputHash,
      outputHash,
      timestamp: new Date().toISOString(),
      version: 'v5',
      errorMessage,
    }

    // ⚠️ 운영 환경에서는 실제 저장소에 저장
    // 개발 환경에서는 메모리/콘솔에 저장
    this.logs.push(log)
    
    // ⚠️ 운영 로그: logger.info 사용
    console.log('[AUDIT]', JSON.stringify(log))
  }

  /**
   * 요청 ID 생성
   */
  private generateRequestId(): string {
    // UUID v4 형식 (간단한 구현)
    return `v5-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * 로그 조회 (개발/디버깅용)
   */
  getLogs(): AuditLog[] {
    return [...this.logs]
  }

  /**
   * 로그 초기화 (테스트용)
   */
  clear(): void {
    this.logs = []
  }
}

// 싱글톤 인스턴스
export const auditLogger = new AuditLogger()




