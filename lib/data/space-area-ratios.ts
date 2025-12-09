/**
 * 평형대별 공간 면적 비율 데이터
 * 
 * 공간별 면적 비율은 전체 전용면적 대비 백분율(%)
 * 합계: 100%
 */

// 평형대 구간 정의 (전용면적 기준, ㎡)
export interface AreaRange {
  min: number
  max: number | null // null이면 무제한
}

export const AREA_RANGES: Record<string, AreaRange> = {
  '10평대': { min: 40, max: 58 },
  '20평대': { min: 59, max: 83 },
  '30평대': { min: 84, max: 113 },
  '40평대': { min: 114, max: 164 },
  '50평대': { min: 165, max: 230 },
  '60평대+': { min: 231, max: null },
}

// 공간별 면적 비율 (%, 합계 100)
export type SpaceCode = 
  | 'living' 
  | 'kitchen' 
  | 'utility' 
  | 'masterBedroom' 
  | 'kidsBedroom' 
  | 'bathroom' 
  | 'entrance' 
  | 'balcony' 
  | 'dressRoom'

export interface SpaceAreaRatios {
  living: number
  kitchen: number
  utility: number
  masterBedroom: number
  kidsBedroom: number
  bathroom: number
  entrance: number
  balcony: number
  dressRoom: number
}

export const SPACE_AREA_RATIOS: Record<string, SpaceAreaRatios> = {
  '10평대': {
    living: 28,
    kitchen: 15,
    utility: 4,
    masterBedroom: 20,
    kidsBedroom: 15,
    bathroom: 5,
    entrance: 5,
    balcony: 8,
    dressRoom: 0,
  },
  '20평대': {
    living: 26,
    kitchen: 14,
    utility: 4,
    masterBedroom: 18,
    kidsBedroom: 23,
    bathroom: 7,
    entrance: 4,
    balcony: 6,
    dressRoom: 0,
  },
  '30평대': {
    living: 25,
    kitchen: 12,
    utility: 4,
    masterBedroom: 17,
    kidsBedroom: 22,
    bathroom: 8,
    entrance: 4,
    balcony: 6,
    dressRoom: 0,
  },
  '40평대': {
    living: 24,
    kitchen: 11,
    utility: 5,
    masterBedroom: 16,
    kidsBedroom: 29,
    bathroom: 8,
    entrance: 3,
    balcony: 5,
    dressRoom: 5,
  },
  '50평대': {
    living: 23,
    kitchen: 10,
    utility: 5,
    masterBedroom: 15,
    kidsBedroom: 27,
    bathroom: 9,
    entrance: 3,
    balcony: 5,
    dressRoom: 6,
  },
  '60평대+': {
    living: 22,
    kitchen: 9,
    utility: 5,
    masterBedroom: 14,
    kidsBedroom: 25,
    bathroom: 9,
    entrance: 3,
    balcony: 9,
    dressRoom: 6,
  },
}

// 평형대별 기본 방/욕실 개수
export interface DefaultRoomCounts {
  방개수: number
  욕실개수: number
}

export const DEFAULT_ROOM_COUNTS: Record<string, DefaultRoomCounts> = {
  '10평대': { 방개수: 2, 욕실개수: 1 },
  '20평대': { 방개수: 3, 욕실개수: 1 },
  '30평대': { 방개수: 3, 욕실개수: 2 },
  '40평대': { 방개수: 4, 욕실개수: 2 },
  '50평대': { 방개수: 4, 욕실개수: 2 },
  '60평대+': { 방개수: 5, 욕실개수: 3 },
}

/**
 * 전용면적(㎡)로 평형대 판별
 * @param areaM2 전용면적 (㎡)
 * @returns 평형대 키 ('10평대', '20평대', ...)
 */
export function getAreaRangeKey(areaM2: number): string {
  for (const [key, range] of Object.entries(AREA_RANGES)) {
    if (areaM2 >= range.min && (range.max === null || areaM2 <= range.max)) {
      return key
    }
  }
  // 기본값: 가장 큰 평형대
  return '60평대+'
}

/**
 * 평형대별 공간 면적 비율 가져오기
 * @param areaM2 전용면적 (㎡)
 * @returns 공간별 면적 비율 객체
 */
export function getSpaceAreaRatios(areaM2: number): SpaceAreaRatios {
  const rangeKey = getAreaRangeKey(areaM2)
  return SPACE_AREA_RATIOS[rangeKey] || SPACE_AREA_RATIOS['30평대'] // 기본값
}

/**
 * 평형대별 기본 방/욕실 개수 가져오기
 * @param areaM2 전용면적 (㎡)
 * @returns 기본 방/욕실 개수
 */
export function getDefaultRoomCounts(areaM2: number): DefaultRoomCounts {
  const rangeKey = getAreaRangeKey(areaM2)
  return DEFAULT_ROOM_COUNTS[rangeKey] || DEFAULT_ROOM_COUNTS['30평대'] // 기본값
}



