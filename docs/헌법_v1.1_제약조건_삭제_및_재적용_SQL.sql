-- ============================================================
-- 헌법 v1.1 - 기존 제약조건 삭제 및 수정본 재적용
-- ============================================================
-- 
-- ⚠️ 중요: 기존 제약조건을 삭제하고 수정된 버전으로 재적용합니다
-- 수정본은 활성화된 데이터만 체크하도록 변경되었습니다
-- ============================================================

BEGIN;

-- ============================================================
-- 1. 기존 제약조건 삭제
-- ============================================================

-- materials 테이블 제약조건 삭제
ALTER TABLE materials DROP CONSTRAINT IF EXISTS chk_material_price;
ALTER TABLE materials DROP CONSTRAINT IF EXISTS chk_material_unit;
ALTER TABLE materials DROP CONSTRAINT IF EXISTS chk_material_argen;
ALTER TABLE materials DROP CONSTRAINT IF EXISTS chk_material_active;

-- labor_productivity 테이블 제약조건 삭제
ALTER TABLE labor_productivity DROP CONSTRAINT IF EXISTS chk_labor_output;
ALTER TABLE labor_productivity DROP CONSTRAINT IF EXISTS chk_labor_crew;
ALTER TABLE labor_productivity DROP CONSTRAINT IF EXISTS chk_labor_productivity_active;

-- labor_costs 테이블 제약조건 삭제
ALTER TABLE labor_costs DROP CONSTRAINT IF EXISTS chk_labor_rate;
ALTER TABLE labor_costs DROP CONSTRAINT IF EXISTS chk_labor_cost_current;

-- ============================================================
-- 2. 수정된 제약조건 적용 (활성화된 데이터만 체크)
-- ============================================================

-- materials 테이블 - 가격 제약조건 (활성화된 자재만 체크)
ALTER TABLE materials
ADD CONSTRAINT chk_material_price 
  CHECK (
    is_active = false 
    OR 
    ((price IS NOT NULL AND price > 0) OR (price_argen IS NOT NULL AND price_argen > 0))
  );

-- materials 테이블 - 단위 제약조건 (활성화된 자재만 체크)
ALTER TABLE materials
ADD CONSTRAINT chk_material_unit 
  CHECK (is_active = false OR (unit IS NOT NULL AND unit != ''));

-- materials 테이블 - 아르젠 기준 제약조건 (활성화된 자재만 체크)
ALTER TABLE materials
ADD CONSTRAINT chk_material_argen 
  CHECK (is_active = false OR is_argen_standard = true);

-- labor_productivity 테이블 - 생산성 제약조건 (활성화된 노무만 체크)
ALTER TABLE labor_productivity
ADD CONSTRAINT chk_labor_output 
  CHECK (is_active = false OR (daily_output IS NOT NULL AND daily_output > 0));

-- labor_productivity 테이블 - 투입 인원 제약조건 (활성화된 노무만 체크)
ALTER TABLE labor_productivity
ADD CONSTRAINT chk_labor_crew 
  CHECK (is_active = false OR (crew_size IS NOT NULL AND crew_size > 0));

-- labor_costs 테이블 - 단가 제약조건 (모든 행 체크)
ALTER TABLE labor_costs
ADD CONSTRAINT chk_labor_rate 
  CHECK (daily_rate IS NOT NULL AND daily_rate > 0);

-- labor_costs 테이블 - 현재 단가 제약조건 (모든 행 체크)
ALTER TABLE labor_costs
ADD CONSTRAINT chk_labor_cost_current 
  CHECK (is_current = true);

COMMIT;

-- ============================================================
-- 3. 제약조건 확인
-- ============================================================

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











