-- ============================================================
-- get_recommended_materials 함수 직접 테스트
-- ============================================================
-- 
-- 파일명: TEST_FUNCTION_DIRECTLY.sql
-- 생성일: 2025-12-12
-- 목적: 함수가 정상 작동하는지 직접 테스트
--
-- ============================================================

-- ============================================================
-- Step 1: 함수 존재 확인
-- ============================================================

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_recommended_materials';

-- ============================================================
-- Step 2: 함수 직접 호출 테스트
-- ============================================================

-- 2-1. organization_habit = 8일 때 (테스트 케이스)
SELECT * FROM get_recommended_materials(
  '{"organization_habit": 8}'::jsonb,
  NULL
);

-- 2-2. 여러 성향으로 테스트
SELECT * FROM get_recommended_materials(
  '{"organization_habit": 8, "lighting_preference": 5, "auditory_sensitivity": 4}'::jsonb,
  NULL
);

-- 2-3. 모든 성향 포함 (실제 사용 시나리오)
SELECT * FROM get_recommended_materials(
  '{
    "space_sense": 5,
    "sensory_sensitivity": 5,
    "cleaning_preference": 5,
    "organization_habit": 8,
    "family_composition": 5,
    "health_factors": 5,
    "budget_sense": 5,
    "color_preference": 5,
    "lighting_preference": 5,
    "home_purpose": 5,
    "discomfort_factors": 5,
    "activity_flow": 5,
    "life_routine": 5,
    "sleep_pattern": 5,
    "hobby_lifestyle": 5
  }'::jsonb,
  NULL
);

-- ============================================================
-- Step 3: 직접 쿼리로 동일한 결과 확인
-- ============================================================

-- 3-1. organization_habit = 8일 때 직접 쿼리
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  pm.score_threshold,
  pm.score_direction,
  m.material_code,
  m.product_name
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pt.trait_code = 'organization_habit'
  AND pm.is_active = true
  AND pm.score_direction = 'gte'
  AND 8 >= pm.score_threshold;

-- 3-2. 여러 성향으로 직접 쿼리
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  pm.score_threshold,
  pm.score_direction,
  m.material_code,
  m.product_name
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pm.is_active = true
  AND (
    (pt.trait_code = 'organization_habit' AND pm.score_direction = 'gte' AND 8 >= pm.score_threshold)
    OR (pt.trait_code = 'lighting_preference' AND pm.score_direction = 'gte' AND 5 >= pm.score_threshold)
    OR (pt.trait_code = 'auditory_sensitivity' AND pm.score_direction = 'gte' AND 4 >= pm.score_threshold)
  );

-- ============================================================
-- Step 4: 함수와 직접 쿼리 결과 비교
-- ============================================================

-- 4-1. 함수 결과 개수
SELECT 
  '함수 결과' AS source,
  COUNT(*) AS count
FROM get_recommended_materials(
  '{"organization_habit": 8, "lighting_preference": 5, "auditory_sensitivity": 4}'::jsonb,
  NULL
);

-- 4-2. 직접 쿼리 결과 개수
SELECT 
  '직접 쿼리 결과' AS source,
  COUNT(*) AS count
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
WHERE pm.is_active = true
  AND (
    (pt.trait_code = 'organization_habit' AND pm.score_direction = 'gte' AND 8 >= pm.score_threshold)
    OR (pt.trait_code = 'lighting_preference' AND pm.score_direction = 'gte' AND 5 >= pm.score_threshold)
    OR (pt.trait_code = 'auditory_sensitivity' AND pm.score_direction = 'gte' AND 4 >= pm.score_threshold)
  );
