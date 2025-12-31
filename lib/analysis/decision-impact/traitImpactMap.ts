/**
 * 인테리봇 성향분석 엔진 개편 - 성향 영향 매핑 테이블
 * 
 * 명세서 vFinal 기준
 * - 각 성향의 HIGH/LOW 레벨별 영향 규칙 정의
 * - 단독 영향 폐기 성향은 HIGH/LOW를 null로 설정
 * 
 * ⚠️ 주의: 공정/옵션 코드는 실제 시스템과 매핑 필요
 * - processIncludes/processExcludes: 공정 ID 또는 코드
 * - optionDefaults/optionExcludes: 옵션 ID 또는 코드
 */

import type { PreferenceCategory } from '../questions/types';
import type {
  TraitImpactMap,
  TraitImpactDefinition,
  PriorityGroup,
} from './types';
import { traitToPriorityGroup } from './traitPriority';
import { PREFERENCE_CATEGORIES } from '../questions/types';

// ============================================
// 1. organization_habit (정리 습관) ✅ 유지
// ============================================

const organizationHabit: TraitImpactDefinition = {
  priorityGroup: 'maintenance',
  HIGH: {
    allow: {
      forceProcess: false,
      defaultOptions: true,
      excludeOptions: true,
    },
    impacts: {
      optionDefaults: ['BUILT_IN_STORAGE'],
      optionExcludes: ['OPEN_SHELF'],
      riskMessage: '정리 부담을 줄이기 위해 오픈 수납은 제외되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '정리 습관이 낮아 수납 옵션은 자유롭게 선택할 수 있습니다.',
    },
  },
};

// ============================================
// 2. cleaning_preference (청소 성향) ✅ 유지
// ============================================

const cleaningPreference: TraitImpactDefinition = {
  priorityGroup: 'maintenance',
  HIGH: {
    allow: {
      forceProcess: false,
      defaultOptions: true,
      excludeOptions: true,
    },
    impacts: {
      optionDefaults: ['EASY_CLEAN_MATERIAL'],
      optionExcludes: ['HIGH_MAINTENANCE_FINISH'],
      riskMessage: '유지관리가 쉬운 마감 위주로 판단되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '청소 성향이 낮아 마감재 선택의 자유도가 높습니다.',
    },
  },
};

// ============================================
// 3. budget_sense (예산 감각) ✅ 유지 (상위 우선순위)
// ============================================

const budgetSense: TraitImpactDefinition = {
  priorityGroup: 'budget',
  HIGH: {
    allow: {
      forceProcess: false,
      defaultOptions: true,
      excludeOptions: true,
    },
    impacts: {
      optionDefaults: ['COST_EFFECTIVE_OPTIONS'],
      optionExcludes: ['PREMIUM_GRADE_OPTIONS'],
      riskMessage: '예산 초과 가능성이 있어 프리미엄 옵션은 제외되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '예산 감각이 낮아 고급 옵션 선택이 가능합니다.',
    },
  },
};

// ============================================
// 4. family_composition (가족 구성) ✅ 유지 (공정 강제 가능)
// ============================================

const familyComposition: TraitImpactDefinition = {
  priorityGroup: 'safety',
  HIGH: {
    allow: {
      forceProcess: true,  // safety 그룹이므로 공정 강제 가능
      defaultOptions: true,
      excludeOptions: false,
    },
    impacts: {
      processIncludes: ['SAFETY_INSTALLATION'],
      optionDefaults: ['ANTI_SLIP', 'ROUND_EDGE'],
      riskMessage: '가족 안전을 고려해 안전 관련 공정이 포함되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '1인 가구이므로 안전 옵션은 선택 사항입니다.',
    },
  },
};

// ============================================
// 5. health_factors (건강 요소) ✅ 유지 (공정 강제 가능)
// ============================================

const healthFactors: TraitImpactDefinition = {
  priorityGroup: 'safety',
  HIGH: {
    allow: {
      forceProcess: true,  // safety 그룹이므로 공정 강제 가능
      defaultOptions: true,
      excludeOptions: false,
    },
    impacts: {
      processIncludes: ['AIR_QUALITY_IMPROVEMENT'],
      optionDefaults: ['ECO_FRIENDLY_MATERIAL', 'VENTILATION_SYSTEM'],
      riskMessage: '건강 요소를 최우선으로 고려하여 친환경 자재와 환기 시스템이 포함되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '건강 요소가 낮아 일반 자재 선택이 가능합니다.',
    },
  },
};

// ============================================
// 6. lighting_preference (조명 취향) ⚠️ 보완 (공정 강제 ❌)
// ============================================

const lightingPreference: TraitImpactDefinition = {
  priorityGroup: 'aesthetic',
  HIGH: {
    allow: {
      forceProcess: false,
      defaultOptions: true,
      excludeOptions: false,
    },
    impacts: {
      optionDefaults: ['DIMMING_LIGHT'],
      riskMessage: '조명 사용 빈도를 고려해 디밍 옵션이 기본 적용되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '조명 취향이 낮아 기본 조명만으로도 충분합니다.',
    },
  },
};

// ============================================
// 7. color_preference (색감 취향) ⚠️ 제한적 유지
// ============================================

const colorPreference: TraitImpactDefinition = {
  priorityGroup: 'aesthetic',
  HIGH: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: true,
    },
    impacts: {
      optionExcludes: ['HIGH_CHROMA_COLOR'],
      riskMessage: '색상 피로도를 줄이기 위해 포인트 컬러는 제한되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '색감 취향이 낮아 다양한 색상 선택이 가능합니다.',
    },
  },
};

// ============================================
// 8. discomfort_factors (불편 요소) ✅ 유지
// ============================================

const discomfortFactors: TraitImpactDefinition = {
  priorityGroup: 'function',
  HIGH: {
    allow: {
      forceProcess: false,  // function 그룹이지만 공정 강제는 canForceProcess 조건 필요
      defaultOptions: true,
      excludeOptions: false,
    },
    impacts: {
      processIncludes: ['PROBLEM_SOLVING_PROCESS'],
      optionDefaults: ['FUNCTIONAL_IMPROVEMENT'],
      riskMessage: '불편 요소 해결을 위해 기능 개선 공정이 포함되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '불편 요소가 낮아 기존 구조 유지가 가능합니다.',
    },
  },
};

// ============================================
// 9. activity_flow (활동 동선) ✅ 유지
// ============================================

const activityFlow: TraitImpactDefinition = {
  priorityGroup: 'function',
  HIGH: {
    allow: {
      forceProcess: false,
      defaultOptions: true,
      excludeOptions: false,
    },
    impacts: {
      optionDefaults: ['FLOW_OPTIMIZATION'],
      riskMessage: '활동 동선을 최적화하기 위해 공간 배치 옵션이 기본 적용되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '동선 중요도가 낮아 자유로운 배치가 가능합니다.',
    },
  },
};

// ============================================
// 10. sensory_sensitivity (시각 민감도) ✅ 추가
// ============================================

const sensorySensitivity: TraitImpactDefinition = {
  priorityGroup: 'aesthetic',
  HIGH: {
    allow: {
      forceProcess: false,
      defaultOptions: true,
      excludeOptions: true,
    },
    impacts: {
      optionDefaults: ['SOFT_LIGHTING', 'NEUTRAL_COLOR'],
      optionExcludes: ['HARSH_LIGHTING', 'VIBRANT_COLOR'],
      riskMessage: '감각 민감도가 높아 부드러운 조명과 중성 색상이 기본 적용되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '감각 민감도가 낮아 다양한 조명과 색상 선택이 가능합니다.',
    },
  },
};

// ============================================
// 11. home_purpose (집 사용 목적) ✅ 추가
// ============================================

const homePurpose: TraitImpactDefinition = {
  priorityGroup: 'function',
  HIGH: {
    allow: {
      forceProcess: false,
      defaultOptions: true,
      excludeOptions: false,
    },
    impacts: {
      optionDefaults: ['PURPOSE_SPECIFIC_OPTIONS'],
      riskMessage: '집 사용 목적에 맞는 옵션이 기본 적용되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '집 사용 목적이 명확하지 않아 범용 옵션이 적용됩니다.',
    },
  },
};

// ============================================
// 12. sleep_pattern (수면 패턴) ✅ 추가
// ============================================

const sleepPattern: TraitImpactDefinition = {
  priorityGroup: 'function',
  HIGH: {
    allow: {
      forceProcess: false,
      defaultOptions: true,
      excludeOptions: false,
    },
    impacts: {
      optionDefaults: ['BLACKOUT_CURTAIN', 'SOUND_PROOFING'],
      riskMessage: '수면 패턴을 고려해 암막 및 방음 옵션이 기본 적용되었습니다.',
    },
  },
  LOW: {
    allow: {
      forceProcess: false,
      defaultOptions: false,
      excludeOptions: false,
    },
    impacts: {
      riskMessage: '수면 패턴이 자유로워 기본 옵션만으로 충분합니다.',
    },
  },
};

// ============================================
// 13-15. 단독 영향 폐기 성향 ❌
// ============================================

// space_sense, life_routine, hobby_lifestyle는 단독 영향 없음
// 증폭 인자로만 사용됨

const spaceSense: TraitImpactDefinition = {
  priorityGroup: 'function',
  HIGH: null,  // 단독 영향 폐기
  LOW: null,
};

const lifeRoutine: TraitImpactDefinition = {
  priorityGroup: 'lifestyle',
  HIGH: null,  // 단독 영향 폐기
  LOW: null,
};

const hobbyLifestyle: TraitImpactDefinition = {
  priorityGroup: 'lifestyle',
  HIGH: null,  // 단독 영향 폐기
  LOW: null,
};

// ============================================
// 전체 매핑 테이블
// ============================================

/**
 * 성향 영향 매핑 테이블
 * 
 * ❗ 모든 PreferenceCategory가 포함되어야 함
 * 누락되면 DecisionImpactEngine에서 FAIL
 */
export const traitImpactMap: TraitImpactMap = {
  space_sense: spaceSense,
  sensory_sensitivity: sensorySensitivity,
  cleaning_preference: cleaningPreference,
  organization_habit: organizationHabit,
  family_composition: familyComposition,
  health_factors: healthFactors,
  budget_sense: budgetSense,
  color_preference: colorPreference,
  lighting_preference: lightingPreference,
  home_purpose: homePurpose,
  discomfort_factors: discomfortFactors,
  activity_flow: activityFlow,
  life_routine: lifeRoutine,
  sleep_pattern: sleepPattern,
  hobby_lifestyle: hobbyLifestyle,
};

// ============================================
// 검증 함수
// ============================================

/**
 * traitImpactMap이 모든 성향을 포함하는지 검증
 * @throws Error - 누락된 성향이 있으면
 */
export function validateTraitImpactMap(): void {
  const missing: PreferenceCategory[] = [];
  for (const category of PREFERENCE_CATEGORIES as readonly PreferenceCategory[]) {
    if (!traitImpactMap[category]) {
      missing.push(category);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `traitImpactMap에 누락된 성향: ${missing.join(', ')}`
    );
  }
  
  // priorityGroup 일치 검증
  for (const [category, definition] of Object.entries(traitImpactMap)) {
    const expectedGroup = traitToPriorityGroup[category as PreferenceCategory];
    if (definition.priorityGroup !== expectedGroup) {
      throw new Error(
        `${category}의 priorityGroup이 일치하지 않습니다. ` +
        `traitImpactMap: ${definition.priorityGroup}, ` +
        `traitPriority: ${expectedGroup}`
      );
    }
  }
}






