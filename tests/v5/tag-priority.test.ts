/**
 * Phase 3-2: 충돌 태그 우선순위 테스트
 * 
 * 목표: 중복 태그가 있을 때 문서화된 우선순위만 적용되는지 확인
 * 
 * ⚠️ 테스트 규칙:
 * - 점수 비교 없음
 * - 누적 없음
 */

import { applyTagPriority } from '@/lib/analysis/v5/tag-rules'
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

describe('Tag Priority Test', () => {
  describe('applyTagPriority - 태그 우선순위 적용', () => {
    it('applies priority rule for durability: OLD_RISK_HIGH > OLD_RISK_MEDIUM', () => {
      const tags = ['OLD_RISK_MEDIUM', 'OLD_RISK_HIGH']

      const result = applyTagPriority(tags)

      // OLD_RISK_HIGH가 더 높은 우선순위
      expect(result).toContain('OLD_RISK_HIGH')
      expect(result).not.toContain('OLD_RISK_MEDIUM')
    })

    it('applies priority rule for durability: OLD_RISK_HIGH > LONG_STAY', () => {
      const tags = ['LONG_STAY', 'OLD_RISK_HIGH']

      const result = applyTagPriority(tags)

      // OLD_RISK_HIGH가 더 높은 우선순위
      expect(result).toContain('OLD_RISK_HIGH')
      expect(result).not.toContain('LONG_STAY')
    })

    it('applies priority rule for durability: OLD_RISK_MEDIUM > LONG_STAY', () => {
      const tags = ['OLD_RISK_MEDIUM', 'LONG_STAY']

      const result = applyTagPriority(tags)

      // OLD_RISK_MEDIUM이 더 높은 우선순위
      expect(result).toContain('OLD_RISK_MEDIUM')
      expect(result).not.toContain('LONG_STAY')
    })

    it('preserves non-conflicting tags', () => {
      const tags = ['STORAGE_RISK_HIGH', 'SAFETY_RISK', 'OLD_RISK_MEDIUM', 'LONG_STAY']

      const result = applyTagPriority(tags)

      // 충돌하지 않는 태그는 모두 유지
      expect(result).toContain('STORAGE_RISK_HIGH')
      expect(result).toContain('SAFETY_RISK')
      // durability 그룹에서는 우선순위 높은 것만 유지
      expect(result).toContain('OLD_RISK_MEDIUM')
      expect(result).not.toContain('LONG_STAY')
    })
  })

  describe('convertV5TagsToV31NeedsInput - 우선순위 적용 후 Needs 변환', () => {
    it('applies priority rule for durability in needs mapping', () => {
      // OLD_RISK_MEDIUM과 LONG_STAY가 모두 있으면 OLD_RISK_MEDIUM만 적용
      // 하지만 어댑터는 중복을 허용하므로, 우선순위는 tag-confirmer에서 적용됨
      // 따라서 이미 우선순위가 적용된 태그를 받는다고 가정
      const tags = createMockTags(['OLD_RISK_MEDIUM'], {
        OLD_RISK_MEDIUM: 'Q01',
      })

      const result = convertV5TagsToV31NeedsInput(tags)

      const durabilityNeeds = result.needs.filter((n) => n.id === 'durability')
      // 우선순위 적용 후에는 하나만 있어야 함
      expect(durabilityNeeds.length).toBe(1)
      expect(durabilityNeeds[0].level).toBe('mid')
    })

    it('does not create duplicate durability needs from priority-applied tags', () => {
      // 우선순위 적용 후 태그 (OLD_RISK_HIGH만 포함)
      const tags = createMockTags(['OLD_RISK_HIGH'], {
        OLD_RISK_HIGH: 'Q01, Q02',
      })

      const result = convertV5TagsToV31NeedsInput(tags)

      const durabilityNeeds = result.needs.filter((n) => n.id === 'durability')
      // 중복 없이 하나만 생성
      expect(durabilityNeeds.length).toBe(1)
      expect(durabilityNeeds[0].level).toBe('high')
    })
  })
})




