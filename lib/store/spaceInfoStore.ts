import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BudgetRange } from '@/lib/data/budget-options'

export type HousingTypeLabel = '단독주택' | '빌라' | '아파트' | '오피스텔' | '기타'
export type ApproximateRange = '20평대' | '30평대' | '40평대' | '50평 이상'

export interface AgeGroups {
  baby: number // 0-2세
  child: number // 3-12세
  teen: number // 13-18세
  adult: number // 19-64세
  senior: number // 65세 이상
}

export interface SpecialConditions {
  hasPets: boolean
  petTypes: string[]
  hasElderly: boolean
  hasPregnant: boolean
  hasDisabledMember: boolean
  hasShiftWorker: boolean
}

export interface SpaceInfo {
  housingType: HousingTypeLabel
  pyeong: number
  squareMeter: number
  inputMethod: 'exact' | 'approximate'
  approximateRange?: ApproximateRange
  rooms: number
  bathrooms: number
  isRoomAuto: boolean
  isBathroomAuto: boolean
  // 가족 구성 정보
  ageGroups?: AgeGroups
  totalPeople?: number
  specialConditions?: SpecialConditions
  // Step1 새 구조 필드
  ageRange?: string | null // 호환성을 위해 유지 (단일 선택)
  ageRanges?: string[] // 다중 선택: ['baby', 'child', 'teen', 'adult', 'senior']
  familySizeRange?: string | null // '1-2', '2-3', '3-4', '4-5', '5+'
  lifestyleTags?: string[] // ['hasPets', 'hasElderly', ...]
  // 예산 정보
  budget?: BudgetRange // 예산 범위
  budgetAmount?: number // 직접 입력한 예산 (만원 단위)
  // 거주 목적/기간
  livingPurpose?: '실거주' | '매도준비' | '임대' | '입력안함' // 거주 목적
  livingYears?: number // 예상 거주 기간 (년)
  timestamp: string
}

interface SpaceInfoStore {
  spaceInfo: SpaceInfo | null
  setSpaceInfo: (info: Partial<SpaceInfo>) => void
  updateSpaceInfo: (updates: Partial<SpaceInfo>) => void
  clearSpaceInfo: () => void
  isValid: () => boolean
}

// 24시간 = 24 * 60 * 60 * 1000 밀리초 (사용자가 온보딩을 완료할 수 있도록 충분한 시간 제공)
const EXPIRY_TIME = 24 * 60 * 60 * 1000

// localStorage에서 데이터 유효성 검사
const isValidTimestamp = (timestamp: string): boolean => {
  const savedTime = new Date(timestamp).getTime()
  const currentTime = new Date().getTime()
  return currentTime - savedTime < EXPIRY_TIME
}

export const useSpaceInfoStore = create<SpaceInfoStore>()(
  persist(
    (set, get) => ({
      spaceInfo: null,

      setSpaceInfo: (info) => {
        const fullInfo: SpaceInfo = {
          housingType: info.housingType || '아파트',
          pyeong: info.pyeong || 0,
          squareMeter: info.squareMeter || 0,
          inputMethod: info.inputMethod || 'exact',
          approximateRange: info.approximateRange,
          rooms: info.rooms || 0,
          bathrooms: info.bathrooms || 0,
          isRoomAuto: info.isRoomAuto ?? true,
          isBathroomAuto: info.isBathroomAuto ?? true,
          ageGroups: info.ageGroups || { baby: 0, child: 0, teen: 0, adult: 0, senior: 0 },
          totalPeople: info.totalPeople || 0,
          specialConditions: info.specialConditions || {
            hasPets: false,
            petTypes: [],
            hasElderly: false,
            hasPregnant: false,
            hasDisabledMember: false,
            hasShiftWorker: false,
          },
          ageRange: info.ageRange || null,
          ageRanges: info.ageRanges || [],
          familySizeRange: info.familySizeRange || null,
          lifestyleTags: info.lifestyleTags || [],
          budget: info.budget || 'unknown',
          budgetAmount: info.budgetAmount,
          timestamp: new Date().toISOString(),
        }
        set({ spaceInfo: fullInfo })
      },

      updateSpaceInfo: (updates) => {
        const current = get().spaceInfo
        if (!current) {
          get().setSpaceInfo(updates)
          return
        }

        // ✅ 평수 업데이트 시 명시적으로 덮어쓰기 (핵심 수정!)
        const updated: SpaceInfo = {
          ...current,
          ...updates,
          // ✅ 평수가 업데이트에 포함되어 있으면 확실히 덮어쓰기
          ...(updates.pyeong !== undefined && { pyeong: updates.pyeong }),
          timestamp: new Date().toISOString(),
        }
        
        // ✅ 평수 업데이트 디버깅
        if (updates.pyeong !== undefined) {
          console.log('💾 updateSpaceInfo - 평수 업데이트:', {
            기존평수: current.pyeong,
            새평수: updates.pyeong,
            최종평수: updated.pyeong
          })
        }
        
        set({ spaceInfo: updated })
      },

      clearSpaceInfo: () => {
        set({ spaceInfo: null })
      },

      isValid: () => {
        const spaceInfo = get().spaceInfo
        if (!spaceInfo) return false
        return isValidTimestamp(spaceInfo.timestamp)
      },
    }),
    {
      name: 'space-info-storage',
      // localStorage에 저장하기 전에 유효성 검사
      partialize: (state) => {
        if (state.spaceInfo && isValidTimestamp(state.spaceInfo.timestamp)) {
          return { spaceInfo: state.spaceInfo }
        }
        return { spaceInfo: null }
      },
      // localStorage에서 복원할 때 유효성 검사
      onRehydrateStorage: () => (state) => {
        if (state?.spaceInfo && !isValidTimestamp(state.spaceInfo.timestamp)) {
          state.clearSpaceInfo()
        }
      },
    }
  )
)

