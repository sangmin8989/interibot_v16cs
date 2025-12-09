/**
 * 공간 데이터 정의
 */

import type { SpaceId } from '@/types/spaceProcess'

export interface Space {
  id: SpaceId
  name: string
  icon: string
  description?: string
}

// 고정 공간 (욕실 제외 - 욕실은 동적 생성)
export const STATIC_SPACES_BASE: Space[] = [
  { id: 'living', name: '거실', icon: '🛋️', description: '거실 공간' },
  { id: 'kitchen', name: '주방', icon: '🍳', description: '주방 공간' },
  { id: 'masterBedroom', name: '안방', icon: '🛏️', description: '안방 공간' },
  // 욕실은 generateBathroomSpaces에서 동적으로 생성
  { id: 'entrance', name: '현관', icon: '🚪', description: '현관 공간' },
  { id: 'balcony', name: '베란다', icon: '🌿', description: '베란다 공간' },
  { id: 'dressRoom', name: '드레스룸', icon: '👔', description: '드레스룸 공간' },
]

// 기존 호환성을 위한 STATIC_SPACES (욕실 1개 기준)
export const STATIC_SPACES: Space[] = [
  { id: 'living', name: '거실', icon: '🛋️', description: '거실 공간' },
  { id: 'kitchen', name: '주방', icon: '🍳', description: '주방 공간' },
  { id: 'masterBedroom', name: '안방', icon: '🛏️', description: '안방 공간' },
  { id: 'bathroom', name: '욕실', icon: '🚿', description: '욕실 공간' },
  { id: 'entrance', name: '현관', icon: '🚪', description: '현관 공간' },
  { id: 'balcony', name: '베란다', icon: '🌿', description: '베란다 공간' },
  { id: 'dressRoom', name: '드레스룸', icon: '👔', description: '드레스룸 공간' },
]

// 동적으로 방 공간 생성 (방 개수에 따라)
export const generateRoomSpaces = (totalRooms: number): Space[] => {
  const rooms: Space[] = []
  
  // 안방을 제외한 나머지 방들 생성
  for (let i = 1; i < totalRooms; i++) {
    rooms.push({
      id: `room${i}` as SpaceId,
      name: `룸${i}`,
      icon: '🛏️',
      description: `${i}번째 방`
    })
  }
  
  return rooms
}

// ✅ 동적으로 욕실 공간 생성 (욕실 개수에 따라)
export const generateBathroomSpaces = (bathroomCount: number): Space[] => {
  const bathrooms: Space[] = []
  
  if (bathroomCount <= 0) {
    // 욕실 없음
    return bathrooms
  }
  
  if (bathroomCount === 1) {
    // 욕실 1개: 기존처럼 "욕실" 하나만
    bathrooms.push({
      id: 'bathroom',
      name: '욕실',
      icon: '🚿',
      description: '욕실 공간'
    })
  } else {
    // 욕실 2개 이상: 안방욕실 + 공용욕실 + (추가 욕실)
    bathrooms.push({
      id: 'masterBathroom',
      name: '안방욕실',
      icon: '🛁',
      description: '안방(마스터룸) 전용 욕실 - 샤워 위주, 실용적'
    })
    bathrooms.push({
      id: 'commonBathroom',
      name: '공용욕실',
      icon: '🚿',
      description: '가족 공용 욕실 - 샤워 위주, 실용적'
    })
    
    // 욕실 3개 이상일 경우
    if (bathroomCount >= 3) {
      bathrooms.push({
        id: 'bathroom3',
        name: '욕실3',
        icon: '🚿',
        description: '추가 욕실'
      })
    }
  }
  
  return bathrooms
}

// ✅ 전체 공간 목록 생성 (방 개수 + 욕실 개수 반영)
export const getAllSpacesWithBathrooms = (totalRooms: number, bathroomCount: number): Space[] => {
  const spaces: Space[] = []
  
  // 1. 거실, 주방, 안방 추가
  spaces.push({ id: 'living', name: '거실', icon: '🛋️', description: '거실 공간' })
  spaces.push({ id: 'kitchen', name: '주방', icon: '🍳', description: '주방 공간' })
  spaces.push({ id: 'masterBedroom', name: '안방', icon: '🛏️', description: '안방 공간' })
  
  // 2. 방 추가 (안방 제외)
  const roomSpaces = generateRoomSpaces(totalRooms)
  spaces.push(...roomSpaces)
  
  // 3. 욕실 추가 (개수에 따라 분리)
  const bathroomSpaces = generateBathroomSpaces(bathroomCount)
  spaces.push(...bathroomSpaces)
  
  // 4. 현관, 베란다, 드레스룸 추가
  spaces.push({ id: 'entrance', name: '현관', icon: '🚪', description: '현관 공간' })
  spaces.push({ id: 'balcony', name: '베란다', icon: '🌿', description: '베란다 공간' })
  spaces.push({ id: 'dressRoom', name: '드레스룸', icon: '👔', description: '드레스룸 공간' })
  
  return spaces
}

// 전체 공간 목록 생성 (기존 호환 - 욕실 2개 기준)
export const getAllSpaces = (totalRooms: number): Space[] => {
  return getAllSpacesWithBathrooms(totalRooms, 2) // 기본 욕실 2개
}

// 호환성을 위한 기본 SPACES 배열 (방 3개, 욕실 2개 기준)
export const SPACES: Space[] = getAllSpaces(3)

// 공간 이름 매핑 (욕실 분리 버전 포함)
export const SPACE_NAMES: Record<string, string> = {
  living: '거실',
  kitchen: '주방',
  masterBedroom: '안방',
  room1: '룸1',
  room2: '룸2',
  room3: '룸3',
  room4: '룸4',
  room5: '룸5',
  bathroom: '욕실',
  masterBathroom: '안방욕실',
  commonBathroom: '공용욕실',
  bathroom3: '욕실3',
  entrance: '현관',
  balcony: '베란다',
  dressRoom: '드레스룸',
}
