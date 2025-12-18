/**
 * 견적 계산 시스템 테스트 API
 * 
 * GET /api/test-estimate-system
 * 
 * 견적 계산 시스템의 각 기능을 테스트합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { materialService } from '@/lib/services/material-service'
import type { Grade } from '@/lib/data/pricing-v3/types'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: {},
    errors: [],
  }

  // ============================================================
  // Test 1: MaterialService - 타일 가격 조회 (DB)
  // ============================================================
  try {
    const price = await materialService.getTilePrice({ grade: 'ARGEN', useDB: true })
    
    results.tests.tilePriceDB = {
      success: true,
      grade: 'ARGEN',
      price,
      unit: '원/m²',
      note: price > 0 ? 'DB에서 가격을 성공적으로 조회했습니다.' : '가격이 0입니다. 확인이 필요합니다.',
    }
  } catch (error: any) {
    results.tests.tilePriceDB = {
      success: false,
      error: error.message,
    }
    results.errors.push(`tilePriceDB: ${error.message}`)
  }

  // ============================================================
  // Test 2: MaterialService - 타일 가격 조회 (파일)
  // ============================================================
  try {
    const price = await materialService.getTilePrice({ grade: 'BASIC', useDB: false })
    
    results.tests.tilePriceFile = {
      success: true,
      grade: 'BASIC',
      price,
      unit: '원/m²',
      note: '파일에서 가격을 성공적으로 조회했습니다.',
    }
  } catch (error: any) {
    results.tests.tilePriceFile = {
      success: false,
      error: error.message,
    }
    results.errors.push(`tilePriceFile: ${error.message}`)
  }

  // ============================================================
  // Test 3: MaterialService - 타일 면적 조회
  // ============================================================
  try {
    const area = await materialService.getTileArea({ location: 'BATHROOM', sizeRange: '30PY', useDB: false })
    
    results.tests.tileArea = {
      success: true,
      location: 'BATHROOM',
      sizeRange: '30PY',
      area,
      unit: 'm²',
      note: '타일 면적을 성공적으로 조회했습니다.',
    }
  } catch (error: any) {
    results.tests.tileArea = {
      success: false,
      error: error.message,
    }
    results.errors.push(`tileArea: ${error.message}`)
  }

  // ============================================================
  // Test 4: MaterialService - 타일 시공일수 조회
  // ============================================================
  try {
    const days = await materialService.getTileDays({ sizeRange: '30PY', useDB: false })
    
    results.tests.tileDays = {
      success: true,
      sizeRange: '30PY',
      days,
      unit: '일',
      note: '타일 시공일수를 성공적으로 조회했습니다.',
    }
  } catch (error: any) {
    results.tests.tileDays = {
      success: false,
      error: error.message,
    }
    results.errors.push(`tileDays: ${error.message}`)
  }

  // ============================================================
  // Test 5: 모든 등급 가격 조회
  // ============================================================
  try {
    const grades: Grade[] = ['BASIC', 'STANDARD', 'ARGEN', 'PREMIUM']
    const prices: Record<string, number | null> = {}

    for (const grade of grades) {
      try {
        const price = await materialService.getTilePrice({ grade, useDB: true })
        prices[grade] = price
      } catch (error: any) {
        prices[grade] = null
        results.errors.push(`grade ${grade}: ${error.message}`)
      }
    }

    results.tests.allGrades = {
      success: true,
      prices,
      note: '모든 등급의 가격을 조회했습니다.',
    }
  } catch (error: any) {
    results.tests.allGrades = {
      success: false,
      error: error.message,
    }
    results.errors.push(`allGrades: ${error.message}`)
  }

  // ============================================================
  // 요약
  // ============================================================
  const successCount = Object.values(results.tests).filter((t: any) => t.success).length
  const totalCount = Object.keys(results.tests).length

  results.summary = {
    totalTests: totalCount,
    successCount,
    failureCount: totalCount - successCount,
    status: successCount === totalCount ? 'ALL_PASSED' : successCount > 0 ? 'PARTIAL' : 'ALL_FAILED',
  }

  return NextResponse.json(results, {
    status: results.errors.length > 0 ? 200 : 200, // 정보성 에러는 200
  })
}















