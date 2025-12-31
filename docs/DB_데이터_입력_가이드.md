# DB 데이터 입력 가이드

> **작성일**: 2025-12-31  
> **목적**: 견적 생성에 필요한 필수 DB 데이터 입력 방법 안내

---

## 📋 개요

인테리봇 견적 시스템이 정상 작동하려면 다음 필수 데이터가 Supabase DB에 입력되어 있어야 합니다:

1. **자재 데이터** (materials 테이블)
   - 바닥/마루
   - 욕실/욕실세트
   - 주방/시스템주방

2. **노무 생산성 데이터** (labor_productivity 테이블)
   - finish (바닥 마감)
   - bathroom (욕실)
   - kitchen (주방)

3. **노무비 데이터** (labor_costs 테이블)
   - finish
   - bathroom
   - kitchen

---

## 🚀 빠른 시작

### 방법 1: SQL 스크립트 실행 (권장)

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **스크립트 실행**
   - `scripts/insert-required-db-data.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **검증**
   ```bash
   npm run validate-required-costs
   ```

---

## 📝 수동 입력 방법

### 1. 자재 데이터 입력

#### 바닥/마루

```sql
INSERT INTO materials (
  material_code,
  product_name,
  category_1,
  category_2,
  grade,
  is_active,
  price_argen,
  is_argen_standard,
  unit,
  brand_argen
) VALUES (
  'FLOOR-ARGEN-E-001',
  '바닥 마루 ARGEN E (라미네이트)',
  '바닥',
  '마루',
  'ARGEN_E',
  true,
  50000,
  true,
  'm2',
  '아르젠 표준'
);
```

#### 욕실/욕실세트

```sql
INSERT INTO materials (
  material_code,
  product_name,
  category_1,
  category_2,
  grade,
  is_active,
  price_argen,
  is_argen_standard,
  unit,
  brand_argen
) VALUES (
  'BATH-ARGEN-E-001',
  '욕실세트 ARGEN E (세면대+변기+욕조)',
  '욕실',
  '욕실세트',
  'ARGEN_E',
  true,
  2000000,
  true,
  'SET',
  '아르젠 표준'
);
```

#### 주방/시스템주방

```sql
INSERT INTO materials (
  material_code,
  product_name,
  category_1,
  category_2,
  grade,
  is_active,
  price_argen,
  is_argen_standard,
  unit,
  brand_argen
) VALUES (
  'KIT-ARGEN-E-001',
  '시스템주방 ARGEN E (하부장+상부장+상판)',
  '주방',
  '시스템주방',
  'ARGEN_E',
  true,
  3000000,
  true,
  'SET',
  '아르젠 표준'
);
```

---

### 2. 노무 생산성 데이터 입력

```sql
-- 바닥(마감)
INSERT INTO labor_productivity (
  phase_id,
  labor_unit,
  daily_output,
  crew_size,
  base_difficulty,
  is_active
) VALUES (
  'finish',
  'm2',
  40.0,
  2,
  1.0,
  true
);

-- 욕실
INSERT INTO labor_productivity (
  phase_id,
  labor_unit,
  daily_output,
  crew_size,
  base_difficulty,
  is_active
) VALUES (
  'bathroom',
  'SET',
  0.7,
  2,
  1.0,
  true
);

-- 주방
INSERT INTO labor_productivity (
  phase_id,
  labor_unit,
  daily_output,
  crew_size,
  base_difficulty,
  is_active
) VALUES (
  'kitchen',
  'SET',
  0.5,
  2,
  1.0,
  true
);
```

---

### 3. 노무비 데이터 입력

```sql
-- 바닥(마감)
INSERT INTO labor_costs (
  phase_id,
  daily_rate,
  is_current,
  is_active
) VALUES (
  'finish',
  300000,
  true,
  true
);

-- 욕실
INSERT INTO labor_costs (
  phase_id,
  daily_rate,
  is_current,
  is_active
) VALUES (
  'bathroom',
  350000,
  true,
  true
);

-- 주방
INSERT INTO labor_costs (
  phase_id,
  daily_rate,
  is_current,
  is_active
) VALUES (
  'kitchen',
  350000,
  true,
  true
);
```

---

## ✅ 검증 방법

### 자동 검증 스크립트

```bash
npm run validate-required-costs
```

또는:

```bash
npx tsx scripts/validate-required-costs.ts
```

### 수동 확인 쿼리

```sql
-- 자재 확인
SELECT 
  category_1,
  category_2,
  COUNT(*) as count,
  STRING_AGG(material_code, ', ') as codes
FROM materials
WHERE (category_1 = '바닥' AND category_2 = '마루')
   OR (category_1 = '욕실' AND category_2 = '욕실세트')
   OR (category_1 = '주방' AND category_2 = '시스템주방')
  AND is_active = true
GROUP BY category_1, category_2;

-- 노무 생산성 확인
SELECT 
  phase_id,
  labor_unit,
  daily_output,
  crew_size
FROM labor_productivity
WHERE phase_id IN ('finish', 'bathroom', 'kitchen')
  AND is_active = true;

-- 노무비 확인
SELECT 
  phase_id,
  daily_rate,
  is_current
FROM labor_costs
WHERE phase_id IN ('finish', 'bathroom', 'kitchen')
  AND is_active = true
  AND is_current = true;
```

---

## ⚠️ 주의사항

1. **필수 필드**
   - `is_active = true` 필수
   - `is_argen_standard = true` (자재)
   - `is_current = true` (노무비)
   - 가격은 반드시 0보다 큰 값

2. **등급**
   - 자재는 `ARGEN_E` 또는 `ARGEN_S` 등급 중 하나 이상 필요
   - `grade` 컬럼에 정확히 입력

3. **단위**
   - 바닥: `m2`
   - 욕실/주방: `SET`

4. **중복 방지**
   - `material_code`는 UNIQUE 제약조건
   - `phase_id`는 UNIQUE 제약조건 (노무 테이블)
   - ON CONFLICT 절 사용 권장

---

## 🔧 문제 해결

### 문제: "견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다"

**원인**:
- 자재 데이터 없음
- 노무 데이터 없음
- 가격이 0원 또는 NULL
- `is_active = false`

**해결**:
1. 검증 스크립트 실행하여 누락된 데이터 확인
2. 위 SQL 스크립트로 데이터 입력
3. 다시 검증 스크립트 실행

---

## 📚 참고 문서

- `docs/PHASE1_REQUIRED_DB_MINIMUM_PACKAGE.md` - 필수 DB 최소 패키지 정의
- `scripts/validate-required-costs.ts` - 검증 스크립트
- `scripts/insert-required-db-data.sql` - 데이터 입력 SQL

---

**작성 완료** ✅
