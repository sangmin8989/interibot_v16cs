-- ============================================================
-- 인테리봇 Supabase 필수 데이터 입력 SQL
-- ============================================================
-- 
-- 파일명: INPUT_ALL_REQUIRED_DATA.sql
-- 생성일: 2025-12-12
-- 목적: personality_traits, answer_score_mapping 전체 데이터 입력
-- 
-- 실행 순서:
-- 1. personality_traits 데이터 입력 (15개)
-- 2. answer_score_mapping 데이터 입력 (Quick 24개 + Standard 36개)
-- 
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일 전체 내용 복사
-- 3. 붙여넣기 후 Run 실행
-- 
-- ============================================================

-- ============================================================
-- 1단계: personality_traits 데이터 입력 (15개)
-- ============================================================
-- 
-- 이미 데이터가 있으면 ON CONFLICT로 무시됨
-- 

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
-- 예상 결과: 15개

-- ============================================================
-- 2단계: answer_score_mapping 데이터 입력
-- ============================================================
-- 
-- Quick 모드 (4개 질문) - 이미 7개 있지만 전체 입력
-- Standard 모드 (6개 질문) - 새로 입력
-- 

-- ============================================================
-- Quick 모드 질문 (4개)
-- ============================================================

-- 1. quick_first_scene - 퇴근해서 현관을 열었을 때 제일 먼저 보이고 싶은 장면
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('quick_first_scene', 'hotel_hallway', 'quick', '{"organization_habit": 9, "color_preference": 8, "sensory_sensitivity": 7}'::jsonb),
('quick_first_scene', 'warm_kitchen', 'quick', '{"family_composition": 8, "home_purpose": 7, "activity_flow": 7}'::jsonb),
('quick_first_scene', 'cozy_living', 'quick', '{"home_purpose": 8, "color_preference": 7, "life_routine": 7}'::jsonb),
('quick_first_scene', 'family_space', 'quick', '{"family_composition": 9, "health_factors": 8, "activity_flow": 7}'::jsonb),
('quick_first_scene', 'aesthetic_decor', 'quick', '{"sensory_sensitivity": 9, "color_preference": 8, "lighting_preference": 8}'::jsonb),
('quick_first_scene', 'ai_choice', 'quick', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- 2. quick_photo_space - 사진 찍어 올리고 싶은 공간
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('quick_photo_space', 'living_room', 'quick', '{"home_purpose": 8, "sensory_sensitivity": 7, "color_preference": 7}'::jsonb),
('quick_photo_space', 'kitchen', 'quick', '{"activity_flow": 8, "family_composition": 7, "home_purpose": 7}'::jsonb),
('quick_photo_space', 'bedroom', 'quick', '{"sleep_pattern": 8, "sensory_sensitivity": 7, "lighting_preference": 7}'::jsonb),
('quick_photo_space', 'bathroom', 'quick', '{"sensory_sensitivity": 8, "cleaning_preference": 7, "health_factors": 7}'::jsonb),
('quick_photo_space', 'workspace', 'quick', '{"hobby_lifestyle": 8, "activity_flow": 7, "life_routine": 7}'::jsonb),
('quick_photo_space', 'ai_choice', 'quick', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- 3. quick_no_compromise - 인테리어에서 절대 타협하고 싶지 않은 한 가지
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('quick_no_compromise', 'natural_light', 'quick', '{"lighting_preference": 9, "sensory_sensitivity": 8, "home_purpose": 7}'::jsonb),
('quick_no_compromise', 'lighting', 'quick', '{"lighting_preference": 9, "sensory_sensitivity": 8, "color_preference": 7}'::jsonb),
('quick_no_compromise', 'storage', 'quick', '{"organization_habit": 9, "activity_flow": 8, "discomfort_factors": 7}'::jsonb),
('quick_no_compromise', 'finish_quality', 'quick', '{"sensory_sensitivity": 9, "color_preference": 8, "budget_sense": 6}'::jsonb),
('quick_no_compromise', 'flow', 'quick', '{"activity_flow": 9, "life_routine": 8, "discomfort_factors": 7}'::jsonb),
('quick_no_compromise', 'ai_choice', 'quick', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- 4. quick_atmosphere - 집의 전체 분위기
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('quick_atmosphere', 'healing', 'quick', '{"home_purpose": 8, "color_preference": 7, "life_routine": 7}'::jsonb),
('quick_atmosphere', 'focus', 'quick', '{"activity_flow": 8, "organization_habit": 7, "hobby_lifestyle": 7}'::jsonb),
('quick_atmosphere', 'family', 'quick', '{"family_composition": 9, "home_purpose": 8, "activity_flow": 7}'::jsonb),
('quick_atmosphere', 'leisure', 'quick', '{"sensory_sensitivity": 8, "color_preference": 8, "budget_sense": 6}'::jsonb),
('quick_atmosphere', 'success', 'quick', '{"sensory_sensitivity": 8, "color_preference": 7, "budget_sense": 5}'::jsonb),
('quick_atmosphere', 'ai_choice', 'quick', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- Standard 모드 질문 (6개) - 새로 입력
-- ============================================================

-- 5. standard_main_space - 집에서 하루 중 가장 오래 머무는 공간
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('standard_main_space', 'living_room', 'standard', '{"home_purpose": 8, "activity_flow": 7, "family_composition": 7, "life_routine": 7}'::jsonb),
('standard_main_space', 'kitchen', 'standard', '{"home_purpose": 7, "activity_flow": 9, "family_composition": 8, "life_routine": 8}'::jsonb),
('standard_main_space', 'bedroom', 'standard', '{"sleep_pattern": 8, "life_routine": 7, "space_sense": 6, "home_purpose": 6}'::jsonb),
('standard_main_space', 'workspace', 'standard', '{"activity_flow": 9, "life_routine": 8, "hobby_lifestyle": 7, "home_purpose": 7}'::jsonb),
('standard_main_space', 'kids_room', 'standard', '{"family_composition": 9, "health_factors": 8, "activity_flow": 7, "home_purpose": 7}'::jsonb),
('standard_main_space', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- 6. standard_daily_discomfort - 매일 불편하지만 참고 넘어가는 것
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('standard_daily_discomfort', 'storage', 'standard', '{"organization_habit": 8, "discomfort_factors": 9, "activity_flow": 6, "cleaning_preference": 7}'::jsonb),
('standard_daily_discomfort', 'flow', 'standard', '{"activity_flow": 9, "discomfort_factors": 8, "life_routine": 7, "home_purpose": 6}'::jsonb),
('standard_daily_discomfort', 'lighting', 'standard', '{"lighting_preference": 9, "sensory_sensitivity": 8, "discomfort_factors": 8, "home_purpose": 6}'::jsonb),
('standard_daily_discomfort', 'materials', 'standard', '{"color_preference": 9, "sensory_sensitivity": 8, "discomfort_factors": 8, "home_purpose": 6}'::jsonb),
('standard_daily_discomfort', 'layout', 'standard', '{"space_sense": 9, "discomfort_factors": 8, "activity_flow": 7, "home_purpose": 6}'::jsonb),
('standard_daily_discomfort', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- 7. standard_cleaning_style - 청소와 정리에 대한 본인 스타일
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('standard_cleaning_style', 'frequent_messy', 'standard', '{"cleaning_preference": 8, "organization_habit": 6, "discomfort_factors": 6, "activity_flow": 5}'::jsonb),
('standard_cleaning_style', 'batch_clean', 'standard', '{"cleaning_preference": 6, "organization_habit": 6, "life_routine": 7, "discomfort_factors": 5}'::jsonb),
('standard_cleaning_style', 'only_when_bad', 'standard', '{"cleaning_preference": 3, "organization_habit": 3, "discomfort_factors": 8, "sensory_sensitivity": 7}'::jsonb),
('standard_cleaning_style', 'system_needed', 'standard', '{"organization_habit": 8, "cleaning_preference": 6, "activity_flow": 6, "discomfort_factors": 5}'::jsonb),
('standard_cleaning_style', 'hide_all', 'standard', '{"organization_habit": 9, "cleaning_preference": 8, "activity_flow": 7, "sensory_sensitivity": 6}'::jsonb),
('standard_cleaning_style', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- 8. standard_family_time - 가족이 한자리에 가장 자주 모이는 시간대와 장소
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('standard_family_time', 'weekday_living', 'standard', '{"family_composition": 8, "life_routine": 8, "home_purpose": 8, "activity_flow": 7}'::jsonb),
('standard_family_time', 'weekday_kitchen', 'standard', '{"family_composition": 9, "life_routine": 8, "activity_flow": 8, "home_purpose": 7}'::jsonb),
('standard_family_time', 'weekend_living', 'standard', '{"family_composition": 8, "life_routine": 6, "home_purpose": 8, "activity_flow": 7}'::jsonb),
('standard_family_time', 'weekend_kitchen', 'standard', '{"family_composition": 9, "life_routine": 6, "activity_flow": 8, "home_purpose": 7}'::jsonb),
('standard_family_time', 'separate', 'standard', '{"family_composition": 3, "life_routine": 4, "hobby_lifestyle": 8, "home_purpose": 5}'::jsonb),
('standard_family_time', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- 9. standard_budget_priority - 예산을 생각할 때 가장 우선순위를 두고 싶은 부분
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('standard_budget_priority', 'structure', 'standard', '{"activity_flow": 9, "budget_sense": 6, "discomfort_factors": 8, "home_purpose": 7}'::jsonb),
('standard_budget_priority', 'materials', 'standard', '{"color_preference": 8, "sensory_sensitivity": 8, "budget_sense": 6, "home_purpose": 7}'::jsonb),
('standard_budget_priority', 'storage', 'standard', '{"organization_habit": 8, "budget_sense": 6, "activity_flow": 6, "discomfort_factors": 7}'::jsonb),
('standard_budget_priority', 'lighting', 'standard', '{"lighting_preference": 9, "color_preference": 8, "budget_sense": 4, "sensory_sensitivity": 7}'::jsonb),
('standard_budget_priority', 'balance', 'standard', '{"budget_sense": 8, "home_purpose": 6, "discomfort_factors": 6, "activity_flow": 5}'::jsonb),
('standard_budget_priority', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- 10. standard_compliment - 인테리어가 끝난 후, 지인들에게 가장 듣고 싶은 말
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('standard_compliment', 'comfortable', 'standard', '{"activity_flow": 8, "life_routine": 8, "home_purpose": 8, "discomfort_factors": 7}'::jsonb),
('standard_compliment', 'luxurious', 'standard', '{"color_preference": 8, "sensory_sensitivity": 8, "budget_sense": 4, "lighting_preference": 7}'::jsonb),
('standard_compliment', 'suits_you', 'standard', '{"hobby_lifestyle": 8, "color_preference": 7, "home_purpose": 8, "sensory_sensitivity": 7}'::jsonb),
('standard_compliment', 'detailed', 'standard', '{"sensory_sensitivity": 9, "color_preference": 8, "lighting_preference": 8, "home_purpose": 7}'::jsonb),
('standard_compliment', 'worth_it', 'standard', '{"budget_sense": 8, "activity_flow": 6, "home_purpose": 6, "discomfort_factors": 6}'::jsonb),
('standard_compliment', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 확인 쿼리
-- ============================================================

-- personality_traits 확인
SELECT COUNT(*) as trait_count FROM personality_traits;
-- 예상 결과: 15개

-- answer_score_mapping 확인 (모드별)
SELECT 
  analysis_mode,
  COUNT(*) as mapping_count
FROM answer_score_mapping
GROUP BY analysis_mode
ORDER BY analysis_mode;

-- answer_score_mapping 확인 (질문별)
SELECT 
  question_id,
  analysis_mode,
  COUNT(*) as answer_count
FROM answer_score_mapping
GROUP BY question_id, analysis_mode
ORDER BY analysis_mode, question_id;

-- 전체 개수 확인
SELECT COUNT(*) as total_mappings FROM answer_score_mapping;
-- 예상 결과: Quick 24개 + Standard 36개 = 60개

