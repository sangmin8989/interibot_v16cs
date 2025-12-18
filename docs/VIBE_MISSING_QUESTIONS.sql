-- ============================================================
-- Vibe 모드 누락된 질문 데이터 추가 입력
-- ============================================================
-- 
-- 생성일: 2025-12-12
-- 목적: Vibe 모드에서 누락된 3개 질문 추가 입력
-- 
-- 누락된 질문:
-- 1. vibe_travel_style
-- 2. vibe_home_relationship
-- 3. vibe_movie_genre
-- 
-- ============================================================

-- ============================================================
-- 1. vibe_travel_style - 지금 당장 떠나고 싶은 여행 스타일은?
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 서울·뉴욕 대도시: 활동 동선 높음, 취미/라이프스타일 높음, 집 사용 목적 중간
('vibe_travel_style', 'city', 'vibe', '{"activity_flow": 8, "hobby_lifestyle": 8, "home_purpose": 6, "life_routine": 7}'::jsonb),

-- 산·바다·숲: 건강 요소 높음, 집 사용 목적 높음, 생활 루틴 중간
('vibe_travel_style', 'nature', 'vibe', '{"health_factors": 8, "home_purpose": 8, "life_routine": 6, "sensory_sensitivity": 7}'::jsonb),

-- 조용한 소도시: 청각 민감도 높음, 생활 루틴 높음, 집 사용 목적 중간
('vibe_travel_style', 'town', 'vibe', '{"auditory_sensitivity": 8, "life_routine": 8, "home_purpose": 6, "activity_flow": 5}'::jsonb),

-- 리조트·호캉스: 시각 민감도 높음, 색감 취향 높음, 예산 감각 낮음
('vibe_travel_style', 'resort', 'vibe', '{"sensory_sensitivity": 8, "color_preference": 8, "budget_sense": 4, "home_purpose": 7}'::jsonb),

-- 카페·미술관·편집숍: 취미/라이프스타일 높음, 시각 민감도 높음, 색감 취향 높음
('vibe_travel_style', 'culture', 'vibe', '{"hobby_lifestyle": 8, "sensory_sensitivity": 8, "color_preference": 8, "home_purpose": 7}'::jsonb),

-- AI 선택: 기본값
('vibe_travel_style', 'ai_choice', 'vibe', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 2. vibe_home_relationship - 집이 사람이라면, 당신과의 관계는 어떤 느낌이면 좋겠나요?
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 편한 찐친: 집 사용 목적 높음, 생활 루틴 높음, 활동 동선 중간
('vibe_home_relationship', 'best_friend', 'vibe', '{"home_purpose": 9, "life_routine": 8, "activity_flow": 6, "color_preference": 6}'::jsonb),

-- 든든한 동료: 활동 동선 높음, 생활 루틴 높음, 집 사용 목적 높음
('vibe_home_relationship', 'supporter', 'vibe', '{"activity_flow": 8, "life_routine": 8, "home_purpose": 8, "discomfort_factors": 6}'::jsonb),

-- 성장시키는 트레이너: 취미/라이프스타일 높음, 활동 동선 높음, 집 사용 목적 높음
('vibe_home_relationship', 'trainer', 'vibe', '{"hobby_lifestyle": 8, "activity_flow": 8, "home_purpose": 8, "life_routine": 7}'::jsonb),

-- 특별하게 만드는 연인: 시각 민감도 높음, 색감 취향 높음, 집 사용 목적 높음
('vibe_home_relationship', 'lover', 'vibe', '{"sensory_sensitivity": 8, "color_preference": 8, "home_purpose": 9, "lighting_preference": 7}'::jsonb),

-- 다시 시작하게 하는 코치: 생활 루틴 높음, 집 사용 목적 높음, 불편 요소 높음
('vibe_home_relationship', 'coach', 'vibe', '{"life_routine": 8, "home_purpose": 8, "discomfort_factors": 8, "activity_flow": 7}'::jsonb),

-- AI 선택: 기본값
('vibe_home_relationship', 'ai_choice', 'vibe', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 3. vibe_movie_genre - 집 전체 분위기를 영화 장르로 고르자면?
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 힐링 드라마: 집 사용 목적 높음, 생활 루틴 높음, 색감 취향 중간
('vibe_movie_genre', 'healing_drama', 'vibe', '{"home_purpose": 8, "life_routine": 8, "color_preference": 6, "sensory_sensitivity": 7}'::jsonb),

-- 로맨틱 코미디: 가족 구성 높음, 집 사용 목적 높음, 생활 루틴 높음
('vibe_movie_genre', 'romcom', 'vibe', '{"family_composition": 8, "home_purpose": 8, "life_routine": 8, "activity_flow": 7}'::jsonb),

-- 차분한 성장 영화: 취미/라이프스타일 높음, 생활 루틴 높음, 집 사용 목적 높음
('vibe_movie_genre', 'growth', 'vibe', '{"hobby_lifestyle": 8, "life_routine": 8, "home_purpose": 8, "activity_flow": 6}'::jsonb),

-- 스타일리시 느와르: 시각 민감도 매우 높음, 색감 취향 높음, 조명 취향 높음
('vibe_movie_genre', 'noir', 'vibe', '{"sensory_sensitivity": 9, "color_preference": 8, "lighting_preference": 8, "home_purpose": 7}'::jsonb),

-- 현실감 있는 일상: 생활 루틴 높음, 집 사용 목적 높음, 활동 동선 중간
('vibe_movie_genre', 'documentary', 'vibe', '{"life_routine": 8, "home_purpose": 8, "activity_flow": 6, "discomfort_factors": 6}'::jsonb),

-- AI 선택: 기본값
('vibe_movie_genre', 'ai_choice', 'vibe', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 확인 쿼리
-- ============================================================

-- Vibe 모드 전체 질문 확인
SELECT 
  question_id,
  COUNT(*) as answer_count
FROM answer_score_mapping
WHERE analysis_mode = 'vibe'
GROUP BY question_id
ORDER BY question_id;

-- 예상 결과: 7개 질문, 각 6개 선택지 = 42개

-- 전체 개수 확인
SELECT COUNT(*) as total_vibe_mappings
FROM answer_score_mapping
WHERE analysis_mode = 'vibe';
-- 예상 결과: 42개

-- 전체 answer_score_mapping 개수 확인
SELECT 
  analysis_mode,
  COUNT(*) as mapping_count
FROM answer_score_mapping
GROUP BY analysis_mode
ORDER BY analysis_mode;
-- 예상 결과: Quick 28개 + Standard 36개 + Deep 48개 + Vibe 42개 = 154개
















