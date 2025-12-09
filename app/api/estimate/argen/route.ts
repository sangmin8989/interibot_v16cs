import { NextRequest, NextResponse } from 'next/server'
import {
  mapItemsToPricing,
  calculateItemsTotal,
  getArgenItems,
} from '@/lib/utils/estimate'

export async function POST(request: NextRequest) {
  try {
    const { items, spaceInfo } = await request.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: '제작 항목이 필요합니다.' },
        { status: 400 }
      )
    }

    // 항목명을 견적 데이터로 변환
    const pricingItems = mapItemsToPricing(items)

    // 아르젠 제작 가능 항목만 필터링
    const argenItems = getArgenItems()
    const validItems = pricingItems.filter((item) =>
      argenItems.some((argenItem) => argenItem.item_code === item.item_code)
    )

    // 등급별 견적 계산
    const basicTotal = calculateItemsTotal(validItems, 'basic')
    const standardTotal = calculateItemsTotal(validItems, 'standard')
    const premiumTotal = calculateItemsTotal(validItems, 'premium')

    // 만원 단위로 변환
    const estimate = {
      items: validItems.map((item) => ({
        item_code: item.item_code,
        item_name: item.item_name,
        spec: item.spec,
        unit: item.unit,
        quantity: item.quantity || 1,
      })),
      totals: {
        basic: Math.round(basicTotal / 10000),
        standard: Math.round(standardTotal / 10000),
        premium: Math.round(premiumTotal / 10000),
      },
    }

    return NextResponse.json({
      success: true,
      estimate,
    })
  } catch (error) {
    console.error('아르젠 견적 오류:', error)
    return NextResponse.json(
      { error: '아르젠 견적 계산 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
