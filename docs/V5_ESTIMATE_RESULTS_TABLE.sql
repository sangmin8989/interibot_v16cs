-- V5 견적 결과 저장 테이블 생성 (Supabase SQL Editor에서 실행)
-- Decision Trace 완결: 견적 결과 스냅샷 저장

CREATE TABLE IF NOT EXISTS v5_estimate_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  estimate_version text NOT NULL DEFAULT 'V5',
  estimate_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_v5_estimate_results_session
ON v5_estimate_results(session_id);

CREATE INDEX IF NOT EXISTS idx_v5_estimate_results_created_at
ON v5_estimate_results(created_at);

-- 주석
COMMENT ON TABLE v5_estimate_results IS 'V5 견적 결과 스냅샷 - Decision Trace 완결부';
COMMENT ON COLUMN v5_estimate_results.session_id IS '세션 ID (v5_question_logs, v5_question_answers와 동일)';
COMMENT ON COLUMN v5_estimate_results.estimate_version IS '견적 버전 (기본값: V5)';
COMMENT ON COLUMN v5_estimate_results.estimate_snapshot IS '견적 결과 JSON 스냅샷 (재계산/수정 불가)';


