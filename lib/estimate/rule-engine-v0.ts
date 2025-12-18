/**
 * 규칙 엔진 v0 - 견적 숫자만 생성하는 규칙 기반 엔진
 * 
 * 핵심 원칙:
 * - AI는 어떤 경우에도 숫자 생성/계산/보정/추정을 하지 않는다
 * - 규칙 엔진은 "견적 숫자(총액/공정별/옵션 증감/범위)"만 만든다
 * - 4등급 체계 비활성화, 단일 추천안만 산출
 */

import { getSizeRange, type SizeRange } from '@/lib/data/pricing-v3/types'

// ============================================================
// 1. 타입 정의
// ============================================================

/** 주거 유형 */
export type HousingType = '아파트' | '빌라' | '오피스텔' | '단독주택' | '기타'

/** 공사 범위 */
export type ConstructionScope = '전체' | '부분'

/** 공정 ID */
export type ProcessId = 
  | 'demolition'   // 철거
  | 'wallpaper'    // 도배
  | 'flooring'     // 바닥
  | 'kitchen'      // 주방
  | 'bathroom'     // 욕실
  | 'tile'         // 타일
  | 'door'         // 문
  | 'window'       // 창호
  | 'lighting'     // 조명
  | 'storage'      // 수납
  | 'molding'      // 몰딩
  | 'film'         // 필름

/** 현장 변수 */
export interface SiteVariables {
  /** 엘리베이터 유무/사용 가능 여부 */
  elevator?: '있음' | '없음' | '미확인'
  /** 주차/양중 조건 */
  parkingLifting?: '가능' | '불가능' | '미확인'
  /** 관리규정(작업 시간/소음 제한) */
  managementRules?: '제한없음' | '시간제한' | '소음제한' | '미확인'
  /** 폐기물 반출 동선 */
  wasteRemoval?: '1층' | '지하' | '거리' | '미확인'
  /** 보양 범위(공용부 포함 여부) */
  protectionScope?: '공용부포함' | '공용부제외' | '미확인'
}

/** 규칙 엔진 입력 */
export interface RuleEngineInput {
  // 하드 입력 (필수)
  pyeong: number
  housingType: HousingType
  roomCount: number
  bathroomCount: number
  constructionScope: ConstructionScope
  selectedProcesses: ProcessId[]
  removedProcesses: ProcessId[]
  selectedOptions: string[] // 옵션 ID 목록
  
  // 현장 변수 (필수, 최소 2개는 반드시 입력)
  siteVariables: SiteVariables
}

/** 제외 공정 정보 */
export interface RemovedProcess {
  id: string
  name: string
  min: number
  max: number
}

/** 집중 공정 정보 */
export interface FocusedProcess {
  id: string
  name: string
}

/** 공정 비용 */
export interface ProcessCost {
  id: string
  name: string
  min: number
  max: number
  type: 'selected' | 'removed'
}

/** 옵션 증감 */
export interface OptionDelta {
  id: string
  name: string
  min: number
  max: number
}

/** 리스크 정보 */
export interface RiskInfo {
  unknownCount: number
  multiplier: number
  notes: string[]
}

/** 규칙 엔진 출력 */
export interface RuleEngineOutput {
  summary: {
    removed: RemovedProcess[]
    focused: FocusedProcess[]
    saving: { min: number; max: number }
    total: { min: number; max: number }
  }
  processCosts: ProcessCost[]
  optionDeltas: OptionDelta[]
  risk: RiskInfo
}

/** 에러 출력 */
export interface RuleEngineError {
  error: {
    code: 'INSUFFICIENT_INPUT'
    missing: string[]
  }
}

// ============================================================
// 2. 공정 기본 가격표 (로컬 데이터)
// ============================================================

/** 공정별 기본 가격 (평형별 min/max) */
interface ProcessBasePrice {
  baseMin: number
  baseMax: number
  areaRule: (pyeong: number) => number // 평형 → 적용 면적 변환
}

/** 공정별 가격표 (평형 범위별) */
const PROCESS_PRICE_TABLE: Record<ProcessId, Partial<Record<SizeRange, ProcessBasePrice>>> = {
  demolition: {
    '20PY': { baseMin: 2000000, baseMax: 3000000, areaRule: (py) => py },
    '30PY': { baseMin: 3000000, baseMax: 4000000, areaRule: (py) => py },
    '40PY': { baseMin: 4000000, baseMax: 5000000, areaRule: (py) => py },
    '50PY': { baseMin: 5000000, baseMax: 6000000, areaRule: (py) => py },
  },
  wallpaper: {
    '20PY': { baseMin: 1500000, baseMax: 2500000, areaRule: (py) => py * 0.8 },
    '30PY': { baseMin: 2500000, baseMax: 3500000, areaRule: (py) => py * 0.8 },
    '40PY': { baseMin: 3500000, baseMax: 4500000, areaRule: (py) => py * 0.8 },
    '50PY': { baseMin: 4500000, baseMax: 5500000, areaRule: (py) => py * 0.8 },
  },
  flooring: {
    '20PY': { baseMin: 2000000, baseMax: 3000000, areaRule: (py) => py * 0.7 },
    '30PY': { baseMin: 3000000, baseMax: 4000000, areaRule: (py) => py * 0.7 },
    '40PY': { baseMin: 4000000, baseMax: 5000000, areaRule: (py) => py * 0.7 },
    '50PY': { baseMin: 5000000, baseMax: 6000000, areaRule: (py) => py * 0.7 },
  },
  kitchen: {
    '20PY': { baseMin: 3000000, baseMax: 5000000, areaRule: () => 1 },
    '30PY': { baseMin: 4000000, baseMax: 6000000, areaRule: () => 1 },
    '40PY': { baseMin: 5000000, baseMax: 7000000, areaRule: () => 1 },
    '50PY': { baseMin: 6000000, baseMax: 8000000, areaRule: () => 1 },
  },
  bathroom: {
    '20PY': { baseMin: 2000000, baseMax: 3500000, areaRule: () => 1 },
    '30PY': { baseMin: 3000000, baseMax: 4500000, areaRule: () => 1 },
    '40PY': { baseMin: 4000000, baseMax: 5500000, areaRule: () => 1 },
    '50PY': { baseMin: 5000000, baseMax: 6500000, areaRule: () => 1 },
  },
  tile: {
    '20PY': { baseMin: 1500000, baseMax: 2500000, areaRule: (py) => py * 0.3 },
    '30PY': { baseMin: 2500000, baseMax: 3500000, areaRule: (py) => py * 0.3 },
    '40PY': { baseMin: 3500000, baseMax: 4500000, areaRule: (py) => py * 0.3 },
    '50PY': { baseMin: 4500000, baseMax: 5500000, areaRule: (py) => py * 0.3 },
  },
  door: {
    '20PY': { baseMin: 1000000, baseMax: 2000000, areaRule: (py) => Math.ceil(py / 10) },
    '30PY': { baseMin: 1500000, baseMax: 2500000, areaRule: (py) => Math.ceil(py / 10) },
    '40PY': { baseMin: 2000000, baseMax: 3000000, areaRule: (py) => Math.ceil(py / 10) },
    '50PY': { baseMin: 2500000, baseMax: 3500000, areaRule: (py) => Math.ceil(py / 10) },
  },
  window: {
    '20PY': { baseMin: 2000000, baseMax: 3500000, areaRule: (py) => Math.ceil(py / 8) },
    '30PY': { baseMin: 3000000, baseMax: 4500000, areaRule: (py) => Math.ceil(py / 8) },
    '40PY': { baseMin: 4000000, baseMax: 5500000, areaRule: (py) => Math.ceil(py / 8) },
    '50PY': { baseMin: 5000000, baseMax: 6500000, areaRule: (py) => Math.ceil(py / 8) },
  },
  lighting: {
    '20PY': { baseMin: 800000, baseMax: 1500000, areaRule: (py) => py },
    '30PY': { baseMin: 1200000, baseMax: 2000000, areaRule: (py) => py },
    '40PY': { baseMin: 1800000, baseMax: 3000000, areaRule: (py) => py },
    '50PY': { baseMin: 2200000, baseMax: 3500000, areaRule: (py) => py },
  },
  storage: {
    '20PY': { baseMin: 3000000, baseMax: 5000000, areaRule: (py) => 1 },
    '30PY': { baseMin: 4000000, baseMax: 6000000, areaRule: (py) => 1 },
    '40PY': { baseMin: 5000000, baseMax: 7000000, areaRule: (py) => 1 },
    '50PY': { baseMin: 6000000, baseMax: 8000000, areaRule: (py) => 1 },
  },
  molding: {
    '20PY': { baseMin: 500000, baseMax: 1000000, areaRule: (py) => py },
    '30PY': { baseMin: 700000, baseMax: 1400000, areaRule: (py) => py },
    '40PY': { baseMin: 900000, baseMax: 1800000, areaRule: (py) => py },
    '50PY': { baseMin: 1100000, baseMax: 2200000, areaRule: (py) => py },
  },
  film: {
    '20PY': { baseMin: 1000000, baseMax: 2000000, areaRule: (py) => py * 0.5 },
    '30PY': { baseMin: 1500000, baseMax: 2500000, areaRule: (py) => py * 0.5 },
    '40PY': { baseMin: 2000000, baseMax: 3000000, areaRule: (py) => py * 0.5 },
    '50PY': { baseMin: 2500000, baseMax: 3500000, areaRule: (py) => py * 0.5 },
  },
}

/** 공정 이름 매핑 */
const PROCESS_NAMES: Record<ProcessId, string> = {
  demolition: '철거',
  wallpaper: '도배',
  flooring: '바닥',
  kitchen: '주방',
  bathroom: '욕실',
  tile: '타일',
  door: '문',
  window: '창호',
  lighting: '조명',
  storage: '수납',
  molding: '몰딩',
  film: '필름',
}

// ============================================================
// 3. 입력 검증
// ============================================================

function validateInput(input: RuleEngineInput): string[] {
  const missing: string[] = []
  
  // 하드 입력 검증
  if (!input.pyeong || input.pyeong <= 0) missing.push('pyeong')
  if (!input.housingType) missing.push('housingType')
  if (!input.roomCount || input.roomCount <= 0) missing.push('roomCount')
  if (!input.bathroomCount || input.bathroomCount <= 0) missing.push('bathroomCount')
  if (!input.constructionScope) missing.push('constructionScope')
  if (!input.selectedProcesses || input.selectedProcesses.length === 0) {
    missing.push('selectedProcesses')
  }
  if (!input.removedProcesses) missing.push('removedProcesses')
  if (!input.selectedOptions) missing.push('selectedOptions')
  
  // 현장 변수 검증 (최소 2개는 반드시 입력)
  if (!input.siteVariables) {
    missing.push('siteVariables')
  } else {
    const siteVar = input.siteVariables
    const definedCount = [
      siteVar.elevator,
      siteVar.parkingLifting,
      siteVar.managementRules,
      siteVar.wasteRemoval,
      siteVar.protectionScope,
    ].filter(v => v !== undefined && v !== '미확인').length
    
    if (definedCount < 2) {
      missing.push('siteVariables (최소 2개 이상 정의 필요)')
    }
  }
  
  return missing
}

// ============================================================
// 4. 리스크 가중치 계산
// ============================================================

function calculateRiskMultiplier(siteVariables: SiteVariables): RiskInfo {
  const unknownCount = [
    siteVariables.elevator,
    siteVariables.parkingLifting,
    siteVariables.managementRules,
    siteVariables.wasteRemoval,
    siteVariables.protectionScope,
  ].filter(v => v === undefined || v === '미확인').length
  
  // multiplier 계산 (고정 룰)
  let multiplier = 1.00
  if (unknownCount === 2) multiplier = 1.05
  else if (unknownCount === 3) multiplier = 1.10
  else if (unknownCount === 4) multiplier = 1.15
  else if (unknownCount === 5) multiplier = 1.20
  
  // notes 생성
  const notes: string[] = []
  if (unknownCount >= 2) {
    notes.push(`현장 변수 ${unknownCount}개 미확인으로 견적 범위를 확대했습니다.`)
    notes.push('양중/작업시간 조건 확인 시 범위가 줄어듭니다.')
  }
  
  return {
    unknownCount,
    multiplier,
    notes,
  }
}

// ============================================================
// 5. 공정 비용 계산
// ============================================================

function calculateProcessCost(
  processId: ProcessId,
  pyeong: number,
  bathroomCount: number,
  riskMultiplier: number
): { min: number; max: number } | null {
  const sizeRange = getSizeRange(pyeong)
  if (!sizeRange) {
    // SizeRange가 없으면 가장 가까운 범위 사용
    if (pyeong <= 24) return calculateProcessCost(processId, 20, bathroomCount, riskMultiplier)
    if (pyeong <= 34) return calculateProcessCost(processId, 30, bathroomCount, riskMultiplier)
    if (pyeong <= 44) return calculateProcessCost(processId, 40, bathroomCount, riskMultiplier)
    return calculateProcessCost(processId, 50, bathroomCount, riskMultiplier)
  }
  
  const priceTable = PROCESS_PRICE_TABLE[processId]
  if (!priceTable) return null
  
  const basePrice = priceTable[sizeRange]
  if (!basePrice) {
    // 해당 SizeRange가 없으면 가장 가까운 범위 사용
    const fallbackRange: SizeRange = 
      pyeong <= 24 ? '20PY' :
      pyeong <= 34 ? '30PY' :
      pyeong <= 44 ? '40PY' : '50PY'
    const fallbackPrice = priceTable[fallbackRange]
    if (!fallbackPrice) return null
    
    // fallback 가격 사용
    const areaMultiplier = processId === 'bathroom' ? bathroomCount : 1
    const min = Math.round(fallbackPrice.baseMin * riskMultiplier * areaMultiplier)
    const max = Math.round(fallbackPrice.baseMax * riskMultiplier * areaMultiplier)
    return { min, max }
  }
  
  // 욕실은 개수 반영 (개수별로 가격이 달라짐)
  let areaMultiplier = 1
  if (processId === 'bathroom') {
    areaMultiplier = bathroomCount
  }
  
  const min = Math.round(basePrice.baseMin * riskMultiplier * areaMultiplier)
  const max = Math.round(basePrice.baseMax * riskMultiplier * areaMultiplier)
  
  return { min, max }
}

// ============================================================
// 6. 옵션 증감 계산 (향후 확장)
// ============================================================

function calculateOptionDeltas(
  selectedOptions: string[],
  pyeong: number
): OptionDelta[] {
  // v0에서는 기본 옵션 증감만 구현
  // 향후 옵션별 가격표 추가 필요
  const optionDeltas: OptionDelta[] = []
  
  // 예시: 욕실 수납 옵션
  if (selectedOptions.includes('bathroom_storage')) {
    optionDeltas.push({
      id: 'bathroom_storage',
      name: '욕실 수납',
      min: 500000,
      max: 1000000,
    })
  }
  
  // 예시: 주방 팬트리 옵션
  if (selectedOptions.includes('kitchen_pantry')) {
    optionDeltas.push({
      id: 'kitchen_pantry',
      name: '주방 팬트리',
      min: 800000,
      max: 1500000,
    })
  }
  
  return optionDeltas
}

// ============================================================
// 7. 규칙 엔진 메인 함수
// ============================================================

export function calculateRuleEngineV0(
  input: RuleEngineInput
): RuleEngineOutput | RuleEngineError {
  // 입력 검증
  const missing = validateInput(input)
  if (missing.length > 0) {
    return {
      error: {
        code: 'INSUFFICIENT_INPUT',
        missing,
      },
    }
  }
  
  // 리스크 가중치 계산
  const risk = calculateRiskMultiplier(input.siteVariables)
  
  // 공정 비용 계산
  const processCosts: ProcessCost[] = []
  const removedProcesses: RemovedProcess[] = []
  const focusedProcesses: FocusedProcess[] = []
  
  // 선택된 공정 비용
  for (const processId of input.selectedProcesses) {
    const cost = calculateProcessCost(
      processId,
      input.pyeong,
      input.bathroomCount,
      risk.multiplier
    )
    
    if (cost) {
      processCosts.push({
        id: processId,
        name: PROCESS_NAMES[processId],
        min: cost.min,
        max: cost.max,
        type: 'selected',
      })
      
      focusedProcesses.push({
        id: processId,
        name: PROCESS_NAMES[processId],
      })
    }
  }
  
  // 제외된 공정 비용
  for (const processId of input.removedProcesses) {
    const cost = calculateProcessCost(
      processId,
      input.pyeong,
      input.bathroomCount,
      risk.multiplier
    )
    
    if (cost) {
      processCosts.push({
        id: processId,
        name: PROCESS_NAMES[processId],
        min: cost.min,
        max: cost.max,
        type: 'removed',
      })
      
      removedProcesses.push({
        id: processId,
        name: PROCESS_NAMES[processId],
        min: cost.min,
        max: cost.max,
      })
    }
  }
  
  // 옵션 증감 계산
  const optionDeltas = calculateOptionDeltas(input.selectedOptions, input.pyeong)
  
  // 총액 계산
  const selectedTotalMin = processCosts
    .filter(p => p.type === 'selected')
    .reduce((sum, p) => sum + p.min, 0)
  
  const selectedTotalMax = processCosts
    .filter(p => p.type === 'selected')
    .reduce((sum, p) => sum + p.max, 0)
  
  const optionTotalMin = optionDeltas.reduce((sum, o) => sum + o.min, 0)
  const optionTotalMax = optionDeltas.reduce((sum, o) => sum + o.max, 0)
  
  const totalMin = selectedTotalMin + optionTotalMin
  const totalMax = selectedTotalMax + optionTotalMax
  
  // 절감 계산 (제외 공정 합계)
  const savingMin = removedProcesses.reduce((sum, p) => sum + p.min, 0)
  const savingMax = removedProcesses.reduce((sum, p) => sum + p.max, 0)
  
  return {
    summary: {
      removed: removedProcesses,
      focused: focusedProcesses,
      saving: { min: savingMin, max: savingMax },
      total: { min: totalMin, max: totalMax },
    },
    processCosts,
    optionDeltas,
    risk,
  }
}













