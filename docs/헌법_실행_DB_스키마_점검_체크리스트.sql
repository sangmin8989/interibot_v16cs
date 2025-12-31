-- ============================================================
-- 인테리봇 견적 시스템 헌법 실행 - DB 스키마 점검 체크리스트
-- 작성일: 2024년 12월
-- 목적: 헌법 문서 실행 전 필수 DB 스키마 확인 (Q1~Q3)
-- 사용법: Supabase SQL Editor에서 순서대로 실행
-- ============================================================

-- ============================================================
-- Phase 0: 전체 테이블 목록 확인
-- ============================================================

-- 모든 public 스키마 테이블 목록
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================
-- Q1. materials 테이블에 is_argen_standard 컬럼이 있나요?
-- ============================================================

-- 1-1. materials 테이블 컬럼 전체 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'materials'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1-2. is_argen_standard 컬럼 존재 여부 확인
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'materials' 
        AND column_name = 'is_argen_standard'
    ) 
    THEN '✅ 통과: is_argen_standard 컬럼 존재'
    ELSE '❌ 탈락: is_argen_standard 컬럼 없음 → ALTER TABLE 필요'
  END as check_result;

-- 1-3. 필수 컬럼 존재 여부 확인 (통과 기준)
SELECT 
  column_name,
  CASE 
    WHEN column_name IN ('is_argen_standard', 'brand_name', 'product_name', 'spec', 'category_1', 'category_2', 'category_3', 'is_active', 'is_current')
    THEN '✅ 필수'
    ELSE '⚠️ 선택'
  END as required_status
FROM information_schema.columns
WHERE table_name = 'materials'
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN column_name IN ('is_argen_standard', 'brand_name', 'product_name', 'spec', 'category_1', 'category_2', 'category_3', 'is_active', 'is_current')
    THEN 0
    ELSE 1
  END,
  ordinal_position;

-- 1-4. is_argen_standard 컬럼이 없으면 생성 (실행 전 백업 권장)
-- ⚠️ 주의: 이 쿼리는 컬럼이 없을 때만 실행하세요
/*
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'is_argen_standard'
  ) THEN
    ALTER TABLE materials 
    ADD COLUMN is_argen_standard BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN argen_priority INT DEFAULT 0;
    
    CREATE INDEX IF NOT EXISTS idx_materials_argen_standard 
    ON materials(is_argen_standard) 
    WHERE is_argen_standard = true;
    
    RAISE NOTICE '✅ is_argen_standard 컬럼 생성 완료';
  ELSE
    RAISE NOTICE '⚠️ is_argen_standard 컬럼이 이미 존재합니다';
  END IF;
END $$;
*/

-- ============================================================
-- Q2. 노무비 테이블이 있나요? 테이블명과 구조는?
-- ============================================================

-- 2-1. 노무비 관련 테이블 검색 (labor로 시작하는 테이블)
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND (
    table_name ILIKE '%labor%' 
    OR table_name ILIKE '%노무%'
    OR table_name ILIKE '%work%'
    OR table_name ILIKE '%construction%'
  )
ORDER BY table_name;

-- 2-2. 노무비 테이블 후보의 컬럼 구조 확인
-- ⚠️ 아래 'labor_costs'를 실제 테이블명으로 변경하세요
/*
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'labor_costs'  -- ← 여기를 실제 테이블명으로 변경
  AND table_schema = 'public'
ORDER BY ordinal_position;
*/

-- 2-3. 필수 컬럼 존재 여부 확인 (헌법 통과 조건)
-- ⚠️ 아래 'labor_costs'를 실제 테이블명으로 변경하세요
/*
SELECT 
  column_name,
  CASE 
    WHEN column_name IN (
      'process_id', 'labor_category',  -- 공정/노무 카테고리 키
      'unit',                          -- 노무 단위 (㎡/EA/SET/일)
      'daily_output',                  -- 1일 작업량
      'crew_size',                     -- 투입 인원 기준
      'rate_per_person_day',           -- 1인 1일 노무 단가
      'difficulty_factor'              -- 시공 난이도 계수
    )
    THEN '✅ 필수'
    WHEN column_name IN (
      'difficulty_basis',              -- 난이도 상승 조건
      'output_factor_by_difficulty',   -- 난이도에 따른 작업량 감소 계수
      'min_visit_days'                 -- 최소 방문일 규칙
    )
    THEN '⭐ 권장'
    ELSE '⚠️ 선택'
  END as required_status
FROM information_schema.columns
WHERE table_name = 'labor_costs'  -- ← 여기를 실제 테이블명으로 변경
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN column_name IN (
      'process_id', 'labor_category', 'unit', 'daily_output', 
      'crew_size', 'rate_per_person_day', 'difficulty_factor'
    )
    THEN 0
    WHEN column_name IN (
      'difficulty_basis', 'output_factor_by_difficulty', 'min_visit_days'
    )
    THEN 1
    ELSE 2
  END,
  ordinal_position;
*/

-- 2-4. 노무비 테이블이 없으면 생성 예시 (참고용)
/*
CREATE TABLE IF NOT EXISTS labor_costs (
  labor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id VARCHAR(50) NOT NULL,              -- 공정 ID (예: 'tile', 'wallpaper')
  labor_category VARCHAR(50),                   -- 노무 카테고리 (예: 'tile_installation')
  unit VARCHAR(20) NOT NULL,                    -- 노무 단위: 'm2', 'EA', 'SET', 'day'
  daily_output NUMERIC(10,2),                   -- 1일 작업량 (단위 기준)
  crew_size INT DEFAULT 2,                      -- 투입 인원 기준
  rate_per_person_day INT NOT NULL,             -- 1인 1일 노무 단가 (원)
  difficulty_factor NUMERIC(4,2) DEFAULT 1.0,   -- 시공 난이도 계수 (기본 1.0)
  
  -- 권장 컬럼
  difficulty_basis TEXT,                        -- 난이도 상승 조건 (예: '600각 이상', '수입', '대형판')
  output_factor_by_difficulty NUMERIC(4,2) DEFAULT 0.7,  -- 난이도 증가 시 작업량 감소 계수
  min_visit_days INT DEFAULT 1,                 -- 최소 방문일 규칙
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_labor_process ON labor_costs(process_id);
CREATE INDEX IF NOT EXISTS idx_labor_category ON labor_costs(labor_category);
CREATE INDEX IF NOT EXISTS idx_labor_active ON labor_costs(is_active);
*/

-- ============================================================
-- Q3. is_argen_standard = true 자재 데이터가 충분한가요?
-- ============================================================

-- 3-1. is_argen_standard = true 자재 총 개수
SELECT 
  COUNT(*) as total_argen_materials,
  COUNT(DISTINCT category_1) as category_1_count,
  COUNT(DISTINCT category_2) as category_2_count,
  COUNT(DISTINCT category_3) as category_3_count
FROM materials
WHERE is_argen_standard = true 
  AND (is_active = true OR is_active IS NULL);

-- 3-2. 카테고리별 is_argen_standard = true 자재 개수
SELECT 
  category_1,
  category_2,
  category_3,
  COUNT(*) as argen_count,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ 충분 (3개 이상)'
    WHEN COUNT(*) >= 1 THEN '⚠️ 최소 (1개)'
    ELSE '❌ 부족 (0개)'
  END as status
FROM materials
WHERE is_argen_standard = true 
  AND (is_active = true OR is_active IS NULL)
GROUP BY category_1, category_2, category_3
ORDER BY category_1, category_2, category_3;

-- 3-3. 필수 공정별 자재 커버리지 확인
-- ⚠️ 아래는 인테리봇의 주요 공정 기준입니다. 실제 공정 목록에 맞게 수정하세요
WITH required_processes AS (
  SELECT unnest(ARRAY[
    '타일', '도배', '마루', '조명', '수전', '도어', '상판', '필름', '도장', '철거'
  ]) as process_name
),
process_materials AS (
  SELECT DISTINCT
    CASE 
      WHEN category_1 ILIKE '%타일%' OR category_2 ILIKE '%타일%' THEN '타일'
      WHEN category_1 ILIKE '%도배%' OR category_2 ILIKE '%도배%' OR category_1 ILIKE '%벽지%' THEN '도배'
      WHEN category_1 ILIKE '%마루%' OR category_1 ILIKE '%바닥%' OR category_2 ILIKE '%마루%' THEN '마루'
      WHEN category_1 ILIKE '%조명%' OR category_2 ILIKE '%조명%' THEN '조명'
      WHEN category_1 ILIKE '%수전%' OR category_2 ILIKE '%수전%' THEN '수전'
      WHEN category_1 ILIKE '%도어%' OR category_1 ILIKE '%문%' THEN '도어'
      WHEN category_1 ILIKE '%상판%' OR category_2 ILIKE '%상판%' THEN '상판'
      WHEN category_1 ILIKE '%필름%' OR category_2 ILIKE '%필름%' THEN '필름'
      WHEN category_1 ILIKE '%도장%' OR category_2 ILIKE '%도장%' THEN '도장'
      WHEN category_1 ILIKE '%철거%' OR category_2 ILIKE '%철거%' THEN '철거'
      ELSE NULL
    END as process_name,
    COUNT(*) as material_count
  FROM materials
  WHERE is_argen_standard = true 
    AND (is_active = true OR is_active IS NULL)
    AND brand_name IS NOT NULL 
    AND product_name IS NOT NULL
  GROUP BY process_name
)
SELECT 
  rp.process_name,
  COALESCE(pm.material_count, 0) as argen_material_count,
  CASE 
    WHEN COALESCE(pm.material_count, 0) >= 3 THEN '✅ 충분'
    WHEN COALESCE(pm.material_count, 0) >= 1 THEN '⚠️ 최소'
    ELSE '❌ 부족'
  END as status
FROM required_processes rp
LEFT JOIN process_materials pm ON rp.process_name = pm.process_name
ORDER BY rp.process_name;

-- 3-4. 브랜드명/제품명/규격 누락 확인 (탈락 패턴)
SELECT 
  COUNT(*) as total_argen,
  COUNT(brand_name) as has_brand_name,
  COUNT(product_name) as has_product_name,
  COUNT(spec) as has_spec,
  COUNT(*) - COUNT(brand_name) as missing_brand_name,
  COUNT(*) - COUNT(product_name) as missing_product_name,
  COUNT(*) - COUNT(spec) as missing_spec,
  CASE 
    WHEN COUNT(*) - COUNT(brand_name) > 0 
      OR COUNT(*) - COUNT(product_name) > 0 
      OR COUNT(*) - COUNT(spec) > 0
    THEN '❌ 탈락: 브랜드/제품명/규격 누락'
    ELSE '✅ 통과: 모든 필수 정보 존재'
  END as check_result
FROM materials
WHERE is_argen_standard = true 
  AND (is_active = true OR is_active IS NULL);

-- 3-5. 샘플 데이터 확인 (실제 데이터 품질 확인용)
SELECT 
  material_id,
  material_code,
  brand_name,
  product_name,
  spec,
  category_1,
  category_2,
  category_3,
  is_argen_standard,
  argen_priority,
  is_active
FROM materials
WHERE is_argen_standard = true 
  AND (is_active = true OR is_active IS NULL)
ORDER BY argen_priority DESC NULLS LAST, category_1, category_2, category_3
LIMIT 20;

-- ============================================================
-- 최종 점검 결과 요약
-- ============================================================

-- 통과/탈락 종합 판정
SELECT 
  'Q1. is_argen_standard 컬럼' as check_item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'is_argen_standard'
    ) 
    THEN '✅ 통과'
    ELSE '❌ 탈락'
  END as result
UNION ALL
SELECT 
  'Q2. 노무비 테이블 존재' as check_item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name ILIKE '%labor%' OR table_name ILIKE '%노무%')
    )
    THEN '✅ 통과 (테이블명 확인 필요)'
    ELSE '❌ 탈락'
  END as result
UNION ALL
SELECT 
  'Q3. 아르젠 자재 충분성' as check_item,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM materials 
      WHERE is_argen_standard = true 
        AND (is_active = true OR is_active IS NULL)
        AND brand_name IS NOT NULL 
        AND product_name IS NOT NULL
    ) >= 10
    THEN '✅ 통과 (최소 10개 이상)'
    ELSE '⚠️ 확인 필요 (10개 미만)'
  END as result;

-- ============================================================
-- 실행 완료 후 확인사항
-- ============================================================

/*
✅ 통과 기준:
1. Q1: is_argen_standard 컬럼 존재 + 필수 컬럼(brand_name, product_name, spec) 존재
2. Q2: 노무비 테이블 존재 + 필수 컬럼(process_id, unit, daily_output, crew_size, rate_per_person_day, difficulty_factor) 존재
3. Q3: is_argen_standard=true 자재가 주요 공정별로 최소 1개 이상, 권장 3개 이상

❌ 탈락 시 조치:
1. Q1 탈락 → ALTER TABLE로 컬럼 추가 (위 1-4 쿼리 참고)
2. Q2 탈락 → 노무비 테이블 생성 (위 2-4 쿼리 참고)
3. Q3 탈락 → materials 테이블에 is_argen_standard=true 데이터 입력 필요
*/

















