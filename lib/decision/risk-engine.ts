// lib/decision/risk-engine.ts

import type { DecisionContext, RiskFactor, RiskCategory, DecisionResult, DecisionResultType, DecisionAlternative } from './types'
import { computeThresholds } from './thresholds'

function sumWeights(risks: RiskFactor[]) {
  const categoryWeights: Record<RiskCategory, number> = { ASSET: 0, MAINTENANCE: 0, DEFECT: 0 }
  for (const r of risks) categoryWeights[r.category] += r.weight
  return categoryWeights
}

function buildConsequences(riskCategories: RiskCategory[]): string[] {
  const out: string[] = []
  if (riskCategories.includes('ASSET')) out.push('자산 가치 방어 관점에서 불리할 수 있습니다.')
  if (riskCategories.includes('MAINTENANCE')) out.push('유지관리 부담이 예상보다 커질 수 있습니다.')
  if (riskCategories.includes('DEFECT')) out.push('하자 및 A/S 분쟁 위험이 높아질 수 있습니다.')
  return out
}

function uniqueNonEmpty(arr: string[]) {
  return Array.from(new Set(arr.map(s => s.trim()).filter(Boolean)))
}

export function aggregateRisks(
  risks: RiskFactor[],
  ctx: DecisionContext,
  alternatives?: DecisionAlternative[]
): DecisionResult {
  const categoryWeights = sumWeights(risks)
  const { assetThreshold, maintenanceThreshold, defectThreshold } = computeThresholds(ctx)

  // v1.1 판정 규칙 (강제)
  let result: DecisionResultType
  if (
    categoryWeights.DEFECT > defectThreshold ||
    (categoryWeights.ASSET > assetThreshold && categoryWeights.MAINTENANCE > maintenanceThreshold)
  ) {
    result = 'BLOCK'
  } else if (categoryWeights.ASSET > assetThreshold || categoryWeights.MAINTENANCE > maintenanceThreshold) {
    result = 'WARN'
  } else {
    result = 'PASS'
  }

  const riskCategory: RiskCategory[] = []
  if (categoryWeights.ASSET > assetThreshold) riskCategory.push('ASSET')
  if (categoryWeights.MAINTENANCE > maintenanceThreshold) riskCategory.push('MAINTENANCE')
  if (categoryWeights.DEFECT > defectThreshold) riskCategory.push('DEFECT')

  const reasons = uniqueNonEmpty(risks.map(r => r.reason))
  const consequences = buildConsequences(riskCategory)

  // alternatives 출력 규율: PASS면 무조건 undefined
  let finalAlternatives: DecisionAlternative[] | undefined
  if (result !== 'PASS') {
    // 폭주 방지
    const cap = result === 'WARN' ? 2 : 3
    finalAlternatives = (alternatives ?? []).slice(0, cap)
    if (finalAlternatives.length === 0) finalAlternatives = undefined
  }

  return {
    result,
    riskCategory,
    reasons,
    consequences,
    ...(finalAlternatives ? { alternatives: finalAlternatives } : {}),
  }
}
