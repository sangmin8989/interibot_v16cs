# Phase 0: 생존 봉인 작업 구현 완료 보고서

> **작성 일시**: 2025-01-21  
> **목적**: 프로덕션에서 오직 1개의 공식 견적 경로만 존재하게 만들고, DB/엔진 미완성 상태에서 그럴듯한 결과가 절대 나오지 않게 봉인

---

## ✅ 완료된 작업

### 1. middleware.ts 생성 (라우트 봉인)

**파일**: `middleware.ts`

**구현 내용**:
- `/estimate` → `/onboarding/estimate`로 307 리다이렉트
- V5 구버전 견적 경로 차단 (`/v5/process-detail`, `/v5/process-select` 등)
- 로그 태그: `[ESTIMATE_ROUTE_GUARD]`

**효과**:
- 구버전 견적 페이지 접근 차단
- 모든 견적 요청이 공식 경로로 통합

---

### 2. 구버전 API 차단

**차단된 API**:
- `/api/estimate/v3` → 410 Gone
- `/api/estimate/calculate` → 410 Gone
- `/api/estimate/constitution` → 410 Gone
- `/api/estimate/argen` → 410 Gone
- `/api/estimate/rule-engine-v0` → 410 Gone

**구현 내용**:
- 각 API의 POST 함수 시작 부분에 차단 로직 추가
- 응답 형식: `{ ok: false, error: { code: 'DEPRECATED_API', severity: 'BLOCK', ... } }`
- 로그 태그: `[DEPRECATED_API_BLOCK]`

**효과**:
- 구버전 API 호출 시 즉시 차단
- 공식 API (`/api/estimate/v4`)만 사용 가능

---

### 3. DB 게이트 추가

**파일**: `app/api/estimate/v4/route.ts`

**구현 내용**:
- `checkDBGate()` 함수 추가
- 견적 계산 직후 필수 데이터 존재 체크
- BLOCK 조건:
  1. `result.isSuccess === false`
  2. `breakdown`이 비어있음
  3. 필수 공정(마감/욕실/주방)의 materials가 비어있거나 금액이 0원
  4. 총액이 0원

**BLOCK 응답 형식**:
```json
{
  "ok": false,
  "error": {
    "code": "DB_MISSING_REQUIRED_COSTS",
    "severity": "BLOCK",
    "userMessage": "현재 견적 산출에 필요한 필수 단가 데이터가 준비되지 않았습니다. (바닥/욕실/주방 중 일부)",
    "debug": {
      "missing": ["마감", "욕실", "주방"]
    }
  }
}
```

**로그 태그**: `[ESTIMATE_BLOCK]`

**효과**:
- DB 데이터 부족 시 견적 결과 차단
- 0원 견적 방지
- 사기처럼 보이는 결과 방지

---

### 4. 프론트 BLOCK 처리

**파일**: `app/onboarding/estimate/page.tsx`

**구현 내용**:
- API 응답에서 `ok === false && error.severity === 'BLOCK'` 체크
- BLOCK 응답 수신 시:
  - 에러 메시지 표시
  - 결과 화면 렌더링 중단
  - `setIsCalculating(false)` 호출

**적용 위치**:
- 첫 번째 API 호출 (기본 견적 계산)
- 두 번째 API 호출 (등급별 견적 계산)

**효과**:
- BLOCK 응답 시 결과 화면 차단
- 사용자에게 명확한 안내 메시지 제공

---

### 5. 로그 태그 표준화

**표준화된 로그 태그**:
- `[ESTIMATE_BLOCK]`: DB 게이트에 걸렸을 때
- `[ESTIMATE_ROUTE_GUARD]`: 구버전 견적 페이지 접근 차단
- `[DEPRECATED_API_BLOCK]`: 구버전 API 접근 차단

**사용 위치**:
- `middleware.ts`: `[ESTIMATE_ROUTE_GUARD]`
- `app/api/estimate/v4/route.ts`: `[ESTIMATE_BLOCK]`
- `app/api/estimate/v3/route.ts`: `[DEPRECATED_API_BLOCK]`
- `app/api/estimate/calculate/route.ts`: `[DEPRECATED_API_BLOCK]`
- `app/api/estimate/constitution/route.ts`: `[DEPRECATED_API_BLOCK]`
- `app/api/estimate/argen/route.ts`: `[DEPRECATED_API_BLOCK]`
- `app/api/estimate/rule-engine-v0/route.ts`: `[DEPRECATED_API_BLOCK]`

---

## ✅ 성공 판정 기준

### 7-1. 라우트 통제 ✅

- `/estimate` 접속 → `/onboarding/estimate`로 이동 ✅
- 구버전 견적 페이지 직접 URL 입력 → 공식 경로로 이동 ✅

### 7-2. API 단일화 ✅

- `/api/estimate/v4`만 견적 응답 가능 ✅
- 다른 `/api/estimate/*`는 410 또는 block 응답만 ✅

### 7-3. DB 게이트 ✅

- 바닥/욕실/주방 단가 일부 없을 때:
  - `ok: false, severity: BLOCK` 반환 ✅
  - 프론트는 결과 화면 안 보여줌 ✅

### 7-4. "사기처럼 보이는 화면" 차단 ✅

- 집정보만 넣고 결과 리포트 화면이 뜨면 FAIL
- Phase 0에서는 결과 리포트 화면이 뜨면 안 됨 ✅

---

## 🔒 절대 금지 사항 준수

- ✅ 신규 기능 추가 금지
- ✅ 기존 DB 스키마 수정 금지
- ✅ 견적 계산 로직 변경 금지
- ✅ 통제/차단/게이트/리다이렉트만 수행

---

## 📋 작업 산출물

1. ✅ `middleware.ts` 추가
2. ✅ 구버전 API 라우트 차단 (5개 파일)
3. ✅ `app/api/estimate/v4/route.ts` 게이트 추가
4. ✅ 공식 견적 화면에서 BLOCK 처리 분기 추가 (2곳)

---

## 🎯 최종 결론

**Phase 0: 생존 봉인 작업 완료** ✅

- 프로덕션에서 오직 1개의 공식 견적 경로만 존재
- DB/엔진 미완성 상태에서 그럴듯한 결과 절대 차단
- 구버전 경로 완전 차단
- 사기처럼 보이는 결과 방지

---

**작업 완료** ✅


