/**
 * 인테리봇 견적 API V3
 * - V3 계산기 (calculator-v3.ts) 사용
 * - 클라이언트 사이드 계산을 서버로 이동
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateFullEstimateV3, type EstimateInputV3, type FullEstimateV3 } from '@/lib/estimate/calculator-v3'
// MaterialService 초기화 및 테스트
import '@/lib/services/material-service'

/**
 * ✅ 폴백 근절: 입력 정규화 및 검증
 * 
 * 규칙:
 * 1. py<=0이면 에러 (기본값 대체 금지)
 * 2. processSelections가 없으면 에러 (전체 시공 폴백 금지)
 * 3. mode="FULL" 명시적 선택만 전체 시공 허용
 * 4. processSelections가 단일 진실 소스
 */
function normalizeEstimateInput(input: EstimateInputV3): {
  normalized: EstimateInputV3
  errors: string[]
} {
  const errors: string[] = []

  // 1. 평수 검증 (기본값 대체 금지)
  if (!input.py || input.py <= 0) {
    errors.push('평수(py)는 필수이며 0보다 커야 합니다. 기본값으로 대체하지 않습니다.')
  }

  // 2. ✅ 헌법 적용: 등급 시스템 제거 - 항상 아르젠 기준으로 고정
  // 등급 검증 제거 (내부 정렬용 등급 정보는 유지 가능)

  // 3. ✅ 폴백 근절: processSelections 검증
  const hasProcessSelections = input.processSelections && Object.keys(input.processSelections).length > 0
  const isFullMode = (input as any).mode === 'FULL' // 명시적 전체 시공 모드
  
  if (!hasProcessSelections && !isFullMode) {
    errors.push('공정 선택(processSelections)이 없습니다. 공정을 선택하거나 mode="FULL"을 명시적으로 지정해주세요.')
  }

  // 4. 정규화된 입력 생성
  const normalized: EstimateInputV3 = {
    ...input,
    // ✅ 헌법 적용: 항상 아르젠 기준으로 고정
    grade: 'ARGEN' as any,
    // selectedSpaces는 UI 표시용으로만 사용, 계산에는 사용하지 않음
    selectedSpaces: input.selectedSpaces, // 보존하되 계산 로직에서는 무시
    // processSelections가 단일 진실 소스
    processSelections: input.processSelections || undefined,
    // mode="FULL" 명시적 표시
    ...(isFullMode && { mode: 'FULL' as any })
  }

  return { normalized, errors }
}

export async function POST(request: NextRequest) {
  // ✅ 스코프 문제 해결: input을 함수 상위 스코프로 이동
  let input: EstimateInputV3 | null = null
  
  try {
    input = await request.json()
    
    // ✅ TypeScript null 체크: input이 null이 아님을 확인
    if (!input) {
      return NextResponse.json(
        {
          success: false,
          error: '입력 데이터가 없습니다.',
        },
        { status: 400 }
      )
    }
    
    console.log('📥 /api/estimate/v3 요청 받음 (헌법 적용: 아르젠 기준 단일 견적):', {
      py: input.py,
      grade: 'ARGEN (고정)', // ✅ 헌법 적용: 항상 아르젠
      bathroomCount: input.bathroomCount,
      selectedSpaces: input.selectedSpaces?.length || 0,
      enabledProcessIds: input.enabledProcessIds?.length || 0,
      processSelections: input.processSelections ? Object.keys(input.processSelections).length : 0,
      mode: (input as any).mode
    })
    
    // ✅ 폴백 근절: 입력 정규화 및 검증
    const { normalized, errors } = normalizeEstimateInput(input)
    
    if (errors.length > 0) {
      console.error('❌ 입력 검증 실패:', errors)
      return NextResponse.json(
        {
          success: false,
          error: '입력 검증 실패',
          errors,
          received: {
            py: input.py,
            grade: 'ARGEN (고정)',
            hasProcessSelections: !!(input.processSelections && Object.keys(input.processSelections).length > 0),
            mode: (input as any).mode
          }
        },
        { status: 400 }
      )
    }
    
    // ✅ 정규화된 입력만 계산기에 전달
    const result: FullEstimateV3 = await calculateFullEstimateV3(normalized)
    
    console.log('✅ V3 견적 계산 완료 (아르젠 기준):', {
      standard: 'ARGEN (헌법 적용)',
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
    // ✅ Priority 3 수정: 에러 처리 개선
    console.error('❌ V3 견적 계산 에러:', error)
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const isValidationError = errorMessage.includes('필수') || errorMessage.includes('검증')
    
    return NextResponse.json(
      {
        success: false,
        error: isValidationError 
          ? errorMessage 
          : '견적 계산 중 오류가 발생했습니다. 입력 정보를 확인해주세요.',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
          input: input ? {
            py: input.py,
            grade: 'ARGEN (고정)',
            selectedSpaces: input.selectedSpaces?.length || 0,
            enabledProcessIds: input.enabledProcessIds?.length || 0
          } : undefined
        }),
      },
      { status: isValidationError ? 400 : 500 }
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
      '아르젠 기준 단일 견적 (헌법 적용)',
    ],
  })
}

