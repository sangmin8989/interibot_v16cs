// [experimental] 고급 견적 계산 모듈
// - pricing.json + trait-weights.json + 공정 매핑 기반의 상세 엔진.
// - 현재 /api/estimate/calculate 에 직접 연결되어 있지 않다.
// - 향후 calculator.ts 를 이 모듈과 통합할 때 참고용으로 사용한다.

/**
 * 견적 계산 핵심 로직
 * 가이드의 STEP 2-9 구현
 */

import {
  TraitScores,
  ProcessDetail,
  ItemDetail,
  ArgenItem,
} from '@/types/estimate'
import {
  loadPriceMaster,
  loadTraitMatrix,
  getBaseAmountBySize,
  getProcessRatios,
  getTraitWeightLimits,
} from './dataLoader'

// 타입 정의
type PricingData = ReturnType<typeof loadPriceMaster>
type Item = PricingData['process_groups'][0]['items'][0]
type SizeEstimate = PricingData['size_base_estimate'][0]

// 지역 계수
const REGION_FACTORS = {
  seoul: 1.1,
  gyeonggi: 1.0,
  local: 0.9,
}

// 공정별 기본 일수
const PROCESS_DAYS: Record<string, number> = {
  '1000': 3, // 철거/폐기
  '200': 7, // 목공사/가구
  '300': 5, // 전기/통신
  '400': 5, // 욕실/수전
  '500': 5, // 타일/석재
  '600': 3, // 도장/마감
  '700': 2, // 필름/시트
  '800': 3, // 창호/샤시
  '900': 3, // 도배/벽지
  '100': 5, // 주방/다용도실
}

// 브랜드 대안 가격 (예시)
const BRAND_ALTERNATIVES: Record<string, { brandName: string; price: number }[]> = {
  '203': [
    { brandName: '한샘', price: 450000 },
    { brandName: '일룸', price: 520000 },
  ],
  '204': [
    { brandName: '한샘', price: 2800000 },
    { brandName: '이케아', price: 3200000 },
  ],
  '216': [
    { brandName: '한샘', price: 1200000 },
    { brandName: '일룸', price: 1650000 },
  ],
}

/**
 * 평수 → 기본 금액 산출 (새 구조)
 * @param sizePyeong 평수
 * @param grade 등급 (basic/standard/premium)
 * @param region 지역
 * @returns 기본 금액 (VAT 제외)
 */
export function calculateBaseAmount(
  sizePyeong: number,
  grade: 'basic' | 'standard' | 'premium',
  region: 'seoul' | 'gyeonggi' | 'local' = 'gyeonggi'
): number {
  const baseAmount = getBaseAmountBySize(sizePyeong, grade, region)
  if (baseAmount === null) {
    throw new Error(`평수 ${sizePyeong}에 대한 기본 금액을 찾을 수 없습니다`)
  }
  return baseAmount
}

/**
 * STEP 2: 기본 견적 조회 (하위 호환성 유지)
 * @deprecated calculateBaseAmount 사용 권장
 */
export function getBaseEstimate(
  size: number,
  region: 'seoul' | 'gyeonggi' | 'local'
): SizeEstimate | null {
  const pricingData = loadPriceMaster()
  const sizeEstimate = pricingData.size_base_estimate.find(
    (s) => size >= s.size_min && size <= s.size_max
  )

  if (!sizeEstimate) return null

  const regionFactor = REGION_FACTORS[region] || 1.0

  return {
    ...sizeEstimate,
    basic_min: Math.round(sizeEstimate.basic_min * regionFactor),
    basic_max: Math.round(sizeEstimate.basic_max * regionFactor),
    standard_min: Math.round(sizeEstimate.standard_min * regionFactor),
    standard_max: Math.round(sizeEstimate.standard_max * regionFactor),
    premium_min: Math.round(sizeEstimate.premium_min * regionFactor),
    premium_max: Math.round(sizeEstimate.premium_max * regionFactor),
  } as SizeEstimate
}

/**
 * STEP 3: 등급 결정
 */
export function determineGrade(
  traitScores: TraitScores,
  baseEstimate: SizeEstimate | null,
  budget?: number
): 'basic' | 'standard' | 'premium' {
  // 사용자 희망 예산이 있으면 우선 반영
  if (budget && baseEstimate) {
    if (budget < baseEstimate.standard_min) return 'basic'
    if (budget < baseEstimate.premium_min) return 'standard'
    return 'premium'
  }

  // 예산 감각(T08) 기준
  const budgetSense = traitScores.T08
  if (budgetSense <= 40) return 'premium' // 예산 여유
  if (budgetSense >= 71) return 'basic' // 가성비 중시
  return 'standard' // 중간
}

/**
 * 공간별 면적 계산 (평형 기반 추정)
 */
function calculateSpaceArea(
  space: '욕실' | '주방' | '베란다' | '천정' | '벽',
  size: number
): number {
  // 평형을 m²로 변환
  const totalArea = size * 3.3

  // 공간별 면적 비율 (일반적인 아파트 기준)
  const areaRatios: Record<string, number> = {
    욕실: 0.08, // 전체 면적의 8% (안방+공용 합쳐서)
    주방: 0.12, // 전체 면적의 12%
    베란다: 0.06, // 전체 면적의 6%
    천정: 1.0, // 천정은 전체 면적과 동일
    벽: 2.5, // 벽면적은 천정 면적의 약 2.5배 (높이 2.4m 기준)
  }

  const ratio = areaRatios[space] || 1.0
  const area = totalArea * ratio

  // 최소값 보정
  if (space === '욕실') {
    // 욕실 벽면적: 약 8~12m² (2개소 기준)
    return Math.max(8, Math.min(12, area))
  } else if (space === '주방') {
    // 주방 벽면적: 약 10~15m²
    return Math.max(10, Math.min(15, area))
  } else if (space === '베란다') {
    // 베란다 면적: 약 3~6m²
    return Math.max(3, Math.min(6, area))
  }

  return Math.round(area * 10) / 10 // 소수점 1자리
}

/**
 * 공간별 항목 매핑 (아파트 구조 기반)
 */
function getItemsBySpace(
  processCode: string,
  apartmentType: 'apartment' | 'officetel' | 'villa'
): Record<string, string[]> {
  // 공간별 항목 매핑
  const spaceMapping: Record<string, Record<string, string[]>> = {
    apartment: {
      현관: ['201', '505'], // 신발장, 현관 타일
      거실: ['210', '212', '216'], // 우물천정, 아트월, TV장
      주방: ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '503'], // 주방 타일 포함
      안방: ['203', '211', '215'], // 붙박이장, 화장대, 침대 헤드
      욕실: ['401', '402', '403', '404', '406', '407', '501', '502'], // 안방/공용 각 + 욕실 타일
      베란다: ['504'], // 베란다 타일
    },
    officetel: {
      현관: ['201'],
      거실: ['216', '210'],
      주방: ['101', '102', '103', '503'], // 주방 타일 포함
      안방: ['203', '211'],
      욕실: ['401', '402', '403', '501', '502'], // 욕실 타일 포함
      베란다: ['504'], // 베란다 타일
    },
    villa: {
      현관: ['201', '505'],
      거실: ['210', '212', '216'],
      주방: ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '503'],
      안방: ['203', '211', '215'],
      욕실: ['401', '402', '403', '404', '406', '407', '501', '502'],
      베란다: ['504'], // 베란다 타일
    },
  }

  const mapping = spaceMapping[apartmentType] || spaceMapping.apartment
  return mapping
}

/**
 * STEP 4: 공정별 항목 구성 (공간별 매핑 포함)
 */
export function buildProcessItems(
  size: number,
  grade: 'basic' | 'standard' | 'premium',
  processCode: string,
  apartmentType?: 'apartment' | 'officetel' | 'villa'
): ItemDetail[] {
  const pricingData = loadPriceMaster()
  const processGroup = pricingData.process_groups.find(
    (g) => g.code === processCode
  )

  if (!processGroup) return []

  const items: ItemDetail[] = []
  const addedItemCodes = new Set<string>() // 중복 체크용

  // 공간별 항목 매핑 (아파트 타입이 있을 경우)
  const spaceMapping =
    apartmentType ? getItemsBySpace(processCode, apartmentType) : null

  for (const item of processGroup.items) {
    // 중복 체크
    if (addedItemCodes.has(item.item_code)) {
      console.warn(
        `[중복 항목 건너뜀] 공정 ${processCode}, 항목 ${item.item_code} (${item.item_name})`
      )
      continue
    }

    // 공간별 필터링 (타일, 목공 공정)
    if (spaceMapping && (processCode === '500' || processCode === '200')) {
      let shouldInclude = false

      // 타일 공정 (500): 공간별로 필요한 타일만 추가
      if (processCode === '500') {
        if (item.item_code === '501' || item.item_code === '502') {
          // 욕실 타일
          shouldInclude =
            spaceMapping.욕실?.includes(item.item_code) ||
            spaceMapping.안방?.includes(item.item_code)
        } else if (item.item_code === '503') {
          // 주방 벽타일
          shouldInclude = spaceMapping.주방?.includes(item.item_code) || false
        } else if (item.item_code === '504') {
          // 베란다 타일
          shouldInclude = spaceMapping.베란다?.includes(item.item_code) || false
        } else {
          // 기타 타일 항목 (탄성줄눈, 인건비 등)은 포함
          shouldInclude = true
        }
      }
      // 목공 공정 (200): 공간별로 필요한 가구만 추가
      else if (processCode === '200') {
        // 모든 공간의 항목을 확인
        for (const spaceItems of Object.values(spaceMapping)) {
          if (spaceItems.includes(item.item_code)) {
            shouldInclude = true
            break
          }
        }
        // 공간 매핑에 없는 항목도 포함 (도어세트, 중문 등)
        if (!shouldInclude && !item.item_name.includes('도어') && !item.item_name.includes('중문')) {
          shouldInclude = true // 기본적으로 포함
        }
      }

      if (!shouldInclude) {
        continue
      }
    }

    // 등급별 단가 선택
    let unitPrice =
      grade === 'basic'
        ? item.basic_price
        : grade === 'standard'
        ? item.standard_price
        : item.premium_price

    // 수량 계산
    let quantity = 1
    if (item.unit === 'py') {
      quantity = size
    } else if (item.unit === 'm²') {
      // 공정별/항목별 실제 면적 계산
      if (item.item_code === '501' || item.item_code === '502') {
        // 욕실 타일 (501: 벽타일, 502: 바닥타일)
        quantity = Math.round(size * 1.3 * 10) / 10 // 소수점 1자리
      } else if (item.item_code === '503') {
        // 주방 타일
        quantity = Math.round(size * 0.2 * 10) / 10
      } else if (item.item_code === '504') {
        // 베란다 타일
        quantity = Math.round(size * 0.3 * 10) / 10
      } else if (item.item_code === '901') {
        // 천정 도배
        quantity = Math.round(size * 3.3 * 10) / 10
      } else if (item.item_code === '902') {
        // 벽 도배
        quantity = Math.round(size * 5.2 * 10) / 10
      } else {
        // 기타 m² 항목
        quantity = Math.round(size * 0.5 * 10) / 10
      }
    } else if (item.unit === '식' || item.unit === 'ea' || item.unit === '개소') {
      // 평형 기반 자동 산출
      if (size < 30) quantity = 1
      else if (size < 50) quantity = 2
      else quantity = 3
    } else if (item.unit === 'm') {
      // 평형에 따라 추정
      quantity = Math.round(size * 0.5)
    } else if (item.unit === '실') {
      // 욕실 수량 (안방/공용)
      quantity = size < 30 ? 1 : 2
    } else if (item.unit === '짝') {
      quantity = size < 30 ? 1 : 2
    } else if (item.unit === '자') {
      quantity = size < 30 ? 1 : 2
    } else if (item.unit === '자평') {
      quantity = size < 30 ? 1 : 2
    } else if (item.unit === '대') {
      quantity = size < 30 ? 1 : 2
    }

    // 인건비는 기본 1인으로 설정
    if (item.item_name.includes('인건비')) {
      quantity = 1
    }

    // 욕실 항목은 실(개소) 단위일 때 평형에 따라 수량 조정
    if (processCode === '400' && item.unit === '실') {
      quantity = size < 30 ? 1 : 2 // 안방/공용 각
    }

    const amount = Math.round(unitPrice * quantity)

    items.push({
      itemCode: item.item_code,
      itemName: item.item_name,
      spec: item.spec,
      unit: item.unit,
      quantity,
      unitPrice,
      amount,
      isArgenMake: item.is_argen_make,
      isRecommended: false,
    })

    // 중복 체크용 Set에 추가
    addedItemCodes.add(item.item_code)
  }

  return items
}

/**
 * 특수 케이스 처리 (청각 민감도, 건강 요소 등)
 */
export function handleSpecialCases(
  processes: ProcessDetail[],
  traitScores: TraitScores
): {
  processes: ProcessDetail[]
  specialNotes: string[]
} {
  const pricingData = loadPriceMaster()
  const specialNotes: string[] = []
  const updatedProcesses = [...processes]

  // 청각 민감도(T03) ≥ 70점 → 방음공사 추천
  if (traitScores.T03 >= 70) {
    specialNotes.push('청각 민감도 높음 → 방음공사 추천 (별도 견적 가능)')
    // 방음공사는 별도 견적이므로 여기서는 알림만
  }

  // 건강 요소(T07) ≥ 80점 → 친환경 자재로 업그레이드
  if (traitScores.T07 >= 80) {
    // 도장/도배 공정을 Premium 등급으로 업그레이드
    const 도장Process = updatedProcesses.find((p) => p.code === '600')
    const 도배Process = updatedProcesses.find((p) => p.code === '900')

    if (도장Process) {
      도장Process.items = 도장Process.items.map((item) => {
        const originalItem = pricingData.process_groups
          .find((g) => g.code === '600')
          ?.items.find((i) => i.item_code === item.itemCode)

        if (originalItem && item.unitPrice === originalItem.standard_price) {
          const newPrice = originalItem.premium_price
          const newAmount = Math.round(newPrice * item.quantity)
          return {
            ...item,
            unitPrice: newPrice,
            amount: newAmount,
          }
        }
        return item
      })
      도장Process.subtotal = 도장Process.items.reduce(
        (sum, item) => sum + item.amount,
        0
      )
      specialNotes.push('건강 요소 고려 → 친환경 프리미엄 자재 적용')
    }

    if (도배Process) {
      도배Process.items = 도배Process.items.map((item) => {
        const originalItem = pricingData.process_groups
          .find((g) => g.code === '900')
          ?.items.find((i) => i.item_code === item.itemCode)

        if (originalItem && item.unitPrice === originalItem.standard_price) {
          const newPrice = originalItem.premium_price
          const newAmount = Math.round(newPrice * item.quantity)
          return {
            ...item,
            unitPrice: newPrice,
            amount: newAmount,
          }
        }
        return item
      })
      도배Process.subtotal = 도배Process.items.reduce(
        (sum, item) => sum + item.amount,
        0
      )
    }
  }

  return {
    processes: updatedProcesses,
    specialNotes,
  }
}

/**
 * 공정별 금액 배분
 * @param baseAmount 기본 금액 (VAT 제외)
 * @param processRatios 공정별 비율 (예: { "100": 0.22, "200": 0.28, ... })
 * @param selectedProcesses 선택된 공정 코드 목록 (없으면 전체)
 * @returns 공정별 배분 금액
 */
export function allocateByProcess(
  baseAmount: number,
  processRatios: Record<string, number>,
  selectedProcesses?: string[]
): Record<string, number> {
  const allocated: Record<string, number> = {}
  
  // 선택된 공정이 있으면 해당 공정만, 없으면 전체 공정
  const processesToAllocate = selectedProcesses || Object.keys(processRatios)
  
  // 선택된 공정들의 비율 합계 계산
  const totalRatio = processesToAllocate.reduce(
    (sum, code) => sum + (processRatios[code] || 0),
    0
  )
  
  // 비율 정규화 (합계가 1이 되도록)
  const normalizedRatios: Record<string, number> = {}
  if (totalRatio > 0) {
    for (const code of processesToAllocate) {
      normalizedRatios[code] = (processRatios[code] || 0) / totalRatio
    }
  } else {
    // 비율이 없으면 균등 분배
    const equalRatio = 1 / processesToAllocate.length
    for (const code of processesToAllocate) {
      normalizedRatios[code] = equalRatio
    }
  }
  
  // 금액 배분
  for (const [code, ratio] of Object.entries(normalizedRatios)) {
    allocated[code] = Math.round(baseAmount * ratio)
  }
  
  return allocated
}

/**
 * 성향 가중치 적용 (개선 버전: 제한 규칙 적용)
 * @param processAmounts 공정별 금액
 * @param traitScores 성향 점수
 * @returns 조정된 공정별 금액 및 가중치 정보
 */
export function applyTraitAdjustments(
  processAmounts: Record<string, number>,
  traitScores: TraitScores
): {
  adjustedAmounts: Record<string, number>
  weightApplied: Record<string, number>
  traitInfluence: Record<string, string[]>
} {
  const traitWeightsData = loadTraitMatrix()
  const weightLimits = getTraitWeightLimits()
  
  const adjustedAmounts: Record<string, number> = {}
  const weightApplied: Record<string, number> = {}
  const traitInfluence: Record<string, string[]> = {}
  
  // 각 공정별로 가중치 계산
  for (const processCode of Object.keys(processAmounts)) {
    let totalWeight = 0
    const influences: string[] = []
    
    // 모든 trait_matrix를 순회하며 해당 공정에 영향을 주는 성향 찾기
    for (const traitMatrix of traitWeightsData.weight_matrix) {
      const traitId = traitMatrix.trait_id
      const traitScore = traitScores[traitId as keyof TraitScores]
      
      if (traitScore === undefined) continue
      
      let allWeight = 0
      let specificWeight = 0
      
      for (const impact of traitMatrix.impacts) {
        // 해당 공정에 영향을 주는지 확인
        // JSON 구조상 'process' 속성 사용 (process_code가 아님)
        const impactProcess = (impact as any).process_code || (impact as any).process
        if (impactProcess !== processCode && impactProcess !== 'ALL') {
          continue
        }
        
        // 가중치 레벨 결정
        let weight = 0
        if (traitScore <= 30) {
          weight = impact.weight_low
        } else if (traitScore <= 70) {
          weight = impact.weight_mid
        } else {
          weight = impact.weight_high
        }
        
        if (weight !== 0) {
          if (impactProcess === 'ALL') {
            allWeight += weight
          } else if (impactProcess === processCode) {
            specificWeight += weight
          }
        }
      }
      
      // ALL과 특정 공정 가중치 중 더 큰 값만 적용 (중복 방지)
      const finalWeight = Math.max(allWeight, specificWeight)
      
      if (finalWeight > 0) {
        totalWeight += finalWeight
        
        const traitName = traitWeightsData.trait_definitions.find(
          (t) => t.trait_id === traitId
        )?.trait_name
        if (traitName) {
          influences.push(`${traitId}: ${traitName}`)
        }
      }
    }
    
    // 가중치 제한 적용
    totalWeight = Math.max(
      weightLimits.min_adjustment,
      Math.min(weightLimits.max_adjustment, totalWeight)
    )
    
    weightApplied[processCode] = totalWeight
    traitInfluence[processCode] = influences
    
    // 금액 조정
    const baseAmount = processAmounts[processCode]
    adjustedAmounts[processCode] = Math.round(baseAmount * (1 + totalWeight / 100))
  }
  
  return {
    adjustedAmounts,
    weightApplied,
    traitInfluence,
  }
}

/**
 * STEP 5: 성향 가중치 적용 (기존 함수 - 하위 호환성 유지)
 * @deprecated applyTraitAdjustments 사용 권장
 */
export function applyTraitWeights(
  items: ItemDetail[],
  processCode: string,
  traitScores: TraitScores
): {
  items: ItemDetail[]
  weightApplied: number
  traitInfluence: string[]
} {
  const traitWeightsData = loadTraitMatrix()
  const weightLimits = getTraitWeightLimits()
  let totalWeight = 0
  const traitInfluences: string[] = []
  const weightDetails: Array<{
    traitId: string
    processCode: string
    weight: number
    score: number
  }> = []

  // 각 성향별로 ALL과 특정 공정 가중치를 분리해서 수집
  const traitWeightMap = new Map<
    string,
    { allWeight: number; specificWeight: number; score: number }
  >()

  // 모든 trait_matrix를 순회하며 해당 공정에 영향을 주는 성향 찾기
  for (const traitMatrix of traitWeightsData.weight_matrix) {
    const traitId = traitMatrix.trait_id
    const traitScore = traitScores[traitId as keyof TraitScores]

    if (traitScore === undefined) continue

    let allWeight = 0
    let specificWeight = 0

    for (const impact of traitMatrix.impacts) {
      // 해당 공정에 영향을 주는지 확인
      // JSON 구조상 'process' 속성 사용 (process_code가 아님)
      const impactProcess = (impact as any).process_code || (impact as any).process
      if (impactProcess !== processCode && impactProcess !== 'ALL') {
        continue
      }

      // 가중치 레벨 결정
      let weight = 0
      if (traitScore <= 30) {
        weight = impact.weight_low
      } else if (traitScore <= 70) {
        weight = impact.weight_mid
      } else {
        weight = impact.weight_high
      }

      if (weight !== 0) {
        if (impactProcess === 'ALL') {
          allWeight += weight
        } else if (impactProcess === processCode) {
          specificWeight += weight
        }
      }
    }

    // ALL과 특정 공정 가중치 중 더 큰 값만 적용 (중복 방지)
    const finalWeight = Math.max(allWeight, specificWeight)

    if (finalWeight > 0) {
      traitWeightMap.set(traitId, {
        allWeight,
        specificWeight,
        score: traitScore,
      })

      totalWeight += finalWeight

      weightDetails.push({
        traitId,
        processCode: allWeight > specificWeight ? 'ALL' : processCode,
        weight: finalWeight,
        score: traitScore,
      })

      const traitName = traitWeightsData.trait_definitions.find(
        (t) => t.trait_id === traitId
      )?.trait_name
      if (traitName && !traitInfluences.includes(`${traitId}: ${traitName}`)) {
        traitInfluences.push(`${traitId}: ${traitName}`)
      }
    }
  }

  // 가중치 적용 로그
  console.log(`\n[가중치 적용] 공정 ${processCode}:`)
  weightDetails.forEach((detail) => {
    const traitInfo = traitWeightMap.get(detail.traitId)
    if (traitInfo && traitInfo.allWeight > 0 && traitInfo.specificWeight > 0) {
      console.log(
        `  ${detail.traitId} (점수: ${detail.score}) → ALL(${traitInfo.allWeight}%) vs ${processCode}(${traitInfo.specificWeight}%) → ${detail.weight}% 적용 (큰 값 선택)`
      )
    } else {
      console.log(
        `  ${detail.traitId} (점수: ${detail.score}) → ${detail.processCode}에 ${detail.weight}% 적용`
      )
    }
  })
  console.log(`  → 총 가중치 (합산): ${totalWeight}%`)

  // 가중치 제한 적용 (새 규칙)
  totalWeight = Math.max(
    weightLimits.min_adjustment,
    Math.min(weightLimits.max_adjustment, totalWeight)
  )
  if (totalWeight !== weightDetails.reduce((sum, d) => sum + d.weight, 0)) {
    console.log(`  ⚠️ 가중치가 ${weightLimits.min_adjustment}~${weightLimits.max_adjustment}% 범위로 제한됨`)
  }

  // 각 항목에 가중치 적용
  const adjustedItems = items.map((item) => {
    const adjustedAmount = Math.round(item.amount * (1 + totalWeight / 100))
    return {
      ...item,
      amount: adjustedAmount,
    }
  })

  return {
    items: adjustedItems,
    weightApplied: totalWeight,
    traitInfluence: traitInfluences,
  }
}

/**
 * STEP 6: 아르젠 추천 로직
 */
export function recommendArgenItems(
  allItems: ItemDetail[],
  traitScores: TraitScores
): ArgenItem[] {
  const argenItems: ArgenItem[] = []

  // 아르젠 제작 가능 항목 필터링
  const argenMakeItems = allItems.filter((item) => item.isArgenMake)

  for (const item of argenMakeItems) {
    let shouldRecommend = false
    let reason = ''

    // 추천 조건 판단
    if (item.itemCode === '203' || item.itemCode === '204' || item.itemCode === '202') {
      // 붙박이장, 드레스룸, 수납장
      if (traitScores.T05 >= 60) {
        shouldRecommend = true
        reason = '정리정돈 성향 우수 → 맞춤 수납으로 공간 활용도 30% 향상'
      }
    }

    if (item.itemCode === '105' || item.itemCode === '106') {
      // 키큰장, 냉장고장
      if (traitScores.T01 >= 60) {
        shouldRecommend = true
        reason = '공간 감각 우수 → 데드스페이스 활용 설계'
      }
    }

    if (traitScores.T08 >= 70) {
      // 가성비 중시
      shouldRecommend = true
      reason = '아르젠 제작이 브랜드 대비 평균 20% 저렴'
    }

    if (!shouldRecommend) continue

    // 브랜드 대안 가격
    const alternatives = BRAND_ALTERNATIVES[item.itemCode] || [
      { brandName: '일반 브랜드', price: Math.round(item.amount * 1.2) },
    ]

    const brandPrice = alternatives[0].price
    const savings = brandPrice - item.amount
    const savingsPercent = Math.round((savings / brandPrice) * 100)

    argenItems.push({
      itemCode: item.itemCode,
      itemName: item.itemName,
      spec: item.spec,
      argenPrice: item.amount,
      brandAlternatives: alternatives,
      savings,
      savingsPercent,
      reason,
    })
  }

  return argenItems
}

/**
 * 선택된 공정만 필터링하여 합산
 * @param processes 전체 공정 목록
 * @param selectedProcessCodes 선택된 공정 코드 배열 (없으면 전체)
 * @returns 필터링된 공정 목록
 */
export function filterSelectedProcesses(
  processes: ProcessDetail[],
  selectedProcessCodes?: string[]
): ProcessDetail[] {
  if (!selectedProcessCodes || selectedProcessCodes.length === 0) {
    return processes
  }
  return processes.filter((p) => selectedProcessCodes.includes(p.code))
}

/**
 * STEP 7: 최종 집계 (선택된 공정만 계산)
 * @param processes 전체 공정 목록
 * @param size 평수
 * @param selectedProcessCodes 선택된 공정 코드 배열 (없으면 전체 계산)
 */
export function calculateTotal(
  processes: ProcessDetail[],
  size: number,
  selectedProcessCodes?: string[]
): {
  directCost: number
  indirectCost: number
  indirectCostDetails: {
    산재보험료: number
    고용보험료: number
    공과잡비: number
    기업이윤: number
  }
  totalBeforeVAT: number
  vat: number
  totalWithVAT: number
  perPyPrice: number
} {
  // 선택된 공정만 필터링
  const filteredProcesses = filterSelectedProcesses(processes, selectedProcessCodes)

  // 1. 각 공정별 subtotal 출력
  console.log('\n=== 공정별 Subtotal ===')
  if (selectedProcessCodes && selectedProcessCodes.length > 0) {
    console.log(`[선택된 공정만 계산] ${selectedProcessCodes.join(', ')}`)
  }
  filteredProcesses.forEach((process) => {
    console.log(
      `${process.code} ${process.name}: ${process.subtotal.toLocaleString()}원 (가중치: ${process.weightApplied}%)`
    )
    if (process.traitInfluence.length > 0) {
      console.log(`  → 영향 성향: ${process.traitInfluence.join(', ')}`)
    }
  })

  // 직접 공사비 합계 (선택된 공정만)
  const directCost = filteredProcesses.reduce((sum, p) => sum + p.subtotal, 0)

  // 2. 직접 공사비 합계 출력
  console.log(`\n=== 직접 공사비 합계 ===`)
  console.log(`총 직접 공사비: ${directCost.toLocaleString()}원`)

  // 노무비 합계 (인건비 항목)
  const laborCost = processes.reduce((sum, process) => {
    return (
      sum +
      process.items
        .filter((item) => item.unit === '인')
        .reduce((itemSum, item) => itemSum + item.amount, 0)
    )
  }, 0)

  // 간접 공사비 계산 (상세)
  const 산재보험료 = Math.round(laborCost * 0.0307) // 노무비 × 3.07%
  const 고용보험료 = Math.round(laborCost * 0.015) // 노무비 × 1.50%
  const 공과잡비 = Math.round(directCost * 0.03) // 직접공사비 × 3%
  const 기업이윤 = Math.round(directCost * 0.05) // 직접공사비 × 5%

  const indirectCost = 산재보험료 + 고용보험료 + 공과잡비 + 기업이윤

  // 3. 간접비 세부 내역 출력
  console.log(`\n=== 간접비 세부 내역 ===`)
  console.log(`노무비 합계: ${laborCost.toLocaleString()}원`)
  console.log(`산재보험료 (3.07%): ${산재보험료.toLocaleString()}원`)
  console.log(`고용보험료 (1.50%): ${고용보험료.toLocaleString()}원`)
  console.log(`공과잡비 (3%): ${공과잡비.toLocaleString()}원`)
  console.log(`기업이윤 (5%): ${기업이윤.toLocaleString()}원`)
  console.log(`간접비 합계: ${indirectCost.toLocaleString()}원`)

  // 최종 금액
  let totalBeforeVAT = directCost + indirectCost
  totalBeforeVAT = Math.floor(totalBeforeVAT / 10000) * 10000 // 만원 단위 절사

  const vat = Math.round(totalBeforeVAT * 0.1)
  const totalWithVAT = totalBeforeVAT + vat

  // 평당 단가 계산
  const perPyPrice = Math.round(totalBeforeVAT / size)

  // 4. 최종 금액 출력
  console.log(`\n=== 최종 금액 ===`)
  console.log(`VAT 전 총액: ${totalBeforeVAT.toLocaleString()}원`)
  console.log(`부가세 (10%): ${vat.toLocaleString()}원`)
  console.log(`최종 금액: ${totalWithVAT.toLocaleString()}원`)
  console.log(`평당 단가: ${perPyPrice.toLocaleString()}원`)
  console.log(`\n`)

  return {
    directCost,
    indirectCost,
    indirectCostDetails: {
      산재보험료,
      고용보험료,
      공과잡비,
      기업이윤,
    },
    totalBeforeVAT,
    vat,
    totalWithVAT,
    perPyPrice,
  }
}

/**
 * STEP 8: 성향 인사이트 생성
 */
export function generateTraitInsights(
  traitScores: TraitScores,
  processes: ProcessDetail[]
): string[] {
  const insights: string[] = []

  const traitNames: Record<string, string> = {
    T01: '공간 감각',
    T02: '시각 민감도',
    T03: '청각 민감도',
    T04: '청소 성향',
    T05: '정리정돈 습관',
    T06: '가족 구성',
    T07: '건강 요소',
    T08: '예산 감각',
    T09: '색감 취향',
    T10: '조명 취향',
    T11: '집 사용 목적',
    T12: '불편 요소',
    T13: '활동 동선',
    T14: '수면 패턴',
    T15: '취미·라이프스타일',
  }

  // 높은 점수(≥70) 성향 찾기
  for (const [traitId, score] of Object.entries(traitScores)) {
    if (score >= 70) {
      const traitName = traitNames[traitId]
      if (!traitName) continue

      if (traitId === 'T05') {
        insights.push('정리정돈 습관 우수 → 수납공간 40% 증가 설계')
      } else if (traitId === 'T02') {
        insights.push('시각 민감도 높음 → 프리미엄 마감재 적용')
      } else if (traitId === 'T06') {
        insights.push('가족 구성 고려 → 수납·동선 최적화')
      } else if (traitId === 'T03') {
        insights.push('청각 민감도 높음 → 방음공사 추천 (별도 견적 가능)')
      } else if (traitId === 'T07') {
        insights.push('건강 요소 고려 → 친환경 자재 적용')
      } else if (traitId === 'T11') {
        insights.push('재택근무 고려 → 서재·책상 공간 확보')
      }
    }
  }

  return insights
}

/**
 * STEP 9: 공사 일정 산출
 */
export function calculateSchedule(
  processes: ProcessDetail[],
  size: number
): {
  estimatedDays: number
  processSchedule: { processName: string; days: number }[]
} {
  const processSchedule: { processName: string; days: number }[] = []

  // 평형 보정 계수
  let sizeFactor = 1.0
  if (size < 30) sizeFactor = 0.8
  else if (size >= 50) sizeFactor = 1.2

  let totalDays = 0

  for (const process of processes) {
    const baseDays = PROCESS_DAYS[process.code] || 3

    // 목공사는 평형에 따라 추가 일수
    let adjustedDays = baseDays
    if (process.code === '200' && size >= 40) {
      adjustedDays += 2
    }

    adjustedDays = Math.round(adjustedDays * sizeFactor)

    processSchedule.push({
      processName: process.name,
      days: adjustedDays,
    })

    totalDays += adjustedDays
  }

  return {
    estimatedDays: totalDays,
    processSchedule,
  }
}

