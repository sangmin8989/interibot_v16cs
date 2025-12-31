import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      grade, 
      budget, 
      selectedSpaces,
      spaceInfo 
    } = body;

    if (!grade) {
      return NextResponse.json(
        { success: false, error: '등급 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 등급별 자재 특징
    const gradeMaterialFeatures: Record<string, string> = {
      ESSENTIAL: '실용적이고 경제적인 자재, 관리가 쉬운 마감재',
      STANDARD: '품질과 가격의 균형을 맞춘 자재, 내구성이 검증된 마감재',
      OPUS: '프리미엄 수입 자재, 디자인성과 품질이 뛰어난 마감재',
    };

    const systemPrompt = `당신은 인테리어 자재 전문가입니다. 고객의 예산과 선택한 등급에 맞춰 자재를 추천합니다.

추천 규칙:
1. 2-3문장으로 간결하게
2. 선택한 등급에 맞는 자재 특징 설명
3. 예산을 고려한 합리적인 추천 이유
4. 구체적인 자재명보다는 카테고리 (마루, 타일, 도어 등)로 설명
5. 친근하고 신뢰감 있는 어조

반드시 아래 JSON 형식으로만 응답하세요:
{
  "recommendation": "자재 추천 설명 문장"
}`;

    const userPrompt = `고객 정보:
- 평수: ${spaceInfo?.pyeong || 32}평
- 주거형태: ${spaceInfo?.housingType || '아파트'}
- 선택 등급: ${grade} (${gradeMaterialFeatures[grade] || ''})
- 예산: ${budget?.min?.toLocaleString() || '미정'}~${budget?.max?.toLocaleString() || '미정'}만원
- 선택 공간 수: ${selectedSpaces?.length || 0}개

위 조건에 맞는 자재를 추천해주세요.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 300,
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
      recommendation: parsed.recommendation || '선택하신 등급에 맞춰 최적의 자재를 제안해드립니다.',
    });

  } catch (error) {
    console.error('자재 추천 API 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 에러' 
      },
      { status: 500 }
    );
  }
}
