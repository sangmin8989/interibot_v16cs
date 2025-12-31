# V5 DATA CONSTITUTION + 상태 머신 봉인 지시문 분석 보고서

> **작성 일시**: 2025-01-21  
> **분석 대상**: V5 DATA CONSTITUTION + 상태 머신 봉인 지시문  
> **목적**: 지시문 요구사항 분석 및 현재 코드베이스 상태 평가

---

## 📋 지시문 요약

### 핵심 목표
> **V5 견적 엔진은 Supabase DB만을 유일한 진실로 삼고, DB가 없으면 계산하지 않고, 그 이유를 상태와 설명으로 끝까지 말한다.**

### 최종 정의
> **V5는 계산기가 아니라, "DB가 없으면 안 낸다고 말할 수 있는 판단 엔진"이다.**

---

## 📊 지시문 요구사항 분석

### 0️⃣ 헌법 (절대 규칙)

| 규칙 | 상태 | 비고 |
|------|------|------|
| DB 값 추가 ❌ | ✅ 준수 | 지시문은 선언만 요구 |
| 단가/산식 변경 ❌ | ✅ 준수 | 지시문은 선언만 요구 |
| Phase 0 봉인 해제 ❌ | ✅ 준수 | 지시문은 선언만 요구 |
| pricing-v3 / estimate-master 연결 금지 | ⚠️ 확인 필요 | 레거시 데이터 사용 여부 확인 |
| 헌법 v1 엔진 연결 금지 | ✅ 준수 | V4 엔진 사용 중 |

---

### 1️⃣ V5 DATA CONSTITUTION 선언

#### 1-1. 문서 생성

**요구사항**: `docs/V5_DATA_CONSTITUTION.md` 생성

**현재 상태**: ❌ **미완료**
- 파일 존재 여부: 없음
- 내용: 없음

**평점**: 0/10

---

#### 1-2. 코드 주석 추가

**요구사항**: 다음 파일 상단에 V5 DATA CONSTITUTION 주석 추가
- `lib/estimate-v4/index.ts`
- `lib/estimate-v4/engines/estimate/EstimateEngineV4.ts`
- `lib/services/material-service-strict.ts`
- `lib/services/labor-service-strict.ts`

**현재 상태**: ❌ **미완료**
- `lib/estimate-v4/index.ts`: 헌법 v1.1 주석만 있음, V5 DATA CONSTITUTION 주석 없음
- `lib/estimate-v4/engines/estimate/EstimateEngineV4.ts`: 기본 주석만 있음
- `lib/services/material-service-strict.ts`: 헌법 v1.1 주석만 있음
- `lib/services/labor-service-strict.ts`: 헌법 v1.1 주석만 있음

**평점**: 0/10

---

### 2️⃣ V5 상태 머신 단일화

#### 2-1. 상태 타입 파일 생성

**요구사항**: `lib/estimate-v4/v5-estimate-state.ts` 생성

**현재 상태**: ❌ **미완료**
- 파일 존재 여부: 없음
- 타입 정의: 없음

**평점**: 0/10

---

#### 2-2. 판정 함수 생성

**요구사항**: `lib/estimate-v4/evaluateV5EstimateState.ts` 생성

**현재 상태**: ❌ **미완료**
- 파일 존재 여부: 없음
- 함수: 없음

**평점**: 0/10

---

#### 2-3. BLOCK 판단 통합

**요구사항**: 흩어져 있던 BLOCK 판단을 `evaluateV5EstimateState`로 통합

**현재 상태**: ⚠️ **부분 완료**
- Phase 0에서 `checkDBGate` 함수로 DB 게이트 구현됨
- 하지만 V5 상태 머신으로 통합되지 않음
- `app/api/estimate/v4/route.ts`에 `checkDBGate` 함수 존재

**평점**: 3/10 (기능은 있으나 통합 안 됨)

---

### 3️⃣ Decision Trace Step 4를 상태 기반 설명으로 고정

#### 3-1. 출력 형식 고정

**요구사항**: 
```typescript
{
  state: 'READY' | 'BLOCK_DB' | 'BLOCK_INPUT',
  customer: string[],
  internal: string[],
}
```

**현재 상태**: ❌ **미완료**
- `lib/analysis/v5-ultimate/decision-trace-presenter.ts` 존재
- 하지만 `state` 필드 없음
- 현재는 `{ customer: string[], internal: string[] }` 형식만 반환

**평점**: 2/10 (기본 구조는 있으나 상태 필드 없음)

---

#### 3-2. READY 상태 설명

**요구사항**: "어떤 선택이 반영되었는지"만 설명

**현재 상태**: ✅ **완료**
- `CUSTOMER_EXPLAIN_MAP`으로 고객용 설명 생성
- `INTERNAL_EXPLAIN_MAP`으로 내부용 설명 생성
- 금액/점수/확정 표현 없음

**평점**: 8/10

---

#### 3-3. BLOCK_DB 상태 설명

**요구사항**:
- 고객용: "현재 선택 조건에서는 견적 산출에 필요한 기준 데이터가 준비되지 않았습니다."
- 내부용: 누락 공정, 사용된 question_code, BLOCK 사유

**현재 상태**: ❌ **미완료**
- BLOCK_DB 상태 설명 로직 없음
- Phase 0의 `checkDBGate`는 있으나 Decision Trace 설명과 연결 안 됨

**평점**: 1/10

---

### 4️⃣ 공식 API에 상태 포함

#### 4-1. API 응답 확장

**요구사항**: 
```json
{
  "v5_state": "BLOCK_DB",
  "decision_explanation_split": {
    "customer": [...],
    "internal": [...]
  }
}
```

**현재 상태**: ⚠️ **부분 완료**
- `app/api/estimate/v4/route.ts`에 `decision_explanation_split` 필드 있음
- 하지만 `v5_state` 필드 없음
- Phase 0의 `checkDBGate`는 있으나 `v5_state`로 반환 안 됨

**평점**: 3/10 (기본 구조는 있으나 상태 필드 없음)

---

### 5️⃣ 레거시 데이터 격리 선언

#### 5-1. 레거시 데이터 사용 확인

**요구사항**: `lib/data/pricing-v3/*`, `lib/data/estimate-master*` 사용 여부 확인

**현재 상태**: ⚠️ **확인 필요**
- `pricing-v3` 사용: 12개 파일에서 발견
  - `lib/estimate/calculator-v3.ts`
  - `lib/services/material-service.ts`
  - `lib/estimate/unified-calculator.ts`
  - `lib/estimate/unified-calculator-v2.ts`
  - `lib/db/adapters/demolition-adapter.ts`
  - `lib/db/adapters/tile-adapter.ts`
  - `lib/estimate/rule-engine-v0.ts`
  - 등등
- `estimate-master` 사용: 1개 파일에서 발견
  - `lib/data/estimate-master.ts`

**평점**: 2/10 (레거시 데이터 사용 중, V4/V5 경로에서 제거 필요)

---

#### 5-2. V4/V5 경로에서 제거

**요구사항**: V4/V5 경로에서 레거시 데이터 사용 시 즉시 제거

**현재 상태**: ⚠️ **확인 필요**
- V4 엔진 (`lib/estimate-v4/`)에서 직접 사용하는지 확인 필요
- `lib/estimate-v4/engines/estimate/CostCalculator.ts`는 `getMaterialPriceStrict` 사용 (DB 기반) ✅
- 하지만 다른 경로에서 사용 가능성 있음

**평점**: 5/10 (V4 엔진은 DB 기반이지만 전체 경로 확인 필요)

---

## 📊 종합 평가

### 항목별 완성도

| 항목 | 완성도 | 평점 | 비고 |
|------|--------|------|------|
| 1-1. V5 DATA CONSTITUTION 문서 | 0% | 0/10 | 파일 없음 |
| 1-2. 코드 주석 추가 | 0% | 0/10 | 주석 없음 |
| 2-1. 상태 타입 파일 | 0% | 0/10 | 파일 없음 |
| 2-2. 판정 함수 | 0% | 0/10 | 함수 없음 |
| 2-3. BLOCK 판단 통합 | 30% | 3/10 | 기능은 있으나 통합 안 됨 |
| 3-1. 출력 형식 고정 | 20% | 2/10 | 기본 구조는 있으나 상태 필드 없음 |
| 3-2. READY 상태 설명 | 80% | 8/10 | 완료 |
| 3-3. BLOCK_DB 상태 설명 | 10% | 1/10 | 로직 없음 |
| 4-1. API 응답 확장 | 30% | 3/10 | 기본 구조는 있으나 상태 필드 없음 |
| 5-1. 레거시 데이터 확인 | 20% | 2/10 | 사용 중, 제거 필요 |
| 5-2. V4/V5 경로에서 제거 | 50% | 5/10 | V4 엔진은 DB 기반이지만 전체 확인 필요 |

---

### 전체 완성도

**평균 점수**: **2.5/10** (25%)

**등급**: 🔴 **미완료 (Critical)**

---

## 🎯 핵심 문제점

### 1. V5 DATA CONSTITUTION 선언 부재
- 문서 없음
- 코드 주석 없음
- 원칙이 명시되지 않음

### 2. 상태 머신 미구현
- 상태 타입 정의 없음
- 판정 함수 없음
- BLOCK 판단이 흩어져 있음

### 3. Decision Trace Step 4 상태 기반 미적용
- 상태 필드 없음
- BLOCK_DB 상태 설명 없음

### 4. API 응답에 상태 필드 없음
- `v5_state` 필드 없음
- Phase 0의 `checkDBGate`와 연결 안 됨

### 5. 레거시 데이터 사용 중
- `pricing-v3` 사용: 12개 파일
- `estimate-master` 사용: 1개 파일
- V4/V5 경로에서 제거 필요

---

## ✅ 완료된 항목

### 1. Decision Trace Step 4 기본 구조
- `lib/analysis/v5-ultimate/decision-trace-presenter.ts` 존재
- 고객용/내부용 설명 분기 구현
- READY 상태 설명 로직 완료

### 2. Phase 0 DB 게이트
- `checkDBGate` 함수 구현
- 필수 데이터 누락 시 BLOCK 반환
- 하지만 V5 상태 머신과 연결 안 됨

### 3. V4 엔진 DB 기반
- `getMaterialPriceStrict` 사용 (DB 기반)
- `getLaborRateStrict` 사용 (DB 기반)
- 파일 기반 데이터 직접 사용 안 함

---

## 🔧 즉시 조치 필요 사항

### 우선순위 1 (Critical)

1. **V5 DATA CONSTITUTION 문서 생성**
   - `docs/V5_DATA_CONSTITUTION.md` 생성
   - 원칙 명시

2. **상태 머신 구현**
   - `lib/estimate-v4/v5-estimate-state.ts` 생성
   - `lib/estimate-v4/evaluateV5EstimateState.ts` 생성
   - BLOCK 판단 통합

3. **Decision Trace Step 4 상태 기반 수정**
   - `state` 필드 추가
   - BLOCK_DB 상태 설명 로직 추가

---

### 우선순위 2 (High)

4. **API 응답 확장**
   - `v5_state` 필드 추가
   - `checkDBGate`와 연결

5. **코드 주석 추가**
   - 4개 파일 상단에 V5 DATA CONSTITUTION 주석 추가

---

### 우선순위 3 (Medium)

6. **레거시 데이터 격리**
   - V4/V5 경로에서 `pricing-v3` 사용 확인 및 제거
   - V4/V5 경로에서 `estimate-master` 사용 확인 및 제거
   - 주석으로 격리 선언

---

## 📈 개선 로드맵

### Phase 1: 선언 및 구조 정리 (1-2일)
1. V5 DATA CONSTITUTION 문서 생성
2. 코드 주석 추가
3. 상태 머신 타입 정의

### Phase 2: 상태 머신 구현 (2-3일)
1. 판정 함수 구현
2. BLOCK 판단 통합
3. Decision Trace Step 4 상태 기반 수정

### Phase 3: API 확장 (1일)
1. API 응답에 `v5_state` 필드 추가
2. `checkDBGate`와 연결

### Phase 4: 레거시 데이터 격리 (1-2일)
1. V4/V5 경로에서 레거시 데이터 사용 확인
2. 제거 또는 주석으로 격리 선언

---

## 🎯 성공 판정 기준 (지시문 기준)

### 현재 상태

| 기준 | 상태 | 비고 |
|------|------|------|
| DB 없어도 질문 → 판단 → BLOCK 설명까지 완결 | ❌ | BLOCK 설명 로직 없음 |
| V5 결과가 금액 ❌ 상태 ⭕ | ❌ | 상태 필드 없음 |
| V5가 바라보는 데이터 소스: Supabase DB only | ⚠️ | V4 엔진은 DB 기반이지만 레거시 데이터 사용 가능성 |
| "왜 안 나왔는지"를 고객/내부 각각 설명 가능 | ⚠️ | READY는 가능하나 BLOCK_DB는 불가능 |

**종합 판정**: ❌ **미달성**

---

## 📝 결론

### 현재 상태 요약

- **완성도**: 25% (2.5/10)
- **등급**: 🔴 **미완료 (Critical)**
- **핵심 문제**: V5 DATA CONSTITUTION 선언 부재, 상태 머신 미구현, Decision Trace Step 4 상태 기반 미적용

### 권장 조치

1. **즉시 조치**: V5 DATA CONSTITUTION 문서 생성, 상태 머신 구현
2. **단기 조치**: Decision Trace Step 4 상태 기반 수정, API 응답 확장
3. **중기 조치**: 레거시 데이터 격리

### 예상 소요 시간

- **최소 완성**: 3-4일
- **완전 완성**: 5-7일

---

**보고서 작성 완료** ✅

