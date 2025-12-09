/**
 * 면적 비율 시스템 테스트 스크립트
 * 
 * 실행 방법:
 * npx tsx test-space-area.ts
 * 또는
 * ts-node test-space-area.ts
 */

import { PYEONG_TO_M2 } from './lib/estimate/config'
import type { EstimateInput } from './lib/estimate/types'
import { calculateSpaceArea } from './lib/estimate/unified-calculator'

// 테스트 케이스
const 평수 = 43
const totalAreaM2 = 평수 * PYEONG_TO_M2

console.log('='.repeat(60))
console.log('면적 비율 시스템 테스트')
console.log('='.repeat(60))
console.log(`기준: ${평수}평 (${totalAreaM2.toFixed(2)}㎡)`)
console.log('')

// 테스트 케이스 1: 주방만 선택
const test1_input: EstimateInput = {
  평수: 평수,
  방개수: 3,
  욕실개수: 2,
}
const test1_spaces = ['kitchen']
const test1_result = calculateSpaceArea(totalAreaM2, test1_spaces, test1_input)
console.log('테스트 1: 주방만 선택')
console.log(`  선택 공간: ${test1_spaces.join(', ')}`)
console.log(`  계산 결과: ${test1_result}㎡`)
console.log(`  예상 결과: 약 15.6㎡`)
console.log(`  차이: ${Math.abs(test1_result - 15.6).toFixed(2)}㎡`)
console.log('')

// 테스트 케이스 2: 욕실만 선택
const test2_input: EstimateInput = {
  평수: 평수,
  방개수: 3,
  욕실개수: 2,
}
const test2_spaces = ['bathroom']
const test2_result = calculateSpaceArea(totalAreaM2, test2_spaces, test2_input)
console.log('테스트 2: 욕실만 선택 (욕실 2개)')
console.log(`  선택 공간: ${test2_spaces.join(', ')}`)
console.log(`  욕실 개수: ${test2_input.욕실개수}`)
console.log(`  계산 결과: ${test2_result}㎡`)
console.log(`  예상 결과: 약 11.4㎡`)
console.log(`  차이: ${Math.abs(test2_result - 11.4).toFixed(2)}㎡`)
console.log('')

// 테스트 케이스 3: 거실+안방 선택
const test3_input: EstimateInput = {
  평수: 평수,
  방개수: 3,
  욕실개수: 2,
}
const test3_spaces = ['living', 'masterBedroom']
const test3_result = calculateSpaceArea(totalAreaM2, test3_spaces, test3_input)
console.log('테스트 3: 거실+안방 선택')
console.log(`  선택 공간: ${test3_spaces.join(', ')}`)
console.log(`  계산 결과: ${test3_result}㎡`)
console.log(`  예상 결과: 약 56.8㎡`)
console.log(`  차이: ${Math.abs(test3_result - 56.8).toFixed(2)}㎡`)
console.log('')

// 테스트 케이스 4: 공간 미선택
const test4_input: EstimateInput = {
  평수: 평수,
  방개수: 3,
  욕실개수: 2,
}
const test4_spaces: string[] = []
const test4_result = calculateSpaceArea(totalAreaM2, test4_spaces, test4_input)
console.log('테스트 4: 공간 미선택')
console.log(`  선택 공간: [] (빈 배열)`)
console.log(`  계산 결과: ${test4_result}㎡`)
console.log(`  예상 결과: ${totalAreaM2.toFixed(2)}㎡ (전체)`)
console.log(`  차이: ${Math.abs(test4_result - totalAreaM2).toFixed(2)}㎡`)
console.log('')

console.log('='.repeat(60))
console.log('테스트 완료')
console.log('='.repeat(60))

