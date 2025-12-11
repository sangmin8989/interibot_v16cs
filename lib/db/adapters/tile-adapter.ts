/**
 * 타일 어댑터 - Supabase DB 조회
 * 
 * 타일 관련 데이터를 Supabase에서 조회하는 어댑터
 * materials_pricing, materials_quantity_rules 테이블 사용
 */

import { supabase } from '@/lib/db/supabase'
import type { Grade } from '@/lib/data/pricing-v3/types'

// ============================================================
// 타일 단가 조회 (DB)
// ============================================================

/**
 * 타일 단가 조회 (DB)
 * 
 * @param grade - 등급 (BASIC, STANDARD, ARGEN, PREMIUM)
 * @returns 평당 단가 (원/m²)
 * @throws Error - DB 조회 실패 시
 */
export async function getTilePriceFromDB(grade: Grade): Promise<number> {
  try {
    // 환경 변수 검증 (런타임에만 체크)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
    }
    
    const gradeMap: Record<Grade, string> = {
      'BASIC': 'basic',
      'STANDARD': 'standard',
      'ARGEN': 'argen',
      'PREMIUM': 'premium'
    }
    
    const dbGrade = gradeMap[grade]
    
    // 존재하는 컬럼만 조회 (material_code, product_name 제거)
    const { data, error } = await supabase
      .from('materials_pricing')
      .select('price_min, price_max')
      .eq('grade', dbGrade)
      .eq('is_current', true)
      .limit(1)
      .single()
    
    if (error) {
      console.error('DB 조회 에러:', error)
      throw error
    }
    
    if (!data) {
      throw new Error(`가격 데이터 없음: ${grade}`)
    }
    
    // 평균값 리턴
    const avgPrice = (data.price_min + data.price_max) / 2
    console.log(`🎯 DB 조회 성공: ${grade} = ${avgPrice}원 (min: ${data.price_min}, max: ${data.price_max})`)
    
    return avgPrice
    
  } catch (error: any) {
    console.error('getTilePriceFromDB 에러:', error)
    throw error
  }
}

// ============================================================
// 타일 면적 조회 (DB) - TODO
// ============================================================

/**
 * 타일 면적 조회 (DB)
 * 
 * @param location - 위치 (BATHROOM, KITCHEN, ENTRANCE)
 * @param sizeRange - 평형 범위 (10PY, 20PY, 30PY, 40PY, 50PY)
 * @returns 면적 (m²)
 * @throws Error - 아직 구현 안 됨
 */
export async function getTileAreaFromDB(
  location: string,
  sizeRange: string
): Promise<number> {
  console.log('🔄 getTileAreaFromDB 호출:', location, sizeRange)
  // TODO: materials_quantity_rules 테이블 사용
  throw new Error('getTileAreaFromDB: 아직 구현 안 됨')
}

// ============================================================
// 타일 시공일수 조회 (DB) - TODO
// ============================================================

/**
 * 타일 시공일수 조회 (DB)
 * 
 * @param sizeRange - 평형 범위 (10PY, 20PY, 30PY, 40PY, 50PY)
 * @returns 시공일수
 * @throws Error - 아직 구현 안 됨
 */
export async function getTileDaysFromDB(
  sizeRange: string
): Promise<number> {
  console.log('🔄 getTileDaysFromDB 호출:', sizeRange)
  // TODO: materials_quantity_rules 테이블 사용
  throw new Error('getTileDaysFromDB: 아직 구현 안 됨')
}

