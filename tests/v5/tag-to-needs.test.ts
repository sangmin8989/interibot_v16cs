/**
 * Phase 3-2: Tag → Needs Mapping Test
 * 
 * 목표: 태그가 정확히 Needs로 변환되는지 검증
 * 
 * ⚠️ 테스트 규칙:
 * - 기본값 생성 시 실패
 * - 태그 없는 Needs 생성 시 실패
 */

import { convertV5TagsToV31NeedsInput } from '@/lib/analysis/v5/adapters/v5-to-v31-needs'
import type { PersonalityTags } from '@/lib/analysis/v5/types'

/**
 * 테스트용 PersonalityTags 생성
 */
function createMockTags(tags: string[], triggeredBy?: Record<string, string>): PersonalityTags {
  return {
    tags,
    triggered_by: triggeredBy || {},
  }
}

describe('Tag → Needs Mapping Test', () => {
  describe('convertV5TagsToV31NeedsInput - 태그 → Needs 매핑', () => {
    it('maps STORAGE_RISK_HIGH to storage=high', () => {
      const tags = createMockTags(['STORAGE_RISK_HIGH'], {
        STORAGE_RISK_HIGH: 'Q04, Q05',
      })

      const result = convertV5TagsToV31NeedsInput(tags)

      const storageNeed = result.needs.find((n) => n.id === 'storage')
      expect(storageNeed).toBeDefined()
      expect(storageNeed?.level).toBe('high')
      expect(storageNeed?.category).toBe('lifestyle')
      expect(storageNeed?.source).toBe('explicit')
    })

    it('maps SAFETY_RISK to safety=high', () => {
      const tags = createMockTags(['SAFETY_RISK'], {
        SAFETY_RISK: 'Q08',
      })

      const result = convertV5TagsToV31NeedsInput(tags)

      const safetyNeed = result.needs.find((n) => n.id === 'safety')
      expect(safetyNeed).toBeDefined()
      expect(safetyNeed?.level).toBe('high')
      expect(safetyNeed?.category).toBe('safety')
    })

    it('maps OLD_RISK_HIGH to durability=high', () => {
      const tags = createMockTags(['OLD_RISK_HIGH'], {
        OLD_RISK_HIGH: 'Q01, Q02',
      })

      const result = convertV5TagsToV31NeedsInput(tags)

      const durabilityNeed = result.needs.find((n) => n.id === 'durability')
      expect(durabilityNeed).toBeDefined()
      expect(durabilityNeed?.level).toBe('high')
    })

    it('maps OLD_RISK_MEDIUM to durability=mid', () => {
      const tags = createMockTags(['OLD_RISK_MEDIUM'], {
        OLD_RISK_MEDIUM: 'Q01',
      })

      const result = convertV5TagsToV31NeedsInput(tags)

      const durabilityNeed = result.needs.find((n) => n.id === 'durability')
      expect(durabilityNeed).toBeDefined()
      expect(durabilityNeed?.level).toBe('mid')
    })

    it('maps LONG_STAY to durability=high', () => {
      const tags = createMockTags(['LONG_STAY'], {
        LONG_STAY: 'Q06, Q07',
      })

      const result = convertV5TagsToV31NeedsInput(tags)

      const durabilityNeed = result.needs.find((n) => n.id === 'durability')
      expect(durabilityNeed).toBeDefined()
      expect(durabilityNeed?.level).toBe('high')
    })

    it('maps MAINTENANCE_EASY to maintenance=high', () => {
      const tags = createMockTags(['MAINTENANCE_EASY'], {
        MAINTENANCE_EASY: 'Q17',
      })

      const result = convertV5TagsToV31NeedsInput(tags)

      const maintenanceNeed = result.needs.find((n) => n.id === 'maintenance')
      expect(maintenanceNeed).toBeDefined()
      expect(maintenanceNeed?.level).toBe('high')
    })

    it('maps KITCHEN_IMPORTANT to flow=high', () => {
      const tags = createMockTags(['KITCHEN_IMPORTANT'], {
        KITCHEN_IMPORTANT: 'Q12',
      })

      const result = convertV5TagsToV31NeedsInput(tags)

      const flowNeed = result.needs.find((n) => n.id === 'flow')
      expect(flowNeed).toBeDefined()
      expect(flowNeed?.level).toBe('high')
    })

    it('does not create needs for unmapped tags', () => {
      const tags = createMockTags(['BUDGET_TIGHT', 'DECISION_FATIGUE_HIGH', 'STYLE_EXCLUDE'])

      const result = convertV5TagsToV31NeedsInput(tags)

      // 매핑되지 않는 태그는 Needs 생성하지 않음
      expect(result.needs.length).toBe(0)
    })

    it('does not create default needs when no tags', () => {
      const tags = createMockTags([])

      const result = convertV5TagsToV31NeedsInput(tags)

      // 기본값 생성 금지
      expect(result.needs.length).toBe(0)
    })

    it('handles multiple tags correctly', () => {
      const tags = createMockTags([
        'STORAGE_RISK_HIGH',
        'SAFETY_RISK',
        'OLD_RISK_HIGH',
      ], {
        STORAGE_RISK_HIGH: 'Q04, Q05',
        SAFETY_RISK: 'Q08',
        OLD_RISK_HIGH: 'Q01, Q02',
      })

      const result = convertV5TagsToV31NeedsInput(tags)

      expect(result.needs.length).toBe(3)
      expect(result.needs.find((n) => n.id === 'storage')).toBeDefined()
      expect(result.needs.find((n) => n.id === 'safety')).toBeDefined()
      expect(result.needs.find((n) => n.id === 'durability')).toBeDefined()
    })
  })
})




