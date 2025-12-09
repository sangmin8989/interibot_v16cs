'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const FRAMEWORK_OPTIONS = [
  { 
    id: 'mbti', 
    label: 'MBTI', 
    icon: '🧩', 
    description: '16가지 성격 유형으로 나를 이해합니다'
  },
  { 
    id: 'blood', 
    label: '혈액형', 
    icon: '🩸', 
    description: 'A, B, O, AB형으로 성향을 파악합니다'
  },
  { 
    id: 'zodiac', 
    label: '별자리', 
    icon: '⭐', 
    description: '12별자리로 나의 특성을 알아봅니다'
  },
  { 
    id: 'ai', 
    label: '이런 성향 지표는 잘 안 봐요. 대신 AI가 행동 패턴으로 해석합니다', 
    icon: '🤖', 
    description: 'AI가 질문을 통해 성향을 분석합니다'
  },
]

function VibeFrameworkPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([])

  const toggleFramework = (id: string) => {
    setSelectedFrameworks((prev) => {
      if (prev.includes(id)) {
        return prev.filter((f) => f !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleNext = () => {
    if (selectedFrameworks.length === 0) {
      alert('최소 1개 이상 선택해주세요.')
      return
    }

    // 선택한 프레임워크 저장
    sessionStorage.setItem('selectedFrameworks', JSON.stringify(selectedFrameworks))

    // AI만 선택한 경우 바로 질문으로
    if (selectedFrameworks.length === 1 && selectedFrameworks.includes('ai')) {
      router.push('/analysis/vibe')
      return
    }

    // MBTI/혈액형/별자리 선택한 경우 키워드 선택 페이지로
    const params = new URLSearchParams(searchParams.toString())
    router.push(`/vibe-profile?${params.toString()}`)
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold">
              INTERIBOT VIBE MODE
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            본인이 평소에 성격·성향을 볼 때,
            <br />
            가장 "나랑 맞다"고 느끼는 기준은 무엇인가요?
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            여러 개 선택 가능합니다 (선택사항)
          </p>
          <p className="text-sm text-purple-600 font-medium">
            선택한 개수: {selectedFrameworks.length}/3
          </p>
        </div>

        {/* 프레임워크 선택 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {FRAMEWORK_OPTIONS.map((option) => {
            const isSelected = selectedFrameworks.includes(option.id)
            const isAI = option.id === 'ai'
            
            return (
              <button
                key={option.id}
                onClick={() => toggleFramework(option.id)}
                className={`p-8 rounded-2xl border-3 transition-all text-left ${
                  isSelected
                    ? isAI
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-xl scale-105'
                      : 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100 shadow-xl scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                } ${isAI ? 'md:col-span-2' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-5xl ${isSelected ? 'animate-bounce' : ''}`}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {option.label}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {option.description}
                    </p>
                    {isSelected && (
                      <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                        isAI ? 'bg-purple-500 text-white' : 'bg-pink-500 text-white'
                      }`}>
                        <span>✓</span>
                        <span>선택됨</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 선택 요약 */}
        {selectedFrameworks.length > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-8 border-2 border-purple-200 shadow-lg">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <span>🎯</span>
              <span>선택한 분석 방법 ({selectedFrameworks.length}개)</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {selectedFrameworks.map((id) => {
                const option = FRAMEWORK_OPTIONS.find((o) => o.id === id)
                return (
                  <span
                    key={id}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    <span>{option?.icon}</span>
                    <span>{option?.label}</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-8 border border-purple-200">
          <p className="text-gray-800 leading-relaxed">
            <span className="font-bold text-purple-700">💡 TIP:</span> MBTI, 혈액형, 별자리를 선택하시면 다음 페이지에서 구체적인 유형을 선택할 수 있습니다. 
            AI 분석만 선택하시면 바로 질문으로 넘어갑니다.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-4 flex-col md:flex-row">
          <button
            onClick={handleBack}
            className="flex-1 px-8 py-4 rounded-xl font-bold text-lg bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={selectedFrameworks.length === 0}
            className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              selectedFrameworks.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
            }`}
          >
            {selectedFrameworks.includes('ai') && selectedFrameworks.length === 1
              ? '질문 시작하기'
              : '다음 단계로'}
          </button>
        </div>
      </div>
    </main>
  )
}

export default function VibeFrameworkPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-700">로딩 중...</p>
        </div>
      </main>
    }>
      <VibeFrameworkPageContent />
    </Suspense>
  )
}











