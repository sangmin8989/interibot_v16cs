-- ============================================================
-- Deep 모드 answer_score_mapping 데이터 입력
-- ============================================================
-- 
-- 파일명: answer_score_mapping_deep.sql
-- 생성일: 2025-12-12
-- 모드: deep
-- 질문 수: 8개 (Standard 모드 10개 제외)
-- 예상 데이터량: 약 48개 (질문당 평균 6개 선택지)
--
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일 전체 내용 복사
-- 3. 붙여넣기 후 Run 실행
--
-- ============================================================

-- ============================================================
-- 1. deep_sleep_brightness - 잠잘 때 방의 밝기에 대한 선호
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 완전 암막: 수면 패턴 매우 높음, 청각 민감도 높음, 조명 취향 중간
('deep_sleep_brightness', 'complete_dark', 'deep', '{"sleep_pattern": 9, "auditory_sensitivity": 8, "lighting_preference": 6, "sensory_sensitivity": 7}'::jsonb),

-- 아주 은은한 불빛만: 수면 패턴 높음, 조명 취향 높음, 시각 민감도 중간
('deep_sleep_brightness', 'dim_light', 'deep', '{"sleep_pattern": 8, "lighting_preference": 8, "sensory_sensitivity": 6, "home_purpose": 6}'::jsonb),

-- 커튼 안 쳐도 상관없음: 수면 패턴 낮음, 조명 취향 중간, 생활 루틴 중간
('deep_sleep_brightness', 'no_curtain', 'deep', '{"sleep_pattern": 4, "lighting_preference": 6, "life_routine": 6, "home_purpose": 5}'::jsonb),

-- 간접조명·무드등 켜진 상태: 조명 취향 매우 높음, 수면 패턴 중간, 시각 민감도 높음
('deep_sleep_brightness', 'mood_light', 'deep', '{"lighting_preference": 9, "sleep_pattern": 6, "sensory_sensitivity": 8, "home_purpose": 7}'::jsonb),

-- 상황에 따라 다르게: 생활 루틴 높음, 수면 패턴 중간, 집 사용 목적 중간
('deep_sleep_brightness', 'varies', 'deep', '{"life_routine": 8, "sleep_pattern": 6, "home_purpose": 6, "lighting_preference": 5}'::jsonb),

-- AI 선택: 기본값
('deep_sleep_brightness', 'ai_choice', 'deep', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 2. deep_sleep_disturbance - 수면에 가장 방해가 되는 요소
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 소음: 청각 민감도 매우 높음, 수면 패턴 높음, 불편 요소 높음
('deep_sleep_disturbance', 'noise', 'deep', '{"auditory_sensitivity": 9, "sleep_pattern": 8, "discomfort_factors": 8, "health_factors": 7}'::jsonb),

-- 빛: 수면 패턴 높음, 시각 민감도 높음, 조명 취향 중간
('deep_sleep_disturbance', 'light', 'deep', '{"sleep_pattern": 8, "sensory_sensitivity": 8, "lighting_preference": 6, "discomfort_factors": 7}'::jsonb),

-- 온도: 건강 요소 높음, 생활 루틴 중간, 불편 요소 높음
('deep_sleep_disturbance', 'temperature', 'deep', '{"health_factors": 8, "life_routine": 6, "discomfort_factors": 8, "sleep_pattern": 7}'::jsonb),

-- 공기: 건강 요소 매우 높음, 청각 민감도 중간, 불편 요소 높음
('deep_sleep_disturbance', 'air', 'deep', '{"health_factors": 9, "auditory_sensitivity": 6, "discomfort_factors": 8, "sleep_pattern": 7}'::jsonb),

-- 침대·베개 등 물리적 불편: 건강 요소 높음, 불편 요소 높음, 생활 루틴 중간
('deep_sleep_disturbance', 'bed', 'deep', '{"health_factors": 8, "discomfort_factors": 8, "life_routine": 6, "sleep_pattern": 7}'::jsonb),

-- AI 선택: 기본값
('deep_sleep_disturbance', 'ai_choice', 'deep', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 3. deep_morning_first_10min - 아침 일어난 후 첫 10분을 가장 편하게 보내고 싶은 공간
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 침대 머리맡: 수면 패턴 높음, 생활 루틴 높음, 집 사용 목적 중간
('deep_morning_first_10min', 'bed', 'deep', '{"sleep_pattern": 8, "life_routine": 8, "home_purpose": 6, "activity_flow": 5}'::jsonb),

-- 화장대·드레스룸: 시각 민감도 높음, 생활 루틴 높음, 활동 동선 중간
('deep_morning_first_10min', 'dressing', 'deep', '{"sensory_sensitivity": 8, "life_routine": 8, "activity_flow": 6, "home_purpose": 6}'::jsonb),

-- 주방·식탁: 활동 동선 높음, 생활 루틴 높음, 가족 구성 중간
('deep_morning_first_10min', 'kitchen', 'deep', '{"activity_flow": 8, "life_routine": 8, "family_composition": 6, "home_purpose": 7}'::jsonb),

-- 거실 소파: 집 사용 목적 높음, 생활 루틴 높음, 활동 동선 중간
('deep_morning_first_10min', 'sofa', 'deep', '{"home_purpose": 8, "life_routine": 8, "activity_flow": 6, "color_preference": 6}'::jsonb),

-- 욕실: 청소 성향 높음, 건강 요소 중간, 생활 루틴 높음
('deep_morning_first_10min', 'bathroom', 'deep', '{"cleaning_preference": 8, "health_factors": 6, "life_routine": 8, "activity_flow": 7}'::jsonb),

-- AI 선택: 기본값
('deep_morning_first_10min', 'ai_choice', 'deep', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 4. deep_physical_constraint - 몸 상태 때문에 피하고 싶은 동작·자세
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 너무 낮은 좌식: 건강 요소 매우 높음, 활동 동선 중간, 불편 요소 높음
('deep_physical_constraint', 'floor_sitting', 'deep', '{"health_factors": 9, "activity_flow": 6, "discomfort_factors": 8, "life_routine": 6}'::jsonb),

-- 자주 쪼그려 앉기: 건강 요소 높음, 활동 동선 중간, 불편 요소 높음
('deep_physical_constraint', 'squatting', 'deep', '{"health_factors": 8, "activity_flow": 6, "discomfort_factors": 8, "life_routine": 6}'::jsonb),

-- 높은 곳 팔 들기: 건강 요소 높음, 활동 동선 중간, 불편 요소 높음
('deep_physical_constraint', 'reaching_high', 'deep', '{"health_factors": 8, "activity_flow": 6, "discomfort_factors": 7, "life_routine": 6}'::jsonb),

-- 계단·단 차이 오르내리기: 건강 요소 매우 높음, 활동 동선 중간, 불편 요소 높음
('deep_physical_constraint', 'stairs', 'deep', '{"health_factors": 9, "activity_flow": 6, "discomfort_factors": 8, "life_routine": 6}'::jsonb),

-- 특별히 피할 동작 없음: 건강 요소 낮음, 활동 동선 높음, 불편 요소 낮음
('deep_physical_constraint', 'none', 'deep', '{"health_factors": 3, "activity_flow": 8, "discomfort_factors": 3, "life_routine": 7}'::jsonb),

-- AI 선택: 기본값
('deep_physical_constraint', 'ai_choice', 'deep', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 5. deep_organization_style - 정리·수납에 대한 본인 스타일
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 물건 줄이는 미니멀리스트: 정리정돈 습관 매우 높음, 청소 성향 높음, 활동 동선 중간
('deep_organization_style', 'minimalist', 'deep', '{"organization_habit": 9, "cleaning_preference": 8, "activity_flow": 6, "sensory_sensitivity": 7}'::jsonb),

-- 카테고리별 정리 선호: 정리정돈 습관 높음, 활동 동선 중간, 생활 루틴 중간
('deep_organization_style', 'categorizer', 'deep', '{"organization_habit": 8, "activity_flow": 6, "life_routine": 6, "cleaning_preference": 7}'::jsonb),

-- 수납장에 깔끔히 숨기기: 정리정돈 습관 매우 높음, 청소 성향 높음, 시각 민감도 높음
('deep_organization_style', 'hide_all', 'deep', '{"organization_habit": 9, "cleaning_preference": 8, "sensory_sensitivity": 8, "activity_flow": 7}'::jsonb),

-- 지금 어질러져있고 바꾸고 싶음: 정리정돈 습관 낮음, 불편 요소 매우 높음, 청소 성향 낮음
('deep_organization_style', 'messy_now', 'deep', '{"organization_habit": 3, "discomfort_factors": 9, "cleaning_preference": 3, "sensory_sensitivity": 7}'::jsonb),

-- 가족 습관에 영향 많이 받음: 가족 구성 높음, 정리정돈 습관 중간, 생활 루틴 중간
('deep_organization_style', 'family_influenced', 'deep', '{"family_composition": 8, "organization_habit": 6, "life_routine": 6, "cleaning_preference": 6}'::jsonb),

-- AI 선택: 기본값
('deep_organization_style', 'ai_choice', 'deep', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 6. deep_cooking_stress - 요리할 때 가장 스트레스 받는 요소
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 조리 공간·작업대 부족: 활동 동선 매우 높음, 불편 요소 높음, 공간 감각 높음
('deep_cooking_stress', 'small_space', 'deep', '{"activity_flow": 9, "discomfort_factors": 8, "space_sense": 8, "home_purpose": 7}'::jsonb),

-- 수납 부족으로 불편: 정리정돈 습관 높음, 불편 요소 높음, 활동 동선 중간
('deep_cooking_stress', 'storage', 'deep', '{"organization_habit": 8, "discomfort_factors": 8, "activity_flow": 6, "cleaning_preference": 7}'::jsonb),

-- 환기(냄새, 연기): 청각 민감도 높음, 건강 요소 높음, 불편 요소 높음
('deep_cooking_stress', 'ventilation', 'deep', '{"auditory_sensitivity": 8, "health_factors": 8, "discomfort_factors": 8, "sensory_sensitivity": 7}'::jsonb),

-- 설거지·정리 동선 비효율: 활동 동선 매우 높음, 불편 요소 높음, 생활 루틴 중간
('deep_cooking_stress', 'flow', 'deep', '{"activity_flow": 9, "discomfort_factors": 8, "life_routine": 6, "home_purpose": 7}'::jsonb),

-- 여러 사람 동시 사용 어려움: 가족 구성 높음, 활동 동선 높음, 불편 요소 높음
('deep_cooking_stress', 'crowded', 'deep', '{"family_composition": 8, "activity_flow": 8, "discomfort_factors": 8, "home_purpose": 7}'::jsonb),

-- AI 선택: 기본값
('deep_cooking_stress', 'ai_choice', 'deep', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 7. deep_smell_concern - 집 안에서 냄새가 가장 신경 쓰이는 곳
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 현관: 청소 성향 높음, 건강 요소 중간, 불편 요소 높음
('deep_smell_concern', 'entrance', 'deep', '{"cleaning_preference": 8, "health_factors": 6, "discomfort_factors": 8, "sensory_sensitivity": 7}'::jsonb),

-- 주방: 청소 성향 높음, 건강 요소 높음, 불편 요소 높음
('deep_smell_concern', 'kitchen', 'deep', '{"cleaning_preference": 8, "health_factors": 8, "discomfort_factors": 8, "activity_flow": 6}'::jsonb),

-- 욕실: 청소 성향 매우 높음, 건강 요소 높음, 불편 요소 높음
('deep_smell_concern', 'bathroom', 'deep', '{"cleaning_preference": 9, "health_factors": 8, "discomfort_factors": 8, "sensory_sensitivity": 7}'::jsonb),

-- 옷방·드레스룸: 청소 성향 높음, 시각 민감도 높음, 불편 요소 중간
('deep_smell_concern', 'closet', 'deep', '{"cleaning_preference": 8, "sensory_sensitivity": 8, "discomfort_factors": 6, "organization_habit": 6}'::jsonb),

-- 거실·전체 공기: 건강 요소 매우 높음, 청소 성향 높음, 불편 요소 높음
('deep_smell_concern', 'living_air', 'deep', '{"health_factors": 9, "cleaning_preference": 8, "discomfort_factors": 8, "sensory_sensitivity": 7}'::jsonb),

-- AI 선택: 기본값
('deep_smell_concern', 'ai_choice', 'deep', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 8. deep_lighting_change - 현재 조명 사용 상태와 바꾸고 싶은 방향
-- ============================================================

INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
-- 전체등만 있음 → 간접조명 추가: 조명 취향 매우 높음, 시각 민감도 높음, 집 사용 목적 높음
('deep_lighting_change', 'want_indirect', 'deep', '{"lighting_preference": 9, "sensory_sensitivity": 8, "home_purpose": 8, "color_preference": 7}'::jsonb),

-- 어두움 → 더 밝게: 조명 취향 높음, 시각 민감도 높음, 불편 요소 높음
('deep_lighting_change', 'want_brighter', 'deep', '{"lighting_preference": 8, "sensory_sensitivity": 8, "discomfort_factors": 8, "home_purpose": 7}'::jsonb),

-- 너무 밝고 차가움 → 따뜻하게: 조명 취향 높음, 색감 취향 높음, 시각 민감도 높음
('deep_lighting_change', 'want_warmer', 'deep', '{"lighting_preference": 8, "color_preference": 8, "sensory_sensitivity": 8, "home_purpose": 7}'::jsonb),

-- 이미 간접조명 씀 → 더 체계적으로: 조명 취향 매우 높음, 시각 민감도 높음, 집 사용 목적 높음
('deep_lighting_change', 'already_good', 'deep', '{"lighting_preference": 9, "sensory_sensitivity": 8, "home_purpose": 8, "color_preference": 7}'::jsonb),

-- 조명은 기본만: 조명 취향 낮음, 예산 감각 높음, 집 사용 목적 중간
('deep_lighting_change', 'basic_only', 'deep', '{"lighting_preference": 3, "budget_sense": 8, "home_purpose": 5, "sensory_sensitivity": 4}'::jsonb),

-- AI 선택: 기본값
('deep_lighting_change', 'ai_choice', 'deep', '{"space_sense": 5, "sensory_sensitivity": 5, "auditory_sensitivity": 5, "cleaning_preference": 5, "organization_habit": 5, "family_composition": 5, "health_factors": 5, "budget_sense": 5, "color_preference": 5, "lighting_preference": 5, "home_purpose": 5, "discomfort_factors": 5, "activity_flow": 5, "life_routine": 5, "sleep_pattern": 5, "hobby_lifestyle": 5}'::jsonb)

ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;

-- ============================================================
-- 확인 쿼리
-- ============================================================

-- Deep 모드 데이터 확인
SELECT 
  question_id,
  COUNT(*) as answer_count
FROM answer_score_mapping
WHERE analysis_mode = 'deep'
GROUP BY question_id
ORDER BY question_id;

-- 전체 개수 확인
SELECT COUNT(*) as total_deep_mappings
FROM answer_score_mapping
WHERE analysis_mode = 'deep';
-- 예상 결과: 약 48개 (8개 질문 × 평균 6개 선택지)

-- 전체 answer_score_mapping 개수 확인
SELECT 
  analysis_mode,
  COUNT(*) as mapping_count
FROM answer_score_mapping
GROUP BY analysis_mode
ORDER BY analysis_mode;
-- 예상 결과: Quick 24개 + Standard 36개 + Deep 48개 = 108개

