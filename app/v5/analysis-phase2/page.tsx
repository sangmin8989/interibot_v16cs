'use client'

/**
 * V5 2차 성향분석 UI
 * 
 * 입력: 선택된 공정 목록, 1차 분석 결과
 * 출력: 2차 질문 응답, 보정된 traitScores
 * 
 * @see Phase 1 작업 2️⃣
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getRound2Questions, type Round2Question } from '@/lib/data/round2-question-bank'
import { normalizeProcessIds, type ProcessId } from '@/lib/data/process-options'
import type { FusionAnalysisResult } from '@/lib/analysis/v5-ultimate/types'

/**
 * 저장 데이터 타입 (schemaVersion 포함)
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
  TR_VIS: number  // 시각 자극 성향 (-5 ~ +5)
  TR_TONE: number // 온도감/색감 성향 (-5 ~ +5)
  TR_STORE: number // 수납 성향 (-5 ~ +5)
  TR_MAINT: number // 유지관리 성향 (-5 ~ +5)
  TR_LIFE: number  // 생활 방식 (-5 ~ +5)
  TR_HOST: number  // 손님/모임 성향 (-5 ~ +5)
}

/**
 * 2차 분석 결과 타입
 */
type Round2AnalysisResult = {
  round1Result: FusionAnalysisResult
  selectedProcesses: ProcessId[]
  answers: Record<string, string> // questionId -> option label
  adjustedTraitScores: Trait6Axis
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
 * 1차 TraitScores를 6축 트레이트로 변환 (임시 매핑)
 * TODO: 정확한 매핑 로직은 Phase 2에서 구현
 */
function convertTo6Axis(traitScores: any): Trait6Axis {
  // 임시 변환 로직 (Phase 1에서는 흐름 완결 우선)
  // Phase 2에서 정확한 매핑 구현 필요
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
 * traitDelta를 6축 트레이트에 누적
 */
function applyTraitDelta(
  current: Trait6Axis,
  delta: Partial<Record<string, number>>
): Trait6Axis {
  const adjusted = { ...current }
  for (const [key, value] of Object.entries(delta)) {
    if (key in adjusted && typeof value === 'number') {
      adjusted[key as keyof Trait6Axis] = Math.max(
        -5,
        Math.min(5, adjusted[key as keyof Trait6Axis] + value)
      )
    }
  }
  return adjusted
}

function AnalysisPhase2PageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedProcesses, setSelectedProcesses] = useState<ProcessId[]>([])
  const [round1Result, setRound1Result] = useState<FusionAnalysisResult | null>(null)
  const [questions, setQuestions] = useState<Round2Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 1. 선택된 공정 복원
    const processesParam = searchParams.get('processes')
    const processes = normalizeProcessIds(processesParam ?? '')
    
    if (processes.length === 0) {
      // 공정이 없으면 공정 선택 페이지로 리다이렉트
      router.push('/v5/process-select')
      return
    }
    
    setSelectedProcesses(processes)

    // 2. 1차 분석 결과 복원
    const stored = readStored(localStorage.getItem('v5DnaResult1'))
    let dnaResult1: FusionAnalysisResult | null = null
    
    if (stored && typeof stored === 'object') {
      // v5 포맷 체크
      if ('schemaVersion' in stored && stored.schemaVersion === '5.0' && 'data' in stored) {
        dnaResult1 = (stored as any).data as FusionAnalysisResult
      } else {
        // 구버전: 직접 저장된 경우
        dnaResult1 = stored as FusionAnalysisResult
      }
    }

    if (!dnaResult1) {
      // 1차 결과가 없으면 V5 메인으로 리다이렉트
      router.push('/v5')
      return
    }

    setRound1Result(dnaResult1)

    // 3. 2차 질문 선택 (최대 6개 제한)
    const allQuestions = getRound2Questions(processes)
    const limitedQuestions = allQuestions.slice(0, 6)
    setQuestions(limitedQuestions)

    // 4. 기존 답변 복원 (있으면)
    const stored2 = readStored(localStorage.getItem('v5DnaResult2'))
    if (stored2 && typeof stored2 === 'object') {
      if ('schemaVersion' in stored2 && stored2.schemaVersion === '5.0' && 'data' in stored2) {
        const data = (stored2 as any).data as Round2AnalysisResult
        if (data.answers) {
          setAnswers(data.answers)
        }
      }
    }

    setIsLoading(false)
  }, [router, searchParams])

  const handleAnswer = (questionId: string, optionLabel: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionLabel,
    }))
  }

  const handleNext = () => {
    if (!round1Result) {
      alert('1차 분석 결과를 찾을 수 없습니다.')
      return
    }

    // 모든 질문에 답변했는지 확인
    const unanswered = questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      alert(`모든 질문에 답변해주세요. (${unanswered.length}개 남음)`)
      return
    }

    // 1차 traitScores를 6축으로 변환
    const initial6Axis = convertTo6Axis(round1Result.traitScores)

    // traitDelta 누적
    let adjusted6Axis = { ...initial6Axis }
    for (const question of questions) {
      const answerLabel = answers[question.id]
      if (answerLabel) {
        const selectedOption = question.options.find(opt => opt.label === answerLabel)
        if (selectedOption?.traitDelta) {
          adjusted6Axis = applyTraitDelta(adjusted6Axis, selectedOption.traitDelta)
        }
      }
    }

    // 2차 분석 결과 생성
    const round2Result: Round2AnalysisResult = {
      round1Result,
      selectedProcesses,
      answers,
      adjustedTraitScores: adjusted6Axis,
    }

    // v5 포맷으로 저장
    const toStore: StoredData<Round2AnalysisResult> = {
      schemaVersion: '5.0',
      createdAt: new Date().toISOString(),
      data: round2Result,
    }
    localStorage.setItem('v5DnaResult2', JSON.stringify(toStore))

    // 2차 DNA 결과 페이지로 이동
    router.push('/v5/dna-result-2')
  }

  const handleBack = () => {
    router.push('/v5/process-select')
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

  if (!round1Result || questions.length === 0) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6B6B6B] mb-4">필요한 데이터를 찾을 수 없습니다.</p>
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

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1F1F1F] mb-4">
            2차 성향분석
          </h1>
          <p className="text-lg text-[#6B6B6B]">
            선택하신 공정에 맞는 구체적인 질문입니다 ({questions.length}개)
          </p>
        </div>

        {/* 진행 표시 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-[#6B6B6B] mb-2">
            <span>진행률</span>
            <span>{Object.keys(answers).length} / {questions.length}</span>
          </div>
          <div className="w-full bg-[#E8E4DC] rounded-full h-2">
            <div
              className="bg-[#B8956B] h-2 rounded-full transition-all"
              style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 질문 목록 */}
        <div className="space-y-6 mb-8">
          {questions.map((question, index) => {
            const selectedAnswer = answers[question.id]
            return (
              <div
                key={question.id}
                className="bg-white rounded-2xl shadow-lg border border-[#E8E4DC] p-6"
              >
                <div className="mb-4">
                  <span className="text-sm text-[#B8956B] font-medium">
                    질문 {index + 1} / {questions.length}
                  </span>
                  <h3 className="text-xl font-bold text-[#1F1F1F] mt-2">
                    {question.question}
                  </h3>
                </div>

                <div className="space-y-3">
                  {question.options.map((option) => {
                    const isSelected = selectedAnswer === option.label
                    return (
                      <button
                        key={option.label}
                        onClick={() => handleAnswer(question.id, option.label)}
                        className={`
                          w-full p-4 rounded-xl border-2 text-left transition-all
                          ${isSelected
                            ? 'border-[#B8956B] bg-[#F7F3ED] text-[#1F1F1F] font-semibold shadow-md'
                            : 'border-[#E8E4DC] hover:border-[#B8956B] text-[#6B6B6B] bg-white hover:bg-[#F7F3ED]'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {isSelected && (
                            <span className="text-[#B8956B]">✓</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
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
            disabled={Object.keys(answers).length < questions.length}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-[#1F1F1F] text-white hover:bg-[#333] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </main>
  )
}

export default function AnalysisPhase2Page() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8956B] mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">로딩 중...</p>
        </div>
      </main>
    }>
      <AnalysisPhase2PageContent />
    </Suspense>
  )
}

