-- ============================================================
-- 인테리봇 필수 참조 테이블 생성
-- 작성일: 2025년 12월 12일
-- 목적: personality_materials가 참조하는 필수 테이블 생성
-- ============================================================

-- ============================================================
-- 1. materials 테이블 (자재 마스터)
-- ============================================================

-- materials 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS materials (
  material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_code VARCHAR(20) UNIQUE NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  grade VARCHAR(20), -- 'basic', 'standard', 'argen', 'premium'
  argen_made BOOLEAN DEFAULT false,
  category VARCHAR(50), -- 'tile', 'floor', 'wall', 'ceiling', 'door', 'window', etc.
  unit VARCHAR(10), -- 'm2', 'ea', 'box', etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(material_code);
CREATE INDEX IF NOT EXISTS idx_materials_grade ON materials(grade);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);

-- 샘플 데이터 (타일 예시)
INSERT INTO materials (material_code, product_name, grade, category, unit, argen_made) VALUES
('TILE_PORC_600', '포세린 타일 600x600', 'basic', 'tile', 'm2', false),
('TILE_PORC_800', '포세린 타일 800x800', 'standard', 'tile', 'm2', false),
('TILE_PORC_1000', '포세린 타일 1000x1000', 'argen', 'tile', 'm2', true),
('TILE_PORC_1200', '포세린 타일 1200x1200', 'premium', 'tile', 'm2', true)
ON CONFLICT (material_code) DO NOTHING;

-- ============================================================
-- 2. construction_phases 테이블 (공정 마스터)
-- ============================================================

-- construction_phases 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS construction_phases (
  phase_id VARCHAR(10) PRIMARY KEY,
  phase_name VARCHAR(100) NOT NULL,
  phase_category VARCHAR(50), -- 'demolition', 'structure', 'finish', 'equipment', etc.
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_phases_category ON construction_phases(phase_category);
CREATE INDEX IF NOT EXISTS idx_phases_active ON construction_phases(is_active);
CREATE INDEX IF NOT EXISTS idx_phases_order ON construction_phases(display_order);

-- 샘플 데이터 (인테리봇 공정 코드)
INSERT INTO construction_phases (phase_id, phase_name, phase_category, display_order) VALUES
('TILE', '타일 공사', 'finish', 1),
('FLOOR', '바닥 공사', 'finish', 2),
('WALL', '벽 공사', 'finish', 3),
('CEILING', '천장 공사', 'finish', 4),
('DOOR', '문 공사', 'equipment', 5),
('WINDOW', '창호 공사', 'equipment', 6),
('KITCHEN', '주방 공사', 'equipment', 7),
('BATHROOM', '욕실 공사', 'equipment', 8),
('LIGHTING', '조명 공사', 'equipment', 9),
('STORAGE', '수납 공사', 'equipment', 10)
ON CONFLICT (phase_id) DO NOTHING;

-- ============================================================
-- 3. materials_pricing 테이블 확인 (이미 있을 수 있음)
-- ============================================================

-- materials_pricing 테이블이 없으면 생성 (타일 가격 조회용)
CREATE TABLE IF NOT EXISTS materials_pricing (
  pricing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_code VARCHAR(20) REFERENCES materials(material_code),
  grade VARCHAR(20) NOT NULL, -- 'basic', 'standard', 'argen', 'premium'
  price_min INT NOT NULL,
  price_max INT NOT NULL,
  unit VARCHAR(10) DEFAULT 'm2',
  region VARCHAR(50), -- 'seoul', 'gyeonggi', etc.
  is_current BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_pricing_material ON materials_pricing(material_code);
CREATE INDEX IF NOT EXISTS idx_pricing_grade ON materials_pricing(grade);
CREATE INDEX IF NOT EXISTS idx_pricing_current ON materials_pricing(is_current);
CREATE INDEX IF NOT EXISTS idx_pricing_grade_current ON materials_pricing(grade, is_current);

-- ============================================================
-- 4. 주석 추가
-- ============================================================

COMMENT ON TABLE materials IS '자재 마스터 테이블';
COMMENT ON TABLE construction_phases IS '공정 마스터 테이블';
COMMENT ON TABLE materials_pricing IS '자재 가격 테이블';
























