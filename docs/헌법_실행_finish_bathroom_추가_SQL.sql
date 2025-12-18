-- ============================================================
-- 헌법 실행: finish, bathroom 공정 labor_costs 데이터 추가
-- ============================================================
-- 
-- 문제: labor_costs에 finish, bathroom 공정 데이터 없음
-- 해결: 기존 데이터를 활용하거나 새로 추가
-- ============================================================

-- 1. finish 공정: 마감 작업 (도배나 도장과 유사한 단가 사용)
--    기존 도배(carpentry) 또는 도장(painting) 단가를 참고하여 추가
INSERT INTO labor_costs (labor_code, phase_id, labor_type, daily_rate, is_current, valid_from)
VALUES 
  ('LC-FINISH-001', 'finish', '마감', 300000, true, CURRENT_DATE)
ON CONFLICT (labor_code) DO UPDATE 
SET phase_id = 'finish', is_current = true;

-- 2. bathroom 공정: 욕실 작업 (설비나 타일과 유사한 단가 사용)
--    기존 설비(plumbing) 또는 타일(plastering) 단가를 참고하여 추가
INSERT INTO labor_costs (labor_code, phase_id, labor_type, daily_rate, is_current, valid_from)
VALUES 
  ('LC-BATHROOM-001', 'bathroom', '욕실', 350000, true, CURRENT_DATE)
ON CONFLICT (labor_code) DO UPDATE 
SET phase_id = 'bathroom', is_current = true;

-- 3. 결과 확인
SELECT phase_id, labor_type, daily_rate, labor_code 
FROM labor_costs 
WHERE phase_id IN ('finish', 'bathroom') AND is_current = true;

-- 4. 전체 공정별 매칭 확인
SELECT 
  lp.phase_id as productivity_phase,
  lp.labor_unit,
  lp.daily_output,
  lc.phase_id as cost_phase,
  lc.labor_type,
  lc.daily_rate,
  CASE WHEN lp.phase_id = lc.phase_id THEN '✅' ELSE '❌' END as match_status
FROM labor_productivity lp
LEFT JOIN labor_costs lc ON lp.phase_id = lc.phase_id AND lc.is_current = true
WHERE lp.is_active = true
ORDER BY lp.phase_id;






