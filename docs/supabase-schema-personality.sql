-- ============================================================
-- 인테리봇 성향-자재 매핑 시스템 테이블
-- 작성일: 2025년 12월 12일
-- 목적: 성향 분석 결과를 견적에 반영하기 위한 매핑 테이블
-- ============================================================

-- ============================================================
-- 1. 성향 항목 마스터 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS personality_traits (
  trait_id SERIAL PRIMARY KEY,
  trait_code VARCHAR(50) UNIQUE NOT NULL,
  trait_name VARCHAR(100) NOT NULL,
  trait_category VARCHAR(50) NOT NULL, -- '감각', '습관', '선호', '생활'
  description TEXT,
  min_score INT DEFAULT 1,
  max_score INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 성향 항목 초기 데이터 삽입
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

-- ============================================================
-- 2. 성향-자재 매핑 테이블 (핵심!)
-- ============================================================

CREATE TABLE IF NOT EXISTS personality_materials (
  mapping_id SERIAL PRIMARY KEY,
  trait_id INT REFERENCES personality_traits(trait_id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  phase_id VARCHAR(10) REFERENCES construction_phases(id),
  score_threshold INT NOT NULL, -- 추천 기준 점수 (예: 4 이상)
  score_direction VARCHAR(10) NOT NULL DEFAULT 'gte', -- 'gte' (이상), 'lte' (이하), 'eq' (같음)
  recommendation_type VARCHAR(20) NOT NULL DEFAULT 'upgrade', -- 'upgrade', 'downgrade', 'must', 'optional'
  grade_adjustment INT DEFAULT 0, -- 등급 조정 (-1, 0, +1)
  priority INT DEFAULT 50, -- 추천 우선순위 (1-100, 높을수록 우선)
  reason_template TEXT, -- 추천 이유 템플릿 (예: "소음에 민감하시니 방음 중문을 추천드려요")
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_pm_trait_score ON personality_materials(trait_id, score_threshold);
CREATE INDEX IF NOT EXISTS idx_pm_phase ON personality_materials(phase_id);
CREATE INDEX IF NOT EXISTS idx_pm_material ON personality_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_pm_active ON personality_materials(is_active);

-- ============================================================
-- 3. 답변-점수 매핑 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS answer_score_mapping (
  mapping_id SERIAL PRIMARY KEY,
  question_id VARCHAR(50) NOT NULL,
  answer_value VARCHAR(100) NOT NULL,
  analysis_mode VARCHAR(20) NOT NULL DEFAULT 'standard', -- 'quick', 'standard', 'deep', 'vibe'
  trait_scores JSONB NOT NULL, -- {"space_sense": 4, "organization_habit": 5, ...}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, answer_value, analysis_mode)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_asm_question ON answer_score_mapping(question_id);
CREATE INDEX IF NOT EXISTS idx_asm_answer ON answer_score_mapping(answer_value);
CREATE INDEX IF NOT EXISTS idx_asm_mode ON answer_score_mapping(analysis_mode);
CREATE INDEX IF NOT EXISTS idx_asm_trait_scores ON answer_score_mapping USING GIN(trait_scores);

-- ============================================================
-- 4. 샘플 데이터 (답변-점수 매핑)
-- ============================================================

-- Quick 모드 샘플 데이터
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('quick_first_scene', 'hotel_hallway', 'quick', '{"organization_habit": 9, "color_preference": 8}'::jsonb),
('quick_first_scene', 'warm_kitchen', 'quick', '{"family_composition": 8, "home_purpose": 7}'::jsonb),
('quick_first_scene', 'cozy_living', 'quick', '{"home_purpose": 8, "color_preference": 7}'::jsonb),
('quick_priority', 'storage', 'quick', '{"organization_habit": 9, "activity_flow": 8}'::jsonb),
('quick_priority', 'aesthetic', 'quick', '{"sensory_sensitivity": 9, "color_preference": 8, "lighting_preference": 8}'::jsonb),
('quick_priority', 'function', 'quick', '{"activity_flow": 9, "life_routine": 8, "cleaning_preference": 7}'::jsonb),
('quick_priority', 'comfort', 'quick', '{"home_purpose": 9, "auditory_sensitivity": 8, "health_factors": 8}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 5. 뷰 생성 (조회 편의성)
-- ============================================================

-- 성향-자재 매핑 조회 뷰
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
  m.grade,
  m.argen_made
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pm.is_active = true;

-- ============================================================
-- 6. 함수 생성 (성향 점수 기반 자재 추천)
-- ============================================================

-- 성향 점수에 따른 추천 자재 조회 함수
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
  grade VARCHAR(20)
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
    m.grade
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

-- ============================================================
-- 7. 주석 추가
-- ============================================================

COMMENT ON TABLE personality_traits IS '성향 항목 마스터 (15개 항목)';
COMMENT ON TABLE personality_materials IS '성향-자재 매핑 테이블 (핵심!)';
COMMENT ON TABLE answer_score_mapping IS '답변-점수 매핑 테이블 (해시 함수 대체)';
COMMENT ON VIEW v_personality_materials IS '성향-자재 매핑 조회 뷰';
COMMENT ON FUNCTION get_recommended_materials IS '성향 점수 기반 자재 추천 함수';

