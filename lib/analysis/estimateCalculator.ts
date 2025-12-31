/**
 * 아르젠 3등급 견적 계산기
 * 
 * 등급별 상세 스펙을 기반으로 견적 계산
 */

import type { ArgenGrade } from '@/lib/data/gradeSpecs'
import {
  TOTAL_ESTIMATE_32PY,
  scaleEstimateByPyeong,
  type TotalEstimate32py,
} from '@/lib/data/gradeSpecs'

export interface EstimateInput {
  pyeong: number
  grade: ArgenGrade
  rooms?: number
  bathrooms?: number
  customOptions?: {
    includeIsland?: boolean
    includeTallCabinet?: boolean
    includeDressingRoom?: boolean
    windowCount?: number
    doorCount?: number
  }
}

export interface EstimateResult {
  grade: ArgenGrade
  pyeong: number
  breakdown: {
    demolition: number // 만원
    kitchen: number
    bathroom: number
    flooring: number
    wallpaper: number
    window: number
    slidingDoor: number
    door: number
    electrical: number
    painting: number
    film: number
    furniture: number
    other: number
  }
  summary: {
    directCost: number // 만원
    indirectCost: number // 만원 (간접비 8%)
    totalCost: number // 만원
  }
  perPyeong: {
    directCost: number // 만원/평
    totalCost: number // 만원/평
  }
}

/**
 * 등급별 견적 계산
 */
export function calculateEstimateByGrade(input: EstimateInput): EstimateResult {
  const { pyeong, grade, customOptions } = input

  // 32평 기준 견적 가져오기
  const baseEstimate = TOTAL_ESTIMATE_32PY[grade]

  // 평수 스케일링
  let scaledEstimate = scaleEstimateByPyeong(baseEstimate, pyeong)

  // 커스텀 옵션 적용
  if (customOptions) {
    scaledEstimate = applyCustomOptions(scaledEstimate, grade, pyeong, customOptions)
  }

  // 평당 비용 계산
  const perPyeong = {
    directCost: Math.round(scaledEstimate.directCost / pyeong),
    totalCost: Math.round(scaledEstimate.totalCost / pyeong),
  }

  return {
    grade,
    pyeong,
    breakdown: {
      demolition: scaledEstimate.demolition,
      kitchen: scaledEstimate.kitchen,
      bathroom: scaledEstimate.bathroom,
      flooring: scaledEstimate.flooring,
      wallpaper: scaledEstimate.wallpaper,
      window: scaledEstimate.window,
      slidingDoor: scaledEstimate.slidingDoor,
      door: scaledEstimate.door,
      electrical: scaledEstimate.electrical,
      painting: scaledEstimate.painting,
      film: scaledEstimate.film,
      furniture: scaledEstimate.furniture,
      other: scaledEstimate.other,
    },
    summary: {
      directCost: scaledEstimate.directCost,
      indirectCost: scaledEstimate.indirectCost,
      totalCost: scaledEstimate.totalCost,
    },
    perPyeong,
  }
}

/**
 * 여러 등급 견적 비교
 */
export function compareGrades(
  input: Omit<EstimateInput, 'grade'>
): Record<ArgenGrade, EstimateResult> {
  const grades: ArgenGrade[] = ['ESSENTIAL', 'STANDARD', 'OPUS']

  const results: Record<ArgenGrade, EstimateResult> = {} as any

  for (const grade of grades) {
    results[grade] = calculateEstimateByGrade({
      ...input,
      grade,
    })
  }

  return results
}

/**
 * 예산에 맞는 등급 추천
 */
export function recommendGradeByBudget(
  budget: number, // 만원
  pyeong: number
): {
  recommendedGrade: ArgenGrade
  estimatedCost: number
  difference: number // 예산과의 차이 (만원)
  isWithinBudget: boolean
} {
  const grades: ArgenGrade[] = ['ESSENTIAL', 'STANDARD', 'OPUS']

  let recommendedGrade: ArgenGrade = 'ESSENTIAL'
  let estimatedCost = 0
  let minDifference = Infinity

  for (const grade of grades) {
    const estimate = calculateEstimateByGrade({ pyeong, grade })
    const difference = Math.abs(estimate.summary.totalCost - budget)

    if (difference < minDifference) {
      minDifference = difference
      recommendedGrade = grade
      estimatedCost = estimate.summary.totalCost
    }
  }

  return {
    recommendedGrade,
    estimatedCost,
    difference: estimatedCost - budget,
    isWithinBudget: estimatedCost <= budget,
  }
}

/**
 * 커스텀 옵션 적용
 */
function applyCustomOptions(
  estimate: TotalEstimate32py,
  grade: ArgenGrade,
  pyeong: number,
  options: NonNullable<EstimateInput['customOptions']>
): TotalEstimate32py {
  const adjusted = { ...estimate }

  // 아일랜드 옵션
  if (options.includeIsland !== undefined) {
    const { KITCHEN_SPECS } = require('@/lib/data/gradeSpecs')
    const kitchenSpec = KITCHEN_SPECS[grade]
    const islandCost = kitchenSpec.island.island.price / 10000 // 만원 단위
    const scale = pyeong / 32

    if (options.includeIsland) {
      adjusted.kitchen += Math.round(islandCost * scale)
    } else {
      adjusted.kitchen -= Math.round(islandCost * scale)
    }
  }

  // 키큰장 옵션
  if (options.includeTallCabinet !== undefined) {
    const { KITCHEN_SPECS } = require('@/lib/data/gradeSpecs')
    const kitchenSpec = KITCHEN_SPECS[grade]
    const tallCabinetCost = kitchenSpec.island.tallCabinet.price / 10000 // 만원 단위
    const scale = pyeong / 32

    if (options.includeTallCabinet && kitchenSpec.island.tallCabinet.included) {
      // 이미 포함되어 있으면 변경 없음
    } else if (options.includeTallCabinet && !kitchenSpec.island.tallCabinet.included) {
      adjusted.kitchen += Math.round(tallCabinetCost * scale)
    } else if (!options.includeTallCabinet && kitchenSpec.island.tallCabinet.included) {
      adjusted.kitchen -= Math.round(tallCabinetCost * scale)
    }
  }

  // 드레스룸 옵션
  if (options.includeDressingRoom !== undefined) {
    const { FURNITURE_SPECS } = require('@/lib/data/gradeSpecs')
    const furnitureSpec = FURNITURE_SPECS[grade]
    const dressingRoomCost = furnitureSpec.dressingRoom.price / 10000 // 만원 단위
    const scale = pyeong / 32

    if (options.includeDressingRoom && furnitureSpec.dressingRoom.type !== '없음') {
      // 이미 포함되어 있으면 변경 없음
    } else if (options.includeDressingRoom && furnitureSpec.dressingRoom.type === '없음') {
      adjusted.furniture += Math.round(dressingRoomCost * scale)
    } else if (!options.includeDressingRoom && furnitureSpec.dressingRoom.type !== '없음') {
      adjusted.furniture -= Math.round(dressingRoomCost * scale)
    }
  }

  // 창 개수 조정
  if (options.windowCount !== undefined) {
    const { WINDOW_SPECS } = require('@/lib/data/gradeSpecs')
    const windowSpec = WINDOW_SPECS[grade]
    const baseWindowCount = 5.5 // 32평 기준 평균 창 개수
    const windowCostPerUnit = windowSpec.pricePerUnit.total / 10000 // 만원 단위
    const scale = pyeong / 32

    const currentWindowCost = estimate.window
    const targetWindowCount = options.windowCount
    const targetWindowCost = Math.round(windowCostPerUnit * targetWindowCount * scale)

    adjusted.window = targetWindowCost
  }

  // 문 개수 조정
  if (options.doorCount !== undefined) {
    const { DOOR_SPECS } = require('@/lib/data/gradeSpecs')
    const doorSpec = DOOR_SPECS[grade]
    const baseDoorCount = 5.5 // 32평 기준 평균 문 개수
    const doorCostPerUnit = doorSpec.pricePerUnit.total / 10000 // 만원 단위
    const scale = pyeong / 32

    const currentDoorCost = estimate.door
    const targetDoorCount = options.doorCount
    const targetDoorCost = Math.round(doorCostPerUnit * targetDoorCount * scale)

    adjusted.door = targetDoorCost
  }

  // 직접공사비 재계산
  adjusted.directCost =
    adjusted.demolition +
    adjusted.kitchen +
    adjusted.bathroom +
    adjusted.flooring +
    adjusted.wallpaper +
    adjusted.window +
    adjusted.slidingDoor +
    adjusted.door +
    adjusted.electrical +
    adjusted.painting +
    adjusted.film +
    adjusted.furniture +
    adjusted.other

  // 간접비 재계산 (8%)
  adjusted.indirectCost = Math.round(adjusted.directCost * 0.08)

  // 총 공사비 재계산
  adjusted.totalCost = adjusted.directCost + adjusted.indirectCost

  return adjusted
}

/**
 * 등급별 차이 분석
 */
export function analyzeGradeDifference(
  from: ArgenGrade,
  to: ArgenGrade,
  pyeong: number
): {
  costDifference: number // 만원
  percentageIncrease: number // %
  keyUpgrades: string[]
  valueProposition: string
} {
  const fromEstimate = calculateEstimateByGrade({ pyeong, grade: from })
  const toEstimate = calculateEstimateByGrade({ pyeong, grade: to })

  const costDifference = toEstimate.summary.totalCost - fromEstimate.summary.totalCost
  const percentageIncrease = Math.round(
    (costDifference / fromEstimate.summary.totalCost) * 100
  )

  // 주요 업그레이드 항목
  const keyUpgrades: string[] = []

  if (toEstimate.breakdown.kitchen > fromEstimate.breakdown.kitchen) {
    keyUpgrades.push('주방 전체 업그레이드')
  }
  if (toEstimate.breakdown.bathroom > fromEstimate.breakdown.bathroom) {
    keyUpgrades.push('욕실 프리미엄 자재')
  }
  if (toEstimate.breakdown.flooring > fromEstimate.breakdown.flooring) {
    keyUpgrades.push('바닥재 고급화')
  }
  if (toEstimate.breakdown.window > fromEstimate.breakdown.window) {
    keyUpgrades.push('샤시/창호 업그레이드')
  }
  if (toEstimate.breakdown.furniture > fromEstimate.breakdown.furniture) {
    keyUpgrades.push('가구 커스텀화')
  }

  // 가치 제안 메시지
  let valueProposition = ''
  if (to === 'OPUS') {
    valueProposition = '10년 이상 거주 시 초기 투자 대비 장기적으로 유리한 구성'
  } else if (to === 'STANDARD') {
    valueProposition = '가성비와 품질의 최적 밸런스, 중기 거주에 적합'
  } else {
    valueProposition = '필수 공정에 집중한 실속 있는 구성'
  }

  return {
    costDifference,
    percentageIncrease,
    keyUpgrades,
    valueProposition,
  }
}




