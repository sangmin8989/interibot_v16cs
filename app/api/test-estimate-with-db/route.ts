/**
 * 견적 계산 + DB 연결 통합 테스트 API
 * 
 * POST /api/test-estimate-with-db
 * 
 * 실제 견적 계산이 DB를 제대로 사용하는지 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateFullEstimateV3, type EstimateInputV3 } from '@/lib/estimate/calculator-v3'

export async function POST(request: NextRequest) {
  try {
    // 테스트용 입력 데이터 (25평, 전체 공정)
    const testInput: EstimateInputV3 = {
      py: 25,
      grade: 'STANDARD',
      bathroomCount: 1,
      selectedSpaces: ['living', 'kitchen', 'bathroom', 'room'],
      enabledProcessIds: ['demolition', 'finish', 'kitchen', 'bathroom', 'door', 'electric'],
      detailOptions: {},
      processSelections: {},
      isExtended: false,
      closetType: 'SWING',
      includeFoldingDoor: false,
      foldingDoorCount: 5,
      includeBidet: false,
      includeBathtub: false,
      includeDoorlock: true,
      includeLighting: true
    }

    console.log('🧪 견적 + DB 테스트 시작:', {
      py: testInput.py,
      grade: testInput.grade,
      enabledProcessIds: testInput.enabledProcessIds
    })

    // 견적 계산 실행
    const result = await calculateFullEstimateV3(testInput)

    // 철거 관련 항목 확인
    const commonItems = result.spaces.common.items
    const demolitionItems = commonItems.filter(item => 
      item.name.includes('철거') || item.name.includes('폐기물')
    )

    console.log('✅ 견적 계산 완료:', {
      grandTotal: `${(result.summary.grandTotal / 10000).toFixed(0)}만원`,
      demolitionItemsCount: demolitionItems.length,
      demolitionItems: demolitionItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        totalCost: item.totalCost
      }))
    })

    return NextResponse.json({
      success: true,
      test: {
        input: {
          py: testInput.py,
          grade: testInput.grade,
          enabledProcessIds: testInput.enabledProcessIds
        },
        result: {
          grandTotal: result.summary.grandTotal,
          materialTotal: result.summary.materialTotal,
          laborTotal: result.summary.laborTotal,
          pricePerPy: result.summary.pricePerPy
        },
        demolition: {
          items: demolitionItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            note: item.note,
            totalCost: item.totalCost
          })),
          totalCost: demolitionItems.reduce((sum, item) => sum + item.totalCost, 0)
        },
        commonItems: commonItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          totalCost: item.totalCost
        }))
      },
      note: '✅ 견적 계산이 DB를 사용하여 완료되었습니다. 철거 항목이 제대로 표시되는지 확인하세요.'
    })

  } catch (error: any) {
    console.error('❌ 견적 + DB 테스트 에러:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET 요청 시 테스트 실행
export async function GET() {
  const testRequest = new NextRequest('http://localhost/api/test-estimate-with-db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  
  return POST(testRequest)
}












