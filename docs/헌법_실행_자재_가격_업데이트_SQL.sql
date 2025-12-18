-- ============================================================
-- 헌법 실행: 자재 가격 업데이트
-- ============================================================
-- 
-- 목적: 추가된 자재 데이터에 가격 정보 추가
-- 헌법 v1 엔진은 price_argen 또는 price 컬럼을 사용합니다
-- ============================================================

-- 1. 마감(finish) 공정 자재 가격
-- 벽면/도배 (롤당 가격)
UPDATE materials SET price_argen = 40000 WHERE material_code = 'MAT-WALL-PAPER-001'; -- 실크벽지
UPDATE materials SET price_argen = 50000 WHERE material_code = 'MAT-WALL-PAPER-002'; -- 친환경 실크벽지
UPDATE materials SET price_argen = 30000 WHERE material_code = 'MAT-WALL-PAPER-003'; -- 합지벽지

-- 바닥/마루 (㎡당 가격)
UPDATE materials SET price_argen = 30000 WHERE material_code = 'MAT-FLOOR-WOOD-001'; -- 강화마루 8T
UPDATE materials SET price_argen = 40000 WHERE material_code = 'MAT-FLOOR-WOOD-002'; -- 강마루 12T

-- 2. 주방(kitchen) 공정 자재 가격
-- 상판 (M당 가격)
UPDATE materials SET price_argen = 150000 WHERE material_code = 'MAT-KITCHEN-TOP-001'; -- 인조대리석 상판
UPDATE materials SET price_argen = 200000 WHERE material_code = 'MAT-KITCHEN-TOP-002'; -- 엔지니어드스톤 상판

-- 싱크볼 (개당 가격)
UPDATE materials SET price_argen = 200000 WHERE material_code = 'MAT-KITCHEN-SINK-001'; -- 스테인리스 싱크볼
UPDATE materials SET price_argen = 300000 WHERE material_code = 'MAT-KITCHEN-SINK-002'; -- 언더 싱크볼

-- 수전 (개당 가격)
UPDATE materials SET price_argen = 80000 WHERE material_code = 'MAT-KITCHEN-FAUCET-001'; -- 주방 수전
UPDATE materials SET price_argen = 120000 WHERE material_code = 'MAT-KITCHEN-FAUCET-002'; -- 절수형 주방 수전

-- 3. 욕실(bathroom) 공정 자재 가격
-- 타일 (㎡당 가격)
UPDATE materials SET price_argen = 45000 WHERE material_code = 'MAT-BATH-TILE-001'; -- 욕실 벽타일
UPDATE materials SET price_argen = 50000 WHERE material_code = 'MAT-BATH-TILE-002'; -- 욕실 바닥타일

-- 변기 (개당 가격)
UPDATE materials SET price_argen = 300000 WHERE material_code = 'MAT-BATH-TOILET-001'; -- 일반 양변기
UPDATE materials SET price_argen = 500000 WHERE material_code = 'MAT-BATH-TOILET-002'; -- 비데일체형 변기

-- 세면대 (개당 가격)
UPDATE materials SET price_argen = 150000 WHERE material_code = 'MAT-BATH-SINK-001'; -- 일반 세면대
UPDATE materials SET price_argen = 250000 WHERE material_code = 'MAT-BATH-SINK-002'; -- 수납형 세면대

-- 욕조/샤워부스 (개당 가격)
UPDATE materials SET price_argen = 400000 WHERE material_code = 'MAT-BATH-SHOWER-001'; -- 샤워부스
UPDATE materials SET price_argen = 600000 WHERE material_code = 'MAT-BATH-TUB-001'; -- 욕조

-- 4. 전기(electric) 공정 자재 가격
-- 조명 (개당 가격, 간접조명은 M당)
UPDATE materials SET price_argen = 50000 WHERE material_code = 'MAT-ELEC-LIGHT-001'; -- LED 직부등
UPDATE materials SET price_argen = 40000 WHERE material_code = 'MAT-ELEC-LIGHT-002'; -- LED 매입등
UPDATE materials SET price_argen = 30000 WHERE material_code = 'MAT-ELEC-LIGHT-003'; -- LED 간접조명 (M당)
-- LED 다운라이트 (개당 가격) - 추가
UPDATE materials SET price_argen = 35000 WHERE category_1 = '조명' AND category_2 = '다운라이트' AND product_name LIKE '%LED 다운라이트 3인치 5W%' AND is_argen_standard = true;

-- 스위치/콘센트 (개당 가격)
UPDATE materials SET price_argen = 15000 WHERE material_code = 'MAT-ELEC-SWITCH-001'; -- 일반 스위치
UPDATE materials SET price_argen = 20000 WHERE material_code = 'MAT-ELEC-OUTLET-001'; -- 일반 콘센트

-- 5. 배관(plumbing) 공정 자재 가격
-- 배관 (M당 가격)
UPDATE materials SET price_argen = 35000 WHERE material_code = 'MAT-PLUMB-PIPE-001'; -- 동관
UPDATE materials SET price_argen = 25000 WHERE material_code = 'MAT-PLUMB-PIPE-002'; -- PVC 배수관

-- ============================================================
-- 결과 확인
-- ============================================================

-- 가격이 설정된 자재 확인
SELECT 
  phase_id,
  category_1,
  category_2,
  product_name,
  unit,
  price_argen,
  price,
  CASE 
    WHEN price_argen IS NOT NULL THEN 'price_argen 사용'
    WHEN price IS NOT NULL THEN 'price 사용'
    ELSE '가격 없음'
  END as price_status
FROM materials 
WHERE phase_id IN ('finish', 'kitchen', 'bathroom', 'electric', 'plumbing')
  AND is_argen_standard = true
  AND is_active = true
ORDER BY phase_id, category_1, category_2, argen_priority;

-- 가격이 없는 자재 확인 (문제 진단용)
SELECT 
  material_code,
  phase_id,
  category_1,
  category_2,
  product_name
FROM materials 
WHERE phase_id IN ('finish', 'kitchen', 'bathroom', 'electric', 'plumbing')
  AND is_argen_standard = true
  AND is_active = true
  AND (price_argen IS NULL AND price IS NULL)
ORDER BY phase_id, category_1, category_2;






