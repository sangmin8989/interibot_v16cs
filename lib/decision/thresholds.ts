// lib/decision/thresholds.ts

import type { RiskCategory, DecisionContext } from './types'

export const BASE_THRESHOLD: Record<RiskCategory, number> = {
  ASSET: 3,
  MAINTENANCE: 3,
  DEFECT: 3,
}

export const THRESHOLD_MODIFIER = {
  HAS_KIDS: { DEFECT: -1 },
  MAINTENANCE_SENSITIVE: { MAINTENANCE: -1 },
  SHORT_RESIDENCE: { ASSET: +1 },
} as const

export function computeThresholds(ctx: DecisionContext) {
  let assetThreshold = BASE_THRESHOLD.ASSET
  let maintenanceThreshold = BASE_THRESHOLD.MAINTENANCE
  let defectThreshold = BASE_THRESHOLD.DEFECT

  if (ctx.household.hasKids) {
    defectThreshold += THRESHOLD_MODIFIER.HAS_KIDS.DEFECT
  }
  if (ctx.personality.maintenanceSensitive) {
    maintenanceThreshold += THRESHOLD_MODIFIER.MAINTENANCE_SENSITIVE.MAINTENANCE
  }
  if (ctx.space.residencePlan === 'short') {
    assetThreshold += THRESHOLD_MODIFIER.SHORT_RESIDENCE.ASSET
  }

  return { assetThreshold, maintenanceThreshold, defectThreshold }
}
