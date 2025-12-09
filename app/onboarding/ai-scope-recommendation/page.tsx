'use client'

/**
 * AI 공사 범위 추천 페이지 (업그레이드 버전)
 * - 방안 1: 비주얼 카드 + 예상 비용
 * - 방안 2: 공정 미리보기 + 체크리스트
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { useScopeStore } from '@/lib/store/scopeStore'
import { usePersonalityStore } from '@/lib/store/personalityStore'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import { SPACES } from '@/constants/spaces'
import type { SpaceId } from '@/types/spaceProcess'
import { 
  Sparkles, Check, RotateCcw, ChevronDown, ChevronUp, 
  Info, CheckCircle2, Circle, Zap, Home, TrendingUp
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
  masterBathroom: { min: 500, max: 1200 },  // 안방욕실 (더 넓고 고급)
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

// AI 추천 로직 (성향 분석 기반)
const getRecommendedSpaces = (analysis: any, vibeData: any, spaceInfo: any): SpaceId[] => {
  const recommended: SpaceId[] = []
  
  // 성향 분석 결과 기반 추천
  if (analysis?.answers && Object.keys(analysis.answers).length > 0) {
    const answers = analysis.answers
    const priority = Object.values(answers).join(' ')
    
    if (priority.includes('실용') || priority.includes('가성비') || priority.includes('저렴')) {
      recommended.push('kitchen', 'bathroom')
    }
    if (priority.includes('디자인') || priority.includes('모던') || priority.includes('고급')) {
      recommended.push('living', 'masterBedroom')
    }
    if (priority.includes('수납') || priority.includes('정리')) {
      recommended.push('dressRoom', 'masterBedroom')
    }
    if (priority.includes('첫인상') || priority.includes('깔끔')) {
      recommended.push('entrance', 'living')
    }
    if (priority.includes('가족') || priority.includes('자녀') || priority.includes('아이')) {
      recommended.push('living')
      if (spaceInfo?.rooms) {
        for (let i = 1; i < spaceInfo.rooms; i++) {
          recommended.push(`room${i}` as SpaceId)
        }
      }
    }
    if (priority.includes('여유') || priority.includes('힐링') || priority.includes('휴식')) {
      recommended.push('balcony', 'masterBedroom')
    }
  }
  
  // Vibe 모드 (MBTI) 기반 추천
  if (vibeData?.mbti) {
    const mbti = vibeData.mbti
    if (mbti.includes('E')) recommended.push('living', 'kitchen')
    if (mbti.includes('I')) recommended.push('masterBedroom', 'dressRoom')
    if (mbti.includes('J')) recommended.push('dressRoom', 'kitchen')
    if (mbti.includes('P')) recommended.push('living', 'balcony')
  }
  
  // 기본값
  if (recommended.length === 0) {
    recommended.push('living', 'kitchen', 'balcony')
  }
  
  return [...new Set(recommended)]
}

// 공간 카드 컴포넌트
interface SpaceCardProps {
  space: { id: string; name: string; isSelected: boolean }
  spaceData: any
  isRecommended: boolean
  isExpanded: boolean
  onToggle: () => void
  onExpand: () => void
}

function SpaceCard({ space, spaceData, isRecommended, isExpanded, onToggle, onExpand }: SpaceCardProps) {
  const spaceId = space.id as SpaceId
  const cost = SPACE_ESTIMATED_COST[spaceId] || { min: 100, max: 300 }
  const processes = SPACE_PROCESSES_DETAIL[spaceId] || []
  const includedCount = processes.filter(p => p.included).length
  const optionalCount = processes.filter(p => !p.included).length

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative rounded-2xl border-2 overflow-hidden transition-all duration-300
        ${space.isSelected 
          ? isRecommended
            ? 'border-argen-500 bg-gradient-to-br from-argen-50 to-white shadow-lg shadow-purple-100' 
            : 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-lg shadow-blue-100'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* AI 추천 배지 */}
      {isRecommended && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="bg-gradient-to-r from-argen-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3" />
            AI 추천
          </div>
        </div>
      )}

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
              ${space.isSelected 
                ? isRecommended ? 'bg-purple-100' : 'bg-blue-100'
                : 'bg-gray-100'
              }
            `}>
              {spaceData?.icon || '🏠'}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${space.isSelected ? (isRecommended ? 'text-purple-900' : 'text-blue-900') : 'text-gray-900'}`}>
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
              <p className={`text-lg font-bold ${space.isSelected ? (isRecommended ? 'text-argen-600' : 'text-blue-700') : 'text-gray-700'}`}>
                {cost.min}~{cost.max}만
              </p>
              <p className="text-xs text-gray-400">예상 비용</p>
            </div>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${space.isSelected 
                ? isRecommended ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                : 'border-2 border-gray-300'
              }
            `}>
              {space.isSelected && <Check className="w-5 h-5" strokeWidth={3} />}
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
          ${space.isSelected 
            ? isRecommended ? 'border-purple-200 text-purple-600 hover:bg-argen-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'
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
            <div className="p-4 bg-gray-50/50">
              {/* 기본 포함 공정 */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  기본 포함
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AIScopeRecommendationPage() {
  const router = useRouter()
  const { selectedSpaces, toggleSpace, selectAllSpaces, clearSelectedSpaces, initializeSpaces, setSelectedSpaces } = useScopeStore()
  const { analysis, vibeData } = usePersonalityStore()
  const spaceInfo = useSpaceInfoStore(state => state.spaceInfo)
  
  const [isLoading, setIsLoading] = useState(true)
  const [recommendedSpaceIds, setRecommendedSpaceIds] = useState<SpaceId[]>([])
  const [expandedSpaces, setExpandedSpaces] = useState<Set<SpaceId>>(new Set())
  
  // 방 개수에 따라 공간 목록 초기화
  useEffect(() => {
    if (spaceInfo?.rooms) {
      initializeSpaces(spaceInfo.rooms)
    }
  }, [spaceInfo?.rooms, initializeSpaces])
  
  // AI 추천 실행
  useEffect(() => {
    setIsLoading(true)
    
    setTimeout(() => {
      const recommended = getRecommendedSpaces(analysis, vibeData, spaceInfo)
      setRecommendedSpaceIds(recommended)
      
      // 추천된 공간 자동 체크
      recommended.forEach(spaceId => {
        const space = selectedSpaces.find(s => s.id === spaceId)
        if (space && !space.isSelected) {
          toggleSpace(spaceId)
        }
      })
      
      setIsLoading(false)
    }, 800)
  }, [analysis, vibeData, spaceInfo])
  
  // 선택된 공간 개수
  const selectedCount = selectedSpaces.filter(space => space.isSelected).length
  const selectedSpaceIds = selectedSpaces.filter(space => space.isSelected).map(s => s.id) as SpaceId[]
  
  // 총 예상 비용 계산
  const totalEstimatedCost = selectedSpaceIds.reduce((acc, spaceId) => {
    const cost = SPACE_ESTIMATED_COST[spaceId] || { min: 0, max: 0 }
    return {
      min: acc.min + cost.min,
      max: acc.max + cost.max,
    }
  }, { min: 0, max: 0 })
  
  // 추천 공간과 나머지 공간 분리
  const recommendedSpaces = selectedSpaces.filter(space => 
    recommendedSpaceIds.includes(space.id as SpaceId)
  )
  const otherSpaces = selectedSpaces.filter(space => 
    !recommendedSpaceIds.includes(space.id as SpaceId)
  )
  
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
  
  // AI 추천으로 복원
  const handleResetToAI = () => {
    const newSelectedSpaces = selectedSpaces.map(space => ({
      ...space,
      isSelected: recommendedSpaceIds.includes(space.id as SpaceId)
    }))
    setSelectedSpaces(newSelectedSpaces)
  }
  
  // 다음 단계로 이동
  const handleNext = () => {
    if (selectedCount === 0) {
      alert('최소 1개 이상의 공간을 선택해주세요.')
      return
    }
    router.push('/onboarding/process')
  }
  
  // 이전 단계로 이동
  const handleBack = () => {
    router.back()
  }
  
  // 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-blue-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <Sparkles className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-700 font-semibold text-lg mb-2">AI가 분석 중입니다</p>
          <p className="text-gray-500 text-sm">
            성향을 바탕으로 최적의 공사 범위를 추천하고 있어요...
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-argen-50/30">
      <StepIndicator
        currentStep={3}
        steps={[
          { number: 1, label: '집 정보', description: '공간 정보 입력' },
          { number: 2, label: '성향 분석', description: '취향 파악' },
          { number: 3, label: 'AI 추천', description: '공사 범위' },
          { number: 4, label: '공정 선택', description: '세부 옵션' },
          { number: 5, label: 'AI 종합', description: '스타일 분석' },
          { number: 6, label: '견적 확인', description: '최종 확인' },
        ]}
      />
      
      <div className="max-w-3xl mx-auto px-4 py-8 pb-40">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-argen-600 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">AI 맞춤 추천</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            당신에게 필요한 공사 범위
          </h1>
          <p className="text-gray-500">
            성향 분석 결과를 바탕으로 추천해드립니다. 자유롭게 수정하실 수 있어요.
          </p>
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
          <button
            type="button"
            onClick={handleResetToAI}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-argen-600 text-white rounded-lg hover:from-argen-600 hover:to-indigo-700 transition-all text-sm font-medium flex items-center gap-1"
          >
            <Zap className="w-4 h-4" />
            AI 추천으로 적용
          </button>
        </div>

        {/* AI 추천 공간 섹션 */}
        {recommendedSpaces.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-900">AI 추천 공간</h2>
              <span className="text-sm text-purple-600">({recommendedSpaces.length}개)</span>
            </div>
            <div className="space-y-4">
              {recommendedSpaces.map((space) => {
                const spaceData = SPACES.find(s => s.id === space.id)
                return (
                  <SpaceCard
                    key={space.id}
                    space={space}
                    spaceData={spaceData}
                    isRecommended={true}
                    isExpanded={expandedSpaces.has(space.id as SpaceId)}
                    onToggle={() => toggleSpace(space.id)}
                    onExpand={() => toggleExpand(space.id as SpaceId)}
                  />
                )
              })}
            </div>
          </div>
        )}
        
        {/* 다른 공간 섹션 */}
        {otherSpaces.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-gray-500" />
              <h2 className="font-bold text-gray-900">다른 공간도 선택할 수 있어요</h2>
              <span className="text-sm text-gray-400">
                선택: {otherSpaces.filter(s => s.isSelected).length}개
              </span>
            </div>
            <div className="space-y-3">
              {otherSpaces.map((space) => {
                const spaceData = SPACES.find(s => s.id === space.id)
                return (
                  <SpaceCard
                    key={space.id}
                    space={space}
                    spaceData={spaceData}
                    isRecommended={false}
                    isExpanded={expandedSpaces.has(space.id as SpaceId)}
                    onToggle={() => toggleSpace(space.id)}
                    onExpand={() => toggleExpand(space.id as SpaceId)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* 예상 비용 요약 */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-argen-600 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm mb-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  선택한 공간 {selectedCount}개
                </p>
                <p className="text-3xl font-bold">
                  {totalEstimatedCost.min.toLocaleString()}~{totalEstimatedCost.max.toLocaleString()}만원
                </p>
                <p className="text-purple-200 text-sm mt-1">예상 공사 비용</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                <Info className="w-6 h-6" />
              </div>
            </div>
            <p className="text-purple-200 text-xs mt-3 border-t border-purple-400/30 pt-3">
              * 30평 기준 예상 비용이며, 세부 옵션에 따라 달라집니다
            </p>
          </motion.div>
        )}
      </div>
      
      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="w-1/4 px-4 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← 이전
            </button>
            <button
              onClick={handleNext}
              disabled={selectedCount === 0}
              className={`
                flex-1 py-3 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2
                ${selectedCount > 0
                  ? 'bg-gradient-to-r from-purple-600 to-argen-600 text-white hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {selectedCount > 0 
                ? `다음 단계 - 공정 선택` 
                : '공간을 선택해주세요'
              }
              {selectedCount > 0 && <ChevronDown className="w-5 h-5 rotate-[-90deg]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
