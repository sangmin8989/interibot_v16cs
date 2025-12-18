import { NextRequest, NextResponse } from 'next/server';

import { buildPreferenceScores } from '@/lib/analysis/engine';
import { PreferenceScores } from '@/lib/analysis/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body) {
      return NextResponse.json(
        { success: false, error: '요청 본문이 비어 있습니다.' },
        { status: 400 },
      );
    }

    const { preferences, answers } = body;

    // preferences 또는 answers 중 하나를 사용
    const effectiveAnswers = preferences ?? answers;

    if (!effectiveAnswers || typeof effectiveAnswers !== 'object' || Object.keys(effectiveAnswers).length === 0) {
      return NextResponse.json(
        { success: false, error: '분석에 필요한 답변이 존재하지 않습니다.' },
        { status: 400 },
      );
    }

    const scores: PreferenceScores = await buildPreferenceScores(effectiveAnswers, undefined, 'standard');

    return NextResponse.json(
      {
        success: true,
        preferences: scores,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Preference API 에러:', error);
    return NextResponse.json(
      {
        success: false,
        error: '선호도 분석 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}














