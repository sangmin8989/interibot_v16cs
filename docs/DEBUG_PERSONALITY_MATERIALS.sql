-- ============================================================
-- personality_materials 데이터 입력 문제 진단 쿼리
-- ============================================================
-- 
-- 파일명: DEBUG_PERSONALITY_MATERIALS.sql
-- 생성일: 2025-12-12
-- 목적: personality_materials 데이터가 입력되지 않은 원인 진단
-- 
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일의 각 섹션을 순서대로 실행
--
-- ============================================================

-- ============================================================
-- 1. 기본 확인: personality_materials 테이블에 데이터가 있는지
-- ============================================================

-- 1-1. 전체 개수 확인 (is_active 무관)
SELECT 
  'personality_materials 전체 개수' AS info,
  COUNT(*) AS count
FROM personality_materials;

-- 1-2. 활성 데이터 개수 확인
SELECT 
  'personality_materials 활성 개수' AS info,
  COUNT(*) AS count
FROM personality_materials
WHERE is_active = true;

-- 1-3. 비활성 데이터 개수 확인
SELECT 
  'personality_materials 비활성 개수' AS info,
  COUNT(*) AS count
FROM personality_materials
WHERE is_active = false;

-- 1-4. 모든 데이터 확인 (최대 50개)
SELECT 
  mapping_id,
  trait_id,
  material_id,
  phase_id,
  score_threshold,
  score_direction,
  recommendation_type,
  is_active,
  created_at
FROM personality_materials
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================
-- 2. 참조 무결성 확인 (JOIN 실패 원인 진단)
-- ============================================================

-- 2-1. trait_id 참조 확인
SELECT 
  'trait_id 참조 오류' AS check_type,
  COUNT(*) AS error_count
FROM personality_materials pm
LEFT JOIN personality_traits pt ON pm.trait_id = pt.trait_id
WHERE pt.trait_id IS NULL;

-- 2-2. material_id 참조 확인
SELECT 
  'material_id 참조 오류' AS check_type,
  COUNT(*) AS error_count
FROM personality_materials pm
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pm.material_id IS NOT NULL AND m.id IS NULL;

-- 2-3. phase_id 참조 확인
SELECT 
  'phase_id 참조 오류' AS check_type,
  COUNT(*) AS error_count
FROM personality_materials pm
LEFT JOIN construction_phases cp ON pm.phase_id = cp.id
WHERE pm.phase_id IS NOT NULL AND cp.id IS NULL;

-- 2-4. 참조 오류가 있는 데이터 상세 확인
SELECT 
  pm.mapping_id,
  pm.trait_id,
  pm.material_id,
  pm.phase_id,
  CASE 
    WHEN pt.trait_id IS NULL THEN '❌ trait_id 오류'
    WHEN pm.material_id IS NOT NULL AND m.id IS NULL THEN '❌ material_id 오류'
    WHEN pm.phase_id IS NOT NULL AND cp.id IS NULL THEN '❌ phase_id 오류'
    ELSE '✅ 정상'
  END AS status
FROM personality_materials pm
LEFT JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
LEFT JOIN construction_phases cp ON pm.phase_id = cp.id
WHERE pt.trait_id IS NULL 
   OR (pm.material_id IS NOT NULL AND m.id IS NULL)
   OR (pm.phase_id IS NOT NULL AND cp.id IS NULL)
LIMIT 20;

-- ============================================================
-- 3. personality_traits 테이블 확인
-- ============================================================

-- 3-1. personality_traits 개수 확인
SELECT 
  'personality_traits 개수' AS info,
  COUNT(*) AS count
FROM personality_traits;

-- 3-2. personality_traits 샘플 확인
SELECT 
  trait_id,
  trait_code,
  trait_name,
  trait_category
FROM personality_traits
ORDER BY trait_id
LIMIT 20;

-- ============================================================
-- 4. materials 테이블 확인 (material_id 참조용)
-- ============================================================

-- 4-1. materials 개수 확인
SELECT 
  'materials 개수' AS info,
  COUNT(*) AS count
FROM materials;

-- 4-2. materials 샘플 확인 (id 컬럼 확인)
SELECT 
  id AS material_id,
  material_code,
  product_name,
  category_1
FROM materials
ORDER BY id
LIMIT 10;

-- ============================================================
-- 5. 입력 시도 재현 (테스트용)
-- ============================================================

-- 5-1. personality_traits에서 trait_id 조회 테스트
SELECT 
  'organization_habit trait_id' AS test_name,
  trait_id,
  trait_code,
  trait_name
FROM personality_traits
WHERE trait_code = 'organization_habit';

-- 5-2. materials에서 material_id 조회 테스트
SELECT 
  'materials 샘플 id' AS test_name,
  id AS material_id,
  material_code,
  product_name
FROM materials
WHERE category_1 = '수납' 
   OR product_name LIKE '%수납%'
LIMIT 5;

-- 5-3. 테스트 입력 (실제 입력 전 확인용)
-- 주의: 이 쿼리는 실행하지 마세요. 참고용입니다.
/*
INSERT INTO personality_materials (
  trait_id,
  material_id,
  phase_id,
  score_threshold,
  score_direction,
  recommendation_type,
  grade_adjustment,
  priority,
  reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'organization_habit' LIMIT 1),
  (SELECT id FROM materials WHERE category_1 = '수납' OR product_name LIKE '%수납%' LIMIT 1),
  NULL,
  4,
  'gte',
  'upgrade',
  0,
  80,
  '정리정돈을 좋아하시니 수납 공간을 강화하는 것을 추천드려요'
);
*/

-- ============================================================
-- 6. 문제 해결 가이드
-- ============================================================

-- 6-1. 데이터가 전혀 없는 경우
-- → PERSONALITY_MATERIALS_SAMPLE_INPUT.sql 파일을 다시 실행하세요.

-- 6-2. 데이터는 있지만 JOIN이 안 되는 경우
-- → trait_id, material_id, phase_id 값이 올바른지 확인하세요.

-- 6-3. is_active = false인 경우
-- → 아래 쿼리로 활성화하세요:
/*
UPDATE personality_materials 
SET is_active = true 
WHERE is_active = false;
*/

-- 6-4. 참조 오류가 있는 경우
-- → 오류가 있는 데이터를 삭제하고 다시 입력하세요:
/*
DELETE FROM personality_materials 
WHERE trait_id NOT IN (SELECT trait_id FROM personality_traits)
   OR (material_id IS NOT NULL AND material_id NOT IN (SELECT id FROM materials))
   OR (phase_id IS NOT NULL AND phase_id NOT IN (SELECT id FROM construction_phases));
*/

-- ============================================================
-- 7. 간단한 테스트 입력 (1개만)
-- ============================================================

-- 이 쿼리를 실행하여 정상 작동하는지 확인하세요.
-- 실행 전에 아래 서브쿼리가 실제 데이터를 반환하는지 먼저 확인하세요.

-- 7-1. 서브쿼리 확인 (실행 전 필수)
SELECT 
  'trait_id 확인' AS check_step,
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'organization_habit' LIMIT 1) AS trait_id,
  (SELECT trait_name FROM personality_traits WHERE trait_code = 'organization_habit' LIMIT 1) AS trait_name;

SELECT 
  'material_id 확인' AS check_step,
  (SELECT id FROM materials WHERE category_1 = '수납' OR product_name LIKE '%수납%' LIMIT 1) AS material_id,
  (SELECT product_name FROM materials WHERE category_1 = '수납' OR product_name LIKE '%수납%' LIMIT 1) AS product_name;

-- 7-2. 테스트 입력 (위 확인이 성공한 경우에만 실행)
/*
INSERT INTO personality_materials (
  trait_id,
  material_id,
  phase_id,
  score_threshold,
  score_direction,
  recommendation_type,
  grade_adjustment,
  priority,
  reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'organization_habit' LIMIT 1),
  (SELECT id FROM materials WHERE category_1 = '수납' OR product_name LIKE '%수납%' LIMIT 1),
  NULL,
  4,
  'gte',
  'upgrade',
  0,
  80,
  '정리정돈을 좋아하시니 수납 공간을 강화하는 것을 추천드려요'
)
ON CONFLICT DO NOTHING;

-- 입력 확인
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  m.material_code,
  m.product_name
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pt.trait_code = 'organization_habit'
ORDER BY pm.mapping_id DESC
LIMIT 1;
*/
















