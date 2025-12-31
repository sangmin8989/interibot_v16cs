/**
 * Phase 1: 필수 DB 최소 패키지 검증 스크립트
 * 
 * 목적: 필수 카테고리(바닥/욕실/주방)별 자재/노무 존재 여부 및 0원/NULL 체크
 * 
 * 실행 방법:
 *   npm run validate-required-costs
 *   또는
 *   npx tsx scripts/validate-required-costs.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.')
  console.error('   NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 필수 카테고리 정의
 */
const REQUIRED_CATEGORIES = [
  {
    name: '바닥(마감)',
    category1: '바닥',
    category2: '마루',
    processId: 'finish',
  },
  {
    name: '욕실',
    category1: '욕실',
    category2: '욕실세트',
    processId: 'bathroom',
  },
  {
    name: '주방',
    category1: '주방',
    category2: '시스템주방',
    processId: 'kitchen',
  },
] as const

interface ValidationResult {
  category: string
  materials: {
    exists: boolean
    hasPrice: boolean
    count: number
    validCount: number
    gradeCount?: {
      ARGEN_E: number
      ARGEN_S: number
      other: number
    }
    missing: string[]
  }
  labor: {
    productivityExists: boolean
    costExists: boolean
    hasRate: boolean
    missing: string[]
  }
  isValid: boolean
}

/**
 * 자재 검증
 */
async function validateMaterials(
  category1: string,
  category2: string
): Promise<ValidationResult['materials']> {
  const { data, error } = await supabase
    .from('materials')
    .select('material_id, material_code, product_name, price, price_argen, grade, is_active')
    .eq('category_1', category1)
    .eq('category_2', category2)
    .eq('is_active', true)

  if (error) {
    console.error(`  ❌ 자재 조회 오류: ${error.message}`)
    return {
      exists: false,
      hasPrice: false,
      count: 0,
      validCount: 0,
      missing: [`자재 조회 오류: ${error.message}`],
    }
  }

  if (!data || data.length === 0) {
    return {
      exists: false,
      hasPrice: false,
      count: 0,
      validCount: 0,
      missing: ['자재 데이터 없음'],
    }
  }

  // 등급별 체크 (ARGEN_E 또는 ARGEN_S 중 하나라도 있어야 함)
  const hasE = data.some(m => m.grade === 'ARGEN_E' || m.grade === 'argen_e')
  const hasS = data.some(m => m.grade === 'ARGEN_S' || m.grade === 'argen_s')
  const hasAnyGrade = hasE || hasS

  // 가격 체크 (is_argen_standard도 확인)
  const validMaterials = data.filter(
    m => {
      const hasPrice = (m.price && m.price > 0) || (m.price_argen && m.price_argen > 0)
      const isArgenStandard = (m as any).is_argen_standard !== false
      return hasPrice && isArgenStandard
    }
  )
  const hasPrice = validMaterials.length > 0

  const missing: string[] = []
  if (!hasAnyGrade) {
    missing.push('ARGEN_E 또는 ARGEN_S 등급 자재 없음')
  }
  if (!hasPrice) {
    missing.push('가격이 0원이거나 NULL인 자재만 존재, 또는 is_argen_standard=false')
  }
  
  // 상세 정보 추가
  const gradeCount = {
    ARGEN_E: data.filter(m => m.grade === 'ARGEN_E' || m.grade === 'argen_e').length,
    ARGEN_S: data.filter(m => m.grade === 'ARGEN_S' || m.grade === 'argen_s').length,
    other: data.filter(m => !['ARGEN_E', 'argen_e', 'ARGEN_S', 'argen_s'].includes(m.grade || '')).length,
  }

  return {
    exists: data.length > 0,
    hasPrice,
    count: data.length,
    validCount: validMaterials.length,
    gradeCount,
    missing,
  }
}

/**
 * 노무 검증
 */
async function validateLabor(processId: string): Promise<ValidationResult['labor']> {
  const missing: string[] = []

  // 생산성 데이터 체크
  const { data: productivityData, error: productivityError } = await supabase
    .from('labor_productivity')
    .select('*')
    .eq('phase_id', processId)
    .eq('is_active', true)
    .maybeSingle()

  if (productivityError) {
    missing.push(`생산성 조회 오류: ${productivityError.message}`)
  }

  const productivityExists = !!productivityData

  if (!productivityExists) {
    missing.push('노무 생산성 데이터 없음')
  }

  // 노무비 데이터 체크
  const { data: costData, error: costError } = await supabase
    .from('labor_costs')
    .select('*')
    .eq('phase_id', processId)
    .eq('is_active', true)
    .maybeSingle()

  if (costError) {
    missing.push(`노무비 조회 오류: ${costError.message}`)
  }

  const costExists = !!costData

  if (!costExists) {
    missing.push('노무비 데이터 없음')
  }

  // rate_per_person_day 체크 (실제 컬럼명은 daily_rate)
  const hasRate =
    costData &&
    ((costData.rate_per_person_day !== null &&
      costData.rate_per_person_day !== undefined &&
      Number(costData.rate_per_person_day) > 0) ||
     (costData.daily_rate !== null &&
      costData.daily_rate !== undefined &&
      Number(costData.daily_rate) > 0))

  if (!hasRate && costExists) {
    missing.push('rate_per_person_day가 0원이거나 NULL')
  }

  return {
    productivityExists,
    costExists,
    hasRate: hasRate || false,
    missing,
  }
}

/**
 * 카테고리별 검증
 */
async function validateCategory(
  category: typeof REQUIRED_CATEGORIES[number]
): Promise<ValidationResult> {
  console.log(`\n📋 ${category.name} 검증 중...`)

  const materials = await validateMaterials(category.category1, category.category2)
  const labor = await validateLabor(category.processId)

  const isValid = materials.exists && materials.hasPrice && labor.productivityExists && labor.costExists && labor.hasRate

  // 결과 출력
  console.log(`  자재:`)
  console.log(`    존재: ${materials.exists ? '✅' : '❌'} (전체 ${materials.count}개, 유효 ${materials.validCount || 0}개)`)
  if (materials.gradeCount) {
    console.log(`    등급: ARGEN_E ${materials.gradeCount.ARGEN_E}개, ARGEN_S ${materials.gradeCount.ARGEN_S}개, 기타 ${materials.gradeCount.other}개`)
  }
  console.log(`    가격: ${materials.hasPrice ? '✅' : '❌'}`)
  if (materials.missing.length > 0) {
    console.log(`    누락: ${materials.missing.join(', ')}`)
  }

  console.log(`  노무:`)
  console.log(`    생산성: ${labor.productivityExists ? '✅' : '❌'}`)
  console.log(`    노무비: ${labor.costExists ? '✅' : '❌'}`)
  console.log(`    단가: ${labor.hasRate ? '✅' : '❌'}`)
  if (labor.missing.length > 0) {
    console.log(`    누락: ${labor.missing.join(', ')}`)
  }

  console.log(`  결과: ${isValid ? '✅ 통과' : '❌ 실패'}`)

  return {
    category: category.name,
    materials,
    labor,
    isValid,
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log('🔍 필수 DB 최소 패키지 검증 시작...\n')

  const results: ValidationResult[] = []

  for (const category of REQUIRED_CATEGORIES) {
    const result = await validateCategory(category)
    results.push(result)
  }

  // 최종 결과
  console.log('\n' + '='.repeat(60))
  console.log('📊 최종 검증 결과')
  console.log('='.repeat(60))

  const allValid = results.every(r => r.isValid)
  const failedCategories = results.filter(r => !r.isValid)

  if (allValid) {
    console.log('\n✅ 모든 필수 카테고리가 준비되었습니다!')
    console.log('   견적 생성이 가능합니다.')
  } else {
    console.log('\n❌ 다음 카테고리가 준비되지 않았습니다:')
    for (const failed of failedCategories) {
      console.log(`\n  ${failed.category}:`)
      if (failed.materials.missing.length > 0) {
        console.log(`    자재: ${failed.materials.missing.join(', ')}`)
      }
      if (failed.labor.missing.length > 0) {
        console.log(`    노무: ${failed.labor.missing.join(', ')}`)
      }
    }
    console.log('\n⚠️  위 카테고리의 데이터를 입력한 후 다시 검증해주세요.')
    console.log('   참고: docs/PHASE1_REQUIRED_DB_MINIMUM_PACKAGE.md')
  }

  process.exit(allValid ? 0 : 1)
}

// 실행
main().catch(error => {
  console.error('❌ 검증 스크립트 실행 오류:', error)
  process.exit(1)
})


