import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  V5UltimateState, 
  PhotoAnalysisResult, 
  ChatMessage, 
  ChatAnalysisResult, 
  FusionAnalysisResult 
} from '@/lib/analysis/v5-ultimate/types';

interface V5UltimateStore extends V5UltimateState {
  // Actions
  initSession: () => void;
  setStep: (step: V5UltimateState['currentStep']) => void;
  setUploadedPhoto: (url: string, file: File | null) => void;
  setPhotoAnalysis: (analysis: PhotoAnalysisResult) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatAnalysis: (analysis: ChatAnalysisResult) => void;
  setFusionResult: (result: FusionAnalysisResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: V5UltimateState = {
  sessionId: null,
  currentStep: 'quickDiagnosis', // 3초 진단부터 시작
  uploadedPhoto: null,
  chatHistory: [],
  chatAnalysis: null,
  fusionResult: null,
  isLoading: false,
  error: null,
};

export const useV5UltimateStore = create<V5UltimateStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      initSession: () => {
        const sessionId = `v5_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set({ sessionId, currentStep: 'quickDiagnosis' }); // 3초 진단부터 시작
      },

      setStep: (step) => set({ currentStep: step }),

      setUploadedPhoto: (url, file) => set({ 
        uploadedPhoto: { url, file, analysis: null } 
      }),

      setPhotoAnalysis: (analysis) => set((state) => ({
        uploadedPhoto: state.uploadedPhoto 
          ? { ...state.uploadedPhoto, analysis }
          : null
      })),

      addChatMessage: (message) => set((state) => ({
        chatHistory: [...state.chatHistory, message]
      })),

      setChatAnalysis: (analysis) => set({ chatAnalysis: analysis }),

      setFusionResult: (result) => set({ fusionResult: result }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'v5-ultimate-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        currentStep: state.currentStep,
        fusionResult: state.fusionResult,
      }),
    }
  )
);




