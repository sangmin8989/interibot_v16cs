-- V5 Decision Trace 테이블 생성 (Supabase SQL Editor에서 실행)
-- Step A: 질문·답변 입력부

-- 1. v5_question_logs 테이블에 question_code 컬럼 추가
ALTER TABLE v5_question_logs 
ADD COLUMN IF NOT EXISTS question_code text;

-- question_code 인덱스 추가 (JOIN 기준)
CREATE INDEX IF NOT EXISTS idx_v5_question_logs_question_code 
ON v5_question_logs(question_code);

-- 2. v5_question_answers 테이블 생성
CREATE TABLE IF NOT EXISTS v5_question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  question_code text NOT NULL,  -- 질문 생성 시 부여된 코드 그대로
  idx int NOT NULL,
  answer_value text NOT NULL,
  answer_type text NOT NULL DEFAULT 'QUICK',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_v5_answers_session
ON v5_question_answers(session_id);

CREATE INDEX IF NOT EXISTS idx_v5_answers_question_code
ON v5_question_answers(question_code);

-- 주석
COMMENT ON TABLE v5_question_answers IS 'V5 답변 로그 - 질문-답변 매칭 및 Decision Trace 입력부';
COMMENT ON COLUMN v5_question_answers.session_id IS '세션 ID (v5_question_logs와 동일)';
COMMENT ON COLUMN v5_question_answers.question_code IS '질문 코드 (v5_question_logs의 question_code와 정확히 일치)';
COMMENT ON COLUMN v5_question_answers.idx IS '답변 순서 (0~4, 참고용)';
COMMENT ON COLUMN v5_question_answers.answer_value IS '사용자가 선택한 값 (quickReply text)';
COMMENT ON COLUMN v5_question_answers.answer_type IS '답변 타입 (기본값: QUICK)';


