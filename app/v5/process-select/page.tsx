'use client'

/**
 * V5 공정 선택 페이지
 * 어떤 공사를 할지 선택하는 페이지
 * 
 * @see Phase 1 최종 보완 지시문 5.1
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import {
  PROCESS_OPTIONS,
  type ProcessId,
  normalizeProcessIds,
  getProcessLabel,
} from '@/lib/data/process-options'
import EstimatePreviewBar from '@/components/v5-ultimate/EstimatePreviewBar'

/**
 * 저장 데이터 타입 (schemaVersion 포함)
 */
type StoredData<T> = {
  schemaVersion: '5.0'
  createdAt: string
  data: T
}

/**
 * localStorage 복원 파서 (하위호환)
 */
function readStored<T>(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * 공정 선택 복원 함수 (하위호환)
 */
function restoreProcessSelections(rawStored: unknown): ProcessId[] {
  // v5 포맷
  if (
    rawStored &&
    typeof rawStored === 'object' &&
    'schemaVersion' in rawStored &&
    (rawStored as any).schemaVersion === '5.0'
  ) {
    return normalizeProcessIds((rawStored as any).data)
  }

  // 구버전(배열, "주방,욕실" 문자열, {data: ...} 등 전부 흡수)
  if (rawStored && typeof rawStored === 'object' && 'data' in rawStored) {
    return normalizeProcessIds((rawStored as any).data)
  }

  return normalizeProcessIds(rawStored)
}

function ProcessSelectPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { spaceInfo } = useSpaceInfoStore()
  
  const [selectedProcesses, setSelectedProcesses] = useState<ProcessId[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // V5 DNA 결과 확인
    const v5DnaResult = localStorage.getItem('v5DnaResult')
    if (!v5DnaResult) {
      // DNA 결과가 없으면 V5 메인으로 리다이렉트
      router.push('/v5')
      return
    }
    
    // localStorage에서 공정 선택 복원 (하위호환)
    const stored = readStored(localStorage.getItem('v5ProcessSelections'))
    const restored = restoreProcessSelections(stored)
    
    // URL 파라미터에서도 복원 (하위호환)
    const urlProcesses = searchParams.get('processes')
    const urlRestored = normalizeProcessIds(urlProcesses ?? '')
    
    // 복원된 공정이 있으면 사용, 없으면 기본값
    const initialProcesses = restored.length > 0 
      ? restored 
      : urlRestored.length > 0 
        ? urlRestored 
        : normalizeProcessIds(['KITCHEN', 'BATH', 'WALLPAPER']) // 기본 선택: 주방, 욕실, 도배
    
    setSelectedProcesses(initialProcesses)
    
    // 복원 후 v5 포맷으로 재저장 (자동 마이그레이션)
    if (restored.length > 0 || urlRestored.length > 0) {
      const toStore: StoredData<ProcessId[]> = {
        schemaVersion: '5.0',
        createdAt: new Date().toISOString(),
        data: initialProcesses,
      }
      localStorage.setItem('v5ProcessSelections', JSON.stringify(toStore))
    }
    
    setIsLoading(false)
  }, [router, searchParams])

  const toggleProcess = (processId: ProcessId) => {
    setSelectedProcesses(prev => {
      if (prev.includes(processId)) {
        return prev.filter(p => p !== processId)
      } else {
        // maxSelectable 체크
        const option = PROCESS_OPTIONS.find(p => p.id === processId)
        if (option && option.maxSelectable > 0) {
          const sameTypeCount = prev.filter(p => {
            const prevOption = PROCESS_OPTIONS.find(op => op.id === p)
            return prevOption?.id === processId
          }).length
          if (sameTypeCount >= option.maxSelectable) {
            return prev // 최대 선택 수 초과
          }
        }
        return [...prev, processId]
      }
    })
  }

  const handleNext = () => {
    if (selectedProcesses.length === 0) {
      alert('최소 1개 이상의 공정을 선택해주세요.')
      return
    }

    // 선택된 공정을 v5 포맷으로 저장
    const toStore: StoredData<ProcessId[]> = {
      schemaVersion: '5.0',
      createdAt: new Date().toISOString(),
      data: selectedProcesses,
    }
    localStorage.setItem('v5ProcessSelections', JSON.stringify(toStore))

    // 선택된 공정을 URL 파라미터로 전달 (영문 코드 사용)
    const params = new URLSearchParams()
    params.set('processes', selectedProcesses.join(','))
    
    // 공간 정보도 전달
    if (spaceInfo?.pyeong) {
      params.set('pyeong', spaceInfo.pyeong.toString())
    }
    if (spaceInfo?.housingType) {
      params.set('housingType', spaceInfo.housingType)
    }

    // Phase 1 플로우: process-select → analysis-phase2 → dna-result-2 → process-detail
    router.push(`/v5/analysis-phase2?${params.toString()}`)
  }

  const handleBack = () => {
    router.push('/v5')
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8956B] mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">로딩 중...</p>
        </div>
      </main>
    )
  }

  // order 기준으로 정렬
  const sortedProcesses = [...PROCESS_OPTIONS].sort((a, b) => a.order - b.order)

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1F1F1F] mb-4">
            어떤 공사를 진행하시나요?
          </h1>
          <p className="text-lg text-[#6B6B6B]">
            원하시는 공정을 선택해주세요 (복수 선택 가능)
          </p>
        </div>

        {/* 공정 선택 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {sortedProcesses.map((process) => {
            const isSelected = selectedProcesses.includes(process.id)
            return (
              <button
                key={process.id}
                onClick={() => toggleProcess(process.id)}
                className={`
                  p-6 rounded-2xl border-2 transition-all text-left
                  ${isSelected
                    ? 'border-[#B8956B] bg-[#F7F3ED] shadow-lg scale-105'
                    : 'border-[#E8E4DC] bg-white hover:border-[#B8956B] hover:shadow-md'
                  }
                `}
              >
                <div className="text-4xl mb-3">
                  {/* 아이콘은 label 기반으로 표시 (향후 확장 가능) */}
                  {process.id === 'KITCHEN' && '🍳'}
                  {process.id === 'BATH' && '🚿'}
                  {process.id === 'FLOOR' && '🪵'}
                  {process.id === 'TILE' && '🧱'}
                  {process.id === 'WALLPAPER' && '🎨'}
                  {process.id === 'FURNITURE' && '🗄️'}
                  {process.id === 'WINDOW' && '🪟'}
                  {process.id === 'DOOR' && '🚪'}
                  {process.id === 'PAINT' && '🖌️'}
                  {process.id === 'ELECTRIC' && '💡'}
                  {process.id === 'FILM' && '🪟'}
                  {process.id === 'DEMOLITION' && '🔨'}
                </div>
                <h3 className="text-lg font-bold text-[#1F1F1F] mb-2">
                  {process.label}
                </h3>
                <p className="text-sm text-[#6B6B6B] mb-3">
                  {/* 설명은 향후 SSOT에 추가 가능 */}
                  {process.id === 'KITCHEN' && '싱크대, 상판, 후드'}
                  {process.id === 'BATH' && '도기, 수전, 타일'}
                  {process.id === 'FLOOR' && '강마루, 원목마루, SPC'}
                  {process.id === 'TILE' && '타일 및 석재 공사'}
                  {process.id === 'WALLPAPER' && '도배 및 벽지 공사'}
                  {process.id === 'FURNITURE' && '붙박이장, 신발장, TV장'}
                  {process.id === 'WINDOW' && '단창, 이중창, 시스템창'}
                  {process.id === 'DOOR' && '2연동, 3연동, 자동'}
                  {process.id === 'PAINT' && '도장 및 마감 작업'}
                  {process.id === 'ELECTRIC' && '전기 및 통신 공사'}
                  {process.id === 'FILM' && '필름 및 시트 공사'}
                  {process.id === 'DEMOLITION' && '기존 시설물 철거 및 폐기물 처리'}
                </p>
                {isSelected && (
                  <div className="text-[#B8956B] text-sm font-medium">
                    ✓ 선택됨
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* 선택 요약 */}
        {selectedProcesses.length > 0 && (
          <div className="bg-[#F7F3ED] rounded-xl p-4 mb-8">
            <p className="text-sm text-[#1F1F1F]">
              <span className="font-semibold">선택된 공정:</span>{' '}
              {selectedProcesses.map(id => getProcessLabel(id)).join(', ')}
            </p>
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
            disabled={selectedProcesses.length === 0}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-[#1F1F1F] text-white hover:bg-[#333] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 단계 →
          </button>
        </div>
      </div>

      {/* 실시간 견적 미리보기 바 (참고용) */}
      <EstimatePreviewBar
        pyeong={spaceInfo?.pyeong ?? null}
        processCount={selectedProcesses.length}
      />
    </main>
  )
}

export default function ProcessSelectPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8956B] mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">로딩 중...</p>
        </div>
      </main>
    }>
      <ProcessSelectPageContent />
    </Suspense>
  )
}

