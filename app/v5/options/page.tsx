'use client'

/**
 * V5 옵션 선택 페이지
 * 등급 및 추가 옵션 선택 페이지
 */

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import type { ArgenGrade } from '@/lib/data/gradeSpecs'
import { GRADE_INFO, TOTAL_ESTIMATE_32PY, scaleEstimateByPyeong } from '@/lib/data/gradeSpecs'
import { normalizeProcessIds, getProcessLabel } from '@/lib/data/process-options'

/**
 * 저장 데이터 타입 (schemaVersion 포함)
 */
type StoredData<T> = {
  schemaVersion: '5.0'
  createdAt: string
  data: T
}

const GRADES: ArgenGrade[] = ['ESSENTIAL', 'STANDARD', 'OPUS']

function OptionsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { spaceInfo } = useSpaceInfoStore()
  
  const pyeong = spaceInfo?.pyeong || parseInt(searchParams.get('pyeong') || '30')
  
  const [selectedGrade, setSelectedGrade] = useState<ArgenGrade | null>(null)
  const [expandedGrade, setExpandedGrade] = useState<ArgenGrade | null>(null)

  const handleNext = () => {
    if (!selectedGrade) {
      alert('등급을 선택해주세요.')
      return
    }

    // 모든 선택 정보를 URL 파라미터로 전달
    const params = new URLSearchParams(searchParams.toString())
    params.set('grade', selectedGrade)
    
    // localStorage에 저장 (v5 포맷)
    const v5DnaResult = localStorage.getItem('v5DnaResult')
    if (v5DnaResult) {
      try {
        const dnaResult = JSON.parse(v5DnaResult)
        const processesParam = searchParams.get('processes')
        const processes = normalizeProcessIds(processesParam ?? '')
        
        const estimateOptions: StoredData<{
          grade: ArgenGrade
          processes: string[]
          kitchenLayout: string | null
          bathroomStyle: string | null
          woodworkFurniture: string | null
          dnaResult: any
        }> = {
          schemaVersion: '5.0',
          createdAt: new Date().toISOString(),
          data: {
            grade: selectedGrade,
            processes,
            kitchenLayout: searchParams.get('kitchenLayout'),
            bathroomStyle: searchParams.get('bathroomStyle'),
            woodworkFurniture: searchParams.get('woodworkFurniture'),
            dnaResult,
          },
        }
        localStorage.setItem('v5EstimateOptions', JSON.stringify(estimateOptions))
      } catch (error) {
        console.error('옵션 저장 실패:', error)
      }
    }

    // 견적 페이지로 이동
    router.push(`/onboarding/estimate?${params.toString()}`)
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1F1F1F] mb-4">
            등급 및 옵션을 선택해주세요
          </h1>
          <p className="text-lg text-[#6B6B6B]">
            원하시는 등급을 선택하면 더 정확한 견적을 받으실 수 있습니다
          </p>
        </div>

        {/* 등급 선택 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {GRADES.map((grade) => {
            const gradeInfo = GRADE_INFO[grade]
            const estimate32py = TOTAL_ESTIMATE_32PY[grade]
            const estimate = scaleEstimateByPyeong(estimate32py, pyeong)
            const isSelected = selectedGrade === grade
            const isExpanded = expandedGrade === grade

            return (
              <div
                key={grade}
                className={`
                  relative border-2 rounded-2xl p-6 cursor-pointer transition-all
                  ${isSelected ? 'border-[#B8956B] bg-[#F7F3ED] shadow-lg scale-105' : 'border-[#E8E4DC] bg-white hover:border-[#B8956B] hover:shadow-md'}
                `}
                onClick={() => setSelectedGrade(grade)}
              >
                {/* 등급 헤더 */}
                <div className="mb-4">
                  <div className="text-sm text-[#6B6B6B] mb-1">{gradeInfo.nameEn}</div>
                  <h3 className="text-2xl font-bold text-[#1F1F1F]">{gradeInfo.name}</h3>
                  <p className="text-sm text-[#6B6B6B] mt-2">{gradeInfo.concept}</p>
                </div>

                {/* 가격 정보 */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-[#1F1F1F] mb-1">
                    {estimate.totalCost.toLocaleString()}만원
                  </div>
                  <div className="text-sm text-[#6B6B6B]">
                    평당 {Math.round(estimate.totalCost / pyeong).toLocaleString()}만원
                  </div>
                </div>

                {/* 타겟 고객 */}
                <div className="text-sm text-[#6B6B6B] mb-4">
                  {gradeInfo.targetCustomer}
                </div>

                {/* 주요 특징 */}
                <div className="space-y-1 text-sm text-[#1F1F1F] mb-4">
                  {grade === 'ESSENTIAL' && (
                    <>
                      <div>• 필수 공정만 확실하게</div>
                      <div>• 샤시/중문 기존 활용</div>
                      <div>• 실속 있는 구성</div>
                    </>
                  )}
                  {grade === 'STANDARD' && (
                    <>
                      <div>• 엔지니어드스톤 상판</div>
                      <div>• 이중샤시 추가</div>
                      <div>• 브랜드 가구</div>
                    </>
                  )}
                  {grade === 'OPUS' && (
                    <>
                      <div>• 세라믹/천연대리석</div>
                      <div>• 시스템창호</div>
                      <div>• 커스텀 가구</div>
                    </>
                  )}
                </div>

                {/* 선택 버튼 */}
                <button
                  className={`
                    w-full py-3 rounded-xl text-sm font-medium transition-colors
                    ${isSelected
                      ? 'bg-[#B8956B] text-white'
                      : 'bg-[#E8E4DC] text-[#1F1F1F] hover:bg-[#D4C4B0]'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedGrade(grade)
                  }}
                >
                  {isSelected ? '✓ 선택됨' : '선택하기'}
                </button>

                {/* 상세 보기 토글 */}
                <button
                  className="w-full mt-2 text-xs text-[#6B6B6B] hover:text-[#1F1F1F]"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedGrade(isExpanded ? null : grade)
                  }}
                >
                  {isExpanded ? '▲ 상세 접기' : '▼ 상세 보기'}
                </button>
              </div>
            )
          })}
        </div>

        {/* 상세 정보 (확장) */}
        {expandedGrade && (
          <GradeDetailCard grade={expandedGrade} pyeong={pyeong} />
        )}

        {/* 선택 요약 */}
        {selectedGrade && (
          <div className="bg-[#F7F3ED] rounded-xl p-6 mb-8">
            <h3 className="font-bold text-lg text-[#1F1F1F] mb-3">선택 요약</h3>
            <div className="space-y-2 text-sm text-[#1F1F1F]">
              <div>
                <span className="font-semibold">등급:</span> {GRADE_INFO[selectedGrade].name}
              </div>
              <div>
                <span className="font-semibold">예상 견적:</span>{' '}
                {scaleEstimateByPyeong(TOTAL_ESTIMATE_32PY[selectedGrade], pyeong).totalCost.toLocaleString()}만원
              </div>
              {searchParams.get('processes') && (() => {
                const processesParam = searchParams.get('processes')
                const processes = normalizeProcessIds(processesParam ?? '')
                return processes.length > 0 ? (
                  <div>
                    <span className="font-semibold">선택된 공정:</span>{' '}
                    {processes.map(id => getProcessLabel(id)).join(', ')}
                  </div>
                ) : null
              })()}
            </div>
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
            disabled={!selectedGrade}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-[#1F1F1F] text-white hover:bg-[#333] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            견적 확인하기 →
          </button>
        </div>
      </div>
    </main>
  )
}

/**
 * 등급 상세 정보 카드
 */
function GradeDetailCard({ grade, pyeong }: { grade: ArgenGrade; pyeong: number }) {
  const gradeInfo = GRADE_INFO[grade]
  const estimate32py = TOTAL_ESTIMATE_32PY[grade]
  const estimate = scaleEstimateByPyeong(estimate32py, pyeong)

  return (
    <div className="mt-4 bg-white border-2 border-[#E8E4DC] rounded-2xl p-6 mb-8">
      <h4 className="font-bold text-xl mb-4 text-[#1F1F1F]">{gradeInfo.name} 상세 정보</h4>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <div className="text-xs text-[#6B6B6B] mb-1">직접공사비</div>
          <div className="text-lg font-semibold text-[#1F1F1F]">{estimate.directCost.toLocaleString()}만원</div>
        </div>
        <div>
          <div className="text-xs text-[#6B6B6B] mb-1">간접비 (8%)</div>
          <div className="text-lg font-semibold text-[#1F1F1F]">{estimate.indirectCost.toLocaleString()}만원</div>
        </div>
        <div>
          <div className="text-xs text-[#6B6B6B] mb-1">총 공사비</div>
          <div className="text-lg font-semibold text-[#B8956B]">
            {estimate.totalCost.toLocaleString()}만원
          </div>
        </div>
        <div>
          <div className="text-xs text-[#6B6B6B] mb-1">평당 비용</div>
          <div className="text-lg font-semibold text-[#1F1F1F]">
            {Math.round(estimate.totalCost / pyeong).toLocaleString()}만원/평
          </div>
        </div>
      </div>

      {/* 공정별 상세 */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">철거</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.demolition.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">주방</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.kitchen.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">욕실 (2개소)</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.bathroom.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">바닥재</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.flooring.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">도배</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.wallpaper.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">샤시/창호</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.window.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">중문</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.slidingDoor.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">도어</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.door.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">전기/조명</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.electrical.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">도장</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.painting.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">필름</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.film.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">가구</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.furniture.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6B6B6B]">기타</span>
          <span className="font-medium text-[#1F1F1F]">{estimate.other.toLocaleString()}만원</span>
        </div>
      </div>
    </div>
  )
}

export default function OptionsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8956B] mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">로딩 중...</p>
        </div>
      </main>
    }>
      <OptionsPageContent />
    </Suspense>
  )
}




