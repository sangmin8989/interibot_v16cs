import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discomfort, pyeong, housingType, rooms, bathrooms } = body;

    if (!discomfort || typeof discomfort !== 'string') {
      return NextResponse.json(
        { success: false, error: '불편사항을 입력해주세요.' },
        { status: 400 }
      );
    }

    // AI 프롬프트
    const systemPrompt = `당신은 인테리어 전문가입니다. 고객의 불편사항을 듣고 필요한 공간을 추천합니다.

사용 가능한 공간 ID:
- living: 거실
- kitchen: 주방
- master-bedroom: 안방
- bedroom-2, bedroom-3: 방
- master-bathroom: 안방 욕실
- bathroom-2: 공용 욕실
- entrance: 현관/복도
- balcony: 발코니

추천 형식:
1. recommendation: 2-3문장으로 고객의 불편사항에 공감하고, 추천 이유를 설명
2. recommendedSpaces: 추천 공간 ID 배열 (최대 3개)

예시:
{
  "recommendation": "욕실이 낡으셨다니 이해됩니다. 특히 안방 욕실은 매일 사용하는 공간이라 리모델링 효과가 크실 거예요.",
  "recommendedSpaces": ["master-bathroom", "bathroom-2"]
}

반드시 위 JSON 형식으로만 응답하세요.`;

    const userPrompt = `고객 정보:
- 주거형태: ${housingType}
- 평수: ${pyeong}평
- 방: ${rooms}개
- 욕실: ${bathrooms}개

불편사항: "${discomfort}"

위 불편사항을 해결할 수 있는 공간을 추천해주세요.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'AI 응답을 받지 못했습니다.' },
        { status: 500 }
      );
    }

    // JSON 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: 'AI 응답 형식 오류' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      recommendation: parsed.recommendation || '추천 공간을 확인해보세요.',
      recommendedSpaces: parsed.recommendedSpaces || [],
    });

  } catch (error) {
    console.error('공간 추천 API 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 에러' 
      },
      { status: 500 }
    );
  }
}
