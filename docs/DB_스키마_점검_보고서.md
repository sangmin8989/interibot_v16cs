# DB 스키마 점검 보고서

## 📋 개요

**작성일**: 2024년 12월  
**목적**: 헌법 v1 견적 시스템에 필요한 DB 테이블 점검  
**상태**: 점검 완료

---

## 🔍 필수 테이블 목록

### 1. 자재 관련 테이블

| 테이블명 | 용도 | 필수 컬럼 |
|----------|------|-----------|
| `materials` | 자재 정보 | `is_active`, `category_1`, `category_2`, `category_3`, `is_argen_standard`, `brand_argen`, `price`, `argen_priority` |
| `materials_pricing` | 자재 가격 | `grade`, `is_current`, `price_min`, `price_max` |

### 2. 노무비 관련 테이블 (헌법 v1 필수)

| 테이블명 | 용도 | 필수 컬럼 |
|----------|------|-----------|
| `labor_productivity` | 노무 생산성 | `process_id`, `is_active`, `labor_unit`, `daily_output`, `crew_size` |
| `labor_costs` | 노무 단가 | `process_id`, `is_active`, `rate_per_person_day` |
| `labor_difficulty_rules` | 난이도 규칙 | `process_id`, `difficulty_basis`, `difficulty_factor` |

### 3. 철거 관련 테이블

| 테이블명 | 용도 | 필수 컬럼 |
|----------|------|-----------|
| `demolition_packages` | 철거 패키지 | `pyeong`, `package_name`, `total_price`, `property_type` |
| `demolition_items` | 철거 항목 | `category_id`, `item_name`, `unit_price` |
| `demolition_waste_config` | 폐기물 설정 | `pyeong`, `max_ton`, `price_per_ton`, `total_cost` |
| `demolition_protection` | 보양 설정 | `protection_name`, `base_price` |

### 4. 성향 분석 테이블

| 테이블명 | 용도 | 필수 컬럼 |
|----------|------|-----------|
| `personality_traits` | 성향 특성 | 성향 코드, 이름 |
| `personality_materials` | 성향-자재 매핑 | 성향-자재 관계 |
| `answer_score_mapping` | 답변 점수 | 답변-점수 관계 |

---

## 🎯 materials 테이블 필수 컬럼

헌법 v1에서 요구하는 `materials` 테이블 구조:

```sql
-- 필수 컬럼
material_id         UUID PRIMARY KEY
material_code       VARCHAR
product_name        VARCHAR NOT NULL
category_1          VARCHAR NOT NULL  -- 대분류 (벽면, 바닥, 주방 등)
category_2          VARCHAR NOT NULL  -- 중분류 (도배, 마루, 시스템주방 등)
category_3          VARCHAR           -- 소분류 (선택)
spec                VARCHAR           -- 규격
unit                VARCHAR           -- 단위
is_active           BOOLEAN DEFAULT true
is_argen_standard   BOOLEAN DEFAULT false  -- ✅ 헌법 3-2: 아르젠 기준 여부
brand_argen         VARCHAR           -- ✅ 아르젠 브랜드
price               INTEGER           -- 가격 (또는 price_argen)
argen_priority      INTEGER           -- ✅ 아르젠 우선순위 (낮을수록 우선)
```

---

## 🎯 labor_productivity 테이블 구조

```sql
labor_id            UUID PRIMARY KEY
process_id          VARCHAR NOT NULL  -- 공정 ID (kitchen, bathroom, finish 등)
labor_unit          VARCHAR NOT NULL  -- 노무 단위 (㎡, EA, SET, 일)
daily_output        NUMERIC NOT NULL  -- 1일 작업량
crew_size           INTEGER NOT NULL  -- 기본 투입 인원
output_factor_by_difficulty NUMERIC   -- 난이도별 작업량 계수
is_active           BOOLEAN DEFAULT true
```

---

## 🎯 labor_costs 테이블 구조

```sql
labor_id            UUID PRIMARY KEY
process_id          VARCHAR NOT NULL  -- 공정 ID
rate_per_person_day INTEGER NOT NULL  -- 1인 1일 노무 단가 (원)
is_active           BOOLEAN DEFAULT true
```

---

## 🎯 labor_difficulty_rules 테이블 구조

```sql
rule_id             UUID PRIMARY KEY
process_id          VARCHAR NOT NULL  -- 공정 ID
difficulty_basis    VARCHAR NOT NULL  -- 난이도 기준 (brand, material_type 등)
difficulty_factor   NUMERIC NOT NULL  -- 난이도 계수 (1.0 = 기본, 1.2 = 20% 증가)
is_active           BOOLEAN DEFAULT true
```

---

## ✅ 테스트 방법

브라우저에서 아래 URL 접속:

```
http://localhost:3000/api/test-db-tables
```

결과 예시:
```json
{
  "timestamp": "2024-12-15T...",
  "tables": {
    "materials": { "exists": true, "rowCount": 156 },
    "labor_costs": { "exists": true, "rowCount": 11 },
    "labor_productivity": { "exists": true, "rowCount": 11 },
    ...
  },
  "summary": {
    "totalTables": 15,
    "existingTables": 15,
    "missingTables": 0,
    "status": "COMPLETE"
  }
}
```

---

## 🔴 누락 시 해결 방법

### 테이블이 없을 경우

Supabase에서 SQL 에디터로 테이블 생성:

```sql
-- 예: labor_productivity 테이블 생성
CREATE TABLE IF NOT EXISTS labor_productivity (
  labor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id VARCHAR NOT NULL,
  labor_unit VARCHAR NOT NULL,
  daily_output NUMERIC NOT NULL,
  crew_size INTEGER NOT NULL DEFAULT 1,
  output_factor_by_difficulty NUMERIC DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
```

### 데이터가 부족할 경우

공정별 기본 데이터 삽입 필요:

```sql
-- 예: 마감 공정 노무 생산성
INSERT INTO labor_productivity (process_id, labor_unit, daily_output, crew_size)
VALUES ('finish', '㎡', 50, 2);

-- 예: 마감 공정 노무 단가
INSERT INTO labor_costs (process_id, rate_per_person_day)
VALUES ('finish', 250000);
```

---

## 📌 버전

V1.0 (DB 스키마 점검용)










