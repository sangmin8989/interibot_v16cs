/**
 * 인테리봇 견적 API V3
 * - V3 계산기 (calculator-v3.ts) 사용
 * - 클라이언트 사이드 계산을 서버로 이동
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateFullEstimateV3, type EstimateInputV3, type FullEstimateV3 } from '@/lib/estimate/calculator-v3'
// MaterialService 초기화 및 테스트
import '@/lib/services/material-service'

export async function POST(request: NextRequest) {
  try {
    const input: EstimateInputV3 = await request.json()
    
    console.log('📥 /api/estimate/v3 요청 받음:', {
      py: input.py,
      grade: input.grade,
      bathroomCount: input.bathroomCount,
      selectedSpaces: input.selectedSpaces?.length || 0,
      enabledProcessIds: input.enabledProcessIds?.length || 0,
    })
    
    // 필수 입력 검증
    if (!input.py || input.py <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: '평수(py)는 필수이며 0보다 커야 합니다.',
          received: { py: input.py },
        },
        { status: 400 }
      )
    }
    
    if (!input.grade) {
      return NextResponse.json(
        {
          success: false,
          error: '등급(grade)은 필수입니다.',
          received: { grade: input.grade },
        },
        { status: 400 }
      )
    }
    
    // 견적 계산 실행
    const result: FullEstimateV3 = calculateFullEstimateV3(input)
    
    console.log('✅ V3 견적 계산 완료:', {
      grade: result.input.gradeName,
      materialTotal: `${(result.summary.materialTotal / 10000).toFixed(0)}만원`,
      laborTotal: `${(result.summary.laborTotal / 10000).toFixed(0)}만원`,
      grandTotal: `${(result.summary.grandTotal / 10000).toFixed(0)}만원`,
      pricePerPy: `${(result.summary.pricePerPy / 10000).toFixed(0)}만원/평`,
    })
    
    return NextResponse.json({
      success: true,
      data: result,
    })
    
  } catch (error) {
    console.error('❌ V3 견적 계산 에러:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: '견적 계산 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    )
  }
}

/**
 * GET 메서드: API 정보 반환
 */
export async function GET() {
  return NextResponse.json({
    message: '인테리봇 견적 API V3',
    description: 'V3 계산기 (calculator-v3.ts)를 사용하는 견적 API',
    version: '3.0',
    endpoint: '/api/estimate/v3',
    method: 'POST',
    inputType: 'EstimateInputV3',
    outputType: 'FullEstimateV3',
    features: [
      '공간별 분리 견적',
      '세부 옵션 지원 (주방/욕실)',
      '공정별 선택 가능',
      '4등급 비교 (BASIC/STANDARD/ARGEN/PREMIUM)',
    ],
  })
}

