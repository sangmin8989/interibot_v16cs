// c:\interibot\app\api\check-material-prices\route.ts
// 자재 가격 확인 API

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // finish 공정 자재 가격 확인
    const { data: finishMaterials, error: finishError } = await supabase
      .from('materials')
      .select('material_code, product_name, category_1, category_2, unit, price_argen, price, is_argen_standard')
      .eq('phase_id', 'finish')
      .eq('is_active', true)
      .eq('is_argen_standard', true)
      .order('argen_priority', { ascending: true })

    // kitchen 공정 자재 가격 확인
    const { data: kitchenMaterials, error: kitchenError } = await supabase
      .from('materials')
      .select('material_code, product_name, category_1, category_2, unit, price_argen, price, is_argen_standard')
      .eq('phase_id', 'kitchen')
      .eq('is_active', true)
      .eq('is_argen_standard', true)
      .order('argen_priority', { ascending: true })

    // bathroom 공정 자재 가격 확인
    const { data: bathroomMaterials, error: bathroomError } = await supabase
      .from('materials')
      .select('material_code, product_name, category_1, category_2, unit, price_argen, price, is_argen_standard')
      .eq('phase_id', 'bathroom')
      .eq('is_active', true)
      .eq('is_argen_standard', true)
      .order('argen_priority', { ascending: true })

    // electric 공정 자재 가격 확인
    const { data: electricMaterials, error: electricError } = await supabase
      .from('materials')
      .select('material_code, product_name, category_1, category_2, unit, price_argen, price, is_argen_standard')
      .eq('phase_id', 'electric')
      .eq('is_active', true)
      .eq('is_argen_standard', true)
      .order('argen_priority', { ascending: true })

    // 가격 컬럼 존재 여부 확인 (자재 데이터에서 직접 확인)
    const hasPriceColumn = finishMaterials?.some(m => 
      'price_argen' in m || 'price' in m
    ) || false

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      priceColumns: {
        exists: hasPriceColumn,
        note: 'price_argen 또는 price 컬럼 존재 여부 (자재 데이터에서 확인)',
      },
      materials: {
        finish: {
          count: finishMaterials?.length || 0,
          data: finishMaterials || [],
          error: finishError?.message || null,
          hasPrice: finishMaterials?.some(m => m.price_argen || m.price) || false,
        },
        kitchen: {
          count: kitchenMaterials?.length || 0,
          data: kitchenMaterials || [],
          error: kitchenError?.message || null,
          hasPrice: kitchenMaterials?.some(m => m.price_argen || m.price) || false,
        },
        bathroom: {
          count: bathroomMaterials?.length || 0,
          data: bathroomMaterials || [],
          error: bathroomError?.message || null,
          hasPrice: bathroomMaterials?.some(m => m.price_argen || m.price) || false,
        },
        electric: {
          count: electricMaterials?.length || 0,
          data: electricMaterials || [],
          error: electricError?.message || null,
          hasPrice: electricMaterials?.some(m => m.price_argen || m.price) || false,
        },
      },
    })
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }, { status: 500 })
  }
}






