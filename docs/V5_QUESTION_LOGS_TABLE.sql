-- V5 질문 로그 테이블 생성 (Supabase SQL Editor에서 실행)
-- 이 테이블은 견적/숫자와 무관한 로그라 헌법 위반 없음

create table if not exists v5_question_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  idx int not null,
  risk_level text not null,
  question text not null,
  quick_replies jsonb not null,
  messages_count int not null,
  created_at timestamptz not null default now()
);

-- 인덱스 추가 (세션별 조회 최적화)
create index if not exists idx_v5_question_logs_session_id on v5_question_logs(session_id);
create index if not exists idx_v5_question_logs_created_at on v5_question_logs(created_at);

-- 주석
comment on table v5_question_logs is 'V5 질문 엔진 로그 - 질문 결정 근거 및 패턴 분석용';
comment on column v5_question_logs.session_id is '세션 ID (프론트에서 전달하거나 서버에서 생성)';
comment on column v5_question_logs.idx is '질문 순서 (0~4)';
comment on column v5_question_logs.risk_level is '리스크 레벨 (HIGH/LOW)';
comment on column v5_question_logs.question is '생성된 질문 텍스트';
comment on column v5_question_logs.quick_replies is '빠른 답변 옵션 (JSON 배열)';
comment on column v5_question_logs.messages_count is '질문 생성 시점의 메시지 총 개수';


