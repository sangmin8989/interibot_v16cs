/**
 * V4 입력 타입 정의
 * 
 * 공간 정보, 사용자 답변, 선호 설정을 포함한 통합 입력 타입
 */

/**
 * 공간 정보 입력
 * - 사용자가 입력한 집 정보
 */
export interface SpaceInfoV4 {
  /** 주거 유형: 아파트, 빌라, 주택, 오피스텔 */
  housingType: 'apartment' | 'villa' | 'house' | 'officetel'
  
  /** 평수 (전용면적 기준) */
  pyeong: number
  
  /** 방 개수 */
  rooms: number
  
  /** 화장실 개수 */
  bathrooms: number
  
  /** 건물 연식 (년) - 선택 */
  buildingAge?: number
  
  /** 층수 - 선택 */
  floor?: number
}

/**
 * 사용자 답변
 * - 성향 분석 질문에 대한 답변
 */
export interface UserAnswerV4 {
  /** 질문 ID */
  questionId: string
  
  /** 답변 ID */
  answerId: string
  
  /** 답변 값 (숫자, 문자열, 불리언) */
  value: number | string | boolean
}

/**
 * 사용자 선호 설정
 */
export interface PreferencesV4 {
  /** 예산 정보 */
  budget: {
    /** 최소 예산 (원) */
    min: number
    /** 최대 예산 (원) */
    max: number
    /** 예산 유연성 */
    flexibility: 'strict' | 'flexible' | 'uncertain'
  }
  
  /** 가족 구성 */
  family: {
    /** 총 거주 인원 */
    totalPeople: number
    /** 영유아 유무 (0-3세) */
    hasInfant: boolean
    /** 어린이 유무 (4-12세) */
    hasChild: boolean
    /** 노인 유무 (65세 이상) */
    hasElderly: boolean
    /** 반려동물 유무 */
    hasPet: boolean
  }
  
  /** 생활 패턴 */
  lifestyle: {
    /** 재택근무 여부 */
    remoteWork: boolean
    /** 자주 요리하는지 */
    cookOften: boolean
    /** 손님 자주 오는지 */
    guestsOften: boolean
  }
  
  /** 거주 목적 */
  purpose: 'live' | 'sell' | 'rent'
}

/**
 * V4 통합 입력
 * - 모든 입력을 하나로 모은 객체
 */
export interface CollectedInputV4 {
  /** 공간 정보 */
  spaceInfo: SpaceInfoV4
  
  /** 성향 질문 답변 목록 */
  answers: UserAnswerV4[]
  
  /** 사용자 선호 설정 */
  preferences: PreferencesV4
  
  /** 선택된 공간 목록 (예: ['kitchen', 'bathroom']) */
  selectedSpaces: string[]
  
  /** 선택된 공정 (공간별) */
  selectedProcesses: Record<string, string[]>
  
  /** 입력 수집 시각 */
  timestamp: string
}

