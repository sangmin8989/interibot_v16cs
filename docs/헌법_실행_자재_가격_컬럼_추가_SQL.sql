-- ============================================================
-- 헌법 실행: materials 테이블에 가격 컬럼 추가
-- ============================================================
-- 
-- 목적: 자재 가격 정보를 저장하기 위한 컬럼 추가
-- 헌법 v1 엔진은 price 또는 price_argen 컬럼을 사용합니다
-- ============================================================

-- 1. price_argen 컬럼 추가 (아르젠 표준 자재 가격)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'price_argen'
  ) THEN
    ALTER TABLE materials ADD COLUMN price_argen INTEGER;
    COMMENT ON COLUMN materials.price_argen IS '아르젠 표준 자재 단가 (원)';
  END IF;
END $$;

-- 2. price 컬럼 추가 (일반 가격, price_argen이 없을 때 사용)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'price'
  ) THEN
    ALTER TABLE materials ADD COLUMN price INTEGER;
    COMMENT ON COLUMN materials.price IS '자재 단가 (원), price_argen이 없을 때 사용';
  END IF;
END $$;

-- 3. 결과 확인
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'materials'
  AND column_name IN ('price', 'price_argen')
ORDER BY column_name;






