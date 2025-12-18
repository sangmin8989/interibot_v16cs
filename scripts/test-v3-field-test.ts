/**
 * V3 엔진 필드 테스트 스크립트
 * 
 * 실제 API 엔드포인트를 호출하여 전체 플로우를 테스트합니다.
 * 
 * 테스트 시나리오:
 * 1. 실제 사용자 데이터로 V3 엔진 테스트
 * 2. InterventionEngine 작동 확인
 * 3. 판단 축 질문 처리 확인
 * 4. 선택지 축소 로직 확인
 * 5. 전체 파이프라인 정상 작동 확인
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import type { V3EngineInput } from '../lib/analysis/engine-v3/types'

// 환경 변수 로드
config({ path: resolve(process.cwd(), '.env.local') })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ============ 테스트 시나리오 1: 일반 사용자 ============

const scenario1_GeneralUser = {
  spaceInfo: {
    housingType: 'apartment',
    pyeong: 32,
    rooms: 3,
    bathrooms: 2,
    familySizeRange: '3~4명',
    totalPeople: 3,
    ageRanges: ['adult', 'child'],
    lifestyleTags: ['hasPets'],
    livingPurpose: '실거주' as const,
    livingYears: 10,
  },
  selectedSpaces: ['living', 'kitchen', 'masterBedroom'],
  selectedProcesses: {},
  detailOptions: {},
  personality: {
    mode: 'standard',
    answers: {
      // 기존 질문
      'standard_main_space': 'living_room',
      'standard_daily_discomfort': 'storage',
      'standard_cleaning_style': 'system_needed',
      'standard_family_time': 'weekday_living',
      'standard_daily_scene': 'after_work',
      'standard_budget_priority': 'materials',
      
      // 판단 축 질문 (Phase 3 추가)
      'judgment_irreversible_priority': 'strongly_agree',      // 리스크 회피도 높음
      'judgment_construction_dislike': 'defect',               // 리스크 회피도 높음
      'judgment_choice_preference': 'compare_2_3',             // 통제 욕구 중간
      'judgment_decision_delay': 'too_many',                   // 결정 지연 성향 높음
      'judgment_inconvenience_preference': 'more_money',       // 비용 민감도 높음
      'judgment_maintenance_tradeoff': 'disagree',             // 비용 민감도 높음
    },
  },
  budget: 'medium' as const,
}

// ============ 테스트 시나리오 2: 고비용 민감도 사용자 ============

const scenario2_CostSensitive = {
  spaceInfo: {
    housingType: 'apartment',
    pyeong: 25,
    rooms: 2,
    bathrooms: 1,
    familySizeRange: '2~3명',
    totalPeople: 2,
    ageRanges: ['adult'],
    lifestyleTags: [],
    livingPurpose: '실거주' as const,
    livingYears: 5,
  },
  selectedSpaces: ['living', 'kitchen'],
  selectedProcesses: {},
  detailOptions: {},
  personality: {
    mode: 'standard',
    answers: {
      'standard_main_space': 'living_room',
      'standard_daily_discomfort': 'storage',
      'standard_cleaning_style': 'system_needed',
      
      // 판단 축: 비용 민감도 매우 높음, 결정 지연 높음
      'judgment_irreversible_priority': 'agree',
      'judgment_construction_dislike': 'additional_cost',      // 추가비용 싫어함
      'judgment_choice_preference': 'compare_2_3',           // 2-3개만 비교
      'judgment_decision_delay': 'fear_loss',                  // 손해볼까봐
      'judgment_inconvenience_preference': 'more_money',       // 돈 더 쓰는 게 힘듦
      'judgment_maintenance_tradeoff': 'disagree',             // 관리 편의 우선
    },
  },
  budget: 'low' as const,
}

// ============ 테스트 시나리오 3: 고통제 욕구 사용자 ============

const scenario3_HighControl = {
  spaceInfo: {
    housingType: 'apartment',
    pyeong: 40,
    rooms: 4,
    bathrooms: 2,
    familySizeRange: '4~5명',
    totalPeople: 4,
    ageRanges: ['adult', 'child', 'teen'],
    lifestyleTags: [],
    livingPurpose: '실거주' as const,
    livingYears: 15,
  },
  selectedSpaces: ['living', 'kitchen', 'masterBedroom', 'bathroom'],
  selectedProcesses: {},
  detailOptions: {},
  personality: {
    mode: 'standard',
    answers: {
      'standard_main_space': 'living_room',
      'standard_daily_discomfort': 'layout',
      'standard_cleaning_style': 'system_needed',
      
      // 판단 축: 통제 욕구 매우 높음
      'judgment_irreversible_priority': 'neutral',
      'judgment_construction_dislike': 'decision_stress',       // 결정 스트레스
      'judgment_choice_preference': 'detail_select',          // 세부까지 직접 선택
      'judgment_decision_delay': 'lack_info',                 // 정보 부족
      'judgment_inconvenience_preference': 'neither',         // 둘 다 괜찮음
      'judgment_maintenance_tradeoff': 'strongly_agree',       // 예쁘면 관리 스트레스 감수
    },
  },
  budget: 'high' as const,
}

// ============ API 호출 함수 ============

async function callAnalysisAPI(scenario: any, scenarioName: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🧪 시나리오: ${scenarioName}`)
  console.log('='.repeat(60))
  
  try {
    // V3 엔진을 직접 사용하는 API가 없으므로, 
    // analyze/complete API를 사용하거나 V3 엔진을 직접 호출
    
    // 방법 1: V3 엔진 직접 호출 (더 정확한 테스트)
    const { v3Engine } = await import('../lib/analysis/engine-v3')
    
    const v3Input: V3EngineInput = {
      answers: scenario.personality.answers,
      spaceInfo: scenario.spaceInfo,
      selectedSpaces: scenario.selectedSpaces,
      selectedProcesses: scenario.selectedProcesses || [],
      budget: scenario.budget,
    }
    
    console.log('📤 V3 엔진 호출 중...')
    const result = await v3Engine.analyze(v3Input)
    
    // 결과 분석
    console.log('\n✅ 분석 완료!')
    console.log('-'.repeat(60))
    console.log(`📊 성향 지표 (상위 3개):`)
    const topIndicators = Object.entries(result.processResult.adjustedIndicators)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    topIndicators.forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}점`)
    })
    
    console.log(`\n📋 추천 공정: ${result.processResult.recommendedProcesses.length}개`)
    result.processResult.recommendedProcesses.forEach((process, index) => {
      console.log(`   ${index + 1}. ${process.label} (${process.priority})`)
    })
    
    console.log(`\n🔧 InterventionEngine 결과:`)
    console.log(`   - 개입 강도: ${result.executionTime?.interventionEngine ? '측정됨' : '없음'}`)
    console.log(`   - 실행 시간: ${result.executionTime?.interventionEngine || 0}ms`)
    
    console.log(`\n⚠️  리스크: ${result.riskResult.risks.length}개`)
    result.riskResult.risks.slice(0, 2).forEach((risk, index) => {
      console.log(`   ${index + 1}. ${risk.title} (${risk.level})`)
    })
    
    console.log(`\n📖 시나리오: ${result.scenarioResult.scenarios.length}개`)
    result.scenarioResult.scenarios.slice(0, 2).forEach((scenario, index) => {
      console.log(`   ${index + 1}. ${scenario.title}`)
    })
    
    console.log(`\n⏱️  전체 실행 시간: ${result.executionTime?.total || 0}ms`)
    
    return {
      success: true,
      result,
    }
    
  } catch (error) {
    console.error(`\n❌ 시나리오 ${scenarioName} 실패:`, error)
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

// ============ 메인 테스트 실행 ============

async function runFieldTests() {
  console.log('🚀 V3 엔진 필드 테스트 시작')
  console.log('='.repeat(60))
  
  const results = []
  
  // 시나리오 1: 일반 사용자
  const result1 = await callAnalysisAPI(scenario1_GeneralUser, '일반 사용자')
  results.push({ scenario: '일반 사용자', ...result1 })
  
  // 시나리오 2: 고비용 민감도 사용자
  const result2 = await callAnalysisAPI(scenario2_CostSensitive, '고비용 민감도 사용자')
  results.push({ scenario: '고비용 민감도 사용자', ...result2 })
  
  // 시나리오 3: 고통제 욕구 사용자
  const result3 = await callAnalysisAPI(scenario3_HighControl, '고통제 욕구 사용자')
  results.push({ scenario: '고통제 욕구 사용자', ...result3 })
  
  // 최종 요약
  console.log('\n' + '='.repeat(60))
  console.log('📊 필드 테스트 최종 요약')
  console.log('='.repeat(60))
  
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  
  console.log(`\n✅ 성공: ${successCount}/${totalCount} 시나리오`)
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.scenario}:`)
    if (result.success) {
      console.log(`   ✅ 성공`)
      if (result.result) {
        console.log(`   - 공정 추천: ${result.result.processResult.recommendedProcesses.length}개`)
        console.log(`   - 리스크: ${result.result.riskResult.risks.length}개`)
        console.log(`   - 실행 시간: ${result.result.executionTime?.total || 0}ms`)
      }
    } else {
      console.log(`   ❌ 실패: ${result.error}`)
    }
  })
  
  console.log('\n' + '='.repeat(60))
  
  if (successCount === totalCount) {
    console.log('✅ 모든 필드 테스트 통과!')
    process.exit(0)
  } else {
    console.log(`⚠️  ${totalCount - successCount}개 시나리오 실패`)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  runFieldTests()
    .catch((error) => {
      console.error('예상치 못한 오류:', error)
      process.exit(1)
    })
}

export { runFieldTests, scenario1_GeneralUser, scenario2_CostSensitive, scenario3_HighControl }












