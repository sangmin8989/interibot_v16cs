-- ============================================================
-- 헌법 v1.1 - 제약조건 최종 확인
-- ============================================================
-- 
-- 모든 테이블의 제약조건이 정상적으로 적용되었는지 확인
-- ============================================================

-- ============================================================
-- 1. materials 테이블 제약조건 확인
-- ============================================================

SELECT 
  'materials' as table_name,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'materials'::regclass
  AND conname LIKE 'chk_material%'
ORDER BY conname;

-- ============================================================
-- 2. labor_productivity 테이블 제약조건 확인
-- ============================================================

SELECT 
  'labor_productivity' as table_name,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'labor_productivity'::regclass
  AND conname LIKE 'chk_labor%'
ORDER BY conname;

-- ============================================================
-- 3. labor_costs 테이블 제약조건 확인
-- ============================================================

SELECT 
  'labor_costs' as table_name,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'labor_costs'::regclass
  AND conname LIKE 'chk_labor%'
ORDER BY conname;

-- ============================================================
-- 4. 전체 제약조건 요약
-- ============================================================

SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  CASE contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    ELSE contype::text
  END AS constraint_type
FROM pg_constraint
WHERE (conrelid = 'materials'::regclass AND conname LIKE 'chk_material%')
   OR (conrelid = 'labor_productivity'::regclass AND conname LIKE 'chk_labor%')
   OR (conrelid = 'labor_costs'::regclass AND conname LIKE 'chk_labor%')
ORDER BY conrelid::regclass, conname;




