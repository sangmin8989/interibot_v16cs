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

// ✅ 헌법 적용: TierSelection 타입 제거 (tierSelections 제거)

// 공정 모드 타입 (헌법 5-2: 명시적 선택만)
export type ProcessMode = 'FULL' | 'PARTIAL'

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
  
  // ✅ 헌법 적용: 전체/부분 공정 모드 (헌법 5-2)
  processMode: ProcessMode
  setProcessMode: (mode: ProcessMode) => void
  
  // ✅ 헌법 적용: tierSelections 제거 - processSelections만 SSOT로 사용
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

// ✅ 헌법 적용: createInitialTierSelections 함수 제거

export const useProcessStore = create<ProcessStore>()(
  persist(
    (set, get) => ({
      // === 기존 공정 선택 상태 및 액션 (호환성 유지) ===
      selectedProcessesBySpace: {} as SelectedProcessesBySpace,
      
      // ✅ 헌법 적용: 전체/부분 공정 모드 (헌법 5-2: 명시적 선택만)
      processMode: 'PARTIAL' as ProcessMode, // 기본값: 부분 공정
      
      setProcessMode: (mode) => {
        set({ processMode: mode })
      },

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

      // ✅ 헌법 적용: tierSelections 제거 완료 - processSelections만 SSOT로 사용
    }),
    {
      name: 'process-selection-storage',
    }
  )
)
