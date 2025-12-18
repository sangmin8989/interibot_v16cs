/**
 * 헌법 v1 DB 스키마 점검 API
 * 
 * GET /api/test-constitution-db
 * 
 * 헌법 문서 실행 전 필수 DB 스키마 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    phase0: {
      materials: {},
      labor: {},
      summary: {
        allPassed: false,
        issues: [] as string[],
      },
    },
  }

  // ============================================================
  // Q1. materials 테이블에 is_argen_standard 컬럼이 있나요?
  // ============================================================
  
  try {
    // 1-1. materials 테이블 존재 확인
    const { data: materialsData, error: materialsError, count: materialsCount } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true })

    if (materialsError) {
      results.phase0.materials = {
        exists: false,
        error: materialsError.message,
        code: materialsError.code,
      }
      results.phase0.summary.issues.push(`materials 테이블 없음: ${materialsError.message}`)
    } else {
      // 1-2. is_argen_standard 컬럼 존재 확인 (샘플 데이터 조회로 확인)
      const { data: sampleData, error: sampleError } = await supabase
        .from('materials')
        .select('is_argen_standard, argen_priority, brand_name, product_name, category_1, category_2, category_3, spec, is_active')
        .limit(1)
        .maybeSingle()

      if (sampleError) {
        // 컬럼이 없으면 에러 발생
        const hasColumn = !sampleError.message.includes('is_argen_standard')
        
        results.phase0.materials = {
          exists: true,
          rowCount: materialsCount || 0,
          hasIsArgenStandard: hasColumn,
          error: hasColumn ? null : 'is_argen_standard 컬럼 없음',
        }
        
        if (!hasColumn) {
          results.phase0.summary.issues.push('materials 테이블에 is_argen_standard 컬럼 없음')
        }
      } else {
        // 샘플 데이터로 컬럼 존재 확인
        const hasColumn = 'is_argen_standard' in (sampleData || {})
        
        // is_argen_standard = true인 데이터 개수 확인
        const { count: argenCount } = await supabase
          .from('materials')
          .select('*', { count: 'exact', head: true })
          .eq('is_argen_standard', true)

        results.phase0.materials = {
          exists: true,
          rowCount: materialsCount || 0,
          hasIsArgenStandard: hasColumn,
          argenStandardCount: argenCount || 0,
          sampleData: sampleData ? {
            hasIsArgenStandard: hasColumn,
            hasArgenPriority: 'argen_priority' in sampleData,
            hasBrandName: !!sampleData.brand_name,
            hasProductName: !!sampleData.product_name,
          } : null,
        }

        if (!hasColumn) {
          results.phase0.summary.issues.push('materials 테이블에 is_argen_standard 컬럼 없음')
        }
        if ((argenCount || 0) === 0) {
          results.phase0.summary.issues.push('is_argen_standard = true인 자재 데이터 없음')
        }
      }
    }
  } catch (error: any) {
    results.phase0.materials = {
      exists: false,
      error: error.message,
    }
    results.phase0.summary.issues.push(`materials 테이블 확인 오류: ${error.message}`)
  }

  // ============================================================
  // Q2. 노무비 테이블이 있나요?
  // ============================================================

  const laborTables = [
    'labor_productivity',  // 노무 생산성 (daily_output, crew_size)
    'labor_costs',        // 노무 단가 (rate_per_person_day)
    'labor_difficulty_rules', // 난이도 규칙 (difficulty_factor)
  ]

  results.phase0.labor = {}

  for (const tableName of laborTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        results.phase0.labor[tableName] = {
          exists: false,
          error: error.message,
          code: error.code,
        }
        results.phase0.summary.issues.push(`${tableName} 테이블 없음: ${error.message}`)
      } else {
        // 샘플 데이터로 필수 컬럼 확인
        const { data: sampleData } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
          .maybeSingle()

        // 실제 테이블 컬럼명에 맞게 수정
        const requiredColumns: Record<string, string[]> = {
          'labor_productivity': ['phase_id', 'labor_unit', 'daily_output', 'crew_size'],
          'labor_costs': ['phase_id', 'daily_rate'],  // 실제 컬럼명 사용
          'labor_difficulty_rules': ['upgrade_condition', 'difficulty_multiplier'],
        }

        const columns = requiredColumns[tableName] || []
        const missingColumns: string[] = []

        // 샘플 데이터에서 컬럼 확인
        // 주의: 샘플 데이터가 NULL이면 컬럼이 없다고 판단할 수 있지만,
        // 실제로는 컬럼이 존재할 수 있음 (데이터만 없는 경우)
        if (sampleData) {
          columns.forEach(col => {
            if (!(col in sampleData)) {
              missingColumns.push(col)
            }
          })
        } else {
          // 샘플 데이터가 없으면, 컬럼 존재 여부를 확인할 수 없음
          // 하지만 테이블은 존재하므로 일단 통과로 처리
          // (실제로는 컬럼이 있을 수 있음)
        }

        results.phase0.labor[tableName] = {
          exists: true,
          rowCount: count || 0,
          hasRequiredColumns: missingColumns.length === 0,
          missingColumns: missingColumns.length > 0 ? missingColumns : null,
        }

        if (missingColumns.length > 0) {
          results.phase0.summary.issues.push(`${tableName} 테이블에 필수 컬럼 없음: ${missingColumns.join(', ')}`)
        }
        if ((count || 0) === 0) {
          results.phase0.summary.issues.push(`${tableName} 테이블에 데이터 없음`)
        }
      }
    } catch (error: any) {
      results.phase0.labor[tableName] = {
        exists: false,
        error: error.message,
      }
      results.phase0.summary.issues.push(`${tableName} 테이블 확인 오류: ${error.message}`)
    }
  }

  // ============================================================
  // 요약
  // ============================================================

  results.phase0.summary.allPassed = results.phase0.summary.issues.length === 0

  return NextResponse.json(results, { status: 200 })
}






