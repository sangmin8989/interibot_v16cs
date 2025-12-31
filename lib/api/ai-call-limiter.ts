/**
 * AI 호출 제한 로직
 * 
 * ⚠️ 절대 규칙: 세션당 AI 호출 3회 강제
 * 
 * @see Phase 3 작업 6️⃣
 */

/**
 * AI 호출 세션 추적 데이터
 */
interface AICallSession {
  sessionId: string
  callCount: number
  calls: Array<{
    timestamp: string
    purpose: string
    model?: string
  }>
  createdAt: string
  lastCallAt: string
}

/**
 * 세션당 최대 AI 호출 횟수
 */
const MAX_AI_CALLS_PER_SESSION = 3

/**
 * 세션 ID 생성 (또는 기존 세션 ID 반환)
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    // 서버 사이드: 요청 헤더에서 세션 ID 추출 또는 생성
    // 클라이언트에서 전달받은 세션 ID 사용
    return `server_${Date.now()}`
  }

  // 클라이언트 사이드: localStorage에서 세션 ID 가져오기 또는 생성
  const stored = localStorage.getItem('v5AISessionId')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.sessionId && parsed.createdAt) {
        // 세션이 24시간 이내면 기존 세션 사용
        const createdAt = new Date(parsed.createdAt)
        const now = new Date()
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        if (hoursDiff < 24) {
          return parsed.sessionId
        }
      }
    } catch {
      // 파싱 실패 시 새 세션 생성
    }
  }

  // 새 세션 생성
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  localStorage.setItem('v5AISessionId', JSON.stringify({
    sessionId: newSessionId,
    createdAt: new Date().toISOString(),
  }))
  return newSessionId
}

/**
 * AI 호출 세션 데이터 로드
 */
function loadAICallSession(sessionId: string): AICallSession | null {
  if (typeof window === 'undefined') {
    // 서버 사이드: 세션 데이터는 클라이언트에서 전달받거나 별도 저장소 사용
    // Phase 1에서는 간단하게 null 반환 (서버 사이드 추적은 Phase 2에서)
    return null
  }

  const stored = localStorage.getItem(`v5AICallSession_${sessionId}`)
  if (!stored) return null

  try {
    return JSON.parse(stored) as AICallSession
  } catch {
    return null
  }
}

/**
 * AI 호출 세션 데이터 저장
 */
function saveAICallSession(session: AICallSession): void {
  if (typeof window === 'undefined') {
    // 서버 사이드: 저장 불가 (클라이언트에 전달하여 저장하도록)
    return
  }

  localStorage.setItem(`v5AICallSession_${session.sessionId}`, JSON.stringify(session))
}

/**
 * AI 호출 가능 여부 확인
 */
export function canMakeAICall(sessionId?: string): {
  allowed: boolean
  remaining: number
  message?: string
} {
  const sid = sessionId || getOrCreateSessionId()
  const session = loadAICallSession(sid)

  if (!session) {
    // 새 세션이면 허용
    return {
      allowed: true,
      remaining: MAX_AI_CALLS_PER_SESSION,
    }
  }

  const remaining = MAX_AI_CALLS_PER_SESSION - session.callCount

  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      message: `세션당 AI 호출 제한(${MAX_AI_CALLS_PER_SESSION}회)을 초과했습니다. 새로고침 후 다시 시도해주세요.`,
    }
  }

  return {
    allowed: true,
    remaining,
  }
}

/**
 * AI 호출 기록
 */
export function recordAICall(
  purpose: string,
  model?: string,
  sessionId?: string
): {
  success: boolean
  remaining: number
  error?: string
} {
  const sid = sessionId || getOrCreateSessionId()
  let session = loadAICallSession(sid)

  if (!session) {
    // 새 세션 생성
    session = {
      sessionId: sid,
      callCount: 0,
      calls: [],
      createdAt: new Date().toISOString(),
      lastCallAt: new Date().toISOString(),
    }
  }

  // 호출 가능 여부 확인
  const check = canMakeAICall(sid)
  if (!check.allowed) {
    console.error('[AI Call Limiter] 호출 제한 초과:', {
      sessionId: sid,
      callCount: session.callCount,
      purpose,
    })
    return {
      success: false,
      remaining: 0,
      error: check.message,
    }
  }

  // 호출 기록
  session.callCount += 1
  session.calls.push({
    timestamp: new Date().toISOString(),
    purpose,
    model,
  })
  session.lastCallAt = new Date().toISOString()

  // 저장
  saveAICallSession(session)

  console.log('[AI Call Limiter] 호출 기록:', {
    sessionId: sid,
    callCount: session.callCount,
    remaining: MAX_AI_CALLS_PER_SESSION - session.callCount,
    purpose,
  })

  return {
    success: true,
    remaining: MAX_AI_CALLS_PER_SESSION - session.callCount,
  }
}

/**
 * AI 호출 Action 타입 (Phase 4)
 */
export type AIAction =
  | 'TRAIT_ANALYSIS'
  | 'TRAIT_ANALYSIS_PHASE2'
  | 'STYLE_RECOMMEND'
  | 'PROCESS_RECOMMEND'
  | 'OPTION_RECOMMEND'
  | 'COLOR_RECOMMEND'
  | 'SUMMARY'
  | 'IMAGE_GENERATE'
  | 'IMAGE_PROMPT'
  | 'VISION_ANALYSIS'
  | 'ESTIMATE_AI'
  | 'CHAT'
  | 'DEBUG'

/**
 * Phase 7: IMAGE 계열 Action 판별
 */
function isImageAction(action: AIAction): boolean {
  return action === 'IMAGE_GENERATE' || action === 'IMAGE_PROMPT' || action === 'VISION_ANALYSIS'
}

/**
 * Phase 7: 연속 호출 판별 (세션 기반)
 * 첫 요청은 false 반환 (무조건 통과)
 */
function isConsecutiveCall(sessionId: string, action: AIAction): boolean {
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드: localStorage 사용
    const key = `v5AICallLast_${sessionId}_${action}`
    const lastCall = localStorage.getItem(key)
    const now = Date.now()
    
    if (!lastCall) {
      // 첫 요청
      localStorage.setItem(key, now.toString())
      return false
    }
    
    const lastCallTime = parseInt(lastCall, 10)
    const timeDiff = now - lastCallTime
    
    // 5분 이내 연속 호출로 판단
    if (timeDiff < 5 * 60 * 1000) {
      localStorage.setItem(key, now.toString())
      return true
    }
    
    localStorage.setItem(key, now.toString())
    return false
  } else {
    // 서버 사이드: 간단한 메모리 기반 추적 (세션별)
    // 실제로는 Redis 등 사용 권장, 여기서는 간단 구현
    const memoryKey = `lastCall_${sessionId}_${action}`
    const globalMemory = (global as any).__aiCallMemory || {}
    const lastCall = globalMemory[memoryKey]
    const now = Date.now()
    
    if (!lastCall) {
      globalMemory[memoryKey] = now
      ;(global as any).__aiCallMemory = globalMemory
      return false
    }
    
    const timeDiff = now - lastCall
    if (timeDiff < 5 * 60 * 1000) {
      globalMemory[memoryKey] = now
      ;(global as any).__aiCallMemory = globalMemory
      return true
    }
    
    globalMemory[memoryKey] = now
    ;(global as any).__aiCallMemory = globalMemory
    return false
  }
}

/**
 * Phase 7: Level 1 소프트 제한 (응답 지연)
 * 지연 범위: 300~800ms (랜덤)
 */
function applySoftDelay(): Promise<void> {
  const delayMs = Math.floor(Math.random() * (800 - 300 + 1)) + 300
  return new Promise(resolve => setTimeout(resolve, delayMs))
}

/**
 * 서버 사이드 AI 호출 래퍼 (Phase 4) - 오버로드 1
 */
export async function callAIWithLimit<T>(options: {
  sessionId?: string
  action: AIAction
  prompt: any
  enableLimit: boolean
  aiCall: () => Promise<T>
}): Promise<T>

/**
 * 클라이언트 사이드 AI 호출 래퍼 - 오버로드 2
 */
export async function callAIWithLimit<T>(
  purpose: string,
  model: string,
  aiCall: () => Promise<T>
): Promise<{
  success: boolean
  result?: T
  error?: string
  remaining: number
}>

/**
 * AI 호출 래퍼 함수 구현
 */
export async function callAIWithLimit<T>(
  optionsOrPurpose: { sessionId?: string; action: AIAction; prompt: any; enableLimit: boolean; aiCall: () => Promise<T> } | string,
  modelOrAction?: string | AIAction,
  aiCallOrPrompt?: () => Promise<T> | any,
  enableLimitOrAiCall?: boolean | (() => Promise<T>),
  aiCallFn?: () => Promise<T>
): Promise<T | { success: boolean; result?: T; error?: string; remaining: number }> {
  // 서버 사이드 호출 (Phase 4)
  if (typeof optionsOrPurpose === 'object' && 'action' in optionsOrPurpose) {
    const { sessionId, action, prompt, enableLimit, aiCall } = optionsOrPurpose

    // 세션 ID 생성 (없으면 자동 생성)
    const sid = sessionId || getOrCreateSessionId()

    // promptHash 생성 (전체 prompt 저장 금지)
    const promptStr = typeof prompt === 'string' 
      ? prompt 
      : JSON.stringify(prompt)
    const promptHash = Buffer.from(promptStr).toString('base64').substring(0, 16)

    // 로그 수집 (항상)
    const logEntry = {
      sessionId: sid,
      action,
      timestamp: new Date().toISOString(),
      promptHash,
    }

    console.log('[AI Call Limiter] 호출 기록:', logEntry)

    // Phase 7: IMAGE 계열만 enableLimit 오버라이드
    const isImage = isImageAction(action)
    const effectiveEnableLimit = isImage 
      ? (process.env.NEXT_PUBLIC_AI_RATE_LIMIT === 'true' || enableLimit)
      : false // IMAGE가 아니면 절대 제한 안 함

    // Phase 7: Level 1 소프트 제한 판별 (IMAGE 계열만, 연속 호출만)
    const isConsecutive = isConsecutiveCall(sid, action)
    const shouldApplySoftDelay = isImage && isConsecutive

    // enableLimit=false일 때는 제한 없이 통과
    if (!effectiveEnableLimit) {
      // Phase 5: 관측 로깅 시작
      const startedAt = Date.now()
      const routeName = action
      const provider = 'openai' // 기본값
      const imageCall = isImage
      const promptSize = typeof prompt === 'string' 
        ? prompt.length 
        : JSON.stringify(prompt).length

      try {
        const result = await aiCall()
        const duration = Date.now() - startedAt

        // Phase 5: 성공 로그 (비동기 fire-and-forget)
        if (process.env.NODE_ENV !== 'production') {
          queueMicrotask(() => {
            try {
              // OpenAI 응답에서 model과 tokens 추출 시도
              let model = 'unknown'
              let tokensEstimated: string | number = 'NA'

              // OpenAI 응답 구조 확인
              if (result && typeof result === 'object' && 'model' in result) {
                model = String(result.model || 'unknown')
              }
              if (result && typeof result === 'object' && 'usage' in result) {
                const usage = (result as any).usage
                if (usage && typeof usage.total_tokens === 'number') {
                  tokensEstimated = usage.total_tokens
                }
              }

              // Phase 7: soft_delay_applied 로그 추가
              const softDelayApplied = shouldApplySoftDelay ? 'true' : 'false'
              
              console.log(
                `[AI_CALL]
route=${routeName}
model=${model}
provider=${provider}
duration=${duration}ms
tokens~=${tokensEstimated}
success=true
soft_delay_applied=${softDelayApplied}`
              )
            } catch (logError) {
              // 로그 실패해도 본 요청에 영향 없음
              console.error('[AI Call Limiter] 로그 출력 실패:', logError)
            }
          })
        }

        return result
      } catch (error) {
        const duration = Date.now() - startedAt

        // Phase 5: 실패 로그 (비동기 fire-and-forget)
        if (process.env.NODE_ENV !== 'production') {
          queueMicrotask(() => {
            try {
              const errorCode = (error as any)?.code || (error as any)?.status || 'UNKNOWN'
              
              // Phase 7: soft_delay_applied 로그 추가
              const softDelayApplied = shouldApplySoftDelay ? 'true' : 'false'
              
              console.log(
                `[AI_CALL]
route=${routeName}
model=unknown
provider=${provider}
duration=${duration}ms
tokens~=NA
success=false
error=${errorCode}
soft_delay_applied=${softDelayApplied}`
              )
            } catch (logError) {
              // 로그 실패해도 본 요청에 영향 없음
              console.error('[AI Call Limiter] 로그 출력 실패:', logError)
            }
          })
        }

        // 에러는 그대로 전파 (기존 동작 유지)
        throw error
      }
    }

    // Phase 5: 관측 로깅 시작
    const startedAt = Date.now()
    const routeName = action
    const provider = 'openai'
    const imageCall = isImage
    const promptSize = typeof prompt === 'string' 
      ? prompt.length 
      : JSON.stringify(prompt).length

    try {
      // Phase 7: Level 1 소프트 제한 적용 (비동기 지연)
      if (shouldApplySoftDelay) {
        await applySoftDelay()
      }

      const result = await aiCall()
      const duration = Date.now() - startedAt
      
      // Phase 7: IMAGE 계열은 recordAICall 사용 안 함 (제한 없음)
      // recordAICall(action, undefined, sid)

      // Phase 5: 성공 로그 (비동기 fire-and-forget)
      if (process.env.NODE_ENV !== 'production') {
        queueMicrotask(() => {
          try {
            let model = 'unknown'
            let tokensEstimated: string | number = 'NA'

            if (result && typeof result === 'object' && 'model' in result) {
              model = String(result.model || 'unknown')
            }
            if (result && typeof result === 'object' && 'usage' in result) {
              const usage = (result as any).usage
              if (usage && typeof usage.total_tokens === 'number') {
                tokensEstimated = usage.total_tokens
              }
            }

            // Phase 7: soft_delay_applied 로그 추가
            const softDelayApplied = shouldApplySoftDelay ? 'true' : 'false'
            
            console.log(
              `[AI_CALL]
route=${routeName}
model=${model}
provider=${provider}
duration=${duration}ms
tokens~=${tokensEstimated}
success=true
soft_delay_applied=${softDelayApplied}`
            )
          } catch (logError) {
            console.error('[AI Call Limiter] 로그 출력 실패:', logError)
          }
        })
      }

      return result
    } catch (error) {
      const duration = Date.now() - startedAt

      // Phase 5: 실패 로그 (비동기 fire-and-forget)
      if (process.env.NODE_ENV !== 'production') {
        queueMicrotask(() => {
          try {
            const errorCode = (error as any)?.code || (error as any)?.status || 'UNKNOWN'
            
            // Phase 7: soft_delay_applied 로그 추가
            const softDelayApplied = shouldApplySoftDelay ? 'true' : 'false'
            
            console.log(
              `[AI_CALL]
route=${routeName}
model=unknown
provider=${provider}
duration=${duration}ms
tokens~=NA
success=false
error=${errorCode}
soft_delay_applied=${softDelayApplied}`
            )
          } catch (logError) {
            console.error('[AI Call Limiter] 로그 출력 실패:', logError)
          }
        })
      }

      console.error('[AI Call Limiter] 호출 실패:', {
        ...logEntry,
        error: error instanceof Error ? error.message : '알 수 없는 에러',
      })
      throw error
    }
  }

  // 클라이언트 사이드 호출 (기존)
  const purpose = optionsOrPurpose as string
  const model = modelOrAction as string
  const aiCall = aiCallOrPrompt as () => Promise<T>

  // 호출 가능 여부 확인
  const check = canMakeAICall()
  if (!check.allowed) {
    return {
      success: false,
      error: check.message,
      remaining: 0,
    } as any
  }

  try {
    // AI 호출 실행
    const result = await aiCall()

    // 호출 기록
    const record = recordAICall(purpose, model)
    if (!record.success) {
      // 기록 실패 (이미 제한 초과) - 하지만 호출은 성공했으므로 결과 반환
      console.warn('[AI Call Limiter] 호출은 성공했지만 기록 실패:', record.error)
    }

    return {
      success: true,
      result,
      remaining: record.remaining,
    } as any
  } catch (error) {
    // AI 호출 실패 시에도 기록하지 않음 (실제 호출이 아니므로)
    console.error('[AI Call Limiter] AI 호출 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI 호출 실패',
      remaining: check.remaining,
    } as any
  }
}

/**
 * 세션 초기화 (테스트/디버깅용)
 */
export function resetAICallSession(sessionId?: string): void {
  if (typeof window === 'undefined') return

  const sid = sessionId || getOrCreateSessionId()
  localStorage.removeItem(`v5AICallSession_${sid}`)
  console.log('[AI Call Limiter] 세션 초기화:', sid)
}

/**
 * 현재 세션의 AI 호출 상태 조회
 */
export function getAICallStatus(sessionId?: string): {
  sessionId: string
  callCount: number
  remaining: number
  calls: AICallSession['calls']
} {
  const sid = sessionId || getOrCreateSessionId()
  const session = loadAICallSession(sid)

  if (!session) {
    return {
      sessionId: sid,
      callCount: 0,
      remaining: MAX_AI_CALLS_PER_SESSION,
      calls: [],
    }
  }

  return {
    sessionId: sid,
    callCount: session.callCount,
    remaining: MAX_AI_CALLS_PER_SESSION - session.callCount,
    calls: session.calls,
  }
}


