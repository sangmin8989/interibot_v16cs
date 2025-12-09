'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getDefaultProcessesByAreas, type AreaType } from '@/lib/utils/processMapper'

// 공정 목록 정의
const PROCESS_OPTIONS = [
  { code: '철거', name: '철거', icon: '🔨', description: '기존 시설물 철거 및 폐기물 처리', hasOptions: false },
  { code: '주방', name: '주방', icon: '🍳', description: '주방 가구 및 시설 설치', hasOptions: true },
  { code: '욕실', name: '욕실', icon: '🚿', description: '욕실 시설 및 수전 공사', hasOptions: true },
  { code: '타일', name: '타일', icon: '🧱', description: '타일 및 석재 공사', hasOptions: false },
  { code: '목공', name: '목공', icon: '🪵', description: '목공사 및 가구 제작', hasOptions: true },
  { code: '전기', name: '전기', icon: '💡', description: '전기 및 통신 공사', hasOptions: false },
  { code: '도배', name: '도배', icon: '🎨', description: '도배 및 벽지 공사', hasOptions: false },
  { code: '필름', name: '필름', icon: '🪟', description: '필름 및 시트 공사', hasOptions: false },
  { code: '기타', name: '기타', icon: '🔧', description: '기타 공사 및 마감 작업', hasOptions: false },
] as const

type ProcessCode = typeof PROCESS_OPTIONS[number]['code']

// 공정 코드 매핑
const PROCESS_CODE_MAP: Record<string, ProcessCode> = {
  '100': '주방',
  '200': '목공',
  '300': '전기',
  '400': '욕실',
  '500': '타일',
  '600': '기타',
  '700': '필름',
  '800': '기타',
  '900': '도배',
  '1000': '철거',
}

// 주방 형태 옵션
const KITCHEN_LAYOUT_OPTIONS = [
  { value: '일자', label: '일자형', icon: '📐', description: '벽면을 따라 일렬로 배치' },
  { value: 'ㄱ자', label: 'ㄱ자형', icon: '📏', description: '두 벽면을 활용한 L자 배치' },
  { value: 'ㄷ자', label: 'ㄷ자형', icon: '📊', description: '세 벽면을 활용한 U자 배치' },
  { value: '아일랜드', label: '아일랜드형', icon: '🏝️', description: '중앙 작업대가 있는 배치' },
] as const

// 욕실 스타일 옵션
const BATHROOM_STYLE_OPTIONS = [
  { value: '모던', label: '모던', icon: '✨', description: '깔끔하고 현대적인 스타일' },
  { value: '클래식', label: '클래식', icon: '🏛️', description: '고급스럽고 전통적인 스타일' },
  { value: '미니멀', label: '미니멀', icon: '⬜', description: '간결하고 심플한 스타일' },
  { value: '내추럴', label: '내추럴', icon: '🌿', description: '자연스럽고 따뜻한 스타일' },
  { value: '호텔식', label: '호텔식', icon: '🏨', description: '고급스럽고 편안한 호텔 스타일' },
] as const

// 목공 가구 옵션
const WOODWORK_FURNITURE_OPTIONS = [
  { code: 'closet', label: '붙박이장', icon: '🚪', description: '침실/드레스룸 수납장' },
  { code: 'shoeCabinet', label: '신발장', icon: '👞', description: '현관 신발 수납장' },
  { code: 'tvStand', label: 'TV장', icon: '📺', description: '거실 TV 수납장' },
  { code: 'bookshelf', label: '책장', icon: '📚', description: '책/소품 수납장' },
  { code: 'dresser', label: '화장대', icon: '💄', description: '침실 화장대' },
  { code: 'desk', label: '책상', icon: '🖥️', description: '서재/공부방 책상' },
] as const

type KitchenLayout = typeof KITCHEN_LAYOUT_OPTIONS[number]['value']
type BathroomStyle = typeof BATHROOM_STYLE_OPTIONS[number]['value']

interface KitchenOptions {
  형태: KitchenLayout | null
  냉장고장: boolean
  키큰장: boolean
  아일랜드장: boolean
}

interface BathroomOptions {
  스타일: BathroomStyle | null
  욕조: boolean
  샤워부스: boolean
}

interface WoodworkOptions {
  furniture: string[]
}

function ProcessSelectPrePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'quick'
  
  const [selectedProcesses, setSelectedProcesses] = useState<ProcessCode[]>([])
  const [availableProcesses, setAvailableProcesses] = useState<ProcessCode[]>([])
  const [selectedAreas, setSelectedAreas] = useState<AreaType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 공정별 옵션 상태
  const [kitchenOptions, setKitchenOptions] = useState<KitchenOptions>({
    형태: null,
    냉장고장: false,
    키큰장: false,
    아일랜드장: false,
  })

  const [bathroomOptions, setBathroomOptions] = useState<BathroomOptions>({
    스타일: null,
    욕조: false,
    샤워부스: false,
  })

  const [woodworkOptions, setWoodworkOptions] = useState<WoodworkOptions>({
    furniture: [],
  })

  useEffect(() => {
    // URL에서 영역 정보 가져오기
    const areasParam = searchParams.get('areas')
    const areas = areasParam ? areasParam.split(',') as AreaType[] : []
    
    console.log('🏠 선택된 영역:', areas)
    setSelectedAreas(areas)

    // 전체 리모델링인지 확인
    if (areas.includes('full') || areas.includes('fullhome')) {
      console.log('✅ 전체 리모델링 - 모든 공정 사용 가능')
      setAvailableProcesses(PROCESS_OPTIONS.map(p => p.code))
      setSelectedProcesses(PROCESS_OPTIONS.map(p => p.code))
    } else if (areas.length > 0) {
      // 선택된 영역에 따라 필요한 공정 코드 가져오기
      const processCodes = getDefaultProcessesByAreas(areas)
      console.log('📋 영역별 필요 공정 코드:', processCodes)
      
      // 공정 코드를 공정 이름으로 변환
      const processNames = processCodes
        .map(code => PROCESS_CODE_MAP[code])
        .filter(Boolean) as ProcessCode[]
      
      console.log('✅ 사용 가능한 공정:', processNames)
      setAvailableProcesses(processNames)
      setSelectedProcesses(processNames) // 기본으로 모두 선택
    } else {
      // 영역이 선택되지 않은 경우 모든 공정 표시
      console.log('⚠️ 선택된 영역 없음 - 모든 공정 표시')
      setAvailableProcesses(PROCESS_OPTIONS.map(p => p.code))
    }
    
    setIsLoading(false)
  }, [searchParams])

  const toggleWoodworkFurniture = (furnitureCode: string) => {
    setWoodworkOptions((prev) => ({
      ...prev,
      furniture: prev.furniture.includes(furnitureCode)
        ? prev.furniture.filter((f) => f !== furnitureCode)
        : [...prev.furniture, furnitureCode],
    }))
  }

  const handleNext = () => {
    // 주방 공정이 선택되었는데 주방 형태가 선택되지 않았으면 경고
    if (selectedProcesses.includes('주방')) {
      if (!kitchenOptions.형태) {
        alert('주방 형태를 선택해주세요.')
        return
      }
    }

    // 욕실 공정이 선택되었는데 욕실 스타일이 선택되지 않았으면 경고
    if (selectedProcesses.includes('욕실')) {
      if (!bathroomOptions.스타일) {
        alert('욕실 스타일을 선택해주세요.')
        return
      }
    }

    // 선택된 공정을 sessionStorage에 저장
    sessionStorage.setItem('selectedProcesses', JSON.stringify(selectedProcesses))
    
    // 옵션들도 저장
    if (selectedProcesses.includes('주방')) {
      sessionStorage.setItem('kitchenOptions', JSON.stringify(kitchenOptions))
    }
    if (selectedProcesses.includes('욕실')) {
      sessionStorage.setItem('bathroomOptions', JSON.stringify(bathroomOptions))
    }
    if (selectedProcesses.includes('목공')) {
      sessionStorage.setItem('woodworkOptions', JSON.stringify(woodworkOptions))
    }
    
    console.log('✅ 공정 및 옵션 선택 완료:', {
      processes: selectedProcesses,
      kitchen: kitchenOptions,
      bathroom: bathroomOptions,
      woodwork: woodworkOptions,
    })

    // 바이브 모드는 성향 프레임워크 선택 페이지로 이동
    if (mode === 'vibe') {
      const params = new URLSearchParams(searchParams.toString())
      router.push(`/vibe-framework?${params.toString()}`)
    } else if (mode === 'quick') {
      router.push('/analysis/quick')
    } else if (mode === 'standard') {
      router.push('/analysis/standard')
    } else if (mode === 'deep') {
      router.push('/analysis/deep')
    } else {
      router.push(`/analyze?${searchParams.toString()}`)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-argen-500 mx-auto mb-4"></div>
          <p className="text-argen-700">로딩 중...</p>
        </div>
      </main>
    )
  }

  const isFullRemodeling = selectedAreas.includes('full') || selectedAreas.includes('fullhome')

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-argen-800 mb-4">
            필요한 옵션을 선택해주세요
          </h1>
          <p className="text-lg text-argen-600">
            {isFullRemodeling 
              ? '전체 리모델링에 필요한 공정의 세부 옵션을 선택하고 수정할 수 있습니다'
              : '선택하신 영역에 필요한 공정의 세부 옵션을 선택하고 수정할 수 있습니다'
            }
          </p>
        </div>

        {/* 선택된 영역 표시 */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🏠</div>
            <h3 className="font-bold text-lg text-blue-800">
              선택하신 리모델링 영역
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedAreas.map((area) => {
              const areaLabels: Record<string, string> = {
                living: '거실',
                kitchen: '주방',
                bathroom: '욕실',
                bedroom: '침실',
                kidsroom: '아이방',
                study: '서재/작업실',
                dressing: '드레스룸',
                veranda: '베란다',
                laundry: '다용도실',
                entrance: '현관',
                storage: '창고/수납',
                fullhome: '전체 리모델링',
                full: '전체 리모델링',
              }
              return (
                <span
                  key={area}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium"
                >
                  {areaLabels[area] || area}
                </span>
              )
            })}
          </div>
        </div>

        {/* 주방 옵션 */}
        {selectedProcesses.includes('주방') && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border-2 border-orange-300 p-8 mb-8">
            <h3 className="text-2xl font-bold text-argen-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">🍳</span>
              주방 옵션
            </h3>
            
            {/* 주방 형태 선택 */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-argen-700 mb-4">
                주방 형태 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {KITCHEN_LAYOUT_OPTIONS.map((layout) => {
                  const isSelected = kitchenOptions.형태 === layout.value
                  return (
                    <button
                      key={layout.value}
                      onClick={() => {
                        setKitchenOptions((prev) => ({ ...prev, 형태: layout.value }))
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 font-semibold shadow-md'
                          : 'border-orange-200 hover:border-orange-300 text-argen-700 bg-white/60 hover:bg-white/80'
                      }`}
                    >
                      <div className="text-3xl mb-2">{layout.icon}</div>
                      <div className="font-bold text-sm mb-1">{layout.label}</div>
                      <div className="text-xs text-argen-600">{layout.description}</div>
                      {isSelected && (
                        <div className="text-orange-500 text-xs mt-2">✓ 선택됨</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 주방 추가 옵션 */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-argen-700 mb-4">
                추가 옵션
              </label>
              <div className="space-y-3">
                {/* 냉장고장 */}
                <label className="flex items-center p-4 rounded-xl border-2 border-orange-200 hover:border-orange-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={kitchenOptions.냉장고장}
                    onChange={(e) => {
                      setKitchenOptions((prev) => ({
                        ...prev,
                        냉장고장: e.target.checked,
                      }))
                    }}
                    className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">냉장고장</div>
                    <div className="text-sm text-argen-600">냉장고를 감싸는 수납장 설치</div>
                  </div>
                </label>

                {/* 키큰장 */}
                <label className="flex items-center p-4 rounded-xl border-2 border-orange-200 hover:border-orange-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={kitchenOptions.키큰장}
                    onChange={(e) => {
                      setKitchenOptions((prev) => ({
                        ...prev,
                        키큰장: e.target.checked,
                      }))
                    }}
                    className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">키큰장</div>
                    <div className="text-sm text-argen-600">천장까지 닿는 수납장 설치</div>
                  </div>
                </label>

                {/* 아일랜드장 */}
                <label className="flex items-center p-4 rounded-xl border-2 border-orange-200 hover:border-orange-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={kitchenOptions.아일랜드장}
                    onChange={(e) => {
                      setKitchenOptions((prev) => ({
                        ...prev,
                        아일랜드장: e.target.checked,
                      }))
                    }}
                    className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">아일랜드장</div>
                    <div className="text-sm text-argen-600">중앙 작업대 및 수납장 설치</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 욕실 옵션 */}
        {selectedProcesses.includes('욕실') && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border-2 border-blue-300 p-8 mb-8">
            <h3 className="text-2xl font-bold text-argen-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">🚿</span>
              욕실 옵션
            </h3>
            
            {/* 욕실 스타일 선택 */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-argen-700 mb-4">
                욕실 스타일 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {BATHROOM_STYLE_OPTIONS.map((style) => {
                  const isSelected = bathroomOptions.스타일 === style.value
                  return (
                    <button
                      key={style.value}
                      onClick={() => {
                        setBathroomOptions((prev) => ({ ...prev, 스타일: style.value }))
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-md'
                          : 'border-blue-200 hover:border-blue-300 text-argen-700 bg-white/60 hover:bg-white/80'
                      }`}
                    >
                      <div className="text-3xl mb-2">{style.icon}</div>
                      <div className="font-bold text-sm mb-1">{style.label}</div>
                      <div className="text-xs text-argen-600">{style.description}</div>
                      {isSelected && (
                        <div className="text-blue-500 text-xs mt-2">✓ 선택됨</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 욕실 추가 옵션 */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-argen-700 mb-4">
                추가 옵션
              </label>
              <div className="space-y-3">
                {/* 욕조 */}
                <label className="flex items-center p-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={bathroomOptions.욕조}
                    onChange={(e) => {
                      setBathroomOptions((prev) => ({
                        ...prev,
                        욕조: e.target.checked,
                      }))
                    }}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">욕조 설치</div>
                    <div className="text-sm text-argen-600">욕조 및 관련 설비 설치</div>
                  </div>
                </label>

                {/* 샤워부스 */}
                <label className="flex items-center p-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={bathroomOptions.샤워부스}
                    onChange={(e) => {
                      setBathroomOptions((prev) => ({
                        ...prev,
                        샤워부스: e.target.checked,
                      }))
                    }}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">샤워부스</div>
                    <div className="text-sm text-argen-600">독립형 샤워 공간 설치</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 목공 옵션 */}
        {selectedProcesses.includes('목공') && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border-2 border-amber-300 p-8 mb-8">
            <h3 className="text-2xl font-bold text-argen-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">🪵</span>
              목공 옵션
            </h3>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-argen-700 mb-4">
                제작할 가구 선택 (복수 선택 가능)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {WOODWORK_FURNITURE_OPTIONS.map((furniture) => {
                  const isSelected = woodworkOptions.furniture.includes(furniture.code)
                  return (
                    <button
                      key={furniture.code}
                      onClick={() => toggleWoodworkFurniture(furniture.code)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 font-semibold shadow-md'
                          : 'border-amber-200 hover:border-amber-300 text-argen-700 bg-white/60 hover:bg-white/80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{furniture.icon}</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm mb-1">{furniture.label}</div>
                          <div className="text-xs text-argen-600">{furniture.description}</div>
                          {isSelected && (
                            <div className="text-amber-500 text-xs mt-2">✓ 선택됨</div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleBack}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-white border-2 border-argen-300 text-argen-600 hover:bg-argen-50 transition-all"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-argen-500 to-argen-600 text-white hover:from-argen-600 hover:to-argen-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            성향 분석 시작
          </button>
        </div>
      </div>
    </main>
  )
}

export default function ProcessSelectPrePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-argen-500 mx-auto mb-4"></div>
          <p className="text-argen-700">로딩 중...</p>
        </div>
      </main>
    }>
      <ProcessSelectPrePageContent />
    </Suspense>
  )
}
