// lib/decision/envelope.ts

import type { DecisionTarget, DecisionResult, DecisionAlternative, RiskCategory } from './types'
import { computeThresholds } from './thresholds'
import type { DecisionContext } from './types'

export type DecisionEnvelope = {
  target: DecisionTarget
  result: 'PASS' | 'WARN' | 'BLOCK'
  reasons?: { key: string; weight: number }[]
  alternatives?: DecisionAlternative[]
  thresholdsSnapshot: {
    defect: number
    maintenance: number
    asset: number
  }
}

export function wrapDecisionResult(
  target: DecisionTarget,
  decision: DecisionResult,
  ctx: DecisionContext
): DecisionEnvelope {
  const thresholds = computeThresholds(ctx)

  const reasons = decision.reasons.map((reason, idx) => ({
    key: `reason_${idx}`,
    weight: 1,
  }))

  return {
    target,
    result: decision.result,
    reasons: reasons.length > 0 ? reasons : undefined,
    alternatives: decision.alternatives,
    thresholdsSnapshot: {
      defect: thresholds.defectThreshold,
      maintenance: thresholds.maintenanceThreshold,
      asset: thresholds.assetThreshold,
    },
  }
}

