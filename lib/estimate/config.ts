/**
 * 평수 기반 견적 엔진 설정
 * v2.1.0: 평수 × 단가 기반 계산
 */

export const PYEONG_TO_M2 = 3.3058 as const

export type UnitType = '평당' | 'm2당'

export type ProcessId =
  | '100'  // 주방/다용도실
  | '200'  // 목공사/가구공사 (전체)
  | '210'  // 문틀/문짝
  | '220'  // 붙박이장
  | '230'  // 거실수납장
  | '240'  // 아일랜드/주방가구
  | '250'  // 기타 맞춤가구
  | '300'  // 전기/통신
  | '400'  // 욕실/수전
  | '500'  // 타일/석재
  | '600'  // 도장/마감
  | '700'  // 필름/시트
  | '800'  // 창호/샤시
  | '900'  // 도배/벽지
  | '1000' // 철거/폐기

export interface CostRule {
  unit: UnitType
  costPerUnit: number // 평당 또는 m2당 단가
}

/**
 * 공정별 평수/제곱미터 단가 테이블
 * 실제 아르젠 견적 기준으로 조정
 */
export const COST_TABLE: Record<ProcessId, CostRule> = {
  '100': { unit: '평당', costPerUnit: 150_000 },  // 주방/다용도실
  '200': { unit: '평당', costPerUnit: 195_000 },  // 목공사/가구공사 (210+220+230+240+250 합산)
  '210': { unit: '평당', costPerUnit: 30_000 },   // 문틀/문짝
  '220': { unit: '평당', costPerUnit: 45_000 },   // 붙박이장
  '230': { unit: '평당', costPerUnit: 35_000 },   // 거실수납장
  '240': { unit: '평당', costPerUnit: 55_000 },   // 아일랜드/주방가구
  '250': { unit: '평당', costPerUnit: 30_000 },   // 기타 맞춤가구
  '300': { unit: '평당', costPerUnit: 80_000 },   // 전기/통신
  '400': { unit: '평당', costPerUnit: 90_000 },   // 욕실/수전
  '500': { unit: 'm2당', costPerUnit: 45_000 },   // 타일/석재
  '600': { unit: '평당', costPerUnit: 30_000 },   // 도장/마감
  '700': { unit: '평당', costPerUnit: 20_000 },   // 필름/시트
  '800': { unit: '평당', costPerUnit: 120_000 },  // 창호/샤시
  '900': { unit: '평당', costPerUnit: 25_000 },   // 도배/벽지
  '1000': { unit: '평당', costPerUnit: 50_000 },  // 철거/폐기
}

/**
 * 성향 ID 타입
 */
export type TraitId =
  | 'T01' | 'T02' | 'T03' | 'T04' | 'T05'
  | 'T06' | 'T07' | 'T08' | 'T09' | 'T10'
  | 'T11' | 'T12' | 'T13' | 'T14' | 'T15'

/**
 * 공정별 성향 영향
 */
export interface TraitImpact {
  process: ProcessId
  weight_low: number   // 0-30점 구간 가중치 (%)
  weight_mid: number   // 31-70점 구간 가중치 (%)
  weight_high: number  // 71-100점 구간 가중치 (%)
}

/**
 * 성향 가중치 정의
 */
export interface TraitWeight {
  trait_id: TraitId
  impacts: TraitImpact[]
}

/**
 * 성향 가중치 매트릭스
 * 동일 공정에 대해 여러 trait이 영향을 줄 수 있지만, 최댓값만 적용 (max-only 전략)
 */
export const WEIGHT_MATRIX: TraitWeight[] = [
  {
    trait_id: 'T01', // 공간 감각
    impacts: [
      { process: '220', weight_low: 0, weight_mid: 3, weight_high: 8 },   // 붙박이장
      { process: '230', weight_low: 0, weight_mid: 2, weight_high: 5 },   // 거실수납장
      { process: '240', weight_low: 0, weight_mid: 4, weight_high: 10 },  // 아일랜드/주방가구
    ],
  },
  {
    trait_id: 'T04', // 청소 성향
    impacts: [
      { process: '400', weight_low: 0, weight_mid: 2, weight_high: 5 },   // 욕실
      { process: '500', weight_low: 0, weight_mid: 1, weight_high: 3 },   // 타일
      { process: '600', weight_low: 0, weight_mid: 2, weight_high: 4 },   // 도장
    ],
  },
  {
    trait_id: 'T05', // 정리정돈 습관
    impacts: [
      { process: '220', weight_low: 0, weight_mid: 6, weight_high: 12 },   // 붙박이장
      { process: '230', weight_low: 0, weight_mid: 5, weight_high: 10 },   // 거실수납장
      { process: '240', weight_low: 0, weight_mid: 3, weight_high: 8 },    // 아일랜드/주방가구
      { process: '250', weight_low: 0, weight_mid: 4, weight_high: 9 },   // 기타 맞춤가구
    ],
  },
  {
    trait_id: 'T06', // 가족 구성
    impacts: [
      { process: '220', weight_low: 0, weight_mid: 2, weight_high: 6 },   // 붙박이장
      { process: '230', weight_low: 0, weight_mid: 3, weight_high: 7 },   // 거실수납장
      { process: '400', weight_low: 0, weight_mid: 1, weight_high: 4 },   // 욕실
    ],
  },
  {
    trait_id: 'T11', // 집 사용 목적
    impacts: [
      { process: '230', weight_low: 0, weight_mid: 2, weight_high: 5 },   // 거실수납장
      { process: '240', weight_low: 0, weight_mid: 3, weight_high: 7 },   // 아일랜드/주방가구
      { process: '100', weight_low: 0, weight_mid: 2, weight_high: 6 },   // 주방
    ],
  },
  {
    trait_id: 'T13', // 활동량·동선
    impacts: [
      { process: '100', weight_low: 0, weight_mid: 2, weight_high: 5 },   // 주방
      { process: '230', weight_low: 0, weight_mid: 1, weight_high: 4 },   // 거실수납장
      { process: '240', weight_low: 0, weight_mid: 3, weight_high: 8 },   // 아일랜드/주방가구
    ],
  },
  {
    trait_id: 'T14', // 수면 패턴
    impacts: [
      { process: '220', weight_low: 0, weight_mid: 1, weight_high: 3 },   // 붙박이장
      { process: '800', weight_low: 0, weight_mid: 2, weight_high: 5 },   // 창호/샤시 (방음)
    ],
  },
  {
    trait_id: 'T15', // 전체 생활 루틴
    impacts: [
      { process: '100', weight_low: 0, weight_mid: 2, weight_high: 5 },   // 주방
      { process: '230', weight_low: 0, weight_mid: 1, weight_high: 4 },   // 거실수납장
    ],
  },
]

/**
 * 공정 코드 → 한글명 매핑
 */
export const PROCESS_NAMES: Record<ProcessId, string> = {
  '100': '주방/다용도실 공사',
  '200': '목공사/가구공사',
  '210': '문틀/문짝',
  '220': '붙박이장',
  '230': '거실수납장',
  '240': '아일랜드/주방가구',
  '250': '기타 맞춤가구',
  '300': '전기/통신공사',
  '400': '욕실/수전공사',
  '500': '타일/석재공사',
  '600': '도장/마감공사',
  '700': '필름/시트공사',
  '800': '창호/샤시공사',
  '900': '도배/벽지공사',
  '1000': '철거/폐기공사',
}

