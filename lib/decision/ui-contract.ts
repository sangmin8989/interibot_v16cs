// lib/decision/ui-contract.ts

import type { DecisionEnvelope } from './envelope'
import type { DecisionAlternative } from './types'

export interface DecisionUIContract {
  decisionResult: 'PASS' | 'WARN' | 'BLOCK'
  alternatives: DecisionAlternative[]
  decisionBlocked: boolean
}

export function extractUIContract(envelope: DecisionEnvelope | null | undefined): DecisionUIContract {
  if (!envelope) {
    return {
      decisionResult: 'PASS',
      alternatives: [],
      decisionBlocked: false,
    }
  }

  return {
    decisionResult: envelope.result,
    alternatives: envelope.alternatives ?? [],
    decisionBlocked: envelope.result === 'BLOCK',
  }
}

