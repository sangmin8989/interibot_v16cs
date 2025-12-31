// lib/decision/rules/kitchen.ts

import type { DecisionContext, KitchenCountertopOption, RiskFactor, DecisionAlternative } from '../types'
import { aggregateRisks } from '../risk-engine'

export function evaluateKitchenCountertop(ctx: DecisionContext, option: KitchenCountertopOption) {
  const risks: RiskFactor[] = []
  const alternatives: DecisionAlternative[] = []

  if (option.material === 'PET_GLOSS') {
    risks.push({
      category: 'MAINTENANCE',
      weight: 2,
      reason: '스크래치 및 변색 발생 빈도가 높습니다.',
    })

    if (ctx.household.hasKids) {
      risks.push({
        category: 'DEFECT',
        weight: 2,
        reason: '충격에 의한 하자 발생 가능성이 높습니다.',
      })
    }

    if (ctx.personality.maintenanceSensitive) {
      risks.push({
        category: 'MAINTENANCE',
        weight: 1,
        reason: '유지관리 민감 성향에서는 부담이 커질 수 있습니다.',
      })
    }

    alternatives.push(
      {
        optionType: 'QUARTZ',
        reason: '현재 사용 조건에서 유지관리 및 하자 리스크가 상대적으로 낮습니다.',
      },
      {
        optionType: 'PORCELAIN',
        reason: '스크래치·열·오염 대응에서 유지관리 리스크가 낮은 편입니다.',
      }
    )
  }

  if (option.material === 'QUARTZ') {
    // 기본은 안전 쪽(리스크 최소)
    // 단, 예산 민감 + low면 ASSET/WARN 가능 (v1.1에서는 "추천" 표현 금지)
    if (ctx.budget.level === 'low' && ctx.personality.budgetSensitive) {
      risks.push({
        category: 'ASSET',
        weight: 1,
        reason: '예산 제약 대비 투자 효율이 불리할 수 있습니다.',
      })
      alternatives.push({
        optionType: 'PORCELAIN',
        reason: '유지관리 리스크를 유지하면서 옵션 구성을 조정할 여지가 있습니다.',
      })
    }
  }

  if (option.material === 'PORCELAIN') {
    // 기본은 안전 쪽
    // 필요 시 향후 rules 확장
  }

  return aggregateRisks(risks, ctx, alternatives)
}
