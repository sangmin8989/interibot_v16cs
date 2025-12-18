-- KPI 이벤트 테이블 스키마
-- 이벤트 테이블 1개만 추가하여 DB 스키마 변경 최소화

CREATE TABLE IF NOT EXISTS kpi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('decision_start', 'option_change', 'lock_override_attempt', 'decision_complete')),
  event_data JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_kpi_events_session_id ON kpi_events(session_id);
CREATE INDEX IF NOT EXISTS idx_kpi_events_event_type ON kpi_events(event_type);
CREATE INDEX IF NOT EXISTS idx_kpi_events_timestamp ON kpi_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_kpi_events_session_type ON kpi_events(session_id, event_type);

-- 코멘트 추가
COMMENT ON TABLE kpi_events IS 'KPI 계측 이벤트 로그 테이블';
COMMENT ON COLUMN kpi_events.session_id IS '세션 고유 ID';
COMMENT ON COLUMN kpi_events.event_type IS '이벤트 타입: decision_start, option_change, lock_override_attempt, decision_complete';
COMMENT ON COLUMN kpi_events.event_data IS '이벤트별 상세 데이터 (JSON)';
COMMENT ON COLUMN kpi_events.timestamp IS '이벤트 발생 시각';













