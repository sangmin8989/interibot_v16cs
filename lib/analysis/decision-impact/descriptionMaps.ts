/**
 * 인테리봇 성향분석 엔진 - 문장 생성용 번역 테이블
 * 
 * 명세서 vFinal 기준
 * - 공정/옵션 코드 → 사람이 읽는 문장 변환
 * - coreCriteria → "결정 이유" 문장 생성
 */

// ============================================
// 1. 공정 코드 → 설명 문장 매핑
// ============================================

/**
 * 공정 코드를 사람이 읽는 문장으로 변환
 * 명세서 요구: "그래서 무엇이 달라졌는지" 서술
 */
export const PROCESS_DESCRIPTION_MAP: Record<string, string> = {
  // 공정 포함
  '주방': '주방 공정을 기본 포함했습니다.',
  '욕실': '욕실 공정을 기본 포함했습니다.',
  '목공': '목공 공정을 기본 포함했습니다.',
  '전기': '전기 공정을 기본 포함했습니다.',
  '타일': '타일 공정을 기본 포함했습니다.',
  '도배': '도배 공정을 기본 포함했습니다.',
  '필름': '필름 공정을 기본 포함했습니다.',
  '철거': '철거 공정을 기본 포함했습니다.',
  '기타': '기타 공정을 기본 포함했습니다.',
  
  // 공정 제외는 별도 처리 (동적 생성)
};

/**
 * 공정 제외 문장 생성
 */
export function getProcessExcludeDescription(processCode: string): string {
  const processNames: Record<string, string> = {
    '주방': '주방',
    '욕실': '욕실',
    '목공': '목공',
    '전기': '전기',
    '타일': '타일',
    '도배': '도배',
    '필름': '필름',
    '철거': '철거',
    '기타': '기타',
  };
  
  const name = processNames[processCode] || processCode;
  return `${name} 공정은 제외되었습니다.`;
}

// ============================================
// 2. 옵션 코드 → 설명 문장 매핑
// ============================================

/**
 * 옵션 코드를 사람이 읽는 문장으로 변환
 * 명세서 요구: "그래서 무엇이 달라졌는지" 서술
 */
export const OPTION_DESCRIPTION_MAP: Record<string, { default: string; exclude: string }> = {
  'BUILT_IN_STORAGE': {
    default: '붙박이 수납을 기본 포함했습니다.',
    exclude: '오픈 수납은 제외되었습니다.',
  },
  'OPEN_SHELF': {
    default: '오픈 수납을 기본 포함했습니다.',
    exclude: '오픈 수납은 제외되었습니다.',
  },
  'EASY_CLEAN_MATERIAL': {
    default: '청소가 쉬운 마감재를 기본 포함했습니다.',
    exclude: '유지관리가 어려운 마감재는 제외되었습니다.',
  },
  'HIGH_MAINTENANCE_FINISH': {
    default: '프리미엄 마감 옵션을 기본 포함했습니다.',
    exclude: '프리미엄 마감 옵션은 제외되었습니다.',
  },
  'COST_EFFECTIVE_OPTIONS': {
    default: '비용 효율적인 옵션을 기본 포함했습니다.',
    exclude: '고가 옵션은 제외되었습니다.',
  },
  'PREMIUM_GRADE_OPTIONS': {
    default: '프리미엄 등급 옵션을 기본 포함했습니다.',
    exclude: '프리미엄 등급 옵션은 제외되었습니다.',
  },
  'SAFETY_FEATURES': {
    default: '안전 기능을 기본 포함했습니다.',
    exclude: '안전 기능은 필수이므로 제외되지 않습니다.',
  },
  'FAMILY_FRIENDLY_OPTIONS': {
    default: '가족 친화적 옵션을 기본 포함했습니다.',
    exclude: '가족 친화적 옵션은 필수이므로 제외되지 않습니다.',
  },
  'HEALTH_CONSIDERATIONS': {
    default: '건강 고려 사항을 기본 포함했습니다.',
    exclude: '건강 고려 사항은 필수이므로 제외되지 않습니다.',
  },
  'QUIET_OPTIONS': {
    default: '조용한 옵션을 기본 포함했습니다.',
    exclude: '소음이 많은 옵션은 제외되었습니다.',
  },
  'BRIGHT_LIGHTING': {
    default: '밝은 조명을 기본 포함했습니다.',
    exclude: '어두운 조명은 제외되었습니다.',
  },
  'SOFT_LIGHTING': {
    default: '부드러운 조명을 기본 포함했습니다.',
    exclude: '강한 조명은 제외되었습니다.',
  },
  'NEUTRAL_COLORS': {
    default: '중성 색상을 기본 포함했습니다.',
    exclude: '강한 색상은 제외되었습니다.',
  },
  'WARM_COLORS': {
    default: '따뜻한 색상을 기본 포함했습니다.',
    exclude: '차가운 색상은 제외되었습니다.',
  },
};

/**
 * 옵션 기본값 문장 생성
 */
export function getOptionDefaultDescription(optionCode: string): string {
  return OPTION_DESCRIPTION_MAP[optionCode]?.default || `${optionCode} 옵션을 기본 포함했습니다.`;
}

/**
 * 옵션 제외 문장 생성
 */
export function getOptionExcludeDescription(optionCode: string): string {
  return OPTION_DESCRIPTION_MAP[optionCode]?.exclude || `${optionCode} 옵션은 제외되었습니다.`;
}

// ============================================
// 3. coreCriteria 문장 생성 (결정 이유)
// ============================================

import type { PreferenceCategory } from '../questions/types';
import type { PriorityGroup } from './types';

/**
 * 성향 카테고리 → "결정 기준" 문장 매핑
 * 명세서 요구: "결정 이유가 바로 보이는 문장", 추상 단어 ❌
 */
export const CORE_CRITERIA_MAP: Record<PreferenceCategory, string> = {
  // Safety 그룹
  family_composition: '가족 안전 우선',
  health_factors: '건강 요소 최우선 고려',
  
  // Budget 그룹
  budget_sense: '예산 초과 가능성 최소화',
  
  // Maintenance 그룹
  cleaning_preference: '유지관리 부담 최소화',
  organization_habit: '정리 부담 최소화',
  
  // Family 그룹 (현재 없음)
  // family_composition은 safety에 포함
  
  // Function 그룹
  activity_flow: '동선 최적화',
  discomfort_factors: '불편 요소 해소',
  space_sense: '공간 활용 극대화',
  home_purpose: '사용 목적에 맞춘 기능',
  sleep_pattern: '수면 환경 최적화',
  
  // Lifestyle 그룹
  life_routine: '생활 패턴 반영',
  hobby_lifestyle: '취미 활동 공간 확보',
  
  // Aesthetic 그룹
  color_preference: '색감 선호도 반영',
  lighting_preference: '조명 선호도 반영',
  sensory_sensitivity: '시각적 편안함 우선',
};

/**
 * 우선순위 그룹 → "결정 기준" 문장 매핑
 * priorityGroup 상위에서 2~3개 선택 시 사용
 */
export const PRIORITY_GROUP_CRITERIA_MAP: Record<PriorityGroup, string> = {
  safety: '안전 및 건강 최우선',
  budget: '예산 통제 우선',
  maintenance: '유지관리 부담 최소화',
  family: '가족 구성 반영',
  function: '기능 및 동선 최적화',
  lifestyle: '생활 패턴 반영',
  aesthetic: '미감 및 취향 반영',
};

/**
 * coreCriteria 문장 생성
 * priorityGroup 상위에서 2~3개 선택
 * 명세서 7-1: priorityGroup 상위에서 2~3개, 추상 단어 ❌, 결정 이유가 바로 보이는 문장
 */
export function generateCoreCriteriaSentences(
  appliedCategories: PreferenceCategory[],
  priorityGroups: PriorityGroup[]
): string[] {
  // priorityGroup 상위에서 2~3개 선택
  const topGroups = priorityGroups.slice(0, 3);
  const criteria: string[] = [];
  
  for (const group of topGroups) {
    const sentence = PRIORITY_GROUP_CRITERIA_MAP[group];
    if (sentence && !criteria.includes(sentence)) {
      criteria.push(sentence);
    }
  }
  
  // 2~3개로 제한
  return criteria.slice(0, 3);
}




