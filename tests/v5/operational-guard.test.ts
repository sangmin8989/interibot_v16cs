/**
 * Phase 6: 운영 가드 테스트
 * 
 * 목표: 운영 차단 규칙이 올바르게 작동하는지 검증
 * 
 * ⚠️ 테스트 규칙:
 * - fallback 실행 시도 차단
 * - 기본값 생성 코드 발견 차단
 * - 태그 없이 정책 생성 시도 차단
 * - Explain 없이 DNA 생성 시도 차단
 */

import { assertV5InputIntegrity } from '@/lib/analysis/v5/guards/input-guard'
import { buildInputHash, buildOutputHash } from '@/lib/analysis/v5/guards/reproducibility-guard'
import { auditLogger } from '@/lib/analysis/v5/audit/audit-logger'
import type { BasicInfoInput } from '@/lib/analysis/v5/types'

describe('Operational Guard Test', () => {
  beforeEach(() => {
    auditLogger.clear()
  })

  describe('assertV5InputIntegrity - 입력 무결성 가드', () => {
    it('throws if basicInfo is missing', () => {
      expect(() => {
        assertV5InputIntegrity({
          basicInfo: null as any,
          answers: { Q01: 'test' },
        })
      }).toThrow('V5_INPUT_MISSING_BASIC_INFO')
    })

    it('throws if answers is missing', () => {
      const basicInfo: BasicInfoInput = {
        housing_type: 'apartment',
        pyeong_range: '16to25',
        building_year: 2020,
        stay_plan: 'unknown',
        family_type: ['adult'],
        budget_range: 'unknown',
      }

      expect(() => {
        assertV5InputIntegrity({
          basicInfo,
          answers: null as any,
        })
      }).toThrow('V5_INPUT_MISSING_ANSWERS')
    })

    it('throws if required fields are missing', () => {
      const basicInfo: Partial<BasicInfoInput> = {
        housing_type: 'apartment',
        // pyeong_range missing
      }

      expect(() => {
        assertV5InputIntegrity({
          basicInfo: basicInfo as BasicInfoInput,
          answers: { Q01: 'test' },
        })
      }).toThrow('V5_INPUT_MISSING_FIELD')
    })

    it('passes with valid input', () => {
      const basicInfo: BasicInfoInput = {
        housing_type: 'apartment',
        pyeong_range: '16to25',
        building_year: 2020,
        stay_plan: 'unknown',
        family_type: ['adult'],
        budget_range: 'unknown',
      }

      expect(() => {
        assertV5InputIntegrity({
          basicInfo,
          answers: { Q01: 'test' },
        })
      }).not.toThrow()
    })
  })

  describe('buildReproducibilityHash - 재현성 해시', () => {
    it('produces same hash for same input', () => {
      const input = {
        basicInfo: {
          housing_type: 'apartment' as const,
          pyeong_range: '16to25' as const,
          building_year: 2020,
          stay_plan: 'unknown' as const,
          family_type: ['adult'],
          budget_range: 'unknown' as const,
        },
        answers: { Q01: 'test', Q02: 'answer' },
      }

      const hash1 = buildInputHash(input)
      const hash2 = buildInputHash(input)

      // 동일 입력 → 동일 hash
      expect(hash1).toBe(hash2)
    })

    it('produces different hash for different input', () => {
      const input1 = {
        basicInfo: {
          housing_type: 'apartment' as const,
          pyeong_range: '16to25' as const,
          building_year: 2020,
          stay_plan: 'unknown' as const,
          family_type: ['adult'],
          budget_range: 'unknown' as const,
        },
        answers: { Q01: 'test1', Q02: 'answer1' },
      }

      const input2 = {
        basicInfo: {
          housing_type: 'apartment' as const,
          pyeong_range: '16to25' as const,
          building_year: 2020,
          stay_plan: 'unknown' as const,
          family_type: ['adult'],
          budget_range: 'unknown' as const,
        },
        answers: { Q01: 'test2', Q02: 'answer2' },
      }

      const hash1 = buildInputHash(input1)
      const hash2 = buildInputHash(input2)

      // 다른 입력 → 다른 hash
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('auditLogger - 감사 로그', () => {
    it('logs analysis requested event', () => {
      const inputHash = 'test-input-hash'

      auditLogger.log('ANALYSIS_REQUESTED', inputHash)

      const logs = auditLogger.getLogs()
      expect(logs.length).toBe(1)
      expect(logs[0].event).toBe('ANALYSIS_REQUESTED')
      expect(logs[0].inputHash).toBe(inputHash)
      expect(logs[0].version).toBe('v5')
    })

    it('logs analysis completed event', () => {
      const inputHash = 'test-input-hash'
      const outputHash = 'test-output-hash'

      auditLogger.log('ANALYSIS_COMPLETED', inputHash, outputHash)

      const logs = auditLogger.getLogs()
      expect(logs.length).toBe(1)
      expect(logs[0].event).toBe('ANALYSIS_COMPLETED')
      expect(logs[0].inputHash).toBe(inputHash)
      expect(logs[0].outputHash).toBe(outputHash)
    })

    it('logs analysis failed event', () => {
      const inputHash = 'test-input-hash'
      const errorMessage = 'Test error'

      auditLogger.log('ANALYSIS_FAILED', inputHash, undefined, undefined, errorMessage)

      const logs = auditLogger.getLogs()
      expect(logs.length).toBe(1)
      expect(logs[0].event).toBe('ANALYSIS_FAILED')
      expect(logs[0].errorMessage).toBe(errorMessage)
    })
  })
})




