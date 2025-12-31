// c:\interibot\app\api\test-constitution-engine\route.ts
// 헌법 v1 견적 엔진 테스트 API

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export async function GET() {
  const results: {
    timestamp: string
    tests: {
      name: string
      status: 'PASS' | 'FAIL' | 'SKIP'
      message: string
      data?: unknown
    }[]
    summary: {
      total: number
      passed: number
      failed: number
      skipped: number
    }
  } = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
  }

  // ============================================================
  // 테스트 1: materials 테이블에서 ARGEN 표준 자재 조회
  // ============================================================
  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .eq('is_argen_standard', true)
      .limit(5)

    if (error) {
      results.tests.push({
        name: 'ARGEN 표준 자재 조회',
        status: 'FAIL',
        message: `DB 오류: ${error.message}`,
      })
    } else if (!materials || materials.length === 0) {
      results.tests.push({
        name: 'ARGEN 표준 자재 조회',
        status: 'FAIL',
        message: 'ARGEN 표준 자재가 없습니다. is_argen_standard=true 데이터 필요',
      })
    } else {
      results.tests.push({
        name: 'ARGEN 표준 자재 조회',
        status: 'PASS',
        message: `${materials.length}개 ARGEN 표준 자재 확인`,
        data: materials.map((m) => ({
          id: m.id,
          name: m.name,
          category: m.category_1,
          unit_price: m.unit_price,
        })),
      })
    }
  } catch (err) {
    results.tests.push({
      name: 'ARGEN 표준 자재 조회',
      status: 'FAIL',
      message: `예외 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
    })
  }

  // ============================================================
  // 테스트 2: labor_productivity 테이블 조회 (phase_id 컬럼 사용)
  // ============================================================
  try {
    const { data: productivity, error } = await supabase
      .from('labor_productivity')
      .select('*')
      .eq('is_active', true)
      .limit(5)

    if (error) {
      results.tests.push({
        name: '노무 생산성 조회 (labor_productivity)',
        status: 'FAIL',
        message: `DB 오류: ${error.message}`,
      })
    } else if (!productivity || productivity.length === 0) {
      results.tests.push({
        name: '노무 생산성 조회 (labor_productivity)',
        status: 'FAIL',
        message: '활성화된 노무 생산성 데이터가 없습니다',
      })
    } else {
      results.tests.push({
        name: '노무 생산성 조회 (labor_productivity)',
        status: 'PASS',
        message: `${productivity.length}개 노무 생산성 데이터 확인`,
        data: productivity.map((p) => ({
          labor_code: p.labor_code,
          phase_id: p.phase_id,
          labor_unit: p.labor_unit,
          daily_output: p.daily_output,
          crew_size: p.crew_size,
          base_difficulty: p.base_difficulty,
        })),
      })
    }
  } catch (err) {
    results.tests.push({
      name: '노무 생산성 조회 (labor_productivity)',
      status: 'FAIL',
      message: `예외 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
    })
  }

  // ============================================================
  // 테스트 3: labor_costs 테이블 조회 (phase_id, daily_rate 컬럼 사용)
  // ============================================================
  try {
    const { data: costs, error } = await supabase
      .from('labor_costs')
      .select('*')
      .eq('is_current', true)
      .limit(5)

    if (error) {
      results.tests.push({
        name: '노무 단가 조회 (labor_costs)',
        status: 'FAIL',
        message: `DB 오류: ${error.message}`,
      })
    } else if (!costs || costs.length === 0) {
      results.tests.push({
        name: '노무 단가 조회 (labor_costs)',
        status: 'FAIL',
        message: '현재 적용 중인 노무 단가가 없습니다 (is_current=true)',
      })
    } else {
      results.tests.push({
        name: '노무 단가 조회 (labor_costs)',
        status: 'PASS',
        message: `${costs.length}개 노무 단가 데이터 확인`,
        data: costs.map((c) => ({
          labor_code: c.labor_code,
          phase_id: c.phase_id,
          daily_rate: c.daily_rate,
          labor_type: c.labor_type,
        })),
      })
    }
  } catch (err) {
    results.tests.push({
      name: '노무 단가 조회 (labor_costs)',
      status: 'FAIL',
      message: `예외 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
    })
  }

  // ============================================================
  // 테스트 4: labor_difficulty_rules 테이블 조회
  // ============================================================
  try {
    const { data: rules, error } = await supabase
      .from('labor_difficulty_rules')
      .select('*')
      .eq('is_active', true)
      .limit(5)

    if (error) {
      results.tests.push({
        name: '노무 난이도 규칙 조회 (labor_difficulty_rules)',
        status: 'FAIL',
        message: `DB 오류: ${error.message}`,
      })
    } else if (!rules || rules.length === 0) {
      results.tests.push({
        name: '노무 난이도 규칙 조회 (labor_difficulty_rules)',
        status: 'FAIL',
        message: '활성화된 난이도 규칙이 없습니다',
      })
    } else {
      results.tests.push({
        name: '노무 난이도 규칙 조회 (labor_difficulty_rules)',
        status: 'PASS',
        message: `${rules.length}개 난이도 규칙 확인`,
        data: rules.map((r) => ({
          labor_code: r.labor_code,
          category_1: r.category_1,
          upgrade_condition: r.upgrade_condition,
          difficulty_multiplier: r.difficulty_multiplier,
        })),
      })
    }
  } catch (err) {
    results.tests.push({
      name: '노무 난이도 규칙 조회 (labor_difficulty_rules)',
      status: 'FAIL',
      message: `예외 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
    })
  }

  // ============================================================
  // 테스트 5: 여러 공정 샘플 견적 계산 시뮬레이션
  // ============================================================
  
  // 테스트할 공정 목록
  const testProcesses = [
    {
      phaseId: 'demolition',
      name: '철거',
      input: { area_pyeong: 25, area_sqm: 25 * 3.3 }, // 25평 = 82.5㎡
      unit: 'm2',
    },
    {
      phaseId: 'finish',
      name: '마감',
      input: { area_pyeong: 25, area_sqm: 25 * 3.3 }, // 25평 = 82.5㎡
      unit: 'm2',
    },
    {
      phaseId: 'kitchen',
      name: '주방',
      input: { sets: 1 }, // 1세트
      unit: 'SET',
    },
    {
      phaseId: 'bathroom',
      name: '욕실',
      input: { sets: 1 }, // 1세트
      unit: 'SET',
    },
    {
      phaseId: 'electric',
      name: '전기',
      input: { count: 1 }, // 1개
      unit: 'EA',
    },
  ]

  // 각 공정별로 테스트 실행
  for (const process of testProcesses) {
    try {
      const { data: productivity, error: productivityError } = await supabase
        .from('labor_productivity')
        .select('*')
        .eq('phase_id', process.phaseId)
        .eq('is_active', true)
        .maybeSingle()

      // is_current 조건을 먼저 확인하지 않고, 모든 데이터를 조회한 후 필터링
      const { data: costData, error: costError } = await supabase
        .from('labor_costs')
        .select('*')
        .eq('phase_id', process.phaseId)
      
      // 클라이언트 측에서 is_current 필터링 (DB에서 null 처리 문제 방지)
      const cost = costData && costData.length > 0 
        ? costData.find((c: any) => c.is_current === true) || costData[0]
        : null

      // 에러 로깅
      if (productivityError) {
        console.error(`[${process.name}] Productivity query error:`, productivityError)
      }
      if (costError) {
        console.error(`[${process.name}] Cost query error:`, costError)
      }
      
      // 디버깅: 쿼리 결과 로깅
      if (process.phaseId === 'finish' || process.phaseId === 'bathroom') {
        console.log(`[${process.name}] Query result:`, {
          phaseId: process.phaseId,
          costDataCount: costData?.length || 0,
          costData: costData,
          foundCost: !!cost,
        })
      }

      if (productivity && cost) {
        const dailyOutput = productivity.daily_output || 1
        const crewSize = productivity.crew_size || 1
        const dailyRate = cost.daily_rate || 0

        // 공정별 계산 로직
        let quantity = 0
        let workDays = 0
        let formula = ''

        if (process.unit === 'm2') {
          quantity = process.input.area_sqm || 0
          workDays = Math.ceil(quantity / dailyOutput)
          formula = `ceil(${quantity}㎡ / ${dailyOutput}) × ${crewSize}명 × ${dailyRate.toLocaleString()}원`
        } else if (process.unit === 'SET') {
          quantity = process.input.sets || 0
          workDays = Math.ceil(quantity / dailyOutput)
          formula = `ceil(${quantity}세트 / ${dailyOutput}) × ${crewSize}명 × ${dailyRate.toLocaleString()}원`
        } else if (process.unit === 'EA') {
          quantity = process.input.count || 0
          workDays = Math.ceil(quantity / dailyOutput)
          formula = `ceil(${quantity}개 / ${dailyOutput}) × ${crewSize}명 × ${dailyRate.toLocaleString()}원`
        }

        const laborCost = workDays * crewSize * dailyRate

        results.tests.push({
          name: `샘플 견적 계산 (${process.name} 공정)`,
          status: 'PASS',
          message: `${process.name} 공정 노무비 계산 성공`,
          data: {
            input: process.input,
            calculation: {
              daily_output: dailyOutput,
              crew_size: crewSize,
              daily_rate: dailyRate,
              work_days: workDays,
              formula,
            },
            result: {
              labor_cost: laborCost,
              formatted: `${laborCost.toLocaleString()}원`,
            },
          },
        })
      } else {
        results.tests.push({
          name: `샘플 견적 계산 (${process.name} 공정)`,
          status: 'SKIP',
          message: `${process.name} 공정(${process.phaseId}) 데이터가 없어서 계산 생략`,
          data: {
            hasProductivity: !!productivity,
            hasCost: !!cost,
            productivityError: productivityError?.message || null,
            costError: costError?.message || null,
            phaseId: process.phaseId,
          },
        })
      }
    } catch (err) {
      results.tests.push({
        name: `샘플 견적 계산 (${process.name} 공정)`,
        status: 'FAIL',
        message: `예외 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      })
    }
  }

  // ============================================================
  // 결과 요약
  // ============================================================
  results.summary.total = results.tests.length
  results.summary.passed = results.tests.filter((t) => t.status === 'PASS').length
  results.summary.failed = results.tests.filter((t) => t.status === 'FAIL').length
  results.summary.skipped = results.tests.filter((t) => t.status === 'SKIP').length

  return NextResponse.json(results, {
    status: results.summary.failed > 0 ? 500 : 200,
  })
}














