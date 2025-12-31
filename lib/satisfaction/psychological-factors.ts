/**
 * 인테리봇 - 심리·커뮤니티 요인
 * 
 * 논문 기반: 리모델링 후 주거만족도에서 심리적 안정감이 20-30% 기여
 * 특히 영유아·노인·1인 가구는 안전감·프라이버시가 공간 개선보다 중요
 */

export interface PsychologicalFactor {
  name: string;
  description: string;
  related_processes: string[];
  weight: number;
  subdimensions: Record<string, number>;
}

export const PSYCHOLOGICAL_FACTORS: Record<string, PsychologicalFactor> = {
  safety_feeling: {
    name: '안전감',
    description: '야간·실내에서 느끼는 안전감 (침입 방지, 화재 안전)',
    related_processes: ['doors_entrance', 'windows', 'lighting', 'electrical_system'],
    weight: 1.3,
    subdimensions: {
      intrusion_prevention: 1.4, // 현관문 교체, 이중잠금
      fire_safety: 1.3, // 전기 리모델링
      night_lighting: 1.2, // LED 센서등
    },
  },

  privacy: {
    name: '프라이버시',
    description: '소음·시선 차단으로 인한 사생활 보호',
    related_processes: ['windows', 'doors_entrance', 'insulation_ventilation'],
    weight: 1.2,
    subdimensions: {
      sound_insulation: 1.5, // 이중창, 중문
      visual_privacy: 1.2, // 블라인드 일체형 창호
      structural_separation: 1.1, // 방음재 시공
    },
  },

  community_peace: {
    name: '층간/이웃 갈등 감소',
    description: '층간소음·이웃 불만 감소로 인한 심리적 편안함',
    related_processes: ['flooring', 'windows', 'insulation_ventilation'],
    weight: 1.1,
    subdimensions: {
      floor_noise_reduction: 1.4, // 바닥재 교체 (차음재)
      wall_sound_blocking: 1.2, // 단열·방음
      shared_wall_improvement: 1.1, // 욕실·주방 벽 방음
    },
  },
};

/**
 * 심리 요인 보너스 계산
 * 
 * 가족 타입별 차등 적용:
 * - 1인 가구 + 현관문 + 창호 → 안전감 대폭 상승
 * - 영유아 가정 + 전기 + 조명 → 화재 안전 체감
 * - 아파트 + 바닥재 → 층간소음 갈등 감소
 */
export function calculatePsychologicalBonus(
  selectedProcesses: string[],
  familyType: string
): number {
  let bonus = 0;

  // 1. 안전감 보너스
  if (familyType === 'single') {
    // 1인 가구는 안전감이 가장 중요
    if (
      selectedProcesses.includes('doors_entrance') &&
      selectedProcesses.includes('windows')
    ) {
      bonus += 5; // +5점
    }
    if (selectedProcesses.includes('lighting')) {
      bonus += 2; // +2점 추가
    }
  }

  // 2. 화재 안전 (영유아 가정)
  if (familyType === 'newborn_infant') {
    if (
      selectedProcesses.includes('electrical_system') &&
      selectedProcesses.includes('lighting')
    ) {
      bonus += 4; // +4점
    }
  }

  // 3. 노인 가정 - 안전감 + 접근성
  if (familyType === 'elderly') {
    if (
      selectedProcesses.includes('doors_entrance') ||
      selectedProcesses.includes('bathroom')
    ) {
      bonus += 4; // +4점
    }
    if (selectedProcesses.includes('lighting')) {
      bonus += 2; // +2점
    }
  }

  // 4. 프라이버시 (모든 가족)
  if (
    selectedProcesses.includes('windows') &&
    selectedProcesses.includes('insulation_ventilation')
  ) {
    bonus += 3; // +3점
  }

  // 5. 층간소음 감소 (아파트 거주 가정)
  if (selectedProcesses.includes('flooring')) {
    bonus += 3; // +3점
  }

  // 6. 다세대 가정 - 방음 중요
  if (familyType === 'multi_generation') {
    if (selectedProcesses.includes('flooring') && selectedProcesses.includes('windows')) {
      bonus += 5; // +5점
    }
  }

  return Math.min(bonus, 10); // 최대 +10점
}

/**
 * 안전 패키지 체크
 * 
 * 현관문 + 창호 + 조명 = 종합 안전 패키지
 */
export function hasSafetyPackage(selectedProcesses: string[]): boolean {
  return (
    selectedProcesses.includes('doors_entrance') &&
    selectedProcesses.includes('windows') &&
    selectedProcesses.includes('lighting')
  );
}

/**
 * 방음 패키지 체크
 * 
 * 바닥재 + 창호 + 단열 = 종합 방음 패키지
 */
export function hasSoundproofingPackage(selectedProcesses: string[]): boolean {
  return (
    selectedProcesses.includes('flooring') &&
    selectedProcesses.includes('windows') &&
    selectedProcesses.includes('insulation_ventilation')
  );
}
