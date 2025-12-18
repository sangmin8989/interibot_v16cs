/**
 * 인테리봇 최종 견적엔진 (헌법 문서 기반)
 * 
 * 작성일: 2024년 12월
 * 목적: 헌법 문서에 따른 견적 계산 엔진
 * 
 * 핵심 원칙:
 * - processSelections만 SSOT
 * - MaterialRequest/LaborRequest 기반 DB 조회
 * - Fail-Fast 원칙
 * - 브랜드·자재·노무가 명확히 보이는 실무형 견적서
 */

import { supabase } from '@/lib/db/supabase'
import type {
  MaterialRequest,
  LaborRequest,
  MaterialDbResult,
  LaborDbResult,
  ProcessEstimateBlock,
  FinalEstimate,
  ProcessMode,
  ProcessId,
  SelectedSpace,
  EstimateGenerationOptions,
  QuantityBasis,
} from '@/lib/types/헌법_견적_타입'

// ============================================================
// 1. 공정 카테고리 → 공정 ID 매핑
// ============================================================

/**
 * 공정 카테고리 → 공정 ID 매핑 (헌법 4)
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
  'options': 'storage', // 가구/필름 등
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
    'room4': 'room',
    'room5': 'room',
    'entrance': 'entrance',
    'balcony': 'balcony',
    'dressRoom': 'storage',
  }
  return mapping[spaceId] || 'living'
}

// ============================================================
// 2. MaterialRequest 생성 (헌법 5)
// ============================================================

/**
 * processSelections에서 MaterialRequest 생성 (헌법 5-1)
 */
export function createMaterialRequests(
  processSelections: Record<string, Record<string, string | string[] | null>>,
  pyeong: number,
  mode: ProcessMode
): MaterialRequest[] {
  const requests: MaterialRequest[] = []

  // FULL 모드: 전체 공정 프리셋 사용
  if (mode === 'FULL') {
    // TODO: 전체 공정 프리셋 정의 필요
    // 지금은 processSelections가 있으면 그것 사용
  }

  // processSelections 순회 (헌법 4)
  Object.entries(processSelections).forEach(([spaceId, selections]) => {
    if (!selections) return

    const space = convertSpaceIdToSelectedSpace(spaceId)

    Object.entries(selections).forEach(([category, value]) => {
      // null 또는 'none'이면 제외 (헌법 4)
      if (value === null || value === 'none') return

      const processId = CATEGORY_TO_PROCESS_ID[category]
      if (!processId) return

      // 카테고리별 MaterialRequest 생성
      const request = createMaterialRequestForCategory(
        processId,
        space,
        category,
        value,
        pyeong
      )

      if (request) {
        requests.push(request)
      }
    })
  })

  return requests
}

/**
 * 카테고리별 MaterialRequest 생성
 */
function createMaterialRequestForCategory(
  processId: ProcessId,
  space: SelectedSpace,
  category: string,
  value: string | string[],
  pyeong: number
): MaterialRequest | null {
  // 카테고리별 자재 정보 매핑
  const categoryMapping: Record<string, {
    category1: string
    category2: string
    category3?: string
    spec: string
    quantity: (pyeong: number) => { value: number; unit: string; basis: string }
  }> = {
    'wall_finish': {
      category1: '벽면',
      category2: '도배',
      category3: '벽지',
      spec: '롤',
      quantity: (py) => ({
        value: py * 3.3 * 2.5, // 평수 * 3.3 * 벽면 계수
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
      quantity: (py) => ({
        value: 1,
        unit: 'SET',
        basis: '주방 1세트'
      })
    },
    'bathroom_core': {
      category1: '욕실',
      category2: '욕실세트',
      spec: 'SET',
      quantity: (py) => ({
        value: 1,
        unit: 'SET',
        basis: '욕실 1세트'
      })
    },
    'door_finish': {
      category1: '도어',
      category2: '방문',
      spec: 'EA',
      quantity: (py) => ({
        value: Math.ceil(py / 10), // 10평당 1개 문 추정
        unit: 'EA',
        basis: `평수 ${py}평 기준 문 개수`
      })
    },
    'window_finish': {
      category1: '창호',
      category2: '이중창',
      spec: 'EA',
      quantity: (py) => ({
        value: Math.ceil(py / 8), // 8평당 1개 창호 추정
        unit: 'EA',
        basis: `평수 ${py}평 기준 창호 개수`
      })
    },
    'electric_lighting': {
      category1: '조명',
      category2: '다운라이트',
      spec: 'EA',
      quantity: (py) => ({
        value: Math.ceil(py * 0.5), // 평당 0.5개 조명
        unit: 'EA',
        basis: `평수 ${py}평 기준 조명 개수`
      })
    },
    'kitchen_countertop': {
      category1: '주방',
      category2: '상판',
      category3: '쿼츠',
      spec: 'm',
      quantity: (py) => ({
        value: 2.5, // 기본 2.5m 상판
        unit: 'm',
        basis: '기본 주방 상판 길이'
      })
    },
    'entrance_core': {
      category1: '현관',
      category2: '신발장',
      spec: 'SET',
      quantity: (py) => ({
        value: 1,
        unit: 'SET',
        basis: '현관 1세트'
      })
    },
    'balcony_core': {
      category1: '발코니',
      category2: '타일',
      spec: '㎡',
      quantity: (py) => ({
        value: Math.min(py * 0.15, 10), // 평수의 15%, 최대 10㎡
        unit: '㎡',
        basis: `평수 ${py}평 기준 발코니 면적`
      })
    },
    'options': {
      category1: '옵션',
      category2: '기타',
      spec: 'EA',
      quantity: (py) => ({
        value: 1,
        unit: 'EA',
        basis: '옵션 항목'
      })
    },
  }

  const mapping = categoryMapping[category]
  if (!mapping) return null

  const quantity = mapping.quantity(pyeong)

  return {
    processId,
    space,
    category: {
      category1: mapping.category1,
      category2: mapping.category2,
      category3: mapping.category3,
    },
    spec: mapping.spec,
    brandCondition: {
      isArgenStandard: true, // 헌법 3-2: 아르젠 기준
    },
    quantity,
  }
}

// ============================================================
// 3. LaborRequest 생성 (헌법 6)
// ============================================================

/**
 * processSelections에서 LaborRequest 생성 (헌법 6-1)
 */
export function createLaborRequests(
  processSelections: Record<string, Record<string, string | string[] | null>>,
  pyeong: number,
  mode: ProcessMode
): LaborRequest[] {
  const requests: LaborRequest[] = []

  // processSelections 순회
  Object.entries(processSelections).forEach(([spaceId, selections]) => {
    if (!selections) return

    const space = convertSpaceIdToSelectedSpace(spaceId)

    Object.entries(selections).forEach(([category, value]) => {
      if (value === null || value === 'none') return

      const processId = CATEGORY_TO_PROCESS_ID[category]
      if (!processId) return

      // 공정별 LaborRequest 생성
      const request = createLaborRequestForProcess(
        processId,
        space,
        category,
        value,
        pyeong
      )

      if (request) {
        requests.push(request)
      }
    })
  })

  return requests
}

/**
 * 공정별 LaborRequest 생성
 */
function createLaborRequestForProcess(
  processId: ProcessId,
  space: SelectedSpace,
  category: string,
  value: string | string[],
  pyeong: number
): LaborRequest | null {
  // 공정별 노무 정보 매핑 (기본값, 실제는 DB에서 가져옴)
  const processMapping: Record<ProcessId, {
    unit: 'm2' | 'EA' | 'SET' | 'day' | 'team'
    totalQuantity: (pyeong: number) => number
    dailyOutput: number
    crewSize: number
  }> = {
    'finish': {
      unit: 'm2',
      totalQuantity: (py) => py * 3.3,
      dailyOutput: 40, // 1일 작업량 (㎡)
      crewSize: 2,
    },
    'kitchen': {
      unit: 'SET',
      totalQuantity: () => 1,
      dailyOutput: 0.5, // 1일 작업량 (SET)
      crewSize: 2,
    },
    'bathroom': {
      unit: 'SET',
      totalQuantity: () => 1,
      dailyOutput: 0.7, // 1일 작업량 (SET)
      crewSize: 2,
    },
    'demolition': {
      unit: 'm2',
      totalQuantity: (py) => py * 3.3,
      dailyOutput: 25, // 1일 작업량 (㎡)
      crewSize: 3,
    },
    'electric': {
      unit: 'EA',
      totalQuantity: () => 10, // 기본 조명 개수
      dailyOutput: 15, // 1일 작업량 (EA)
      crewSize: 1,
    },
    'door': {
      unit: 'EA',
      totalQuantity: () => 3, // 기본 문 개수
      dailyOutput: 2, // 1일 작업량 (EA)
      crewSize: 2,
    },
    'window': {
      unit: 'EA',
      totalQuantity: () => 5, // 기본 창호 개수
      dailyOutput: 3, // 1일 작업량 (EA)
      crewSize: 2,
    },
    'storage': {
      unit: 'EA',
      totalQuantity: () => 1,
      dailyOutput: 1, // 1일 작업량 (EA)
      crewSize: 2,
    },
    'waterproof': {
      unit: 'm2',
      totalQuantity: (py) => Math.min(py * 0.3, 15), // 욕실/베란다 면적 추정
      dailyOutput: 10, // 1일 작업량 (㎡)
      crewSize: 1,
    },
    'plumbing': {
      unit: 'SET',
      totalQuantity: () => 1, // 설비 1세트
      dailyOutput: 0.5, // 1일 작업량 (SET)
      crewSize: 2,
    },
    'waste': {
      unit: 'day',
      totalQuantity: (py) => Math.ceil(py / 20), // 20평당 1일 폐기물 처리
      dailyOutput: 1, // 1일 작업량 (day)
      crewSize: 2,
    },
  }

  const mapping = processMapping[processId]
  if (!mapping) return null

  const totalQuantity = mapping.totalQuantity(pyeong)

  return {
    processId,
    unit: mapping.unit,
    totalQuantity,
    dailyOutput: mapping.dailyOutput,
    crewSize: mapping.crewSize,
    difficultyFactor: 1.0, // 기본값, DB에서 가져올 예정
  }
}

// ============================================================
// 4. 자재 DB 조회 (헌법 5-3)
// ============================================================

/**
 * 자재 DB 조회 (헌법 5-3)
 */
export async function queryMaterialFromDB(
  request: MaterialRequest
): Promise<MaterialDbResult> {
  try {
    let query = supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .eq('category_1', request.category.category1)
      .eq('category_2', request.category.category2)

    if (request.category.category3) {
      query = query.eq('category_3', request.category.category3)
    }

    // 헌법 3-2: 아르젠 기준 (brand_argen 사용)
    // is_argen_standard = true 조건 사용
    query = query.eq('is_argen_standard', true)

    // 규격 조건 (옵션)
    if (request.spec) {
      query = query.ilike('spec', `%${request.spec}%`)
    }

    // 우선순위 정렬
    query = query.order('argen_priority', { ascending: true, nullsFirst: false })
    query = query.limit(1)

    const { data, error } = await query.maybeSingle()

    if (error) {
      return {
        status: 'ERROR',
        message: `자재 DB 조회 오류: ${error.message}`,
      }
    }

    if (!data) {
      return {
        status: 'NOT_FOUND',
        message: `조건에 맞는 자재를 찾을 수 없습니다: ${request.category.category1}/${request.category.category2}`,
        allowFallback: false, // 헌법 8: fallback 금지
      }
    }

    return {
      status: 'SUCCESS',
      data: {
        materialId: data.material_id || data.id,
        materialCode: data.material_code,
        brandName: data.brand_argen || data.brand_name, // 헌법 3-2: brand_argen 우선
        productName: data.product_name,
        spec: data.spec || request.spec,
        category1: data.category_1,
        category2: data.category_2,
        category3: data.category_3,
        unit: data.unit || request.quantity.unit,
        price: data.price || data.price_argen || 0, // TODO: 가격 컬럼 확인 필요
        isArgenStandard: data.is_argen_standard || false,
        argenPriority: data.argen_priority,
      },
    }
  } catch (error) {
    return {
      status: 'ERROR',
      message: `자재 DB 조회 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }
}

// ============================================================
// 5. 노무비 DB 조회 (헌법 6-1, 6-2)
// ============================================================

/**
 * 노무비 DB 조회 (헌법 6-1, 6-2)
 * 
 * 실제 DB 컬럼명에 맞게 수정:
 * - labor_productivity: phase_id (process_id 대신)
 * - labor_costs: phase_id, daily_rate (rate_per_person_day 대신)
 * - labor_difficulty_rules: category_1, upgrade_condition, difficulty_multiplier
 */
export async function queryLaborFromDB(
  request: LaborRequest
): Promise<LaborDbResult> {
  try {
    // labor_productivity 테이블에서 노무 정보 조회
    // 실제 컬럼명: phase_id
    const { data: productivityData, error: productivityError } = await supabase
      .from('labor_productivity')
      .select('*')
      .eq('phase_id', request.processId)  // 실제 컬럼명: phase_id
      .eq('is_active', true)
      .maybeSingle()

    if (productivityError) {
      return {
        status: 'ERROR',
        message: `노무 생산성 DB 조회 오류: ${productivityError.message}`,
      }
    }

    if (!productivityData) {
      return {
        status: 'NOT_FOUND',
        message: `노무 생산성 데이터를 찾을 수 없습니다: ${request.processId}`,
      }
    }

    // labor_costs 테이블에서 단가 조회
    // 실제 컬럼명: phase_id, is_current
    const { data: costData, error: costError } = await supabase
      .from('labor_costs')
      .select('*')
      .eq('phase_id', request.processId)  // 실제 컬럼명: phase_id
      .eq('is_current', true)  // 실제 컬럼명: is_current
      .maybeSingle()

    if (costError) {
      return {
        status: 'ERROR',
        message: `노무 단가 DB 조회 오류: ${costError.message}`,
      }
    }

    if (!costData) {
      return {
        status: 'NOT_FOUND',
        message: `노무 단가 데이터를 찾을 수 없습니다: ${request.processId}`,
      }
    }

    // labor_difficulty_rules 테이블에서 난이도 계수 조회 (옵션)
    let difficultyFactor = request.difficultyFactor || 1.0
    let difficultyBasis: string | undefined

    if (request.difficultyBasis) {
      // 실제 컬럼명: category_1, upgrade_condition
      const { data: difficultyData } = await supabase
        .from('labor_difficulty_rules')
        .select('*')
        .eq('category_1', request.processId)  // 실제 컬럼명: category_1
        .eq('upgrade_condition', request.difficultyBasis)  // 실제 컬럼명: upgrade_condition
        .eq('is_active', true)
        .maybeSingle()

      if (difficultyData) {
        // 실제 컬럼명: difficulty_multiplier
        difficultyFactor = difficultyData.difficulty_multiplier || difficultyFactor
        difficultyBasis = difficultyData.upgrade_condition
      }
    }

    return {
      status: 'SUCCESS',
      data: {
        laborId: productivityData.id || costData.id,
        processId: request.processId,
        unit: productivityData.labor_unit || request.unit,
        dailyOutput: productivityData.daily_output || request.dailyOutput,
        crewSize: productivityData.crew_size || request.crewSize,
        // 실제 컬럼명: daily_rate
        ratePerPersonDay: costData.daily_rate || 0,
        difficultyFactor,
        difficultyBasis,
        outputFactorByDifficulty: productivityData.base_difficulty || request.outputFactorByDifficulty,
      },
    }
  } catch (error) {
    return {
      status: 'ERROR',
      message: `노무비 DB 조회 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }
}

// ============================================================
// 6. 노무비 계산 (헌법 6-3)
// ============================================================

/**
 * 노무비 계산 (헌법 6-3 공식)
 * 
 * 노무비 = (total_quantity ÷ daily_output) × crew_size × daily_rate × base_difficulty × difficulty_multiplier들의 곱
 */
export function calculateLaborCost(
  request: LaborRequest,
  laborData: NonNullable<LaborDbResult['data']>
): number {
  // 헌법 6-3 공식 적용
  const workDays = Math.ceil(request.totalQuantity / laborData.dailyOutput)
  const totalLaborCost = workDays * laborData.crewSize * laborData.ratePerPersonDay * laborData.difficultyFactor

  return Math.round(totalLaborCost)
}

// ============================================================
// 7. 최종 견적 계산 (헌법 9, 10, 11)
// ============================================================

/**
 * 최종 견적 계산 (헌법 9, 10, 11)
 */
export async function calculateFinalEstimate(
  options: EstimateGenerationOptions
): Promise<FinalEstimate> {
  const { pyeong, mode, spaces, processSelections } = options

  // 1. MaterialRequest 생성
  const materialRequests = createMaterialRequests(processSelections, pyeong, mode)

  // 2. LaborRequest 생성
  const laborRequests = createLaborRequests(processSelections, pyeong, mode)

  // 3. DB 조회 및 계산
  const processBlocks: ProcessEstimateBlock[] = []
  const failures: { failedProcesses: ProcessId[]; reasons: string[] } = {
    failedProcesses: [],
    reasons: [],
  }

  // 공정별로 그룹화
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

  // 공정별 계산
  for (const [processId, group] of processGroups.entries()) {
    try {
      // 자재 조회
      const materialResults = await Promise.all(
        group.materialRequests.map(req => queryMaterialFromDB(req))
      )

      // 노무 조회
      const laborResults = await Promise.all(
        group.laborRequests.map(req => queryLaborFromDB(req))
      )

      // Fail-Fast 체크 (헌법 1-3)
      const hasMaterialError = materialResults.some(r => r.status === 'ERROR' || r.status === 'NOT_FOUND')
      const hasLaborError = laborResults.some(r => r.status === 'ERROR' || r.status === 'NOT_FOUND')

      if (hasMaterialError || hasLaborError) {
        failures.failedProcesses.push(processId)
        failures.reasons.push(
          `공정 ${processId}: 자재 또는 노무 데이터 부족`
        )
        continue
      }

      // 공정별 블록 생성
      const block = createProcessBlock(
        processId,
        group.materialRequests,
        materialResults,
        group.laborRequests,
        laborResults
      )

      processBlocks.push(block)
    } catch (error) {
      failures.failedProcesses.push(processId)
      failures.reasons.push(
        `공정 ${processId}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      )
    }
  }

  // 4. 최종 견적 생성
  const estimate: FinalEstimate = {
    version: {
      versionNumber: 1,
      isUpgrade: false,
      createdAt: new Date().toISOString(),
    },
    standard: 'ARGEN',
    input: {
      pyeong,
      mode,
      spaces,
      processes: Array.from(processGroups.keys()),
    },
    processBlocks,
    summary: calculateSummary(processBlocks, pyeong),
    ...(failures.failedProcesses.length > 0 && {
      failures: {
        ...failures,
        requiresConfirmation: true,
      },
    }),
  }

  return estimate
}

/**
 * 공정별 블록 생성
 */
function createProcessBlock(
  processId: ProcessId,
  materialRequests: MaterialRequest[],
  materialResults: MaterialDbResult[],
  laborRequests: LaborRequest[],
  laborResults: LaborDbResult[]
): ProcessEstimateBlock {
  // 자재 정보 수집
  const materials = materialRequests.map((req, idx) => {
    const result = materialResults[idx]
    if (result.status !== 'SUCCESS' || !result.data) {
      throw new Error(`자재 데이터 없음: ${req.category.category1}/${req.category.category2}`)
    }

    const totalPrice = result.data.price * req.quantity.value

    return {
      brandName: result.data.brandName,
      productName: result.data.productName,
      spec: result.data.spec,
      category: req.category,
      quantity: req.quantity.value,
      unit: req.quantity.unit,
      unitPrice: result.data.price,
      totalPrice,
      dbSource: {
        table: 'materials',
        key: result.data.materialId || 'unknown',
      },
    }
  })

  // 노무 정보 수집
  const laborRequestsWithData = laborRequests.map((req, idx) => {
    const result = laborResults[idx]
    if (result.status !== 'SUCCESS' || !result.data) {
      throw new Error(`노무 데이터 없음: ${req.processId}`)
    }
    return { request: req, data: result.data }
  })

  // 노무비 계산
  const laborTotal = laborRequestsWithData.reduce((sum, { request, data }) => {
    const workDays = Math.ceil(request.totalQuantity / data.dailyOutput)
    const cost = workDays * data.crewSize * data.ratePerPersonDay * data.difficultyFactor
    return sum + Math.round(cost)
  }, 0)

  // 첫 번째 노무 정보 사용 (대표값)
  const firstLabor = laborRequestsWithData[0]
  const workDays = Math.ceil(firstLabor.request.totalQuantity / firstLabor.data.dailyOutput)

  const materialTotal = materials.reduce((sum, m) => sum + m.totalPrice, 0)

  // 수량 산정 기준 생성 (공정 수량 산정 레이어)
  const totalQuantity = materialRequests.reduce((sum, r) => sum + r.quantity.value, 0)
  const quantityBasis: QuantityBasis = {
    type: 'AREA', // 기본값: 면적 기반
    value: totalQuantity,
    reason: `공간 면적 기준 수량 산정 (${totalQuantity}㎡)`,
  }
  
  return {
    processName: getProcessName(processId),
    processId,
    processType: '선택' as const,  // 기본값: 선택 (TODO: 실제 로직으로 판단)
    quantityBasis, // 공정 수량 산정 레이어 (필수)
    spaces: Array.from(new Set(materialRequests.map(r => r.space))),
    materials,
    labor: {
      unit: firstLabor.data.unit,
      dailyOutput: firstLabor.data.dailyOutput,
      crewSize: firstLabor.data.crewSize,
      workDays,
      ratePerPersonDay: firstLabor.data.ratePerPersonDay,
      difficultyFactor: firstLabor.data.difficultyFactor,
      calculationBasis: `작업량 ${firstLabor.request.totalQuantity}${firstLabor.data.unit} ÷ 1일 작업량 ${firstLabor.data.dailyOutput}${firstLabor.data.unit} = ${workDays}일 × ${firstLabor.data.crewSize}인 × ${firstLabor.data.ratePerPersonDay.toLocaleString()}원 × 난이도 ${firstLabor.data.difficultyFactor}`,
      totalLaborCost: laborTotal,
      dbSource: {
        table: 'labor_costs',
        key: firstLabor.data.laborId || 'unknown',
      },
    },
    inclusions: [],
    exclusions: [],
    assumptions: [],
    options: [],  // 옵션 목록 (TODO: 실제 옵션 로직 구현)
    materialTotal,
    laborTotal,
    processTotal: materialTotal + laborTotal,
  }
}

/**
 * 공정명 가져오기
 */
function getProcessName(processId: ProcessId): string {
  const names: Record<ProcessId, string> = {
    'demolition': '철거',
    'finish': '마감',
    'electric': '조명·전기',
    'kitchen': '주방',
    'bathroom': '욕실',
    'door': '문',
    'window': '창호',
    'storage': '수납',
    'waterproof': '방수',
    'plumbing': '설비',
    'waste': '폐기물',
  }
  return names[processId] || processId
}

/**
 * 요약 계산
 */
function calculateSummary(blocks: ProcessEstimateBlock[], pyeong: number) {
  const totalMaterial = blocks.reduce((sum, b) => sum + b.materialTotal, 0)
  const totalLabor = blocks.reduce((sum, b) => sum + b.laborTotal, 0)
  const totalDirect = totalMaterial + totalLabor

  // 간접비 계산 (헌법 11-2)
  const industrialAccident = Math.round(totalLabor * 0.0307) // 산재보험 3.07%
  const employment = Math.round(totalLabor * 0.015) // 고용보험 1.5%
  const overhead = Math.round(totalDirect * 0.03) // 일반관리비 3%
  const profit = Math.round(totalDirect * 0.05) // 이윤 5%

  const indirectTotal = industrialAccident + employment + overhead + profit
  const totalBeforeVAT = totalDirect + indirectTotal
  const vat = Math.round(totalBeforeVAT * 0.1) // 부가세 10%
  const totalWithVAT = totalBeforeVAT + vat
  const costPerPyeong = Math.round(totalBeforeVAT / pyeong)

  return {
    processList: blocks.map(b => b.processName),
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
  }
}








