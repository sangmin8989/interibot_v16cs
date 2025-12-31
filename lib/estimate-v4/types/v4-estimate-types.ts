/**
 * V4 견적 엔진 타입 정의
 * 
 * 사용법:
 * import type { V4EstimateResult, V4GradeOption } from './v4-estimate-types'
 */

// V4 등급 타입
export type V4Grade = 'ARGEN_E' | 'ARGEN_S' | 'ARGEN_O'

// V4 등급 옵션 (UI 선택용)
export interface V4GradeOption {
  value: V4Grade
  label: string
  description: string
  priceMultiplier: number
}

// V4 등급 옵션 목록
export const GRADE_OPTIONS_V4: V4GradeOption[] = [
  {
    value: 'ARGEN_E',
    label: 'ARGEN 에이',
    description: '합리적인 가성비',
    priceMultiplier: 0.85,
  },
  {
    value: 'ARGEN_S',
    label: 'ARGEN 에스',
    description: '균형 잡힌 품질과 가격',
    priceMultiplier: 1.0,
  },
  {
    value: 'ARGEN_O',
    label: 'ARGEN 오퍼스',
    description: '프리미엄 맞춤형',
    priceMultiplier: 1.25,
  },
]

// V4 자재 정보
export interface V4Material {
  name: string
  quantity: string
  unitPrice: string
  totalPrice: string
}

// V4 노무 정보
export interface V4Labor {
  type: string
  amount: string
}

// V4 공정별 내역
export interface V4ProcessBreakdown {
  processName: string
  amount: string
  percentage: number
  materials: V4Material[]
  labor: V4Labor | null
}

// V4 성향 매칭 정보
export interface V4PersonalityMatch {
  score: number
  highlights: string[]
}

// V4 견적 총액 정보
export interface V4Total {
  formatted: string  // "3,000만원"
  perPyeong: string  // "평당 100만원"
}

// V4 견적 결과 (메인)
export interface V4EstimateResult {
  isSuccess: boolean
  grade: V4Grade
  gradeName: string
  total: V4Total
  breakdown: V4ProcessBreakdown[]
  personalityMatch: V4PersonalityMatch
  warnings: string[]
  errorMessage?: string
}

// V4 API 요청 데이터 구조
export interface V4EstimateRequest {
  spaceInfo: {
    housingType: 'apartment' | 'villa' | 'house' | 'officetel'
    pyeong: number
    rooms: number
    bathrooms: number
    buildingAge?: number
  }
  preferences: {
    budget: {
      min: number
      max: number
      flexibility: 'strict' | 'flexible' | 'uncertain'
    }
    family: {
      totalPeople: number
      hasInfant: boolean
      hasChild: boolean
      hasElderly: boolean
      hasPet: boolean
    }
    lifestyle: {
      remoteWork: boolean
      cookOften: boolean
      guestsOften: boolean
    }
    purpose: 'live' | 'sell' | 'rent'
  }
  selectedSpaces: string[]
  selectedProcesses: Record<string, string[]>
  answers: Array<{
    questionId: string
    answerId: string
    value: string
  }>
  timestamp: string
}

// 등급명 가져오기 헬퍼 함수
export function getGradeName(grade: V4Grade): string {
  const option = GRADE_OPTIONS_V4.find(opt => opt.value === grade)
  return option?.label || grade
}

// 등급 설명 가져오기 헬퍼 함수
export function getGradeDescription(grade: V4Grade): string {
  const option = GRADE_OPTIONS_V4.find(opt => opt.value === grade)
  return option?.description || ''
}








