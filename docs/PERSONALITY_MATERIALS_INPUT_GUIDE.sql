-- ============================================================
-- personality_materials 데이터 입력 가이드
-- ============================================================
-- 
-- 파일명: PERSONALITY_MATERIALS_INPUT_GUIDE.sql
-- 생성일: 2025-12-12
-- 목적: personality_materials 테이블 데이터 입력을 위한 참조 데이터 조회 및 샘플 입력
-- 
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일의 각 섹션을 순서대로 실행
--
-- ============================================================

-- ============================================================
-- Step 1: 참조 데이터 조회 (입력 전 필수 확인)
-- ============================================================

-- 1-1. personality_traits 조회 (trait_id 확인용)
SELECT 
  trait_id,
  trait_code,
  trait_name,
  trait_category
FROM personality_traits
ORDER BY trait_category, trait_id;

-- 1-2. materials 조회 (material_id 확인용) - 샘플 20개
SELECT 
  id AS material_id,
  material_code,
  product_name,
  category_1,
  category_2,
  category_3,
  brand_basic,
  brand_standard,
  brand_argen,
  brand_premium
FROM materials
ORDER BY category_1, product_name
LIMIT 20;

-- 1-3. construction_phases 조회 (phase_id 확인용)
SELECT 
  id AS phase_id,
  phase_name,
  phase_order,
  category
FROM construction_phases
ORDER BY phase_order;

-- ============================================================
-- Step 2: personality_materials 입력 예시
-- ============================================================
-- 
-- 입력 형식:
-- INSERT INTO personality_materials (
--   trait_id,           -- personality_traits의 trait_id
--   material_id,        -- materials의 id (UUID)
--   phase_id,           -- construction_phases의 id (선택사항, NULL 가능)
--   score_threshold,    -- 추천 기준 점수 (1-5 또는 1-10)
--   score_direction,   -- 'gte' (이상), 'lte' (이하), 'eq' (같음)
--   recommendation_type,-- 'upgrade', 'downgrade', 'must', 'optional'
--   grade_adjustment,   -- 등급 조정 (-2, -1, 0, +1, +2)
--   priority,           -- 우선순위 (1-100, 높을수록 우선)
--   reason_template     -- 추천 이유 템플릿
-- ) VALUES (...);
--
-- ============================================================

-- ============================================================
-- Step 3: 샘플 데이터 입력 (예시 10개)
-- ============================================================
-- 
-- 주의: 아래 쿼리는 예시입니다.
-- 실제 입력 시에는 Step 1에서 조회한 실제 ID 값을 사용해야 합니다.
--

-- 예시 1: 정리정돈 습관이 높은 사람(4점 이상) → 수납장 강화 추천
-- (실제 material_id, trait_id는 Step 1에서 조회한 값으로 교체 필요)
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
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'organization_habit'),
  (SELECT id FROM materials WHERE material_code = 'STORAGE_CABINET_01' LIMIT 1),
  NULL, -- phase_id는 선택사항
  4, -- 4점 이상
  'gte',
  'upgrade',
  0, -- 등급 조정 없음
  80, -- 높은 우선순위
  '정리정돈을 좋아하시니 수납 공간을 강화하는 것을 추천드려요'
);
*/

-- ============================================================
-- Step 4: 입력 전 확인 쿼리 (실제 입력 시 사용)
-- ============================================================

-- 4-1. 특정 성향 코드로 trait_id 찾기
SELECT 
  trait_id,
  trait_code,
  trait_name
FROM personality_traits
WHERE trait_code = 'organization_habit'; -- 예시: 정리정돈 습관

-- 4-2. 특정 자재 코드로 material_id 찾기
SELECT 
  id AS material_id,
  material_code,
  product_name,
  category_1
FROM materials
WHERE material_code LIKE '%CABINET%' -- 예시: 수납장 관련
   OR product_name LIKE '%수납%'
LIMIT 10;

-- 4-3. 특정 공정으로 phase_id 찾기
SELECT 
  id AS phase_id,
  phase_name,
  category
FROM construction_phases
WHERE phase_name LIKE '%수납%' -- 예시: 수납 관련 공정
   OR category LIKE '%storage%';

-- ============================================================
-- Step 5: 입력 후 확인 쿼리
-- ============================================================

-- 5-1. 입력된 매핑 개수 확인
SELECT COUNT(*) AS total_mappings FROM personality_materials;

-- 5-2. 성향별 매핑 개수
SELECT 
  pt.trait_code,
  pt.trait_name,
  COUNT(pm.mapping_id) AS mapping_count
FROM personality_traits pt
LEFT JOIN personality_materials pm ON pt.trait_id = pm.trait_id
GROUP BY pt.trait_id, pt.trait_code, pt.trait_name
ORDER BY mapping_count DESC;

-- 5-3. 자재별 매핑 개수
SELECT 
  m.material_code,
  m.product_name,
  COUNT(pm.mapping_id) AS mapping_count
FROM materials m
LEFT JOIN personality_materials pm ON m.id = pm.material_id
WHERE pm.mapping_id IS NOT NULL
GROUP BY m.id, m.material_code, m.product_name
ORDER BY mapping_count DESC
LIMIT 20;

-- 5-4. 샘플 매핑 데이터 확인
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  m.material_code,
  m.product_name,
  pm.score_threshold,
  pm.score_direction,
  pm.recommendation_type,
  pm.priority,
  pm.reason_template
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
ORDER BY pm.priority DESC, pm.mapping_id
LIMIT 20;

-- ============================================================
-- Step 6: 입력 템플릿 (복사해서 사용)
-- ============================================================

/*
-- 템플릿 1: 성향 점수 높을 때 업그레이드 추천
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
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'TRAIT_CODE_HERE'),
  (SELECT id FROM materials WHERE material_code = 'MATERIAL_CODE_HERE' LIMIT 1),
  NULL, -- 또는 (SELECT id FROM construction_phases WHERE phase_name = 'PHASE_NAME_HERE' LIMIT 1)
  4, -- 기준 점수
  'gte', -- 이상
  'upgrade', -- 업그레이드 추천
  0, -- 등급 조정
  70, -- 우선순위
  '추천 이유 템플릿'
);

-- 템플릿 2: 성향 점수 낮을 때 다운그레이드 추천
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
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'TRAIT_CODE_HERE'),
  (SELECT id FROM materials WHERE material_code = 'MATERIAL_CODE_HERE' LIMIT 1),
  NULL,
  3, -- 기준 점수
  'lte', -- 이하
  'downgrade', -- 다운그레이드 추천
  -1, -- 등급 1단계 낮춤
  60, -- 우선순위
  '추천 이유 템플릿'
);

-- 템플릿 3: 필수 추천 (must)
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
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'TRAIT_CODE_HERE'),
  (SELECT id FROM materials WHERE material_code = 'MATERIAL_CODE_HERE' LIMIT 1),
  NULL,
  5, -- 기준 점수
  'gte', -- 이상
  'must', -- 필수 추천
  0, -- 등급 조정 없음
  90, -- 매우 높은 우선순위
  '이 성향이 강하시면 반드시 고려하세요'
);
*/

-- ============================================================
-- Step 7: 일괄 입력 예시 (여러 개 한 번에)
-- ============================================================

/*
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES
  -- 첫 번째 매핑
  (
    (SELECT trait_id FROM personality_traits WHERE trait_code = 'organization_habit'),
    (SELECT id FROM materials WHERE material_code = 'MATERIAL_1' LIMIT 1),
    NULL, 4, 'gte', 'upgrade', 0, 80, '정리정돈을 좋아하시니 수납 공간 강화 추천'
  ),
  -- 두 번째 매핑
  (
    (SELECT trait_id FROM personality_traits WHERE trait_code = 'sensory_sensitivity'),
    (SELECT id FROM materials WHERE material_code = 'MATERIAL_2' LIMIT 1),
    NULL, 4, 'gte', 'upgrade', 1, 85, '시각 민감도가 높으시니 고급 마감재 추천'
  ),
  -- 세 번째 매핑
  (
    (SELECT trait_id FROM personality_traits WHERE trait_code = 'budget_sense'),
    (SELECT id FROM materials WHERE material_code = 'MATERIAL_3' LIMIT 1),
    NULL, 3, 'lte', 'downgrade', -1, 70, '예산 감각이 좋으시니 가성비 자재 추천'
  );
*/

-- ============================================================
-- 참고: 입력 시 주의사항
-- ============================================================
-- 
-- 1. trait_id는 반드시 personality_traits 테이블에 존재하는 값이어야 합니다.
-- 2. material_id는 반드시 materials 테이블에 존재하는 UUID여야 합니다.
-- 3. phase_id는 NULL이거나 construction_phases 테이블에 존재하는 값이어야 합니다.
-- 4. score_threshold는 1-10 사이의 정수입니다 (일반적으로 1-5).
-- 5. score_direction은 'gte', 'lte', 'eq' 중 하나입니다.
-- 6. recommendation_type은 'upgrade', 'downgrade', 'must', 'optional' 중 하나입니다.
-- 7. grade_adjustment는 -2 ~ +2 사이의 정수입니다.
-- 8. priority는 1-100 사이의 정수입니다 (높을수록 우선순위 높음).
-- 9. reason_template는 추천 이유를 설명하는 텍스트입니다.
--
-- ============================================================
















