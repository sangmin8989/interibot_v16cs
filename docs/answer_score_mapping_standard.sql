-- ============================================================
-- answer_score_mapping 데이터 입력 - Standard 모드 (6개 질문)
-- ============================================================
-- 
-- 생성일: 2025-12-12
-- 모드: standard
-- 질문 수: 6개 (Quick 모드 4개 제외)
-- 예상 데이터량: 약 30개 (질문당 평균 5개 선택지)
--
-- ============================================================

-- 기존 Quick 모드 데이터는 이미 있으므로 Standard 모드 추가 질문만 입력

-- ============================================================
-- 1. standard_main_space - 집에서 하루 중 가장 오래 머무는 공간
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 거실: 가족 중심, 활동 동선 높음, 집 사용 목적 높음
('standard_main_space', 'living_room', 'standard', '{"home_purpose": 8, "activity_flow": 7, "family_composition": 7, "life_routine": 7}'::jsonb),

-- 주방·식탁: 가족 중심, 활동 동선 매우 높음, 생활 루틴 높음
('standard_main_space', 'kitchen', 'standard', '{"home_purpose": 7, "activity_flow": 9, "family_composition": 8, "life_routine": 8}'::jsonb),

-- 침실: 수면 패턴 높음, 생활 루틴 중간, 공간 감각 중간
('standard_main_space', 'bedroom', 'standard', '{"sleep_pattern": 8, "life_routine": 7, "space_sense": 6, "home_purpose": 6}'::jsonb),

-- 작업방·서재: 활동 동선 매우 높음, 생활 루틴 높음, 취미/라이프스타일 높음
('standard_main_space', 'workspace', 'standard', '{"activity_flow": 9, "life_routine": 8, "hobby_lifestyle": 7, "home_purpose": 7}'::jsonb),

-- 아이방·놀이방: 가족 구성 매우 높음, 건강 요소 높음, 활동 동선 높음
('standard_main_space', 'kids_room', 'standard', '{"family_composition": 9, "health_factors": 8, "activity_flow": 7, "home_purpose": 7}'::jsonb),

-- AI 선택: 기본값 (모든 trait 5점)
('standard_main_space', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 2. standard_daily_discomfort - 매일 불편하지만 참고 넘어가는 것
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 수납공간 부족: 정리정돈 습관 높음, 불편 요소 높음, 활동 동선 중간
('standard_daily_discomfort', 'storage', 'standard', '{"organization_habit": 8, "discomfort_factors": 9, "activity_flow": 6, "cleaning_preference": 7}'::jsonb),

-- 동선이 불편함: 활동 동선 매우 높음, 불편 요소 높음, 생활 루틴 중간
('standard_daily_discomfort', 'flow', 'standard', '{"activity_flow": 9, "discomfort_factors": 8, "life_routine": 7, "home_purpose": 6}'::jsonb),

-- 조명·채광이 답답함: 조명 취향 높음, 시각 민감도 높음, 불편 요소 높음
('standard_daily_discomfort', 'lighting', 'standard', '{"lighting_preference": 9, "sensory_sensitivity": 8, "discomfort_factors": 8, "home_purpose": 6}'::jsonb),

-- 마감재·색감이 마음에 안 듦: 색감 취향 높음, 시각 민감도 높음, 불편 요소 높음
('standard_daily_discomfort', 'materials', 'standard', '{"color_preference": 9, "sensory_sensitivity": 8, "discomfort_factors": 8, "home_purpose": 6}'::jsonb),

-- 가구 배치가 어색하고 공간이 좁게 느껴짐: 공간 감각 높음, 불편 요소 높음, 활동 동선 중간
('standard_daily_discomfort', 'layout', 'standard', '{"space_sense": 9, "discomfort_factors": 8, "activity_flow": 7, "home_purpose": 6}'::jsonb),

-- AI 선택: 기본값
('standard_daily_discomfort', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 3. standard_cleaning_style - 청소와 정리에 대한 본인 스타일
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 자주 치우지만 금방 다시 어지러워짐: 청소 성향 높음, 정리정돈 습관 중간, 불편 요소 중간
('standard_cleaning_style', 'frequent_messy', 'standard', '{"cleaning_preference": 8, "organization_habit": 6, "discomfort_factors": 6, "activity_flow": 5}'::jsonb),

-- 주말이나 특정 날에 몰아서 정리: 청소 성향 중간, 정리정돈 습관 중간, 생활 루틴 중간
('standard_cleaning_style', 'batch_clean', 'standard', '{"cleaning_preference": 6, "organization_habit": 6, "life_routine": 7, "discomfort_factors": 5}'::jsonb),

-- 눈에 너무 거슬릴 때만 치움: 청소 성향 낮음, 정리정돈 습관 낮음, 불편 요소 높음
('standard_cleaning_style', 'only_when_bad', 'standard', '{"cleaning_preference": 3, "organization_habit": 3, "discomfort_factors": 8, "sensory_sensitivity": 7}'::jsonb),

-- 정리 시스템만 잘 만들어주면 유지할 자신 있음: 정리정돈 습관 높음, 청소 성향 중간, 활동 동선 중간
('standard_cleaning_style', 'system_needed', 'standard', '{"organization_habit": 8, "cleaning_preference": 6, "activity_flow": 6, "discomfort_factors": 5}'::jsonb),

-- 정리·수납은 최대한 단순했으면 좋겠음: 정리정돈 습관 높음, 청소 성향 높음, 활동 동선 높음
('standard_cleaning_style', 'hide_all', 'standard', '{"organization_habit": 9, "cleaning_preference": 8, "activity_flow": 7, "sensory_sensitivity": 6}'::jsonb),

-- AI 선택: 기본값
('standard_cleaning_style', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 4. standard_family_time - 가족이 한자리에 가장 자주 모이는 시간대와 장소
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 평일 저녁, 거실: 가족 구성 높음, 생활 루틴 높음, 집 사용 목적 높음
('standard_family_time', 'weekday_living', 'standard', '{"family_composition": 8, "life_routine": 8, "home_purpose": 8, "activity_flow": 7}'::jsonb),

-- 평일 저녁, 주방·식탁: 가족 구성 매우 높음, 생활 루틴 높음, 활동 동선 높음
('standard_family_time', 'weekday_kitchen', 'standard', '{"family_composition": 9, "life_routine": 8, "activity_flow": 8, "home_purpose": 7}'::jsonb),

-- 주말 오후, 거실: 가족 구성 높음, 생활 루틴 중간, 집 사용 목적 높음
('standard_family_time', 'weekend_living', 'standard', '{"family_composition": 8, "life_routine": 6, "home_purpose": 8, "activity_flow": 7}'::jsonb),

-- 주말, 주방·식탁: 가족 구성 매우 높음, 생활 루틴 중간, 활동 동선 높음
('standard_family_time', 'weekend_kitchen', 'standard', '{"family_composition": 9, "life_routine": 6, "activity_flow": 8, "home_purpose": 7}'::jsonb),

-- 거의 각자 방을 쓰고 함께 모이는 시간이 적음: 가족 구성 낮음, 생활 루틴 낮음, 취미/라이프스타일 높음
('standard_family_time', 'separate', 'standard', '{"family_composition": 3, "life_routine": 4, "hobby_lifestyle": 8, "home_purpose": 5}'::jsonb),

-- AI 선택: 기본값
('standard_family_time', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 5. standard_budget_priority - 예산을 생각할 때 가장 우선순위를 두고 싶은 부분
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 구조·동선 변경: 활동 동선 매우 높음, 예산 감각 중간, 불편 요소 높음
('standard_budget_priority', 'structure', 'standard', '{"activity_flow": 9, "budget_sense": 6, "discomfort_factors": 8, "home_purpose": 7}'::jsonb),

-- 마감재·자재: 색감 취향 높음, 시각 민감도 높음, 예산 감각 중간
('standard_budget_priority', 'materials', 'standard', '{"color_preference": 8, "sensory_sensitivity": 8, "budget_sense": 6, "home_purpose": 7}'::jsonb),

-- 가구·수납: 정리정돈 습관 높음, 예산 감각 중간, 활동 동선 중간
('standard_budget_priority', 'storage', 'standard', '{"organization_habit": 8, "budget_sense": 6, "activity_flow": 6, "discomfort_factors": 7}'::jsonb),

-- 조명·색감·분위기 연출: 조명 취향 매우 높음, 색감 취향 높음, 예산 감각 낮음
('standard_budget_priority', 'lighting', 'standard', '{"lighting_preference": 9, "color_preference": 8, "budget_sense": 4, "sensory_sensitivity": 7}'::jsonb),

-- 전체 밸런스: 예산 감각 높음, 집 사용 목적 중간, 불편 요소 중간
('standard_budget_priority', 'balance', 'standard', '{"budget_sense": 8, "home_purpose": 6, "discomfort_factors": 6, "activity_flow": 5}'::jsonb),

-- AI 선택: 기본값
('standard_budget_priority', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 6. standard_compliment - 인테리어가 끝난 후, 지인들에게 가장 듣고 싶은 말
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- "되게 편해 보인다, 살기 좋겠다": 활동 동선 높음, 생활 루틴 높음, 집 사용 목적 높음
('standard_compliment', 'comfortable', 'standard', '{"activity_flow": 8, "life_routine": 8, "home_purpose": 8, "discomfort_factors": 7}'::jsonb),

-- "호텔 같아, 진짜 고급스럽다": 색감 취향 높음, 시각 민감도 높음, 예산 감각 낮음
('standard_compliment', 'luxurious', 'standard', '{"color_preference": 8, "sensory_sensitivity": 8, "budget_sense": 4, "lighting_preference": 7}'::jsonb),

-- "와, 진짜 너 같다. 너랑 잘 어울린다": 취미/라이프스타일 높음, 색감 취향 높음, 집 사용 목적 높음
('standard_compliment', 'suits_you', 'standard', '{"hobby_lifestyle": 8, "color_preference": 7, "home_purpose": 8, "sensory_sensitivity": 7}'::jsonb),

-- "센스 미쳤다, 디테일이 다르네": 시각 민감도 매우 높음, 색감 취향 높음, 조명 취향 높음
('standard_compliment', 'detailed', 'standard', '{"sensory_sensitivity": 9, "color_preference": 8, "lighting_preference": 8, "home_purpose": 7}'::jsonb),

-- "생각보다 비용 잘 쓴 것 같다, 돈 안 아깝겠다": 예산 감각 높음, 활동 동선 중간, 집 사용 목적 중간
('standard_compliment', 'worth_it', 'standard', '{"budget_sense": 8, "activity_flow": 6, "home_purpose": 6, "discomfort_factors": 6}'::jsonb),

-- AI 선택: 기본값
('standard_compliment', 'ai_choice', 'standard', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 확인 쿼리
-- ============================================================

-- Standard 모드 데이터 확인
SELECT 
  question_id,
  COUNT(*) as answer_count
FROM answer_score_mapping
WHERE analysis_mode = 'standard'
GROUP BY question_id
ORDER BY question_id;

-- 전체 개수 확인
SELECT COUNT(*) as total_standard_mappings
FROM answer_score_mapping
WHERE analysis_mode = 'standard';

-- 예상 결과: 약 36개 (6개 질문 × 평균 6개 선택지)
























