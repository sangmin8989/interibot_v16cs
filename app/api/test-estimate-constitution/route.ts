/**
 * 헌법 v1 기반 견적 통합 테스트 API
 * 
 * GET /api/test-estimate-constitution
 * 
 * 헌법 v1 견적엔진의 동작을 테스트합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateFinalEstimateV1 } from '@/lib/estimate/constitution-v1-engine'
import type { EstimateGenerationOptions, ProcessMode, SelectedSpace, ProcessId } from '@/lib/types/헌법_견적_타입'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {},
  }

  // =====================================================
  // 테스트 1: 전체 공정 (FULL) 모드 테스트
  // =====================================================
  try {
    console.log('🧪 테스트 1: 전체 공정 모드 시작')
    
    const fullModeOptions: EstimateGenerationOptions = {
      pyeong: 30,
      mode: 'FULL' as ProcessMode,
      spaces: ['living', 'kitchen', 'bathroom', 'room'] as SelectedSpace[],
      processSelections: {
        living: {
          wall_finish: 'wallpaper',
          floor_finish: 'engineered_wood',
          electric_lighting: 'basic',
        },
        kitchen: {
          kitchen_core: 'full',
          kitchen_countertop: 'engineered',
          wall_finish: 'tile',
        },
        bathroom: {
          bathroom_core: 'full',
        },
      },
    }

    const fullResult = await calculateFinalEstimateV1(fullModeOptions)
    
    results.tests.push({
      name: '테스트 1: 전체 공정 (FULL) 모드',
      status: fullResult.status === 'SUCCESS' ? 'PASS' : 'FAIL',
      input: {
        pyeong: fullModeOptions.pyeong,
        mode: fullModeOptions.mode,
        spacesCount: fullModeOptions.spaces.length,
      },
      output: {
        status: fullResult.status,
        processBlocksCount: fullResult.processBlocks?.length || 0,
        standard: fullResult.standard,
        summary: fullResult.summary,
        failures: fullResult.failures,
      },
    })
    
    console.log('✅ 테스트 1 완료:', fullResult.status)
  } catch (error: any) {
    console.error('❌ 테스트 1 에러:', error.message)
    results.tests.push({
      name: '테스트 1: 전체 공정 (FULL) 모드',
      status: 'ERROR',
      error: error.message,
    })
  }

  // =====================================================
  // 테스트 2: 부분 공정 (PARTIAL) 모드 테스트
  // =====================================================
  try {
    console.log('🧪 테스트 2: 부분 공정 모드 시작')
    
    const partialModeOptions: EstimateGenerationOptions = {
      pyeong: 25,
      mode: 'PARTIAL' as ProcessMode,
      spaces: ['bathroom'] as SelectedSpace[],
      processSelections: {
        bathroom: {
          bathroom_core: 'full',
        },
      },
    }

    const partialResult = await calculateFinalEstimateV1(partialModeOptions)
    
    // 필수 연동 공정 확인 (욕실 → 철거, 전기, 방수, 설비)
    const processIds = partialResult.processBlocks?.map((b: any) => b.processId) || []
    const hasRequiredLinkedProcesses = 
      processIds.includes('demolition') ||
      processIds.includes('electric') ||
      processIds.includes('waterproof') ||
      processIds.includes('plumbing')
    
    results.tests.push({
      name: '테스트 2: 부분 공정 (PARTIAL) 모드',
      status: partialResult.status === 'SUCCESS' ? 'PASS' : 'FAIL',
      input: {
        pyeong: partialModeOptions.pyeong,
        mode: partialModeOptions.mode,
        selectedProcess: 'bathroom',
      },
      output: {
        status: partialResult.status,
        processBlocksCount: partialResult.processBlocks?.length || 0,
        processIds,
        hasRequiredLinkedProcesses,
        summary: partialResult.summary,
      },
    })
    
    console.log('✅ 테스트 2 완료:', partialResult.status)
  } catch (error: any) {
    console.error('❌ 테스트 2 에러:', error.message)
    results.tests.push({
      name: '테스트 2: 부분 공정 (PARTIAL) 모드',
      status: 'ERROR',
      error: error.message,
    })
  }

  // =====================================================
  // 테스트 3: 공정 블록 구조 검증
  // =====================================================
  try {
    console.log('🧪 테스트 3: 공정 블록 구조 검증')
    
    const blockTestOptions: EstimateGenerationOptions = {
      pyeong: 28,
      mode: 'PARTIAL' as ProcessMode,
      spaces: ['kitchen'] as SelectedSpace[],
      processSelections: {
        kitchen: {
          kitchen_core: 'full',
        },
      },
    }

    const blockResult = await calculateFinalEstimateV1(blockTestOptions)
    
    // 공정 블록 구조 확인
    const firstBlock = blockResult.processBlocks?.[0]
    const hasRequiredFields = firstBlock && (
      'processName' in firstBlock &&
      'processId' in firstBlock &&
      'processType' in firstBlock &&
      'materials' in firstBlock &&
      'labor' in firstBlock
    )
    
    results.tests.push({
      name: '테스트 3: 공정 블록 구조 검증',
      status: hasRequiredFields ? 'PASS' : 'FAIL',
      input: {
        pyeong: blockTestOptions.pyeong,
        selectedProcess: 'kitchen',
      },
      output: {
        hasRequiredFields,
        firstBlockStructure: firstBlock ? {
          processName: firstBlock.processName,
          processId: firstBlock.processId,
          processType: firstBlock.processType,
          hasMaterials: Array.isArray(firstBlock.materials),
          hasLabor: !!firstBlock.labor,
          hasInclusions: Array.isArray(firstBlock.inclusions),
          hasExclusions: Array.isArray(firstBlock.exclusions),
          hasAssumptions: Array.isArray(firstBlock.assumptions),
        } : null,
      },
    })
    
    console.log('✅ 테스트 3 완료')
  } catch (error: any) {
    console.error('❌ 테스트 3 에러:', error.message)
    results.tests.push({
      name: '테스트 3: 공정 블록 구조 검증',
      status: 'ERROR',
      error: error.message,
    })
  }

  // =====================================================
  // 요약
  // =====================================================
  const passedTests = results.tests.filter((t: any) => t.status === 'PASS').length
  const failedTests = results.tests.filter((t: any) => t.status === 'FAIL').length
  const errorTests = results.tests.filter((t: any) => t.status === 'ERROR').length
  
  results.summary = {
    totalTests: results.tests.length,
    passed: passedTests,
    failed: failedTests,
    errors: errorTests,
    status: errorTests === 0 && failedTests === 0 ? 'ALL_PASS' : 'HAS_ISSUES',
  }

  return NextResponse.json(results)
}










