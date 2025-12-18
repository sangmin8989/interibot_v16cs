/**
 * 9가지 인테리어 스타일 프리셋 데이터
 * 각 스타일별 자재, 색상, 등급 가중치, 키워드 정의
 * 
 * 15개 성향 카테고리와 매칭:
 * space_sense, sensory_sensitivity, cleaning_preference, organization_habit,
 * family_composition, health_factors, budget_sense, color_preference,
 * lighting_preference, home_purpose, discomfort_factors, activity_flow,
 * life_routine, sleep_pattern, hobby_lifestyle
 */

import type { InteriorStyle } from './types';
import type { PreferenceCategory } from './questions/types';

// 스타일 프리셋 인터페이스
export interface StylePreset {
  id: InteriorStyle;
  name: string;
  nameKo: string;
  description: string;
  materials: string[];
  colorPalette: string[];
  gradeWeights: {
    basic: number;
    standard: number;
    argen: number;
    premium: number;
  };
  keywords: string[];
  // 15개 성향 카테고리별 매칭 점수 (1~10)
  preferenceWeights: Record<PreferenceCategory, number>;
}

// 9가지 스타일 프리셋 정의
export const stylePresets: Record<InteriorStyle, StylePreset> = {
  'minimal-modern': {
    id: 'minimal-modern',
    name: 'Minimal Modern',
    nameKo: '모던 미니멀',
    description: '깔끔한 선과 단순한 형태, 군더더기 없는 세련된 공간',
    materials: ['고광택 MDF', '무광 래커', '강화유리', '스테인리스', '화이트 도장'],
    colorPalette: ['#FFFFFF', '#F5F5F5', '#333333', '#000000', '#808080'],
    gradeWeights: { basic: 0.1, standard: 0.3, argen: 0.4, premium: 0.2 },
    keywords: ['심플', '모던', '깔끔', '세련', '미니멀'],
    preferenceWeights: {
      space_sense: 9,           // 넓고 개방적인 공간 선호
      sensory_sensitivity: 3,   // 자극 최소화
      cleaning_preference: 9,   // 청소 편의성 높음
      organization_habit: 8,    // 정리정돈 중시
      family_composition: 5,    // 보통
      health_factors: 6,        // 보통
      budget_sense: 6,          // 중상
      color_preference: 3,      // 무채색 선호
      lighting_preference: 8,   // 밝은 조명
      home_purpose: 5,          // 균형
      discomfort_factors: 7,    // 잡음/혼란 싫어함
      activity_flow: 6,         // 효율적 동선
      life_routine: 7,          // 규칙적
      sleep_pattern: 6,         // 보통
      hobby_lifestyle: 5        // 보통
    }
  },

  'natural-wood': {
    id: 'natural-wood',
    name: 'Natural Wood',
    nameKo: '내추럴 우드',
    description: '원목의 따뜻함과 자연 소재가 어우러진 편안한 공간',
    materials: ['원목 마루', '무늬목', '리넨', '코튼', '라탄', '대나무'],
    colorPalette: ['#D4A574', '#8B7355', '#F5E6D3', '#E8DCC8', '#FFFFFF'],
    gradeWeights: { basic: 0.15, standard: 0.35, argen: 0.35, premium: 0.15 },
    keywords: ['자연', '원목', '따뜻함', '편안함', '내추럴', '친환경'],
    preferenceWeights: {
      space_sense: 6,           // 적당한 공간감
      sensory_sensitivity: 7,   // 자연스러운 감각
      cleaning_preference: 5,   // 보통
      organization_habit: 5,    // 보통
      family_composition: 6,    // 가족 친화적
      health_factors: 9,        // 친환경/건강 중시
      budget_sense: 5,          // 중간
      color_preference: 7,      // 따뜻한 색상
      lighting_preference: 6,   // 자연광 선호
      home_purpose: 7,          // 휴식 공간
      discomfort_factors: 4,    // 적당히 수용
      activity_flow: 5,         // 자연스러운 동선
      life_routine: 5,          // 유연함
      sleep_pattern: 7,         // 편안한 수면
      hobby_lifestyle: 7        // 홈카페/가드닝
    }
  },

  'modern-luxury': {
    id: 'modern-luxury',
    name: 'Modern Luxury',
    nameKo: '모던 럭셔리',
    description: '고급 소재와 세련된 디자인이 조화된 프리미엄 공간',
    materials: ['대리석', '고급 원목', '황동', '벨벳', '가죽', '크리스탈'],
    colorPalette: ['#1C1C1C', '#D4AF37', '#FFFFFF', '#4A4A4A', '#8B7355'],
    gradeWeights: { basic: 0.0, standard: 0.1, argen: 0.3, premium: 0.6 },
    keywords: ['럭셔리', '고급', '프리미엄', '세련', '품격', '우아'],
    preferenceWeights: {
      space_sense: 8,           // 넓은 공간
      sensory_sensitivity: 6,   // 고급 감각
      cleaning_preference: 6,   // 관리 가능
      organization_habit: 7,    // 정돈된 공간
      family_composition: 4,    // 소규모 가구
      health_factors: 5,        // 보통
      budget_sense: 9,          // 고예산
      color_preference: 5,      // 고급스러운 톤
      lighting_preference: 6,   // 분위기 조명
      home_purpose: 6,          // 접대/생활
      discomfort_factors: 8,    // 품질 민감
      activity_flow: 7,         // 효율적
      life_routine: 6,          // 정돈된 생활
      sleep_pattern: 6,         // 보통
      hobby_lifestyle: 6        // 와인/문화생활
    }
  },

  'cozy-home': {
    id: 'cozy-home',
    name: 'Cozy Home',
    nameKo: '코지 홈',
    description: '포근하고 아늑한 분위기의 편안한 집',
    materials: ['패브릭 소파', '니트 쿠션', '부드러운 카펫', '펜던트 조명', '따뜻한 커튼'],
    colorPalette: ['#F5E6D3', '#E8DCC8', '#D4A574', '#A0826D', '#FFFFFF'],
    gradeWeights: { basic: 0.2, standard: 0.4, argen: 0.3, premium: 0.1 },
    keywords: ['아늑', '포근', '편안', '따뜻', '힐링', '휴식'],
    preferenceWeights: {
      space_sense: 4,           // 아늑한 공간
      sensory_sensitivity: 8,   // 부드러운 촉감
      cleaning_preference: 4,   // 편안함 우선
      organization_habit: 4,    // 자유로운 배치
      family_composition: 6,    // 가족/혼자 모두
      health_factors: 6,        // 스트레스 해소
      budget_sense: 4,          // 중하
      color_preference: 8,      // 따뜻한 색상
      lighting_preference: 4,   // 은은한 조명
      home_purpose: 9,          // 휴식 최우선
      discomfort_factors: 3,    // 편안함 중시
      activity_flow: 4,         // 자유로운 동선
      life_routine: 4,          // 유연함
      sleep_pattern: 9,         // 편안한 수면
      hobby_lifestyle: 8        // 독서/영화감상
    }
  },

  'practical-family': {
    id: 'practical-family',
    name: 'Practical Family',
    nameKo: '실용 패밀리',
    description: '가족 중심의 실용적이고 기능적인 공간',
    materials: ['강화마루', '항균 페인트', '세라믹 타일', 'PVC 시트', '스크래치 방지 코팅'],
    colorPalette: ['#FFFFFF', '#F0F0F0', '#87CEEB', '#98D8AA', '#FFE4B5'],
    gradeWeights: { basic: 0.3, standard: 0.45, argen: 0.2, premium: 0.05 },
    keywords: ['실용', '가족', '기능', '수납', '안전', '내구성'],
    preferenceWeights: {
      space_sense: 6,           // 활동 공간
      sensory_sensitivity: 5,   // 실용적
      cleaning_preference: 10,  // 청소 최우선
      organization_habit: 9,    // 수납 중시
      family_composition: 10,   // 대가족
      health_factors: 8,        // 아이 안전
      budget_sense: 3,          // 가성비 중시
      color_preference: 5,      // 밝고 활기찬
      lighting_preference: 7,   // 밝은 조명
      home_purpose: 6,          // 생활 중심
      discomfort_factors: 6,    // 실용성 우선
      activity_flow: 9,         // 효율적 동선
      life_routine: 8,          // 규칙적
      sleep_pattern: 5,         // 보통
      hobby_lifestyle: 6        // 가족 활동
    }
  },

  'hotel-mood': {
    id: 'hotel-mood',
    name: 'Hotel Mood',
    nameKo: '호텔 무드',
    description: '호텔처럼 고급스럽고 정돈된 분위기',
    materials: ['대리석 타일', '간접조명', '고급 패브릭', '유리', '크롬', '미러'],
    colorPalette: ['#2C3E50', '#BDC3C7', '#FFFFFF', '#D4AF37', '#1C1C1C'],
    gradeWeights: { basic: 0.05, standard: 0.2, argen: 0.4, premium: 0.35 },
    keywords: ['호텔', '럭셔리', '정돈', '고급', '세련', '모던'],
    preferenceWeights: {
      space_sense: 8,           // 넓고 정돈된
      sensory_sensitivity: 6,   // 고급 감각
      cleaning_preference: 8,   // 깔끔함
      organization_habit: 9,    // 정돈 필수
      family_composition: 3,    // 1~2인
      health_factors: 5,        // 보통
      budget_sense: 8,          // 고예산
      color_preference: 4,      // 차분한 색상
      lighting_preference: 5,   // 분위기 조명
      home_purpose: 5,          // 생활/접대
      discomfort_factors: 9,    // 완벽 추구
      activity_flow: 8,         // 효율적
      life_routine: 7,          // 규칙적
      sleep_pattern: 7,         // 호텔 침실
      hobby_lifestyle: 5        // 외식/문화
    }
  },

  'scandinavian': {
    id: 'scandinavian',
    name: 'Scandinavian',
    nameKo: '스칸디나비안',
    description: '북유럽 스타일의 밝고 기능적인 공간',
    materials: ['화이트 오크', '린넨', '세라믹', '화이트 페인트', '라탄', '울'],
    colorPalette: ['#FFFFFF', '#F8F8F8', '#E8E4E1', '#B5C4B1', '#A0826D'],
    gradeWeights: { basic: 0.15, standard: 0.4, argen: 0.35, premium: 0.1 },
    keywords: ['북유럽', '밝음', '심플', '기능', '화이트', '자연'],
    preferenceWeights: {
      space_sense: 8,           // 개방적
      sensory_sensitivity: 6,   // 균형감
      cleaning_preference: 7,   // 관리 용이
      organization_habit: 7,    // 정돈된
      family_composition: 5,    // 보통
      health_factors: 7,        // 자연 소재
      budget_sense: 5,          // 중간
      color_preference: 4,      // 밝은 톤
      lighting_preference: 9,   // 자연광 최대
      home_purpose: 6,          // 생활 중심
      discomfort_factors: 5,    // 보통
      activity_flow: 7,         // 기능적
      life_routine: 6,          // 규칙적
      sleep_pattern: 6,         // 보통
      hobby_lifestyle: 6        // 요가/독서
    }
  },

  'industrial': {
    id: 'industrial',
    name: 'Industrial',
    nameKo: '인더스트리얼',
    description: '노출 콘크리트와 메탈의 도시적 감성',
    materials: ['노출 콘크리트', '철재', '블랙 스틸', '원목', '에디슨 전구', '벽돌'],
    colorPalette: ['#4A4A4A', '#1C1C1C', '#8B7355', '#D4D4D4', '#B87333'],
    gradeWeights: { basic: 0.2, standard: 0.35, argen: 0.3, premium: 0.15 },
    keywords: ['인더스트리얼', '도시적', '메탈', '콘크리트', '개성', '빈티지'],
    preferenceWeights: {
      space_sense: 8,           // 개방적 로프트
      sensory_sensitivity: 4,   // 거친 질감 OK
      cleaning_preference: 5,   // 보통
      organization_habit: 5,    // 자유로운
      family_composition: 4,    // 1~2인
      health_factors: 4,        // 개성 우선
      budget_sense: 5,          // 중간
      color_preference: 3,      // 어두운 톤
      lighting_preference: 4,   // 무드 조명
      home_purpose: 5,          // 작업/생활
      discomfort_factors: 3,    // 개성 수용
      activity_flow: 6,         // 자유로운
      life_routine: 4,          // 유연함
      sleep_pattern: 5,         // 보통
      hobby_lifestyle: 9        // 작업/예술
    }
  },

  'classic-modern': {
    id: 'classic-modern',
    name: 'Classic Modern',
    nameKo: '클래식 모던',
    description: '클래식한 우아함과 현대적 감각의 조화',
    materials: ['고급 원목', '몰딩', '대리석', '황동', '벨벳', '실크'],
    colorPalette: ['#F5E6D3', '#2C3E50', '#D4AF37', '#FFFFFF', '#8B4513'],
    gradeWeights: { basic: 0.1, standard: 0.25, argen: 0.35, premium: 0.3 },
    keywords: ['클래식', '우아', '품격', '전통', '모던', '엘레강스'],
    preferenceWeights: {
      space_sense: 7,           // 여유로운
      sensory_sensitivity: 7,   // 섬세함
      cleaning_preference: 5,   // 보통
      organization_habit: 7,    // 정돈된
      family_composition: 5,    // 보통
      health_factors: 5,        // 보통
      budget_sense: 7,          // 중상
      color_preference: 6,      // 클래식 톤
      lighting_preference: 5,   // 샹들리에
      home_purpose: 6,          // 접대/생활
      discomfort_factors: 7,    // 품질 중시
      activity_flow: 6,         // 우아한 동선
      life_routine: 6,          // 규칙적
      sleep_pattern: 6,         // 보통
      hobby_lifestyle: 7        // 문화/예술
    }
  }
};

// 스타일 ID로 프리셋 조회
export function getStylePreset(styleId: InteriorStyle): StylePreset {
  return stylePresets[styleId];
}

// 모든 스타일 목록 조회
export function getAllStyles(): StylePreset[] {
  return Object.values(stylePresets);
}

// 스타일 한글 이름 조회
export function getStyleNameKo(styleId: InteriorStyle): string {
  return stylePresets[styleId].nameKo;
}
































