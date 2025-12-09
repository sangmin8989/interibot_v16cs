/**
 * 인테리봇 통합 견적 계산기
 * - realMasterData 기반 (30평 5,960만원 실제 견적서)
 * - 4개 등급 (Basic, Standard, Argen, Premium)
 * - 공정별 선택 견적 지원
 */

import { realMasterData as masterData } from '@/lib/data/estimate-master-real'
import type { EstimateInput, Grade, GradeResult, LineItem } from './types'
import { calculateAllIndirectCosts } from './v2/indirect-costs'
import { PYEONG_TO_M2 } from './config'
import { 
  getSpaceAreaRatios, 
  getDefaultRoomCounts,
  type SpaceCode 
} from '@/lib/data/space-area-ratios'

// 공정 코드를 한글 이름으로 변환
function convertProcessCodeToName(code: string): string {
  const codeMap: Record<string, string> = {
    '100': '주방',
    '200': '목공',
    '300': '전기',
    '400': '욕실',
    '500': '타일',
    '600': '도장',
    '700': '필름',
    '800': '창호',
    '900': '도배',
    '1000': '철거',
  }
  return codeMap[code] || code
}

// 공정별 spaces 매핑
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

// 공정 레벨 필터링: 공정이 선택된 공간에 포함되는지 확인
function shouldIncludeProcess(processName: string, selectedSpaces: string[]): boolean {
  const processSpaces = PROCESS_SPACES[processName]
  
  // 공정에 spaces 매핑이 없으면 → true (포함, 기존 동작 유지)
  if (!processSpaces || processSpaces.length === 0) {
    return true
  }
  
  // 공정 spaces에 "common"이 포함되면 → true (포함)
  if (processSpaces.includes('common')) {
    return true
  }
  
  // 공정 spaces와 selectedSpaces의 교집합이 1개 이상이면 → true (포함)
  const intersection = processSpaces.filter(space => selectedSpaces.includes(space))
  if (intersection.length > 0) {
    return true
  }
  
  // 그 외 → false (제외)
  return false
}

// 공정 선택
function selectProcesses(input: EstimateInput): string[] {
  console.log('🔍 selectProcesses 호출됨')
  console.log('🔍 input.selectedProcesses:', input.selectedProcesses)
  console.log('🔍 input.selectedProcesses?.length:', input.selectedProcesses?.length)
  console.log('🔍 input.selectedSpaces:', input.selectedSpaces)
  console.log('🔍 input.tierSelections:', input.tierSelections)
  
  // tierSelections가 있으면 이를 기반으로 공정 필터링
  if (input.tierSelections) {
    const processIdToName: Record<string, string> = {
      'demolition': '철거',
      'finish': '도장', // 마감 → 도장/도배로 매핑
      'electric': '전기',
      'kitchen': '주방',
      'bathroom': '욕실',
      'door_window': '창호',
      'furniture': '목공',
      'film': '필름',
      'balcony': '기타', // 발코니 → 기타로 매핑
      'entrance': '기타', // 현관 → 기타로 매핑
    }
    
    const enabledProcesses: string[] = []
    
    Object.entries(input.tierSelections).forEach(([processId, selection]) => {
      if (selection.enabled) {
        const processName = processIdToName[processId]
        if (processName && !enabledProcesses.includes(processName)) {
          enabledProcesses.push(processName)
          console.log(`✅ tierSelections 활성화 공정: ${processId} → ${processName}`)
        }
        
        // finish 공정은 도장+도배+타일 모두 추가
        if (processId === 'finish') {
          if (!enabledProcesses.includes('도배')) {
            enabledProcesses.push('도배')
            console.log(`✅ tierSelections 활성화 공정: finish → 도배`)
          }
          if (!enabledProcesses.includes('타일')) {
            enabledProcesses.push('타일')
            console.log(`✅ tierSelections 활성화 공정: finish → 타일`)
          }
        }
      } else {
        console.log(`⏭️ tierSelections 비활성화 공정: ${processId}`)
      }
    })
    
    // 공간별 필터링 적용
    if (input.selectedSpaces && input.selectedSpaces.length > 0 && enabledProcesses.length > 0) {
      const filteredProcesses = enabledProcesses.filter(processName => 
        shouldIncludeProcess(processName, input.selectedSpaces!)
      )
      console.log('✅ tierSelections 기반 + 공간 필터링된 공정:', filteredProcesses)
      return filteredProcesses
    }
    
    console.log('✅ tierSelections 기반 최종 공정:', enabledProcesses)
    return enabledProcesses
  }
  
  // selectedProcesses가 있으면 무조건 그것만 사용
  if (input.selectedProcesses && input.selectedProcesses.length > 0) {
    const convertedProcesses = input.selectedProcesses.map(code => convertProcessCodeToName(code))
    console.log('✅ 고객이 직접 선택한 공정 코드:', input.selectedProcesses)
    console.log('✅ 변환된 공정 이름:', convertedProcesses)
    
    // 공간별 필터링 적용 (selectedSpaces가 있을 때만)
    if (input.selectedSpaces && input.selectedSpaces.length > 0) {
      const filteredProcesses = convertedProcesses.filter(processName => 
        shouldIncludeProcess(processName, input.selectedSpaces!)
      )
      console.log('✅ 공간별 필터링된 공정:', filteredProcesses)
      console.log('📊 필터링 전:', convertedProcesses.length, '개')
      console.log('📊 필터링 후:', filteredProcesses.length, '개')
      return filteredProcesses
    }
    
    console.log('✅ 최종 반환할 공정 (공간 필터링 없음):', convertedProcesses)
    return convertedProcesses
  }
  
  // 자동 선택 모드: 기본 공정들 자동 추가
  console.log('🤖 자동 선택 모드: 기본 공정 추가')
  const processes: string[] = ['철거']
  
  // 주방 옵션이 있으면 주방 추가
  if (input.주방옵션) {
    processes.push('주방')
  }
  
  // 욕실 개수가 있으면 욕실 + 타일 추가
  if (input.욕실개수 && input.욕실개수 > 0) {
    processes.push('욕실')
    processes.push('타일')
  }
  
  // 기본 공정들 추가
  processes.push('목공', '전기', '도배', '필름', '기타')
  
  // 공간별 필터링 적용
  if (input.selectedSpaces && input.selectedSpaces.length > 0) {
    const filteredProcesses = processes.filter(processName => 
      shouldIncludeProcess(processName, input.selectedSpaces!)
    )
    console.log('✅ 공간별 필터링된 공정:', filteredProcesses)
    return filteredProcesses
  }
  
  console.log('✅ 자동 선택된 공정:', processes)
  return processes
}

// 조건 체크
function checkCondition(condition: any, input: EstimateInput, selectedProcesses: string[]): boolean {
  // 철거 공정이 없을 때만 포함되는 항목 체크
  if (condition.철거공정없음) {
    const has철거 = selectedProcesses.includes('철거');
    if (has철거) return false;  // 철거 공정이 있으면 제외
  }
  
  if (condition.주방옵션) {
    const kitchenOpt = input.주방옵션 || {}
    for (const [key, val] of Object.entries(condition.주방옵션)) {
      if ((kitchenOpt as any)[key] !== val) return false
    }
  }
  
  if (condition.욕실옵션) {
    const bathroomOpt = input.욕실옵션 || {}
    for (const [key, val] of Object.entries(condition.욕실옵션)) {
      if ((bathroomOpt as any)[key] !== val) return false
    }
  }
  
  if (condition.목공옵션) {
    const woodworkOpt = input.목공옵션 || {}
    const selectedFurniture = woodworkOpt.선택가구 || []
    
    if (condition.목공옵션.선택가구) {
      const requiredFurniture = condition.목공옵션.선택가구
      if (!selectedFurniture.includes(requiredFurniture)) return false
    }
  }
  
  return true
}

/**
 * 선택된 공간의 면적 계산
 * @param totalAreaM2 전용면적 (㎡)
 * @param selectedSpaces 선택된 공간 배열
 * @param input 견적 입력 정보
 * @returns 선택된 공간의 면적 합계 (㎡)
 */
export function calculateSpaceArea(
  totalAreaM2: number,
  selectedSpaces: string[],
  input: EstimateInput
): number {
  // selectedSpaces가 없거나 빈 배열이면 전체 면적 반환
  if (!selectedSpaces || selectedSpaces.length === 0) {
    return totalAreaM2
  }
  
  // 평형대별 면적 비율 가져오기
  const ratios = getSpaceAreaRatios(totalAreaM2)
  const defaultCounts = getDefaultRoomCounts(totalAreaM2)
  
  // 방개수와 욕실개수 가져오기 (없으면 평형대별 기본값 사용)
  const 방개수 = input.방개수 || defaultCounts.방개수
  const 욕실개수 = input.욕실개수 || defaultCounts.욕실개수
  
  let totalRatio = 0
  
  for (const space of selectedSpaces) {
    const spaceCode = space as SpaceCode
    
    // kidsBedroom: 방개수에 따라 비율 분배
    if (spaceCode === 'kidsBedroom') {
      let roomRatio = ratios.kidsBedroom
      
      if (방개수 === 1) {
        // 방 1개 → kidsBedroom 비율 전체
        totalRatio += roomRatio
      } else if (방개수 === 2) {
        // 방 2개 → kidsBedroom 비율 ÷ 2 × 방개수
        totalRatio += (roomRatio / 2) * 방개수
      } else if (방개수 >= 3) {
        // 방 3개 이상 → kidsBedroom 비율 ÷ 3 × 방개수
        totalRatio += (roomRatio / 3) * 방개수
      } else {
        // 방개수가 0이면 기본값 사용
        totalRatio += roomRatio
      }
    }
    // bathroom: 욕실개수에 따라 비율 분배
    else if (spaceCode === 'bathroom') {
      let bathroomRatio = ratios.bathroom
      
      if (욕실개수 === 1) {
        // 욕실 1개 → bathroom 비율 전체
        totalRatio += bathroomRatio
      } else if (욕실개수 >= 2) {
        // 욕실 2개 이상 → bathroom 비율 ÷ 2 × 욕실개수
        totalRatio += (bathroomRatio / 2) * 욕실개수
      } else {
        // 욕실개수가 0이면 기본값 사용
        totalRatio += bathroomRatio
      }
    }
    // 기타 공간: 비율 그대로 사용
    else {
      const ratio = ratios[spaceCode]
      if (ratio !== undefined) {
        totalRatio += ratio
      }
    }
  }
  
  // 면적 계산: 전용면적 × 합산비율 / 100
  const spaceArea = totalAreaM2 * (totalRatio / 100)
  
  console.log('📐 calculateSpaceArea:', {
    totalAreaM2,
    selectedSpaces,
    방개수,
    욕실개수,
    totalRatio,
    spaceArea: Math.round(spaceArea * 10) / 10
  })
  
  return Math.round(spaceArea * 10) / 10 // 소수점 1자리
}

/**
 * 철거 면적 계산
 * 선택된 공정에서 사용하는 공간의 면적 합산
 * @param selectedProcesses 선택된 공정 목록
 * @param selectedSpaces 선택된 공간 목록
 * @param totalAreaM2 전용면적 (㎡)
 * @param input 견적 입력 정보
 * @returns 철거 면적 (㎡)
 */
function calculateDemolitionArea(
  selectedProcesses: string[],
  selectedSpaces: string[],
  totalAreaM2: number,
  input: EstimateInput
): number {
  // 사용된 공간 추출
  const usedSpaces = new Set<string>()
  
  for (const process of selectedProcesses) {
    const processSpaces = PROCESS_SPACES[process] || []
    
    if (processSpaces.includes('common')) {
      // common 공정은 모든 선택된 공간에 적용
      selectedSpaces.forEach(space => usedSpaces.add(space))
    } else {
      // 특정 공간만 사용
      processSpaces.forEach(space => {
        if (selectedSpaces.includes(space)) {
          usedSpaces.add(space)
        }
      })
    }
  }
  
  // 사용된 공간이 없으면 전체 면적 반환
  if (usedSpaces.size === 0) {
    return totalAreaM2
  }
  
  // 사용된 공간의 면적 합산
  const usedSpacesArray = Array.from(usedSpaces)
  const demolitionArea = calculateSpaceArea(totalAreaM2, usedSpacesArray, input)
  
  console.log('🔨 calculateDemolitionArea:', {
    selectedProcesses,
    usedSpaces: usedSpacesArray,
    demolitionArea: Math.round(demolitionArea * 10) / 10
  })
  
  return Math.round(demolitionArea * 10) / 10 // 소수점 1자리
}

// 수량 계산
function calculateQuantity(item: any, input: EstimateInput): number {
  if (item.수량계산) {
    const calc = item.수량계산
    let qty = 0
    
    if (calc.기준 === '평수') {
      // 새로운 면적 계산 방식 적용
      if (input.selectedSpaces && input.selectedSpaces.length > 0) {
        const totalAreaM2 = input.평수 * PYEONG_TO_M2
        const spaceAreaM2 = calculateSpaceArea(totalAreaM2, input.selectedSpaces, input)
        const spaceAreaPyeong = spaceAreaM2 / PYEONG_TO_M2
        qty = spaceAreaPyeong * (calc.계수 || 1)
      } else {
        // 기존 방식 유지 (호환성)
        qty = input.평수 * (calc.계수 || 1)
      }
    } else if (calc.기준 === '방개수') {
      qty = input.방개수 * (calc.계수 || 1)
    } else if (calc.기준 === '욕실개수') {
      qty = input.욕실개수 * (calc.계수 || 1)
    } else if (calc.기준 === '고정') {
      qty = calc.계수 || 1
    }
    
    if (calc.최소 && qty < calc.최소) qty = calc.최소
    if (calc.최대 && qty > calc.최대) qty = calc.최대
    
    return qty
  }
  
  return item.수량 || 1
}

// 공간별 필터링: 항목이 선택된 공간에 포함되는지 확인
function shouldIncludeItem(item: any, selectedSpaces: string[]): boolean {
  // item.spaces가 없거나 빈 배열이면 → true (포함)
  if (!item.spaces || item.spaces.length === 0) {
    return true
  }
  
  // item.spaces에 "common"이 포함되면 → true (포함)
  if (item.spaces.includes('common')) {
    return true
  }
  
  // item.spaces와 selectedSpaces의 교집합이 1개 이상이면 → true (포함)
  const intersection = item.spaces.filter((space: string) => selectedSpaces.includes(space))
  if (intersection.length > 0) {
    return true
  }
  
  // 그 외 → false (제외)
  return false
}

/**
 * [Phase 1 추가] 성향 기반 가격 조정
 * 고객의 성향 분석 결과를 견적에 실제로 반영합니다.
 * 
 * @param details 세부내역 배열
 * @param traits 성향 점수 (1~5)
 * @returns 조정된 세부내역 배열
 */
function applyTraitAdjustments(
  details: LineItem[],
  traits: EstimateInput['성향']
): LineItem[] {
  if (!traits) return details
  
  console.log('📊 [성향 반영] 적용 시작:', traits)
  
  return details.map(item => {
    let materialMultiplier = 1.0
    let laborMultiplier = 1.0
    let adjustmentReason = ''
    
    // 1. 정리정돈 점수 높으면 (≥4) → 수납 관련 항목 업그레이드
    if (traits.정리정돈 && traits.정리정돈 >= 4) {
      if (
        item.항목.includes('붙박이장') ||
        item.항목.includes('수납') ||
        item.항목.includes('신발장') ||
        item.항목.includes('키큰장')
      ) {
        const rate = traits.정리정돈 === 5 ? 1.25 : 1.15
        materialMultiplier *= rate
        laborMultiplier *= 1.1
        adjustmentReason += `수납 강화(정리정돈 ${traits.정리정돈}점) `
      }
    }
    
    // 2. 조명 취향 높으면 (≥4) → 조명/전기 업그레이드
    if (traits.조명취향 && traits.조명취향 >= 4) {
      if (
        item.항목.includes('조명') ||
        item.항목.includes('다운라이트') ||
        item.항목.includes('간접') ||
        item.공정 === '전기'
      ) {
        const rate = traits.조명취향 === 5 ? 1.35 : 1.20
        materialMultiplier *= rate
        laborMultiplier *= 1.15
        adjustmentReason += `조명 강화(조명취향 ${traits.조명취향}점) `
      }
    }
    
    // 3. 요리빈도 높으면 (≥4) → 주방 업그레이드
    if (traits.요리빈도 && traits.요리빈도 >= 4) {
      if (item.공정 === '주방') {
        const rate = traits.요리빈도 === 5 ? 1.30 : 1.15
        materialMultiplier *= rate
        adjustmentReason += `주방 강화(요리빈도 ${traits.요리빈도}점) `
      }
    }
    
    // 4. 청소성향 낮으면 (≤2) → 청소 쉬운 자재 (약간 가격 상승)
    if (traits.청소성향 && traits.청소성향 <= 2) {
      if (
        item.항목.includes('바닥') ||
        item.항목.includes('타일') ||
        item.항목.includes('마루')
      ) {
        materialMultiplier *= 1.10
        adjustmentReason += `청소 쉬운 자재(청소성향 ${traits.청소성향}점) `
      }
    }
    
    // 5. 예산감각 높으면 (≥4) → 프리미엄 자재 선호
    if (traits.예산감각 && traits.예산감각 >= 4) {
      if (
        item.항목.includes('상판') ||
        item.항목.includes('수전') ||
        item.항목.includes('타일')
      ) {
        const rate = traits.예산감각 === 5 ? 1.20 : 1.10
        materialMultiplier *= rate
        adjustmentReason += `프리미엄 자재(예산감각 ${traits.예산감각}점) `
      }
    }
    
    // 조정 적용
    if (materialMultiplier !== 1.0 || laborMultiplier !== 1.0) {
      const adjustedMaterial = Math.round(item.재료비 * materialMultiplier)
      const adjustedLabor = Math.round(item.노무비 * laborMultiplier)
      
      console.log(`  ✨ ${item.항목}: 재료비 ${item.재료비.toLocaleString()} → ${adjustedMaterial.toLocaleString()} (${adjustmentReason.trim()})`)
      
      return {
        ...item,
        재료비: adjustedMaterial,
        노무비: adjustedLabor,
        합계: adjustedMaterial + adjustedLabor,
      }
    }
    
    return item
  })
}

// 등급별 계산
export function calculateGrade(
  input: EstimateInput,
  processes: string[],
  grade: Grade
): GradeResult {
  const details: LineItem[] = []
  let totalMaterial = 0
  let totalLabor = 0
  
  console.log('🔍 [통합 계산기 Grade:', grade, '] 선택된 공정:', processes)
  console.log('🔍 [통합 계산기] 평수:', input.평수, '방:', input.방개수, '욕실:', input.욕실개수)
  console.log('🔍 [통합 계산기] 선택된 공간:', input.selectedSpaces)
  
  // masterData에서 세부내역 생성
  console.log('📋 calculateGrade - 처리할 공정 목록:', processes)
  console.log('📋 calculateGrade - 선택된 공간:', input.selectedSpaces)
  
  for (const processName of processes) {
    // 공정 레벨 필터링 (이중 체크)
    if (input.selectedSpaces && input.selectedSpaces.length > 0) {
      if (!shouldIncludeProcess(processName, input.selectedSpaces)) {
        console.log(`  ⏭️ 공정 제외: ${processName} (공간 미선택)`)
        continue
      }
    }
    
    console.log(`  ✅ 공정 처리 시작: ${processName}`)
    const process = (masterData.categories as any)[processName]
    if (!process) {
      console.log(`  ⚠️ 공정 데이터 없음: ${processName}`)
      continue
    }
    
    let processMaterialTotal = 0
    let processLaborTotal = 0
    
    for (const item of process.항목) {
      // 조건 체크
      if (item.조건 && !checkCondition(item.조건, input, processes)) {
        continue
      }
      
      // 공간별 필터링 (신규)
      if (input.selectedSpaces && input.selectedSpaces.length > 0) {
        if (!shouldIncludeItem(item, input.selectedSpaces)) {
          console.log(`  ⏭️ 항목 제외: ${item.항목명} (공간 미선택)`)
          continue
        }
      }
      
      // 수량 계산
      const qty = calculateQuantity(item, input)
      if (!qty || qty === 0) continue
      
      // 자재비 계산
      let materialUnit = 0
      
      if (processName === '철거') {
        materialUnit = item.재료비?.standard ?? item.재료비?.basic ?? 0
      } else if (grade === 'argen') {
        materialUnit = item.재료비?.standard ?? 0
        
        if (processName === '주방' || processName === '목공') {
          const name: string = item.항목명 ?? ''
          if (
            name.includes('싱크대') ||
            name.includes('붙박이장') ||
            name.includes('화장대') ||
            name.includes('냉장고장')
          ) {
            materialUnit = materialUnit * 1.15
          }
        }
      } else {
        materialUnit = item.재료비?.[grade] ?? item.재료비?.standard ?? 0
      }
      
      const materialTotal = materialUnit * qty
      
      // 노무비 계산 (realMasterData는 항목별 노무비 포함)
      let laborUnit = 0
      let laborTotal = 0
      
      if (item.노무비) {
        if (processName === '철거') {
          laborUnit = item.노무비?.standard ?? item.노무비?.basic ?? 0
        } else if (grade === 'argen') {
          laborUnit = item.노무비?.standard ?? 0
        } else {
          laborUnit = item.노무비?.[grade] ?? item.노무비?.standard ?? 0
        }
        
        // 타일 시공의 경우 작업일수 기반 노무비 계산
        if (item.항목명.includes('타일 시공')) {
          const 타일면적 = 16  // 욕실 1개당 바닥 4㎡ + 벽 12㎡
          const 총타일면적 = 타일면적 * input.욕실개수
          const 일일시공량 = 12  // 2인 1조 일일 시공량 12㎡
          const 작업일수 = Math.ceil(총타일면적 / 일일시공량)
          const 일당 = 600000  // 2인 1조 일당 (기공 350,000 + 조공 250,000)
          laborTotal = 작업일수 * 일당
        } else {
          laborTotal = laborUnit * qty
        }
      }
      
      totalMaterial += materialTotal
      totalLabor += laborTotal
      
      processMaterialTotal += materialTotal
      processLaborTotal += laborTotal
      
      // 브랜드/규격 설정
      let brandForGrade: string | undefined = undefined
      
      if (item.브랜드 && typeof item.브랜드 === 'object') {
        brandForGrade = item.브랜드[grade] ?? item.브랜드.standard
      } else if (typeof item.브랜드 === 'string') {
        brandForGrade = item.브랜드
      }
      
      const spec: string = item.규격 || (brandForGrade ? brandForGrade : '') || '-'
      
      // 작업정보 계산
      let 작업정보 = undefined
      if (item.작업정보) {
        let 작업기간 = Math.round(qty * 100) / 100
        
        // 타일 시공의 경우 면적 기반 작업일수 계산
        if (item.항목명.includes('타일 시공')) {
          const 타일면적 = 16  // 욕실 1개당 바닥 4㎡ + 벽 12㎡
          const 총타일면적 = 타일면적 * input.욕실개수
          const 일일시공량 = 12  // 2인 1조 일일 시공량 12㎡
          작업기간 = Math.ceil(총타일면적 / 일일시공량)  // 올림 처리
        }
        
        작업정보 = {
          작업인원: item.작업정보.작업인원,
          작업기간: 작업기간,
          작업기간단위: item.작업정보.작업기간단위,
          설명: item.작업정보.설명
        }
      }
      
      // 세부내역 추가
      details.push({
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
      })
    }
    
    console.log(`✅ [통합] ${processName} 완료 - 재료: ${Math.round(processMaterialTotal).toLocaleString()}원, 노무: ${Math.round(processLaborTotal).toLocaleString()}원`)
  }
  
  // [Phase 1 추가] 성향 기반 가격 조정 적용
  const adjustedDetails = applyTraitAdjustments(details, input.성향)
  
  // 조정 후 총계 재계산
  const adjustedMaterial = adjustedDetails.reduce((sum, item) => sum + item.재료비, 0)
  const adjustedLabor = adjustedDetails.reduce((sum, item) => sum + item.노무비, 0)
  
  // 직접공사비
  const directCost = adjustedMaterial + adjustedLabor
  
  // 간접공사비
  const indirectCostDetail = calculateAllIndirectCosts(adjustedLabor, directCost)
  
  // 총액
  const grandTotal = directCost + indirectCostDetail.총간접비
  
  return {
    세부내역: adjustedDetails,
    재료비: Math.round(adjustedMaterial),
    노무비: Math.round(adjustedLabor),
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

// 전체 견적 계산
export function calculateEstimate(input: EstimateInput) {
  console.log('🚀 calculateEstimate 시작')
  console.log('🚀 input.selectedProcesses:', input.selectedProcesses)
  console.log('🚀 input.selectedSpaces:', input.selectedSpaces)
  
  const normalizedInput: EstimateInput = {
    ...input,
    현재상태: input.현재상태 || '구축아파트',
    층수: input.층수 || 10,
    // [Phase 1 수정] 냉장고장 기본값 false로 변경 (고객이 선택해야 포함됨)
    주방옵션: input.주방옵션 || { 냉장고장: false },
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
  console.log('🚀 최종 선택된 공정 목록:', processes)
  console.log('🚀 공정 개수:', processes.length)
  
  const basic = calculateGrade(normalizedInput, processes, 'basic')
  const standard = calculateGrade(normalizedInput, processes, 'standard')
  const argen = calculateGrade(normalizedInput, processes, 'argen')
  const premium = calculateGrade(normalizedInput, processes, 'premium')
  
  console.log('🚀 calculateEstimate 완료')
  console.log('🚀 각 등급별 세부내역 개수:', {
    basic: basic.세부내역.length,
    standard: standard.세부내역.length,
    argen: argen.세부내역.length,
    premium: premium.세부내역.length,
  })
  
  return {
    basic,
    standard,
    argen,
    premium,
    recommended: 'argen' as Grade,
    selected_processes: processes
  }
}
