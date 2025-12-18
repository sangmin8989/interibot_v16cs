/**
 * 단일 기준 결정 로직
 * 
 * 명세서 요구사항:
 * - 기준은 "하나"만 반환해야 함 (배열/복수 기준 금지)
 * - 점수 나열 금지
 * - "복합 타입" 금지
 */

export type DecisionCriteria =
  | '아이 안전'
  | '정리 스트레스 최소화'
  | '유지관리 부담 최소화'
  | '공간 활용 효율'
  | '공사 범위 최소화'
  | '예산 통제 우선'
  | '동선 단순화'

/**
 * 성향 분석 답변을 기반으로 단일 기준을 결정합니다.
 * 
 * @param answers - 질문 ID를 키로 하는 답변 맵
 * @returns 단일 기준 (하나만 반환)
 */
export function decideSingleCriteria(
  answers: Record<string, string>
): DecisionCriteria {
  // 답변을 문자열로 변환하여 키워드 검색
  const answerTexts = Object.values(answers).join(' ').toLowerCase()
  
  // 1) 안전 관련 키워드 우선 검사
  if (
    answerTexts.includes('안전') ||
    answerTexts.includes('아이') ||
    answerTexts.includes('어린이') ||
    answerTexts.includes('미끄럼') ||
    answerTexts.includes('위험')
  ) {
    return '아이 안전'
  }

  // 2) 수납/정리 관련 키워드
  if (
    answerTexts.includes('수납') ||
    answerTexts.includes('정리') ||
    answerTexts.includes('어질러') ||
    answerTexts.includes('쌓이') ||
    answerTexts.includes('정돈')
  ) {
    return '정리 스트레스 최소화'
  }

  // 3) 유지관리/청소 관련 키워드
  if (
    answerTexts.includes('청소') ||
    answerTexts.includes('유지') ||
    answerTexts.includes('관리') ||
    answerTexts.includes('곰팡이') ||
    answerTexts.includes('오염') ||
    answerTexts.includes('손이 덜')
  ) {
    return '유지관리 부담 최소화'
  }

  // 4) 동선 관련 키워드
  if (
    answerTexts.includes('동선') ||
    answerTexts.includes('이동') ||
    answerTexts.includes('경로') ||
    answerTexts.includes('흐름') ||
    answerTexts.includes('단순')
  ) {
    return '동선 단순화'
  }

  // 5) 예산/비용 관련 키워드
  if (
    answerTexts.includes('예산') ||
    answerTexts.includes('비용') ||
    answerTexts.includes('저렴') ||
    answerTexts.includes('절약') ||
    answerTexts.includes('가격')
  ) {
    return '예산 통제 우선'
  }

  // 6) 공사 범위 관련 키워드
  if (
    answerTexts.includes('범위') ||
    answerTexts.includes('최소') ||
    answerTexts.includes('부분') ||
    answerTexts.includes('철거') ||
    answerTexts.includes('적게')
  ) {
    return '공사 범위 최소화'
  }

  // 7) 공간 활용 관련 키워드
  if (
    answerTexts.includes('공간') ||
    answerTexts.includes('면적') ||
    answerTexts.includes('활용') ||
    answerTexts.includes('효율') ||
    answerTexts.includes('넓게')
  ) {
    return '공간 활용 효율'
  }

  // fallback: 기본값
  return '공간 활용 효율'
}

/**
 * 기준 선언 문장 생성 (설명형/관찰형 톤)
 * 
 * 명세서 요구사항:
 * - 추천/정당화/단정 금지
 * - 관찰형/설명형만 허용
 * 
 * @param criteria - 결정된 기준
 * @returns 기준 선언 문장 (1~2줄)
 */
export function generateCriteriaDeclaration(
  criteria: DecisionCriteria
): string {
  switch (criteria) {
    case '아이 안전':
      return '고객님은 **아이 안전**을 우선할 때 선택이 가장 쉬워지는 경향이 있습니다.\n이 기준으로 보면 옵션이 줄어들어 혼란과 후회가 줄어듭니다.'

    case '정리 스트레스 최소화':
      return '고객님은 **정리 스트레스 최소화**를 우선할 때 선택이 가장 쉬워지는 경향이 있습니다.\n이 기준으로 보면 옵션이 줄어들어 혼란과 후회가 줄어듭니다.'

    case '유지관리 부담 최소화':
      return '고객님은 **유지관리 부담 최소화**를 우선할 때 선택이 가장 쉬워지는 경향이 있습니다.\n이 기준으로 보면 옵션이 줄어들어 혼란과 후회가 줄어듭니다.'

    case '공간 활용 효율':
      return '고객님은 **공간 활용 효율**을 우선할 때 선택이 가장 쉬워지는 경향이 있습니다.\n이 기준으로 보면 옵션이 줄어들어 혼란과 후회가 줄어듭니다.'

    case '공사 범위 최소화':
      return '고객님은 **공사 범위 최소화**를 우선할 때 선택이 가장 쉬워지는 경향이 있습니다.\n이 기준으로 보면 옵션이 줄어들어 혼란과 후회가 줄어듭니다.'

    case '예산 통제 우선':
      return '고객님은 **예산 통제 우선**을 우선할 때 선택이 가장 쉬워지는 경향이 있습니다.\n이 기준으로 보면 옵션이 줄어들어 혼란과 후회가 줄어듭니다.'

    case '동선 단순화':
      return '고객님은 **동선 단순화**를 우선할 때 선택이 가장 쉬워지는 경향이 있습니다.\n이 기준으로 보면 옵션이 줄어들어 혼란과 후회가 줄어듭니다.'

    default:
      return '고객님은 **공간 활용 효율**을 우선할 때 선택이 가장 쉬워지는 경향이 있습니다.\n이 기준으로 보면 옵션이 줄어들어 혼란과 후회가 줄어듭니다.'
  }
}













