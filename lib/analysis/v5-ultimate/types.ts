import type { ArgenGrade } from '@/lib/data/gradeSpecs';

// 공간 유형
export type SpaceType = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'study' | 'entrance';

// 스타일 유형
export type StyleType = 'modern' | 'natural' | 'minimal' | 'classic' | 'scandinavian' | 'vintage';

// 가구 밀도
export type FurnitureDensity = 'sparse' | 'moderate' | 'dense';

// 조명 유형
export type LightingType = 'natural' | 'indirect' | 'direct' | 'mixed';

// 이미지 유형
export type ImageType = 'current' | 'dream' | 'inspiration';

// 스타일 태그
export type StyleTag = 
  | 'MODERN_LOVER' | 'NATURAL_LOVER' | 'MINIMAL_LOVER' 
  | 'CLASSIC_LOVER' | 'SCANDINAVIAN_LOVER' | 'VINTAGE_LOVER';

// 생활 태그
export type LifestyleTag = 
  | 'HAS_CHILD' | 'HAS_INFANT' | 'HAS_TEEN'
  | 'HAS_PET_DOG' | 'HAS_PET_CAT'
  | 'REMOTE_WORK' | 'BOOKWORM' | 'PLANT_LOVER'
  | 'COOKING_LOVER' | 'GUEST_FREQUENT';

// 니즈 태그
export type NeedTag = 
  | 'STORAGE_NEED' | 'LIGHTING_NEED' | 'CLEANING_SYSTEM_NEED'
  | 'SOUNDPROOF_NEED' | 'SAFETY_NEED' | 'VENTILATION_NEED';

// 상태 태그
export type StateTag = 
  | 'WELL_ORGANIZED' | 'NEEDS_ORGANIZATION'
  | 'SPACE_EFFICIENT' | 'SPACE_WASTED';

// 예산 태그
export type BudgetTag =
  | 'BUDGET_STRICT' | 'BUDGET_MODERATE' | 'BUDGET_FLEXIBLE'
  | 'VALUE_PROTECTION';

// 전체 태그
export type AllTags = StyleTag | LifestyleTag | NeedTag | StateTag | BudgetTag;

// 사진 분석 결과
export interface PhotoAnalysisResult {
  spaceType: SpaceType;
  detectedStyle: StyleType;
  colorPalette: string[];
  organizationScore: number;
  furnitureDensity: FurnitureDensity;
  lightingType: LightingType;
  inferredTags: AllTags[];
  hiddenNeeds: string[];
  lifestyleHints: string[];
  confidence: number;
}

// 대화 메시지
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// 대화 분석 결과
export interface ChatAnalysisResult {
  extractedTags: AllTags[];
  cleaningStyle: 'diligent' | 'moderate' | 'lazy' | 'system_needed';
  spaceInterests: SpaceType[];
  budgetRange: { min: number; max: number } | null;
  familyInfo: {
    totalMembers: number;
    hasChild: boolean;
    hasElderly: boolean;
    hasPet: 'dog' | 'cat' | 'both' | 'none';
  } | null;
  hiddenNeeds: string[];
  confidence: number;
}

// DNA 유형
export type DNAType = 
  | 'fox' | 'lion' | 'bear' | 'owl' | 'dolphin' | 'swan'
  | 'bee' | 'butterfly' | 'turtle' | 'rabbit' | 'eagle' | 'wolf';

// DNA 유형 정보
export interface DNATypeInfo {
  type: DNAType;
  emoji: string;
  name: string;
  title: string;
  description: string;
  traits: string[];
  recommendedStyles: StyleType[];
  prioritySpaces: SpaceType[];
}

// 지표 점수
export interface TraitScores {
  spaceEfficiency: number;
  cleaningSensitivity: number;
  visualSensitivity: number;
  familyInfluence: number;
  budgetFlexibility: number;
  styleCommitment: number;
  flowImportance: number;
  independencePreference: number;
}

// 숨은 니즈
export interface HiddenNeed {
  need: string;
  source: 'photo' | 'chat' | 'behavior' | 'statistics';
  confidence: number;
  suggestion: string;
}

// 투자 가치 점수 (기존 유지)
export interface ValueScores {
  homeValueIndex: number; // 집값 방어지수 (30~100)
  lifeQualityScore: number; // 생활개선 점수 (30~100)
  // 6대 지수 (optional)
  spaceEfficiency?: number; // 공간 효율지수 (40~100)
  maintenance?: number; // 유지관리 용이도 (40~100)
  energy?: number; // 에너지 효율지수 (30~100)
  investment?: number; // 투자 효율지수 (40~100)
}

// 6대 지수 완전체 (신규)
export interface FullValueScores {
  homeValueIndex: number;
  lifeQualityScore: number;
  spaceEfficiency: number;
  maintenance: number;
  energy: number;
  investment: number;
  total: number;
}

// 6대 지수 입력 (신규)
export interface SixIndexInput {
  housingType: string;
  pyeong: number;
  familySize: number;
  grade: ArgenGrade;
  selectedProcesses: string[];
  traits: string[];
  budget: number;
  additionalOptions?: string[];
}

// 6대 지수 설명 (근거 패키지 강제 구조)
export interface IndexExplanation {
  score: number;
  topFactors: string[];      // 영향을 준 답변 TOP3
  assumption: string;        // 계산 가정
  improvement: string[];     // 개선 포인트
  confidence?: number;       // 신뢰도 (0~1, 선택)
}

export interface FullIndexExplanations {
  homeValue: IndexExplanation;
  lifeQuality: IndexExplanation;
  spaceEfficiency: IndexExplanation;
  maintenance: IndexExplanation;
  energy: IndexExplanation;
  investment: IndexExplanation;
}

// 통합 분석 결과
export interface FusionAnalysisResult {
  photoAnalysis: PhotoAnalysisResult | null;
  chatAnalysis: ChatAnalysisResult | null;
  finalTags: AllTags[];
  traitScores: TraitScores;
  dnaType: DNATypeInfo;
  dnaMatchScore: number;
  hiddenNeeds: HiddenNeed[];
  valueScores?: ValueScores; // 투자 가치 점수 (선택적)
  fullReport?: import('@/lib/analysis/report').ReportResult; // 6대 지수 전체 리포트 (선택적)
  analysisId: string;
  createdAt: string;
  overallConfidence: number;
  decisionEnvelope?: import('@/lib/decision/envelope').DecisionEnvelope; // Decision Engine 결과
}

// V5 Ultimate 스토어 상태
export interface V5UltimateState {
  sessionId: string | null;
  currentStep:
    | 'quickDiagnosis'  // 3초 진단 (첫 화면)
    | 'spaceInfo'       // 집 정보 입력
    | 'analyzing';      // 분석 중 (완료 후 바로 공정 선택으로 이동)
  uploadedPhoto: {
    url: string;
    file: File | null;
    analysis: PhotoAnalysisResult | null;
  } | null;
  chatHistory: ChatMessage[];
  chatAnalysis: ChatAnalysisResult | null;
  fusionResult: FusionAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

// API 요청/응답 타입
export interface PhotoAnalyzeRequest {
  imageBase64: string;
  imageType: ImageType;
}

export interface PhotoAnalyzeResponse {
  success: boolean;
  analysis?: PhotoAnalysisResult;
  error?: string;
}

export interface ChatAnalyzeRequest {
  messages: ChatMessage[];
  photoAnalysis: PhotoAnalysisResult | null;
}

export interface ChatAnalyzeResponse {
  success: boolean;
  analysis?: ChatAnalysisResult;
  isComplete?: boolean;
  error?: string;
}

export interface FusionAnalyzeRequest {
  photoAnalysis: PhotoAnalysisResult | null;
  chatAnalysis: ChatAnalysisResult | null;
}

export interface FusionAnalyzeResponse {
  success: boolean;
  result?: FusionAnalysisResult;
  error?: string;
}





