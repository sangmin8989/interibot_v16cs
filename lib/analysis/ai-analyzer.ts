/**
 * AI 기반 성향 분석기 (V2)
 * 
 * 기능:
 * - 고객 응답을 분석하여 인테리어 성향 파악
 * - 디자인 스타일, 색상, 분위기 추천
 * - 공정별 세부 옵션 추천
 * - 견적에 반영할 성향 점수 생성
 */

import OpenAI from 'openai'
import type { PreferenceScores } from './types'
import type { TraitPreference } from '@/lib/estimate/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ============================================================
// 타입 정의
// ============================================================

export interface AnalysisInput {
  answers: Record<string, unknown>
  spaceInfo?: {
    size?: number
    roomCount?: number
    bathroomCount?: number
    housingType?: 'new' | 'old'
    familySizeRange?: string
    ageRanges?: string[]
    lifestyleTags?: string[]
  }
  vibeData?: {
    mbti?: string
    bloodType?: string
    zodiac?: string
  }
}

export interface AIAnalysisResult {
  // 성향 점수 (1-5)
  traits: TraitPreference
  
  // 스타일 추천
  style: {
    primary: string        // 주요 스타일 (모던, 클래식 등)
    secondary: string      // 보조 스타일
    mood: string           // 분위기 (따뜻한, 시원한 등)
  }
  
  // 색상 추천
  colors: {
    main: string           // 주색상
    accent: string         // 포인트 색상
    avoid: string          // 피해야 할 색상
  }
  
  // 공간별 추천
  spaceRecommendations: {
    kitchen?: KitchenRecommendation
    bathroom?: BathroomRecommendation
    living?: LivingRecommendation
    bedroom?: BedroomRecommendation
  }
  
  // 예산 배분 추천
  budgetAllocation: {
    주방: number      // 전체 대비 %
    욕실: number
    거실: number
    침실: number
    기타: number
  }
  
  // 종합 설명
  summary: string
  
  // 신뢰도 (0-1)
  confidence: number
}

export interface KitchenRecommendation {
  형태: '일자' | 'ㄱ자' | 'ㄷ자' | '아일랜드' | 'ㄱ자+아일랜드'
  상판재질: string
  수납중점: boolean
  설비등급: 'basic' | 'standard' | 'premium'
  reason: string
}

export interface BathroomRecommendation {
  스타일: '모던' | '클래식' | '미니멀' | '호텔식'
  욕조필요: boolean
  비데등급: 'basic' | 'premium'
  타일사이즈: 'small' | 'medium' | 'large'
  reason: string
}

export interface LivingRecommendation {
  간접조명: boolean
  아트월: boolean
  붙박이장: boolean
  reason: string
}

export interface BedroomRecommendation {
  드레스룸: boolean
  붙박이장크기: 'small' | 'medium' | 'large' | 'full'
  조명타입: 'basic' | 'indirect' | 'smart'
  reason: string
}

// ============================================================
// 메인 분석 함수
// ============================================================

export async function analyzeWithAI(input: AnalysisInput): Promise<AIAnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[AI Analyzer] API 키 없음 - 폴백 결과 반환')
    return getFallbackResult(input)
  }

  try {
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(input)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 2000,
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    
    return normalizeResult(result, input)
  } catch (error) {
    console.error('[AI Analyzer] 오류:', error)
    return getFallbackResult(input)
  }
}

// ============================================================
// 프롬프트 생성
// ============================================================

function buildSystemPrompt(): string {
  return `당신은 대한민국 최고의 인테리어 심리 분석 전문가입니다.
10,000건 이상의 고객 상담 경험을 바탕으로, 고객의 답변에서 숨겨진 니즈를 파악합니다.

## 당신의 역할
1. 고객 응답에서 라이프스타일과 성향을 정확히 분석
2. 분석 결과를 바탕으로 인테리어 스타일/색상 추천
3. 공간별 세부 옵션 추천
4. 예산 배분 제안

## 분석 기준

### 성향 점수 (1-5)
- 요리빈도: 1(거의 안함) ~ 5(매일 요리)
- 정리정돈: 1(자유로운) ~ 5(완벽주의)
- 청소성향: 1(최소한) ~ 5(매일 청소)
- 조명취향: 1(밝은 조명) ~ 5(은은한 조명)
- 예산감각: 1(가성비) ~ 5(프리미엄)
- 수납중요도: 1(최소) ~ 5(최대)
- 기술선호도: 1(전통적) ~ 5(스마트홈)

### 스타일 유형
- 모던: 깔끔, 직선, 무채색 기반
- 미니멀: 군더더기 없는, 공간 중심
- 내추럴: 자연 소재, 우드톤
- 클래식: 우아함, 몰딩, 디테일
- 북유럽: 화이트 베이스, 원목
- 인더스트리얼: 노출, 빈티지
- 럭셔리: 고급 자재, 디자이너 가구

### 색상 체계
- 주색상: 가장 많은 면적을 차지하는 색상
- 포인트: 악센트가 되는 색상
- 피해야 할 색상: 고객 성향과 맞지 않는 색상

## 출력 형식 (JSON)
{
  "traits": {
    "요리빈도": 3,
    "정리정돈": 4,
    "청소성향": 3,
    "조명취향": 4,
    "예산감각": 3,
    "수납중요도": 4,
    "기술선호도": 3,
    "디자인선호": "모던",
    "색상선호": "화이트"
  },
  "style": {
    "primary": "모던",
    "secondary": "미니멀",
    "mood": "차분하고 세련된"
  },
  "colors": {
    "main": "화이트+라이트그레이",
    "accent": "네이비 블루",
    "avoid": "비비드 컬러"
  },
  "spaceRecommendations": {
    "kitchen": {
      "형태": "ㄱ자",
      "상판재질": "엔지니어드스톤",
      "수납중점": true,
      "설비등급": "standard",
      "reason": "요리를 자주 하시고 정리정돈을 중요시하여..."
    },
    "bathroom": {
      "스타일": "미니멀",
      "욕조필요": false,
      "비데등급": "premium",
      "타일사이즈": "large",
      "reason": "청결을 중시하고 넓어 보이는 효과를 위해..."
    },
    "living": {
      "간접조명": true,
      "아트월": true,
      "붙박이장": false,
      "reason": "은은한 분위기를 선호하시고..."
    },
    "bedroom": {
      "드레스룸": true,
      "붙박이장크기": "large",
      "조명타입": "indirect",
      "reason": "수납 공간을 중시하시고..."
    }
  },
  "budgetAllocation": {
    "주방": 30,
    "욕실": 25,
    "거실": 20,
    "침실": 15,
    "기타": 10
  },
  "summary": "3줄 이내의 종합 분석 설명",
  "confidence": 0.85
}`
}

function buildUserPrompt(input: AnalysisInput): string {
  let prompt = `## 고객 분석 요청\n\n`

  // 응답 데이터
  if (input.answers && Object.keys(input.answers).length > 0) {
    prompt += `### 고객 응답 데이터\n`
    prompt += `\`\`\`json\n${JSON.stringify(input.answers, null, 2)}\n\`\`\`\n\n`
  }

  // 공간 정보
  if (input.spaceInfo) {
    prompt += `### 주거 정보\n`
    prompt += `- 평수: ${input.spaceInfo.size || '미지정'}평\n`
    prompt += `- 방 개수: ${input.spaceInfo.roomCount || '미지정'}개\n`
    prompt += `- 욕실 개수: ${input.spaceInfo.bathroomCount || '미지정'}개\n`
    prompt += `- 주거 형태: ${input.spaceInfo.housingType === 'new' ? '신축' : '구축'}\n`
    
    if (input.spaceInfo.familySizeRange) {
      prompt += `- 가족 규모: ${input.spaceInfo.familySizeRange}\n`
    }
    if (input.spaceInfo.ageRanges?.length) {
      prompt += `- 연령대: ${input.spaceInfo.ageRanges.join(', ')}\n`
    }
    if (input.spaceInfo.lifestyleTags?.length) {
      prompt += `- 라이프스타일: ${input.spaceInfo.lifestyleTags.join(', ')}\n`
    }
    prompt += `\n`
  }

  // Vibe 데이터
  if (input.vibeData) {
    prompt += `### 성격 유형 정보\n`
    if (input.vibeData.mbti) prompt += `- MBTI: ${input.vibeData.mbti}\n`
    if (input.vibeData.bloodType) prompt += `- 혈액형: ${input.vibeData.bloodType}\n`
    if (input.vibeData.zodiac) prompt += `- 별자리: ${input.vibeData.zodiac}\n`
    prompt += `\n`
  }

  prompt += `### 요청사항
위 정보를 종합 분석하여:
1. 성향 점수 (1-5) 산출
2. 인테리어 스타일 및 색상 추천
3. 공간별 세부 옵션 추천
4. 예산 배분 제안
5. 종합 분석 요약

JSON 형식으로 정확하게 출력해주세요.`

  return prompt
}

// ============================================================
// 결과 정규화
// ============================================================

function normalizeResult(result: any, input: AnalysisInput): AIAnalysisResult {
  // 기본값
  const defaultResult = getFallbackResult(input)

  return {
    traits: {
      요리빈도: clampTrait(result.traits?.요리빈도),
      정리정돈: clampTrait(result.traits?.정리정돈),
      청소성향: clampTrait(result.traits?.청소성향),
      조명취향: clampTrait(result.traits?.조명취향),
      예산감각: clampTrait(result.traits?.예산감각),
      수납중요도: clampTrait(result.traits?.수납중요도),
      기술선호도: clampTrait(result.traits?.기술선호도),
      디자인선호: result.traits?.디자인선호 || '모던',
      색상선호: result.traits?.색상선호 || '화이트',
    },
    style: {
      primary: result.style?.primary || defaultResult.style.primary,
      secondary: result.style?.secondary || defaultResult.style.secondary,
      mood: result.style?.mood || defaultResult.style.mood,
    },
    colors: {
      main: result.colors?.main || defaultResult.colors.main,
      accent: result.colors?.accent || defaultResult.colors.accent,
      avoid: result.colors?.avoid || defaultResult.colors.avoid,
    },
    spaceRecommendations: result.spaceRecommendations || defaultResult.spaceRecommendations,
    budgetAllocation: result.budgetAllocation || defaultResult.budgetAllocation,
    summary: result.summary || defaultResult.summary,
    confidence: typeof result.confidence === 'number' ? result.confidence : 0.7,
  }
}

function clampTrait(value: unknown): 1 | 2 | 3 | 4 | 5 {
  if (typeof value !== 'number') return 3
  if (value < 1) return 1
  if (value > 5) return 5
  return Math.round(value) as 1 | 2 | 3 | 4 | 5
}

// ============================================================
// 폴백 결과
// ============================================================

function getFallbackResult(input: AnalysisInput): AIAnalysisResult {
  // 입력 데이터에서 힌트 추출
  const hasKids = input.spaceInfo?.ageRanges?.some(age => 
    age.includes('child') || age.includes('baby') || age.includes('kid')
  )
  const isLargeFamily = input.spaceInfo?.familySizeRange?.includes('4') || 
                        input.spaceInfo?.familySizeRange?.includes('5')

  return {
    traits: {
      요리빈도: 3,
      정리정돈: isLargeFamily ? 4 : 3,
      청소성향: hasKids ? 4 : 3,
      조명취향: 3,
      예산감각: 3,
      수납중요도: isLargeFamily ? 4 : 3,
      기술선호도: 3,
      디자인선호: '모던',
      색상선호: '화이트',
    },
    style: {
      primary: '모던',
      secondary: hasKids ? '내추럴' : '미니멀',
      mood: '깔끔하고 실용적인',
    },
    colors: {
      main: '화이트+라이트그레이',
      accent: hasKids ? '파스텔 블루' : '네이비',
      avoid: '비비드 레드',
    },
    spaceRecommendations: {
      kitchen: {
        형태: 'ㄱ자',
        상판재질: '엔지니어드스톤',
        수납중점: true,
        설비등급: 'standard',
        reason: '일반적으로 가장 효율적인 주방 구성입니다.',
      },
      bathroom: {
        스타일: '모던',
        욕조필요: false,
        비데등급: 'basic',
        타일사이즈: 'medium',
        reason: '관리가 용이한 표준 구성입니다.',
      },
      living: {
        간접조명: true,
        아트월: false,
        붙박이장: false,
        reason: '은은한 분위기와 효율적인 공간 활용을 위한 구성입니다.',
      },
      bedroom: {
        드레스룸: input.spaceInfo?.roomCount ? input.spaceInfo.roomCount >= 3 : false,
        붙박이장크기: 'medium',
        조명타입: 'basic',
        reason: '기본적인 수납과 조명 구성입니다.',
      },
    },
    budgetAllocation: {
      주방: 30,
      욕실: 25,
      거실: 20,
      침실: 15,
      기타: 10,
    },
    summary: '기본 분석 결과입니다. 더 정확한 분석을 위해 추가 질문에 답변해주세요.',
    confidence: 0.5,
  }
}

// ============================================================
// 성향 점수를 견적 입력 형식으로 변환
// ============================================================

export function convertToEstimateTraits(analysis: AIAnalysisResult): TraitPreference {
  return {
    요리빈도: analysis.traits.요리빈도,
    정리정돈: analysis.traits.정리정돈,
    청소성향: analysis.traits.청소성향,
    조명취향: analysis.traits.조명취향,
    예산감각: analysis.traits.예산감각,
    수납중요도: analysis.traits.수납중요도,
    기술선호도: analysis.traits.기술선호도,
    디자인선호: analysis.traits.디자인선호,
    색상선호: analysis.traits.색상선호,
  }
}

// ============================================================
// AI 분석 결과를 기반으로 견적 옵션 생성
// ============================================================

export function generateEstimateOptions(analysis: AIAnalysisResult) {
  const { traits, spaceRecommendations } = analysis

  // 성향 기본값 (undefined 방지)
  const 수납중요도 = traits.수납중요도 ?? 3
  const 요리빈도 = traits.요리빈도 ?? 3
  const 청소성향 = traits.청소성향 ?? 3
  const 조명취향 = traits.조명취향 ?? 3
  const 기술선호도 = traits.기술선호도 ?? 3
  const 예산감각 = traits.예산감각 ?? 3

  return {
    주방옵션: spaceRecommendations.kitchen ? {
      형태: spaceRecommendations.kitchen.형태,
      상판재질: spaceRecommendations.kitchen.상판재질 === '엔지니어드스톤' 
        ? '엔지니어드스톤' 
        : spaceRecommendations.kitchen.상판재질 === '세라믹'
          ? '세라믹'
          : '인조대리석',
      냉장고장: 수납중요도 >= 4,
      키큰장: 수납중요도 >= 4,
      설비: {
        쿡탑: 요리빈도 >= 4 ? '인덕션' : '가스레인지',
        식기세척기: 청소성향 >= 4,
        후드: 요리빈도 >= 4 ? '매입형' : '기본',
      },
      상부장LED: 조명취향 >= 4,
    } : undefined,

    욕실옵션: spaceRecommendations.bathroom ? {
      스타일: spaceRecommendations.bathroom.스타일,
      욕조: spaceRecommendations.bathroom.욕조필요,
      샤워부스: !spaceRecommendations.bathroom.욕조필요,
      비데: true,
      비데등급: spaceRecommendations.bathroom.비데등급,
      벽타일사이즈: spaceRecommendations.bathroom.타일사이즈 === 'large' 
        ? '대형(800x800)' 
        : spaceRecommendations.bathroom.타일사이즈 === 'small'
          ? '소형(300x300)'
          : '중형(600x600)',
    } : undefined,

    전기옵션: {
      조명타입: 조명취향 >= 4 ? ['간접조명', '다운라이트'] : ['다운라이트'],
      디밍가능: 조명취향 >= 4,
      스마트홈: 기술선호도 >= 4,
    },

    도배옵션: {
      벽지종류: 예산감각 >= 4 ? '수입벽지' : '실크',
    },
  }
}

