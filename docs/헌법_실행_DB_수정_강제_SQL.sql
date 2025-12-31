-- ============================================================
-- 인테리봇 견적 시스템 헌법 실행 - DB 수정 강제 SQL
-- 작성일: 2024년 12월
-- 목적: labor_costs 테이블 컬럼 강제 추가
-- 사용법: Supabase SQL Editor에서 실행
-- ⚠️ 주의: 컬럼이 이미 있으면 에러가 날 수 있습니다. 무시하세요.
-- ============================================================

-- ============================================================
-- labor_costs 테이블 컬럼 강제 추가
-- ============================================================

-- process_id 컬럼 추가
ALTER TABLE labor_costs ADD COLUMN process_id VARCHAR(50);

-- rate_per_person_day 컬럼 추가
ALTER TABLE labor_costs ADD COLUMN rate_per_person_day NUMERIC(10, 2);

-- 확인 메시지
SELECT '✅ labor_costs 테이블 컬럼 추가 완료!' as status;














