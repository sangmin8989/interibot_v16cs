/**
 * Phase 3: 선택권 변수 테스트
 * 
 * 목표: 질문 답변 변경 시 optionCount, lockStrength, defaultPlan 변화 확인
 * 
 * 테스트 시나리오:
 * 1. Q1 답변 변경 → optionCount, lockStrength 변화 확인
 * 2. Q3 답변 변경 → optionCount, defaultPlan 변화 확인
 * 3. 모든 답변 "넘기기" → 기본값 유지 확인
 * 4. 여러 답변 조합 → 종합 결과 확인
 */

import { calculateChoiceVariables, aggregateChoiceVariables } from '@/lib/analysis/utils/choice-variables'

// 시나리오 1: Q1 답변 변경 테스트
function testQ1AnswerChanges() {
  console.log('\n📋 시나리오 1: Q1 답변 변경 → optionCount, lockStrength 변화')
  
  const testCases = [
    { answer: 'strongly_agree', expected: { optionCount: 2, lockStrength: 80, defaultPlan: true } },
    { answer: 'agree', expected: { optionCount: 3, lockStrength: 60, defaultPlan: true } },
    { answer: 'neutral', expected: { optionCount: 3, lockStrength: 40, defaultPlan: false } },
    { answer: 'disagree', expected: { optionCount: 4, lockStrength: 20, defaultPlan: false } },
    { answer: 'ai_choice', expected: { optionCount: 2, lockStrength: 70, defaultPlan: true } },
    { answer: 'skip', expected: {} }, // 넘기기는 변화 없음
  ]

  let allPassed = true
  testCases.forEach(({ answer, expected }) => {
    const result = calculateChoiceVariables('judgment_irreversible_priority', answer)
    
    const passed = Object.keys(expected).every(key => {
      const expectedValue = (expected as any)[key]
      const actualValue = (result as any)[key]
      return expectedValue === actualValue
    })

    if (!passed) {
      console.error(`❌ Q1 "${answer}": 기대값과 다릅니다`)
      console.error(`   기대: ${JSON.stringify(expected)}`)
      console.error(`   실제: ${JSON.stringify(result)}`)
      allPassed = false
    } else {
      console.log(`✅ Q1 "${answer}": ${JSON.stringify(result)}`)
    }
  })

  return allPassed
}

// 시나리오 2: Q3 답변 변경 테스트 (통제 욕구)
function testQ3AnswerChanges() {
  console.log('\n📋 시나리오 2: Q3 답변 변경 → optionCount, defaultPlan 변화')
  
  const testCases = [
    { answer: 'ai_recommend', expected: { optionCount: 2, lockStrength: 70, defaultPlan: true } },
    { answer: 'compare_2_3', expected: { optionCount: 3, lockStrength: 40, defaultPlan: false } },
    { answer: 'detail_select', expected: { optionCount: 4, lockStrength: 10, defaultPlan: false } },
    { answer: 'ai_choice', expected: { optionCount: 3, lockStrength: 50, defaultPlan: false } },
  ]

  let allPassed = true
  testCases.forEach(({ answer, expected }) => {
    const result = calculateChoiceVariables('judgment_choice_preference', answer)
    
    const passed = Object.keys(expected).every(key => {
      const expectedValue = (expected as any)[key]
      const actualValue = (result as any)[key]
      return expectedValue === actualValue
    })

    if (!passed) {
      console.error(`❌ Q3 "${answer}": 기대값과 다릅니다`)
      console.error(`   기대: ${JSON.stringify(expected)}`)
      console.error(`   실제: ${JSON.stringify(result)}`)
      allPassed = false
    } else {
      console.log(`✅ Q3 "${answer}": ${JSON.stringify(result)}`)
    }
  })

  return allPassed
}

// 시나리오 3: 모든 답변 "넘기기"
function testAllSkip() {
  console.log('\n📋 시나리오 3: 모든 답변 "넘기기" → 기본값 유지')
  
  const answers = {
    'judgment_irreversible_priority': 'skip',
    'judgment_construction_dislike': 'skip',
    'judgment_choice_preference': 'skip',
    'judgment_decision_delay': 'skip',
    'judgment_inconvenience_preference': 'skip',
    'judgment_maintenance_tradeoff': 'skip',
  }

  const result = aggregateChoiceVariables(answers)
  
  // 넘기기만 있으면 기본값 (optionCount: 3, lockStrength: 50, defaultPlan: false)
  const expected = {
    optionCount: 3,
    lockStrength: 50,
    defaultPlan: false
  }

  const passed = result.optionCount === expected.optionCount &&
                result.lockStrength === expected.lockStrength &&
                result.defaultPlan === expected.defaultPlan

  if (!passed) {
    console.error(`❌ 모든 답변 "넘기기": 기대값과 다릅니다`)
    console.error(`   기대: ${JSON.stringify(expected)}`)
    console.error(`   실제: ${JSON.stringify(result)}`)
    return false
  }

  console.log(`✅ 모든 답변 "넘기기": 기본값 유지 확인`)
  console.log(`   결과: ${JSON.stringify(result)}`)
  return true
}

// 시나리오 4: 여러 답변 조합
function testMultipleAnswers() {
  console.log('\n📋 시나리오 4: 여러 답변 조합 → 종합 결과 확인')
  
  // 리스크 회피도 높음 + 통제 욕구 낮음 → 강한 잠금, 적은 선택지
  const answers1 = {
    'judgment_irreversible_priority': 'strongly_agree', // lockStrength: 80, optionCount: 2
    'judgment_choice_preference': 'ai_recommend', // lockStrength: 70, optionCount: 2
  }

  const result1 = aggregateChoiceVariables(answers1)
  
  // optionCount는 가장 작은 값 (2), lockStrength는 평균 (75), defaultPlan은 하나라도 true면 true
  const expected1 = {
    optionCount: 2,
    lockStrength: 75, // (80 + 70) / 2
    defaultPlan: true
  }

  const passed1 = result1.optionCount === expected1.optionCount &&
                  Math.abs(result1.lockStrength - expected1.lockStrength) <= 1 && // 반올림 오차 허용
                  result1.defaultPlan === expected1.defaultPlan

  if (!passed1) {
    console.error(`❌ 조합 1: 기대값과 다릅니다`)
    console.error(`   기대: ${JSON.stringify(expected1)}`)
    console.error(`   실제: ${JSON.stringify(result1)}`)
    return false
  }

  console.log(`✅ 조합 1 (리스크 회피 높음 + 통제 욕구 낮음): ${JSON.stringify(result1)}`)

  // 비용 민감도 높음 + 통제 욕구 높음 → 약한 잠금, 많은 선택지
  const answers2 = {
    'judgment_inconvenience_preference': 'more_money', // lockStrength: 35, optionCount: 4
    'judgment_choice_preference': 'detail_select', // lockStrength: 10, optionCount: 4
  }

  const result2 = aggregateChoiceVariables(answers2)
  
  const expected2 = {
    optionCount: 4, // 가장 작은 값이지만 둘 다 4
    lockStrength: 22, // (35 + 10) / 2
    defaultPlan: false
  }

  const passed2 = result2.optionCount === expected2.optionCount &&
                  Math.abs(result2.lockStrength - expected2.lockStrength) <= 1 &&
                  result2.defaultPlan === expected2.defaultPlan

  if (!passed2) {
    console.error(`❌ 조합 2: 기대값과 다릅니다`)
    console.error(`   기대: ${JSON.stringify(expected2)}`)
    console.error(`   실제: ${JSON.stringify(result2)}`)
    return false
  }

  console.log(`✅ 조합 2 (비용 민감 높음 + 통제 욕구 높음): ${JSON.stringify(result2)}`)

  return true
}

// 메인 테스트 실행
function runTests() {
  console.log('🧪 선택권 변수 테스트 시작')
  console.log('='.repeat(60))

  const results = {
    q1: testQ1AnswerChanges(),
    q3: testQ3AnswerChanges(),
    allSkip: testAllSkip(),
    multiple: testMultipleAnswers()
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 테스트 결과 요약:')
  console.log(`  Q1 답변 변경: ${results.q1 ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  Q3 답변 변경: ${results.q3 ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  모든 답변 "넘기기": ${results.allSkip ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  여러 답변 조합: ${results.multiple ? '✅ 통과' : '❌ 실패'}`)

  const allPassed = Object.values(results).every(r => r === true)
  console.log('\n' + (allPassed ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패'))
  
  process.exit(allPassed ? 0 : 1)
}

// 실행
if (require.main === module) {
  runTests()
}

export { runTests, testQ1AnswerChanges, testQ3AnswerChanges, testAllSkip, testMultipleAnswers }




















