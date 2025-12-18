-- ============================================================
-- personality_materials 데이터 입력 확인 쿼리
-- ============================================================
-- 
-- 파일명: VERIFY_PERSONALITY_MATERIALS.sql
-- 생성일: 2025-12-12
-- 목적: personality_materials 테이블 입력 데이터 검증
-- 
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일 전체 내용 복사
-- 3. 붙여넣기 후 Run 실행
--
-- ============================================================

-- ============================================================
-- 1. 기본 통계
-- ============================================================

-- 총 매핑 개수
SELECT 
  '총 매핑 개수' AS info,
  COUNT(*) AS count
FROM personality_materials;

-- 활성 매핑 개수
SELECT 
  '활성 매핑 개수' AS info,
  COUNT(*) AS count
FROM personality_materials
WHERE is_active = true;

-- ============================================================
-- 2. 성향별 매핑 개수
-- ============================================================

SELECT 
  pt.trait_id,
  pt.trait_code,
  pt.trait_name,
  pt.trait_category,
  COUNT(pm.mapping_id) AS mapping_count
FROM personality_traits pt
LEFT JOIN personality_materials pm ON pt.trait_id = pm.trait_id AND pm.is_active = true
GROUP BY pt.trait_id, pt.trait_code, pt.trait_name, pt.trait_category
ORDER BY mapping_count DESC, pt.trait_category, pt.trait_code;

-- ============================================================
-- 3. 자재별 매핑 개수
-- ============================================================

SELECT 
  m.id AS material_id,
  m.material_code,
  m.product_name,
  m.category_1,
  COUNT(pm.mapping_id) AS mapping_count
FROM materials m
INNER JOIN personality_materials pm ON m.id = pm.material_id
WHERE pm.is_active = true
GROUP BY m.id, m.material_code, m.product_name, m.category_1
ORDER BY mapping_count DESC, m.category_1, m.product_name
LIMIT 30;

-- ============================================================
-- 4. 추천 타입별 분포
-- ============================================================

SELECT 
  recommendation_type AS 추천타입,
  COUNT(*) AS 개수,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM personality_materials WHERE is_active = true), 2) AS 비율
FROM personality_materials
WHERE is_active = true
GROUP BY recommendation_type
ORDER BY 개수 DESC;

-- ============================================================
-- 5. 점수 기준별 분포
-- ============================================================

SELECT 
  score_threshold AS 기준점수,
  score_direction AS 방향,
  COUNT(*) AS 개수
FROM personality_materials
WHERE is_active = true
GROUP BY score_threshold, score_direction
ORDER BY score_threshold DESC, score_direction;

-- ============================================================
-- 6. 우선순위별 분포
-- ============================================================

SELECT 
  CASE
    WHEN priority >= 90 THEN '매우높음 (90-100)'
    WHEN priority >= 80 THEN '높음 (80-89)'
    WHEN priority >= 70 THEN '보통 (70-79)'
    WHEN priority >= 60 THEN '낮음 (60-69)'
    ELSE '매우낮음 (1-59)'
  END AS 우선순위구간,
  COUNT(*) AS 개수
FROM personality_materials
WHERE is_active = true
GROUP BY 
  CASE
    WHEN priority >= 90 THEN '매우높음 (90-100)'
    WHEN priority >= 80 THEN '높음 (80-89)'
    WHEN priority >= 70 THEN '보통 (70-79)'
    WHEN priority >= 60 THEN '낮음 (60-69)'
    ELSE '매우낮음 (1-59)'
  END
ORDER BY MIN(priority) DESC;

-- ============================================================
-- 7. 등급 조정 분포
-- ============================================================

SELECT 
  grade_adjustment AS 등급조정,
  COUNT(*) AS 개수
FROM personality_materials
WHERE is_active = true
GROUP BY grade_adjustment
ORDER BY grade_adjustment DESC;

-- ============================================================
-- 8. 샘플 매핑 데이터 확인 (상위 20개)
-- ============================================================

SELECT 
  pm.mapping_id,
  pt.trait_code AS 성향코드,
  pt.trait_name AS 성향명,
  m.material_code AS 자재코드,
  m.product_name AS 자재명,
  m.category_1 AS 카테고리,
  pm.score_threshold AS 기준점수,
  pm.score_direction AS 방향,
  pm.recommendation_type AS 추천타입,
  pm.grade_adjustment AS 등급조정,
  pm.priority AS 우선순위,
  pm.reason_template AS 추천이유
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pm.is_active = true
ORDER BY pm.priority DESC, pm.mapping_id
LIMIT 20;

-- ============================================================
-- 9. 공정별 매핑 개수 (phase_id가 있는 경우)
-- ============================================================

SELECT 
  cp.id AS phase_id,
  cp.phase_name AS 공정명,
  cp.category AS 카테고리,
  COUNT(pm.mapping_id) AS 매핑개수
FROM construction_phases cp
LEFT JOIN personality_materials pm ON cp.id = pm.phase_id AND pm.is_active = true
GROUP BY cp.id, cp.phase_name, cp.category
HAVING COUNT(pm.mapping_id) > 0
ORDER BY 매핑개수 DESC;

-- ============================================================
-- 10. 데이터 무결성 검증
-- ============================================================

-- 10-1. 참조 무결성 확인 (trait_id)
SELECT 
  'personality_traits 참조 오류' AS 검증항목,
  COUNT(*) AS 오류개수
FROM personality_materials pm
LEFT JOIN personality_traits pt ON pm.trait_id = pt.trait_id
WHERE pt.trait_id IS NULL;

-- 10-2. 참조 무결성 확인 (material_id)
SELECT 
  'materials 참조 오류' AS 검증항목,
  COUNT(*) AS 오류개수
FROM personality_materials pm
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pm.material_id IS NOT NULL AND m.id IS NULL;

-- 10-3. 참조 무결성 확인 (phase_id)
SELECT 
  'construction_phases 참조 오류' AS 검증항목,
  COUNT(*) AS 오류개수
FROM personality_materials pm
LEFT JOIN construction_phases cp ON pm.phase_id = cp.id
WHERE pm.phase_id IS NOT NULL AND cp.id IS NULL;

-- 10-4. 필수 컬럼 NULL 확인
SELECT 
  '필수 컬럼 NULL 오류' AS 검증항목,
  COUNT(*) AS 오류개수
FROM personality_materials
WHERE trait_id IS NULL 
   OR material_id IS NULL
   OR score_threshold IS NULL
   OR score_direction IS NULL
   OR recommendation_type IS NULL;

-- ============================================================
-- 11. 종합 요약
-- ============================================================

SELECT
  '=== personality_materials 입력 상태 종합 ===' AS summary,
  (SELECT COUNT(*) FROM personality_materials) AS 총매핑개수,
  (SELECT COUNT(*) FROM personality_materials WHERE is_active = true) AS 활성매핑개수,
  (SELECT COUNT(DISTINCT trait_id) FROM personality_materials WHERE is_active = true) AS 연결된성향개수,
  (SELECT COUNT(DISTINCT material_id) FROM personality_materials WHERE is_active = true AND material_id IS NOT NULL) AS 연결된자재개수,
  (SELECT COUNT(DISTINCT phase_id) FROM personality_materials WHERE is_active = true AND phase_id IS NOT NULL) AS 연결된공정개수,
  CASE
    WHEN (SELECT COUNT(*) FROM personality_materials WHERE is_active = true) >= 50 THEN '✅ 충분함 (50개 이상)'
    WHEN (SELECT COUNT(*) FROM personality_materials WHERE is_active = true) >= 20 THEN '⚠️ 보통 (20-49개)'
    ELSE '❌ 부족함 (20개 미만)'
  END AS 입력상태평가;

-- ============================================================
-- 12. 성향별 커버리지 확인
-- ============================================================

SELECT 
  pt.trait_code AS 성향코드,
  pt.trait_name AS 성향명,
  CASE 
    WHEN COUNT(pm.mapping_id) = 0 THEN '❌ 매핑 없음'
    WHEN COUNT(pm.mapping_id) < 3 THEN '⚠️ 부족 (1-2개)'
    WHEN COUNT(pm.mapping_id) < 5 THEN '✅ 보통 (3-4개)'
    ELSE '✅ 충분 (5개 이상)'
  END AS 매핑상태,
  COUNT(pm.mapping_id) AS 매핑개수
FROM personality_traits pt
LEFT JOIN personality_materials pm ON pt.trait_id = pm.trait_id AND pm.is_active = true
GROUP BY pt.trait_id, pt.trait_code, pt.trait_name
ORDER BY 
  CASE 
    WHEN COUNT(pm.mapping_id) = 0 THEN 1
    WHEN COUNT(pm.mapping_id) < 3 THEN 2
    WHEN COUNT(pm.mapping_id) < 5 THEN 3
    ELSE 4
  END,
  pt.trait_code;

















