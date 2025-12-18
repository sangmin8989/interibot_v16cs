/**
 * AI 모델 설정 파일
 * 여러 모델을 선택해서 사용할 수 있도록 설정합니다.
 */

// OpenAI 텍스트 생성 모델 목록
export const TEXT_MODELS = {
  // 기본 모델 (빠르고 저렴)
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: '빠르고 경제적인 기본 모델',
    maxTokens: 4096,
    cost: 'low',
  },
  // 고성능 모델
  'gpt-4o': {
    name: 'GPT-4o',
    description: '최신 고성능 모델 (추천)',
    maxTokens: 128000,
    cost: 'medium',
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    description: 'GPT-4o의 경량 버전',
    maxTokens: 128000,
    cost: 'low',
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    description: '고성능 모델',
    maxTokens: 128000,
    cost: 'high',
  },
  'gpt-4': {
    name: 'GPT-4',
    description: '프리미엄 모델',
    maxTokens: 8192,
    cost: 'high',
  },
} as const

// OpenAI 이미지 생성 모델 목록
export const IMAGE_MODELS = {
  'dall-e-3': {
    name: 'DALL-E 3',
    description: '최신 고품질 이미지 생성 모델',
    sizes: ['1024x1024', '1792x1024', '1024x1792'] as const,
    quality: ['standard', 'hd'] as const,
  },
  'dall-e-2': {
    name: 'DALL-E 2',
    description: '기본 이미지 생성 모델',
    sizes: ['256x256', '512x512', '1024x1024'] as const,
    quality: ['standard'] as const,
  },
} as const

// 모델 타입
export type TextModelKey = keyof typeof TEXT_MODELS
export type ImageModelKey = keyof typeof IMAGE_MODELS

/**
 * 환경 변수에서 모델 선택
 * .env.local 파일에 설정하면 해당 모델을 사용합니다.
 * 설정하지 않으면 기본값을 사용합니다.
 */
export function getTextModel(): TextModelKey {
  // 환경 변수에서 모델 선택 (예: OPENAI_TEXT_MODEL=gpt-4o)
  const envModel = process.env.OPENAI_TEXT_MODEL as TextModelKey | undefined
  
  if (envModel && envModel in TEXT_MODELS) {
    return envModel
  }
  
  // 기본값: gpt-4o-mini (성능과 비용의 균형)
  return 'gpt-4o-mini'
}

/**
 * 이미지 생성 모델 선택
 */
export function getImageModel(): ImageModelKey {
  const envModel = process.env.OPENAI_IMAGE_MODEL as ImageModelKey | undefined
  
  if (envModel && envModel in IMAGE_MODELS) {
    return envModel
  }
  
  // 기본값: dall-e-3
  return 'dall-e-3'
}

/**
 * 특정 용도별 모델 선택
 */
export const MODEL_PRESETS = {
  // 빠른 응답이 필요한 경우 (챗봇, 간단한 분석)
  fast: 'gpt-3.5-turbo' as TextModelKey,
  
  // 일반적인 용도 (추천)
  balanced: 'gpt-4o-mini' as TextModelKey,
  
  // 고품질 분석이 필요한 경우 (상세 분석, 복잡한 추천)
  quality: 'gpt-4o' as TextModelKey,
  
  // 최고 품질 (중요한 결정, 프리미엄 서비스)
  premium: 'gpt-4-turbo' as TextModelKey,
} as const

/**
 * 용도별 모델 가져오기
 */
export function getModelForPurpose(purpose: keyof typeof MODEL_PRESETS): TextModelKey {
  // 환경 변수로 오버라이드 가능
  const envModel = process.env.OPENAI_TEXT_MODEL as TextModelKey | undefined
  if (envModel && envModel in TEXT_MODELS) {
    return envModel
  }
  
  return MODEL_PRESETS[purpose]
}























