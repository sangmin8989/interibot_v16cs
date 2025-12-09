/**
 * 공정 선택 상태 관리 Store
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SpaceId, ProcessCategory } from '@/types/spaceProcess'
import { defaultProcessesBySpace } from '@/constants/process-definitions'
import type { OptionTier } from '@/types/process-options'
import { PROCESS_DEFINITIONS } from '@/constants/process-definitions'

// 공간별 공정 선택값 타입
type ProcessSelection = Record<ProcessCategory, string | string[] | null>

// 모든 공간의 공정 선택값
type SelectedProcessesBySpace = Record<SpaceId, ProcessSelection>

// 새 공정 구조용 타입 (10개 공정 + 4단 옵션)
interface TierSelection {
  enabled: boolean
  tier: OptionTier
}

interface ProcessStore {
  // === 기존 공정 선택 (호환성 유지) ===
  selectedProcessesBySpace: SelectedProcessesBySpace
  setSpaceProcessSelection: (spaceId: SpaceId, category: ProcessCategory, value: string | string[] | null) => void
  getSpaceProcessSelection: (spaceId: SpaceId) => ProcessSelection
  applyAllProcessesToAllSpaces: () => void
  applyDefaultFullScopeForSelectedSpaces: (spaceIds: SpaceId[]) => void
  getSpaceProcessCount: (spaceId: SpaceId) => number
  clearProcessesForSpace: (spaceId: SpaceId) => void
  clearAllProcesses: () => void // ✅ 모든 공정 초기화
  
  // === 새 공정 구조 (10개 공정 + 4단 옵션) ===
  tierSelections: Record<string, TierSelection>
  setTierSelection: (processId: string, selection: TierSelection) => void
  setAllTierSelections: (selections: Record<string, TierSelection>) => void
  getTierSelections: () => Record<string, TierSelection>
  clearAllTierSelections: () => void // ✅ 모든 티어 선택 초기화
}

// 빈 공정 선택값 생성
const createEmptySelection = (): ProcessSelection => ({
  wall_finish: null,
  floor_finish: null,
  door_finish: null,
  electric_lighting: null,
  options: null,
  kitchen_core: null,
  kitchen_countertop: null,
  bathroom_core: null,
  entrance_core: null,
  balcony_core: null,
})

// 새 공정 구조 초기값 생성 (모든 공정 비활성화 - 사용자가 직접 선택해야 활성화됨)
const createInitialTierSelections = (): Record<string, TierSelection> => {
  const initial: Record<string, TierSelection> = {}
  
  PROCESS_DEFINITIONS.forEach(process => {
    initial[process.id] = {
      enabled: false, // 기본값: 비활성화 (사용자가 선택해야 활성화)
      tier: 'comfort',
    }
  })
  
  return initial
}

export const useProcessStore = create<ProcessStore>()(
  persist(
    (set, get) => ({
      // === 기존 공정 선택 상태 및 액션 (호환성 유지) ===
      selectedProcessesBySpace: {} as SelectedProcessesBySpace,

      setSpaceProcessSelection: (spaceId, category, value) => {
        const current = get().selectedProcessesBySpace
        const spaceSelection = current[spaceId] || createEmptySelection()
        
        set({
          selectedProcessesBySpace: {
            ...current,
            [spaceId]: {
              ...spaceSelection,
              [category]: value,
            },
          },
        })
      },

      getSpaceProcessSelection: (spaceId) => {
        const current = get().selectedProcessesBySpace
        return current[spaceId] || createEmptySelection()
      },

      applyAllProcessesToAllSpaces: () => {
        const allSpaceIds: SpaceId[] = ['living', 'kitchen', 'masterBedroom', 'room1', 'room2', 'room3', 'room4', 'room5', 'bathroom', 'entrance', 'balcony', 'dressRoom']
        const updated: SelectedProcessesBySpace = {} as SelectedProcessesBySpace
        
        allSpaceIds.forEach(spaceId => {
          const defaults = defaultProcessesBySpace[spaceId] || {}
          updated[spaceId] = {
            ...createEmptySelection(),
            ...defaults,
          } as ProcessSelection
        })
        
        set({ selectedProcessesBySpace: updated })
      },

      applyDefaultFullScopeForSelectedSpaces: (spaceIds) => {
        const current = get().selectedProcessesBySpace
        const updated = { ...current }
        
        spaceIds.forEach(spaceId => {
          const defaults = defaultProcessesBySpace[spaceId] || {}
          updated[spaceId] = {
            ...createEmptySelection(),
            ...defaults,
          } as ProcessSelection
        })
        
        set({ selectedProcessesBySpace: updated })
      },

      getSpaceProcessCount: (spaceId) => {
        const selection = get().getSpaceProcessSelection(spaceId)
        let count = 0
        
        Object.values(selection).forEach(value => {
          if (value !== null) {
            if (Array.isArray(value)) {
              count += value.length
            } else {
              count += 1
            }
          }
        })
        
        return count
      },

      clearProcessesForSpace: (spaceId) => {
        const current = get().selectedProcessesBySpace
        const updated = { ...current }
        updated[spaceId] = createEmptySelection()
        set({ selectedProcessesBySpace: updated })
      },

      // ✅ 모든 공정 초기화
      clearAllProcesses: () => {
        set({ selectedProcessesBySpace: {} as SelectedProcessesBySpace })
      },

      // === 새 공정 구조 상태 및 액션 (10개 공정 + 4단 옵션) ===
      tierSelections: createInitialTierSelections(),

      setTierSelection: (processId, selection) => {
        const current = get().tierSelections
        set({
          tierSelections: {
            ...current,
            [processId]: selection,
          },
        })
      },

      setAllTierSelections: (selections) => {
        set({ tierSelections: selections })
      },

      getTierSelections: () => {
        return get().tierSelections
      },

      // ✅ 모든 티어 선택 초기화
      clearAllTierSelections: () => {
        set({ tierSelections: createInitialTierSelections() })
      },
    }),
    {
      name: 'process-selection-storage',
    }
  )
)
