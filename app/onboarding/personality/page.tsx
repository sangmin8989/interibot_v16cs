'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { modeConfigs, type AnalysisMode, type Question } from '@/lib/data/personalityQuestions'
import { usePersonalityStore } from '@/lib/store/personalityStore'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'  // spaceInfo 추가
import MBTISelector from '@/components/onboarding/vibe/MBTISelector'
import BloodTypeSelector from '@/components/onboarding/vibe/BloodTypeSelector'
import ZodiacInput from '@/components/onboarding/vibe/ZodiacInput'
import StepIndicator, { DEFAULT_STEPS } from '@/components/onboarding/StepIndicator'

type ViewMode = 'select' | 'vibe' | 'question'

function PersonalityContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // ✅ 직접 Zustand store 사용 (상태 변경 감지를 위해)
  const storedMode = usePersonalityStore((state) => state.analysis?.mode)
  const storedAnswers = usePersonalityStore((state) => state.analysis?.answers)
  const setAnalysisMode = usePersonalityStore((state) => state.setAnalysisMode)
  const setAnswerToStore = usePersonalityStore((state) => state.setAnswer)
  const resetAnalysis = usePersonalityStore((state) => state.resetAnalysis)
  const setVibeData = usePersonalityStore((state) => state.setVibeData)
  const { spaceInfo } = useSpaceInfoStore()  // spaceInfo 가져오기
  
  // ✅ 로컬 상태로 answers 관리 (즉각적인 UI 반응 보장)
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({})
  
  // ✅ Zustand 상태가 변경되면 로컬 상태와 동기화
  useEffect(() => {
    if (storedAnswers && storedAnswers.length > 0) {
      const answersMap: Record<string, string> = {}
      storedAnswers.forEach((a) => {
        answersMap[a.questionId] = a.answer
      })
      setLocalAnswers(answersMap)
    }
  }, [storedAnswers])
  
  // ✅ 실제 사용할 answers (로컬 상태 기반)
  const answers = localAnswers
  
  const [viewMode, setViewMode] = useState<ViewMode>('select')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedMode, setSelectedMode] = useState<AnalysisMode | null>(null)
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
  const [isClient, setIsClient] = useState(false) // 클라이언트 렌더링 확인
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false) // AI 질문 로딩 상태
  const [loadingProgress, setLoadingProgress] = useState(0) // 로딩 진행률 (0-100)

  // Vibe 모드 전용 상태
  const [mbti, setMbti] = useState<string | null>(null)
  const [bloodType, setBloodType] = useState<string | null>(null)
  const [birthdate, setBirthdate] = useState('')

  // 클라이언트 렌더링 확인
  useEffect(() => {
    setIsClient(true)
  }, [])

  // ✅ AI 질문 로드 함수 (NEW!) - 진행률 표시 포함
  const loadAIQuestions = async (mode: AnalysisMode) => {
    if (!spaceInfo) {
      console.error('⚠️ 집 정보가 없습니다.')
      // 폴백: 기존 고정 질문 사용
      const config = modeConfigs.find(m => m.id === mode)
      if (config && config.questions.length > 0) {
        setCurrentQuestions(config.questions)
        setCurrentQuestionIndex(0)
        setViewMode('question')
      }
      return
    }

    try {
      setIsLoadingQuestions(true)
      setLoadingProgress(0)
      console.log('🤖 AI 질문 로드 시작:', { mode, pyeong: spaceInfo.pyeong })
      
      // 진행률 시뮬레이션 (초기 단계)
      setLoadingProgress(20)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setLoadingProgress(40)
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          spaceInfo,
        }),
      })

      setLoadingProgress(70)
      await new Promise(resolve => setTimeout(resolve, 200))

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '질문 로드 실패')
      }

      setLoadingProgress(90)
      const data = await response.json()
      
      if (data.success && data.questions && data.questions.length > 0) {
        setLoadingProgress(100)
        await new Promise(resolve => setTimeout(resolve, 200))
        
        setCurrentQuestions(data.questions)
        setCurrentQuestionIndex(0)
        setViewMode('question')
        console.log(`✅ AI가 ${data.questions.length}개 질문 선택 완료 (모드: ${mode})`)
        console.log('💡 선택 이유:', data.reason)
      } else {
        throw new Error('AI 질문 생성 실패')
      }
    } catch (error: any) {
      console.error('❌ AI 질문 로드 오류:', error)
      // 폴백: 기존 고정 질문 사용
      console.warn('⚠️ 기존 질문으로 진행합니다')
      setLoadingProgress(100)
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const config = modeConfigs.find(m => m.id === mode)
      if (config && config.questions.length > 0) {
        setCurrentQuestions(config.questions)
        setCurrentQuestionIndex(0)
        setViewMode('question')
      }
    } finally {
      setIsLoadingQuestions(false)
      setLoadingProgress(0)
    }
  }

  // ✅ 저장된 모드 또는 쿼리 파라미터로 자동 시작
  useEffect(() => {
    if (!isClient) return // 클라이언트에서만 실행
    
    const modeFromQuery = searchParams.get('mode') as AnalysisMode | null
    // ✅ URL 쿼리 또는 Store에 저장된 모드 사용 (첫 페이지에서 선택한 모드)
    // ✅ 모드가 없으면 기본 모드('quick')로 자동 설정
    const effectiveMode = modeFromQuery || storedMode || 'quick'

    console.log('🔍 성향분석 페이지 - 모드 확인:', { modeFromQuery, storedMode, effectiveMode })

    const validMode = modeConfigs.find(m => m.id === effectiveMode)
    if (validMode) {
      setSelectedMode(effectiveMode)
      setAnalysisMode(effectiveMode) // 이미 store에서 답변 초기화됨
      setLocalAnswers({}) // ✅ 로컬 상태도 초기화 (NEW!)
      
      // ✅ 모드에 따라 자동 분기
      if (effectiveMode === 'vibe') {
        // Vibe 모드: MBTI/혈액형/별자리 입력 화면으로
        setMbti(null)
        setBloodType(null)
        setBirthdate('')
        setViewMode('vibe')
        console.log('🎨 Vibe 모드 - MBTI/혈액형/별자리 입력 화면')
      } else {
        // ✅ AI 질문 로드 (NEW!)
        loadAIQuestions(effectiveMode)
      }
    }
  }, [searchParams, isClient, storedMode, setAnalysisMode])

  // 모드 선택 후 자동으로 질문 로딩
  const handleModeSelect = useCallback((mode: AnalysisMode) => {
    setSelectedMode(mode)
    setAnalysisMode(mode)
    loadAIQuestions(mode) // 질문 로드
  }, [setAnalysisMode, loadAIQuestions])

  const handleStartAnalysis = () => {
    if (!selectedMode) return

    // 질문 인덱스 초기화
    setCurrentQuestionIndex(0)
    
    // 모드 먼저 설정 (analysis 객체 생성)
    setAnalysisMode(selectedMode) // 이미 store에서 답변 초기화됨
    setLocalAnswers({}) // ✅ 로컬 상태도 초기화 (NEW!)

    if (selectedMode === 'vibe') {
      // Vibe 모드는 상태 초기화
      setMbti(null)
      setBloodType(null)
      setBirthdate('')
      setViewMode('vibe')
    } else {
      // ✅ AI 질문 로드 (NEW!)
      loadAIQuestions(selectedMode)
    }
  }

  // Vibe 모드 - MBTI/혈액형/별자리 입력 완료 → 7개 질문으로 이동
  const handleVibeComplete = () => {
    // Vibe 데이터 저장
    setVibeData({
      mbti: mbti || undefined,
      bloodType: bloodType || undefined,
      birthdate: birthdate || undefined
    })
    
    // ✅ AI 질문 로드 (NEW!)
    loadAIQuestions('vibe')
  }

  const currentQuestion = currentQuestions[currentQuestionIndex]

  // 디버깅: 현재 상태 출력
  useEffect(() => {
    console.log('📊 현재 상태:', {
      viewMode,
      selectedMode,
      currentQuestionIndex,
      totalQuestions: currentQuestions.length,
      hasCurrentQuestion: !!currentQuestion,
      answersCount: Object.keys(answers).length,
      hasSpaceInfo: !!spaceInfo
    })
  }, [viewMode, selectedMode, currentQuestionIndex, currentQuestions.length, currentQuestion, answers, spaceInfo])

  // 답변 선택 시 value를 저장 (text 대신)
  // ✅ 로컬 상태 + Zustand 동시 업데이트 (즉각적 UI 반응)
  const handleAnswerSelect = useCallback((questionId: string, value: string) => {
    console.log('✅ 답변 선택:', questionId, '=', value)
    // 로컬 상태 즉시 업데이트 (UI 반응)
    setLocalAnswers(prev => ({ ...prev, [questionId]: value }))
    // Zustand store에도 저장 (영속성)
    setAnswerToStore(questionId, value)
  }, [setAnswerToStore])

  const handleNext = async () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // 마지막 질문 완료 - AI 분석 실행
      try {
        // spaceInfo를 API가 기대하는 형식으로 변환
        const spaceInfoPayload = spaceInfo ? {
          housingType: spaceInfo.housingType,
          pyeong: spaceInfo.pyeong,
          squareMeter: spaceInfo.squareMeter,
          rooms: spaceInfo.rooms,
          bathrooms: spaceInfo.bathrooms,
          // 가족 구성 정보
          familySizeRange: spaceInfo.familySizeRange,
          ageRanges: spaceInfo.ageRanges,
          lifestyleTags: spaceInfo.lifestyleTags,
          totalPeople: spaceInfo.totalPeople,
        } : null

        console.log('📤 API 전송 데이터:', {
          mode: selectedMode,
          answers,
          spaceInfo: spaceInfoPayload,
          vibeInput: selectedMode === 'vibe' ? { mbti, bloodType, birthdate } : null
        })

        const response = await fetch('/api/analysis/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: selectedMode,
            answers: answers,  // 이제 문자열 ID를 키로 사용
            spaceInfo: spaceInfoPayload,  // spaceInfo 추가!
            vibeInput: selectedMode === 'vibe' ? {
              mbti: mbti,
              bloodType: bloodType,
              birthdate: birthdate
            } : null
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ AI 분석 완료:', result)
          // 분석 결과는 API에서 자동으로 Store에 저장됨
        } else {
          const errorData = await response.json()
          console.error('❌ AI 분석 실패:', errorData)
        }
      } catch (error) {
        console.error('❌ AI 분석 오류:', error)
      }
      
      // ✅ 새 플로우: 세부옵션 → 성향분석 → AI 분석 → 견적
      router.push('/onboarding/ai-recommendation')
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else {
      // 첫 번째 질문에서 이전 버튼 클릭 시
      if (selectedMode === 'vibe') {
        // Vibe 모드: MBTI 입력 화면으로 돌아가기
        setViewMode('vibe')
        setCurrentQuestionIndex(0)
        setCurrentQuestions([])
      } else {
        // 다른 모드: 이전 페이지로 이동 (모드 선택 화면 제거됨)
        router.push('/space-info')
      }
    }
  }

  const handleVibeBack = () => {
    // Vibe 모드에서 이전 버튼 클릭 시 이전 페이지로 이동 (모드 선택 화면 제거됨)
    router.push('/space-info')
    setMbti(null)
    setBloodType(null)
    setBirthdate('')
    // resetAnalysis는 호출하지 않음
  }

  const isAnswered = currentQuestion ? !!answers[currentQuestion.id] : false
  const progress = currentQuestions.length > 0 
    ? ((currentQuestionIndex + 1) / currentQuestions.length) * 100 
    : 0

  // ✅ 모드 선택 화면 제거됨 - 모드가 없으면 기본 모드('quick')로 자동 진행

  // Vibe 모드 화면
  if (viewMode === 'vibe') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-argen-50 via-white to-roseSoft/30">
        {/* 새 플로우: 성향 분석은 3단계 */}
        <StepIndicator currentStep={3} steps={DEFAULT_STEPS} />
        
        <div className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            {/* 헤더 */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🎨 분위기로 모드
              </h1>
              <p className="text-lg text-gray-600">
                MBTI, 혈액형, 별자리를 통해 나만의 인테리어 스타일을 찾아보세요
              </p>
            </div>  {/* 헤더 div 닫기 */}

            {/* 컨텐츠 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
              <MBTISelector value={mbti} onChange={setMbti} />
              
              <div className="border-t border-gray-200"></div>
              
              <BloodTypeSelector value={bloodType} onChange={setBloodType} />
              
              <div className="border-t border-gray-200"></div>
              
              <ZodiacInput value={birthdate} onChange={setBirthdate} />
            </div>

            {/* 네비게이션 */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleVibeBack}
                className="px-8 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl
                           hover:bg-gray-300 transition-colors"
              >
                ← 이전
              </button>
              <button
                onClick={handleVibeComplete}
                className="flex-1 py-4 bg-argen-500 text-white font-semibold rounded-xl
                           hover:bg-argen-600 transition-colors"
              >
                나답게 질문 시작 →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ AI 질문 로딩 화면 (NEW!) - 진행률 표시 포함
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-argen-50 via-white to-argen-50">
        <StepIndicator currentStep={3} steps={DEFAULT_STEPS} />
        <div className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-argen-500 mx-auto mb-4"></div>
              <p className="text-xl font-medium text-gray-700 mb-2">
                🤖 맞춤형 질문을 준비하고 있어요...
              </p>
              <p className="text-sm text-gray-500 mb-6">
                집 정보를 분석해서 가장 적합한 질문을 선택하고 있습니다
              </p>
              
              {/* 진행률 바 */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>질문 생성 중</span>
                  <span>{loadingProgress}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-argen-500 to-purple-500 transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {loadingProgress < 30 && '집 정보 분석 중...'}
                  {loadingProgress >= 30 && loadingProgress < 70 && 'AI가 질문을 생성하고 있어요...'}
                  {loadingProgress >= 70 && loadingProgress < 100 && '질문을 정리하고 있어요...'}
                  {loadingProgress === 100 && '거의 완료되었어요!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 질문 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-argen-50 via-white to-argen-50">
      {/* 새 플로우: 성향 분석은 3단계 */}
      <StepIndicator currentStep={3} steps={DEFAULT_STEPS} />
      
      <div className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* 진행률 */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{selectedMode && modeConfigs.find(m => m.id === selectedMode)?.name}</span>
              <span>{currentQuestionIndex + 1} / {currentQuestions.length}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-argen-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 질문 */}
          {currentQuestion ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                {currentQuestion.text}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  // value를 기준으로 선택 여부 확인
                  const isSelected = answers[currentQuestion.id] === option.value
                  
                  return (
                    <button
                      key={option.id || index}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option.value)}
                      className={`
                        w-full p-5 rounded-xl text-left transition-all duration-200
                        ${isSelected
                          ? 'bg-argen-500 text-white shadow-lg scale-102'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* 아이콘 표시 */}
                        {option.icon && (
                          <span className="text-2xl">{option.icon}</span>
                        )}
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                          ${isSelected ? 'border-white' : 'border-gray-300'}
                        `}>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                        <span className="flex-1 font-medium">{option.text}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
              <p className="text-gray-600">질문을 불러오는 중...</p>
              {currentQuestions.length === 0 && (
                <button
                  onClick={() => router.push('/space-info')}
                  className="mt-4 px-6 py-2 bg-argen-500 text-white rounded-lg hover:bg-argen-600"
                >
                  이전 페이지로 돌아가기
                </button>
              )}
            </div>
          )}

          {/* 네비게이션 */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              className="px-8 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl
                         hover:bg-gray-300 transition-colors"
            >
              ← 이전
            </button>
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className="flex-1 py-4 bg-argen-500 text-white font-semibold rounded-xl
                         hover:bg-argen-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-colors"
            >
              {currentQuestionIndex === currentQuestions.length - 1 ? '완료 →' : '다음 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PersonalityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PersonalityContent />
    </Suspense>
  )
}
