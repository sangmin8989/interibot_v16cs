// c:\interibot\app\api\test-constitution-api\route.ts
// 헌법 v1 API 실제 테스트

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 샘플 입력 데이터 (25평 아파트, 철거 + 마감 공정)
    const testInput = {
      pyeong: 25,
      mode: 'PARTIAL' as const,
      spaces: ['living'],
      processSelections: {
        living: {
          demolition: true,
          finish: true,
        },
      },
    }

    // 헌법 API 호출
    const response = await fetch('http://localhost:3001/api/estimate/constitution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testInput),
    })

    const result = await response.json()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      test: {
        input: testInput,
        status: response.status,
        success: result.success,
        hasData: !!result.data,
        error: result.error || null,
        message: result.message || null,
        failures: result.failures || null, // 실패 원인 상세 정보
      },
      result: result.success ? {
        estimateStatus: result.data?.status,
        hasProcessBlocks: !!result.data?.processBlocks,
        processBlockCount: result.data?.processBlocks?.length || 0,
        hasSummary: !!result.data?.summary,
        hasEstimateResult: !!result.data?.estimateResult,
        grandTotal: result.data?.estimateResult?.totalWithVAT || result.data?.summary?.grandTotal || null,
        materialTotal: result.data?.estimateResult?.totalMaterial || null,
        laborTotal: result.data?.estimateResult?.totalLabor || null,
        // 첫 번째 공정 블록 정보
        firstProcessBlock: result.data?.processBlocks?.[0] ? {
          processName: result.data.processBlocks[0].processName,
          processId: result.data.processBlocks[0].processId,
          materialTotal: result.data.processBlocks[0].materialTotal,
          laborTotal: result.data.processBlocks[0].laborTotal,
        } : null,
      } : {
        failures: result.failures || null,
        failedProcesses: result.failures?.failedProcesses || [],
        reasons: result.failures?.reasons || [],
      },
    })
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      test: {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
    }, { status: 500 })
  }
}







