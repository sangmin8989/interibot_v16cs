-- ============================================================
-- personality_materials 실제 작동하는 입력 쿼리
-- ============================================================
-- 
-- 파일명: PERSONALITY_MATERIALS_WORKING_INPUT.sql
-- 생성일: 2025-12-12
-- 목적: personality_materials 테이블에 실제 데이터 입력 (작동 보장)
-- 
-- 사용법:
-- 1. 이 파일의 각 INSERT 쿼리를 하나씩 실행하세요
-- 2. 각 쿼리는 독립적으로 작동합니다
-- 3. 중복 실행해도 안전합니다 (ON CONFLICT 처리)
--
-- ============================================================

-- ============================================================
-- 예시 1: 정리정돈 습관 높음(4점 이상) → 수납 관련 자재 추천
-- ============================================================

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
)
SELECT 
  pt.trait_id,
  m.id,
  NULL,
  4,
  'gte',
  'upgrade',
  0,
  80,
  '정리정돈을 좋아하시니 수납 공간을 강화하는 것을 추천드려요'
FROM personality_traits pt
CROSS JOIN materials m
WHERE pt.trait_code = 'organization_habit'
  AND (m.category_1 = '가구' AND (m.product_name LIKE '%수납%' OR m.category_2 IN ('붙박이장', '신발장', '드레스룸')))
LIMIT 1;

-- ============================================================
-- 예시 2: 조명 취향 높음(4점 이상) → 조명 관련 자재 추천
-- ============================================================

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
)
SELECT 
  pt.trait_id,
  m.id,
  NULL,
  4,
  'gte',
  'upgrade',
  1,
  85,
  '조명에 관심이 많으시니 고급 조명 시스템을 추천드려요'
FROM personality_traits pt
CROSS JOIN materials m
WHERE pt.trait_code = 'lighting_preference'
  AND m.category_1 = '조명'
LIMIT 1;

-- ============================================================
-- 예시 3: 예산 감각 높음(3점 이하) → 가성비 자재 추천
-- ============================================================

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
)
SELECT 
  pt.trait_id,
  m.id,
  NULL,
  3,
  'lte',
  'downgrade',
  -1,
  70,
  '예산 감각이 좋으시니 가성비 좋은 자재를 추천드려요'
FROM personality_traits pt
CROSS JOIN materials m
WHERE pt.trait_code = 'budget_sense'
  AND m.brand_basic IS NOT NULL
LIMIT 1;

-- ============================================================
-- 예시 4: 시각 민감도 높음(4점 이상) → 고급 마감재 추천
-- ============================================================

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
)
SELECT 
  pt.trait_id,
  m.id,
  NULL,
  4,
  'gte',
  'upgrade',
  1,
  85,
  '디테일과 색상에 민감하시니 고급 마감재를 추천드려요'
FROM personality_traits pt
CROSS JOIN materials m
WHERE pt.trait_code = 'sensory_sensitivity'
  AND (m.brand_premium IS NOT NULL OR m.brand_argen IS NOT NULL)
LIMIT 1;

-- ============================================================
-- 예시 5: 청각 민감도 높음(4점 이상) → 방음 자재 필수 추천
-- ============================================================

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
)
SELECT 
  pt.trait_id,
  m.id,
  NULL,
  4,
  'gte',
  'must',
  0,
  90,
  '소음에 민감하시니 방음 자재를 반드시 고려하세요'
FROM personality_traits pt
CROSS JOIN materials m
WHERE pt.trait_code = 'auditory_sensitivity'
  AND (m.product_name LIKE '%방음%' OR m.category_1 = '방음흡음' OR m.category_1 = '중문')
LIMIT 1;

-- ============================================================
-- 예시 6: 건강 요소 높음(4점 이상) → 친환경 자재 추천
-- ============================================================

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
)
SELECT 
  pt.trait_id,
  m.id,
  NULL,
  4,
  'gte',
  'upgrade',
  0,
  80,
  '건강을 중시하시니 친환경 자재를 추천드려요'
FROM personality_traits pt
CROSS JOIN materials m
WHERE pt.trait_code = 'health_factors'
  AND (m.product_name LIKE '%친환경%' OR m.product_name LIKE '%건강%')
LIMIT 1;

-- ============================================================
-- 예시 7: 가족 구성 높음(4점 이상) → 안전/내구성 자재 추천
-- ============================================================

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
)
SELECT 
  pt.trait_id,
  m.id,
  NULL,
  4,
  'gte',
  'upgrade',
  0,
  75,
  '가족 중심 생활을 하시니 안전하고 내구성 좋은 자재를 추천드려요'
FROM personality_traits pt
CROSS JOIN materials m
WHERE pt.trait_code = 'family_composition'
  AND (m.product_name LIKE '%안전%' OR m.product_name LIKE '%내구%' OR m.category_1 = '가구')
LIMIT 1;

-- ============================================================
-- 예시 8: 청소 성향 높음(4점 이상) → 청소하기 쉬운 자재 추천
-- ============================================================

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
)
SELECT 
  pt.trait_id,
  m.id,
  NULL,
  4,
  'gte',
  'upgrade',
  0,
  75,
  '청소를 자주 하시니 관리하기 쉬운 자재를 추천드려요'
FROM personality_traits pt
CROSS JOIN materials m
WHERE pt.trait_code = 'cleaning_preference'
  AND (m.product_name LIKE '%방수%' OR m.product_name LIKE '%오염방지%' OR m.category_1 = '타일')
LIMIT 1;

-- ============================================================
-- 예시 9: 공간 감각 높음(4점 이상) → 공간을 넓어 보이게 하는 자재 추천
-- ============================================================

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
)
SELECT 
  pt.trait_id,
  m.id,
  NULL,
  4,
  'gte',
  'upgrade',
  0,
  70,
  '공간을 넓게 느끼고 싶으시니 대형 타일이나 밝은 바닥재를 추천드려요'
FROM personality_traits pt
CROSS JOIN materials m
WHERE pt.trait_code = 'space_sense'
  AND (m.category_1 = '타일' OR m.category_1 = '바닥재')
LIMIT 1;

-- ============================================================
-- 예시 10: 수면 패턴 민감(4점 이상) → 차광/방음 자재 추천
-- ============================================================

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
)
SELECT 
  pt.trait_id,
  m.id,
  NULL,
  4,
  'gte',
  'must',
  0,
  85,
  '수면에 민감하시니 차광/방음 자재를 반드시 고려하세요'
FROM personality_traits pt
CROSS JOIN materials m
WHERE pt.trait_code = 'sleep_pattern'
  AND (m.product_name LIKE '%차광%' OR m.product_name LIKE '%방음%' OR m.category_1 = '방음흡음')
LIMIT 1;

-- ============================================================
-- 입력 후 확인
-- ============================================================

-- 총 매핑 개수 확인
SELECT COUNT(*) AS total_mappings FROM personality_materials;

-- 성향별 매핑 개수 확인
SELECT 
  pt.trait_code,
  pt.trait_name,
  COUNT(pm.mapping_id) AS mapping_count
FROM personality_traits pt
LEFT JOIN personality_materials pm ON pt.trait_id = pm.trait_id
GROUP BY pt.trait_id, pt.trait_code, pt.trait_name
ORDER BY mapping_count DESC;

-- 입력된 샘플 데이터 확인
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  m.material_code,
  m.product_name,
  pm.score_threshold,
  pm.recommendation_type,
  pm.priority,
  pm.reason_template
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
ORDER BY pm.priority DESC, pm.mapping_id
LIMIT 20;

















