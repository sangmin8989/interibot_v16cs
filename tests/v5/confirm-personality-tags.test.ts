/**
 * Phase 3-2: confirmPersonalityTags 상세 테스트
 * 
 * 목표: 각 태그 생성 규칙 검증
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

describe('confirmPersonalityTags - 상세 태그 생성 규칙', () => {
  describe('OLD_RISK 태그 생성', () => {
    it('generates OLD_RISK_HIGH when building age >= 20 and Q02 has 2+ answers', () => {
      const answers = {
        Q02: '누수, 균열',
      }
      const basicInfo = createMockBasicInfo({
        building_year: 2000, // 24년 경과
      })

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('OLD_RISK_HIGH')
      expect(result.triggered_by['OLD_RISK_HIGH']).toBe('Q01, Q02')
    })

    it('generates OLD_RISK_MEDIUM when building age >= 15 but < 20', () => {
      const answers = {
        Q02: '누수',
      }
      const basicInfo = createMockBasicInfo({
        building_year: 2010, // 14년 경과
      })

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('OLD_RISK_MEDIUM')
      expect(result.triggered_by['OLD_RISK_MEDIUM']).toBe('Q01')
    })
  })

  describe('STORAGE_RISK_HIGH 태그 생성', () => {
    it('generates STORAGE_RISK_HIGH when Q04=자주 and Q05=예', () => {
      const answers = {
        Q04: '자주',
        Q05: '예',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('STORAGE_RISK_HIGH')
      expect(result.triggered_by['STORAGE_RISK_HIGH']).toBe('Q04, Q05')
    })

    it('does not generate STORAGE_RISK_HIGH when conditions not met', () => {
      const answers = {
        Q04: '가끔',
        Q05: '예',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).not.toContain('STORAGE_RISK_HIGH')
    })
  })

  describe('SHORT_STAY 태그 생성', () => {
    it('generates SHORT_STAY when Q06=1년이하', () => {
      const answers = {
        Q06: '1년이하',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('SHORT_STAY')
    })

    it('generates SHORT_STAY when Q06=1-3년', () => {
      const answers = {
        Q06: '1-3년',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('SHORT_STAY')
    })

    it('generates SHORT_STAY when Q07=마감위주', () => {
      const answers = {
        Q07: '마감위주',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('SHORT_STAY')
    })
  })

  describe('LONG_STAY 태그 생성', () => {
    it('generates LONG_STAY when Q06=5년이상 and Q07=구조변경', () => {
      const answers = {
        Q06: '5년이상',
        Q07: '구조변경',
      }
      // building_year를 최근으로 설정하여 OLD_RISK 태그가 생성되지 않도록 함
      const basicInfo = createMockBasicInfo({
        building_year: 2020, // 4년 경과 (OLD_RISK 조건 불만족)
      })

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('LONG_STAY')
      expect(result.triggered_by['LONG_STAY']).toBe('Q06, Q07')
    })
  })

  describe('SAFETY_RISK 태그 생성', () => {
    it('generates SAFETY_RISK when Q08 is not empty and not 없음', () => {
      const answers = {
        Q08: '미끄러움',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('SAFETY_RISK')
      expect(result.triggered_by['SAFETY_RISK']).toBe('Q08')
    })

    it('does not generate SAFETY_RISK when Q08=없음', () => {
      const answers = {
        Q08: '없음',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).not.toContain('SAFETY_RISK')
    })
  })

  describe('기타 태그 생성', () => {
    it('generates BUDGET_TIGHT when Q09 has answer', () => {
      const answers = {
        Q09: '예산부족',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('BUDGET_TIGHT')
    })

    it('generates DECISION_FATIGUE_HIGH when Q10=전문가추천 and Q11=어려움', () => {
      const answers = {
        Q10: '전문가추천',
        Q11: '어려움',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('DECISION_FATIGUE_HIGH')
    })

    it('generates KITCHEN_IMPORTANT when Q12 is not empty and not 없음', () => {
      const answers = {
        Q12: '주방중요',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('KITCHEN_IMPORTANT')
    })

    it('generates BATHROOM_COMFORT when Q13=반신욕', () => {
      const answers = {
        Q13: '반신욕',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('BATHROOM_COMFORT')
    })

    it('generates STYLE_EXCLUDE when Q15 has answer', () => {
      const answers = {
        Q15: '스타일제외',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('STYLE_EXCLUDE')
    })

    it('generates MAINTENANCE_EASY when Q17=예', () => {
      const answers = {
        Q17: '예',
      }
      const basicInfo = createMockBasicInfo()

      const result = confirmPersonalityTags(answers, basicInfo)

      expect(result.tags).toContain('MAINTENANCE_EASY')
    })
  })
})




