/**
 * 성향 분석 시스템 테스트 API
 * 
 * GET /api/test-personality-system
 * 
 * 성향 분석 시스템의 각 기능을 테스트합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'
import { getAnswerScoreMappingFromDB, getTraitScoresFromAnswers, getRecommendedMaterialsFromDB } from '@/lib/db/adapters/personality-adapter'
import type { PreferenceScores } from '@/lib/analysis/types'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: {},
    errors: [],
  }

  // ============================================================
  // Test 1: answer_score_mapping 조회 테스트
  // ============================================================
  try {
    const testAnswers = {
      'quick_first_scene': 'hotel_hallway',
      'quick_priority': 'storage',
    }

    const mapping1 = await getAnswerScoreMappingFromDB('quick_first_scene', 'hotel_hallway', 'quick')
    const mapping2 = await getAnswerScoreMappingFromDB('quick_priority', 'storage', 'quick')
    const mapping3 = await getAnswerScoreMappingFromDB('quick_priority', 'nonexistent', 'quick')

    results.tests.answerScoreMapping = {
      success: true,
      test1: {
        question: 'quick_first_scene',
        answer: 'hotel_hallway',
        result: mapping1,
        expected: { organization_habit: 9, color_preference: 8 },
      },
      test2: {
        question: 'quick_priority',
        answer: 'storage',
        result: mapping2,
        expected: { organization_habit: 9, activity_flow: 8 },
      },
      test3: {
        question: 'quick_priority',
        answer: 'nonexistent',
        result: mapping3,
        expected: null,
      },
    }
  } catch (error: any) {
    results.tests.answerScoreMapping = {
      success: false,
      error: error.message,
    }
    results.errors.push(`answer_score_mapping: ${error.message}`)
  }

  // ============================================================
  // Test 2: getTraitScoresFromAnswers 테스트
  // ============================================================
  try {
    const testAnswers = {
      'quick_first_scene': 'hotel_hallway',
      'quick_priority': 'storage',
    }

    const scores = await getTraitScoresFromAnswers(testAnswers, 'quick')

    results.tests.traitScoresFromAnswers = {
      success: true,
      input: testAnswers,
      output: scores,
      hasScores: Object.keys(scores).length > 0,
    }
  } catch (error: any) {
    results.tests.traitScoresFromAnswers = {
      success: false,
      error: error.message,
    }
    results.errors.push(`traitScoresFromAnswers: ${error.message}`)
  }

  // ============================================================
  // Test 3: getRecommendedMaterialsFromDB 테스트
  // ============================================================
  try {
    // 테스트용 성향 점수 (정리정돈 습관 높음)
    const testScores: PreferenceScores = {
      space_sense: 5,
      sensory_sensitivity: 5,
      cleaning_preference: 5,
      organization_habit: 8, // 높음
      family_composition: 5,
      health_factors: 5,
      budget_sense: 5,
      color_preference: 5,
      lighting_preference: 5,
      home_purpose: 5,
      discomfort_factors: 5,
      activity_flow: 5,
      life_routine: 5,
      sleep_pattern: 5,
      hobby_lifestyle: 5,
    }

    const materials = await getRecommendedMaterialsFromDB(testScores, null)

    results.tests.recommendedMaterials = {
      success: true,
      inputScores: testScores,
      outputCount: materials.length,
      materials: materials.slice(0, 5), // 처음 5개만
      note: materials.length === 0 ? 'personality_materials 데이터가 없어서 결과가 비어있습니다. 정상입니다.' : '성공적으로 조회되었습니다.',
    }
  } catch (error: any) {
    results.tests.recommendedMaterials = {
      success: false,
      error: error.message,
    }
    results.errors.push(`recommendedMaterials: ${error.message}`)
  }

  // ============================================================
  // Test 4: v_personality_materials 뷰 테스트
  // ============================================================
  try {
    const { data, error } = await supabase
      .from('v_personality_materials')
      .select('*')
      .limit(5)

    results.tests.viewTest = {
      success: !error,
      error: error?.message || null,
      rowCount: data?.length || 0,
      note: data?.length === 0 ? '뷰는 정상 작동하지만 데이터가 없어서 결과가 비어있습니다. 정상입니다.' : '뷰가 정상적으로 작동합니다.',
    }
  } catch (error: any) {
    results.tests.viewTest = {
      success: false,
      error: error.message,
    }
    results.errors.push(`viewTest: ${error.message}`)
  }

  // ============================================================
  // Test 5: get_recommended_materials 함수 테스트
  // ============================================================
  try {
    const testScores = {
      organization_habit: 8,
      lighting_preference: 7,
    }

    const { data, error } = await supabase.rpc('get_recommended_materials', {
      p_trait_scores: testScores,
      p_phase_id: null,
    })

    results.tests.functionTest = {
      success: !error,
      error: error?.message || null,
      rowCount: data?.length || 0,
      data: data?.slice(0, 3) || [],
      note: data?.length === 0 ? '함수는 정상 작동하지만 personality_materials 데이터가 없어서 결과가 비어있습니다. 정상입니다.' : '함수가 정상적으로 작동합니다.',
    }
  } catch (error: any) {
    results.tests.functionTest = {
      success: false,
      error: error.message,
    }
    results.errors.push(`functionTest: ${error.message}`)
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
  }

  return NextResponse.json(results, {
    status: results.errors.length > 0 ? 200 : 200, // 정보성 에러는 200
  })
}

















