// 방향 선택을 관리하는 Zustand 스토어
// - 인테비티 결과를 받아 3가지 방향 옵션(A/B/C)을 생성
// - 별점/점수 없이 화살표(축) 기반 비교 데이터를 제공

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IntevityResult } from '@/lib/intevity/types';
import type { DirectionCode, DirectionOption, DirectionOptionsResult } from '@/lib/direction/types';
import { buildDirectionOptionsFromIntevity } from '@/lib/direction/builder';

const SCHEMA_VERSION = '1.0';

export interface DirectionStoreState {
  schemaVersion: string;
  generatedBy: 'RULE_ENGINE';
  options: DirectionOption[];
  profileType: string;
  profileTraits: string[];
  traitImpacts: Record<string, string>;
  selectedCode: DirectionCode | null;
  setFromIntevity: (intevity: IntevityResult | null) => void;
  select: (code: DirectionCode) => void;
  reset: () => void;
}

const initialState: Omit<DirectionStoreState, 'setFromIntevity' | 'select' | 'reset'> = {
  schemaVersion: SCHEMA_VERSION,
  generatedBy: 'RULE_ENGINE',
  options: [],
  profileType: '',
  profileTraits: [],
  traitImpacts: {},
  selectedCode: null,
};

export const useDirectionStore = create<DirectionStoreState>()(
  persist(
    (set) => ({
      ...initialState,
      setFromIntevity: (intevity) => {
        const result: DirectionOptionsResult = buildDirectionOptionsFromIntevity({ intevity });
        set({
          options: result.options,
          profileType: result.profileType,
          profileTraits: result.profileTraits,
          traitImpacts: result.traitImpacts,
          selectedCode: null,
        });
      },
      select: (code) => set({ selectedCode: code }),
      reset: () => set(initialState),
    }),
    {
      name: 'direction-store',
      version: 1,
      migrate: (persisted, version) => {
        if (!persisted || version !== 1) return initialState;
        return {
          ...initialState,
          ...persisted,
          schemaVersion: SCHEMA_VERSION,
        };
      },
    }
  )
);

