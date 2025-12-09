/**
 * 영역 선택 → 공정 코드 매핑
 * 고객이 선택한 영역에 따라 기본 공정을 자동 매핑
 */

export type AreaType =
  | 'living'      // 거실
  | 'kitchen'     // 주방
  | 'bathroom'    // 욕실
  | 'bedroom'     // 침실
  | 'balcony'     // 베란다
  | 'utility'     // 다용도실
  | 'dressing'    // 드레스룸
  | 'study'       // 서재/작업실
  | 'kids'        // 아이방
  | 'storage'     // 창고/수납공간
  | 'full'        // 전체 리모델링
  | 'fullhome'    // 전체 리모델링 (별칭)

/**
 * 공정 코드 정의
 */
export const PROCESS_CODES = {
  KITCHEN: '100',        // 주방/다용도실 공사
  CARPENTRY: '200',      // 목공사/가구공사
  ELECTRICAL: '300',     // 전기/통신공사
  BATHROOM: '400',       // 욕실/수전공사
  TILE: '500',           // 타일/석재공사
  PAINT: '600',          // 도장/마감공사
  FILM: '700',           // 필름/시트공사
  WINDOW: '800',         // 창호/샤시공사
  WALLPAPER: '900',      // 도배/벽지공사
  DEMOLITION: '1000',    // 철거/폐기공사
} as const

/**
 * 영역별 기본 공정 매핑
 * ⚠️ 중요: 이 매핑은 "사용 가능한 공정"을 제안하는 용도입니다.
 * 실제 선택은 사용자가 직접 해야 하며, 자동으로 다른 공정이 추가되지 않습니다.
 */
const AREA_TO_PROCESSES: Record<AreaType, string[]> = {
  // 주방: 주방 공사만 (타일은 주방 공정에 포함, 철거는 별도 선택)
  kitchen: [
    PROCESS_CODES.KITCHEN,    // 주방/다용도실 (주방 벽타일 포함)
  ],
  
  // 욕실: 욕실 공사만 (타일은 욕실 공정에 포함, 철거는 별도 선택)
  bathroom: [
    PROCESS_CODES.BATHROOM,   // 욕실/수전 (욕실 타일 포함)
  ],
  
  // 거실: 거실 관련 공정만 (철거는 별도 선택)
  living: [
    PROCESS_CODES.CARPENTRY,  // 목공 (TV장, 수납장 등)
    PROCESS_CODES.PAINT,      // 도장
    PROCESS_CODES.FILM,       // 필름
    PROCESS_CODES.WINDOW,     // 창호
    PROCESS_CODES.WALLPAPER,  // 도배
  ],
  
  // 침실: 침실 관련 공정만 (철거는 별도 선택)
  bedroom: [
    PROCESS_CODES.CARPENTRY,  // 목공 (붙박이장, 화장대 등)
    PROCESS_CODES.WALLPAPER,  // 도배
  ],
  
  // 베란다: 베란다 관련 공정만 (철거는 별도 선택)
  balcony: [
    PROCESS_CODES.TILE,       // 타일
    PROCESS_CODES.WINDOW,     // 창호
  ],
  
  // 다용도실: 다용도실 관련 공정만 (철거는 별도 선택)
  utility: [
    PROCESS_CODES.KITCHEN,    // 주방/다용도실 (팬트리 등)
    PROCESS_CODES.CARPENTRY,  // 목공
    PROCESS_CODES.TILE,       // 타일
  ],
  
  // 드레스룸: 드레스룸 관련 공정만 (철거는 별도 선택)
  dressing: [
    PROCESS_CODES.CARPENTRY,  // 목공 (드레스룸장)
    PROCESS_CODES.WALLPAPER,  // 도배
  ],
  
  // 서재/작업실: 서재 관련 공정만 (철거는 별도 선택)
  study: [
    PROCESS_CODES.CARPENTRY,  // 목공 (책상, 수납장)
    PROCESS_CODES.WALLPAPER,  // 도배
  ],
  
  // 아이방: 아이방 관련 공정만 (철거는 별도 선택)
  kids: [
    PROCESS_CODES.CARPENTRY,  // 목공 (책상, 수납장)
    PROCESS_CODES.WALLPAPER,  // 도배
  ],
  
  // 창고/수납공간: 수납 관련 공정만 (철거는 별도 선택)
  storage: [
    PROCESS_CODES.CARPENTRY,  // 목공 (수납장)
  ],
  
  // 전체 리모델링: 모든 공정
  full: [
    PROCESS_CODES.KITCHEN,
    PROCESS_CODES.CARPENTRY,
    PROCESS_CODES.ELECTRICAL,
    PROCESS_CODES.BATHROOM,
    PROCESS_CODES.TILE,
    PROCESS_CODES.PAINT,
    PROCESS_CODES.FILM,
    PROCESS_CODES.WINDOW,
    PROCESS_CODES.WALLPAPER,
    PROCESS_CODES.DEMOLITION,
  ],
  // 전체 리모델링 (fullhome): 모든 공정
  fullhome: [
    PROCESS_CODES.KITCHEN,
    PROCESS_CODES.CARPENTRY,
    PROCESS_CODES.ELECTRICAL,
    PROCESS_CODES.BATHROOM,
    PROCESS_CODES.TILE,
    PROCESS_CODES.PAINT,
    PROCESS_CODES.FILM,
    PROCESS_CODES.WINDOW,
    PROCESS_CODES.WALLPAPER,
    PROCESS_CODES.DEMOLITION,
  ],
}

/**
 * 선택된 영역에 따라 기본 공정 코드 반환
 * @param selectedAreas 선택된 영역 배열
 * @returns 공정 코드 배열 (중복 제거)
 */
export function getDefaultProcessesByAreas(selectedAreas: AreaType[]): string[] {
  if (selectedAreas.length === 0) {
    // 영역이 없으면 전체 공정 반환
    return AREA_TO_PROCESSES.full
  }
  
  // 전체 리모델링이 포함되어 있으면 모든 공정 반환
  if (selectedAreas.includes('full') || selectedAreas.includes('fullhome')) {
    return AREA_TO_PROCESSES.fullhome || AREA_TO_PROCESSES.full
  }
  
  // 선택된 영역들의 공정을 합치고 중복 제거
  const allProcesses: string[] = []
  for (const area of selectedAreas) {
    const processes = AREA_TO_PROCESSES[area] || []
    allProcesses.push(...processes)
  }
  
  // 중복 제거 및 정렬
  return Array.from(new Set(allProcesses)).sort()
}

/**
 * 영역 이름을 한글로 변환
 */
export function getAreaLabel(area: AreaType): string {
  const labels: Record<AreaType, string> = {
    living: '거실',
    kitchen: '주방',
    bathroom: '욕실',
    bedroom: '침실',
    balcony: '베란다',
    utility: '다용도실',
    dressing: '드레스룸',
    study: '서재/작업실',
    kids: '아이방',
    storage: '창고/수납공간',
    full: '전체 리모델링',
    fullhome: '전체 리모델링',
  }
  return labels[area] || area
}

