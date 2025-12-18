-- ============================================================
-- 헌법 실행: labor_costs 테이블 phase_id 매핑 업데이트
-- ============================================================
-- 
-- 문제: labor_productivity와 labor_costs의 phase_id 형식이 다름
--   - labor_productivity: 'demolition', 'finish', 'kitchen' 등
--   - labor_costs: '02', '05', '06' 등 (숫자 코드)
--
-- 해결: labor_costs의 phase_id를 문자열로 업데이트
-- ============================================================

-- 1. 매핑 테이블 (참고용)
-- 숫자 코드 → 문자열 매핑
-- 02 = demolition (철거)
-- 05 = plumbing (설비/배관)
-- 06 = electric (전기)
-- 08 = plastering (미장)
-- 10 = painting (도장)

-- 2. labor_costs 테이블 phase_id 업데이트
UPDATE labor_costs SET phase_id = 'demolition' WHERE phase_id = '02' OR labor_type = '철거';
UPDATE labor_costs SET phase_id = 'plumbing' WHERE phase_id = '05' OR labor_type LIKE '%배관%' OR labor_type LIKE '%설비%';
UPDATE labor_costs SET phase_id = 'electric' WHERE phase_id = '06' OR labor_type = '전기';
UPDATE labor_costs SET phase_id = 'plastering' WHERE phase_id = '08' OR labor_type = '미장';
UPDATE labor_costs SET phase_id = 'painting' WHERE phase_id = '10' OR labor_type = '도장';
UPDATE labor_costs SET phase_id = 'tile' WHERE phase_id = '09' OR labor_type = '타일';
UPDATE labor_costs SET phase_id = 'carpentry' WHERE phase_id = '11' OR labor_type = '목공';
UPDATE labor_costs SET phase_id = 'flooring' WHERE phase_id = '12' OR labor_type LIKE '%바닥%' OR labor_type LIKE '%마루%';
UPDATE labor_costs SET phase_id = 'kitchen' WHERE phase_id = '13' OR labor_type LIKE '%주방%' OR labor_type LIKE '%씽크%';
UPDATE labor_costs SET phase_id = 'bathroom' WHERE phase_id = '14' OR labor_type LIKE '%욕실%' OR labor_type LIKE '%화장실%';
UPDATE labor_costs SET phase_id = 'window' WHERE phase_id = '15' OR labor_type LIKE '%창호%' OR labor_type LIKE '%샤시%';
UPDATE labor_costs SET phase_id = 'door' WHERE phase_id = '16' OR labor_type LIKE '%문%';
UPDATE labor_costs SET phase_id = 'finish' WHERE phase_id = '17' OR labor_type LIKE '%마감%';

-- 3. 업데이트 결과 확인
SELECT phase_id, labor_type, daily_rate, labor_code 
FROM labor_costs 
WHERE is_current = true
ORDER BY phase_id;

-- 4. labor_productivity와 매칭 확인
SELECT 
  lp.phase_id as productivity_phase,
  lp.labor_unit,
  lp.daily_output,
  lc.phase_id as cost_phase,
  lc.labor_type,
  lc.daily_rate
FROM labor_productivity lp
LEFT JOIN labor_costs lc ON lp.phase_id = lc.phase_id AND lc.is_current = true
WHERE lp.is_active = true;






