/**
 * 공간 및 공정 관련 타입 정의
 */

// 공간 ID 타입
export type SpaceId = 
  | 'living' 
  | 'kitchen' 
  | 'masterBedroom' 
  | 'room1'
  | 'room2'
  | 'room3'
  | 'room4'
  | 'room5'
  | 'bathroom'           // 욕실 1개일 때
  | 'masterBathroom'     // 안방욕실 (욕실 2개 이상)
  | 'commonBathroom'     // 공용욕실 (욕실 2개 이상)
  | 'bathroom3'          // 욕실3 (욕실 3개 이상)
  | 'entrance' 
  | 'balcony' 
  | 'dressRoom'

// 공정 카테고리 타입
export type ProcessCategory = 
  | 'wall_finish'
  | 'floor_finish'
  | 'door_finish'
  | 'electric_lighting'
  | 'options'
  | 'kitchen_core'
  | 'kitchen_countertop'
  | 'bathroom_core'
  | 'entrance_core'
  | 'balcony_core'

// 공정 옵션 인터페이스
export interface ProcessOption {
  id: string
  name: string
  description?: string
}

// 공정 그룹 인터페이스
export interface ProcessGroup {
  category: ProcessCategory
  name: string
  type: 'single' | 'multiple'
  description?: string
  applicableSpaces: SpaceId[]
  options: ProcessOption[]
  dependsOn?: {
    category: ProcessCategory
    values: string[]
  }
}

// 선택된 공간 정보
export interface SelectedSpace {
  id: SpaceId
  name: string
  isSelected: boolean
}
