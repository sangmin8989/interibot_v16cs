-- ============================================================
-- 인테리봇 필수 DB 데이터 입력 스크립트
-- 작성일: 2025-12-31
-- 목적: 견적 생성에 필요한 최소 필수 데이터 입력
-- 사용법: Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- 1. 바닥/마루 자재 데이터 입력
-- ============================================================

INSERT INTO materials (
  material_code,
  product_name,
  category_1,
  category_2,
  grade,
  is_active,
  price_argen,
  is_argen_standard,
  unit,
  brand_argen
) VALUES (
  'FLOOR-ARGEN-E-001',
  '바닥 마루 ARGEN E (라미네이트)',
  '바닥',
  '마루',
  'ARGEN_E',
  true,
  50000,
  true,
  'm2',
  '아르젠 표준'
)
ON CONFLICT (material_code) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  grade = EXCLUDED.grade,
  is_active = EXCLUDED.is_active,
  price_argen = EXCLUDED.price_argen,
  is_argen_standard = EXCLUDED.is_argen_standard;

-- ============================================================
-- 2. 욕실/욕실세트 자재 데이터 입력
-- ============================================================

INSERT INTO materials (
  material_code,
  product_name,
  category_1,
  category_2,
  grade,
  is_active,
  price_argen,
  is_argen_standard,
  unit,
  brand_argen
) VALUES (
  'BATH-ARGEN-E-001',
  '욕실세트 ARGEN E (세면대+변기+욕조)',
  '욕실',
  '욕실세트',
  'ARGEN_E',
  true,
  2000000,
  true,
  'SET',
  '아르젠 표준'
)
ON CONFLICT (material_code) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  grade = EXCLUDED.grade,
  is_active = EXCLUDED.is_active,
  price_argen = EXCLUDED.price_argen,
  is_argen_standard = EXCLUDED.is_argen_standard;

-- ============================================================
-- 3. 주방/시스템주방 자재 데이터 입력
-- ============================================================

INSERT INTO materials (
  material_code,
  product_name,
  category_1,
  category_2,
  grade,
  is_active,
  price_argen,
  is_argen_standard,
  unit,
  brand_argen
) VALUES (
  'KIT-ARGEN-E-001',
  '시스템주방 ARGEN E (하부장+상부장+상판)',
  '주방',
  '시스템주방',
  'ARGEN_E',
  true,
  3000000,
  true,
  'SET',
  '아르젠 표준'
)
ON CONFLICT (material_code) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  grade = EXCLUDED.grade,
  is_active = EXCLUDED.is_active,
  price_argen = EXCLUDED.price_argen,
  is_argen_standard = EXCLUDED.is_argen_standard;

-- ============================================================
-- 4. 노무 생산성 데이터 입력 (labor_productivity)
-- ============================================================

-- 바닥(마감) 노무 생산성
INSERT INTO labor_productivity (
  phase_id,
  labor_unit,
  daily_output,
  crew_size,
  base_difficulty,
  is_active
) VALUES (
  'finish',
  'm2',
  40.0,
  2,
  1.0,
  true
)
ON CONFLICT (phase_id) DO UPDATE SET
  labor_unit = EXCLUDED.labor_unit,
  daily_output = EXCLUDED.daily_output,
  crew_size = EXCLUDED.crew_size,
  base_difficulty = EXCLUDED.base_difficulty,
  is_active = EXCLUDED.is_active;

-- 욕실 노무 생산성
INSERT INTO labor_productivity (
  phase_id,
  labor_unit,
  daily_output,
  crew_size,
  base_difficulty,
  is_active
) VALUES (
  'bathroom',
  'SET',
  0.7,
  2,
  1.0,
  true
)
ON CONFLICT (phase_id) DO UPDATE SET
  labor_unit = EXCLUDED.labor_unit,
  daily_output = EXCLUDED.daily_output,
  crew_size = EXCLUDED.crew_size,
  base_difficulty = EXCLUDED.base_difficulty,
  is_active = EXCLUDED.is_active;

-- 주방 노무 생산성
INSERT INTO labor_productivity (
  phase_id,
  labor_unit,
  daily_output,
  crew_size,
  base_difficulty,
  is_active
) VALUES (
  'kitchen',
  'SET',
  0.5,
  2,
  1.0,
  true
)
ON CONFLICT (phase_id) DO UPDATE SET
  labor_unit = EXCLUDED.labor_unit,
  daily_output = EXCLUDED.daily_output,
  crew_size = EXCLUDED.crew_size,
  base_difficulty = EXCLUDED.base_difficulty,
  is_active = EXCLUDED.is_active;

-- ============================================================
-- 5. 노무비 데이터 입력 (labor_costs)
-- ============================================================

-- 바닥(마감) 노무비
INSERT INTO labor_costs (
  phase_id,
  daily_rate,
  is_current,
  is_active
) VALUES (
  'finish',
  300000,
  true,
  true
)
ON CONFLICT (phase_id) DO UPDATE SET
  daily_rate = EXCLUDED.daily_rate,
  is_current = EXCLUDED.is_current,
  is_active = EXCLUDED.is_active;

-- 욕실 노무비
INSERT INTO labor_costs (
  phase_id,
  daily_rate,
  is_current,
  is_active
) VALUES (
  'bathroom',
  350000,
  true,
  true
)
ON CONFLICT (phase_id) DO UPDATE SET
  daily_rate = EXCLUDED.daily_rate,
  is_current = EXCLUDED.is_current,
  is_active = EXCLUDED.is_active;

-- 주방 노무비
INSERT INTO labor_costs (
  phase_id,
  daily_rate,
  is_current,
  is_active
) VALUES (
  'kitchen',
  350000,
  true,
  true
)
ON CONFLICT (phase_id) DO UPDATE SET
  daily_rate = EXCLUDED.daily_rate,
  is_current = EXCLUDED.is_current,
  is_active = EXCLUDED.is_active;

-- ============================================================
-- 6. 데이터 확인 쿼리
-- ============================================================

-- 자재 확인
SELECT 
  '자재 데이터' as type,
  category_1,
  category_2,
  COUNT(*) as count,
  STRING_AGG(material_code, ', ') as codes
FROM materials
WHERE (category_1 = '바닥' AND category_2 = '마루')
   OR (category_1 = '욕실' AND category_2 = '욕실세트')
   OR (category_1 = '주방' AND category_2 = '시스템주방')
  AND is_active = true
GROUP BY category_1, category_2;

-- 노무 생산성 확인
SELECT 
  '노무 생산성' as type,
  phase_id,
  labor_unit,
  daily_output,
  crew_size
FROM labor_productivity
WHERE phase_id IN ('finish', 'bathroom', 'kitchen')
  AND is_active = true;

-- 노무비 확인
SELECT 
  '노무비' as type,
  phase_id,
  daily_rate,
  is_current
FROM labor_costs
WHERE phase_id IN ('finish', 'bathroom', 'kitchen')
  AND is_active = true
  AND is_current = true;

-- ============================================================
-- 완료 메시지
-- ============================================================

SELECT '✅ 필수 DB 데이터 입력 완료!' as message;
