import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  // 변수를 함수 스코프에 선언 (catch 블록에서도 사용 가능)
  let style = '모던'
  let colors: string[] = []
  let preferences: any = {}
  let area: string | undefined
  
  try {
    const body = await request.json()
    style = body.style || '모던'
    colors = body.colors || []
    preferences = body.preferences || {}
    area = body.area

    if (!style) {
      return NextResponse.json(
        { error: '스타일 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    // 영역별 한글명 매핑 (한 번만 정의)
    const areaNames: Record<string, string> = {
      living: '거실',
      kitchen: '주방',
      bathroom: '욕실',
      bedroom: '침실',
      balcony: '베란다',
      utility: '다용도실',
      dressing: '드레스룸',
      study: '서재/작업실',
      kids: '아이방',
      storage: '창고/수납공간',
      full: '전체 공간',
    }

    const areaName = area ? areaNames[area] || area : '전체 공간'
    const areaContext = area ? `${areaName}에 특화된 ` : ''

    const systemPrompt = `당신은 아르젠 인테리봇의 이미지 프롬프트 전문가입니다.
고객의 스타일, 색상, 성향을 바탕으로 ${areaName}에 특화된 DALL·E 3 최적화 이미지 생성 프롬프트를 작성하세요.

프롬프트 작성 규칙:
1. ${areaName} 공간에 특화된 디자인 묘사
2. 한국어로 작성하되, DALL·E가 이해할 수 있도록 영어 키워드 포함
3. 스타일, 색상, 분위기를 구체적으로 묘사
4. ${areaName}에 맞는 공간감, 조명, 가구 배치를 상세히 설명
5. 전문적이고 브랜드 톤 유지

JSON 형식으로 반환하세요:
{
  "prompt": "상세한 이미지 생성 프롬프트 (한국어 + 영어 키워드)",
  "englishPrompt": "영어 프롬프트 (DALL·E용)"
}`

    const userPrompt = `공간: ${areaName}
스타일: ${style}
추천 색상: ${colors?.join(', ') || '없음'}
성향 분석:
${JSON.stringify(preferences, null, 2)}

위 정보를 바탕으로 ${areaContext}인테리어 이미지 생성 프롬프트를 작성해주세요.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')

    return NextResponse.json({
      success: true,
      prompt: result.prompt || '',
      englishPrompt: result.englishPrompt || result.prompt || '',
    })
  } catch (error) {
    console.error('이미지 프롬프트 생성 오류:', error)
    
    // 기본 프롬프트 제공 (함수 스코프의 변수 사용)
    const defaultPrompt = `${style} 스타일의 인테리어, ${colors?.join(', ') || '모던한'} 색상, 깔끔하고 세련된 공간`
    
    return NextResponse.json({
      success: true,
      prompt: defaultPrompt,
      englishPrompt: `${style} style interior, ${colors?.join(', ') || 'modern'} colors, clean and sophisticated space`,
    })
  }
}

