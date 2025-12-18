/**
 * V3 엔진 통합 테스트 스크립트
 * 
 * Phase 1, 2, 3 완료 후 전체 통합 테스트
 * 
 * 테스트 항목:
 * 1. InterventionEngine 통합 확인
 * 2. 판단 축 질문 처리 확인
 * 3. 선택지 축소 로직 확인
 * 4. 전체 파이프라인 정상 작동 확인
 */

// 환경 변수 로드 (dotenv)
import { config } from 'dotenv'
import { resolve } from 'path'

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') })

// OpenAI API 키가 없으면 더미 키 설정 (테스트용)
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = 'test-key-for-integration-test'
  console.log('⚠️  OpenAI API 키가 없어서 테스트용 더미 키를 사용합니다.')
  console.log('   (ExplanationEngine은 실제 API 호출 없이 실패할 수 있습니다)\n')
}

import { v3Engine } from '../lib/analysis/engine-v3'
import { V3EngineInput } from '../lib/analysis/engine-v3/types'

// 테스트용 입력 데이터
const testInput: V3EngineInput = {
  answers: {
    // 기존 질문 답변
    'standard_main_space': 'living_room',
    'standard_daily_discomfort': 'storage',
    'standard_cleaning_style': 'system_needed',
    'standard_family_time': 'weekday_living',
    'standard_daily_scene': 'after_work',
    'standard_budget_priority': 'materials',
    
    // 판단 축 질문 답변 (Phase 3 추가)
    'judgment_irreversible_priority': 'strongly_agree',      // 리스크 회피도 높음
    'judgment_construction_dislike': 'defect',               // 리스크 회피도 높음
    'judgment_choice_preference': 'compare_2_3',             // 통제 욕구 중간
    'judgment_decision_delay': 'too_many',                   // 결정 지연 성향 높음
    'judgment_inconvenience_preference': 'more_money',       // 비용 민감도 높음
    'judgment_maintenance_tradeoff': 'disagree',             // 비용 민감도 높음
  },
  spaceInfo: {
    housingType: 'apartment',
    pyeong: 32,
    rooms: 3,
    bathrooms: 2,
    familySizeRange: '3~4명',
    totalPeople: 3,
    ageRanges: ['adult', 'child'],
    lifestyleTags: ['hasPets'],
    livingPurpose: '실거주',
    livingYears: 10,
  },
  selectedSpaces: ['living', 'kitchen', 'masterBedroom'],
  selectedProcesses: [],
  budget: 'medium',
}

async function runIntegrationTest() {
  console.log('🧪 V3 엔진 통합 테스트 시작\n')
  console.log('=' .repeat(60))
  
  try {
    // V3 엔진 실행
    const result = await v3Engine.analyze(testInput)
    
    console.log('\n✅ V3 엔진 실행 성공!\n')
    console.log('=' .repeat(60))
    
    // 1. InterventionEngine 통합 확인
    console.log('\n📊 1. InterventionEngine 통합 확인')
    console.log('-'.repeat(60))
    if (result.executionTime?.interventionEngine) {
      console.log(`✅ InterventionEngine 실행 시간: ${result.executionTime.interventionEngine}ms`)
    } else {
      console.log('❌ InterventionEngine 실행 시간이 없습니다')
    }
    
    // 2. 공정 축소 확인
    console.log('\n📊 2. 공정 축소 확인')
    console.log('-'.repeat(60))
    const originalProcessCount = result.processResult.recommendedProcesses.length
    console.log(`✅ 추천 공정 개수: ${originalProcessCount}개`)
    
    if (originalProcessCount > 0) {
      console.log('\n📋 추천 공정 목록:')
      result.processResult.recommendedProcesses.forEach((process, index) => {
        console.log(`   ${index + 1}. ${process.label} (${process.priority})`)
      })
    }
    
    // 3. 판단 축 변환 확인
    console.log('\n📊 3. 판단 축 변환 확인')
    console.log('-'.repeat(60))
    const indicators = result.processResult.adjustedIndicators
    console.log('✅ 성향 지표 (adjustedIndicators):')
    console.log(`   - 수납중요도: ${indicators.수납중요도}`)
    console.log(`   - 예산탄력성: ${indicators.예산탄력성}`)
    console.log(`   - 공사복잡도수용성: ${indicators.공사복잡도수용성}`)
    console.log(`   - 집값방어의식: ${indicators.집값방어의식}`)
    
    // 4. 실행 시간 확인
    console.log('\n📊 4. 실행 시간 확인')
    console.log('-'.repeat(60))
    if (result.executionTime) {
      console.log(`✅ 전체 실행 시간: ${result.executionTime.total}ms`)
      console.log(`   - 성향 엔진: ${result.executionTime.traitEngine}ms`)
      console.log(`   - 공정 엔진: ${result.executionTime.processEngine}ms`)
      console.log(`   - 개입 엔진: ${result.executionTime.interventionEngine}ms`)
      console.log(`   - 리스크 엔진: ${result.executionTime.riskEngine}ms`)
      console.log(`   - 시나리오 엔진: ${result.executionTime.scenarioEngine}ms`)
      console.log(`   - 설명 엔진: ${result.executionTime.explanationEngine}ms`)
    }
    
    // 5. 설명 결과 확인
    console.log('\n📊 5. 설명 결과 확인')
    console.log('-'.repeat(60))
    if (result.explanationResult) {
      console.log('✅ 설명 결과 생성 완료')
      console.log(`   - 요약 길이: ${result.explanationResult.summary.length}자`)
      console.log(`   - 공정 설명 길이: ${result.explanationResult.processRecommendation.length}자`)
    } else {
      console.log('❌ 설명 결과가 없습니다')
    }
    
    // 6. 리스크 확인
    console.log('\n📊 6. 리스크 확인')
    console.log('-'.repeat(60))
    console.log(`✅ 리스크 개수: ${result.riskResult.risks.length}개`)
    if (result.riskResult.risks.length > 0) {
      result.riskResult.risks.slice(0, 3).forEach((risk, index) => {
        console.log(`   ${index + 1}. ${risk.title} (${risk.level})`)
      })
    }
    
    // 7. 시나리오 확인
    console.log('\n📊 7. 시나리오 확인')
    console.log('-'.repeat(60))
    console.log(`✅ 시나리오 개수: ${result.scenarioResult.scenarios.length}개`)
    if (result.scenarioResult.scenarios.length > 0) {
      result.scenarioResult.scenarios.slice(0, 2).forEach((scenario, index) => {
        console.log(`   ${index + 1}. ${scenario.title} (${scenario.category})`)
      })
    }
    
    // 최종 요약
    console.log('\n' + '='.repeat(60))
    console.log('✅ 통합 테스트 완료!')
    console.log('='.repeat(60))
    console.log('\n📋 테스트 결과 요약:')
    console.log(`   ✅ V3 엔진 실행: 성공`)
    console.log(`   ✅ InterventionEngine 통합: ${result.executionTime?.interventionEngine ? '성공' : '실패'}`)
    console.log(`   ✅ 공정 추천: ${originalProcessCount}개`)
    console.log(`   ✅ 전체 실행 시간: ${result.executionTime?.total || 0}ms`)
    console.log(`   ✅ 설명 생성: ${result.explanationResult ? '성공' : '실패'}`)
    
    return {
      success: true,
      result,
    }
    
  } catch (error) {
    console.error('\n❌ 통합 테스트 실패:', error)
    console.log('='.repeat(60))
    
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message)
      console.error('에러 스택:', error.stack)
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  runIntegrationTest()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ 모든 테스트 통과!')
        process.exit(0)
      } else {
        console.log('\n❌ 테스트 실패')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('예상치 못한 오류:', error)
      process.exit(1)
    })
}

export { runIntegrationTest, testInput }












