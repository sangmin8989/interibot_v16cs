// lib/decision/audit.ts

import type { DecisionTarget, DecisionResult, DecisionAlternative, DecisionContext } from './types'
import type { DecisionEnvelope } from './envelope'
import { computeThresholds } from './thresholds'

export type DecisionAuditLog = {
  occurredAt: string // ISO
  target: DecisionTarget
  result: 'PASS' | 'WARN' | 'BLOCK'
  payloadSummary: {
    material?: string
    keyFlags?: string[]
  }
  thresholdsSnapshot: {
    defect: number
    maintenance: number
    asset: number
  }
  reasons?: { key: string; weight: number }[]
  alternatives?: { optionType: string }[]
}

function extractPayloadSummary(
  target: DecisionTarget,
  payload: unknown,
  ctx: DecisionContext
): DecisionAuditLog['payloadSummary'] {
  const summary: DecisionAuditLog['payloadSummary'] = {
    keyFlags: [],
  }

  if (target === 'KITCHEN_COUNTERTOP') {
    const opt = payload as { material?: string }
    if (opt?.material) {
      summary.material = opt.material
    }
  }

  // keyFlags: tags에서 추출 (ctx에서 직접 접근 불가하므로 payloadSummary에만 저장)
  // 실제 tags는 context-builder에서 처리되므로 여기서는 빈 배열

  return summary
}

function extractReasons(decision: DecisionResult): { key: string; weight: number }[] {
  // reason 문장 저장 금지, 키/가중치만 저장
  return decision.reasons.map((_, idx) => ({
    key: `reason_${idx}`,
    weight: 1,
  }))
}

function extractAlternatives(decision: DecisionResult): { optionType: string }[] | undefined {
  // alternatives.reason 저장 금지, optionType만 저장
  if (!decision.alternatives || decision.alternatives.length === 0) {
    return undefined
  }
  return decision.alternatives.map(alt => ({
    optionType: alt.optionType,
  }))
}

export function createAuditLog(
  target: DecisionTarget,
  decision: DecisionResult,
  payload: unknown,
  ctx: DecisionContext
): DecisionAuditLog {
  const thresholds = computeThresholds(ctx)

  return {
    occurredAt: new Date().toISOString(),
    target,
    result: decision.result,
    payloadSummary: extractPayloadSummary(target, payload, ctx),
    thresholdsSnapshot: {
      defect: thresholds.defectThreshold,
      maintenance: thresholds.maintenanceThreshold,
      asset: thresholds.assetThreshold,
    },
    reasons: decision.reasons.length > 0 ? extractReasons(decision) : undefined,
    alternatives: extractAlternatives(decision),
  }
}

export async function saveAuditLog(log: DecisionAuditLog): Promise<void> {
  // 실패 허용 정책: 에러는 서버 로그로만 기록, 사용자 플로우 차단 안 함
  try {
    // 파일 로그 저장 (JSONL 형식)
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const logDir = path.join(process.cwd(), 'logs', 'decision')
    await fs.mkdir(logDir, { recursive: true })
    
    const logFile = path.join(logDir, `decision-${new Date().toISOString().split('T')[0]}.jsonl`)
    const logLine = JSON.stringify(log) + '\n'
    
    await fs.appendFile(logFile, logLine, 'utf-8')
  } catch (error) {
    // 에러는 서버 로그로만 기록
    console.error('[Decision Audit] 로그 저장 실패:', error)
    // 사용자 플로우 차단 안 함
  }
}

