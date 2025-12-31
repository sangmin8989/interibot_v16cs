import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PhotoAnalysisResult, PhotoAnalyzeResponse } from '@/lib/analysis/v5-ultimate/types';
import { PHOTO_ANALYSIS_PROMPT } from '@/lib/analysis/v5-ultimate/prompts';
import { callAIWithLimit } from '@/lib/api/ai-call-limiter';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest): Promise<NextResponse<PhotoAnalyzeResponse>> {
  try {
    const { imageBase64, imageType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: '이미지가 필요합니다.' }, { status: 400 });
    }

    // Phase 4: AI 호출 래퍼 적용 (enableLimit=false)
    const enableLimit = process.env.NEXT_PUBLIC_AI_RATE_LIMIT === 'true';
    const sessionId = request.headers.get('x-session-id') || undefined;
    
    // GPT-4V 호출 (gpt-4-turbo는 vision 지원)
    const response = await callAIWithLimit({
      sessionId,
      action: 'IMAGE_GENERATE',
      prompt: { imageType, prompt: PHOTO_ANALYSIS_PROMPT },
      enableLimit: false, // 🔒 Phase 4: 반드시 false
      aiCall: async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: PHOTO_ANALYSIS_PROMPT
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64.startsWith('data:') 
                      ? imageBase64 
                      : `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high'
                  }
                },
                {
                  type: 'text',
                  text: `이 ${imageType === 'current' ? '현재 집' : imageType === 'dream' ? '이상적인 인테리어' : '영감'} 사진을 분석해주세요.`
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        });
      },
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ success: false, error: '분석 결과를 받지 못했습니다.' }, { status: 500 });
    }

    // JSON 파싱
    let analysis: PhotoAnalysisResult;
    try {
      // JSON 블록 추출 (마크다운 코드블록 제거)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON not found in response');
      }
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON 파싱 에러:', parseError, '\n원본:', content);
      return NextResponse.json({ success: false, error: '분석 결과 파싱 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true, analysis });

  } catch (error) {
    console.error('사진 분석 에러:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 에러' 
    }, { status: 500 });
  }
}




