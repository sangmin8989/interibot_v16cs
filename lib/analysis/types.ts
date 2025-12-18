import { PREFERENCE_CATEGORIES, PreferenceCategory, Question } from './questions/types';

export type AnalysisMode = 'quick' | 'vibe' | 'standard' | 'deep';

export type AnswerValue = string | number | string[] | null;

// ============================================
// 9가지 인테리어 스타일 타입
// ============================================
export type InteriorStyle = 
  | 'minimal-modern'      // 모던 미니멀
  | 'natural-wood'        // 내추럴 우드
  | 'modern-luxury'       // 모던 럭셔리
  | 'cozy-home'           // 코지 홈
  | 'practical-family'    // 실용 패밀리
  | 'hotel-mood'          // 호텔 무드
  | 'scandinavian'        // 스칸디나비안
  | 'industrial'          // 인더스트리얼
  | 'classic-modern';     // 클래식 모던

// ============================================
// 스타일 추천 결과 인터페이스
// ============================================
export interface StyleRecommendation {
  primaryStyle: InteriorStyle;           // 메인 추천 스타일
  secondaryStyle: InteriorStyle | null;  // 보조 스타일 (유사도 높을 때)
  confidence: number;                    // 매칭 신뢰도 (0~100)
  materials: string[];                   // 추천 자재
  colorPalette: string[];                // 추천 색상 팔레트
  gradeWeights: {                        // 등급별 가중치
    basic: number;
    standard: number;
    argen: number;
    premium: number;
  };
  keywords: string[];                    // 스타일 키워드
  description: string;                   // 스타일 설명
}

export interface SpaceInfo {
  housingType?: string | null;
  region?: string | null;
  size?: number | string | null;
  roomCount?: number | string | null;
  bathroomCount?: number | string | null;
  // 확장된 필드 (spaceInfoStore와 호환)
  pyeong?: number;
  squareMeter?: number;
  rooms?: number;
  bathrooms?: number;
  // 가족 구성 정보
  familySizeRange?: string | null;  // '1인', '2인', '3~4인', '5인 이상' 또는 '1-2', '2-3' 등
  ageRanges?: string[];  // ['baby', 'child', 'teen', 'adult', 'senior']
  lifestyleTags?: string[];  // ['hasPets', 'hasElderly', 'hasPregnant', ...]
  totalPeople?: number;
  additionalNotes?: string;  // 추가 정보 (자유 입력)
  // 거주 목적 및 기간
  livingPurpose?: '실거주' | '매도준비' | '임대' | '입력안함' | string | null;
  livingYears?: number | null;
}

export interface VibeInput {
  mbti?: string;
  bloodType?: string;
  zodiac?: string;
}

export interface AnalysisRequest {
  mode: AnalysisMode;
  preferences: Record<string, AnswerValue>;
  answeredCount: number;
  completionRate: number;
  timestamp: string;
  spaceInfo?: SpaceInfo | null;
  selectedAreas?: string[] | null;
  vibeInput?: VibeInput | null;
}

export interface VibeProfile {
  type: string;
  archetype: string;
  keywords: string[];
  dominantColor: string;
  description: string;
}

export type PreferenceScores = Record<PreferenceCategory, number>;

export interface AnalysisResult {
  analysisId: string;
  mode: AnalysisMode;
  summary: string;
  answeredCount: number;
  completionRate: number;
  preferences: PreferenceScores;
  vibeProfile: VibeProfile;
  recommendations: string[];
  spaceInfo?: SpaceInfo | null;
  selectedAreas?: string[] | null;
  vibeInput?: VibeInput | null;
  createdAt: string;
}

export type { Question, PreferenceCategory };
export { PREFERENCE_CATEGORIES };
