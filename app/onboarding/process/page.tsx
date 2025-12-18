'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { useScopeStore } from '@/lib/store/scopeStore'
import { useProcessStore } from '@/lib/store/processStore'
import { usePersonalityStore } from '@/lib/store/personalityStore'
import SpaceAccordion from '@/components/onboarding/process/SpaceAccordion'
import ConfirmModal from '@/components/onboarding/process/ConfirmModal'
import { getProcessGroupsForSpace } from '@/constants/processes'
import { SPACES } from '@/constants/spaces'
import type { SpaceId, ProcessCategory } from '@/types/spaceProcess'
import { Zap } from 'lucide-react'

export default function ProcessPage() {
  const router = useRouter()
  const { selectedSpaces } = useScopeStore()
  const {
    selectedProcessesBySpace,
    setSpaceProcessSelection,
    getSpaceProcessSelection,
    applyAllProcessesToAllSpaces,
    applyDefaultFullScopeForSelectedSpaces,
    getSpaceProcessCount,
  } = useProcessStore()
  
  // 기준 정보 가져오기
  const hasDecisionCriteria = usePersonalityStore((state) => state.hasDecisionCriteria)
  const decisionCriteria = usePersonalityStore((state) => state.decisionCriteria)
  const decisionCriteriaDeclaration = usePersonalityStore((state) => state.decisionCriteriaDeclaration)
  
  // 선택된 공간만 필터링
  const activeSpaces = selectedSpaces.filter(space => space.isSelected)

  // 선택된 공간 이름 목록 생성
  const selectedSpaceNames = activeSpaces.map(space => space.name).join(' · ')

  // 확인 모달 상태
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [expandedSpaces, setExpandedSpaces] = useState<Set<SpaceId>>(new Set())

  // 전체 공정 원클릭 적용 (기존 호환성)
  const handleApplyAllProcesses = () => {
    applyAllProcessesToAllSpaces()
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  // 선택된 공간에만 기본 공정 적용
  const handleApplyDefaultFullScope = () => {
    const selectedSpaceIds = activeSpaces.map(space => space.id as SpaceId)
    
    // 기존 선택값이 있는지 확인
    const hasExistingSelections = selectedSpaceIds.some(spaceId => {
      const selections = selectedProcessesBySpace[spaceId]
      if (!selections) return false
      return Object.values(selections).some(value => value !== null)
    })

    if (hasExistingSelections) {
      // 확인 모달 표시
      setShowConfirmModal(true)
    } else {
      // 바로 적용
      applyDefaultFullScopeForSelectedSpaces(selectedSpaceIds)
      setShowSuccessMessage(true)
      
      // 모든 아코디언 자동 확장
      setExpandedSpaces(new Set(selectedSpaceIds))
      
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    }
  }

  // 확인 모달에서 확인 클릭
  const handleConfirmApply = () => {
    const selectedSpaceIds = activeSpaces.map(space => space.id as SpaceId)
    applyDefaultFullScopeForSelectedSpaces(selectedSpaceIds)
    setShowConfirmModal(false)
    setShowSuccessMessage(true)
    
    // 모든 아코디언 자동 확장
    setExpandedSpaces(new Set(selectedSpaceIds))
    
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 3000)
  }

  // 다음 단계로 (공정선택 → 세부옵션 → AI분석 → 견적)
  const handleNext = () => {
    router.push('/onboarding/detail-options')
  }

  // 공간별 선택된 공정 개수 계산
  const getTotalSelectedCount = (): number => {
    return activeSpaces.reduce((total, space) => {
      return total + getSpaceProcessCount(space.id as SpaceId)
    }, 0)
  }

  // 공간이 없을 때
  if (activeSpaces.length === 0) {
    return (
      <>
        <StepIndicator currentStep={4} />

        <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-4">🏠</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                선택된 공간이 없습니다
              </h2>
              <p className="text-gray-600 mb-6">
                Step 3에서 공간을 선택한 후 다시 시도해주세요
              </p>
              <button
                onClick={() => router.push('/onboarding/scope')}
                className="px-6 py-3 bg-argen-500 text-white rounded-xl hover:bg-argen-600 transition-all font-medium"
              >
                공사 범위 선택으로 돌아가기
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <StepIndicator currentStep={4} />

      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 py-8 px-4 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              공정 상세 선택
            </h1>
            <p className="text-gray-600">
              선택하신 공간별로 원하는 공정을 선택해주세요
            </p>
            
            {/* 기준 기반 설명 (기준이 있을 때만 표시) */}
            {hasDecisionCriteria && decisionCriteria && decisionCriteriaDeclaration && (
              <div className="mt-6 p-4 bg-argen-50 border-2 border-argen-200 rounded-xl text-left max-w-2xl mx-auto">
                <h3 className="text-sm font-semibold text-argen-700 mb-2">
                  선택 기준
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {decisionCriteriaDeclaration}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  이 기준에 따라 공정 설명이 달라집니다.
                </p>
              </div>
            )}
          </div>

          {/* 선택된 공간 요약 */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  선택된 공간
                </h3>
                <p className="text-2xl font-bold text-argen-500">
                  {selectedSpaceNames || '없음'}
                </p>
              </div>
            </div>
          </div>

          {/* 전체 공정 원클릭 적용 버튼 */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-argen-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-argen-500 rounded-full p-3 flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    전체 공정 기본값 한 번에 적용하기
                  </h3>
                  <p className="text-sm text-gray-600">
                    선택된 모든 공간에 표준 공정을 자동으로 설정합니다. 이후 원하는 항목만 수정하세요.
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleApplyDefaultFullScope}
                className="w-full px-6 py-4 bg-gradient-to-r from-argen-500 to-pink-600 text-white rounded-xl hover:from-argen-600 hover:to-pink-700 transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                기본 공정 세트 적용하기
              </button>
              
              {showSuccessMessage && (
                <div className="mt-4 p-3 bg-green-50 border-2 border-green-200 rounded-xl text-center">
                  <p className="text-sm font-medium text-green-800">
                    ✅ 기본 공정이 적용되었습니다. 각 공간의 아코디언을 열어 확인하세요.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 확인 모달 */}
          <ConfirmModal
            isOpen={showConfirmModal}
            title="기본 공정 적용 확인"
            message="기존 선택값이 있다면 모두 초기화되고 기본값으로 변경됩니다. 계속하시겠습니까?"
            confirmText="적용하기"
            cancelText="취소"
            onConfirm={handleConfirmApply}
            onCancel={() => setShowConfirmModal(false)}
          />

          {/* 공간별 아코디언 */}
          <div className="space-y-4">
            {activeSpaces.map((space) => {
              const spaceId = space.id as SpaceId
              const spaceInfo = SPACES.find(s => s.id === space.id)
              
              // 공간별 선택값 가져오기 (없으면 빈 객체)
              const spaceSelections = selectedProcessesBySpace[spaceId] || {
                wall_finish: null,
                floor_finish: null,
                door_finish: null,
                electric_lighting: null,
                options: null,
                kitchen_core: null,
                kitchen_countertop: null,
                bathroom_core: null,
                entrance_core: null,
                balcony_core: null,
              }

              // 공간별로 적용 가능한 공정 필터링 (selections 전달하여 조건부 표시 지원)
              console.log(`🏠 Processing space: ${space.name} (${spaceId})`)
              const processGroups = getProcessGroupsForSpace(spaceId, spaceSelections)
              console.log(`  ✅ Found ${processGroups.length} applicable processes:`, processGroups.map(g => g.name))

              return (
                <SpaceAccordion
                  key={spaceId}
                  spaceId={spaceId}
                  spaceName={space.name}
                  spaceIcon={spaceInfo?.icon || '🏠'}
                  processGroups={processGroups}
                  selections={spaceSelections}
                  onSelectionChange={(category, value) => {
                    console.log(`📝 Selection changed: ${spaceId}.${category} =`, value)
                    setSpaceProcessSelection(spaceId, category, value)
                  }}
                  defaultOpen={activeSpaces.indexOf(space) === 0} // 첫 번째 공간만 기본 확장
                />
              )
            })}
          </div>
        </div>

        {/* 하단 네비게이션 바 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">선택된 공간</p>
                <p className="text-lg font-bold text-gray-900">
                  {activeSpaces.length}개 공간
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">선택된 공정</p>
                <p className="text-lg font-bold text-argen-500">
                  {getTotalSelectedCount()}개
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="w-full px-6 py-4 bg-argen-500 text-white rounded-xl hover:bg-argen-600 transition-all font-bold shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#8B5CF6' }}
            >
              다음 단계 - 세부 옵션 →
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
