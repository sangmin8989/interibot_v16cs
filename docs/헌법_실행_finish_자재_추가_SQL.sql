-- ============================================================
-- 헌법 실행: finish 공정 자재 데이터 추가
-- ============================================================
-- 
-- 문제: 벽면/도배 자재가 DB에 없어서 finish 공정 실패
-- 해결: ARGEN 표준 벽지 자재 추가
-- ============================================================

-- 1. 벽면/도배 자재 추가 (ARGEN 표준)
INSERT INTO materials (
  material_code,
  phase_id,
  category_1,
  category_2,
  category_3,
  product_name,
  brand_argen,
  unit,
  is_argen_standard,
  argen_priority,
  is_active
)
VALUES 
  -- 일반 벽지
  (
    'MAT-WALL-PAPER-001',
    'finish',
    '벽면',
    '도배',
    '벽지',
    '실크벽지',
    '아르젠 표준',
    '롤',
    true,
    1,
    true
  ),
  -- 친환경 벽지
  (
    'MAT-WALL-PAPER-002',
    'finish',
    '벽면',
    '도배',
    '벽지',
    '친환경 실크벽지',
    '아르젠 표준',
    '롤',
    true,
    2,
    true
  ),
  -- 합지벽지
  (
    'MAT-WALL-PAPER-003',
    'finish',
    '벽면',
    '도배',
    '벽지',
    '합지벽지',
    '아르젠 표준',
    '롤',
    true,
    3,
    true
  )
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 2. 바닥/마루 자재 추가 (finish 공정에 포함될 수 있음)
INSERT INTO materials (
  material_code,
  phase_id,
  category_1,
  category_2,
  category_3,
  product_name,
  brand_argen,
  unit,
  is_argen_standard,
  argen_priority,
  is_active
)
VALUES 
  -- 강화마루
  (
    'MAT-FLOOR-WOOD-001',
    'finish',
    '바닥',
    '마루',
    '강화마루',
    '강화마루 8T',
    '아르젠 표준',
    '㎡',
    true,
    1,
    true
  ),
  -- 강마루
  (
    'MAT-FLOOR-WOOD-002',
    'finish',
    '바닥',
    '마루',
    '강마루',
    '강마루 12T',
    '아르젠 표준',
    '㎡',
    true,
    2,
    true
  )
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 3. 결과 확인
SELECT 
  material_code,
  category_1,
  category_2,
  category_3,
  product_name,
  brand_argen,
  unit,
  is_argen_standard,
  argen_priority
FROM materials 
WHERE category_1 IN ('벽면', '바닥')
  AND is_argen_standard = true
ORDER BY category_1, category_2, argen_priority;






