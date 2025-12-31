-- ============================================================
-- 헌법 v1.1 - 제약조건 위반 데이터 재확인
-- ============================================================
-- 
-- 제약조건 적용 전에 다시 한 번 확인하세요
-- ============================================================

-- ============================================================
-- 1. materials 테이블 위반 데이터 확인
-- ============================================================

-- 활성화된 자재 중 가격이 없는 경우
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
  '가격 없음 (활성화됨)' as issue
FROM materials
WHERE is_active = true
  AND is_argen_standard = true
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0))
ORDER BY category_1, category_2;

-- 활성화된 자재 중 unit이 없는 경우
SELECT 
  id,
  material_code,
  product_name,
  category_1,
  category_2,
  unit,
  is_active,
  'unit 없음 (활성화됨)' as issue
FROM materials
WHERE is_active = true
  AND is_argen_standard = true
  AND (unit IS NULL OR unit = '')
ORDER BY category_1, category_2;

-- 활성화된 자재 중 아르젠 기준이 아닌 경우
SELECT 
  id,
  material_code,
  product_name,
  category_1,
  category_2,
  is_argen_standard,
  is_active,
  '아르젠 기준 아님 (활성화됨)' as issue
FROM materials
WHERE is_active = true
  AND is_argen_standard = false
ORDER BY category_1, category_2;

-- ============================================================
-- 2. labor_productivity 테이블 위반 데이터 확인
-- ============================================================

-- 활성화된 노무 중 생산성 정보가 불완전한 경우
SELECT 
  id,
  phase_id,
  daily_output,
  crew_size,
  is_active,
  CASE 
    WHEN daily_output IS NULL OR daily_output <= 0 THEN 'dailyOutput 문제'
    WHEN crew_size IS NULL OR crew_size <= 0 THEN 'crewSize 문제'
    ELSE '정상'
  END as issue
FROM labor_productivity
WHERE is_active = true
  AND (daily_output IS NULL OR daily_output <= 0 OR crew_size IS NULL OR crew_size <= 0)
ORDER BY phase_id;

-- ============================================================
-- 3. labor_costs 테이블 위반 데이터 확인
-- ============================================================

-- 단가가 0이거나 null인 경우
SELECT 
  id,
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

-- ============================================================
-- 4. 종합 요약
-- ============================================================

SELECT 
  '활성화된 자재 - 가격 없음' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_active = true
  AND is_argen_standard = true
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0))

UNION ALL

SELECT 
  '활성화된 자재 - unit 없음' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_active = true
  AND is_argen_standard = true
  AND (unit IS NULL OR unit = '')

UNION ALL

SELECT 
  '활성화된 자재 - 아르젠 기준 아님' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_active = true
  AND is_argen_standard = false

UNION ALL

SELECT 
  '활성화된 노무 - 생산성 정보 없음' as issue_type,
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











