'use client'

/**
 * ⚠️ DEPRECATED: 4등급 견적 페이지 (헌법 v1에 따라 사용 중단)
 * 
 * 새로운 견적 페이지: /onboarding/estimate
 * 헌법 v1: 등급 시스템 전면 폐기, 아르젠 기준 단일 견적만 사용
 */

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getDefaultProcessesByAreas, type AreaType } from '@/lib/utils/processMapper'
import { resetEverything } from '@/lib/utils/resetAllStores'

function EstimatePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') || 'quick'
  const analysisId = searchParams.get('analysisId')
  
  const [estimateData, setEstimateData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState<'basic' | 'standard' | 'argen' | 'premium' | null>(null)
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null)
  const [size, setSize] = useState<number>(43)

  useEffect(() => {
    if (analysisId) {
      fetchEstimate()
    }
  }, [analysisId])

  const fetchEstimate = async () => {
    try {
      const storedAnalysis = sessionStorage.getItem(`analysis_${analysisId}`)
      if (!storedAnalysis) {
        alert('분석 데이터를 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      const parsed = JSON.parse(storedAnalysis)
      
      // 평수 추출
      const sizeParam = searchParams.get('size')
      const actualSpaceArea = sizeParam 
        ? parseInt(sizeParam, 10) 
        : parsed.size 
        ? Number(parsed.size)
        : 43
      setSize(actualSpaceArea)

      // 성향 점수 변환 (1-10 → 1-5)
      const convertPreferencesToTraits = (prefs: any) => {
        const convertScore = (score: number): 1 | 2 | 3 | 4 | 5 => {
          const converted = Math.round((score / 10) * 5)
          if (converted < 1) return 1
          if (converted > 5) return 5
          return converted as 1 | 2 | 3 | 4 | 5
        }

        return {
          요리빈도: convertScore(prefs.activityLevel || prefs.spacePurpose || 5),
          정리정돈: convertScore(prefs.organizationLevel || 5),
          청소성향: convertScore(prefs.cleaningTendency || 5),
          조명취향: convertScore(prefs.lightingPreference || 5),
          예산감각: convertScore(prefs.budgetSense || 5),
        }
      }

      const 성향 = convertPreferencesToTraits(parsed.preferences || {})

      // 방개수와 욕실개수 추출
      let roomCount: number
      if (parsed.spaceInfo?.roomCount !== undefined && parsed.spaceInfo?.roomCount !== null) {
        roomCount = Number(parsed.spaceInfo.roomCount)
      } else if (searchParams.get('roomCount')) {
        roomCount = parseInt(searchParams.get('roomCount')!, 10)
      } else {
        roomCount = 3
      }
      
      let bathroomCount: number
      if (parsed.spaceInfo?.bathroomCount !== undefined && parsed.spaceInfo?.bathroomCount !== null) {
        bathroomCount = Number(parsed.spaceInfo.bathroomCount)
      } else if (searchParams.get('bathroomCount')) {
        bathroomCount = parseInt(searchParams.get('bathroomCount')!, 10)
      } else {
        bathroomCount = 2
      }

      if (isNaN(roomCount) || roomCount <= 0) roomCount = 3
      if (isNaN(bathroomCount) || bathroomCount < 0) bathroomCount = 2

      // 1순위: 직접 선택된 공정 (URL 파라미터) - 기존 호환성 유지
      const selectedProcessesParam = searchParams.get('selectedProcesses')
      let selectedProcesses: string[] | undefined = undefined
      
      console.log('🔍 [estimate/page] selectedProcessesParam:', selectedProcessesParam);
      
      if (selectedProcessesParam) {
        // 직접 선택된 공정이 있으면 그것을 사용
        selectedProcesses = selectedProcessesParam.split(',').filter(Boolean)
        console.log('✅ 고객이 직접 선택한 공정:', selectedProcesses)
      } else {
        // 2순위: 선택된 영역을 기반으로 AI가 공정 추천
        const areasParam = searchParams.get('areas')
        const areasFromUrl = areasParam ? areasParam.split(',').filter(Boolean) as AreaType[] : []
        const areasFromStorage = parsed.spaceInfo?.areas || []
        const selectedAreas = areasFromUrl.length > 0 ? areasFromUrl : areasFromStorage
        
        if (selectedAreas && selectedAreas.length > 0) {
          console.log('🤖 AI 공정 추천 시작:', selectedAreas)
          
          try {
            // AI가 공간에 필요한 공정 추천
            const recommendResponse = await fetch('/api/recommend/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                selectedAreas,
                spaceInfo: {
                  size: actualSpaceArea,
                  roomCount,
                  bathroomCount,
                  housingType: parsed.spaceInfo?.housingType,
                },
                preferences: parsed.preferences,
              }),
            })
            
            if (recommendResponse.ok) {
              const recommendData = await recommendResponse.json()
              if (recommendData.success && recommendData.recommendedProcesses) {
                selectedProcesses = recommendData.recommendedProcesses
                console.log('✨ AI 추천 공정:', selectedProcesses, '이유:', recommendData.reason)
              } else {
                // AI 추천 실패 시 기본 매핑 사용
                selectedProcesses = getDefaultProcessesByAreas(selectedAreas)
                console.log('⚠️ AI 추천 실패, 기본 매핑 사용:', selectedProcesses)
              }
            } else {
              // API 에러 시 기본 매핑 사용
              selectedProcesses = getDefaultProcessesByAreas(selectedAreas)
              console.log('⚠️ AI 추천 API 오류, 기본 매핑 사용:', selectedProcesses)
            }
          } catch (error) {
            console.error('❌ AI 공정 추천 오류:', error)
            // 에러 시 기본 매핑 사용
            selectedProcesses = getDefaultProcessesByAreas(selectedAreas)
            console.log('📋 기본 매핑 사용:', selectedProcesses)
          }
        }
      }

      // 주방 옵션 추출
      const kitchenLayout = searchParams.get('kitchenLayout')
      const kitchenRefrigerator = searchParams.get('kitchenRefrigerator') === 'true'
      const kitchenTallCabinet = searchParams.get('kitchenTallCabinet') === 'true'
      const kitchenIsland = searchParams.get('kitchenIsland') === 'true'
      const kitchenUtilityRoom = searchParams.get('kitchenUtilityRoom') === 'true'

      // 욕실 옵션 추출
      const bathroomStyle = searchParams.get('bathroomStyle')
      const bathroomBathtub = searchParams.get('bathroomBathtub') === 'true'
      const bathroomShowerBooth = searchParams.get('bathroomShowerBooth') === 'true'
      const bathroomBidet = searchParams.get('bathroomBidet') === 'true'
      const bathroomFaucetUpgrade = searchParams.get('bathroomFaucetUpgrade') === 'true'

      // 목공 옵션 추출
      const woodworkFurniture = searchParams.get('woodworkFurniture')?.split(',').filter(Boolean) || []
      const woodworkCustom = searchParams.get('woodworkCustom') === 'true'

      const requestBody: any = {
        평수: Number(actualSpaceArea),
        방개수: Number(roomCount),
        욕실개수: Number(bathroomCount),
        현재상태: parsed.spaceInfo?.housingType === 'new' ? '신축' : '구축아파트',
        성향: 성향,
        selectedProcesses: selectedProcesses // 선택된 공정 전달
      }
      
      console.log('🔍 [estimate/page] selectedProcesses 확인:', selectedProcesses);
      console.log('🔍 [estimate/page] requestBody.selectedProcesses:', requestBody.selectedProcesses);

      // 주방 공정이 선택되었고 주방 옵션이 있으면 추가
      if (selectedProcesses?.includes('주방') && kitchenLayout) {
        requestBody.주방옵션 = {
          형태: kitchenLayout,
          냉장고장: kitchenRefrigerator,
          키큰장: kitchenTallCabinet,
          아일랜드장: kitchenIsland,
          다용도실: kitchenUtilityRoom,
        }
        console.log('🍳 주방 옵션:', requestBody.주방옵션)
      }

      // 욕실 공정이 선택되었고 욕실 옵션이 있으면 추가
      if (selectedProcesses?.includes('욕실') && bathroomStyle) {
        requestBody.욕실옵션 = {
          스타일: bathroomStyle,
          욕조: bathroomBathtub,
          샤워부스: bathroomShowerBooth,
          비데: bathroomBidet,
          수전업그레이드: bathroomFaucetUpgrade,
        }
        console.log('🚿 욕실 옵션:', requestBody.욕실옵션)
      }

      // 목공 공정이 선택되었고 목공 옵션이 있으면 추가
      if (selectedProcesses?.includes('목공') && woodworkFurniture.length > 0) {
        requestBody.목공옵션 = {
          선택가구: woodworkFurniture,
          맞춤제작: woodworkCustom,
        }
        console.log('🪵 목공 옵션:', requestBody.목공옵션)
      }

      console.log('📊 견적 요청 데이터:', requestBody)

      const response = await fetch('/api/estimate/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ 견적 계산 오류:', errorData)
        throw new Error(errorData.error || `견적 계산 실패 (HTTP ${response.status})`)
      }

      const result = await response.json()
      
      // 4등급 견적 시스템 응답 확인
      if (result.basic && result.standard && result.argen && result.premium) {
        setEstimateData(result)
        setSelectedGrade(result.recommended || 'argen')
      } else {
        throw new Error('4등급 견적 데이터가 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('견적 가져오기 오류:', error)
      alert(error instanceof Error ? error.message : '견적을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-argen-500 mx-auto mb-4"></div>
          <p className="text-argen-700">견적을 계산하는 중...</p>
        </div>
      </main>
    )
  }

  if (!estimateData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 flex items-center justify-center">
        <div className="text-center">
          <p className="text-argen-800 text-lg mb-4">견적 데이터를 불러올 수 없습니다.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-argen-500 text-white rounded-xl hover:bg-argen-600"
          >
            홈으로 돌아가기
          </button>
        </div>
      </main>
    )
  }

  const grades = [
    { key: 'basic', label: 'Basic', description: '저가형', color: 'gray' },
    { key: 'standard', label: 'Standard', description: '중급형', color: 'blue' },
    { key: 'argen', label: 'ARGEN', description: '맞춤 제작', color: 'amber', recommended: true },
    { key: 'premium', label: 'Premium', description: '고급형', color: 'purple' },
  ]

  const getGradeData = (gradeKey: string) => {
    return estimateData[gradeKey]
  }

  const formatPrice = (price: number) => {
    return Math.round(price / 10000).toLocaleString()
  }

  // 선택된 옵션 정보 추출
  const kitchenLayout = searchParams.get('kitchenLayout')
  const bathroomStyle = searchParams.get('bathroomStyle')
  const woodworkFurniture = searchParams.get('woodworkFurniture')?.split(',').filter(Boolean) || []
  const selectedProcessesParam = searchParams.get('selectedProcesses')
  const selectedProcesses = selectedProcessesParam ? selectedProcessesParam.split(',') : []

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-argen-800 mb-2">
            예상 견적
          </h1>
          <p className="text-argen-700">{size}평 리모델링</p>
        </div>

        {/* 견적서 이해하기 안내 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            💡 견적서 이해하기
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4">
              <div className="font-bold text-blue-900 mb-2">📦 재료비란?</div>
              <div className="text-gray-700">
                실제 시공에 사용되는 자재(타일, 싱크대, 변기 등)의 구매 비용입니다. 
                브랜드와 등급에 따라 가격이 달라집니다.
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-bold text-blue-900 mb-2">👷 노무비란?</div>
              <div className="text-gray-700">
                시공 인력(목수, 타일공, 전기공 등)의 인건비입니다. 
                작업 난이도와 소요 시간에 따라 산정됩니다.
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-bold text-blue-900 mb-2">🏗 직접공사비란?</div>
              <div className="text-gray-700">
                재료비 + 노무비의 합계입니다. 
                실제 시공에 직접 투입되는 비용을 의미합니다.
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-bold text-blue-900 mb-2">📋 간접공사비란?</div>
              <div className="text-gray-700">
                산재보험, 현장관리비, 공과잡비 등 시공을 위해 필요한 
                부대 비용입니다. (직접공사비의 약 8-10%)
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div className="text-sm text-gray-700">
                <span className="font-bold text-amber-900">참고:</span> 
                제시된 견적은 표준 시공 기준이며, 현장 상황(구조, 접근성, 층수 등)에 따라 
                실제 견적은 ±5% 범위에서 변동될 수 있습니다.
              </div>
            </div>
          </div>
        </div>

        {/* 선택된 공정 및 옵션 표시 */}
        {selectedProcesses.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-argen-100 p-6 mb-8">
            <h3 className="text-xl font-bold text-argen-800 mb-4">선택된 공정 및 옵션</h3>
            
            {/* 선택된 공정 */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedProcesses.map((process) => (
                  <span
                    key={process}
                    className="px-4 py-2 bg-gradient-to-r from-argen-500 to-argen-600 text-white rounded-full text-sm font-medium shadow-md"
                  >
                    {process}
                  </span>
                ))}
              </div>
            </div>

            {/* 주방 옵션 */}
            {kitchenLayout && (
              <div className="mb-3 p-4 bg-argen-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🍳</span>
                  <span className="font-bold text-argen-800">주방 옵션</span>
                </div>
                <div className="flex flex-wrap gap-2 ml-8">
                  <span className="px-3 py-1 bg-white border border-argen-300 text-argen-700 rounded-full text-sm">
                    {kitchenLayout}형
                  </span>
                  {searchParams.get('kitchenRefrigerator') === 'true' && (
                    <span className="px-3 py-1 bg-white border border-argen-300 text-argen-700 rounded-full text-sm">
                      냉장고장
                    </span>
                  )}
                  {searchParams.get('kitchenTallCabinet') === 'true' && (
                    <span className="px-3 py-1 bg-white border border-argen-300 text-argen-700 rounded-full text-sm">
                      키큰장
                    </span>
                  )}
                  {searchParams.get('kitchenIsland') === 'true' && (
                    <span className="px-3 py-1 bg-white border border-argen-300 text-argen-700 rounded-full text-sm">
                      아일랜드장
                    </span>
                  )}
                  {searchParams.get('kitchenUtilityRoom') === 'true' && (
                    <span className="px-3 py-1 bg-white border border-argen-300 text-argen-700 rounded-full text-sm">
                      다용도실
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 욕실 옵션 */}
            {bathroomStyle && (
              <div className="mb-3 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🚿</span>
                  <span className="font-bold text-argen-800">욕실 옵션</span>
                </div>
                <div className="flex flex-wrap gap-2 ml-8">
                  <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-sm">
                    {bathroomStyle} 스타일
                  </span>
                  {searchParams.get('bathroomBathtub') === 'true' && (
                    <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-sm">
                      욕조
                    </span>
                  )}
                  {searchParams.get('bathroomShowerBooth') === 'true' && (
                    <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-sm">
                      샤워부스
                    </span>
                  )}
                  {searchParams.get('bathroomBidet') === 'true' && (
                    <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-sm">
                      비데
                    </span>
                  )}
                  {searchParams.get('bathroomFaucetUpgrade') === 'true' && (
                    <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-sm">
                      수전 업그레이드
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 목공 옵션 */}
            {woodworkFurniture.length > 0 && (
              <div className="p-4 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🪵</span>
                  <span className="font-bold text-argen-800">목공 가구</span>
                </div>
                <div className="flex flex-wrap gap-2 ml-8">
                  {woodworkFurniture.map((furniture) => {
                    const furnitureLabels: Record<string, string> = {
                      closet: '붙박이장',
                      shoeCabinet: '신발장',
                      tvStand: 'TV장',
                      bookshelf: '책장',
                      dresser: '화장대',
                      desk: '책상',
                    }
                    return (
                      <span
                        key={furniture}
                        className="px-3 py-1 bg-white border border-amber-300 text-amber-700 rounded-full text-sm"
                      >
                        {furnitureLabels[furniture] || furniture}
                      </span>
                    )
                  })}
                  {searchParams.get('woodworkCustom') === 'true' && (
                    <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-semibold">
                      맞춤 제작
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4등급 견적 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {grades.map((grade) => {
            const data = getGradeData(grade.key)
            const isRecommended = grade.recommended && estimateData.recommended === grade.key
            const isSelected = selectedGrade === grade.key

            // 등급별 특징 설명
            const gradeFeatures: Record<string, string[]> = {
              basic: ['💰 경제적인 선택', '🏠 기본 사양', '⚡ 빠른 시공'],
              standard: ['⭐ 중급 브랜드', '🎯 가성비 우수', '✨ 안정적 품질'],
              argen: ['👑 아르젠 맞춤 제작', '🛠 공간 최적화', '💎 프리미엄 마감'],
              premium: ['🌟 최고급 브랜드', '🎨 디자이너 마감', '🏆 명품 자재'],
            }

            return (
              <div
                key={grade.key}
                onClick={() => setSelectedGrade(grade.key as any)}
                className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? isRecommended
                      ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-xl scale-105'
                      : `border-${grade.color}-500 bg-${grade.color}-50 shadow-lg scale-105`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                    ⭐ AI 추천
                  </div>
                )}
                <h3 className="font-bold text-xl mb-2">{grade.label}</h3>
                <div className="text-sm text-gray-600 mb-3 font-medium">{grade.description}</div>
                
                {/* 가격 */}
                <div className="text-3xl font-bold text-argen-800 mb-3">
                  {formatPrice(data.총액)}
                  <span className="text-lg">만원</span>
                </div>

                {/* 등급별 특징 */}
                <div className="space-y-1 mb-3">
                  {gradeFeatures[grade.key]?.map((feature, idx) => (
                    <div key={idx} className="text-xs text-gray-700 flex items-center gap-1">
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* 선택 시 상세 정보 */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-300">
                    <div className="text-xs text-gray-700 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">재료비:</span>
                        <span className="font-semibold">{formatPrice(data.재료비)}만원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">노무비:</span>
                        <span className="font-semibold">{formatPrice(data.노무비)}만원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">직접공사비:</span>
                        <span className="font-semibold">{formatPrice(data.직접공사비)}만원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">간접공사비:</span>
                        <span className="font-semibold">{formatPrice(data.간접공사비.합계)}만원</span>
                      </div>
                      <div className="pt-2 border-t border-gray-300 mt-2">
                        <div className="text-center text-argen-700 font-bold text-sm">
                          👇 아래에서 세부내역 확인
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 선택되지 않았을 때 클릭 유도 */}
                {!isSelected && (
                  <div className="mt-4 text-center text-xs text-gray-500">
                    클릭하여 상세보기
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 아르젠 추천 설명 */}
        {estimateData.recommended === 'argen' && (
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-6 mb-8 border-2 border-amber-300">
            <h3 className="text-xl font-bold text-amber-900 mb-3">
              ⭐ 아르젠 추천이 특별한 이유
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4">
                <div className="font-bold text-amber-900 mb-2">🛠 맞춤 제작</div>
                <div className="text-gray-700">
                  싱크대, 붙박이장 등 공간에 딱 맞는 아르젠 자체 제작
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="font-bold text-amber-900 mb-2">✨ 엄선된 조합</div>
                <div className="text-gray-700">
                  Standard 가격대에 프리미엄 품질을 더한 최적 조합
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="font-bold text-amber-900 mb-2">💎 가성비</div>
                <div className="text-gray-700">
                  Premium 품질을 Standard + 15% 가격에 제공
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 등급 간 비교 정보 */}
        {selectedGrade && (
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 mb-8 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              📊 등급별 가격 비교
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {grades.map((g) => {
                const gData = getGradeData(g.key)
                const isCurrentGrade = g.key === selectedGrade
                const priceDiff = gData.총액 - getGradeData(selectedGrade).총액
                
                return (
                  <div
                    key={g.key}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCurrentGrade
                        ? 'bg-white border-argen-500 shadow-md'
                        : 'bg-white/60 border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-700 mb-1">{g.label}</div>
                    <div className="text-lg font-bold text-argen-800">
                      {formatPrice(gData.총액)}만원
                    </div>
                    {!isCurrentGrade && priceDiff !== 0 && (
                      <div className={`text-xs mt-1 ${priceDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {priceDiff > 0 ? '↑' : '↓'} {formatPrice(Math.abs(priceDiff))}만원
                      </div>
                    )}
                    {isCurrentGrade && (
                      <div className="text-xs mt-1 text-argen-600 font-semibold">
                        ✓ 현재 선택
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 선택한 등급의 세부 내역 */}
        {selectedGrade && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-argen-100 p-8 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-argen-800 mb-2">
                  {grades.find(g => g.key === selectedGrade)?.label} 등급 세부 내역
                </h2>
                <p className="text-sm text-gray-600">
                  {expandedGrade === selectedGrade 
                    ? '공정별 세부 내역을 확인하세요' 
                    : '세부견적보기 버튼을 눌러 자세한 내역을 확인하세요'}
                </p>
              </div>
              <button
                onClick={() => setExpandedGrade(expandedGrade === selectedGrade ? null : selectedGrade)}
                className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-argen-500 via-purple-500 to-argen-600 text-white rounded-xl hover:from-argen-600 hover:via-purple-600 hover:to-argen-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-3 border-2 border-argen-400 animate-pulse hover:animate-none"
              >
                {expandedGrade === selectedGrade ? (
                  <>
                    <span className="text-xl">📋</span>
                    <span>접기</span>
                    <span className="text-xl">▲</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">📋</span>
                    <span>세부견적보기</span>
                    <span className="text-xl">▼</span>
                  </>
                )}
              </button>
            </div>

            {(() => {
              const gradeData = getGradeData(selectedGrade)
              
              return (
                <>
                  {/* 요약 정보 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="border-2 border-argen-200 rounded-xl p-4 bg-white/60">
                      <p className="text-sm text-argen-600 mb-2">재료비</p>
                      <p className="text-2xl font-bold text-argen-800">
                        {formatPrice(gradeData.재료비)}만원
                      </p>
                    </div>
                    <div className="border-2 border-argen-200 rounded-xl p-4 bg-white/60">
                      <p className="text-sm text-argen-600 mb-2">노무비</p>
                      <p className="text-2xl font-bold text-argen-800">
                        {formatPrice(gradeData.노무비)}만원
                      </p>
                    </div>
                    <div className="border-2 border-argen-200 rounded-xl p-4 bg-white/60">
                      <p className="text-sm text-argen-600 mb-2">직접공사비</p>
                      <p className="text-2xl font-bold text-argen-800">
                        {formatPrice(gradeData.직접공사비)}만원
                      </p>
                    </div>
                    <div className="border-2 border-argen-200 rounded-xl p-4 bg-white/60">
                      <p className="text-sm text-argen-600 mb-2">간접공사비</p>
                      <p className="text-2xl font-bold text-argen-800">
                        {formatPrice(gradeData.간접공사비.합계)}만원
                      </p>
                    </div>
                  </div>

                  {/* 간접공사비 상세 */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">간접공사비 상세</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">산재고용보험:</span>
                        <span className="ml-2 font-semibold">{formatPrice(gradeData.간접공사비.산재고용보험)}만원</span>
                      </div>
                      <div>
                        <span className="text-gray-600">공과잡비:</span>
                        <span className="ml-2 font-semibold">{formatPrice(gradeData.간접공사비.공과잡비)}만원</span>
                      </div>
                      <div>
                        <span className="text-gray-600">현장관리및감리:</span>
                        <span className="ml-2 font-semibold">{formatPrice(gradeData.간접공사비.현장관리및감리)}만원</span>
                      </div>
                    </div>
                  </div>

                  {/* 범위 견적 */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2">예상 범위</h3>
                    <p className="text-blue-700">
                      {formatPrice(gradeData.범위견적.min)}만원 ~ {formatPrice(gradeData.범위견적.max)}만원
                    </p>
                  </div>

                  {/* 세부 내역 - 공정별 그룹화 */}
                  {expandedGrade === selectedGrade && gradeData.세부내역 && (
                    <div className="mt-6">
                      <h3 className="text-xl font-bold text-argen-800 mb-6 flex items-center gap-2">
                        📋 공정별 세부 내역
                        <span className="text-sm font-normal text-gray-600">
                          (총 {gradeData.세부내역.length}개 항목)
                        </span>
                      </h3>
                      
                      {(() => {
                        // 공정별로 그룹화
                        const groupedByProcess: Record<string, any[]> = {}
                        gradeData.세부내역.forEach((item: any) => {
                          if (!groupedByProcess[item.공정]) {
                            groupedByProcess[item.공정] = []
                          }
                          groupedByProcess[item.공정].push(item)
                        })

                        // 공정별 아이콘 및 설명
                        const processInfo: Record<string, { icon: string; color: string; description: string }> = {
                          '철거': { icon: '🔨', color: 'red', description: '기존 시설물 해체 및 폐기물 처리' },
                          '주방': { icon: '🍳', color: 'orange', description: '싱크대, 상판, 수전 등 주방 시설 설치' },
                          '욕실': { icon: '🚿', color: 'blue', description: '변기, 세면대, 욕조 등 욕실 설비 설치' },
                          '타일': { icon: '🔲', color: 'cyan', description: '벽/바닥 타일 시공 및 줄눈 처리' },
                          '목공': { icon: '🪵', color: 'amber', description: '붙박이장, 몰딩, 가구 제작 및 설치' },
                          '전기': { icon: '💡', color: 'yellow', description: '조명, 콘센트, 스위치 등 전기 설비' },
                          '도배': { icon: '🎨', color: 'purple', description: '벽지 시공 및 마감' },
                          '필름': { icon: '🚪', color: 'green', description: '도어, 창틀 필름 시공' },
                          '기타': { icon: '🔧', color: 'gray', description: '기타 부대 공사' },
                        }

                        return Object.entries(groupedByProcess).map(([processName, items]) => {
                          const info = processInfo[processName] || { icon: '📦', color: 'gray', description: '기타 공정' }
                          
                          // 공정별 소계 계산
                          const processTotal = items.reduce((sum, item) => sum + (item.합계 || 0), 0)
                          const processMaterial = items.reduce((sum, item) => sum + (item.재료비 || 0), 0)
                          const processLabor = items.reduce((sum, item) => sum + (item.노무비 || 0), 0)

                          return (
                            <div key={processName} className="mb-8 border-2 border-argen-100 rounded-xl overflow-hidden bg-white shadow-sm">
                              {/* 공정 헤더 */}
                              <div className={`bg-gradient-to-r from-${info.color}-50 to-${info.color}-100 px-6 py-4 border-b-2 border-${info.color}-200`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-3xl">{info.icon}</span>
                                    <div>
                                      <h4 className="text-lg font-bold text-gray-800">{processName}</h4>
                                      <p className="text-sm text-gray-600">{info.description}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-argen-700">
                                      {formatPrice(processTotal)}만원
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      재료 {formatPrice(processMaterial)} + 노무 {formatPrice(processLabor)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 공정별 항목 테이블 */}
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">항목</th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">브랜드/규격</th>
                                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">수량</th>
                                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">재료비</th>
                                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">노무비</th>
                                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">합계</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((item: any, idx: number) => (
                                      <tr key={idx} className="border-b border-gray-100 hover:bg-argen-50/30 transition-colors">
                                        <td className="px-4 py-3">
                                          <div className="text-sm font-semibold text-gray-800">{item.항목}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm">
                                            {item.브랜드 && item.브랜드 !== '-' && (
                                              <div className="font-medium text-argen-700 mb-1">
                                                🏷️ {item.브랜드}
                                              </div>
                                            )}
                                            {item.규격 && item.규격 !== '-' && item.규격 !== item.브랜드 && (
                                              <div className="text-xs text-gray-600">
                                                📐 {item.규격}
                                              </div>
                                            )}
                                            {(!item.브랜드 || item.브랜드 === '-') && (!item.규격 || item.규격 === '-') && (
                                              <span className="text-xs text-gray-400">정보 없음</span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <span className="text-sm font-medium text-gray-700">
                                            {item.수량} <span className="text-xs text-gray-500">{item.단위}</span>
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <span className="text-sm text-gray-700">
                                            {formatPrice(item.재료비)}
                                            <span className="text-xs text-gray-500 ml-1">만원</span>
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          {item.작업정보 ? (
                                            <div className="text-sm">
                                              <div className="font-semibold text-gray-800 mb-1">
                                                {formatPrice(item.노무비)}
                                                <span className="text-xs text-gray-500 ml-1">만원</span>
                                              </div>
                                              <div className="text-xs text-gray-600 space-y-0.5">
                                                <div>👷 작업인원: {item.작업정보.작업인원}명</div>
                                                <div>📅 작업기간: {item.작업정보.작업기간}{item.작업정보.작업기간단위}</div>
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-sm text-gray-700">
                                              {formatPrice(item.노무비)}
                                              <span className="text-xs text-gray-500 ml-1">만원</span>
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <span className="text-base font-bold text-argen-800">
                                            {formatPrice(item.합계)}
                                            <span className="text-sm text-gray-600 ml-1">만원</span>
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  {/* 공정별 소계 */}
                                  <tfoot>
                                    <tr className={`bg-${info.color}-50 font-bold`}>
                                      <td colSpan={3} className="px-4 py-3 text-right text-sm text-gray-700">
                                        {processName} 소계
                                      </td>
                                      <td className="px-4 py-3 text-right text-sm text-gray-800">
                                        {formatPrice(processMaterial)}만원
                                      </td>
                                      <td className="px-4 py-3 text-right text-sm text-gray-800">
                                        {formatPrice(processLabor)}만원
                                      </td>
                                      <td className="px-4 py-3 text-right text-base text-argen-800">
                                        {formatPrice(processTotal)}만원
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )
                        })
                      })()}

                      {/* 전체 합계 요약 */}
                      <div className="mt-8 bg-gradient-to-br from-argen-100 via-purple-50 to-roseSoft/40 rounded-xl p-6 border-2 border-argen-300">
                        <h4 className="text-lg font-bold text-argen-900 mb-4">💰 견적 총액 상세</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-argen-200">
                            <span className="text-gray-700">재료비 합계</span>
                            <span className="text-lg font-semibold text-gray-800">
                              {formatPrice(gradeData.재료비)}만원
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-argen-200">
                            <span className="text-gray-700">노무비 합계</span>
                            <span className="text-lg font-semibold text-gray-800">
                              {formatPrice(gradeData.노무비)}만원
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-argen-200">
                            <span className="text-gray-700 font-medium">직접공사비</span>
                            <span className="text-lg font-semibold text-argen-700">
                              {formatPrice(gradeData.직접공사비)}만원
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-argen-200">
                            <span className="text-gray-700">간접공사비</span>
                            <span className="text-lg font-semibold text-gray-800">
                              {formatPrice(gradeData.간접공사비.합계)}만원
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t-2 border-argen-400">
                            <span className="text-xl font-bold text-argen-900">최종 견적 금액</span>
                            <span className="text-3xl font-bold text-argen-800">
                              {formatPrice(gradeData.총액)}만원
                            </span>
                          </div>
                          <div className="text-center text-sm text-gray-600 mt-2">
                            예상 범위: {formatPrice(gradeData.범위견적.min)}만원 ~ {formatPrice(gradeData.범위견적.max)}만원
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* 견적서 활용 팁 */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 mb-8 border-2 border-green-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            💼 견적서 활용 팁
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4">
              <div className="font-bold text-green-900 mb-2">1️⃣ 등급 비교하기</div>
              <div className="text-gray-700">
                4가지 등급을 비교하여 예산과 품질의 균형점을 찾으세요. 
                아르젠 등급은 가성비가 가장 우수합니다.
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-bold text-green-900 mb-2">2️⃣ 세부내역 확인</div>
              <div className="text-gray-700">
                '세부견적보기' 버튼을 눌러 공정별 항목, 브랜드, 수량을 
                꼼꼼히 확인하세요.
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-bold text-green-900 mb-2">3️⃣ 상담 준비</div>
              <div className="text-gray-700">
                이 견적서를 캡처하거나 저장하여 시공사 상담 시 
                기준 자료로 활용하세요.
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <span className="text-lg">📞</span>
              <div className="text-sm text-gray-700">
                <span className="font-bold text-blue-900">전문가 상담이 필요하신가요?</span> 
                <br />
                인테리봇 전문 상담사가 견적 해석부터 시공사 매칭까지 도와드립니다.
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              if (confirm('모든 입력 정보를 초기화하고 처음부터 다시 시작하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
                resetEverything()
                router.push('/')
              }
            }}
            className="px-6 py-3 bg-white/80 border border-argen-200 text-argen-700 rounded-xl hover:bg-argen-50 transition-all font-medium"
          >
            🔄 새로 시작하기
          </button>
          <button
            onClick={() => router.push(`/result?${searchParams.toString()}`)}
            className="px-6 py-3 bg-argen-500 text-white rounded-xl hover:bg-argen-600 transition-all font-semibold"
          >
            분석 결과 보기
          </button>
        </div>
      </div>
    </main>
  )
}

export default function EstimatePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-argen-500 mx-auto mb-4"></div>
          <p className="text-argen-700">로딩 중...</p>
        </div>
      </main>
    }>
      <EstimatePageContent />
    </Suspense>
  )
}
