/**
 * 리포트 AI 메시지 생성기
 * 
 * 6대 지수 결과를 바탕으로 종합 메시지 생성
 */

import type { ReportResult, ReportInput } from './types'

/**
 * 종합 메시지 생성
 */
export function generateOverallMessage(
  scores: Record<string, number>,
  grade: string,
  spaceInfo: { pyeong: number; housingType: string },
  lifestyle: { cookingFrequency: string; cleaningStyle: string }
): string {
  const total = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 6)
  
  // 가장 높은/낮은 지수 찾기
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const strongest = sortedScores[0]
  const weakest = sortedScores[sortedScores.length - 1]
  
  const strengthNames: Record<string, string> = {
    homeValue: '집값 방어',
    lifeQuality: '생활 개선',
    spaceEfficiency: '공간 활용',
    maintenance: '유지관리',
    energy: '에너지 절감',
    investment: '투자 효율'
  }
  
  let message = ''
  
  if (total >= 85) {
    message = `${spaceInfo.pyeong}평 ${spaceInfo.housingType}에 ARGEN ${grade}로 완벽에 가까운 구성을 하셨어요. `
    message += `특히 ${strengthNames[strongest[0]]}이(가) 뛰어나고, 전반적으로 균형 잡힌 설계입니다. `
    message += `5년 후에도 후회 없을 선택이에요.`
  } else if (total >= 70) {
    message = `${lifestyle.cookingFrequency === 'daily' ? '요리 중심' : lifestyle.cleaningStyle === 'lazy' ? '효율 중심' : '밸런스 있는'} `
    message += `라이프스타일에 맞게 잘 구성하셨어요. `
    message += `${strengthNames[strongest[0]]}은(는) 훌륭하고, `
    message += `${strengthNames[weakest[0]]}만 보완하면 완벽해요.`
  } else if (total >= 55) {
    message = `핵심 공간에 집중한 실용적인 구성이에요. `
    message += `${strengthNames[strongest[0]]}에서 효과를 보실 거예요. `
    message += `여유가 생기면 ${strengthNames[weakest[0]]}을(를) 보완하시면 좋아요.`
  } else {
    message = `필수 공정 위주의 알뜰한 구성이에요. `
    message += `지금 당장 필요한 것에 집중하셨네요. `
    message += `나중에 ${strengthNames[weakest[0]]} 쪽 업그레이드를 고려해보세요.`
  }
  
  return message
}

/**
 * 5년 후 시나리오 생성
 */
export function generate5YearScenario(
  investedAmount: number,
  scores: Record<string, number>,
  lifestyle: { cookingFrequency: string; cleaningStyle: string }
): string {
  const homeValueReturn = Math.round(investedAmount * (scores.homeValue / 100) * 0.8)
  const timeSavedPerYear = calculateTimeSaved(scores.lifeQuality, lifestyle)
  const energySaved = Math.round(scores.energy * 5000)  // 점수당 5천원
  
  let scenario = `지금 ${(investedAmount / 10000).toFixed(0)}만원 투자 시, `
  scenario += `5년 후 매도할 때 약 ${(homeValueReturn / 10000).toFixed(0)}만원의 가치가 인정될 것으로 예상됩니다. `
  
  if (lifestyle.cookingFrequency === 'daily') {
    scenario += `매일 요리하시는 시간이 줄고, `
  }
  if (lifestyle.cleaningStyle === 'lazy') {
    scenario += `주말 청소 시간도 절반으로 줄어 `
  }
  
  scenario += `'삶의 질' 측면에서 연간 약 ${timeSavedPerYear}시간을 아끼실 수 있어요. `
  scenario += `에너지 비용도 연간 약 ${(energySaved / 10000).toFixed(0)}만원 절감됩니다.`
  
  return scenario
}

/**
 * 시간 절감 계산
 */
function calculateTimeSaved(
  lifeQualityScore: number,
  lifestyle: { cookingFrequency: string; cleaningStyle: string }
): number {
  let hours = 0
  if (lifeQualityScore >= 70) {
    if (lifestyle.cookingFrequency === 'daily') hours += 100  // 요리 시간 절감
    if (lifestyle.cleaningStyle === 'lazy') hours += 50       // 청소 시간 절감
    hours += 50  // 기타 생활 편의
  }
  return hours
}

/**
 * 리포트 요약 생성
 */
export function generateReportSummary(result: ReportResult): {
  title: string
  subtitle: string
  highlights: string[]
  recommendations: string[]
} {
  const scores = {
    homeValue: result.homeValue.score,
    lifeQuality: result.lifeQuality.score,
    spaceEfficiency: result.spaceEfficiency.score,
    maintenance: result.maintenance.score,
    energy: result.energy.score,
    investment: result.investment.score,
  }
  
  const totalScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 6)
  
  // 하이라이트 (상위 3개 지수)
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const highlights = sortedScores.slice(0, 3).map(([key, score]) => {
    const names: Record<string, string> = {
      homeValue: '집값 방어',
      lifeQuality: '생활 개선',
      spaceEfficiency: '공간 활용',
      maintenance: '유지관리',
      energy: '에너지 절감',
      investment: '투자 효율'
    }
    return `${names[key]} ${score}점`
  })
  
  // 추천사항 (하위 2개 지수)
  const recommendations = sortedScores.slice(-2).map(([key]) => {
    const names: Record<string, string> = {
      homeValue: '집값 방어',
      lifeQuality: '생활 개선',
      spaceEfficiency: '공간 활용',
      maintenance: '유지관리',
      energy: '에너지 절감',
      investment: '투자 효율'
    }
    const messages: Record<string, string> = {
      homeValue: '주방, 욕실 등 핵심 공정에 투자하세요',
      lifeQuality: '라이프스타일에 맞는 공정을 추가하세요',
      spaceEfficiency: '수납 공간을 늘리거나 공간 활용도를 높이세요',
      maintenance: '관리 쉬운 자재로 교체하거나 유지보수 계획을 세우세요',
      energy: '샤시 업그레이드나 LED 조명으로 에너지 효율을 높이세요',
      investment: '예산을 핵심 공간에 집중하세요'
    }
    return messages[key] || '개선 여지가 있어요'
  })
  
  let title: string
  let subtitle: string
  
  if (totalScore >= 85) {
    title = '완벽에 가까운 구성'
    subtitle = '6대 지수 모두 우수한 수준입니다'
  } else if (totalScore >= 70) {
    title = '균형 잡힌 설계'
    subtitle = '대부분의 지수가 양호한 수준입니다'
  } else if (totalScore >= 55) {
    title = '실용적인 구성'
    subtitle = '핵심 지수에서 효과를 보실 수 있습니다'
  } else {
    title = '알뜰한 구성'
    subtitle = '필수 공정 위주로 효율적으로 구성되었습니다'
  }
  
  return {
    title,
    subtitle,
    highlights,
    recommendations,
  }
}




