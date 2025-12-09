/**
 * 공정 선택 데이터 정의
 * 
 * 이 파일은 Step 4에서 사용할 공정 데이터를 데이터 드리븐 방식으로 정의합니다.
 * 공정을 추가하거나 수정할 때는 이 파일만 수정하면 됩니다.
 */

import type { ProcessGroup, ProcessCategory, SpaceId } from '@/types/spaceProcess'

// ============================================================================
// 상위 공정 정의 (대부분 공간에 공통 적용)
// ============================================================================

/**
 * 벽 마감 공정 (일반 공간용)
 * 주방 제외 - 주방은 별도 정의
 */
const wallFinishProcess: ProcessGroup = {
  category: 'wall_finish',
  name: '벽 마감',
  type: 'single',
  description: '벽면 마감 방식을 선택해주세요',
  applicableSpaces: ['living', 'masterBedroom', 'room1', 'room2', 'room3', 'room4', 'room5', 'entrance', 'balcony', 'dressRoom'], // kitchen, bathroom 제외
  options: [
    { id: 'wallpaper', name: '도배', description: '실크/합지 도배' },
    { id: 'paint', name: '도장', description: '페인트 도장' },
    { id: 'film', name: '필름', description: '인테리어 필름' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

/**
 * 주방 벽 마감 공정 (타일/필름만)
 * 주방은 기름때 등으로 인해 타일이나 필름만 권장
 */
const kitchenWallFinishProcess: ProcessGroup = {
  category: 'wall_finish',
  name: '벽 마감',
  type: 'single',
  description: '주방 벽면 마감 방식을 선택해주세요',
  applicableSpaces: ['kitchen'],
  options: [
    { id: 'tile', name: '타일', description: '주방 벽타일 시공' },
    { id: 'film', name: '필름', description: '인테리어 필름' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

/**
 * 바닥 마감 공정
 * 주방 제외 - 주방은 바닥 마감 불필요
 */
const floorFinishProcess: ProcessGroup = {
  category: 'floor_finish',
  name: '바닥 마감',
  type: 'single',
  description: '바닥 마감 재료를 선택해주세요',
  applicableSpaces: ['living', 'masterBedroom', 'room1', 'room2', 'room3', 'room4', 'room5', 'entrance', 'balcony'], // kitchen, bathroom 제외
  options: [
    { id: 'engineered_wood', name: '강마루', description: '강화마루' },
    { id: 'laminate', name: '합판마루', description: '합판마루' },
    { id: 'tile', name: '타일', description: '타일 시공' },
    { id: 'vinyl', name: '장판', description: '장판 시공' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

/**
 * 문/문틀 공정
 * 대부분의 공간에 적용 가능한 문 및 문틀 처리
 */
const doorFinishProcess: ProcessGroup = {
  category: 'door_finish',
  name: '문/문틀',
  type: 'single',
  description: '문 및 문틀 처리를 선택해주세요',
  applicableSpaces: ['living', 'masterBedroom', 'room1', 'room2', 'room3', 'room4', 'room5', 'entrance', 'dressRoom'], // kitchen, bathroom 제외
  options: [
    { id: 'replace', name: '전체 교체', description: '문 및 문틀 전체 교체' },
    { id: 'film', name: '필름', description: '문 필름 시공' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

/**
 * 전기/조명 공정
 * 모든 공간에 적용 가능한 조명 방식
 */
const electricLightingProcess: ProcessGroup = {
  category: 'electric_lighting',
  name: '전기/조명',
  type: 'single',
  description: '조명 방식을 선택해주세요',
  applicableSpaces: ['living', 'kitchen', 'masterBedroom', 'room1', 'room2', 'room3', 'room4', 'room5', 'bathroom', 'masterBathroom', 'commonBathroom', 'bathroom3', 'entrance', 'dressRoom'], // 모든 공간 (욕실 분리 포함)
  options: [
    { id: 'basic', name: '기본', description: '기본 조명 설치' },
    { id: 'indirect', name: '간접조명', description: '간접조명 설치' },
    { id: 'line', name: '라인조명', description: '라인조명 설치' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

/**
 * 옵션 공정 (다중 선택)
 * 공간별로 다른 옵션들이 제공됨
 */
const optionsProcess: ProcessGroup = {
  category: 'options',
  name: '추가 옵션',
  type: 'multiple',
  description: '원하는 옵션을 선택해주세요 (복수 선택 가능)',
  applicableSpaces: ['living', 'masterBedroom', 'room1', 'room2', 'room3', 'room4', 'room5', 'entrance', 'dressRoom'], // kitchen, bathroom 제외
  options: [
    { id: 'art_wall', name: '아트월', description: '아트월 시공' },
    { id: 'molding', name: '몰딩', description: '몰딩 시공' },
    { id: 'partition', name: '중문', description: '중문 설치' },
    { id: 'system_ac', name: '시스템에어컨', description: '시스템 에어컨 설치' },
    { id: 'built_in_closet', name: '붙박이장', description: '붙박이장 설치' },
    { id: 'storage_expansion', name: '수납 확장', description: '수납 공간 확장' },
    { id: 'insulation', name: '단열', description: '단열 시공' },
    { id: 'soundproofing', name: '방음', description: '방음 시공' },
  ],
}

// ============================================================================
// 공간 전용 공정 정의
// ============================================================================

/**
 * 주방 전용 공정
 */
const kitchenCoreProcess: ProcessGroup = {
  category: 'kitchen_core',
  name: '주방 시공',
  type: 'single',
  description: '주방 공사 방식을 선택해주세요',
  applicableSpaces: ['kitchen'],
  options: [
    { id: 'full', name: '전체 리모델링', description: '싱크대+상판+수납장 모두 교체' },
    { id: 'partial', name: '부분 리모델링', description: '상판 또는 수납장 일부만 교체' },
    { id: 'film', name: '싱크대 필름만', description: '기존 싱크대 유지, 필름으로 분위기 전환 (가성비 👍)' },
    { id: 'none', name: '주방 공사 안함', description: '기존 상태 유지' },
  ],
}

/**
 * 주방 상판 공정 (조건부 표시)
 * kitchen_core가 'full' 또는 'partial'일 때만 표시됨
 */
const kitchenCountertopProcess: ProcessGroup = {
  category: 'kitchen_countertop' as ProcessCategory,
  name: '주방 상판',
  type: 'single',
  description: '주방 상판 재료를 선택해주세요',
  applicableSpaces: ['kitchen'],
  options: [
    { id: 'engineered', name: '엔지니어드스톤', description: '엔지니어드스톤 상판' },
    { id: 'ceramic', name: '세라믹', description: '세라믹 상판' },
    { id: 'artificial', name: '인조대리석', description: '인조대리석 상판' },
  ],
  // 조건부 표시: kitchen_core가 'full' 또는 'partial'일 때만 표시
  dependsOn: {
    category: 'kitchen_core',
    values: ['full', 'partial'],
  },
}

/**
 * 욕실 전용 공정 (기본 욕실 - 1개일 때)
 */
const bathroomCoreProcess: ProcessGroup = {
  category: 'bathroom_core',
  name: '욕실 시공',
  type: 'single',
  description: '욕실 공사 방식을 선택해주세요',
  applicableSpaces: ['bathroom'],
  options: [
    { id: 'full', name: '전체 리모델링', description: '욕실 전체 리모델링' },
    { id: 'partial', name: '부분 리폼', description: '욕실 부분 리폼' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

/**
 * 안방욕실 전용 공정 (욕실 2개 이상일 때)
 * 공용욕실과 동일한 실용적 옵션
 */
const masterBathroomCoreProcess: ProcessGroup = {
  category: 'bathroom_core',
  name: '안방욕실 시공',
  type: 'single',
  description: '안방욕실 공사 방식을 선택해주세요 (샤워 위주, 실용적)',
  applicableSpaces: ['masterBathroom'],
  options: [
    { id: 'full', name: '전체 리모델링', description: '타일+위생도기 포함' },
    { id: 'partial', name: '부분 리폼', description: '일부 설비만 교체' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

/**
 * 공용욕실 전용 공정 (욕실 2개 이상일 때)
 * 실용적, 샤워 위주
 */
const commonBathroomCoreProcess: ProcessGroup = {
  category: 'bathroom_core',
  name: '공용욕실 시공',
  type: 'single',
  description: '공용욕실 공사 방식을 선택해주세요 (샤워 위주, 실용적)',
  applicableSpaces: ['commonBathroom'],
  options: [
    { id: 'full', name: '전체 리모델링', description: '타일+위생도기 포함' },
    { id: 'partial', name: '부분 리폼', description: '일부 설비만 교체' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

/**
 * 욕실3 전용 공정 (욕실 3개 이상일 때)
 */
const bathroom3CoreProcess: ProcessGroup = {
  category: 'bathroom_core',
  name: '욕실3 시공',
  type: 'single',
  description: '추가 욕실 공사 방식을 선택해주세요',
  applicableSpaces: ['bathroom3'],
  options: [
    { id: 'full', name: '전체 리모델링', description: '욕실 전체 리모델링' },
    { id: 'partial', name: '부분 리폼', description: '욕실 부분 리폼' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

/**
 * 현관 전용 공정
 */
const entranceCoreProcess: ProcessGroup = {
  category: 'entrance_core',
  name: '현관 시공',
  type: 'single',
  description: '현관 공사 방식을 선택해주세요',
  applicableSpaces: ['entrance'],
  options: [
    { id: 'tile', name: '바닥 타일 교체', description: '현관 바닥 타일 교체' },
    { id: 'shoebox', name: '신발장 설치', description: '신발장 설치' },
    { id: 'film', name: '필름', description: '현관 필름 시공' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

/**
 * 베란다 전용 공정
 */
const balconyCoreProcess: ProcessGroup = {
  category: 'balcony_core',
  name: '베란다 마감',
  type: 'single',
  description: '베란다 공사 방식을 선택해주세요',
  applicableSpaces: ['balcony'],
  options: [
    { id: 'tile', name: '타일', description: '베란다 타일 시공' },
    { id: 'paint', name: '도장', description: '베란다 도장' },
    { id: 'deck', name: '데크', description: '데크 설치' },
    { id: 'none', name: '하지 않음', description: '기존 유지' },
  ],
}

// ============================================================================
// 전체 공정 그룹 배열
// ============================================================================

/**
 * 모든 공정 그룹을 포함하는 배열
 * 새로운 공정을 추가할 때는 이 배열에 추가하면 됩니다.
 */
export const PROCESS_GROUPS: ProcessGroup[] = [
  // 상위 공정 (공통)
  wallFinishProcess,
  kitchenWallFinishProcess,  // 주방 전용 벽 마감 (타일/필름만)
  floorFinishProcess,
  doorFinishProcess,
  electricLightingProcess,
  optionsProcess,
  
  // 공간 전용 공정
  kitchenCoreProcess,
  kitchenCountertopProcess,
  bathroomCoreProcess,         // 욕실 1개일 때
  masterBathroomCoreProcess,   // 안방욕실 (욕실 2개 이상)
  commonBathroomCoreProcess,   // 공용욕실 (욕실 2개 이상)
  bathroom3CoreProcess,        // 욕실3 (욕실 3개 이상)
  entranceCoreProcess,
  balconyCoreProcess,
]

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 특정 공간에 적용 가능한 공정 그룹만 필터링해서 반환
 * 
 * @param spaceId - 공간 ID
 * @param selections - 현재 선택된 공정 값들 (조건부 표시를 위해 필요)
 * @returns 해당 공간에 적용 가능한 공정 그룹 배열
 */
export function getProcessesForSpace(
  spaceId: SpaceId,
  selections?: Record<string, string | string[] | null>
): ProcessGroup[] {
  console.log('🔍 getProcessesForSpace called:', { spaceId, selections })
  
  const filtered = PROCESS_GROUPS.filter(group => {
    // 1. 해당 공간에 적용 가능한지 확인
    const isApplicable = group.applicableSpaces.includes(spaceId)
    console.log(`  - ${group.name} (${group.category}): applicable=${isApplicable}`)
    
    if (!isApplicable) {
      return false
    }
    
    // 2. 조건부 표시 확인 (dependsOn이 있는 경우)
    if (group.dependsOn && selections) {
      const dependentCategory = group.dependsOn.category
      const dependentValue = selections[dependentCategory]
      
      console.log(`    └─ dependsOn: ${dependentCategory} = ${dependentValue}`)
      
      // 단일 선택인 경우
      if (typeof dependentValue === 'string') {
        const shouldShow = group.dependsOn.values.includes(dependentValue)
        console.log(`    └─ shouldShow: ${shouldShow}`)
        return shouldShow
      }
      
      // 선택되지 않은 경우 표시하지 않음
      console.log(`    └─ shouldShow: false (no selection)`)
      return false
    }
    
    return true
  })
  
  console.log(`📋 Filtered result: ${filtered.length} processes for ${spaceId}`)
  return filtered
}

/**
 * 공간별로 적용 가능한 공정 그룹을 가져오는 함수 (기존 호환성 유지)
 * @param spaceId - 공간 ID
 * @param selections - 현재 선택된 공정 값들 (조건부 표시를 위해 필요)
 * @returns 해당 공간에 적용 가능한 공정 그룹 배열
 */
export function getProcessGroupsForSpace(
  spaceId: SpaceId,
  selections?: Record<string, string | string[] | null>
): ProcessGroup[] {
  console.log('🔍 getProcessGroupsForSpace called:', { spaceId, selections })
  const result = getProcessesForSpace(spaceId, selections)
  console.log(`📋 Found ${result.length} processes for ${spaceId}:`, result.map(g => g.name))
  return result
}

/**
 * 공간별 기본 공정 선택값
 * 전체 공정 원클릭 적용 기능에서 사용됩니다.
 */
export const defaultProcessesBySpace: Record<SpaceId, Partial<Record<ProcessCategory, string | string[] | null>>> = {
  // 거실
  living: {
    wall_finish: 'paint',
    floor_finish: 'engineered_wood',
    door_finish: 'film',
    electric_lighting: 'basic',
    options: ['art_wall', 'molding'],
  },
  
  // 주방 (바닥 마감 없음)
  kitchen: {
    kitchen_core: 'partial',
    wall_finish: 'tile',  // 주방은 타일/필름만 선택 가능
    floor_finish: null,   // 주방은 바닥 마감 없음
    electric_lighting: 'basic',
    door_finish: 'none',
    options: [],
  },
  
  // 안방
  masterBedroom: {
    wall_finish: 'wallpaper',
    floor_finish: 'engineered_wood',
    door_finish: 'film',
    electric_lighting: 'indirect',
    options: ['built_in_closet'],
  },
  
  // 룸1 (기본 방)
  room1: {
    wall_finish: 'paint',
    floor_finish: 'engineered_wood',
    door_finish: 'film',
    electric_lighting: 'basic',
    options: ['built_in_closet'],
  },
  
  // 룸2
  room2: {
    wall_finish: 'paint',
    floor_finish: 'engineered_wood',
    door_finish: 'film',
    electric_lighting: 'basic',
    options: [],
  },
  
  // 룸3
  room3: {
    wall_finish: 'paint',
    floor_finish: 'engineered_wood',
    door_finish: 'film',
    electric_lighting: 'basic',
    options: [],
  },
  
  // 룸4
  room4: {
    wall_finish: 'paint',
    floor_finish: 'engineered_wood',
    door_finish: 'film',
    electric_lighting: 'basic',
    options: [],
  },
  
  // 룸5
  room5: {
    wall_finish: 'paint',
    floor_finish: 'engineered_wood',
    door_finish: 'film',
    electric_lighting: 'basic',
    options: [],
  },
  
  // 욕실 (1개일 때)
  bathroom: {
    bathroom_core: 'full',
    // 전체 리모델링 시 wall_finish, floor_finish는 포함되므로 null
    wall_finish: null,
    floor_finish: null,
    electric_lighting: 'basic',
    door_finish: 'none',
    options: [],
  },
  
  // 안방욕실 (욕실 2개 이상일 때 - 공용욕실과 동일한 실용적 옵션)
  masterBathroom: {
    bathroom_core: 'full',
    wall_finish: null,
    floor_finish: null,
    electric_lighting: 'basic',  // 공용욕실과 동일하게 기본 조명
    door_finish: 'none',
    options: [],
  },
  
  // 공용욕실 (욕실 2개 이상일 때 - 실용적)
  commonBathroom: {
    bathroom_core: 'full',
    wall_finish: null,
    floor_finish: null,
    electric_lighting: 'basic',
    door_finish: 'none',
    options: [],
  },
  
  // 욕실3 (욕실 3개 이상일 때)
  bathroom3: {
    bathroom_core: 'partial',  // 추가 욕실은 부분 리폼 기본
    wall_finish: null,
    floor_finish: null,
    electric_lighting: 'basic',
    door_finish: 'none',
    options: [],
  },
  
  // 현관
  entrance: {
    entrance_core: 'tile',
    wall_finish: 'paint',
    floor_finish: null, // entrance_core의 tile에 포함
    electric_lighting: 'basic',
    door_finish: 'none',
    options: [],
  },
  
  // 베란다
  balcony: {
    balcony_core: 'tile',
    wall_finish: 'paint',
    floor_finish: null, // balcony_core의 tile에 포함
    electric_lighting: 'none',
    door_finish: 'none',
    options: [],
  },
  
  // 드레스룸
  dressRoom: {
    wall_finish: 'wallpaper',
    floor_finish: 'laminate',
    door_finish: 'film',
    electric_lighting: 'basic',
    options: ['built_in_closet'],
  },
}
