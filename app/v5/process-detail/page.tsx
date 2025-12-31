'use client'

/**
 * V5 세부 공정 선택 페이지
 * 자재/브랜드 선택 페이지
 * - 주방: 보조주방 분리 (30평 이상)
 * - 욕실: 안방욕실/공용욕실 분리 (bathrooms 개수에 따라)
 * - 거실/안방/방: 분리 표시
 * - 현관/발코니: 분리 표시
 */

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import LivingOptionsPanel, { type LivingOptions } from '@/components/onboarding/options/LivingOptionsPanel'
import EntranceOptionsPanel, { type EntranceOptions } from '@/components/onboarding/options/EntranceOptionsPanel'
import {
  getProcessesWithOptions,
  type ProcessId,
  normalizeProcessIds,
  isProcessId,
  getProcessOption,
  getProcessLabel,
} from '@/lib/data/process-options'

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

// 바닥재 종류 옵션
const FLOOR_TYPE_OPTIONS = [
  { value: '강마루', label: '강마루', icon: '🪵', description: '관리 쉬움, 가성비 좋음' },
  { value: '원목마루', label: '원목마루', icon: '🌳', description: '따뜻한 느낌, 프리미엄' },
  { value: 'SPC', label: 'SPC', icon: '🔲', description: '방수, 내구성 우수' },
  { value: '온돌마루', label: '온돌마루', icon: '🔥', description: '온돌 위 설치용' },
] as const

// 가구 옵션
const FURNITURE_OPTIONS = [
  { code: 'closet', label: '붙박이장', icon: '🚪', description: '침실/드레스룸 수납장' },
  { code: 'shoeCabinet', label: '신발장', icon: '👞', description: '현관 신발 수납장' },
  { code: 'tvStand', label: 'TV장', icon: '📺', description: '거실 TV 수납장' },
  { code: 'dresser', label: '드레스룸', icon: '👗', description: '전체 드레스룸 구성' },
] as const

// 샤시 종류 옵션
const WINDOW_TYPE_OPTIONS = [
  { value: '단창', label: '단창', icon: '🪟', description: '기본 창문' },
  { value: '이중창', label: '이중창', icon: '🪟🪟', description: '단열 효과 우수' },
  { value: '시스템창', label: '시스템창', icon: '🏠', description: '최고 단열, 방음' },
] as const

// 중문 종류 옵션
const DOOR_TYPE_OPTIONS = [
  { value: '2연동', label: '2연동', icon: '🚪', description: '기본 중문' },
  { value: '3연동', label: '3연동', icon: '🚪🚪', description: '넓은 개방' },
  { value: '자동', label: '자동', icon: '🤖', description: '자동 개폐' },
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

interface FloorOptions {
  종류: string | null
  거실바닥: string | null
  안방바닥: string | null
  방바닥: string | null
}

interface FurnitureOptions {
  선택가구: string[]
  맞춤제작: boolean
}

interface WindowOptions {
  종류: string | null
  방음강화: boolean
}

interface DoorOptions {
  종류: string | null
  방음강화: boolean
  불투명유리: boolean
}

function ProcessDetailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { spaceInfo } = useSpaceInfoStore()
  
  // URL 파라미터에서 공정 ID 정규화 (하위호환)
  const processesParam = searchParams.get('processes')
  const selectedProcesses: ProcessId[] = normalizeProcessIds(processesParam ?? '')
  
  // 공정이 없거나 유효하지 않으면 목록 페이지로 리다이렉트
  if (selectedProcesses.length === 0 || selectedProcesses.some(id => !isProcessId(id))) {
    router.push('/v5/process-select')
    return null
  }
  
  const pyeong = spaceInfo?.pyeong || parseInt(searchParams.get('pyeong') || '30')
  const bathrooms = spaceInfo?.bathrooms || parseInt(searchParams.get('bathrooms') || '2')
  const hasTwoBathrooms = bathrooms >= 2
  
  // 주방 옵션
  const [kitchenOptions, setKitchenOptions] = useState<KitchenOptions>({
    형태: null,
    냉장고장: false,
    키큰장: false,
    아일랜드장: false,
    다용도실: false,
  })
  
  const [보조주방사용, set보조주방사용] = useState(false)
  const [보조주방옵션, set보조주방옵션] = useState<KitchenOptions>({
    형태: '일자',
    냉장고장: false,
    키큰장: false,
    아일랜드장: false,
    다용도실: false,
  })

  // 욕실 옵션 (분리)
  const [욕실옵션, set욕실옵션] = useState<BathroomOptions>({
    스타일: null,
    욕조: false,
    샤워부스: false,
    비데: false,
    수전업그레이드: false,
  })
  
  const [안방욕실옵션, set안방욕실옵션] = useState<BathroomOptions>({
    스타일: null,
    욕조: true, // 안방욕실은 기본적으로 욕조 포함
    샤워부스: false,
    비데: false,
    수전업그레이드: false,
  })
  
  const [공용욕실옵션, set공용욕실옵션] = useState<BathroomOptions>({
    스타일: null,
    욕조: false,
    샤워부스: false,
    비데: false,
    수전업그레이드: false,
  })

  // 거실/안방/방 옵션
  const [거실옵션, set거실옵션] = useState<LivingOptions>({
    벽지종류: '실크',
    바닥재종류: '강마루',
    조명타입: '다운라이트',
    포인트벽지: false,
    천장도배: true,
    걸레받이: true,
    디밍가능: false,
    아트월: false,
    몰딩: false,
  })
  
  const [안방옵션, set안방옵션] = useState<LivingOptions>({
    벽지종류: '실크',
    바닥재종류: '강마루',
    조명타입: '간접조명',
    포인트벽지: false,
    천장도배: true,
    걸레받이: true,
    디밍가능: true,
  })
  
  const [방옵션, set방옵션] = useState<LivingOptions>({
    벽지종류: '합지',
    바닥재종류: '강화마루',
    조명타입: '다운라이트',
    천장도배: true,
  })

  // 현관/발코니 옵션
  const [현관옵션, set현관옵션] = useState<EntranceOptions>({
    타일사이즈: '중형',
    타일패턴: '일반',
    신발장교체: true,
    신발장크기: '중형',
    중문설치: false,
  })
  
  const [발코니옵션, set발코니옵션] = useState<EntranceOptions>({
    타일사이즈: '중형',
    타일패턴: '일반',
  })

  // 바닥재 옵션
  const [floorOptions, setFloorOptions] = useState<FloorOptions>({
    종류: null,
    거실바닥: null,
    안방바닥: null,
    방바닥: null,
  })

  // 가구 옵션
  const [furnitureOptions, setFurnitureOptions] = useState<FurnitureOptions>({
    선택가구: [],
    맞춤제작: false,
  })

  // 샤시 옵션
  const [windowOptions, setWindowOptions] = useState<WindowOptions>({
    종류: null,
    방음강화: false,
  })

  // 중문 옵션
  const [doorOptions, setDoorOptions] = useState<DoorOptions>({
    종류: null,
    방음강화: false,
    불투명유리: false,
  })

  const toggleFurniture = (code: string) => {
    setFurnitureOptions((prev) => ({
      ...prev,
      선택가구: prev.선택가구.includes(code)
        ? prev.선택가구.filter((c) => c !== code)
        : [...prev.선택가구, code],
    }))
  }

  const handleNext = () => {
    // 주방 옵션 검증
    if (selectedProcesses.includes('KITCHEN')) {
      if (!kitchenOptions.형태) {
        alert('주방 형태를 선택해주세요.')
        return
      }
      if (보조주방사용 && !보조주방옵션.형태) {
        alert('보조주방 형태를 선택해주세요.')
        return
      }
    }

    // 욕실 옵션 검증
    if (selectedProcesses.includes('BATH')) {
      if (hasTwoBathrooms) {
        if (!안방욕실옵션.스타일) {
          alert('안방욕실 스타일을 선택해주세요.')
          return
        }
        if (!공용욕실옵션.스타일) {
          alert('공용욕실 스타일을 선택해주세요.')
          return
        }
      } else {
        if (!욕실옵션.스타일) {
          alert('욕실 스타일을 선택해주세요.')
          return
        }
      }
    }

    // URL 파라미터 구성
    const params = new URLSearchParams(searchParams.toString())
    
    // 주방 옵션 전달
    if (selectedProcesses.includes('KITCHEN') && kitchenOptions.형태) {
      params.set('kitchenLayout', kitchenOptions.형태)
      if (kitchenOptions.냉장고장) params.set('kitchenRefrigerator', 'true')
      if (kitchenOptions.키큰장) params.set('kitchenTallCabinet', 'true')
      if (kitchenOptions.아일랜드장) params.set('kitchenIsland', 'true')
      if (kitchenOptions.다용도실) params.set('kitchenUtilityRoom', 'true')
      
      // 보조주방 옵션
      if (보조주방사용) {
        params.set('subKitchen', 'true')
        params.set('subKitchenLayout', 보조주방옵션.형태 || '일자')
      }
    }

    // 욕실 옵션 전달
    if (selectedProcesses.includes('BATH')) {
      if (hasTwoBathrooms) {
        // 안방욕실
        if (안방욕실옵션.스타일) {
          params.set('masterBathroomStyle', 안방욕실옵션.스타일)
          if (안방욕실옵션.욕조) params.set('masterBathroomBathtub', 'true')
          if (안방욕실옵션.샤워부스) params.set('masterBathroomShowerBooth', 'true')
          if (안방욕실옵션.비데) params.set('masterBathroomBidet', 'true')
          if (안방욕실옵션.수전업그레이드) params.set('masterBathroomFaucetUpgrade', 'true')
        }
        // 공용욕실
        if (공용욕실옵션.스타일) {
          params.set('commonBathroomStyle', 공용욕실옵션.스타일)
          if (공용욕실옵션.욕조) params.set('commonBathroomBathtub', 'true')
          if (공용욕실옵션.샤워부스) params.set('commonBathroomShowerBooth', 'true')
          if (공용욕실옵션.비데) params.set('commonBathroomBidet', 'true')
          if (공용욕실옵션.수전업그레이드) params.set('commonBathroomFaucetUpgrade', 'true')
        }
      } else {
        // 단일 욕실
        if (욕실옵션.스타일) {
          params.set('bathroomStyle', 욕실옵션.스타일)
          if (욕실옵션.욕조) params.set('bathroomBathtub', 'true')
          if (욕실옵션.샤워부스) params.set('bathroomShowerBooth', 'true')
          if (욕실옵션.비데) params.set('bathroomBidet', 'true')
          if (욕실옵션.수전업그레이드) params.set('bathroomFaucetUpgrade', 'true')
        }
      }
    }

    // 바닥재 옵션 전달
    if (selectedProcesses.includes('FLOOR') && floorOptions.종류) {
      params.set('floorType', floorOptions.종류)
      if (floorOptions.거실바닥) params.set('livingFloor', floorOptions.거실바닥)
      if (floorOptions.안방바닥) params.set('masterFloor', floorOptions.안방바닥)
      if (floorOptions.방바닥) params.set('roomFloor', floorOptions.방바닥)
    }

    // 가구 옵션 전달
    if (selectedProcesses.includes('FURNITURE') && furnitureOptions.선택가구.length > 0) {
      params.set('furnitureItems', furnitureOptions.선택가구.join(','))
      if (furnitureOptions.맞춤제작) params.set('furnitureCustom', 'true')
    }

    // 샤시 옵션 전달
    if (selectedProcesses.includes('WINDOW') && windowOptions.종류) {
      params.set('windowType', windowOptions.종류)
      if (windowOptions.방음강화) params.set('windowSoundproof', 'true')
    }

    // 중문 옵션 전달
    if (selectedProcesses.includes('DOOR') && doorOptions.종류) {
      params.set('doorType', doorOptions.종류)
      if (doorOptions.방음강화) params.set('doorSoundproof', 'true')
      if (doorOptions.불투명유리) params.set('doorFrosted', 'true')
    }
    
    // 거실/안방/방 옵션 전달 (도배 공정 선택 시)
    if (selectedProcesses.includes('WALLPAPER')) {
      params.set('livingWallpaper', 거실옵션.벽지종류 || '실크')
      params.set('masterBedroomWallpaper', 안방옵션.벽지종류 || '실크')
      params.set('roomWallpaper', 방옵션.벽지종류 || '합지')
    }
    
    // 현관/발코니 옵션 전달 (타일 공정 선택 시)
    if (selectedProcesses.includes('TILE')) {
      params.set('entranceTileSize', 현관옵션.타일사이즈 || '중형')
      params.set('entranceTilePattern', 현관옵션.타일패턴 || '일반')
      if (현관옵션.신발장교체) params.set('entranceShoeCabinet', 'true')
      if (현관옵션.중문설치) params.set('entranceSlidingDoor', 'true')
      
      params.set('balconyTileSize', 발코니옵션.타일사이즈 || '중형')
      params.set('balconyTilePattern', 발코니옵션.타일패턴 || '일반')
    }

    router.push(`/v5/additional-options?${params.toString()}`)
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1F1F1F] mb-4">
            세부 옵션을 선택해주세요
          </h1>
          <p className="text-lg text-[#6B6B6B]">
            선택하신 공정에 맞는 자재 및 브랜드를 설정합니다
          </p>
        </div>

        {/* 공간 정보 표시 */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-[#1F1F1F] mb-2">
                공간 정보
              </h3>
              <p className="text-sm text-[#6B6B6B]">
                {pyeong}평 · {bathrooms}개 욕실
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#1F1F1F]">
                선택된 공정 ({selectedProcesses.length}개)
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedProcesses.map((id) => {
                  const process = getProcessOption(id)
                  if (!process) return null
                  return (
                    <span
                      key={id}
                      className="px-3 py-1 bg-[#B8956B] text-white rounded-full text-xs font-medium"
                    >
                      {/* 아이콘은 id 기반으로 표시 */}
                      {id === 'KITCHEN' && '🍳'}
                      {id === 'BATH' && '🚿'}
                      {id === 'FLOOR' && '🪵'}
                      {id === 'TILE' && '🧱'}
                      {id === 'WALLPAPER' && '🎨'}
                      {id === 'FURNITURE' && '🗄️'}
                      {id === 'WINDOW' && '🪟'}
                      {id === 'DOOR' && '🚪'}
                      {id === 'PAINT' && '🖌️'}
                      {id === 'ELECTRIC' && '💡'}
                      {id === 'FILM' && '🪟'}
                      {id === 'DEMOLITION' && '🔨'}
                      {' '}
                      {process.label}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 주방 옵션 */}
        {selectedProcesses.includes('KITCHEN') && (
          <>
            {/* 메인 주방 */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
              {pyeong >= 30 && (
                <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                        <span className="text-2xl">🍳</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {보조주방사용 ? '메인 주방' : '주방'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {보조주방사용 ? '주요 요리 공간' : '주방 옵션 설정'}
                        </p>
                      </div>
                    </div>
                    
                    {/* 보조주방 토글 (30평 이상일 때만) */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">보조주방</span>
                      <button
                        onClick={() => set보조주방사용(!보조주방사용)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          보조주방사용 ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      >
                        <span 
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            보조주방사용 ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
                <span className="text-3xl">🍳</span>
                {pyeong >= 30 && 보조주방사용 ? '메인 주방' : '주방'} 옵션
              </h3>
              
              {/* 주방 형태 선택 */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
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
                            ? 'border-[#B8956B] bg-[#F7F3ED] text-[#1F1F1F] font-semibold shadow-md'
                            : 'border-[#E8E4DC] hover:border-[#B8956B] text-[#6B6B6B] bg-white hover:bg-[#F7F3ED]'
                        }`}
                      >
                        <div className="text-3xl mb-2">{layout.icon}</div>
                        <div className="font-bold text-sm mb-1">{layout.label}</div>
                        <div className="text-xs text-[#6B6B6B]">{layout.description}</div>
                        {isSelected && (
                          <div className="text-[#B8956B] text-xs mt-2">✓ 선택됨</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 주방 추가 옵션 */}
              <div className="mb-4">
                <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                  추가 옵션
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                    <input
                      type="checkbox"
                      checked={kitchenOptions.냉장고장}
                      onChange={(e) => {
                        setKitchenOptions((prev) => ({ ...prev, 냉장고장: e.target.checked }))
                      }}
                      className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold text-[#1F1F1F]">냉장고장</div>
                      <div className="text-sm text-[#6B6B6B]">냉장고를 감싸는 수납장</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                    <input
                      type="checkbox"
                      checked={kitchenOptions.키큰장}
                      onChange={(e) => {
                        setKitchenOptions((prev) => ({ ...prev, 키큰장: e.target.checked }))
                      }}
                      className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold text-[#1F1F1F]">키큰장</div>
                      <div className="text-sm text-[#6B6B6B]">높은 수납장</div>
                    </div>
                  </label>

                  {kitchenOptions.형태 === '아일랜드' && (
                    <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                      <input
                        type="checkbox"
                        checked={kitchenOptions.아일랜드장}
                        onChange={(e) => {
                          setKitchenOptions((prev) => ({ ...prev, 아일랜드장: e.target.checked }))
                        }}
                        className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                      />
                      <div className="ml-4 flex-1">
                        <div className="font-semibold text-[#1F1F1F]">아일랜드장</div>
                        <div className="text-sm text-[#6B6B6B]">아일랜드 카운터</div>
                      </div>
                    </label>
                  )}

                  <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                    <input
                      type="checkbox"
                      checked={kitchenOptions.다용도실}
                      onChange={(e) => {
                        setKitchenOptions((prev) => ({ ...prev, 다용도실: e.target.checked }))
                      }}
                      className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold text-[#1F1F1F]">다용도실</div>
                      <div className="text-sm text-[#6B6B6B]">세탁/수납 공간</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 보조주방 (30평 이상 + 보조주방 사용 시) */}
            {pyeong >= 30 && 보조주방사용 && (
              <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
                <div className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                      <span className="text-2xl">🥗</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">보조 주방 (팬트리)</h3>
                      <p className="text-sm text-gray-500">설거지, 냄새나는 요리 분리</p>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
                  <span className="text-3xl">🥗</span>
                  보조 주방 옵션
                </h3>
                
                {/* 보조주방 형태 선택 */}
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                    보조주방 형태 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {KITCHEN_LAYOUT_OPTIONS.filter(l => l.value !== '아일랜드').map((layout) => {
                      const isSelected = 보조주방옵션.형태 === layout.value
                      return (
                        <button
                          key={layout.value}
                          onClick={() => {
                            set보조주방옵션((prev) => ({
                              ...prev,
                              형태: layout.value as KitchenLayout,
                            }))
                          }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-[#B8956B] bg-[#F7F3ED] text-[#1F1F1F] font-semibold shadow-md'
                              : 'border-[#E8E4DC] hover:border-[#B8956B] text-[#6B6B6B] bg-white hover:bg-[#F7F3ED]'
                          }`}
                        >
                          <div className="text-3xl mb-2">{layout.icon}</div>
                          <div className="font-bold text-sm mb-1">{layout.label}</div>
                          <div className="text-xs text-[#6B6B6B]">{layout.description}</div>
                          {isSelected && (
                            <div className="text-[#B8956B] text-xs mt-2">✓ 선택됨</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 욕실 옵션 - 분리 표시 */}
        {selectedProcesses.includes('BATH') && (
          <>
            {/* 욕실 1개인 경우 */}
            {!hasTwoBathrooms && (
              <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
                <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
                  <span className="text-3xl">🚿</span>
                  욕실 옵션
                </h3>
                
                {/* 욕실 스타일 선택 */}
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                    욕실 스타일 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {BATHROOM_STYLE_OPTIONS.map((style) => {
                      const isSelected = 욕실옵션.스타일 === style.value
                      return (
                        <button
                          key={style.value}
                          onClick={() => {
                            set욕실옵션((prev) => ({ ...prev, 스타일: style.value }))
                          }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-[#B8956B] bg-[#F7F3ED] text-[#1F1F1F] font-semibold shadow-md'
                              : 'border-[#E8E4DC] hover:border-[#B8956B] text-[#6B6B6B] bg-white hover:bg-[#F7F3ED]'
                          }`}
                        >
                          <div className="text-3xl mb-2">{style.icon}</div>
                          <div className="font-bold text-sm mb-1">{style.label}</div>
                          <div className="text-xs text-[#6B6B6B]">{style.description}</div>
                          {isSelected && (
                            <div className="text-[#B8956B] text-xs mt-2">✓ 선택됨</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 욕실 추가 옵션 */}
                <div className="mb-4">
                  <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                    추가 옵션
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                      <input
                        type="checkbox"
                        checked={욕실옵션.욕조}
                        onChange={(e) => {
                          set욕실옵션((prev) => ({ ...prev, 욕조: e.target.checked }))
                        }}
                        className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                      />
                      <div className="ml-4 flex-1">
                        <div className="font-semibold text-[#1F1F1F]">욕조</div>
                        <div className="text-sm text-[#6B6B6B]">욕조 설치</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                      <input
                        type="checkbox"
                        checked={욕실옵션.샤워부스}
                        onChange={(e) => {
                          set욕실옵션((prev) => ({ ...prev, 샤워부스: e.target.checked }))
                        }}
                        className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                      />
                      <div className="ml-4 flex-1">
                        <div className="font-semibold text-[#1F1F1F]">샤워부스</div>
                        <div className="text-sm text-[#6B6B6B]">독립 샤워 공간</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                      <input
                        type="checkbox"
                        checked={욕실옵션.비데}
                        onChange={(e) => {
                          set욕실옵션((prev) => ({ ...prev, 비데: e.target.checked }))
                        }}
                        className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                      />
                      <div className="ml-4 flex-1">
                        <div className="font-semibold text-[#1F1F1F]">비데</div>
                        <div className="text-sm text-[#6B6B6B]">비데 일체형 변기</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                      <input
                        type="checkbox"
                        checked={욕실옵션.수전업그레이드}
                        onChange={(e) => {
                          set욕실옵션((prev) => ({ ...prev, 수전업그레이드: e.target.checked }))
                        }}
                        className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                      />
                      <div className="ml-4 flex-1">
                        <div className="font-semibold text-[#1F1F1F]">수전 업그레이드</div>
                        <div className="text-sm text-[#6B6B6B]">고급 수전/샤워기</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 욕실 2개 이상인 경우 - 안방욕실 */}
            {hasTwoBathrooms && (
              <>
                <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center">
                        <span className="text-2xl">🛁</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">안방 욕실</h3>
                        <p className="text-sm text-gray-500">안방(마스터룸)에 딸린 욕실</p>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
                    <span className="text-3xl">🛁</span>
                    안방욕실 옵션
                  </h3>
                  
                  {/* 안방욕실 스타일 선택 */}
                  <div className="mb-6">
                    <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                      안방욕실 스타일 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {BATHROOM_STYLE_OPTIONS.map((style) => {
                        const isSelected = 안방욕실옵션.스타일 === style.value
                        return (
                          <button
                            key={style.value}
                            onClick={() => {
                              set안방욕실옵션((prev) => ({ ...prev, 스타일: style.value }))
                            }}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-[#B8956B] bg-[#F7F3ED] text-[#1F1F1F] font-semibold shadow-md'
                                : 'border-[#E8E4DC] hover:border-[#B8956B] text-[#6B6B6B] bg-white hover:bg-[#F7F3ED]'
                            }`}
                          >
                            <div className="text-3xl mb-2">{style.icon}</div>
                            <div className="font-bold text-sm mb-1">{style.label}</div>
                            <div className="text-xs text-[#6B6B6B]">{style.description}</div>
                            {isSelected && (
                              <div className="text-[#B8956B] text-xs mt-2">✓ 선택됨</div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 안방욕실 추가 옵션 */}
                  <div className="mb-4">
                    <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                      추가 옵션
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                        <input
                          type="checkbox"
                          checked={안방욕실옵션.욕조}
                          onChange={(e) => {
                            set안방욕실옵션((prev) => ({ ...prev, 욕조: e.target.checked }))
                          }}
                          className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-[#1F1F1F]">욕조</div>
                          <div className="text-sm text-[#6B6B6B]">욕조 설치</div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                        <input
                          type="checkbox"
                          checked={안방욕실옵션.샤워부스}
                          onChange={(e) => {
                            set안방욕실옵션((prev) => ({ ...prev, 샤워부스: e.target.checked }))
                          }}
                          className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-[#1F1F1F]">샤워부스</div>
                          <div className="text-sm text-[#6B6B6B]">독립 샤워 공간</div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                        <input
                          type="checkbox"
                          checked={안방욕실옵션.비데}
                          onChange={(e) => {
                            set안방욕실옵션((prev) => ({ ...prev, 비데: e.target.checked }))
                          }}
                          className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-[#1F1F1F]">비데</div>
                          <div className="text-sm text-[#6B6B6B]">비데 일체형 변기</div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                        <input
                          type="checkbox"
                          checked={안방욕실옵션.수전업그레이드}
                          onChange={(e) => {
                            set안방욕실옵션((prev) => ({ ...prev, 수전업그레이드: e.target.checked }))
                          }}
                          className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-[#1F1F1F]">수전 업그레이드</div>
                          <div className="text-sm text-[#6B6B6B]">고급 수전/샤워기</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 공용욕실 */}
                <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
                  <div className="p-5 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center">
                        <span className="text-2xl">🚿</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">공용 욕실</h3>
                        <p className="text-sm text-gray-500">가족 모두가 사용하는 욕실</p>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
                    <span className="text-3xl">🚿</span>
                    공용욕실 옵션
                  </h3>
                  
                  {/* 공용욕실 스타일 선택 */}
                  <div className="mb-6">
                    <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                      공용욕실 스타일 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {BATHROOM_STYLE_OPTIONS.map((style) => {
                        const isSelected = 공용욕실옵션.스타일 === style.value
                        return (
                          <button
                            key={style.value}
                            onClick={() => {
                              set공용욕실옵션((prev) => ({ ...prev, 스타일: style.value }))
                            }}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-[#B8956B] bg-[#F7F3ED] text-[#1F1F1F] font-semibold shadow-md'
                                : 'border-[#E8E4DC] hover:border-[#B8956B] text-[#6B6B6B] bg-white hover:bg-[#F7F3ED]'
                            }`}
                          >
                            <div className="text-3xl mb-2">{style.icon}</div>
                            <div className="font-bold text-sm mb-1">{style.label}</div>
                            <div className="text-xs text-[#6B6B6B]">{style.description}</div>
                            {isSelected && (
                              <div className="text-[#B8956B] text-xs mt-2">✓ 선택됨</div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 공용욕실 추가 옵션 */}
                  <div className="mb-4">
                    <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                      추가 옵션
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                        <input
                          type="checkbox"
                          checked={공용욕실옵션.욕조}
                          onChange={(e) => {
                            set공용욕실옵션((prev) => ({ ...prev, 욕조: e.target.checked }))
                          }}
                          className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-[#1F1F1F]">욕조</div>
                          <div className="text-sm text-[#6B6B6B]">욕조 설치</div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                        <input
                          type="checkbox"
                          checked={공용욕실옵션.샤워부스}
                          onChange={(e) => {
                            set공용욕실옵션((prev) => ({ ...prev, 샤워부스: e.target.checked }))
                          }}
                          className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-[#1F1F1F]">샤워부스</div>
                          <div className="text-sm text-[#6B6B6B]">독립 샤워 공간</div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                        <input
                          type="checkbox"
                          checked={공용욕실옵션.비데}
                          onChange={(e) => {
                            set공용욕실옵션((prev) => ({ ...prev, 비데: e.target.checked }))
                          }}
                          className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-[#1F1F1F]">비데</div>
                          <div className="text-sm text-[#6B6B6B]">비데 일체형 변기</div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                        <input
                          type="checkbox"
                          checked={공용욕실옵션.수전업그레이드}
                          onChange={(e) => {
                            set공용욕실옵션((prev) => ({ ...prev, 수전업그레이드: e.target.checked }))
                          }}
                          className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-[#1F1F1F]">수전 업그레이드</div>
                          <div className="text-sm text-[#6B6B6B]">고급 수전/샤워기</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* 바닥재 옵션 */}
        {selectedProcesses.includes('FLOOR') && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
            <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
              <span className="text-3xl">🪵</span>
              바닥재 옵션
            </h3>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                바닥재 종류 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {FLOOR_TYPE_OPTIONS.map((type) => {
                  const isSelected = floorOptions.종류 === type.value
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        setFloorOptions((prev) => ({ ...prev, 종류: type.value }))
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-[#B8956B] bg-[#F7F3ED] text-[#1F1F1F] font-semibold shadow-md'
                          : 'border-[#E8E4DC] hover:border-[#B8956B] text-[#6B6B6B] bg-white hover:bg-[#F7F3ED]'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className="font-bold text-sm mb-1">{type.label}</div>
                      <div className="text-xs text-[#6B6B6B]">{type.description}</div>
                      {isSelected && (
                        <div className="text-[#B8956B] text-xs mt-2">✓ 선택됨</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 가구 옵션 */}
        {selectedProcesses.includes('FURNITURE') && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
            <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
              <span className="text-3xl">🗄️</span>
              가구 옵션
            </h3>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                제작할 가구를 선택해주세요
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {FURNITURE_OPTIONS.map((furniture) => {
                  const isSelected = furnitureOptions.선택가구.includes(furniture.code)
                  return (
                    <button
                      key={furniture.code}
                      onClick={() => toggleFurniture(furniture.code)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[#B8956B] bg-[#F7F3ED] text-[#1F1F1F] font-semibold shadow-md'
                          : 'border-[#E8E4DC] hover:border-[#B8956B] text-[#6B6B6B] bg-white hover:bg-[#F7F3ED]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{furniture.icon}</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm mb-1">{furniture.label}</div>
                          <div className="text-xs text-[#6B6B6B]">{furniture.description}</div>
                        </div>
                        {isSelected && (
                          <div className="text-[#B8956B] text-xl">✓</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 맞춤 제작 옵션 */}
            <div className="mb-4">
              <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                <input
                  type="checkbox"
                  checked={furnitureOptions.맞춤제작}
                  onChange={(e) => {
                    setFurnitureOptions((prev) => ({ ...prev, 맞춤제작: e.target.checked }))
                  }}
                  className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="font-semibold text-[#1F1F1F]">맞춤 제작</div>
                  <div className="text-sm text-[#6B6B6B]">공간에 맞춘 완전 맞춤 제작 (프리미엄)</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 샤시 옵션 */}
        {selectedProcesses.includes('WINDOW') && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
            <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
              <span className="text-3xl">🪟</span>
              샤시 옵션
            </h3>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                샤시 종류 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {WINDOW_TYPE_OPTIONS.map((type) => {
                  const isSelected = windowOptions.종류 === type.value
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        setWindowOptions((prev) => ({ ...prev, 종류: type.value }))
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-[#B8956B] bg-[#F7F3ED] text-[#1F1F1F] font-semibold shadow-md'
                          : 'border-[#E8E4DC] hover:border-[#B8956B] text-[#6B6B6B] bg-white hover:bg-[#F7F3ED]'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className="font-bold text-sm mb-1">{type.label}</div>
                      <div className="text-xs text-[#6B6B6B]">{type.description}</div>
                      {isSelected && (
                        <div className="text-[#B8956B] text-xs mt-2">✓ 선택됨</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 방음 강화 옵션 */}
            <div className="mb-4">
              <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                <input
                  type="checkbox"
                  checked={windowOptions.방음강화}
                  onChange={(e) => {
                    setWindowOptions((prev) => ({ ...prev, 방음강화: e.target.checked }))
                  }}
                  className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="font-semibold text-[#1F1F1F]">방음 강화</div>
                  <div className="text-sm text-[#6B6B6B]">추가 방음 처리 (프리미엄)</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 중문 옵션 */}
        {selectedProcesses.includes('DOOR') && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
            <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
              <span className="text-3xl">🚪</span>
              중문 옵션
            </h3>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-[#1F1F1F] mb-4">
                중문 종류 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DOOR_TYPE_OPTIONS.map((type) => {
                  const isSelected = doorOptions.종류 === type.value
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        setDoorOptions((prev) => ({ ...prev, 종류: type.value }))
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-[#B8956B] bg-[#F7F3ED] text-[#1F1F1F] font-semibold shadow-md'
                          : 'border-[#E8E4DC] hover:border-[#B8956B] text-[#6B6B6B] bg-white hover:bg-[#F7F3ED]'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className="font-bold text-sm mb-1">{type.label}</div>
                      <div className="text-xs text-[#6B6B6B]">{type.description}</div>
                      {isSelected && (
                        <div className="text-[#B8956B] text-xs mt-2">✓ 선택됨</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 추가 옵션 */}
            <div className="mb-4 space-y-3">
              <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                <input
                  type="checkbox"
                  checked={doorOptions.방음강화}
                  onChange={(e) => {
                    setDoorOptions((prev) => ({ ...prev, 방음강화: e.target.checked }))
                  }}
                  className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="font-semibold text-[#1F1F1F]">방음 강화</div>
                  <div className="text-sm text-[#6B6B6B]">추가 방음 처리</div>
                </div>
              </label>

              <label className="flex items-center p-4 rounded-xl border-2 border-[#E8E4DC] hover:border-[#B8956B] cursor-pointer bg-white hover:bg-[#F7F3ED] transition-all">
                <input
                  type="checkbox"
                  checked={doorOptions.불투명유리}
                  onChange={(e) => {
                    setDoorOptions((prev) => ({ ...prev, 불투명유리: e.target.checked }))
                  }}
                  className="w-5 h-5 text-[#B8956B] rounded focus:ring-[#B8956B] focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="font-semibold text-[#1F1F1F]">불투명 유리</div>
                  <div className="text-sm text-[#6B6B6B]">시선 차단</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 거실 옵션 (도배 공정 선택 시) */}
        {selectedProcesses.includes('WALLPAPER') && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
            <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
              <span className="text-3xl">🛋️</span>
              거실 옵션
            </h3>
            <LivingOptionsPanel
              value={거실옵션}
              onChange={set거실옵션}
              spaceName="거실"
              isExpanded={true}
            />
          </div>
        )}

        {/* 안방 옵션 (도배 공정 선택 시) */}
        {selectedProcesses.includes('WALLPAPER') && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
            <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
              <span className="text-3xl">🛏️</span>
              안방 옵션
            </h3>
            <LivingOptionsPanel
              value={안방옵션}
              onChange={set안방옵션}
              spaceName="안방"
              isExpanded={false}
            />
          </div>
        )}

        {/* 방 옵션 (도배 공정 선택 시) */}
        {selectedProcesses.includes('WALLPAPER') && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
            <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
              <span className="text-3xl">🚪</span>
              방 옵션 (공통)
            </h3>
            <LivingOptionsPanel
              value={방옵션}
              onChange={set방옵션}
              spaceName="방"
              isExpanded={false}
            />
          </div>
        )}

        {/* 현관 옵션 (타일 공정 선택 시) */}
        {selectedProcesses.includes('TILE') && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
            <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
              <span className="text-3xl">🚪</span>
              현관 옵션
            </h3>
            <EntranceOptionsPanel
              value={현관옵션}
              onChange={set현관옵션}
              isBalcony={false}
              isExpanded={true}
            />
          </div>
        )}

        {/* 발코니 옵션 (타일 공정 선택 시) */}
        {selectedProcesses.includes('TILE') && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-8 mb-8">
            <h3 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
              <span className="text-3xl">🌿</span>
              발코니 옵션
            </h3>
            <EntranceOptionsPanel
              value={발코니옵션}
              onChange={set발코니옵션}
              isBalcony={true}
              isExpanded={false}
            />
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleBack}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-white border-2 border-[#E8E4DC] text-[#6B6B6B] hover:bg-[#F7F3ED] transition-all"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-[#1F1F1F] text-white hover:bg-[#333] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </main>
  )
}

export default function ProcessDetailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8956B] mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">로딩 중...</p>
        </div>
      </main>
    }>
      <ProcessDetailPageContent />
    </Suspense>
  )
}




