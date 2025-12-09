/**
 * 견적 계산 API TypeScript 인터페이스 정의
 */

// 성향 점수 (15개 항목)
export interface TraitScores {
  T01: number // 공간 감각
  T02: number // 시각 민감도
  T03: number // 청각 민감도
  T04: number // 청소 성향
  T05: number // 정리정돈 습관
  T06: number // 가족 구성
  T07: number // 건강 요소
  T08: number // 예산 감각
  T09: number // 색감 취향
  T10: number // 조명 취향
  T11: number // 집 사용 목적
  T12: number // 불편 요소
  T13: number // 활동 동선
  T14: number // 수면 패턴
  T15: number // 취미·라이프스타일
}

// 요청 타입
export interface EstimateRequest {
  size: number // 평형
  projectType: 'full' | 'partial' // 전체/부분 공사
  region: 'seoul' | 'gyeonggi' | 'local' // 지역
  apartmentType: 'apartment' | 'officetel' | 'villa' // 주거 유형
  traitScores: TraitScores // 성향 점수 (15개 항목, 각 0-100)
  selectedProcesses?: string[] // 부분 공사 시 선택한 공정 코드
  budget?: number // 희망 예산 (선택)
}

// 응답 타입
export interface EstimateResponse {
  success: boolean
  grade: 'basic' | 'standard' | 'premium' // 견적 등급
  summary: {
    directCost: number // 직접 공사비
    indirectCost: number // 간접 공사비
    indirectCostDetails: {
      산재보험료: number
      고용보험료: number
      공과잡비: number
      기업이윤: number
    }
    totalBeforeVAT: number // VAT 전 총액
    vat: number // 부가세 (10%)
    totalWithVAT: number // 최종 금액
    perPyPrice: number // 평당 단가
  }
  processes: ProcessDetail[] // 공정별 상세
  argenRecommendations: ArgenItem[] // 아르젠 추천 항목
  traitInsights: string[] // 성향 기반 조언
  schedule: {
    estimatedDays: number // 예상 총 일수
    processSchedule: {
      processName: string // 공정명
      days: number // 일수
    }[]
  }
  budgetOverage?: {
    isOver: boolean
    overage: number
    percentage: number
  }
  adjustmentSuggestion?: {
    type: 'GRADE_DOWNGRADE' | 'PROCESS_SELECTION' | 'SCOPE_REDUCTION' | 'BUDGET_RESET'
    currentGrade?: string
    newGrade?: string
    excludeList?: Array<{ code: string; name: string; subtotal: number }>
    message: string
  }
}

// 공정별 상세
export interface ProcessDetail {
  code: string // 공정 코드 (예: "100")
  name: string // 공정명 (예: "주방/다용도실 공사")
  items: ItemDetail[] // 세부 항목
  subtotal: number // 공정 소계
  weightApplied: number // 적용된 가중치 (%)
  traitInfluence: string[] // 영향을 준 성향
}

// 항목 상세
export interface ItemDetail {
  itemCode: string // 항목 코드 (예: "101")
  itemName: string // 항목명 (예: "싱크대 하부장")
  spec: string // 규격 (예: "6000mm")
  unit: string // 단위 (예: "m")
  quantity: number // 수량
  unitPrice: number // 단가
  amount: number // 금액
  isArgenMake: boolean // 아르젠 제작 가능 여부
  isRecommended: boolean // 추천 여부
}

// 아르젠 추천 항목
export interface ArgenItem {
  itemCode: string // 항목 코드
  itemName: string // 항목명
  spec: string // 규격
  argenPrice: number // 아르젠 가격
  brandAlternatives: {
    brandName: string // 브랜드명
    price: number // 가격
  }[]
  savings: number // 절감액
  savingsPercent: number // 절감률 (%)
  reason: string // 추천 이유
}

