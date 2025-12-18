-- ============================================================
-- 헌법 v1.1 - DB 제약조건 적용 (단계별 실행용)
-- ============================================================
-- 
-- ⚠️ 중요: 각 섹션을 개별적으로 실행하세요
-- Supabase SQL Editor에서 한 번에 하나씩 실행하는 것을 권장합니다
-- ============================================================

-- ============================================================
-- STEP 1: materials 테이블 - 가격 제약조건
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

ALTER TABLE materials
ADD CONSTRAINT chk_material_price 
  CHECK (
    (price IS NOT NULL AND price > 0) 
    OR 
    (price_argen IS NOT NULL AND price_argen > 0)
  );

-- ============================================================
-- STEP 2: materials 테이블 - 단위 제약조건
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

ALTER TABLE materials
ADD CONSTRAINT chk_material_unit 
  CHECK (unit IS NOT NULL AND unit != '');

-- ============================================================
-- STEP 3: materials 테이블 - 아르젠 기준 제약조건
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

ALTER TABLE materials
ADD CONSTRAINT chk_material_argen 
  CHECK (is_argen_standard = true);

-- ============================================================
-- STEP 4: materials 테이블 - 활성화 제약조건
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

ALTER TABLE materials
ADD CONSTRAINT chk_material_active 
  CHECK (is_active = true);

-- ============================================================
-- STEP 5: labor_productivity 테이블 - 생산성 제약조건
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

ALTER TABLE labor_productivity
ADD CONSTRAINT chk_labor_output 
  CHECK (daily_output IS NOT NULL AND daily_output > 0);

-- ============================================================
-- STEP 6: labor_productivity 테이블 - 투입 인원 제약조건
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

ALTER TABLE labor_productivity
ADD CONSTRAINT chk_labor_crew 
  CHECK (crew_size IS NOT NULL AND crew_size > 0);

-- ============================================================
-- STEP 7: labor_productivity 테이블 - 활성화 제약조건
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

ALTER TABLE labor_productivity
ADD CONSTRAINT chk_labor_productivity_active 
  CHECK (is_active = true);

-- ============================================================
-- STEP 8: labor_costs 테이블 - 단가 제약조건
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

ALTER TABLE labor_costs
ADD CONSTRAINT chk_labor_rate 
  CHECK (daily_rate IS NOT NULL AND daily_rate > 0);

-- ============================================================
-- STEP 9: labor_costs 테이블 - 현재 단가 제약조건
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

ALTER TABLE labor_costs
ADD CONSTRAINT chk_labor_cost_current 
  CHECK (is_current = true);

-- ============================================================
-- STEP 10: 제약조건 확인 (모든 제약조건이 정상 적용되었는지 확인)
-- ============================================================
-- 이 쿼리들을 실행하여 제약조건이 정상적으로 적용되었는지 확인하세요

-- materials 테이블 제약조건 확인
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'materials'::regclass
  AND conname LIKE 'chk_material%'
ORDER BY conname;

-- labor_productivity 테이블 제약조건 확인
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'labor_productivity'::regclass
  AND conname LIKE 'chk_labor%'
ORDER BY conname;

-- labor_costs 테이블 제약조건 확인
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'labor_costs'::regclass
  AND conname LIKE 'chk_labor%'
ORDER BY conname;




