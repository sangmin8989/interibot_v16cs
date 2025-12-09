// lib/services/simpleEstimate.ts

import { getItemByCode } from '@/lib/data/itemMaster'
import { getQuantitiesBySize } from '@/lib/data/basePrices'
import {
  getWeightsByAnswers,
  parseItemCodes,
  TraitWeightData,
} from '@/lib/data/traitWeights'

export type Grade = 'basic' | 'standard' | 'premium'

export interface SimpleEstimateInput {
  sizePyeong: number          // 평수
  grade: Grade                // basic / standard / premium
  traitAnswers?: number[]     // 성향 설문 응답 (예: [1,3,2,...])
}

export interface SimpleEstimateItem {
  itemCode: string
  itemName: string
  processCode: number
  processName: string
  unit: string
  quantity: number
  unitPrice: number
  lineTotal: number
  isArgen: boolean
}

export interface SimpleEstimateResult {
  input: SimpleEstimateInput
  items: SimpleEstimateItem[]
  directCost: number
  indirectCost: {
    industrialAccident: number
    employment: number
    overhead: number
    profit: number
  }
  totalBeforeVAT: number
  vat: number
  totalWithVAT: number
  costPerPyeong: number
}

/**
 * BaseQuantities → itemCode 매핑
 * (현재 구조 기준 합리적인 매핑. 필요시 추후 조정 가능)
 */
const BASE_ITEM_MAP = {
  demolition: {
    labor: '101',   // 철거공사(전체)
    waste: '102',   // 폐기물처리
    cleanup: '103', // 소운반비
  },
  furniture: {
    shoeCabinet: '201', // 신발장
    closet: '202',      // 붙박이장
    doors: '204',       // 도어세트
    molding: '207',     // 천정몰딩
    baseboard: '208',   // 걸레받이
  },
  electrical: {
    basicWiring: '301',   // 기본배선
    induction: '302',     // 인덕션 전용
    aircon: '303',        // 에어컨 전용
    lights: '304',        // 조명
    indirectLight: '305', // 간접조명
  },
  bathroom: {
    // 세트 1개당 욕실 관련 주요 품목 전체를 1식으로 본다
    sets: ['401', '402', '403', '404', '405', '406'],
  },
  kitchen: {
    lowerCabinet: '1001', // 싱크대 하부장
    upperCabinet: '1002', // 싱크대 상부장
  },
} as const

function getUnitPriceByGrade(
  grade: Grade,
  item: ReturnType<typeof getItemByCode>
): number {
  if (!item) return 0
  if (grade === 'basic') return item.basicPrice
  if (grade === 'standard') return item.standardPrice
  return item.premiumPrice
}

/**
 * 성향 가중치 규칙 적용
 */
function applyTraitRules(
  items: SimpleEstimateItem[],
  traitAnswers?: number[]
): SimpleEstimateItem[] {
  if (!traitAnswers || traitAnswers.length === 0) return items

  const rules: TraitWeightData[] = getWeightsByAnswers(traitAnswers)
  if (!rules.length) return items

  const itemMap = new Map<string, SimpleEstimateItem>()
  for (const item of items) {
    itemMap.set(item.itemCode, { ...item })
  }

  for (const rule of rules) {
    const codes = parseItemCodes(rule.itemCodes)
    for (const code of codes) {
      const target = itemMap.get(code)

      if (rule.actionType === 'increase_quantity') {
        if (!target) continue
        const factor = 1 + rule.weightPercent // 예: 0.3 → 30% 증가
        const newQty = Math.max(1, Math.round(target.quantity * factor))
        target.quantity = newQty
        itemMap.set(code, target)
      } else if (rule.actionType === 'add_item') {
        if (target) continue
        const master = getItemByCode(code)
        if (!master) continue

        const unitPrice = getUnitPriceByGrade('standard', master) // 기본 standard 기준
        itemMap.set(code, {
          itemCode: master.itemCode,
          itemName: master.itemName,
          processCode: master.processCode,
          processName: master.processName,
          unit: master.unit,
          quantity: 1,
          unitPrice,
          lineTotal: unitPrice,
          isArgen: master.isArgen ?? false,
        })
      }
    }
  }

  return Array.from(itemMap.values())
}

/**
 * TS 마스터 기반 간단 견적 엔진
 */
export function calculateSimpleEstimate(
  input: SimpleEstimateInput
): SimpleEstimateResult {
  const { sizePyeong, grade, traitAnswers } = input

  if (sizePyeong <= 0) {
    throw new Error('평수는 0보다 커야 합니다.')
  }

  // 1) 평형 기준 기본 수량
  const baseQ = getQuantitiesBySize(sizePyeong)

  // 2) BaseQuantities → itemCode 매핑으로 기본 품목 리스트 생성
  const qtyByItemCode = new Map<string, number>()

  // 철거
  qtyByItemCode.set(
    BASE_ITEM_MAP.demolition.labor,
    baseQ.demolition.labor
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.demolition.waste,
    baseQ.demolition.waste
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.demolition.cleanup,
    baseQ.demolition.cleanup
  )

  // 목공/가구
  qtyByItemCode.set(
    BASE_ITEM_MAP.furniture.shoeCabinet,
    baseQ.furniture.shoeCabinet
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.furniture.closet,
    baseQ.furniture.closet
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.furniture.doors,
    baseQ.furniture.doors
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.furniture.molding,
    baseQ.furniture.molding
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.furniture.baseboard,
    baseQ.furniture.baseboard
  )

  // 전기
  qtyByItemCode.set(
    BASE_ITEM_MAP.electrical.basicWiring,
    baseQ.electrical.basicWiring
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.electrical.induction,
    baseQ.electrical.induction
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.electrical.aircon,
    baseQ.electrical.aircon
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.electrical.lights,
    baseQ.electrical.lights
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.electrical.indirectLight,
    baseQ.electrical.indirectLight
  )

  // 욕실: 세트 수만큼 주요 항목 반복
  BASE_ITEM_MAP.bathroom.sets.forEach((code) => {
    qtyByItemCode.set(code, (qtyByItemCode.get(code) || 0) + baseQ.bathroom.sets)
  })

  // 주방
  qtyByItemCode.set(
    BASE_ITEM_MAP.kitchen.lowerCabinet,
    baseQ.kitchen.lowerCabinet
  )
  qtyByItemCode.set(
    BASE_ITEM_MAP.kitchen.upperCabinet,
    baseQ.kitchen.upperCabinet
  )

  // 3) 품목 마스터에서 정보 조회 + 단가 적용
  const items: SimpleEstimateItem[] = []

  for (const [code, qty] of qtyByItemCode.entries()) {
    const master = getItemByCode(code)
    if (!master || qty <= 0) continue

    const unitPrice = getUnitPriceByGrade(grade, master)
    const lineTotal = unitPrice * qty

    items.push({
      itemCode: master.itemCode,
      itemName: master.itemName,
      processCode: master.processCode,
      processName: master.processName,
      unit: master.unit,
      quantity: qty,
      unitPrice,
      lineTotal,
      isArgen: master.isArgen ?? false,
    })
  }

  // 4) 성향 가중치 적용
  const weightedItems = applyTraitRules(items, traitAnswers)

  // 5) 금액 재계산
  for (const item of weightedItems) {
    item.lineTotal = item.unitPrice * item.quantity
  }

  const directCost = weightedItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  )

  // 노무비 = 단위가 "인"인 항목 합산
  const laborCost = weightedItems
    .filter((item) => item.unit === '인')
    .reduce((sum, item) => sum + item.lineTotal, 0)

  // 간접비 (기존 JSON 엔진과 동일 로직)
  const industrialAccident = Math.round(laborCost * 0.0307)
  const employment = Math.round(laborCost * 0.015)
  const overhead = Math.round(directCost * 0.03)
  const profit = Math.round(directCost * 0.05)

  const indirectTotal = industrialAccident + employment + overhead + profit
  const totalBeforeVAT = directCost + indirectTotal
  const vat = Math.round(totalBeforeVAT * 0.1)
  const totalWithVAT = totalBeforeVAT + vat
  const costPerPyeong = Math.round(totalBeforeVAT / sizePyeong)

  return {
    input,
    items: weightedItems,
    directCost,
    indirectCost: {
      industrialAccident,
      employment,
      overhead,
      profit,
    },
    totalBeforeVAT,
    vat,
    totalWithVAT,
    costPerPyeong,
  }
}





