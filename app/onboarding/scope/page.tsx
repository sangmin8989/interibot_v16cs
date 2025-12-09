'use client'

/**
 * 공사 범위 선택 페이지 (업그레이드 버전)
 * - 방안 1: 비주얼 카드 + 예상 비용
 * - 방안 2: 공정 미리보기 + 체크리스트
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { useScopeStore } from '@/lib/store/scopeStore'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import { SPACES } from '@/constants/spaces'
import { SPACE_ANALYSIS, getMultipleSpaceAnalysis, calculateTotalEstimatedCost } from '@/lib/data/space-analysis'
import type { SpaceId } from '@/types/spaceProcess'
import { 
  Check, ChevronDown, ChevronUp, Sparkles, Info, 
  CheckCircle2, Circle, Home
} from 'lucide-react'

// 공간별 예상 비용 (30평 기준, 만원 단위)
const SPACE_ESTIMATED_COST: Record<SpaceId, { min: number; max: number }> = {
  living: { min: 300, max: 800 },
  kitchen: { min: 800, max: 1500 },
  masterBedroom: { min: 200, max: 500 },
  room1: { min: 150, max: 400 },
  room2: { min: 150, max: 400 },
  room3: { min: 150, max: 400 },
  room4: { min: 150, max: 400 },
  room5: { min: 150, max: 400 },
  bathroom: { min: 400, max: 900 },
  masterBathroom: { min: 350, max: 700 },  // 안방욕실 (공용욕실과 동일)
  commonBathroom: { min: 350, max: 700 },   // 공용욕실 (실용적)
  bathroom3: { min: 350, max: 700 },        // 추가 욕실
  entrance: { min: 100, max: 300 },
  balcony: { min: 150, max: 400 },
  dressRoom: { min: 200, max: 500 },
}

// 공간별 핵심 공정 목록 (상세)
const SPACE_PROCESSES_DETAIL: Record<SpaceId, { name: string; included: boolean; price: string }[]> = {
  living: [
    { name: '도배 (벽지/페인트)', included: true, price: '~150만원' },
    { name: '바닥재 교체', included: true, price: '~200만원' },
    { name: '조명 설치', included: true, price: '~100만원' },
    { name: '아트월 시공', included: false, price: '+200만원' },
    { name: '붙박이장', included: false, price: '+150만원' },
  ],
  kitchen: [
    { name: '싱크대 교체', included: true, price: '~400만원' },
    { name: '상판 교체', included: true, price: '~200만원' },
    { name: '후드/쿡탑', included: true, price: '~150만원' },
    { name: '벽타일 시공', included: true, price: '~100만원' },
    { name: '냉장고장/키큰장', included: false, price: '+100만원' },
    { name: '아일랜드 식탁', included: false, price: '+300만원' },
  ],
  masterBedroom: [
    { name: '도배 (벽지/페인트)', included: true, price: '~100만원' },
    { name: '바닥재 교체', included: true, price: '~120만원' },
    { name: '조명 설치', included: true, price: '~50만원' },
    { name: '붙박이장', included: false, price: '+200만원' },
  ],
  room1: [
    { name: '도배', included: true, price: '~80만원' },
    { name: '바닥재', included: true, price: '~100만원' },
    { name: '조명', included: true, price: '~40만원' },
    { name: '붙박이장', included: false, price: '+150만원' },
  ],
  room2: [
    { name: '도배', included: true, price: '~80만원' },
    { name: '바닥재', included: true, price: '~100만원' },
    { name: '조명', included: true, price: '~40만원' },
    { name: '붙박이장', included: false, price: '+150만원' },
  ],
  room3: [
    { name: '도배', included: true, price: '~80만원' },
    { name: '바닥재', included: true, price: '~100만원' },
    { name: '조명', included: true, price: '~40만원' },
  ],
  room4: [
    { name: '도배', included: true, price: '~80만원' },
    { name: '바닥재', included: true, price: '~100만원' },
    { name: '조명', included: true, price: '~40만원' },
  ],
  room5: [
    { name: '도배', included: true, price: '~80만원' },
    { name: '바닥재', included: true, price: '~100만원' },
    { name: '조명', included: true, price: '~40만원' },
  ],
  bathroom: [
    { name: '타일 시공', included: true, price: '~250만원' },
    { name: '위생도기', included: true, price: '~150만원' },
    { name: '수전 교체', included: true, price: '~80만원' },
    { name: '샤워부스', included: false, price: '+100만원' },
    { name: '욕조', included: false, price: '+150만원' },
    { name: '비데', included: false, price: '+50만원' },
  ],
  // 안방욕실 (공용욕실과 동일한 실용적 옵션)
  masterBathroom: [
    { name: '타일 시공', included: true, price: '~200만원' },
    { name: '위생도기', included: true, price: '~120만원' },
    { name: '수전 교체', included: true, price: '~60만원' },
    { name: '샤워부스', included: false, price: '+80만원' },
    { name: '비데', included: false, price: '+50만원' },
    { name: '수납장 추가', included: false, price: '+50만원' },
  ],
  // 공용욕실 (실용적, 샤워 위주)
  commonBathroom: [
    { name: '타일 시공', included: true, price: '~200만원' },
    { name: '위생도기', included: true, price: '~120만원' },
    { name: '수전 교체', included: true, price: '~60만원' },
    { name: '샤워부스', included: false, price: '+80만원' },
    { name: '비데', included: false, price: '+50만원' },
    { name: '수납장 추가', included: false, price: '+50만원' },
  ],
  // 욕실3
  bathroom3: [
    { name: '타일 시공', included: true, price: '~200만원' },
    { name: '위생도기', included: true, price: '~120만원' },
    { name: '수전 교체', included: true, price: '~60만원' },
    { name: '샤워부스', included: false, price: '+80만원' },
    { name: '비데', included: false, price: '+50만원' },
  ],
  entrance: [
    { name: '바닥 타일', included: true, price: '~80만원' },
    { name: '신발장', included: true, price: '~100만원' },
    { name: '중문 설치', included: false, price: '+150만원' },
  ],
  balcony: [
    { name: '타일 시공', included: true, price: '~120만원' },
    { name: '도장', included: true, price: '~50만원' },
    { name: '붙박이 수납', included: false, price: '+100만원' },
  ],
  dressRoom: [
    { name: '도배', included: true, price: '~60만원' },
    { name: '바닥재', included: true, price: '~80만원' },
    { name: '붙박이장', included: true, price: '~200만원' },
    { name: '조명', included: true, price: '~40만원' },
  ],
}


// 공간 카드 컴포넌트
interface SpaceCardProps {
  space: { id: string; name: string }
  spaceInfo: any
  isSelected: boolean
  isRecommended: boolean
  isExpanded: boolean
  onToggle: () => void
  onExpand: () => void
}

function SpaceCard({ space, spaceInfo, isSelected, isRecommended, isExpanded, onToggle, onExpand }: SpaceCardProps) {
  const spaceId = space.id as SpaceId
  const cost = SPACE_ESTIMATED_COST[spaceId] || { min: 100, max: 300 }
  const processes = SPACE_PROCESSES_DETAIL[spaceId] || []
  const includedCount = processes.filter(p => p.included).length
  const optionalCount = processes.filter(p => !p.included).length
  
  // 장단점 데이터
  const analysis = SPACE_ANALYSIS[spaceId]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative rounded-2xl border-2 overflow-hidden transition-all duration-300
        ${isSelected 
          ? 'border-argen-500 bg-gradient-to-br from-argen-50 to-white shadow-lg shadow-argen-100' 
          : 'border-gray-200 bg-white hover:border-argen-300 hover:shadow-md'
        }
      `}
    >

      {/* 메인 카드 영역 */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 text-left"
      >
        <div className="flex items-start justify-between">
          {/* 왼쪽: 아이콘 + 이름 */}
          <div className="flex items-center gap-3">
            <div className={`
              w-14 h-14 rounded-xl flex items-center justify-center text-2xl
              ${isSelected 
                ? 'bg-argen-100' 
                : 'bg-gray-100'
              }
            `}>
              {spaceInfo?.icon || '🏠'}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isSelected ? 'text-argen-800' : 'text-gray-900'}`}>
                {space.name}
              </h3>
              <p className="text-sm text-gray-500">
                기본 {includedCount}개 공정 {optionalCount > 0 && `· 옵션 ${optionalCount}개`}
              </p>
            </div>
          </div>

          {/* 오른쪽: 가격 + 체크 */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`text-lg font-bold ${isSelected ? 'text-argen-600' : 'text-gray-700'}`}>
                {cost.min}~{cost.max}만원
              </p>
              <p className="text-xs text-gray-400">예상 비용</p>
            </div>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${isSelected 
                ? 'bg-argen-500 text-white' 
                : 'border-2 border-gray-300'
              }
            `}>
              {isSelected && <Check className="w-5 h-5" strokeWidth={3} />}
            </div>
          </div>
        </div>
      </button>

      {/* 확장 토글 버튼 */}
      <button
        type="button"
        onClick={onExpand}
        className={`
          w-full py-2 border-t flex items-center justify-center gap-1 text-sm transition-colors
          ${isSelected 
            ? 'border-argen-200 text-argen-500 hover:bg-argen-50' 
            : 'border-gray-100 text-gray-500 hover:bg-gray-50'
          }
        `}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            접기
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            포함 공정 보기
          </>
        )}
      </button>

      {/* 확장된 공정 목록 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-4 bg-gray-50/50 space-y-4">
              {/* AI 장단점 분석 */}
              {analysis && (
                <div className="bg-white rounded-xl p-4 border border-argen-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-argen-500" />
                    <span className="text-sm font-semibold text-argen-600">AI 분석</span>
                  </div>
                  
                  {/* 장점 */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-green-600 mb-1">👍 이런 점이 좋아요</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysis.pros.slice(0, 2).map((pro, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* 주의점 */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-amber-600 mb-1">⚠️ 주의할 점</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysis.cons.slice(0, 2).map((con, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* AI 코멘트 */}
                  <div className="bg-argen-50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-argen-700">
                      💡 {analysis.aiComment}
                    </p>
                  </div>
                </div>
              )}

              {/* 기본 포함 공정 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  기본 포함 공정
                </p>
                <div className="space-y-1">
                  {processes.filter(p => p.included).map((process, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{process.name}</span>
                      <span className="text-gray-500">{process.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 옵션 공정 */}
              {processes.filter(p => !p.included).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Circle className="w-3 h-3 text-orange-500" />
                    선택 옵션
                  </p>
                  <div className="space-y-1">
                    {processes.filter(p => !p.included).map((process, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{process.name}</span>
                        <span className="text-orange-600 font-medium">{process.price}</span>
                      </div>
      ))}
    </div>
                </div>
              )}
              
              {/* 팁 */}
              {analysis?.tips && analysis.tips.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">💡 TIP</p>
                  <ul className="text-xs text-blue-800 space-y-0.5">
                    {analysis.tips.slice(0, 2).map((tip, idx) => (
                      <li key={idx}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ScopePage() {
  const router = useRouter()
  const { selectedSpaces, toggleSpace, selectAllSpaces, clearSelectedSpaces, initializeSpaces } = useScopeStore()
  const { spaceInfo } = useSpaceInfoStore()
  
  const [expandedSpaces, setExpandedSpaces] = useState<Set<SpaceId>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)

  // 페이지 진입 시 선택 초기화 (자동 선택 기능 삭제)
  useEffect(() => {
    if (!isInitialized) {
      // ✅ 방 개수 + 욕실 개수에 맞게 공간 목록 초기화 (모든 선택 해제 상태로)
      const roomCount = spaceInfo?.rooms || 3
      const bathroomCount = spaceInfo?.bathrooms || 2
      console.log(`🏠 공간 선택 페이지: 방 ${roomCount}개, 욕실 ${bathroomCount}개로 초기화`)
      initializeSpaces(roomCount, bathroomCount)
      setIsInitialized(true)
    }
  }, [isInitialized, spaceInfo?.rooms, spaceInfo?.bathrooms, initializeSpaces])

  // 선택된 공간
  const selectedSpaceIds = selectedSpaces
    .filter(space => space.isSelected)
    .map(space => space.id) as SpaceId[]

  const selectedCount = selectedSpaceIds.length

  // 총 예상 비용 계산
  const totalEstimatedCost = selectedSpaceIds.reduce((acc, spaceId) => {
    const cost = SPACE_ESTIMATED_COST[spaceId] || { min: 0, max: 0 }
    return {
      min: acc.min + cost.min,
      max: acc.max + cost.max,
    }
  }, { min: 0, max: 0 })

  // 확장 토글
  const toggleExpand = (spaceId: SpaceId) => {
    setExpandedSpaces(prev => {
      const next = new Set(prev)
      if (next.has(spaceId)) {
        next.delete(spaceId)
      } else {
        next.add(spaceId)
      }
      return next
    })
  }

  // 다음 단계로 이동 (공간선택 → 공정선택 → AI분석 → 견적)
  const handleNext = () => {
    if (selectedCount === 0) {
      alert('최소 1개 이상의 공간을 선택해주세요.')
      return
    }
    router.push('/onboarding/process')
  }

  // 이전 단계로 이동 (새 플로우: 집정보로 돌아가기)
  const handleBack = () => {
    router.push('/space-info')
  }

  return (
    <>
      <StepIndicator currentStep={2} />

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-argen-50/30 py-8 px-4 pb-40">
        <div className="max-w-3xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              어떤 공간을 바꾸고 싶으세요?
            </h1>
            <p className="text-gray-500">
              공간을 선택하면 장단점과 예상 비용을 확인할 수 있어요
            </p>
            {spaceInfo && (
              <p className="text-sm text-argen-500 mt-2">
                🏠 {spaceInfo.pyeong}평 {spaceInfo.housingType} · 방 {spaceInfo.rooms}개 · 화장실 {spaceInfo.bathrooms}개
              </p>
            )}
          </div>

          {/* 빠른 선택 버튼 */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            <button
              type="button"
              onClick={selectAllSpaces}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={clearSelectedSpaces}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
            >
              전체 해제
            </button>
          </div>

          {/* 공간 목록 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-argen-500" />
              <h2 className="font-bold text-gray-900">공간 선택</h2>
              <span className="text-sm text-gray-500">
                선택: {selectedCount}개
              </span>
            </div>
            <div className="space-y-3">
              {selectedSpaces.map((space) => {
                const spaceInfoData = SPACES.find(s => s.id === space.id)
                return (
                  <SpaceCard
                    key={space.id}
                    space={space}
                    spaceInfo={spaceInfoData}
                    isSelected={space.isSelected}
                    isRecommended={false}
                    isExpanded={expandedSpaces.has(space.id as SpaceId)}
                    onToggle={() => toggleSpace(space.id)}
                    onExpand={() => toggleExpand(space.id as SpaceId)}
                  />
                )
              })}
            </div>
          </div>

          {/* 예상 비용 요약 */}
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-argen-500 to-argen-600 rounded-2xl p-6 text-white shadow-xl mb-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-argen-200 text-sm mb-1">선택한 공간 {selectedCount}개</p>
                  <p className="text-2xl font-bold">
                    예상 {totalEstimatedCost.min.toLocaleString()}~{totalEstimatedCost.max.toLocaleString()}만원
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                  <Info className="w-6 h-6" />
                </div>
              </div>
              <p className="text-argen-200 text-xs mt-3">
                * 30평 기준 예상 비용이며, 실제 비용은 세부 옵션에 따라 달라집니다
              </p>
            </motion.div>
          )}
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
              className="w-1/4 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  ← 이전
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={selectedCount === 0}
                  className={`
                flex-1 px-6 py-3 rounded-xl transition-all font-bold shadow-lg flex items-center justify-center gap-2
                    ${selectedCount > 0
                  ? 'bg-gradient-to-r from-argen-500 to-argen-600 text-white hover:from-argen-600 hover:to-argen-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
              다음 단계 - 공정 선택
              <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                </button>
              </div>
            </div>
          </div>
    </>
  )
}
