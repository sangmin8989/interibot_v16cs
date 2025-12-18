/**
 * labor_costs 테이블 구조 확인 API
 * 
 * GET /api/check-labor-costs-structure
 * 
 * labor_costs 테이블의 실제 컬럼 구조를 확인합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    table: 'labor_costs',
    structure: {},
    sampleData: null,
  }

  try {
    // 샘플 데이터 조회 (모든 컬럼 확인)
    const { data, error } = await supabase
      .from('labor_costs')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      results.error = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
    } else if (data) {
      // 실제 컬럼명 추출
      const actualColumns = Object.keys(data)
      
      results.structure = {
        actualColumns,
        hasProcessId: actualColumns.includes('process_id'),
        hasRatePerPersonDay: actualColumns.includes('rate_per_person_day'),
        // 다른 가능한 컬럼명들 확인
        possibleRateColumns: actualColumns.filter(col => 
          col.toLowerCase().includes('rate') || 
          col.toLowerCase().includes('cost') ||
          col.toLowerCase().includes('price') ||
          col.toLowerCase().includes('day')
        ),
        possibleProcessColumns: actualColumns.filter(col => 
          col.toLowerCase().includes('process') || 
          col.toLowerCase().includes('phase') ||
          col.toLowerCase().includes('category')
        ),
      }
      
      results.sampleData = data
    } else {
      results.structure = {
        message: '테이블은 존재하지만 데이터가 없습니다',
      }
    }
  } catch (error: any) {
    results.error = {
      message: error.message,
      stack: error.stack,
    }
  }

  return NextResponse.json(results, { status: 200 })
}







