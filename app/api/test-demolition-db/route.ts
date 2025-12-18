/**
 * 철거 DB 연결 테스트 API
 * 
 * GET /api/test-demolition-db
 * 
 * Supabase 철거 DB 연결 및 데이터 조회 테스트
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getFullDemolitionPackageFromDB,
  getBathroomItemByPyeong,
  getKitchenItemByPyeong,
  getWasteConfigFromDB,
  calculateProtectionCostFromDB,
  getDemolitionItemsByCategory
} from '@/lib/db/adapters/demolition-adapter'
import { calculateFullDemolitionBreakdown } from '@/lib/data/pricing-v3/demolition-packages'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: {},
    errors: [],
  }

  const testPyeong = 25 // 테스트용 평형

  // ============================================================
  // Test 1: 전체 철거 패키지 조회
  // ============================================================
  try {
    const packageData = await getFullDemolitionPackageFromDB(testPyeong, 'apartment')
    
    results.tests.fullPackage = {
      success: !!packageData,
      pyeong: testPyeong,
      data: packageData ? {
        package_id: packageData.package_id,
        package_name: packageData.package_name,
        total_price: packageData.total_price,
        price_per_pyeong: packageData.price_per_pyeong,
        includes: packageData.includes
      } : null,
      note: packageData 
        ? `✅ ${testPyeong}평 전체 철거 패키지 조회 성공` 
        : `⚠️ ${testPyeong}평 전체 철거 패키지 없음 (Fallback 사용)`
    }
  } catch (error: any) {
    results.tests.fullPackage = {
      success: false,
      error: error.message,
    }
    results.errors.push(`fullPackage: ${error.message}`)
  }

  // ============================================================
  // Test 2: 전체 철거 패키지 분해 (인건비/폐기물/보양)
  // ============================================================
  try {
    const breakdown = await calculateFullDemolitionBreakdown(
      testPyeong,
      'apartment',
      true, // hasElevator
      5     // hallwaySheets
    )
    
    results.tests.breakdown = {
      success: true,
      pyeong: testPyeong,
      data: {
        packagePrice: breakdown.packagePrice,
        wasteTon: breakdown.wasteTon,
        wasteCost: breakdown.wasteCost,
        laborCost: breakdown.laborCost,
        protectionCost: breakdown.protectionCost,
        elevatorCost: breakdown.elevatorCost,
        total: breakdown.packagePrice + breakdown.protectionCost + breakdown.elevatorCost
      },
      note: '✅ 전체 철거 패키지 분해 성공'
    }
  } catch (error: any) {
    results.tests.breakdown = {
      success: false,
      error: error.message,
    }
    results.errors.push(`breakdown: ${error.message}`)
  }

  // ============================================================
  // Test 3: 욕실 철거 항목 조회
  // ============================================================
  try {
    const bathroomItem = await getBathroomItemByPyeong(testPyeong)
    
    results.tests.bathroomItem = {
      success: !!bathroomItem,
      pyeong: testPyeong,
      data: bathroomItem ? {
        item_id: bathroomItem.item_id,
        item_name: bathroomItem.item_name,
        unit_price: bathroomItem.unit_price,
        includes: bathroomItem.includes
      } : null,
      note: bathroomItem 
        ? `✅ ${testPyeong}평 욕실 철거 항목 조회 성공` 
        : `⚠️ ${testPyeong}평 욕실 철거 항목 없음 (Fallback 사용)`
    }
  } catch (error: any) {
    results.tests.bathroomItem = {
      success: false,
      error: error.message,
    }
    results.errors.push(`bathroomItem: ${error.message}`)
  }

  // ============================================================
  // Test 4: 주방 철거 항목 조회
  // ============================================================
  try {
    const kitchenItem = await getKitchenItemByPyeong(testPyeong)
    
    results.tests.kitchenItem = {
      success: !!kitchenItem,
      pyeong: testPyeong,
      data: kitchenItem ? {
        item_id: kitchenItem.item_id,
        item_name: kitchenItem.item_name,
        unit_price: kitchenItem.unit_price,
        includes: kitchenItem.includes
      } : null,
      note: kitchenItem 
        ? `✅ ${testPyeong}평 주방 철거 항목 조회 성공` 
        : `⚠️ ${testPyeong}평 주방 철거 항목 없음 (Fallback 사용)`
    }
  } catch (error: any) {
    results.tests.kitchenItem = {
      success: false,
      error: error.message,
    }
    results.errors.push(`kitchenItem: ${error.message}`)
  }

  // ============================================================
  // Test 5: 폐기물 Config 조회
  // ============================================================
  try {
    const wasteConfig = await getWasteConfigFromDB(testPyeong)
    
    results.tests.wasteConfig = {
      success: !!wasteConfig,
      pyeong: testPyeong,
      data: wasteConfig ? {
        max_ton: wasteConfig.max_ton,
        price_per_ton: wasteConfig.price_per_ton,
        total_cost: wasteConfig.total_cost,
        description: wasteConfig.description
      } : null,
      note: wasteConfig 
        ? `✅ ${testPyeong}평 폐기물 Config 조회 성공` 
        : `⚠️ ${testPyeong}평 폐기물 Config 없음 (Fallback 사용)`
    }
  } catch (error: any) {
    results.tests.wasteConfig = {
      success: false,
      error: error.message,
    }
    results.errors.push(`wasteConfig: ${error.message}`)
  }

  // ============================================================
  // Test 6: 보양비 계산
  // ============================================================
  try {
    const protection = await calculateProtectionCostFromDB(true, 5)
    
    results.tests.protection = {
      success: true,
      data: {
        items: protection.items,
        total: protection.total
      },
      note: '✅ 보양비 계산 성공'
    }
  } catch (error: any) {
    results.tests.protection = {
      success: false,
      error: error.message,
    }
    results.errors.push(`protection: ${error.message}`)
  }

  // ============================================================
  // Test 7: 바닥재 철거 항목 조회
  // ============================================================
  try {
    const floorItems = await getDemolitionItemsByCategory('DEM-FLOOR', testPyeong)
    
    results.tests.floorItems = {
      success: true,
      pyeong: testPyeong,
      count: floorItems.length,
      data: floorItems.slice(0, 3).map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        unit_price: item.unit_price,
        is_package: item.is_package
      })),
      note: `✅ 바닥재 철거 항목 ${floorItems.length}개 조회 성공`
    }
  } catch (error: any) {
    results.tests.floorItems = {
      success: false,
      error: error.message,
    }
    results.errors.push(`floorItems: ${error.message}`)
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
    note: successCount === totalCount 
      ? '✅ 모든 테스트 통과! DB 연결 정상' 
      : successCount > 0 
        ? '⚠️ 일부 테스트 실패 (Fallback 사용 가능)' 
        : '❌ 모든 테스트 실패 (DB 연결 확인 필요)'
  }

  return NextResponse.json(results, {
    status: results.errors.length > 0 ? 200 : 200, // 정보성 에러는 200
  })
}












