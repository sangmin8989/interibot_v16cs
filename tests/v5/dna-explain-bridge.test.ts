/**
 * Phase 4-2: DNA Explain Bridge 테스트
 * 
 * 목표: DNA와 Explain이 올바르게 연결되는지 검증
 * 
 * ⚠️ 테스트 규칙:
 * - DNA에서 태그 재해석 금지
 * - Explain 결과 그대로 인용
 * - 동일 입력 → 동일 DNA + 동일 설명
 */

import { buildDNAExplainBridge } from '@/lib/analysis/v5/dna/dna-explain-bridge'
import { determineDNAType } from '@/lib/analysis/v5/dna/dna-determiner'
import type { DNATypeInfo } from '@/lib/analysis/v5/dna/dna-types'
import type { ExplainResult } from '@/lib/analysis/v5/explain'
import type { PersonalityTags } from '@/lib/analysis/v5/types'

/**
 * 테스트용 ExplainResult 생성
 */
function createMockExplainResult(overrides?: Partial<ExplainResult>): ExplainResult {
  return {
    tagReasons: [
      {
        key: 'STORAGE_RISK_HIGH',
        title: '수납 부담이 큰 집입니다',
        description: '현재 생활 패턴과 공간 구성상, 물건이 쌓이기 쉬운 구조로 판단되어 수납 개선이 중요한 요소로 반영되었습니다.',
      },
      {
        key: 'SAFETY_RISK',
        title: '안전 요소가 중요합니다',
        description: '가족 구성과 생활 방식상 미끄럼, 충돌 등 안전 리스크를 줄이는 설계가 필요하다고 판단되었습니다.',
      },
      {
        key: 'OLD_RISK_HIGH',
        title: '노후 건물 리스크가 높습니다',
        description: '건물 연식이 20년 이상이며, 누수나 균열 등의 문제가 확인되어 방수 및 설비 공정이 필수로 반영되었습니다.',
      },
      {
        key: 'KITCHEN_IMPORTANT',
        title: '주방이 중요한 공간입니다',
        description: '주방 사용 빈도와 중요도가 높은 것으로 확인되어, 주방 공정이 필수로 포함되었습니다.',
      },
    ],
    processReasons: [
      {
        key: 'storage',
        title: '수납 공정이 필수로 포함되었습니다',
        description: '수납 부담이 큰 것으로 확인되어, 수납 공정이 필수 공정으로 반영되었습니다.',
      },
    ],
    summary: '이번 인테리어에서는 수납 부담이 큰 집입니다을 중심으로, 수납 공정이 필수로 포함되었습니다 방향으로 설계가 구성되었습니다.',
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

describe('DNA Explain Bridge Test', () => {
  describe('buildDNAExplainBridge - DNA와 Explain 연결', () => {
    it('creates bridge with explain results', () => {
      const dna: DNATypeInfo = {
        type: 'practical_family',
        name: '실용 패밀리형',
        description: '가족 중심의 실용적인 인테리어를 선호하는 유형',
        keywords: ['가족', '실용', '수납'],
        color: '#4A90E2',
      }
      const explain = createMockExplainResult()

      const bridge = buildDNAExplainBridge(dna, explain)

      expect(bridge.headline).toBe('실용 패밀리형 유형으로 분석된 이유')
      expect(bridge.reasons.length).toBe(3) // 최대 3개
      expect(bridge.reasons[0].title).toBe('수납 부담이 큰 집입니다')
      expect(bridge.reasons[1].title).toBe('안전 요소가 중요합니다')
      expect(bridge.reasons[2].title).toBe('노후 건물 리스크가 높습니다')
    })

    it('uses explain results in order without selection', () => {
      const dna: DNATypeInfo = {
        type: 'safety_first',
        name: '안전 우선형',
        description: '안전과 편의를 최우선으로 고려하는 유형',
        keywords: ['안전', '편의'],
        color: '#FFB4B4',
      }
      const explain = createMockExplainResult()

      const bridge = buildDNAExplainBridge(dna, explain)

      // Explain 순서 유지 (선택/정렬 금지)
      expect(bridge.reasons[0].title).toBe('수납 부담이 큰 집입니다')
      expect(bridge.reasons[1].title).toBe('안전 요소가 중요합니다')
      expect(bridge.reasons[2].title).toBe('노후 건물 리스크가 높습니다')
    })

    it('limits to maximum 3 reasons', () => {
      const dna: DNATypeInfo = {
        type: 'balanced',
        name: '균형 잡힌형',
        description: '다양한 요소를 균형 있게 고려하는 유형',
        keywords: ['균형'],
        color: '#7C83FD',
      }
      const explain = createMockExplainResult()

      const bridge = buildDNAExplainBridge(dna, explain)

      // 최대 3개만 노출
      expect(bridge.reasons.length).toBeLessThanOrEqual(3)
    })

    it('handles empty explain results', () => {
      const dna: DNATypeInfo = {
        type: 'balanced',
        name: '균형 잡힌형',
        description: '다양한 요소를 균형 있게 고려하는 유형',
        keywords: ['균형'],
        color: '#7C83FD',
      }
      const explain: ExplainResult = {
        tagReasons: [],
        processReasons: [],
        summary: '',
      }

      const bridge = buildDNAExplainBridge(dna, explain)

      expect(bridge.headline).toBe('균형 잡힌형 유형으로 분석된 이유')
      expect(bridge.reasons.length).toBe(0)
    })
  })

  describe('determineDNAType - 태그 기반 DNA 결정', () => {
    it('determines DNA type from tags', () => {
      const tags = createMockTags(['STORAGE_RISK_HIGH'])

      const dna = determineDNAType(tags)

      expect(dna.type).toBe('practical_family')
      expect(dna.name).toBe('실용 패밀리형')
    })

    it('determines DNA type from first matching tag', () => {
      const tags = createMockTags(['SAFETY_RISK', 'STORAGE_RISK_HIGH'])

      const dna = determineDNAType(tags)

      // 첫 번째 매칭되는 태그 기반 결정
      expect(dna.type).toBe('safety_first')
    })

    it('returns default DNA type when no tag matches', () => {
      const tags = createMockTags(['UNKNOWN_TAG'])

      const dna = determineDNAType(tags)

      expect(dna.type).toBe('balanced')
      expect(dna.name).toBe('균형 잡힌형')
    })

    it('produces same DNA for same tags', () => {
      const tags = createMockTags(['STORAGE_RISK_HIGH', 'SAFETY_RISK'])

      const dna1 = determineDNAType(tags)
      const dna2 = determineDNAType(tags)

      // 동일 입력 → 동일 DNA
      expect(dna1.type).toBe(dna2.type)
      expect(dna1.name).toBe(dna2.name)
    })
  })

  describe('DNA + Explain integration', () => {
    it('produces same DNA and explain for same input', () => {
      const tags = createMockTags(['STORAGE_RISK_HIGH', 'SAFETY_RISK'])
      const explain = createMockExplainResult()

      const dna1 = determineDNAType(tags)
      const bridge1 = buildDNAExplainBridge(dna1, explain)

      const dna2 = determineDNAType(tags)
      const bridge2 = buildDNAExplainBridge(dna2, explain)

      // 동일 입력 → 동일 DNA + 동일 설명
      expect(dna1.type).toBe(dna2.type)
      expect(bridge1.headline).toBe(bridge2.headline)
      expect(bridge1.reasons).toEqual(bridge2.reasons)
    })
  })
})




