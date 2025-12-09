/**
 * 공간 선택 상태 관리 Store
 * - 방 개수와 욕실 개수에 따라 동적으로 공간 목록 생성
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SpaceId, SelectedSpace } from '@/types/spaceProcess'
import { getAllSpacesWithBathrooms } from '@/constants/spaces'

interface ScopeStore {
  selectedSpaces: SelectedSpace[]
  setSelectedSpaces: (spaces: SelectedSpace[]) => void
  toggleSpace: (spaceId: SpaceId) => void
  selectAllSpaces: () => void
  clearSelectedSpaces: () => void
  getSelectedSpaceIds: () => SpaceId[]
  initializeSpaces: (roomCount: number, bathroomCount?: number) => void
}

// ✅ 초기 공간 목록 생성 (방 개수 + 욕실 개수 기반)
const createInitialSpaces = (roomCount: number = 3, bathroomCount: number = 2): SelectedSpace[] => {
  const spaces = getAllSpacesWithBathrooms(roomCount, bathroomCount)
  return spaces.map(space => ({
    id: space.id,
    name: space.name,
    isSelected: false,
  }))
}

export const useScopeStore = create<ScopeStore>()(
  persist(
    (set, get) => ({
      selectedSpaces: createInitialSpaces(3, 2), // 기본 3개방, 2개 욕실

      setSelectedSpaces: (spaces) => {
        set({ selectedSpaces: spaces })
      },

      toggleSpace: (spaceId) => {
        const current = get().selectedSpaces
        const updated = current.map(space =>
          space.id === spaceId
            ? { ...space, isSelected: !space.isSelected }
            : space
        )
        set({ selectedSpaces: updated })
      },

      selectAllSpaces: () => {
        const current = get().selectedSpaces
        const updated = current.map(space => ({ ...space, isSelected: true }))
        set({ selectedSpaces: updated })
      },

      clearSelectedSpaces: () => {
        const current = get().selectedSpaces
        const updated = current.map(space => ({ ...space, isSelected: false }))
        set({ selectedSpaces: updated })
      },

      getSelectedSpaceIds: () => {
        return get().selectedSpaces
          .filter(space => space.isSelected)
          .map(space => space.id)
      },

      // ✅ 방 개수 + 욕실 개수에 따라 공간 목록 재생성
      initializeSpaces: (roomCount: number, bathroomCount: number = 2) => {
        const newSpaces = createInitialSpaces(roomCount, bathroomCount)
        console.log(`🏠 공간 초기화: 방 ${roomCount}개, 욕실 ${bathroomCount}개 → 총 ${newSpaces.length}개 공간`)
        set({ selectedSpaces: newSpaces })
      },
    }),
    {
      name: 'scope-selection-storage',
    }
  )
)
