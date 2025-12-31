/**
 * V4 CostCalculator - 비용 계산기
 * 
 * 헌법 v1.1 서비스를 활용한 비용 계산
 */

import { getMaterialPriceStrict } from '@/lib/services/material-service-strict'
import { getLaborRateStrict } from '@/lib/services/labor-service-strict'
import type {
  ProcessBlockV4,
  EstimateSummaryV4,
  MaterialItemV4,
  LaborItemV4,
} from '../../types'
import type { SpaceInfoV4, GradeV4 } from '../../types'
import type {
  MaterialRequest,
  LaborRequest,
  ProcessId,
  SelectedSpace,
} from '@/lib/types/헌법_견적_타입'
import { V4_TO_V3_GRADE } from '../../converters/grade-mapper'
import { validateProcessBlock } from './ValidationGuard'
import { logger } from '../../utils/logger'

/**
 * 공정 ID → 공간 매핑 (V4 공정 ID → 헌법 ProcessId)
 */
const V4_PROCESS_TO_HEONGBEOP: Record<string, ProcessId> = {
  kitchen_core: 'kitchen',
  bathroom_waterproof: 'bathroom',
  storage_system: 'storage',
  soundproof: 'finish',
  lighting: 'electric',
  flooring: 'finish',
  wallpaper: 'finish',
  window: 'window',
  door: 'door',
  demolition: 'demolition',
}

/**
 * 공정 ID → 공간 매핑 (기본값)
 */
const V4_PROCESS_TO_SPACE: Record<string, SelectedSpace> = {
  kitchen_core: 'kitchen',
  bathroom_waterproof: 'bathroom',
  storage_system: 'storage',
  soundproof: 'living',
  lighting: 'living',
  flooring: 'living',
  wallpaper: 'living',
  window: 'living',
  door: 'living',
  demolition: 'living',
}

/**
 * 공정별 자재 카테고리 매핑
 */
const PROCESS_MATERIAL_MAP: Record<string, {
  category1: string
  category2: string
  category3?: string
  spec: string
  quantity: (pyeong: number) => { value: number; unit: string; basis: string }
}> = {
  kitchen_core: {
    category1: '주방',
    category2: '시스템주방',
    spec: 'SET',
    quantity: () => ({
      value: 1,
      unit: 'SET',
      basis: '주방 1세트',
    }),
  },
  bathroom_waterproof: {
    category1: '욕실',
    category2: '욕실세트',
    spec: 'SET',
    quantity: () => ({
      value: 1,
      unit: 'SET',
      basis: '욕실 1세트',
    }),
  },
  storage_system: {
    category1: '가구',
    category2: '붙박이장',
    spec: 'EA',
    quantity: () => ({
      value: 1,
      unit: 'EA',
      basis: '붙박이장 1개',
    }),
  },
  lighting: {
    category1: '조명',
    category2: '다운라이트',
    spec: 'EA',
    quantity: (py) => ({
      value: Math.ceil(py * 0.5),
      unit: 'EA',
      basis: `평수 ${py}평 기준 조명 개수`,
    }),
  },
  flooring: {
    category1: '바닥',
    category2: '마루',
    spec: '㎡',
    quantity: (py) => ({
      value: py * 3.3,
      unit: '㎡',
      basis: `평수 ${py}평 기준 바닥 면적`,
    }),
  },
  wallpaper: {
    category1: '도배',
    category2: '벽체',
    spec: '롤',
    quantity: (py) => ({
      value: py * 3.3 * 2.5,
      unit: '㎡',
      basis: `평수 ${py}평 기준 벽면 면적`,
    }),
  },
  window: {
    category1: '창호',
    category2: '이중창',
    spec: 'EA',
    quantity: (py) => ({
      value: Math.ceil(py / 8),
      unit: 'EA',
      basis: `평수 ${py}평 기준 창호 개수`,
    }),
  },
  door: {
    category1: '도어',
    category2: '방문',
    spec: 'EA',
    quantity: (py) => ({
      value: Math.ceil(py / 10),
      unit: 'EA',
      basis: `평수 ${py}평 기준 문 개수`,
    }),
  },
}

/**
 * 공정별 노무 정보 매핑
 * 
 * ⚠️ 'SYSTEM'은 실제 공정이 아니므로 제외
 */
const PROCESS_LABOR_MAP: Record<Exclude<ProcessId, 'SYSTEM'>, {
  unit: 'm2' | 'EA' | 'SET' | 'day' | 'team'
  totalQuantity: (pyeong: number) => number
  dailyOutput: number
  crewSize: number
}> = {
  finish: {
    unit: 'm2',
    totalQuantity: (py) => py * 3.3,
    dailyOutput: 40,
    crewSize: 2,
  },
  kitchen: {
    unit: 'SET',
    totalQuantity: () => 1,
    dailyOutput: 0.5,
    crewSize: 2,
  },
  bathroom: {
    unit: 'SET',
    totalQuantity: () => 1,
    dailyOutput: 0.7,
    crewSize: 2,
  },
  demolition: {
    unit: 'm2',
    totalQuantity: (py) => py * 3.3,
    dailyOutput: 25,
    crewSize: 3,
  },
  electric: {
    unit: 'EA',
    totalQuantity: () => 10,
    dailyOutput: 15,
    crewSize: 1,
  },
  door: {
    unit: 'EA',
    totalQuantity: () => 3,
    dailyOutput: 2,
    crewSize: 2,
  },
  window: {
    unit: 'EA',
    totalQuantity: () => 5,
    dailyOutput: 3,
    crewSize: 2,
  },
  storage: {
    unit: 'EA',
    totalQuantity: () => 1,
    dailyOutput: 1,
    crewSize: 2,
  },
  waterproof: {
    unit: 'm2',
    totalQuantity: (py) => Math.min(py * 0.3, 15),
    dailyOutput: 10,
    crewSize: 1,
  },
  plumbing: {
    unit: 'SET',
    totalQuantity: () => 1,
    dailyOutput: 0.5,
    crewSize: 2,
  },
  waste: {
    unit: 'day',
    totalQuantity: (py) => Math.ceil(py / 20),
    dailyOutput: 1,
    crewSize: 2,
  },
}

/**
 * 공정별 비용 계산
 */
export async function calculateProcessCosts(
  processId: string,
  spaceInfo: SpaceInfoV4,
  grade: GradeV4,
  selectedSpaces: string[] = []  // 버그 1 방지: 공간 필터링용
): Promise<ProcessBlockV4> {
  logger.debug('CostCalculator', '공정 비용 계산 시작', { processId, grade })

  // 1. 헌법 ProcessId로 변환
  const heongbeopProcessId = V4_PROCESS_TO_HEONGBEOP[processId] || 'finish'
  const space = V4_PROCESS_TO_SPACE[processId] || 'living'
  
  // 공간 목록 결정 (버그 1 방지)
  const spaces: string[] = []
  
  // common 공정은 항상 포함 (철거, 보양 등)
  if (processId === 'demolition' || processId.includes('common') || processId.includes('protection')) {
    spaces.push('common')
  }
  
  // 공정이 적용되는 공간 추가
  // V4_PROCESS_TO_SPACE에서 매핑된 공간이 선택된 공간에 포함되면 추가
  const mappedSpace = V4_PROCESS_TO_SPACE[processId]
  if (mappedSpace) {
    // 공간 선택이 없으면 모두 표시, 있으면 선택된 공간만
    if (selectedSpaces.length === 0 || selectedSpaces.includes(mappedSpace)) {
      spaces.push(mappedSpace)
    }
  } else {
    // 매핑이 없으면 기본값으로 space 사용
    if (selectedSpaces.length === 0 || selectedSpaces.includes(space)) {
      spaces.push(space)
    }
  }
  
  // 공간이 없으면 기본값으로 space 사용 (fallback)
  if (spaces.length === 0) {
    spaces.push(space)
  }

  // 2. MaterialRequest 생성
  const materialMapping = PROCESS_MATERIAL_MAP[processId]
  const materials: MaterialItemV4[] = []

  if (!materialMapping) {
    logger.warn('CostCalculator', '자재 매핑 없음', { processId })
  }

  if (materialMapping) {
    try {
      const quantity = materialMapping.quantity(spaceInfo.pyeong)

      // 등급별 브랜드 컬럼 결정
      const brandColumn = 
        grade === 'ARGEN_E' ? 'brand_basic' :
        grade === 'ARGEN_S' ? 'brand_argen' :
        grade === 'ARGEN_O' ? 'brand_premium' :
        'brand_argen' // 기본값

      // ✅ 디버깅 로그 추가
      console.log('🔍 [V4] 등급별 브랜드 선택:', {
        grade,
        brandColumn,
        processId: heongbeopProcessId,
        category: {
          category1: materialMapping.category1,
          category2: materialMapping.category2,
        },
      })

      const materialRequest: MaterialRequest = {
        processId: heongbeopProcessId,
        space,
        category: {
          category1: materialMapping.category1,
          category2: materialMapping.category2,
          category3: materialMapping.category3,
        },
        spec: materialMapping.spec,
        brandCondition: {
          isArgenStandard: true,
          brandColumn,
        },
        quantity,
      }

      // 헌법 v1.1 서비스 호출
      const materialData = await getMaterialPriceStrict(materialRequest)

      materials.push({
        materialId: materialData.materialId || materialData.materialCode || 'unknown',
        name: materialData.productName,
        unit: materialData.unit,
        quantity: quantity.value,
        unitPrice: materialData.price,
        totalPrice: quantity.value * materialData.price,
        dataSource: 'DB',
      })
    } catch (error) {
      logger.warn('CostCalculator', '자재 조회 실패', { processId, error })
      // 자재 조회 실패 시 빈 배열 (노무비만 계산)
    }
  }

  // 3. LaborRequest 생성 및 조회
  // ⚠️ 'SYSTEM'은 호출부에서 차단되므로 여기서는 체크 불필요
  // ⚠️ 타입 안정성: PROCESS_LABOR_MAP은 Exclude<ProcessId, 'SYSTEM'>이므로 타입 단언 사용
  const laborMapping = PROCESS_LABOR_MAP[heongbeopProcessId as Exclude<ProcessId, 'SYSTEM'>]
  if (!laborMapping) {
    throw new Error(`노무 정보 없음: ${heongbeopProcessId}`)
  }

  const totalQuantity = laborMapping.totalQuantity(spaceInfo.pyeong)

  const laborRequest: LaborRequest = {
    processId: heongbeopProcessId,
    unit: laborMapping.unit,
    totalQuantity,
    dailyOutput: laborMapping.dailyOutput,
    crewSize: laborMapping.crewSize,
    difficultyFactor: 1.0,
  }

  // 헌법 v1.1 서비스 호출
  const laborData = await getLaborRateStrict(laborRequest)

  // 작업 일수 계산
  const workDays = Math.ceil(totalQuantity / laborData.dailyOutput)

  // 총 노무비 계산
  const totalLaborCost =
    workDays * laborData.crewSize * laborData.ratePerPersonDay * laborData.difficultyFactor

  const labor: LaborItemV4 = {
    laborType: heongbeopProcessId,
    dailyOutput: laborData.dailyOutput,
    crewSize: laborData.crewSize,
    ratePerPersonDay: laborData.ratePerPersonDay,
    totalDays: workDays,
    totalCost: totalLaborCost,
    dataSource: 'DB',
  }

  // 4. 검증 (자재가 있을 때만)
  // ⚠️ 타입 안정성: validateProcessBlock은 ProcessId 타입을 요구하므로 heongbeopProcessId 사용
  if (materials.length > 0) {
    validateProcessBlock(heongbeopProcessId, materials, labor)
  }

  // 5. 합계 계산
  const materialSubtotal = materials.reduce((sum, m) => sum + m.totalPrice, 0)
  const laborSubtotal = labor.totalCost
  const processTotal = materialSubtotal + laborSubtotal

  logger.debug('CostCalculator', '공정 비용 계산 완료', {
    processId,
    materialSubtotal,
    laborSubtotal,
    processTotal,
  })

  return {
    processId,
    processName: getProcessName(heongbeopProcessId),
    spaces: spaces.length > 0 ? spaces : [space],  // 버그 1 방지: 공간 정보 포함
    materials,
    labor,
    materialSubtotal,
    laborSubtotal,
    processTotal,
  }
}

/**
 * 공정명 가져오기
 */
function getProcessName(processId: ProcessId): string {
  // ⚠️ 헌법 ProcessId 타입에 맞는 공정명 매핑
  // ⚠️ 'SYSTEM'은 실제 공정이 아니므로 제외
  const names: Record<Exclude<ProcessId, 'SYSTEM'>, string> = {
    demolition: '철거',
    finish: '마감',
    electric: '조명/전기',
    kitchen: '주방',
    bathroom: '욕실',
    door: '문',
    window: '창호',
    storage: '수납',
    waterproof: '방수',
    plumbing: '설비',
    waste: '폐기물',
  }
  // 'SYSTEM'은 특수 값이므로 별도 처리
  if (processId === 'SYSTEM') {
    return '시스템'
  }
  return names[processId] || processId
}

/**
 * 견적 요약 계산
 */
export function calculateSummary(
  blocks: ProcessBlockV4[],
  bufferPercentage: number,
  pyeong: number
): EstimateSummaryV4 {
  const materialTotal = blocks.reduce((sum, b) => sum + b.materialSubtotal, 0)
  const laborTotal = blocks.reduce((sum, b) => sum + b.laborSubtotal, 0)
  const grandTotal = materialTotal + laborTotal
  const vatAmount = Math.round(grandTotal * 0.1)
  const bufferAmount = Math.round((grandTotal * bufferPercentage) / 100)

  return {
    grandTotal,
    materialTotal,
    laborTotal,
    vatAmount,
    bufferAmount,
    totalWithBuffer: grandTotal + vatAmount + bufferAmount,
    costPerPyeong: Math.round((grandTotal + vatAmount + bufferAmount) / pyeong),
  }
}








