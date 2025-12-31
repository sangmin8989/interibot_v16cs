/**
 * Phase 5-1: 견적 최적화 정책 테스트
 * 
 * 목표: 태그 → 정책 매핑의 결정 신뢰성 증명
 * 
 * ⚠️ 테스트 규칙:
 * - 동일 태그 입력 → 동일 정책 출력
 * - 정책 설명 문장만 존재 (숫자/금액 없음)
 * - 태그 없으면 빈 배열 반환
 */

import { buildEstimateOptimization } from '@/lib/analysis/v5/estimate'
import { mapTagsToMaterialPolicy } from '@/lib/analysis/v5/estimate/tag-to-material-policy'
import { mapTagsToGradePolicy } from '@/lib/analysis/v5/estimate/tag-to-grade-policy'
import { mapTagsToContingencyPolicy } from '@/lib/analysis/v5/estimate/tag-to-contingency-policy'

describe('Estimate Optimization Policy Test', () => {
  describe('buildEstimateOptimization - 통합 함수', () => {
    it('produces same policies for same tags', () => {
      const tags = ['STORAGE_RISK_HIGH', 'OLD_RISK_HIGH']

      const result1 = buildEstimateOptimization(tags)
      const result2 = buildEstimateOptimization(tags)

      // 동일 입력 → 동일 출력
      expect(result1.materialPolicy).toEqual(result2.materialPolicy)
      expect(result1.gradePolicy).toEqual(result2.gradePolicy)
      expect(result1.contingencyPolicy).toEqual(result2.contingencyPolicy)
    })

    it('returns empty arrays when no tags', () => {
      const result = buildEstimateOptimization([])

      expect(result.materialPolicy).toEqual([])
      expect(result.gradePolicy).toEqual([])
      expect(result.contingencyPolicy).toEqual([])
    })

    it('returns empty arrays when tags is null', () => {
      const result = buildEstimateOptimization(null as any)

      expect(result.materialPolicy).toEqual([])
      expect(result.gradePolicy).toEqual([])
      expect(result.contingencyPolicy).toEqual([])
    })
  })

  describe('mapTagsToMaterialPolicy - 자재 정책', () => {
    it('maps STORAGE_RISK_HIGH to material policy', () => {
      const policies = mapTagsToMaterialPolicy(['STORAGE_RISK_HIGH'])

      expect(policies.length).toBe(1)
      expect(policies[0].id).toBe('material_storage_focus')
      expect(policies[0].description).toContain('수납')
      // ⚠️ 정책 설명 문장만 존재 (숫자/금액 없음)
      expect(policies[0].description).not.toMatch(/\d+/)
    })

    it('allows duplicate tags', () => {
      const policies = mapTagsToMaterialPolicy(['STORAGE_RISK_HIGH', 'STORAGE_RISK_HIGH'])

      // 중복 태그 허용 (정렬/병합 금지)
      expect(policies.length).toBe(2)
      expect(policies[0].id).toBe(policies[1].id)
    })

    it('returns empty array when no matching tags', () => {
      const policies = mapTagsToMaterialPolicy(['UNKNOWN_TAG'])

      expect(policies).toEqual([])
    })
  })

  describe('mapTagsToGradePolicy - 등급 정책', () => {
    it('maps OLD_RISK_HIGH to grade policy', () => {
      const policies = mapTagsToGradePolicy(['OLD_RISK_HIGH'])

      expect(policies.length).toBe(1)
      expect(policies[0].id).toBe('grade_durability_focus')
      expect(policies[0].description).toContain('등급')
      // ⚠️ 정책 설명 문장만 존재 (숫자/금액 없음)
      expect(policies[0].description).not.toMatch(/\d+/)
    })

    it('returns empty array when no tags', () => {
      const policies = mapTagsToGradePolicy([])

      expect(policies).toEqual([])
    })
  })

  describe('mapTagsToContingencyPolicy - 예비비 정책', () => {
    it('maps OLD_RISK_HIGH to contingency policy', () => {
      const policies = mapTagsToContingencyPolicy(['OLD_RISK_HIGH'])

      expect(policies.length).toBe(1)
      expect(policies[0].id).toBe('contingency_old_risk')
      expect(policies[0].description).toContain('예비비')
      // ⚠️ 정책 설명 문장만 존재 (숫자/금액 없음)
      expect(policies[0].description).not.toMatch(/\d+/)
    })

    it('returns empty array when no tags', () => {
      const policies = mapTagsToContingencyPolicy([])

      expect(policies).toEqual([])
    })
  })

  describe('Policy description validation', () => {
    it('all policies contain only text descriptions', () => {
      const tags = ['STORAGE_RISK_HIGH', 'OLD_RISK_HIGH', 'BUDGET_TIGHT']
      const result = buildEstimateOptimization(tags)

      // 모든 정책 설명 검증
      const allPolicies = [
        ...result.materialPolicy,
        ...result.gradePolicy,
        ...result.contingencyPolicy,
      ]

      for (const policy of allPolicies) {
        // 설명은 문자열이어야 함
        expect(typeof policy.description).toBe('string')
        expect(policy.description.length).toBeGreaterThan(0)
        
        // ⚠️ 금액/비율 패턴 없음
        expect(policy.description).not.toMatch(/원|만원|억|%|퍼센트|\d+원|\d+만원|\d+억/)
        
        // ⚠️ 구체적 자재명/브랜드 없음 (일반적인 설명만)
        expect(policy.description).not.toMatch(/[A-Z][a-z]+ [A-Z][a-z]+/) // 브랜드명 패턴
      }
    })
  })
})




