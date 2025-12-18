-- ============================================================
-- 인테리봇 견적 시스템 헌법 실행 - 데이터 마이그레이션 SQL (안전 버전)
-- 작성일: 2024년 12월
-- 목적: 기존 데이터를 헌법 v1 형식으로 마이그레이션
-- 사용법: Supabase SQL Editor에서 실행
-- ⚠️ 주의: is_current 컬럼이 없는 경우를 대비한 안전 버전
-- ============================================================

-- ============================================================
-- Step 1: labor_costs 테이블 데이터 마이그레이션
-- ============================================================

-- 1-1. phase_id → process_id 매핑 (기존 데이터가 있는 경우)
UPDATE labor_costs 
SET process_id = phase_id
WHERE process_id IS NULL 
  AND phase_id IS NOT NULL;

-- 1-2. daily_rate → rate_per_person_day 매핑 (기존 데이터가 있는 경우)
UPDATE labor_costs 
SET rate_per_person_day = daily_rate
WHERE rate_per_person_day IS NULL 
  AND daily_rate IS NOT NULL;

-- 1-3. 확인
SELECT 
  COUNT(*) as total_count,
  COUNT(process_id) as has_process_id,
  COUNT(rate_per_person_day) as has_rate_per_person_day,
  COUNT(*) FILTER (WHERE process_id IS NOT NULL AND rate_per_person_day IS NOT NULL) as complete_count
FROM labor_costs;

-- ============================================================
-- Step 2: materials 테이블 데이터 마이그레이션
-- ============================================================

-- 2-1. is_argen_standard 설정
-- ⚠️ 주의: 실제로는 아르젠 기준 자재만 true로 설정해야 합니다
-- is_current 컬럼이 있으면 사용, 없으면 is_active만 사용

-- 방법 1: is_current 컬럼이 있는 경우 (안전하게 처리)
DO $$
BEGIN
  -- is_current 컬럼 존재 여부 확인
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' 
      AND column_name = 'is_current'
      AND table_schema = 'public'
  ) THEN
    -- is_current 컬럼이 있는 경우
    UPDATE materials 
    SET is_argen_standard = true,
        argen_priority = 1
    WHERE is_active = true
      AND is_current = true
      AND (is_argen_standard IS NULL OR is_argen_standard = false);
    
    RAISE NOTICE '✅ is_current 컬럼 사용하여 업데이트 완료';
  ELSE
    -- is_current 컬럼이 없는 경우
    UPDATE materials 
    SET is_argen_standard = true,
        argen_priority = 1
    WHERE is_active = true
      AND (is_argen_standard IS NULL OR is_argen_standard = false);
    
    RAISE NOTICE '✅ is_current 컬럼 없음, is_active만 사용하여 업데이트 완료';
  END IF;
END $$;

-- 2-2. 확인
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' 
      AND column_name = 'is_current'
      AND table_schema = 'public'
  ) THEN
    -- is_current 컬럼이 있는 경우
    PERFORM 1; -- SELECT 결과를 표시하기 위해 임시 쿼리
  ELSE
    -- is_current 컬럼이 없는 경우
    PERFORM 1;
  END IF;
END $$;

-- 확인 쿼리 (is_current 여부와 관계없이)
SELECT 
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_argen_standard = true) as argen_count,
  COUNT(*) FILTER (WHERE is_argen_standard = false) as non_argen_count
FROM materials
WHERE is_active = true;

-- ============================================================
-- Step 3: 최종 확인
-- ============================================================

-- 3-1. labor_costs 확인
SELECT 
  'labor_costs' as table_name,
  COUNT(*) as total_count,
  COUNT(process_id) as has_process_id,
  COUNT(rate_per_person_day) as has_rate_per_person_day
FROM labor_costs;

-- 3-2. materials 확인
SELECT 
  'materials' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_argen_standard = true) as argen_count
FROM materials
WHERE is_active = true;

-- 완료 메시지
SELECT '✅ 데이터 마이그레이션 완료!' as status;






