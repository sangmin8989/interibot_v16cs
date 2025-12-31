// 집값 방어지수 & 생활개선 점수 계산 모듈

import { FusionAnalysisResult, ChatAnalysisResult } from './types';
import { normalizeTraits } from './code-mapping';
import type { SixIndexInput, FullValueScores } from './types';

export interface ValueCalculationInput {
  housingType: string;
  pyeong: number;
  selectedProcesses: string[];
  selectedGrade: string;
  recommendedStyles: string[];
  dnaMatchScore: number;
  familyType: string;
  selectedOptions: string[];
}

// 주거형태 점수
const housingTypeScore: Record<string, number> = {
  '아파트': 15,
  '오피스텔': 12,
  '빌라': 8,
  '단독주택': 5,
};

// 평수 점수
const getSizeScore = (pyeong: number): number => {
  if (pyeong >= 24 && pyeong <= 34) return 10;
  if (pyeong >= 20 && pyeong < 24) return 8;
  if (pyeong >= 35 && pyeong <= 45) return 8;
  if (pyeong >= 15 && pyeong < 20) return 6;
  if (pyeong >= 46 && pyeong <= 55) return 6;
  return 4;
};

// 공정별 집값 영향 점수
const processValueScore: Record<string, number> = {
  '주방': 5,
  '욕실': 4,
  '바닥재': 3,
  '샤시/창호': 3,
  '도배': 2,
  '조명': 2,
  '수납/붙박이장': 2,
  '중문': 1,
  '도장': 1,
  '필름': 1,
};

// 등급 점수
const gradeScore: Record<string, number> = {
  'BASIC': 3,
  'STANDARD': 6,
  'ARGEN': 8,
  'PREMIUM': 10,
};

// 트렌드 점수
const trendScore: Record<string, number> = {
  'modern': 9,
  'scandinavian': 8,
  'natural': 8,
  'minimal': 7,
  'classic': 6,
  'vintage': 4,
  'industrial': 4,
};

/**
 * 집값 방어지수 계산
 * @deprecated calculateSixIndex 사용 권장
 */
export const calculateHomeValueIndex = (input: ValueCalculationInput): number => {
  const base = 50;
  
  const housing = housingTypeScore[input.housingType] || 5;
  const size = getSizeScore(input.pyeong);
  
  // 공정 점수 (최대 15)
  let processScore = 0;
  input.selectedProcesses.forEach(process => {
    processScore += processValueScore[process] || 0;
  });
  processScore = Math.min(15, processScore);
  
  const grade = gradeScore[input.selectedGrade] || 5;
  
  // 트렌드 점수 (평균, 최대 10)
  let trend = 0;
  if (input.recommendedStyles.length > 0) {
    const total = input.recommendedStyles.reduce((sum, style) => {
      return sum + (trendScore[style] || 5);
    }, 0);
    trend = Math.round(total / input.recommendedStyles.length);
  }
  
  const total = base + housing + size + processScore + grade + trend;
  
  return Math.min(100, Math.max(30, total));
};

/**
 * 생활개선 점수 계산
 * @deprecated calculateSixIndex 사용 권장
 */
export const calculateLifeQualityScore = (input: ValueCalculationInput): number => {
  const base = 40;
  
  // 성향 매칭 점수 (0~20)
  const personality = Math.round(input.dnaMatchScore / 5);
  
  // 공간 활용 점수 (0~20)
  const spaceScoreMap: Record<string, number> = {
    '수납/붙박이장': 5,
    '드레스룸': 4,
    '주방': 4,
    '서재': 3,
    '현관': 2,
  };
  let spaceScore = 0;
  input.selectedProcesses.forEach(process => {
    spaceScore += spaceScoreMap[process] || 0;
  });
  spaceScore = Math.min(20, spaceScore);
  
  // 건강 요소 점수 (0~15)
  const healthScoreMap: Record<string, number> = {
    '샤시/창호': 5,
    '욕실': 3,
    '조명': 3,
  };
  let healthScore = 0;
  input.selectedProcesses.forEach(process => {
    healthScore += healthScoreMap[process] || 0;
  });
  healthScore = Math.min(15, healthScore);
  
  // 편의 기능 점수 (0~15)
  const convenienceMap: Record<string, number> = {
    '스마트홈': 4,
    '자동중문': 3,
    '빌트인': 3,
    '시스템에어컨': 3,
  };
  let convenience = 0;
  input.selectedOptions.forEach(option => {
    convenience += convenienceMap[option] || 0;
  });
  convenience = Math.min(15, convenience);
  
  const total = base + personality + spaceScore + healthScore + convenience;
  
  return Math.min(100, Math.max(30, total));
};

// 종합 메시지
export const getValueSummary = (homeValue: number, lifeQuality: number): string => {
  const avg = (homeValue + lifeQuality) / 2;
  
  if (avg >= 85) {
    return '💎 투자 가치와 생활 개선 모두 최상급이에요!';
  } else if (homeValue > lifeQuality + 15) {
    return '📈 자산 가치 중심의 실속 있는 인테리어예요';
  } else if (lifeQuality > homeValue + 15) {
    return '🌿 나만의 만족을 위한 프리미엄 공간이에요';
  } else if (avg >= 70) {
    return '⚖️ 가치와 만족의 균형 잡힌 선택이에요';
  } else {
    return '🎯 핵심 공간 위주로 효율적인 투자예요';
  }
};

// FusionAnalysisResult에서 점수 계산 (기본값 사용)
export const calculateValueScoresFromResult = (
  result: FusionAnalysisResult,
  defaultHousingType: string = '아파트',
  defaultPyeong: number = 30,
  defaultGrade: string = 'STANDARD'
): { homeValueIndex: number; lifeQualityScore: number } => {
  // 추천 스타일 추출
  const recommendedStyles = result.dnaType.recommendedStyles || [];
  
  // 공정 추출 (chatAnalysis에서 추출하거나 기본값)
  const selectedProcesses: string[] = [];
  if (result.chatAnalysis?.spaceInterests) {
    result.chatAnalysis.spaceInterests.forEach(space => {
      const processMap: Record<string, string> = {
        'kitchen': '주방',
        'bathroom': '욕실',
        'study': '서재',
        'living': '도배',
      };
      const process = processMap[space];
      if (process) selectedProcesses.push(process);
    });
  }
  if (selectedProcesses.length === 0) {
    selectedProcesses.push('도배', '조명'); // 기본값
  }
  
  // 가족 구성 추출
  let familyType = '2인';
  if (result.chatAnalysis?.familyInfo) {
    const members = result.chatAnalysis.familyInfo.totalMembers;
    if (members === 1) familyType = '혼자 살아요';
    else if (members === 2) familyType = '2인';
    else if (members >= 3 && members <= 4) familyType = '3~4인 가족';
    else familyType = '5인 이상/반려동물';
  }
  
  const input: ValueCalculationInput = {
    housingType: defaultHousingType,
    pyeong: defaultPyeong,
    selectedProcesses,
    selectedGrade: defaultGrade,
    recommendedStyles,
    dnaMatchScore: result.dnaMatchScore,
    familyType,
    selectedOptions: [], // 기본값
  };
  
  return {
    homeValueIndex: calculateHomeValueIndex(input),
    lifeQualityScore: calculateLifeQualityScore(input),
  };
};

// ============================================================================
// 6대 지수 통합 계산 (신규)
// ============================================================================

/**
 * 6대 지수 통합 계산
 * 기존 calculateHomeValueIndex, calculateLifeQualityScore는 이 함수로 대체 예정
 */
export function calculateSixIndex(rawInput: SixIndexInput): FullValueScores {
  const input = {
    ...rawInput,
    traits: normalizeTraits(rawInput.traits),
  };

  const homeValueIndex = calcHomeValue(input);
  const lifeQualityScore = calcLifeQuality(input);
  const spaceEfficiency = calcSpaceEfficiency(input);
  const maintenance = calcMaintenance(input);
  const energy = calcEnergy(input);
  const investment = calcInvestment(input);

  // 가중치 적용 종합점수
  const total = Math.round(
    homeValueIndex * 0.2 +
    lifeQualityScore * 0.25 +
    spaceEfficiency * 0.15 +
    maintenance * 0.15 +
    energy * 0.1 +
    investment * 0.15
  );

  return {
    homeValueIndex,
    lifeQualityScore,
    spaceEfficiency,
    maintenance,
    energy,
    investment,
    total,
  };
}

// 1. 집값방어지수
function calcHomeValue(input: SixIndexInput): number {
  let score = 40;

  // 주거형태 (+5~15)
  const housingPoints: Record<string, number> = {
    '아파트': 15, '오피스텔': 10, '빌라': 8, '단독주택': 5
  };
  score += housingPoints[input.housingType] || 5;

  // 평수 (+4~12)
  if (input.pyeong >= 24 && input.pyeong <= 34) score += 12;
  else if (input.pyeong >= 20 && input.pyeong <= 40) score += 8;
  else score += 4;

  // 공정 (+1~5 per 공정)
  const processPoints: Record<string, number> = {
    '주방': 5, '욕실': 4, '바닥재': 3, '샤시': 3, '도배': 2, '전기': 1
  };
  for (const process of input.selectedProcesses) {
    score += processPoints[process] || 0;
  }

  // 등급 (+4~10)
  const gradePoints: Record<string, number> = { OPUS: 10, STANDARD: 7, ESSENTIAL: 4 };
  score += gradePoints[input.grade] || 4;

  // 트렌드 (+3~5)
  if (input.traits.includes('MODERN_LOVER')) score += 5;
  else if (input.traits.includes('NATURAL_LOVER')) score += 3;

  return Math.min(100, score);
}

// 2. 생활안정지수
function calcLifeQuality(input: SixIndexInput): number {
  let score = 30;

  // 라이프스타일 매칭 (+4~10)
  if (input.traits.includes('COOKING_LOVER') && input.selectedProcesses.includes('주방')) {
    score += input.grade === 'OPUS' ? 10 : input.grade === 'STANDARD' ? 7 : 4;
  }
  if (input.traits.includes('CLEANING_SYSTEM_NEED') && input.selectedProcesses.includes('바닥재')) {
    score += 10;
  }
  if (input.traits.includes('SOUNDPROOF_NEED') && input.selectedProcesses.includes('중문')) {
    score += 10;
  }

  // 가족 맞춤 (+15)
  if (input.traits.includes('SAFETY_NEED') && input.selectedProcesses.includes('가구')) {
    score += 15;
  }

  // 건강/편의 (+7~10)
  if (input.selectedProcesses.includes('욕실')) score += 10;
  if (input.selectedProcesses.includes('전기')) score += 8;
  if (input.additionalOptions?.includes('aircon_system')) score += 7;

  return Math.min(100, score);
}

// 3. 공간효율지수
function calcSpaceEfficiency(input: SixIndexInput): number {
  let score = 40;

  // 수납 (+10~15)
  if (input.selectedProcesses.includes('가구')) score += 15;
  if (input.traits.includes('STORAGE_NEED')) score += 10;

  // 가족 적정도 (+8~20)
  const pyeongPerPerson = input.pyeong / input.familySize;
  if (pyeongPerPerson >= 12) score += 20;
  else if (pyeongPerPerson >= 10) score += 16;
  else if (pyeongPerPerson >= 8) score += 12;
  else score += 8;

  // 공간활용 (+5)
  if (input.selectedProcesses.includes('주방')) score += 5;
  if (input.selectedProcesses.includes('중문')) score += 5;

  return Math.min(100, score);
}

// 4. 유지관리용이도
function calcMaintenance(input: SixIndexInput): number {
  let score = 40;

  // 자재 내구성 (+15~25) - STANDARD가 가장 높음
  const gradePoints: Record<string, number> = { STANDARD: 25, ESSENTIAL: 20, OPUS: 15 };
  score += gradePoints[input.grade] || 20;

  // 청소 편의 (+10~20)
  if (input.traits.includes('CLEANING_SYSTEM_NEED')) {
    score += input.grade === 'STANDARD' ? 20 : input.grade === 'ESSENTIAL' ? 15 : 10;
  } else {
    score += 15;
  }

  // 유지비 (+8~15)
  const maintenancePoints: Record<string, number> = { STANDARD: 15, ESSENTIAL: 12, OPUS: 8 };
  score += maintenancePoints[input.grade] || 12;

  return Math.min(100, score);
}

// 5. 에너지효율지수
function calcEnergy(input: SixIndexInput): number {
  let score = 30;

  // 샤시 단열 (+15~35)
  if (input.selectedProcesses.includes('샤시')) {
    score += input.grade === 'OPUS' ? 35 : input.grade === 'STANDARD' ? 25 : 15;
  }

  // 조명 (+15)
  if (input.selectedProcesses.includes('전기')) score += 15;

  // 냉난방 (+10~20) - 추가옵션 기반
  if (input.additionalOptions?.includes('aircon_system')) {
    score += input.grade === 'OPUS' ? 20 : input.grade === 'STANDARD' ? 15 : 10;
  }

  return Math.min(100, score);
}

// 6. 투자효율지수
function calcInvestment(input: SixIndexInput): number {
  let score = 40;
  const budgetPerPyeong = input.budget / input.pyeong;

  // 예산 배분 적정성 (+15~30)
  if (input.grade === 'ESSENTIAL' && budgetPerPyeong <= 100) score += 30;
  else if (input.grade === 'STANDARD' && budgetPerPyeong >= 100 && budgetPerPyeong <= 150) score += 30;
  else if (input.grade === 'OPUS' && budgetPerPyeong >= 150) score += 30;
  else score += 15;

  // 핵심 공정 집중 (+5~8)
  if (input.selectedProcesses.includes('주방')) score += 8;
  if (input.selectedProcesses.includes('욕실')) score += 7;
  if (input.selectedProcesses.includes('바닥재')) score += 5;

  return Math.min(100, score);
}




