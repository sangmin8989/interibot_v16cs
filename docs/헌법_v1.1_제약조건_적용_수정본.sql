-- ============================================================
-- 헌법 v1.1 - DB 제약조건 적용 (수정본)
-- ============================================================
-- 
-- ⚠️ 중요: 제약조건은 활성화된 데이터에만 적용됩니다
-- 비활성화된 데이터는 제약조건에서 제외됩니다
-- ============================================================

-- ============================================================
-- 1. materials 테이블 강제 조건 (활성화된 자재만 체크)
-- ============================================================

-- 가격 제약조건: 활성화된 자재는 price 또는 price_argen 중 하나는 반드시 > 0
ALTER TABLE materials
ADD CONSTRAINT chk_material_price 
  CHECK (
    is_active = false 
    OR 
    ((price IS NOT NULL AND price > 0) OR (price_argen IS NOT NULL AND price_argen > 0))
  );

-- 단위 제약조건: 활성화된 자재는 unit은 반드시 존재
ALTER TABLE materials
ADD CONSTRAINT chk_material_unit 
  CHECK (is_active = false OR (unit IS NOT NULL AND unit != ''));

-- 아르젠 기준 제약조건: 활성화된 자재는 아르젠 기준이어야 함
ALTER TABLE materials
ADD CONSTRAINT chk_material_argen 
  CHECK (is_active = false OR is_argen_standard = true);

-- ============================================================
-- 2. labor_productivity 테이블 강제 조건 (활성화된 노무만 체크)
-- ============================================================

-- 1일 작업량 제약조건: 활성화된 노무는 daily_output은 반드시 > 0
ALTER TABLE labor_productivity
ADD CONSTRAINT chk_labor_output 
  CHECK (is_active = false OR (daily_output IS NOT NULL AND daily_output > 0));

-- 투입 인원 제약조건: 활성화된 노무는 crew_size는 반드시 > 0
ALTER TABLE labor_productivity
ADD CONSTRAINT chk_labor_crew 
  CHECK (is_active = false OR (crew_size IS NOT NULL AND crew_size > 0));

-- ============================================================
-- 3. labor_costs 테이블 강제 조건
-- ============================================================

-- 1인 1일 단가 제약조건: daily_rate는 반드시 > 0
ALTER TABLE labor_costs
ADD CONSTRAINT chk_labor_rate 
  CHECK (daily_rate IS NOT NULL AND daily_rate > 0);

-- 현재 단가 제약조건: is_current = true인 단가만 사용
-- (이건 모든 행에 적용되어야 하므로 조건 없음)
ALTER TABLE labor_costs
ADD CONSTRAINT chk_labor_cost_current 
  CHECK (is_current = true);

-- ============================================================
-- 4. 제약조건 확인 쿼리
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



