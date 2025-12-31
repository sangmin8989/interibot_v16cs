-- ============================================================
-- 인테리봇 견적 시스템 헌법 실행 - DB 수정 SQL
-- 작성일: 2024년 12월
-- 목적: 헌법 문서 실행을 위한 필수 DB 스키마 수정
-- 사용법: Supabase SQL Editor에서 순서대로 실행
-- ⚠️ 주의: 실행 전 백업 권장
-- ============================================================

-- ============================================================
-- Step 1: materials 테이블에 is_argen_standard 컬럼 추가
-- ============================================================

-- 1-1. 컬럼 존재 여부 확인
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' 
      AND column_name = 'is_argen_standard'
      AND table_schema = 'public'
  ) THEN
    -- is_argen_standard 컬럼 추가
    ALTER TABLE materials 
    ADD COLUMN is_argen_standard BOOLEAN DEFAULT false NOT NULL;
    
    RAISE NOTICE '✅ is_argen_standard 컬럼 생성 완료';
  ELSE
    RAISE NOTICE '⚠️ is_argen_standard 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 1-2. argen_priority 컬럼 추가 (우선순위 정렬용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' 
      AND column_name = 'argen_priority'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE materials 
    ADD COLUMN argen_priority INT DEFAULT 0;
    
    RAISE NOTICE '✅ argen_priority 컬럼 생성 완료';
  ELSE
    RAISE NOTICE '⚠️ argen_priority 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 1-3. 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_materials_argen_standard 
ON materials(is_argen_standard) 
WHERE is_argen_standard = true;

CREATE INDEX IF NOT EXISTS idx_materials_argen_priority 
ON materials(argen_priority) 
WHERE is_argen_standard = true;

-- 1-4. 기존 데이터 업데이트 (임시: 모든 데이터를 아르젠 기준으로 설정)
-- ⚠️ 주의: 실제로는 아르젠 기준 자재만 true로 설정해야 합니다
-- 아래 쿼리는 예시이며, 실제 데이터에 맞게 수정 필요
/*
UPDATE materials 
SET is_argen_standard = true,
    argen_priority = 1
WHERE is_active = true
  AND is_current = true;
*/

-- ============================================================
-- Step 2: labor_costs 테이블 구조 확인 및 수정
-- ============================================================

-- 2-1. 현재 labor_costs 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'labor_costs'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2-2. process_id 컬럼 추가 (없는 경우)
-- ⚠️ 주의: 이 쿼리는 반드시 실행해야 합니다
ALTER TABLE labor_costs 
ADD COLUMN IF NOT EXISTS process_id VARCHAR(50);

-- 2-3. rate_per_person_day 컬럼 추가 (없는 경우)
-- ⚠️ 주의: 이 쿼리는 반드시 실행해야 합니다
ALTER TABLE labor_costs 
ADD COLUMN IF NOT EXISTS rate_per_person_day NUMERIC(10, 2);

-- 2-4. 기존 데이터 마이그레이션 (기존 컬럼이 있는 경우)
-- ⚠️ 주의: 실제 컬럼명에 맞게 수정 필요
/*
UPDATE labor_costs 
SET rate_per_person_day = daily_rate  -- 또는 실제 컬럼명
WHERE rate_per_person_day IS NULL 
  AND daily_rate IS NOT NULL;
*/

-- ============================================================
-- Step 3: labor_productivity 테이블 확인
-- ============================================================

-- 3-1. 현재 labor_productivity 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'labor_productivity'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3-2. 필수 컬럼 확인
SELECT 
  column_name,
  CASE 
    WHEN column_name IN ('process_id', 'labor_unit', 'daily_output', 'crew_size')
    THEN '✅ 필수'
    ELSE '⚠️ 선택'
  END as required_status
FROM information_schema.columns
WHERE table_name = 'labor_productivity'
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN column_name IN ('process_id', 'labor_unit', 'daily_output', 'crew_size')
    THEN 0
    ELSE 1
  END,
  ordinal_position;

-- ============================================================
-- Step 4: labor_difficulty_rules 테이블 확인
-- ============================================================

-- 4-1. 현재 labor_difficulty_rules 테이블 구조 확인
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
-- Step 5: 최종 확인
-- ============================================================

-- 5-1. materials 테이블 확인
SELECT 
  'materials' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_argen_standard = true) as argen_count
FROM materials;

-- 5-2. labor_costs 테이블 확인
SELECT 
  'labor_costs' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE process_id IS NOT NULL) as has_process_id,
  COUNT(*) FILTER (WHERE rate_per_person_day IS NOT NULL) as has_rate
FROM labor_costs;

-- 5-3. labor_productivity 테이블 확인
SELECT 
  'labor_productivity' as table_name,
  COUNT(*) as total_count
FROM labor_productivity;

-- 5-4. labor_difficulty_rules 테이블 확인
SELECT 
  'labor_difficulty_rules' as table_name,
  COUNT(*) as total_count
FROM labor_difficulty_rules;

-- ============================================================
-- 완료 메시지
-- ============================================================

SELECT '✅ 헌법 DB 스키마 수정 완료! 다음 단계: 데이터 입력' as status;














