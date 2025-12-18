/**
 * V3 ↔ V4 위험 코드 매핑
 */

/**
 * V3 심각도 → 점수 매핑
 */
export const RISK_SEVERITY_MAP: Record<string, number> = {
  'low': 10,
  'medium': 25,
  'high': 50,
}

/**
 * 후회위험 코드 및 설명
 */
export const REGRET_RISK_CODES = {
  'first_time_buyer': {
    message: '첫 인테리어 경험으로 예상치 못한 상황이 발생할 수 있습니다.',
    severity: 'medium' as const,
    bufferAdd: 3,
  },
  'tight_budget': {
    message: '예산 여유가 없어 추가 비용 발생 시 어려움이 있을 수 있습니다.',
    severity: 'medium' as const,
    bufferAdd: 2,
  },
  'unclear_style': {
    message: '스타일이 미정이면 시공 중 변경이 발생할 수 있습니다.',
    severity: 'low' as const,
    bufferAdd: 1,
  },
  'old_building': {
    message: '20년 이상 건물은 숨은 하자 발견 확률이 높습니다.',
    severity: 'high' as const,
    bufferAdd: 5,
  },
  'large_family': {
    message: '가족 구성원이 많아 의견 조율이 필요합니다.',
    severity: 'low' as const,
    bufferAdd: 1,
  },
  'joint_decision': {
    message: '공동 의사결정으로 진행 속도가 느려질 수 있습니다.',
    severity: 'low' as const,
    bufferAdd: 1,
  },
} as const

