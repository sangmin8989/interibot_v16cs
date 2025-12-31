/**
 * 유지관리 용이도 계산기
 * 
 * 인테리어 후 청소, 관리, 유지보수가 얼마나 쉬운지 측정
 */

import type { ReportInput, MaintenanceResult } from './types'

/**
 * 유지관리 용이도 계산
 */
export function calculateMaintenanceIndex(input: ReportInput): MaintenanceResult {
  const baseScore = 40
  
  // 1. 자재 내구성 점수 (0~25점)
  const maintenanceScore = calculateMaintenanceScore(input.grade, input.selectedProcesses)
  
  // 합계 계산 (자재 내구성 점수에 청소편의와 유지비예측이 포함됨)
  const totalScore = baseScore + maintenanceScore.score
  
  // 최소/최대 점수 제한
  const finalScore = Math.max(40, Math.min(100, totalScore))
  
  // 10년 유지비용 예측
  const tenYearCost = predict10YearCost(input.grade, input.spaceInfo.pyeong)
  
  // AI 메시지 생성
  const message = generateMaintenanceMessage(finalScore, maintenanceScore)
  
  return {
    score: Math.round(finalScore),
    easyItems: maintenanceScore.easyItems,
    hardItems: maintenanceScore.hardItems,
    maintenanceCycle: maintenanceScore.maintenanceCycle,
    tenYearCost,
    message,
  }
}

/**
 * 자재별 관리 점수 계산
 */
function calculateMaintenanceScore(
  grade: string,
  selectedProcesses: string[]
): { 
  score: number
  easyItems: string[]
  hardItems: string[]
  maintenanceCycle: Array<{ item: string; cycle: string; cost: string }>
} {
  const easyItems: string[] = []
  const hardItems: string[] = []
  let score = 0
  
  // 등급별 기본 점수
  if (grade === 'STANDARD') {
    score += 20  // 가장 관리 쉬운 자재 조합
    easyItems.push('강마루 프리미엄 (스크래치 강함)')
    easyItems.push('엔지니어드스톤 (얼룩 방지)')
    easyItems.push('오염방지 벽지')
  } else if (grade === 'ESSENTIAL') {
    score += 15
    easyItems.push('강마루 (물걸레 OK)')
    hardItems.push('인조대리석 (열/스크래치 주의)')
  } else {  // OPUS
    score += 12
    easyItems.push('세라믹 상판 (열/얼룩 강함)')
    hardItems.push('원목마루 (주기적 코팅 필요)')
    hardItems.push('수입도기 (AS 어려움)')
  }
  
  // 공정별 추가 점수/감점
  if (selectedProcesses.includes('바닥재')) {
    if (grade === 'STANDARD') {
      score += 2  // 강마루는 관리 쉬움
    } else if (grade === 'OPUS' && selectedProcesses.includes('원목마루')) {
      score -= 2  // 원목은 관리 필요
    }
  }
  
  if (selectedProcesses.includes('주방')) {
    if (grade === 'STANDARD') {
      score += 2  // 엔지니어드스톤은 관리 쉬움
    } else if (grade === 'OPUS') {
      score += 1  // 세라믹은 좋지만 깨짐 주의
    }
  }
  
  if (selectedProcesses.includes('욕실')) {
    if (grade === 'OPUS') {
      score -= 1  // 수입도기는 AS 어려움
    }
  }
  
  // 예상 유지보수 주기
  const maintenanceCycle = [
    { 
      item: '바닥재 코팅', 
      cycle: grade === 'OPUS' ? '3년마다' : '5년마다',
      cost: grade === 'OPUS' ? '약 50만원' : '약 30만원'
    },
    { 
      item: '벽지 교체', 
      cycle: '7~10년',
      cost: grade === 'OPUS' ? '약 300만원' : '약 150만원'
    },
    { 
      item: '실리콘 보수', 
      cycle: '3~5년',
      cost: '약 10만원'
    },
  ]
  
  return { 
    score: Math.min(25, score), 
    easyItems, 
    hardItems, 
    maintenanceCycle 
  }
}

/**
 * 10년 유지비용 예측
 */
function predict10YearCost(
  grade: string,
  pyeong: number
): { 
  total: number
  breakdown: Array<{ item: string; cost: number; frequency: string }>
} {
  const breakdown: Array<{ item: string; cost: number; frequency: string }> = []
  
  if (grade === 'ESSENTIAL') {
    breakdown.push({ item: '바닥재 코팅', cost: 300000, frequency: '5년 1회' })
    breakdown.push({ item: '벽지 부분 보수', cost: 500000, frequency: '7년 1회' })
    breakdown.push({ item: '실리콘/코킹', cost: 100000, frequency: '3년 1회' })
  } else if (grade === 'STANDARD') {
    breakdown.push({ item: '바닥재 코팅', cost: 300000, frequency: '7년 1회' })
    breakdown.push({ item: '벽지 부분 보수', cost: 300000, frequency: '10년 1회' })
    breakdown.push({ item: '실리콘/코킹', cost: 100000, frequency: '5년 1회' })
  } else {  // OPUS
    breakdown.push({ item: '원목 샌딩/재코팅', cost: 800000, frequency: '5년 1회' })
    breakdown.push({ item: '수입벽지 부분 보수', cost: 500000, frequency: '7년 1회' })
    breakdown.push({ item: '실리콘/코킹', cost: 150000, frequency: '3년 1회' })
  }
  
  // 10년 총 비용 계산
  let total = 0
  breakdown.forEach(item => {
    const years = parseInt(item.frequency.split('년')[0])
    const times = Math.floor(10 / years)
    total += item.cost * times
  })
  
  return { total, breakdown }
}

/**
 * AI 메시지 생성
 */
function generateMaintenanceMessage(
  score: number,
  maintenanceScore: { easyItems: string[]; hardItems: string[] }
): string {
  if (score >= 85) {
    return `유지관리가 매우 쉬운 구성이에요. ${maintenanceScore.easyItems[0] || '관리 쉬운 자재'}로 구성되어 평소 관리 부담이 적어요.`
  }
  if (score >= 70) {
    return `유지관리가 양호한 구성이에요. ${maintenanceScore.easyItems.length > 0 ? '대부분 자재가 관리가 쉬워요' : '기본적인 관리만 하면 돼요'}.`
  }
  if (score >= 55) {
    return `기본적인 유지관리는 가능해요. ${maintenanceScore.hardItems.length > 0 ? `${maintenanceScore.hardItems[0]}은(는) 주의가 필요해요` : '일부 자재는 관리가 필요해요'}.`
  }
  return `일부 자재가 관리가 필요해요. ${maintenanceScore.hardItems.join(', ')}은(는) 주기적 관리를 해주세요.`
}




