'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getQuestionsForArea, AREA_LABELS, AreaQuestion } from '@/lib/data/areaQuestions'
import { Check } from 'lucide-react'

interface AreaAnswers {
  [areaKey: string]: {
    [questionId: string]: string | string[]
  }
}

function AreaDetailsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // URL에서 정보 가져오기
  const selectedAreas = searchParams.get('areas')?.split(',').filter(Boolean) || []
  const mode = searchParams.get('mode') || 'quick'
  const spaceInfoParams = {
    housingType: searchParams.get('housingType') || '',
    region: searchParams.get('region') || '',
    size: searchParams.get('size') || '',
    roomCount: searchParams.get('roomCount') || '',
    bathroomCount: searchParams.get('bathroomCount') || '',
  }

  const [currentAreaIndex, setCurrentAreaIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<AreaAnswers>({})

  // 디버깅 로그
  useEffect(() => {
    console.log('🔍 [Area Details] selectedAreas:', selectedAreas)
    console.log('🔍 [Area Details] mode:', mode)
    console.log('🔍 [Area Details] spaceInfoParams:', spaceInfoParams)
  }, [])

  const currentAreaKey = selectedAreas[currentAreaIndex]
  const currentAreaQuestions = currentAreaKey ? getQuestionsForArea(currentAreaKey) : []
  const currentQuestion = currentAreaQuestions[currentQuestionIndex]

  const totalAreas = selectedAreas.length
  const totalQuestionsInCurrentArea = currentAreaQuestions.length

  // 디버깅 로그
  useEffect(() => {
    console.log('🔍 [Area Details] currentAreaKey:', currentAreaKey)
    console.log('🔍 [Area Details] currentAreaQuestions:', currentAreaQuestions)
    console.log('🔍 [Area Details] currentQuestion:', currentQuestion)
  }, [currentAreaKey, currentAreaIndex, currentQuestionIndex])

  // 전체 진행률 계산
  const calculateProgress = () => {
    let totalQuestions = 0
    let answeredQuestions = 0

    selectedAreas.forEach((areaKey) => {
      const questions = getQuestionsForArea(areaKey)
      totalQuestions += questions.length
      
      const areaAnswers = answers[areaKey] || {}
      answeredQuestions += Object.keys(areaAnswers).length
    })

    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
  }

  const progress = calculateProgress()

  // 답변 처리
  const handleAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [currentAreaKey]: {
        ...(prev[currentAreaKey] || {}),
        [questionId]: value,
      },
    }))
  }

  // 옵션 선택
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return

    if (currentQuestion.type === 'single') {
      handleAnswer(currentQuestion.id, optionId)
    } else if (currentQuestion.type === 'multiple') {
      const currentAnswer = (answers[currentAreaKey]?.[currentQuestion.id] as string[]) || []
      const maxSelections = currentQuestion.maxSelections || 999

      let newAnswer: string[]
      if (currentAnswer.includes(optionId)) {
        newAnswer = currentAnswer.filter((id) => id !== optionId)
      } else if (currentAnswer.length < maxSelections) {
        newAnswer = [...currentAnswer, optionId]
      } else {
        return
      }
      
      handleAnswer(currentQuestion.id, newAnswer)
    }
  }

  // 옵션이 선택되었는지 확인
  const isOptionSelected = (optionId: string): boolean => {
    if (!currentQuestion) return false
    
    const currentAnswer = answers[currentAreaKey]?.[currentQuestion.id]
    
    if (currentQuestion.type === 'single') {
      return currentAnswer === optionId
    } else {
      return Array.isArray(currentAnswer) && currentAnswer.includes(optionId)
    }
  }

  // 현재 질문에 답변했는지 확인
  const isCurrentQuestionAnswered = (): boolean => {
    if (!currentQuestion) return false
    const answer = answers[currentAreaKey]?.[currentQuestion.id]
    
    if (currentQuestion.type === 'single') {
      return !!answer
    } else {
      return Array.isArray(answer) && answer.length > 0
    }
  }

  // 다음 버튼
  const handleNext = () => {
    if (!isCurrentQuestionAnswered()) {
      alert('답변을 선택해주세요.')
      return
    }

    // 현재 영역의 다음 질문으로
    if (currentQuestionIndex < totalQuestionsInCurrentArea - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
    // 다음 영역으로
    else if (currentAreaIndex < totalAreas - 1) {
      setCurrentAreaIndex(currentAreaIndex + 1)
      setCurrentQuestionIndex(0)
    }
    // 모든 질문 완료
    else {
      handleComplete()
    }
  }

  // 이전 버튼
  const handleBack = () => {
    // 현재 영역의 이전 질문으로
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
    // 이전 영역의 마지막 질문으로
    else if (currentAreaIndex > 0) {
      const prevAreaKey = selectedAreas[currentAreaIndex - 1]
      const prevAreaQuestions = getQuestionsForArea(prevAreaKey)
      setCurrentAreaIndex(currentAreaIndex - 1)
      setCurrentQuestionIndex(prevAreaQuestions.length - 1)
    }
    // 첫 번째 질문이면 영역 선택 페이지로
    else {
      const params = new URLSearchParams({
        mode,
        ...spaceInfoParams,
      })
      router.push(`/space-area?${params.toString()}`)
    }
  }

  // 완료 처리
  const handleComplete = () => {
    // 답변 데이터를 sessionStorage에 저장
    sessionStorage.setItem('areaDetailsAnswers', JSON.stringify(answers))
    
    console.log('✅ [Area Details] 완료! 답변:', answers)
    console.log('✅ [Area Details] 선택한 영역:', selectedAreas)
    console.log('✅ [Area Details] 답변 개수:', Object.keys(answers).length)
    
    // 영역별 세부 질문 완료 후 성향 분석 페이지로 이동
    const params = new URLSearchParams({
      mode,
      ...spaceInfoParams,
      areas: selectedAreas.join(','),
      fromAreaDetails: 'true', // 공정별 선택 완료 플래그
    })
    
    console.log('🔄 [Area Details] 성향 분석 페이지로 이동!', params.toString())
    router.push(`/analyze?${params.toString()}`)
  }

  // 선택된 영역이 없는 경우
  if (selectedAreas.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 px-6">
        <div className="text-center max-w-md">
          <p className="text-xl text-argen-700 mb-4">선택된 영역이 없습니다.</p>
          <p className="text-sm text-argen-600 mb-6">영역 선택 페이지로 돌아가서 리모델링할 공간을 선택해주세요.</p>
          <button
            onClick={() => {
              const params = new URLSearchParams({
                mode,
                ...spaceInfoParams,
              })
              router.push(`/space-area?${params.toString()}`)
            }}
            className="px-8 py-4 bg-argen-500 text-white rounded-xl hover:bg-argen-600 font-semibold"
          >
            영역 선택하러 가기
          </button>
        </div>
      </main>
    )
  }

  // 현재 질문이 없는 경우
  if (!currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 px-6">
        <div className="text-center max-w-md">
          <p className="text-xl text-argen-700 mb-4">질문을 불러올 수 없습니다.</p>
          <p className="text-sm text-argen-600 mb-2">현재 영역: {AREA_LABELS[currentAreaKey] || currentAreaKey}</p>
          <p className="text-sm text-argen-600 mb-6">이 영역에 대한 질문이 준비되지 않았습니다.</p>
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium"
            >
              이전
            </button>
            <button
              onClick={() => {
                // 다음 영역으로 건너뛰기
                if (currentAreaIndex < totalAreas - 1) {
                  setCurrentAreaIndex(currentAreaIndex + 1)
                  setCurrentQuestionIndex(0)
                } else {
                  handleComplete()
                }
              }}
              className="flex-1 px-6 py-3 bg-argen-500 text-white rounded-xl hover:bg-argen-600 font-semibold"
            >
              건너뛰기
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40">
      <div className="w-full max-w-3xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-argen-100 text-argen-700 rounded-full text-sm md:text-base font-medium mb-4">
            {AREA_LABELS[currentAreaKey] || currentAreaKey} ({currentAreaIndex + 1}/{totalAreas})
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-argen-800 mb-3">
            {currentQuestion.title}
          </h1>
          {currentQuestion.description && (
            <p className="text-base md:text-lg text-argen-700 leading-relaxed">
              {currentQuestion.description}
            </p>
          )}
        </div>

        {/* 진행 바 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm md:text-base text-argen-600 mb-2">
            <span>
              {currentAreaIndex + 1}번째 공간, {currentQuestionIndex + 1}/{totalQuestionsInCurrentArea}번 질문
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-argen-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-argen-500 to-argen-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* 질문 카드 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-argen-100 p-6 md:p-8 mb-6">
          {/* 옵션들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {currentQuestion.options.map((option) => {
              const isSelected = isOptionSelected(option.id)
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`relative p-5 md:p-6 rounded-xl border-2 transition-all text-left min-h-[80px] ${
                    isSelected
                      ? 'border-argen-500 bg-gradient-to-br from-argen-50 to-argen-100 shadow-md shadow-argen-200/50'
                      : 'border-argen-200 hover:border-argen-300 bg-white/60 hover:bg-white/80 hover:shadow-sm'
                  }`}
                >
                  {/* 선택 체크 표시 */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-argen-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 pr-8">
                    {option.icon && (
                      <span className="text-3xl md:text-4xl flex-shrink-0">{option.icon}</span>
                    )}
                    <div className="flex-1">
                      <div className={`font-semibold text-base md:text-lg mb-1 ${isSelected ? 'text-argen-800' : 'text-argen-700'}`}>
                        {option.text}
                      </div>
                      {option.description && (
                        <div className="text-sm md:text-base text-argen-600">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 복수선택 안내 */}
          {currentQuestion.type === 'multiple' && currentQuestion.maxSelections && (
            <div className="mt-4 text-center">
              <p className="text-sm md:text-base text-argen-600">
                최대 {currentQuestion.maxSelections}개 선택 가능
                {Array.isArray(answers[currentAreaKey]?.[currentQuestion.id]) && (
                  <span className="ml-2 font-semibold text-argen-700">
                    ({(answers[currentAreaKey][currentQuestion.id] as string[]).length}/{currentQuestion.maxSelections})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-4 bg-white/80 border border-argen-200 text-argen-700 rounded-xl hover:bg-argen-50 hover:border-argen-300 transition-all font-medium text-base min-h-[52px]"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered()}
            className="flex-1 px-6 py-4 bg-argen-500 text-white rounded-xl hover:bg-argen-600 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-base min-h-[52px]"
          >
            {currentAreaIndex === totalAreas - 1 && currentQuestionIndex === totalQuestionsInCurrentArea - 1
              ? '완료'
              : '다음'}
          </button>
        </div>

        {/* 영역별 진행 상태 표시 */}
        <div className="mt-8 p-4 bg-argen-50 rounded-xl">
          <p className="text-sm md:text-base text-argen-700 font-medium mb-3">공간별 진행 상황</p>
          <div className="flex flex-wrap gap-2">
            {selectedAreas.map((areaKey, index) => {
              const questions = getQuestionsForArea(areaKey)
              const areaAnswers = answers[areaKey] || {}
              const answeredCount = Object.keys(areaAnswers).length
              const isCompleted = answeredCount === questions.length
              const isCurrent = index === currentAreaIndex
              
              return (
                <div
                  key={areaKey}
                  className={`px-3 py-2 rounded-lg text-sm md:text-base ${
                    isCompleted
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : isCurrent
                        ? 'bg-argen-500 text-white font-semibold'
                        : 'bg-white text-argen-600'
                  }`}
                >
                  {AREA_LABELS[areaKey]} ({answeredCount}/{questions.length})
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function AreaDetailsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-argen-500 mx-auto mb-4"></div>
          <p className="text-argen-700">로딩 중...</p>
        </div>
      </main>
    }>
      <AreaDetailsPageContent />
    </Suspense>
  )
}

