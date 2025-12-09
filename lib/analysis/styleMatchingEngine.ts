/**
 * 스타일 매칭 엔진
 * 15개 성향 카테고리 점수 → 9가지 스타일 중 최적 매칭
 * 
 * 사용 예시:
 * const scores = calculateScoresFromAnswers(personalityStore.getAnswers());
 * const recommendation = matchStyle(scores);
 */

import type { InteriorStyle, StyleRecommendation, PreferenceScores } from './types';
import { stylePresets, getStylePreset, type StylePreset } from './stylePresets';
import type { PreferenceCategory } from './questions/types';
import { PREFERENCE_CATEGORIES } from './questions/types';

/**
 * 스타일 매칭 점수 계산
 * 사용자 성향 점수와 스타일 프리셋 간의 유사도 계산
 * 
 * @param userScores - 사용자의 15개 카테고리별 점수 (1~10)
 * @param stylePreset - 비교할 스타일 프리셋
 * @returns 유사도 점수 (0~100)
 */
function calculateStyleScore(
  userScores: PreferenceScores,
  stylePreset: StylePreset
): number {
  let totalScore = 0;
  let weightSum = 0;

  // 15개 카테고리 순회
  for (const category of PREFERENCE_CATEGORIES) {
    const userScore = userScores[category];
    const styleWeight = stylePreset.preferenceWeights[category];
    
    // 유효한 점수만 계산
    if (userScore !== undefined && styleWeight !== undefined) {
      // 유사도 계산: 차이가 적을수록 높은 점수 (10점 만점)
      const diff = Math.abs(userScore - styleWeight);
      const similarity = Math.max(0, 10 - diff);
      
      totalScore += similarity;
      weightSum += 1;
    }
  }

  // 평균 유사도를 0~100 스케일로 변환
  return weightSum > 0 ? (totalScore / weightSum) * 10 : 0;
}

/**
 * 메인 스타일 매칭 함수
 * 
 * @param scores - 15개 카테고리별 사용자 점수 (1~10)
 * @returns StyleRecommendation - 매칭된 스타일 정보
 */
export function matchStyle(scores: PreferenceScores): StyleRecommendation {
  const styleScores: { style: InteriorStyle; score: number }[] = [];

  // 각 스타일별 매칭 점수 계산
  for (const [styleId, preset] of Object.entries(stylePresets)) {
    const score = calculateStyleScore(scores, preset);
    styleScores.push({ style: styleId as InteriorStyle, score });
  }

  // 점수 기준 내림차순 정렬
  styleScores.sort((a, b) => b.score - a.score);

  const primaryMatch = styleScores[0];
  const secondaryMatch = styleScores[1];

  // 2위와의 점수 차이가 5점 미만이면 보조 스타일로 추천
  const hasSecondary = (primaryMatch.score - secondaryMatch.score) < 5;

  const primaryPreset = getStylePreset(primaryMatch.style);

  return {
    primaryStyle: primaryMatch.style,
    secondaryStyle: hasSecondary ? secondaryMatch.style : null,
    confidence: Math.round(primaryMatch.score),
    materials: primaryPreset.materials,
    colorPalette: primaryPreset.colorPalette,
    gradeWeights: primaryPreset.gradeWeights,
    keywords: primaryPreset.keywords,
    description: primaryPreset.description
  };
}

/**
 * 스타일 상세 정보 조회
 */
export function getStyleInfo(styleId: InteriorStyle): StylePreset {
  return getStylePreset(styleId);
}

/**
 * 상위 N개 스타일 매칭 결과 조회
 * 
 * @param scores - 사용자 성향 점수
 * @param topN - 반환할 스타일 개수 (기본: 3)
 */
export function getTopStyles(
  scores: PreferenceScores,
  topN: number = 3
): { style: InteriorStyle; score: number; preset: StylePreset }[] {
  const styleScores: { style: InteriorStyle; score: number; preset: StylePreset }[] = [];

  for (const [styleId, preset] of Object.entries(stylePresets)) {
    const score = calculateStyleScore(scores, preset);
    styleScores.push({ 
      style: styleId as InteriorStyle, 
      score: Math.round(score),
      preset 
    });
  }

  styleScores.sort((a, b) => b.score - a.score);
  
  return styleScores.slice(0, topN);
}

/**
 * 답변 데이터로부터 성향 점수 계산
 * personalityStore의 answers를 PreferenceScores로 변환
 * 
 * @param answers - questionId -> answer 맵 (문자열)
 * @returns PreferenceScores - 15개 카테고리별 점수
 */
export function calculateScoresFromAnswers(
  answers: Record<string, string>
): PreferenceScores {
  // 카테고리별 점수 초기화 (기본값 5점)
  const scores: Partial<PreferenceScores> = {};
  
  for (const category of PREFERENCE_CATEGORIES) {
    scores[category] = 5; // 중간값으로 초기화
  }
  
  // 답변 기반 점수 매핑 (questionId → category 매핑 필요)
  // 실제 구현에서는 질문별 가중치와 카테고리 매핑 적용
  const categoryMapping: Record<string, PreferenceCategory> = {
    // Quick 모드 질문 매핑
    'q1': 'space_sense',
    'q2': 'cleaning_preference',
    'q3': 'color_preference',
    'q4': 'lighting_preference',
    'q5': 'budget_sense',
    
    // Standard 모드 추가 질문
    's1': 'organization_habit',
    's2': 'sensory_sensitivity',
    's3': 'home_purpose',
    's4': 'activity_flow',
    's5': 'life_routine',
    
    // Deep 모드 추가 질문
    'd1': 'family_composition',
    'd2': 'health_factors',
    'd3': 'discomfort_factors',
    'd4': 'sleep_pattern',
    'd5': 'hobby_lifestyle',
    
    // 추가 매핑 (실제 질문 ID에 맞게 조정)
    'quick_1': 'space_sense',
    'quick_2': 'cleaning_preference',
    'quick_3': 'color_preference',
    'quick_4': 'lighting_preference',
    'quick_5': 'budget_sense',
  };
  
  // 답변값을 점수로 변환하는 함수
  const answerToScore = (answer: string): number => {
    // 숫자형 답변
    const numAnswer = parseInt(answer, 10);
    if (!isNaN(numAnswer) && numAnswer >= 1 && numAnswer <= 10) {
      return numAnswer;
    }
    
    // 텍스트형 답변 → 점수 변환
    const textScoreMap: Record<string, number> = {
      // 공간감
      '넓고 개방적인': 9,
      '아늑하고 포근한': 3,
      '적당한': 5,
      
      // 청소
      '매우 중요': 9,
      '중요': 7,
      '보통': 5,
      '덜 중요': 3,
      
      // 색상
      '화이트/무채색': 3,
      '따뜻한 우드톤': 7,
      '모던 블랙': 2,
      '파스텔': 6,
      '비비드': 8,
      
      // 조명
      '밝고 환한': 9,
      '은은하고 분위기있는': 4,
      '자연광 중심': 7,
      
      // 예산
      '가성비': 3,
      '적당히': 5,
      '투자형': 8,
      '프리미엄': 10,
    };
    
    // 부분 매칭 검색
    for (const [key, score] of Object.entries(textScoreMap)) {
      if (answer.includes(key) || key.includes(answer)) {
        return score;
      }
    }
    
    return 5; // 기본값
  };
  
  // 답변을 카테고리별 점수로 변환
  for (const [questionId, answer] of Object.entries(answers)) {
    const category = categoryMapping[questionId];
    if (category) {
      scores[category] = answerToScore(answer);
    }
  }
  
  return scores as PreferenceScores;
}

/**
 * 스타일 호환성 체크
 * 두 스타일 간의 호환성 점수 반환
 */
export function checkStyleCompatibility(
  style1: InteriorStyle,
  style2: InteriorStyle
): number {
  const preset1 = getStylePreset(style1);
  const preset2 = getStylePreset(style2);
  
  let similarity = 0;
  let count = 0;
  
  for (const category of PREFERENCE_CATEGORIES) {
    const weight1 = preset1.preferenceWeights[category];
    const weight2 = preset2.preferenceWeights[category];
    
    const diff = Math.abs(weight1 - weight2);
    similarity += (10 - diff);
    count++;
  }
  
  return Math.round((similarity / count) * 10);
}

/**
 * 스타일별 추천 등급 조회
 * gradeWeights 기반 가장 높은 가중치의 등급 반환
 */
export function getRecommendedGrade(
  styleId: InteriorStyle
): 'basic' | 'standard' | 'argen' | 'premium' {
  const preset = getStylePreset(styleId);
  const weights = preset.gradeWeights;
  
  let maxGrade: 'basic' | 'standard' | 'argen' | 'premium' = 'standard';
  let maxWeight = 0;
  
  for (const [grade, weight] of Object.entries(weights)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      maxGrade = grade as 'basic' | 'standard' | 'argen' | 'premium';
    }
  }
  
  return maxGrade;
}










