/**
 * 에너지 효율지수 계산기
 * 
 * 단열, 조명 등으로 인한 에너지 절감 효과 측정
 */

import type { ReportInput, EnergyEfficiencyResult } from './types'

/**
 * 에너지 효율지수 계산
 */
export function calculateEnergyEfficiencyIndex(input: ReportInput): EnergyEfficiencyResult {
  const baseScore = 30
  
  // 1. 샤시 단열 점수 (0~35점)
  // 2. 조명 효율 점수 (0~15점)
  // 3. 냉난방 점수 (0~20점)
  const energyScore = calculateEnergyScore(
    input.hasSash || false,
    input.sashType || '',
    input.options?.includes('LED') || false,
    input.options?.includes('시스템에어컨') || false,
    input.spaceInfo.pyeong
  )
  
  // 합계 계산
  const totalScore = baseScore + energyScore.score
  
  // 최소/최대 점수 제한
  const finalScore = Math.max(30, Math.min(100, totalScore))
  
  // 투자 회수 기간 계산 (샤시/단열 투자금 추정)
  const investedInEnergy = estimateEnergyInvestment(input)
  const paybackPeriod = calculatePaybackPeriod(investedInEnergy, energyScore.annualSaving)
  
  // AI 메시지 생성
  const message = generateEnergyMessage(finalScore, energyScore.annualSaving, paybackPeriod)
  
  return {
    score: Math.round(finalScore),
    annualSaving: energyScore.annualSaving,
    details: energyScore.details,
    paybackPeriod,
    message,
  }
}

/**
 * 에너지 점수 계산
 */
function calculateEnergyScore(
  hasSash: boolean,
  sashType: string,
  hasLED: boolean,
  hasSystemAC: boolean,
  pyeong: number
): {
  score: number
  annualSaving: number
  details: Array<{ item: string; saving: number; reason: string }>
} {
  let score = 0
  let annualSaving = 0
  const details: Array<{ item: string; saving: number; reason: string }> = []
  
  // 샤시
  if (hasSash) {
    if (sashType === '시스템') {
      score += 35
      const saving = Math.round(pyeong * 23000)  // 평당 약 2.3만원 절감
      annualSaving += saving
      details.push({
        item: '시스템창호',
        saving,
        reason: '냉난방비 약 50% 절감, 완벽한 단열'
      })
    } else if (sashType === '이중') {
      score += 25
      const saving = Math.round(pyeong * 14000)  // 평당 약 1.4만원 절감
      annualSaving += saving
      details.push({
        item: '이중샤시',
        saving,
        reason: '냉난방비 약 30% 절감'
      })
    } else {
      score += 10
      details.push({
        item: '일반 샤시',
        saving: 0,
        reason: '기본 단열 효과'
      })
    }
  } else {
    score += 5
    details.push({
      item: '기존 샤시 유지',
      saving: 0,
      reason: '샤시 업그레이드 시 연간 45만원 이상 절감 가능'
    })
  }
  
  // LED 조명
  if (hasLED) {
    score += 15
    const saving = Math.round(pyeong * 5000)  // 평당 약 5천원 절감
    annualSaving += saving
    details.push({
      item: 'LED 조명',
      saving,
      reason: '전기료 약 60% 절감'
    })
  }
  
  // 시스템 에어컨
  if (hasSystemAC) {
    score += 15
    const saving = Math.round(pyeong * 8000)
    annualSaving += saving
    details.push({
      item: '시스템 에어컨',
      saving,
      reason: '인버터로 냉방비 30% 절감'
    })
  }
  
  return { 
    score: Math.min(70, score),  // 최대 70점 (기본 30점 + 70점 = 100점)
    annualSaving, 
    details 
  }
}

/**
 * 에너지 투자금 추정
 */
function estimateEnergyInvestment(input: ReportInput): number {
  let investment = 0
  
  // 샤시 투자금 추정
  if (input.hasSash) {
    if (input.sashType === '시스템') {
      investment += input.spaceInfo.pyeong * 1500000  // 평당 약 150만원
    } else if (input.sashType === '이중') {
      investment += input.spaceInfo.pyeong * 800000  // 평당 약 80만원
    }
  }
  
  // LED 조명 투자금 추정
  if (input.options?.includes('LED')) {
    investment += input.spaceInfo.pyeong * 200000  // 평당 약 20만원
  }
  
  // 시스템 에어컨 투자금 추정
  if (input.options?.includes('시스템에어컨')) {
    investment += input.spaceInfo.pyeong * 1000000  // 평당 약 100만원
  }
  
  return investment
}

/**
 * 투자 회수 기간 계산
 */
function calculatePaybackPeriod(
  investedInEnergy: number,
  annualSaving: number
): { years: number; message: string } {
  if (annualSaving === 0) {
    return { years: 0, message: '에너지 절감 투자가 없어 회수 기간 없음' }
  }
  
  const years = Math.round(investedInEnergy / annualSaving * 10) / 10
  
  let message: string
  if (years <= 3) {
    message = `${years}년이면 투자금 회수! 아주 효율적인 투자예요`
  } else if (years <= 5) {
    message = `${years}년이면 투자금 회수. 합리적인 투자예요`
  } else if (years <= 8) {
    message = `${years}년 후 투자금 회수. 장기 거주 시 이득이에요`
  } else {
    message = `회수 기간이 ${years}년으로 길어요. 단열보다 생활 편의 목적으로 보세요`
  }
  
  return { years, message }
}

/**
 * AI 메시지 생성
 */
function generateEnergyMessage(
  score: number,
  annualSaving: number,
  paybackPeriod: { years: number; message: string }
): string {
  if (score >= 85) {
    return `에너지 효율이 매우 뛰어나요. 연간 약 ${(annualSaving / 10000).toFixed(0)}만원 절감되고, ${paybackPeriod.message}`
  }
  if (score >= 70) {
    return `에너지 효율이 양호해요. 연간 약 ${(annualSaving / 10000).toFixed(0)}만원 절감됩니다. ${paybackPeriod.years > 0 ? paybackPeriod.message : ''}`
  }
  if (score >= 55) {
    return `기본적인 에너지 효율은 확보됐어요. 샤시나 조명 업그레이드로 더 절감할 수 있어요.`
  }
  return `에너지 효율 개선 여지가 있어요. 샤시 업그레이드나 LED 조명으로 전기료를 줄일 수 있어요.`
}




