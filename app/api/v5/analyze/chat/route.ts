import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatAnalysisResult, ChatAnalyzeResponse, ChatMessage, PhotoAnalysisResult } from '@/lib/analysis/v5-ultimate/types';
import { CHAT_ANALYSIS_PROMPT } from '@/lib/analysis/v5-ultimate/prompts';
import { callAIWithLimit } from '@/lib/api/ai-call-limiter';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest): Promise<NextResponse<ChatAnalyzeResponse>> {
  try {
    const body = await request.json();
    const { messages, photoAnalysis }: { messages: ChatMessage[]; photoAnalysis: PhotoAnalysisResult | null } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: false, error: '대화 내용이 필요합니다.' }, { status: 400 });
    }

    // 사용자 메시지만 추출
    const userMessages = messages.filter(m => m.role === 'user');
    const questionIndex = userMessages.length;
    
    // 5개 질문 완료 체크
    const isComplete = questionIndex >= 5;

    // 대화 내용을 텍스트로 변환
    const conversationText = messages
      .map(m => `${m.role === 'user' ? '고객' : '상담사'}: ${m.content}`)
      .join('\n');

    // GPT-4o-mini 분석 호출 (질문 생성 제거, 오직 분석만)
    let response;
    try {
      // 분석 전용 시스템 프롬프트 (질문 생성 지시 제거)
      const analysisSystemPrompt = `당신은 인테리어 상담사입니다.
고객과의 대화를 분석하여 인테리어 성향을 파악합니다.

분석 항목:
1. extractedTags: 대화에서 추출한 성향 태그 (배열)
2. cleaningStyle: 청소 스타일 (diligent/moderate/lazy/system_needed 중 하나)
3. spaceInterests: 관심 공간 (living/kitchen/bedroom/bathroom/study/entrance 배열)
4. budgetRange: 예산 범위 ({"min": 숫자, "max": 숫자} 또는 null)
5. familyInfo: 가족 정보 ({"totalMembers": 숫자, "hasChild": boolean, "hasElderly": boolean, "hasPet": "dog"/"cat"/"both"/"none"} 또는 null)
6. hiddenNeeds: 대화에서 발견한 숨은 니즈 (배열)
7. confidence: 분석 신뢰도 (0.0-1.0)

사용 가능한 태그:
- 스타일: MODERN_LOVER, NATURAL_LOVER, MINIMAL_LOVER, CLASSIC_LOVER, SCANDINAVIAN_LOVER, VINTAGE_LOVER
- 생활: HAS_CHILD, HAS_INFANT, HAS_TEEN, HAS_PET_DOG, HAS_PET_CAT, REMOTE_WORK, BOOKWORM, PLANT_LOVER, COOKING_LOVER, GUEST_FREQUENT
- 니즈: STORAGE_NEED, LIGHTING_NEED, CLEANING_SYSTEM_NEED, SOUNDPROOF_NEED, SAFETY_NEED, VENTILATION_NEED
- 상태: WELL_ORGANIZED, NEEDS_ORGANIZATION, SPACE_EFFICIENT, SPACE_WASTED
- 예산: BUDGET_STRICT, BUDGET_MODERATE, BUDGET_FLEXIBLE, VALUE_PROTECTION

대화에서 직접 언급하지 않았지만 추론 가능한 것도 포함합니다.
확실하지 않은 것은 null로 남겨두세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "extractedTags": ["HAS_CHILD", "CLEANING_SYSTEM_NEED"],
  "cleaningStyle": "lazy",
  "spaceInterests": ["living", "kitchen"],
  "budgetRange": {"min": 3000, "max": 5000},
  "familyInfo": {"totalMembers": 4, "hasChild": true, "hasElderly": false, "hasPet": "none"},
  "hiddenNeeds": ["청소 시간 부족 - 시스템 필요"],
  "confidence": 0.75
}`;

      // Phase 4: AI 호출 래퍼 적용 (enableLimit=false)
      const enableLimit = process.env.NEXT_PUBLIC_AI_RATE_LIMIT === 'true';
      const sessionId = request.headers.get('x-session-id') || undefined;
      
      response = await callAIWithLimit({
        sessionId,
        action: 'CHAT',
        prompt: { systemPrompt: analysisSystemPrompt, conversationText },
        enableLimit: false, // 🔒 Phase 4: 반드시 false
        aiCall: async () => {
          return await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: analysisSystemPrompt
              },
              {
                role: 'user',
                content: `다음 대화를 분석해주세요:\n\n${conversationText}`
              }
            ],
            max_tokens: 800,
            temperature: 0.3,
          });
        },
      });
    } catch (apiError) {
      console.error('OpenAI API 호출 에러:', apiError);
      return NextResponse.json({ 
        success: false, 
        error: apiError instanceof Error ? apiError.message : 'OpenAI API 호출 실패',
        isComplete: false
      }, { status: 500 });
    }

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error('GPT 응답이 비어있음:', response);
      return NextResponse.json({ 
        success: false, 
        error: '분석 결과를 받지 못했습니다.',
        isComplete: false
      }, { status: 500 });
    }

    // JSON 파싱
    let analysis: ChatAnalysisResult;
    let nextQuestion: string | undefined = undefined;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('JSON을 찾을 수 없음. 원본 응답:', content);
        throw new Error('JSON not found in response');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      
      // 분석 결과 추출
      analysis = {
        extractedTags: parsed.extractedTags || [],
        cleaningStyle: parsed.cleaningStyle || 'moderate',
        spaceInterests: parsed.spaceInterests || [],
        budgetRange: parsed.budgetRange || null,
        familyInfo: parsed.familyInfo || null,
        hiddenNeeds: parsed.hiddenNeeds || [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
      };
      
    } catch (parseError) {
      console.error('JSON 파싱 에러:', parseError);
      console.error('원본 응답:', content);
      // 기본값 반환
      analysis = {
        extractedTags: [],
        cleaningStyle: 'moderate',
        spaceInterests: [],
        budgetRange: null,
        familyInfo: null,
        hiddenNeeds: [],
        confidence: 0.5
      };
    }

    // 질문 생성은 질문 엔진에서만 수행 (이 API는 분석만 수행)
    // nextQuestion은 제거됨 - 질문 엔진 API를 별도로 호출해야 함

    return NextResponse.json({
      success: true,
      analysis,
      isComplete: isComplete || false
    });

  } catch (error) {
    console.error('대화 분석 에러:', error);
    console.error('에러 스택:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 에러',
      isComplete: false
    }, { status: 500 });
  }
}




