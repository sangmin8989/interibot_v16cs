-- V5 Decision Trace Step 3: 질문 → 견적 영향 추적 테이블
-- 이 테이블은 "원인-영향"만 기록한다 (금액/수치 컬럼 없음)

CREATE TABLE IF NOT EXISTS v5_decision_impacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  question_code text NOT NULL,
  answer_value text NOT NULL,
  affected_category text NOT NULL,
  affected_rule_code text NOT NULL,
  impact_type text NOT NULL CHECK (
    impact_type IN ('INCLUDE', 'EXCLUDE', 'MULTIPLIER', 'ASSUMPTION')
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_v5_impacts_session
ON v5_decision_impacts(session_id);

CREATE INDEX IF NOT EXISTS idx_v5_impacts_question_code
ON v5_decision_impacts(question_code);

-- 주석
COMMENT ON TABLE v5_decision_impacts IS 'V5 Decision Trace Step 3: 질문-답변이 견적에 미친 영향 추적';
COMMENT ON COLUMN v5_decision_impacts.session_id IS '세션 ID (v5_question_logs와 동일)';
COMMENT ON COLUMN v5_decision_impacts.question_code IS '질문 코드 (v5_question_logs의 question_code와 동일)';
COMMENT ON COLUMN v5_decision_impacts.answer_value IS '답변 값 (v5_question_answers의 answer_value와 동일)';
COMMENT ON COLUMN v5_decision_impacts.affected_category IS '영향받은 카테고리 (예: ALL, DEMOLITION, RISK 등)';
COMMENT ON COLUMN v5_decision_impacts.affected_rule_code IS '영향받은 규칙 코드 (예: FULL_SCOPE, PARTIAL_SCOPE 등)';
COMMENT ON COLUMN v5_decision_impacts.impact_type IS '영향 타입 (INCLUDE: 포함, EXCLUDE: 제외, MULTIPLIER: 배수, ASSUMPTION: 가정)';


