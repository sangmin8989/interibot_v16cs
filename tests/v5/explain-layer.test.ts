/**
 * Phase 4-1: Explain Layer 테스트
 * 
 * 목표: Explain Layer가 절대 판단하지 않고 번역만 수행하는지 검증
 * 
 * ⚠️ 테스트 규칙:
 * - Explain Layer가 결과를 절대 변경하지 않음
 * - 태그 없는 설명 0개
 * - fallback 문장 0개
 * - 동일 입력 → 동일 설명
 */

import { explainV5Result } from '@/lib/analysis/v5/explain'
import type { PersonalityTags, BasicInfoInput } from '@/lib/analysis/v5/types'
import type { TagApplicationResult } from '@/lib/analysis/v5/tag-process-mapper'

/**
 * 테스트용 PersonalityTags 생성
 */
function createMockTags(tags: string[], triggeredBy?: Record<string, string>): PersonalityTags {
  return {
    tags,
    triggered_by: triggeredBy || {},
  }
}

/**
 * 테스트용 BasicInfoInput 생성
 */
function createMockBasicInfo(overrides?: Partial<BasicInfoInput>): BasicInfoInput {
  return {
    housing_type: 'apartment',
    pyeong_range: '16to25',
    building_year: 2000,
    stay_plan: '3to5y',
    family_type: ['adult'],
    budget_range: '2000to4000',
    ...overrides,
  }
}

/**
 * 테스트용 TagApplicationResult 생성
 */
function createMockProcessChanges(
  processChanges: Array<{ processId: string; action: 'required' | 'recommend' | 'enable' | 'disable' }>
): TagApplicationResult {
  return {
    processChanges: processChanges.map((pc) => ({
      ...pc,
      reason: `테스트: ${pc.processId}`,
    })),
    optionChanges: [],
    tierRecommendations: {},
  }
}

describe('Explain Layer Test', () => {
  describe('explainV5Result - 절대 원칙 준수', () => {
    it('does not change input tags', () => {
      const tags = createMockTags(['STORAGE_RISK_HIGH'])
      const processChanges = createMockProcessChanges([])
      const basicInfo = createMockBasicInfo()

      const input = { tags, processChanges, basicInfo }
      const result = explainV5Result(input)

      // 입력 태그는 변경되지 않음
      expect(input.tags.tags).toEqual(['STORAGE_RISK_HIGH'])
      expect(input.tags.tags.length).toBe(1)
    })

    it('does not create explanations for non-existent tags', () => {
      const tags = createMockTags([])
      const processChanges = createMockProcessChanges([])
      const basicInfo = createMockBasicInfo()

      const result = explainV5Result({ tags, processChanges, basicInfo })

      // 태그 없는 설명 0개
      expect(result.tagReasons.length).toBe(0)
    })

    it('does not create fallback explanations', () => {
      const tags = createMockTags(['INVALID_TAG'])
      const processChanges = createMockProcessChanges([])
      const basicInfo = createMockBasicInfo()

      const result = explainV5Result({ tags, processChanges, basicInfo })

      // 템플릿에 없는 태그는 설명 생성하지 않음 (fallback 금지)
      expect(result.tagReasons.length).toBe(0)
    })

    it('produces same explanation for same input', () => {
      const tags = createMockTags(['STORAGE_RISK_HIGH', 'SAFETY_RISK'])
      const processChanges = createMockProcessChanges([
        { processId: 'storage', action: 'required' },
        { processId: 'bathroom', action: 'required' },
      ])
      const basicInfo = createMockBasicInfo()

      const input = { tags, processChanges, basicInfo }
      const result1 = explainV5Result(input)
      const result2 = explainV5Result(input)

      // 동일 입력 → 동일 설명
      expect(result1.tagReasons).toEqual(result2.tagReasons)
      expect(result1.processReasons).toEqual(result2.processReasons)
      expect(result1.summary).toBe(result2.summary)
    })

    it('explains tags in order', () => {
      const tags = createMockTags(['STORAGE_RISK_HIGH', 'SAFETY_RISK', 'OLD_RISK_HIGH'])
      const processChanges = createMockProcessChanges([])
      const basicInfo = createMockBasicInfo()

      const result = explainV5Result({ tags, processChanges, basicInfo })

      // 태그 순서 유지
      expect(result.tagReasons.length).toBe(3)
      expect(result.tagReasons[0].key).toBe('STORAGE_RISK_HIGH')
      expect(result.tagReasons[1].key).toBe('SAFETY_RISK')
      expect(result.tagReasons[2].key).toBe('OLD_RISK_HIGH')
    })

    it('explains only required/recommend/enable processes', () => {
      const tags = createMockTags([])
      const processChanges = createMockProcessChanges([
        { processId: 'waterproof', action: 'required' },
        { processId: 'plumbing', action: 'recommend' },
        { processId: 'storage', action: 'enable' },
        { processId: 'demolition', action: 'disable' },
      ])
      const basicInfo = createMockBasicInfo()

      const result = explainV5Result({ tags, processChanges, basicInfo })

      // disable은 설명하지 않음
      expect(result.processReasons.length).toBe(3)
      expect(result.processReasons.find((r) => r.key === 'demolition')).toBeUndefined()
    })

    it('provides answer to "why?" question', () => {
      const tags = createMockTags(['STORAGE_RISK_HIGH'], {
        STORAGE_RISK_HIGH: 'Q04, Q05',
      })
      const processChanges = createMockProcessChanges([
        { processId: 'storage', action: 'required' },
      ])
      const basicInfo = createMockBasicInfo()

      const result = explainV5Result({ tags, processChanges, basicInfo })

      // "왜?"에 답할 수 있는 설명 제공
      expect(result.tagReasons.length).toBeGreaterThan(0)
      expect(result.tagReasons[0].title).toBeDefined()
      expect(result.tagReasons[0].description).toBeDefined()
      expect(result.processReasons.length).toBeGreaterThan(0)
      expect(result.processReasons[0].title).toBeDefined()
      expect(result.processReasons[0].description).toBeDefined()
      expect(result.summary).toBeDefined()
    })
  })
})




