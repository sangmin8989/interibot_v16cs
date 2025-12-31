/**
 * 6대 지수 리포트 - 공통 타입 정의
 */

// 주거 형태
export type HousingType = '아파트' | '오피스텔' | '빌라' | '단독주택' | '상가' | '사무실'

// 자재 등급
export type MaterialGrade = 'OPUS' | 'STANDARD' | 'ESSENTIAL'

// 공정 타입
export type ProcessType = 
  | '주방' | '욕실' | '바닥재' | '샤시' | '도배' | '조명' 
  | '붙박이장' | '중문' | '도장' | '필름' | '가구' | '에어컨' | '커튼' | '블라인드'
  | '드레스룸' | '신발장' | '수납'

// 라이프스타일
export interface Lifestyle {
  cookingFrequency: 'daily' | 'often' | 'sometimes' | 'rarely'  // 요리 빈도
  cleaningStyle: 'lazy' | 'daily' | 'robot'  // 청소 성향
  noiseSensitivity: 'high' | 'medium' | 'low'  // 소음 민감도
  socialFrequency?: 'daily' | 'often' | 'sometimes' | 'rarely'  // 손님 빈도
}

// 가족 구성
export type FamilyType = 
  | '1인' 
  | '2인' 
  | '신혼' 
  | '3~4인' 
  | '3~4인+아이' 
  | '5인+' 
  | '반려동물'

// 스타일
export type StyleType = 
  | '모던' 
  | '내추럴' 
  | '북유럽' 
  | '미니멀' 
  | '클래식' 
  | '빈티지' 
  | '인더스트리얼'

// 리포트 입력 데이터
export interface ReportInput {
  // 공간 정보
  spaceInfo: {
    housingType: HousingType
    pyeong: number
  }
  
  // 선택된 공정
  selectedProcesses: ProcessType[]
  
  // 자재 등급
  grade: MaterialGrade
  
  // 스타일
  style?: StyleType
  
  // 라이프스타일
  lifestyle: Lifestyle
  
  // 가족 구성
  familyType: FamilyType
  
  // 추가 옵션
  options?: string[]  // 예: '스마트홈', '자동중문', '빌트인', '시스템에어컨', 'USB콘센트', '서재', '작업공간', '안전마감', '모서리처리', '조광', '색온도'
  
  // 예산 정보
  totalBudget?: number
  processBreakdown?: { process: string; cost: number }[]
  
  // 감점 요소
  structuralChange?: boolean  // 구조 변경
  personalStyle?: boolean  // 화려한 개인 취향
  
  // 샤시/중문 정보
  hasSash?: boolean
  sashType?: '이중' | '시스템' | '일반'
  hasDoor?: boolean
  doorType?: '자동' | '슬림' | '일반'
  
  // 바닥재/색상 정보
  floorType?: string  // '강마루', '원목마루', '장판'
  colorTone?: string  // '그레이', '베이지', '밝은색'
  
  // 주방 등급 (공정별로 다를 수 있음)
  kitchenGrade?: MaterialGrade
}

// 집값 방어지수 결과
export interface HomeValueResult {
  score: number  // 30~100
  factors: {
    housingType: { score: number; reason: string }
    size: { score: number; reason: string }
    processes: { score: number; reason: string }
    grade: { score: number; reason: string }
    style: { score: number; reason: string }
  }
  deductions: { item: string; deduction: number; reason: string }[]
  topFactor: string
  weakFactor: string
  futureValue: {
    expectedReturn: number
    returnRate: number
    message: string
  }
  message: string
}

// 생활 안정지수 결과
export interface LifeQualityResult {
  score: number  // 30~100
  factors: {
    lifestyleMatch: { score: number; details: any[] }
    familyMatch: { score: number; message: string; improvement: string }
    health: { score: number; factors: { item: string; score: number; reason: string }[] }
    convenience: { score: number; features: string[] }
  }
  lifeChanges: {
    category: string
    before: string
    after: string
    changePercent: number
    unit: string
  }[]
  message: string
}

// 공간 효율지수 결과
export interface SpaceEfficiencyResult {
  score: number  // 40~100
  factors: {
    storage: { score: number; details: { item: string; score: number; capacity: string }[] }
    familySpace: { score: number; spacePerPerson: number; evaluation: string }
    spaceUtilization: { score: number; items: string[] }
  }
  message: string
}

// 유지관리 용이도 결과
export interface MaintenanceResult {
  score: number  // 40~100
  easyItems: string[]
  hardItems: string[]
  maintenanceCycle: { item: string; cycle: string; cost: string }[]
  tenYearCost: {
    total: number
    breakdown: { item: string; cost: number; frequency: string }[]
  }
  message: string
}

// 에너지 효율지수 결과
export interface EnergyEfficiencyResult {
  score: number  // 30~100
  annualSaving: number
  details: { item: string; saving: number; reason: string }[]
  paybackPeriod: {
    years: number
    message: string
  }
  message: string
}

// 투자 효율지수 결과
export interface InvestmentEfficiencyResult {
  score: number  // 40~100
  budgetAllocation: {
    score: number
    analysis: {
      process: string
      recommended: string
      actual: string
      evaluation: string
      score: number
    }[]
  }
  wastePrevention: {
    score: number
    goodDecisions: string[]
    wastefulDecisions: string[]
  }
  message: string
}

// 전체 리포트 결과
export interface ReportResult {
  homeValue: HomeValueResult
  lifeQuality: LifeQualityResult
  spaceEfficiency: SpaceEfficiencyResult
  maintenance: MaintenanceResult
  energy: EnergyEfficiencyResult
  investment: InvestmentEfficiencyResult
  overall: {
    totalScore: number
    message: string
    strongest: string
    weakest: string
    fiveYearScenario: string
  }
}




