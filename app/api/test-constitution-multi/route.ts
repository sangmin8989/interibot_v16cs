// c:\interibot\app\api\test-constitution-multi\route.ts
// 헌법 v1 API 다중 공정 테스트

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const testCases = [
      {
        name: '철거 + 마감',
        input: {
          pyeong: 25,
          mode: 'PARTIAL' as const,
          spaces: ['living'],
          processSelections: {
            living: {
              demolition: true,
              finish: true,
            },
          },
        },
      },
      {
        name: '주방 공정',
        input: {
          pyeong: 25,
          mode: 'PARTIAL' as const,
          spaces: ['living'],
          processSelections: {
            living: {
              kitchen: true,
            },
          },
          kitchenCount: 1,
        },
      },
      {
        name: '욕실 공정',
        input: {
          pyeong: 25,
          mode: 'PARTIAL' as const,
          spaces: ['living'],
          processSelections: {
            living: {
              bathroom: true,
            },
          },
          bathroomCount: 1,
        },
      },
      {
        name: '전기 공정',
        input: {
          pyeong: 25,
          mode: 'PARTIAL' as const,
          spaces: ['living'],
          processSelections: {
            living: {
              electric: true,
            },
          },
        },
      },
      {
        name: '배관 공정',
        input: {
          pyeong: 25,
          mode: 'PARTIAL' as const,
          spaces: ['living'],
          processSelections: {
            living: {
              plumbing: true,
            },
          },
        },
      },
      {
        name: '전체 공정 (철거+마감+주방+욕실+전기)',
        input: {
          pyeong: 25,
          mode: 'PARTIAL' as const,
          spaces: ['living'],
          processSelections: {
            living: {
              demolition: true,
              finish: true,
              kitchen: true,
              bathroom: true,
              electric: true,
            },
          },
          kitchenCount: 1,
          bathroomCount: 1,
        },
      },
    ]

    const results = []

    for (const testCase of testCases) {
      try {
        const response = await fetch('http://localhost:3001/api/estimate/constitution', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase.input),
        })

        const result = await response.json()

        results.push({
          testName: testCase.name,
          status: response.status,
          success: result.success,
          processBlockCount: result.data?.processBlocks?.length || 0,
          grandTotal: result.data?.estimateResult?.totalWithVAT || result.data?.summary?.grandTotal || null,
          materialTotal: result.data?.estimateResult?.totalMaterial || null,
          laborTotal: result.data?.estimateResult?.totalLabor || null,
          processes: result.data?.processBlocks?.map((block: any) => ({
            processName: block.processName,
            processId: block.processId,
            materialTotal: block.materialTotal,
            laborTotal: block.laborTotal,
            itemCount: block.items?.length || 0,
          })) || [],
          failures: result.failures || null,
          error: result.error || null,
        })
      } catch (error) {
        results.push({
          testName: testCase.name,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        })
      }
    }

    // 요약 통계
    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalAmount: results
        .filter(r => r.success && r.grandTotal)
        .reduce((sum, r) => sum + (r.grandTotal || 0), 0),
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary,
      results,
    })
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }, { status: 500 })
  }
}







