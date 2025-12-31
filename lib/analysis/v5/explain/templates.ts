/**
 * Phase 4-1: Explain Layer 템플릿 정의
 * 
 * ⚠️ 절대 원칙:
 * - 태그 생성 금지
 * - 점수 계산 금지
 * - 조건 해석 금지
 * - 결과 변경 금지
 * - 기본값 생성 금지
 * 
 * 역할: 이미 확정된 태그를 문장으로 "번역"만 수행
 */

import type { ExplainItem } from './index'

/**
 * 태그 설명 템플릿
 * 
 * 1 태그 → 1 설명
 * 태그 없으면 설명 없음
 */
export const TAG_TEMPLATES: Record<string, ExplainItem> = {
  OLD_RISK_HIGH: {
    key: 'OLD_RISK_HIGH',
    title: '노후 건물 리스크가 높습니다',
    description:
      '건물 연식이 20년 이상이며, 누수나 균열 등의 문제가 확인되어 방수 및 설비 공정이 필수로 반영되었습니다.',
  },

  OLD_RISK_MEDIUM: {
    key: 'OLD_RISK_MEDIUM',
    title: '건물 노후도가 중간 수준입니다',
    description:
      '건물 연식이 15년 이상으로, 예방적 차원에서 방수 및 설비 공정을 권장합니다.',
  },

  STORAGE_RISK_HIGH: {
    key: 'STORAGE_RISK_HIGH',
    title: '수납 부담이 큰 집입니다',
    description:
      '현재 생활 패턴과 공간 구성상, 물건이 쌓이기 쉬운 구조로 판단되어 수납 개선이 중요한 요소로 반영되었습니다.',
  },

  SHORT_STAY: {
    key: 'SHORT_STAY',
    title: '단기 거주 계획입니다',
    description:
      '1~3년 이내의 거주 계획이 확인되어, 구조 변경 공정은 제외하고 마감 위주로 설계가 구성되었습니다.',
  },

  LONG_STAY: {
    key: 'LONG_STAY',
    title: '장기 거주 계획입니다',
    description:
      '5년 이상의 장기 거주 계획과 구조 변경 의향이 확인되어, 내구성과 품질 중심의 공정이 권장되었습니다.',
  },

  SAFETY_RISK: {
    key: 'SAFETY_RISK',
    title: '안전 요소가 중요합니다',
    description:
      '가족 구성과 생활 방식상 미끄럼, 충돌 등 안전 리스크를 줄이는 설계가 필요하다고 판단되었습니다.',
  },

  BUDGET_TIGHT: {
    key: 'BUDGET_TIGHT',
    title: '예산이 제한적입니다',
    description:
      '예산 범위가 제한되어 있어, 모든 공정에서 기본 등급을 우선 추천합니다.',
  },

  DECISION_FATIGUE_HIGH: {
    key: 'DECISION_FATIGUE_HIGH',
    title: '선택 결정이 어려우신 상황입니다',
    description:
      '전문가 추천을 원하시고 선택이 어려우신 것으로 확인되어, 옵션 노출 수를 제한하여 결정 부담을 줄이는 방향으로 구성되었습니다.',
  },

  KITCHEN_IMPORTANT: {
    key: 'KITCHEN_IMPORTANT',
    title: '주방이 중요한 공간입니다',
    description:
      '주방 사용 빈도와 중요도가 높은 것으로 확인되어, 주방 공정이 필수로 포함되었습니다.',
  },

  BATHROOM_COMFORT: {
    key: 'BATHROOM_COMFORT',
    title: '욕실 편의성이 중요합니다',
    description:
      '반신욕 등의 욕실 편의 기능을 원하시는 것으로 확인되어, 욕실 공정이 필수로 포함되었습니다.',
  },

  STYLE_EXCLUDE: {
    key: 'STYLE_EXCLUDE',
    title: '특정 스타일을 제외하고 싶으십니다',
    description:
      '원하지 않는 스타일이 확인되어, 해당 스타일 관련 옵션이 제외되었습니다.',
  },

  MAINTENANCE_EASY: {
    key: 'MAINTENANCE_EASY',
    title: '관리 편의성이 중요합니다',
    description:
      '관리와 청소가 쉬운 자재와 구조를 선호하시는 것으로 확인되어, 유지보수 편의성을 고려한 옵션이 반영되었습니다.',
  },
}

/**
 * 공정 설명 템플릿
 * 
 * required / recommend / enable 만 설명
 * disable은 설명하지 않음
 */
export const PROCESS_TEMPLATES: Record<string, Omit<ExplainItem, 'key'>> = {
  waterproof: {
    title: '방수 공정이 필수로 포함되었습니다',
    description:
      '건물 노후도와 누수 리스크를 고려하여, 방수 공정이 필수 공정으로 반영되었습니다.',
  },

  plumbing: {
    title: '설비 공정이 필수로 포함되었습니다',
    description:
      '건물 노후도와 설비 교체 필요성을 고려하여, 설비 공정이 필수 공정으로 반영되었습니다.',
  },

  storage: {
    title: '수납 공정이 필수로 포함되었습니다',
    description:
      '수납 부담이 큰 것으로 확인되어, 수납 공정이 필수 공정으로 반영되었습니다.',
  },

  bathroom: {
    title: '욕실 공정이 필수로 포함되었습니다',
    description:
      '안전 리스크나 욕실 편의성 요구사항을 고려하여, 욕실 공정이 필수 공정으로 반영되었습니다.',
  },

  kitchen: {
    title: '주방 공정이 필수로 포함되었습니다',
    description:
      '주방 중요도가 높은 것으로 확인되어, 주방 공정이 필수 공정으로 반영되었습니다.',
  },

  finish: {
    title: '마감 공정이 권장됩니다',
    description:
      '장기 거주 계획을 고려하여, 내구성과 품질 중심의 마감 공정이 권장되었습니다.',
  },

  window: {
    title: '창호 공정이 권장됩니다',
    description:
      '장기 거주 계획을 고려하여, 단열과 품질 중심의 창호 공정이 권장되었습니다.',
  },

  insulation: {
    title: '단열 공정이 포함되었습니다',
    description:
      '건물 노후도와 단열 성능을 고려하여, 단열 공정이 반영되었습니다.',
  },

  closet: {
    title: '붙박이장 옵션이 기본 활성화되었습니다',
    description:
      '수납 부담이 큰 것으로 확인되어, 붙박이장 옵션이 기본적으로 활성화되었습니다.',
  },

  shoeRack: {
    title: '신발장 옵션이 기본 활성화되었습니다',
    description:
      '수납 부담이 큰 것으로 확인되어, 신발장 옵션이 기본적으로 활성화되었습니다.',
  },

  bathroomSafety: {
    title: '욕실 안전 옵션이 필수로 포함되었습니다',
    description:
      '안전 리스크를 고려하여, 미끄럼 방지, 손잡이 등의 욕실 안전 옵션이 필수로 반영되었습니다.',
  },
}




