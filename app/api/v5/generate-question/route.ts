/**
 * V5 질문 생성 전용 API
 * 
 * 질문 생성은 오직 이 API를 통해서만 수행됩니다.
 * UX 레이어에서는 이 API를 호출하여 질문을 받아옵니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateQuestion } from '@/lib/analysis/v5-ultimate/question-engine';
import { ChatMessage, PhotoAnalysisResult } from '@/lib/analysis/v5-ultimate/types';

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

    // 질문 엔진 호출 (spaceInfo 전달)
    const result = await generateQuestion(chatMessages, photoAnalysis, styleResult, spaceInfo);

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
