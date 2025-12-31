# V4 등급별 브랜드 자재 선택 기능 분석 보고서

**작성일**: 2025-12-18  
**목적**: 등급별 브랜드 자재 선택 기능이 제대로 작동하는지 확인 및 분석

---

## ✅ 현재 구현 상태

### 1. material-service-strict.ts

**파일**: `lib/services/material-service-strict.ts`

**상태**: ✅ 정상

**확인 사항**:
- ✅ 33번 줄: `brandColumn` 선언 (중복 없음)
- ✅ 54번 줄: 등급별 브랜드 컬럼이 null이 아닌 자재만 조회
- ✅ 57번 줄: ARGEN_E는 가격 오름차순, 나머지는 내림차순 정렬
- ✅ 97번 줄: 등급별 브랜드명 선택

**코드 구조**:
```typescript
// 33번 줄: brandColumn 선언 (한 번만)
const brandColumn = request.brandCondition?.brandColumn || 'brand_argen'

// 54번 줄: 해당 브랜드 컬럼이 null이 아닌 자재만 조회
query = query.not(brandColumn, 'is', null)

// 57번 줄: 정렬
const isAscending = brandColumn === 'brand_basic'
query = query.order('price', { ascending: isAscending, nullsFirst: false })

// 97번 줄: 브랜드명 선택
const brandName = data[brandColumn] || data.brand_argen || data.brand_name || ''
```

**문제점**: ⚠️ `brandPriceKey` 변수는 정의되었지만 사용되지 않음
- 82-84번 줄: `brandPriceKey` 계산하지만 사용 안 함
- 85번 줄: `data.price ?? data.price_argen` 사용 (고정)

---

### 2. CostCalculator.ts

**파일**: `lib/estimate-v4/engines/estimate/CostCalculator.ts`

**상태**: ✅ 정상

**확인 사항**:
- ✅ 283-287번 줄: 등급별 브랜드 컬럼 결정 로직
- ✅ 298-300번 줄: `brandCondition: { brandColumn }` 전달

**코드 구조**:
```typescript
// 283-287번 줄: 등급별 브랜드 컬럼 결정
const brandColumn = 
  grade === 'ARGEN_E' ? 'brand_basic' :
  grade === 'ARGEN_S' ? 'brand_argen' :
  grade === 'ARGEN_O' ? 'brand_premium' :
  'brand_argen' // 기본값

// 298-300번 줄: MaterialRequest에 brandColumn 전달
const materialRequest: MaterialRequest = {
  // ...
  brandCondition: {
    isArgenStandard: true,
    brandColumn, // ✅ 전달됨
  },
  // ...
}
```

---

## 🔍 발견된 문제점

### 문제 1: brandPriceKey 미사용

**위치**: `lib/services/material-service-strict.ts:82-85`

**문제**:
```typescript
// 82-84번 줄: brandPriceKey 계산
const brandPriceKey = brandColumn === 'brand_basic' ? 'price' : 
                     brandColumn === 'brand_standard' ? 'price' :
                     brandColumn === 'brand_argen' ? 'price_argen' : 'price'

// 85번 줄: 하지만 brandPriceKey를 사용하지 않음
const finalPrice = data.price ?? data.price_argen ?? null
```

**영향**:
- `brandPriceKey`가 계산되지만 사용되지 않음
- 모든 등급에서 `data.price ?? data.price_argen` 사용
- 등급별 가격 차이가 제대로 반영되지 않을 수 있음

**수정 필요**: ⚠️ 선택적 (현재 로직도 작동 가능)

---

## 📊 데이터 흐름 분석

### 1. 등급 결정 → 브랜드 컬럼 매핑

```
ARGEN_E → brand_basic
ARGEN_S → brand_argen
ARGEN_O → brand_premium
```

### 2. DB 쿼리

```sql
SELECT * FROM materials
WHERE is_active = true
  AND category_1 = '주방'
  AND category_2 = '시스템주방'
  AND is_argen_standard = true
  AND brand_basic IS NOT NULL  -- 등급별 컬럼
ORDER BY price ASC  -- ARGEN_E는 오름차순, 나머지는 내림차순
LIMIT 1
```

### 3. 자재 선택 로직

- **ARGEN_E**: `brand_basic`이 null이 아닌 자재 중 **가장 저렴한** 자재
- **ARGEN_S**: `brand_argen`이 null이 아닌 자재 중 **가장 비싼** 자재
- **ARGEN_O**: `brand_premium`이 null이 아닌 자재 중 **가장 비싼** 자재

---

## ✅ 기능 검증 체크리스트

### 1. 코드 구조 검증

- [x] `brandColumn` 중복 선언 없음
- [x] `CostCalculator`에서 `brandColumn` 전달됨
- [x] `material-service-strict.ts`에서 `brandColumn` 사용됨
- [ ] `brandPriceKey` 사용 여부 확인 (현재 미사용)

### 2. 로직 검증

- [x] 등급별 브랜드 컬럼 매핑 정확함
- [x] DB 쿼리에서 해당 브랜드 컬럼 필터링
- [x] 정렬 로직 (ARGEN_E는 오름차순, 나머지는 내림차순)
- [x] 브랜드명 선택 로직

### 3. 예상 동작

**ARGEN_E (brand_basic)**:
- `brand_basic` 컬럼이 null이 아닌 자재만 조회
- 가격 오름차순 정렬 → 가장 저렴한 자재 선택
- 예상: 저가 브랜드 자재 (태양전자 등)

**ARGEN_S (brand_argen)**:
- `brand_argen` 컬럼이 null이 아닌 자재만 조회
- 가격 내림차순 정렬 → 가장 비싼 자재 선택
- 예상: 중급 브랜드 자재 (삼성 등)

**ARGEN_O (brand_premium)**:
- `brand_premium` 컬럼이 null이 아닌 자재만 조회
- 가격 내림차순 정렬 → 가장 비싼 자재 선택
- 예상: 고급 브랜드 자재 (필립스 등)

---

## 🧪 테스트 시나리오

### 시나리오 1: ARGEN_E 선택

**입력**:
- 등급: `ARGEN_E`
- 공간: `kitchen`
- 공정: `kitchen_core`

**예상 동작**:
1. `brandColumn = 'brand_basic'` 결정
2. `brand_basic IS NOT NULL` 조건으로 조회
3. `ORDER BY price ASC` 정렬
4. 가장 저렴한 자재 선택

**예상 결과**:
- 브랜드: 저가 브랜드 (태양전자 등)
- 가격: 낮은 가격

---

### 시나리오 2: ARGEN_S 선택

**입력**:
- 등급: `ARGEN_S`
- 공간: `kitchen`
- 공정: `kitchen_core`

**예상 동작**:
1. `brandColumn = 'brand_argen'` 결정
2. `brand_argen IS NOT NULL` 조건으로 조회
3. `ORDER BY price DESC` 정렬
4. 가장 비싼 자재 선택

**예상 결과**:
- 브랜드: 중급 브랜드 (삼성 등)
- 가격: 중간 가격

---

### 시나리오 3: ARGEN_O 선택

**입력**:
- 등급: `ARGEN_O`
- 공간: `kitchen`
- 공정: `kitchen_core`

**예상 동작**:
1. `brandColumn = 'brand_premium'` 결정
2. `brand_premium IS NOT NULL` 조건으로 조회
3. `ORDER BY price DESC` 정렬
4. 가장 비싼 자재 선택

**예상 결과**:
- 브랜드: 고급 브랜드 (필립스 등)
- 가격: 높은 가격

---

## 🔧 개선 제안

### 제안 1: brandPriceKey 사용 (선택적)

**현재**:
```typescript
const finalPrice = data.price ?? data.price_argen ?? null
```

**개선**:
```typescript
const finalPrice = data[brandPriceKey] ?? data.price ?? data.price_argen ?? null
```

**효과**:
- 등급별로 다른 가격 컬럼 사용 가능
- 더 정확한 가격 반영

**주의사항**:
- DB에 `price_basic`, `price_premium` 컬럼이 있어야 함
- 현재는 `price`와 `price_argen`만 사용

---

### 제안 2: 로깅 추가

**위치**: `lib/services/material-service-strict.ts`

**추가**:
```typescript
logger.debug('MaterialService', '등급별 자재 선택', {
  brandColumn,
  selectedBrand: brandName,
  price: finalPrice,
  productName: data.product_name,
})
```

**효과**:
- 등급별 자재 선택 추적 가능
- 디버깅 용이

---

## ✅ 최종 결론

### 구현 상태: ✅ 정상 작동 가능

**확인 사항**:
1. ✅ `brandColumn` 중복 선언 없음
2. ✅ `CostCalculator`에서 `brandColumn` 전달됨
3. ✅ `material-service-strict.ts`에서 등급별 브랜드 필터링 작동
4. ✅ 정렬 로직 정확함

**주의사항**:
- ⚠️ `brandPriceKey`는 정의되었지만 사용되지 않음 (현재 로직은 작동 가능)
- ⚠️ DB에 등급별 브랜드 컬럼 데이터가 있어야 함

**테스트 필요**:
1. 빌드 확인: `npm run build`
2. 실행 확인: `npm run dev`
3. 브라우저에서 등급별 견적 확인
4. 콘솔에서 선택된 브랜드 확인

---

**분석 완료!** 🎉







