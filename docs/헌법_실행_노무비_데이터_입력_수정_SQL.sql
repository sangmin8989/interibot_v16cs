-- ============================================================
-- 인테리봇 견적 시스템 헌법 실행 - 노무비 데이터 입력 SQL (수정 버전)
-- 작성일: 2024년 12월
-- 목적: labor_productivity, labor_difficulty_rules 테이블 데이터 입력
-- 사용법: Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- Step 1: labor_productivity 테이블 데이터 입력
-- 실제 컬럼: phase_id, labor_unit, daily_output, crew_size, base_difficulty
-- ============================================================

INSERT INTO labor_productivity (labor_code, phase_id, labor_unit, daily_output, crew_size, base_difficulty, description, is_active)
VALUES
  -- 철거 공정
  ('DEMO_01', 'demolition', 'm2', 25.0, 3, 1.0, '철거 공정 노무 생산성', true),
  
  -- 마감 공정 (도배/바닥)
  ('FINISH_01', 'finish', 'm2', 40.0, 2, 1.0, '마감 공정 노무 생산성', true),
  
  -- 주방 공정
  ('KITCHEN_01', 'kitchen', 'SET', 0.5, 2, 1.0, '주방 공정 노무 생산성', true),
  
  -- 욕실 공정
  ('BATHROOM_01', 'bathroom', 'SET', 0.7, 2, 1.0, '욕실 공정 노무 생산성', true),
  
  -- 조명/전기 공정
  ('ELECTRIC_01', 'electric', 'EA', 15.0, 1, 1.0, '조명/전기 공정 노무 생산성', true),
  
  -- 문 공정
  ('DOOR_01', 'door', 'EA', 2.0, 2, 1.0, '문 공정 노무 생산성', true),
  
  -- 창호 공정
  ('WINDOW_01', 'window', 'EA', 3.0, 2, 1.0, '창호 공정 노무 생산성', true),
  
  -- 수납 공정
  ('STORAGE_01', 'storage', 'EA', 1.0, 2, 1.0, '수납 공정 노무 생산성', true),
  
  -- 방수 공정
  ('WATERPROOF_01', 'waterproof', 'm2', 10.0, 1, 1.0, '방수 공정 노무 생산성', true),
  
  -- 설비 공정
  ('PLUMBING_01', 'plumbing', 'SET', 0.5, 2, 1.0, '설비 공정 노무 생산성', true),
  
  -- 폐기물 공정
  ('WASTE_01', 'waste', 'day', 1.0, 2, 1.0, '폐기물 공정 노무 생산성', true);

-- 확인
SELECT 
  'labor_productivity' as table_name,
  COUNT(*) as total_count
FROM labor_productivity
WHERE is_active = true;

-- ============================================================
-- Step 2: labor_difficulty_rules 테이블 데이터 입력
-- 실제 컬럼: labor_code, category_1, upgrade_condition, difficulty_multiplier
-- ============================================================

INSERT INTO labor_difficulty_rules (labor_code, category_1, category_2, upgrade_condition, difficulty_multiplier, description, is_active)
VALUES
  -- 욕실 공정 난이도
  ('BATHROOM_01', 'bathroom', 'tile', 'premium', 1.2, '프리미엄 타일 난이도 증가', true),
  ('BATHROOM_02', 'bathroom', 'tile', 'import', 1.3, '수입 타일 난이도 증가', true),
  ('BATHROOM_03', 'bathroom', 'tile', 'large_porcelain', 1.25, '대형 포세린 타일 난이도 증가', true),
  ('BATHROOM_04', 'bathroom', 'tile', 'slim', 1.3, '슬림 타일 난이도 증가', true),
  
  -- 주방 공정 난이도
  ('KITCHEN_01', 'kitchen', 'countertop', 'engineered_stone', 1.15, '엔지니어드 스톤 난이도 증가', true),
  ('KITCHEN_02', 'kitchen', 'countertop', 'ceramic', 1.2, '세라믹 난이도 증가', true),
  ('KITCHEN_03', 'kitchen', 'countertop', 'import', 1.25, '수입 상판 난이도 증가', true),
  ('KITCHEN_04', 'kitchen', 'general', 'premium', 1.2, '프리미엄 주방 난이도 증가', true),
  
  -- 마감 공정 난이도
  ('FINISH_01', 'finish', 'paint', 'eco_paint', 1.1, '친환경 도장 난이도 증가', true),
  ('FINISH_02', 'finish', 'wallpaper', 'premium_wallpaper', 1.15, '고급 벽지 난이도 증가', true),
  ('FINISH_03', 'finish', 'general', 'import', 1.15, '수입 마감재 난이도 증가', true),
  
  -- 수납 공정 난이도
  ('STORAGE_01', 'storage', 'film', 'premium_film', 1.2, '고급 필름 난이도 증가', true),
  ('STORAGE_02', 'storage', 'surface', 'complex_surface', 1.25, '복잡 표면 처리 난이도 증가', true);

-- 확인
SELECT 
  'labor_difficulty_rules' as table_name,
  COUNT(*) as total_count
FROM labor_difficulty_rules
WHERE is_active = true;

-- ============================================================
-- Step 3: 최종 확인
-- ============================================================

-- 전체 요약
SELECT 
  'labor_productivity' as table_name,
  COUNT(*) as total_count
FROM labor_productivity
WHERE is_active = true
UNION ALL
SELECT 
  'labor_difficulty_rules' as table_name,
  COUNT(*) as total_count
FROM labor_difficulty_rules
WHERE is_active = true
UNION ALL
SELECT 
  'labor_costs' as table_name,
  COUNT(*) as total_count
FROM labor_costs;

-- 완료 메시지
SELECT '✅ 노무비 데이터 입력 완료!' as status;






