import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 질문 코드 → 설명 문장 매핑 (헌법)
 */
const QUESTION_EXPLAIN_MAP: Record<
  string,
  (answer: string) => string
> = {
  V5_Q_RISK: () =>
    '관리규정, 작업시간, 주차 및 양중 조건 등 현장 제약 사항이 반영되었습니다.',
  V5_Q_0: (a) =>
    `공사 범위는 "${a}" 기준으로 설정되었습니다.`,
  V5_Q_1: (a) =>
    `철거 범위는 "${a}" 선택을 반영했습니다.`,
  V5_Q_2: (a) =>
    `욕실 공사는 "${a}" 기준으로 계획되었습니다.`,
  V5_Q_3: (a) =>
    `주방 공사는 "${a}" 조건을 반영했습니다.`,
  V5_Q_4: (a) =>
    `바닥 및 도배 공사는 "${a}" 기준으로 산정되었습니다.`,
};

/**
 * Decision Trace 설명 생성
 */
export async function buildDecisionTraceExplanation(
  sessionId: string
): Promise<{ explanation: string }> {
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

  if (!questions || !answers) {
    return {
      explanation: '견적 산출에 필요한 선택 이력이 충분하지 않습니다.',
    };
  }

  const answerMap = new Map(
    answers.map((a) => [a.question_code, a.answer_value])
  );

  const lines: string[] = [];

  for (const q of questions) {
    const answer = answerMap.get(q.question_code);
    const mapper = QUESTION_EXPLAIN_MAP[q.question_code];

    if (!mapper) continue;
    if (!answer && q.question_code !== 'V5_Q_RISK') continue;

    lines.push(mapper(answer ?? ''));
  }

  const explanation =
    '이번 견적은 다음과 같은 선택을 기준으로 산출되었습니다.\n\n' +
    lines.map((l, i) => `${i + 1}. ${l}`).join('\n');

  return { explanation };
}


