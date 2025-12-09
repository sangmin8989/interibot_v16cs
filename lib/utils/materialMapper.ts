/**
 * 공간별 자재 매핑
 * 고객이 선택한 공간에 따라 필요한 자재만 표시
 */

export type AreaType =
  | 'living'      // 거실
  | 'kitchen'     // 주방
  | 'bathroom'    // 욕실
  | 'bedroom'     // 침실
  | 'kidsroom'    // 아이방
  | 'study'       // 서재/작업실
  | 'dressing'    // 드레스룸
  | 'veranda'     // 베란다
  | 'laundry'     // 다용도실
  | 'entrance'    // 현관
  | 'storage'     // 창고/수납
  | 'full'        // 전체 리모델링
  | 'fullhome'    // 전체 리모델링

export type MaterialType =
  | 'wall'        // 벽지
  | 'floor'       // 바닥재
  | 'tile'        // 타일
  | 'window'      // 창호
  | 'lighting'    // 조명
  | 'paint'       // 페인트
  | 'cabinet'     // 상부장/하부장
  | 'countertop'  // 상판
  | 'sink'        // 싱크대
  | 'faucet'      // 수도꼭지
  | 'mirror'      // 거울장
  | 'shower'      // 샤워부스

/**
 * 공간별 필요한 자재 매핑
 */
export const AREA_MATERIALS: Record<AreaType, MaterialType[]> = {
  // 거실: 벽지, 바닥재, 창호, 조명, 페인트
  living: ['wall', 'floor', 'window', 'lighting', 'paint'],
  
  // 주방: 타일, 창호, 조명, 상부장/하부장, 상판, 싱크대, 수도꼭지
  kitchen: ['tile', 'window', 'lighting', 'cabinet', 'countertop', 'sink', 'faucet'],
  
  // 욕실: 타일, 조명, 세면대, 거울장, 샤워부스, 수도꼭지
  bathroom: ['tile', 'lighting', 'sink', 'mirror', 'shower', 'faucet'],
  
  // 침실: 벽지, 바닥재, 창호, 조명, 페인트
  bedroom: ['wall', 'floor', 'window', 'lighting', 'paint'],
  
  // 아이방: 벽지, 바닥재, 창호, 조명, 페인트
  kidsroom: ['wall', 'floor', 'window', 'lighting', 'paint'],
  
  // 서재/작업실: 벽지, 바닥재, 창호, 조명, 페인트
  study: ['wall', 'floor', 'window', 'lighting', 'paint'],
  
  // 드레스룸: 벽지, 바닥재, 조명, 거울장
  dressing: ['wall', 'floor', 'lighting', 'mirror'],
  
  // 베란다: 타일, 창호, 조명
  veranda: ['tile', 'window', 'lighting'],
  
  // 다용도실: 타일, 조명, 페인트
  laundry: ['tile', 'lighting', 'paint'],
  
  // 현관: 벽지, 바닥재, 조명, 페인트
  entrance: ['wall', 'floor', 'lighting', 'paint'],
  
  // 창고/수납: 벽지, 바닥재, 조명, 페인트
  storage: ['wall', 'floor', 'lighting', 'paint'],
  
  // 전체 리모델링: 모든 자재
  full: ['wall', 'floor', 'tile', 'window', 'lighting', 'paint', 'cabinet', 'countertop', 'sink', 'faucet', 'mirror', 'shower'],
  fullhome: ['wall', 'floor', 'tile', 'window', 'lighting', 'paint', 'cabinet', 'countertop', 'sink', 'faucet', 'mirror', 'shower'],
}

/**
 * 자재 타입 한글명 매핑
 */
export const MATERIAL_LABELS: Record<MaterialType, string> = {
  wall: '벽지',
  floor: '바닥재',
  tile: '타일',
  window: '창호',
  lighting: '조명',
  paint: '페인트',
  cabinet: '상부장/하부장',
  countertop: '상판',
  sink: '싱크대',
  faucet: '수도꼭지',
  mirror: '거울장',
  shower: '샤워부스',
}

/**
 * 선택된 공간에 따라 필요한 자재 타입 반환
 * @param selectedAreas 선택된 영역 배열
 * @returns 필요한 자재 타입 배열 (중복 제거)
 */
export function getMaterialsByAreas(selectedAreas: AreaType[]): MaterialType[] {
  if (selectedAreas.length === 0) {
    // 영역이 없으면 전체 리모델링 자재 반환
    return AREA_MATERIALS.fullhome
  }
  
  // 전체 리모델링이 포함되어 있으면 모든 자재 반환
  if (selectedAreas.includes('full') || selectedAreas.includes('fullhome')) {
    return AREA_MATERIALS.fullhome
  }
  
  // 선택된 영역들의 자재를 합치고 중복 제거
  const allMaterials: MaterialType[] = []
  for (const area of selectedAreas) {
    const materials = AREA_MATERIALS[area] || []
    allMaterials.push(...materials)
  }
  
  // 중복 제거 및 정렬
  return Array.from(new Set(allMaterials))
}

/**
 * 자재 타입이 선택된 공간에 필요한지 확인
 */
export function isMaterialNeededForAreas(
  materialType: MaterialType,
  selectedAreas: AreaType[]
): boolean {
  const neededMaterials = getMaterialsByAreas(selectedAreas)
  return neededMaterials.includes(materialType)
}





