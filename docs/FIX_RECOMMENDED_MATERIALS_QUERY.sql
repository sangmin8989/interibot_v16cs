-- ============================================================
-- recommendedMaterials 조회 문제 해결 쿼리
-- ============================================================
-- 
-- 파일명: FIX_RECOMMENDED_MATERIALS_QUERY.sql
-- 생성일: 2025-12-12
-- 목적: personality_materials 데이터가 조회되지 않는 문제 해결
-- 
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일의 각 섹션을 순서대로 실행
--
-- ============================================================

-- ============================================================
-- Step 1: 현재 상태 확인
-- ============================================================

-- 1-1. 전체 데이터 확인
SELECT 
  '전체 개수' AS info,
  COUNT(*) AS count
FROM personality_materials;

-- 1-2. 활성 데이터 확인
SELECT 
  '활성 개수' AS info,
  COUNT(*) AS count
FROM personality_materials
WHERE is_active = true;

-- 1-3. 모든 매핑 상세 확인
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  pm.score_threshold,
  pm.score_direction,
  pm.is_active,
  m.material_code,
  m.product_name
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
ORDER BY pm.mapping_id;

-- ============================================================
-- Step 2: 문제 해결 (필요 시 실행)
-- ============================================================

-- 2-1. 모든 매핑 활성화 (is_active = false인 경우)
UPDATE personality_materials 
SET is_active = true 
WHERE is_active = false;

-- 2-2. 확인: 활성화 후 개수
SELECT 
  '활성화 후 개수' AS info,
  COUNT(*) AS count
FROM personality_materials
WHERE is_active = true;

-- ============================================================
-- Step 3: 함수 직접 테스트
-- ============================================================

-- 3-1. organization_habit = 8일 때 함수 호출
SELECT * FROM get_recommended_materials(
  '{"organization_habit": 8}'::jsonb,
  NULL
);

-- 3-2. 여러 성향으로 함수 호출
SELECT * FROM get_recommended_materials(
  '{"organization_habit": 8, "lighting_preference": 5, "auditory_sensitivity": 4}'::jsonb,
  NULL
);

-- ============================================================
-- Step 4: 직접 쿼리로 매칭 확인
-- ============================================================

-- 4-1. organization_habit = 8일 때 매칭되는 매핑
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  pm.score_threshold,
  pm.score_direction,
  CASE 
    WHEN pm.score_direction = 'gte' AND 8 >= pm.score_threshold THEN '✅ 매칭'
    WHEN pm.score_direction = 'lte' AND 8 <= pm.score_threshold THEN '✅ 매칭'
    WHEN pm.score_direction = 'eq' AND 8 = pm.score_threshold THEN '✅ 매칭'
    ELSE '❌ 매칭 안됨'
  END AS 매칭상태,
  m.material_code,
  m.product_name
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pt.trait_code = 'organization_habit'
  AND pm.is_active = true;

-- 4-2. 모든 성향에 대해 매칭 테스트 (organization_habit = 8)
SELECT 
  pt.trait_code,
  pt.trait_name,
  pm.score_threshold,
  pm.score_direction,
  CASE 
    WHEN pm.score_direction = 'gte' AND 8 >= pm.score_threshold THEN '✅ 매칭'
    WHEN pm.score_direction = 'lte' AND 8 <= pm.score_threshold THEN '✅ 매칭'
    WHEN pm.score_direction = 'eq' AND 8 = pm.score_threshold THEN '✅ 매칭'
    ELSE '❌ 매칭 안됨'
  END AS 매칭상태
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
WHERE pm.is_active = true
ORDER BY pt.trait_code, pm.score_threshold;

-- ============================================================
-- Step 5: v_personality_materials 뷰 확인
-- ============================================================

-- 5-1. 뷰에서 데이터 조회
SELECT * FROM v_personality_materials
LIMIT 10;

-- 5-2. 뷰에서 organization_habit 필터링
SELECT * FROM v_personality_materials
WHERE trait_code = 'organization_habit'
LIMIT 10;

-- ============================================================
-- Step 6: 최종 확인
-- ============================================================

-- 6-1. 함수가 정상 작동하는지 확인
SELECT 
  '함수 테스트' AS test_name,
  COUNT(*) AS result_count
FROM get_recommended_materials(
  '{"organization_habit": 8, "lighting_preference": 5, "auditory_sensitivity": 4, "sensory_sensitivity": 4}'::jsonb,
  NULL
);

-- 6-2. 직접 쿼리로 동일한 결과 확인
SELECT 
  '직접 쿼리 테스트' AS test_name,
  COUNT(*) AS result_count
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
WHERE pm.is_active = true
  AND (
    (pt.trait_code = 'organization_habit' AND pm.score_direction = 'gte' AND 8 >= pm.score_threshold)
    OR (pt.trait_code = 'lighting_preference' AND pm.score_direction = 'gte' AND 5 >= pm.score_threshold)
    OR (pt.trait_code = 'auditory_sensitivity' AND pm.score_direction = 'gte' AND 4 >= pm.score_threshold)
    OR (pt.trait_code = 'sensory_sensitivity' AND pm.score_direction = 'gte' AND 4 >= pm.score_threshold)
  );
















