/**
 * 예산 옵션 데이터
 */

export type BudgetRange = 
  | 'unknown'      // 예산 없음 / 아직 모름
  | 'under2000'    // 2,000만원 이하
  | 'range2000_4000' // 2,000~4,000만원
  | 'range4000_6000' // 4,000~6,000만원
  | 'over6000'     // 6,000만원 이상

export interface BudgetOption {
  id: BudgetRange
  label: string
  description: string
  emoji: string
  minAmount?: number  // 만원 단위
  maxAmount?: number  // 만원 단위
  recommendedGrade: 'all' | 'basic' | 'standard' | 'argen' | 'premium'
}

export const BUDGET_OPTIONS: BudgetOption[] = [
  {
    id: 'unknown',
    label: '아직 정하지 않았어요',
    description: '견적을 보고 결정할게요',
    emoji: '🤔',
    recommendedGrade: 'all'
  },
  {
    id: 'under2000',
    label: '2,000만원 이하',
    description: '최소한으로, 가성비 중심',
    emoji: '💵',
    maxAmount: 2000,
    recommendedGrade: 'basic'
  },
  {
    id: 'range2000_4000',
    label: '2,000 ~ 4,000만원',
    description: '적당히, 균형 잡힌 선택',
    emoji: '💰',
    minAmount: 2000,
    maxAmount: 4000,
    recommendedGrade: 'standard'
  },
  {
    id: 'range4000_6000',
    label: '4,000 ~ 6,000만원',
    description: '제대로, 품질 우선',
    emoji: '💎',
    minAmount: 4000,
    maxAmount: 6000,
    recommendedGrade: 'argen'
  },
  {
    id: 'over6000',
    label: '6,000만원 이상',
    description: '마음껏, 최고급으로',
    emoji: '👑',
    minAmount: 6000,
    recommendedGrade: 'premium'
  }
]

// 예산에 맞는 등급 추천
export function getRecommendedGradeByBudget(budget: BudgetRange): string {
  const option = BUDGET_OPTIONS.find(opt => opt.id === budget)
  return option?.recommendedGrade || 'all'
}

// 예산 범위 텍스트
export function getBudgetRangeText(budget: BudgetRange): string {
  const option = BUDGET_OPTIONS.find(opt => opt.id === budget)
  return option?.label || '미정'
}







