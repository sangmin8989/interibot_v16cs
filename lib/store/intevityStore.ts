import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IntevityAnswers, IntevityResult } from '@/lib/intevity/types';
import { analyzeIntevityAnswers } from '@/lib/intevity/analyzer';

const SCHEMA_VERSION = '1.0';

export interface IntevityStore {
  schemaVersion: string;
  answers: Partial<IntevityAnswers>;
  result: IntevityResult | null;
  currentQuestion: number; // 1~7
  setAnswer: (questionId: keyof IntevityAnswers, answer: IntevityAnswers[keyof IntevityAnswers]) => void;
  finalize: () => void;
  reset: () => void;
}

const initialState: Omit<IntevityStore, 'setAnswer' | 'finalize' | 'reset'> = {
  schemaVersion: SCHEMA_VERSION,
  answers: {},
  result: null,
  currentQuestion: 1,
};

export const useIntevityStore = create<IntevityStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setAnswer: (questionId, answer) =>
        set((state) => {
          const nextAnswers = { ...state.answers, [questionId]: answer };
          const nextQuestion =
            questionId === 'q7'
              ? 7
              : Math.min(7, Math.max(state.currentQuestion, Object.keys(nextAnswers).length + 1));
          return { answers: nextAnswers, currentQuestion: nextQuestion };
        }),
      finalize: () => {
        const { answers } = get();
        // 모든 답변이 있는지 검증
        const requiredKeys: (keyof IntevityAnswers)[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];
        const missing = requiredKeys.filter((k) => answers[k] === undefined);
        if (missing.length > 0) {
          throw new Error(`답변이 누락되었습니다: ${missing.join(', ')}`);
        }
        const fullAnswers = answers as IntevityAnswers;
        const result = analyzeIntevityAnswers(fullAnswers);
        set({ result });
      },
      reset: () => set(initialState),
    }),
    {
      name: 'intevity-storage',
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        answers: state.answers,
        result: state.result,
        currentQuestion: state.currentQuestion,
      }),
      version: 1,
      migrate: (persistedState: any) => {
        if (!persistedState || persistedState.schemaVersion !== SCHEMA_VERSION) {
          return initialState;
        }
        return persistedState as IntevityStore;
      },
    }
  )
);

