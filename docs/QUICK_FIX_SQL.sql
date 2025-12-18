-- ============================================================
-- 빠른 수정 SQL - 누락된 데이터 및 객체 생성
-- 작성일: 2025-12-12
-- 목적: personality_traits 데이터, 뷰, 함수 생성
-- ============================================================

-- ============================================================
-- 1. personality_traits 데이터 입력 (15개)
-- ============================================================

INSERT INTO personality_traits (trait_code, trait_name, trait_category, description, min_score, max_score) VALUES
('space_sense', '공간 감각', '감각', '공간을 넓게 느끼고 싶은 정도', 1, 5),
('sensory_sensitivity', '시각 민감도', '감각', '디테일과 색상에 대한 민감도', 1, 5),
('auditory_sensitivity', '청각 민감도', '감각', '소음에 대한 민감도', 1, 5),
('cleaning_preference', '청소 성향', '습관', '청소를 자주 하는 정도', 1, 5),
('organization_habit', '정리정돈 습관', '습관', '정리정돈을 좋아하는 정도', 1, 5),
('family_composition', '가족 구성', '생활', '가족 중심 생활 정도', 1, 5),
('health_factors', '건강 요소', '선호', '건강과 안전에 대한 중요도', 1, 5),
('budget_sense', '예산 감각', '선호', '가성비를 중시하는 정도', 1, 5),
('color_preference', '색감 취향', '선호', '특정 색상 선호도', 1, 5),
('lighting_preference', '조명 취향', '선호', '조명에 대한 관심도', 1, 5),
('home_purpose', '집 사용 목적', '생활', '집을 어떻게 사용하는지', 1, 5),
('discomfort_factors', '불편 요소', '생활', '현재 집에서 불편한 점', 1, 5),
('activity_flow', '활동 동선', '생활', '집에서의 활동 패턴', 1, 5),
('life_routine', '생활 루틴', '생활', '일상 생활 패턴', 1, 5),
('sleep_pattern', '수면 패턴', '생활', '수면에 대한 민감도', 1, 5),
('hobby_lifestyle', '취미/라이프스타일', '생활', '취미와 라이프스타일', 1, 5)
ON CONFLICT (trait_code) DO NOTHING;

-- 확인
SELECT COUNT(*) as trait_count FROM personality_traits;
-- 예상 결과: 15

-- ============================================================
-- 2. v_personality_materials 뷰 생성
-- ============================================================

CREATE OR REPLACE VIEW v_personality_materials AS
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  pt.trait_category,
  pm.material_id,
  pm.phase_id,
  pm.score_threshold,
  pm.score_direction,
  pm.recommendation_type,
  pm.grade_adjustment,
  pm.priority,
  pm.reason_template,
  pm.is_active,
  m.material_code,
  m.product_name,
  m.category_1,
  m.category_2,
  m.category_3,
  m.brand_basic,
  m.brand_standard,
  m.brand_argen,
  m.brand_premium,
  m.argen_made
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pm.is_active = true;

-- 확인
SELECT * FROM v_personality_materials LIMIT 1;
-- 뷰가 생성되었는지 확인 (데이터가 없어도 뷰는 생성됨)

-- ============================================================
-- 3. get_recommended_materials 함수 생성
-- ============================================================

CREATE OR REPLACE FUNCTION get_recommended_materials(
  p_trait_scores JSONB,
  p_phase_id VARCHAR(10) DEFAULT NULL
)
RETURNS TABLE (
  mapping_id INT,
  trait_code VARCHAR(50),
  trait_name VARCHAR(100),
  material_id UUID,
  phase_id VARCHAR(10),
  recommendation_type VARCHAR(20),
  grade_adjustment INT,
  priority INT,
  reason_template TEXT,
  material_code VARCHAR(20),
  product_name VARCHAR(100),
  category_1 VARCHAR(50),
  category_2 VARCHAR(50),
  category_3 VARCHAR(50),
  brand_basic VARCHAR(50),
  brand_standard VARCHAR(50),
  brand_argen VARCHAR(50),
  brand_premium VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.mapping_id,
    pt.trait_code,
    pt.trait_name,
    pm.material_id,
    pm.phase_id,
    pm.recommendation_type,
    pm.grade_adjustment,
    pm.priority,
    pm.reason_template,
    m.material_code,
    m.product_name,
    m.category_1,
    m.category_2,
    m.category_3,
    m.brand_basic,
    m.brand_standard,
    m.brand_argen,
    m.brand_premium
  FROM personality_materials pm
  JOIN personality_traits pt ON pm.trait_id = pt.trait_id
  LEFT JOIN materials m ON pm.material_id = m.id
  WHERE pm.is_active = true
    AND (p_phase_id IS NULL OR pm.phase_id = p_phase_id)
    AND (
      (pm.score_direction = 'gte' AND (p_trait_scores->>pt.trait_code)::INT >= pm.score_threshold)
      OR (pm.score_direction = 'lte' AND (p_trait_scores->>pt.trait_code)::INT <= pm.score_threshold)
      OR (pm.score_direction = 'eq' AND (p_trait_scores->>pt.trait_code)::INT = pm.score_threshold)
    )
  ORDER BY pm.priority DESC, pm.mapping_id;
END;
$$ LANGUAGE plpgsql;

-- 확인
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_recommended_materials';
-- 함수가 생성되었는지 확인

-- ============================================================
-- 4. answer_score_mapping 샘플 데이터 입력
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('quick_first_scene', 'hotel_hallway', 'quick', '{"organization_habit": 9, "color_preference": 8}'::jsonb),
('quick_first_scene', 'warm_kitchen', 'quick', '{"family_composition": 8, "home_purpose": 7}'::jsonb),
('quick_first_scene', 'cozy_living', 'quick', '{"home_purpose": 8, "color_preference": 7}'::jsonb),
('quick_priority', 'storage', 'quick', '{"organization_habit": 9, "activity_flow": 8}'::jsonb),
('quick_priority', 'aesthetic', 'quick', '{"sensory_sensitivity": 9, "color_preference": 8, "lighting_preference": 8}'::jsonb),
('quick_priority', 'function', 'quick', '{"activity_flow": 9, "life_routine": 8, "cleaning_preference": 7}'::jsonb),
('quick_priority', 'comfort', 'quick', '{"home_purpose": 9, "auditory_sensitivity": 8, "health_factors": 8}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- 확인
SELECT COUNT(*) as mapping_count FROM answer_score_mapping;
-- 예상 결과: 7

-- ============================================================
-- 5. 최종 확인
-- ============================================================

-- 모든 테이블 데이터 개수 확인
SELECT 
  'personality_traits' as table_name, COUNT(*) as count FROM personality_traits
UNION ALL
SELECT 
  'personality_materials' as table_name, COUNT(*) as count FROM personality_materials
UNION ALL
SELECT 
  'answer_score_mapping' as table_name, COUNT(*) as count FROM answer_score_mapping
UNION ALL
SELECT 
  'materials' as table_name, COUNT(*) as count FROM materials
UNION ALL
SELECT 
  'construction_phases' as table_name, COUNT(*) as count FROM construction_phases;

