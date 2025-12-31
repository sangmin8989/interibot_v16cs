/**
 * Integration Step 테스트
 * 
 * 목표: 질문 답변 변경 시 선택지/LOCK 결과 즉시 변화 확인
 * 
 * 테스트 시나리오:
 * 1. Q1 답변 변경 → 선택지 개수 변화 확인
 * 2. Q3 답변 변경 → defaultPlan 변화 확인
 * 3. 여러 답변 조합 → 종합 결과 확인
 */

import { aggregateChoiceVariables } from '@/lib/analysis/utils/choice-variables'
import { InterventionEngine } from '@/lib/analysis/engine-v3/engines/InterventionEngine'
import { convertTraitsToAxes } from '@/lib/analysis/types/judgment-axes'

// 테스트용 공정 데이터
const mockProcesses = [
  { id: 'kitchen', label: '주방 공사', category: '주방', priority: 'essential' as const, score: 90, reason: '주방은 일상 생활의 핵심 공간입니다' },
  { id: 'bathroom', label: '욕실 공사', category: '욕실', priority: 'recommended' as const, score: 80, reason: '욕실은 위생과 안전이 중요한 공간입니다' },
  { id: 'floor', label: '바닥 공사', category: '거실', priority: 'recommended' as const, score: 70, reason: '바닥은 공간의 기본 인프라입니다' },
  { id: 'wall', label: '벽 공사', category: '거실', priority: 'optional' as const, score: 60, reason: '벽 공사는 공간 분위기를 결정합니다' },
  { id: 'lighting', label: '조명 공사', category: '거실', priority: 'optional' as const, score: 50, reason: '조명은 공간의 분위기를 만듭니다' },
  { id: 'storage', label: '수납 공사', category: '거실', priority: 'optional' as const, score: 40, reason: '수납은 공간 활용도를 높입니다' },
]

// 테스트용 axes (기본값)
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

// 시나리오 1: Q1 답변 변경 → 선택지 개수 변화
function testQ1AnswerChange() {
  console.log('\n📋 시나리오 1: Q1 답변 변경 → 선택지 개수 변화')
  
  // Q1: strongly_agree → optionCount: 2
  const answers1 = {
    'judgment_irreversible_priority': 'strongly_agree'
  }
  const choiceVars1 = aggregateChoiceVariables(answers1)
  
  const engine1 = new InterventionEngine()
  const result1 = engine1.analyze({
    processes: mockProcesses,
    axes: mockAxes,
    choiceVariables: choiceVars1
  })

  console.log(`✅ Q1 "strongly_agree":`)
  console.log(`   choiceVariables: optionCount=${choiceVars1.optionCount}, lockStrength=${choiceVars1.lockStrength}`)
  console.log(`   결과: ${result1.processedProcesses.length}개 공정 (기대: ${choiceVars1.optionCount}개)`)
  console.log(`   축소 이유: ${result1.reductionInfo.reason}`)

  const passed1 = result1.processedProcesses.length === choiceVars1.optionCount

  // Q1: disagree → optionCount: 4
  const answers2 = {
    'judgment_irreversible_priority': 'disagree'
  }
  const choiceVars2 = aggregateChoiceVariables(answers2)
  
  const result2 = engine1.analyze({
    processes: mockProcesses,
    axes: mockAxes,
    choiceVariables: choiceVars2
  })

  console.log(`\n✅ Q1 "disagree":`)
  console.log(`   choiceVariables: optionCount=${choiceVars2.optionCount}, lockStrength=${choiceVars2.lockStrength}`)
  console.log(`   결과: ${result2.processedProcesses.length}개 공정 (기대: ${choiceVars2.optionCount}개)`)
  console.log(`   축소 이유: ${result2.reductionInfo.reason}`)

  const passed2 = result2.processedProcesses.length === choiceVars2.optionCount

  return passed1 && passed2
}

// 시나리오 2: Q3 답변 변경 → defaultPlan 변화
function testQ3AnswerChange() {
  console.log('\n📋 시나리오 2: Q3 답변 변경 → defaultPlan 변화')
  
  // Q3: ai_recommend → defaultPlan: true
  const answers1 = {
    'judgment_choice_preference': 'ai_recommend'
  }
  const choiceVars1 = aggregateChoiceVariables(answers1)
  
  console.log(`✅ Q3 "ai_recommend":`)
  console.log(`   choiceVariables: defaultPlan=${choiceVars1.defaultPlan} (기대: true)`)
  const passed1 = choiceVars1.defaultPlan === true

  // Q3: detail_select → defaultPlan: false
  const answers2 = {
    'judgment_choice_preference': 'detail_select'
  }
  const choiceVars2 = aggregateChoiceVariables(answers2)
  
  console.log(`✅ Q3 "detail_select":`)
  console.log(`   choiceVariables: defaultPlan=${choiceVars2.defaultPlan} (기대: false)`)
  const passed2 = choiceVars2.defaultPlan === false

  return passed1 && passed2
}

// 시나리오 3: 여러 답변 조합 → 종합 결과
function testMultipleAnswers() {
  console.log('\n📋 시나리오 3: 여러 답변 조합 → 종합 결과')
  
  // 리스크 회피 높음 + 통제 욕구 낮음 → 강한 잠금, 적은 선택지
  const answers = {
    'judgment_irreversible_priority': 'strongly_agree', // optionCount: 2, lockStrength: 80
    'judgment_choice_preference': 'ai_recommend', // optionCount: 2, lockStrength: 70
    'judgment_construction_dislike': 'defect', // optionCount: 2, lockStrength: 75
  }
  
  const choiceVars = aggregateChoiceVariables(answers)
  
  const engine = new InterventionEngine()
  const result = engine.analyze({
    processes: mockProcesses,
    axes: mockAxes,
    choiceVariables: choiceVars
  })

  console.log(`✅ 여러 답변 조합:`)
  console.log(`   choiceVariables: optionCount=${choiceVars.optionCount}, lockStrength=${choiceVars.lockStrength}, defaultPlan=${choiceVars.defaultPlan}`)
  console.log(`   결과: ${result.processedProcesses.length}개 공정 (기대: ${choiceVars.optionCount}개)`)
  console.log(`   축소 이유: ${result.reductionInfo.reason}`)

  // ✅ 테스트 판정 기준 수정: 행동 결과만 검증
  // 1. optionCount 정확히 일치
  const optionCountMatch = result.processedProcesses.length === choiceVars.optionCount
  
  // 2. lockStrength 범위 검증 (>= 70)
  const lockStrengthValid = choiceVars.lockStrength >= 70
  
  // 3. defaultPlan boolean 확인 (기대값: true - ai_recommend가 포함되어 있으므로)
  const defaultPlanMatch = choiceVars.defaultPlan === true

  const passed = optionCountMatch && lockStrengthValid && defaultPlanMatch

  if (!passed) {
    console.error(`❌ 테스트 실패:`)
    if (!optionCountMatch) {
      console.error(`   - optionCount 불일치: 기대 ${choiceVars.optionCount}, 실제 ${result.processedProcesses.length}`)
    }
    if (!lockStrengthValid) {
      console.error(`   - lockStrength 범위 미달: ${choiceVars.lockStrength} < 70`)
    }
    if (!defaultPlanMatch) {
      console.error(`   - defaultPlan 불일치: 기대 true, 실제 ${choiceVars.defaultPlan}`)
    }
  }

  return passed
}

// 메인 테스트 실행
function runTests() {
  console.log('🧪 Integration Step 테스트 시작')
  console.log('='.repeat(60))

  const results = {
    q1: testQ1AnswerChange(),
    q3: testQ3AnswerChange(),
    multiple: testMultipleAnswers()
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 테스트 결과 요약:')
  console.log(`  Q1 답변 변경 → 선택지 개수: ${results.q1 ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  Q3 답변 변경 → defaultPlan: ${results.q3 ? '✅ 통과' : '❌ 실패'}`)
  console.log(`  여러 답변 조합: ${results.multiple ? '✅ 통과' : '❌ 실패'}`)

  const allPassed = Object.values(results).every(r => r === true)
  console.log('\n' + (allPassed ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패'))
  
  process.exit(allPassed ? 0 : 1)
}

// 실행
if (require.main === module) {
  runTests()
}

export { runTests, testQ1AnswerChange, testQ3AnswerChange, testMultipleAnswers }




















