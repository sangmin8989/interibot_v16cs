'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
  다용도실: boolean
}

interface BathroomOptions {
  스타일: BathroomStyle | null
  욕조: boolean
  샤워부스: boolean
  비데: boolean
  수전업그레이드: boolean
}

interface WoodworkOptions {
  선택가구: string[]
  맞춤제작: boolean
}

function ProcessOptionsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = searchParams.get('analysisId')
  const selectedProcessesParam = searchParams.get('selectedProcesses')
  
  // URL에서 선택된 공정 파싱
  const selectedProcesses: ProcessCode[] = selectedProcessesParam 
    ? selectedProcessesParam.split(',') as ProcessCode[]
    : []
  
  const [kitchenOptions, setKitchenOptions] = useState<KitchenOptions>({
    형태: null,
    냉장고장: false,
    키큰장: false,
    아일랜드장: false,
    다용도실: false,
  })

  const [bathroomOptions, setBathroomOptions] = useState<BathroomOptions>({
    스타일: null,
    욕조: false,
    샤워부스: false,
    비데: false,
    수전업그레이드: false,
  })

  const [woodworkOptions, setWoodworkOptions] = useState<WoodworkOptions>({
    선택가구: [],
    맞춤제작: false,
  })

  const toggleWoodworkFurniture = (code: string) => {
    setWoodworkOptions((prev) => ({
      ...prev,
      선택가구: prev.선택가구.includes(code)
        ? prev.선택가구.filter((c) => c !== code)
        : [...prev.선택가구, code],
    }))
  }

  const handleNext = () => {
    // 주방 옵션 검증
    if (selectedProcesses.includes('주방')) {
      if (!kitchenOptions.형태) {
        alert('주방 형태를 선택해주세요.')
        return
      }
    }

    // 욕실 옵션 검증
    if (selectedProcesses.includes('욕실')) {
      if (!bathroomOptions.스타일) {
        alert('욕실 스타일을 선택해주세요.')
        return
      }
    }

    // URL 파라미터 구성
    const params = new URLSearchParams()
    if (analysisId) params.set('analysisId', analysisId)
    params.set('selectedProcesses', selectedProcesses.join(','))
    
    // 주방 옵션 전달
    if (selectedProcesses.includes('주방') && kitchenOptions.형태) {
      params.set('kitchenLayout', kitchenOptions.형태)
      if (kitchenOptions.냉장고장) params.set('kitchenRefrigerator', 'true')
      if (kitchenOptions.키큰장) params.set('kitchenTallCabinet', 'true')
      if (kitchenOptions.아일랜드장) params.set('kitchenIsland', 'true')
      if (kitchenOptions.다용도실) params.set('kitchenUtilityRoom', 'true')
    }

    // 욕실 옵션 전달
    if (selectedProcesses.includes('욕실') && bathroomOptions.스타일) {
      params.set('bathroomStyle', bathroomOptions.스타일)
      if (bathroomOptions.욕조) params.set('bathroomBathtub', 'true')
      if (bathroomOptions.샤워부스) params.set('bathroomShowerBooth', 'true')
      if (bathroomOptions.비데) params.set('bathroomBidet', 'true')
      if (bathroomOptions.수전업그레이드) params.set('bathroomFaucetUpgrade', 'true')
    }

    // 목공 옵션 전달
    if (selectedProcesses.includes('목공') && woodworkOptions.선택가구.length > 0) {
      params.set('woodworkFurniture', woodworkOptions.선택가구.join(','))
      if (woodworkOptions.맞춤제작) params.set('woodworkCustom', 'true')
    }
    
    // 기존 파라미터 유지
    const size = searchParams.get('size')
    const roomCount = searchParams.get('roomCount')
    const bathroomCount = searchParams.get('bathroomCount')
    if (size) params.set('size', size)
    if (roomCount) params.set('roomCount', roomCount)
    if (bathroomCount) params.set('bathroomCount', bathroomCount)

    router.push(`/estimate?${params.toString()}`)
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-argen-800 mb-4">
            세부 옵션을 선택해주세요
          </h1>
          <p className="text-lg text-argen-600">
            선택하신 공정에 맞는 세부 옵션을 설정하면 더 정확한 견적을 받으실 수 있습니다
          </p>
        </div>

        {/* 선택된 공정 표시 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-argen-100 p-6 mb-8">
          <h3 className="font-bold text-lg text-argen-800 mb-3">
            선택된 공정 ({selectedProcesses.length}개)
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedProcesses.map((code) => {
              const process = PROCESS_OPTIONS.find((p) => p.code === code)
              return (
                <span
                  key={code}
                  className="px-4 py-2 bg-gradient-to-r from-argen-500 to-argen-600 text-white rounded-full text-sm font-medium shadow-md"
                >
                  {process?.icon} {process?.name}
                </span>
              )
            })}
          </div>
        </div>

        {/* 주방 옵션 */}
        {selectedProcesses.includes('주방') && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border-2 border-argen-300 p-8 mb-8">
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
                        setKitchenOptions((prev) => ({
                          ...prev,
                          형태: layout.value,
                          아일랜드장: layout.value === '아일랜드' ? prev.아일랜드장 : false,
                        }))
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-argen-500 bg-gradient-to-br from-argen-50 to-argen-100 text-argen-700 font-semibold shadow-md'
                          : 'border-argen-200 hover:border-argen-300 text-argen-700 bg-white/60 hover:bg-white/80'
                      }`}
                    >
                      <div className="text-3xl mb-2">{layout.icon}</div>
                      <div className="font-bold text-sm mb-1">{layout.label}</div>
                      <div className="text-xs text-argen-600">{layout.description}</div>
                      {isSelected && (
                        <div className="text-argen-500 text-xs mt-2">✓ 선택됨</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 주방 추가 옵션 */}
            <div className="mb-4">
              <label className="block text-lg font-semibold text-argen-700 mb-4">
                추가 옵션
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center p-4 rounded-xl border-2 border-argen-200 hover:border-argen-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={kitchenOptions.냉장고장}
                    onChange={(e) => {
                      setKitchenOptions((prev) => ({ ...prev, 냉장고장: e.target.checked }))
                    }}
                    className="w-5 h-5 text-argen-500 rounded focus:ring-argen-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">냉장고장</div>
                    <div className="text-sm text-argen-600">냉장고를 감싸는 수납장</div>
                  </div>
                </label>

                <label className="flex items-center p-4 rounded-xl border-2 border-argen-200 hover:border-argen-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={kitchenOptions.키큰장}
                    onChange={(e) => {
                      setKitchenOptions((prev) => ({ ...prev, 키큰장: e.target.checked }))
                    }}
                    className="w-5 h-5 text-argen-500 rounded focus:ring-argen-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">키큰장</div>
                    <div className="text-sm text-argen-600">높은 수납장</div>
                  </div>
                </label>

                {kitchenOptions.형태 === '아일랜드' && (
                  <label className="flex items-center p-4 rounded-xl border-2 border-argen-200 hover:border-argen-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                    <input
                      type="checkbox"
                      checked={kitchenOptions.아일랜드장}
                      onChange={(e) => {
                        setKitchenOptions((prev) => ({ ...prev, 아일랜드장: e.target.checked }))
                      }}
                      className="w-5 h-5 text-argen-500 rounded focus:ring-argen-500 focus:ring-2"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold text-argen-800">아일랜드장</div>
                      <div className="text-sm text-argen-600">아일랜드 카운터</div>
                    </div>
                  </label>
                )}

                <label className="flex items-center p-4 rounded-xl border-2 border-argen-200 hover:border-argen-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={kitchenOptions.다용도실}
                    onChange={(e) => {
                      setKitchenOptions((prev) => ({ ...prev, 다용도실: e.target.checked }))
                    }}
                    className="w-5 h-5 text-argen-500 rounded focus:ring-argen-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">다용도실</div>
                    <div className="text-sm text-argen-600">세탁/수납 공간</div>
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
            <div className="mb-4">
              <label className="block text-lg font-semibold text-argen-700 mb-4">
                추가 옵션
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center p-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={bathroomOptions.욕조}
                    onChange={(e) => {
                      setBathroomOptions((prev) => ({ ...prev, 욕조: e.target.checked }))
                    }}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">욕조</div>
                    <div className="text-sm text-argen-600">욕조 설치</div>
                  </div>
                </label>

                <label className="flex items-center p-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={bathroomOptions.샤워부스}
                    onChange={(e) => {
                      setBathroomOptions((prev) => ({ ...prev, 샤워부스: e.target.checked }))
                    }}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">샤워부스</div>
                    <div className="text-sm text-argen-600">독립 샤워 공간</div>
                  </div>
                </label>

                <label className="flex items-center p-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={bathroomOptions.비데}
                    onChange={(e) => {
                      setBathroomOptions((prev) => ({ ...prev, 비데: e.target.checked }))
                    }}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">비데</div>
                    <div className="text-sm text-argen-600">비데 일체형 변기</div>
                  </div>
                </label>

                <label className="flex items-center p-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <input
                    type="checkbox"
                    checked={bathroomOptions.수전업그레이드}
                    onChange={(e) => {
                      setBathroomOptions((prev) => ({ ...prev, 수전업그레이드: e.target.checked }))
                    }}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-argen-800">수전 업그레이드</div>
                    <div className="text-sm text-argen-600">고급 수전/샤워기</div>
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
              목공 가구 옵션
            </h3>
            
            {/* 가구 선택 */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-argen-700 mb-4">
                제작할 가구를 선택해주세요
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {WOODWORK_FURNITURE_OPTIONS.map((furniture) => {
                  const isSelected = woodworkOptions.선택가구.includes(furniture.code)
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
                        </div>
                        {isSelected && (
                          <div className="text-amber-500 text-xl">✓</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 맞춤 제작 옵션 */}
            <div className="mb-4">
              <label className="flex items-center p-4 rounded-xl border-2 border-amber-200 hover:border-amber-300 cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                <input
                  type="checkbox"
                  checked={woodworkOptions.맞춤제작}
                  onChange={(e) => {
                    setWoodworkOptions((prev) => ({ ...prev, 맞춤제작: e.target.checked }))
                  }}
                  className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500 focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="font-semibold text-argen-800">맞춤 제작</div>
                  <div className="text-sm text-argen-600">공간에 맞춘 완전 맞춤 제작 (프리미엄)</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleBack}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-argen-500 to-argen-600 text-white hover:from-argen-600 hover:to-argen-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            견적 확인하기
          </button>
        </div>
      </div>
    </main>
  )
}

export default function ProcessOptionsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-argen-500 mx-auto mb-4"></div>
          <p className="text-argen-700">로딩 중...</p>
        </div>
      </main>
    }>
      <ProcessOptionsPageContent />
    </Suspense>
  )
}











