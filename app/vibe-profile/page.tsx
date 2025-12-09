'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { analyzeVibeTraits, generateVibeDescription, type VibeInput } from '@/lib/analysis/vibeAnalyzer'

// MBTI 옵션
const MBTI_OPTIONS = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
]

// 혈액형 옵션
const BLOOD_TYPE_OPTIONS = ['A', 'B', 'O', 'AB']

// 별자리 옵션
const ZODIAC_OPTIONS = [
  { value: 'aries', label: '양자리', icon: '♈', dates: '3.21-4.19' },
  { value: 'taurus', label: '황소자리', icon: '♉', dates: '4.20-5.20' },
  { value: 'gemini', label: '쌍둥이자리', icon: '♊', dates: '5.21-6.21' },
  { value: 'cancer', label: '게자리', icon: '♋', dates: '6.22-7.22' },
  { value: 'leo', label: '사자자리', icon: '♌', dates: '7.23-8.22' },
  { value: 'virgo', label: '처녀자리', icon: '♍', dates: '8.23-9.23' },
  { value: 'libra', label: '천칭자리', icon: '♎', dates: '9.24-10.22' },
  { value: 'scorpio', label: '전갈자리', icon: '♏', dates: '10.23-11.22' },
  { value: 'sagittarius', label: '사수자리', icon: '♐', dates: '11.23-12.24' },
  { value: 'capricorn', label: '염소자리', icon: '♑', dates: '12.25-1.19' },
  { value: 'aquarius', label: '물병자리', icon: '♒', dates: '1.20-2.18' },
  { value: 'pisces', label: '물고기자리', icon: '♓', dates: '2.19-3.20' },
]

function VibeProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'vibe'

  const [vibeInput, setVibeInput] = useState<VibeInput>({
    mbti: undefined,
    bloodType: undefined,
    zodiac: undefined,
  })

  const handleMBTISelect = (mbti: string) => {
    setVibeInput((prev) => ({
      ...prev,
      mbti: prev.mbti === mbti ? undefined : mbti,
    }))
  }

  const handleBloodTypeSelect = (bloodType: string) => {
    setVibeInput((prev) => ({
      ...prev,
      bloodType: prev.bloodType === bloodType ? undefined : bloodType,
    }))
  }

  const handleZodiacSelect = (zodiac: string) => {
    setVibeInput((prev) => ({
      ...prev,
      zodiac: prev.zodiac === zodiac ? undefined : zodiac,
    }))
  }

  const handleNext = () => {
    // 최소 1개 이상 선택 확인
    if (!vibeInput.mbti && !vibeInput.bloodType && !vibeInput.zodiac) {
      alert('MBTI, 혈액형, 별자리 중 최소 1개 이상 선택해주세요.')
      return
    }

    // 바이브 입력 데이터를 sessionStorage에 저장
    sessionStorage.setItem('vibeInput', JSON.stringify(vibeInput))
    
    // 공간 정보도 함께 저장
    const spaceInfo = {
      size: searchParams.get('size') || '0',
      roomCount: searchParams.get('roomCount') || '0',
      bathroomCount: searchParams.get('bathroomCount') || '0',
      housingType: searchParams.get('housingType') || 'apartment',
      region: searchParams.get('region') || 'seoul',
      areas: searchParams.get('areas') || '',
    }
    sessionStorage.setItem('spaceInfo', JSON.stringify(spaceInfo))

    console.log('✅ 바이브 프로필 저장:', {
      vibeInput,
      spaceInfo,
    })

    // 바이브 질문 페이지로 이동
    router.push('/analysis/vibe')
  }

  const selectedCount = [vibeInput.mbti, vibeInput.bloodType, vibeInput.zodiac].filter(Boolean).length

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold">
              INTERIBOT VIBE MODE
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🎯 나를 표현하는 키워드
          </h1>
          <p className="text-xl text-gray-700 mb-3">
            MBTI, 혈액형, 별자리로 당신의 성향을 분석해드립니다
          </p>
          <p className="text-base text-purple-600 font-medium">
            최소 1개 이상 선택해주세요 · 선택한 개수: {selectedCount}/3
          </p>
        </div>

        {/* MBTI 선택 */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span>🧩</span>
            <span>MBTI</span>
            {vibeInput.mbti && (
              <span className="text-base font-semibold text-purple-600 bg-purple-100 px-4 py-1 rounded-full">
                {vibeInput.mbti} 선택됨
              </span>
            )}
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {MBTI_OPTIONS.map((mbti) => {
              const isSelected = vibeInput.mbti === mbti
              return (
                <button
                  key={mbti}
                  onClick={() => handleMBTISelect(mbti)}
                  className={`p-4 rounded-xl border-2 transition-all font-bold text-base ${
                    isSelected
                      ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 shadow-lg scale-110'
                      : 'border-gray-300 hover:border-purple-400 text-gray-700 bg-white hover:bg-purple-50 hover:shadow-md'
                  }`}
                >
                  {mbti}
                </button>
              )
            })}
          </div>
        </div>

        {/* 혈액형 선택 */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-red-200 p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span>🩸</span>
            <span>혈액형</span>
            {vibeInput.bloodType && (
              <span className="text-base font-semibold text-red-600 bg-red-100 px-4 py-1 rounded-full">
                {vibeInput.bloodType}형 선택됨
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {BLOOD_TYPE_OPTIONS.map((bloodType) => {
              const isSelected = vibeInput.bloodType === bloodType
              return (
                <button
                  key={bloodType}
                  onClick={() => handleBloodTypeSelect(bloodType)}
                  className={`p-8 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-red-500 bg-gradient-to-br from-red-100 to-red-200 text-red-700 shadow-xl scale-110'
                      : 'border-gray-300 hover:border-red-400 text-gray-700 bg-white hover:bg-red-50 hover:shadow-lg'
                  }`}
                >
                  <div className="text-5xl font-bold mb-2">{bloodType}</div>
                  <div className="text-lg font-semibold">형</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 별자리 선택 */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span>⭐</span>
            <span>별자리</span>
            {vibeInput.zodiac && (
              <span className="text-base font-semibold text-blue-600 bg-blue-100 px-4 py-1 rounded-full">
                {ZODIAC_OPTIONS.find((z) => z.value === vibeInput.zodiac)?.label} 선택됨
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {ZODIAC_OPTIONS.map((zodiac) => {
              const isSelected = vibeInput.zodiac === zodiac.value
              return (
                <button
                  key={zodiac.value}
                  onClick={() => handleZodiacSelect(zodiac.value)}
                  className={`p-6 rounded-2xl border-2 transition-all text-center ${
                    isSelected
                      ? 'border-blue-500 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 shadow-xl scale-110'
                      : 'border-gray-300 hover:border-blue-400 text-gray-700 bg-white hover:bg-blue-50 hover:shadow-lg'
                  }`}
                >
                  <div className="text-4xl mb-3">{zodiac.icon}</div>
                  <div className="font-bold text-base mb-1">{zodiac.label}</div>
                  <div className="text-xs text-gray-600">{zodiac.dates}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 선택 요약 */}
        {selectedCount > 0 && (
          <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 rounded-2xl p-8 mb-8 border-2 border-purple-300 shadow-lg">
            <h3 className="font-bold text-2xl text-gray-900 mb-4 flex items-center gap-2">
              <span>✨</span>
              <span>선택한 프로필 ({selectedCount}/3)</span>
            </h3>
            <div className="flex flex-wrap gap-4">
              {vibeInput.mbti && (
                <span className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-base font-bold shadow-md">
                  🧩 {vibeInput.mbti}
                </span>
              )}
              {vibeInput.bloodType && (
                <span className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-base font-bold shadow-md">
                  🩸 {vibeInput.bloodType}형
                </span>
              )}
              {vibeInput.zodiac && (
                <span className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-base font-bold shadow-md">
                  ⭐ {ZODIAC_OPTIONS.find((z) => z.value === vibeInput.zodiac)?.label}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex gap-4 flex-col md:flex-row">
          <button
            onClick={() => router.back()}
            className="flex-1 px-8 py-5 rounded-xl font-bold text-lg bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-md"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={selectedCount === 0}
            className={`flex-1 px-8 py-5 rounded-xl font-bold text-xl transition-all ${
              selectedCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1'
            }`}
          >
            다음 단계로 →
          </button>
        </div>
      </div>
    </main>
  )
}

export default function VibeProfilePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-700">로딩 중...</p>
        </div>
      </main>
    }>
      <VibeProfilePageContent />
    </Suspense>
  )
}

