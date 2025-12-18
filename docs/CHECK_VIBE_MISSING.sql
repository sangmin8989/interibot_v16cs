-- ============================================================
-- Vibe 모드 누락 데이터 확인
-- ============================================================
-- 
-- 목적: Vibe 모드에서 어떤 질문이 입력되지 않았는지 확인
-- 
-- ============================================================

-- 입력된 Vibe 모드 질문 확인
SELECT 
  question_id,
  COUNT(*) as answer_count
FROM answer_score_mapping
WHERE analysis_mode = 'vibe'
GROUP BY question_id
ORDER BY question_id;

-- 예상되는 7개 질문:
-- 1. vibe_weekend_alone
-- 2. vibe_cafe_seat
-- 3. vibe_sns_interior
-- 4. vibe_travel_style
-- 5. vibe_home_relationship
-- 6. vibe_movie_genre
-- 7. vibe_interior_priority

-- 누락된 질문 확인 (예상 목록과 비교)
SELECT 
  CASE 
    WHEN question_id = 'vibe_weekend_alone' THEN '✅ 입력됨'
    ELSE '❌ 누락'
  END as status,
  'vibe_weekend_alone' as expected_question
WHERE NOT EXISTS (
  SELECT 1 FROM answer_score_mapping 
  WHERE question_id = 'vibe_weekend_alone' AND analysis_mode = 'vibe'
)
UNION ALL
SELECT 
  CASE 
    WHEN question_id = 'vibe_cafe_seat' THEN '✅ 입력됨'
    ELSE '❌ 누락'
  END,
  'vibe_cafe_seat'
WHERE NOT EXISTS (
  SELECT 1 FROM answer_score_mapping 
  WHERE question_id = 'vibe_cafe_seat' AND analysis_mode = 'vibe'
)
UNION ALL
SELECT 
  CASE 
    WHEN question_id = 'vibe_sns_interior' THEN '✅ 입력됨'
    ELSE '❌ 누락'
  END,
  'vibe_sns_interior'
WHERE NOT EXISTS (
  SELECT 1 FROM answer_score_mapping 
  WHERE question_id = 'vibe_sns_interior' AND analysis_mode = 'vibe'
)
UNION ALL
SELECT 
  CASE 
    WHEN question_id = 'vibe_travel_style' THEN '✅ 입력됨'
    ELSE '❌ 누락'
  END,
  'vibe_travel_style'
WHERE NOT EXISTS (
  SELECT 1 FROM answer_score_mapping 
  WHERE question_id = 'vibe_travel_style' AND analysis_mode = 'vibe'
)
UNION ALL
SELECT 
  CASE 
    WHEN question_id = 'vibe_home_relationship' THEN '✅ 입력됨'
    ELSE '❌ 누락'
  END,
  'vibe_home_relationship'
WHERE NOT EXISTS (
  SELECT 1 FROM answer_score_mapping 
  WHERE question_id = 'vibe_home_relationship' AND analysis_mode = 'vibe'
)
UNION ALL
SELECT 
  CASE 
    WHEN question_id = 'vibe_movie_genre' THEN '✅ 입력됨'
    ELSE '❌ 누락'
  END,
  'vibe_movie_genre'
WHERE NOT EXISTS (
  SELECT 1 FROM answer_score_mapping 
  WHERE question_id = 'vibe_movie_genre' AND analysis_mode = 'vibe'
)
UNION ALL
SELECT 
  CASE 
    WHEN question_id = 'vibe_interior_priority' THEN '✅ 입력됨'
    ELSE '❌ 누락'
  END,
  'vibe_interior_priority'
WHERE NOT EXISTS (
  SELECT 1 FROM answer_score_mapping 
  WHERE question_id = 'vibe_interior_priority' AND analysis_mode = 'vibe'
);

-- 더 간단한 방법: 각 질문별 개수 확인
SELECT 
  'vibe_weekend_alone' as question_id,
  COUNT(*) as count
FROM answer_score_mapping
WHERE question_id = 'vibe_weekend_alone' AND analysis_mode = 'vibe'
UNION ALL
SELECT 
  'vibe_cafe_seat',
  COUNT(*)
FROM answer_score_mapping
WHERE question_id = 'vibe_cafe_seat' AND analysis_mode = 'vibe'
UNION ALL
SELECT 
  'vibe_sns_interior',
  COUNT(*)
FROM answer_score_mapping
WHERE question_id = 'vibe_sns_interior' AND analysis_mode = 'vibe'
UNION ALL
SELECT 
  'vibe_travel_style',
  COUNT(*)
FROM answer_score_mapping
WHERE question_id = 'vibe_travel_style' AND analysis_mode = 'vibe'
UNION ALL
SELECT 
  'vibe_home_relationship',
  COUNT(*)
FROM answer_score_mapping
WHERE question_id = 'vibe_home_relationship' AND analysis_mode = 'vibe'
UNION ALL
SELECT 
  'vibe_movie_genre',
  COUNT(*)
FROM answer_score_mapping
WHERE question_id = 'vibe_movie_genre' AND analysis_mode = 'vibe'
UNION ALL
SELECT 
  'vibe_interior_priority',
  COUNT(*)
FROM answer_score_mapping
WHERE question_id = 'vibe_interior_priority' AND analysis_mode = 'vibe';

-- 예상 결과: 각 질문당 6개씩 (총 42개)
-- 만약 0개인 질문이 있으면 그 질문이 누락된 것입니다.
















