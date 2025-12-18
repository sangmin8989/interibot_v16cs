/**
 * AI 분석 엔진 V2 - 정밀 업그레이드
 * 
 * 개선사항:
 * 1. 질문-답변 직접 매핑 (hashToScore 제거)
 * 2. 공간별/공정별 우선순위 도출
 * 3. 견적 연동 데이터 생성
 * 4. 구체적인 추천 로직
 */

import { AnalysisMode, AnalysisRequest, AnalysisResult, PreferenceScores, VibeProfile } from './types';
import { PREFERENCE_CATEGORIES, PreferenceCategory } from './questions/types';

const clamp = (value: number, min = 1, max = 10) => Math.min(max, Math.max(min, value));

// ============================================================
// 1. 질문-답변 직접 매핑 테이블
// ============================================================

interface AnswerEffect {
  categories: Partial<Record<PreferenceCategory, number>>  // 카테고리별 점수 변화
  spacePreference?: Record<string, number>  // 공간 선호도 (living, kitchen 등)
  processPreference?: Record<string, number>  // 공정 선호도 (도배, 조명 등)
  stylePreference?: string[]  // 스타일 선호 (모던, 내추럴 등)
  colorPreference?: string[]  // 색상 선호
  budgetLevel?: 'low' | 'medium' | 'high' | 'premium'  // 예산 수준
  explanation?: string  // 이 답변이 왜 이런 영향을 미치는지 설명
}

// 질문 텍스트 매핑
const QUESTION_TEXTS: Record<string, string> = {
  'quick_first_scene': '퇴근 후 집에서 제일 먼저 보이고 싶은 장면',
  'quick_photo_space': '사진 찍어 올리고 싶은 공간',
  'quick_no_compromise': '인테리어에서 절대 양보 못하는 것',
  'quick_atmosphere': '원하는 집 분위기',
  'standard_main_space': '하루 중 가장 오래 머무는 공간',
  'standard_daily_discomfort': '매일 불편하지만 참고 넘어가는 것',
  'standard_cleaning_style': '청소 스타일',
  'standard_budget_priority': '예산 사용 우선순위',
  'vibe_weekend_alone': '주말 혼자 집에서 하고 싶은 것',
  'vibe_sns_interior': 'SNS에서 본 인테리어 중 끌리는 스타일',
  'vibe_interior_priority': '이번 인테리어에서 가장 기대하는 변화',
  'deep_sleep_brightness': '잠잘 때 방 밝기 선호',
  'deep_sleep_disturbance': '수면에 가장 방해가 되는 요소',
}

// 답변 텍스트 매핑
const ANSWER_TEXTS: Record<string, Record<string, string>> = {
  'quick_first_scene': {
    'hotel_hallway': '호텔 복도처럼 깔끔한 현관',
    'warm_kitchen': '따뜻한 조명 아래 주방',
    'cozy_living': '편안한 소파가 있는 거실',
    'family_space': '가족/반려동물이 편한 공간',
    'aesthetic_decor': '감성 있는 소품 연출'
  },
  'quick_photo_space': {
    'living_room': '거실',
    'kitchen': '주방/식탁',
    'bedroom': '침실',
    'bathroom': '욕실',
    'workspace': '작업방/서재'
  },
  'quick_no_compromise': {
    'storage': '수납공간',
    'lighting': '조명',
    'materials': '마감재 품질',
    'flow': '동선',
    'mood': '분위기'
  },
  'standard_daily_discomfort': {
    'storage': '수납공간 부족',
    'flow': '불편한 동선',
    'lighting': '답답한 조명/채광',
    'materials': '마음에 안 드는 마감재',
    'layout': '어색한 가구 배치'
  },
  'vibe_sns_interior': {
    'white_minimal': '화이트 미니멀',
    'nordic_natural': '북유럽 내추럴',
    'hotel_luxury': '호텔식 럭셔리',
    'vintage_antique': '빈티지/앤틱',
    'colorful_unique': '컬러풀/유니크'
  },
  'vibe_interior_priority': {
    'mood_change': '전체 분위기 변화',
    'functionality': '수납/동선 개선',
    'relaxation': '휴식 공간 확보',
    'work_space': '재택 환경 개선',
    'family_life': '가족 시간 증가'
  }
}

// 각 질문의 각 답변에 대한 효과 정의
const ANSWER_EFFECTS: Record<string, Record<string, AnswerEffect>> = {
  // ========================================
  // 빠르게 모드 질문들
  // ========================================
  'quick_first_scene': {
    'hotel_hallway': {
      categories: { organization_habit: 3, sensory_sensitivity: 2 },
      spacePreference: { entrance: 3, living: 1 },
      stylePreference: ['모던', '미니멀'],
      colorPreference: ['화이트', '그레이'],
      explanation: '깔끔하게 정리된 공간을 선호하시므로, 현관과 거실의 수납 및 정리 시스템을 강화하고 미니멀한 스타일을 추천드립니다.'
    },
    'warm_kitchen': {
      categories: { family_composition: 2, lighting_preference: 2 },
      spacePreference: { kitchen: 3, living: 1 },
      processPreference: { 조명: 2, 주방: 2 },
      stylePreference: ['내추럴', '모던'],
      explanation: '따뜻한 주방 공간을 원하시므로, 주방 인테리어와 조명 연출에 집중하고 가족이 모이는 공간을 중심으로 설계합니다.'
    },
    'cozy_living': {
      categories: { sensory_sensitivity: 2, lighting_preference: 1 },
      spacePreference: { living: 3 },
      processPreference: { 도배: 1, 조명: 2 },
      stylePreference: ['내추럴', '모던'],
      explanation: '편안한 거실을 원하시므로, 거실 공간에 투자를 집중하고 분위기 있는 조명과 따뜻한 톤의 마감재를 추천드립니다.'
    },
    'family_space': {
      categories: { family_composition: 3, health_factors: 1 },
      spacePreference: { living: 2, room1: 2 },
      stylePreference: ['내추럴'],
      colorPreference: ['베이지', '우드톤'],
      explanation: '가족/반려동물 중심의 공간을 원하시므로, 안전하고 내구성 있는 자재와 편안한 동선을 우선 고려합니다.'
    },
    'aesthetic_decor': {
      categories: { color_preference: 3, sensory_sensitivity: 2 },
      spacePreference: { living: 2 },
      processPreference: { 도배: 2, 조명: 2 },
      stylePreference: ['모던', '북유럽'],
      colorPreference: ['화이트', '파스텔'],
      explanation: '감성적인 연출을 중시하시므로, 포인트 벽지와 조명을 활용한 분위기 있는 공간을 추천드립니다.'
    }
  },

  'quick_photo_space': {
    'living_room': {
      categories: { sensory_sensitivity: 2, color_preference: 1 },
      spacePreference: { living: 4 },
      processPreference: { 도배: 2, 조명: 2, 바닥: 1 }
    },
    'kitchen': {
      categories: { cleaning_preference: 1 },
      spacePreference: { kitchen: 4 },
      processPreference: { 주방: 3, 타일: 2 }
    },
    'bedroom': {
      categories: { sleep_pattern: 2 },
      spacePreference: { masterBedroom: 3 },
      processPreference: { 도배: 2, 조명: 1 }
    },
    'bathroom': {
      categories: { cleaning_preference: 2 },
      spacePreference: { bathroom: 4 },
      processPreference: { 욕실: 3, 타일: 2 }
    },
    'workspace': {
      categories: { organization_habit: 2, home_purpose: 2 },
      spacePreference: { room1: 3 },
      processPreference: { 전기: 2, 조명: 2 }
    }
  },

  'quick_no_compromise': {
    'storage': {
      categories: { organization_habit: 4, space_sense: 2 },
      processPreference: { 목공: 3, 수납: 4 },
      spacePreference: { dressRoom: 2, living: 1 },
      explanation: '수납공간을 가장 중요하게 생각하시므로, 붙박이장과 맞춤 수납 시스템을 최우선으로 설계합니다.'
    },
    'lighting': {
      categories: { lighting_preference: 4, sensory_sensitivity: 2 },
      processPreference: { 조명: 4, 전기: 2 },
      explanation: '조명을 절대 양보할 수 없다고 하셨으므로, 공간별 맞춤 조명 계획과 디밍 시스템을 추천드립니다.'
    },
    'materials': {
      categories: { sensory_sensitivity: 3, color_preference: 2 },
      processPreference: { 도배: 3, 바닥: 2 },
      budgetLevel: 'high',
      explanation: '마감재 품질을 중시하시므로, 고급 자재 사용을 권장하며 이에 맞는 예산 배분을 안내드립니다.'
    },
    'flow': {
      categories: { activity_flow: 4, space_sense: 2 },
      processPreference: { 목공: 2 },
      explanation: '동선을 중요하게 생각하시므로, 생활 패턴에 맞는 효율적인 공간 배치를 제안드립니다.'
    },
    'mood': {
      categories: { lighting_preference: 3, color_preference: 3 },
      processPreference: { 도배: 2, 조명: 3 },
      stylePreference: ['모던', '호텔식'],
      explanation: '분위기를 가장 중시하시므로, 조명과 색감 연출에 집중한 감각적인 인테리어를 추천드립니다.'
    }
  },

  'quick_atmosphere': {
    'bright_clean': {
      categories: { lighting_preference: 3, organization_habit: 2 },
      stylePreference: ['미니멀', '모던'],
      colorPreference: ['화이트', '라이트그레이']
    },
    'warm_cozy': {
      categories: { sensory_sensitivity: 2, family_composition: 1 },
      stylePreference: ['내추럴', '우드'],
      colorPreference: ['베이지', '우드톤']
    },
    'modern_stylish': {
      categories: { color_preference: 2, sensory_sensitivity: 2 },
      stylePreference: ['모던', '미니멀'],
      colorPreference: ['그레이', '블랙포인트'],
      budgetLevel: 'high'
    },
    'hotel_luxury': {
      categories: { sensory_sensitivity: 3, budget_sense: -2 },
      stylePreference: ['호텔식', '럭셔리'],
      colorPreference: ['다크톤', '골드포인트'],
      budgetLevel: 'premium'
    }
  },

  // ========================================
  // 기본으로 모드 추가 질문들
  // ========================================
  'standard_main_space': {
    'living_room': {
      categories: { sensory_sensitivity: 1 },
      spacePreference: { living: 3 }
    },
    'kitchen': {
      categories: { cleaning_preference: 1 },
      spacePreference: { kitchen: 3 }
    },
    'bedroom': {
      categories: { sleep_pattern: 2 },
      spacePreference: { masterBedroom: 3 }
    },
    'workspace': {
      categories: { home_purpose: 2 },
      spacePreference: { room1: 3 }
    },
    'kids_room': {
      categories: { family_composition: 2 },
      spacePreference: { room1: 2, room2: 2 }
    }
  },

  'standard_daily_discomfort': {
    'storage': {
      categories: { discomfort_factors: 3, organization_habit: 2 },
      processPreference: { 목공: 4, 수납: 4 }
    },
    'flow': {
      categories: { discomfort_factors: 3, activity_flow: 2 },
      processPreference: { 목공: 2 }
    },
    'lighting': {
      categories: { discomfort_factors: 3, lighting_preference: 2 },
      processPreference: { 조명: 4, 전기: 2 }
    },
    'materials': {
      categories: { discomfort_factors: 3, sensory_sensitivity: 2 },
      processPreference: { 도배: 3, 바닥: 2 }
    },
    'layout': {
      categories: { discomfort_factors: 3, space_sense: 2 },
      processPreference: { 목공: 2 }
    }
  },

  'standard_cleaning_style': {
    'frequent_messy': {
      categories: { cleaning_preference: 2 },
      processPreference: { 바닥: 1 }
    },
    'batch_clean': {
      categories: { cleaning_preference: 3, organization_habit: 1 }
    },
    'only_when_bad': {
      categories: { cleaning_preference: 1 }
    },
    'system_needed': {
      categories: { cleaning_preference: 4, organization_habit: 3 },
      processPreference: { 수납: 3 }
    },
    'hide_all': {
      categories: { organization_habit: 4 },
      processPreference: { 목공: 3, 수납: 3 }
    }
  },

  'standard_budget_priority': {
    'cheap': {
      categories: { budget_sense: 4 },
      budgetLevel: 'low'
    },
    'balance': {
      categories: { budget_sense: 3 },
      budgetLevel: 'medium'
    },
    'materials': {
      categories: { budget_sense: 1, sensory_sensitivity: 2 },
      budgetLevel: 'high'
    },
    'labor': {
      categories: { budget_sense: 2 },
      budgetLevel: 'high'
    },
    'design': {
      categories: { color_preference: 2, sensory_sensitivity: 2 },
      budgetLevel: 'premium'
    }
  },

  // ========================================
  // 분위기로 모드 질문들
  // ========================================
  'vibe_weekend_alone': {
    'streaming': {
      categories: { sensory_sensitivity: 1 },
      spacePreference: { living: 2 },
      processPreference: { 조명: 1 }
    },
    'music_chill': {
      categories: { sensory_sensitivity: 2, lighting_preference: 2 },
      spacePreference: { living: 2 },
      stylePreference: ['내추럴', '모던']
    },
    'study_plan': {
      categories: { organization_habit: 2, home_purpose: 2 },
      spacePreference: { room1: 2 }
    },
    'cooking': {
      categories: { cleaning_preference: 1 },
      spacePreference: { kitchen: 3 },
      processPreference: { 주방: 2 }
    },
    'party': {
      categories: { family_composition: 1, activity_flow: 2 },
      spacePreference: { living: 2, kitchen: 1 }
    }
  },

  'vibe_sns_interior': {
    'white_minimal': {
      categories: { organization_habit: 2, color_preference: 2 },
      stylePreference: ['미니멀', '화이트'],
      colorPreference: ['화이트', '라이트그레이']
    },
    'nordic_natural': {
      categories: { sensory_sensitivity: 2 },
      stylePreference: ['북유럽', '내추럴'],
      colorPreference: ['우드톤', '베이지']
    },
    'hotel_luxury': {
      categories: { sensory_sensitivity: 3, budget_sense: -1 },
      stylePreference: ['호텔식', '럭셔리'],
      colorPreference: ['다크', '골드'],
      budgetLevel: 'premium'
    },
    'vintage_antique': {
      categories: { color_preference: 2 },
      stylePreference: ['빈티지'],
      colorPreference: ['브라운', '베이지']
    },
    'colorful_unique': {
      categories: { color_preference: 3, sensory_sensitivity: 2 },
      stylePreference: ['컬러풀', '유니크'],
      colorPreference: ['컬러풀']
    }
  },

  'vibe_interior_priority': {
    'mood_change': {
      categories: { color_preference: 3, lighting_preference: 2 },
      processPreference: { 도배: 3, 조명: 3 }
    },
    'functionality': {
      categories: { organization_habit: 3, activity_flow: 2 },
      processPreference: { 목공: 3, 수납: 3 }
    },
    'relaxation': {
      categories: { sensory_sensitivity: 2, sleep_pattern: 2 },
      spacePreference: { masterBedroom: 2, living: 1 },
      stylePreference: ['내추럴', '모던']
    },
    'work_space': {
      categories: { home_purpose: 3, organization_habit: 1 },
      spacePreference: { room1: 3 },
      processPreference: { 전기: 2, 조명: 2 }
    },
    'family_life': {
      categories: { family_composition: 3, activity_flow: 1 },
      spacePreference: { living: 2, kitchen: 1 }
    }
  },

  // ========================================
  // 깊게 모드 추가 질문들
  // ========================================
  'deep_sleep_brightness': {
    'complete_dark': {
      categories: { sleep_pattern: 4 },
      spacePreference: { masterBedroom: 2 },
      processPreference: { 창호: 2 }  // 암막 커튼/블라인드
    },
    'dim_light': {
      categories: { sleep_pattern: 3, lighting_preference: 1 },
      processPreference: { 조명: 1 }
    },
    'no_curtain': {
      categories: { sleep_pattern: 1 }
    },
    'mood_light': {
      categories: { sleep_pattern: 2, lighting_preference: 2 },
      processPreference: { 조명: 2 }
    }
  },

  'deep_sleep_disturbance': {
    'noise': {
      categories: { health_factors: 2, sensory_sensitivity: 2 },
      processPreference: { 창호: 3 }  // 방음
    },
    'light': {
      categories: { sleep_pattern: 2 },
      processPreference: { 창호: 2 }
    },
    'temperature': {
      categories: { health_factors: 2 },
      processPreference: { 창호: 1 }  // 단열
    },
    'air': {
      categories: { health_factors: 3 },
      processPreference: { 환기: 2 }
    }
  }
}

// ============================================================
// 2. 분석 결과 인터페이스 확장
// ============================================================

// AI 분석 이유 설명 인터페이스
export interface AnalysisExplanation {
  questionId: string
  question: string
  answer: string
  impact: string  // "이 답변으로 인해 ~가 반영되었습니다"
  affectedAreas: string[]  // 영향받은 영역들
}

// 집값 방어 점수 타입
export interface HomeValueScore {
  score: number  // 1-5점
  reason: string
  investmentValue: string
}

// 생활 개선 점수 타입
export interface LifestyleScores {
  storage: number  // 0-100
  cleaning: number  // 0-100
  flow: number  // 0-100
  comment: string
}

export interface AnalysisResultV2 extends AnalysisResult {
  // 추가 분석 결과
  spaceRanking: { spaceId: string; score: number; reason: string }[]
  processRanking: { process: string; score: number; reason: string }[]
  styleMatch: { style: string; score: number }[]
  colorPalette: string[]
  budgetRecommendation: 'basic' | 'standard' | 'argen' | 'premium'
  
  // 견적 연동용 데이터
  estimateHints: {
    prioritySpaces: string[]
    priorityProcesses: string[]
    suggestedGrade: string
    specialRequirements: string[]
  }
  
  // AI 분석 이유 설명
  explanations: AnalysisExplanation[]
  summaryExplanation: string  // 종합 설명
  
  // ✅ 추가: 집값 방어 점수와 생활 개선 점수
  homeValueScore?: HomeValueScore
  lifestyleScores?: LifestyleScores
}

// ============================================================
// 3. 분석 엔진 V2
// ============================================================

export const buildPreferenceScoresV2 = (
  answers: Record<string, unknown>,
  spaceInfo?: AnalysisRequest['spaceInfo'],
  selectedAreas?: string[] | null  // 사용자가 선택한 공간 목록
): {
  scores: PreferenceScores
  spaceScores: Record<string, number>
  processScores: Record<string, number>
  styleScores: Record<string, number>
  colorPreferences: string[]
  budgetLevel: string
  explanations: AnalysisExplanation[]
} => {
  // 초기화
  const scores: PreferenceScores = PREFERENCE_CATEGORIES.reduce((acc, category) => {
    acc[category] = 5;  // 기본값 5
    return acc;
  }, {} as PreferenceScores);
  
  const spaceScores: Record<string, number> = {}
  const processScores: Record<string, number> = {}
  const styleScores: Record<string, number> = {}
  const colorSet = new Set<string>()
  let budgetLevel = 'medium'
  const explanations: AnalysisExplanation[] = []

  // 공간 이름 매핑
  const spaceNames: Record<string, string> = {
    living: '거실', kitchen: '주방', masterBedroom: '안방',
    bathroom: '욕실', entrance: '현관', balcony: '발코니',
    dressRoom: '드레스룸', room1: '방1', room2: '방2'
  }

  // 답변별 효과 적용
  if (answers && typeof answers === 'object') {
    Object.entries(answers).forEach(([questionId, value]) => {
      const answerValue = String(value)
      const effects = ANSWER_EFFECTS[questionId]?.[answerValue]
      
      if (!effects) {
        // 매핑 없는 질문은 기본 처리
        return
      }

      // 영향받은 영역 수집
      const affectedAreas: string[] = []

      // 카테고리 점수 적용
      if (effects.categories) {
        Object.entries(effects.categories).forEach(([cat, delta]) => {
          const category = cat as PreferenceCategory
          scores[category] = clamp(scores[category] + delta)
        })
      }

      // 공간 선호도 적용
      if (effects.spacePreference) {
        Object.entries(effects.spacePreference).forEach(([space, delta]) => {
          spaceScores[space] = (spaceScores[space] || 0) + delta
          affectedAreas.push(`${spaceNames[space] || space} 공간`)
        })
      }

      // 공정 선호도 적용
      if (effects.processPreference) {
        Object.entries(effects.processPreference).forEach(([process, delta]) => {
          processScores[process] = (processScores[process] || 0) + delta
          affectedAreas.push(`${process} 공정`)
        })
      }

      // 스타일 선호도 적용
      if (effects.stylePreference) {
        effects.stylePreference.forEach(style => {
          styleScores[style] = (styleScores[style] || 0) + 1
          affectedAreas.push(`${style} 스타일`)
        })
      }

      // 색상 선호도 수집
      if (effects.colorPreference) {
        effects.colorPreference.forEach(color => colorSet.add(color))
      }

      // 예산 수준 업데이트
      if (effects.budgetLevel) {
        budgetLevel = effects.budgetLevel
        affectedAreas.push('예산 등급')
      }

      // 설명 수집 (explanation이 있는 경우만)
      if (effects.explanation) {
        const questionText = QUESTION_TEXTS[questionId] || questionId
        const answerText = ANSWER_TEXTS[questionId]?.[answerValue] || answerValue

        explanations.push({
          questionId,
          question: questionText,
          answer: answerText,
          impact: effects.explanation,
          affectedAreas
        })
      }
    })
  }

  // ★ 선택된 공간 반영 (가장 중요!)
  if (selectedAreas && selectedAreas.length > 0) {
    console.log('📍 [V2] 선택된 공간:', selectedAreas)
    
    // 선택된 공간에 높은 점수 부여 (10점)
    selectedAreas.forEach(area => {
      spaceScores[area] = (spaceScores[area] || 0) + 10
    })
    
    // 선택된 공간에 따른 공정 점수도 부여
    selectedAreas.forEach(area => {
      switch (area) {
        case 'living':
          processScores['도배'] = (processScores['도배'] || 0) + 3
          processScores['바닥'] = (processScores['바닥'] || 0) + 2
          processScores['조명'] = (processScores['조명'] || 0) + 2
          break
        case 'kitchen':
          processScores['주방'] = (processScores['주방'] || 0) + 5
          processScores['타일'] = (processScores['타일'] || 0) + 2
          break
        case 'bathroom':
          processScores['욕실'] = (processScores['욕실'] || 0) + 5
          processScores['타일'] = (processScores['타일'] || 0) + 3
          break
        case 'masterBedroom':
        case 'room1':
        case 'room2':
        case 'room3':
          processScores['도배'] = (processScores['도배'] || 0) + 2
          processScores['바닥'] = (processScores['바닥'] || 0) + 2
          break
        case 'entrance':
          processScores['타일'] = (processScores['타일'] || 0) + 3
          processScores['목공'] = (processScores['목공'] || 0) + 2  // 신발장
          break
        case 'balcony':
          processScores['타일'] = (processScores['타일'] || 0) + 3
          processScores['도배'] = (processScores['도배'] || 0) + 1
          break
        case 'dressRoom':
          processScores['목공'] = (processScores['목공'] || 0) + 4
          processScores['수납'] = (processScores['수납'] || 0) + 3
          break
      }
    })
  }

  // spaceInfo 반영
  if (spaceInfo) {
    // 가족 구성에 따른 점수 조정
    if (spaceInfo.familySizeRange) {
      if (spaceInfo.familySizeRange.includes('1')) {
        scores.family_composition = clamp(scores.family_composition - 2)
      } else if (spaceInfo.familySizeRange.includes('4') || spaceInfo.familySizeRange.includes('5')) {
        scores.family_composition = clamp(scores.family_composition + 3)
        spaceScores['living'] = (spaceScores['living'] || 0) + 2
        spaceScores['kitchen'] = (spaceScores['kitchen'] || 0) + 1
      }
    }

    // 연령대에 따른 조정
    if (spaceInfo.ageRanges) {
      if (spaceInfo.ageRanges.includes('baby') || spaceInfo.ageRanges.includes('child')) {
        scores.health_factors = clamp(scores.health_factors + 2)
        scores.family_composition = clamp(scores.family_composition + 2)
        processScores['바닥'] = (processScores['바닥'] || 0) + 2  // 아이 안전
      }
      if (spaceInfo.ageRanges.includes('senior')) {
        scores.health_factors = clamp(scores.health_factors + 3)
        processScores['욕실'] = (processScores['욕실'] || 0) + 2  // 안전손잡이 등
      }
    }

    // 반려동물
    if (spaceInfo.lifestyleTags?.includes('hasPets')) {
      processScores['바닥'] = (processScores['바닥'] || 0) + 2  // 스크래치 방지
      scores.cleaning_preference = clamp(scores.cleaning_preference + 1)
    }

    // 평수에 따른 공간 감각
    if (spaceInfo.pyeong) {
      if (spaceInfo.pyeong >= 40) {
        scores.space_sense = clamp(scores.space_sense + 2)
      } else if (spaceInfo.pyeong <= 25) {
        scores.space_sense = clamp(scores.space_sense - 1)
        processScores['수납'] = (processScores['수납'] || 0) + 2  // 수납 중요
      }
    }
  }

  return {
    scores,
    spaceScores,
    processScores,
    styleScores,
    colorPreferences: Array.from(colorSet),
    budgetLevel,
    explanations
  }
}

// 공간 랭킹 생성 (선택된 공간만 포함)
const buildSpaceRanking = (
  spaceScores: Record<string, number>,
  selectedAreas?: string[] | null
): { spaceId: string; score: number; reason: string }[] => {
  const spaceReasons: Record<string, string> = {
    living: '거실 - 가족 공용 공간으로 투자 효율 높음',
    kitchen: '주방 - 일상 사용 빈도가 높아 만족도 영향 큼',
    masterBedroom: '안방 - 휴식과 수면의 질에 직접 영향',
    bathroom: '욕실 - 기능성과 청결 관리가 중요한 공간',
    entrance: '현관 - 첫인상과 수납에 영향',
    balcony: '발코니 - 활용도 높은 추가 공간',
    dressRoom: '드레스룸 - 수납과 정리의 핵심',
    room1: '방1 - 개인 공간 또는 다목적 활용',
    room2: '방2 - 자녀방 또는 서재 활용',
    room3: '방3 - 추가 개인 공간',
  }

  // 선택된 공간이 있으면 해당 공간만 필터링
  const filteredScores = selectedAreas && selectedAreas.length > 0
    ? Object.entries(spaceScores).filter(([spaceId]) => selectedAreas.includes(spaceId))
    : Object.entries(spaceScores)

  return filteredScores
    .map(([spaceId, score]) => ({
      spaceId,
      score,
      reason: spaceReasons[spaceId] || `${spaceId} 공간`
    }))
    .sort((a, b) => b.score - a.score)
}

// 공정 랭킹 생성
const buildProcessRanking = (
  processScores: Record<string, number>
): { process: string; score: number; reason: string }[] => {
  const processReasons: Record<string, string> = {
    '주방': '주방 가구/설비 교체 - 일상 편의성 향상',
    '욕실': '욕실 리모델링 - 청결과 기능성 개선',
    '도배': '벽지/페인트 - 공간 분위기 쇄신',
    '조명': '조명 교체 - 분위기와 기능성 동시 향상',
    '바닥': '바닥재 교체 - 전체 인테리어 톤 결정',
    '목공': '가구/수납 제작 - 맞춤형 공간 활용',
    '수납': '수납 시스템 - 정리정돈과 공간 효율',
    '전기': '전기 공사 - 안전과 편의성',
    '타일': '타일 시공 - 욕실/주방 마감',
    '창호': '창호 교체 - 단열/방음/채광',
    '환기': '환기 시스템 - 공기질 개선',
  }

  return Object.entries(processScores)
    .map(([process, score]) => ({
      process,
      score,
      reason: processReasons[process] || `${process} 공정`
    }))
    .sort((a, b) => b.score - a.score)
}

// 스타일 매칭
const buildStyleMatch = (
  styleScores: Record<string, number>
): { style: string; score: number }[] => {
  return Object.entries(styleScores)
    .map(([style, score]) => ({ style, score }))
    .sort((a, b) => b.score - a.score)
}

// 예산 등급 추천
const recommendBudgetGrade = (
  budgetLevel: string,
  scores: PreferenceScores
): 'basic' | 'standard' | 'argen' | 'premium' => {
  // 예산 감각 점수와 budgetLevel 종합
  if (budgetLevel === 'premium' || scores.sensory_sensitivity >= 8) {
    return 'premium'
  }
  if (budgetLevel === 'high' || scores.sensory_sensitivity >= 6) {
    return 'argen'
  }
  if (budgetLevel === 'low' || scores.budget_sense >= 8) {
    return 'basic'
  }
  return 'standard'
}

// 요약 생성
const buildSummaryV2 = (
  scores: PreferenceScores,
  spaceRanking: { spaceId: string; score: number }[],
  processRanking: { process: string; score: number }[],
  styleMatch: { style: string; score: number }[],
  spaceInfo?: AnalysisRequest['spaceInfo']
): string => {
  const topSpace = spaceRanking[0]?.spaceId || '거실'
  const topProcess = processRanking[0]?.process || '도배'
  const topStyle = styleMatch[0]?.style || '모던'
  
  const spaceNames: Record<string, string> = {
    living: '거실', kitchen: '주방', masterBedroom: '안방',
    bathroom: '욕실', entrance: '현관', balcony: '발코니',
    dressRoom: '드레스룸', room1: '방1', room2: '방2'
  }

  let summary = ''

  // 가족 구성 언급
  if (spaceInfo?.familySizeRange) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine-v2.ts:811',message:'familySizeRange 사용',data:{familySizeRange:spaceInfo.familySizeRange,totalPeople:spaceInfo.totalPeople},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    summary += `${spaceInfo.familySizeRange} 가구로서, `
  }

  // 핵심 분석
  summary += `분석 결과 **${spaceNames[topSpace] || topSpace}**에 대한 관심이 가장 높게 나타났습니다. `
  summary += `특히 **${topProcess}** 공정에 대한 필요도가 높으며, `
  summary += `**${topStyle}** 스타일을 선호하시는 것으로 분석됩니다.\n\n`

  // 상위 점수 카테고리 분석
  const sortedCategories = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const categoryLabels: Record<string, string> = {
    organization_habit: '정리정돈',
    lighting_preference: '조명 연출',
    sensory_sensitivity: '감각적 요소',
    color_preference: '색감',
    family_composition: '가족 중심',
    health_factors: '건강/안전',
    cleaning_preference: '청소/관리',
    budget_sense: '가성비',
    discomfort_factors: '불편 해소',
    activity_flow: '동선',
    sleep_pattern: '수면 환경',
    home_purpose: '재택/작업',
  }

  summary += `**주요 성향:**\n`
  sortedCategories.forEach(([cat, score], idx) => {
    const label = categoryLabels[cat] || cat
    summary += `${idx + 1}. ${label} (${score}/10)\n`
  })

  return summary
}

// 추천 생성
const buildRecommendationsV2 = (
  spaceRanking: { spaceId: string; score: number; reason: string }[],
  processRanking: { process: string; score: number; reason: string }[],
  styleMatch: { style: string; score: number }[],
  budgetGrade: string
): string[] => {
  const recommendations: string[] = []
  
  const spaceNames: Record<string, string> = {
    living: '거실', kitchen: '주방', masterBedroom: '안방',
    bathroom: '욕실', entrance: '현관', balcony: '발코니',
    dressRoom: '드레스룸', room1: '방1', room2: '방2'
  }

  // 공간 추천
  if (spaceRanking.length > 0) {
    const topSpaces = spaceRanking.slice(0, 3)
    const spaceList = topSpaces.map(s => spaceNames[s.spaceId] || s.spaceId).join(', ')
    recommendations.push(`🏠 **우선 공간:** ${spaceList}에 집중 투자를 권장합니다.`)
  }

  // 공정 추천
  if (processRanking.length > 0) {
    const topProcesses = processRanking.slice(0, 3)
    recommendations.push(`🔧 **핵심 공정:** ${topProcesses.map(p => p.process).join(', ')} 공정을 우선적으로 진행하세요.`)
    
    // 각 공정별 상세 추천
    topProcesses.forEach(p => {
      recommendations.push(`   └ ${p.reason}`)
    })
  }

  // 스타일 추천
  if (styleMatch.length > 0) {
    const topStyle = styleMatch[0].style
    recommendations.push(`🎨 **추천 스타일:** ${topStyle} 스타일이 가장 적합합니다.`)
  }

  // 등급 추천
  const gradeLabels: Record<string, string> = {
    basic: '기본형 (가성비 중심)',
    standard: '표준형 (균형 잡힌 선택)',
    argen: '아르젠 (품질 우선)',
    premium: '프리미엄 (최고급 마감)'
  }
  recommendations.push(`💰 **추천 등급:** ${gradeLabels[budgetGrade] || budgetGrade}`)

  return recommendations
}

// ============================================================
// 4. 점수 계산 함수
// ============================================================

/**
 * 집값 방어 점수 계산 (1-5점)
 * 선택된 공간, 등급, 거주 목적 등을 종합하여 계산
 */
const calculateHomeValueScore = (
  selectedAreas: string[],
  budgetRecommendation: string,
  spaceInfo?: AnalysisRequest['spaceInfo']
): HomeValueScore => {
  let score = 3 // 기본 3점
  
  // 공간 수에 따른 가산
  if (selectedAreas.length >= 3) score += 0.5
  
  // 주방/욕실 포함 시 가산 (매도 시 가장 중요)
  const hasKitchen = selectedAreas.some(s => 
    s.includes('주방') || s.includes('kitchen') || s === 'kitchen'
  )
  const hasBathroom = selectedAreas.some(s => 
    s.includes('욕실') || s.includes('bathroom') || s === 'bathroom' ||
    s === 'masterBathroom' || s === 'commonBathroom'
  )
  if (hasKitchen) score += 0.5
  if (hasBathroom) score += 0.5
  
  // 프리미엄/아르젠 등급 시 가산
  if (budgetRecommendation === 'premium') score += 0.5
  if (budgetRecommendation === 'argen') score += 0.3
  
  // 거주 목적에 따른 가산
  if (spaceInfo?.livingPurpose === '매도준비') {
    if (hasKitchen && hasBathroom) score += 0.5
  } else if (spaceInfo?.livingPurpose === '실거주' && spaceInfo?.livingYears && spaceInfo.livingYears >= 10) {
    score += 0.3
  }
  
  const finalScore = Math.min(5, Math.max(1, Math.round(score)))
  
  // 투자 가치 계산 (간단한 추정)
  const monthlyEquivalent = 25 // 기본값 (실제로는 예산 정보 필요)
  
  return {
    score: finalScore,
    reason: finalScore >= 4 
      ? '주방/욕실 전면 교체는 매도 시 가장 큰 가치 상승 요인입니다. 장기적으로 훌륭한 투자입니다!'
      : finalScore >= 3
      ? '선택하신 공간들은 집값 유지에 도움이 됩니다. 적절한 투자입니다.'
      : '기본적인 보수로 실용성 중심의 인테리어입니다.',
    investmentValue: `10년 거주 시 월 비용 환산 약 ${monthlyEquivalent}만원으로 ${monthlyEquivalent <= 20 ? '매우 합리적' : monthlyEquivalent <= 30 ? '적절한' : '투자 가치 있는'} 수준입니다.`
  }
}

/**
 * 생활 개선 점수 계산 (0-100점)
 * 수납, 청소, 동선 개선 정도를 점수로 환산
 */
const calculateLifestyleScores = (
  selectedAreas: string[],
  scores: PreferenceScores
): LifestyleScores => {
  let storage = 50, cleaning = 50, flow = 50 // 기본 점수
  
  // 선택된 공간에 따른 가산점
  const hasKitchen = selectedAreas.some(s => 
    s.includes('주방') || s.includes('kitchen') || s === 'kitchen'
  )
  const hasBathroom = selectedAreas.some(s => 
    s.includes('욕실') || s.includes('bathroom') || s === 'bathroom' ||
    s === 'masterBathroom' || s === 'commonBathroom'
  )
  const hasDressRoom = selectedAreas.some(s => 
    s.includes('드레스룸') || s.includes('dressRoom') || s === 'dressRoom' || s.includes('수납')
  )
  const hasLiving = selectedAreas.some(s => 
    s.includes('거실') || s.includes('living') || s === 'living'
  )
  const hasEntrance = selectedAreas.some(s => 
    s.includes('현관') || s.includes('entrance') || s === 'entrance'
  )
  
  if (hasKitchen) {
    storage += 15
    cleaning += 10
    flow += 10
  }
  if (hasBathroom) {
    cleaning += 15
    storage += 5
  }
  if (hasDressRoom) {
    storage += 20
  }
  if (hasLiving) {
    flow += 15
    cleaning += 5
  }
  if (hasEntrance) {
    flow += 10
    storage += 10
  }
  
  // 성향 점수 반영 (organization_habit, cleaning_preference, activity_flow)
  storage = Math.min(100, storage + (scores.organization_habit - 5) * 3)
  cleaning = Math.min(100, cleaning + (scores.cleaning_preference - 5) * 3)
  flow = Math.min(100, flow + (scores.activity_flow - 5) * 3)
  
  // 최종 점수 보정
  storage = Math.max(0, Math.min(100, Math.round(storage)))
  cleaning = Math.max(0, Math.min(100, Math.round(cleaning)))
  flow = Math.max(0, Math.min(100, Math.round(flow)))
  
  // 코멘트 생성
  const comment = storage >= 80 
    ? '수납공간이 크게 개선됩니다!'
    : cleaning >= 80 
    ? '청소가 훨씬 편해집니다!'
    : flow >= 80 
    ? '생활 동선이 획기적으로 개선됩니다!'
    : '전반적인 생활 품질이 향상됩니다.'
  
  return {
    storage,
    cleaning,
    flow,
    comment
  }
}

// ============================================================
// 5. 메인 분석 함수
// ============================================================

// 종합 설명 생성
const buildSummaryExplanation = (
  explanations: AnalysisExplanation[],
  spaceRanking: { spaceId: string; score: number }[],
  processRanking: { process: string; score: number }[],
  styleMatch: { style: string; score: number }[],
  budgetRecommendation: string
): string => {
  const spaceNames: Record<string, string> = {
    living: '거실', kitchen: '주방', masterBedroom: '안방',
    bathroom: '욕실', entrance: '현관', balcony: '발코니',
    dressRoom: '드레스룸', room1: '방1', room2: '방2'
  }

  const gradeLabels: Record<string, string> = {
    basic: '기본형',
    standard: '표준형',
    argen: '아르젠',
    premium: '프리미엄'
  }

  let explanation = '## 🤖 AI 분석 근거\n\n'
  
  // 핵심 분석 결과 설명
  explanation += '### 이렇게 분석한 이유\n\n'
  
  if (explanations.length > 0) {
    explanations.forEach((exp, idx) => {
      explanation += `**${idx + 1}. "${exp.question}"에 대한 답변**\n`
      explanation += `   → "${exp.answer}"를 선택하셨습니다.\n`
      explanation += `   💡 ${exp.impact}\n\n`
    })
  } else {
    explanation += '답변을 바탕으로 종합적인 성향을 분석했습니다.\n\n'
  }

  // 결론
  explanation += '### 📊 분석 결론\n\n'
  
  if (spaceRanking.length > 0) {
    const topSpace = spaceNames[spaceRanking[0].spaceId] || spaceRanking[0].spaceId
    explanation += `- **우선 투자 공간**: ${topSpace} (답변 분석 결과, 이 공간에 대한 관심도가 가장 높음)\n`
  }
  
  if (processRanking.length > 0) {
    explanation += `- **핵심 공정**: ${processRanking.slice(0, 3).map(p => p.process).join(', ')} (선호도와 불편사항을 반영)\n`
  }
  
  if (styleMatch.length > 0) {
    explanation += `- **추천 스타일**: ${styleMatch[0].style} (분위기/색감 답변 기반)\n`
  }
  
  explanation += `- **추천 등급**: ${gradeLabels[budgetRecommendation] || budgetRecommendation} (예산 관련 답변 및 마감재 선호도 반영)\n`

  return explanation
}

export const buildAnalysisResultV2 = (payload: AnalysisRequest): AnalysisResultV2 => {
  const {
    mode,
    preferences,
    answeredCount,
    completionRate,
    timestamp,
    spaceInfo = null,
    selectedAreas = null,
    vibeInput = null,
  } = payload

  // selectedAreas 정규화
  const normalizedAreas = selectedAreas 
    ? (Array.isArray(selectedAreas) ? selectedAreas : []) 
    : []

  // V2 분석 실행 (선택된 공간 전달!)
  const {
    scores,
    spaceScores,
    processScores,
    styleScores,
    colorPreferences,
    budgetLevel,
    explanations
  } = buildPreferenceScoresV2(preferences, spaceInfo, normalizedAreas)

  // 랭킹 생성 (선택된 공간 전달!)
  const spaceRanking = buildSpaceRanking(spaceScores, normalizedAreas)
  const processRanking = buildProcessRanking(processScores)
  const styleMatch = buildStyleMatch(styleScores)
  const budgetRecommendation = recommendBudgetGrade(budgetLevel, scores)

  // 요약 및 추천 생성
  const summary = buildSummaryV2(scores, spaceRanking, processRanking, styleMatch, spaceInfo)
  const recommendations = buildRecommendationsV2(spaceRanking, processRanking, styleMatch, budgetRecommendation)

  // VibeProfile 생성
  const vibeProfile: VibeProfile = {
    type: styleMatch[0]?.style || '모던',
    archetype: `${styleMatch[0]?.style || '모던'} 스타일 선호`,
    keywords: styleMatch.slice(0, 3).map(s => s.style),
    dominantColor: colorPreferences[0] || '#F9A826',
    description: summary.split('\n')[0]
  }

  // 견적 연동 힌트
  const estimateHints = {
    prioritySpaces: spaceRanking.slice(0, 3).map(s => s.spaceId),
    priorityProcesses: processRanking.slice(0, 5).map(p => p.process),
    suggestedGrade: budgetRecommendation,
    specialRequirements: [] as string[]
  }

  // 특수 요구사항 추가
  if (scores.health_factors >= 7) {
    estimateHints.specialRequirements.push('친환경 자재')
  }
  if (scores.organization_habit >= 7) {
    estimateHints.specialRequirements.push('수납 최적화')
  }
  if (scores.lighting_preference >= 7) {
    estimateHints.specialRequirements.push('조명 연출')
  }

  // 종합 설명 생성
  const summaryExplanation = buildSummaryExplanation(
    explanations,
    spaceRanking,
    processRanking,
    styleMatch,
    budgetRecommendation
  )

  // ✅ 집값 방어 점수 계산
  const homeValueScore = calculateHomeValueScore(
    normalizedAreas,
    budgetRecommendation,
    spaceInfo
  )

  // ✅ 생활 개선 점수 계산
  const lifestyleScores = calculateLifestyleScores(
    normalizedAreas,
    scores
  )

  console.log('📊 [V2] 분석 결과:', {
    topSpace: spaceRanking[0],
    topProcess: processRanking[0],
    topStyle: styleMatch[0],
    budgetRecommendation,
    explanationsCount: explanations.length,
    scores,
    homeValueScore: homeValueScore.score,
    lifestyleScores
  })

  return {
    analysisId: `analysis_v2_${Date.now()}`,
    mode,
    vibeInput,
    summary,
    answeredCount,
    completionRate,
    preferences: scores,
    vibeProfile,
    recommendations,
    spaceInfo,
    selectedAreas: selectedAreas ? (Array.isArray(selectedAreas) ? selectedAreas : []) : [],
    createdAt: timestamp || new Date().toISOString(),
    
    // V2 추가 필드
    spaceRanking,
    processRanking,
    styleMatch,
    colorPalette: colorPreferences,
    budgetRecommendation,
    estimateHints,
    
    // AI 분석 이유 설명
    explanations,
    summaryExplanation,
    
    // ✅ 집값 방어 점수와 생활 개선 점수
    homeValueScore,
    lifestyleScores
  }
}

