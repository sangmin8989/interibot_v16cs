/**
 * 인테리봇 헌법 v1.1 기반 견적엔진 (최소 복구 버전)
 * 
 * 작성일: 2025년 12월
 * 목적: 헌법 v1.1 문서에 따른 견적 계산 엔진
 * 
 * 핵심 원칙:
 * - 재현 가능한 견적엔진
 * - 동일 입력 → 항상 동일 결과
 * - DB 값 그대로 사용 (추정/보정/평균 금지)
 * - 헌법 v1.1 전용 서비스만 사용 (getMaterialPriceStrict, getLaborRateStrict)
 * - 실패 시 무조건 throw EstimateValidationError
 */

import type {
  MaterialRequest,
  LaborRequest,
  ProcessEstimateBlock,
  FinalEstimate,
  ProcessMode,
  ProcessId,
  SelectedSpace,
  EstimateGenerationOptions,
  QuantityBasis,
} from '@/lib/types/헌법_견적_타입'
import { EstimateValidationError } from '@/lib/types/헌법_견적_타입'
// ✅ 헌법 v1.1: 전용 서비스 import (constitution-v1-engine.ts에서만 호출 가능)
import { getMaterialPriceStrict } from '@/lib/services/material-service-strict'
import { getLaborRateStrict } from '@/lib/services/labor-service-strict'

// ============================================================
// 1. 공정 카테고리 → 공정 ID 매핑
// ============================================================

/**
 * 공정 카테고리 → 공정 ID 매핑
 */
const CATEGORY_TO_PROCESS_ID: Record<string, ProcessId> = {
  'wall_finish': 'finish',
  'floor_finish': 'finish',
  'door_finish': 'door',
  'window_finish': 'window',
  'electric_lighting': 'electric',
  'kitchen_core': 'kitchen',
  'kitchen_countertop': 'kitchen',
  'bathroom_core': 'bathroom',
  'entrance_core': 'storage',
  'balcony_core': 'storage',
}

/**
 * 공간 ID → SelectedSpace 변환
 */
function convertSpaceIdToSelectedSpace(spaceId: string): SelectedSpace {
  const mapping: Record<string, SelectedSpace> = {
    'living': 'living',
    'kitchen': 'kitchen',
    'bathroom': 'bathroom',
    'masterBathroom': 'bathroom',
    'commonBathroom': 'bathroom',
    'masterBedroom': 'room',
    'room1': 'room',
    'room2': 'room',
    'room3': 'room',
    'entrance': 'entrance',
    'balcony': 'balcony',
  }
  return mapping[spaceId] || 'living'
}

/**
 * 공정명 가져오기
 */
function getProcessName(processId: ProcessId): string {
  // ⚠️ 'SYSTEM'은 실제 공정이 아니므로 제외
  const names: Record<Exclude<ProcessId, 'SYSTEM'>, string> = {
    'demolition': '철거',
    'finish': '마감',
    'electric': '조명/전기',
    'kitchen': '주방',
    'bathroom': '욕실',
    'door': '문',
    'window': '창호',
    'storage': '수납',
    'waterproof': '방수',
    'plumbing': '설비',
    'waste': '폐기물',
  }
  // 'SYSTEM'은 특수 값이므로 별도 처리
  if (processId === 'SYSTEM') {
    return '시스템'
  }
  return names[processId] || processId
}

// ============================================================
// 2. MaterialRequest 생성 (최소 구현)
// ============================================================

/**
 * processSelections에서 MaterialRequest 목록 생성
 */
function createMaterialRequests(
  processSelections: Record<string, Record<string, string | string[] | null>>,
  pyeong: number
): MaterialRequest[] {
  const requests: MaterialRequest[] = []

  // 카테고리별 자재 정보 매핑 (최소 구현)
  const categoryMapping: Record<string, {
    category1: string
    category2: string
    category3?: string
    spec: string
    quantity: (pyeong: number) => { value: number; unit: string; basis: string }
  }> = {
    'wall_finish': {
      category1: '도배',
      category2: '벽체',
      spec: '롤',
      quantity: (py) => ({
        value: py * 3.3 * 2.5,
        unit: '㎡',
        basis: `평수 ${py}평 기준 벽면 면적`
      })
    },
    'floor_finish': {
      category1: '바닥',
      category2: '마루',
      spec: '㎡',
      quantity: (py) => ({
        value: py * 3.3,
        unit: '㎡',
        basis: `평수 ${py}평 기준 바닥 면적`
      })
    },
    'kitchen_core': {
      category1: '주방',
      category2: '시스템주방',
      spec: 'SET',
      quantity: () => ({
        value: 1,
        unit: 'SET',
        basis: '주방 1세트'
      })
    },
    'bathroom_core': {
      category1: '욕실',
      category2: '욕실세트',
      spec: 'SET',
      quantity: () => ({
        value: 1,
        unit: 'SET',
        basis: '욕실 1세트'
      })
    },
    'electric_lighting': {
      category1: '조명',
      category2: '다운라이트',
      spec: 'EA',
      quantity: (py) => ({
        value: Math.ceil(py * 0.5),
        unit: 'EA',
        basis: `평수 ${py}평 기준 조명 개수`
      })
    },
    'door_finish': {
      category1: '도어',
      category2: '방문',
      spec: 'EA',
      quantity: (py) => ({
        value: Math.ceil(py / 10),
        unit: 'EA',
        basis: `평수 ${py}평 기준 문 개수`
      })
    },
    'window_finish': {
      category1: '창호',
      category2: '이중창',
      spec: 'EA',
      quantity: (py) => ({
        value: Math.ceil(py / 8),
        unit: 'EA',
        basis: `평수 ${py}평 기준 창호 개수`
      })
    },
    'kitchen_countertop': {
      category1: '주방',
      category2: '상판',
      category3: '쿼츠',
      spec: 'm',
      quantity: () => ({
        value: 2.5,
        unit: 'm',
        basis: '기본 주방 상판 길이'
      })
    },
  }

  // processSelections 순회
  Object.entries(processSelections).forEach(([spaceId, selections]) => {
    if (!selections) return

    const space = convertSpaceIdToSelectedSpace(spaceId)

    Object.entries(selections).forEach(([category, value]) => {
      // null 또는 'none'이면 제외
      if (value === null || value === 'none') return

      const processId = CATEGORY_TO_PROCESS_ID[category]
      if (!processId) return

      const mapping = categoryMapping[category]
      if (!mapping) return

      const quantity = mapping.quantity(pyeong)

      requests.push({
        processId,
        space,
        category: {
          category1: mapping.category1,
          category2: mapping.category2,
          category3: mapping.category3,
        },
        spec: mapping.spec,
        brandCondition: {
          isArgenStandard: true,
        },
        quantity,
      })
    })
  })

  return requests
}

// ============================================================
// 3. LaborRequest 생성 (최소 구현)
// ============================================================

/**
 * processSelections에서 LaborRequest 목록 생성
 */
function createLaborRequests(
  processSelections: Record<string, Record<string, string | string[] | null>>,
  pyeong: number
): LaborRequest[] {
  const requests: LaborRequest[] = []

  // 공정별 노무 정보 매핑 (기본값, 실제는 DB에서 가져옴)
  // ⚠️ 'SYSTEM'은 실제 공정이 아니므로 제외
  const processMapping: Record<Exclude<ProcessId, 'SYSTEM'>, {
    unit: 'm2' | 'EA' | 'SET' | 'day' | 'team'
    totalQuantity: (pyeong: number) => number
    dailyOutput: number
    crewSize: number
  }> = {
    'finish': {
      unit: 'm2',
      totalQuantity: (py) => py * 3.3,
      dailyOutput: 40,
      crewSize: 2,
    },
    'kitchen': {
      unit: 'SET',
      totalQuantity: () => 1,
      dailyOutput: 0.5,
      crewSize: 2,
    },
    'bathroom': {
      unit: 'SET',
      totalQuantity: () => 1,
      dailyOutput: 0.7,
      crewSize: 2,
    },
    'demolition': {
      unit: 'm2',
      totalQuantity: (py) => py * 3.3,
      dailyOutput: 25,
      crewSize: 3,
    },
    'electric': {
      unit: 'EA',
      totalQuantity: () => 10,
      dailyOutput: 15,
      crewSize: 1,
    },
    'door': {
      unit: 'EA',
      totalQuantity: () => 3,
      dailyOutput: 2,
      crewSize: 2,
    },
    'window': {
      unit: 'EA',
      totalQuantity: () => 5,
      dailyOutput: 3,
      crewSize: 2,
    },
    'storage': {
      unit: 'EA',
      totalQuantity: () => 1,
      dailyOutput: 1,
      crewSize: 2,
    },
    'waterproof': {
      unit: 'm2',
      totalQuantity: (py) => Math.min(py * 0.3, 15),
      dailyOutput: 10,
      crewSize: 1,
    },
    'plumbing': {
      unit: 'SET',
      totalQuantity: () => 1,
      dailyOutput: 0.5,
      crewSize: 2,
    },
    'waste': {
      unit: 'day',
      totalQuantity: (py) => Math.ceil(py / 20),
      dailyOutput: 1,
      crewSize: 2,
    },
  }

  // processSelections 순회
  Object.entries(processSelections).forEach(([spaceId, selections]) => {
    if (!selections) return

    Object.entries(selections).forEach(([category, value]) => {
      if (value === null || value === 'none') return

      const processId = CATEGORY_TO_PROCESS_ID[category]
      if (!processId) return

      // 'SYSTEM'은 실제 공정이 아니므로 건너뜀
      if (processId === 'SYSTEM') return

      const mapping = processMapping[processId as Exclude<ProcessId, 'SYSTEM'>]
      if (!mapping) return

      const totalQuantity = mapping.totalQuantity(pyeong)

      requests.push({
        processId,
        unit: mapping.unit,
        totalQuantity,
        dailyOutput: mapping.dailyOutput,
        crewSize: mapping.crewSize,
        difficultyFactor: 1.0,
      })
    })
  })

  return requests
}

// ============================================================
// 4. 최종 견적 계산 (헌법 v1.1)
// ============================================================

/**
 * 최종 견적 계산 (헌법 v1.1)
 * 
 * @param options - 견적 생성 옵션
 * @returns 최종 견적 결과
 * @throws EstimateValidationError - 검증 실패 시
 */
export async function calculateFinalEstimateV1(
  options: EstimateGenerationOptions & {
    spaceType?: '주거' | '상업' | '사무실' | '기타'
    familyComposition?: {
      adults: number
      children: number
      elderly: number
      pets: boolean
    }
    specialConditions?: string[]
  }
): Promise<FinalEstimate> {
  const { pyeong, mode, spaces, processSelections } = options

  // 입력 검증
  if (!pyeong || pyeong <= 0) {
    throw new EstimateValidationError({
      processId: 'SYSTEM',
      reason: '평수는 0보다 커야 합니다.'
    })
  }

  if (!processSelections || Object.keys(processSelections).length === 0) {
    if (mode !== 'FULL') {
      throw new EstimateValidationError({
        processId: 'SYSTEM',
        reason: 'processSelections가 없습니다.'
      })
    }
  }

  // 1. MaterialRequest 목록 생성
  const materialRequests = createMaterialRequests(processSelections, pyeong)

  // 2. LaborRequest 목록 생성
  const laborRequests = createLaborRequests(processSelections, pyeong)

  // 3. 공정별로 그룹화
  const processGroups = new Map<ProcessId, {
    materialRequests: MaterialRequest[]
    laborRequests: LaborRequest[]
  }>()

  materialRequests.forEach(req => {
    if (!processGroups.has(req.processId)) {
      processGroups.set(req.processId, { materialRequests: [], laborRequests: [] })
    }
    processGroups.get(req.processId)!.materialRequests.push(req)
  })

  laborRequests.forEach(req => {
    if (!processGroups.has(req.processId)) {
      processGroups.set(req.processId, { materialRequests: [], laborRequests: [] })
    }
    processGroups.get(req.processId)!.laborRequests.push(req)
  })

  // 4. 공정별 블록 생성
  const processBlocks: ProcessEstimateBlock[] = []

  // 공정이 없으면 실패
  if (processGroups.size === 0) {
    throw new EstimateValidationError({
      processId: 'SYSTEM',
      reason: '선택된 공정이 없습니다.'
    })
  }

  for (const [processId, group] of processGroups) {
    // ✅ 헌법 v1.1: 전용 서비스 사용 (실패 시 무조건 throw EstimateValidationError)
    const materialDataList = await Promise.all(
      group.materialRequests.map(async (req) => {
        const data = await getMaterialPriceStrict(req)
        return { request: req, data }
      })
    )

    const laborDataList = group.laborRequests.length > 0
      ? await Promise.all(
          group.laborRequests.map(async (req) => {
            const data = await getLaborRateStrict(req)
            return { request: req, data }
          })
        )
      : []

    // 자재 정보 수집
    const materials = materialDataList.map(({ request, data }) => {
      const quantity = request.quantity.value
      const unitPrice = data.price
      const totalPrice = quantity * unitPrice

      return {
        brandName: data.brandName,
        productName: data.productName,
        spec: data.spec,
        category: {
          category1: data.category1,
          category2: data.category2,
          category3: data.category3,
        },
        quantity,
        unit: data.unit,
        unitPrice,
        totalPrice,
        dbSource: {
          table: 'materials',
          key: data.materialId || data.materialCode || 'unknown',
        },
      }
    })

    // 노무 정보 수집
    let laborInfo: ProcessEstimateBlock['labor'] | null = null

    if (laborDataList.length > 0) {
      const firstLabor = laborDataList[0]
      const totalQuantity = firstLabor.request.totalQuantity
      const dailyOutput = firstLabor.data.dailyOutput
      const crewSize = firstLabor.data.crewSize
      const ratePerPersonDay = firstLabor.data.ratePerPersonDay
      const difficultyFactor = firstLabor.data.difficultyFactor || 1.0

      // 작업 일수 계산
      const workDays = Math.ceil(totalQuantity / dailyOutput)

      // 총 노무비 계산
      const totalLaborCost = workDays * crewSize * ratePerPersonDay * difficultyFactor

      laborInfo = {
        unit: firstLabor.data.unit,
        dailyOutput,
        crewSize,
        workDays,
        ratePerPersonDay,
        difficultyFactor,
        calculationBasis: `작업량 ${totalQuantity}${firstLabor.data.unit} ÷ 1일 작업량 ${dailyOutput}${firstLabor.data.unit} = ${workDays}일 × ${crewSize}인 × ${ratePerPersonDay.toLocaleString()}원 × 난이도 ${difficultyFactor}`,
        totalLaborCost,
        dbSource: {
          table: 'labor_costs',
          key: firstLabor.data.laborId || 'unknown',
        },
      }
    } else if (materials.length > 0) {
      // 자재가 있는데 노무가 없으면 실패
      throw new EstimateValidationError({
        processId,
        reason: '시공 공정인데 노무 정보가 없습니다.'
      })
    }

    // laborInfo가 없으면 공정 블록 생성 불가
    if (!laborInfo) {
      throw new EstimateValidationError({
        processId,
        reason: '노무 정보가 없어 공정 블록을 생성할 수 없습니다.'
      })
    }

    // 수량 산정 기준 생성
    const totalQuantity = group.materialRequests
      .reduce((sum, r) => sum + r.quantity.value, 0)

    const quantityBasis: QuantityBasis = {
      type: totalQuantity > 0 ? 'AREA' : 'COUNT',
      value: totalQuantity || 1,
      reason: totalQuantity > 0 
        ? `공간 면적 기준 수량 산정 (${totalQuantity}${materials[0]?.unit || ''})`
        : '개수 기준 수량 산정',
    }

    // 자재 총액 계산
    const materialTotal = materials.reduce((sum, m) => sum + m.totalPrice, 0)
    const laborTotal = laborInfo.totalLaborCost
    const processTotal = materialTotal + laborTotal

    processBlocks.push({
      processName: getProcessName(processId),
      processId,
      processType: '선택',
      quantityBasis,
      spaces: Array.from(new Set(group.materialRequests.map(r => r.space))),
      materials,
      labor: laborInfo,
      inclusions: [],
      exclusions: [],
      assumptions: [],
      options: [],
      materialTotal,
      laborTotal,
      processTotal,
    })
  }

  // 5. 최종 견적 조립
  const totalMaterial = processBlocks.reduce((sum, block) => sum + block.materialTotal, 0)
  const totalLabor = processBlocks.reduce((sum, block) => sum + block.laborTotal, 0)
  const totalDirect = totalMaterial + totalLabor

  // 간접비 계산
  const industrialAccident = Math.round(totalLabor * 0.0307)
  const employment = Math.round(totalLabor * 0.015)
  const overhead = Math.round(totalDirect * 0.03)
  const profit = Math.round(totalDirect * 0.05)
  const indirectTotal = industrialAccident + employment + overhead + profit

  // 부가가치세 계산
  const totalBeforeVAT = totalDirect + indirectTotal
  const vat = Math.round(totalBeforeVAT * 0.1)
  const totalWithVAT = totalBeforeVAT + vat

  // 평당 단가 계산
  const costPerPyeong = Math.round(totalWithVAT / pyeong)

  // ✅ 프론트엔드 호환: summary 객체 추가 (grandTotal 포함)
  const summary = {
    processList: processBlocks.map(block => block.processName),
    totalMaterial,
    totalLabor,
    totalDirect,
    netTotal: totalBeforeVAT, // VAT 제외 총액 (순공사비)
    indirectCosts: {
      industrialAccident,
      employment,
      overhead,
      profit,
      total: indirectTotal,
    },
    vat,
    totalWithVAT,
    grandTotal: totalWithVAT, // 프론트엔드 호환: grandTotal = totalWithVAT
    costPerPyeong,
  }

  return {
    projectSummary: {
      pyeong,
      spaceType: options.spaceType || '주거',
      familyComposition: options.familyComposition,
      specialConditions: options.specialConditions,
      mode,
      spaces,
      processes: Array.from(processGroups.keys()),
    },
    processBlockSummary: processBlocks.map(block => ({
      processId: block.processId,
      processName: block.processName,
      processType: block.processType,
      processTotal: block.processTotal,
    })),
    processBlocks,
    optionsSummary: [],
    estimateResult: {
      totalMaterial,
      totalLabor,
      totalDirect,
      indirectCosts: {
        industrialAccident,
        employment,
        overhead,
        profit,
        total: indirectTotal,
      },
      vat,
      totalWithVAT,
      costPerPyeong,
    },
    summary, // ✅ 프론트엔드 호환: summary 추가
    standard: 'ARGEN',
    status: 'SUCCESS',
  }
}











