import { NextRequest, NextResponse } from 'next/server'
import { getLaborItems, calculateItemPrice } from '@/lib/utils/estimate'

export async function POST(request: NextRequest) {
  try {
    const { spaceInfo, workTypes } = await request.json()

    // 인건비 항목 가져오기
    const laborItems = getLaborItems()

    // 기본 인건비 계산 (주방, 목공, 전기, 수전, 타일, 도장, 필름, 샤시, 도배)
    const defaultLaborTypes = [
      '가구',
      '목공',
      '전기',
      '수전',
      '타일',
      '도장',
      '필름',
      '샤시',
      '도배',
    ]

    const laborTypes = workTypes || defaultLaborTypes

    const labor: Record<string, number> = {
      demolition: 0,
      carpentry: 0,
      electrical: 0,
      tiling: 0,
      painting: 0,
      total: 0,
    }

    // 각 공사 유형별 인건비 계산
    for (const type of laborTypes) {
      const laborItem = laborItems.find((item) =>
        item.item_name.includes(`인건비(${type})`)
      )

      if (laborItem) {
        const basicPrice = calculateItemPrice(laborItem, 1, 'basic')
        const standardPrice = calculateItemPrice(laborItem, 1, 'standard')
        const premiumPrice = calculateItemPrice(laborItem, 1, 'premium')

        // 공사 유형별로 분류
        if (type === '목공' || type === '가구') {
          labor.carpentry = standardPrice
        } else if (type === '전기') {
          labor.electrical = standardPrice
        } else if (type === '타일') {
          labor.tiling = standardPrice
        } else if (type === '도장' || type === '도배' || type === '필름') {
          labor.painting = standardPrice
        }

        labor.total += standardPrice
      }
    }

    // 철거 공사 (기본 포함)
    const demolitionItem = laborItems.find((item) =>
      item.item_name.includes('철거')
    )
    if (demolitionItem) {
      labor.demolition = calculateItemPrice(demolitionItem, 1, 'standard')
      labor.total += labor.demolition
    }

    // 만원 단위로 변환
    const result = {
      demolition: Math.round(labor.demolition / 10000),
      carpentry: Math.round(labor.carpentry / 10000),
      electrical: Math.round(labor.electrical / 10000),
      tiling: Math.round(labor.tiling / 10000),
      painting: Math.round(labor.painting / 10000),
      total: Math.round(labor.total / 10000),
    }

    return NextResponse.json({
      success: true,
      labor: result,
    })
  } catch (error) {
    console.error('시공비 계산 오류:', error)
    return NextResponse.json(
      { error: '시공비 계산 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
