/**
 * 6대 지수 리포트 - 메인 진입점
 * 
 * 모든 계산기와 타입을 export
 */

// 타입
export type * from './types'

// 계산기
export { calculateReport, calculateSingleIndex, validateReportInput, convertToReportInput } from './reportCalculator'
export { calculateHomeValueIndex } from './homeValueCalculator'
export { calculateLifeQualityIndex } from './lifeQualityCalculator'
export { calculateSpaceEfficiencyIndex } from './spaceEfficiencyCalculator'
export { calculateMaintenanceIndex } from './maintenanceCalculator'
export { calculateEnergyEfficiencyIndex } from './energyCalculator'
export { calculateInvestmentEfficiencyIndex } from './investmentCalculator'

// 메시지 생성기
export { generateOverallMessage, generate5YearScenario, generateReportSummary } from './reportMessageGenerator'




