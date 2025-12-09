'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

import { PREFERENCE_CATEGORIES, PreferenceCategory } from '@/lib/analysis/questions/types'
import ImageComparison from '@/components/ImageComparison'

interface AnalysisRecord {
  analysisId: string
  mode: string
  summary: string
  answeredCount: number
  completionRate: number
  preferences: Record<string, number>
  preferenceAnalysis?: Record<string, number>
  vibeProfile?: {
    type?: string
    archetype?: string
    keywords?: string[]
    dominantColor?: string
    description?: string
    mbti?: string
    bloodType?: string
    zodiac?: string
  }
  vibeInput?: {
    mbti?: string
    bloodType?: string
    zodiac?: string
  }
  traitScores?: Record<string, number>
  description?: string
  recommendations?: string[]
  spaceInfo?: {
    housingType?: string | null
    region?: string | null
    size?: string | number | null
    roomCount?: string | number | null
    bathroomCount?: string | number | null
  } | null
  selectedAreas?: string[] | null
  createdAt?: string
  // ✅ 점수 정보 추가
  homeValueScore?: {
    score: number
    reason: string
    investmentValue: string
  }
  lifestyleScores?: {
    storage: number
    cleaning: number
    flow: number
    comment: string
  }
  // ✅ AI 리포트 추가 (놓친 부분 포함)
  aiReport?: {
    title?: string
    overview?: string
    personalityKeywords?: string[]
    styleKeywords?: string[]
    prioritySpaces?: Array<{ spaceId: string; label: string; reason: string }>
    priorityProcesses?: Array<{ process: string; label: string; reason: string }>
    budgetSummary?: string
    nextActions?: string[]
    missedPoints?: {
      title: string
      items: Array<{
        point: string
        impact: string
        recommendation: string
      }>
    }
  }
}

const PREFERENCE_LABELS: Record<PreferenceCategory, string> = {
  space_sense: '공간 감각',
  sensory_sensitivity: '감각 민감도',
  cleaning_preference: '청소 성향',
  organization_habit: '정리 습관',
  family_composition: '가족 구성',
  health_factors: '건강 요소',
  budget_sense: '예산 감각',
  color_preference: '색감 취향',
  lighting_preference: '조명 취향',
  home_purpose: '집 사용 목적',
  discomfort_factors: '불편 요소',
  activity_flow: '활동 동선',
  life_routine: '생활 루틴',
  sleep_pattern: '수면 패턴',
  hobby_lifestyle: '취미/라이프스타일',
}

export default function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null)
  const [imagePrompt, setImagePrompt] = useState<string>('')
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  
  // Room Before/After image generation states
  type SpaceType = 'living' | 'kitchen' | 'bedroom' | 'bathroom'
  type ProcessType = '철거' | '주방' | '욕실' | '타일' | '목공' | '전기' | '도배' | '필름'
  
  // 각 공간별 이미지 상태 (독립적으로 관리)
  const [spaceImages, setSpaceImages] = useState<Record<SpaceType, { before: string; after: string } | null>>({
    living: null,
    kitchen: null,
    bedroom: null,
    bathroom: null,
  })
  const [generatingSpace, setGeneratingSpace] = useState<SpaceType | null>(null)
  
  // 각 공정별 이미지 상태 (독립적으로 관리)
  const [processImages, setProcessImages] = useState<Record<ProcessType, { before: string; after: string } | null>>({
    '철거': null,
    '주방': null,
    '욕실': null,
    '타일': null,
    '목공': null,
    '전기': null,
    '도배': null,
    '필름': null,
  })
  const [generatingProcess, setGeneratingProcess] = useState<ProcessType | null>(null)
  
  const spaceLabels: Record<SpaceType, { name: string; emoji: string; gradient: string }> = {
    living: { 
      name: '거실', 
      emoji: '🏠',
      gradient: 'from-blue-500 via-indigo-500 to-purple-600'
    },
    kitchen: { 
      name: '주방', 
      emoji: '🍳',
      gradient: 'from-orange-500 via-red-500 to-pink-600'
    },
    bedroom: { 
      name: '침실', 
      emoji: '🛏️',
      gradient: 'from-purple-500 via-pink-500 to-rose-600'
    },
    bathroom: { 
      name: '욕실', 
      emoji: '🚿',
      gradient: 'from-cyan-500 via-blue-500 to-indigo-600'
    },
  }
  
  const processLabels: Record<ProcessType, { name: string; emoji: string; gradient: string }> = {
    '철거': { name: '철거', emoji: '🔨', gradient: 'from-gray-600 via-gray-700 to-gray-800' },
    '주방': { name: '주방', emoji: '🍳', gradient: 'from-orange-500 via-red-500 to-pink-600' },
    '욕실': { name: '욕실', emoji: '🚿', gradient: 'from-cyan-500 via-blue-500 to-indigo-600' },
    '타일': { name: '타일', emoji: '🧱', gradient: 'from-amber-500 via-orange-500 to-red-500' },
    '목공': { name: '목공', emoji: '🪵', gradient: 'from-yellow-600 via-amber-600 to-orange-600' },
    '전기': { name: '전기', emoji: '⚡', gradient: 'from-yellow-400 via-yellow-500 to-orange-500' },
    '도배': { name: '도배', emoji: '🎨', gradient: 'from-pink-400 via-purple-400 to-indigo-400' },
    '필름': { name: '필름', emoji: '✨', gradient: 'from-emerald-400 via-teal-500 to-cyan-500' },
  }

  useEffect(() => {
    void loadResult()
  }, [])

  const loadResult = async () => {
    try {
      const analysisId = searchParams.get('analysisId')
      console.log('=== 결과 로딩 ===', analysisId)

      const stored = analysisId ? sessionStorage.getItem(`analysis_${analysisId}`) : null

      if (stored) {
        const data = JSON.parse(stored)
        console.log('로드된 데이터:', data)

        try {
          console.log('성향 분석 API 호출 시작...')
          const preferenceResponse = await fetch('/api/analysis/preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: data.mode,
              preferences: data.preferences,
              spaceInfo: data.spaceInfo,
              selectedAreas: data.selectedAreas,
            }),
          })

          if (preferenceResponse.ok) {
            const preferenceData = await preferenceResponse.json()
            console.log('✅ 성향 분석 성공:', preferenceData)

            data.preferenceAnalysis = preferenceData.analysis ?? preferenceData.preferences
          } else {
            console.error('❌ 성향 분석 API 실패:', preferenceResponse.status)
          }
        } catch (preferenceError) {
          console.error('❌ 성향 분석 에러:', preferenceError)
        }

        // ✅ aiReport가 있으면 포함 (analysis/submit API에서 반환된 경우)
        if (data.aiReport) {
          console.log('✅ AI 리포트 포함:', data.aiReport)
        }

        setAnalysis(data)
      } else {
        console.error('❌ 데이터 없음!')
        alert('분석 결과를 찾을 수 없습니다.')
        router.push('/')
      }
    } catch (error) {
      console.error('❌ 로딩 에러:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewEstimate = () => {
    if (!analysis) return

    const { spaceInfo, selectedAreas, mode } = analysis

    // sessionStorage에서 선택된 공정 가져오기
    const selectedProcessesStr = sessionStorage.getItem('selectedProcesses')
    const selectedProcesses = selectedProcessesStr ? JSON.parse(selectedProcessesStr) : null
    
    console.log('🔍 [result] sessionStorage selectedProcesses:', selectedProcesses)

    const params = new URLSearchParams({
      analysisId: searchParams.get('analysisId') || '',
      mode: mode,
      size: String(spaceInfo?.size ?? '30'),
      housingType: String(spaceInfo?.housingType ?? 'apartment'),
      region: String(spaceInfo?.region ?? 'seoul'),
      roomCount: String(spaceInfo?.roomCount ?? '3'),
      bathroomCount: String(spaceInfo?.bathroomCount ?? '2'),
      areas:
        Array.isArray(selectedAreas) && selectedAreas.length > 0
          ? selectedAreas.join(',')
          : 'fullhome',
    })
    
    // 선택된 공정이 있으면 URL 파라미터에 추가
    if (selectedProcesses && Array.isArray(selectedProcesses) && selectedProcesses.length > 0) {
      params.set('selectedProcesses', selectedProcesses.join(','))
      console.log('✅ [result] selectedProcesses를 URL에 추가:', selectedProcesses.join(','))
    }
    
    // 주방 옵션도 함께 전달
    const kitchenOptionsStr = sessionStorage.getItem('kitchenOptions')
    if (kitchenOptionsStr) {
      try {
        const kitchenOptions = JSON.parse(kitchenOptionsStr)
        if (kitchenOptions.형태) {
          params.set('kitchenLayout', kitchenOptions.형태)
          if (kitchenOptions.냉장고장) params.set('kitchenRefrigerator', 'true')
          if (kitchenOptions.키큰장) params.set('kitchenTallCabinet', 'true')
          if (kitchenOptions.아일랜드장) params.set('kitchenIsland', 'true')
          if (kitchenOptions.다용도실) params.set('kitchenUtilityRoom', 'true')
          console.log('✅ [result] 주방 옵션 추가:', kitchenOptions)
        }
      } catch (e) {
        console.error('❌ 주방 옵션 파싱 오류:', e)
      }
    }
    
    // 욕실 옵션도 함께 전달
    const bathroomOptionsStr = sessionStorage.getItem('bathroomOptions')
    if (bathroomOptionsStr) {
      try {
        const bathroomOptions = JSON.parse(bathroomOptionsStr)
        if (bathroomOptions.스타일) {
          params.set('bathroomStyle', bathroomOptions.스타일)
          if (bathroomOptions.욕조) params.set('bathroomBathtub', 'true')
          if (bathroomOptions.샤워부스) params.set('bathroomShowerBooth', 'true')
          if (bathroomOptions.비데) params.set('bathroomBidet', 'true')
          if (bathroomOptions.수전업그레이드) params.set('bathroomFaucetUpgrade', 'true')
          console.log('✅ [result] 욕실 옵션 추가:', bathroomOptions)
        }
      } catch (e) {
        console.error('❌ 욕실 옵션 파싱 오류:', e)
      }
    }
    
    // 목공 옵션도 함께 전달
    const woodworkOptionsStr = sessionStorage.getItem('woodworkOptions')
    if (woodworkOptionsStr) {
      try {
        const woodworkOptions = JSON.parse(woodworkOptionsStr)
        if (woodworkOptions.furniture && woodworkOptions.furniture.length > 0) {
          params.set('woodworkFurniture', woodworkOptions.furniture.join(','))
          if (woodworkOptions.맞춤제작) params.set('woodworkCustom', 'true')
          console.log('✅ [result] 목공 옵션 추가:', woodworkOptions)
        }
      } catch (e) {
        console.error('❌ 목공 옵션 파싱 오류:', e)
      }
    }

    console.log('🔄 [result] 견적 페이지로 이동:', params.toString())
    router.push(`/estimate?${params.toString()}`)
  }

  const handleGenerateImagePrompt = async () => {
    if (!analysis) return

    setIsGeneratingPrompt(true)
    try {
      // 성향 점수에서 스타일과 색상 추출
      const topCategories = Object.entries(analysis.preferences || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)

      const style = '모던' // 기본값, 추후 개선 가능
      const colors: string[] = []
      
      if (analysis.preferences?.color_preference && analysis.preferences.color_preference >= 7) {
        colors.push('화이트', '그레이')
      }

      const area = Array.isArray(analysis.selectedAreas) && analysis.selectedAreas.length > 0
        ? analysis.selectedAreas[0]
        : 'living'

      const response = await fetch('/api/image/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style,
          colors,
          preferences: analysis.preferences,
          area,
        }),
      })

      if (!response.ok) {
        throw new Error('프롬프트 생성 실패')
      }

      const data = await response.json()
      setImagePrompt(data.prompt || '')
    } catch (error) {
      console.error('프롬프트 생성 오류:', error)
      alert('이미지 프롬프트 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt) {
      await handleGenerateImagePrompt()
      return
    }

    setIsGeneratingImage(true)
    try {
      const response = await fetch('/api/image/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: '모던',
          colors: ['화이트', '그레이'],
          preferences: analysis?.preferences || {},
          area: Array.isArray(analysis?.selectedAreas) && analysis.selectedAreas.length > 0
            ? analysis.selectedAreas[0]
            : 'living',
        }),
      })

      if (!response.ok) {
        throw new Error('프롬프트 생성 실패')
      }

      const promptData = await response.json()
      const englishPrompt = promptData.englishPrompt || promptData.prompt

      const imageResponse = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptData.prompt,
          englishPrompt,
        }),
      })

      if (!imageResponse.ok) {
        throw new Error('이미지 생성 실패')
      }

      const imageData = await imageResponse.json()
      setGeneratedImageUrl(imageData.imageUrl || null)
    } catch (error) {
      console.error('이미지 생성 오류:', error)
      alert('이미지 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // 공간별 Before/After 이미지 생성 함수
  const handleGenerateSpaceImages = async (spaceType: SpaceType) => {
    if (!analysis) return
    if (generatingSpace) return // 이미 생성 중이면 중복 방지

    setGeneratingSpace(spaceType)
    try {
      const preferences = analysis.preferenceAnalysis || analysis.preferences || {}
      
      const personalityScores = {
        spacePerception: preferences.space_sense || 5,
        visualSensitivity: preferences.sensory_sensitivity || 5,
        cleaningHabit: preferences.cleaning_preference || 5,
        organizationSkill: preferences.organization_habit || 5,
        colorPreference: (preferences.color_preference >= 7 ? 'warm' : preferences.color_preference <= 3 ? 'cool' : 'neutral') as 'warm' | 'cool' | 'neutral',
        lightingStyle: (preferences.lighting_preference >= 7 ? 'bright' : preferences.lighting_preference <= 3 ? 'mood' : 'natural') as 'natural' | 'mood' | 'bright',
      }

      const apartmentInfo = {
        size: Number(analysis.spaceInfo?.size) || 32,
        hasBalconyExtension: false,
      }

      console.log(`[${spaceLabels[spaceType].name}] Generating images with:`, { personalityScores, apartmentInfo, spaceType })

      const response = await fetch('/api/generate-room-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalityScores,
          apartmentInfo,
          spaceType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const data = await response.json()
      
      if (data.success && data.images) {
        setSpaceImages(prev => ({
          ...prev,
          [spaceType]: data.images
        }))
        console.log(`[${spaceLabels[spaceType].name}] Images generated successfully:`, data)
      } else {
        throw new Error('Failed to generate images')
      }
    } catch (error: any) {
      console.error(`[${spaceLabels[spaceType].name}] Generation error:`, error)
      alert(`${spaceLabels[spaceType].name} 이미지 생성 중 오류가 발생했습니다.\n${error.message || '다시 시도해주세요.'}`)
    } finally {
      setGeneratingSpace(null)
    }
  }

  // 공정별 Before/After 이미지 생성 함수
  const handleGenerateProcessImages = async (processType: ProcessType) => {
    if (!analysis) return
    if (generatingProcess) return // 이미 생성 중이면 중복 방지

    setGeneratingProcess(processType)
    try {
      const preferences = analysis.preferenceAnalysis || analysis.preferences || {}
      
      const personalityScores = {
        spacePerception: preferences.space_sense || 5,
        visualSensitivity: preferences.sensory_sensitivity || 5,
        cleaningHabit: preferences.cleaning_preference || 5,
        organizationSkill: preferences.organization_habit || 5,
        colorPreference: (preferences.color_preference >= 7 ? 'warm' : preferences.color_preference <= 3 ? 'cool' : 'neutral') as 'warm' | 'cool' | 'neutral',
        lightingStyle: (preferences.lighting_preference >= 7 ? 'bright' : preferences.lighting_preference <= 3 ? 'mood' : 'natural') as 'natural' | 'mood' | 'bright',
      }

      const apartmentInfo = {
        size: Number(analysis.spaceInfo?.size) || 32,
        hasBalconyExtension: false,
      }

      console.log(`[공정: ${processType}] Generating images with:`, { personalityScores, apartmentInfo, processType })

      const response = await fetch('/api/generate-room-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalityScores,
          apartmentInfo,
          processType, // 공정 타입 전달
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const data = await response.json()
      
      if (data.success && data.images) {
        setProcessImages(prev => ({
          ...prev,
          [processType]: data.images
        }))
        console.log(`[공정: ${processType}] Images generated successfully:`, data)
      } else {
        throw new Error('Failed to generate images')
      }
    } catch (error: any) {
      console.error(`[공정: ${processType}] Generation error:`, error)
      alert(`${processType} 공정 이미지 생성 중 오류가 발생했습니다.\n${error.message || '다시 시도해주세요.'}`)
    } finally {
      setGeneratingProcess(null)
    }
  }

  const preferenceList = useMemo(() => {
    if (!analysis?.preferences) return []
    return PREFERENCE_CATEGORIES.map((category) => ({
      key: category,
      label: PREFERENCE_LABELS[category],
      value: analysis.preferences?.[category] ?? 5,
    }))
  }, [analysis])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-argen-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-base md:text-lg">결과를 준비하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-red-600 text-base md:text-lg">데이터를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">✨ 분석 완료!</h1>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed">{analysis.summary}</p>
            </div>
            {analysis.vibeProfile && (
              <>
                {/* 기존 vibeProfile (keywords가 있는 경우) */}
                {analysis.vibeProfile.keywords && analysis.vibeProfile.keywords.length > 0 && (
                  <div
                    className="rounded-2xl px-6 py-5 text-white"
                    style={{ backgroundColor: analysis.vibeProfile.dominantColor || '#6366f1' }}
                  >
                    <p className="text-sm md:text-base uppercase tracking-widest opacity-80 mb-2">Home Vibe</p>
                    <p className="text-xl sm:text-2xl font-bold mb-2">{analysis.vibeProfile.type}</p>
                    <p className="text-sm md:text-base mb-4 opacity-90 leading-relaxed">{analysis.vibeProfile.archetype}</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.vibeProfile.keywords.map((keyword) => (
                        <span key={keyword} className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 새로운 바이브 프로필 (MBTI/혈액형/별자리) */}
                {(analysis.vibeProfile.mbti || analysis.vibeProfile.bloodType || analysis.vibeProfile.zodiac || analysis.vibeInput) && (
                  <div className="rounded-2xl px-6 py-5 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    <p className="text-sm md:text-base uppercase tracking-widest opacity-80 mb-2">Your Profile</p>
                    <p className="text-xl sm:text-2xl font-bold mb-4">나를 표현하는 키워드</p>
                    <div className="flex flex-wrap gap-3">
                      {(analysis.vibeProfile.mbti || analysis.vibeInput?.mbti) && (
                        <div className="bg-white/20 rounded-xl px-4 py-3">
                          <p className="text-xs opacity-80 mb-1">MBTI</p>
                          <p className="text-lg font-bold">{analysis.vibeProfile.mbti || analysis.vibeInput?.mbti}</p>
                        </div>
                      )}
                      {(analysis.vibeProfile.bloodType || analysis.vibeInput?.bloodType) && (
                        <div className="bg-white/20 rounded-xl px-4 py-3">
                          <p className="text-xs opacity-80 mb-1">혈액형</p>
                          <p className="text-lg font-bold">{analysis.vibeProfile.bloodType || analysis.vibeInput?.bloodType}형</p>
                        </div>
                      )}
                      {(analysis.vibeProfile.zodiac || analysis.vibeInput?.zodiac) && (
                        <div className="bg-white/20 rounded-xl px-4 py-3">
                          <p className="text-xs opacity-80 mb-1">별자리</p>
                          <p className="text-lg font-bold">
                            {(() => {
                              const zodiac = analysis.vibeProfile.zodiac || analysis.vibeInput?.zodiac
                              const zodiacNames: Record<string, string> = {
                                aries: '양자리', taurus: '황소자리', gemini: '쌍둥이자리',
                                cancer: '게자리', leo: '사자자리', virgo: '처녀자리',
                                libra: '천칭자리', scorpio: '전갈자리', sagittarius: '사수자리',
                                capricorn: '염소자리', aquarius: '물병자리', pisces: '물고기자리',
                              }
                              return zodiacNames[zodiac?.toLowerCase() || ''] || zodiac
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                    {analysis.description && (
                      <p className="text-sm md:text-base mt-4 opacity-90 leading-relaxed">
                        {analysis.description}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 🏠 공간별 AI Before/After 이미지 생성 - 독립 버튼 4개 */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-xl p-6 md:p-8 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🏠</span>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                공간별 AI Before/After
              </h2>
              <p className="text-sm text-gray-600 mt-1">각 공간별로 시공 전/후 이미지를 생성합니다 (약 30~40초 소요)</p>
            </div>
          </div>

          {/* 공간별 독립 버튼 4개 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(spaceLabels) as SpaceType[]).map((space) => (
              <div key={space} className={`bg-gradient-to-br ${spaceLabels[space].gradient} rounded-xl p-5 text-white`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{spaceLabels[space].emoji}</span>
                  <h3 className="text-xl font-bold">{spaceLabels[space].name}</h3>
                </div>
                
                {!spaceImages[space] ? (
                  <button
                    onClick={() => handleGenerateSpaceImages(space)}
                    disabled={generatingSpace !== null}
                    className={`
                      w-full px-4 py-3 rounded-xl font-semibold
                      transition-all duration-300
                      flex items-center justify-center gap-2
                      ${generatingSpace === space
                        ? 'bg-white/30 text-white/70 cursor-not-allowed'
                        : generatingSpace !== null
                          ? 'bg-white/20 text-white/50 cursor-not-allowed'
                          : 'bg-white text-gray-900 hover:bg-white/90 hover:scale-[1.02]'
                      }
                    `}
                  >
                    {generatingSpace === space ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>{spaceLabels[space].name} Before/After 생성</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs font-medium mb-1 text-white/80">Before</p>
                        <img 
                          src={spaceImages[space]!.before} 
                          alt={`${spaceLabels[space].name} Before`}
                          className="w-full rounded-lg shadow-md"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1 text-white/80">After</p>
                        <img 
                          src={spaceImages[space]!.after} 
                          alt={`${spaceLabels[space].name} After`}
                          className="w-full rounded-lg shadow-md"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleGenerateSpaceImages(space)}
                      disabled={generatingSpace !== null}
                      className="w-full px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                    >
                      🔄 다시 생성
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            💡 이 이미지는 AI가 생성한 참고용 이미지입니다. 실제 시공 결과와 다를 수 있습니다.
          </p>
        </div>

        {/* 🔧 공정별 AI Before/After 이미지 생성 */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl shadow-xl p-6 md:p-8 border-2 border-amber-200">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🔧</span>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                공정별 AI Before/After
              </h2>
              <p className="text-sm text-gray-600 mt-1">각 공정별로 시공 전/후 이미지를 생성합니다 (약 30~40초 소요)</p>
            </div>
          </div>

          {/* 공정별 독립 버튼 8개 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(processLabels) as ProcessType[]).map((process) => (
              <div key={process} className={`bg-gradient-to-br ${processLabels[process].gradient} rounded-xl p-4 text-white`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{processLabels[process].emoji}</span>
                  <h3 className="text-base font-bold">{processLabels[process].name}</h3>
                </div>
                
                {!processImages[process] ? (
                  <button
                    onClick={() => handleGenerateProcessImages(process)}
                    disabled={generatingProcess !== null}
                    className={`
                      w-full px-3 py-2 rounded-lg font-semibold text-sm
                      transition-all duration-300
                      flex items-center justify-center gap-1
                      ${generatingProcess === process
                        ? 'bg-white/30 text-white/70 cursor-not-allowed'
                        : generatingProcess !== null
                          ? 'bg-white/20 text-white/50 cursor-not-allowed'
                          : 'bg-white text-gray-900 hover:bg-white/90'
                      }
                    `}
                  >
                    {generatingProcess === process ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        <span>생성 중</span>
                      </>
                    ) : (
                      <span>✨ 생성</span>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1">
                      <img 
                        src={processImages[process]!.before} 
                        alt={`${process} Before`}
                        className="w-full rounded-md shadow-sm"
                      />
                      <img 
                        src={processImages[process]!.after} 
                        alt={`${process} After`}
                        className="w-full rounded-md shadow-sm"
                      />
                    </div>
                    <button
                      onClick={() => handleGenerateProcessImages(process)}
                      disabled={generatingProcess !== null}
                      className="w-full px-2 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md font-medium text-xs transition-all disabled:opacity-50"
                    >
                      🔄 다시
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            💡 이 이미지는 AI가 생성한 참고용 이미지입니다. 실제 시공 결과와 다를 수 있습니다.
          </p>
        </div>

        {analysis.spaceInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">🏠 공간 정보</h2>
            <div className="grid grid-cols-2 gap-6 text-gray-800">
              <div>
                <p className="text-sm md:text-base text-gray-500 mb-1">주거 형태</p>
                <p className="text-base md:text-lg font-semibold">{analysis.spaceInfo.housingType ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm md:text-base text-gray-500 mb-1">지역</p>
                <p className="text-base md:text-lg font-semibold">{analysis.spaceInfo.region ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm md:text-base text-gray-500 mb-1">평수</p>
                <p className="text-base md:text-lg font-semibold">{analysis.spaceInfo.size ?? '-'}평</p>
              </div>
              <div>
                <p className="text-sm md:text-base text-gray-500 mb-1">방/화장실</p>
                <p className="text-base md:text-lg font-semibold">
                  {analysis.spaceInfo.roomCount ?? '-'}개 / {analysis.spaceInfo.bathroomCount ?? '-'}개
                </p>
              </div>
            </div>
          </div>
        )}

        {analysis.selectedAreas && analysis.selectedAreas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">📍 선택한 영역</h2>
            <div className="flex flex-wrap gap-3">
              {analysis.selectedAreas.map((area) => (
                <span key={area} className="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-full font-medium text-base">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ✅ 집값 방어 점수 + 생활 개선 점수 표시 */}
        {(analysis.homeValueScore || analysis.lifestyleScores) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 집값 방어 점수 */}
            {analysis.homeValueScore && (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    🏡 집값 방어 점수
                  </h3>
                  <div className="text-2xl text-yellow-500">
                    {'★'.repeat(analysis.homeValueScore.score)}
                    {'☆'.repeat(5 - analysis.homeValueScore.score)}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                  {analysis.homeValueScore.reason}
                </p>
                <p className="text-xs text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2">
                  💰 {analysis.homeValueScore.investmentValue}
                </p>
              </div>
            )}
            
            {/* 생활 개선 점수 */}
            {analysis.lifestyleScores && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  📈 생활 개선 점수
                </h3>
                
                {/* 수납 점수 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">수납</span>
                    <span className="text-sm font-bold text-blue-600">{analysis.lifestyleScores.storage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${analysis.lifestyleScores.storage}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* 청소 점수 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">청소</span>
                    <span className="text-sm font-bold text-green-600">{analysis.lifestyleScores.cleaning}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${analysis.lifestyleScores.cleaning}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* 동선 점수 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">동선</span>
                    <span className="text-sm font-bold text-purple-600">{analysis.lifestyleScores.flow}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${analysis.lifestyleScores.flow}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-sm text-blue-700 bg-blue-100 rounded-lg px-3 py-2 mt-4">
                  ✨ {analysis.lifestyleScores.comment}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ✅ 고객이 놓친 부분 섹션 (핵심 가치!) */}
        {analysis.aiReport?.missedPoints && analysis.aiReport.missedPoints.items.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl shadow-xl p-6 md:p-8 border-2 border-amber-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">💡</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {analysis.aiReport.missedPoints.title || '고객님이 놓치기 쉬운 부분'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">전문가 관점에서 발견한 중요한 고려사항입니다</p>
              </div>
            </div>

            <div className="space-y-4">
              {analysis.aiReport.missedPoints.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-5 md:p-6 border-l-4 border-amber-400 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-700">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      {/* 문제점 */}
                      <div>
                        <p className="text-base md:text-lg font-bold text-gray-900 mb-2">
                          {item.point}
                        </p>
                      </div>
                      
                      {/* 영향 */}
                      {item.impact && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-blue-800 mb-1">🤔 이런 영향이 있을 수 있어요</p>
                          <p className="text-sm text-blue-900 leading-relaxed">
                            {item.impact}
                          </p>
                        </div>
                      )}
                      
                      {/* 추천 */}
                      {item.recommendation && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-emerald-800 mb-1">💡 전문가 추천</p>
                          <p className="text-sm text-emerald-900 leading-relaxed">
                            {item.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border border-amber-300">
              <p className="text-sm text-amber-900 leading-relaxed flex items-start gap-2">
                <span className="text-lg">✨</span>
                <span>
                  <strong>인테리봇이 발견한 부분</strong>은 고객님의 집 정보와 성향을 분석한 결과입니다. 
                  장기적으로 고려하면 더 만족스러운 인테리어가 될 수 있어요.
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 정밀 성향 분석</h2>
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">AI 분석 완료</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-5 md:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <div className="text-center">
              <p className="text-xs md:text-sm text-gray-600 mb-2">분석 데이터</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{analysis.answeredCount}</p>
              <p className="text-xs text-gray-500">개 응답</p>
            </div>
            <div className="text-center">
              <p className="text-xs md:text-sm text-gray-600 mb-2">신뢰도</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">{Math.round(analysis.completionRate)}%</p>
              <p className="text-xs text-gray-500">높은 정확도</p>
            </div>
            <div className="text-center">
              <p className="text-xs md:text-sm text-gray-600 mb-2">분석 항목</p>
              <p className="text-xl md:text-2xl font-bold text-purple-600">{preferenceList.length}</p>
              <p className="text-xs text-gray-500">개 카테고리</p>
            </div>
            {analysis.createdAt && (
              <div className="text-center">
                <p className="text-xs md:text-sm text-gray-600 mb-2">완료 시각</p>
                <p className="text-sm md:text-base font-bold text-gray-900">
                  {new Date(analysis.createdAt).toLocaleString('ko-KR', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            )}
          </div>

          {/* 상위 3개 성향 하이라이트 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🎯</span>
              <span>주요 성향 TOP 3</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {preferenceList
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map(({ key, label, value }, index) => (
                  <div key={key} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border-2 border-blue-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
                      <span className="text-xl font-bold text-purple-600">{value.toFixed(1)}</span>
                    </div>
                    <p className="font-bold text-gray-900 text-base mb-3">{label}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${(value / 10) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {key === 'space_sense' && '공간 활용과 동선 계획에 대한 감각이 뛰어나며, 효율적인 레이아웃을 선호합니다.'}
                      {key === 'sensory_sensitivity' && '소리, 빛, 온도 등 감각적 요소에 민감하게 반응하며 쾌적한 환경을 중시합니다.'}
                      {key === 'cleaning_preference' && '청소와 유지관리의 편의성을 중요하게 생각하며 실용적인 선택을 합니다.'}
                      {key === 'organization_habit' && '체계적인 정리와 수납을 선호하며 정돈된 공간을 유지하려 노력합니다.'}
                      {key === 'family_composition' && '가족 구성원의 니즈를 우선적으로 고려하며 모두를 위한 공간을 만듭니다.'}
                      {key === 'health_factors' && '건강과 웰빙을 위한 환경 조성을 중시하며 친환경 자재를 선호합니다.'}
                      {key === 'budget_sense' && '합리적인 예산 배분과 가성비를 고려하며 현명한 투자를 추구합니다.'}
                      {key === 'color_preference' && '색상과 톤의 조화를 중요하게 생각하며 일관된 컬러 팔레트를 선호합니다.'}
                      {key === 'lighting_preference' && '조명의 분위기와 기능성을 중시하며 다양한 조명 연출을 즐깁니다.'}
                      {key === 'home_purpose' && '집의 용도와 활용 방식이 명확하며 목적에 맞는 공간 구성을 원합니다.'}
                      {key === 'discomfort_factors' && '현재 불편한 요소를 개선하려는 의지가 강하며 실용적 해결책을 찾습니다.'}
                      {key === 'activity_flow' && '일상 동선과 활동 패턴을 고려하며 효율적인 동선 계획을 중요시합니다.'}
                      {key === 'life_routine' && '생활 루틴과 습관을 반영한 공간을 원하며 일상에 최적화된 설계를 선호합니다.'}
                      {key === 'sleep_pattern' && '수면 환경과 휴식 공간을 중요하게 생각하며 편안한 침실을 원합니다.'}
                      {key === 'hobby_lifestyle' && '취미와 라이프스타일을 공간에 반영하고자 하며 개성있는 공간을 추구합니다.'}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* 전체 성향 상세 분석 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📈</span>
              <span>전체 성향 상세 분석</span>
            </h3>

            <div className="space-y-4">
              {preferenceList
                .sort((a, b) => b.value - a.value)
                .map(({ key, label, value }) => {
                  const getInsight = (category: PreferenceCategory, score: number): string => {
                    if (score >= 8) {
                      switch (category) {
                        case 'discomfort_factors':
                          return '💡 불편 요소에 대한 관심이 매우 높습니다. 현재의 불편함을 정확히 파악하여 실용적인 해결책을 제시하겠습니다. 문제 중심 접근으로 만족도 높은 결과를 만들어드립니다.';
                        case 'color_preference':
                          return '🎨 색감에 대한 선호도가 뚜렷합니다. 일관된 색상 팔레트로 통일감 있는 공간을 만들어드리겠습니다. 메인/포인트 컬러 조합으로 세련된 분위기를 연출합니다.';
                        case 'lighting_preference':
                          return '💡 조명 연출에 큰 관심을 보이시네요. 시간대별 조명 시나리오로 분위기를 완성하겠습니다. 간접조명과 스마트 조명으로 다양한 무드를 연출합니다.';
                        case 'organization_habit':
                          return '📦 정리 습관이 체계적입니다. 효율적인 수납 시스템으로 더욱 개선할 수 있도록 도와드리겠습니다. 맞춤형 붙박이장과 시스템 수납으로 정리가 쉬운 공간을 만듭니다.';
                        case 'health_factors':
                          return '💚 건강 요소를 최우선으로 고려하시는군요. 공기질, 알레르기 대응 등 건강한 공간을 설계하겠습니다. 친환경 자재와 환기 시스템으로 쾌적한 실내 환경을 조성합니다.';
                        case 'family_composition':
                          return '👨‍👩‍👧‍👦 가족 구성과 생활 패턴을 중시하시네요. 모두가 편안하게 사용할 수 있는 공간을 만들겠습니다. 각자의 공간과 함께하는 공간의 균형을 맞춥니다.';
                        case 'budget_sense':
                          return '💰 예산 관리에 신중하시군요. 우선순위를 명확히 하여 최적의 예산 계획을 수립하겠습니다. 가성비 높은 자재 선택과 단계별 시공으로 합리적인 투자를 돕습니다.';
                        case 'space_sense':
                          return '🏗️ 공간 감각이 뛰어나십니다. 효율적인 동선과 레이아웃으로 공간 활용도를 극대화하겠습니다. 다목적 가구와 공간 분할로 넓고 쾌적한 느낌을 만듭니다.';
                        case 'sensory_sensitivity':
                          return '👂 감각적 민감도가 높으십니다. 소음, 조도, 온습도를 세심하게 조절하여 쾌적한 환경을 만들겠습니다. 차음재와 단열재로 외부 영향을 최소화합니다.';
                        case 'cleaning_preference':
                          return '🧹 청소 편의성을 중시하시네요. 먼지가 쌓이지 않는 디자인과 청소하기 쉬운 마감재를 선택하겠습니다. 로봇청소기 동선을 고려한 가구 배치로 관리가 편한 공간을 만듭니다.';
                        default:
                          return '✨ 이 영역에 대한 관심이 높습니다. 맞춤형 솔루션을 제안하여 만족도 높은 결과를 만들어드리겠습니다.';
                      }
                    } else if (score >= 6) {
                      return '📌 이 영역에 대한 관심이 있습니다. 인테리어 계획에 반영하여 균형있게 개선하겠습니다. 실용성과 심미성을 모두 고려한 설계를 진행합니다.';
                    } else if (score <= 4) {
                      return '📝 이 영역은 상대적으로 우선순위가 낮지만, 전체적인 조화를 위해 기본적인 요소는 충실히 반영하겠습니다.';
                    }
                    return '⚖️ 균형 잡힌 성향을 보이고 있습니다. 다양한 요소를 고려한 종합적인 설계를 진행하겠습니다.';
                  };

                  return (
                    <div key={key} className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-all border border-gray-200 hover:border-blue-300">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-900 text-base md:text-lg">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-base md:text-lg font-bold text-blue-600">{value.toFixed(1)}/10</span>
                          <span className={`text-xs md:text-sm px-3 py-1 rounded-full font-bold ${
                            value >= 8 ? 'bg-green-100 text-green-700' :
                            value >= 6 ? 'bg-blue-100 text-blue-700' :
                            value >= 4 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {value >= 8 ? '매우 높음' : value >= 6 ? '높음' : value >= 4 ? '보통' : '낮음'}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 md:h-3.5 bg-gray-200 rounded-full overflow-hidden mb-4">
                        <div
                          className={`h-full rounded-full transition-all ${
                            value >= 8
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                              : value >= 6
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                                : value >= 4
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                  : 'bg-gradient-to-r from-gray-400 to-gray-500'
                          }`}
                          style={{ width: `${(value / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">{getInsight(key, value)}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* ✅ AI 리포트의 우선 공간/공정 추천 (명확한 이유 포함) */}
        {(analysis.aiReport?.prioritySpaces && analysis.aiReport.prioritySpaces.length > 0) ||
         (analysis.aiReport?.priorityProcesses && analysis.aiReport.priorityProcesses.length > 0) ? (
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-xl p-6 md:p-8 border-2 border-indigo-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">🎯</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  우선 투자 추천
                </h2>
                <p className="text-sm text-gray-600 mt-1">고객님의 성향을 분석한 결과입니다</p>
              </div>
            </div>

            {/* 우선 투자할 공간 */}
            {analysis.aiReport.prioritySpaces && analysis.aiReport.prioritySpaces.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🏠</span>
                  <span>우선 투자할 공간</span>
                </h3>
                <div className="space-y-3">
                  {analysis.aiReport.prioritySpaces.map((space, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-5 border-l-4 border-indigo-400 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            {space.label}
                          </h4>
                          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-indigo-800 mb-1">💡 왜 이 공간인가요?</p>
                            <p className="text-sm text-indigo-900 leading-relaxed">
                              {space.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 우선 고려할 공정 */}
            {analysis.aiReport.priorityProcesses && analysis.aiReport.priorityProcesses.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🔧</span>
                  <span>우선 고려할 공정</span>
                </h3>
                <div className="space-y-3">
                  {analysis.aiReport.priorityProcesses.map((process, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-5 border-l-4 border-purple-400 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            {process.label}
                          </h4>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-purple-800 mb-1">💡 왜 이 공정인가요?</p>
                            <p className="text-sm text-purple-900 leading-relaxed">
                              {process.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 예산 요약 */}
            {analysis.aiReport.budgetSummary && (
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-300">
                <p className="text-sm font-semibold text-indigo-900 mb-2">💰 예산 관련 추천</p>
                <p className="text-sm text-indigo-900 leading-relaxed">
                  {analysis.aiReport.budgetSummary}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* 기존 추천 (fallback) */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-lg p-6 md:p-8 border-2 border-green-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>🧭</span>
              <span>맞춤 인테리어 추천 가이드</span>
            </h2>
            <div className="space-y-4">
              {analysis.recommendations.map((item, index) => (
                <div key={`${item}-${index}`} className="bg-white rounded-xl p-5 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-700 font-bold text-sm">{index + 1}</span>
                    </div>
                    <p className="text-gray-800 text-base md:text-lg leading-relaxed flex-1">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI 인사이트 추가 섹션 */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 md:p-8 border-2 border-indigo-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>🤖</span>
            <span>AI 전문가 인사이트</span>
          </h2>
          <div className="space-y-4">
            {preferenceList.sort((a, b) => b.value - a.value).slice(0, 3).map(({ key, label, value }) => (
              <div key={key} className="bg-white rounded-xl p-5 shadow-sm border border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-100 rounded-full p-3 flex-shrink-0">
                    <span className="text-2xl">
                      {key === 'space_sense' && '🏗️'}
                      {key === 'sensory_sensitivity' && '👂'}
                      {key === 'cleaning_preference' && '🧹'}
                      {key === 'organization_habit' && '📦'}
                      {key === 'family_composition' && '👨‍👩‍👧‍👦'}
                      {key === 'health_factors' && '💚'}
                      {key === 'budget_sense' && '💰'}
                      {key === 'color_preference' && '🎨'}
                      {key === 'lighting_preference' && '💡'}
                      {key === 'home_purpose' && '🎯'}
                      {key === 'discomfort_factors' && '⚠️'}
                      {key === 'activity_flow' && '🚶'}
                      {key === 'life_routine' && '⏰'}
                      {key === 'sleep_pattern' && '😴'}
                      {key === 'hobby_lifestyle' && '🎮'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2 text-base md:text-lg">{label} 중심 설계 전략</h3>
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-3">
                      {key === 'space_sense' && '공간 효율성을 극대화하는 맞춤형 수납 시스템과 다목적 가구를 활용하세요. 동선을 고려한 가구 배치로 생활 편의성을 높이고, 공간 분할을 통해 넓고 쾌적한 느낌을 만들 수 있습니다.'}
                      {key === 'sensory_sensitivity' && '소음 차단 자재와 은은한 간접조명을 활용하고, 온도 조절이 용이한 단열재를 선택하세요. 감각적 쾌적함이 중요하므로 차음재, 조도 조절, 환기 시스템을 세심하게 계획합니다.'}
                      {key === 'cleaning_preference' && '청소가 쉬운 바닥재(강화마루, 타일)와 먼지가 쌓이지 않는 심플한 디자인을 선택하세요. 로봇청소기 동선을 고려한 가구 배치와 틈새 최소화가 효과적입니다.'}
                      {key === 'organization_habit' && '맞춤형 붙박이장과 시스템 수납장을 적극 활용하세요. 카테고리별 수납 공간을 명확히 구분하고, 라벨링 시스템을 도입하면 정리가 더욱 수월합니다.'}
                      {key === 'family_composition' && '가족 구성원 각자의 프라이빗 공간을 확보하면서도 함께 모일 수 있는 거실 공간을 넓게 설계하세요. 안전한 마감재 선택과 연령대별 맞춤 설계가 중요합니다.'}
                      {key === 'health_factors' && '친환경 자재(저VOC 페인트, 무독성 마감재)와 공기청정 시스템을 도입하고, 자연 채광을 최대한 활용하세요. 실내 식물 공간과 환기 시스템도 함께 고려합니다.'}
                      {key === 'budget_sense' && '우선순위가 높은 공간(주방, 욕실)에 예산을 집중하고, 가성비 좋은 자재를 선택하세요. 단계별 시공 계획으로 부담을 줄이고, 필수/선택 항목을 명확히 구분합니다.'}
                      {key === 'color_preference' && '메인 컬러와 포인트 컬러를 명확히 정하고, 톤앤매너를 일관되게 유지하세요. 색상 샘플을 충분히 비교하고, 70-25-5 법칙(메인 70%, 서브 25%, 포인트 5%)을 활용합니다.'}
                      {key === 'lighting_preference' && '공간별로 다양한 조명 시나리오를 구성하세요. 주광색/전구색 조합, 조도 조절이 가능한 스마트 조명 시스템, 간접조명 활용으로 분위기를 연출합니다.'}
                      {key === 'home_purpose' && '집의 주요 용도에 맞춰 공간을 최적화하세요. 재택근무 공간, 취미 공간, 운동 공간 등 특화된 영역을 계획하고 필요한 설비를 갖춥니다.'}
                      {key === 'discomfort_factors' && '현재 불편한 요소(소음, 습기, 수납 부족 등)를 우선적으로 개선하세요. 구체적인 문제점을 파악하고 맞춤 솔루션을 적용하는 것이 만족도를 높입니다.'}
                      {key === 'activity_flow' && '일상 동선을 분석하여 자주 사용하는 공간을 가깝게 배치하세요. 주방-식당-거실 동선, 현관-욕실 동선 등이 겹치지 않도록 설계합니다.'}
                      {key === 'life_routine' && '아침/저녁 루틴에 맞춘 공간 구성이 필요합니다. 생활 패턴을 고려한 수납과 가구 배치로 일상이 편리한 공간을 만듭니다.'}
                      {key === 'sleep_pattern' && '침실의 차음과 차광을 강화하고, 편안한 수면을 위한 온습도 조절 시스템을 고려하세요. 침실 조명은 따뜻한 톤(3000K 이하)으로 선택합니다.'}
                      {key === 'hobby_lifestyle' && '취미 활동을 위한 전용 공간이나 수납 공간을 확보하세요. 라이프스타일을 반영한 맞춤형 인테리어가 삶의 질과 만족도를 높입니다.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                        중요도: {value.toFixed(1)}/10
                      </span>
                      <span className="text-xs text-gray-500">
                        이 영역에 집중하면 만족도가 크게 향상됩니다
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🎨 AI 이미지 생성 섹션 - 프롬프트 기반 */}
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl shadow-xl p-6 md:p-8 border-2 border-purple-300 relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full opacity-20 blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-200 rounded-full opacity-20 blur-3xl -z-10"></div>
          
          {/* 제목 영역 */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl animate-bounce">🎨</span>
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                AI 인테리어 이미지 생성
              </h2>
              <p className="text-sm text-gray-600 mt-1">당신의 성향을 반영한 맞춤 인테리어 이미지를 만들어드립니다</p>
            </div>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse shadow-lg">
              ✨ NEW
            </span>
          </div>
          
          {/* 버튼 영역 */}
          <div className="flex flex-col gap-4">
            {/* 1. 프롬프트 생성 버튼 */}
            <button
              onClick={handleGenerateImagePrompt}
              disabled={isGeneratingPrompt}
              className={`
                w-full px-6 py-4 rounded-xl font-semibold text-lg
                transition-all duration-300 transform hover:scale-105
                flex items-center justify-center gap-3
                min-h-[56px] shadow-lg
                ${isGeneratingPrompt
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600 text-white hover:shadow-2xl'
                }
              `}
            >
              {isGeneratingPrompt ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>프롬프트 생성 중...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">✨</span>
                  <span>이미지 프롬프트 생성하기</span>
                </>
              )}
            </button>

            {/* 프롬프트 표시 */}
            {imagePrompt && (
              <div className="p-5 md:p-6 bg-white rounded-xl border-2 border-purple-300 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📝</span>
                  <h3 className="text-base font-bold text-purple-700">생성된 프롬프트</h3>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm md:text-base bg-purple-50 p-4 rounded-lg">
                  {imagePrompt}
                </p>
              </div>
            )}

            {/* 2. 이미지 생성 버튼 */}
            <button
              onClick={handleGenerateImage}
              disabled={!imagePrompt || isGeneratingImage}
              className={`
                w-full px-6 py-4 rounded-xl font-semibold text-lg
                transition-all duration-300 transform hover:scale-105
                flex items-center justify-center gap-3
                min-h-[56px] shadow-lg
                ${!imagePrompt || isGeneratingImage
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-2xl'
                }
              `}
            >
              {isGeneratingImage ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>AI 이미지 생성 중... ⏱️ 30~60초 소요</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">🎨</span>
                  <span>AI 인테리어 이미지 생성하기</span>
                </>
              )}
            </button>

            {/* 생성된 이미지 표시 */}
            {generatedImageUrl && (
              <div className="space-y-4 animate-fadeIn mt-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🖼️</span>
                    <h3 className="text-lg font-bold text-gray-900">생성된 이미지</h3>
                  </div>
                  <a
                    href={generatedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-argen-500 text-white px-4 py-2 rounded-lg hover:bg-argen-600 font-medium transition-colors"
                  >
                    새 탭에서 보기 →
                  </a>
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-purple-300 bg-white p-2">
                  <img
                    src={generatedImageUrl}
                    alt="AI가 생성한 인테리어 이미지"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <span>💡</span>
                    <span>이 이미지는 AI가 생성한 참고용 이미지입니다. 실제 시공 결과와 다를 수 있습니다.</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* 하단 버튼들 */}
        <div className="flex gap-4 flex-col md:flex-row">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all text-base min-h-[52px]"
          >
            다시 시작
          </button>
          <button
            onClick={() => {
              // 바로 견적 페이지로 이동
              const params = new URLSearchParams()
              params.set('analysisId', analysis.analysisId)
              
              // sessionStorage에서 선택된 공정 가져오기
              const selectedProcessesStr = sessionStorage.getItem('selectedProcesses')
              const selectedProcesses = selectedProcessesStr ? JSON.parse(selectedProcessesStr) : null
              
              console.log('🔍 [result-button2] sessionStorage selectedProcesses:', selectedProcesses)
              
              // 선택된 공정이 있으면 사용, 없으면 전체 공정
              if (selectedProcesses && Array.isArray(selectedProcesses) && selectedProcesses.length > 0) {
                params.set('selectedProcesses', selectedProcesses.join(','))
                console.log('✅ [result-button2] 선택된 공정 사용:', selectedProcesses.join(','))
              } else {
                // 선택된 공정이 없으면 전체 공정 자동 선택
                const allProcesses = ['철거', '주방', '욕실', '타일', '목공', '전기', '도배', '필름', '기타']
                params.set('selectedProcesses', allProcesses.join(','))
                console.log('⚠️ [result-button2] 전체 공정 자동 선택')
              }
              
              // 주방 옵션 가져오기
              const kitchenOptionsStr = sessionStorage.getItem('kitchenOptions')
              if (kitchenOptionsStr) {
                try {
                  const kitchenOptions = JSON.parse(kitchenOptionsStr)
                  if (kitchenOptions.형태) {
                    params.set('kitchenLayout', kitchenOptions.형태)
                    if (kitchenOptions.냉장고장) params.set('kitchenRefrigerator', 'true')
                    if (kitchenOptions.키큰장) params.set('kitchenTallCabinet', 'true')
                    if (kitchenOptions.아일랜드장) params.set('kitchenIsland', 'true')
                    if (kitchenOptions.다용도실) params.set('kitchenUtilityRoom', 'true')
                  }
                } catch (e) {
                  // 파싱 실패 시 기본값
                  params.set('kitchenLayout', '일자')
                }
              } else {
                // 주방 옵션이 없으면 기본값
                params.set('kitchenLayout', '일자')
              }
              
              // 공간 정보 전달
              if (analysis.spaceInfo?.size) {
                params.set('size', String(analysis.spaceInfo.size))
              }
              if (analysis.spaceInfo?.roomCount) {
                params.set('roomCount', String(analysis.spaceInfo.roomCount))
              }
              if (analysis.spaceInfo?.bathroomCount) {
                params.set('bathroomCount', String(analysis.spaceInfo.bathroomCount))
              }
              
              console.log('🔄 [result-button2] 견적 페이지로 이동:', params.toString())
              router.push(`/estimate?${params.toString()}`)
            }}
            className="flex-1 py-4 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-all shadow-lg flex items-center justify-center gap-2 text-base min-h-[52px]"
          >
            <span>💰</span>
            <span>견적 산출</span>
          </button>
          <button
            onClick={() => router.push('/upload')}
            className="flex-1 py-4 bg-argen-500 text-white rounded-xl font-bold hover:bg-argen-600 transition-all shadow-lg text-base min-h-[52px]"
          >
            사진 업로드로 분석
          </button>
        </div>
      </div>
    </div>
  )
}

