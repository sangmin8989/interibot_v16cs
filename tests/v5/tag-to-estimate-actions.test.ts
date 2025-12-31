/**
 * Phase 3-2: Tag → Estimate Actions Mapping Test
 * 
 * 목표: 태그가 정확히 견적 액션으로 변환되는지 검증
 */

import { mapV5TagsToEstimateActions } from '@/lib/analysis/v5/adapters/v5-to-estimate-actions'
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

describe('Tag → Estimate Actions Mapping Test', () => {
  describe('mapV5TagsToEstimateActions - 태그 → 견적 액션 매핑', () => {
    it('maps OLD_RISK_HIGH to required processes', () => {
      const tags = createMockTags(['OLD_RISK_HIGH'])

      const result = mapV5TagsToEstimateActions(tags)

      expect(result.requiredProcesses).toContain('waterproof')
      expect(result.requiredProcesses).toContain('plumbing')
      expect(result.gradeRecommendations['waterproof']).toBe('premium')
      expect(result.gradeRecommendations['plumbing']).toBe('premium')
    })

    it('maps OLD_RISK_MEDIUM to recommended processes', () => {
      const tags = createMockTags(['OLD_RISK_MEDIUM'])

      const result = mapV5TagsToEstimateActions(tags)

      expect(result.recommendedProcesses).toContain('waterproof')
      expect(result.recommendedProcesses).toContain('plumbing')
    })

    it('maps STORAGE_RISK_HIGH to storage process and options', () => {
      const tags = createMockTags(['STORAGE_RISK_HIGH'])

      const result = mapV5TagsToEstimateActions(tags)

      expect(result.requiredProcesses).toContain('storage')
      expect(result.defaultOptions).toContain('closet')
      expect(result.defaultOptions).toContain('shoeRack')
      expect(result.gradeRecommendations['storage']).toBe('argen')
    })

    it('maps SAFETY_RISK to bathroom process and safety options', () => {
      const tags = createMockTags(['SAFETY_RISK'])

      const result = mapV5TagsToEstimateActions(tags)

      expect(result.requiredProcesses).toContain('bathroom')
      expect(result.defaultOptions).toContain('bathroom_safety_handle')
      expect(result.defaultOptions).toContain('bathroom_slip_tile')
    })

    it('maps SHORT_STAY to excluded options and basic grade', () => {
      const tags = createMockTags(['SHORT_STAY'])

      const result = mapV5TagsToEstimateActions(tags)

      expect(result.excludedOptions).toContain('demolition')
      expect(result.excludedOptions).toContain('structure_change')
      expect(result.gradeRecommendations['*']).toBe('basic')
    })

    it('maps LONG_STAY to recommended processes and premium grade', () => {
      const tags = createMockTags(['LONG_STAY'])

      const result = mapV5TagsToEstimateActions(tags)

      expect(result.recommendedProcesses).toContain('finish')
      expect(result.recommendedProcesses).toContain('window')
      expect(result.gradeRecommendations['finish']).toBe('premium')
      expect(result.gradeRecommendations['window']).toBe('premium')
    })

    it('maps KITCHEN_IMPORTANT to kitchen process', () => {
      const tags = createMockTags(['KITCHEN_IMPORTANT'])

      const result = mapV5TagsToEstimateActions(tags)

      expect(result.requiredProcesses).toContain('kitchen')
      expect(result.gradeRecommendations['kitchen']).toBe('argen')
    })

    it('maps BATHROOM_COMFORT to bathroom process', () => {
      const tags = createMockTags(['BATHROOM_COMFORT'])

      const result = mapV5TagsToEstimateActions(tags)

      expect(result.requiredProcesses).toContain('bathroom')
      expect(result.gradeRecommendations['bathroom']).toBe('premium')
    })

    it('maps BUDGET_TIGHT to basic grade recommendation', () => {
      const tags = createMockTags(['BUDGET_TIGHT'])

      const result = mapV5TagsToEstimateActions(tags)

      expect(result.gradeRecommendations['*']).toBe('basic')
    })

    it('does not create actions for unmapped tags', () => {
      const tags = createMockTags(['STYLE_EXCLUDE', 'MAINTENANCE_EASY'])

      const result = mapV5TagsToEstimateActions(tags)

      // 매핑되지 않는 태그는 액션 생성하지 않음
      expect(result.requiredProcesses.length).toBe(0)
      expect(result.recommendedProcesses.length).toBe(0)
      expect(result.defaultOptions.length).toBe(0)
      expect(result.excludedOptions.length).toBe(0)
    })

    it('handles multiple tags correctly', () => {
      const tags = createMockTags([
        'OLD_RISK_HIGH',
        'STORAGE_RISK_HIGH',
        'SAFETY_RISK',
      ])

      const result = mapV5TagsToEstimateActions(tags)

      expect(result.requiredProcesses).toContain('waterproof')
      expect(result.requiredProcesses).toContain('plumbing')
      expect(result.requiredProcesses).toContain('storage')
      expect(result.requiredProcesses).toContain('bathroom')
    })
  })
})




