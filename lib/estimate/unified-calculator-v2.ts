/**
 * 인테리봇 통합 견적 계산기 V2
 * 
 * 해결된 문제:
 * 1. 주방 가격 과다 → 선택된 옵션만 포함 (기본 냉장고장 제거)
 * 2. 면적 계산 오류 → 100% 초과 방지 로직 추가
 * 3. 철거비 고정 → 실제 시공 면적 기준 비례 계산
 * 4. 등급 간 차이 미미 → 명확한 배율 적용 (Basic→Premium 2.5배)
 * 
 * 추가 개선:
 * - 성향 데이터 반영 (정리정돈 높으면 수납 강화 등)
 * - 하드코딩 제거 (상수화)
 * - 타입 안정성 강화 (any 제거)
 * - 과도한 로그 정리
 */

// V2 마스터 데이터 사용 (세분화된 옵션 지원)
// 기존 데이터: '@/lib/data/estimate-master-real'
import { masterDataV2 as masterData, KITCHEN_LAYOUT_MULTIPLIERS } from '@/lib/data/estimate-master-v2'
import type { EstimateInput, Grade, GradeResult, LineItem } from './types'
import { calculateAllIndirectCosts } from './v2/indirect-costs'
import { PYEONG_TO_M2 } from './config'
import { 
  getSpaceAreaRatios, 
  getDefaultRoomCounts,
  type SpaceCode 
} from '@/lib/data/space-area-ratios'

// ============================================================
// 상수 정의 (하드코딩 제거)
// ============================================================

/** 등급별 가격 배율 (Basic 대비) */
const GRADE_MULTIPLIERS: Record<Grade, number> = {
  basic: 1.0,      // 기준
  standard: 1.35,  // +35%
  argen: 1.75,     // +75%
  premium: 2.5     // +150%
}

/** 등급별 노무비 배율 (자재비보다 낮은 증가율) */
const LABOR_GRADE_MULTIPLIERS: Record<Grade, number> = {
  basic: 1.0,
  standard: 1.15,  // +15%
  argen: 1.25,     // +25%
  premium: 1.5     // +50%
}

/** 철거 단가 (㎡당, 30평 기준) */
const DEMOLITION_BASE_PRICE_PER_M2 = 15000  // 약 150만원 ÷ 99㎡

/** 타일 시공 상수 */
const TILE_AREA_PER_BATHROOM = 16  // 욕실 1개당 바닥 4㎡ + 벽 12㎡
const TILE_DAILY_CAPACITY = 12     // 2인 1조 일일 시공량 12㎡
const TILE_DAILY_LABOR_COST = 600000  // 기공 350,000 + 조공 250,000

/** 공정 코드 매핑 (V2 마스터 데이터와 일치) */
const PROCESS_CODE_MAP: Record<string, string> = {
  '100': '주방',
  '200': '목공',
  '300': '전기',
  '400': '욕실',
  '500': '타일',
  '600': '도배',  // V2에는 '도장'이 없음, '도배'로 대체
  '700': '필름',
  '800': '목공',  // V2에는 '창호'가 없음, '목공'으로 대체
  '900': '도배',
  '1000': '철거',
}

/** 공정별 적용 공간 */
const PROCESS_SPACES: Record<string, string[]> = {
  주방: ['kitchen'],
  욕실: ['bathroom'],
  목공: ['common'],
  전기: ['common'],
  타일: ['kitchen', 'bathroom', 'entrance', 'balcony'],
  도장: ['common'],
  필름: ['common'],
  창호: ['living', 'utility', 'balcony'],
  도배: ['common'],
  철거: ['common'],
  기타: ['common'],
}

/** tierSelections ID → 공정명 매핑 */
const TIER_TO_PROCESS: Record<string, string> = {
  'demolition': '철거',
  'finish': '도배',     // V2 마스터에는 '도장'이 없어서 '도배'로 매핑
  'electric': '전기',
  'kitchen': '주방',
  'bathroom': '욕실',
  'door_window': '목공',  // V2 마스터에는 '창호'가 없어서 '목공'으로 매핑
  'furniture': '목공',
  'film': '필름',
  'balcony': '기타',
  'entrance': '기타',
  'wallpaper': '도배',   // 도배 공정 추가
}

// ============================================================
// 유틸리티 함수
// ============================================================

/** 공정 코드를 한글 이름으로 변환 */
function convertProcessCodeToName(code: string): string {
  return PROCESS_CODE_MAP[code] || code
}

/** 공정이 선택된 공간에 포함되는지 확인 */
function shouldIncludeProcess(processName: string, selectedSpaces: string[]): boolean {
  const processSpaces = PROCESS_SPACES[processName]
  
  if (!processSpaces || processSpaces.length === 0) return true
  if (processSpaces.includes('common')) return true
  
  return processSpaces.some(space => selectedSpaces.includes(space))
}

/** 항목이 선택된 공간에 포함되는지 확인 */
function shouldIncludeItem(item: { spaces?: string[] }, selectedSpaces: string[]): boolean {
  if (!item.spaces || item.spaces.length === 0) return true
  if (item.spaces.includes('common')) return true
  
  return item.spaces.some(space => selectedSpaces.includes(space))
}

// ============================================================
// 공정 선택 로직
// ============================================================

function selectProcesses(input: EstimateInput): string[] {
  console.log('🔍 selectProcesses 입력:', {
    selectedProcesses: input.selectedProcesses,
    selectedSpaces: input.selectedSpaces,
    tierSelections: input.tierSelections ? Object.keys(input.tierSelections) : null
  })
  
  // ✅ 1순위: selectedProcesses (사용자가 공정 선택 페이지에서 직접 선택한 공정)
  if (input.selectedProcesses && input.selectedProcesses.length > 0) {
    const converted = input.selectedProcesses.map(code => convertProcessCodeToName(code))
    converted.push('기타') // 기타는 항상 포함
    const uniqueProcesses = [...new Set(converted)]
    console.log('📦 사용자 선택 공정:', uniqueProcesses)
    return uniqueProcesses
  }
  
  // ✅ 2순위: tierSelections 기반
  if (input.tierSelections) {
    const enabledProcesses: string[] = []
    
    Object.entries(input.tierSelections).forEach(([processId, selection]) => {
      if (selection.enabled) {
        const processName = TIER_TO_PROCESS[processId]
        if (processName && !enabledProcesses.includes(processName)) {
          enabledProcesses.push(processName)
        }
      }
    })
    
    if (enabledProcesses.length > 0) {
      enabledProcesses.push('기타')
      const uniqueProcesses = [...new Set(enabledProcesses)]
      console.log('📦 tier 선택 공정:', uniqueProcesses)
      return uniqueProcesses
    }
  }
  
  // ✅ 3순위: selectedSpaces 기반 자동 생성 (공정 선택 안 한 경우)
  if (input.selectedSpaces && input.selectedSpaces.length > 0) {
    const processes: string[] = []
    
    console.log('🎯 선택된 공간 기반 자동 공정 생성:', input.selectedSpaces)
    
    // 주방 선택 시 - 주방 공정만
    if (input.selectedSpaces.includes('kitchen')) {
      processes.push('주방')
    }
    
    // 욕실 선택 시 - 욕실 공정만 (타일/줄눈/방수 포함)
    if (input.selectedSpaces.includes('bathroom')) {
      processes.push('욕실')
    }
    
    // 거실 선택 시
    if (input.selectedSpaces.includes('living')) {
      processes.push('도배')
      processes.push('전기')
      processes.push('필름')
    }
    
    // 방/드레스룸 선택 시 (붙박이장 포함)
    const roomSpaces = ['masterBedroom', 'kidsBedroom', 'room1', 'room2', 'room3', 'dressRoom']
    if (roomSpaces.some(s => input.selectedSpaces!.includes(s))) {
      processes.push('도배')
      processes.push('전기')
      processes.push('목공')
      processes.push('필름')
    }
    
    // 현관 선택 시
    if (input.selectedSpaces.includes('entrance')) {
      processes.push('타일')
      processes.push('목공')
    }
    
    // 발코니 선택 시
    if (input.selectedSpaces.includes('balcony')) {
      processes.push('타일')
    }
    
    // 공통: 기타(바닥보양, 청소, 관리비)는 항상 포함
    processes.push('기타')
    
    const uniqueProcesses = [...new Set(processes)]
    console.log('📦 자동 생성 공정:', uniqueProcesses)
    
    return uniqueProcesses
  }
  
  // ✅ 4순위: 아무것도 없으면 기타만 반환
  console.log('⚠️ 선택된 공간/공정 없음, 기타만 포함')
  return ['기타']
}

// ============================================================
// 조건 체크
// ============================================================

interface ItemCondition {
  철거공정없음?: boolean
  주방옵션?: Record<string, unknown>
  욕실옵션?: Record<string, unknown>
  목공옵션?: Record<string, unknown>
  전기옵션?: Record<string, unknown>
  도배옵션?: Record<string, unknown>
  타일옵션?: Record<string, unknown>
  필름옵션?: Record<string, unknown>
  창호옵션?: Record<string, unknown>
}

/**
 * 중첩된 옵션 값 체크 헬퍼
 */
function checkNestedValue(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>
): boolean {
  for (const [key, val] of Object.entries(expected)) {
    const actualVal = actual[key]
    
    // 중첩 객체인 경우 재귀 체크
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      if (actualVal === null || typeof actualVal !== 'object') return false
      if (!checkNestedValue(actualVal as Record<string, unknown>, val as Record<string, unknown>)) return false
    }
    // 배열인 경우 포함 여부 체크
    else if (Array.isArray(val)) {
      if (!Array.isArray(actualVal)) return false
      if (!val.every(v => actualVal.includes(v))) return false
    }
    // 단순 값 비교
    else if (actualVal !== val) {
      return false
    }
  }
  return true
}

function checkCondition(
  condition: ItemCondition, 
  input: EstimateInput, 
  selectedProcesses: string[]
): boolean {
  // 철거 공정이 없을 때만 포함
  if (condition.철거공정없음 && selectedProcesses.includes('철거')) {
    return false
  }
  
  // 주방옵션 체크 (중첩 지원)
  if (condition.주방옵션) {
    const kitchenOpt = input.주방옵션 || {}
    if (!checkNestedValue(kitchenOpt as Record<string, unknown>, condition.주방옵션)) {
      return false
    }
  }
  
  // 욕실옵션 체크 (중첩 지원)
  if (condition.욕실옵션) {
    const bathroomOpt = input.욕실옵션 || {}
    if (!checkNestedValue(bathroomOpt as Record<string, unknown>, condition.욕실옵션)) {
      return false
    }
  }
  
  // 목공옵션 체크
  if (condition.목공옵션) {
    const woodworkOpt = input.목공옵션 || {}
    if (!checkNestedValue(woodworkOpt as Record<string, unknown>, condition.목공옵션)) {
      return false
    }
  }
  
  // 전기옵션 체크
  if (condition.전기옵션) {
    const electricOpt = input.전기옵션 || {}
    if (!checkNestedValue(electricOpt as Record<string, unknown>, condition.전기옵션)) {
      return false
    }
  }
  
  // 도배옵션 체크
  if (condition.도배옵션) {
    const wallpaperOpt = input.도배옵션 || {}
    if (!checkNestedValue(wallpaperOpt as Record<string, unknown>, condition.도배옵션)) {
      return false
    }
  }
  
  // 타일옵션 체크
  if (condition.타일옵션) {
    const tileOpt = input.타일옵션 || {}
    if (!checkNestedValue(tileOpt as Record<string, unknown>, condition.타일옵션)) {
      return false
    }
  }
  
  // 필름옵션 체크
  if (condition.필름옵션) {
    const filmOpt = input.필름옵션 || {}
    if (!checkNestedValue(filmOpt as Record<string, unknown>, condition.필름옵션)) {
      return false
    }
  }
  
  // 창호옵션 체크
  if (condition.창호옵션) {
    const windowOpt = input.창호옵션 || {}
    if (!checkNestedValue(windowOpt as Record<string, unknown>, condition.창호옵션)) {
      return false
    }
  }
  
  return true
}

// ============================================================
// 면적 계산 (개선됨)
// ============================================================

/**
 * 선택된 공간의 면적 계산 (V2: 100% 초과 방지)
 */
export function calculateSpaceArea(
  totalAreaM2: number,
  selectedSpaces: string[],
  input: EstimateInput
): number {
  if (!selectedSpaces || selectedSpaces.length === 0) {
    return totalAreaM2
  }
  
  const ratios = getSpaceAreaRatios(totalAreaM2)
  const defaultCounts = getDefaultRoomCounts(totalAreaM2)
  
  const 방개수 = input.방개수 || defaultCounts.방개수
  const 욕실개수 = input.욕실개수 || defaultCounts.욕실개수
  
  let totalRatio = 0
  
  for (const space of selectedSpaces) {
    const spaceCode = space as SpaceCode
    
    if (spaceCode === 'kidsBedroom') {
      const roomRatio = ratios.kidsBedroom
      if (방개수 === 1) {
        totalRatio += roomRatio
      } else if (방개수 === 2) {
        totalRatio += (roomRatio / 2) * 방개수
      } else if (방개수 >= 3) {
        totalRatio += (roomRatio / 3) * 방개수
      } else {
        totalRatio += roomRatio
      }
    }
    else if (spaceCode === 'bathroom') {
      const bathroomRatio = ratios.bathroom
      if (욕실개수 === 1) {
        totalRatio += bathroomRatio
      } else if (욕실개수 >= 2) {
        totalRatio += (bathroomRatio / 2) * 욕실개수
      } else {
        totalRatio += bathroomRatio
      }
    }
    else {
      const ratio = ratios[spaceCode]
      if (ratio !== undefined) {
        totalRatio += ratio
      }
    }
  }
  
  // ✅ V2 개선: 100% 초과 방지
  if (totalRatio > 100) {
    totalRatio = 100
  }
  
  const spaceArea = totalAreaM2 * (totalRatio / 100)
  return Math.round(spaceArea * 10) / 10
}

/**
 * 철거 면적 계산 (V2: 실제 면적 비례)
 */
function calculateDemolitionArea(
  selectedProcesses: string[],
  selectedSpaces: string[],
  totalAreaM2: number,
  input: EstimateInput
): number {
  const usedSpaces = new Set<string>()
  
  for (const process of selectedProcesses) {
    const processSpaces = PROCESS_SPACES[process] || []
    
    if (processSpaces.includes('common')) {
      selectedSpaces.forEach(space => usedSpaces.add(space))
    } else {
      processSpaces.forEach(space => {
        if (selectedSpaces.includes(space)) {
          usedSpaces.add(space)
        }
      })
    }
  }
  
  if (usedSpaces.size === 0) {
    return totalAreaM2
  }
  
  return calculateSpaceArea(totalAreaM2, Array.from(usedSpaces), input)
}

// ============================================================
// 수량 계산
// ============================================================

interface QuantityCalc {
  기준: '평수' | '방개수' | '욕실개수' | '고정' | '주방형태' | '상판면적'
  계수: number
  최소?: number
  최대?: number
}

interface MasterItem {
  항목명: string
  규격?: string
  단위: string
  수량?: number
  수량계산?: QuantityCalc
  재료비: Record<Grade, number>
  노무비: Record<Grade, number>
  브랜드: Record<Grade, string> | string
  조건?: ItemCondition
  작업정보?: {
    작업인원: number
    작업기간단위: string
    작업기간계산: string
    설명: string
  }
  spaces?: string[]
}

function calculateQuantity(item: MasterItem, input: EstimateInput): number {
  if (item.수량계산) {
    const calc = item.수량계산
    let qty = 0
    
    if (calc.기준 === '평수') {
      // ✅ V2 개선: common 공간 항목은 항상 전체 평수로 계산
      // 도배, 전기, 목공 등 집 전체에 적용되는 공정은 selectedSpaces와 무관하게 전체 면적 사용
      const isCommonItem = item.spaces?.includes('common') || !item.spaces || item.spaces.length === 0
      
      if (isCommonItem) {
        // 공통 항목: 전체 평수 사용
        qty = input.평수 * (calc.계수 || 1)
      } else if (input.selectedSpaces && input.selectedSpaces.length > 0) {
        // 특정 공간 항목: 선택된 공간 면적만 사용
        const totalAreaM2 = input.평수 * PYEONG_TO_M2
        const spaceAreaM2 = calculateSpaceArea(totalAreaM2, input.selectedSpaces, input)
        const spaceAreaPyeong = spaceAreaM2 / PYEONG_TO_M2
        qty = spaceAreaPyeong * (calc.계수 || 1)
      } else {
        qty = input.평수 * (calc.계수 || 1)
      }
    } else if (calc.기준 === '방개수') {
      qty = input.방개수 * (calc.계수 || 1)
    } else if (calc.기준 === '욕실개수') {
      qty = input.욕실개수 * (calc.계수 || 1)
    } else if (calc.기준 === '고정') {
      qty = calc.계수 || 1
    } else if (calc.기준 === '주방형태') {
      // ✅ V2 신규: 주방형태별 수량 (배율 적용)
      const layout = input.주방옵션?.형태 || '일자'
      const layoutMultiplier = KITCHEN_LAYOUT_MULTIPLIERS[layout] || 1.0
      qty = (calc.계수 || 1) * layoutMultiplier
    } else if (calc.기준 === '상판면적') {
      // ✅ V2 신규: 상판 면적 계산 (주방형태에 따라 달라짐)
      const layout = input.주방옵션?.형태 || '일자'
      // 기본 상판 면적: 일자형 약 3㎡
      const baseArea = 3.0
      const layoutMultipliers: Record<string, number> = {
        '일자': 1.0,     // 3㎡
        'ㄱ자': 1.3,     // 3.9㎡
        'ㄷ자': 1.6,     // 4.8㎡
        '아일랜드': 1.8, // 5.4㎡
        'ㄱ자+아일랜드': 2.3  // 6.9㎡
      }
      qty = baseArea * (layoutMultipliers[layout] || 1.0) * (calc.계수 || 1)
    }
    
    if (calc.최소 && qty < calc.최소) qty = calc.최소
    if (calc.최대 && qty > calc.최대) qty = calc.최대
    
    return qty
  }
  
  return item.수량 || 1
}

// ============================================================
// 가격 계산 (V2 핵심 개선)
// ============================================================

/**
 * 자재비 계산 (V2: 등급 배율 적용)
 */
function calculateMaterialPrice(
  item: MasterItem,
  grade: Grade,
  processName: string
): number {
  // 철거는 등급 차이 없음 (standard 사용)
  if (processName === '철거') {
    return item.재료비?.standard ?? item.재료비?.basic ?? 0
  }
  
  // 마스터 데이터에 등급별 가격이 있으면 우선 사용
  if (item.재료비?.[grade] !== undefined && item.재료비[grade] > 0) {
    let price = item.재료비[grade]
    
    // Argen 등급: 주방/목공 주요 항목 프리미엄 적용
    if (grade === 'argen' && (processName === '주방' || processName === '목공')) {
      const name = item.항목명 ?? ''
      if (
        name.includes('싱크대') ||
        name.includes('붙박이장') ||
        name.includes('화장대') ||
        name.includes('냉장고장')
      ) {
        price = price * 1.15
      }
    }
    
    return price
  }
  
  // 없으면 기본 가격에 배율 적용
  const basePrice = item.재료비?.basic ?? 0
  return basePrice * GRADE_MULTIPLIERS[grade]
}

/**
 * 노무비 계산 (V2: 등급별 차등)
 */
function calculateLaborPrice(
  item: MasterItem,
  grade: Grade,
  processName: string,
  qty: number,
  input: EstimateInput
): number {
  if (!item.노무비) return 0
  
  // 철거는 등급 차이 없음
  if (processName === '철거') {
    const laborUnit = item.노무비?.standard ?? item.노무비?.basic ?? 0
    return laborUnit * qty
  }
  
  // 타일 시공: 작업일수 기반 계산
  if (item.항목명.includes('타일 시공')) {
    const 총타일면적 = TILE_AREA_PER_BATHROOM * input.욕실개수
    const 작업일수 = Math.ceil(총타일면적 / TILE_DAILY_CAPACITY)
    return 작업일수 * TILE_DAILY_LABOR_COST
  }
  
  // 마스터 데이터에 등급별 노무비가 있으면 사용
  if (item.노무비?.[grade] !== undefined && item.노무비[grade] > 0) {
    return item.노무비[grade] * qty
  }
  
  // 없으면 기본 노무비에 배율 적용
  const baseLabor = item.노무비?.basic ?? 0
  return baseLabor * LABOR_GRADE_MULTIPLIERS[grade] * qty
}

// ============================================================
// 성향 기반 가격 조정 (V2 신규)
// ============================================================

/**
 * 성향에 따른 가격 조정
 * - 정리정돈 높으면: 수납 관련 항목 업그레이드
 * - 조명취향 높으면: 조명 관련 항목 업그레이드
 * - 요리빈도 높으면: 주방 관련 항목 업그레이드
 */
function applyTraitAdjustment(
  item: LineItem,
  traits: EstimateInput['성향']
): LineItem {
  if (!traits) return item
  
  const adjusted = { ...item }
  
  // 정리정돈 점수 높으면 수납 관련 업그레이드
  if (traits.정리정돈 && traits.정리정돈 >= 4) {
    if (
      item.항목.includes('붙박이장') ||
      item.항목.includes('수납') ||
      item.항목.includes('신발장')
    ) {
      adjusted.재료비 = Math.round(item.재료비 * 1.15)  // 15% 업그레이드
      adjusted.합계 = adjusted.재료비 + adjusted.노무비
    }
  }
  
  // 조명취향 점수 높으면 조명 관련 업그레이드
  if (traits.조명취향 && traits.조명취향 >= 4) {
    if (item.항목.includes('조명') || item.항목.includes('등')) {
      adjusted.재료비 = Math.round(item.재료비 * 1.2)  // 20% 업그레이드
      adjusted.합계 = adjusted.재료비 + adjusted.노무비
    }
  }
  
  // 요리빈도 높으면 주방 관련 업그레이드
  if (traits.요리빈도 && traits.요리빈도 >= 4) {
    if (item.공정 === '주방') {
      adjusted.재료비 = Math.round(item.재료비 * 1.1)  // 10% 업그레이드
      adjusted.합계 = adjusted.재료비 + adjusted.노무비
    }
  }
  
  return adjusted
}

// ============================================================
// 등급별 계산 (V2 핵심)
// ============================================================

export function calculateGrade(
  input: EstimateInput,
  processes: string[],
  grade: Grade
): GradeResult {
  const details: LineItem[] = []
  let totalMaterial = 0
  let totalLabor = 0
  
  for (const processName of processes) {
    // ✅ 공정 레벨 필터링 제거: selectProcesses에서 이미 필터링됨
    // processes 배열에 포함된 공정만 처리
    
    const process = (masterData.categories as Record<string, { 항목: MasterItem[] }>)[processName]
    if (!process) {
      console.log(`⚠️ 공정 '${processName}'이 마스터 데이터에 없습니다.`)
      continue
    }
    
    for (const item of process.항목) {
      // 조건 체크 (옵션 조건)
      if (item.조건 && !checkCondition(item.조건, input, processes)) {
        continue
      }
      
      // 공간별 필터링 (항목의 spaces 속성 체크)
      if (input.selectedSpaces && input.selectedSpaces.length > 0 && item.spaces) {
        // 'common'이 아닌 특정 공간 항목만 필터링
        if (!item.spaces.includes('common')) {
          const hasMatchingSpace = item.spaces.some(space => input.selectedSpaces!.includes(space))
          if (!hasMatchingSpace) {
            continue
          }
        }
      }
      
      // 수량 계산
      const qty = calculateQuantity(item, input)
      if (!qty || qty === 0) continue
      
      // ✅ V2: 개선된 가격 계산
      const materialUnit = calculateMaterialPrice(item, grade, processName)
      const materialTotal = materialUnit * qty
      const laborTotal = calculateLaborPrice(item, grade, processName, qty, input)
      
      totalMaterial += materialTotal
      totalLabor += laborTotal
      
      // 브랜드/규격 설정
      let brandForGrade: string | undefined = undefined
      if (item.브랜드 && typeof item.브랜드 === 'object') {
        brandForGrade = item.브랜드[grade] ?? item.브랜드.standard
      } else if (typeof item.브랜드 === 'string') {
        brandForGrade = item.브랜드
      }
      
      const spec = item.규격 || brandForGrade || '-'
      
      // 작업정보
      let 작업정보 = undefined
      if (item.작업정보) {
        let 작업기간 = Math.round(qty * 100) / 100
        
        if (item.항목명.includes('타일 시공')) {
          const 총타일면적 = TILE_AREA_PER_BATHROOM * input.욕실개수
          작업기간 = Math.ceil(총타일면적 / TILE_DAILY_CAPACITY)
        }
        
        작업정보 = {
          작업인원: item.작업정보.작업인원,
          작업기간: 작업기간,
          작업기간단위: item.작업정보.작업기간단위,
          설명: item.작업정보.설명
        }
      }
      
      // 세부내역 추가
      let lineItem: LineItem = {
        공정: processName,
        항목: item.항목명,
        브랜드: brandForGrade,
        규격: spec,
        단위: item.단위,
        수량: Math.round(qty * 100) / 100,
        재료비: Math.round(materialTotal),
        노무비: Math.round(laborTotal),
        합계: Math.round(materialTotal + laborTotal),
        작업정보: 작업정보
      }
      
      // ✅ V2: 성향 기반 조정 적용
      lineItem = applyTraitAdjustment(lineItem, input.성향)
      
      details.push(lineItem)
    }
  }
  
  // 철거비 면적 비례 조정 (V2)
  if (processes.includes('철거')) {
    const totalAreaM2 = input.평수 * PYEONG_TO_M2
    const demolitionAreaM2 = input.selectedSpaces && input.selectedSpaces.length > 0
      ? calculateDemolitionArea(processes, input.selectedSpaces, totalAreaM2, input)
      : totalAreaM2
    
    // 30평(99㎡) 기준 대비 면적 비율로 철거비 조정
    const areaRatio = demolitionAreaM2 / (30 * PYEONG_TO_M2)
    
    // 철거 항목 찾아서 가격 조정
    details.forEach(item => {
      if (item.공정 === '철거') {
        item.재료비 = Math.round(item.재료비 * areaRatio)
        item.노무비 = Math.round(item.노무비 * areaRatio)
        item.합계 = item.재료비 + item.노무비
      }
    })
  }
  
  // 최종 합계 재계산 (조정된 항목 반영)
  totalMaterial = details.reduce((sum, item) => sum + item.재료비, 0)
  totalLabor = details.reduce((sum, item) => sum + item.노무비, 0)
  
  // 직접공사비
  const directCost = totalMaterial + totalLabor
  
  // 간접공사비
  const indirectCostDetail = calculateAllIndirectCosts(totalLabor, directCost)
  
  // 총액
  const grandTotal = directCost + indirectCostDetail.총간접비
  
  return {
    세부내역: details,
    재료비: Math.round(totalMaterial),
    노무비: Math.round(totalLabor),
    직접공사비: Math.round(directCost),
    간접공사비: {
      산재고용보험: Math.round(indirectCostDetail.노무비기준.총계),
      공과잡비: 0,
      현장관리및감리: Math.round(indirectCostDetail.총공사비기준.총계),
      합계: Math.round(indirectCostDetail.총간접비)
    },
    총액: Math.round(grandTotal),
    범위견적: {
      min: Math.round(grandTotal * 0.95),
      max: Math.round(grandTotal * 1.05)
    }
  }
}

// ============================================================
// 전체 견적 계산 (V2)
// ============================================================

export function calculateEstimate(input: EstimateInput) {
  // ✅ V2 개선: 기본 주방옵션 제거 (빈 객체)
  const normalizedInput: EstimateInput = {
    ...input,
    현재상태: input.현재상태 || '구축아파트',
    층수: input.층수 || 10,
    주방옵션: input.주방옵션 || {},  // ← 변경: 냉장고장 기본 제거
    욕실옵션: input.욕실옵션,
    목공옵션: input.목공옵션,
    성향: {
      요리빈도: 3,
      정리정돈: 3,
      청소성향: 3,
      조명취향: 3,
      예산감각: 3,
      ...input.성향
    },
    selectedProcesses: input.selectedProcesses,
    selectedSpaces: input.selectedSpaces,
  }
  
  const processes = selectProcesses(normalizedInput)
  
  const basic = calculateGrade(normalizedInput, processes, 'basic')
  const standard = calculateGrade(normalizedInput, processes, 'standard')
  const argen = calculateGrade(normalizedInput, processes, 'argen')
  const premium = calculateGrade(normalizedInput, processes, 'premium')
  
  // ✅ V2: 등급 간 차이 검증 로그
  const gradeCompare = {
    basic: basic.총액,
    standard: standard.총액,
    argen: argen.총액,
    premium: premium.총액,
    차이: {
      'basic→standard': `+${((standard.총액/basic.총액-1)*100).toFixed(1)}%`,
      'basic→argen': `+${((argen.총액/basic.총액-1)*100).toFixed(1)}%`,
      'basic→premium': `+${((premium.총액/basic.총액-1)*100).toFixed(1)}%`,
    }
  }
  console.log('📊 [V2] 등급별 총액:', gradeCompare)
  
  return {
    basic,
    standard,
    argen,
    premium,
    recommended: 'argen' as Grade,
    selected_processes: processes
  }
}

