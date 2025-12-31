/**
 * Phase 3-2: 에러 처리 테스트
 * 
 * 목표: throw 검증 테스트
 * 
 * ⚠️ 테스트 규칙:
 * - throw 케이스 테스트 존재
 */

import { confirmPersonalityTags } from '@/lib/analysis/v5/tag-confirmer'
import { convertV5TagsToV31NeedsInput } from '@/lib/analysis/v5/adapters/v5-to-v31-needs'
import { mapV5TagsToEstimateActions } from '@/lib/analysis/v5/adapters/v5-to-estimate-actions'
import { V5ValidationError } from '@/lib/analysis/v5/error'
import type { BasicInfoInput, PersonalityTags } from '@/lib/analysis/v5/types'

/**
 * 테스트용 기본 정보 생성
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
 * 테스트용 PersonalityTags 생성
 */
function createMockTags(tags: string[], triggeredBy?: Record<string, string>): PersonalityTags {
  return {
    tags,
    triggered_by: triggeredBy || {},
  }
}

describe('Error Handling Test', () => {
  describe('confirmPersonalityTags - throw 검증', () => {
    it('throws if answers are empty', () => {
      const basicInfo = createMockBasicInfo()

      expect(() => {
        confirmPersonalityTags({}, basicInfo)
      }).toThrow(V5ValidationError)
    })

    it('throws if answers are null', () => {
      const basicInfo = createMockBasicInfo()

      expect(() => {
        confirmPersonalityTags(null as any, basicInfo)
      }).toThrow(V5ValidationError)
    })

    it('throws if basicInfo is missing', () => {
      const answers = { Q01: 'test' }

      expect(() => {
        confirmPersonalityTags(answers, null as any)
      }).toThrow(V5ValidationError)
    })

    it('throws if building_year is missing', () => {
      const answers = { Q01: 'test' }
      const basicInfo = createMockBasicInfo({
        building_year: undefined as any,
      })

      expect(() => {
        confirmPersonalityTags(answers, basicInfo)
      }).toThrow(V5ValidationError)
    })

    it('throws if no tags generated', () => {
      const answers = { Q99: 'invalid' } // 존재하지 않는 질문
      // building_year를 최근으로 설정하여 OLD_RISK 태그가 생성되지 않도록 함
      const basicInfo = createMockBasicInfo({
        building_year: 2020, // 4년 경과 (OLD_RISK 조건 불만족)
      })

      expect(() => {
        confirmPersonalityTags(answers, basicInfo)
      }).toThrow(V5ValidationError)
    })
  })

  describe('convertV5TagsToV31NeedsInput - throw 검증', () => {
    it('throws if tags are missing', () => {
      expect(() => {
        convertV5TagsToV31NeedsInput(null as any)
      }).toThrow()
    })

    it('does not throw if tags are empty array', () => {
      const tags = createMockTags([])

      expect(() => {
        const result = convertV5TagsToV31NeedsInput(tags)
        expect(result.needs.length).toBe(0)
      }).not.toThrow()
    })
  })

  describe('mapV5TagsToEstimateActions - throw 검증', () => {
    it('throws if tags are missing', () => {
      expect(() => {
        mapV5TagsToEstimateActions(null as any)
      }).toThrow()
    })

    it('does not throw if tags are empty array', () => {
      const tags = createMockTags([])

      expect(() => {
        const result = mapV5TagsToEstimateActions(tags)
        expect(result.requiredProcesses.length).toBe(0)
        expect(result.recommendedProcesses.length).toBe(0)
      }).not.toThrow()
    })
  })
})




