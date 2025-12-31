import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      selectedSpaces, 
      grade, 
      estimateRange, 
      spaceInfo 
    } = body;

    if (!selectedSpaces || selectedSpaces.length === 0) {
      return NextResponse.json(
        { success: false, error: '선택한 공간이 없습니다.' },
        { status: 400 }
      );
    }

    // 공간 이름 매핑
    const spaceNameMap: Record<string, string> = {
      'living': '거실',
      'kitchen': '주방',
      'master-bedroom': '안방',
      'bedroom-2': '방2',
      'bedroom-3': '방3',
      'master-bathroom': '안방 욕실',
      'bathroom-2': '공용 욕실',
      'entrance': '현관/복도',
      'balcony': '발코니',
      'full': '전체 리모델링',
      'style': '분위기만 바꾸기',
    };

    const spaceNames = selectedSpaces
      .map((s: any) => spaceNameMap[s.spaceId] || s.spaceId)
      .join(', ');

    // 등급 설명
    const gradeDescriptions: Record<string, string> = {
      ESSENTIAL: '에센셜 (실용적이고 경제적인 선택)',
      STANDARD: '스탠다드 (균형잡힌 품질)',
      OPUS: '오퍼스 (프리미엄 고급)',
    };

    const systemPrompt = `당신은 인테리어 전문가입니다. 고객에게 견적을 설명해줍니다.

설명 규칙:
1. 2-3문장으로 간결하게
2. 선택한 공간의 리모델링 효과 강조
3. 선택한 등급의 장점 설명
4. 평수를 고려한 맞춤 설명
5. 친근하고 전문적인 어조

반드시 아래 JSON 형식으로만 응답하세요:
{
  "explanation": "견적 설명 문장"
}`;

    const userPrompt = `고객 정보:
- 주거형태: ${spaceInfo?.housingType || '아파트'}
- 평수: ${spaceInfo?.pyeong || 32}평
- 선택 공간: ${spaceNames}
- 선택 등급: ${gradeDescriptions[grade] || grade}
- 견적 범위: ${estimateRange.min?.toLocaleString()}~${estimateRange.max?.toLocaleString()}만원

위 견적에 대해 설명해주세요.`;

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
      explanation: parsed.explanation || '맞춤 견적을 확인해보세요.',
    });

  } catch (error) {
    console.error('견적 설명 API 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 에러' 
      },
      { status: 500 }
    );
  }
}
