/**
 * V5 Decision Trace Step 3: 질문-답변 → 견적 영향 매핑
 * 
 * 질문 코드와 답변 값을 기반으로 견적에 미친 영향을 규칙 코드로 매핑
 * 금액/수치 참조 없이 구조적 기록만 생성
 */

export interface DecisionImpact {
  affected_category: string;
  affected_rule_code: string;
  impact_type: 'INCLUDE' | 'EXCLUDE' | 'MULTIPLIER' | 'ASSUMPTION';
}

/**
 * 질문 코드 → 영향 매핑 규칙
 * 
 * 하드코딩 금지: 매핑 객체로만 정의
 */
export const QUESTION_IMPACT_MAP: Record<
  string,
  (answer: string) => DecisionImpact[]
> = {
  // V5_Q_0: 공사 범위
  V5_Q_0: (answer: string): DecisionImpact[] => {
    if (answer.includes('전체') || answer.includes('리모델링')) {
      return [
        {
          affected_category: 'ALL',
          affected_rule_code: 'FULL_SCOPE',
          impact_type: 'INCLUDE',
        },
      ];
    }
    if (answer.includes('부분') || answer.includes('공사')) {
      return [
        {
          affected_category: 'ALL',
          affected_rule_code: 'PARTIAL_SCOPE',
          impact_type: 'MULTIPLIER',
        },
      ];
    }
    if (answer.includes('한 공간') || answer.includes('공간만')) {
      return [
        {
          affected_category: 'SPACE',
          affected_rule_code: 'SINGLE_SPACE',
          impact_type: 'MULTIPLIER',
        },
      ];
    }
    return [];
  },

  // V5_Q_1: 철거 범위
  V5_Q_1: (answer: string): DecisionImpact[] => {
    if (answer.includes('올철거') || answer.includes('전체')) {
      return [
        {
          affected_category: 'DEMOLITION',
          affected_rule_code: 'FULL_DEMOLITION',
          impact_type: 'INCLUDE',
        },
      ];
    }
    if (answer.includes('부분')) {
      return [
        {
          affected_category: 'DEMOLITION',
          affected_rule_code: 'PARTIAL_DEMOLITION',
          impact_type: 'MULTIPLIER',
        },
      ];
    }
    if (answer.includes('없음') || answer.includes('거의 없음')) {
      return [
        {
          affected_category: 'DEMOLITION',
          affected_rule_code: 'MINIMAL_DEMOLITION',
          impact_type: 'EXCLUDE',
        },
      ];
    }
    return [];
  },

  // V5_Q_RISK: 리스크/현장 조건
  V5_Q_RISK: (answer: string): DecisionImpact[] => {
    if (answer.includes('있음') || answer.includes('있어요')) {
      return [
        {
          affected_category: 'RISK',
          affected_rule_code: 'SITE_CONSTRAINTS',
          impact_type: 'ASSUMPTION',
        },
        {
          affected_category: 'RISK',
          affected_rule_code: 'WORK_TIME_LIMIT',
          impact_type: 'ASSUMPTION',
        },
      ];
    }
    if (answer.includes('없음') || answer.includes('없어요')) {
      return [
        {
          affected_category: 'RISK',
          affected_rule_code: 'NO_SITE_CONSTRAINTS',
          impact_type: 'ASSUMPTION',
        },
      ];
    }
    if (answer.includes('확인') || answer.includes('모름')) {
      return [
        {
          affected_category: 'RISK',
          affected_rule_code: 'UNKNOWN_CONSTRAINTS',
          impact_type: 'ASSUMPTION',
        },
      ];
    }
    return [];
  },

  // TODO: V5_Q_2 (욕실), V5_Q_3 (주방), V5_Q_4 (바닥/도배)는 추후 구현
};

/**
 * 질문 코드와 답변 값으로 영향 목록 생성
 */
export function getDecisionImpacts(
  questionCode: string,
  answerValue: string
): DecisionImpact[] {
  const mapper = QUESTION_IMPACT_MAP[questionCode];
  if (!mapper) {
    return [];
  }
  return mapper(answerValue);
}

