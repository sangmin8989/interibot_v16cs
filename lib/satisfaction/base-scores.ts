/**
 * 인테리봇 - 공정별 기본 만족도 점수 데이터
 * 
 * 출처: KREAA, KDI, AJOU 연구 + 실사용자 리뷰 종합
 * 척도: 0-100점 (Likert 5-7 scale에서 환산)
 */

export interface ProcessSatisfactionScore {
  baseScore: number;
  subdimensions: Record<string, number>;
  description: string;
}

export const PROCESS_SATISFACTION_SCORES: Record<string, ProcessSatisfactionScore> = {
  kitchen: {
    baseScore: 82,
    subdimensions: {
      cooking_convenience: 85,
      cleaning_ease: 75,
      storage_improvement: 80,
      workflow_efficiency: 83,
      aesthetic_satisfaction: 82,
    },
    description: '주방의 동선, 수납, 청소 용이성, 조명, 마감재 품질이 종합 만족도 결정',
  },

  bathroom: {
    baseScore: 87,
    subdimensions: {
      cleanliness_perception: 90,
      safety: 85,
      comfort: 80,
      ventilation: 88,
      moisture_control: 85,
    },
    description: '청결감, 습기 제거, 통풍, 안전성(노인/영유아)이 가장 중요함',
  },

  flooring: {
    baseScore: 78,
    subdimensions: {
      visual_satisfaction: 82,
      cleaning_ease: 75,
      durability_perception: 76,
      comfort: 78,
      noise_reduction: 75,
    },
    description: '장판→강마루 변경 시 시각적 개선 효과가 즉시 체감됨',
  },

  windows: {
    baseScore: 81,
    subdimensions: {
      noise_reduction: 85,
      thermal_comfort: 82,
      condensation_prevention: 88,
      light_quality: 75,
      security_perception: 80,
    },
    description: '샷시 교체는 에너지 절감(관리비 15-22% 감소)과 결로 방지 체감도 높음',
  },

  lighting: {
    baseScore: 76,
    subdimensions: {
      brightness: 78,
      task_lighting: 76,
      mood_atmosphere: 74,
      energy_efficiency: 75,
      eye_comfort: 75,
    },
    description: 'LED 다운라이트 교체로 거실은 600-800룩스, 조리대 700룩스 이상 확보',
  },

  doors_entrance: {
    baseScore: 80,
    subdimensions: {
      visual_impression: 85,
      security: 82,
      sound_insulation: 78,
      thermal_efficiency: 78,
      ease_of_use: 80,
    },
    description: '첫인상 강화, 방음, 냉난방 효율, 보안 개선 동시 달성',
  },

  storage_furniture: {
    baseScore: 85,
    subdimensions: {
      organization_efficiency: 88,
      stress_reduction: 85,
      accessibility: 83,
      visual_order: 82,
      time_saving: 84,
    },
    description: '수납 개선이 일상 만족도에 가장 큰 영향 (정리 시간 30-40% 단축)',
  },

  wallpaper_painting: {
    baseScore: 72,
    subdimensions: {
      visual_freshness: 78,
      mood_improvement: 72,
      durability: 70,
      cleaning_ease: 68,
      color_psychology: 72,
    },
    description: '심리적 개선 효과 있지만, 체감도는 상대적으로 낮음',
  },

  insulation_ventilation: {
    baseScore: 83,
    subdimensions: {
      draft_prevention: 85,
      mold_prevention: 88,
      air_quality: 84,
      comfort: 82,
      health_improvement: 79,
    },
    description: '구조적 개선으로 장기적 만족도 매우 높음 (건강 증진 체감)',
  },

  electrical_system: {
    baseScore: 75,
    subdimensions: {
      safety: 80,
      convenience: 72,
      high_capacity_appliances: 75,
      smart_features: 70,
      future_proofing: 75,
    },
    description: '안전성 개선 (화재 위험 제거), 고용량 가전 사용 가능',
  },

  plumbing: {
    baseScore: 80,
    subdimensions: {
      water_pressure_stability: 82,
      temperature_control: 80,
      leak_prevention: 85,
      noise_reduction: 75,
      accessibility: 78,
    },
    description: '배관 교체는 누수 불안감 완전 해소, 장기 만족도 높음',
  },

  smart_home: {
    baseScore: 68,
    subdimensions: {
      convenience: 70,
      novelty: 75,
      actual_usage: 60,
      reliability: 65,
      learning_curve: 65,
    },
    description: '초기 만족도 높지만 실제 사용률은 낮은 경향',
  },
};

// 가족 구성별 가중치
export interface FamilyWeights {
  [key: string]: number;
}

export const FAMILY_COMPOSITION_WEIGHTS: Record<string, FamilyWeights> = {
  newborn_infant: {
    safety_weight: 1.5,
    cleanliness_weight: 1.4,
    ventilation_weight: 1.3,
    storage_weight: 1.2,
    comfort_weight: 1.1,
    aesthetic_weight: 0.8,
  },

  dual_income: {
    cleaning_ease_weight: 1.4,
    workflow_efficiency_weight: 1.3,
    time_saving_weight: 1.3,
    storage_weight: 1.2,
    convenience_weight: 1.2,
    aesthetic_weight: 1.0,
  },

  elderly: {
    safety_weight: 1.5,
    accessibility_weight: 1.4,
    thermal_comfort_weight: 1.3,
    ease_of_use_weight: 1.2,
    health_weight: 1.2,
    aesthetic_weight: 0.7,
  },

  pet_owner: {
    cleaning_ease_weight: 1.4,
    durability_weight: 1.3,
    odor_control_weight: 1.3,
    flooring_weight: 1.2,
    ventilation_weight: 1.1,
    aesthetic_weight: 0.9,
  },

  single: {
    aesthetic_weight: 1.2,
    cost_efficiency_weight: 1.2,
    cleaning_ease_weight: 1.1,
    comfort_weight: 1.1,
    storage_weight: 1.0,
    safety_weight: 0.9,
  },

  multi_generation: {
    safety_weight: 1.3,
    accessibility_weight: 1.2,
    noise_reduction_weight: 1.2,
    shared_space_weight: 1.1,
    individual_privacy_weight: 1.1,
    aesthetic_weight: 0.9,
  },
};

// 라이프스타일별 조정 계수
export const LIFESTYLE_MODIFIERS: Record<string, Record<string, number>> = {
  frequent_cooking: {
    kitchen_satisfaction: 2.0,
    workflow_efficiency: 1.8,
    lighting: 1.5,
    ventilation: 1.5,
  },

  remote_work: {
    lighting: 1.5,
    noise_reduction: 1.6,
    thermal_comfort: 1.4,
    air_quality: 1.4,
    workspace_comfort: 1.5,
  },

  frequent_guests: {
    entrance_satisfaction: 1.3,
    living_room: 1.3,
    bathroom: 1.2,
    kitchen: 1.2,
    overall_aesthetic: 1.2,
  },

  health_conscious: {
    ventilation: 1.8,
    air_quality: 1.7,
    mold_prevention: 1.6,
    insulation: 1.4,
  },

  sensitive_to_noise: {
    window_sound_insulation: 1.7,
    door_sound_insulation: 1.5,
    flooring_noise: 1.4,
    overall_quiet: 1.5,
  },

  quality_focused: {
    material_quality: 1.6,
    aesthetic_satisfaction: 1.5,
    durability_perception: 1.4,
  },

  budget_conscious: {
    cost_efficiency: 1.5,
    time_saving: 1.3,
    maintenance_cost: 1.2,
  },
};

// 건물 연식별 개선 효과 계수
export const BUILDING_AGE_FACTORS = {
  '0_10': {
    style_improvement: 0.7,
    functional_improvement: 0.6,
    structural_improvement: 0.4,
    baseline: 65,
    description: '스타일 개선만으로도 만족도 상승, 구조적 이슈 상대적으로 적음',
  },

  '10_20': {
    style_improvement: 1.0,
    functional_improvement: 1.0,
    structural_improvement: 0.7,
    baseline: 55,
    description: '기능 개선 효과 가장 큼, 부분 리모델링 효율 최고',
  },

  '20_30': {
    style_improvement: 1.2,
    functional_improvement: 1.3,
    structural_improvement: 1.1,
    baseline: 45,
    description: '배관·전기·단열 개선 필수, 안전성 개선 체감도 매우 높음',
  },

  '30_plus': {
    style_improvement: 1.4,
    functional_improvement: 1.5,
    structural_improvement: 1.3,
    baseline: 35,
    description: '구조적 개선 효과 최고, 안정성·건강성 회복에 의한 만족도 극대',
  },
};
