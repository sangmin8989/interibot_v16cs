-- ============================================================
-- 헌법 v1.1 - DB 무결성 2차 봉인 (CHECK 제약조건)
-- ============================================================
-- 
-- 목적: DB 레벨에서 가격/노무 정보 무결성 강제
-- 이 제약조건 없으면 헌법은 반쪽입니다.
-- 
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일 전체 내용 복사
-- 3. 붙여넣기 후 Run 실행
-- ============================================================

-- ============================================================
-- 1. materials 테이블 강제 조건
-- ============================================================

-- 가격 제약조건: price 또는 price_argen 중 하나는 반드시 > 0
ALTER TABLE materials
ADD CONSTRAINT chk_material_price 
  CHECK (
    (price IS NOT NULL AND price > 0) 
    OR 
    (price_argen IS NOT NULL AND price_argen > 0)
  );

-- 단위 제약조건: unit은 반드시 존재
ALTER TABLE materials
ADD CONSTRAINT chk_material_unit 
  CHECK (unit IS NOT NULL AND unit != '');

-- 아르젠 기준 제약조건: 헌법 v1은 아르젠 기준만 사용
ALTER TABLE materials
ADD CONSTRAINT chk_material_argen 
  CHECK (is_argen_standard = true);

-- 활성화 제약조건: 활성화된 자재만 사용
ALTER TABLE materials
ADD CONSTRAINT chk_material_active 
  CHECK (is_active = true);

-- ============================================================
-- 2. labor_productivity 테이블 강제 조건
-- ============================================================

-- 1일 작업량 제약조건: daily_output은 반드시 > 0
ALTER TABLE labor_productivity
ADD CONSTRAINT chk_labor_output 
  CHECK (daily_output IS NOT NULL AND daily_output > 0);

-- 투입 인원 제약조건: crew_size는 반드시 > 0
ALTER TABLE labor_productivity
ADD CONSTRAINT chk_labor_crew 
  CHECK (crew_size IS NOT NULL AND crew_size > 0);

-- 활성화 제약조건: 활성화된 노무 생산성만 사용
ALTER TABLE labor_productivity
ADD CONSTRAINT chk_labor_productivity_active 
  CHECK (is_active = true);

-- ============================================================
-- 3. labor_costs 테이블 강제 조건
-- ============================================================

-- 1인 1일 단가 제약조건: daily_rate는 반드시 > 0
ALTER TABLE labor_costs
ADD CONSTRAINT chk_labor_rate 
  CHECK (daily_rate IS NOT NULL AND daily_rate > 0);

-- 현재 단가 제약조건: is_current = true인 단가만 사용
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

-- ============================================================
-- 5. 제약조건 위반 데이터 확인 (문제 진단용)
-- ============================================================

-- 가격이 0이거나 null인 자재 확인
SELECT 
  material_code,
  product_name,
  category_1,
  category_2,
  price,
  price_argen,
  CASE 
    WHEN (price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0) 
    THEN '가격 없음' 
    ELSE '정상' 
  END as price_status
FROM materials
WHERE is_argen_standard = true
  AND is_active = true
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0))
ORDER BY category_1, category_2;

-- 노무 생산성 정보가 불완전한 공정 확인
SELECT 
  phase_id,
  daily_output,
  crew_size,
  CASE 
    WHEN daily_output IS NULL OR daily_output <= 0 THEN 'dailyOutput 문제'
    WHEN crew_size IS NULL OR crew_size <= 0 THEN 'crewSize 문제'
    ELSE '정상'
  END as issue
FROM labor_productivity
WHERE is_active = true
  AND (daily_output IS NULL OR daily_output <= 0 OR crew_size IS NULL OR crew_size <= 0)
ORDER BY phase_id;

-- 노무 단가가 0이거나 null인 공정 확인
SELECT 
  phase_id,
  daily_rate,
  is_current,
  CASE 
    WHEN daily_rate IS NULL OR daily_rate <= 0 THEN '단가 없음'
    WHEN is_current != true THEN '현재 단가 아님'
    ELSE '정상'
  END as issue
FROM labor_costs
WHERE (daily_rate IS NULL OR daily_rate <= 0 OR is_current != true)
ORDER BY phase_id;




