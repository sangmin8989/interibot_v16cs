# Phase 1: 필수 DB 최소 패키지 정의

> **작성 일시**: 2025-01-21  
> **목적**: 정상 케이스에서만 견적 가능하도록 필수 DB 최소 패키지 정의

---

## 📋 범위 고정 (3종만)

### 1. 바닥(마감) - `finish`

**자재 최소 요구사항**:
- `category_1 = '바닥'`
- `category_2 = '마루'`
- 등급: `ARGEN_E` 또는 `ARGEN_S` 중 택1
- `is_active = true`
- `price > 0` 또는 `price_argen > 0`

**노무 최소 요구사항**:
- `labor_productivity`: `phase_id = 'finish'`, `is_active = true`
- `labor_costs`: `phase_id = 'finish'`, `is_active = true`, `rate_per_person_day > 0`

---

### 2. 욕실 - `bathroom`

**자재 최소 요구사항**:
- `category_1 = '욕실'`
- `category_2 = '욕실세트'`
- 등급: `ARGEN_E` 또는 `ARGEN_S` 중 택1
- `is_active = true`
- `price > 0` 또는 `price_argen > 0`

**노무 최소 요구사항**:
- `labor_productivity`: `phase_id = 'bathroom'`, `is_active = true`
- `labor_costs`: `phase_id = 'bathroom'`, `is_active = true`, `rate_per_person_day > 0`

---

### 3. 주방 - `kitchen`

**자재 최소 요구사항**:
- `category_1 = '주방'`
- `category_2 = '시스템주방'`
- 등급: `ARGEN_E` 또는 `ARGEN_S` 중 택1
- `is_active = true`
- `price > 0` 또는 `price_argen > 0`

**노무 최소 요구사항**:
- `labor_productivity`: `phase_id = 'kitchen'`, `is_active = true`
- `labor_costs`: `phase_id = 'kitchen'`, `is_active = true`, `rate_per_person_day > 0`

---

## ✅ 최소 기준 (각 카테고리)

### 자재
- ✅ 자재 1세트 (E 또는 S 중 택1)
- ✅ `is_active = true`
- ✅ 가격 > 0

### 노무
- ✅ 노무 1세트
- ✅ `is_active = true`
- ✅ `rate_per_person_day > 0`

---

## 🎯 목표

**목표**: "모든 경우 정확" ❌  
**목표**: "정상 케이스에서만 견적 가능" ⭕

---

## 🔒 단가 누락 시 BLOCK 유지

Phase 0 게이트 그대로 유지:
- 필수 카테고리 누락 → BLOCK
- 0원 단가 → BLOCK
- NULL 단가 → BLOCK

---

## 📝 DB 입력 가이드

### 바닥(마감) 입력 예시

```sql
-- 자재 입력
INSERT INTO materials (
  material_code, product_name, category_1, category_2,
  grade, is_active, price_argen, is_argen_standard
) VALUES (
  'FLOOR-001', '바닥 마루 ARGEN E', '바닥', '마루',
  'ARGEN_E', true, 50000, true
);

-- 노무 입력
INSERT INTO labor_productivity (
  phase_id, labor_unit, daily_output, crew_size, is_active
) VALUES (
  'finish', 'm2', 40, 2, true
);

INSERT INTO labor_costs (
  phase_id, rate_per_person_day, is_active
) VALUES (
  'finish', 300000, true
);
```

### 욕실 입력 예시

```sql
-- 자재 입력
INSERT INTO materials (
  material_code, product_name, category_1, category_2,
  grade, is_active, price_argen, is_argen_standard
) VALUES (
  'BATH-001', '욕실세트 ARGEN E', '욕실', '욕실세트',
  'ARGEN_E', true, 2000000, true
);

-- 노무 입력
INSERT INTO labor_productivity (
  phase_id, labor_unit, daily_output, crew_size, is_active
) VALUES (
  'bathroom', 'SET', 0.7, 2, true
);

INSERT INTO labor_costs (
  phase_id, rate_per_person_day, is_active
) VALUES (
  'bathroom', 350000, true
);
```

### 주방 입력 예시

```sql
-- 자재 입력
INSERT INTO materials (
  material_code, product_name, category_1, category_2,
  grade, is_active, price_argen, is_argen_standard
) VALUES (
  'KIT-001', '시스템주방 ARGEN E', '주방', '시스템주방',
  'ARGEN_E', true, 3000000, true
);

-- 노무 입력
INSERT INTO labor_productivity (
  phase_id, labor_unit, daily_output, crew_size, is_active
) VALUES (
  'kitchen', 'SET', 0.5, 2, true
);

INSERT INTO labor_costs (
  phase_id, rate_per_person_day, is_active
) VALUES (
  'kitchen', 350000, true
);
```

---

## ✅ 검증 방법

`scripts/validate-required-costs.ts` 스크립트 실행:

```bash
npm run validate-required-costs
```

또는:

```bash
npx tsx scripts/validate-required-costs.ts
```

---

**작성 완료** ✅


