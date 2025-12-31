/**
 * 인테리봇 - 부분 리모델링 ROI 데이터
 * 
 * 출처: 미국·국내 리모델링 ROI 연구, 부동산 실거래 사례 분석
 * 기준: 20~25평대 구축 아파트, 부분 리모델링
 * 
 * ROI = 공사비 대비 집값 상승분 비율
 */

export interface ProcessROI {
  roi_min: number; // 최소 회수율
  roi_max: number; // 최대 회수율
  role: 'defense' | 'offense' | 'mixed'; // 감점 제거 vs 가점 추가
  visibility: 'high' | 'medium' | 'low'; // 매수자 체감도
  time_decay: number; // 연간 감가율 (%)
  preventLoss?: number; // 감점 제거 금액 (만원)
  gainPotential?: number; // 가점 추가 금액 (만원)
}

export const PARTIAL_REMODEL_ROI: Record<string, ProcessROI> = {
  // ========== 높은 ROI 공정 (70% 이상) ==========
  
  kitchen: {
    roi_min: 0.7,
    roi_max: 0.8,
    role: 'offense',
    visibility: 'high',
    time_decay: 5,
    preventLoss: 100,
    gainPotential: 800,
  },

  bathroom: {
    roi_min: 0.6,
    roi_max: 0.7,
    role: 'offense',
    visibility: 'high',
    time_decay: 5,
    preventLoss: 100,
    gainPotential: 600,
  },

  entrance_door: {
    roi_min: 0.7,
    roi_max: 1.0, // 현관문은 100% 회수 가능 (미국 데이터)
    role: 'offense',
    visibility: 'high',
    time_decay: 2,
    preventLoss: 50,
    gainPotential: 300,
  },

  windows: {
    roi_min: 0.65,
    roi_max: 0.85,
    role: 'mixed',
    visibility: 'medium',
    time_decay: 3,
    preventLoss: 200,
    gainPotential: 500,
  },

  // ========== 중간 ROI 공정 (50-70%) ==========

  flooring: {
    roi_min: 0.5,
    roi_max: 0.7,
    role: 'mixed',
    visibility: 'high',
    time_decay: 8,
    preventLoss: 200,
    gainPotential: 300,
  },

  storage_furniture: {
    roi_min: 0.6,
    roi_max: 0.8,
    role: 'offense',
    visibility: 'medium',
    time_decay: 3,
    preventLoss: 100,
    gainPotential: 400,
  },

  doors_entrance: {
    roi_min: 0.7,
    roi_max: 1.0,
    role: 'offense',
    visibility: 'high',
    time_decay: 2,
    preventLoss: 50,
    gainPotential: 300,
  },

  // ========== 낮은 ROI 공정 (30-60%) ==========

  wallpaper_painting: {
    roi_min: 0.3,
    roi_max: 0.6,
    role: 'defense',
    visibility: 'high',
    time_decay: 10,
    preventLoss: 300,
    gainPotential: 100,
  },

  lighting: {
    roi_min: 0.4,
    roi_max: 0.6,
    role: 'defense',
    visibility: 'high',
    time_decay: 3,
    preventLoss: 200,
    gainPotential: 150,
  },

  insulation_ventilation: {
    roi_min: 0.70,
    roi_max: 1.15,
    role: 'offense',
    visibility: 'low',
    time_decay: 7,
    preventLoss: 100,
    gainPotential: 600,
  },

  // ========== 구조 공사 (보이지 않는 가치) ==========

  plumbing: {
    roi_min: 0.4, // 내역서 없으면
    roi_max: 0.85, // 내역서 있으면
    role: 'offense',
    visibility: 'low',
    time_decay: 0, // 배관은 20-30년 감
    preventLoss: 500,
    gainPotential: 700,
  },

  electrical_system: {
    roi_min: 0.35,
    roi_max: 0.75,
    role: 'offense',
    visibility: 'low',
    time_decay: 1,
    preventLoss: 300,
    gainPotential: 400,
  },

  smart_home: {
    roi_min: 0.2,
    roi_max: 0.4,
    role: 'mixed',
    visibility: 'medium',
    time_decay: 15, // 기술 노후화 빠름
    preventLoss: 0,
    gainPotential: 150,
  },
};

/**
 * 공정 조합 시너지 보너스
 * 
 * 핵심 인사이트:
 * - 도배 + 바닥 ≠ 단순 합산
 * - 주방 + 욕실 + 바닥 = 시너지 효과 +25%
 */
export const COMBO_BONUSES: Record<string, number> = {
  // ========== 2개 조합 ==========
  'kitchen+bathroom': 1.15,
  'bathroom+flooring': 1.10,
  'kitchen+flooring': 1.12,
  'entrance_door+flooring': 1.08,
  'windows+insulation_ventilation': 1.18,
  'windows+insulation_ventilation+plumbing': 1.35, // 에너지 효율 풀 패키지
  'doors_entrance+lighting': 1.08,
  'kitchen+lighting': 1.10,
  'bathroom+plumbing': 1.20, // 욕실 + 배관 = 필수 조합

  // ========== 3개 조합 (핵심 패키지) ==========
  'kitchen+bathroom+flooring': 1.25,
  'kitchen+bathroom+windows': 1.28,
  'bathroom+flooring+wallpaper_painting': 1.18,
  'kitchen+flooring+lighting': 1.20,
  'windows+insulation_ventilation+doors_entrance': 1.22,

  // ========== 4개 이상 (풀 패키지) ==========
  full_cosmetic: 1.30, // 주방+욕실+바닥+도배
  full_structural: 1.35, // 위 + 배관+전기
  full_premium: 1.40, // 위 + 창호+단열
};

/**
 * 공정 조합 키 생성
 * 
 * 예: ['kitchen', 'bathroom'] → 'kitchen+bathroom'
 */
export function generateComboKey(processes: string[]): string {
  return processes.sort().join('+');
}

/**
 * 조합 보너스 계산
 * 
 * 1. 정확히 일치하는 조합 찾기
 * 2. 없으면 개수별 기본 보너스
 */
export function getComboBonus(processes: string[]): number {
  // 정확 일치 체크
  const comboKey = generateComboKey(processes);
  if (COMBO_BONUSES[comboKey]) {
    return COMBO_BONUSES[comboKey];
  }

  // 풀 패키지 체크
  const hasKitchen = processes.includes('kitchen');
  const hasBathroom = processes.includes('bathroom');
  const hasFlooring = processes.includes('flooring');
  const hasWallpaper = processes.includes('wallpaper_painting');
  const hasPlumbing = processes.includes('plumbing');
  const hasElectrical = processes.includes('electrical_system');
  const hasWindows = processes.includes('windows');
  const hasInsulation = processes.includes('insulation_ventilation');

  // 풀 프리미엄 (7개 이상 + 구조 포함)
  if (
    processes.length >= 7 &&
    hasKitchen &&
    hasBathroom &&
    hasFlooring &&
    hasPlumbing &&
    hasWindows
  ) {
    return COMBO_BONUSES.full_premium; // 1.40
  }

  // 풀 구조 (5개 이상 + 구조 일부)
  if (
    processes.length >= 5 &&
    hasKitchen &&
    hasBathroom &&
    (hasPlumbing || hasElectrical)
  ) {
    return COMBO_BONUSES.full_structural; // 1.35
  }

  // 풀 코스메틱 (4개 이상 + 주방·욕실 포함)
  if (processes.length >= 4 && hasKitchen && hasBathroom && hasFlooring) {
    return COMBO_BONUSES.full_cosmetic; // 1.30
  }

  // 3개 조합 기본 보너스
  if (processes.length >= 3) {
    // 주방·욕실 둘 다 있으면
    if (hasKitchen && hasBathroom) {
      return 1.22;
    }
    // 주방 또는 욕실 + 2개
    if (hasKitchen || hasBathroom) {
      return 1.18;
    }
    // 겉 공사만 3개
    return 1.12;
  }

  // 2개 조합 기본 보너스
  if (processes.length === 2) {
    // 주방·욕실 조합
    if (hasKitchen && hasBathroom) {
      return 1.15;
    }
    // 기타
    return 1.08;
  }

  // 단독 공정 (보너스 없음)
  return 1.0;
}
