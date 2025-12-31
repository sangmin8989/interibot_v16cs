/**
 * V4 ↔ V3 등급 매핑
 */

import type { GradeV4 } from '../types'

/**
 * 기존 등급 타입
 */
export type LegacyGrade = 'BASIC' | 'STANDARD' | 'ARGEN' | 'PREMIUM'

/**
 * V4 → V3 등급 매핑
 */
export const V4_TO_V3_GRADE: Record<GradeV4, LegacyGrade> = {
  'ARGEN_E': 'BASIC',
  'ARGEN_S': 'ARGEN',
  'ARGEN_O': 'PREMIUM',
}

/**
 * V3 → V4 등급 매핑
 */
export const V3_TO_V4_GRADE: Record<LegacyGrade, GradeV4> = {
  'BASIC': 'ARGEN_E',
  'STANDARD': 'ARGEN_S',
  'ARGEN': 'ARGEN_S',
  'PREMIUM': 'ARGEN_O',
}

/**
 * 등급 메타 정보
 */
import type { GradeInfoV4 } from '../types'

export const GRADE_INFO: Record<GradeV4, GradeInfoV4> = {
  'ARGEN_E': {
    code: 'ARGEN_E',
    name: '아르젠 에이',
    description: '합리적인 가성비',
    legacyGrade: 'BASIC',
    priceMultiplier: 0.85,
  },
  'ARGEN_S': {
    code: 'ARGEN_S',
    name: '아르젠 에스',
    description: '균형 잡힌 품질과 가격',
    legacyGrade: 'ARGEN',
    priceMultiplier: 1.0,
  },
  'ARGEN_O': {
    code: 'ARGEN_O',
    name: '아르젠 오퍼스',
    description: '프리미엄 맞춤형',
    legacyGrade: 'PREMIUM',
    priceMultiplier: 1.25,
  },
}








