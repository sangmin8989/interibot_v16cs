import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, englishPrompt } = await request.json()

    if (!prompt && !englishPrompt) {
      return NextResponse.json(
        { error: '프롬프트가 필요합니다.' },
        { status: 400 }
      )
    }

    // DALL·E 3는 영어 프롬프트를 사용
    const imagePrompt = englishPrompt || prompt

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    })

    // response.data가 존재하고 배열이 비어있지 않은지 확인
    const imageUrl = response.data?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json(
        { error: '이미지 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl,
    })
  } catch (error: any) {
    console.error('이미지 생성 오류:', error)
    
    // 더 자세한 에러 메시지 제공
    let errorMessage = '이미지 생성 중 오류가 발생했습니다.'
    
    if (error?.message) {
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API 키가 설정되지 않았거나 유효하지 않습니다. 환경 변수를 확인해주세요.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.message.includes('content policy')) {
        errorMessage = '프롬프트가 정책에 위배됩니다. 다른 프롬프트를 시도해주세요.'
      } else {
        errorMessage = `이미지 생성 오류: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}



