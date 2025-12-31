/**
 * 철거 폐기물 중복 계산 테스트
 * 
 * 목표: 철거 공정이 1개 이상 존재하면 폐기물 비용은 현장 단위로 1회만 계산되는지 검증
 * 
 * 테스트 시나리오:
 * 1. 도배만 철거
 * 2. 바닥 + 도배 철거
 * 3. 주방만 철거
 * 4. 전체 철거
 */

import { calculateFullEstimateV3 } from '@/lib/estimate/calculator-v3'
import type { EstimateInputV3 } from '@/lib/estimate/calculator-v3'

// 테스트 헬퍼: 폐기물 비용이 1회만 계산되었는지 확인
function checkWasteCostOnce(result: any, scenarioName: string) {
  // ✅ calculateFullEstimateV3 반환 구조: result.spaces.common
  const commonSpace = result.spaces?.common
  if (!commonSpace) {
    console.error(`❌ ${scenarioName}: 공통 공사 항목을 찾을 수 없습니다`)
    return false
  }

  // 폐기물 처리 항목 개수 확인
  const wasteItems = commonSpace.items?.filter((item: any) => 
    item.name.includes('폐기물 처리') || item.name.includes('폐기물')
  ) || []

  if (wasteItems.length === 0) {
    console.error(`❌ ${scenarioName}: 폐기물 처리 항목이 없습니다`)
    return false
  }

  if (wasteItems.length > 1) {
    console.error(`❌ ${scenarioName}: 폐기물 처리 항목이 ${wasteItems.length}개입니다 (중복!)`)
    console.error('   중복 항목:', wasteItems.map((i: any) => i.name))
    return false
  }

  console.log(`✅ ${scenarioName}: 폐기물 처리 항목 1회만 계산됨 (${wasteItems[0].totalCost.toLocaleString()}원)`)
  return true
}

// 시나리오 1: 도배만 철거
async function testWallpaperOnly() {
  console.log('\n📋 시나리오 1: 도배만 철거')
  
  // ✅ calculateFullEstimateV3 입력 구조: EstimateInputV3
  const input: EstimateInputV3 = {
    py: 30,
    grade: 'STANDARD',
    bathroomCount: 2,
    // 도배만 선택 (벽지 교체 시 기존 벽지 철거 필요)
    processSelections: {
      living: {
        wall_finish: 'wallpaper'
      }
    }
  }

  try {
    const result = await calculateFullEstimateV3(input)
    return checkWasteCostOnce(result, '도배만 철거')
  } catch (error: any) {
    console.error('❌ 도배만 철거 테스트 실패:', error.message)
    return false
  }
}

// 시나리오 2: 바닥 + 도배 철거
async function testFloorAndWallpaper() {
  console.log('\n📋 시나리오 2: 바닥 + 도배 철거')
  
  // ✅ calculateFullEstimateV3 입력 구조: EstimateInputV3
  const input: EstimateInputV3 = {
    py: 30,
    grade: 'STANDARD',
    bathroomCount: 2,
    // 바닥 + 도배 (둘 다 철거 필요)
    processSelections: {
      living: {
        wall_finish: 'wallpaper',
        floor_finish: 'laminate'
      }
    }
  }

  try {
    const result = await calculateFullEstimateV3(input)
    return checkWasteCostOnce(result, '바닥 + 도배 철거')
  } catch (error: any) {
    console.error('❌ 바닥 + 도배 철거 테스트 실패:', error.message)
    return false
  }
}

// 시나리오 3: 주방만 철거
async function testKitchenOnly() {
  console.log('\n📋 시나리오 3: 주방만 철거')
  
  // ✅ calculateFullEstimateV3 입력 구조: EstimateInputV3
  const input: EstimateInputV3 = {
    py: 30,
    grade: 'STANDARD',
    bathroomCount: 2,
    // 주방만 선택
    processSelections: {
      kitchen: {
        kitchen_core: 'standard'
      }
    }
  }

  try {
    const result = await calculateFullEstimateV3(input)
    return checkWasteCostOnce(result, '주방만 철거')
  } catch (error: any) {
    console.error('❌ 주방만 철거 테스트 실패:', error.message)
    return false
  }
}

// 시나리오 4: 전체 철거
async function testFullDemolition() {
  console.log('\n📋 시나리오 4: 전체 철거')
  
  // ✅ calculateFullEstimateV3 입력 구조: EstimateInputV3
  // mode="FULL" 명시적 선택으로 전체 시공
  const input: EstimateInputV3 & { mode?: 'FULL' } = {
    py: 30,
    grade: 'STANDARD',
    bathroomCount: 2,
    mode: 'FULL' // 전체 시공 명시적 선택
  }

  try {
    const result = await calculateFullEstimateV3(input)
    return checkWasteCostOnce(result, '전체 철거')
  } catch (error: any) {
    console.error('❌ 전체 철거 테스트 실패:', error.message)
    return false
  }
}

// 메인 테스트 실행
async function runTests() {
  console.log('🧪 철거 폐기물 중복 계산 테스트 시작')
  console.log('='.repeat(60))

  const results = {
    wallpaperOnly: await testWallpaperOnly(),
    floorAndWallpaper: await testFloorAndWallpaper(),
    kitchenOnly: await testKitchenOnly(),
    fullDemolition: await testFullDemolition()
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 테스트 결과 요약:')
  console.log(`  도배만 철거: ${results.wallpaperOnly ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  바닥 + 도배 철거: ${results.floorAndWallpaper ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  주방만 철거: ${results.kitchenOnly ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  전체 철거: ${results.fullDemolition ? '✅ 통과' : '❌ 실패'}`)

  const allPassed = Object.values(results).every(r => r === true)
  console.log('\n' + (allPassed ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패'))
  
  process.exit(allPassed ? 0 : 1)
}

// 실행
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ 테스트 실행 중 오류:', error)
    process.exit(1)
  })
}

export { runTests, testWallpaperOnly, testFloorAndWallpaper, testKitchenOnly, testFullDemolition }




















