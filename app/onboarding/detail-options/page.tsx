'use client'

/**
 * 세분화 옵션 선택 페이지 (확장 버전)
 * - 모든 선택된 공간에 대한 세부 옵션 선택
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Sparkles, Home } from 'lucide-react'
import StepIndicator from '@/components/onboarding/StepIndicator'
import KitchenOptionsPanel from '@/components/onboarding/options/KitchenOptionsPanel'
import BathroomOptionsPanel from '@/components/onboarding/options/BathroomOptionsPanel'
import LivingOptionsPanel, { LivingOptions } from '@/components/onboarding/options/LivingOptionsPanel'
import EntranceOptionsPanel, { EntranceOptions } from '@/components/onboarding/options/EntranceOptionsPanel'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import { useScopeStore } from '@/lib/store/scopeStore'
import type { KitchenOptions, BathroomOptions } from '@/lib/estimate/types'

// 옵션 저장용 스토어
const STORAGE_KEY = 'interibot_detail_options'

interface DetailOptions {
  주방옵션: KitchenOptions
  보조주방옵션: KitchenOptions // 30평 이상일 때 - 보조주방(팬트리)
  보조주방사용: boolean // 보조주방 사용 여부
  욕실옵션: BathroomOptions // 욕실 1개일 때 또는 기본값
  안방욕실옵션: BathroomOptions // 욕실 2개 이상일 때 - 안방욕실
  공용욕실옵션: BathroomOptions // 욕실 2개 이상일 때 - 공용욕실
  거실옵션: LivingOptions
  안방옵션: LivingOptions
  방옵션: LivingOptions
  현관옵션: EntranceOptions
  발코니옵션: EntranceOptions
}

// 욕실 기본 옵션 (재사용)
const DEFAULT_BATHROOM_OPTIONS: BathroomOptions = {
  스타일: '모던',
  벽타일사이즈: '중형(600x600)',
  바닥타일사이즈: '소형(300x300)',
  양변기등급: '기본',
  세면대등급: '기본',
  욕조: false,
  샤워부스: true,
  샤워부스타입: '일반',
  비데: true,
  비데등급: '기본',
  욕실장타입: '벽걸이',
  젠다이: false,
  파티션: true,
  바닥난방: false,
  환풍기등급: '기본',
}

// 주방 기본 옵션 (재사용)
const DEFAULT_KITCHEN_OPTIONS: KitchenOptions = {
  형태: '일자',
  상판재질: '엔지니어드스톤',
  냉장고장: false,
  키큰장: false,
  아일랜드장: false,
  팬트리: false,
  상부장LED: false,
  하부장LED: false,
  설비: {
    쿡탑: '가스레인지',
    식기세척기: false,
    빌트인오븐: false,
    빌트인정수기: false,
  }
}

const DEFAULT_OPTIONS: DetailOptions = {
  주방옵션: { ...DEFAULT_KITCHEN_OPTIONS },
  보조주방옵션: { 
    ...DEFAULT_KITCHEN_OPTIONS, 
    형태: '일자',  // 보조주방은 보통 일자형
    팬트리: true,  // 팬트리 기능 포함
  },
  보조주방사용: false, // 기본값: 사용 안함
  욕실옵션: { ...DEFAULT_BATHROOM_OPTIONS },
  안방욕실옵션: { ...DEFAULT_BATHROOM_OPTIONS, 욕조: true }, // 안방욕실은 기본적으로 욕조 포함
  공용욕실옵션: { ...DEFAULT_BATHROOM_OPTIONS },
  거실옵션: {
    벽지종류: '실크',
    바닥재종류: '강마루',
    조명타입: '다운라이트',
    포인트벽지: false,
    천장도배: true,
    걸레받이: true,
    디밍가능: false,
    아트월: false,
    몰딩: false,
  },
  안방옵션: {
    벽지종류: '실크',
    바닥재종류: '강마루',
    조명타입: '간접조명',
    포인트벽지: false,
    천장도배: true,
    걸레받이: true,
    디밍가능: true,
  },
  방옵션: {
    벽지종류: '합지',
    바닥재종류: '강화마루',
    조명타입: '다운라이트',
    천장도배: true,
  },
  현관옵션: {
    타일사이즈: '중형',
    타일패턴: '일반',
    신발장교체: true,
    신발장크기: '중형',
    중문설치: false,
  },
  발코니옵션: {
    타일사이즈: '중형',
    타일패턴: '일반',
  }
}

export default function DetailOptionsPage() {
  const router = useRouter()
  const { spaceInfo } = useSpaceInfoStore()
  const { selectedSpaces } = useScopeStore()

  const [options, setOptions] = useState<DetailOptions>(DEFAULT_OPTIONS)
  const [isLoaded, setIsLoaded] = useState(false)

  // 선택된 공간 확인
  const activeSpaces = selectedSpaces.filter(space => space.isSelected)
  const hasKitchen = activeSpaces.some(s => s.id === 'kitchen')
  // ✅ 욕실 체크: bathroom, masterBathroom, commonBathroom, bathroom3 모두 포함
  const hasBathroom = activeSpaces.some(s => 
    s.id === 'bathroom' || 
    s.id === 'masterBathroom' || 
    s.id === 'commonBathroom' || 
    s.id === 'bathroom3'
  )
  // ✅ 개별 욕실 체크 (옵션 분리 표시용)
  const hasMasterBathroom = activeSpaces.some(s => s.id === 'masterBathroom')
  const hasCommonBathroom = activeSpaces.some(s => s.id === 'commonBathroom')
  const hasBathroom3 = activeSpaces.some(s => s.id === 'bathroom3')
  const hasSingleBathroom = activeSpaces.some(s => s.id === 'bathroom')
  
  const hasLiving = activeSpaces.some(s => s.id === 'living')
  const hasMasterBedroom = activeSpaces.some(s => s.id === 'masterBedroom')
  const hasRooms = activeSpaces.some(s => s.id.startsWith('room'))
  const hasEntrance = activeSpaces.some(s => s.id === 'entrance')
  const hasBalcony = activeSpaces.some(s => s.id === 'balcony')

  // 저장된 옵션 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setOptions({ ...DEFAULT_OPTIONS, ...parsed })
      } catch (e) {
        console.error('옵션 로드 실패:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // 옵션 변경 시 저장
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
    }
  }, [options, isLoaded])

  const handleOptionChange = <K extends keyof DetailOptions>(key: K, value: DetailOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const handleNext = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
    // ✅ 세부옵션 → 성향분석(저장된 모드의 질문) → AI 분석 → 견적
    router.push('/onboarding/personality')
  }

  const handleBack = () => {
    // 공정 선택으로 돌아가기
    router.push('/onboarding/process')
  }

  // 선택된 옵션 요약
  const getOptionsSummary = () => {
    const summary: string[] = []
    const bathroomCount = spaceInfo?.bathrooms || 2
    
    if (hasKitchen) {
      if (options.보조주방사용 && (spaceInfo?.pyeong || 30) >= 30) {
        summary.push(`메인주방: ${options.주방옵션.형태}형`)
        summary.push(`보조주방: ${options.보조주방옵션.형태}형`)
      } else {
        summary.push(`주방: ${options.주방옵션.형태}형`)
      }
    }
    if (hasBathroom) {
      // ✅ 선택된 욕실 타입에 따라 요약 표시
      if (hasSingleBathroom && !hasMasterBathroom && !hasCommonBathroom) {
        summary.push(`욕실: ${options.욕실옵션.스타일}`)
      } else {
        if (hasMasterBathroom) {
          summary.push(`안방욕실: ${options.안방욕실옵션.스타일}`)
        }
        if (hasCommonBathroom) {
          summary.push(`공용욕실: ${options.공용욕실옵션.스타일}`)
        }
        if (hasBathroom3) {
          summary.push(`욕실3: ${options.공용욕실옵션.스타일}`)
        }
      }
    }
    if (hasLiving) {
      summary.push(`거실: ${options.거실옵션.벽지종류}`)
    }
    if (hasEntrance) {
      summary.push(`현관: ${options.현관옵션.타일패턴}`)
    }
    
    return summary.length > 0 ? summary.join(' · ') : '옵션 선택 중'
  }

  // 선택된 공간이 있는지 확인
  const hasAnySpace = hasKitchen || hasBathroom || hasLiving || hasMasterBedroom || hasRooms || hasEntrance || hasBalcony

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-32">
      {/* 헤더 */}
      <StepIndicator currentStep={5} />

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">상세 옵션 선택</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            원하시는 옵션을 선택해주세요
          </h1>
          <p className="text-gray-500">
            선택하신 공간에 맞는 세부 옵션을 설정합니다
          </p>
        </div>

        {/* 공간 정보 요약 */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Home className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {spaceInfo?.pyeong || 30}평 · {spaceInfo?.rooms || 3}방 {spaceInfo?.bathrooms || 2}욕실
                </p>
                <p className="text-sm text-gray-500">
                  선택 공간: {activeSpaces.map(s => s.name).join(', ') || '없음'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 옵션 패널들 */}
        <div className="space-y-6">
          {/* 거실 옵션 */}
          {hasLiving && (
            <LivingOptionsPanel
              value={options.거실옵션}
              onChange={(v) => handleOptionChange('거실옵션', v)}
              spaceName="거실"
              isExpanded={true}
            />
          )}

          {/* 주방 옵션 */}
          {hasKitchen && (
            <>
              {/* 메인 주방 (30평 이상이고 보조주방 사용 시 "메인 주방"으로 표시) */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {(spaceInfo?.pyeong || 30) >= 30 && (
                  <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                          <span className="text-2xl">🍳</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {options.보조주방사용 ? '메인 주방' : '주방'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {options.보조주방사용 ? '주요 요리 공간' : '주방 옵션 설정'}
                          </p>
                        </div>
                      </div>
                      
                      {/* 보조주방 토글 (30평 이상일 때만) */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">보조주방</span>
                        <button
                          onClick={() => setOptions(prev => ({ 
                            ...prev, 
                            보조주방사용: !prev.보조주방사용 
                          }))}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            options.보조주방사용 ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                        >
                          <span 
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              options.보조주방사용 ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <KitchenOptionsPanel
                    value={options.주방옵션}
                    onChange={(v) => handleOptionChange('주방옵션', v)}
                    isExpanded={!hasLiving}
                  />
                </div>
              </div>

              {/* 보조주방 (30평 이상 + 보조주방 사용 시) */}
              {(spaceInfo?.pyeong || 30) >= 30 && options.보조주방사용 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50">
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
                  <div className="p-4">
                    <KitchenOptionsPanel
                      value={options.보조주방옵션}
                      onChange={(v) => handleOptionChange('보조주방옵션', v)}
                      isExpanded={false}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* 욕실 옵션 - 선택된 욕실 타입에 따라 분리 표시 */}
          {hasBathroom && (
            <>
              {/* 욕실 1개인 경우 (bathroom만 선택된 경우) */}
              {hasSingleBathroom && !hasMasterBathroom && !hasCommonBathroom && (
                <BathroomOptionsPanel
                  value={options.욕실옵션}
                  onChange={(v) => handleOptionChange('욕실옵션', v)}
                  bathroomCount={1}
                  isExpanded={!hasLiving && !hasKitchen}
                />
              )}
              
              {/* 안방욕실이 선택된 경우 */}
              {hasMasterBathroom && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50">
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
                  <div className="p-4">
                    <BathroomOptionsPanel
                      value={options.안방욕실옵션}
                      onChange={(v) => handleOptionChange('안방욕실옵션', v)}
                      bathroomCount={1}
                      isExpanded={!hasLiving && !hasKitchen && !hasCommonBathroom}
                    />
                  </div>
                </div>
              )}

              {/* 공용욕실이 선택된 경우 */}
              {hasCommonBathroom && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-5 bg-gradient-to-r from-cyan-50 to-blue-50">
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
                  <div className="p-4">
                    <BathroomOptionsPanel
                      value={options.공용욕실옵션}
                      onChange={(v) => handleOptionChange('공용욕실옵션', v)}
                      bathroomCount={1}
                      isExpanded={false}
                    />
                  </div>
                </div>
              )}

              {/* 욕실3이 선택된 경우 */}
              {hasBathroom3 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                        <span className="text-2xl">🚿</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">욕실3</h3>
                        <p className="text-sm text-gray-500">추가 욕실</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <BathroomOptionsPanel
                      value={options.공용욕실옵션} // 욕실3도 공용욕실 옵션 사용
                      onChange={(v) => handleOptionChange('공용욕실옵션', v)}
                      bathroomCount={1}
                      isExpanded={false}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* 안방 옵션 */}
          {hasMasterBedroom && (
            <LivingOptionsPanel
              value={options.안방옵션}
              onChange={(v) => handleOptionChange('안방옵션', v)}
              spaceName="안방"
              isExpanded={false}
            />
          )}

          {/* 방 옵션 (통합) */}
          {hasRooms && (
            <LivingOptionsPanel
              value={options.방옵션}
              onChange={(v) => handleOptionChange('방옵션', v)}
              spaceName="방 (공통)"
              isExpanded={false}
            />
          )}

          {/* 현관 옵션 */}
          {hasEntrance && (
            <EntranceOptionsPanel
              value={options.현관옵션}
              onChange={(v) => handleOptionChange('현관옵션', v)}
              isBalcony={false}
              isExpanded={false}
            />
          )}

          {/* 발코니 옵션 */}
          {hasBalcony && (
            <EntranceOptionsPanel
              value={options.발코니옵션}
              onChange={(v) => handleOptionChange('발코니옵션', v)}
              isBalcony={true}
              isExpanded={false}
            />
          )}

          {/* 선택된 공간이 없는 경우 */}
          {!hasAnySpace && (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                선택된 공간이 없습니다
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                이전 단계에서 공사할 공간을 선택해주세요.
              </p>
              <button
                onClick={() => router.push('/onboarding/scope')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                공간 선택하러 가기
              </button>
            </div>
          )}
        </div>

        {/* 선택 요약 */}
        {hasAnySpace && (
          <div className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
            <p className="text-sm text-orange-800">
              <span className="font-medium">선택 요약:</span> {getOptionsSummary()}
            </p>
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleBack}
            className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            이전 단계
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:from-orange-600 hover:to-amber-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
          >
            AI 분석하기 🤖
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  )
}
