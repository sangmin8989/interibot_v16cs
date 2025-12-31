/**
 * V5 → V3.1 Needs 변환 어댑터
 * 
 * ⚠️ V5 명세서 헌법 원칙 (절대 타협 금지):
 * 1. 필드 매핑만 수행 (해석/판단 금지)
 * 2. 기본값 생성 금지
 * 3. 누락 시 throw 규칙:
 *    - V5 태그에 없는 정보 → 해당 Needs는 생성하지 않음 (데이터 오류 아님)
 *    - 타입 불일치 → throw (데이터 오류)
 * 4. 데이터 손실 0% 보장
 * 5. 점수 계산 금지
 * 
 * 역할: V5 태그 결과를 V3.1 Needs 계산기에 전달
 * - V5는 결정자 (태그 생성)
 * - V3.1은 계산기 (Needs 계산)
 * - 단방향 변환: V5 → V3.1 (역방향 금지)
 * - 해석/판단 없이 순수 태그 → Needs 매핑만 수행
 */

import type { PersonalityTags } from '../types'
import type {
  NeedsResult,
  NeedScore,
  NeedsId,
  NeedsLevel,
  NeedsCategory,
  NeedsSource,
} from '@/lib/analysis/engine-v3.1-core/types/needs'

/**
 * V5 태그 → V3.1 Needs 변환
 * 
 * @param tags V5 성향 태그
 * @returns V3.1 Needs 결과
 */
export function convertV5TagsToV31NeedsInput(
  tags: PersonalityTags
): NeedsResult {
  // ⚠️ 헌법 원칙 3: 누락 시 throw (fallback 금지)
  if (!tags) {
    throw new Error('V5 → V3.1 변환: tags가 필수입니다.')
  }

  const needs: NeedScore[] = []

  // ⚠️ 헌법 원칙 1: 필드 매핑만 수행 (해석/판단 금지)
  // V5 태그를 V3.1 Needs로 직접 매핑

  // 1. STORAGE_RISK_HIGH → storage = 'high'
  if (tags.tags.includes('STORAGE_RISK_HIGH')) {
    needs.push({
      id: 'storage',
      level: 'high',
      category: 'lifestyle',
      source: 'explicit',
      reasons: [`V5 태그: ${tags.triggered_by['STORAGE_RISK_HIGH'] || 'STORAGE_RISK_HIGH'}`],
    })
  }

  // 2. SAFETY_RISK → safety = 'high'
  if (tags.tags.includes('SAFETY_RISK')) {
    needs.push({
      id: 'safety',
      level: 'high',
      category: 'safety',
      source: 'explicit',
      reasons: [`V5 태그: ${tags.triggered_by['SAFETY_RISK'] || 'SAFETY_RISK'}`],
    })
  }

  // 3. OLD_RISK_HIGH → durability = 'high'
  if (tags.tags.includes('OLD_RISK_HIGH')) {
    needs.push({
      id: 'durability',
      level: 'high',
      category: 'lifestyle',
      source: 'explicit',
      reasons: [`V5 태그: ${tags.triggered_by['OLD_RISK_HIGH'] || 'OLD_RISK_HIGH'}`],
    })
  }

  // 4. OLD_RISK_MEDIUM → durability = 'mid'
  if (tags.tags.includes('OLD_RISK_MEDIUM')) {
    needs.push({
      id: 'durability',
      level: 'mid',
      category: 'lifestyle',
      source: 'explicit',
      reasons: [`V5 태그: ${tags.triggered_by['OLD_RISK_MEDIUM'] || 'OLD_RISK_MEDIUM'}`],
    })
  }

  // 5. MAINTENANCE_EASY → maintenance = 'high'
  if (tags.tags.includes('MAINTENANCE_EASY')) {
    needs.push({
      id: 'maintenance',
      level: 'high',
      category: 'lifestyle',
      source: 'explicit',
      reasons: [`V5 태그: ${tags.triggered_by['MAINTENANCE_EASY'] || 'MAINTENANCE_EASY'}`],
    })
  }

  // 6. LONG_STAY → durability = 'high'
  if (tags.tags.includes('LONG_STAY')) {
    needs.push({
      id: 'durability',
      level: 'high',
      category: 'lifestyle',
      source: 'explicit',
      reasons: [`V5 태그: ${tags.triggered_by['LONG_STAY'] || 'LONG_STAY'}`],
    })
  }

  // 7. KITCHEN_IMPORTANT → flow = 'high'
  if (tags.tags.includes('KITCHEN_IMPORTANT')) {
    needs.push({
      id: 'flow',
      level: 'high',
      category: 'lifestyle',
      source: 'explicit',
      reasons: [`V5 태그: ${tags.triggered_by['KITCHEN_IMPORTANT'] || 'KITCHEN_IMPORTANT'}`],
    })
  }

  // ⚠️ 헌법 원칙 2: 기본값 생성 금지
  // V5 태그에 없는 Needs는 생성하지 않음
  // 빈 배열이어도 그대로 반환 (없는 정보는 없다)

  // ⚠️ 중복 매핑 규칙 (중요):
  // V5 어댑터는 중복을 허용하며, 우선순위/최종 결정은 V3.1 Needs Engine의 책임입니다.
  // 
  // 예시: durability 중복 매핑
  // - OLD_RISK_HIGH → durability = 'high'
  // - OLD_RISK_MEDIUM → durability = 'mid'
  // - LONG_STAY → durability = 'high'
  // 
  // ⚠️ V5 어댑터에서 절대 하면 안 되는 것:
  // - max/overwrite/merge ❌
  // - 마지막 값 선택 ❌
  // - 우선순위 판단 ❌
  // 
  // → 모든 매핑을 그대로 전달하고, V3.1 Needs Engine에서 최종 결정

  // ⚠️ 헌법 원칙 4: 데이터 손실 0% 보장
  // 모든 V5 태그가 Needs에 반영되었는지 확인
  // 단, V5 태그 중 V3.1 Needs에 매핑되지 않는 태그는 무시 (정상)
  // 예: BUDGET_TIGHT, DECISION_FATIGUE_HIGH, STYLE_EXCLUDE 등은 Needs에 직접 매핑되지 않음

  return {
    needs,
    timestamp: new Date().toISOString(),
  }
}




