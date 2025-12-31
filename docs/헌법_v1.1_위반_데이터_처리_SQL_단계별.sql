-- ============================================================
-- 헌법 v1.1 - 위반 데이터 처리 SQL (단계별 실행용)
-- ============================================================
-- 
-- ⚠️ 중요: 각 섹션을 개별적으로 실행하세요
-- Supabase SQL Editor에서 한 번에 하나씩 실행하는 것을 권장합니다
-- ============================================================

-- ============================================================
-- STEP 1: 가격이 없는 자재 비활성화
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

UPDATE materials
SET is_active = false
WHERE is_argen_standard = true
  AND is_active = true
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0));

-- ============================================================
-- STEP 1 확인: 가격 없음으로 비활성화된 자재 개수 확인
-- ============================================================

SELECT 
  '가격 없음으로 비활성화된 자재' as action,
  COUNT(*) as affected_rows
FROM materials
WHERE is_argen_standard = true
  AND is_active = false
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0));

-- ============================================================
-- STEP 2: unit이 없는 자재 비활성화
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

UPDATE materials
SET is_active = false
WHERE is_argen_standard = true
  AND is_active = true
  AND (unit IS NULL OR unit = '');

-- ============================================================
-- STEP 2 확인: unit 없음으로 비활성화된 자재 개수 확인
-- ============================================================

SELECT 
  'unit 없음으로 비활성화된 자재' as action,
  COUNT(*) as affected_rows
FROM materials
WHERE is_argen_standard = true
  AND is_active = false
  AND (unit IS NULL OR unit = '');

-- ============================================================
-- STEP 3: 아르젠 기준이 아닌 활성화된 자재 비활성화
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요

UPDATE materials
SET is_active = false
WHERE is_argen_standard = false
  AND is_active = true;

-- ============================================================
-- STEP 3 확인: 아르젠 기준 아님으로 비활성화된 자재 개수 확인
-- ============================================================

SELECT 
  '아르젠 기준 아님으로 비활성화된 자재' as action,
  COUNT(*) as affected_rows
FROM materials
WHERE is_argen_standard = false
  AND is_active = false;

-- ============================================================
-- STEP 4: 최종 확인 (모든 위반 데이터가 0건인지 확인)
-- ============================================================
-- 이 쿼리만 복사해서 실행하세요
-- 모든 violation_count가 0이어야 제약조건 적용 가능

SELECT 
  '가격 없음 (활성화됨)' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_argen_standard = true
  AND is_active = true
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0))

UNION ALL

SELECT 
  'unit 없음 (활성화됨)' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_argen_standard = true
  AND is_active = true
  AND (unit IS NULL OR unit = '')

UNION ALL

SELECT 
  '아르젠 기준 아님 (활성화됨)' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_argen_standard = false
  AND is_active = true

UNION ALL

SELECT 
  '노무 생산성 정보 없음' as issue_type,
  COUNT(*) as violation_count
FROM labor_productivity
WHERE is_active = true
  AND (daily_output IS NULL OR daily_output <= 0 OR crew_size IS NULL OR crew_size <= 0)

UNION ALL

SELECT 
  '노무 단가 없음' as issue_type,
  COUNT(*) as violation_count
FROM labor_costs
WHERE (daily_rate IS NULL OR daily_rate <= 0 OR is_current != true);

-- ============================================================
-- STEP 5: 처리 완료 후 상태 확인 (선택사항)
-- ============================================================

-- 활성화된 자재 개수 확인
SELECT 
  '활성화된 자재' as status,
  COUNT(*) as count
FROM materials
WHERE is_argen_standard = true
  AND is_active = true;

-- 비활성화된 자재 개수 확인
SELECT 
  '비활성화된 자재' as status,
  COUNT(*) as count
FROM materials
WHERE is_active = false;











