/**
 * 인테리봇 v5 - 통합 분석 API
 * 
 * 생활 만족도 + 집값 상승을 동시에 계산
 * 
 * POST /api/v5/comprehensive-analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { ComprehensiveAnalysisEngine } from '@/lib/engines';
import type { ComprehensiveAnalysisInput } from '@/lib/engines/comprehensive-analysis';

export async function POST(request: NextRequest) {
  try {
    // 요청 데이터 파싱
    const input: ComprehensiveAnalysisInput = await request.json();

    // 필수 파라미터 검증
    if (!input.selectedProcesses || input.selectedProcesses.length === 0) {
      return NextResponse.json(
        { error: 'selectedProcesses는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!input.pyeong || input.pyeong <= 0) {
      return NextResponse.json(
        { error: 'pyeong은 양수여야 합니다.' },
        { status: 400 }
      );
    }

    if (!input.buildingAge || input.buildingAge < 0) {
      return NextResponse.json(
        { error: 'buildingAge는 0 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    if (!input.totalCost || input.totalCost <= 0) {
      return NextResponse.json(
        { error: 'totalCost는 양수여야 합니다.' },
        { status: 400 }
      );
    }

    // 통합 분석 실행
    const result = ComprehensiveAnalysisEngine.analyze(input);

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Comprehensive Analysis API Error:', error);

    return NextResponse.json(
      {
        error: '분석 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
