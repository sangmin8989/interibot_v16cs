// lib/decision/index.ts

import type { DecisionTarget, DecisionResult, KitchenCountertopOption } from './types'
import type { DecisionContext } from './types'
import { evaluateKitchenCountertop } from './rules/kitchen'

export function evaluateDecision(
  target: DecisionTarget,
  ctx: DecisionContext,
  payload: unknown
): DecisionResult {
  // 예외는 FAIL 금지 → 보수 처리(WARN/BLOCK)
  try {
    switch (target) {
      case 'KITCHEN_COUNTERTOP': {
        const opt = payload as KitchenCountertopOption
        if (!opt?.material) {
          return {
            result: 'WARN',
            riskCategory: ['MAINTENANCE'],
            reasons: ['선택 옵션 정보가 불완전하여 보수적으로 처리합니다.'],
            consequences: ['추가 확인 없이 진행하면 유지관리/하자 리스크 판단이 흔들릴 수 있습니다.'],
            alternatives: [
              { optionType: 'QUARTZ', reason: '일반적으로 유지관리 및 하자 리스크가 낮은 편입니다.' },
            ],
          }
        }
        return evaluateKitchenCountertop(ctx, opt)
      }
      default:
        return {
          result: 'WARN',
          riskCategory: ['ASSET'],
          reasons: ['대상 규칙이 구현되지 않았습니다. 보수적으로 처리합니다.'],
          consequences: ['규칙 미구현 상태에서 선택하면 자산/유지관리/하자 리스크 검증이 누락됩니다.'],
        }
    }
  } catch {
    return {
      result: 'WARN',
      riskCategory: ['DEFECT'],
      reasons: ['판정 처리 중 오류가 발생하여 보수적으로 처리합니다.'],
      consequences: ['오류 상태에서 진행하면 하자/분쟁 리스크를 사전 차단할 수 없습니다.'],
    }
  }
}
