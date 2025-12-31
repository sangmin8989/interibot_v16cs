/**
 * Phase 3-2: Tag Determinism Test (결정 재현성)
 * 
 * 목표: 동일 입력 → 동일 태그 → 동일 액션
 * 
 * ⚠️ 테스트 규칙:
 * - mock AI 사용 금지
 * - 랜덤 값 사용 금지
 * - console 출력 금지
 * - snapshot 테스트 금지
 */

import { confirmPersonalityTags } from '@/lib/analysis/v5/tag-confirmer'
import type { BasicInfoInput } from '@/lib/analysis/v5/types'

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

describe('Tag Determinism Test', () => {
  describe('confirmPersonalityTags - 동일 입력 → 동일 태그', () => {
    it('same input always produces same tags', () => {
      const answers = {
        Q02: '누수, 균열',
        Q04: '자주',
        Q05: '예',
      }
      const basicInfo = createMockBasicInfo({
        building_year: 2000, // 24년 경과
      })

      const result1 = confirmPersonalityTags(answers, basicInfo)
      const result2 = confirmPersonalityTags(answers, basicInfo)

      // 결과 100% 동일
      expect(result1.tags).toEqual(result2.tags)
      expect(result1.triggered_by).toEqual(result2.triggered_by)
    })

    it('same input produces same tags in same order', () => {
      const answers = {
        Q02: '누수, 균열',
        Q04: '자주',
        Q05: '예',
        Q08: '미끄러움',
      }
      const basicInfo = createMockBasicInfo({
        building_year: 2000,
      })

      const result1 = confirmPersonalityTags(answers, basicInfo)
      const result2 = confirmPersonalityTags(answers, basicInfo)

      // 순서 포함 동일
      expect(result1.tags).toEqual(result2.tags)
      expect(result1.tags.length).toBe(result2.tags.length)
      
      // 각 인덱스별로 동일한 태그
      for (let i = 0; i < result1.tags.length; i++) {
        expect(result1.tags[i]).toBe(result2.tags[i])
      }
    })

    it('different inputs produce different tags', () => {
      const answers1 = {
        Q02: '누수, 균열',
        Q04: '자주',
        Q05: '예',
      }
      const answers2 = {
        Q04: '가끔',
        Q05: '아니오',
      }
      const basicInfo = createMockBasicInfo({
        building_year: 2000,
      })

      const result1 = confirmPersonalityTags(answers1, basicInfo)
      const result2 = confirmPersonalityTags(answers2, basicInfo)

      // 다른 입력은 다른 태그 생성
      expect(result1.tags).not.toEqual(result2.tags)
    })

    it('building age affects OLD_RISK tags deterministically', () => {
      const answers = {
        Q02: '누수, 균열',
      }
      
      // 20년 이상 → OLD_RISK_HIGH
      const basicInfo1 = createMockBasicInfo({
        building_year: 2000, // 24년 경과
      })
      const result1 = confirmPersonalityTags(answers, basicInfo1)

      // 15-19년 → OLD_RISK_MEDIUM
      const basicInfo2 = createMockBasicInfo({
        building_year: 2010, // 14년 경과
      })
      const result2 = confirmPersonalityTags(answers, basicInfo2)

      // 결과가 결정적으로 다름
      expect(result1.tags.includes('OLD_RISK_HIGH') || result1.tags.includes('OLD_RISK_MEDIUM')).toBe(true)
      expect(result2.tags.includes('OLD_RISK_HIGH') || result2.tags.includes('OLD_RISK_MEDIUM')).toBe(true)
      
      // 24년 경과는 HIGH, 14년 경과는 MEDIUM 또는 없음
      if (result1.tags.includes('OLD_RISK_HIGH')) {
        expect(result2.tags).not.toContain('OLD_RISK_HIGH')
      }
    })
  })
})




