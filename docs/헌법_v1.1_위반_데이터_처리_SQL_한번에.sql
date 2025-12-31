-- ============================================================
-- 헌법 v1.1 - 위반 데이터 처리 SQL (한 번에 실행용)
-- ============================================================
-- 
-- ⚠️ 주의: 이 파일은 모든 UPDATE를 한 번에 실행합니다
-- Supabase SQL Editor에서 실행 시 오류가 발생하면
-- "헌법_v1.1_위반_데이터_처리_SQL_단계별.sql" 파일을 사용하세요
-- ============================================================

BEGIN;

-- 가격이 없고 활성화된 자재를 비활성화
UPDATE materials
SET is_active = false
WHERE is_argen_standard = true
  AND is_active = true
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0));

-- unit이 없고 활성화된 자재를 비활성화
UPDATE materials
SET is_active = false
WHERE is_argen_standard = true
  AND is_active = true
  AND (unit IS NULL OR unit = '');

-- 아르젠 기준이 아니고 활성화된 자재를 비활성화
UPDATE materials
SET is_active = false
WHERE is_argen_standard = false
  AND is_active = true;

COMMIT;

-- 최종 확인: 제약조건 위반 데이터가 남아있는지 확인
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











