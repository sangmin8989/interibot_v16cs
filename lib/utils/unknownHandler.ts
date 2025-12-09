/**
 * "잘 모르겠어요" 처리 로직
 */

export interface UnknownResponse {
  strength: 'unknown'
  score: 0
  mode: 'auto-recommend'
  needsAdditionalQuestions: boolean
  additionalQuestionCategories?: string[]
}

/**
 * "잘 모르겠어요" 옵션인지 확인
 */
export function isUnknownOption(option: string): boolean {
  return option.includes('잘 모르겠어요') || option.includes('추천해 주세요')
}

/**
 * "잘 모르겠어요" 응답 처리
 * @param spaceType 공간 타입
 * @returns UnknownResponse 객체
 */
export function handleUnknownOption(spaceType: string): UnknownResponse {
  // 공간별 추가 질문 카테고리
  const additionalQuestions: Record<string, string[]> = {
    kitchen: ['정리', '동선', '밝기', '상판'],
    bathroom: ['관리', '공간감', '수납'],
    living: ['조명', '정리', '아늑함'],
    bedroom: ['수면', '정리', '색감'],
    kidsroom: ['안전', '수납', '밝기'],
    study: ['집중', '정리', '조명'],
    dressing: ['정리', '조명', '동선'],
    veranda: ['용도', '채광', '수납'],
    laundry: ['동선', '수납', '습기'],
    entrance: ['첫인상', '수납', '조명'],
    storage: ['정리', '접근성', '용량'],
    fullhome: ['전체톤', '조명', '바닥'],
  }

  return {
    strength: 'unknown',
    score: 0,
    mode: 'auto-recommend',
    needsAdditionalQuestions: true,
    additionalQuestionCategories: additionalQuestions[spaceType] || [],
  }
}

/**
 * 전체 응답에서 unknown 비율 계산
 */
export function calculateUnknownRatio(answers: Record<string, string>): number {
  const totalAnswers = Object.keys(answers).length
  if (totalAnswers === 0) return 1

  const unknownCount = Object.values(answers).filter((answer) =>
    isUnknownOption(answer)
  ).length

  return unknownCount / totalAnswers
}

/**
 * unknown 비율이 높으면 AI 추천 모드 활성화
 */
export function shouldActivateAIRecommendation(unknownRatio: number): boolean {
  return unknownRatio >= 0.5 // 50% 이상이면 AI 추천
}





