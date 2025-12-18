-- ============================================================
-- 인테리봇 견적 시스템 헌법 실행 - DB 수정 추가 SQL
-- 작성일: 2024년 12월
-- 목적: labor_costs 테이블 컬럼 추가 (안전 버전)
-- 사용법: Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- Step 1: 현재 labor_costs 테이블 구조 확인
-- ============================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'labor_costs'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================
-- Step 2: labor_costs 테이블 컬럼 추가 (안전 버전)
-- ============================================================

-- 2-1. process_id 컬럼 추가 (없는 경우만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'labor_costs' 
      AND column_name = 'process_id'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE labor_costs ADD COLUMN process_id VARCHAR(50);
    RAISE NOTICE '✅ process_id 컬럼 추가 완료';
  ELSE
    RAISE NOTICE '⚠️ process_id 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 2-2. rate_per_person_day 컬럼 추가 (없는 경우만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'labor_costs' 
      AND column_name = 'rate_per_person_day'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE labor_costs ADD COLUMN rate_per_person_day NUMERIC(10, 2);
    RAISE NOTICE '✅ rate_per_person_day 컬럼 추가 완료';
  ELSE
    RAISE NOTICE '⚠️ rate_per_person_day 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- ============================================================
-- Step 3: 최종 확인
-- ============================================================

-- 3-1. 추가된 컬럼 확인
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'labor_costs'
  AND table_schema = 'public'
  AND column_name IN ('process_id', 'rate_per_person_day')
ORDER BY column_name;

-- 3-2. 완료 메시지
SELECT '✅ labor_costs 테이블 컬럼 추가 완료!' as status;







