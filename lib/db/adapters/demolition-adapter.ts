/**
 * 철거 어댑터 - Supabase DB 조회
 * 
 * 철거 관련 데이터를 Supabase에서 조회하는 어댑터
 * demolition_packages, demolition_items, demolition_waste_config 테이블 사용
 */

import { supabase } from '@/lib/db/supabase'

// ============================================================
// 타입 정의
// ============================================================

export interface DemolitionPackage {
  package_id: string
  pyeong: number
  package_name: string
  total_price: number
  price_per_pyeong: number | null
  includes: string | null
  property_type: string
  is_active: boolean
}

export interface DemolitionItem {
  item_id: string
  category_id: string
  item_name: string
  item_size: string | null
  unit: string
  unit_price: number
  min_price: number | null
  max_price: number | null
  includes: string | null
  pyeong_min: number | null
  pyeong_max: number | null
  is_package: boolean
  is_active: boolean
}

export interface WasteConfig {
  pyeong: number
  max_ton: number
  price_per_ton: number
  total_cost: number
  description: string | null
  is_active: boolean
}

export interface ProtectionItem {
  protection_id: string
  protection_name: string
  base_price: number
  additional_unit: string | null
  additional_price: number | null
  description: string | null
}

// ============================================================
// 전체 철거 패키지 조회
// ============================================================

/**
 * 전체 철거 패키지 조회 (DB)
 * 
 * @param pyeong - 평형
 * @param propertyType - 건물 유형 ('apartment' | 'commercial')
 * @returns 전체 철거 패키지 정보
 */
export async function getFullDemolitionPackageFromDB(
  pyeong: number,
  propertyType: string = 'apartment'
): Promise<DemolitionPackage | null> {
  try {
    // 환경 변수 검증
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase 환경변수가 설정되지 않았습니다. Fallback 사용')
      return null
    }

    // 가장 가까운 평형 찾기 (이하)
    const { data, error } = await supabase
      .from('demolition_packages')
      .select('*')
      .eq('property_type', propertyType)
      .eq('is_active', true)
      .lte('pyeong', pyeong)
      .order('pyeong', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('❌ 전체 철거 패키지 조회 에러:', error)
      return null
    }

    if (!data) {
      console.warn(`⚠️ ${pyeong}평 ${propertyType} 전체 철거 패키지 없음`)
      return null
    }

    console.log(`✅ 전체 철거 패키지 조회 성공: ${pyeong}평 → ${data.package_name} (${data.total_price.toLocaleString()}원)`)
    return data as DemolitionPackage
  } catch (err: any) {
    console.error('❌ getFullDemolitionPackageFromDB 에러:', err)
    return null
  }
}

// ============================================================
// 부분 철거 항목 조회
// ============================================================

/**
 * 욕실 철거 항목 조회 (평형별)
 * 
 * @param pyeong - 평형
 * @returns 욕실 철거 항목 정보
 */
export async function getBathroomItemByPyeong(
  pyeong: number
): Promise<DemolitionItem | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null
    }

    const { data, error } = await supabase
      .from('demolition_items')
      .select('*')
      .eq('category_id', 'DEM-BATH')
      .eq('is_package', true)
      .eq('is_active', true)
      .lte('pyeong_min', pyeong)
      .gte('pyeong_max', pyeong)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('❌ 욕실 철거 항목 조회 에러:', error)
      return null
    }

    return data as DemolitionItem | null
  } catch (err: any) {
    console.error('❌ getBathroomItemByPyeong 에러:', err)
    return null
  }
}

/**
 * 주방 철거 항목 조회 (평형별)
 * 
 * @param pyeong - 평형
 * @returns 주방 철거 항목 정보
 */
export async function getKitchenItemByPyeong(
  pyeong: number
): Promise<DemolitionItem | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null
    }

    const { data, error } = await supabase
      .from('demolition_items')
      .select('*')
      .eq('category_id', 'DEM-KITCHEN')
      .eq('is_package', true)
      .eq('is_active', true)
      .lte('pyeong_min', pyeong)
      .gte('pyeong_max', pyeong)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('❌ 주방 철거 항목 조회 에러:', error)
      return null
    }

    return data as DemolitionItem | null
  } catch (err: any) {
    console.error('❌ getKitchenItemByPyeong 에러:', err)
    return null
  }
}

/**
 * 카테고리별 철거 항목 조회
 * 
 * @param categoryId - 카테고리 ID (예: 'DEM-FLOOR', 'DEM-CEILING')
 * @param pyeong - 평형 (선택)
 * @returns 철거 항목 목록
 */
export async function getDemolitionItemsByCategory(
  categoryId: string,
  pyeong?: number
): Promise<DemolitionItem[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return []
    }

    let query = supabase
      .from('demolition_items')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)

    // 평형 필터 (패키지인 경우)
    if (pyeong !== undefined) {
      query = query
        .or(`is_package.eq.false,and(pyeong_min.lte.${pyeong},pyeong_max.gte.${pyeong})`)
    }

    const { data, error } = await query

    if (error) {
      console.error(`❌ ${categoryId} 철거 항목 조회 에러:`, error)
      return []
    }

    return (data || []) as DemolitionItem[]
  } catch (err: any) {
    console.error('❌ getDemolitionItemsByCategory 에러:', err)
    return []
  }
}

// ============================================================
// 폐기물 Config 조회
// ============================================================

/**
 * 폐기물 Config 조회 (평형별)
 * 
 * @param pyeong - 평형
 * @returns 폐기물 Config 정보
 */
export async function getWasteConfigFromDB(
  pyeong: number
): Promise<WasteConfig | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null
    }

    // 정확히 일치하는 평형 먼저 찾기
    let { data, error } = await supabase
      .from('demolition_waste_config')
      .select('*')
      .eq('pyeong', pyeong)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    // 정확히 일치하는 것이 없으면 가장 가까운 상위 평형 찾기
    if (!data && !error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('demolition_waste_config')
        .select('*')
        .eq('is_active', true)
        .gte('pyeong', pyeong)
        .order('pyeong', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!fallbackError && fallbackData) {
        data = fallbackData
      }
    }

    if (error) {
      console.error('❌ 폐기물 Config 조회 에러:', error)
      return null
    }

    if (!data) {
      console.warn(`⚠️ ${pyeong}평 폐기물 Config 없음`)
      return null
    }

    return data as WasteConfig
  } catch (err: any) {
    console.error('❌ getWasteConfigFromDB 에러:', err)
    return null
  }
}

// ============================================================
// 보양 항목 조회
// ============================================================

/**
 * 보양 항목 조회
 * 
 * @returns 보양 항목 목록
 */
export async function getProtectionFromDB(): Promise<ProtectionItem[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return []
    }

    const { data, error } = await supabase
      .from('demolition_protection')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('❌ 보양 항목 조회 에러:', error)
      return []
    }

    return (data || []) as ProtectionItem[]
  } catch (err: any) {
    console.error('❌ getProtectionFromDB 에러:', err)
    return []
  }
}

/**
 * 보양 비용 계산 (엘리베이터 + 복도)
 * 
 * @param hasElevator - 엘리베이터 유무
 * @param hallwaySheets - 복도 보양재 장수
 * @returns 보양 비용 항목 목록
 */
export async function calculateProtectionCostFromDB(
  hasElevator: boolean,
  hallwaySheets: number = 5
): Promise<{ items: Array<{ name: string; cost: number }>; total: number }> {
  try {
    const protectionItems = await getProtectionFromDB()
    const items: Array<{ name: string; cost: number }> = []
    let total = 0

    // 엘리베이터 보양
    if (hasElevator) {
      const elevator = protectionItems.find(p => p.protection_id === 'PROT-ELEV')
      if (elevator) {
        items.push({
          name: elevator.protection_name,
          cost: elevator.base_price
        })
        total += elevator.base_price
      }
    }

    // 복도 보양
    const hallway = protectionItems.find(p => p.protection_id === 'PROT-HALL')
    if (hallway) {
      const hallwayCost = hallway.base_price + (hallway.additional_price || 0) * hallwaySheets
      items.push({
        name: `${hallway.protection_name} (${hallwaySheets}장)`,
        cost: hallwayCost
      })
      total += hallwayCost
    }

    return { items, total }
  } catch (err: any) {
    console.error('❌ calculateProtectionCostFromDB 에러:', err)
    return { items: [], total: 0 }
  }
}

// ============================================================
// Fallback 함수 (DB 실패 시 하드코딩 값 사용)
// ============================================================

/**
 * 전체 철거 패키지 가격 계산 (Fallback)
 * 평당 13만원 기준 (아파트)
 */
export function calculateFromConfig(
  pyeong: number,
  propertyType: string = 'apartment'
): number {
  const pricePerPyeong = propertyType === 'apartment' ? 130000 : 150000
  return Math.round(pyeong * pricePerPyeong)
}

/**
 * 폐기물 Config 계산 (Fallback)
 */
export function calculateWasteConfigFallback(pyeong: number): WasteConfig {
  // waste.ts의 로직 사용
  const { getMaxWasteTon, WASTE_PRICE_PER_TON } = require('@/lib/data/pricing-v3/waste')
  const maxTon = getMaxWasteTon(pyeong)
  
  return {
    pyeong,
    max_ton: maxTon,
    price_per_ton: WASTE_PRICE_PER_TON,
    total_cost: Math.round(maxTon * WASTE_PRICE_PER_TON),
    description: `${pyeong}평 폐기물 (Fallback)`,
    is_active: true
  }
}




















