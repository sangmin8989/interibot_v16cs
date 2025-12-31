/**
 * 투자 효율지수 계산기
 * 
 * 예산 대비 얼마나 효율적으로 투자했는지 측정
 */

import type { ReportInput, InvestmentEfficiencyResult } from './types'

/**
 * 투자 효율지수 계산
 */
export function calculateInvestmentEfficiencyIndex(input: ReportInput): InvestmentEfficiencyResult {
  const baseScore = 40
  
  // 1. 예산 배분 적정성 (0~25점)
  const budgetAllocation = calculateBudgetAllocation(
    input.totalBudget || 0,
    input.processBreakdown || []
  )
  
  // 2. 라이프스타일 매칭 (0~20점) - 생활 안정지수와 중복이지만 투자 관점에서 평가
  const lifestyleMatch = calculateLifestyleMatchForInvestment(input)
  
  // 3. 불필요 지출 방지 (0~15점)
  const wastePrevention = calculateWastePreventionScore(input)
  
  // 합계 계산
  const totalScore = baseScore + 
    budgetAllocation.score + 
    lifestyleMatch.score + 
    wastePrevention.score
  
  // 최소/최대 점수 제한
  const finalScore = Math.max(40, Math.min(100, totalScore))
  
  // AI 메시지 생성
  const message = generateInvestmentMessage(
    finalScore,
    budgetAllocation,
    wastePrevention
  )
  
  return {
    score: Math.round(finalScore),
    budgetAllocation,
    wastePrevention,
    message,
  }
}

/**
 * 예산 배분 적정성 (0~25점)
 */
function calculateBudgetAllocation(
  totalBudget: number,
  processBreakdown: Array<{ process: string; cost: number }>
): {
  score: number
  analysis: Array<{
    process: string
    recommended: string
    actual: string
    evaluation: string
    score: number
  }>
} {
  if (totalBudget === 0 || processBreakdown.length === 0) {
    return {
      score: 15,  // 기본 점수
      analysis: []
    }
  }
  
  const recommendedRatio: Record<string, { min: number; max: number; weight: number }> = {
    '주방': { min: 0.25, max: 0.35, weight: 8 },
    '욕실': { min: 0.15, max: 0.20, weight: 5 },
    '바닥재': { min: 0.10, max: 0.15, weight: 4 },
    '도배': { min: 0.05, max: 0.10, weight: 3 },
    '전기': { min: 0.05, max: 0.10, weight: 3 },
    '조명': { min: 0.05, max: 0.10, weight: 3 },
    '가구': { min: 0.05, max: 0.15, weight: 2 },
    '붙박이장': { min: 0.05, max: 0.15, weight: 2 },
    '수납': { min: 0.05, max: 0.15, weight: 2 },
  }
  
  let totalScore = 0
  const analysis: Array<{
    process: string
    recommended: string
    actual: string
    evaluation: string
    score: number
  }> = []
  
  processBreakdown.forEach(item => {
    const ratio = item.cost / totalBudget
    const rec = recommendedRatio[item.process]
    
    if (rec) {
      let evaluation: string
      let score: number
      
      if (ratio >= rec.min && ratio <= rec.max) {
        evaluation = '적정'
        score = rec.weight
      } else if (ratio < rec.min) {
        evaluation = '투자 부족'
        score = Math.round(rec.weight * 0.5)
      } else {
        evaluation = '과투자'
        score = Math.round(rec.weight * 0.7)
      }
      
      totalScore += score
      
      analysis.push({
        process: item.process,
        recommended: `${Math.round(rec.min * 100)}~${Math.round(rec.max * 100)}%`,
        actual: `${Math.round(ratio * 100)}%`,
        evaluation,
        score
      })
    }
  })
  
  return { score: Math.min(25, totalScore), analysis }
}

/**
 * 라이프스타일 매칭 (투자 관점)
 */
function calculateLifestyleMatchForInvestment(input: ReportInput): { score: number } {
  let score = 0
  
  // 요리 많이 하는데 주방 투자
  if (input.lifestyle.cookingFrequency === 'daily' && 
      input.selectedProcesses.includes('주방')) {
    score += 8
  }
  
  // 청소 귀찮은데 관리 쉬운 자재
  if (input.lifestyle.cleaningStyle === 'lazy' && 
      input.grade === 'STANDARD') {
    score += 7
  }
  
  // 소음 민감한데 방음 투자
  if (input.lifestyle.noiseSensitivity === 'high' && 
      (input.hasDoor || input.hasSash)) {
    score += 5
  }
  
  return { score: Math.min(20, score) }
}

/**
 * 불필요 지출 방지 점수 (0~15점)
 */
function calculateWastePreventionScore(
  input: ReportInput
): { 
  score: number
  goodDecisions: string[]
  wastefulDecisions: string[]
} {
  const goodDecisions: string[] = []
  const wastefulDecisions: string[] = []
  let score = 8  // 기본 점수
  
  // 요리 안 하는데 주방 과투자
  if (input.lifestyle.cookingFrequency === 'rarely' && 
      input.grade === 'OPUS' && 
      input.selectedProcesses.includes('주방')) {
    wastefulDecisions.push('요리 거의 안 하시는데 주방에 과투자예요')
    score -= 3
  }
  
  // 손님 안 오는데 거실 확장
  if (input.lifestyle.socialFrequency === 'rarely' && 
      input.options?.includes('거실확장')) {
    wastefulDecisions.push('손님 안 오시면 거실 확장 대신 다른 곳에 투자하세요')
    score -= 2
  }
  
  // 좋은 선택 예시
  if (input.lifestyle.cookingFrequency === 'daily' && 
      input.selectedProcesses.includes('주방')) {
    goodDecisions.push('요리 많이 하시니까 주방 투자는 현명한 선택이에요')
    score += 5
  }
  
  if (input.lifestyle.noiseSensitivity === 'low' && 
      !input.selectedProcesses.includes('중문')) {
    goodDecisions.push('소음 OK시면 중문 안 하신 건 좋은 판단이에요')
    score += 3
  }
  
  if (input.lifestyle.cleaningStyle === 'lazy' && input.grade === 'STANDARD') {
    goodDecisions.push('청소 편한 STANDARD 자재 선택은 딱 맞아요')
    score += 4
  }
  
  return { 
    score: Math.max(0, Math.min(15, score)), 
    goodDecisions, 
    wastefulDecisions 
  }
}

/**
 * AI 메시지 생성
 */
function generateInvestmentMessage(
  score: number,
  budgetAllocation: { score: number; analysis: any[] },
  wastePrevention: { goodDecisions: string[]; wastefulDecisions: string[] }
): string {
  if (score >= 85) {
    return `투자 효율이 매우 뛰어나요. 예산을 핵심 공간에 집중해서 투자하셨네요. ${wastePrevention.goodDecisions[0] || '효율적인 구성이에요'}.`
  }
  if (score >= 70) {
    return `투자 효율이 양호해요. ${budgetAllocation.analysis.length > 0 ? '예산 배분이 적정해요' : '대부분 적절한 투자예요'}. ${wastePrevention.goodDecisions.length > 0 ? wastePrevention.goodDecisions[0] : ''}`
  }
  if (score >= 55) {
    return `기본적인 투자 효율은 확보됐어요. ${wastePrevention.wastefulDecisions.length > 0 ? wastePrevention.wastefulDecisions[0] + ' ' : ''}일부 예산 재배분을 고려해보세요.`
  }
  return `투자 효율 개선 여지가 있어요. ${wastePrevention.wastefulDecisions.length > 0 ? wastePrevention.wastefulDecisions.join(', ') + '. ' : ''}라이프스타일에 맞게 예산을 재배분하시면 더 효율적이에요.`
}




