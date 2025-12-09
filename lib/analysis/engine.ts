/**
 * 인테리봇 성향 분석 엔진
 * 
 * [Phase 1 개선사항]
 * - hashToScore 함수 제거 (난수 기반 → 실제 답변 기반)
 * - answer-mappings.ts의 매핑 테이블 사용
 * - 고객의 실제 답변 내용이 정확하게 점수에 반영됨
 */

import { PREFERENCE_CATEGORIES, PreferenceCategory } from './questions/types';
import { AnalysisMode, AnalysisRequest, AnalysisResult, PreferenceScores, VibeProfile } from './types';
import { calculateScoresFromAnswers } from './answer-mappings';

// 점수 범위 제한 함수
const clamp = (value: number, min = 1, max = 10) => Math.min(max, Math.max(min, value));

/**
 * spaceInfo에서 가족 구성 점수를 계산
 * familySizeRange와 ageRanges를 기반으로 family_composition 점수 결정
 */
const calculateFamilyScoreFromSpaceInfo = (spaceInfo: AnalysisRequest['spaceInfo']): number => {
  if (!spaceInfo) return 5; // 기본값

  let score = 5;
  const { familySizeRange, ageRanges, lifestyleTags, totalPeople } = spaceInfo;

  // 가족 규모에 따른 점수 조정
  if (familySizeRange) {
    switch (familySizeRange) {
      case '1인':
        score = 3; // 1인 가구는 가족 중심 점수 낮음
        break;
      case '2인':
        score = 5; // 2인 가구는 중간
        break;
      case '3~4인':
        score = 8; // 3~4인 가구는 가족 중심 점수 높음
        break;
      case '5인 이상':
        score = 9; // 대가족은 가족 중심 점수 매우 높음
        break;
      default:
        // '1-2', '2-3', '3-4', '4-5', '5+' 형식 처리
        if (familySizeRange.includes('1')) score = 3;
        else if (familySizeRange.includes('2')) score = 5;
        else if (familySizeRange.includes('3') || familySizeRange.includes('4')) score = 8;
        else if (familySizeRange.includes('5') || familySizeRange.includes('+')) score = 9;
    }
  }

  // totalPeople로 보정
  if (totalPeople) {
    if (totalPeople === 1) score = Math.min(score, 3);
    else if (totalPeople >= 4) score = Math.max(score, 7);
  }

  // 연령대에 따른 추가 조정
  if (ageRanges && ageRanges.length > 0) {
    // 아이가 있으면 가족 중심 점수 증가
    if (ageRanges.includes('baby') || ageRanges.includes('child')) {
      score = Math.max(score, 8);
    }
    // 노인이 있으면 가족 중심 점수 약간 증가
    if (ageRanges.includes('senior')) {
      score = Math.max(score, 6);
    }
  }

  // 라이프스타일 태그에 따른 조정
  if (lifestyleTags && lifestyleTags.length > 0) {
    if (lifestyleTags.includes('hasPets')) {
      score = Math.max(score, 6); // 반려동물 있으면 가족 중심 점수 약간 증가
    }
    if (lifestyleTags.includes('hasElderly')) {
      score = Math.max(score, 7);
    }
  }

  return clamp(score);
};

/**
 * spaceInfo에서 건강 요소 점수를 계산
 */
const calculateHealthScoreFromSpaceInfo = (spaceInfo: AnalysisRequest['spaceInfo']): number => {
  if (!spaceInfo) return 5;

  let score = 5;
  const { ageRanges, lifestyleTags } = spaceInfo;

  // 노인이 있으면 건강 요소 중요도 증가
  if (ageRanges?.includes('senior')) {
    score = Math.max(score, 8);
  }

  // 아기가 있으면 건강 요소 중요도 증가
  if (ageRanges?.includes('baby')) {
    score = Math.max(score, 7);
  }

  // 특수 조건에 따른 조정
  if (lifestyleTags) {
    if (lifestyleTags.includes('hasElderly')) score = Math.max(score, 8);
    if (lifestyleTags.includes('hasPregnant')) score = Math.max(score, 8);
    if (lifestyleTags.includes('hasDisabledMember')) score = Math.max(score, 9);
  }

  return clamp(score);
};

/**
 * 성향 점수 계산 (answers + spaceInfo 반영)
 * 
 * [개선됨] 기존 hashToScore 대신 answer-mappings.ts의 매핑 테이블 사용
 */
export const buildPreferenceScores = (
  answers: Record<string, unknown>,
  spaceInfo?: AnalysisRequest['spaceInfo']
): PreferenceScores => {
  // 1. 답변 기반 점수 계산 (새로운 매핑 테이블 사용)
  let scores: PreferenceScores;
  
  if (answers && typeof answers === 'object' && Object.keys(answers).length > 0) {
    // 이미 카테고리별 점수 형태인지 확인
    const isAlreadyScores = Object.keys(answers).every(
      key => PREFERENCE_CATEGORIES.includes(key as PreferenceCategory)
    );
    
    if (isAlreadyScores) {
      // 이미 점수 형태면 그대로 사용
      scores = PREFERENCE_CATEGORIES.reduce((acc, category) => {
        const value = answers[category];
        acc[category] = typeof value === 'number' ? clamp(value) : 5;
        return acc;
      }, {} as PreferenceScores);
    } else {
      // 답변 형태면 매핑 테이블로 점수 계산
      scores = calculateScoresFromAnswers(answers) as PreferenceScores;
    }
  } else {
    // 답변이 없으면 기본값 5점
    scores = PREFERENCE_CATEGORIES.reduce((acc, category) => {
      acc[category] = 5;
      return acc;
    }, {} as PreferenceScores);
  }

  // 2. spaceInfo에서 추가 점수 반영
  if (spaceInfo) {
    // 가족 구성 점수 반영
    const familyScore = calculateFamilyScoreFromSpaceInfo(spaceInfo);
    // 기존 답변 점수와 spaceInfo 점수를 가중 평균 (spaceInfo가 더 정확하므로 70% 반영)
    scores.family_composition = clamp(
      Math.round(scores.family_composition * 0.3 + familyScore * 0.7)
    );

    // 건강 요소 점수 반영
    const healthScore = calculateHealthScoreFromSpaceInfo(spaceInfo);
    scores.health_factors = clamp(
      Math.round(scores.health_factors * 0.5 + healthScore * 0.5)
    );

    // 공간 감각 점수 조정 (평수에 따라)
    if (spaceInfo.pyeong) {
      if (spaceInfo.pyeong >= 40) {
        scores.space_sense = clamp(Math.max(scores.space_sense, 7));
      } else if (spaceInfo.pyeong <= 20) {
        scores.space_sense = clamp(Math.min(scores.space_sense, 6));
      }
    }

    console.log('📊 spaceInfo 반영 점수:', {
      familyScore,
      healthScore,
      final_family_composition: scores.family_composition,
      final_health_factors: scores.health_factors,
      spaceInfo: {
        familySizeRange: spaceInfo.familySizeRange,
        ageRanges: spaceInfo.ageRanges,
        totalPeople: spaceInfo.totalPeople,
      }
    });
  }

  console.log('📊 최종 성향 점수 (매핑 테이블 기반):', scores);

  return scores;
};

const VIBE_PRESETS: Record<
  string,
  { type: string; archetype: string; keywords: string[]; dominantColor: string; description: string }
> = {
  cozy_living: {
    type: '편안함 추구형',
    archetype: '안정 지향 스타일',
    keywords: ['편안함', '가족 중심', '안정적'],
    dominantColor: '#C4A484',
    description: '따뜻한 톤과 부드러운 촉감을 중요하게 생각하는 안정 지향 스타일',
  },
  warm_kitchen: {
    type: '모임 중심형',
    archetype: '호스트형 스타일',
    keywords: ['환대', '따뜻한 조명', '모임'],
    dominantColor: '#F3B664',
    description: '식탁과 주방을 중심으로 모두가 모이는 장면을 중시하는 호스트형 사용자',
  },
  aesthetic_decor: {
    type: '감성 연출형',
    archetype: '스토리 큐레이터',
    keywords: ['예술적', '의도적', '레이어드'],
    dominantColor: '#7C83FD',
    description: '소품과 연출로 감각적인 스토리를 만드는 감성 지향 사용자',
  },
  family_space: {
    type: '가족 중심형',
    archetype: '하트 커넥터',
    keywords: ['활발함', '부드러움', '가족'],
    dominantColor: '#FFB4B4',
    description: '아이/반려동물과 함께 생활하는 아늑한 동선과 재료를 선호',
  },
  cozy: {
    type: '개인 감성형',
    archetype: '데이드림 네스터',
    keywords: ['차분함', '부드러운 빛', '개인적'],
    dominantColor: '#A9C9FF',
    description: '나만의 감성 공간을 꾸미는 데 집중하는 홈바이브 타입',
  },
  default: {
    type: '다양성 탐구형',
    archetype: '바이브 익스플로러',
    keywords: ['적응력', '창의적', '활기찬'],
    dominantColor: '#F9A826',
    description: '새로운 무드와 색감을 실험하며 에너지를 갱신하는 타입',
  },
};

const deriveVibeProfile = (mode: AnalysisMode, answers: Record<string, unknown>, scores: PreferenceScores): VibeProfile => {
  // 성향 점수를 기반으로 바이브 프로필 생성
  const topCategories = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat as PreferenceCategory);

  // 성향 기반 키워드 생성
  const keywords: string[] = [];
  
  if (topCategories.includes('discomfort_factors') && scores.discomfort_factors >= 7) {
    keywords.push('실용성');
  }
  if (topCategories.includes('color_preference') && scores.color_preference >= 7) {
    keywords.push('색감 중시');
  }
  if (topCategories.includes('lighting_preference') && scores.lighting_preference >= 7) {
    keywords.push('조명 연출');
  }
  if (topCategories.includes('organization_habit') && scores.organization_habit >= 7) {
    keywords.push('정리 체계');
  }
  if (topCategories.includes('family_composition') && scores.family_composition >= 7) {
    keywords.push('가족 중심');
  }
  if (topCategories.includes('health_factors') && scores.health_factors >= 7) {
    keywords.push('건강 고려');
  }

  // 기본 타입 결정
  let vibeType = '균형 잡힌형';
  let archetype = '종합 스타일';
  let dominantColor = '#F9A826';

  if (mode === 'vibe') {
    const movieGenre = answers.vibe_movie_genre;
    const genreKeywords: string[] = movieGenre
      ? Array.isArray(movieGenre)
        ? movieGenre.filter((item): item is string => typeof item === 'string')
        : [String(movieGenre)]
      : [];
    
    if (genreKeywords.length > 0) {
      keywords.push(...genreKeywords.slice(0, 2));
    }
  }

  // 성향 점수 기반으로 타입 결정
  if (scores.discomfort_factors >= 7) {
    vibeType = '실용 중심형';
    archetype = '문제 해결 스타일';
    dominantColor = '#4A90E2';
  } else if (scores.color_preference >= 7 && scores.lighting_preference >= 7) {
    vibeType = '감성 연출형';
    archetype = '분위기 중시 스타일';
    dominantColor = '#7C83FD';
  } else if (scores.family_composition >= 7) {
    vibeType = '가족 중심형';
    archetype = '함께하는 공간';
    dominantColor = '#FFB4B4';
  } else if (scores.health_factors >= 7) {
    vibeType = '건강 우선형';
    archetype = '웰빙 스타일';
    dominantColor = '#4ECDC4';
  } else if (scores.organization_habit >= 7) {
    vibeType = '정리 체계형';
    archetype = '수납 최적화';
    dominantColor = '#95A5A6';
  }

  return {
    type: vibeType,
    archetype,
    keywords: keywords.length > 0 ? keywords : ['균형', '실용', '편안함'],
    dominantColor,
    description: `${vibeType} 성향으로, ${archetype}을 중시하는 인테리어 스타일입니다.`,
  };
};

const buildSummary = (mode: AnalysisMode, scores: PreferenceScores, answers: Record<string, unknown>, spaceInfo?: AnalysisRequest['spaceInfo']) => {
  const sortedCategories = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);
  
  const topCategory = sortedCategories[0];
  const avgScore = sortedCategories.reduce((sum, [, score]) => sum + score, 0) / sortedCategories.length;

  // 스타일 추론 (점수 기반 개선)
  const getRecommendedStyle = (): string[] => {
    const styles: string[] = [];
    
    // 미니멀: 색감 + 정리 습관 높음
    if (scores.color_preference >= 7 && scores.organization_habit >= 7) {
      styles.push('미니멀');
    }
    // 모던: 색감 + 조명 선호 높음
    if (scores.color_preference >= 6 && scores.lighting_preference >= 7) {
      styles.push('모던');
    }
    // 내추럴: 가족 중심 또는 건강 요소 높음
    if (scores.family_composition >= 7 || scores.health_factors >= 7) {
      styles.push('내추럴');
    }
    // 호텔식: 예산 감각 높음 + 감각 민감도 높음
    if (scores.budget_sense >= 7 && scores.sensory_sensitivity >= 7) {
      styles.push('호텔식');
    }
    // 북유럽: 조명 선호 + 건강 요소
    if (scores.lighting_preference >= 7 && scores.health_factors >= 6) {
      styles.push('북유럽');
    }
    
    return styles.length > 0 ? styles : ['모던', '내추럴'];
  };

  // 색상 추론 (점수 기반 개선)
  const getRecommendedColors = (): string[] => {
    const colors: string[] = [];
    
    if (scores.color_preference >= 8) {
      colors.push('화이트', '그레이'); // 미니멀/모던
    } else if (scores.color_preference >= 6) {
      colors.push('화이트', '베이지'); // 내추럴
    } else if (scores.sensory_sensitivity >= 7) {
      colors.push('베이지', '우드톤'); // 따뜻한 느낌
    } else {
      colors.push('화이트', '그레이');
    }
    
    return colors;
  };

  const recommendedStyles = getRecommendedStyle();
  const recommendedColors = getRecommendedColors();
  const spaceSense = scores.space_sense || 5;
  const visualSensitivity = scores.sensory_sensitivity || 5;
  const familyComposition = scores.family_composition || 5;

  let summary = '';

  // spaceInfo 기반 가족 구성 설명 추가
  let familyDescription = '';
  if (spaceInfo) {
    const { familySizeRange, ageRanges, totalPeople } = spaceInfo;
    
    if (familySizeRange || totalPeople) {
      const familySize = familySizeRange || (totalPeople ? `${totalPeople}인` : '');
      familyDescription = `${familySize} 가구`;
      
      if (ageRanges && ageRanges.length > 0) {
        const ageLabels: Record<string, string> = {
          baby: '영유아',
          child: '어린이',
          teen: '청소년',
          adult: '성인',
          senior: '노인'
        };
        const ageDescriptions = ageRanges
          .filter(age => age !== 'adult')
          .map(age => ageLabels[age] || age)
          .filter(Boolean);
        
        if (ageDescriptions.length > 0) {
          familyDescription += `(${ageDescriptions.join(', ')} 포함)`;
        }
      }
    }
  }

  // 스타일 선호도 분석 (개선: avgScore 기준 완화)
  if (avgScore <= 5.0) {
    summary += `아직 구체적인 성향이 파악되지 않았습니다. `;
    if (familyDescription) {
      summary += `${familyDescription}로서, `;
    }
    summary += `다양한 스타일을 열린 마음으로 탐색해보시길 추천드립니다. `;
    summary += `${recommendedStyles.join(', ')} 스타일을 기본으로 제안드립니다.`;
  } else {
    summary += `${spaceInfo?.housingType || '주거'} 공간 분석 결과, `;
    
    if (familyDescription) {
      summary += `${familyDescription}에 적합한 인테리어를 제안드립니다. `;
    }
    
    if (topCategory && topCategory[1] >= 7) {
      const categoryLabels: Record<PreferenceCategory, string> = {
        space_sense: '공간 감각',
        sensory_sensitivity: '감각 민감도',
        cleaning_preference: '청소 성향',
        organization_habit: '정리 습관',
        family_composition: '가족 구성',
        health_factors: '건강 요소',
        budget_sense: '예산 감각',
        color_preference: '색감 취향',
        lighting_preference: '조명 취향',
        home_purpose: '집 사용 목적',
        discomfort_factors: '불편 요소',
        activity_flow: '활동 동선',
        life_routine: '생활 루틴',
        sleep_pattern: '수면 패턴',
        hobby_lifestyle: '취미/라이프스타일',
      };
      
      const topLabel = categoryLabels[topCategory[0] as PreferenceCategory] || '공간 감각';
      summary += `"${topLabel}"이(가) 가장 중요하게 나타났습니다. `;
    }
    
    // 가족 구성 점수가 높으면 특별히 언급
    if (familyComposition >= 7) {
      summary += `가족 구성을 고려한 공간 설계가 중요합니다. `;
    }
    
    summary += `공간 감각(${spaceSense}/10)과 시각 민감도(${visualSensitivity}/10)를 고려할 때, `;
    summary += `${recommendedStyles.join(', ')} 스타일이 적합합니다. `;
    summary += `${recommendedColors.join('과 ')} 색상을 주로 사용하여 깔끔하고 세련된 공간을 연출할 수 있습니다.`;
  }

  return summary;
};

const buildRecommendations = (scores: PreferenceScores, answers: Record<string, unknown>, selectedAreas?: string[] | null) => {
  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const areas = selectedAreas && selectedAreas.length > 0 ? selectedAreas.join(', ') : '주요 공간';
  
  const categoryLabels: Record<PreferenceCategory, string> = {
    space_sense: '공간 감각',
    sensory_sensitivity: '감각 민감도',
    cleaning_preference: '청소 성향',
    organization_habit: '정리 습관',
    family_composition: '가족 구성',
    health_factors: '건강 요소',
    budget_sense: '예산 감각',
    color_preference: '색감 취향',
    lighting_preference: '조명 취향',
    home_purpose: '집 사용 목적',
    discomfort_factors: '불편 요소',
    activity_flow: '활동 동선',
    life_routine: '생활 루틴',
    sleep_pattern: '수면 패턴',
    hobby_lifestyle: '취미/라이프스타일',
  };

  const recommendations: string[] = [];
  const top3 = ordered.slice(0, 3);

  top3.forEach(([category, score]) => {
    const label = categoryLabels[category as PreferenceCategory];
    
    switch (category as PreferenceCategory) {
      case 'discomfort_factors':
        if (score >= 7) {
          recommendations.push(`🔧 ${areas}의 불편 요소를 우선적으로 해결하는 설계가 필요합니다. 현재 불편함을 정확히 파악하여 실용적인 솔루션을 제안하겠습니다.`);
        } else if (score >= 5) {
          recommendations.push(`💡 ${areas}에서 개선할 여지가 있는 부분을 찾아 최적화된 공간 설계를 진행하겠습니다.`);
        }
        break;
        
      case 'lighting_preference':
        if (score >= 7) {
          recommendations.push(`💡 ${areas}에 시간대별 조명 시나리오를 구성해보세요. 아침에는 활기찬 자연광, 저녁에는 편안한 간접조명으로 분위기를 연출할 수 있습니다.`);
        } else if (score >= 5) {
          recommendations.push(`✨ 조명은 공간의 분위기를 결정하는 핵심 요소입니다. ${areas}에 적합한 조명 계획을 수립하겠습니다.`);
        }
        break;
        
      case 'organization_habit':
        if (score >= 7) {
          recommendations.push(`📦 수납과 정리 루틴을 시각적으로 도와줄 모듈 시스템을 추천합니다. 물건을 쉽게 찾고 정리할 수 있는 구조로 설계하겠습니다.`);
        } else if (score >= 5) {
          recommendations.push(`🗂️ 효율적인 수납 공간 설계로 일상의 정리 습관을 개선할 수 있도록 도와드리겠습니다.`);
        }
        break;
        
      case 'budget_sense':
        if (score >= 7) {
          recommendations.push(`💰 예산 배분 시 핵심 마감재와 가구에 집중 투자하면 만족도가 높습니다. 우선순위를 명확히 하여 최적의 예산 계획을 수립하겠습니다.`);
        } else if (score >= 5) {
          recommendations.push(`💵 예산을 효율적으로 활용할 수 있도록 단계별 투자 계획을 제안하겠습니다.`);
        }
        break;
        
      case 'color_preference':
        if (score >= 7) {
          recommendations.push(`🎨 색감 취향이 뚜렷하시네요. ${areas}에 어울리는 색상 팔레트를 선별하여 통일감 있는 인테리어를 완성하겠습니다.`);
        } else if (score >= 5) {
          recommendations.push(`🌈 색상은 공간의 분위기를 좌우합니다. ${areas}에 적합한 색감 조합을 제안하겠습니다.`);
        }
        break;
        
      case 'sensory_sensitivity':
        if (score >= 7) {
          recommendations.push(`🌿 감각 민감도가 높으시므로 촉감, 냄새, 소리 등 세심한 요소까지 고려한 인테리어를 제안하겠습니다.`);
        }
        break;
        
      case 'health_factors':
        if (score >= 7) {
          recommendations.push(`🏥 건강 요소를 최우선으로 고려하여 공기질, 알레르기 대응, 인체공학적 설계를 포함한 건강한 공간을 만들겠습니다.`);
        }
        break;
        
      case 'sleep_pattern':
        if (score >= 7) {
          recommendations.push(`😴 수면 패턴을 분석하여 침실 환경을 최적화하겠습니다. 암막, 방음, 온도 조절 등 수면의 질을 높이는 요소를 반영합니다.`);
        }
        break;
        
      case 'family_composition':
        if (score >= 7) {
          recommendations.push(`👨‍👩‍👧 가족 구성과 생활 패턴을 고려하여 모두가 편안하게 사용할 수 있는 공간 설계를 진행하겠습니다.`);
        }
        break;
        
      case 'activity_flow':
        if (score >= 7) {
          recommendations.push(`🚶 활동 동선을 분석하여 효율적이고 편리한 공간 배치를 제안하겠습니다. 일상의 움직임이 자연스럽게 흐르도록 설계합니다.`);
        }
        break;
        
      case 'life_routine':
        if (score >= 7) {
          recommendations.push(`📅 생활 루틴을 반영하여 아침부터 저녁까지의 시간대별 공간 활용도를 극대화하는 설계를 제안하겠습니다.`);
        }
        break;
        
      default:
        if (score >= 7) {
          recommendations.push(`✨ ${label} 항목이 높게 나타났으므로, 이 요소를 중심으로 맞춤형 인테리어 계획을 수립하겠습니다.`);
        }
    }
  });

  // 추가 인사이트 생성
  const lowScores = ordered.filter(([, score]) => score <= 4).slice(0, 2);
  if (lowScores.length > 0) {
    const lowCategory = lowScores[0];
    const label = categoryLabels[lowCategory[0] as PreferenceCategory];
    recommendations.push(`💭 ${label} 영역은 상대적으로 낮게 나타났지만, 인테리어 과정에서 개선 기회를 찾아 함께 발전시켜 나가겠습니다.`);
  }

  return recommendations.length > 0 ? recommendations : [
    `🏠 ${areas}에 대한 종합적인 인테리어 계획을 수립하여 실용적이고 아름다운 공간을 만들어드리겠습니다.`,
  ];
};

const normalizeSelectedAreas = (raw: unknown): string[] => {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string');
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return raw.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

export const buildAnalysisResult = (payload: AnalysisRequest): AnalysisResult => {
  const {
    mode,
    preferences,
    answeredCount,
    completionRate,
    timestamp,
    spaceInfo = null,
    selectedAreas = null,
    vibeInput = null,
  } = payload;

  const normalizedAreas = normalizeSelectedAreas(selectedAreas);
  
  // spaceInfo를 buildPreferenceScores에 전달
  const preferenceScores = buildPreferenceScores(preferences, spaceInfo);
  
  const vibeProfile = deriveVibeProfile(mode, preferences, preferenceScores);
  const analysisId = `analysis_${Date.now()}`;
  const recommendations = buildRecommendations(preferenceScores, preferences, normalizedAreas);
  const summary = buildSummary(mode, preferenceScores, preferences, spaceInfo);

  console.log('📊 최종 분석 결과:', {
    analysisId,
    mode,
    preferenceScores,
    spaceInfo: spaceInfo ? {
      familySizeRange: spaceInfo.familySizeRange,
      ageRanges: spaceInfo.ageRanges,
      totalPeople: spaceInfo.totalPeople,
    } : null
  });

  return {
    analysisId,
    mode,
    vibeInput,
    summary,
    answeredCount,
    completionRate,
    preferences: preferenceScores,
    vibeProfile,
    recommendations,
    spaceInfo,
    selectedAreas: normalizedAreas,
    createdAt: timestamp || new Date().toISOString(),
  };
};
