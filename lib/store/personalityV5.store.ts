/**
 * V5 성향분석 결과 전용 Store
 * 
 * 단일 진실 저장소 (Single Source of Truth)
 * - 페이지 생명주기 의존 ❌
 * - props 전달 ❌
 * - 전역 Store로 계약 고정 ⭕
 */

import { create } from 'zustand';
import type { PersonalityV5Result } from '@/lib/analysis/decision-impact/v5-result.types';

interface PersonalityV5State {
  /**
   * V5 성향분석 결과
   * null이면 아직 분석 완료되지 않음
   */
  v5Result: PersonalityV5Result | null;

  /**
   * V5 결과 설정
   */
  setV5Result: (result: PersonalityV5Result) => void;

  /**
   * V5 결과 초기화
   */
  clearV5Result: () => void;
}

export const usePersonalityV5Store = create<PersonalityV5State>((set, get) => ({
  v5Result: null,

  setV5Result: (result) =>
    set({
      v5Result: result,
    }),

  clearV5Result: () =>
    set({
      v5Result: null,
    }),
}));

/**
 * V5 결과 가져오기 (Store 없이 사용 가능)
 */
export function getV5Result() {
  return usePersonalityV5Store.getState().v5Result
}




