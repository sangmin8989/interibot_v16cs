/**
 * 철거 공정 LOCK 상태 테스트
 * 
 * 목표: 철거 공정이 1개 이상 존재하면 LOCK 상태로 반환되는지 검증
 * 
 * 테스트 시나리오:
 * 1. 부분 철거 (도배만)
 * 2. 복수 공정 철거 (바닥 + 도배)
 * 3. 전체 철거
 * 
 * 검증 항목:
 * - 철거 항목에 isLocked: true
 * - lockReason 존재
 * - canOverride: false
 * - lockedProcesses 배열에 철거 공정 포함
 */

import { calculateFullEstimateV3 } from '@/lib/estimate/calculator-v3'
import type { EstimateInputV3 } from '@/lib/estimate/calculator-v3'

// 테스트 헬퍼: 철거 공정이 LOCK 상태인지 확인
function checkDemolitionLock(result: any, scenarioName: string) {
  // ✅ calculateFullEstimateV3 반환 구조: result.spaces.common
  const commonSpace = result.spaces?.common
  if (!commonSpace) {
    console.error(`❌ ${scenarioName}: 공통 공사 항목을 찾을 수 없습니다`)
    return false
  }

  // 철거 항목 찾기
  const demolitionItems = commonSpace.items?.filter((item: any) => 
    item.name.includes('철거') || item.name.includes('폐기물')
  ) || []

  if (demolitionItems.length === 0) {
    console.error(`❌ ${scenarioName}: 철거 항목이 없습니다`)
    return false
  }

  // 철거 항목이 모두 LOCK 상태인지 확인
  const nonLockedItems = demolitionItems.filter((item: any) => !item.isLocked)
  if (nonLockedItems.length > 0) {
    console.error(`❌ ${scenarioName}: LOCK 상태가 아닌 철거 항목이 있습니다:`)
    nonLockedItems.forEach((item: any) => {
      console.error(`   - ${item.name}: isLocked=${item.isLocked}`)
    })
    return false
  }

  // lockReason 확인
  const itemsWithoutReason = demolitionItems.filter((item: any) => !item.lockReason)
  if (itemsWithoutReason.length > 0) {
    console.error(`❌ ${scenarioName}: lockReason이 없는 철거 항목이 있습니다:`)
    itemsWithoutReason.forEach((item: any) => {
      console.error(`   - ${item.name}`)
    })
    return false
  }

  // canOverride 확인
  const overridableItems = demolitionItems.filter((item: any) => item.canOverride !== false)
  if (overridableItems.length > 0) {
    console.error(`❌ ${scenarioName}: canOverride가 false가 아닌 철거 항목이 있습니다:`)
    overridableItems.forEach((item: any) => {
      console.error(`   - ${item.name}: canOverride=${item.canOverride}`)
    })
    return false
  }

  // lockedProcesses 배열 확인
  if (!result.lockedProcesses || result.lockedProcesses.length === 0) {
    console.error(`❌ ${scenarioName}: lockedProcesses 배열이 없거나 비어있습니다`)
    return false
  }

  const demolitionLock = result.lockedProcesses.find((p: any) => p.processId === 'demolition')
  if (!demolitionLock) {
    console.error(`❌ ${scenarioName}: lockedProcesses에 철거 공정이 없습니다`)
    return false
  }

  if (demolitionLock.canOverride !== false) {
    console.error(`❌ ${scenarioName}: lockedProcesses의 철거 공정 canOverride가 false가 아닙니다`)
    return false
  }

  console.log(`✅ ${scenarioName}: 철거 공정 LOCK 상태 확인 완료`)
  console.log(`   - 철거 항목 ${demolitionItems.length}개 모두 LOCK 상태`)
  console.log(`   - lockReason: "${demolitionItems[0].lockReason}"`)
  console.log(`   - lockedProcesses에 철거 공정 포함: ${demolitionLock.processLabel}`)
  return true
}

// 시나리오 1: 부분 철거 (도배만)
async function testPartialDemolition() {
  console.log('\n📋 시나리오 1: 부분 철거 (도배만)')
  
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
    return checkDemolitionLock(result, '부분 철거 (도배만)')
  } catch (error: any) {
    console.error('❌ 부분 철거 테스트 실패:', error.message)
    return false
  }
}

// 시나리오 2: 복수 공정 철거 (바닥 + 도배)
async function testMultipleDemolition() {
  console.log('\n📋 시나리오 2: 복수 공정 철거 (바닥 + 도배)')
  
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
    return checkDemolitionLock(result, '복수 공정 철거 (바닥 + 도배)')
  } catch (error: any) {
    console.error('❌ 복수 공정 철거 테스트 실패:', error.message)
    return false
  }
}

// 시나리오 3: 전체 철거
async function testFullDemolition() {
  console.log('\n📋 시나리오 3: 전체 철거')
  
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
    return checkDemolitionLock(result, '전체 철거')
  } catch (error: any) {
    console.error('❌ 전체 철거 테스트 실패:', error.message)
    return false
  }
}

// 메인 테스트 실행
async function runTests() {
  console.log('🧪 철거 공정 LOCK 상태 테스트 시작')
  console.log('='.repeat(60))

  const results = {
    partial: await testPartialDemolition(),
    multiple: await testMultipleDemolition(),
    full: await testFullDemolition()
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 테스트 결과 요약:')
  console.log(`  부분 철거 (도배만): ${results.partial ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  복수 공정 철거 (바닥 + 도배): ${results.multiple ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  전체 철거: ${results.full ? '✅ 통과' : '❌ 실패'}`)

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

export { runTests, testPartialDemolition, testMultipleDemolition, testFullDemolition }













