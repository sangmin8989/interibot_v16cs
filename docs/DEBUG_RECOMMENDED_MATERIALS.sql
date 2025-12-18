-- ============================================================
-- recommendedMaterials 조회 문제 진단 쿼리
-- ============================================================
-- 
-- 파일명: DEBUG_RECOMMENDED_MATERIALS.sql
-- 생성일: 2025-12-12
-- 목적: getRecommendedMaterialsFromDB가 0개를 반환하는 원인 진단
-- 
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일의 각 섹션을 순서대로 실행
--
-- ============================================================

-- ============================================================
-- 1. personality_materials 데이터 확인
-- ============================================================

-- 1-1. 전체 개수 확인
SELECT COUNT(*) AS total_count FROM personality_materials;

-- 1-2. 활성 데이터 확인
SELECT COUNT(*) AS active_count FROM personality_materials WHERE is_active = true;

-- 1-3. 모든 매핑 데이터 확인
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  pm.score_threshold,
  pm.score_direction,
  pm.recommendation_type,
  pm.is_active,
  m.material_code,
  m.product_name
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
ORDER BY pm.mapping_id;

-- ============================================================
-- 2. 테스트 케이스: organization_habit = 8
-- ============================================================

-- 2-1. organization_habit 매핑 확인
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  pm.score_threshold,
  pm.score_direction,
  pm.recommendation_type,
  pm.is_active,
  CASE 
    WHEN pm.score_direction = 'gte' AND 8 >= pm.score_threshold THEN '✅ 매칭됨'
    WHEN pm.score_direction = 'lte' AND 8 <= pm.score_threshold THEN '✅ 매칭됨'
    WHEN pm.score_direction = 'eq' AND 8 = pm.score_threshold THEN '✅ 매칭됨'
    ELSE '❌ 매칭 안됨'
  END AS 매칭상태
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
WHERE pt.trait_code = 'organization_habit'
  AND pm.is_active = true;

-- 2-2. organization_habit = 8일 때 매칭되는 매핑 확인
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  pm.score_threshold,
  pm.score_direction,
  pm.recommendation_type,
  m.material_code,
  m.product_name
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pt.trait_code = 'organization_habit'
  AND pm.is_active = true
  AND (
    (pm.score_direction = 'gte' AND 8 >= pm.score_threshold)
    OR (pm.score_direction = 'lte' AND 8 <= pm.score_threshold)
    OR (pm.score_direction = 'eq' AND 8 = pm.score_threshold)
  );

-- ============================================================
-- 3. get_recommended_materials 함수 직접 테스트
-- ============================================================

-- 3-1. 함수 존재 확인
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_recommended_materials';

-- 3-2. 함수 직접 호출 테스트 (organization_habit = 8)
SELECT * FROM get_recommended_materials(
  '{"organization_habit": 8}'::jsonb,
  NULL
);

-- 3-3. 함수 직접 호출 테스트 (여러 성향)
SELECT * FROM get_recommended_materials(
  '{"organization_habit": 8, "lighting_preference": 5, "auditory_sensitivity": 4}'::jsonb,
  NULL
);

-- ============================================================
-- 4. getRecommendedMaterialsDirect 로직 재현
-- ============================================================

-- 4-1. personality_materials 직접 조회 (organization_habit = 8)
SELECT 
  pm.mapping_id,
  pt.trait_id,
  pt.trait_code,
  pt.trait_name,
  pm.material_id,
  pm.phase_id,
  pm.score_threshold,
  pm.score_direction,
  pm.recommendation_type,
  pm.grade_adjustment,
  pm.priority,
  pm.reason_template,
  pm.is_active
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
WHERE pt.trait_code = 'organization_habit'
  AND pm.is_active = true
  AND (
    (pm.score_direction = 'gte' AND 8 >= pm.score_threshold)
    OR (pm.score_direction = 'lte' AND 8 <= pm.score_threshold)
    OR (pm.score_direction = 'eq' AND 8 = pm.score_threshold)
  );

-- ============================================================
-- 5. 문제 해결 가이드
-- ============================================================

-- 5-1. is_active = false인 경우 활성화
/*
UPDATE personality_materials 
SET is_active = true 
WHERE is_active = false;
*/

-- 5-2. score_threshold가 너무 높은 경우 확인
SELECT 
  pt.trait_code,
  pm.score_threshold,
  pm.score_direction,
  COUNT(*) AS count
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
WHERE pm.is_active = true
GROUP BY pt.trait_code, pm.score_threshold, pm.score_direction
ORDER BY pt.trait_code, pm.score_threshold;

-- 5-3. organization_habit = 8일 때 매칭되는지 확인
-- 위의 2-2 쿼리 결과를 확인하세요.
-- 결과가 없다면:
--   - score_threshold가 8보다 큰지 확인
--   - score_direction이 'gte'인데 threshold가 9 이상인지 확인

-- ============================================================
-- 6. 예상되는 문제와 해결
-- ============================================================

-- 문제 1: score_threshold가 9 이상
-- → organization_habit = 8일 때 'gte' 조건으로는 매칭 안됨
-- 해결: score_threshold를 4로 낮추거나, 테스트 점수를 9로 올림

-- 문제 2: is_active = false
-- → 활성화되지 않은 매핑은 조회 안됨
-- 해결: UPDATE로 is_active = true로 변경

-- 문제 3: 함수 호출 시 JSONB 형식 오류
-- → 함수가 JSONB를 제대로 파싱하지 못함
-- 해결: 함수 정의 확인

-- ============================================================
-- 7. 빠른 수정 쿼리 (필요 시)
-- ============================================================

-- 7-1. 모든 매핑 활성화
/*
UPDATE personality_materials 
SET is_active = true;
*/

-- 7-2. score_threshold 조정 (예: 4 이상으로 낮춤)
/*
UPDATE personality_materials
SET score_threshold = 4
WHERE score_threshold > 4
  AND score_direction = 'gte';
*/
















