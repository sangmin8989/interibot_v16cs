import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProcessId } from '@/constants/processes';

const SCHEMA_VERSION = '2.0';

export type SpaceSelection = {
  spaceId: string;
  processes: ProcessId[];
  customized: boolean;
};

export interface SpaceSelectState {
  schemaVersion: string;
  selectedSpaces: SpaceSelection[];
  additionalOptions: ProcessId[];
  estimateTotal: { min: number; max: number };
  
  // Actions
  addSpace: (spaceId: string, processes: ProcessId[]) => void;
  removeSpace: (spaceId: string) => void;
  updateSpaceProcesses: (spaceId: string, processes: ProcessId[]) => void;
  toggleAdditionalOption: (optionId: ProcessId) => void;
  updateEstimate: (min: number, max: number) => void;
  reset: () => void;
}

const initialState = {
  schemaVersion: SCHEMA_VERSION,
  selectedSpaces: [],
  additionalOptions: [],
  estimateTotal: { min: 0, max: 0 },
};

export const useSpaceSelectStore = create<SpaceSelectState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addSpace: (spaceId, processes) => {
        const current = get().selectedSpaces;
        // 중복 방지
        if (current.find(s => s.spaceId === spaceId)) return;
        
        set({
          selectedSpaces: [
            ...current,
            {
              spaceId,
              processes,
              customized: false,
            },
          ],
        });
      },
      
      removeSpace: (spaceId) => {
        set({
          selectedSpaces: get().selectedSpaces.filter(s => s.spaceId !== spaceId),
        });
      },
      
      updateSpaceProcesses: (spaceId, processes) => {
        set({
          selectedSpaces: get().selectedSpaces.map(s =>
            s.spaceId === spaceId
              ? { ...s, processes, customized: true }
              : s
          ),
        });
      },
      
      toggleAdditionalOption: (optionId) => {
        const current = get().additionalOptions;
        set({
          additionalOptions: current.includes(optionId)
            ? current.filter(id => id !== optionId)
            : [...current, optionId],
        });
      },
      
      updateEstimate: (min, max) => {
        set({ estimateTotal: { min, max } });
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'space-select-store-v2',
      version: 2,
      migrate: (persisted: any, version) => {
        if (!persisted || version !== 2) return initialState;
        return {
          ...initialState,
          ...persisted,
          schemaVersion: SCHEMA_VERSION,
        };
      },
    }
  )
);
