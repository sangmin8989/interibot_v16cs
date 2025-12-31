-- ============================================================
-- 헌법 실행: 전체 공정 자재 데이터 추가
-- ============================================================
-- 
-- 목적: 모든 테스트 공정에 필요한 ARGEN 표준 자재 추가
-- 공정: finish, kitchen, bathroom, electric, plumbing
-- ============================================================

-- 1. 마감(finish) 공정 자재
-- 벽면/도배
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
  ('MAT-WALL-PAPER-001', 'finish', '벽면', '도배', '벽지', '실크벽지', '아르젠 표준', '롤', true, 1, true),
  ('MAT-WALL-PAPER-002', 'finish', '벽면', '도배', '벽지', '친환경 실크벽지', '아르젠 표준', '롤', true, 2, true),
  ('MAT-WALL-PAPER-003', 'finish', '벽면', '도배', '벽지', '합지벽지', '아르젠 표준', '롤', true, 3, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 바닥/마루
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
  ('MAT-FLOOR-WOOD-001', 'finish', '바닥', '마루', '강화마루', '강화마루 8T', '아르젠 표준', '㎡', true, 1, true),
  ('MAT-FLOOR-WOOD-002', 'finish', '바닥', '마루', '강마루', '강마루 12T', '아르젠 표준', '㎡', true, 2, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 2. 주방(kitchen) 공정 자재
-- 상판
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
  ('MAT-KITCHEN-TOP-001', 'kitchen', '주방', '상판', '인조대리석', '인조대리석 상판', '아르젠 표준', 'M', true, 1, true),
  ('MAT-KITCHEN-TOP-002', 'kitchen', '주방', '상판', '엔지니어드스톤', '엔지니어드스톤 상판', '아르젠 표준', 'M', true, 2, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 싱크볼
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
  ('MAT-KITCHEN-SINK-001', 'kitchen', '주방', '싱크볼', '스테인리스', '스테인리스 싱크볼', '아르젠 표준', 'EA', true, 1, true),
  ('MAT-KITCHEN-SINK-002', 'kitchen', '주방', '싱크볼', '언더싱크', '언더 싱크볼', '아르젠 표준', 'EA', true, 2, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 수전
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
  ('MAT-KITCHEN-FAUCET-001', 'kitchen', '주방', '수전', '일반수전', '주방 수전', '아르젠 표준', 'EA', true, 1, true),
  ('MAT-KITCHEN-FAUCET-002', 'kitchen', '주방', '수전', '절수수전', '절수형 주방 수전', '아르젠 표준', 'EA', true, 2, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 3. 욕실(bathroom) 공정 자재
-- 타일
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
  ('MAT-BATH-TILE-001', 'bathroom', '욕실', '타일', '벽타일', '욕실 벽타일', '아르젠 표준', '㎡', true, 1, true),
  ('MAT-BATH-TILE-002', 'bathroom', '욕실', '타일', '바닥타일', '욕실 바닥타일', '아르젠 표준', '㎡', true, 2, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 변기
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
  ('MAT-BATH-TOILET-001', 'bathroom', '욕실', '변기', '일반변기', '일반 양변기', '아르젠 표준', 'EA', true, 1, true),
  ('MAT-BATH-TOILET-002', 'bathroom', '욕실', '변기', '비데일체형', '비데일체형 변기', '아르젠 표준', 'EA', true, 2, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 세면대
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
  ('MAT-BATH-SINK-001', 'bathroom', '욕실', '세면대', '일반세면대', '일반 세면대', '아르젠 표준', 'EA', true, 1, true),
  ('MAT-BATH-SINK-002', 'bathroom', '욕실', '세면대', '수납세면대', '수납형 세면대', '아르젠 표준', 'EA', true, 2, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 욕조/샤워부스
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
  ('MAT-BATH-SHOWER-001', 'bathroom', '욕실', '샤워부스', '일반샤워부스', '샤워부스', '아르젠 표준', 'EA', true, 1, true),
  ('MAT-BATH-TUB-001', 'bathroom', '욕실', '욕조', '일반욕조', '욕조', '아르젠 표준', 'EA', true, 2, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 4. 전기(electric) 공정 자재
-- 조명
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
  ('MAT-ELEC-LIGHT-001', 'electric', '전기', '조명', 'LED등', 'LED 직부등', '아르젠 표준', 'EA', true, 1, true),
  ('MAT-ELEC-LIGHT-002', 'electric', '전기', '조명', '매입등', 'LED 매입등', '아르젠 표준', 'EA', true, 2, true),
  ('MAT-ELEC-LIGHT-003', 'electric', '전기', '조명', '간접조명', 'LED 간접조명', '아르젠 표준', 'M', true, 3, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 스위치/콘센트
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
  ('MAT-ELEC-SWITCH-001', 'electric', '전기', '스위치', '일반스위치', '일반 스위치', '아르젠 표준', 'EA', true, 1, true),
  ('MAT-ELEC-OUTLET-001', 'electric', '전기', '콘센트', '일반콘센트', '일반 콘센트', '아르젠 표준', 'EA', true, 2, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- 5. 배관(plumbing) 공정 자재
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
  ('MAT-PLUMB-PIPE-001', 'plumbing', '배관', '급수관', '동관', '동관', '아르젠 표준', 'M', true, 1, true),
  ('MAT-PLUMB-PIPE-002', 'plumbing', '배관', '배수관', 'PVC', 'PVC 배수관', '아르젠 표준', 'M', true, 2, true)
ON CONFLICT (material_code) DO UPDATE 
SET 
  is_argen_standard = true,
  argen_priority = EXCLUDED.argen_priority,
  is_active = true;

-- ============================================================
-- 결과 확인
-- ============================================================

-- 공정별 자재 개수 확인
SELECT 
  phase_id,
  COUNT(*) as material_count,
  COUNT(CASE WHEN is_argen_standard = true THEN 1 END) as argen_standard_count
FROM materials 
WHERE phase_id IN ('finish', 'kitchen', 'bathroom', 'electric', 'plumbing')
  AND is_active = true
GROUP BY phase_id
ORDER BY phase_id;

-- 전체 자재 목록 확인
SELECT 
  phase_id,
  category_1,
  category_2,
  product_name,
  brand_argen,
  unit,
  is_argen_standard,
  argen_priority
FROM materials 
WHERE phase_id IN ('finish', 'kitchen', 'bathroom', 'electric', 'plumbing')
  AND is_argen_standard = true
  AND is_active = true
ORDER BY phase_id, category_1, category_2, argen_priority;














