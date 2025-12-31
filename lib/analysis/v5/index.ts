/**
 * V5 성향분석 엔진 메인 모듈
 * 
 * 전체 플로우 통합
 */

import type { SpaceInfo } from '@/lib/store/spaceInfoStore'
import type { HypothesisResult, PersonalityTags } from './types'
import { generateHypothesis } from './hypothesis-generator'
import { selectTopQuestions } from './question-selector'
import { convertSpaceInfoToBasicInput } from './input-converter'
import { QUESTION_BANK } from '@/lib/data/v5-question-bank'
import { confirmPersonalityTags } from './tag-confirmer'
import { applyTagsToProcesses } from './tag-process-mapper'
import { getArgenRecommendation } from './argen-recommender'
import { generateRiskMessages } from './risk-message-generator'
import { validateAnalysis } from './validator'
import { detectChoiceParalysis, getParalysisStrategy } from './choice-paralysis'
import { explainV5Result } from './explain'
import type { ExplainResult } from './explain'
import { determineDNAType } from './dna/dna-determiner'
import { buildDNAExplainBridge } from './dna/dna-explain-bridge'
import type { DNAWithExplain } from './dna/dna-explain-bridge'
import { buildEstimateOptimization } from './estimate'
import type { EstimateOptimization } from './estimate'

/**
 * V5 질문 생성 결과
 */
export interface V5QuestionResult {
  questions: Array<{
    id: string
    text: string
    type: 'HARD' | 'SEMI' | 'SOFT'
    category: string
    options: string[]
  }>
  hypothesis: HypothesisResult
  reason: string
}

/**
 * V5 전체 분석 결과
 */
export interface V5AnalysisResult {
  questions: V5QuestionResult['questions']
  hypothesis: HypothesisResult
  tags: PersonalityTags
  processChanges: ReturnType<typeof applyTagsToProcesses>
  argenRecommendation: ReturnType<typeof getArgenRecommendation>
  riskMessages: string[]
  validation: ReturnType<typeof validateAnalysis>
  choiceParalysis: ReturnType<typeof detectChoiceParalysis>
  paralysisStrategy: ReturnType<typeof getParalysisStrategy>
  explain: ExplainResult
  dna: DNAWithExplain
  estimateOptimization: EstimateOptimization
}

/**
 * V5 질문 생성 메인 함수
 * 
 * @param spaceInfo 공간 정보
 * @returns 질문 배열 및 가설 결과
 */
export function generateV5Questions(spaceInfo: SpaceInfo): V5QuestionResult {
  // 1. SpaceInfo → BasicInfoInput 변환
  const basicInput = convertSpaceInfoToBasicInput(spaceInfo)

  // 2. 가설 생성
  const hypothesis = generateHypothesis(basicInput)

  // 3. 질문 선별
  const selectedQuestionIds = selectTopQuestions(hypothesis, 6)

  // 4. 질문 메타데이터 변환
  const questions = selectedQuestionIds.map((id) => {
    const meta = QUESTION_BANK[id]
    return {
      id: meta.id,
      text: meta.text,
      type: meta.type,
      category: meta.category,
      options: meta.options,
    }
  })

  // 5. 이유 생성
  const reason = `가설 기반으로 ${selectedQuestionIds.length}개 질문을 선별했습니다. (HARD: ${questions.filter((q) => q.type === 'HARD').length}개, SEMI: ${questions.filter((q) => q.type === 'SEMI').length}개, SOFT: ${questions.filter((q) => q.type === 'SOFT').length}개)`

  return {
    questions,
    hypothesis,
    reason,
  }
}

/**
 * V5 전체 분석 함수
 * 
 * @param spaceInfo 공간 정보
 * @param answers 질문 답변
 * @returns 전체 분석 결과
 */
export function analyzeV5Complete(
  spaceInfo: SpaceInfo,
  answers: Record<string, string>
): V5AnalysisResult {
  // 1. 기본 정보 변환
  const basicInput = convertSpaceInfoToBasicInput(spaceInfo)

  // 2. 가설 생성
  const hypothesis = generateHypothesis(basicInput)

  // 3. 질문 선별
  const selectedQuestionIds = selectTopQuestions(hypothesis, 6)

  // 4. 질문 메타데이터 변환
  const questions = selectedQuestionIds.map((id) => {
    const meta = QUESTION_BANK[id]
    return {
      id: meta.id,
      text: meta.text,
      type: meta.type,
      category: meta.category,
      options: meta.options,
    }
  })

  // 5. 성향 태그 확정
  const tags = confirmPersonalityTags(answers, basicInput)

  // 6. 태그 → 공정/옵션 매핑
  const processChanges = applyTagsToProcesses(tags.tags, basicInput)

  // 7. 아르젠 추천
  const argenRecommendation = getArgenRecommendation(tags.tags, basicInput)

  // 8. 리스크 문구 생성
  const riskMessages = generateRiskMessages(tags.tags, basicInput, answers)

  // 9. 검증
  const validation = validateAnalysis(
    selectedQuestionIds,
    tags.tags,
    processChanges,
    riskMessages
  )

  // 10. 선택 장애 탐지
  const choiceParalysis = detectChoiceParalysis(answers)
  const paralysisStrategy = getParalysisStrategy(choiceParalysis)

  // 11. Explain Layer 생성
  // ⚠️ Phase 4-1: 이미 확정된 결과를 문장으로 "번역"만 수행
  const explain = explainV5Result({
    tags,
    processChanges,
    basicInfo: basicInput,
  })

  // 12. DNA 유형 결정
  // ⚠️ Phase 4-2: 태그 기반으로 DNA 유형 결정
  const dnaType = determineDNAType(tags)

  // 13. DNA Explain Bridge 생성
  // ⚠️ Phase 4-2: Explain 결과를 DNA와 연결
  const dnaExplain = buildDNAExplainBridge(dnaType, explain)
  const dna: DNAWithExplain = {
    ...dnaType,
    explain: dnaExplain,
  }

  // 14. 견적 최적화 정책 생성
  // ⚠️ Phase 5-1: 태그 → 정책 매핑만 수행
  const estimateOptimization = buildEstimateOptimization(tags.tags)

  return {
    questions,
    hypothesis,
    tags,
    processChanges,
    argenRecommendation,
    riskMessages,
    validation,
    choiceParalysis,
    paralysisStrategy,
    explain,
    dna,
    estimateOptimization,
  }
}

/**
 * V5 엔진 사용 가능 여부 확인
 */
export function isV5EngineAvailable(spaceInfo: SpaceInfo): boolean {
  // 최소 필수 정보 확인
  return (
    spaceInfo.pyeong > 0 &&
    spaceInfo.housingType !== undefined
    // buildingYear는 input-converter에서 처리
  )
}




