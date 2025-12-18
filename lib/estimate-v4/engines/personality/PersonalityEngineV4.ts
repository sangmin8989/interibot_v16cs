/**
 * V4 PersonalityEngine - 성향 분석 엔진
 * 
 * TraitScorer, TypeClassifier, RiskAssessor를 통합
 */

import type { CollectedInputV4, PersonalityResultV4 } from '../../types'
import { calculateTraitScores } from './TraitScorer'
import { classifyTypes } from './TypeClassifier'
import { assessRisk } from './RiskAssessor'
import { logger } from '../../utils/logger'

/**
 * 성향 분석 메인 함수
 */
export async function analyzePersonality(
  input: CollectedInputV4
): Promise<PersonalityResultV4> {
  logger.info('PersonalityEngine', '성향 분석 시작', {
    pyeong: input.spaceInfo.pyeong,
    answersCount: input.answers.length,
  })

  // Step 1: 점수 계산 (먼저)
  const traitScores = await logger.measure(
    'PersonalityEngine',
    '점수 계산',
    () => calculateTraitScores(input.answers, input.spaceInfo)
  )

  // Step 2: 타입 분류 (점수 필요)
  const classifiedTypes = await logger.measure(
    'PersonalityEngine',
    '타입 분류',
    () => Promise.resolve(classifyTypes(traitScores, input.preferences))
  )

  // Step 3: 위험 평가 (점수 + 타입 모두 필요)
  const riskAssessment = await logger.measure(
    'PersonalityEngine',
    '위험 평가',
    () =>
      Promise.resolve(
        assessRisk(
          traitScores,
          classifiedTypes,
          input.preferences,
          input.spaceInfo
        )
      )
  )

  // Step 4: 문제 분류 (선택사항)
  const problemClassification = classifyProblem(classifiedTypes, input.preferences)

  logger.info('PersonalityEngine', '성향 분석 완료', {
    riskLevel: riskAssessment.level,
    typesCount:
      classifiedTypes.lifestyle.length +
      classifiedTypes.family.length +
      classifiedTypes.personality.length,
  })

  return {
    traitScores,
    classifiedTypes,
    riskAssessment,
    problemClassification,
    analyzedAt: new Date().toISOString(),
  }
}

/**
 * 문제 유형 분류 (간소화 버전)
 */
function classifyProblem(
  classifiedTypes: PersonalityResultV4['classifiedTypes'],
  preferences: CollectedInputV4['preferences']
): PersonalityResultV4['problemClassification'] {
  // 기본값: 공간형 불편이 더 큼
  return {
    locationScore: 0.3,
    spaceScore: 0.7,
    recommendation: 'remodel',
    message: '공간 구조 개선이 필요합니다.',
  }
}

