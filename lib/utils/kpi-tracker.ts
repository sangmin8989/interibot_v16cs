/**
 * KPI 계측 유틸리티
 * 
 * 사용자의 결정 과정을 수치로 측정합니다.
 * - 결정 완료 시간 (decisionDurationMs)
 * - 옵션 변경 횟수 (optionChangeCount)
 * - LOCK 재변경 시도 횟수 (lockOverrideAttemptCount)
 */

export interface KPISession {
  sessionId: string
  decisionStartAt: string | null
  decisionEndAt: string | null
  optionChangeCount: number
  lockOverrideAttemptCount: number
}

export interface KPIEvent {
  sessionId: string
  eventType: 'decision_start' | 'option_change' | 'lock_override_attempt' | 'decision_complete'
  eventData: Record<string, unknown>
  timestamp: string
}

/**
 * 세션 ID 생성 (또는 기존 세션 ID 가져오기)
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('kpi_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('kpi_session_id', sessionId)
  }
  return sessionId
}

/**
 * KPI 이벤트 전송
 */
export async function sendKPIEvent(event: Omit<KPIEvent, 'sessionId' | 'timestamp'>): Promise<void> {
  if (typeof window === 'undefined') return
  
  const sessionId = getOrCreateSessionId()
  const kpiEvent: KPIEvent = {
    ...event,
    sessionId,
    timestamp: new Date().toISOString()
  }

  try {
    await fetch('/api/kpi/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kpiEvent)
    })
  } catch (error) {
    // KPI 계측 실패는 사용자 경험에 영향을 주지 않도록 조용히 실패
    console.warn('KPI 이벤트 전송 실패:', error)
  }
}

/**
 * 결정 시작 이벤트
 */
export function trackDecisionStart(): void {
  const sessionId = getOrCreateSessionId()
  sessionStorage.setItem('kpi_decision_start', new Date().toISOString())
  
  sendKPIEvent({
    eventType: 'decision_start',
    eventData: {
      sessionId
    }
  })
}

/**
 * 옵션 변경 이벤트
 */
export function trackOptionChange(processId: string, fromOption: string, toOption: string): void {
  sendKPIEvent({
    eventType: 'option_change',
    eventData: {
      processId,
      fromOption,
      toOption
    }
  })
}

/**
 * LOCK 변경 시도 이벤트
 */
export function trackLockOverrideAttempt(
  processId: string,
  lockLevel: 'hard' | 'soft',
  attemptedOption: string
): void {
  sendKPIEvent({
    eventType: 'lock_override_attempt',
    eventData: {
      processId,
      lockLevel,
      attemptedOption
    }
  })
}

/**
 * 결정 완료 이벤트
 */
export function trackDecisionComplete(finalOptions?: Record<string, string>): void {
  const decisionStartAt = sessionStorage.getItem('kpi_decision_start')
  
  sendKPIEvent({
    eventType: 'decision_complete',
    eventData: {
      decisionStartAt,
      finalOptions: finalOptions || {}
    }
  })
  
  // 세션 종료 (선택사항: 다음 세션을 위해 유지할 수도 있음)
  // sessionStorage.removeItem('kpi_decision_start')
}




















