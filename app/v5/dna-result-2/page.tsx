'use client'

/**
 * V5 2차 DNA 결과 페이지
 * 
 * 입력: v5DnaResult2
 * 출력: 보정된 6대 트레이트 점수, 1차 대비 변화 요약
 * 
 * @see Phase 1 작업 3️⃣
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import type { FusionAnalysisResult } from '@/lib/analysis/v5-ultimate/types'
import { type ProcessId, getProcessLabel } from '@/lib/data/process-options'

/**
 * 저장 데이터 타입
 */
type StoredData<T> = {
  schemaVersion: '5.0'
  createdAt: string
  data: T
}

/**
 * 6축 트레이트 점수 타입
 */
type Trait6Axis = {
  TR_VIS: number
  TR_TONE: number
  TR_STORE: number
  TR_MAINT: number
  TR_LIFE: number
  TR_HOST: number
}

/**
 * 2차 분석 결과 타입
 */
type Round2AnalysisResult = {
  round1Result: FusionAnalysisResult
  selectedProcesses: ProcessId[]
  answers: Record<string, string>
  adjustedTraitScores: Trait6Axis
}

/**
 * 트레이트 라벨
 */
const TRAIT_LABELS: Record<keyof Trait6Axis, string> = {
  TR_VIS: '시각 자극 성향',
  TR_TONE: '온도감/색감 성향',
  TR_STORE: '수납 성향',
  TR_MAINT: '유지관리 성향',
  TR_LIFE: '생활 방식',
  TR_HOST: '손님/모임 성향',
}

/**
 * 트레이트 설명
 */
const TRAIT_DESCRIPTIONS: Record<keyof Trait6Axis, { negative: string; positive: string }> = {
  TR_VIS: { negative: '미니멀·깔끔', positive: '볼드·포인트' },
  TR_TONE: { negative: '웜톤·따뜻함', positive: '쿨톤·차가움' },
  TR_STORE: { negative: '숨김·빌트인', positive: '오픈·미니멀' },
  TR_MAINT: { negative: '관리 최소', positive: '관리 감수' },
  TR_LIFE: { negative: '집순이', positive: '바깥활동형' },
  TR_HOST: { negative: '프라이빗', positive: '호스팅' },
}

/**
 * 1차 TraitScores를 6축 트레이트로 변환 (임시 매핑)
 */
function convertTo6Axis(traitScores: any): Trait6Axis {
  return {
    TR_VIS: Math.round(((traitScores?.visualSensitivity || 50) - 50) / 10),
    TR_TONE: Math.round(((traitScores?.styleCommitment || 50) - 50) / 10),
    TR_STORE: Math.round((50 - (traitScores?.spaceEfficiency || 50)) / 10),
    TR_MAINT: Math.round((50 - (traitScores?.cleaningSensitivity || 50)) / 10),
    TR_LIFE: Math.round((50 - (traitScores?.flowImportance || 50)) / 10),
    TR_HOST: Math.round(((traitScores?.familyInfluence || 50) - 50) / 10),
  }
}

/**
 * localStorage 복원 파서
 */
function readStored(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function DnaResult2PageContent() {
  const router = useRouter()
  const [round2Result, setRound2Result] = useState<Round2AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // v5DnaResult2 복원
    const stored = readStored(localStorage.getItem('v5DnaResult2'))
    let result: Round2AnalysisResult | null = null

    if (stored && typeof stored === 'object') {
      // v5 포맷 체크
      if ('schemaVersion' in stored && stored.schemaVersion === '5.0' && 'data' in stored) {
        result = (stored as any).data as Round2AnalysisResult
      } else {
        // 구버전: 직접 저장된 경우
        result = stored as Round2AnalysisResult
      }
    }

    if (!result) {
      // 결과가 없으면 2차 분석 페이지로 리다이렉트
      router.push('/v5/analysis-phase2')
      return
    }

    setRound2Result(result)
    setIsLoading(false)
  }, [router])

  const handleNext = () => {
    // 공정 상세 페이지로 이동
    if (round2Result) {
      const params = new URLSearchParams()
      params.set('processes', round2Result.selectedProcesses.join(','))
      router.push(`/v5/process-detail?${params.toString()}`)
    } else {
      router.push('/v5/process-select')
    }
  }

  const handleBack = () => {
    router.push('/v5/analysis-phase2')
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

  if (!round2Result) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6B6B6B] mb-4">2차 분석 결과를 찾을 수 없습니다.</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-[#B8956B] text-white rounded-lg"
          >
            이전으로
          </button>
        </div>
      </main>
    )
  }

  // 1차 트레이트 점수 (6축 변환)
  const round1Scores = convertTo6Axis(round2Result.round1Result.traitScores)
  const round2Scores = round2Result.adjustedTraitScores

  // 변화 요약 생성
  const changes: string[] = []
  for (const [key, label] of Object.entries(TRAIT_LABELS)) {
    const traitKey = key as keyof Trait6Axis
    const diff = round2Scores[traitKey] - round1Scores[traitKey]
    if (Math.abs(diff) >= 1) {
      if (diff > 0) {
        changes.push(`${label}이(가) 강화되었습니다 (+${diff})`)
      } else {
        changes.push(`${label}이(가) 약화되었습니다 (${diff})`)
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1F1F1F] mb-4">
            2차 DNA 분석 결과
          </h1>
          <p className="text-lg text-[#6B6B6B]">
            선택하신 공정에 맞춰 성향이 보정되었습니다
          </p>
        </div>

        {/* 선택된 공정 표시 */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-6 mb-8">
          <h3 className="text-lg font-bold text-[#1F1F1F] mb-4">선택된 공정</h3>
          <div className="flex flex-wrap gap-2">
            {round2Result.selectedProcesses.map((id) => (
              <span
                key={id}
                className="px-3 py-1 bg-[#F7F3ED] text-[#1F1F1F] rounded-full text-sm font-medium"
              >
                {getProcessLabel(id)}
              </span>
            ))}
          </div>
        </div>

        {/* 변화 요약 */}
        {changes.length > 0 && (
          <div className="bg-[#F7F3ED] rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-[#1F1F1F] mb-4">1차 대비 변화</h3>
            <ul className="space-y-2">
              {changes.map((change, index) => (
                <li key={index} className="text-[#1F1F1F]">
                  • {change}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 6대 트레이트 점수 표시 */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-6 mb-8">
          <h3 className="text-xl font-bold text-[#1F1F1F] mb-6">최종 트레이트 점수</h3>
          <div className="space-y-4">
            {Object.entries(TRAIT_LABELS).map(([key, label]) => {
              const traitKey = key as keyof Trait6Axis
              const score = round2Scores[traitKey]
              const diff = score - round1Scores[traitKey]
              const description = score < 0 
                ? TRAIT_DESCRIPTIONS[traitKey].negative
                : TRAIT_DESCRIPTIONS[traitKey].positive

              return (
                <div key={key} className="border-b border-[#E8E4DC] pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-[#1F1F1F]">{label}</h4>
                      <p className="text-sm text-[#6B6B6B]">{description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#B8956B]">
                        {score > 0 ? '+' : ''}{score}
                      </div>
                      {Math.abs(diff) >= 1 && (
                        <div className={`text-sm ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff > 0 ? '↑' : '↓'} {Math.abs(diff)}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 점수 바 */}
                  <div className="w-full bg-[#E8E4DC] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        score < 0 ? 'bg-blue-500' : score > 0 ? 'bg-[#B8956B]' : 'bg-gray-400'
                      }`}
                      style={{
                        width: `${Math.abs(score) * 10}%`,
                        marginLeft: score < 0 ? `${50 + score * 10}%` : '50%',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

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
            공정 상세로 이동 →
          </button>
        </div>
      </div>
    </main>
  )
}

export default function DnaResult2Page() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8956B] mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">로딩 중...</p>
        </div>
      </main>
    }>
      <DnaResult2PageContent />
    </Suspense>
  )
}


