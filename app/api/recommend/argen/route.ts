import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { callAIWithLimit } from '@/lib/api/ai-call-limiter'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 아르젠 제작 가능 항목 목록
const ARGEN_ITEMS = [
  '붙박이장',
  '드레스룸',
  'TV장',
  '수납장',
  '템바보드',
  '간접등 박스',
  '가벽',
  '파티션',
  '중문',
  '주방 상부장',
  '주방 하부장',
  '필름',
  '도장',
  '방음 패널',
  '흡음 패널',
]

export async function POST(request: NextRequest) {
  try {
    const { preferences, spaceInfo } = await request.json()

    if (!preferences) {
      return NextResponse.json(
        { error: '성향 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    // OpenAI를 사용하여 성향에 맞는 아르젠 제작 항목 추천
    const systemPrompt = `당신은 아르젠 인테리봇의 전문가입니다.
고객의 성향 분석 결과를 바탕으로 아르젠에서 제작 가능한 항목을 추천하세요.

아르젠 제작 가능 항목:
${ARGEN_ITEMS.join(', ')}

고객의 성향을 분석하여 가장 적합한 3~5개 항목을 추천하되, 강요하지 않고 자연스럽게 제안하세요.
JSON 형식으로 반환하세요:
{
  "recommendedItems": ["항목1", "항목2", "항목3"],
  "reasoning": "추천 이유 (한국어)"
}`

    const userPrompt = `성향 분석 결과:
${JSON.stringify(preferences, null, 2)}

공간 정보:
${JSON.stringify(spaceInfo, null, 2)}

위 정보를 바탕으로 아르젠 제작 가능 항목을 추천해주세요.`

    // Phase 4: AI 호출 래퍼 적용 (enableLimit=false)
    const enableLimit = process.env.NEXT_PUBLIC_AI_RATE_LIMIT === 'true';
    const sessionId = request.headers.get('x-session-id') || undefined;
    
    const response = await callAIWithLimit({
      sessionId,
      action: 'OPTION_RECOMMEND',
      prompt: { systemPrompt, userPrompt },
      enableLimit: false, // 🔒 Phase 4: 반드시 false
      aiCall: async () => {
        return await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });
      },
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')

    // 추천된 항목이 실제 아르젠 제작 가능 항목인지 검증
    const validatedItems = (result.recommendedItems || []).filter((item: string) =>
      ARGEN_ITEMS.some((argenItem) => item.includes(argenItem) || argenItem.includes(item))
    )

    return NextResponse.json({
      success: true,
      recommendedItems: validatedItems.length > 0 ? validatedItems : result.recommendedItems || [],
      reasoning: result.reasoning || '',
    })
  } catch (error) {
    console.error('아르젠 추천 오류:', error)
    
    // 오류 발생 시 기본 추천 제공
    return NextResponse.json({
      success: true,
      recommendedItems: ['붙박이장', '수납장', 'TV장'],
      reasoning: '기본 추천 항목입니다.',
    })
  }
}

