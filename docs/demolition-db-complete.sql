-- ============================================================
-- 인테리봇 철거 공정 DB (Supabase용) - 완전판
-- 작성일: 2025년 12월 13일
-- 기준: 실제 현장 단가 검증 완료
-- 범위: 10평 ~ 200평+
-- 
-- ⚠️ 주의: 이 스크립트는 기존 테이블을 삭제합니다!
-- ============================================================

-- ============================================================
-- 1. 기존 테이블 삭제 (재생성용)
-- ⚠️ 주의: 기존 데이터가 모두 삭제됩니다!
-- ============================================================

DROP TABLE IF EXISTS demolition_waste_config CASCADE;
DROP TABLE IF EXISTS demolition_options CASCADE;
DROP TABLE IF EXISTS demolition_items CASCADE;
DROP TABLE IF EXISTS demolition_packages CASCADE;
DROP TABLE IF EXISTS demolition_protection CASCADE;
DROP TABLE IF EXISTS demolition_config CASCADE;
DROP TABLE IF EXISTS demolition_categories CASCADE;

-- ============================================================
-- 2. 철거 대분류 테이블
-- ============================================================

CREATE TABLE demolition_categories (
    category_id VARCHAR(20) PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    category_order INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 철거 세부 항목 테이블
-- ============================================================

CREATE TABLE demolition_items (
    item_id VARCHAR(30) PRIMARY KEY,
    category_id VARCHAR(20) REFERENCES demolition_categories(category_id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    item_size VARCHAR(50),
    unit VARCHAR(20) NOT NULL,
    unit_price INT NOT NULL,
    min_price INT,
    max_price INT,
    includes TEXT,
    pyeong_min INT,
    pyeong_max INT,
    is_package BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. 전체 철거 패키지 테이블
-- ============================================================

CREATE TABLE demolition_packages (
    package_id VARCHAR(20) PRIMARY KEY,
    pyeong INT NOT NULL,
    package_name VARCHAR(50) NOT NULL,
    total_price INT NOT NULL,
    price_per_pyeong INT,
    includes TEXT,
    property_type VARCHAR(20) DEFAULT 'apartment',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. 추가 옵션 테이블
-- ============================================================

CREATE TABLE demolition_options (
    option_id VARCHAR(30) PRIMARY KEY,
    category_id VARCHAR(20) REFERENCES demolition_categories(category_id) ON DELETE CASCADE,
    option_name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price INT NOT NULL,
    condition_desc TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. 보양 단가 테이블
-- ============================================================

CREATE TABLE demolition_protection (
    protection_id VARCHAR(20) PRIMARY KEY,
    protection_name VARCHAR(50) NOT NULL,
    base_price INT NOT NULL,
    additional_unit VARCHAR(20),
    additional_price INT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. 계산 로직용 Config 테이블 (Fallback용)
-- ============================================================

CREATE TABLE demolition_config (
    config_id VARCHAR(30) PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL,
    pyeong_min INT,
    pyeong_max INT,
    price_per_pyeong INT NOT NULL,
    base_price INT DEFAULT 0,
    property_type VARCHAR(20) DEFAULT 'apartment',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. 폐기물 처리비 Config 테이블 (신규 추가)
-- ============================================================

CREATE TABLE demolition_waste_config (
    pyeong INT PRIMARY KEY,
    max_ton DECIMAL(3, 1) NOT NULL,
    price_per_ton INT NOT NULL DEFAULT 500000,
    total_cost INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. 데이터 입력: 대분류
-- ============================================================

INSERT INTO demolition_categories (category_id, category_name, category_order, description) VALUES
('DEM-BATH', '욕실 철거', 1, '욕실 전체 철거 (타일+변기+세면대+샤워부스+폐기물 포함)'),
('DEM-KITCHEN', '주방 철거', 2, '주방 전체 철거 (상하부장+후드+수전+싱크볼+폐기물 포함)'),
('DEM-FLOOR', '바닥재 철거', 3, '바닥재 종류별 철거 (철거+샌딩+폐기물 포함)'),
('DEM-CEILING', '천장 철거', 4, '천장 종류별 철거 (철거+폐기물 포함)'),
('DEM-FURNITURE', '가구 철거', 5, '붙박이장/신발장/거실장 등 (철거+폐기물 포함)'),
('DEM-DOOR', '문/창호 철거', 6, '방문/중문/샷시 등 (철거+폐기물 포함)'),
('DEM-WALL', '벽체/기타 철거', 7, '가벽/아트월/등박스/몰딩 등'),
('DEM-PROTECT', '보양', 8, '엘리베이터/복도/계단 보양')
ON CONFLICT (category_id) DO UPDATE SET
    category_name = EXCLUDED.category_name,
    category_order = EXCLUDED.category_order,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================
-- 10. 데이터 입력: 욕실 철거
-- ============================================================

INSERT INTO demolition_items (item_id, category_id, item_name, item_size, unit, unit_price, min_price, max_price, includes, pyeong_min, pyeong_max, is_package) VALUES
('DEM-BATH-S', 'DEM-BATH', '욕실 전체 철거 (소형)', '1평', '개소', 400000, 350000, 450000, '타일+변기+세면대+샤워부스+폐기물', 10, 23, true),
('DEM-BATH-M', 'DEM-BATH', '욕실 전체 철거 (중형)', '1.5평', '개소', 500000, 450000, 550000, '타일+변기+세면대+샤워부스+폐기물', 24, 34, true),
('DEM-BATH-L', 'DEM-BATH', '욕실 전체 철거 (대형)', '2평+', '개소', 600000, 550000, 650000, '타일+변기+세면대+샤워부스+욕조+폐기물', 35, 59, true),
('DEM-BATH-XL', 'DEM-BATH', '욕실 전체 철거 (특대)', '3평+', '개소', 750000, 700000, 850000, '타일+변기+세면대+샤워부스+욕조+폐기물', 60, 999, true)
ON CONFLICT (item_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    item_name = EXCLUDED.item_name,
    item_size = EXCLUDED.item_size,
    unit = EXCLUDED.unit,
    unit_price = EXCLUDED.unit_price,
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price,
    includes = EXCLUDED.includes,
    pyeong_min = EXCLUDED.pyeong_min,
    pyeong_max = EXCLUDED.pyeong_max,
    is_package = EXCLUDED.is_package,
    updated_at = NOW();

-- ============================================================
-- 11. 데이터 입력: 주방 철거
-- ============================================================

INSERT INTO demolition_items (item_id, category_id, item_name, item_size, unit, unit_price, min_price, max_price, includes, pyeong_min, pyeong_max, is_package) VALUES
('DEM-KITCHEN-S', 'DEM-KITCHEN', '주방 전체 철거 (소형)', 'I자 3~4m', '식', 450000, 400000, 500000, '상하부장+후드+수전+싱크볼+폐기물', 10, 23, true),
('DEM-KITCHEN-M', 'DEM-KITCHEN', '주방 전체 철거 (중형)', 'ㄱ자 5~6m', '식', 600000, 550000, 650000, '상하부장+후드+수전+싱크볼+폐기물', 24, 34, true),
('DEM-KITCHEN-L', 'DEM-KITCHEN', '주방 전체 철거 (대형)', 'ㄱ자 7m+', '식', 750000, 700000, 800000, '상하부장+후드+수전+싱크볼+키큰장/냉장고장+폐기물', 35, 49, true),
('DEM-KITCHEN-XL', 'DEM-KITCHEN', '주방 전체 철거 (특대)', 'ㄱ자+아일랜드', '식', 900000, 850000, 950000, '상하부장+후드+수전+싱크볼+아일랜드+키큰장/냉장고장+폐기물', 50, 79, true),
('DEM-KITCHEN-XXL', 'DEM-KITCHEN', '주방 전체 철거 (초대형)', 'ㄷ자+아일랜드', '식', 1200000, 1100000, 1400000, '상하부장+후드+수전+싱크볼+아일랜드+다용도실+폐기물', 80, 999, true)
ON CONFLICT (item_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    item_name = EXCLUDED.item_name,
    item_size = EXCLUDED.item_size,
    unit = EXCLUDED.unit,
    unit_price = EXCLUDED.unit_price,
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price,
    includes = EXCLUDED.includes,
    pyeong_min = EXCLUDED.pyeong_min,
    pyeong_max = EXCLUDED.pyeong_max,
    is_package = EXCLUDED.is_package,
    updated_at = NOW();

-- ============================================================
-- 12. 데이터 입력: 바닥재 철거 (단가 + 패키지)
-- ============================================================

INSERT INTO demolition_items (item_id, category_id, item_name, item_size, unit, unit_price, min_price, max_price, includes, pyeong_min, pyeong_max, is_package) VALUES
-- 단가 항목
('DEM-FLOOR-JANGPAN', 'DEM-FLOOR', '장판 철거', '-', '평', 5000, 0, 5000, '철거+폐기물 (도배 시공 시 무료)', NULL, NULL, false),
('DEM-FLOOR-GANGMARU', 'DEM-FLOOR', '강마루/강화마루 철거', '-', '평', 25000, 23000, 28000, '철거+샌딩+폐기물', NULL, NULL, false),
('DEM-FLOOR-ONDOL', 'DEM-FLOOR', '온돌마루/원목마루 철거', '-', '평', 30000, 28000, 33000, '철거+샌딩+폐기물', NULL, NULL, false),
('DEM-FLOOR-TILE', 'DEM-FLOOR', '타일 바닥 철거', '-', '평', 35000, 30000, 40000, '철거+폐기물', NULL, NULL, false),
('DEM-FLOOR-DECO', 'DEM-FLOOR', '데코타일 철거', '-', '평', 20000, 18000, 23000, '철거+샌딩+폐기물', NULL, NULL, false),
-- 패키지 (아파트)
('DEM-FLOOR-PKG-20', 'DEM-FLOOR', '바닥재 철거 패키지 (20평)', '실면적 16평', '식', 400000, 370000, 450000, '강마루 기준', 18, 23, true),
('DEM-FLOOR-PKG-25', 'DEM-FLOOR', '바닥재 철거 패키지 (25평)', '실면적 20평', '식', 500000, 460000, 560000, '강마루 기준', 24, 29, true),
('DEM-FLOOR-PKG-30', 'DEM-FLOOR', '바닥재 철거 패키지 (30평)', '실면적 24평', '식', 600000, 550000, 670000, '강마루 기준', 30, 34, true),
('DEM-FLOOR-PKG-40', 'DEM-FLOOR', '바닥재 철거 패키지 (40평)', '실면적 32평', '식', 800000, 740000, 900000, '강마루 기준', 35, 44, true),
('DEM-FLOOR-PKG-50', 'DEM-FLOOR', '바닥재 철거 패키지 (50평)', '실면적 40평', '식', 1000000, 920000, 1100000, '강마루 기준', 45, 54, true),
('DEM-FLOOR-PKG-60', 'DEM-FLOOR', '바닥재 철거 패키지 (60평)', '실면적 48평', '식', 1150000, 1050000, 1250000, '강마루 기준', 55, 64, true),
('DEM-FLOOR-PKG-80', 'DEM-FLOOR', '바닥재 철거 패키지 (80평)', '실면적 64평', '식', 1450000, 1350000, 1600000, '강마루 기준', 65, 89, true),
('DEM-FLOOR-PKG-100', 'DEM-FLOOR', '바닥재 철거 패키지 (100평)', '실면적 80평', '식', 1800000, 1650000, 2000000, '강마루 기준', 90, 119, true),
('DEM-FLOOR-PKG-150', 'DEM-FLOOR', '바닥재 철거 패키지 (150평)', '실면적 120평', '식', 2600000, 2400000, 2900000, '강마루 기준', 120, 169, true),
('DEM-FLOOR-PKG-200', 'DEM-FLOOR', '바닥재 철거 패키지 (200평)', '실면적 160평', '식', 3400000, 3100000, 3800000, '강마루 기준', 170, 999, true)
ON CONFLICT (item_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    item_name = EXCLUDED.item_name,
    item_size = EXCLUDED.item_size,
    unit = EXCLUDED.unit,
    unit_price = EXCLUDED.unit_price,
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price,
    includes = EXCLUDED.includes,
    pyeong_min = EXCLUDED.pyeong_min,
    pyeong_max = EXCLUDED.pyeong_max,
    is_package = EXCLUDED.is_package,
    updated_at = NOW();

-- ============================================================
-- 13. 데이터 입력: 천장 철거 (단가 + 패키지)
-- ============================================================

INSERT INTO demolition_items (item_id, category_id, item_name, item_size, unit, unit_price, min_price, max_price, includes, pyeong_min, pyeong_max, is_package) VALUES
-- 단가 항목
('DEM-CEIL-TEX', 'DEM-CEILING', '텍스 철거', '-', '평', 25000, 22000, 28000, '철거+폐기물', NULL, NULL, false),
('DEM-CEIL-GYPS1', 'DEM-CEILING', '석고보드 1겹 철거', '-', '평', 30000, 27000, 33000, '철거+폐기물', NULL, NULL, false),
('DEM-CEIL-GYPS2', 'DEM-CEILING', '석고보드 2겹 철거', '-', '평', 35000, 32000, 38000, '철거+폐기물', NULL, NULL, false),
('DEM-CEIL-WELL', 'DEM-CEILING', '우물천장 철거', '-', '개소', 100000, 80000, 120000, '거실 등박스 등', NULL, NULL, false),
-- 패키지
('DEM-CEIL-PKG-20', 'DEM-CEILING', '천장 철거 패키지 (20평)', '15평', '식', 450000, 400000, 500000, '석고1겹 기준', 18, 23, true),
('DEM-CEIL-PKG-25', 'DEM-CEILING', '천장 철거 패키지 (25평)', '18평', '식', 550000, 490000, 600000, '석고1겹 기준', 24, 29, true),
('DEM-CEIL-PKG-30', 'DEM-CEILING', '천장 철거 패키지 (30평)', '22평', '식', 650000, 590000, 720000, '석고1겹 기준', 30, 34, true),
('DEM-CEIL-PKG-40', 'DEM-CEILING', '천장 철거 패키지 (40평)', '30평', '식', 900000, 810000, 990000, '석고1겹 기준', 35, 44, true),
('DEM-CEIL-PKG-50', 'DEM-CEILING', '천장 철거 패키지 (50평)', '38평', '식', 1100000, 1000000, 1250000, '석고1겹 기준', 45, 54, true),
('DEM-CEIL-PKG-60', 'DEM-CEILING', '천장 철거 패키지 (60평)', '46평', '식', 1300000, 1150000, 1450000, '석고1겹 기준', 55, 64, true),
('DEM-CEIL-PKG-80', 'DEM-CEILING', '천장 철거 패키지 (80평)', '60평', '식', 1650000, 1500000, 1850000, '석고1겹 기준', 65, 89, true),
('DEM-CEIL-PKG-100', 'DEM-CEILING', '천장 철거 패키지 (100평)', '75평', '식', 2000000, 1800000, 2250000, '석고1겹 기준', 90, 119, true),
('DEM-CEIL-PKG-150', 'DEM-CEILING', '천장 철거 패키지 (150평)', '115평', '식', 2900000, 2600000, 3300000, '석고1겹 기준', 120, 169, true),
('DEM-CEIL-PKG-200', 'DEM-CEILING', '천장 철거 패키지 (200평)', '150평', '식', 3750000, 3400000, 4200000, '석고1겹 기준', 170, 999, true)
ON CONFLICT (item_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    item_name = EXCLUDED.item_name,
    item_size = EXCLUDED.item_size,
    unit = EXCLUDED.unit,
    unit_price = EXCLUDED.unit_price,
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price,
    includes = EXCLUDED.includes,
    pyeong_min = EXCLUDED.pyeong_min,
    pyeong_max = EXCLUDED.pyeong_max,
    is_package = EXCLUDED.is_package,
    updated_at = NOW();

-- ============================================================
-- 14. 데이터 입력: 가구 철거
-- ============================================================

INSERT INTO demolition_items (item_id, category_id, item_name, item_size, unit, unit_price, min_price, max_price, includes, pyeong_min, pyeong_max, is_package) VALUES
('DEM-CLOSET-1', 'DEM-FURNITURE', '붙박이장 철거 (1칸/문1개)', '-', '개소', 80000, 70000, 90000, '철거+폐기물', NULL, NULL, false),
('DEM-CLOSET-2', 'DEM-FURNITURE', '붙박이장 철거 (2칸/문2개)', '-', '개소', 120000, 100000, 140000, '철거+폐기물', NULL, NULL, false),
('DEM-CLOSET-3', 'DEM-FURNITURE', '붙박이장 철거 (3칸/문3개)', '-', '개소', 150000, 130000, 170000, '철거+폐기물', NULL, NULL, false),
('DEM-CLOSET-4', 'DEM-FURNITURE', '붙박이장 철거 (4칸/문4개)', '-', '개소', 180000, 160000, 200000, '철거+폐기물', NULL, NULL, false),
('DEM-DRESS-S', 'DEM-FURNITURE', '드레스룸 철거 (소형)', '2평 이하', '식', 250000, 220000, 280000, '시스템장 전체+폐기물', NULL, NULL, false),
('DEM-DRESS-L', 'DEM-FURNITURE', '드레스룸 철거 (대형)', '3평 이상', '식', 400000, 350000, 450000, '시스템장 전체+폐기물', NULL, NULL, false),
('DEM-SHOE-S', 'DEM-FURNITURE', '신발장 철거 (일반)', '-', '개소', 70000, 60000, 80000, '철거+폐기물', NULL, NULL, false),
('DEM-SHOE-L', 'DEM-FURNITURE', '신발장 철거 (대형/키큰)', '-', '개소', 100000, 90000, 120000, '철거+폐기물', NULL, NULL, false),
('DEM-TV', 'DEM-FURNITURE', '거실장/TV장 철거', '-', '개소', 100000, 80000, 120000, '철거+폐기물', NULL, NULL, false),
('DEM-DESK', 'DEM-FURNITURE', '붙박이 책상/서재 철거', '-', '개소', 150000, 120000, 180000, '철거+폐기물', NULL, NULL, false)
ON CONFLICT (item_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    item_name = EXCLUDED.item_name,
    item_size = EXCLUDED.item_size,
    unit = EXCLUDED.unit,
    unit_price = EXCLUDED.unit_price,
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price,
    includes = EXCLUDED.includes,
    pyeong_min = EXCLUDED.pyeong_min,
    pyeong_max = EXCLUDED.pyeong_max,
    is_package = EXCLUDED.is_package,
    updated_at = NOW();

-- ============================================================
-- 15. 데이터 입력: 문/창호 철거
-- ============================================================

INSERT INTO demolition_items (item_id, category_id, item_name, item_size, unit, unit_price, min_price, max_price, includes, pyeong_min, pyeong_max, is_package) VALUES
('DEM-DOOR-LEAF', 'DEM-DOOR', '방문 철거 (문짝만)', '-', '개', 30000, 25000, 35000, '철거+폐기물', NULL, NULL, false),
('DEM-DOOR-FRAME', 'DEM-DOOR', '방문 철거 (문틀 포함)', '-', '개', 50000, 45000, 55000, '철거+폐기물+마감', NULL, NULL, false),
('DEM-DOOR-MID', 'DEM-DOOR', '현관 중문 철거', '-', '개', 70000, 60000, 80000, '철거+폐기물', NULL, NULL, false),
('DEM-DOOR-MAIN', 'DEM-DOOR', '현관문 철거', '-', '개', 150000, 120000, 180000, '철거+폐기물', NULL, NULL, false),
('DEM-SASH-S', 'DEM-DOOR', '샷시 철거 (소형/방)', '-', '개소', 100000, 80000, 120000, '철거+폐기물', NULL, NULL, false),
('DEM-SASH-L', 'DEM-DOOR', '샷시 철거 (대형/거실)', '-', '개소', 150000, 130000, 180000, '철거+폐기물', NULL, NULL, false),
('DEM-SASH-BAL', 'DEM-DOOR', '발코니 샷시 철거 (확장용)', '-', '개소', 200000, 180000, 230000, '철거+폐기물', NULL, NULL, false),
('DEM-SASH-FULL', 'DEM-DOOR', '전면 유리벽 철거', '-', '개소', 350000, 300000, 400000, '철거+폐기물 (상가용)', NULL, NULL, false)
ON CONFLICT (item_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    item_name = EXCLUDED.item_name,
    item_size = EXCLUDED.item_size,
    unit = EXCLUDED.unit,
    unit_price = EXCLUDED.unit_price,
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price,
    includes = EXCLUDED.includes,
    pyeong_min = EXCLUDED.pyeong_min,
    pyeong_max = EXCLUDED.pyeong_max,
    is_package = EXCLUDED.is_package,
    updated_at = NOW();

-- ============================================================
-- 16. 데이터 입력: 벽체/기타 철거
-- ============================================================

INSERT INTO demolition_items (item_id, category_id, item_name, item_size, unit, unit_price, min_price, max_price, includes, pyeong_min, pyeong_max, is_package) VALUES
('DEM-WALL-GYPS', 'DEM-WALL', '가벽 철거 (석고보드)', '-', '㎡', 20000, 18000, 25000, '철거+폐기물', NULL, NULL, false),
('DEM-WALL-BLOCK', 'DEM-WALL', '조적벽 철거 (비내력)', '-', '㎡', 35000, 30000, 40000, '철거+폐기물', NULL, NULL, false),
('DEM-ARTWALL-W', 'DEM-WALL', '아트월 철거 (목재)', '-', '개소', 100000, 80000, 120000, '철거+폐기물', NULL, NULL, false),
('DEM-ARTWALL-T', 'DEM-WALL', '아트월 철거 (타일/석재)', '-', '개소', 200000, 180000, 250000, '철거+폐기물', NULL, NULL, false),
('DEM-LIGHTBOX', 'DEM-WALL', '등박스 철거', '-', '개소', 70000, 60000, 80000, '철거+폐기물', NULL, NULL, false),
('DEM-MOLD', 'DEM-WALL', '몰딩/걸레받이 철거', '-', 'm', 2000, 1500, 2500, '철거+폐기물', NULL, NULL, false),
('DEM-ENT-TILE', 'DEM-WALL', '현관 타일 철거', '1~2평', '개소', 50000, 40000, 60000, '철거+폐기물', NULL, NULL, false),
('DEM-COUNTER', 'DEM-WALL', '카운터/바 철거', '-', '개소', 200000, 150000, 250000, '철거+폐기물 (상가용)', NULL, NULL, false)
ON CONFLICT (item_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    item_name = EXCLUDED.item_name,
    item_size = EXCLUDED.item_size,
    unit = EXCLUDED.unit,
    unit_price = EXCLUDED.unit_price,
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price,
    includes = EXCLUDED.includes,
    pyeong_min = EXCLUDED.pyeong_min,
    pyeong_max = EXCLUDED.pyeong_max,
    is_package = EXCLUDED.is_package,
    updated_at = NOW();

-- ============================================================
-- 17. 데이터 입력: 보양
-- ============================================================

INSERT INTO demolition_protection (protection_id, protection_name, base_price, additional_unit, additional_price, description) VALUES
('PROT-ELEV', '엘리베이터 보양', 150000, NULL, NULL, '3면+바닥+문틀, 공사기간 유지'),
('PROT-HALL', '복도/계단 보양', 100000, '장', 5000, '기본 10만원 + 플로베니아 장당 5천원 추가'),
('PROT-STAIR', '계단 보양 (저층/엘베없음)', 200000, '층', 30000, '기본 20만원 + 층당 3만원 추가'),
('PROT-LOBBY', '로비/공용부 보양', 150000, NULL, NULL, '상가/오피스용')
ON CONFLICT (protection_id) DO UPDATE SET
    protection_name = EXCLUDED.protection_name,
    base_price = EXCLUDED.base_price,
    additional_unit = EXCLUDED.additional_unit,
    additional_price = EXCLUDED.additional_price,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================
-- 18. 데이터 입력: 추가 옵션
-- ============================================================

INSERT INTO demolition_options (option_id, category_id, option_name, unit, unit_price, condition_desc) VALUES
('OPT-BATH-TUB', 'DEM-BATH', '욕조 철거', '개', 100000, '욕조 있는 욕실'),
('OPT-BATH-SEP', 'DEM-BATH', '건식/습식 분리형', '개소', 100000, '분리형 욕실'),
('OPT-BATH-ADD', 'DEM-BATH', '욕실 추가 (2개소 이상)', '개소', 400000, '기본 1개소 초과 시'),
('OPT-KITCHEN-TILE', 'DEM-KITCHEN', '주방 벽타일 철거', '식', 150000, '타일 철거 필요 시'),
('OPT-KITCHEN-UTIL', 'DEM-KITCHEN', '다용도실 연결', '식', 100000, '다용도실 싱크대 포함 시'),
('OPT-ISLAND', 'DEM-KITCHEN', '아일랜드 별도', '개소', 150000, '32평 이하인데 아일랜드 있을 때'),
('OPT-BALCONY', 'DEM-WALL', '발코니 확장부 철거', '개소', 300000, '확장 공사 시'),
('OPT-DRESS', 'DEM-FURNITURE', '드레스룸', '식', 250000, '드레스룸 포함 시'),
('OPT-URGENT', 'DEM-PROTECT', '긴급 출장 (당일)', '식', 150000, '당일 긴급 시공'),
('OPT-NIGHT', 'DEM-PROTECT', '야간 작업', '식', 0, '야간 작업 시 30% 할증'),
('OPT-WEEKEND', 'DEM-PROTECT', '주말/공휴일', '식', 0, '주말 작업 시 20% 할증')
ON CONFLICT (option_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    option_name = EXCLUDED.option_name,
    unit = EXCLUDED.unit,
    unit_price = EXCLUDED.unit_price,
    condition_desc = EXCLUDED.condition_desc,
    updated_at = NOW();

-- ============================================================
-- 19. 데이터 입력: 전체 철거 패키지 (아파트)
-- 원가 기준: 평당 13만원 (철거 실행 단가)
-- ============================================================

INSERT INTO demolition_packages (package_id, pyeong, package_name, total_price, price_per_pyeong, includes, property_type) VALUES
-- 아파트 (최소 평당 13만원)
('PKG-APT-20', 20, '20평 전체 철거', 2600000, 130000, '바닥+천장+욕실1+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-25', 25, '25평 전체 철거', 3350000, 134000, '바닥+천장+욕실1+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-30', 30, '30평 전체 철거', 3950000, 132000, '바닥+천장+욕실1+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-34', 34, '34평 전체 철거', 4450000, 131000, '바닥+천장+욕실1+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-40', 40, '40평 전체 철거', 5200000, 130000, '바닥+천장+욕실1+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-43', 43, '43평 전체 철거', 5600000, 130000, '바닥+천장+욕실1+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-50', 50, '50평 전체 철거', 6500000, 130000, '바닥+천장+욕실1+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-60', 60, '60평 전체 철거', 7800000, 130000, '바닥+천장+욕실2+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-70', 70, '70평 전체 철거', 9100000, 130000, '바닥+천장+욕실2+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-80', 80, '80평 전체 철거', 10400000, 130000, '바닥+천장+욕실2+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-100', 100, '100평 전체 철거', 13000000, 130000, '바닥+천장+욕실3+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-120', 120, '120평 전체 철거', 15600000, 130000, '바닥+천장+욕실3+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-150', 150, '150평 전체 철거', 19500000, 130000, '바닥+천장+욕실4+주방+가구+문+보양+폐기물', 'apartment'),
('PKG-APT-200', 200, '200평 전체 철거', 26000000, 130000, '바닥+천장+욕실4+주방+가구+문+보양+폐기물', 'apartment'),
-- 상가/오피스 (최소 평당 15만원)
('PKG-COMM-20', 20, '20평 상가 철거', 3000000, 150000, '바닥+천장+벽체+설비+보양+폐기물', 'commercial'),
('PKG-COMM-30', 30, '30평 상가 철거', 4500000, 150000, '바닥+천장+벽체+설비+보양+폐기물', 'commercial'),
('PKG-COMM-50', 50, '50평 상가 철거', 7500000, 150000, '바닥+천장+벽체+설비+보양+폐기물', 'commercial'),
('PKG-COMM-80', 80, '80평 상가 철거', 12000000, 150000, '바닥+천장+벽체+설비+보양+폐기물', 'commercial'),
('PKG-COMM-100', 100, '100평 상가 철거', 15000000, 150000, '바닥+천장+벽체+설비+보양+폐기물', 'commercial'),
('PKG-COMM-150', 150, '150평 상가 철거', 22500000, 150000, '바닥+천장+벽체+설비+보양+폐기물', 'commercial'),
('PKG-COMM-200', 200, '200평 상가 철거', 30000000, 150000, '바닥+천장+벽체+설비+보양+폐기물', 'commercial')
ON CONFLICT (package_id) DO UPDATE SET
    pyeong = EXCLUDED.pyeong,
    package_name = EXCLUDED.package_name,
    total_price = EXCLUDED.total_price,
    price_per_pyeong = EXCLUDED.price_per_pyeong,
    includes = EXCLUDED.includes,
    property_type = EXCLUDED.property_type,
    updated_at = NOW();

-- ============================================================
-- 20. 데이터 입력: 계산 Config (Fallback용)
-- 원가 기준: 아파트 평당 13만원, 상가 평당 15만원
-- ============================================================

INSERT INTO demolition_config (config_id, config_name, pyeong_min, pyeong_max, price_per_pyeong, base_price, property_type, description) VALUES
-- 아파트 평당 단가 (최소 13만원)
('CFG-APT-SMALL', '아파트 소형', 10, 30, 135000, 0, 'apartment', '소형 아파트 평당 단가'),
('CFG-APT-MID', '아파트 중형', 31, 50, 130000, 0, 'apartment', '중형 아파트 평당 단가'),
('CFG-APT-LARGE', '아파트 대형', 51, 100, 130000, 0, 'apartment', '대형 아파트 평당 단가'),
('CFG-APT-XLARGE', '아파트 초대형', 101, 999, 130000, 0, 'apartment', '초대형 아파트 평당 단가'),
-- 상가 평당 단가 (최소 15만원)
('CFG-COMM-SMALL', '상가 소형', 10, 30, 150000, 0, 'commercial', '소형 상가 평당 단가'),
('CFG-COMM-MID', '상가 중형', 31, 50, 150000, 0, 'commercial', '중형 상가 평당 단가'),
('CFG-COMM-LARGE', '상가 대형', 51, 100, 150000, 0, 'commercial', '대형 상가 평당 단가'),
('CFG-COMM-XLARGE', '상가 초대형', 101, 999, 150000, 0, 'commercial', '초대형 상가 평당 단가'),
-- 바닥재 평당 단가
('CFG-FLOOR-GANG', '강마루 철거', NULL, NULL, 25000, 0, 'all', '강마루 평당 철거 단가'),
('CFG-FLOOR-TILE', '타일 철거', NULL, NULL, 35000, 0, 'all', '타일 평당 철거 단가'),
-- 천장 평당 단가
('CFG-CEIL-GYPS', '석고보드 철거', NULL, NULL, 30000, 0, 'all', '석고보드1겹 평당 철거 단가')
ON CONFLICT (config_id) DO UPDATE SET
    config_name = EXCLUDED.config_name,
    pyeong_min = EXCLUDED.pyeong_min,
    pyeong_max = EXCLUDED.pyeong_max,
    price_per_pyeong = EXCLUDED.price_per_pyeong,
    base_price = EXCLUDED.base_price,
    property_type = EXCLUDED.property_type,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================
-- 21. 데이터 입력: 폐기물 처리비 Config (신규 추가)
-- 1톤당 단가: 500,000원 (고객용)
-- ============================================================

INSERT INTO demolition_waste_config (pyeong, max_ton, price_per_ton, total_cost, description) VALUES
(20, 1.0, 500000, 500000, '20평 최대 폐기물 톤수'),
(25, 1.5, 500000, 750000, '25평 최대 폐기물 톤수'),
(30, 2.0, 500000, 1000000, '30평 최대 폐기물 톤수'),
(34, 2.2, 500000, 1100000, '34평 최대 폐기물 톤수'),
(40, 2.5, 500000, 1250000, '40평 최대 폐기물 톤수'),
(50, 3.0, 500000, 1500000, '50평 최대 폐기물 톤수'),
(60, 3.5, 500000, 1750000, '60평 최대 폐기물 톤수'),
(70, 4.0, 500000, 2000000, '70평 최대 폐기물 톤수'),
(80, 4.5, 500000, 2250000, '80평 최대 폐기물 톤수'),
(90, 5.0, 500000, 2500000, '90평 최대 폐기물 톤수'),
(100, 5.5, 500000, 2750000, '100평 최대 폐기물 톤수')
ON CONFLICT (pyeong) DO UPDATE SET
    max_ton = EXCLUDED.max_ton,
    price_per_ton = EXCLUDED.price_per_ton,
    total_cost = EXCLUDED.total_cost,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================
-- 22. 인덱스 생성
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_demolition_items_category ON demolition_items(category_id);
CREATE INDEX IF NOT EXISTS idx_demolition_items_package ON demolition_items(is_package);
CREATE INDEX IF NOT EXISTS idx_demolition_items_pyeong ON demolition_items(pyeong_min, pyeong_max);
CREATE INDEX IF NOT EXISTS idx_demolition_packages_pyeong ON demolition_packages(pyeong);
CREATE INDEX IF NOT EXISTS idx_demolition_packages_type ON demolition_packages(property_type);
CREATE INDEX IF NOT EXISTS idx_demolition_options_category ON demolition_options(category_id);
CREATE INDEX IF NOT EXISTS idx_demolition_config_pyeong ON demolition_config(pyeong_min, pyeong_max);
CREATE INDEX IF NOT EXISTS idx_demolition_config_type ON demolition_config(property_type);
CREATE INDEX IF NOT EXISTS idx_demolition_waste_config_pyeong ON demolition_waste_config(pyeong);

-- ============================================================
-- 23. updated_at 자동 업데이트 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성 (이미 있으면 교체)
DROP TRIGGER IF EXISTS update_demolition_categories_updated_at ON demolition_categories;
CREATE TRIGGER update_demolition_categories_updated_at 
    BEFORE UPDATE ON demolition_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demolition_items_updated_at ON demolition_items;
CREATE TRIGGER update_demolition_items_updated_at 
    BEFORE UPDATE ON demolition_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demolition_packages_updated_at ON demolition_packages;
CREATE TRIGGER update_demolition_packages_updated_at 
    BEFORE UPDATE ON demolition_packages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demolition_options_updated_at ON demolition_options;
CREATE TRIGGER update_demolition_options_updated_at 
    BEFORE UPDATE ON demolition_options 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demolition_protection_updated_at ON demolition_protection;
CREATE TRIGGER update_demolition_protection_updated_at 
    BEFORE UPDATE ON demolition_protection 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demolition_config_updated_at ON demolition_config;
CREATE TRIGGER update_demolition_config_updated_at 
    BEFORE UPDATE ON demolition_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demolition_waste_config_updated_at ON demolition_waste_config;
CREATE TRIGGER update_demolition_waste_config_updated_at 
    BEFORE UPDATE ON demolition_waste_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 24. 데이터 확인 쿼리
-- ============================================================

-- 테이블별 데이터 개수 확인
SELECT 'demolition_categories' as table_name, COUNT(*) as count FROM demolition_categories
UNION ALL
SELECT 'demolition_items', COUNT(*) FROM demolition_items
UNION ALL
SELECT 'demolition_packages', COUNT(*) FROM demolition_packages
UNION ALL
SELECT 'demolition_options', COUNT(*) FROM demolition_options
UNION ALL
SELECT 'demolition_protection', COUNT(*) FROM demolition_protection
UNION ALL
SELECT 'demolition_config', COUNT(*) FROM demolition_config
UNION ALL
SELECT 'demolition_waste_config', COUNT(*) FROM demolition_waste_config;

-- 패키지 확인 (25평 예시)
SELECT * FROM demolition_packages WHERE pyeong = 25 AND property_type = 'apartment';

-- 욕실 항목 확인 (25평 예시)
SELECT * FROM demolition_items 
WHERE category_id = 'DEM-BATH' 
  AND is_package = true 
  AND pyeong_min <= 25 
  AND pyeong_max >= 25;

-- 폐기물 Config 확인 (25평 예시)
SELECT * FROM demolition_waste_config WHERE pyeong = 25;

-- ============================================================
-- 완료
-- ============================================================












