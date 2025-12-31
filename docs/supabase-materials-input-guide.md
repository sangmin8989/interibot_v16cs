# 자재 DB 입력 가이드

## 📊 현재 상태

- ✅ **construction_phases**: 입력 완료 (50% 정도)
- 🔄 **materials**: 입력 중
- ⏳ **personality_materials**: 입력 대기 중 (materials 완료 후)

---

## 🎯 목표

자재 DB 입력이 완료되면 `personality_materials` 테이블에 성향-자재 매핑 데이터를 입력할 수 있습니다.

---

## 📋 Step 1: 현재 materials 테이블 상태 확인

### 방법 1: Supabase Dashboard

1. **Table Editor 열기**
   - Supabase Dashboard → Table Editor
   - `materials` 테이블 선택

2. **데이터 확인**
   - 총 행 수 확인
   - 샘플 데이터 확인
   - `material_code`, `product_name`, `grade` 컬럼 확인

### 방법 2: SQL 쿼리

```sql
-- 총 자재 수 확인
SELECT COUNT(*) as total_materials FROM materials;

-- 카테고리별 자재 수
SELECT category, COUNT(*) as count 
FROM materials 
GROUP BY category 
ORDER BY count DESC;

-- 등급별 자재 수
SELECT grade, COUNT(*) as count 
FROM materials 
GROUP BY grade 
ORDER BY grade;

-- 샘플 데이터 확인
SELECT material_id, material_code, product_name, grade, category 
FROM materials 
LIMIT 10;
```

---

## 📋 Step 2: personality_materials 입력 준비

### 필요한 정보

`personality_materials` 테이블에 데이터를 입력하려면:

1. **trait_id** - `personality_traits` 테이블에서 조회
2. **material_id** - `materials` 테이블에서 조회 (UUID)
3. **phase_id** - `construction_phases` 테이블에서 조회
4. **score_threshold** - 추천 기준 점수 (예: 4 이상)
5. **score_direction** - 'gte' (이상), 'lte' (이하), 'eq' (같음)
6. **recommendation_type** - 'upgrade', 'downgrade', 'must', 'optional'
7. **grade_adjustment** - 등급 조정 (-1, 0, +1)
8. **priority** - 추천 우선순위 (1-100)
9. **reason_template** - 추천 이유 템플릿

### 입력 예시

```sql
-- 1. trait_id 조회
SELECT trait_id, trait_code, trait_name 
FROM personality_traits 
WHERE trait_code = 'organization_habit';
-- 예: trait_id = 5

-- 2. material_id 조회 (예: 수납장)
SELECT material_id, material_code, product_name 
FROM materials 
WHERE material_code LIKE '%STORAGE%' 
  AND grade = 'standard'
LIMIT 1;
-- 예: material_id = '123e4567-e89b-12d3-a456-426614174000'

-- 3. phase_id 확인
SELECT phase_id, phase_name 
FROM construction_phases 
WHERE phase_id = 'STORAGE';
-- 예: phase_id = 'STORAGE'

-- 4. personality_materials에 입력
INSERT INTO personality_materials (
  trait_id,
  material_id,
  phase_id,
  score_threshold,
  score_direction,
  recommendation_type,
  grade_adjustment,
  priority,
  reason_template
) VALUES (
  5, -- organization_habit의 trait_id
  '123e4567-e89b-12d3-a456-426614174000', -- 수납장 material_id
  'STORAGE', -- phase_id
  7, -- 정리정돈 습관 7점 이상
  'gte', -- 이상
  'upgrade', -- 업그레이드 추천
  1, -- 등급 +1
  80, -- 우선순위 높음
  '정리정돈을 좋아하시니 수납 공간을 강화해드려요'
);
```

---

## 📋 Step 3: 자재 입력 완료 후 작업

### 1. materials 테이블 검증

```sql
-- 필수 컬럼 확인
SELECT 
  COUNT(*) as total,
  COUNT(material_id) as has_id,
  COUNT(material_code) as has_code,
  COUNT(product_name) as has_name,
  COUNT(grade) as has_grade
FROM materials;

-- 중복 material_code 확인
SELECT material_code, COUNT(*) as count
FROM materials
GROUP BY material_code
HAVING COUNT(*) > 1;
```

### 2. personality_materials 입력 시작

자재 입력이 어느 정도 완료되면 (예: 50% 이상), 핵심 성향부터 매핑 데이터를 입력할 수 있습니다.

**우선순위:**
1. **핵심 성향 5개** (정리정돈, 조명, 예산, 건강, 가족)
2. **나머지 성향 10개**

---

## 🛠️ Step 4: 부분 데이터로 테스트

자재가 50%만 입력되어 있어도 테스트할 수 있습니다.

### 테스트 쿼리

```sql
-- 입력된 자재로 personality_materials 조회 테스트
SELECT 
  pt.trait_name,
  m.product_name,
  m.grade,
  pm.score_threshold,
  pm.recommendation_type
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
JOIN materials m ON pm.material_id = m.material_id
WHERE pm.is_active = true
LIMIT 10;
```

---

## 📊 입력 진행 상황 추적

### 현재 상태 확인 쿼리

```sql
-- materials 입력 진행률 (카테고리별)
SELECT 
  category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM materials), 2) as percentage
FROM materials
GROUP BY category
ORDER BY count DESC;

-- personality_materials 입력 가능 여부
SELECT 
  COUNT(DISTINCT m.material_id) as available_materials,
  COUNT(DISTINCT pt.trait_id) as available_traits,
  COUNT(DISTINCT cp.phase_id) as available_phases
FROM materials m
CROSS JOIN personality_traits pt
CROSS JOIN construction_phases cp;
```

---

## ✅ 체크리스트

### materials 테이블
- [ ] 필수 컬럼 모두 입력됨 (material_id, material_code, product_name)
- [ ] grade 컬럼 입력됨 (basic, standard, argen, premium)
- [ ] category 컬럼 입력됨 (tile, floor, wall, etc.)
- [ ] material_code 중복 없음

### personality_materials 입력 준비
- [ ] materials 테이블에 최소 10개 이상 데이터
- [ ] construction_phases 테이블에 공정 데이터
- [ ] personality_traits 테이블에 15개 성향 데이터

---

## 🚀 다음 단계

자재 입력이 완료되면:

1. **핵심 성향-자재 매핑 입력** (5개 성향 × 10-20개 자재)
2. **나머지 성향-자재 매핑 입력** (10개 성향 × 5-10개 자재)
3. **테스트 및 검증**

가이드: `docs/supabase-setup-guide.md` 참고
























