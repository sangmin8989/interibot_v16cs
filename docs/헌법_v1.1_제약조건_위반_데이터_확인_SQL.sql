-- ============================================================
-- 헌법 v1.1 - 제약조건 위반 데이터 확인 (제약조건 적용 전 필수)
-- ============================================================
-- 
-- 목적: 제약조건 적용 전에 위반 데이터를 먼저 확인하고 수정
-- 이 쿼리를 먼저 실행하여 문제 데이터를 확인하세요.
-- ============================================================

-- ============================================================
-- 1. materials 테이블 위반 데이터 확인
-- ============================================================

-- 가격이 0이거나 null인 자재 확인
SELECT 
  id,
  material_code,
  product_name,
  category_1,
  category_2,
  price,
  price_argen,
  is_argen_standard,
  is_active,
  CASE 
    WHEN (price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0) 
    THEN '❌ 가격 없음' 
    WHEN price IS NULL AND price_argen > 0 THEN '⚠️ price 없음 (price_argen 있음)'
    WHEN price_argen IS NULL AND price > 0 THEN '⚠️ price_argen 없음 (price 있음)'
    ELSE '✅ 정상' 
  END as price_status
FROM materials
WHERE is_argen_standard = true
  AND is_active = true
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0))
ORDER BY category_1, category_2;

-- unit이 null이거나 빈 문자열인 자재 확인
SELECT 
  id,
  material_code,
  product_name,
  category_1,
  category_2,
  unit,
  CASE 
    WHEN unit IS NULL THEN '❌ unit NULL'
    WHEN unit = '' THEN '❌ unit 빈 문자열'
    ELSE '✅ 정상'
  END as unit_status
FROM materials
WHERE is_argen_standard = true
  AND is_active = true
  AND (unit IS NULL OR unit = '')
ORDER BY category_1, category_2;

-- is_argen_standard가 false인 자재 확인 (헌법 v1은 아르젠 기준만 사용)
SELECT 
  id,
  material_code,
  product_name,
  category_1,
  category_2,
  is_argen_standard,
  is_active,
  CASE 
    WHEN is_argen_standard = false AND is_active = true THEN '❌ 아르젠 기준 아님 (활성화됨)'
    WHEN is_argen_standard = false AND is_active = false THEN '⚠️ 아르젠 기준 아님 (비활성화됨)'
    ELSE '✅ 정상'
  END as argen_status
FROM materials
WHERE is_argen_standard = false
  AND is_active = true
ORDER BY category_1, category_2;

-- is_active가 false인 자재 확인 (활성화된 자재만 사용)
SELECT 
  id,
  material_code,
  product_name,
  category_1,
  category_2,
  is_active,
  CASE 
    WHEN is_active = false THEN '❌ 비활성화됨'
    ELSE '✅ 정상'
  END as active_status
FROM materials
WHERE is_argen_standard = true
  AND is_active = false
ORDER BY category_1, category_2;

-- ============================================================
-- 2. labor_productivity 테이블 위반 데이터 확인
-- ============================================================

-- daily_output이 0이거나 null인 공정 확인
SELECT 
  id,
  phase_id,
  daily_output,
  crew_size,
  is_active,
  CASE 
    WHEN daily_output IS NULL THEN '❌ daily_output NULL'
    WHEN daily_output <= 0 THEN '❌ daily_output <= 0'
    WHEN crew_size IS NULL THEN '❌ crew_size NULL'
    WHEN crew_size <= 0 THEN '❌ crew_size <= 0'
    ELSE '✅ 정상'
  END as issue
FROM labor_productivity
WHERE is_active = true
  AND (daily_output IS NULL OR daily_output <= 0 OR crew_size IS NULL OR crew_size <= 0)
ORDER BY phase_id;

-- ============================================================
-- 3. labor_costs 테이블 위반 데이터 확인
-- ============================================================

-- daily_rate가 0이거나 null인 공정 확인
SELECT 
  id,
  phase_id,
  daily_rate,
  is_current,
  CASE 
    WHEN daily_rate IS NULL THEN '❌ daily_rate NULL'
    WHEN daily_rate <= 0 THEN '❌ daily_rate <= 0'
    WHEN is_current != true THEN '❌ 현재 단가 아님'
    ELSE '✅ 정상'
  END as issue
FROM labor_costs
WHERE (daily_rate IS NULL OR daily_rate <= 0 OR is_current != true)
ORDER BY phase_id;

-- ============================================================
-- 4. 종합 요약 (위반 데이터 개수 확인)
-- ============================================================

SELECT 
  'materials - 가격 없음' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_argen_standard = true
  AND is_active = true
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0))

UNION ALL

SELECT 
  'materials - unit 없음' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_argen_standard = true
  AND is_active = true
  AND (unit IS NULL OR unit = '')

UNION ALL

SELECT 
  'materials - 아르젠 기준 아님' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_argen_standard = false
  AND is_active = true

UNION ALL

SELECT 
  'labor_productivity - 생산성 정보 없음' as issue_type,
  COUNT(*) as violation_count
FROM labor_productivity
WHERE is_active = true
  AND (daily_output IS NULL OR daily_output <= 0 OR crew_size IS NULL OR crew_size <= 0)

UNION ALL

SELECT 
  'labor_costs - 단가 없음' as issue_type,
  COUNT(*) as violation_count
FROM labor_costs
WHERE (daily_rate IS NULL OR daily_rate <= 0 OR is_current != true)

ORDER BY violation_count DESC;




