// app/api/analysis/submit/route.ts
// 성향 분석 제출 API
// 1) V2 규칙 기반 엔진으로 정밀 분석
// 2) OpenAI로 자연어 성향 리포트 생성 (aiReport)

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

import { buildAnalysisResult } from '@/lib/analysis/engine'
import { buildAnalysisResultV2 } from '@/lib/analysis/engine-v2'
import { AnalysisMode, AnalysisRequest } from '@/lib/analysis/types'

// V2 엔진 사용 여부 (true로 설정하면 새 분석 로직 사용)
const USE_V2_ENGINE = true

// OpenAI 클라이언트
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// AI가 만들어 줄 성향 리포트 타입
export interface AIAnalysisReport {
  // 한 줄 요약 (타이틀)
  title: string
  // 전체 요약 (2~3단락, 마크다운 허용)
  overview: string
  // 고객 성향 키워드 (예: '정리정돈', '조명', '호텔식', '가족 중심')
  personalityKeywords: string[]
  // 인테리어 스타일/분위기 키워드 (예: '모던', '북유럽', '우드톤', '따뜻한 조명')
  styleKeywords: string[]
  // 우선 투자할 공간 목록
  prioritySpaces: {
    spaceId: string
    label: string
    reason: string
  }[]
  // 우선 고려할 공정 목록
  priorityProcesses: {
    process: string
    label: string
    reason: string
  }[]
  // 예산/등급 관련 요약 (예: "표준~아르젠 사이 추천")
  budgetSummary: string
  // 고객에게 보여줄 다음 액션 추천 문장들
  nextActions: string[]
  // ✅ 추가: 고객이 놓친 부분 (핵심 가치!)
  missedPoints?: {
    title: string  // 예: "장기적으로 고려해야 할 부분"
    items: {
      point: string  // 예: "아이가 커지면 거실 공간 사용이 달라질 수 있어요"
      impact: string  // 예: "5년 후에도 지금과 같은 방식으로 사용하실 것 같으신가요?"
      recommendation: string  // 예: "유연한 공간 구성과 수납 시스템을 고려해보세요"
    }[]
  }
}

// spaceInfo 타입 정의
interface SpaceInfoType {
  housingType?: string
  pyeong?: number
  squareMeter?: number
  rooms?: number
  bathrooms?: number
  familySizeRange?: string
  ageRanges?: string[]
  lifestyleTags?: string[]
  budget?: string
  livingPurpose?: string
  livingYears?: number
  totalPeople?: number
}

// vibeInput 타입 정의
interface VibeInputType {
  mbti?: string
  bloodType?: string
  birthdate?: string
}

// 고객/집 정보를 자연어로 요약 (프롬프트용)
function buildCustomerSummary(payload: AnalysisRequest): string {
  const spaceInfo = payload.spaceInfo as SpaceInfoType | null
  const mode = payload.mode
  const vibeInput = payload.vibeInput as VibeInputType | null
  const selectedAreas = (payload.selectedAreas ?? []) as string[]

  const lines: string[] = []

  lines.push(`## 고객 정보 요약\n`)

  // 기본 정보
  if (spaceInfo) {
    if (spaceInfo.housingType) {
      lines.push(`- 주거형태: ${spaceInfo.housingType}`)
    }
    if (spaceInfo.pyeong) {
      lines.push(`- 평수: ${spaceInfo.pyeong}평`)
    }
    if (spaceInfo.rooms) {
      lines.push(`- 방 개수: ${spaceInfo.rooms}개`)
    }
    if (spaceInfo.bathrooms) {
      lines.push(`- 욕실 개수: ${spaceInfo.bathrooms}개`)
    }
  }

  // 가족 구성 정보
  if (spaceInfo) {
    if (spaceInfo.familySizeRange || spaceInfo.totalPeople) {
      const familyInfo = spaceInfo.totalPeople 
        ? `${spaceInfo.totalPeople}명 가구`
        : spaceInfo.familySizeRange || ''
      lines.push(`- 가족 구성: ${familyInfo}`)
    }
    if (spaceInfo.ageRanges && spaceInfo.ageRanges.length > 0) {
      const ageLabels: Record<string, string> = {
        baby: '영유아',
        child: '어린이',
        teen: '청소년',
        adult: '성인',
        senior: '고령자'
      }
      const ageText = spaceInfo.ageRanges.map(age => ageLabels[age] || age).join(', ')
      lines.push(`- 연령대: ${ageText}`)
    }
    if (spaceInfo.lifestyleTags && spaceInfo.lifestyleTags.length > 0) {
      const lifestyleLabels: Record<string, string> = {
        hasPets: '반려동물',
        hasElderly: '고령자',
        hasPregnant: '임신',
        hasDisabledMember: '장애인',
        hasShiftWorker: '교대근무',
        hasTeen: '청소년'
      }
      const lifestyleText = spaceInfo.lifestyleTags
        .map(tag => lifestyleLabels[tag] || tag)
        .join(', ')
      lines.push(`- 생활 특성: ${lifestyleText}`)
    }
  }

  // 거주 목적 및 기간
  if (spaceInfo) {
    if (spaceInfo.livingPurpose) {
      lines.push(`- 거주 목적: ${spaceInfo.livingPurpose}`)
    }
    if (spaceInfo.livingYears) {
      lines.push(`- 예상 거주 기간: ${spaceInfo.livingYears}년`)
    }
  }

  // 선택된 공간
  if (selectedAreas && selectedAreas.length > 0) {
    const spaceLabels: Record<string, string> = {
      living: '거실',
      kitchen: '주방',
      masterBedroom: '안방',
      bathroom: '욕실',
      masterBathroom: '안방욕실',
      commonBathroom: '공용욕실',
      entrance: '현관',
      balcony: '발코니',
      dressRoom: '드레스룸',
      room1: '방1',
      room2: '방2',
      room3: '방3'
    }
    const spaceText = selectedAreas
      .map(area => spaceLabels[area] || area)
      .join(', ')
    lines.push(`- 선택한 시공 공간: ${spaceText}`)
  }

  // 성향 분석 모드
  const modeLabels: Record<string, string> = {
    quick: '빠르게',
    standard: '표준',
    deep: '깊이',
    vibe: '바이브'
  }
  lines.push(`- 분석 모드: ${modeLabels[mode] || mode}`)

  // 바이브 정보
  if (vibeInput) {
    if (vibeInput.mbti) lines.push(`- MBTI: ${vibeInput.mbti}`)
    if (vibeInput.bloodType) lines.push(`- 혈액형: ${vibeInput.bloodType}형`)
    if (vibeInput.birthdate) lines.push(`- 생년월일: ${vibeInput.birthdate}`)
  }

  return lines.join('\n')
}

// V2 결과 타입 정의
interface AnalysisResultV2Type {
  mode: string
  summary: string
  summaryExplanation?: string
  recommendations: string[]
  spaceRanking?: { spaceId: string; score: number }[]
  processRanking?: { process: string; score: number }[]
  styleMatch?: { style: string; score: number }[]
  colorPalette?: string[]
  budgetRecommendation?: string
  estimateHints?: {
    prioritySpaces: string[]
    priorityProcesses: string[]
    suggestedGrade: string
    specialRequirements: string[]
  }
  vibeProfile?: {
    type: string
    archetype: string
    keywords: string[]
    dominantColor: string
    description: string
  }
  // ✅ 점수 정보 추가
  homeValueScore?: {
    score: number
    reason: string
    investmentValue: string
  }
  lifestyleScores?: {
    storage: number
    cleaning: number
    flow: number
    comment: string
  }
  preferences?: Record<string, number>
}

// 엔진 V2 결과를 AI에게 넘기기 좋은 요약 형태로 정리
function buildEngineSummaryForAI(result: AnalysisResultV2Type): string {
  // 너무 많은 데이터를 보내면 토큰이 늘어나므로, 핵심만 추려서 전달
  const compact = {
    mode: result.mode,
    summary: result.summary,
    summaryExplanation: result.summaryExplanation,
    recommendations: result.recommendations,
    spaceRanking: result.spaceRanking,
    processRanking: result.processRanking,
    styleMatch: result.styleMatch,
    colorPalette: result.colorPalette,
    budgetRecommendation: result.budgetRecommendation,
    estimateHints: result.estimateHints,
    vibeProfile: result.vibeProfile,
    // ✅ 점수 정보 추가
    homeValueScore: result.homeValueScore,
    lifestyleScores: result.lifestyleScores,
    // 세부 항목 점수 (preferences)
    preferenceScores: result.preferences,
  }

  return JSON.stringify(compact, null, 2)
}

// OpenAI 응답에서 JSON 블록만 추출
function extractJsonFromContent(content: string): AIAnalysisReport {
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('AI 응답에서 JSON 블록을 찾을 수 없습니다.')
  }

  const parsed = JSON.parse(match[0])
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI 응답 JSON 파싱에 실패했습니다.')
  }

  return parsed as AIAnalysisReport
}

// AI에게 성향 리포트 생성을 요청하는 함수
async function buildAIReportWithOpenAI(
  payload: AnalysisRequest,
  result: AnalysisResultV2Type
): Promise<AIAnalysisReport | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY가 없어 aiReport는 생성하지 않습니다.')
    return null
  }

  try {
    const customerSummary = buildCustomerSummary(payload)
    const engineSummary = buildEngineSummaryForAI(result)

    const systemPrompt = `
당신은 15년 경력의 프리미엄 인테리어 컨설턴트입니다.
아래에 주어질 "고객 정보"와 "규칙 기반 분석 결과"를 바탕으로,
고객이 이해하기 쉬운 한국어 성향 리포트를 작성해야 합니다.

🎯 핵심 미션: 고객이 놓치는 부분을 찾아주기
- 단순히 고객이 원하는 것을 말하는 것이 아니라, 고객이 생각하지 못한 문제점이나 고려사항을 발견하게 만드는 리포트
- 전문가 관점에서 "아, 이 부분도 고려해야 하는데 고객이 놓쳤을 수 있겠다"는 부분을 찾아내는 리포트
- 장기적 관점에서 발생할 수 있는 문제나 시나리오를 미리 파악하는 리포트

- 대상은 인테리어 상담을 처음 받는 일반 고객입니다.
- 전문 용어는 쓰되, 괄호로 쉽게 풀어서 설명해주세요.
- 말투는 존댓말, 부드럽고 진솔한 상담 톤으로 작성합니다.

리포트는 반드시 JSON 형식으로만 반환해야 합니다.
`.trim()

    const userPrompt = `
[고객 정보 요약]
${customerSummary}

[규칙 기반 분석 엔진(V2) 결과 요약(JSON)]
${engineSummary}

**중요**: 위 분석 결과에는 다음 점수들이 포함되어 있습니다:
- 집값 방어 점수 (1-5점): 선택한 공간과 등급에 따른 투자 가치 평가
- 생활 개선 점수 (0-100점): 수납, 청소, 동선 개선 정도
- 세부 항목 점수 (1-10점): 고객의 성향별 상세 점수

위 정보를 바탕으로, 아래 스키마에 맞는 JSON을 생성해주세요.

[반드시 지켜야 하는 JSON 스키마]

{
  "title": "한 줄 요약 타이틀 (예: 가족과 함께 쓰는 32평, 조명·분위기 중심 스타일)",
  "overview": "2~3단락 분량의 전체 요약. 고객의 라이프스타일, 집 상태, 인테리어 방향성을 자연스럽게 서술합니다. 마크다운 사용 가능.",
  "personalityKeywords": [
    "고객 성향 키워드 3~7개 (예: 정리정돈, 조명, 호텔식, 가족 중심)"
  ],
  "styleKeywords": [
    "인테리어 스타일/분위기 키워드 3~7개 (예: 모던, 북유럽, 우드톤, 따뜻한 조명)"
  ],
  "prioritySpaces": [
    {
      "spaceId": "living",
      "label": "거실",
      "reason": "이 공간에 대한 관심과 사용 빈도가 가장 높고, 가족이 함께 모이는 핵심 공간이기 때문입니다."
    }
  ],
  "priorityProcesses": [
    {
      "process": "조명",
      "label": "조명/간접조명",
      "reason": "집 전체 분위기와 피로도에 큰 영향을 주기 때문에, 예산 내에서 우선적으로 개선하는 것을 추천드립니다."
    }
  ],
  "budgetSummary": "예산과 선호도를 고려했을 때, 표준형~아르젠 등급 사이에서 선택하시는 것을 추천드립니다. 마감재(바닥, 벽, 조명)는 너무 타협하지 않는 것이 좋습니다.",
  "nextActions": [
    "1순위로 정하고 싶은 공간을 1~2곳만 골라 예산을 집중해 보세요.",
    "조명(색온도, 간접조명)과 벽/바닥 톤을 먼저 정하면 전체 분위기가 훨씬 안정적으로 잡힙니다."
  ]
}

**중요: "missedPoints" 필드는 반드시 포함해야 합니다!**
- 고객이 생각하지 못한 문제점이나 고려사항을 최소 2-3개 찾아주세요.
- 각 항목은 다음을 포함해야 합니다:
  - point: 고객이 놓칠 수 있는 구체적 문제점 (예: "아이가 커지면 거실 공간 사용이 달라질 수 있어요")
  - impact: 이 문제가 발생하면 어떤 영향이 있는지 (예: "5년 후에도 지금과 같은 방식으로 사용하실 것 같으신가요?")
  - recommendation: 전문가 관점에서의 구체적 추천 (예: "유연한 공간 구성과 수납 시스템을 고려해보세요")
- 고객의 집 정보(평수, 가족 구성, 거주 목적, 거주 기간 등)를 바탕으로 장기적 관점에서 발생할 수 있는 문제를 찾아주세요.

주의:
- 반드시 위와 동일한 필드 이름만 사용하세요.
- JSON 바깥에는 어떤 텍스트도 쓰지 마세요.
- 설명 문장 안에서는 고객을 '고객님'이라고 부르지 말고, 자연스럽게 2인칭으로 표현하세요.
`.trim()

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2500,
    })

    const content = completion.choices[0].message.content || '{}'
    console.log('🤖 [analysis] AI 리포트 원본 응답:', content.substring(0, 200) + '...')

    const aiReport = extractJsonFromContent(content)
    console.log('✅ [analysis] AI 리포트 생성 완료')

    return aiReport
  } catch (error: unknown) {
    console.error('❌ [analysis] AI 리포트 생성 오류:', error)
    return null // aiReport만 없애고, 기본 엔진 결과는 그대로 반환
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body) {
      return NextResponse.json(
        { success: false, error: '요청 본문이 비어 있습니다.' },
        { status: 400 },
      )
    }

    const {
      mode = 'quick',
      preferences,
      answers,
      answeredCount = 0,
      completionRate = 0,
      timestamp = new Date().toISOString(),
      spaceInfo = null,
      selectedAreas = null,
      vibeInput = null,
    } = body

    // 기존 구조 유지: preferences가 없으면 answers를 사용
    const effectivePreferences = preferences ?? answers

    if (!effectivePreferences || Object.keys(effectivePreferences).length === 0) {
      return NextResponse.json(
        { success: false, error: '분석에 필요한 답변이 존재하지 않습니다.' },
        { status: 400 },
      )
    }

    const payload: AnalysisRequest = {
      mode: (mode as AnalysisMode) || 'quick',
      preferences: effectivePreferences,
      answeredCount,
      completionRate,
      timestamp,
      spaceInfo,
      selectedAreas,
      vibeInput,
    }

    // 디버깅: 선택된 공간 확인
    console.log('📍 [API] 선택된 공간:', selectedAreas)

    // 1) V1/V2 엔진으로 규칙 기반 분석 실행
    const result = USE_V2_ENGINE
      ? buildAnalysisResultV2(payload)
      : await buildAnalysisResult(payload)

    console.log('📊 규칙 기반 분석 완료:', {
      engine: USE_V2_ENGINE ? 'V2' : 'V1',
      analysisId: (result as { analysisId?: string }).analysisId,
      mode: result.mode,
      ...(USE_V2_ENGINE && 'spaceRanking' in result
        ? {
            topSpace: (result as AnalysisResultV2Type).spaceRanking?.[0]?.spaceId,
            topProcess: (result as AnalysisResultV2Type).processRanking?.[0]?.process,
            budgetRecommendation: (result as AnalysisResultV2Type).budgetRecommendation,
          }
        : {}),
    })

    // 2) OpenAI로 자연어 성향 리포트 생성 (실패해도 전체 API는 성공으로 반환)
    const aiReport = await buildAIReportWithOpenAI(payload, result as AnalysisResultV2Type)

    return NextResponse.json(
      {
        success: true,
        ...result,     // 기존 V2 결과 그대로 유지
        aiReport: aiReport ?? null, // 새로 추가된 자연어 리포트
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('API 에러:', error)
    return NextResponse.json(
      {
        success: false,
        error: '분석 제출 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
