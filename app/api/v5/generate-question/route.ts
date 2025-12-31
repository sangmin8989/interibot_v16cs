/**
 * V5 질문 생성 전용 API
 * 
 * 질문 생성은 오직 이 API를 통해서만 수행됩니다.
 * UX 레이어에서는 이 API를 호출하여 질문을 받아옵니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { generateQuestion } from '@/lib/analysis/v5-ultimate/question-engine';
import { ChatMessage, PhotoAnalysisResult } from '@/lib/analysis/v5-ultimate/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      messages, 
      photoAnalysis,
      styleResult,
      spaceInfo,
      lastAnswer,
      lastQuestionCode,
    }: { 
      messages: ChatMessage[]; 
      photoAnalysis: PhotoAnalysisResult | null;
      styleResult?: { styleTag?: string; keywords?: string[] } | null;
      spaceInfo?: {
        housingType?: string;
        pyeong?: number;
        rooms?: number;
        bathrooms?: number;
      } | null;
      lastAnswer?: string;
      lastQuestionCode?: string;
    } = body;

    // messages가 없거나 빈 배열이면 초기 질문 생성
    const chatMessages = messages || [];

    // 세션 ID 확보 (프론트에서 전달하거나 서버에서 생성)
    const sessionId =
      request.headers.get('x-session-id') ??
      crypto.randomUUID();

    // Supabase 서버용 클라이언트 생성 (SERVICE_ROLE_KEY 사용 - RLS 우회)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // ===== V5 ANSWER LOG (질문 생성 이전) =====
    if (lastAnswer && lastQuestionCode && sessionId) {
      try {
        const idx = chatMessages.filter(m => m.role === 'user').length - 1;

        await supabase.from('v5_question_answers').insert({
          session_id: sessionId,
          question_code: lastQuestionCode,
          idx,
          answer_value: lastAnswer,
          answer_type: 'QUICK',
        });
      } catch (e) {
        console.error('[V5_ANSWER_LOG_ERROR]', e);
      }
    }
    // ===== /V5 ANSWER LOG =====

    // 1) GPT 생성 시도 (짧은 프롬프트) → 실패 시 기존 엔진 fallback
    const result =
      (await generateQuestionWithGpt({
        messages: chatMessages,
        photoAnalysis,
        styleResult,
        spaceInfo,
      })) ??
      (await generateQuestion(chatMessages, photoAnalysis, styleResult, spaceInfo));

    // ===== V5 QUESTION LOG (Supabase) =====
    let questionCode: string | null = null;
    if (result && result.question) {
      try {
        const userMessagesCount = chatMessages.filter(m => m.role === 'user').length;
        const riskLevel = result.question.includes('관리규정') ||
                         result.question.includes('양중') ||
                         result.question.includes('주차')
          ? 'HIGH'
          : 'LOW';

        // question_code 결정 (질문 생성 시점에 1회만)
        questionCode =
          riskLevel === 'HIGH'
            ? 'V5_Q_RISK'
            : `V5_Q_${userMessagesCount}`;

        await supabase.from('v5_question_logs').insert({
          session_id: sessionId,
          idx: userMessagesCount,
          question_code: questionCode,
          risk_level: riskLevel,
          question: result.question,
          quick_replies: result.quickReplies,
          messages_count: chatMessages.length,
        });
      } catch (logError) {
        // 로그 실패는 서비스에 영향 주면 안 됨
        console.error('[V5_LOG_ERROR]', logError);
      }
    }
    // ===== /V5 QUESTION LOG =====

    if (!result) {
      // 모든 질문 완료
      return NextResponse.json({
        success: true,
        question: null,
        quickReplies: [],
        isComplete: true
      });
    }

    return NextResponse.json({
      success: true,
      question: result.question,
      quickReplies: result.quickReplies,
      question_code: questionCode, // ✅ 질문 코드 반환
      isComplete: false
    });

  } catch (error) {
    console.error('질문 생성 에러:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 에러'
    }, { status: 500 });
  }
}

/**
 * GPT 기반 질문 생성 (짧은 프롬프트)
 * 실패하면 null 반환 (기존 엔진이 처리)
 */
async function generateQuestionWithGpt(input: {
  messages: ChatMessage[];
  photoAnalysis: PhotoAnalysisResult | null;
  styleResult?: { styleTag?: string; keywords?: string[] } | null;
  spaceInfo?: {
    housingType?: string;
    pyeong?: number;
    rooms?: number;
    bathrooms?: number;
  } | null;
}): Promise<{ question: string; quickReplies: string[] } | null> {
  const { messages, photoAnalysis, styleResult, spaceInfo } = input;
  const userMessages = messages.filter((m) => m.role === 'user');

  // 5문 완료 시 종료
  if (userMessages.length >= 5) return null;

  // 대화 요약
  const summary =
    messages
      .map((m) => `${m.role === 'user' ? '고객' : '상담'}: ${m.content}`)
      .join('\n')
      .slice(0, 1500) || '대화 시작 전';

  const userPrompt = `[고객 정보]
- 주거형태: ${spaceInfo?.housingType ?? '미입력'}
- 평수: ${spaceInfo?.pyeong ?? '미입력'}평
- 방/욕실: ${spaceInfo?.rooms ?? '미입력'}개 / ${spaceInfo?.bathrooms ?? '미입력'}개

[선택한 스타일] ${styleResult?.styleTag ?? '미선택'}
[사진 분석] ${photoAnalysis ? photoAnalysis.spaceType : '없음'}

[지금까지 대화]
${summary}

규칙:
- 질문은 한 문장, 15자 이내, 존댓말, 친근하고 자연스럽게
- 이모지 1개 정도 사용 가능 (과하지 않게)
- 빠른답변(quickReplies) 4개, 짧고 자연스럽게
- JSON만 반환: {"question":"...","quickReplies":["...","...","...","..."]}

질문 수: ${userMessages.length}/5
다음 질문을 친근하게 생성해줘!`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            `너는 친근하고 따뜻한 인테리어 상담사 "인테리"야! 🏠
- 고객과 카톡 대화하듯이 자연스럽고 친근하게 말해
- 이모지를 적절히 사용해서 친근함을 표현해 (하지만 과하지 않게)
- 질문은 15자 이내, 존댓말, 한 문장으로 짧고 명확하게
- 예: "요리 자주 하시는 편이에요? 👨‍🍳" / "수납 공간은 어떤가요? 📦"
- JSON만 반환: {"question":"...","quickReplies":["...","...","...","..."]}`,
        },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0.6,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.question || !Array.isArray(parsed.quickReplies)) return null;

    return {
      question: parsed.question,
      quickReplies: parsed.quickReplies.slice(0, 6),
    };
  } catch (e) {
    console.error('[GPT_QUESTION_ERROR]', e);
    return null;
  }
}
