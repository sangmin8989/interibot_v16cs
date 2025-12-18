# 철거 중복 및 Supabase 자재 DB 통합 작업 계획

## 📋 작업 개요

### 문제 1: 철거 중복 표시
- **현상**: 부분 철거 시 "폐기물 포함" 항목과 별도 "폐기물 처리" 항목이 중복 표시됨
- **원인**: `calculator-v3.ts` 996-1019줄에서 부분 철거 항목에 "폐기물 포함" 표시 후, 별도로 폐기물 처리 항목 추가

### 문제 2: Supabase 자재 DB 미반영
- **현상**: 타일만 DB에서 조회하고, 바닥재/도배/주방 등은 하드코딩된 상수 사용
- **원인**: 자재별 어댑터가 타일만 존재하고, MaterialService도 타일만 지원

---

## 🎯 작업 단계

### **Phase 1: 철거 중복 문제 해결** (우선순위: 높음)

#### 1-1. 철거 비용 계산 로직 수정
- **파일**: `lib/estimate/calculator-v3.ts`
- **위치**: `calculateCommonCosts` 함수 내 부분 철거 처리 부분 (996-1019줄)
- **작업 내용**:
  - 부분 철거 항목에 "폐기물 포함"이 있으면 별도 폐기물 처리 항목 추가하지 않음
  - 폐기물이 별도로 계산되는 경우만 "폐기물 처리" 항목 추가
- **예상 시간**: 30분

#### 1-2. 철거 항목 표시 로직 개선
- **파일**: `lib/estimate/calculator-v3.ts`
- **위치**: `calculateCommonCosts` 함수 내 `demolitionItems` 처리 부분
- **작업 내용**:
  - DB에서 조회한 철거 항목이 이미 폐기물을 포함하는지 확인
  - `is_package` 플래그나 `includes` 필드 확인하여 중복 방지
- **예상 시간**: 30분

#### 1-3. 테스트 및 검증
- **작업 내용**:
  - 부분 철거 시나리오 테스트 (바닥재만, 욕실만 등)
  - 전체 철거 시나리오 테스트
  - 폐기물 중복 표시 확인
- **예상 시간**: 30분

**Phase 1 총 예상 시간**: 1.5시간

---

### **Phase 2: Supabase 자재 DB 통합 - 어댑터 생성** (우선순위: 중간)

#### 2-1. 바닥재 어댑터 생성
- **파일**: `lib/db/adapters/flooring-adapter.ts` (신규)
- **작업 내용**:
  - `getFlooringPriceFromDB(grade: Grade): Promise<number>` 함수 구현
  - `materials_pricing` 테이블에서 `category='floor'` 또는 `grade`로 조회
  - 타일 어댑터와 동일한 패턴으로 구현
- **참고**: `lib/db/adapters/tile-adapter.ts` 구조 참고
- **예상 시간**: 1시간

#### 2-2. 도배 어댑터 생성
- **파일**: `lib/db/adapters/wallpaper-adapter.ts` (신규)
- **작업 내용**:
  - `getWallpaperPriceFromDB(grade: Grade): Promise<number>` 함수 구현
  - `materials_pricing` 테이블에서 `category='wall'` 또는 `grade`로 조회
  - 단위: 롤당 단가 (현재 파일: `WALLPAPER_PRICES`)
- **예상 시간**: 1시간

#### 2-3. 주방 어댑터 생성
- **파일**: `lib/db/adapters/kitchen-adapter.ts` (신규)
- **작업 내용**:
  - `getKitchenPriceFromDB(grade: Grade): Promise<number>` 함수 구현
  - `materials_pricing` 테이블에서 `category='kitchen'` 또는 `grade`로 조회
  - 단위: 자당(30cm) 단가 (현재 파일: `KITCHEN_MATERIAL_PRICES`)
- **예상 시간**: 1시간

#### 2-4. 어댑터 통합 테스트
- **작업 내용**:
  - 각 어댑터별 DB 조회 테스트
  - Fallback 로직 테스트 (DB 실패 시 파일로 전환)
- **예상 시간**: 30분

**Phase 2 총 예상 시간**: 3.5시간

---

### **Phase 3: MaterialService 확장** (우선순위: 중간)

#### 3-1. MaterialService에 바닥재 메서드 추가
- **파일**: `lib/services/material-service.ts`
- **작업 내용**:
  - `getFlooringPrice(options: FlooringPriceOptions): Promise<number>` 메서드 추가
  - DB 우선, Fallback은 파일 (`FLOORING_MATERIAL_PRICES`)
  - 캐싱 로직 추가 (타일과 동일한 패턴)
- **예상 시간**: 1시간

#### 3-2. MaterialService에 도배 메서드 추가
- **파일**: `lib/services/material-service.ts`
- **작업 내용**:
  - `getWallpaperPrice(options: WallpaperPriceOptions): Promise<number>` 메서드 추가
  - DB 우선, Fallback은 파일 (`WALLPAPER_PRICES`)
  - 캐싱 로직 추가
- **예상 시간**: 1시간

#### 3-3. MaterialService에 주방 메서드 추가
- **파일**: `lib/services/material-service.ts`
- **작업 내용**:
  - `getKitchenPrice(options: KitchenPriceOptions): Promise<number>` 메서드 추가
  - DB 우선, Fallback은 파일 (`KITCHEN_MATERIAL_PRICES`)
  - 캐싱 로직 추가
- **예상 시간**: 1시간

#### 3-4. MaterialService 통합 테스트
- **작업 내용**:
  - 모든 자재 타입에 대한 DB/파일 조회 테스트
  - 캐싱 동작 확인
- **예상 시간**: 30분

**Phase 3 총 예상 시간**: 3.5시간

---

### **Phase 4: 견적 계산 함수에 DB 통합** (우선순위: 높음)

#### 4-1. 바닥재 견적 계산 함수 수정
- **파일**: `lib/data/pricing-v3/flooring.ts`
- **작업 내용**:
  - `calculateFlooringEstimate` 함수를 `async`로 변경
  - `MaterialService.getFlooringPrice()` 사용하여 DB에서 단가 조회
  - Fallback은 기존 `FLOORING_MATERIAL_PRICES` 사용
- **예상 시간**: 1시간

#### 4-2. 도배 견적 계산 함수 수정
- **파일**: `lib/data/pricing-v3/wallpaper.ts`
- **작업 내용**:
  - `calculateWallpaperEstimate` 함수를 `async`로 변경
  - `MaterialService.getWallpaperPrice()` 사용하여 DB에서 단가 조회
  - Fallback은 기존 `WALLPAPER_PRICES` 사용
- **예상 시간**: 1시간

#### 4-3. 주방 견적 계산 함수 수정
- **파일**: `lib/data/pricing-v3/kitchen.ts`
- **작업 내용**:
  - `calculateKitchenEstimate` 함수를 `async`로 변경
  - `MaterialService.getKitchenPrice()` 사용하여 DB에서 단가 조회
  - Fallback은 기존 `KITCHEN_MATERIAL_PRICES` 사용
- **예상 시간**: 1시간

#### 4-4. calculator-v3.ts에서 async 호출 처리
- **파일**: `lib/estimate/calculator-v3.ts`
- **작업 내용**:
  - `calculateFlooringEstimate`, `calculateWallpaperEstimate`, `calculateKitchenEstimate` 호출 시 `await` 추가
  - 734-738줄 수정
- **예상 시간**: 30분

#### 4-5. 통합 테스트
- **작업 내용**:
  - 전체 견적 계산 플로우 테스트
  - DB 조회 실패 시 Fallback 동작 확인
  - 실제 견적서 생성 테스트
- **예상 시간**: 1시간

**Phase 4 총 예상 시간**: 4.5시간

---

### **Phase 5: Supabase DB 스키마 확인 및 데이터 입력** (우선순위: 중간)

#### 5-1. materials_pricing 테이블 스키마 확인
- **작업 내용**:
  - `materials_pricing` 테이블에 `category` 컬럼이 있는지 확인
  - 없으면 추가하거나, `material_code`로 카테고리 구분 가능한지 확인
- **예상 시간**: 30분

#### 5-2. 바닥재 가격 데이터 입력 가이드 작성
- **파일**: `docs/materials-pricing-input-guide.md` (신규)
- **작업 내용**:
  - 바닥재 가격 데이터 입력 SQL 예시
  - 등급별(BASIC, STANDARD, ARGEN, PREMIUM) 가격 범위 입력 방법
- **예상 시간**: 30분

#### 5-3. 도배 가격 데이터 입력 가이드 작성
- **파일**: `docs/materials-pricing-input-guide.md` (추가)
- **작업 내용**:
  - 도배 가격 데이터 입력 SQL 예시
  - 롤당 단가 입력 방법
- **예상 시간**: 30분

#### 5-4. 주방 가격 데이터 입력 가이드 작성
- **파일**: `docs/materials-pricing-input-guide.md` (추가)
- **작업 내용**:
  - 주방 가격 데이터 입력 SQL 예시
  - 자당(30cm) 단가 입력 방법
- **예상 시간**: 30분

**Phase 5 총 예상 시간**: 2시간

---

## 📊 전체 작업 요약

| Phase | 작업 내용 | 예상 시간 | 우선순위 |
|-------|----------|----------|---------|
| Phase 1 | 철거 중복 문제 해결 | 1.5시간 | 높음 |
| Phase 2 | 자재 어댑터 생성 | 3.5시간 | 중간 |
| Phase 3 | MaterialService 확장 | 3.5시간 | 중간 |
| Phase 4 | 견적 계산 함수 DB 통합 | 4.5시간 | 높음 |
| Phase 5 | DB 스키마 확인 및 가이드 | 2시간 | 중간 |
| **총계** | | **15시간** | |

---

## 🚀 권장 작업 순서

### 즉시 시작 (우선순위 높음)
1. **Phase 1**: 철거 중복 문제 해결 (1.5시간)
   - 사용자가 직접 확인 가능한 UI 문제
   - 빠르게 해결 가능

### 다음 단계 (의존성 고려)
2. **Phase 5**: DB 스키마 확인 (2시간)
   - Phase 2-4 작업 전에 DB 구조 확인 필요
   - 데이터 입력 가이드 작성

3. **Phase 2**: 자재 어댑터 생성 (3.5시간)
   - Phase 3의 기반이 됨

4. **Phase 3**: MaterialService 확장 (3.5시간)
   - Phase 2 완료 후 진행

5. **Phase 4**: 견적 계산 함수 통합 (4.5시간)
   - Phase 2, 3 완료 후 진행

---

## ⚠️ 주의사항

1. **DB 스키마 확인 필수**
   - `materials_pricing` 테이블에 `category` 컬럼이 있는지 확인
   - 없으면 어댑터에서 `material_code` 패턴으로 카테고리 구분

2. **Fallback 로직 필수**
   - 모든 DB 조회는 실패 시 파일 기반 데이터로 Fallback
   - 사용자 경험 저하 방지

3. **캐싱 고려**
   - 자재 가격은 자주 변경되지 않으므로 캐싱 필수
   - `lib/db/cache.ts`의 기존 캐싱 로직 활용

4. **비동기 처리**
   - 견적 계산 함수를 `async`로 변경하면 호출부도 모두 `await` 필요
   - `calculator-v3.ts` 전체 플로우 확인 필요

---

## ✅ 완료 기준

### Phase 1 완료 기준
- [ ] 부분 철거 시 폐기물 중복 표시 제거
- [ ] 전체 철거 시 정상 표시 확인
- [ ] 테스트 시나리오 통과

### Phase 2-4 완료 기준
- [ ] 모든 자재 타입(타일, 바닥재, 도배, 주방) DB 조회 가능
- [ ] DB 실패 시 파일 Fallback 정상 동작
- [ ] 견적 계산 시 DB 우선 조회
- [ ] 통합 테스트 통과

### Phase 5 완료 기준
- [ ] DB 스키마 확인 완료
- [ ] 데이터 입력 가이드 작성 완료
- [ ] 샘플 데이터 입력 SQL 제공

---

## 📝 다음 단계

작업을 시작하시겠습니까? 

**추천 시작 순서**:
1. Phase 1 (철거 중복) → 즉시 해결 가능
2. Phase 5 (DB 스키마 확인) → 이후 작업의 기반
3. Phase 2-4 (DB 통합) → 순차적으로 진행













