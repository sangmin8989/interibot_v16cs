/**
 * 집값 방어지수 계산기
 * 
 * 인테리어 투자가 향후 매도 시 집값에 얼마나 반영되는지 예측
 */

import type { ReportInput, HomeValueResult } from './types'

/**
 * 집값 방어지수 계산
 */
export function calculateHomeValueIndex(input: ReportInput): HomeValueResult {
  const baseScore = 40
  
  // 1. 주거형태 점수 (0~15점)
  const housingTypeScore = getHousingTypeScore(input.spaceInfo.housingType)
  
  // 2. 평수 점수 (0~12점)
  const sizeScore = getSizeScore(input.spaceInfo.pyeong)
  
  // 3. 공정 선택 점수 (0~18점)
  const processScore = calculateProcessScore(input.selectedProcesses)
  
  // 4. 자재 등급 점수 (0~10점)
  const gradeScore = getGradeScore(input.grade)
  
  // 5. 트렌드 부합도 (0~5점)
  const styleScore = getStyleScore(input.style)
  
  // 합계 계산
  let totalScore = baseScore + 
    housingTypeScore.score + 
    sizeScore.score + 
    processScore.score + 
    gradeScore.score + 
    styleScore.score
  
  // 감점 요소 적용
  const deductions = calculateDeductions(input)
  deductions.forEach(d => {
    totalScore -= d.deduction
  })
  
  // 최소/최대 점수 제한
  totalScore = Math.max(30, Math.min(100, totalScore))
  
  // 강점/약점 파악
  const factors = {
    housingType: housingTypeScore.score,
    size: sizeScore.score,
    processes: processScore.score,
    grade: gradeScore.score,
    style: styleScore.score,
  }
  
  const sortedFactors = Object.entries(factors).sort((a, b) => b[1] - a[1])
  const topFactor = getFactorName(sortedFactors[0][0], input)
  const weakFactor = getFactorName(sortedFactors[sortedFactors.length - 1][0], input)
  
  // 5년 후 가치 예측
  const futureValue = predictFutureValue(
    input.totalBudget || 0,
    totalScore,
    input.spaceInfo.housingType
  )
  
  // AI 메시지 생성
  const message = generateHomeValueMessage(
    totalScore,
    factors,
    topFactor,
    weakFactor
  )
  
  return {
    score: Math.round(totalScore),
    factors: {
      housingType: housingTypeScore,
      size: sizeScore,
      processes: processScore,
      grade: gradeScore,
      style: styleScore,
    },
    deductions,
    topFactor,
    weakFactor,
    futureValue,
    message,
  }
}

/**
 * 주거형태 점수 (0~15점)
 */
function getHousingTypeScore(housingType: string): { score: number; reason: string } {
  const housingTypeScore: Record<string, { score: number; reason: string }> = {
    '아파트': { 
      score: 15, 
      reason: '아파트는 환금성이 높아 인테리어 투자가 매도가에 잘 반영됩니다' 
    },
    '오피스텔': { 
      score: 12, 
      reason: '오피스텔은 임대 수익과 직결되어 인테리어 가치가 인정됩니다' 
    },
    '빌라': { 
      score: 8, 
      reason: '빌라는 매수자가 제한적이라 인테리어 프리미엄이 낮은 편입니다' 
    },
    '다세대': { 
      score: 8, 
      reason: '다세대는 매수자가 제한적이라 인테리어 프리미엄이 낮은 편입니다' 
    },
    '단독주택': { 
      score: 5, 
      reason: '단독주택은 개인 취향이 강해 범용적 가치 인정이 어렵습니다' 
    },
    '상가': { 
      score: 10, 
      reason: '상가는 업종에 따라 인테리어 가치가 다릅니다' 
    },
    '사무실': { 
      score: 10, 
      reason: '사무실은 업종에 따라 인테리어 가치가 다릅니다' 
    },
  }
  
  return housingTypeScore[housingType] || { score: 5, reason: '기본 점수가 적용됩니다' }
}

/**
 * 평수 점수 (0~12점)
 */
function getSizeScore(pyeong: number): { score: number; reason: string } {
  if (pyeong >= 24 && pyeong <= 34) {
    return { 
      score: 12, 
      reason: `${pyeong}평은 국민평형으로 수요가 가장 많아 인테리어 가치가 잘 반영됩니다` 
    }
  }
  if (pyeong >= 35 && pyeong <= 45) {
    return { 
      score: 10, 
      reason: `${pyeong}평 중대형은 가족 수요가 꾸준해 투자 가치가 있습니다` 
    }
  }
  if (pyeong >= 20 && pyeong <= 23) {
    return { 
      score: 9, 
      reason: `${pyeong}평은 신혼부부/1~2인 가구에 인기가 높습니다` 
    }
  }
  if (pyeong >= 46 && pyeong <= 55) {
    return { 
      score: 7, 
      reason: `${pyeong}평 대형은 수요층이 제한적이지만 프리미엄 가치가 있습니다` 
    }
  }
  if (pyeong >= 15 && pyeong <= 19) {
    return { 
      score: 6, 
      reason: `${pyeong}평 소형은 투자 목적이 많아 실거주 인테리어 가치가 낮습니다` 
    }
  }
  if (pyeong > 55) {
    return { 
      score: 5, 
      reason: `${pyeong}평 초대형은 특수 수요층으로 범용적 가치 인정이 어렵습니다` 
    }
  }
  return { 
    score: 4, 
    reason: `${pyeong}평 초소형은 투자 가치가 제한적입니다` 
  }
}

/**
 * 공정 선택 점수 (0~18점, 최대 18점까지만 반영)
 */
function calculateProcessScore(processes: string[]): { score: number; reason: string } {
  const processValueScore: Record<string, { score: number; reason: string }> = {
    '주방': { 
      score: 5, 
      reason: '주방은 매수자가 가장 먼저 확인하는 공간으로 집값에 가장 큰 영향을 줍니다' 
    },
    '욕실': { 
      score: 4, 
      reason: '욕실 상태는 집 전체의 청결 이미지를 결정합니다' 
    },
    '바닥재': { 
      score: 3, 
      reason: '바닥재는 집의 첫인상과 전체 분위기를 좌우합니다' 
    },
    '샤시': { 
      score: 3, 
      reason: '샤시는 단열과 방음 성능으로 실거주 가치를 높입니다' 
    },
    '창호': { 
      score: 3, 
      reason: '창호는 단열과 방음 성능으로 실거주 가치를 높입니다' 
    },
    '도배': { 
      score: 2, 
      reason: '깔끔한 도배는 새집 느낌을 주어 호감도를 높입니다' 
    },
    '조명': { 
      score: 1, 
      reason: '조명은 분위기를 좌우하지만 쉽게 교체 가능해 가치가 제한적입니다' 
    },
    '붙박이장': { 
      score: 1, 
      reason: '수납 편의성은 좋지만 취향을 타서 가치 인정이 제한적입니다' 
    },
    '수납': { 
      score: 1, 
      reason: '수납 편의성은 좋지만 취향을 타서 가치 인정이 제한적입니다' 
    },
    '중문': { 
      score: 1, 
      reason: '중문은 방음/단열 보조 역할로 부가 가치가 있습니다' 
    },
    '도장': { 
      score: 0.5, 
      reason: '도장은 부분적이고 변경이 쉬워 가치가 낮습니다' 
    },
    '필름': { 
      score: 0.5, 
      reason: '필름은 마감재로 변경이 쉬워 가치가 낮습니다' 
    },
  }
  
  let total = 0
  const reasons: string[] = []
  
  processes.forEach(p => {
    const processInfo = processValueScore[p]
    if (processInfo) {
      total += processInfo.score
      reasons.push(processInfo.reason)
    }
  })
  
  // 최대 18점까지만 반영
  const finalScore = Math.min(18, total)
  
  return {
    score: finalScore,
    reason: finalScore >= 15 
      ? '집값에 직접 영향을 주는 핵심 공정들로 구성되어 있어 가치가 높습니다'
      : finalScore >= 10
      ? '주요 공정들이 포함되어 있어 적정한 가치를 인정받을 수 있습니다'
      : '기본 공정 위주로 구성되어 있어 가치 인정이 제한적입니다'
  }
}

/**
 * 자재 등급 점수 (0~10점)
 */
function getGradeScore(grade: string): { score: number; reason: string } {
  const gradeScore: Record<string, { score: number; reason: string }> = {
    'OPUS': { 
      score: 10, 
      reason: '프리미엄 자재와 브랜드 가치가 매도가에 반영됩니다' 
    },
    'STANDARD': { 
      score: 7, 
      reason: '브랜드 자재로 적정 수준의 가치가 인정됩니다' 
    },
    'ESSENTIAL': { 
      score: 4, 
      reason: '기본 자재로 최소한의 가치는 유지됩니다' 
    },
  }
  
  return gradeScore[grade] || { score: 4, reason: '기본 등급 점수가 적용됩니다' }
}

/**
 * 트렌드 부합도 (0~5점)
 */
function getStyleScore(style?: string): { score: number; reason: string } {
  if (!style) {
    return { score: 3, reason: '스타일 정보가 없어 기본 점수가 적용됩니다' }
  }
  
  const styleScore: Record<string, { score: number; reason: string }> = {
    '모던': { 
      score: 5, 
      reason: '모던 스타일은 가장 대중적이어서 매수자 선호도가 높습니다' 
    },
    '내추럴': { 
      score: 4, 
      reason: '내추럴 스타일은 꾸준히 인기 있어 무난한 선택입니다' 
    },
    '북유럽': { 
      score: 4, 
      reason: '북유럽 스타일은 밝고 깔끔해 선호도가 높습니다' 
    },
    '미니멀': { 
      score: 4, 
      reason: '미니멀 스타일은 깔끔함을 선호하는 층에 인기입니다' 
    },
    '클래식': { 
      score: 3, 
      reason: '클래식 스타일은 세대별 호불호가 있습니다' 
    },
    '빈티지': { 
      score: 2, 
      reason: '빈티지 스타일은 취향이 강해 범용성이 낮습니다' 
    },
    '인더스트리얼': { 
      score: 2, 
      reason: '인더스트리얼 스타일은 취향이 강해 범용성이 낮습니다' 
    },
  }
  
  return styleScore[style] || { score: 3, reason: '기본 스타일 점수가 적용됩니다' }
}

/**
 * 감점 요소 계산
 */
function calculateDeductions(input: ReportInput): { item: string; deduction: number; reason: string }[] {
  const deductions: { item: string; deduction: number; reason: string }[] = []
  
  // 구조 변경
  if (input.structuralChange) {
    deductions.push({
      item: '구조 변경',
      deduction: 3,
      reason: '구조 변경은 원상복구 비용 이슈로 감점됩니다'
    })
  }
  
  // 화려한 개인 취향
  if (input.personalStyle) {
    deductions.push({
      item: '개인 취향',
      deduction: 2,
      reason: '화려한 개인 취향은 범용성을 낮춥니다'
    })
  }
  
  // 저가 마감재 과다 사용
  if (input.grade === 'ESSENTIAL' && input.selectedProcesses.length > 5) {
    deductions.push({
      item: '저가 마감재 과다',
      deduction: 2,
      reason: '저가 마감재 과다 사용은 하자 리스크가 있습니다'
    })
  }
  
  // 오래된 설비 유지 (추정)
  // 이 부분은 입력 데이터에 따라 조정 필요
  
  return deductions
}

/**
 * 강점/약점 요소명 변환
 */
function getFactorName(factorKey: string, input: ReportInput): string {
  const factorNames: Record<string, string> = {
    'housingType': `${input.spaceInfo.housingType} 선택`,
    'size': `${input.spaceInfo.pyeong}평 규모`,
    'processes': '공정 선택',
    'grade': `${input.grade} 등급`,
    'style': input.style ? `${input.style} 스타일` : '스타일',
  }
  
  return factorNames[factorKey] || '기타 요소'
}

/**
 * 5년 후 가치 예측
 */
function predictFutureValue(
  investedAmount: number, 
  homeValueScore: number,
  housingType: string
): { expectedReturn: number; returnRate: number; message: string } {
  // 기본 회수율 (점수 기반)
  let baseReturnRate: number
  if (homeValueScore >= 85) baseReturnRate = 0.80      // 80% 회수
  else if (homeValueScore >= 75) baseReturnRate = 0.70 // 70% 회수
  else if (homeValueScore >= 65) baseReturnRate = 0.55 // 55% 회수
  else if (homeValueScore >= 55) baseReturnRate = 0.40 // 40% 회수
  else baseReturnRate = 0.25                           // 25% 회수

  // 주거형태별 보정
  const housingMultiplier: Record<string, number> = {
    '아파트': 1.1,
    '오피스텔': 1.0,
    '빌라': 0.9,
    '다세대': 0.9,
    '단독주택': 0.8,
    '상가': 1.0,
    '사무실': 1.0,
  }
  
  const finalRate = baseReturnRate * (housingMultiplier[housingType] || 1)
  const expectedReturn = Math.round(investedAmount * finalRate)
  
  let message: string
  if (finalRate >= 0.75) {
    message = `매도 시 투자금의 약 ${Math.round(finalRate * 100)}%가 집값에 반영될 것으로 예상됩니다. 훌륭한 투자입니다.`
  } else if (finalRate >= 0.55) {
    message = `매도 시 투자금의 약 ${Math.round(finalRate * 100)}%를 회수할 수 있을 것으로 예상됩니다. 양호한 수준입니다.`
  } else {
    message = `매도보다는 실거주 만족을 위한 투자로 보시는 게 좋습니다. 약 ${Math.round(finalRate * 100)}% 회수 예상.`
  }
  
  return {
    expectedReturn,
    returnRate: Math.round(finalRate * 100),
    message
  }
}

/**
 * AI 메시지 생성
 */
function generateHomeValueMessage(
  score: number,
  factors: Record<string, number>,
  topFactor: string,
  weakFactor: string
): string {
  if (score >= 85) {
    return `집값 방어 면에서 최상급 구성입니다. 특히 ${topFactor}에 투자한 것이 매도 시 큰 가치를 발휘할 거예요. 5년 후에도 투자금 대부분을 회수할 수 있을 것으로 예상됩니다.`
  }
  if (score >= 70) {
    return `집값 방어가 양호한 구성입니다. ${topFactor}이(가) 가치를 높이고 있어요. ${weakFactor}을(를) 보완하면 더 좋은 투자가 될 수 있습니다.`
  }
  if (score >= 55) {
    return `적정 수준의 투자입니다. 매도보다는 실거주 만족에 초점을 맞추셨네요. ${topFactor}은(는) 좋은 선택이지만, ${weakFactor}이(가) 아쉽습니다.`
  }
  return `실거주 만족 중심의 인테리어입니다. 집값 반영보다 현재 생활의 질 향상에 집중한 구성이에요.`
}




