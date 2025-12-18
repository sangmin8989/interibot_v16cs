-- ============================================================
-- personality_materials 샘플 데이터 입력
-- ============================================================
-- 
-- 파일명: PERSONALITY_MATERIALS_SAMPLE_INPUT.sql
-- 생성일: 2025-12-12
-- 목적: personality_materials 테이블 샘플 데이터 입력 (실제 입력 전 참고용)
-- 
-- 주의사항:
-- 1. 이 쿼리를 실행하기 전에 PERSONALITY_MATERIALS_INPUT_GUIDE.sql의 Step 1을 먼저 실행하여
--    실제 trait_id, material_id, phase_id 값을 확인하세요.
-- 2. 아래 쿼리의 서브쿼리(SELECT ...)가 실제 데이터를 찾지 못하면 에러가 발생합니다.
-- 3. 실제 입력 시에는 이 쿼리를 참고하여 자신의 데이터에 맞게 수정하세요.
--
-- ============================================================

-- ============================================================
-- Step 1: 입력 전 확인 (필수!)
-- ============================================================

-- 1-1. personality_traits 확인
SELECT trait_id, trait_code, trait_name FROM personality_traits ORDER BY trait_id;

-- 1-2. materials 샘플 확인 (수납, 조명, 타일 등)
SELECT 
  id AS material_id,
  material_code,
  product_name,
  category_1
FROM materials
WHERE category_1 IN ('수납', '조명', '타일', '바닥', '벽', '문', '창호')
   OR product_name LIKE '%수납%'
   OR product_name LIKE '%조명%'
   OR product_name LIKE '%타일%'
ORDER BY category_1, product_name
LIMIT 30;

-- 1-3. construction_phases 확인
SELECT id AS phase_id, phase_name, category FROM construction_phases ORDER BY phase_order;

-- ============================================================
-- Step 2: 샘플 데이터 입력 (예시 10개)
-- ============================================================
-- 
-- 아래 쿼리는 예시입니다. 실제 입력 시에는 Step 1에서 확인한 값으로 수정하세요.
--

-- 예시 1: 정리정돈 습관 높음(4점 이상) → 수납장 업그레이드 추천
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

-- 예시 2: 조명 취향 높음(4점 이상) → 조명 업그레이드 추천
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'lighting_preference' LIMIT 1),
  (SELECT id FROM materials WHERE category_1 = '조명' OR product_name LIKE '%조명%' LIMIT 1),
  NULL, 4, 'gte', 'upgrade', 1, 85,
  '조명에 관심이 많으시니 고급 조명 시스템을 추천드려요'
)
ON CONFLICT DO NOTHING;

-- 예시 3: 예산 감각 높음(3점 이하) → 가성비 자재 추천
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'budget_sense' LIMIT 1),
  (SELECT id FROM materials WHERE brand_basic IS NOT NULL LIMIT 1),
  NULL, 3, 'lte', 'downgrade', -1, 70,
  '예산 감각이 좋으시니 가성비 좋은 자재를 추천드려요'
)
ON CONFLICT DO NOTHING;

-- 예시 4: 시각 민감도 높음(4점 이상) → 고급 마감재 추천
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'sensory_sensitivity' LIMIT 1),
  (SELECT id FROM materials WHERE brand_premium IS NOT NULL OR brand_argen IS NOT NULL LIMIT 1),
  NULL, 4, 'gte', 'upgrade', 1, 85,
  '디테일과 색상에 민감하시니 고급 마감재를 추천드려요'
)
ON CONFLICT DO NOTHING;

-- 예시 5: 청각 민감도 높음(4점 이상) → 방음 자재 필수 추천
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'auditory_sensitivity' LIMIT 1),
  (SELECT id FROM materials WHERE product_name LIKE '%방음%' OR product_name LIKE '%소음%' LIMIT 1),
  NULL, 4, 'gte', 'must', 0, 90,
  '소음에 민감하시니 방음 자재를 반드시 고려하세요'
)
ON CONFLICT DO NOTHING;

-- 예시 6: 건강 요소 높음(4점 이상) → 친환경/건강 자재 추천
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'health_factors' LIMIT 1),
  (SELECT id FROM materials WHERE product_name LIKE '%친환경%' OR product_name LIKE '%건강%' LIMIT 1),
  NULL, 4, 'gte', 'upgrade', 0, 80,
  '건강을 중시하시니 친환경 자재를 추천드려요'
)
ON CONFLICT DO NOTHING;

-- 예시 7: 가족 구성 높음(4점 이상) → 안전/내구성 자재 추천
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'family_composition' LIMIT 1),
  (SELECT id FROM materials WHERE product_name LIKE '%안전%' OR product_name LIKE '%내구%' LIMIT 1),
  NULL, 4, 'gte', 'upgrade', 0, 75,
  '가족 중심 생활을 하시니 안전하고 내구성 좋은 자재를 추천드려요'
)
ON CONFLICT DO NOTHING;

-- 예시 8: 청소 성향 높음(4점 이상) → 청소하기 쉬운 자재 추천
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'cleaning_preference' LIMIT 1),
  (SELECT id FROM materials WHERE product_name LIKE '%방수%' OR product_name LIKE '%오염방지%' LIMIT 1),
  NULL, 4, 'gte', 'upgrade', 0, 75,
  '청소를 자주 하시니 관리하기 쉬운 자재를 추천드려요'
)
ON CONFLICT DO NOTHING;

-- 예시 9: 공간 감각 높음(4점 이상) → 공간을 넓어 보이게 하는 자재 추천
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'space_sense' LIMIT 1),
  (SELECT id FROM materials WHERE category_1 = '타일' OR category_1 = '바닥' LIMIT 1),
  NULL, 4, 'gte', 'upgrade', 0, 70,
  '공간을 넓게 느끼고 싶으시니 대형 타일이나 밝은 바닥재를 추천드려요'
)
ON CONFLICT DO NOTHING;

-- 예시 10: 수면 패턴 민감(4점 이상) → 차광/방음 자재 추천
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES (
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'sleep_pattern' LIMIT 1),
  (SELECT id FROM materials WHERE product_name LIKE '%차광%' OR product_name LIKE '%블라인드%' LIMIT 1),
  NULL, 4, 'gte', 'must', 0, 85,
  '수면에 민감하시니 차광/방음 자재를 반드시 고려하세요'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Step 3: 일괄 입력 예시 (여러 개 한 번에)
-- ============================================================
-- 
-- 아래 쿼리는 여러 매핑을 한 번에 입력하는 예시입니다.
-- 실제 입력 시에는 Step 1에서 확인한 값으로 수정하세요.
--

/*
INSERT INTO personality_materials (
  trait_id, material_id, phase_id, score_threshold, score_direction,
  recommendation_type, grade_adjustment, priority, reason_template
) VALUES
  -- 정리정돈 습관 → 수납장
  (
    (SELECT trait_id FROM personality_traits WHERE trait_code = 'organization_habit' LIMIT 1),
    (SELECT id FROM materials WHERE category_1 = '수납' LIMIT 1),
    NULL, 4, 'gte', 'upgrade', 0, 80, '정리정돈을 좋아하시니 수납 공간 강화 추천'
  ),
  -- 조명 취향 → 조명
  (
    (SELECT trait_id FROM personality_traits WHERE trait_code = 'lighting_preference' LIMIT 1),
    (SELECT id FROM materials WHERE category_1 = '조명' LIMIT 1),
    NULL, 4, 'gte', 'upgrade', 1, 85, '조명에 관심이 많으시니 고급 조명 추천'
  ),
  -- 예산 감각 → 가성비 자재
  (
    (SELECT trait_id FROM personality_traits WHERE trait_code = 'budget_sense' LIMIT 1),
    (SELECT id FROM materials WHERE brand_basic IS NOT NULL LIMIT 1),
    NULL, 3, 'lte', 'downgrade', -1, 70, '예산 감각이 좋으시니 가성비 자재 추천'
  );
*/

-- ============================================================
-- Step 4: 입력 후 확인
-- ============================================================

-- 4-1. 입력된 매핑 개수 확인
SELECT COUNT(*) AS total_mappings FROM personality_materials;

-- 4-2. 성향별 매핑 개수 확인
SELECT 
  pt.trait_code,
  pt.trait_name,
  COUNT(pm.mapping_id) AS mapping_count
FROM personality_traits pt
LEFT JOIN personality_materials pm ON pt.trait_id = pm.trait_id
GROUP BY pt.trait_id, pt.trait_code, pt.trait_name
ORDER BY mapping_count DESC;

-- 4-3. 입력된 샘플 데이터 확인
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
-- 참고: 입력 시 주의사항
-- ============================================================
-- 
-- 1. 서브쿼리(SELECT ... LIMIT 1)가 데이터를 찾지 못하면 에러가 발생합니다.
--    → Step 1을 먼저 실행하여 실제 존재하는 값인지 확인하세요.
--
-- 2. material_id는 UUID 타입이므로 반드시 materials 테이블의 id 컬럼 값을 사용해야 합니다.
--
-- 3. phase_id는 NULL이거나 construction_phases 테이블의 id 값을 사용해야 합니다.
--    (현재 스키마에서는 VARCHAR(10)이지만, 실제로는 id 컬럼을 참조)
--
-- 4. score_threshold는 1-10 사이의 정수입니다 (일반적으로 1-5).
--
-- 5. recommendation_type은 다음 중 하나여야 합니다:
--    - 'upgrade': 등급 업그레이드 추천
--    - 'downgrade': 등급 다운그레이드 추천
--    - 'must': 필수 추천
--    - 'optional': 선택적 추천
--
-- 6. priority는 1-100 사이의 정수입니다 (높을수록 우선순위 높음).
--
-- 7. 같은 (trait_id, material_id, phase_id) 조합은 중복 입력되지 않습니다.
--    (UNIQUE 제약조건이 있다면)
--
-- ============================================================

















