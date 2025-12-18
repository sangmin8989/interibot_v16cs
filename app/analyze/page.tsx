'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import spaceStyleOptions from '@/lib/data/spaceStyleOptions.json'
import { isUnknownOption, handleUnknownOption } from '@/lib/utils/unknownHandler'

type AreaType = keyof typeof spaceStyleOptions

interface SpaceQuestion {
  area: AreaType
  label: string
  question: string
  options: string[]
}

function AnalyzePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') || 'quick'
  
  // 공간 정보 가져오기
  const spaceInfo = {
    housingType: searchParams.get('housingType') || 'apartment',
    region: searchParams.get('region') || 'seoul',
    size: searchParams.get('size') ? parseInt(searchParams.get('size')!, 10) : 0,
    roomCount: searchParams.get('roomCount') ? parseInt(searchParams.get('roomCount')!, 10) : undefined,
    bathroomCount: searchParams.get('bathroomCount') ? parseInt(searchParams.get('bathroomCount')!, 10) : undefined,
    areas: searchParams.get('areas')?.split(',') || [], // 선택된 영역
  }
  
  // 공간별 스타일 질문 생성
  const buildSpaceQuestions = (): SpaceQuestion[] => {
    const selectedAreas = spaceInfo.areas.length > 0 
      ? spaceInfo.areas 
      : ['fullhome'] // 영역이 없으면 전체 리모델링
    
    return selectedAreas
      .filter((area): area is AreaType => area in spaceStyleOptions)
      .map((area) => ({
        area,
        ...spaceStyleOptions[area as AreaType],
      }))
  }

  const questions = buildSpaceQuestions()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [unknownCount, setUnknownCount] = useState(0)

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  // "잘 모르겠어요" 선택 처리
  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.area]: value }
    setAnswers(newAnswers)

    // "잘 모르겠어요" 선택 시 처리
    if (isUnknownOption(value)) {
      const unknownResponse = handleUnknownOption(currentQuestion.area)
      console.log('[인테리봇] 추천 모드 활성화:', unknownResponse)
      
      // unknown 카운트 증가
      setUnknownCount((prev) => prev + 1)
      
      // 추가 질문이 필요한 경우 (현재는 로그만, 추후 구현)
      if (unknownResponse.needsAdditionalQuestions) {
        console.log('[인테리봇] 추가 질문 카테고리:', unknownResponse.additionalQuestionCategories)
      }
    }
  }

  const handleNext = () => {
    // 현재 질문에 답변이 있는지 확인
    if (!answers[currentQuestion.area]) {
      alert('답변을 선택해주세요.')
      return
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      // 첫 번째 질문에서 뒤로 가면 영역 선택 페이지로
      const params = new URLSearchParams({
        mode,
        housingType: spaceInfo.housingType,
        region: spaceInfo.region,
        size: spaceInfo.size.toString(),
        ...(spaceInfo.roomCount && { roomCount: spaceInfo.roomCount.toString() }),
        ...(spaceInfo.bathroomCount && { bathroomCount: spaceInfo.bathroomCount.toString() }),
        ...(spaceInfo.areas.length > 0 && { areas: spaceInfo.areas.join(',') }),
      })
      router.push(`/space-area?${params.toString()}`)
    }
  }

  const handleSubmit = async () => {
    setIsAnalyzing(true)
    
    try {
      // unknown 비율 계산
      const unknownRatio = unknownCount / questions.length
      const shouldRecommend = unknownRatio >= 0.5

      // 공간별 스타일 답변을 기존 형식에 맞게 변환
      const processedAnswers = {
        ...answers,
        spaceStyles: answers, // 공간별 스타일 답변
        unknownRatio,
        shouldRecommend,
      }

      const response = await fetch('/api/analyze/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode, 
          answers: processedAnswers, 
          spaceInfo,
          spaceStyles: answers, // 공간별 스타일 답변 추가
        }),
      })
  
      // 응답 상태 확인
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류가 발생했습니다.' }))
        console.error('❌ API 오류:', errorData)
        
        // 429 Quota 초과 에러 처리
        if (response.status === 429 || errorData.errorCode === 'QUOTA_EXCEEDED') {
          throw new Error(
            errorData.message || 
            'OpenAI API 사용량 한도를 초과했습니다.\n\n' +
            '현재 OpenAI API 사용량 한도에 도달했습니다. 다음 중 하나를 시도해주세요:\n' +
            '• 잠시 후 다시 시도하기\n' +
            '• OpenAI 계정의 사용량 한도 확인하기\n' +
            '• 다른 시간에 다시 시도하기'
          )
        }
        
        throw new Error(errorData.error || errorData.message || `서버 오류 (${response.status})`)
      }
  
      const data = await response.json()
      
      if (data.success) {
        // 분석 결과와 공간 정보를 sessionStorage에 저장
        const analysisData = {
          ...data.analysis,
          spaceInfo, // 공간 정보도 함께 저장
          spaceStyles: answers, // 공간별 스타일 답변 저장
        }
        
        console.log('✅ 분석 완료 - 데이터 저장:', { analysisId: data.analysisId, spaceInfo })
        sessionStorage.setItem(`analysis_${data.analysisId}`, JSON.stringify(analysisData))
        
        // 저장 확인
        const saved = sessionStorage.getItem(`analysis_${data.analysisId}`)
        console.log('✅ 저장 확인:', saved ? '성공' : '실패')
        
        // 공간 정보를 쿼리 파라미터로 전달 (영역 정보 포함)
        const params = new URLSearchParams({
          mode,
          analysisId: data.analysisId,
          housingType: spaceInfo.housingType,
          region: spaceInfo.region,
          size: spaceInfo.size.toString(),
          ...(spaceInfo.roomCount && { roomCount: spaceInfo.roomCount.toString() }),
          ...(spaceInfo.bathroomCount && { bathroomCount: spaceInfo.bathroomCount.toString() }),
          ...(spaceInfo.areas && spaceInfo.areas.length > 0 && { areas: spaceInfo.areas.join(',') }),
        })
        
        console.log('🔄 결과 페이지로 이동:', `/result?${params.toString()}`)
        
        // 성향 분석 결과 페이지로 이동 (기존 흐름 유지)
        router.push(`/result?${params.toString()}`)
      }
    } catch (error) {
      console.error('분석 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.'
      alert(`분석 오류: ${errorMessage}\n\n서버 콘솔을 확인하시거나, OpenAI API 키가 설정되어 있는지 확인해주세요.`)
      setIsAnalyzing(false)
    }
  }

  if (isAnalyzing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg md:text-xl text-gray-700">성향을 분석하고 있습니다...</p>
          {unknownCount > 0 && (
            <p className="text-sm md:text-base text-gray-500 mt-3 leading-relaxed">
              인테리봇이 추천 모드로 분석 중입니다...
            </p>
          )}
        </div>
      </main>
    )
  }

  if (questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6">
        <div className="text-center">
          <p className="text-lg md:text-xl text-gray-700 mb-6">선택된 공간이 없습니다.</p>
          <button
            onClick={() => router.push('/space-area')}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-semibold min-h-[52px]"
          >
            공간 선택하러 가기
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-2xl">
        {/* 진행 바 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm md:text-base text-gray-600 mb-2">
            <span>질문 {currentStep + 1} / {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* 질문 카드 */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-6">
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm md:text-base font-medium">
              {currentQuestion.label}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 leading-tight">
            {currentQuestion.question}
          </h2>

          {/* 선택형 질문 */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.area] === option
              const isUnknown = isUnknownOption(option)
              
              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left p-4 md:p-5 rounded-lg border-2 transition-all min-h-[56px] ${
                    isSelected
                      ? isUnknown
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base md:text-lg">{option}</span>
                    {isUnknown && (
                      <span className="text-sm px-3 py-1.5 bg-purple-100 text-purple-600 rounded-full flex-shrink-0 ml-2">
                        AI 추천
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* "잘 모르겠어요" 선택 시 안내 */}
          {isUnknownOption(answers[currentQuestion.area] || '') && (
            <div className="mt-4 p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
              <p className="text-sm md:text-base text-purple-800 leading-relaxed">
                💡 인테리봇이 고객님의 다른 답변을 기반으로 추천해드립니다.
              </p>
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-base min-h-[52px]"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.area] || isAnalyzing}
            className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base min-h-[52px] flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <span className="animate-spin text-xl">⏳</span>
                <span>분석 중...</span>
              </>
            ) : (
              currentStep < questions.length - 1 ? '다음' : '분석 시작'
            )}
          </button>
        </div>

        {/* AI 추천 모드 안내 */}
        {unknownCount > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
            <p className="text-sm md:text-base text-purple-800 text-center leading-relaxed">
              🤖 인테리봇 추천 모드 활성화: {unknownCount}개 공간에서 추천을 요청하셨습니다.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-argen-500 mx-auto mb-4"></div>
          <p className="text-argen-700">로딩 중...</p>
        </div>
      </main>
    }>
      <AnalyzePageContent />
    </Suspense>
  )
}
