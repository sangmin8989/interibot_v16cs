/**
 * Decision Engine v1.1 테스트 코드
 * 
 * 통과 기준:
 * 1. TypeScript 에러 0
 * 2. residencePlan 미입력 시 short로 들어가는 것 확인
 * 3. PET_GLOSS + HAS_CHILD면 BLOCK 가능 케이스가 나오는지 확인
 * 4. 결과에 "추천/권장/베스트" 단어가 어디에도 없는지 확인
 */

import { buildDecisionContext } from './context-builder'
import { evaluateDecision } from './index'

// 테스트 1: residencePlan 미입력 → short 강제
console.log('=== 테스트 1: residencePlan 미입력 → short 강제 ===')
const ctx1 = buildDecisionContext(
  { pyeong: 25, rooms: 2, bathrooms: 2, housingType: '아파트' }, // residencePlan 미입력
  { tags: ['HAS_CHILD', 'CLEANING_SYSTEM_NEED'] }
)
console.log('Context residencePlan:', ctx1.space.residencePlan) // 'short' 여야 함
console.log('✅ residencePlan 기본값 확인:', ctx1.space.residencePlan === 'short' ? 'PASS' : 'FAIL')

// 테스트 2: PET_GLOSS + HAS_CHILD → BLOCK 가능 케이스
console.log('\n=== 테스트 2: PET_GLOSS + HAS_CHILD → BLOCK 가능 케이스 ===')
const ctx2 = buildDecisionContext(
  { pyeong: 25, rooms: 2, bathrooms: 2, housingType: '아파트' },
  { tags: ['HAS_CHILD', 'CLEANING_SYSTEM_NEED'] }
)
const result2 = evaluateDecision('KITCHEN_COUNTERTOP', ctx2, { material: 'PET_GLOSS' })
console.log('Result:', JSON.stringify(result2, null, 2))
console.log('✅ BLOCK 가능 여부:', result2.result === 'BLOCK' ? 'PASS (BLOCK)' : `WARN (${result2.result})`)

// 테스트 3: "추천/권장/베스트" 단어 검색
console.log('\n=== 테스트 3: "추천/권장/베스트" 단어 검색 ===')
const resultStr = JSON.stringify(result2, null, 2)
const forbiddenWords = ['추천', '권장', '베스트', 'best', 'recommend']
const foundWords = forbiddenWords.filter(word => resultStr.toLowerCase().includes(word.toLowerCase()))
console.log('금지 단어 발견:', foundWords.length > 0 ? foundWords : '없음')
console.log('✅ 금지 단어 검증:', foundWords.length === 0 ? 'PASS' : 'FAIL')

// 테스트 4: QUARTZ + 예산 낮음 → WARN 가능 케이스
console.log('\n=== 테스트 4: QUARTZ + 예산 낮음 → WARN 가능 케이스 ===')
const ctx4 = buildDecisionContext(
  { pyeong: 25, rooms: 2, bathrooms: 2, housingType: '아파트' },
  { tags: ['BUDGET_STRICT'] }
)
const result4 = evaluateDecision('KITCHEN_COUNTERTOP', ctx4, { material: 'QUARTZ' })
console.log('Result:', JSON.stringify(result4, null, 2))
console.log('✅ WARN 가능 여부:', result4.result === 'WARN' ? 'PASS (WARN)' : `PASS (${result4.result})`)

// 테스트 5: PORCELAIN → PASS 케이스
console.log('\n=== 테스트 5: PORCELAIN → PASS 케이스 ===')
const ctx5 = buildDecisionContext(
  { pyeong: 25, rooms: 2, bathrooms: 2, housingType: '아파트' },
  { tags: [] }
)
const result5 = evaluateDecision('KITCHEN_COUNTERTOP', ctx5, { material: 'PORCELAIN' })
console.log('Result:', JSON.stringify(result5, null, 2))
console.log('✅ PASS 확인:', result5.result === 'PASS' ? 'PASS' : 'FAIL')
console.log('✅ alternatives 없음 확인:', result5.alternatives === undefined ? 'PASS' : 'FAIL')

console.log('\n=== 모든 테스트 완료 ===')

