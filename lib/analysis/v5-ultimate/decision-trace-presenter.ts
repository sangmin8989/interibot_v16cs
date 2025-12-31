/**
 * V5 Decision Trace Step 4: 설명 분기 (고객용 vs 내부/법무용)
 * 
 * 같은 데이터로 두 톤만 분기
 * - 고객용: 부드럽고 요약
 * - 내부/법무용: 가정·제외·책임 명시
 */

import { createClient } from '@supabase/supabase-js';
import { getDecisionImpacts } from './decision-impact-map';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 고객용 설명 매핑 (부드럽고 요약)
 */
const CUSTOMER_EXPLAIN_MAP: Record<
  string,
  (answer: string) => string
> = {
  V5_Q_RISK: () =>
    '현장 제약 사항을 고려하여 견적을 산출했습니다.',
  V5_Q_0: (a) =>
    `공사 범위는 "${a}"로 설정되었습니다.`,
  V5_Q_1: (a) =>
    `철거 범위는 "${a}"로 반영했습니다.`,
  V5_Q_2: (a) =>
    `욕실 공사는 "${a}" 기준으로 계획되었습니다.`,
  V5_Q_3: (a) =>
    `주방 공사는 "${a}" 조건을 반영했습니다.`,
  V5_Q_4: (a) =>
    `바닥 및 도배 공사는 "${a}" 기준으로 산정되었습니다.`,
};

/**
 * 내부/법무용 설명 매핑 (가정·제외·책임 명시)
 */
const INTERNAL_EXPLAIN_MAP: Record<
  string,
  (answer: string, impacts: Array<{ affected_category: string; affected_rule_code: string; impact_type: string }>) => string
> = {
  V5_Q_RISK: (_, impacts) => {
    const assumptions = impacts
      .filter(i => i.impact_type === 'ASSUMPTION')
      .map(i => i.affected_rule_code)
      .join(', ');
    return `[가정] 현장 제약 사항: ${assumptions || '미확인'}`;
  },
  V5_Q_0: (a, impacts) => {
    const includes = impacts.filter(i => i.impact_type === 'INCLUDE').map(i => i.affected_rule_code);
    const multipliers = impacts.filter(i => i.impact_type === 'MULTIPLIER').map(i => i.affected_rule_code);
    const parts: string[] = [];
    if (includes.length > 0) parts.push(`[포함] ${includes.join(', ')}`);
    if (multipliers.length > 0) parts.push(`[배수] ${multipliers.join(', ')}`);
    return `[선택] 공사 범위: "${a}" → ${parts.join(' / ')}`;
  },
  V5_Q_1: (a, impacts) => {
    const includes = impacts.filter(i => i.impact_type === 'INCLUDE').map(i => i.affected_rule_code);
    const excludes = impacts.filter(i => i.impact_type === 'EXCLUDE').map(i => i.affected_rule_code);
    const parts: string[] = [];
    if (includes.length > 0) parts.push(`[포함] ${includes.join(', ')}`);
    if (excludes.length > 0) parts.push(`[제외] ${excludes.join(', ')}`);
    return `[선택] 철거 범위: "${a}" → ${parts.join(' / ')}`;
  },
  V5_Q_2: (a, impacts) => {
    const includes = impacts.filter(i => i.impact_type === 'INCLUDE').map(i => i.affected_rule_code);
    return `[선택] 욕실 공사: "${a}" → ${includes.length > 0 ? `[포함] ${includes.join(', ')}` : '기본 적용'}`;
  },
  V5_Q_3: (a, impacts) => {
    const includes = impacts.filter(i => i.impact_type === 'INCLUDE').map(i => i.affected_rule_code);
    return `[선택] 주방 공사: "${a}" → ${includes.length > 0 ? `[포함] ${includes.join(', ')}` : '기본 적용'}`;
  },
  V5_Q_4: (a, impacts) => {
    const includes = impacts.filter(i => i.impact_type === 'INCLUDE').map(i => i.affected_rule_code);
    return `[선택] 바닥/도배: "${a}" → ${includes.length > 0 ? `[포함] ${includes.join(', ')}` : '기본 적용'}`;
  },
};

/**
 * Decision Trace 설명 분기 생성
 * 
 * @param sessionId - 세션 ID
 * @returns 고객용과 내부/법무용 설명 분기
 */
export async function buildDecisionTracePresentation(
  sessionId: string
): Promise<{
  customer: string[];
  internal: string[];
}> {
  // 질문 로그
  const { data: questions } = await supabase
    .from('v5_question_logs')
    .select('question_code, idx')
    .eq('session_id', sessionId)
    .order('idx', { ascending: true });

  // 답변 로그
  const { data: answers } = await supabase
    .from('v5_question_answers')
    .select('question_code, answer_value')
    .eq('session_id', sessionId);

  // 영향 로그
  const { data: impacts } = await supabase
    .from('v5_decision_impacts')
    .select('question_code, affected_category, affected_rule_code, impact_type')
    .eq('session_id', sessionId);

  if (!questions || !answers) {
    return {
      customer: ['견적 산출에 필요한 선택 이력이 충분하지 않습니다.'],
      internal: ['[오류] 질문/답변 로그 부족'],
    };
  }

  const answerMap = new Map(
    answers.map((a) => [a.question_code, a.answer_value])
  );

  const impactMap = new Map<string, Array<{ affected_category: string; affected_rule_code: string; impact_type: string }>>();
  if (impacts) {
    for (const impact of impacts) {
      if (!impactMap.has(impact.question_code)) {
        impactMap.set(impact.question_code, []);
      }
      impactMap.get(impact.question_code)!.push({
        affected_category: impact.affected_category,
        affected_rule_code: impact.affected_rule_code,
        impact_type: impact.impact_type,
      });
    }
  }

  const customerLines: string[] = [];
  const internalLines: string[] = [];

  for (const q of questions) {
    const answer = answerMap.get(q.question_code);
    const questionImpacts = impactMap.get(q.question_code) || [];

    // 고객용 설명
    const customerMapper = CUSTOMER_EXPLAIN_MAP[q.question_code];
    if (customerMapper) {
      if (answer || q.question_code === 'V5_Q_RISK') {
        customerLines.push(customerMapper(answer ?? ''));
      }
    }

    // 내부/법무용 설명
    const internalMapper = INTERNAL_EXPLAIN_MAP[q.question_code];
    if (internalMapper) {
      if (answer || q.question_code === 'V5_Q_RISK') {
        internalLines.push(internalMapper(answer ?? '', questionImpacts));
      } else {
        internalLines.push(`[미응답] ${q.question_code}`);
      }
    }
  }

  return {
    customer: customerLines.length > 0
      ? customerLines
      : ['견적 산출에 필요한 선택 이력이 충분하지 않습니다.'],
    internal: internalLines.length > 0
      ? internalLines
      : ['[오류] 설명 생성 불가'],
  };
}


