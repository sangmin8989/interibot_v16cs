-- ============================================================
-- 헌법 실행: construction_phases 테이블에 공정 데이터 추가
-- ============================================================
-- 
-- 문제: labor_costs.phase_id가 construction_phases를 참조 (외래 키)
-- 해결: construction_phases 테이블에 먼저 공정 ID 추가
-- ============================================================

-- 1. 먼저 현재 construction_phases 테이블 확인
SELECT * FROM construction_phases ORDER BY phase_id;

-- 2. construction_phases 테이블에 새 공정 추가 (이미 있으면 무시)
INSERT INTO construction_phases (phase_id, phase_name, phase_order, is_active)
VALUES 
  ('demolition', '철거', 1, true),
  ('plumbing', '설비/배관', 2, true),
  ('electric', '전기', 3, true),
  ('plastering', '미장', 4, true),
  ('tile', '타일', 5, true),
  ('painting', '도장', 6, true),
  ('carpentry', '목공', 7, true),
  ('flooring', '바닥재', 8, true),
  ('kitchen', '주방', 9, true),
  ('bathroom', '욕실', 10, true),
  ('window', '창호/샤시', 11, true),
  ('door', '문', 12, true),
  ('finish', '마감', 13, true)
ON CONFLICT (phase_id) DO NOTHING;

-- 3. 추가된 결과 확인
SELECT * FROM construction_phases ORDER BY phase_order;







