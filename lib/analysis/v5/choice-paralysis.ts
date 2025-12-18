/**
 * V5 선택 장애 대응 함수
 * 
 * 명세서 STEP 12: 선택 장애 대응 규칙
 */

/**
 * 선택 장애 탐지 결과
 */
export interface ChoiceParalysis {
  decision_fatigue: boolean // Q10 = '전문가추천'
  style_fatigue: boolean // Q11 = '어려움'
  tone_fatigue: boolean // Q18 = '모르겠음'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

/**
 * 선택 장애 탐지
 * 
 * @param answers 질문 답변
 * @returns 선택 장애 탐지 결과
 */
export function detectChoiceParalysis(
  answers: Record<string, string>
): ChoiceParalysis {
  const decision_fatigue = answers.Q10 === '전문가추천'
  const style_fatigue = answers.Q11 === '어려움'
  const tone_fatigue = answers.Q18 === '모르겠음'

  const count = [decision_fatigue, style_fatigue, tone_fatigue].filter(
    Boolean
  ).length
  const severity =
    count >= 2 ? 'HIGH' : count === 1 ? 'MEDIUM' : 'LOW'

  return { decision_fatigue, style_fatigue, tone_fatigue, severity }
}

/**
 * AI 프롬프트 지침 생성
 * 
 * @param paralysis 선택 장애 탐지 결과
 * @returns AI 프롬프트 지침 문자열
 */
export function getAIPromptForParalysis(
  paralysis: ChoiceParalysis
): string {
  const instructions: string[] = []

  if (paralysis.decision_fatigue) {
    instructions.push(
      '- 선택지를 2-3개로 제한하세요',
      '- "이 중에서 고르세요" 형태로 제시하세요',
      '- 비교표 대신 단일 추천을 하세요',
      '- "제가 좁혀드릴게요"라고 말하세요'
    )
  }

  if (paralysis.style_fatigue) {
    instructions.push(
      '- 소거법을 사용하세요 (좋은 것 대신 싫은 것 제외)',
      '- "이건 피하시는 게 좋겠어요"라고 말하세요',
      '- 구체적 스타일명 대신 톤/분위기로 설명하세요'
    )
  }

  if (paralysis.tone_fatigue) {
    instructions.push(
      '- 톤 범위만 먼저 결정하게 하세요 (밝은/중간/어두운)',
      '- "일단 밝은 톤으로 가시고, 포인트만 나중에 정하시죠"',
      '- 세부 색상은 나중으로 미루세요'
    )
  }

  return instructions.join('\n')
}

/**
 * 선택 장애 대응 전략
 */
export interface ParalysisStrategy {
  optionLimit?: number // 옵션 개수 제한
  useElimination?: boolean // 소거법 사용
  deferDetails?: boolean // 세부 결정 미루기
  aiPrompt: string // AI 프롬프트 지침
}

/**
 * 선택 장애 대응 전략 생성
 */
export function getParalysisStrategy(
  paralysis: ChoiceParalysis
): ParalysisStrategy {
  const strategy: ParalysisStrategy = {
    aiPrompt: getAIPromptForParalysis(paralysis),
  }

  if (paralysis.decision_fatigue) {
    strategy.optionLimit = 3
  }

  if (paralysis.style_fatigue) {
    strategy.useElimination = true
  }

  if (paralysis.tone_fatigue) {
    strategy.deferDetails = true
  }

  return strategy
}

