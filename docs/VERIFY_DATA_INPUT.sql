-- ============================================================
-- 데이터 입력 확인 쿼리
-- ============================================================
-- 
-- 생성일: 2025-12-12
-- 목적: answer_score_mapping 데이터 입력 완료 확인
-- 
-- ============================================================

-- ============================================================
-- 1. personality_traits 확인
-- ============================================================

SELECT 
  'personality_traits' as table_name,
  COUNT(*) as total_count
FROM personality_traits;
-- 예상 결과: 15개

-- 상세 확인
SELECT 
  trait_id,
  trait_code,
  trait_name,
  trait_category
FROM personality_traits
ORDER BY trait_id;

-- ============================================================
-- 2. answer_score_mapping 모드별 확인
-- ============================================================

-- 모드별 개수 확인
SELECT 
  analysis_mode,
  COUNT(*) as mapping_count
FROM answer_score_mapping
GROUP BY analysis_mode
ORDER BY analysis_mode;
-- 예상 결과:
-- quick: 24개
-- standard: 36개
-- deep: 48개
-- vibe: 42개

-- ============================================================
-- 3. answer_score_mapping 질문별 확인
-- ============================================================

-- Quick 모드 질문별 확인
SELECT 
  question_id,
  COUNT(*) as answer_count
FROM answer_score_mapping
WHERE analysis_mode = 'quick'
GROUP BY question_id
ORDER BY question_id;
-- 예상 결과: 4개 질문, 각 6개 선택지

-- Standard 모드 질문별 확인
SELECT 
  question_id,
  COUNT(*) as answer_count
FROM answer_score_mapping
WHERE analysis_mode = 'standard'
GROUP BY question_id
ORDER BY question_id;
-- 예상 결과: 6개 질문, 각 6개 선택지

-- Deep 모드 질문별 확인
SELECT 
  question_id,
  COUNT(*) as answer_count
FROM answer_score_mapping
WHERE analysis_mode = 'deep'
GROUP BY question_id
ORDER BY question_id;
-- 예상 결과: 8개 질문, 각 6개 선택지

-- Vibe 모드 질문별 확인
SELECT 
  question_id,
  COUNT(*) as answer_count
FROM answer_score_mapping
WHERE analysis_mode = 'vibe'
GROUP BY question_id
ORDER BY question_id;
-- 예상 결과: 7개 질문, 각 6개 선택지

-- ============================================================
-- 4. 샘플 데이터 확인
-- ============================================================

-- Quick 모드 샘플
SELECT 
  question_id,
  answer_value,
  trait_scores
FROM answer_score_mapping
WHERE analysis_mode = 'quick'
  AND question_id = 'quick_first_scene'
LIMIT 3;

-- Standard 모드 샘플
SELECT 
  question_id,
  answer_value,
  trait_scores
FROM answer_score_mapping
WHERE analysis_mode = 'standard'
  AND question_id = 'standard_main_space'
LIMIT 3;

-- Deep 모드 샘플
SELECT 
  question_id,
  answer_value,
  trait_scores
FROM answer_score_mapping
WHERE analysis_mode = 'deep'
  AND question_id = 'deep_sleep_brightness'
LIMIT 3;

-- Vibe 모드 샘플
SELECT 
  question_id,
  answer_value,
  trait_scores
FROM answer_score_mapping
WHERE analysis_mode = 'vibe'
  AND question_id = 'vibe_weekend_alone'
LIMIT 3;

-- ============================================================
-- 5. 전체 요약
-- ============================================================

SELECT 
  '=== 전체 요약 ===' as summary,
  (SELECT COUNT(*) FROM personality_traits) as personality_traits_count,
  (SELECT COUNT(*) FROM answer_score_mapping WHERE analysis_mode = 'quick') as quick_count,
  (SELECT COUNT(*) FROM answer_score_mapping WHERE analysis_mode = 'standard') as standard_count,
  (SELECT COUNT(*) FROM answer_score_mapping WHERE analysis_mode = 'deep') as deep_count,
  (SELECT COUNT(*) FROM answer_score_mapping WHERE analysis_mode = 'vibe') as vibe_count,
  (SELECT COUNT(*) FROM answer_score_mapping) as total_mapping_count;

-- 예상 결과:
-- personality_traits_count: 15
-- quick_count: 24
-- standard_count: 36
-- deep_count: 48
-- vibe_count: 42
-- total_mapping_count: 150
















