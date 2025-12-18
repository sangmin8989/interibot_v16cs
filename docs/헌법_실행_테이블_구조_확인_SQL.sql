-- ============================================================
-- 인테리봇 견적 시스템 헌법 실행 - 테이블 구조 확인 SQL
-- 작성일: 2024년 12월
-- 목적: labor_productivity, labor_difficulty_rules 테이블 구조 확인
-- 사용법: Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- Step 1: labor_productivity 테이블 구조 확인
-- ============================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'labor_productivity'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================
-- Step 2: labor_difficulty_rules 테이블 구조 확인
-- ============================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'labor_difficulty_rules'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================
-- Step 3: labor_costs 테이블 구조 확인 (참고용)
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







