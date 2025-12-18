-- ============================================================
-- materials 테이블 상태 확인 쿼리
-- ============================================================
-- 
-- 파일명: CHECK_MATERIALS_STATUS.sql
-- 생성일: 2025-12-12
-- 목적: materials 테이블 입력 상태 확인 및 personality_materials 입력 준비 여부 판단
-- 
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일 전체 내용 복사
-- 3. 붙여넣기 후 Run 실행
--
-- ============================================================

-- ============================================================
-- 1. materials 테이블 기본 정보
-- ============================================================

-- 총 자재 수
SELECT 
  'materials 총 개수' AS info,
  COUNT(*) AS count
FROM materials;

-- ============================================================
-- 2. 카테고리별 자재 수 (category_1 기준)
-- ============================================================

SELECT 
  category_1 AS 카테고리1,
  COUNT(*) AS 개수
FROM materials
WHERE category_1 IS NOT NULL
GROUP BY category_1
ORDER BY 개수 DESC;

-- 카테고리2, 카테고리3도 확인
SELECT 
  category_2 AS 카테고리2,
  COUNT(*) AS 개수
FROM materials
WHERE category_2 IS NOT NULL
GROUP BY category_2
ORDER BY 개수 DESC;

SELECT 
  category_3 AS 카테고리3,
  COUNT(*) AS 개수
FROM materials
WHERE category_3 IS NOT NULL
GROUP BY category_3
ORDER BY 개수 DESC;

-- ============================================================
-- 3. 브랜드별 자재 수 (등급 추정용)
-- ============================================================

-- brand_basic이 있는 자재
SELECT 
  'brand_basic' AS 브랜드타입,
  COUNT(*) AS 개수
FROM materials
WHERE brand_basic IS NOT NULL;

-- brand_standard가 있는 자재
SELECT 
  'brand_standard' AS 브랜드타입,
  COUNT(*) AS 개수
FROM materials
WHERE brand_standard IS NOT NULL;

-- brand_argen이 있는 자재
SELECT 
  'brand_argen' AS 브랜드타입,
  COUNT(*) AS 개수
FROM materials
WHERE brand_argen IS NOT NULL;

-- brand_premium이 있는 자재
SELECT 
  'brand_premium' AS 브랜드타입,
  COUNT(*) AS 개수
FROM materials
WHERE brand_premium IS NOT NULL;

-- ============================================================
-- 4. 샘플 데이터 확인 (최대 10개)
-- ============================================================

SELECT 
  id AS material_id,
  material_code,
  product_name,
  category_1,
  category_2,
  category_3,
  brand_basic,
  brand_standard,
  brand_argen,
  brand_premium,
  unit,
  phase_id
FROM materials
LIMIT 10;

-- ============================================================
-- 5. construction_phases 테이블 상태 확인
-- ============================================================

SELECT 
  'construction_phases 총 개수' AS info,
  COUNT(*) AS count
FROM construction_phases;

-- 샘플 데이터 (실제 컬럼명 확인 필요)
SELECT 
  id AS phase_id,
  phase_name,
  phase_order,
  category,
  is_active
FROM construction_phases
ORDER BY phase_order
LIMIT 10;

-- ============================================================
-- 6. personality_traits 테이블 상태 확인
-- ============================================================

SELECT 
  'personality_traits 총 개수' AS info,
  COUNT(*) AS count
FROM personality_traits;

-- ============================================================
-- 7. personality_materials 입력 준비 상태 종합 판단
-- ============================================================

SELECT
  '=== personality_materials 입력 준비 상태 ===' AS summary,
  (SELECT COUNT(*) FROM materials) AS materials_count,
  (SELECT COUNT(*) FROM construction_phases) AS phases_count,
  (SELECT COUNT(*) FROM personality_traits) AS traits_count,
  (SELECT COUNT(*) FROM personality_materials) AS current_mappings_count,
  CASE
    WHEN (SELECT COUNT(*) FROM materials) > 0 
      AND (SELECT COUNT(*) FROM construction_phases) > 0 
      AND (SELECT COUNT(*) FROM personality_traits) >= 15
    THEN '✅ 입력 가능'
    ELSE '⏳ 입력 불가 (필수 테이블 데이터 부족)'
  END AS readiness_status;

-- ============================================================
-- 8. 상세 준비 상태 체크리스트
-- ============================================================

SELECT
  'materials 테이블 존재' AS check_item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials') 
    THEN '✅' ELSE '❌' END AS status
UNION ALL
SELECT
  'materials 데이터 있음',
  CASE WHEN (SELECT COUNT(*) FROM materials) > 0 THEN '✅' ELSE '❌' END
UNION ALL
SELECT
  'construction_phases 테이블 존재',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'construction_phases') 
    THEN '✅' ELSE '❌' END
UNION ALL
SELECT
  'construction_phases 데이터 있음',
  CASE WHEN (SELECT COUNT(*) FROM construction_phases) > 0 THEN '✅' ELSE '❌' END
UNION ALL
SELECT
  'personality_traits 테이블 존재',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personality_traits') 
    THEN '✅' ELSE '❌' END
UNION ALL
SELECT
  'personality_traits 15개 이상',
  CASE WHEN (SELECT COUNT(*) FROM personality_traits) >= 15 THEN '✅' ELSE '❌' END
UNION ALL
SELECT
  'personality_materials 테이블 존재',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personality_materials') 
    THEN '✅' ELSE '❌' END;

-- ============================================================
-- 9. materials 테이블 컬럼 구조 확인
-- ============================================================

SELECT
  column_name AS 컬럼명,
  data_type AS 데이터타입,
  is_nullable AS NULL허용,
  column_default AS 기본값
FROM information_schema.columns
WHERE table_name = 'materials'
ORDER BY ordinal_position;

-- ============================================================
-- 10. 참조 무결성 확인 (materials → personality_materials)
-- ============================================================

-- materials 테이블에 있는 id 목록 (샘플 5개) - personality_materials에서 참조할 때 사용
SELECT 
  'materials 테이블의 id 샘플 (personality_materials에서 참조용)' AS info,
  id AS material_id,
  material_code,
  product_name,
  category_1
FROM materials
LIMIT 5;

-- personality_materials에서 참조하는 material_id 목록 (현재 상태)
SELECT 
  'personality_materials에서 참조하는 material_id' AS info,
  COUNT(DISTINCT material_id) AS unique_material_count,
  COUNT(*) AS total_mappings
FROM personality_materials
WHERE material_id IS NOT NULL;

