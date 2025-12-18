/**
 * V5 아르젠 제작 추천 로직
 * 
 * 명세서 STEP 9: 아르젠 vs 브랜드 분기
 */

import type { BasicInfoInput } from './types'

/**
 * 아르젠 추천 결과
 */
export interface ArgenRecommendation {
  recommend_argen: boolean
  items: string[]
  reason: string
  mention: string
}

/**
 * 평형 구간을 숫자로 변환
 */
function convertPyeongToNumber(range: string): number {
  switch (range) {
    case 'under10':
      return 8
    case '11to15':
      return 13
    case '16to25':
      return 20
    case '26to40':
      return 33
    case 'over40':
      return 45
    default:
      return 25
  }
}

/**
 * 아르젠 추천 여부 판단
 * 
 * @param tags 성향 태그 배열
 * @param basicInfo 기본 정보
 * @returns 아르젠 추천 결과
 */
export function getArgenRecommendation(
  tags: string[],
  basicInfo: BasicInfoInput
): ArgenRecommendation {
  const pyeongNum = convertPyeongToNumber(basicInfo.pyeong_range)
  const budgetHigh = ['4000to6000', 'over6000'].includes(basicInfo.budget_range)

  // 아르젠 우선 조건
  if (
    tags.includes('STORAGE_RISK_HIGH') ||
    pyeongNum <= 25 ||
    (tags.includes('LONG_STAY') && budgetHigh) ||
    tags.includes('KITCHEN_IMPORTANT')
  ) {
    const items: string[] = []
    let reason = ''
    let mention = ''

    if (tags.includes('STORAGE_RISK_HIGH')) {
      items.push('붙박이장', '신발장', '수납장')
      reason = '맞춤 제작으로 공간 최적화'
      mention = '아르젠에서 밀리 단위 맞춤 제작 가능합니다'
    }

    if (pyeongNum <= 25) {
      items.push('모든 수납 가구')
      reason = '소형 평수 효율 극대화'
      if (!mention) {
        mention = '소형 평수는 맞춤 제작이 훨씬 효율적입니다'
      }
    }

    if (tags.includes('LONG_STAY') && budgetHigh) {
      items.push('주방', '드레스룸')
      reason = '품질 투자 가치'
      if (!mention) {
        mention = '오래 사실 거면 품질에 투자하세요'
      }
    }

    if (tags.includes('KITCHEN_IMPORTANT')) {
      items.push('싱크대', '상부장', '하부장')
      reason = '요리 동선 맞춤 설계'
      if (!mention) {
        mention = '주방은 동선이 생명입니다, 맞춤 설계 추천'
      }
    }

    return {
      recommend_argen: true,
      items: Array.from(new Set(items)),
      reason,
      mention,
    }
  }

  // 브랜드 우선 조건
  if (tags.includes('SHORT_STAY') || tags.includes('BUDGET_TIGHT')) {
    return {
      recommend_argen: false,
      items: [],
      reason: '비용 효율 우선',
      mention: '가성비 좋은 브랜드 제품으로 추천드립니다',
    }
  }

  // 둘 다 제시
  return {
    recommend_argen: true,
    items: ['선택 가능'],
    reason: '아르젠 맞춤과 브랜드 기성품 비교 가능',
    mention: '맞춤 제작과 브랜드 제품 중 선택하실 수 있습니다',
  }
}

