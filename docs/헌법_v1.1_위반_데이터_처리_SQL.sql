-- ============================================================
-- 헌법 v1.1 - 위반 데이터 처리 SQL
-- ============================================================
-- 
-- 목적: 제약조건 적용 전에 위반 데이터 처리
-- 
-- 처리 방법:
-- 1. 가격이 없는 자재는 비활성화 (is_active = false)
-- 2. unit이 없는 자재는 비활성화
-- 3. 아르젠 기준이 아닌 자재는 비활성화 (이미 is_active = false인 경우는 제외)
-- 
-- ⚠️ 주의: 이 SQL을 실행하기 전에 백업을 권장합니다.
-- ============================================================

-- ============================================================
-- 1. 가격이 없는 자재 비활성화
-- ============================================================

-- 가격이 없고 활성화된 자재를 비활성화
UPDATE materials
SET is_active = false
WHERE is_argen_standard = true
  AND is_active = true
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0));

-- 처리 결과 확인
SELECT 
  '가격 없음으로 비활성화된 자재' as action,
  COUNT(*) as affected_rows
FROM materials
WHERE is_argen_standard = true
  AND is_active = false
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0));

-- ============================================================
-- 2. unit이 없는 자재 비활성화
-- ============================================================

-- unit이 없고 활성화된 자재를 비활성화
UPDATE materials
SET is_active = false
WHERE is_argen_standard = true
  AND is_active = true
  AND (unit IS NULL OR unit = '');

-- 처리 결과 확인
SELECT 
  'unit 없음으로 비활성화된 자재' as action,
  COUNT(*) as affected_rows
FROM materials
WHERE is_argen_standard = true
  AND is_active = false
  AND (unit IS NULL OR unit = '');

-- ============================================================
-- 3. 아르젠 기준이 아닌 활성화된 자재 비활성화
-- ============================================================

-- 아르젠 기준이 아니고 활성화된 자재를 비활성화
UPDATE materials
SET is_active = false
WHERE is_argen_standard = false
  AND is_active = true;

-- 처리 결과 확인
SELECT 
  '아르젠 기준 아님으로 비활성화된 자재' as action,
  COUNT(*) as affected_rows
FROM materials
WHERE is_argen_standard = false
  AND is_active = false;

-- ============================================================
-- 4. 최종 확인: 제약조건 위반 데이터가 남아있는지 확인
-- ============================================================

-- 가격이 없고 활성화된 자재 확인 (0건이어야 함)
SELECT 
  '가격 없음 (활성화됨)' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_argen_standard = true
  AND is_active = true
  AND ((price IS NULL OR price <= 0) AND (price_argen IS NULL OR price_argen <= 0))

UNION ALL

-- unit이 없고 활성화된 자재 확인 (0건이어야 함)
SELECT 
  'unit 없음 (활성화됨)' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_argen_standard = true
  AND is_active = true
  AND (unit IS NULL OR unit = '')

UNION ALL

-- 아르젠 기준이 아니고 활성화된 자재 확인 (0건이어야 함)
SELECT 
  '아르젠 기준 아님 (활성화됨)' as issue_type,
  COUNT(*) as violation_count
FROM materials
WHERE is_argen_standard = false
  AND is_active = true

UNION ALL

-- 노무 생산성 정보가 불완전한 공정 확인 (0건이어야 함)
SELECT 
  '노무 생산성 정보 없음' as issue_type,
  COUNT(*) as violation_count
FROM labor_productivity
WHERE is_active = true
  AND (daily_output IS NULL OR daily_output <= 0 OR crew_size IS NULL OR crew_size <= 0)

UNION ALL

-- 노무 단가가 0이거나 null인 공정 확인 (0건이어야 함)
SELECT 
  '노무 단가 없음' as issue_type,
  COUNT(*) as violation_count
FROM labor_costs
WHERE (daily_rate IS NULL OR daily_rate <= 0 OR is_current != true);

-- ============================================================
-- 5. 처리 완료 후 상태 확인
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

-- ============================================================
-- 참고: 가격을 나중에 추가하고 싶은 자재 복구 방법
-- ============================================================

-- 예시: 특정 자재의 가격을 추가하고 다시 활성화
-- UPDATE materials
-- SET price = 50000,  -- 또는 price_argen = 50000
--     is_active = true
-- WHERE id = '자재_ID';




