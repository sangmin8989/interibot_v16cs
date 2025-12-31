/**
 * 6대 지수 리포트 통합 계산기
 * 
 * 모든 지수를 계산하고 종합 리포트를 생성하는 메인 진입점
 */

import type { 
  ReportInput, 
  ReportResult, 
  ProcessType, 
  HousingType, 
  MaterialGrade, 
  StyleType, 
  FamilyType,
  Lifestyle
} from './types'
import { calculateHomeValueIndex } from './homeValueCalculator'
import { calculateLifeQualityIndex } from './lifeQualityCalculator'
import { calculateSpaceEfficiencyIndex } from './spaceEfficiencyCalculator'
import { calculateMaintenanceIndex } from './maintenanceCalculator'
import { calculateEnergyEfficiencyIndex } from './energyCalculator'
import { calculateInvestmentEfficiencyIndex } from './investmentCalculator'
import { generateOverallMessage, generate5YearScenario, generateReportSummary as generateReportSummaryMessage } from './reportMessageGenerator'

/**
 * 전체 리포트 계산
 */
export function calculateReport(input: ReportInput): ReportResult {
  // 1. 집값 방어지수
  const homeValue = calculateHomeValueIndex(input)
  
  // 2. 생활 안정지수
  const lifeQuality = calculateLifeQualityIndex(input)
  
  // 3. 공간 효율지수
  const spaceEfficiency = calculateSpaceEfficiencyIndex(input)
  
  // 4. 유지관리 용이도
  const maintenance = calculateMaintenanceIndex(input)
  
  // 5. 에너지 효율지수
  const energy = calculateEnergyEfficiencyIndex(input)
  
  // 6. 투자 효율지수
  const investment = calculateInvestmentEfficiencyIndex(input)
  
  // 점수 모음
  const scores = {
    homeValue: homeValue.score,
    lifeQuality: lifeQuality.score,
    spaceEfficiency: spaceEfficiency.score,
    maintenance: maintenance.score,
    energy: energy.score,
    investment: investment.score,
  }
  
  // 종합 메시지 생성
  const overallMessage = generateOverallMessage(
    scores,
    input.grade,
    input.spaceInfo,
    input.lifestyle
  )
  
  // 5년 후 시나리오
  const fiveYearScenario = generate5YearScenario(
    input.totalBudget || 0,
    scores,
    input.lifestyle
  )
  
  // 강점/약점 파악
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const strongest = sortedScores[0][0]
  const weakest = sortedScores[sortedScores.length - 1][0]
  
  const strengthNames: Record<string, string> = {
    homeValue: '집값 방어',
    lifeQuality: '생활 개선',
    spaceEfficiency: '공간 활용',
    maintenance: '유지관리',
    energy: '에너지 절감',
    investment: '투자 효율'
  }
  
  // 종합 점수 계산
  const totalScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 6)
  
  return {
    homeValue,
    lifeQuality,
    spaceEfficiency,
    maintenance,
    energy,
    investment,
    overall: {
      totalScore,
      message: overallMessage,
      strongest: strengthNames[strongest],
      weakest: strengthNames[weakest],
      fiveYearScenario,
    },
  }
}

/**
 * 리포트 요약 생성 (간소화 버전)
 */
export function generateReportSummary(result: ReportResult) {
  return generateReportSummaryMessage(result)
}

/**
 * 특정 지수만 계산 (선택적 사용)
 */
export function calculateSingleIndex(
  indexName: 'homeValue' | 'lifeQuality' | 'spaceEfficiency' | 'maintenance' | 'energy' | 'investment',
  input: ReportInput
) {
  switch (indexName) {
    case 'homeValue':
      return calculateHomeValueIndex(input)
    case 'lifeQuality':
      return calculateLifeQualityIndex(input)
    case 'spaceEfficiency':
      return calculateSpaceEfficiencyIndex(input)
    case 'maintenance':
      return calculateMaintenanceIndex(input)
    case 'energy':
      return calculateEnergyEfficiencyIndex(input)
    case 'investment':
      return calculateInvestmentEfficiencyIndex(input)
    default:
      throw new Error(`Unknown index: ${indexName}`)
  }
}

/**
 * 리포트 입력 데이터 검증
 */
export function validateReportInput(input: Partial<ReportInput>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!input.spaceInfo) {
    errors.push('공간 정보가 필요합니다')
  } else {
    if (!input.spaceInfo.housingType) {
      errors.push('주거 형태가 필요합니다')
    }
    if (!input.spaceInfo.pyeong || input.spaceInfo.pyeong <= 0) {
      errors.push('평수가 필요합니다')
    }
  }
  
  if (!input.selectedProcesses || input.selectedProcesses.length === 0) {
    errors.push('선택된 공정이 필요합니다')
  }
  
  if (!input.grade) {
    errors.push('자재 등급이 필요합니다')
  }
  
  if (!input.lifestyle) {
    errors.push('라이프스타일 정보가 필요합니다')
  } else {
    if (!input.lifestyle.cookingFrequency) {
      errors.push('요리 빈도가 필요합니다')
    }
    if (!input.lifestyle.cleaningStyle) {
      errors.push('청소 성향이 필요합니다')
    }
    if (!input.lifestyle.noiseSensitivity) {
      errors.push('소음 민감도가 필요합니다')
    }
  }
  
  if (!input.familyType) {
    errors.push('가족 구성이 필요합니다')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 리포트 입력 데이터 변환 헬퍼
 * (기존 SpaceInfo 등에서 ReportInput으로 변환)
 */
export function convertToReportInput(data: {
  spaceInfo?: any
  selectedProcesses?: string[]
  grade?: string
  style?: string
  lifestyle?: any
  familyType?: string
  options?: string[]
  totalBudget?: number
  processBreakdown?: Array<{ process: string; cost: number }>
  [key: string]: any
}): ReportInput {
  const input: ReportInput = {
    spaceInfo: {
      housingType: (data.spaceInfo?.housingType || '아파트') as HousingType,
      pyeong: data.spaceInfo?.pyeong || 0,
    },
    selectedProcesses: (data.selectedProcesses || []) as ProcessType[],
    grade: (data.grade || 'STANDARD') as MaterialGrade,
    style: (data.style || '모던') as StyleType,
    lifestyle: {
      cookingFrequency: (data.lifestyle?.cookingFrequency || 'sometimes') as Lifestyle['cookingFrequency'],
      cleaningStyle: (data.lifestyle?.cleaningStyle || 'daily') as Lifestyle['cleaningStyle'],
      noiseSensitivity: (data.lifestyle?.noiseSensitivity || 'medium') as Lifestyle['noiseSensitivity'],
      socialFrequency: (data.lifestyle?.socialFrequency || 'sometimes') as Lifestyle['socialFrequency'],
    },
    familyType: (data.familyType || '2인') as FamilyType,
    options: (data.options || []) as string[],
    totalBudget: data.totalBudget,
    processBreakdown: data.processBreakdown,
    structuralChange: data.structuralChange,
    personalStyle: data.personalStyle,
    hasSash: data.hasSash,
    sashType: data.sashType as any,
    hasDoor: data.hasDoor,
    doorType: data.doorType as any,
    floorType: data.floorType,
    colorTone: data.colorTone,
    kitchenGrade: data.kitchenGrade as any,
  }
  
  return input
}




