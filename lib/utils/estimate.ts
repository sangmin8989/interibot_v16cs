// [deprecated] v1 견적 계산 유틸 (pricing.json + trait-weights.json 기반)
// - /api/estimate/route.ts 에서만 사용된다.
// - 현재 메인 자동견적(4등급 시스템)은 lib/estimate/calculator.ts 를 사용한다.
// - 향후 완전 개편 시 참고용으로만 유지한다.

import pricingData from '@/lib/data/pricing.json'
import traitWeightsData from '@/lib/data/trait-weights.json'

type PricingData = typeof pricingData
type Item = PricingData['process_groups'][0]['items'][0]
type SizeEstimate = PricingData['size_base_estimate'][0]
type TraitWeightsData = typeof traitWeightsData
type WeightMatrix = TraitWeightsData['weight_matrix'][0]
type Impact = WeightMatrix['impacts'][0]

/**
 * 성향 항목명 매핑 (camelCase → trait_id)
 */
const TRAIT_NAME_MAP: Record<string, string> = {
  spaceSense: 'T01',
  visualSensitivity: 'T02',
  auditorySensitivity: 'T03',
  cleaningTendency: 'T04',
  organizationLevel: 'T05',
  familyComposition: 'T06',
  healthFactors: 'T07',
  budgetSense: 'T08',
  colorPreference: 'T09',
  lightingPreference: 'T10',
  spacePurpose: 'T11',
  discomfortFactors: 'T12',
  activityLevel: 'T13',
  sleepPattern: 'T14',
  lifestyleRoutine: 'T15',
}

/**
 * 항목명으로 견적 데이터에서 항목 찾기
 */
export function findItemByName(itemName: string): Item | null {
  for (const group of pricingData.process_groups) {
    const item = group.items.find(
      (i) =>
        i.item_name === itemName ||
        i.item_name.includes(itemName) ||
        itemName.includes(i.item_name)
    )
    if (item) return item
  }
  return null
}

/**
 * 아르젠 제작 가능 항목만 필터링
 */
export function getArgenItems(): Item[] {
  const items: Item[] = []
  for (const group of pricingData.process_groups) {
    items.push(...group.items.filter((item) => item.is_argen_make))
  }
  return items
}

/**
 * 평수에 따른 기본 견적 범위 가져오기
 */
export function getSizeBaseEstimate(area: number): SizeEstimate | null {
  return (
    pricingData.size_base_estimate.find(
      (size) => area >= size.size_min && area <= size.size_max
    ) || null
  )
}

/**
 * 항목명 배열을 견적 항목으로 변환
 */
export function mapItemsToPricing(
  itemNames: string[]
): Array<Item & { quantity?: number }> {
  return itemNames
    .map((name) => {
      const item = findItemByName(name)
      return item ? { ...item, quantity: 1 } : null
    })
    .filter((item): item is Item & { quantity: number } => item !== null)
}

/**
 * 등급별 가격 계산 (Basic, Standard, Premium)
 */
export function calculateItemPrice(
  item: Item,
  quantity: number = 1,
  grade: 'basic' | 'standard' | 'premium' = 'standard'
): number {
  const priceMap = {
    basic: item.basic_price,
    standard: item.standard_price,
    premium: item.premium_price,
  }
  return priceMap[grade] * quantity
}

/**
 * 인건비 항목 찾기
 */
export function getLaborItems(): Item[] {
  const items: Item[] = []
  for (const group of pricingData.process_groups) {
    items.push(
      ...group.items.filter((item) => item.item_name.includes('인건비'))
    )
  }
  return items
}

/**
 * 평수에 따른 기본 견적 계산 (만원 단위로 변환)
 */
export function calculateBaseEstimate(
  area: number,
  grade: 'basic' | 'standard' | 'premium' = 'standard'
): { min: number; max: number } {
  const sizeEstimate = getSizeBaseEstimate(area)
  if (!sizeEstimate) {
    // 평수 범위를 벗어난 경우 기본값
    return { min: 0, max: 0 }
  }

  const priceMap = {
    basic: {
      min: sizeEstimate.basic_min,
      max: sizeEstimate.basic_max,
    },
    standard: {
      min: sizeEstimate.standard_min,
      max: sizeEstimate.standard_max,
    },
    premium: {
      min: sizeEstimate.premium_min,
      max: sizeEstimate.premium_max,
    },
  }

  const prices = priceMap[grade]
  // 만원 단위로 변환
  return {
    min: Math.round(prices.min / 10000),
    max: Math.round(prices.max / 10000),
  }
}

/**
 * 항목별 견적 합산
 */
export function calculateItemsTotal(
  items: Array<Item & { quantity?: number }>,
  grade: 'basic' | 'standard' | 'premium' = 'standard'
): number {
  return items.reduce((total, item) => {
    return total + calculateItemPrice(item, item.quantity || 1, grade)
  }, 0)
}

/**
 * VAT 포함 가격 계산
 */
export function calculateWithVAT(price: number): number {
  return Math.round(price * (1 + pricingData.vat_rate))
}

/**
 * 견적 범위를 문자열로 변환 (만원 단위)
 */
export function formatEstimateRange(min: number, max: number): string {
  return `${min}~${max}`
}

/**
 * 성향 점수 변환 (1-10 → 0-100)
 */
export function convertTraitScore(score: number): number {
  // 1-10 점수를 0-100으로 변환
  if (score <= 0) return 0
  if (score >= 10) return 100
  return Math.round(((score - 1) / 9) * 100)
}

/**
 * 성향 점수에 따른 가중치 레벨 결정
 */
function getWeightLevel(score: number): 'low' | 'mid' | 'high' {
  if (score <= 30) return 'low'
  if (score <= 70) return 'mid'
  return 'high'
}

/**
 * 성향 점수에 따른 가중치 값 가져오기
 */
function getWeightValue(impact: Impact, score: number): number {
  const level = getWeightLevel(score)
  switch (level) {
    case 'low':
      return impact.weight_low
    case 'mid':
      return impact.weight_mid
    case 'high':
      return impact.weight_high
  }
}

/**
 * 성향별 가중치 계산
 */
export function calculateTraitWeights(
  preferences: Record<string, number>
): Record<string, number> {
  const weights: Record<string, number> = {}

  // 각 성향 항목에 대해 가중치 계산
  for (const [key, score] of Object.entries(preferences)) {
    const traitId = TRAIT_NAME_MAP[key]
    if (!traitId) continue

    // 점수 변환 (1-10 → 0-100)
    const convertedScore = convertTraitScore(score)

    // 가중치 매트릭스에서 해당 성향 찾기
    const traitMatrix = traitWeightsData.weight_matrix.find(
      (m) => m.trait_id === traitId
    )

    if (!traitMatrix) continue

    // 각 영향에 대해 가중치 적용
    for (const impact of traitMatrix.impacts) {
      const weight = getWeightValue(impact, convertedScore)
      // JSON 구조상 'process' 속성 사용 (process_code가 아님)
      const processCode = (impact as any).process_code || (impact as any).process

      if (processCode === 'ALL') {
        // 전체에 영향을 미치는 경우
        weights['ALL'] = (weights['ALL'] || 0) + weight
      } else {
        // 특정 공정에 영향을 미치는 경우
        weights[processCode] = (weights[processCode] || 0) + weight
      }
    }
  }

  return weights
}

/**
 * 가중치를 적용한 견적 조정
 */
export function applyWeightsToEstimate(
  baseEstimate: number,
  weights: Record<string, number>,
  processCode?: string
): number {
  let adjustment = 0

  // 전체 가중치 적용
  if (weights['ALL']) {
    adjustment += (baseEstimate * weights['ALL']) / 100
  }

  // 특정 공정 가중치 적용
  if (processCode && weights[processCode]) {
    adjustment += (baseEstimate * weights[processCode]) / 100
  }

  return baseEstimate + adjustment
}

/**
 * 성향 기반 추가 항목 추천
 */
export function getRecommendedItemsByTraits(
  preferences: Record<string, number>
): string[] {
  const recommendedItems: Set<string> = new Set()

  for (const [key, score] of Object.entries(preferences)) {
    const traitId = TRAIT_NAME_MAP[key]
    if (!traitId) continue

    const convertedScore = convertTraitScore(score)
    const level = getWeightLevel(convertedScore)

    // 가중치가 높은 경우에만 항목 추천
    if (level === 'high') {
      const traitMatrix = traitWeightsData.weight_matrix.find(
        (m) => m.trait_id === traitId
      )

      if (traitMatrix) {
        for (const impact of traitMatrix.impacts) {
          const itemsAffected = (impact as any).items_affected
          if (itemsAffected && Array.isArray(itemsAffected) && itemsAffected.length > 0) {
            itemsAffected.forEach((itemCode: string) => {
              if (itemCode !== '전체' && itemCode !== '해당 공정') {
                recommendedItems.add(itemCode)
              }
            })
          }
        }
      }
    }
  }

  return Array.from(recommendedItems)
}

