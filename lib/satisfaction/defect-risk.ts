/**
 * 인테리봇 - 하자·리스크 보정 시스템
 * 
 * 핵심 인사이트:
 * - 리모델링 후 1년 이내 하자 발생 시 만족도 20~30점 폭락
 * - 욕실 누수, 결로, 곰팡이, 문틀 뒤틀림 = "공사 전보다 더 스트레스"
 * - 공사 퀄리티·업체 검증도가 만족도에 큰 영향
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export interface DefectRiskProfile {
  level: RiskLevel;
  penalty: number; // 최종 점수에서 감점
  description: string;
  warning: string;
  detailedReasons: string[];
}

export const DEFECT_RISK_PROFILES: Record<RiskLevel, DefectRiskProfile> = {
  low: {
    level: 'low',
    penalty: 0,
    description: '검증된 업체 + 구조 공사 포함 + AS 체계 명확',
    warning: '',
    detailedReasons: [],
  },

  medium: {
    level: 'medium',
    penalty: 5,
    description: '겉 공사 위주 + 구조 문제 일부 방치',
    warning: '⚠️ 배관·방수를 건드리지 않으면 1-2년 내 하자 위험이 있습니다.',
    detailedReasons: [
      '구조적 문제(배관·방수·단열)를 해결하지 않았습니다',
      '2-3년 내 결로·곰팡이·누수가 재발할 수 있습니다',
      '겉만 새것처럼 보여도 내구성은 제한적입니다',
    ],
  },

  high: {
    level: 'high',
    penalty: 12,
    description: '반셀프·자재직구 + 저가 시공 + AS 불투명',
    warning: '🚨 하자 발생 시 만족도가 급락할 수 있습니다. 구조 공사를 추가 검토하세요.',
    detailedReasons: [
      '20년 이상 구축인데 배관·방수를 교체하지 않았습니다',
      '욕실·주방 공사 시 누수 위험이 매우 높습니다',
      '하자 발생 시 AS가 어려울 수 있습니다',
      '2년 이내 추가 공사가 필요할 가능성이 높습니다',
    ],
  },
};

/**
 * 하자 리스크 레벨 계산
 * 
 * 판단 기준:
 * 1. 구조 공사 포함 여부 (배관·전기·방수)
 * 2. 건물 연식 vs 공정 선택
 * 3. 공사 범위 (겉만 vs 전체)
 */
export function calculateDefectRisk(params: {
  selectedProcesses: string[];
  buildingAge: number;
  includesStructuralWork: boolean;
}): RiskLevel {
  const { selectedProcesses, buildingAge, includesStructuralWork } = params;

  // Case 1: 구조 공사 포함 + 검증된 업체 (인테리봇 기본 가정)
  if (includesStructuralWork) {
    return 'low';
  }

  // Case 2: 20년 이상 구축인데 배관·방수 안 건드림
  if (
    buildingAge >= 20 &&
    !selectedProcesses.includes('plumbing') &&
    !selectedProcesses.includes('bathroom')
  ) {
    return 'high'; // 누수·곰팡이 고위험
  }

  // Case 3: 겉 공사만 (도배·장판·조명만)
  const surfaceOnlyProcesses = ['wallpaper_painting', 'flooring', 'lighting'];
  const isSurfaceOnly = selectedProcesses.every((p) =>
    surfaceOnlyProcesses.includes(p)
  );

  if (isSurfaceOnly && selectedProcesses.length < 3) {
    return 'medium'; // 구조 문제 방치
  }

  // Case 4: 주방·욕실 있으면서 배관 없음
  if (
    (selectedProcesses.includes('kitchen') || selectedProcesses.includes('bathroom')) &&
    !selectedProcesses.includes('plumbing')
  ) {
    // 10년 이하면 괜찮음
    if (buildingAge < 10) {
      return 'low';
    }
    // 10-20년이면 중간 위험
    if (buildingAge < 20) {
      return 'medium';
    }
    // 20년 이상이면 고위험
    return 'high';
  }

  // Case 5: 단열·창호 없는데 결로 취약 공간 공사
  if (
    selectedProcesses.includes('bathroom') &&
    !selectedProcesses.includes('windows') &&
    !selectedProcesses.includes('insulation_ventilation') &&
    buildingAge >= 15
  ) {
    return 'medium'; // 결로 재발 가능성
  }

  return 'low';
}

/**
 * 최종 점수에 하자 리스크 패널티 적용
 */
export function applyDefectRiskPenalty(
  score: number,
  riskLevel: RiskLevel
): {
  finalScore: number;
  warning: string;
  reasons: string[];
} {
  const profile = DEFECT_RISK_PROFILES[riskLevel];
  const finalScore = Math.max(0, score - profile.penalty);

  return {
    finalScore,
    warning: profile.warning,
    reasons: profile.detailedReasons,
  };
}

/**
 * 구조 공사 포함 여부 자동 판단
 * 
 * 배관, 전기, 방수, 단열 중 하나라도 있으면 구조 공사로 판단
 */
export function hasStructuralWork(selectedProcesses: string[]): boolean {
  const structuralProcesses = [
    'plumbing',
    'electrical_system',
    'insulation_ventilation',
    'windows', // 창호도 구조적 개선으로 판단
  ];

  return selectedProcesses.some((p) => structuralProcesses.includes(p));
}

/**
 * 하자 위험 공정 조합 체크
 * 
 * 위험한 조합:
 * - 욕실 리모델링 + 배관 미교체 + 20년 이상
 * - 주방 리모델링 + 전기 미교체 + 15년 이상
 */
export function getRiskyProcessCombinations(
  selectedProcesses: string[],
  buildingAge: number
): string[] {
  const risks: string[] = [];

  // 욕실 + 배관 없음
  if (
    selectedProcesses.includes('bathroom') &&
    !selectedProcesses.includes('plumbing') &&
    buildingAge >= 20
  ) {
    risks.push('욕실 리모델링 시 배관 교체를 강력히 추천합니다 (누수 위험)');
  }

  // 주방 + 전기 없음
  if (
    selectedProcesses.includes('kitchen') &&
    !selectedProcesses.includes('electrical_system') &&
    buildingAge >= 15
  ) {
    risks.push('주방 리모델링 시 전기 용량 증설을 검토하세요 (화재 위험)');
  }

  // 단열 없이 창호만 교체
  if (
    selectedProcesses.includes('windows') &&
    !selectedProcesses.includes('insulation_ventilation') &&
    buildingAge >= 20
  ) {
    risks.push('창호 교체 시 단열재 시공을 함께 하면 결로 방지 효과가 극대화됩니다');
  }

  // 도배만 단독
  if (
    selectedProcesses.length === 1 &&
    selectedProcesses.includes('wallpaper_painting')
  ) {
    risks.push('도배만으로는 체감 만족도가 제한적입니다. 바닥재나 조명을 추가하세요');
  }

  return risks;
}
