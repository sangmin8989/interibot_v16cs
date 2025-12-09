import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnalysisMode } from '@/lib/data/personalityQuestions'

// 문자열 ID를 지원하도록 변경 (백엔드 분석 엔진과 호환)
export interface PersonalityAnswer {
  questionId: string  // 숫자 → 문자열로 변경
  question: string
  answer: string
  isAuto: boolean
}

export interface PersonalityAnalysis {
  mode: AnalysisMode
  answers: PersonalityAnswer[]
  completedAt: string
}

export interface VibeData {
  mbti?: string
  bloodType?: string
  birthdate?: string
}

interface PersonalityStore {
  analysis: PersonalityAnalysis | null
  vibeData: VibeData | null
  setAnalysis: (analysis: PersonalityAnalysis) => void
  updateAnswer: (questionId: string, answer: PersonalityAnswer) => void
  clearAnalysis: () => void
  getAnalysisMode: () => AnalysisMode | null
  setAnalysisMode: (mode: AnalysisMode) => void
  getAnswers: () => Record<string, string>  // 숫자 → 문자열로 변경
  setAnswer: (questionId: string, value: string) => void  // 숫자 → 문자열로 변경
  resetAnalysis: () => void
  setVibeData: (data: VibeData) => void
  clearVibeData: () => void
}

export const usePersonalityStore = create<PersonalityStore>()(
  persist(
    (set, get) => ({
      analysis: null,
      vibeData: null,

      setAnalysis: (analysis) => {
        set({ analysis })
      },

      updateAnswer: (questionId, answer) => {
        const current = get().analysis
        if (!current) return

        const updatedAnswers = current.answers.filter((a) => a.questionId !== questionId)
        updatedAnswers.push(answer)
        // questionId 타입에 관계없이 안전하게 정렬
        updatedAnswers.sort((a, b) => String(a.questionId).localeCompare(String(b.questionId)))

        set({
          analysis: {
            ...current,
            answers: updatedAnswers,
          },
        })
      },

      clearAnalysis: () => {
        set({ analysis: null, vibeData: null })
      },

      getAnalysisMode: () => {
        return get().analysis?.mode || null
      },

      setAnalysisMode: (mode) => {
        const current = get().analysis
        // ✅ 모드 설정 시 항상 답변 초기화 (새로고침 히스토리 방지)
        set({
          analysis: {
            mode,
            answers: [],
            completedAt: new Date().toISOString()
          }
        })
        console.log('🔄 모드 설정 및 답변 초기화:', mode)
      },

      getAnswers: () => {
        const current = get().analysis
        if (!current) return {}
        
        // 문자열 키를 사용하는 맵 반환
        const answersMap: Record<string, string> = {}
        current.answers.forEach((a) => {
          answersMap[a.questionId] = a.answer
        })
        return answersMap
      },

      setAnswer: (questionId, value) => {
        let current = get().analysis
        
        // analysis가 없으면 새로 생성
        if (!current) {
          current = {
            mode: 'quick', // 기본 모드
            answers: [],
            completedAt: new Date().toISOString()
          }
        }

        const updatedAnswers = current.answers.filter((a) => a.questionId !== questionId)
        updatedAnswers.push({
          questionId,
          question: '',
          answer: value,
          isAuto: false
        })
        // questionId 타입에 관계없이 안전하게 정렬
        updatedAnswers.sort((a, b) => String(a.questionId).localeCompare(String(b.questionId)))

        set({
          analysis: {
            ...current,
            answers: updatedAnswers,
          },
        })
      },

      resetAnalysis: () => {
        set({ analysis: null, vibeData: null })
      },

      setVibeData: (data) => {
        set({ vibeData: data })
      },

      clearVibeData: () => {
        set({ vibeData: null })
      },
    }),
    {
      name: 'personality-analysis-storage',
    }
  )
)

export function usePersonalityData() {
  const store = usePersonalityStore()
  return {
    analysisMode: store.getAnalysisMode(),
    answers: store.getAnswers(),
    setAnalysisMode: store.setAnalysisMode,
    setAnswer: store.setAnswer,
    resetAnalysis: store.resetAnalysis,
    setVibeData: store.setVibeData,
  }
}
