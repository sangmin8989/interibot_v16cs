-- ============================================================
-- 인테리봇 견적 시스템 헌법 실행 - 노무비 데이터 입력 SQL
-- 작성일: 2024년 12월
-- 목적: labor_productivity, labor_difficulty_rules 테이블 데이터 입력
-- 사용법: Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- Step 1: labor_productivity 테이블 데이터 입력
-- 헌법 v1 필수: process_id, labor_unit, daily_output, crew_size
-- ============================================================

-- 기존 데이터 삭제 (선택 사항)
-- TRUNCATE TABLE labor_productivity;

-- 노무 생산성 데이터 입력
INSERT INTO labor_productivity (process_id, labor_unit, daily_output, crew_size, is_active)
VALUES
  -- 철거 공정
  ('demolition', 'm2', 25.0, 3, true),
  
  -- 마감 공정 (도배/바닥)
  ('finish', 'm2', 40.0, 2, true),
  
  -- 주방 공정
  ('kitchen', 'SET', 0.5, 2, true),
  
  -- 욕실 공정
  ('bathroom', 'SET', 0.7, 2, true),
  
  -- 조명/전기 공정
  ('electric', 'EA', 15.0, 1, true),
  
  -- 문 공정
  ('door', 'EA', 2.0, 2, true),
  
  -- 창호 공정
  ('window', 'EA', 3.0, 2, true),
  
  -- 수납 공정
  ('storage', 'EA', 1.0, 2, true),
  
  -- 방수 공정
  ('waterproof', 'm2', 10.0, 1, true),
  
  -- 설비 공정
  ('plumbing', 'SET', 0.5, 2, true),
  
  -- 폐기물 공정
  ('waste', 'day', 1.0, 2, true)
ON CONFLICT (process_id) DO UPDATE SET
  labor_unit = EXCLUDED.labor_unit,
  daily_output = EXCLUDED.daily_output,
  crew_size = EXCLUDED.crew_size,
  is_active = EXCLUDED.is_active;

-- 확인
SELECT 
  'labor_productivity' as table_name,
  COUNT(*) as total_count
FROM labor_productivity
WHERE is_active = true;

-- ============================================================
-- Step 2: labor_difficulty_rules 테이블 데이터 입력
-- 헌법 v1 필수: process_id, difficulty_factor
-- ============================================================

-- 기존 데이터 삭제 (선택 사항)
-- TRUNCATE TABLE labor_difficulty_rules;

-- 난이도 규칙 데이터 입력
INSERT INTO labor_difficulty_rules (process_id, difficulty_basis, difficulty_factor, is_active)
VALUES
  -- 욕실 공정 난이도
  ('bathroom', 'premium', 1.2, true),
  ('bathroom', 'import', 1.3, true),
  ('bathroom', 'large_porcelain', 1.25, true),
  ('bathroom', 'slim', 1.3, true),
  
  -- 주방 공정 난이도
  ('kitchen', 'engineered_stone', 1.15, true),
  ('kitchen', 'ceramic', 1.2, true),
  ('kitchen', 'import', 1.25, true),
  ('kitchen', 'premium', 1.2, true),
  
  -- 마감 공정 난이도
  ('finish', 'eco_paint', 1.1, true),
  ('finish', 'premium_wallpaper', 1.15, true),
  ('finish', 'import', 1.15, true),
  
  -- 수납 공정 난이도
  ('storage', 'premium_film', 1.2, true),
  ('storage', 'complex_surface', 1.25, true)
ON CONFLICT (process_id, difficulty_basis) DO UPDATE SET
  difficulty_factor = EXCLUDED.difficulty_factor,
  is_active = EXCLUDED.is_active;

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














