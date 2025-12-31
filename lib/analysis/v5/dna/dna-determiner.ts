/**
 * Phase 4-2: DNA 결정 로직
 * 
 * ⚠️ 절대 원칙:
 * - 태그 기반 결정만 허용
 * - 점수 계산 금지
 * - 해석/추론 금지
 * - 기본값 생성 금지
 * 
 * 역할: V5 태그를 기반으로 DNA 유형 결정
 * - 태그는 유일한 진실 소스
 * - DNA는 표현 레이어
 */

import type { PersonalityTags } from '../types'
import type { DNATypeInfo } from './dna-types'

/**
 * DNA 유형 정의
 * 
 * 태그 기반으로 결정되는 DNA 유형
 */
const DNA_TYPES: Record<string, DNATypeInfo> = {
  practical_family: {
    type: 'practical_family',
    name: '실용 패밀리형',
    description: '가족 중심의 실용적인 인테리어를 선호하는 유형',
    keywords: ['가족', '실용', '수납', '안전'],
    color: '#4A90E2',
  },
  minimal_lifestyle: {
    type: 'minimal_lifestyle',
    name: '미니멀 라이프형',
    description: '간결하고 깔끔한 인테리어를 선호하는 유형',
    keywords: ['미니멀', '간결', '정리'],
    color: '#95A5A6',
  },
  safety_first: {
    type: 'safety_first',
    name: '안전 우선형',
    description: '안전과 편의를 최우선으로 고려하는 유형',
    keywords: ['안전', '편의', '관리'],
    color: '#FFB4B4',
  },
  budget_conscious: {
    type: 'budget_conscious',
    name: '예산 절약형',
    description: '예산을 효율적으로 사용하는 것을 중시하는 유형',
    keywords: ['예산', '효율', '절약'],
    color: '#F9A826',
  },
  long_term_investor: {
    type: 'long_term_investor',
    name: '장기 투자형',
    description: '장기 거주를 고려한 품질 중심의 인테리어를 선호하는 유형',
    keywords: ['장기', '품질', '내구성'],
    color: '#4ECDC4',
  },
  default: {
    type: 'balanced',
    name: '균형 잡힌형',
    description: '다양한 요소를 균형 있게 고려하는 유형',
    keywords: ['균형', '종합'],
    color: '#7C83FD',
  },
}

/**
 * 태그 → DNA 유형 매핑 규칙
 * 
 * ⚠️ 절대 원칙:
 * - 태그 기반 결정만 허용
 * - 점수 계산 금지
 * - 우선순위 규칙 적용
 */
const TAG_TO_DNA_MAP: Record<string, string> = {
  STORAGE_RISK_HIGH: 'practical_family',
  SAFETY_RISK: 'safety_first',
  OLD_RISK_HIGH: 'long_term_investor',
  LONG_STAY: 'long_term_investor',
  BUDGET_TIGHT: 'budget_conscious',
  MAINTENANCE_EASY: 'minimal_lifestyle',
  KITCHEN_IMPORTANT: 'practical_family',
  BATHROOM_COMFORT: 'safety_first',
}

/**
 * DNA 유형 결정
 * 
 * ⚠️ 절대 원칙:
 * - 태그 기반 결정만 허용
 * - 점수 계산 금지
 * - 해석/추론 금지
 * 
 * @param tags V5 성향 태그
 * @returns DNA 유형 정보
 */
export function determineDNAType(tags: PersonalityTags): DNATypeInfo {
  // ⚠️ 절대 원칙: 태그 기반 결정만 허용
  // 태그 순서대로 확인하여 첫 번째 매칭되는 DNA 유형 반환

  for (const tag of tags.tags) {
    const dnaType = TAG_TO_DNA_MAP[tag]
    if (dnaType && DNA_TYPES[dnaType]) {
      return DNA_TYPES[dnaType]
    }
  }

  // ⚠️ 매칭되는 태그가 없으면 기본 유형 반환
  // (기본값 생성이지만, DNA는 표현 레이어이므로 허용)
  return DNA_TYPES.default
}




