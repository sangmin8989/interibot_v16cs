'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PyeongInput from '@/components/PyeongInput'

type AreaType = 
  | 'living'      // 거실
  | 'kitchen'      // 주방
  | 'bathroom'     // 욕실
  | 'bedroom'      // 침실
  | 'balcony'      // 베란다
  | 'utility'      // 다용도실
  | 'dressing'    // 드레스룸
  | 'study'        // 서재/작업실
  | 'kids'         // 아이방
  | 'kidsroom'     // 아이방
  | 'veranda'      // 베란다
  | 'laundry'      // 다용도실
  | 'entrance'     // 현관
  | 'storage'      // 창고/수납공간
  | 'full'         // 전체 리모델링
  | 'fullhome'     // 전체 리모델링

interface AreaInfo {
  selectedAreas: AreaType[]
}

const AREA_OPTIONS: { key: AreaType; label: string; icon: string; description: string }[] = [
  { key: 'living', label: '거실', icon: '🛋️', description: '거실 공간' },
  { key: 'kitchen', label: '주방', icon: '🍳', description: '주방 공간' },
  { key: 'bathroom', label: '욕실', icon: '🚿', description: '욕실 공간' },
  { key: 'bedroom', label: '침실', icon: '🛏️', description: '침실 공간' },
  { key: 'kidsroom', label: '아이방', icon: '🧸', description: '아이방 공간' },
  { key: 'study', label: '서재/작업실', icon: '📚', description: '서재 또는 작업실' },
  { key: 'dressing', label: '드레스룸', icon: '👔', description: '드레스룸 공간' },
  { key: 'veranda', label: '베란다', icon: '🌿', description: '베란다 공간' },
  { key: 'laundry', label: '다용도실', icon: '📦', description: '다용도실 공간' },
  { key: 'entrance', label: '현관', icon: '🚪', description: '현관 공간' },
  { key: 'storage', label: '창고/수납', icon: '📦', description: '창고 또는 수납공간' },
  { key: 'fullhome', label: '전체 리모델링', icon: '🏠', description: '전체 공간 리모델링' },
]

function SpaceAreaPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') || 'quick'
  
  // URL에서 size 파라미터 읽기
  const sizeParam = searchParams.get('size')
  console.log('🔍 space-area 페이지 로드:', { sizeParam, allParams: Object.fromEntries(searchParams.entries()) })
  
  const totalSize = sizeParam && parseInt(sizeParam, 10) > 0 ? parseInt(sizeParam, 10) : 0 // 전체 평수
  
  console.log('📏 전체 평수:', totalSize)

  // URL에서 공간 정보 가져오기
  const spaceInfoParams = {
    housingType: searchParams.get('housingType') || '',
    region: searchParams.get('region') || '',
    size: sizeParam || '',
    roomCount: searchParams.get('roomCount') || '',
    bathroomCount: searchParams.get('bathroomCount') || '',
  }

  const [areaInfo, setAreaInfo] = useState<AreaInfo>({
    selectedAreas: [],
  })

  // 영역별 면적 상태 추가
  const [areaSizes, setAreaSizes] = useState<Record<string, number>>({})
  
  // 영역별 가로×세로×높이 상태 추가
  const [areaDimensions, setAreaDimensions] = useState<Record<string, { width: number; depth: number; height: number }>>({})

  const toggleArea = (area: AreaType) => {
    setAreaInfo((prev) => {
      // 전체 리모델링 선택 시 다른 선택 해제
      if (area === 'fullhome' || area === 'full') {
        return { selectedAreas: ['fullhome'] }
      }
      
      // 다른 영역 선택 시 전체 리모델링 해제
      const newAreas = prev.selectedAreas.includes(area)
        ? prev.selectedAreas.filter((a) => a !== area && a !== 'fullhome' && a !== 'full')
        : [...prev.selectedAreas.filter((a) => a !== 'fullhome' && a !== 'full'), area]
      
      return { selectedAreas: newAreas }
    })
  }

  const handleAreaSizeChange = (area: AreaType, size: number) => {
    setAreaSizes({
      ...areaSizes,
      [area]: size,
    })
  }

  const handleDimensionChange = (area: AreaType, dimension: 'width' | 'depth' | 'height', value: number) => {
    const current = areaDimensions[area] || { width: 0, depth: 0, height: 0 }
    const updated = {
      ...current,
      [dimension]: value,
    }
    setAreaDimensions({
      ...areaDimensions,
      [area]: updated,
    })

    // 가로×세로가 모두 입력되면 자동으로 면적 계산 (m² → 평)
    if (dimension === 'width' || dimension === 'depth') {
      if (updated.width > 0 && updated.depth > 0) {
        const areaM2 = updated.width * updated.depth
        const areaPyeong = areaM2 / 3.3058
        if (areaPyeong >= 1 && areaPyeong <= totalSize) {
          handleAreaSizeChange(area, parseFloat(areaPyeong.toFixed(2)))
        }
      }
    }
  }

  const handleNext = () => {
    if (areaInfo.selectedAreas.length === 0) {
      alert('최소 1개 이상의 영역을 선택해주세요.')
      return
    }

    // 전체 평수 확인
    if (!totalSize || totalSize <= 0) {
      alert('전체 평수 정보가 없습니다. 이전 페이지로 돌아가서 평수를 입력해주세요.')
      return
    }

    // 전체 리모델링이 아닌 경우, 각 영역별 면적 입력 검증
    const isFullRemodeling = areaInfo.selectedAreas.includes('fullhome') || areaInfo.selectedAreas.includes('full')
    
    if (!isFullRemodeling) {
      const missingSizes = areaInfo.selectedAreas.filter(
        (area) => !areaSizes[area] || areaSizes[area] <= 0
      )
      
      if (missingSizes.length > 0) {
        const missingLabels = missingSizes
          .map((area) => AREA_OPTIONS.find((a) => a.key === area)?.label)
          .filter(Boolean)
          .join(', ')
        alert(`다음 영역의 면적을 입력해주세요: ${missingLabels}`)
        return
      }

      // 면적 합계 검증 (각 영역 면적 합이 전체 평수보다 크면 안됨)
      const totalAreaSize = Object.values(areaSizes).reduce((sum, size) => sum + size, 0)
      if (totalAreaSize > totalSize * 1.2) {
        // 20% 여유를 두고 검증
        alert(`입력한 영역 면적의 합(${totalAreaSize.toFixed(1)}평)이 전체 평수(${totalSize}평)보다 너무 큽니다. 다시 확인해주세요.`)
        return
      }
    }

    sessionStorage.setItem('selectedAreas', JSON.stringify(areaInfo.selectedAreas))

    const spaceInfoToSave = {
      mode: searchParams.get('mode'),
      housingType: searchParams.get('housingType'),
      region: searchParams.get('region'),
      size: searchParams.get('size'),
      roomCount: searchParams.get('roomCount'),
      bathroomCount: searchParams.get('bathroomCount'),
      areas: areaInfo.selectedAreas, // 선택된 영역 추가
    }

    sessionStorage.setItem('spaceInfo', JSON.stringify(spaceInfoToSave))
    
    console.log('✅ 영역 선택 완료:', {
      selectedAreas: areaInfo.selectedAreas,
      spaceInfo: spaceInfoToSave
    })

    // 영역 선택 후 공정 선택 페이지로 이동
    const params = new URLSearchParams({
      mode,
      ...spaceInfoParams,
      areas: areaInfo.selectedAreas.join(','),
    })

    console.log('🔄 공정 선택 페이지로 이동')
    router.push(`/process-select-pre?${params.toString()}`)
  }

  const handleBack = () => {
    // 공간 정보 페이지로 돌아가기
    const params = new URLSearchParams({
      mode,
      ...spaceInfoParams,
    })
    router.push(`/space-info?${params.toString()}`)
  }

  const isFullRemodeling = areaInfo.selectedAreas.includes('fullhome') || areaInfo.selectedAreas.includes('full')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40">
      <div className="w-full max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-argen-800 mb-3">
            리모델링 영역 선택
          </h1>
          <p className="text-base md:text-lg text-argen-700 leading-relaxed">
            리모델링하고 싶은 공간을 선택해주세요 (복수 선택 가능)
          </p>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-argen-50 border-l-4 border-argen-500 p-4 md:p-5 mb-6 rounded-lg">
          <p className="text-sm md:text-base text-argen-800 leading-relaxed">
            💡 <strong>전체 리모델링</strong>을 선택하시면 다른 영역 선택이 해제됩니다.
            <br />
            여러 영역을 선택하시면 각 영역별 면적을 입력하고 맞춤 견적을 제공해드립니다.
          </p>
        </div>

        {/* 영역 선택 카드 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-argen-100 p-6 md:p-8 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {AREA_OPTIONS.map((area) => {
              const isSelected = areaInfo.selectedAreas.includes(area.key)
              const isFullRemodelingArea = area.key === 'fullhome'
              
              return (
                <button
                  key={area.key}
                  onClick={() => toggleArea(area.key)}
                  className={`p-5 md:p-6 rounded-xl border-2 transition-all text-center min-h-[120px] md:min-h-[140px] ${
                    isSelected
                      ? isFullRemodelingArea
                        ? 'border-argen-500 bg-gradient-to-br from-argen-50 to-argen-100 text-argen-700 font-semibold shadow-md shadow-argen-200/50'
                        : 'border-argen-500 bg-gradient-to-br from-argen-50 to-argen-100 text-argen-700 font-semibold shadow-md shadow-argen-200/50'
                      : 'border-argen-200 hover:border-argen-300 text-argen-700 bg-white/60 hover:bg-white/80 hover:shadow-sm'
                  }`}
                >
                  <div className="text-3xl md:text-4xl mb-2">{area.icon}</div>
                  <div className="font-bold text-base md:text-lg mb-1">{area.label}</div>
                  <div className="text-xs md:text-sm text-argen-600">{area.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 선택된 영역 표시 및 면적 입력 */}
        {areaInfo.selectedAreas.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-argen-100 p-6 md:p-8 mb-6">
            {isFullRemodeling ? (
              <div className="text-center">
                <p className="text-base md:text-lg text-argen-800 font-semibold mb-3">
                  전체 리모델링이 선택되었습니다.
                </p>
                <p className="text-sm md:text-base text-argen-600 leading-relaxed">
                  전체 평수 ({totalSize}평) 기준으로 견적이 계산됩니다.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-lg md:text-xl font-bold text-argen-800 mb-4">
                  각 영역별 면적 입력
                </h2>
                <p className="text-sm md:text-base text-argen-600 mb-6 leading-relaxed">
                  선택한 각 영역의 면적을 평 단위로 입력해주세요. (전체 평수: {totalSize}평)
                </p>
                <div className="space-y-6">
                  {areaInfo.selectedAreas.map((area) => {
                    const areaOption = AREA_OPTIONS.find((a) => a.key === area)
                    const dimensions = areaDimensions[area] || { width: 0, depth: 0, height: 0 }
                    return (
                      <div key={area} className="border-b border-argen-200 pb-6 last:border-b-0 last:pb-0">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex items-center gap-2 flex-1 pt-2">
                            <span className="text-2xl">{areaOption?.icon}</span>
                            <label className="text-sm font-medium text-argen-800 flex-1">
                              {areaOption?.label}
                            </label>
                          </div>
                          <div className="flex-1 max-w-md">
                            <PyeongInput
                              value={areaSizes[area] || ''}
                              onChange={(value) => {
                                if (value >= 1 && value <= totalSize) {
                                  handleAreaSizeChange(area, value)
                                }
                              }}
                              min={1}
                              max={totalSize}
                              step={0.1}
                              placeholder="평"
                              showM2={true}
                            />
                          </div>
                        </div>
                        
                        {/* 가로×세로×높이 입력 */}
                        <div className="ml-0 md:ml-12 mt-4">
                          <p className="text-xs md:text-sm text-argen-600 mb-2">또는 가로×세로×높이로 입력</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs md:text-sm text-argen-600 mb-1">가로 (m)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={dimensions.width || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  handleDimensionChange(area, 'width', value)
                                }}
                                placeholder="0"
                                className="w-full px-3 py-3 border-2 border-argen-200 rounded-lg focus:border-argen-500 focus:outline-none focus:ring-2 focus:ring-argen-200 text-base bg-white/80 text-argen-800"
                              />
                            </div>
                            <div>
                              <label className="block text-xs md:text-sm text-argen-600 mb-1">세로 (m)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={dimensions.depth || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  handleDimensionChange(area, 'depth', value)
                                }}
                                placeholder="0"
                                className="w-full px-3 py-3 border-2 border-argen-200 rounded-lg focus:border-argen-500 focus:outline-none focus:ring-2 focus:ring-argen-200 text-base bg-white/80 text-argen-800"
                              />
                            </div>
                            <div>
                              <label className="block text-xs md:text-sm text-argen-600 mb-1">높이 (m)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={dimensions.height || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  handleDimensionChange(area, 'height', value)
                                }}
                                placeholder="0"
                                className="w-full px-3 py-3 border-2 border-argen-200 rounded-lg focus:border-argen-500 focus:outline-none focus:ring-2 focus:ring-argen-200 text-base bg-white/80 text-argen-800"
                              />
                            </div>
                          </div>
                          {dimensions.width > 0 && dimensions.depth > 0 && (
                            <p className="text-xs md:text-sm text-argen-600 mt-3 leading-relaxed">
                              계산된 면적: {(dimensions.width * dimensions.depth).toFixed(2)}㎡ (약 {((dimensions.width * dimensions.depth) / 3.3058).toFixed(2)}평)
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {Object.keys(areaSizes).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-argen-200">
                    <p className="text-sm md:text-base text-argen-600 leading-relaxed">
                      입력한 면적 합계: <span className="font-semibold text-argen-800">
                        {Object.values(areaSizes).reduce((sum, size) => sum + size, 0).toFixed(1)}평
                      </span> / 전체 평수: {totalSize}평
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
            disabled={areaInfo.selectedAreas.length === 0}
            className="flex-1 px-6 py-4 bg-argen-500 text-white rounded-xl hover:bg-argen-600 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-base min-h-[52px]"
          >
            다음
          </button>
        </div>
      </div>
    </main>
  )
}

export default function SpaceAreaPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-argen-500 mx-auto mb-4"></div>
          <p className="text-argen-700">로딩 중...</p>
        </div>
      </main>
    }>
      <SpaceAreaPageContent />
    </Suspense>
  )
}
