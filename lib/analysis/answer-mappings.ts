/**
 * 답변→점수 매핑 테이블
 * 
 * 기존 hashToScore 함수(난수 기반)를 대체하여
 * 고객의 실제 답변 내용에 따라 정확한 점수를 부여합니다.
 * 
 * 각 답변은 1~2개의 카테고리에 영향을 미치며,
 * 점수는 1~10 범위입니다.
 */

import { PreferenceCategory } from './questions/types';

// 답변 매핑 타입 정의
export interface AnswerImpact {
  category: PreferenceCategory;
  score: number; // 1~10
}

export interface AnswerMapping {
  questionId: string;
  answerValue: string;
  impacts: AnswerImpact[];
}

// ========================================
// Quick 모드 매핑 (4문항 × 6옵션 = 24개)
// ========================================

const quickMappings: AnswerMapping[] = [
  // Q1: quick_first_scene - 퇴근해서 제일 먼저 보이고 싶은 장면
  {
    questionId: 'quick_first_scene',
    answerValue: 'hotel_hallway',
    impacts: [
      { category: 'organization_habit', score: 9 },
      { category: 'color_preference', score: 8 },
    ],
  },
  {
    questionId: 'quick_first_scene',
    answerValue: 'warm_kitchen',
    impacts: [
      { category: 'family_composition', score: 8 },
      { category: 'home_purpose', score: 7 },
    ],
  },
  {
    questionId: 'quick_first_scene',
    answerValue: 'cozy_living',
    impacts: [
      { category: 'sensory_sensitivity', score: 7 },
      { category: 'activity_flow', score: 6 },
    ],
  },
  {
    questionId: 'quick_first_scene',
    answerValue: 'family_space',
    impacts: [
      { category: 'family_composition', score: 9 },
      { category: 'health_factors', score: 7 },
    ],
  },
  {
    questionId: 'quick_first_scene',
    answerValue: 'aesthetic_decor',
    impacts: [
      { category: 'color_preference', score: 9 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'quick_first_scene',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'space_sense', score: 5 },
    ],
  },

  // Q2: quick_photo_space - 사진 찍어 올리고 싶은 공간
  {
    questionId: 'quick_photo_space',
    answerValue: 'living_room',
    impacts: [
      { category: 'space_sense', score: 8 },
      { category: 'home_purpose', score: 7 },
    ],
  },
  {
    questionId: 'quick_photo_space',
    answerValue: 'kitchen',
    impacts: [
      { category: 'home_purpose', score: 8 },
      { category: 'life_routine', score: 7 },
    ],
  },
  {
    questionId: 'quick_photo_space',
    answerValue: 'bedroom',
    impacts: [
      { category: 'sleep_pattern', score: 8 },
      { category: 'sensory_sensitivity', score: 7 },
    ],
  },
  {
    questionId: 'quick_photo_space',
    answerValue: 'bathroom',
    impacts: [
      { category: 'cleaning_preference', score: 8 },
      { category: 'health_factors', score: 7 },
    ],
  },
  {
    questionId: 'quick_photo_space',
    answerValue: 'workspace',
    impacts: [
      { category: 'home_purpose', score: 9 },
      { category: 'activity_flow', score: 8 },
    ],
  },
  {
    questionId: 'quick_photo_space',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'space_sense', score: 5 },
    ],
  },

  // Q3: quick_no_compromise - 절대 타협하고 싶지 않은 것
  {
    questionId: 'quick_no_compromise',
    answerValue: 'natural_light',
    impacts: [
      { category: 'lighting_preference', score: 9 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'quick_no_compromise',
    answerValue: 'lighting',
    impacts: [
      { category: 'lighting_preference', score: 9 },
      { category: 'color_preference', score: 7 },
    ],
  },
  {
    questionId: 'quick_no_compromise',
    answerValue: 'storage',
    impacts: [
      { category: 'organization_habit', score: 9 },
      { category: 'discomfort_factors', score: 8 },
    ],
  },
  {
    questionId: 'quick_no_compromise',
    answerValue: 'finish_quality',
    impacts: [
      { category: 'sensory_sensitivity', score: 9 },
      { category: 'budget_sense', score: 7 },
    ],
  },
  {
    questionId: 'quick_no_compromise',
    answerValue: 'flow',
    impacts: [
      { category: 'activity_flow', score: 9 },
      { category: 'space_sense', score: 8 },
    ],
  },
  {
    questionId: 'quick_no_compromise',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'budget_sense', score: 5 },
    ],
  },

  // Q4: quick_atmosphere - 집 전체 분위기
  {
    questionId: 'quick_atmosphere',
    answerValue: 'healing',
    impacts: [
      { category: 'sensory_sensitivity', score: 8 },
      { category: 'health_factors', score: 7 },
    ],
  },
  {
    questionId: 'quick_atmosphere',
    answerValue: 'focus',
    impacts: [
      { category: 'home_purpose', score: 9 },
      { category: 'organization_habit', score: 7 },
    ],
  },
  {
    questionId: 'quick_atmosphere',
    answerValue: 'family',
    impacts: [
      { category: 'family_composition', score: 9 },
      { category: 'activity_flow', score: 7 },
    ],
  },
  {
    questionId: 'quick_atmosphere',
    answerValue: 'leisure',
    impacts: [
      { category: 'sensory_sensitivity', score: 8 },
      { category: 'color_preference', score: 8 },
    ],
  },
  {
    questionId: 'quick_atmosphere',
    answerValue: 'success',
    impacts: [
      { category: 'budget_sense', score: 8 },
      { category: 'home_purpose', score: 8 },
    ],
  },
  {
    questionId: 'quick_atmosphere',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'home_purpose', score: 5 },
    ],
  },
];

// ========================================
// Standard 모드 추가 매핑 (6문항 × 6옵션 = 36개)
// ========================================

const standardMappings: AnswerMapping[] = [
  // Q5: standard_main_space - 가장 오래 머무는 공간
  {
    questionId: 'standard_main_space',
    answerValue: 'living_room',
    impacts: [
      { category: 'space_sense', score: 8 },
      { category: 'activity_flow', score: 7 },
    ],
  },
  {
    questionId: 'standard_main_space',
    answerValue: 'kitchen',
    impacts: [
      { category: 'life_routine', score: 8 },
      { category: 'home_purpose', score: 7 },
    ],
  },
  {
    questionId: 'standard_main_space',
    answerValue: 'bedroom',
    impacts: [
      { category: 'sleep_pattern', score: 8 },
      { category: 'sensory_sensitivity', score: 7 },
    ],
  },
  {
    questionId: 'standard_main_space',
    answerValue: 'workspace',
    impacts: [
      { category: 'home_purpose', score: 9 },
      { category: 'organization_habit', score: 7 },
    ],
  },
  {
    questionId: 'standard_main_space',
    answerValue: 'kids_room',
    impacts: [
      { category: 'family_composition', score: 9 },
      { category: 'health_factors', score: 8 },
    ],
  },
  {
    questionId: 'standard_main_space',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'activity_flow', score: 5 },
    ],
  },

  // Q6: standard_daily_discomfort - 매일 불편한 것
  {
    questionId: 'standard_daily_discomfort',
    answerValue: 'storage',
    impacts: [
      { category: 'organization_habit', score: 9 },
      { category: 'discomfort_factors', score: 9 },
    ],
  },
  {
    questionId: 'standard_daily_discomfort',
    answerValue: 'flow',
    impacts: [
      { category: 'activity_flow', score: 9 },
      { category: 'discomfort_factors', score: 8 },
    ],
  },
  {
    questionId: 'standard_daily_discomfort',
    answerValue: 'lighting',
    impacts: [
      { category: 'lighting_preference', score: 9 },
      { category: 'discomfort_factors', score: 8 },
    ],
  },
  {
    questionId: 'standard_daily_discomfort',
    answerValue: 'materials',
    impacts: [
      { category: 'color_preference', score: 9 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'standard_daily_discomfort',
    answerValue: 'layout',
    impacts: [
      { category: 'space_sense', score: 9 },
      { category: 'activity_flow', score: 8 },
    ],
  },
  {
    questionId: 'standard_daily_discomfort',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'discomfort_factors', score: 5 },
    ],
  },

  // Q7: standard_cleaning_style - 청소 스타일
  {
    questionId: 'standard_cleaning_style',
    answerValue: 'frequent_messy',
    impacts: [
      { category: 'cleaning_preference', score: 6 },
      { category: 'organization_habit', score: 4 },
    ],
  },
  {
    questionId: 'standard_cleaning_style',
    answerValue: 'batch_clean',
    impacts: [
      { category: 'cleaning_preference', score: 5 },
      { category: 'life_routine', score: 6 },
    ],
  },
  {
    questionId: 'standard_cleaning_style',
    answerValue: 'only_when_bad',
    impacts: [
      { category: 'cleaning_preference', score: 3 },
      { category: 'organization_habit', score: 3 },
    ],
  },
  {
    questionId: 'standard_cleaning_style',
    answerValue: 'system_needed',
    impacts: [
      { category: 'organization_habit', score: 8 },
      { category: 'cleaning_preference', score: 7 },
    ],
  },
  {
    questionId: 'standard_cleaning_style',
    answerValue: 'hide_all',
    impacts: [
      { category: 'organization_habit', score: 9 },
      { category: 'cleaning_preference', score: 6 },
    ],
  },
  {
    questionId: 'standard_cleaning_style',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'cleaning_preference', score: 5 },
    ],
  },

  // Q8: standard_family_time - 가족 모이는 시간/장소
  {
    questionId: 'standard_family_time',
    answerValue: 'weekday_living',
    impacts: [
      { category: 'family_composition', score: 8 },
      { category: 'space_sense', score: 7 },
    ],
  },
  {
    questionId: 'standard_family_time',
    answerValue: 'weekday_kitchen',
    impacts: [
      { category: 'family_composition', score: 8 },
      { category: 'life_routine', score: 8 },
    ],
  },
  {
    questionId: 'standard_family_time',
    answerValue: 'weekend_living',
    impacts: [
      { category: 'family_composition', score: 7 },
      { category: 'hobby_lifestyle', score: 7 },
    ],
  },
  {
    questionId: 'standard_family_time',
    answerValue: 'weekend_kitchen',
    impacts: [
      { category: 'family_composition', score: 7 },
      { category: 'life_routine', score: 7 },
    ],
  },
  {
    questionId: 'standard_family_time',
    answerValue: 'separate',
    impacts: [
      { category: 'family_composition', score: 3 },
      { category: 'home_purpose', score: 6 },
    ],
  },
  {
    questionId: 'standard_family_time',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'family_composition', score: 5 },
    ],
  },

  // Q9: standard_budget_priority - 예산 우선순위
  {
    questionId: 'standard_budget_priority',
    answerValue: 'structure',
    impacts: [
      { category: 'space_sense', score: 9 },
      { category: 'budget_sense', score: 7 },
    ],
  },
  {
    questionId: 'standard_budget_priority',
    answerValue: 'materials',
    impacts: [
      { category: 'sensory_sensitivity', score: 9 },
      { category: 'budget_sense', score: 8 },
    ],
  },
  {
    questionId: 'standard_budget_priority',
    answerValue: 'storage',
    impacts: [
      { category: 'organization_habit', score: 9 },
      { category: 'budget_sense', score: 7 },
    ],
  },
  {
    questionId: 'standard_budget_priority',
    answerValue: 'lighting',
    impacts: [
      { category: 'lighting_preference', score: 9 },
      { category: 'color_preference', score: 7 },
    ],
  },
  {
    questionId: 'standard_budget_priority',
    answerValue: 'balance',
    impacts: [
      { category: 'budget_sense', score: 8 },
      { category: 'space_sense', score: 6 },
    ],
  },
  {
    questionId: 'standard_budget_priority',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'budget_sense', score: 5 },
    ],
  },

  // Q10: standard_compliment - 듣고 싶은 말
  {
    questionId: 'standard_compliment',
    answerValue: 'comfortable',
    impacts: [
      { category: 'sensory_sensitivity', score: 8 },
      { category: 'home_purpose', score: 7 },
    ],
  },
  {
    questionId: 'standard_compliment',
    answerValue: 'luxurious',
    impacts: [
      { category: 'budget_sense', score: 9 },
      { category: 'color_preference', score: 8 },
    ],
  },
  {
    questionId: 'standard_compliment',
    answerValue: 'suits_you',
    impacts: [
      { category: 'color_preference', score: 8 },
      { category: 'sensory_sensitivity', score: 7 },
    ],
  },
  {
    questionId: 'standard_compliment',
    answerValue: 'detailed',
    impacts: [
      { category: 'sensory_sensitivity', score: 9 },
      { category: 'organization_habit', score: 7 },
    ],
  },
  {
    questionId: 'standard_compliment',
    answerValue: 'worth_it',
    impacts: [
      { category: 'budget_sense', score: 9 },
      { category: 'discomfort_factors', score: 6 },
    ],
  },
  {
    questionId: 'standard_compliment',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'home_purpose', score: 5 },
    ],
  },
];

// ========================================
// Deep 모드 추가 매핑 (8문항 × 6옵션 = 48개)
// ========================================

const deepMappings: AnswerMapping[] = [
  // Q11: deep_sleep_brightness - 잠잘 때 밝기
  {
    questionId: 'deep_sleep_brightness',
    answerValue: 'complete_dark',
    impacts: [
      { category: 'sleep_pattern', score: 9 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'deep_sleep_brightness',
    answerValue: 'dim_light',
    impacts: [
      { category: 'sleep_pattern', score: 7 },
      { category: 'lighting_preference', score: 6 },
    ],
  },
  {
    questionId: 'deep_sleep_brightness',
    answerValue: 'no_curtain',
    impacts: [
      { category: 'sleep_pattern', score: 4 },
      { category: 'sensory_sensitivity', score: 3 },
    ],
  },
  {
    questionId: 'deep_sleep_brightness',
    answerValue: 'mood_light',
    impacts: [
      { category: 'lighting_preference', score: 8 },
      { category: 'sensory_sensitivity', score: 7 },
    ],
  },
  {
    questionId: 'deep_sleep_brightness',
    answerValue: 'varies',
    impacts: [
      { category: 'sleep_pattern', score: 5 },
      { category: 'lighting_preference', score: 6 },
    ],
  },
  {
    questionId: 'deep_sleep_brightness',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'sleep_pattern', score: 5 },
    ],
  },

  // Q12: deep_sleep_disturbance - 수면 방해 요소
  {
    questionId: 'deep_sleep_disturbance',
    answerValue: 'noise',
    impacts: [
      { category: 'sensory_sensitivity', score: 9 },
      { category: 'sleep_pattern', score: 8 },
    ],
  },
  {
    questionId: 'deep_sleep_disturbance',
    answerValue: 'light',
    impacts: [
      { category: 'lighting_preference', score: 9 },
      { category: 'sleep_pattern', score: 8 },
    ],
  },
  {
    questionId: 'deep_sleep_disturbance',
    answerValue: 'temperature',
    impacts: [
      { category: 'health_factors', score: 8 },
      { category: 'sensory_sensitivity', score: 7 },
    ],
  },
  {
    questionId: 'deep_sleep_disturbance',
    answerValue: 'air',
    impacts: [
      { category: 'health_factors', score: 9 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'deep_sleep_disturbance',
    answerValue: 'bed',
    impacts: [
      { category: 'sleep_pattern', score: 7 },
      { category: 'health_factors', score: 6 },
    ],
  },
  {
    questionId: 'deep_sleep_disturbance',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'sleep_pattern', score: 5 },
    ],
  },

  // Q13: deep_morning_first_10min - 아침 첫 10분
  {
    questionId: 'deep_morning_first_10min',
    answerValue: 'bed',
    impacts: [
      { category: 'sleep_pattern', score: 7 },
      { category: 'life_routine', score: 5 },
    ],
  },
  {
    questionId: 'deep_morning_first_10min',
    answerValue: 'dressing',
    impacts: [
      { category: 'organization_habit', score: 8 },
      { category: 'life_routine', score: 7 },
    ],
  },
  {
    questionId: 'deep_morning_first_10min',
    answerValue: 'kitchen',
    impacts: [
      { category: 'life_routine', score: 8 },
      { category: 'home_purpose', score: 7 },
    ],
  },
  {
    questionId: 'deep_morning_first_10min',
    answerValue: 'sofa',
    impacts: [
      { category: 'activity_flow', score: 6 },
      { category: 'sensory_sensitivity', score: 6 },
    ],
  },
  {
    questionId: 'deep_morning_first_10min',
    answerValue: 'bathroom',
    impacts: [
      { category: 'life_routine', score: 8 },
      { category: 'cleaning_preference', score: 7 },
    ],
  },
  {
    questionId: 'deep_morning_first_10min',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'life_routine', score: 5 },
    ],
  },

  // Q14: deep_physical_constraint - 피하고 싶은 동작
  {
    questionId: 'deep_physical_constraint',
    answerValue: 'floor_sitting',
    impacts: [
      { category: 'health_factors', score: 8 },
      { category: 'activity_flow', score: 7 },
    ],
  },
  {
    questionId: 'deep_physical_constraint',
    answerValue: 'squatting',
    impacts: [
      { category: 'health_factors', score: 8 },
      { category: 'organization_habit', score: 7 },
    ],
  },
  {
    questionId: 'deep_physical_constraint',
    answerValue: 'reaching_high',
    impacts: [
      { category: 'health_factors', score: 7 },
      { category: 'organization_habit', score: 8 },
    ],
  },
  {
    questionId: 'deep_physical_constraint',
    answerValue: 'stairs',
    impacts: [
      { category: 'health_factors', score: 9 },
      { category: 'activity_flow', score: 8 },
    ],
  },
  {
    questionId: 'deep_physical_constraint',
    answerValue: 'none',
    impacts: [
      { category: 'health_factors', score: 3 },
      { category: 'activity_flow', score: 5 },
    ],
  },
  {
    questionId: 'deep_physical_constraint',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'health_factors', score: 5 },
    ],
  },

  // Q15: deep_organization_style - 정리 스타일
  {
    questionId: 'deep_organization_style',
    answerValue: 'minimalist',
    impacts: [
      { category: 'organization_habit', score: 9 },
      { category: 'color_preference', score: 8 },
    ],
  },
  {
    questionId: 'deep_organization_style',
    answerValue: 'categorizer',
    impacts: [
      { category: 'organization_habit', score: 8 },
      { category: 'space_sense', score: 7 },
    ],
  },
  {
    questionId: 'deep_organization_style',
    answerValue: 'hide_all',
    impacts: [
      { category: 'organization_habit', score: 7 },
      { category: 'cleaning_preference', score: 6 },
    ],
  },
  {
    questionId: 'deep_organization_style',
    answerValue: 'messy_now',
    impacts: [
      { category: 'organization_habit', score: 4 },
      { category: 'discomfort_factors', score: 8 },
    ],
  },
  {
    questionId: 'deep_organization_style',
    answerValue: 'family_influenced',
    impacts: [
      { category: 'family_composition', score: 8 },
      { category: 'organization_habit', score: 5 },
    ],
  },
  {
    questionId: 'deep_organization_style',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'organization_habit', score: 5 },
    ],
  },

  // Q16: deep_cooking_stress - 요리 스트레스
  {
    questionId: 'deep_cooking_stress',
    answerValue: 'small_space',
    impacts: [
      { category: 'space_sense', score: 9 },
      { category: 'discomfort_factors', score: 8 },
    ],
  },
  {
    questionId: 'deep_cooking_stress',
    answerValue: 'storage',
    impacts: [
      { category: 'organization_habit', score: 9 },
      { category: 'discomfort_factors', score: 8 },
    ],
  },
  {
    questionId: 'deep_cooking_stress',
    answerValue: 'ventilation',
    impacts: [
      { category: 'health_factors', score: 8 },
      { category: 'sensory_sensitivity', score: 7 },
    ],
  },
  {
    questionId: 'deep_cooking_stress',
    answerValue: 'flow',
    impacts: [
      { category: 'activity_flow', score: 9 },
      { category: 'life_routine', score: 7 },
    ],
  },
  {
    questionId: 'deep_cooking_stress',
    answerValue: 'crowded',
    impacts: [
      { category: 'family_composition', score: 8 },
      { category: 'space_sense', score: 7 },
    ],
  },
  {
    questionId: 'deep_cooking_stress',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'life_routine', score: 5 },
    ],
  },

  // Q17: deep_smell_concern - 냄새 신경 쓰이는 곳
  {
    questionId: 'deep_smell_concern',
    answerValue: 'entrance',
    impacts: [
      { category: 'sensory_sensitivity', score: 7 },
      { category: 'organization_habit', score: 6 },
    ],
  },
  {
    questionId: 'deep_smell_concern',
    answerValue: 'kitchen',
    impacts: [
      { category: 'sensory_sensitivity', score: 8 },
      { category: 'cleaning_preference', score: 7 },
    ],
  },
  {
    questionId: 'deep_smell_concern',
    answerValue: 'bathroom',
    impacts: [
      { category: 'cleaning_preference', score: 9 },
      { category: 'health_factors', score: 7 },
    ],
  },
  {
    questionId: 'deep_smell_concern',
    answerValue: 'closet',
    impacts: [
      { category: 'organization_habit', score: 7 },
      { category: 'sensory_sensitivity', score: 6 },
    ],
  },
  {
    questionId: 'deep_smell_concern',
    answerValue: 'living_air',
    impacts: [
      { category: 'health_factors', score: 8 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'deep_smell_concern',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'sensory_sensitivity', score: 5 },
    ],
  },

  // Q18: deep_lighting_change - 조명 변경 방향
  {
    questionId: 'deep_lighting_change',
    answerValue: 'want_indirect',
    impacts: [
      { category: 'lighting_preference', score: 9 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'deep_lighting_change',
    answerValue: 'want_brighter',
    impacts: [
      { category: 'lighting_preference', score: 8 },
      { category: 'discomfort_factors', score: 7 },
    ],
  },
  {
    questionId: 'deep_lighting_change',
    answerValue: 'want_warmer',
    impacts: [
      { category: 'lighting_preference', score: 8 },
      { category: 'color_preference', score: 7 },
    ],
  },
  {
    questionId: 'deep_lighting_change',
    answerValue: 'already_good',
    impacts: [
      { category: 'lighting_preference', score: 9 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'deep_lighting_change',
    answerValue: 'basic_only',
    impacts: [
      { category: 'lighting_preference', score: 4 },
      { category: 'budget_sense', score: 6 },
    ],
  },
  {
    questionId: 'deep_lighting_change',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'lighting_preference', score: 5 },
    ],
  },
];

// ========================================
// Vibe 모드 매핑 (7문항 × 6옵션 = 42개)
// ========================================

const vibeMappings: AnswerMapping[] = [
  // Q1: vibe_weekend_alone - 주말 혼자 하고 싶은 것
  {
    questionId: 'vibe_weekend_alone',
    answerValue: 'streaming',
    impacts: [
      { category: 'hobby_lifestyle', score: 7 },
      { category: 'sensory_sensitivity', score: 6 },
    ],
  },
  {
    questionId: 'vibe_weekend_alone',
    answerValue: 'music_chill',
    impacts: [
      { category: 'sensory_sensitivity', score: 8 },
      { category: 'hobby_lifestyle', score: 7 },
    ],
  },
  {
    questionId: 'vibe_weekend_alone',
    answerValue: 'study_plan',
    impacts: [
      { category: 'organization_habit', score: 8 },
      { category: 'home_purpose', score: 8 },
    ],
  },
  {
    questionId: 'vibe_weekend_alone',
    answerValue: 'cooking',
    impacts: [
      { category: 'life_routine', score: 8 },
      { category: 'hobby_lifestyle', score: 7 },
    ],
  },
  {
    questionId: 'vibe_weekend_alone',
    answerValue: 'party',
    impacts: [
      { category: 'family_composition', score: 7 },
      { category: 'space_sense', score: 7 },
    ],
  },
  {
    questionId: 'vibe_weekend_alone',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'hobby_lifestyle', score: 5 },
    ],
  },

  // Q2: vibe_cafe_seat - 카페 자리 선택
  {
    questionId: 'vibe_cafe_seat',
    answerValue: 'window',
    impacts: [
      { category: 'lighting_preference', score: 8 },
      { category: 'sensory_sensitivity', score: 7 },
    ],
  },
  {
    questionId: 'vibe_cafe_seat',
    answerValue: 'corner',
    impacts: [
      { category: 'space_sense', score: 7 },
      { category: 'sensory_sensitivity', score: 6 },
    ],
  },
  {
    questionId: 'vibe_cafe_seat',
    answerValue: 'center',
    impacts: [
      { category: 'space_sense', score: 8 },
      { category: 'activity_flow', score: 7 },
    ],
  },
  {
    questionId: 'vibe_cafe_seat',
    answerValue: 'bar',
    impacts: [
      { category: 'color_preference', score: 7 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'vibe_cafe_seat',
    answerValue: 'terrace',
    impacts: [
      { category: 'lighting_preference', score: 9 },
      { category: 'health_factors', score: 7 },
    ],
  },
  {
    questionId: 'vibe_cafe_seat',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'space_sense', score: 5 },
    ],
  },

  // Q3: vibe_sns_interior - SNS 저장하는 인테리어
  {
    questionId: 'vibe_sns_interior',
    answerValue: 'white_minimal',
    impacts: [
      { category: 'color_preference', score: 9 },
      { category: 'organization_habit', score: 9 },
    ],
  },
  {
    questionId: 'vibe_sns_interior',
    answerValue: 'nordic_natural',
    impacts: [
      { category: 'color_preference', score: 7 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'vibe_sns_interior',
    answerValue: 'bold_color',
    impacts: [
      { category: 'color_preference', score: 8 },
      { category: 'sensory_sensitivity', score: 7 },
    ],
  },
  {
    questionId: 'vibe_sns_interior',
    answerValue: 'hotel_luxury',
    impacts: [
      { category: 'budget_sense', score: 9 },
      { category: 'color_preference', score: 8 },
    ],
  },
  {
    questionId: 'vibe_sns_interior',
    answerValue: 'industrial',
    impacts: [
      { category: 'color_preference', score: 6 },
      { category: 'sensory_sensitivity', score: 7 },
    ],
  },
  {
    questionId: 'vibe_sns_interior',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'color_preference', score: 5 },
    ],
  },

  // Q4: vibe_travel_style - 여행 스타일
  {
    questionId: 'vibe_travel_style',
    answerValue: 'city',
    impacts: [
      { category: 'activity_flow', score: 8 },
      { category: 'sensory_sensitivity', score: 7 },
    ],
  },
  {
    questionId: 'vibe_travel_style',
    answerValue: 'nature',
    impacts: [
      { category: 'health_factors', score: 8 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'vibe_travel_style',
    answerValue: 'town',
    impacts: [
      { category: 'sensory_sensitivity', score: 7 },
      { category: 'space_sense', score: 6 },
    ],
  },
  {
    questionId: 'vibe_travel_style',
    answerValue: 'resort',
    impacts: [
      { category: 'budget_sense', score: 8 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'vibe_travel_style',
    answerValue: 'culture',
    impacts: [
      { category: 'color_preference', score: 8 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'vibe_travel_style',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'hobby_lifestyle', score: 5 },
    ],
  },

  // Q5: vibe_home_relationship - 집과의 관계
  {
    questionId: 'vibe_home_relationship',
    answerValue: 'best_friend',
    impacts: [
      { category: 'sensory_sensitivity', score: 8 },
      { category: 'home_purpose', score: 7 },
    ],
  },
  {
    questionId: 'vibe_home_relationship',
    answerValue: 'supporter',
    impacts: [
      { category: 'home_purpose', score: 8 },
      { category: 'activity_flow', score: 7 },
    ],
  },
  {
    questionId: 'vibe_home_relationship',
    answerValue: 'trainer',
    impacts: [
      { category: 'home_purpose', score: 9 },
      { category: 'organization_habit', score: 7 },
    ],
  },
  {
    questionId: 'vibe_home_relationship',
    answerValue: 'lover',
    impacts: [
      { category: 'sensory_sensitivity', score: 9 },
      { category: 'color_preference', score: 8 },
    ],
  },
  {
    questionId: 'vibe_home_relationship',
    answerValue: 'coach',
    impacts: [
      { category: 'home_purpose', score: 9 },
      { category: 'discomfort_factors', score: 7 },
    ],
  },
  {
    questionId: 'vibe_home_relationship',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'home_purpose', score: 5 },
    ],
  },

  // Q6: vibe_movie_genre - 영화 장르
  {
    questionId: 'vibe_movie_genre',
    answerValue: 'healing_drama',
    impacts: [
      { category: 'sensory_sensitivity', score: 8 },
      { category: 'health_factors', score: 7 },
    ],
  },
  {
    questionId: 'vibe_movie_genre',
    answerValue: 'romcom',
    impacts: [
      { category: 'color_preference', score: 7 },
      { category: 'sensory_sensitivity', score: 6 },
    ],
  },
  {
    questionId: 'vibe_movie_genre',
    answerValue: 'growth',
    impacts: [
      { category: 'home_purpose', score: 8 },
      { category: 'organization_habit', score: 7 },
    ],
  },
  {
    questionId: 'vibe_movie_genre',
    answerValue: 'noir',
    impacts: [
      { category: 'color_preference', score: 6 },
      { category: 'lighting_preference', score: 7 },
    ],
  },
  {
    questionId: 'vibe_movie_genre',
    answerValue: 'documentary',
    impacts: [
      { category: 'budget_sense', score: 7 },
      { category: 'discomfort_factors', score: 6 },
    ],
  },
  {
    questionId: 'vibe_movie_genre',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'sensory_sensitivity', score: 5 },
    ],
  },

  // Q7: vibe_interior_priority - 인테리어 기대 변화
  {
    questionId: 'vibe_interior_priority',
    answerValue: 'mood_change',
    impacts: [
      { category: 'color_preference', score: 9 },
      { category: 'sensory_sensitivity', score: 8 },
    ],
  },
  {
    questionId: 'vibe_interior_priority',
    answerValue: 'functionality',
    impacts: [
      { category: 'organization_habit', score: 9 },
      { category: 'activity_flow', score: 8 },
    ],
  },
  {
    questionId: 'vibe_interior_priority',
    answerValue: 'relaxation',
    impacts: [
      { category: 'sensory_sensitivity', score: 9 },
      { category: 'health_factors', score: 7 },
    ],
  },
  {
    questionId: 'vibe_interior_priority',
    answerValue: 'work_space',
    impacts: [
      { category: 'home_purpose', score: 9 },
      { category: 'organization_habit', score: 8 },
    ],
  },
  {
    questionId: 'vibe_interior_priority',
    answerValue: 'family_life',
    impacts: [
      { category: 'family_composition', score: 9 },
      { category: 'activity_flow', score: 7 },
    ],
  },
  {
    questionId: 'vibe_interior_priority',
    answerValue: 'ai_choice',
    impacts: [
      { category: 'home_purpose', score: 5 },
    ],
  },
];

// ========================================
// 전체 매핑 테이블 합치기
// ========================================

export const ALL_ANSWER_MAPPINGS: AnswerMapping[] = [
  ...quickMappings,
  ...standardMappings,
  ...deepMappings,
  ...vibeMappings,
];

// ========================================
// 헬퍼 함수: 답변으로부터 점수 가져오기
// ========================================

/**
 * 특정 질문의 답변에 해당하는 점수 매핑을 찾습니다.
 * @param questionId 질문 ID
 * @param answerValue 답변 값
 * @returns 해당 답변의 영향 배열 또는 null
 */
export function getAnswerImpacts(
  questionId: string,
  answerValue: string
): AnswerImpact[] | null {
  const mapping = ALL_ANSWER_MAPPINGS.find(
    (m) => m.questionId === questionId && m.answerValue === answerValue
  );
  return mapping ? mapping.impacts : null;
}

/**
 * 모든 답변을 받아서 카테고리별 점수를 계산합니다.
 * 기존 hashToScore 함수를 대체합니다.
 * 
 * @param answers 질문ID → 답변값 맵
 * @returns 카테고리별 점수 (1~10)
 */
export function calculateScoresFromAnswers(
  answers: Record<string, unknown>
): Record<PreferenceCategory, number> {
  // 기본 점수 초기화 (모든 카테고리 5점)
  const scores: Record<PreferenceCategory, number> = {
    space_sense: 5,
    sensory_sensitivity: 5,
    cleaning_preference: 5,
    organization_habit: 5,
    family_composition: 5,
    health_factors: 5,
    budget_sense: 5,
    color_preference: 5,
    lighting_preference: 5,
    home_purpose: 5,
    discomfort_factors: 5,
    activity_flow: 5,
    life_routine: 5,
    sleep_pattern: 5,
    hobby_lifestyle: 5,
  };

  // 각 카테고리별 영향 횟수 (가중 평균 계산용)
  const impactCounts: Record<PreferenceCategory, number> = {
    space_sense: 0,
    sensory_sensitivity: 0,
    cleaning_preference: 0,
    organization_habit: 0,
    family_composition: 0,
    health_factors: 0,
    budget_sense: 0,
    color_preference: 0,
    lighting_preference: 0,
    home_purpose: 0,
    discomfort_factors: 0,
    activity_flow: 0,
    life_routine: 0,
    sleep_pattern: 0,
    hobby_lifestyle: 0,
  };

  // 각 카테고리별 누적 점수
  const totalScores: Record<PreferenceCategory, number> = { ...scores };
  Object.keys(totalScores).forEach((key) => {
    totalScores[key as PreferenceCategory] = 0;
  });

  // 모든 답변 순회하며 점수 계산
  Object.entries(answers).forEach(([questionId, value]) => {
    const answerValue = String(value ?? '');
    const impacts = getAnswerImpacts(questionId, answerValue);

    if (impacts) {
      impacts.forEach(({ category, score }) => {
        totalScores[category] += score;
        impactCounts[category] += 1;
      });
    }
  });

  // 평균 점수 계산 (영향 받은 카테고리만)
  Object.keys(scores).forEach((key) => {
    const category = key as PreferenceCategory;
    if (impactCounts[category] > 0) {
      scores[category] = Math.round(totalScores[category] / impactCounts[category]);
    }
    // 범위 제한 (1~10)
    scores[category] = Math.max(1, Math.min(10, scores[category]));
  });

  return scores;
}

// 통계: 총 매핑 수
export const TOTAL_MAPPINGS = ALL_ANSWER_MAPPINGS.length;
// Quick: 24개, Standard: 36개, Deep: 48개, Vibe: 42개 = 총 150개



