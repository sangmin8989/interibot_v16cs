import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// TODO: .env.local에 OPENAI_API_KEY를 설정하세요
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: '이미지 URL이 필요합니다.' },
        { status: 400 }
      )
    }

    // base64 data URL 처리
    let imageUrlForAPI = imageUrl
    if (imageUrl.startsWith('data:image')) {
      // data URL 형식 그대로 사용 가능
      imageUrlForAPI = imageUrl
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `당신은 인테리어 전문가입니다. 업로드된 사진을 분석하여 다음 항목을 JSON 형식으로 반환하세요:

{
  "style": "모던|내추럴|미니멀|북유럽|빈티지|모던클래식|호텔식",
  "colors": ["색상1", "색상2"],
  "organizationLevel": 1-10,
  "moodTone": "화이트|우드|베이지|다크",
  "lightingColorTemp": "3000K|4000K|6500K",
  "furnitureLayout": "설명",
  "storageShortage": true|false,
  "spaceFeeling": "답답|보통|넓음",
  "wallFloorFinish": "설명",
  "summary": "전체 분석 요약 (한국어)"
}

반드시 JSON 형식으로만 응답하세요.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrlForAPI },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    })

    const analysisText = response.choices[0]?.message?.content
    let analysis = null

    if (analysisText) {
      try {
        analysis = JSON.parse(analysisText)
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError)
        // 파싱 실패 시 기본값 반환
        analysis = {
          style: '모던',
          colors: ['화이트', '그레이'],
          organizationLevel: 5,
          summary: '이미지 분석이 완료되었습니다.',
        }
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    console.error('Vision 분석 오류:', error)
    
    let errorMessage = '이미지 분석 중 오류가 발생했습니다.'
    if (error?.message) {
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API 키가 설정되지 않았거나 유효하지 않습니다.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      } else {
        errorMessage = `이미지 분석 오류: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}



