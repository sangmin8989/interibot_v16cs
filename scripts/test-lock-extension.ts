/**
 * LOCK 공정 확장 테스트
 * 
 * 명세서 3 기준:
 * - 방수: 욕실 포함 시 hard LOCK
 * - 전기: 회로 증설/분전반 = hard, 콘센트 일부 = soft
 * - 우선순위: 철거 > 방수 > 전기
 */

import { InterventionEngine } from '@/lib/analysis/engine-v3/engines/InterventionEngine'
import { convertTraitsToAxes } from '@/lib/analysis/types/judgment-axes'
import { aggregateChoiceVariables } from '@/lib/analysis/utils/choice-variables'
import type { RecommendedProcess } from '@/lib/analysis/engine-v3/types'

// 테스트용 공정 데이터
const mockProcesses: RecommendedProcess[] = [
  { id: 'demolition', label: '철거', category: '철거', priority: 'essential' as const, score: 100, reason: 'LOCK 테스트용 철거 공정' },
  { id: 'bathroom', label: '욕실 공사', category: '욕실', priority: 'essential' as const, score: 90, reason: 'LOCK 테스트용 욕실 공정' },
  { id: 'electric_circuit', label: '회로 증설', category: '전기', priority: 'recommended' as const, score: 80, reason: 'LOCK 테스트용 전기 회로 공정' },
  { id: 'electric_outlet', label: '콘센트 추가', category: '전기', priority: 'optional' as const, score: 70, reason: 'LOCK 테스트용 전기 콘센트 공정' },
  { id: 'kitchen', label: '주방 공사', category: '주방', priority: 'recommended' as const, score: 75, reason: 'LOCK 테스트용 주방 공정' },
]

// 테스트용 axes
const mockAxes = convertTraitsToAxes({
  수납중요도: 50,
  동선중요도: 50,
  조명취향: 50,
  소음민감도: 50,
  관리민감도: 50,
  스타일고집도: 50,
  색감취향: 50,
  가족영향도: 50,
  반려동물영향도: 50,
  예산탄력성: 50,
  공사복잡도수용성: 50,
  집값방어의식: 50,
})

// 시나리오 1: 방수 LOCK (욕실 포함)
function testWaterproofLock() {
  console.log('\n📋 시나리오 1: 방수 LOCK (욕실 포함)')
  
  const engine = new InterventionEngine()
  const result = engine.analyze({
    processes: mockProcesses,
    axes: mockAxes
  })

  const bathroomWarning = result.warnings.find(w => 
    w.processId === 'bathroom' || (w.processLabel && w.processLabel.includes('욕실'))
  )

  if (!bathroomWarning) {
    console.error('❌ 방수 LOCK 경고가 없습니다')
    return false
  }

  const reasonText = bathroomWarning.message || ''
  const passed = bathroomWarning.type === 'irreversible' &&
                 bathroomWarning.lockLevel === 'hard' &&
                 bathroomWarning.canOverride === false &&
                 reasonText.includes('누수')

  if (passed) {
    console.log(`✅ 방수 LOCK 확인:`)
    console.log(`   lockLevel: ${bathroomWarning.lockLevel}`)
    console.log(`   canOverride: ${bathroomWarning.canOverride}`)
    console.log(`   message: ${bathroomWarning.message}`)
  } else {
    console.error(`❌ 방수 LOCK 검증 실패:`)
    console.error(`   type: ${bathroomWarning.type} (기대: irreversible)`)
    console.error(`   lockLevel: ${bathroomWarning.lockLevel} (기대: hard)`)
    console.error(`   canOverride: ${bathroomWarning.canOverride} (기대: false)`)
    console.error(`   message: ${bathroomWarning.message}`)
  }

  return passed
}

// 시나리오 2: 전기 LOCK hard (회로 증설)
function testElectricalHardLock() {
  console.log('\n📋 시나리오 2: 전기 LOCK hard (회로 증설)')
  
  const engine = new InterventionEngine()
  const result = engine.analyze({
    processes: mockProcesses,
    axes: mockAxes
  })

  const circuitWarning = result.warnings.find(w => 
    w.processId === 'electric_circuit' || w.processLabel.includes('회로')
  )

  if (!circuitWarning) {
    console.error('❌ 전기 회로 LOCK 경고가 없습니다')
    return false
  }

  const reasonText = circuitWarning.message || ''
  const passed = circuitWarning.type === 'irreversible' &&
                 circuitWarning.lockLevel === 'hard' &&
                 circuitWarning.canOverride === false &&
                 reasonText.includes('전기')

  if (passed) {
    console.log(`✅ 전기 회로 LOCK 확인:`)
    console.log(`   lockLevel: ${circuitWarning.lockLevel}`)
    console.log(`   canOverride: ${circuitWarning.canOverride}`)
    console.log(`   message: ${circuitWarning.message}`)
  } else {
    console.error(`❌ 전기 회로 LOCK 검증 실패`)
    console.error(`   type: ${circuitWarning.type}`)
    console.error(`   lockLevel: ${circuitWarning.lockLevel}`)
    console.error(`   canOverride: ${circuitWarning.canOverride}`)
    console.error(`   message: ${circuitWarning.message}`)
  }

  return passed
}

// 시나리오 3: 전기 LOCK soft (콘센트 추가)
function testElectricalSoftLock() {
  console.log('\n📋 시나리오 3: 전기 LOCK soft (콘센트 추가)')
  
  const engine = new InterventionEngine()
  const result = engine.analyze({
    processes: mockProcesses,
    axes: mockAxes
  })

  const outletWarning = result.warnings.find(w => 
    w.processId === 'electric_outlet' || w.processLabel.includes('콘센트')
  )

  if (!outletWarning) {
    console.error('❌ 전기 콘센트 LOCK 경고가 없습니다')
    return false
  }

  const reasonText = outletWarning.message || ''
  const passed = outletWarning.type === 'irreversible' &&
                 outletWarning.lockLevel === 'soft' &&
                 reasonText.includes('전기')

  if (passed) {
    console.log(`✅ 전기 콘센트 LOCK 확인:`)
    console.log(`   lockLevel: ${outletWarning.lockLevel}`)
    console.log(`   canOverride: ${outletWarning.canOverride}`)
    console.log(`   message: ${outletWarning.message}`)
  } else {
    console.error(`❌ 전기 콘센트 LOCK 검증 실패`)
    console.error(`   message: ${outletWarning.message}`)
  }

  return passed
}

// 시나리오 4: 철거 LOCK 유지 확인
function testDemolitionLockMaintained() {
  console.log('\n📋 시나리오 4: 철거 LOCK 유지 확인')
  
  const engine = new InterventionEngine()
  const result = engine.analyze({
    processes: mockProcesses,
    axes: mockAxes
  })

  const demolitionWarning = result.warnings.find(w => 
    w.processId === 'demolition' || w.processLabel.includes('철거')
  )

  if (!demolitionWarning) {
    console.error('❌ 철거 LOCK 경고가 없습니다')
    return false
  }

  const passed = demolitionWarning.type === 'irreversible' &&
                 demolitionWarning.lockLevel === 'hard' &&
                 demolitionWarning.canOverride === false

  if (passed) {
    console.log(`✅ 철거 LOCK 유지 확인:`)
    console.log(`   lockLevel: ${demolitionWarning.lockLevel}`)
    console.log(`   canOverride: ${demolitionWarning.canOverride}`)
  } else {
    console.error(`❌ 철거 LOCK 검증 실패`)
  }

  return passed
}

// 메인 테스트 실행
function runTests() {
  console.log('🧪 LOCK 공정 확장 테스트 시작')
  console.log('='.repeat(60))

  const results = {
    waterproof: testWaterproofLock(),
    electricalHard: testElectricalHardLock(),
    electricalSoft: testElectricalSoftLock(),
    demolition: testDemolitionLockMaintained()
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 테스트 결과 요약:')
  console.log(`  방수 LOCK (욕실): ${results.waterproof ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  전기 LOCK hard (회로): ${results.electricalHard ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  전기 LOCK soft (콘센트): ${results.electricalSoft ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  철거 LOCK 유지: ${results.demolition ? '✅ 통과' : '❌ 실패'}`)

  const allPassed = Object.values(results).every(r => r === true)
  console.log('\n' + (allPassed ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패'))
  
  process.exit(allPassed ? 0 : 1)
}

// 실행
if (require.main === module) {
  runTests()
}

export { runTests, testWaterproofLock, testElectricalHardLock, testElectricalSoftLock, testDemolitionLockMaintained }












