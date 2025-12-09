// app/api/generate-questions/route.ts
// AI 맞춤형 질문 생성 API v2
// 고객 정보를 분석해서 맞춤형 질문을 직접 생성합니다

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { SpaceInfo } from '@/lib/store/spaceInfoStore'
import type { AnalysisMode, Question, QuestionOption } from '@/lib/data/personalityQuestions'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 모드별 질문 개수
const MODE_QUESTION_COUNT: Record<AnalysisMode, number> = {
  quick: 4,
  standard: 10,
  deep: 18,
  vibe: 7,
}

// AI가 응답할 때의 원시 타입 정의
interface AIQuestionOptionRaw {
  id?: string
  text?: string
  value?: string
  icon?: string
}

interface AIQuestionRaw {
  id?: string
  text?: string
  options?: AIQuestionOptionRaw[]
  category?: string
  goal?: string
}

interface AIResponseRaw {
  questions?: AIQuestionRaw[]
  reason?: string
}

function buildCustomerProfile(spaceInfo: SpaceInfo): string {
  // 고객 정보를 사람이 읽기 좋은 한국어 요약으로 정리
  return `
주거 정보:
- 주거형태: ${spaceInfo.housingType}
- 평수: ${spaceInfo.pyeong}평 (약 ${spaceInfo.squareMeter}㎡)
- 방 개수: ${spaceInfo.rooms}개
- 욕실: ${spaceInfo.bathrooms}개

가족 구성:
- 가족 규모: ${spaceInfo.familySizeRange || '미입력'}
- 연령대: ${spaceInfo.ageRanges?.join(', ') || '미입력'}
- 총 인원: ${spaceInfo.totalPeople || '미입력'}명

라이프스타일:
${spaceInfo.lifestyleTags && spaceInfo.lifestyleTags.length > 0 
  ? `- ${spaceInfo.lifestyleTags.join('\n- ')}`
  : '- 미입력'}

예산:
- 예산 범위: ${spaceInfo.budget || '미입력'}
- 거주 목적: ${spaceInfo.livingPurpose || '미입력'}
- 예상 거주 기간: ${spaceInfo.livingYears ? `${spaceInfo.livingYears}년` : '미입력'}
`.trim()
}

// 모드별 설명을 프롬프트에 전달하기 위한 헬퍼
function getModeDescription(mode: AnalysisMode, targetCount: number): string {
  switch (mode) {
    case 'quick':
      return `- quick 모드: 총 ${targetCount}문항.
- 5개 축(라이프스타일, 감성/분위기, 실용/기능, 가족/관계, 예산/우선순위) 중에서 "핵심만" 빠르게 파악할 수 있는 질문 위주로 구성합니다.
- 각 축에서 가장 중요한 질문을 우선 선택해 주세요.`

    case 'standard':
      return `- standard 모드: 총 ${targetCount}문항.
- 5개 축을 비교적 고르게 다루어, 전반적인 인테리어 성향을 균형 있게 파악합니다.
- 특정 축에 치우치지 않도록 해주세요.`

    case 'deep':
      return `- deep 모드: 총 ${targetCount}문항.
- 5개 축을 모두 다루되, 라이프스타일(lifestyle), 감성/분위기(mood), 실용/기능(function)에 조금 더 많은 비중을 둡니다.
- 고객의 생활 패턴, 원하는 감성, 실제 사용성까지 깊게 파고드는 질문을 포함합니다.`

    case 'vibe':
      return `- vibe 모드: 총 ${targetCount}문항.
- 감성/분위기(mood) 축에 가장 큰 비중을 두고, 나머지 축은 가볍게 보조적으로 확인합니다.
- 집을 "어떤 감정, 어떤 영화, 어떤 여행 스타일"로 느끼고 싶은지 등 감성 중심 질문을 만들어 주세요.`

    default:
      return ''
  }
}

// AI 응답을 우리 서비스에서 사용하는 Question 형태로 안전하게 변환
function normalizeAIQuestions(raw: AIQuestionRaw[], targetCount: number): Question[] {
  const normalized: Question[] = raw
    .filter((q) => q && typeof q.text === 'string' && q.text.trim().length > 0)
    .map((q, questionIndex) => {
      const baseQuestionId = q.id && q.id.trim().length > 0
        ? q.id
        : `ai_q_${questionIndex + 1}`

      const rawOptions = Array.isArray(q.options) ? q.options : []

      // 옵션 4~6개만 사용, 텍스트가 없는 옵션은 제외
      const slicedOptions = rawOptions
        .filter((opt) => opt && typeof opt.text === 'string' && opt.text.trim().length > 0)
        .slice(0, 6)

      // 최소 2개는 있어야 의미 있는 질문으로 간주
      if (slicedOptions.length < 2) {
        return null
      }

      const options: QuestionOption[] = slicedOptions.map((opt, optionIndex) => {
        const optId = opt.id && opt.id.trim().length > 0
          ? opt.id
          : `opt_${questionIndex + 1}_${optionIndex + 1}`

        // value는 분석에서 사용할 코드값이므로, id나 text 기반으로 안전하게 생성
        const valueBase = opt.value && opt.value.trim().length > 0
          ? opt.value
          : opt.id && opt.id.trim().length > 0
            ? opt.id
            : opt.text!

        return {
          id: optId,
          text: opt.text!,
          value: valueBase,
          icon: opt.icon,
        }
      })

      if (options.length === 0) {
        return null
      }

      const question: Question = {
        id: baseQuestionId,
        text: q.text!,
        options,
      }

      return question
    })
    .filter((q): q is Question => q !== null)

  // 목표 개수만큼 자르기 (AI가 더 많이 준 경우)
  return normalized.slice(0, targetCount)
}

// AI 응답에서 JSON 블록만 안전하게 추출
function extractJsonFromContent(content: string): AIResponseRaw {
  // 중괄호로 시작하는 JSON 블록 찾기
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.')
  }

  const parsed = JSON.parse(jsonMatch[0]) as AIResponseRaw
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI 응답 JSON 파싱에 실패했습니다.')
  }

  return parsed
}

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다.')
      return NextResponse.json(
        { 
          error: 'OpenAI API 키가 설정되지 않았습니다.',
          message: '.env.local 파일을 확인해주세요.',
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { mode, spaceInfo }: { mode: AnalysisMode; spaceInfo: SpaceInfo | null } = body

    // 입력 검증: 모드
    if (!mode) {
      return NextResponse.json(
        { error: '모드가 필요합니다.' },
        { status: 400 },
      )
    }

    // 입력 검증: 집 정보
    if (!spaceInfo) {
      return NextResponse.json(
        { error: '집 정보가 필요합니다.' },
        { status: 400 },
      )
    }

    const targetCount = MODE_QUESTION_COUNT[mode]
    console.log('🤖 AI 질문 생성 시작:', { mode, pyeong: spaceInfo.pyeong, targetCount })

    // 1) 고객 정보 요약 텍스트 생성
    const customerProfile = buildCustomerProfile(spaceInfo)

    // 2) 시스템 프롬프트 (질문 설계 규칙 + JSON 스키마)
    const systemPrompt = `
당신은 15년 경력의 프리미엄 인테리어 컨설턴트이자 심리 상담사입니다.
고객의 주거 정보와 라이프스타일을 바탕으로, **고객이 생각하지 못한 부분을 찾아내는 인사이트 있는 질문**을 만들어야 합니다.

🎯 핵심 미션: 고객이 놓치는 부분을 찾아주기
- 단순히 고객이 원하는 것을 물어보는 것이 아니라, 고객이 생각하지 못한 문제점이나 고려사항을 발견하게 만드는 질문
- 전문가 관점에서 "아, 이 부분도 고려해야 하는데 고객이 놓쳤을 수 있겠다"는 부분을 찾아내는 질문
- 장기적 관점에서 발생할 수 있는 문제나 시나리오를 미리 파악하는 질문
- 고객의 현재 상황에서 숨겨진 니즈나 잠재적 불편사항을 발견하는 질문

[고객 정보 요약]
${customerProfile}

[질문 설계 축]
각 질문은 아래 5개 축 중 하나에 해당해야 합니다. 하지만 **고객이 놓칠 수 있는 부분**을 찾는 것이 핵심입니다.

1. 라이프스타일 (lifestyle)
   - 하루 중 어디에서 시간을 많이 보내는지
   - 사용하는 공간, 취미, 아이/반려동물 활동
   - 💡 인사이트: 고객이 놓칠 수 있는 생활 패턴, 시간대별 공간 사용, 계절별 변화 등

2. 감성/분위기 (mood)
   - 좋아하는 분위기(호텔, 카페, 북유럽, 내추럴, 모던 등)
   - 색감, 재질, 조명 느낌
   - 💡 인사이트: 시간대별 분위기 변화, 계절감, 감정 상태에 따른 공간 활용 등

3. 실용/기능 (function)
   - 수납, 동선, 내구성, 청소/관리 편의성
   - 💡 인사이트: 장기 사용 시 발생할 수 있는 문제, 유지보수 비용, 실수로 놓치기 쉬운 기능적 문제 등

4. 가족/관계 (family)
   - 가족 수, 아이 나이, 동거인, 손님 방문 빈도, 프라이버시
   - 💡 인사이트: 가족 구성원 간의 갈등 가능성, 성장에 따른 변화, 프라이버시 충돌 등

5. 예산/우선순위 (budget)
   - 어디에 돈을 더 쓰고 싶은지
   - 반드시 투자해야 하는 부분 vs 포기 가능한 부분
   - 💡 인사이트: 나중에 후회할 수 있는 절약, 투자 가치가 높은 부분, 우선순위 재정립 등

[질문 생성 공통 규칙]

⚠️ 매우 중요: 절대 금지 사항
- 고객 정보 요약에 이미 포함된 정보(평수, 주거형태, 방 개수, 욕실 개수, 가족 구성, 연령대, 라이프스타일 태그, 예산, 거주 목적, 거주 기간 등)를 다시 물어보는 질문을 절대 만들지 마세요.
- 예를 들어, 평수가 32평으로 제공되었다면 "몇 평인가요?" 같은 질문은 절대 금지입니다.
- 이미 제공된 정보는 질문의 맥락으로만 활용하고, 새로운 정보를 파악하는 질문만 생성하세요.

1. 각 질문에는 반드시 아래 필드를 포함합니다.
   - category: "lifestyle" | "mood" | "function" | "family" | "budget"
   - goal: 이 질문으로 파악하고 싶은 것 (한 줄 요약)
   - text: 고객에게 보여줄 실제 질문 문장

2. 개인화 강도 + 인사이트 발견:
   - 각 질문의 text 안에 고객 정보에서 가져온 구체 정보(예: 평수, 주거형태, 가족 구성, 예산, 라이프스타일 태그 등)를 "최소 2가지 이상" 자연스럽게 녹여서 질문하세요.
   - 예시 (단순 질문 ❌): "32평 아파트에서 3명 가족과 함께 거주하시는 상황에서, 평소 거실에서 가장 많이 하는 활동은 무엇인가요?"
   - 예시 (인사이트 질문 ✅): "32평 아파트에서 3명 가족과 함께 거주하시는데, 아이가 커지면서 거실 공간 사용이 달라질 수 있어요. 5년 후에도 지금과 같은 방식으로 거실을 사용하실 것 같으신가요?"
   - 존재하지 않는 정보를 상상해서 추가하지 말고, 실제로 제공된 정보에만 기반하세요.
   - 이미 제공된 정보는 질문의 전제로만 사용하고, **고객이 생각하지 못한 시나리오나 문제점을 발견하게 만드는 질문**을 생성하세요.
   - 전문가 관점에서 "이 고객이 놓칠 수 있는 부분은 무엇일까?"를 고민하고 질문으로 만들어주세요.

3. 선택지(options):
   - 각 질문마다 4~6개의 선택지를 생성합니다.
   - 각 선택지는 서로 뚜렷하게 다른 방향성을 가져야 합니다.
   - text: 사용자가 보는 문장
   - value: 나중에 분석에 사용할 코드값 (id 또는 의미 있는 문자열)
   - icon: 그림 이모지 하나 (예: 🛋️, ☀️ 등)

4. 말투/톤:
   - 설문지 느낌이 아니라, 편안한 카카오 상담 톡처럼 "존댓말"을 사용합니다.
   - 한 질문에는 하나의 핵심만 묻고, 두 가지 이상을 섞어서 묻지 마세요.
   - 부정형 질문(예: "~하지 않나요?")보다는, 선택지에서 차이를 주는 방식으로 구성하세요.

5. JSON 형식:
   - 반드시 유효한 JSON만 반환해야 합니다.
   - JSON 바깥에 설명 문장을 쓰지 마세요.
   - JSON 안의 "reason"에는 전체 질문 구성을 이렇게 만든 이유를 한 줄로 요약하세요.

[응답 형식 (반드시 아래 예시 구조를 따릅니다)]

{
  "questions": [
    {
      "id": "q1",
      "category": "lifestyle",
      "goal": "고객이 하루 중 가장 많이 사용하는 공간과 패턴을 파악하기 위함",
      "text": "질문 내용 (고객 정보를 반영한 구체적 질문)",
      "options": [
        {
          "id": "opt1",
          "text": "선택지 1",
          "value": "option_value_1",
          "icon": "🏠"
        }
      ]
    }
  ],
  "reason": "이 질문 세트를 이렇게 구성한 이유 (한 줄 요약)"
}
`.trim()

    // 3) 사용자 프롬프트 (모드별 전략 + 개수 지시)
    const modeDescription = getModeDescription(mode, targetCount)

    const userPrompt = `
위 고객 정보를 바탕으로 "${mode}" 모드에 적합한 ${targetCount}개의 질문을 설계해주세요.

[모드별 전략]
${modeDescription}

[요청 사항 요약]
- 총 ${targetCount}개의 질문을 생성합니다.
- 각 질문은 위에서 설명한 5개 축 중 하나의 category를 가져야 합니다.
- 질문 문장 안에는 고객 정보에서 가져온 구체적인 정보(예: 평수, 가족 구성, 예산, 라이프스타일 태그 등)를 최소 2가지 이상 자연스럽게 포함하세요.
- ⚠️ 절대 금지: 이미 제공된 고객 정보(평수, 주거형태, 방 개수, 욕실 개수, 가족 구성, 연령대, 라이프스타일, 예산, 거주 목적, 거주 기간 등)를 다시 물어보는 질문을 만들지 마세요.
- 🎯 핵심 목표: 고객이 생각하지 못한 부분을 찾아내는 인사이트 있는 질문 생성
  - 단순히 "어떤 것을 좋아하나요?" 같은 질문이 아니라
  - "이런 상황에서 문제가 생길 수 있는데, 어떻게 대비하실 건가요?" 같은 질문
  - "이 부분을 놓치면 나중에 후회할 수 있어요. 어떻게 생각하세요?" 같은 질문
  - "전문가 관점에서 이 부분도 고려해보시면 좋을 것 같은데요?" 같은 질문
- 이미 제공된 정보는 질문의 맥락/전제로만 활용하고, **고객이 놓칠 수 있는 시나리오, 문제점, 고려사항을 발견하게 만드는 질문**을 생성하세요.
- 반드시 위에서 제공한 JSON 형식으로만 응답하세요.
`.trim()

    // 4) OpenAI 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9, // 약간 더 창의적으로
      max_tokens: 3000,
    })

    const content = completion.choices[0].message.content || '{}'
    console.log('🤖 AI 응답 원본:', content.substring(0, 200) + '...')

    // 5) AI 응답 JSON 파싱
    const aiResponse = extractJsonFromContent(content)
    const rawQuestions = Array.isArray(aiResponse.questions) ? aiResponse.questions : []

    if (!rawQuestions || rawQuestions.length === 0) {
      throw new Error('AI가 질문을 생성하지 못했습니다.')
    }

    // 6) 우리 서비스에서 사용하는 Question 타입으로 정제
    const finalQuestions = normalizeAIQuestions(rawQuestions, targetCount)

    if (finalQuestions.length === 0) {
      throw new Error('AI가 유효한 질문을 생성하지 못했습니다.')
    }

    console.log(`✅ AI가 ${finalQuestions.length}개 질문 생성/정제 완료`)
    if (aiResponse.reason) {
      console.log('💡 생성 이유:', aiResponse.reason)
    }

    // 7) 프런트로 응답
    return NextResponse.json({
      success: true,
      questions: finalQuestions,
      mode,
      targetCount,
      actualCount: finalQuestions.length,
      reason: aiResponse.reason ?? null,
    })
  } catch (error: unknown) {
    console.error('❌ AI 질문 생성 오류:', error)

    // 상세 에러 메시지
    let errorMessage = '질문 생성 중 오류가 발생했습니다.'
    const errorObj = error as { message?: string }

    if (errorObj?.message) {
      if (errorObj.message.includes('API key')) {
        errorMessage = 'OpenAI API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.'
      } else if (errorObj.message.includes('rate limit')) {
        errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      } else if (errorObj.message.includes('JSON')) {
        errorMessage = 'AI 응답 형식(JSON) 파싱에 실패했습니다.'
      } else {
        errorMessage = `오류: ${errorObj.message}`
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        hint: 'OpenAI API 키를 확인하거나 잠시 후 다시 시도해주세요.',
        details: errorObj?.message,
      },
      { status: 500 },
    )
  }
}

