/**
 * V4 TraitScorer - 성향 점수 계산기
 * 
 * V3 TraitEngine을 래핑하여 V4 포맷으로 변환
 */

import { TraitEngine } from '@/lib/analysis/engine-v3/engines/TraitEngine'
import type { UserAnswerV4, SpaceInfoV4, TraitScoreV4 } from '../../types'
import { toV3TraitEngineInput } from '../../converters/input-converter'
import { toV4TraitScores } from '../../converters/output-converter'
import { logger } from '../../utils/logger'
import { V3EngineError } from '../../errors'

/**
 * V3 TraitEngine을 래핑하여 V4 포맷으로 변환
 */
export async function calculateTraitScores(
  answers: UserAnswerV4[],
  spaceInfo: SpaceInfoV4
): Promise<TraitScoreV4[]> {
  try {
    logger.debug('TraitScorer', '점수 계산 시작', {
      answersCount: answers.length,
      pyeong: spaceInfo.pyeong,
    })

    // 1. V4 입력 → V3 입력 변환
    const v3Input = toV3TraitEngineInput({
      answers,
      spaceInfo,
      preferences: {
        budget: { min: 0, max: 0, flexibility: 'uncertain' },
        family: {
          totalPeople: 0,
          hasInfant: false,
          hasChild: false,
          hasElderly: false,
          hasPet: false,
        },
        lifestyle: {
          remoteWork: false,
          cookOften: false,
          guestsOften: false,
        },
        purpose: 'live',
      },
      selectedSpaces: [],
      selectedProcesses: {},
      timestamp: new Date().toISOString(),
    })

    // 2. V3 TraitEngine 호출
    const traitEngine = new TraitEngine()
    const v3Result = await logger.measure(
      'TraitScorer',
      'V3 TraitEngine 호출',
      () => traitEngine.analyze(v3Input)
    )

    // 3. V3 결과 → V4 포맷 변환
    const v4Scores = toV4TraitScores(v3Result)

    logger.debug('TraitScorer', '점수 계산 완료', {
      scoresCount: v4Scores.length,
    })

    return v4Scores
  } catch (error) {
    logger.error('TraitScorer', '점수 계산 실패', error)
    
    // V3 엔진 실패 시 기본 점수 반환
    if (error instanceof Error) {
      throw new V3EngineError('TraitEngine', error)
    }
    
    // 기본 점수 반환 (fallback)
    return getDefaultTraitScores()
  }
}

/**
 * 기본 점수 (Fallback)
 */
function getDefaultTraitScores(): TraitScoreV4[] {
  const defaultTraits = [
    'storage_importance',
    'flow_importance',
    'light_importance',
    'noise_sensitivity',
    'cleaning_preference',
    'style_preference',
    'color_preference',
    'family_impact',
    'pet_friendly',
    'budget_flexibility',
    'complexity_tolerance',
    'value_protection',
  ]

  return defaultTraits.map(code => ({
    traitCode: code,
    score: 5, // 중간값
    confidence: 0.3, // 낮은 신뢰도
  }))
}








