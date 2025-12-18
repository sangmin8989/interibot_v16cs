/**
 * Supabase 테이블 상태 확인 API
 * 
 * GET /api/test-db-tables
 * 
 * 모든 필수 테이블의 존재 여부와 샘플 데이터를 확인합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tables: {},
    errors: [],
  }

  // 확인할 테이블 목록 (헌법 v1 기준 필수 테이블 포함)
  const requiredTables = [
    // 기존 테이블
    'materials',
    'construction_phases',
    'personality_traits',
    'personality_materials',
    'answer_score_mapping',
    'materials_pricing',
    
    // ✅ 헌법 v1 필수 테이블
    'labor_costs',              // 노무 단가 (rate_per_person_day)
    'labor_productivity',       // 노무 생산성 (daily_output, crew_size)
    'labor_difficulty_rules',   // 난이도 규칙 (difficulty_factor)
    
    // 철거 관련
    'demolition_packages',      // 철거 패키지
    'demolition_items',         // 철거 항목
    'demolition_waste_config',  // 폐기물 설정
    'demolition_protection',    // 보양 설정
  ]

  // 각 테이블 확인
  for (const tableName of requiredTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        results.tables[tableName] = {
          exists: false,
          error: error.message,
          code: error.code,
        }
        results.errors.push(`${tableName}: ${error.message}`)
      } else {
        results.tables[tableName] = {
          exists: true,
          rowCount: count || 0,
        }
      }
    } catch (error: any) {
      results.tables[tableName] = {
        exists: false,
        error: error.message,
      }
      results.errors.push(`${tableName}: ${error.message}`)
    }
  }

  // 뷰 확인
  try {
    const { data, error } = await supabase
      .from('v_personality_materials')
      .select('*')
      .limit(1)

    results.views = {
      'v_personality_materials': {
        exists: !error,
        error: error?.message || null,
      },
    }
  } catch (error: any) {
    results.views = {
      'v_personality_materials': {
        exists: false,
        error: error.message,
      },
    }
  }

  // 함수 확인 (간접적으로)
  try {
    const { data, error } = await supabase.rpc('get_recommended_materials', {
      p_trait_scores: {},
      p_phase_id: null,
    })

    results.functions = {
      'get_recommended_materials': {
        exists: !error || error.code !== '42883', // 42883 = function does not exist
        error: error?.message || null,
      },
    }
  } catch (error: any) {
    results.functions = {
      'get_recommended_materials': {
        exists: false,
        error: error.message,
      },
    }
  }

  // 샘플 데이터 조회 (존재하는 테이블만)
  for (const tableName of requiredTables) {
    if (results.tables[tableName]?.exists) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(3)

        if (!error && data) {
          results.tables[tableName].sampleData = data
        }
      } catch (error: any) {
        // 샘플 데이터 조회 실패는 무시
      }
    }
  }

  // 요약
  const existingTables = Object.values(results.tables).filter(
    (t: any) => t.exists
  ).length
  const totalTables = requiredTables.length

  results.summary = {
    totalTables,
    existingTables,
    missingTables: totalTables - existingTables,
    status: existingTables === totalTables ? 'COMPLETE' : 'INCOMPLETE',
  }

  return NextResponse.json(results, {
    status: results.errors.length > 0 ? 200 : 200, // 정보성 에러는 200
  })
}
















