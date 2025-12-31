# Phase 6.5 — AI 호출 제한 가상 시뮬레이션 템플릿

> **버전**: 1.0 (고정본)  
> **작성일**: 2025-01-21  
> **상태**: 시뮬레이션 템플릿 준비 완료

---

## 0) 목적

- 실제 로그로 **"켰다면 어떻게 됐을지"**를 수치로 증명
- `enableLimit` 전환을 감정·추측 없이 결정
- 코드 변경 없이 읽기 전용 분석

---

## 1) 입력 데이터 정의 (고정)

### 소스
- Phase 5에서 수집된 `[AI_CALL]` 로그
- 기간: 최소 3일 (권장 7일)

### 필수 필드
- `timestamp`
- `routeName`
- `model`
- `provider`
- `duration_ms`
- `success`
- `error_code` (nullable)

### 선택 필드
- `tokens_estimated`
- `image_call` (boolean)
- `request_id`

---

## 2) 집계 뷰 정의 (읽기 전용)

### 2-1. 분당 호출 집계

```
minute_bucket = floor(timestamp / 60s)
group by routeName, minute_bucket
metrics: calls_count
```

**출력 예시:**
```
routeName=IMAGE_GENERATE, minute_bucket=2025-01-21T10:00, calls_count=25
routeName=CHAT, minute_bucket=2025-01-21T10:00, calls_count=45
```

---

### 2-2. 지연 지표

```
group by routeName
metrics:
- avg_duration_ms
- p95_duration_ms
```

**출력 예시:**
```
routeName=IMAGE_GENERATE, avg_duration_ms=3200, p95_duration_ms=4500
routeName=CHAT, avg_duration_ms=850, p95_duration_ms=1200
```

---

### 2-3. 실패율

```
failure_rate = failed_calls / total_calls
group by routeName
```

**출력 예시:**
```
routeName=IMAGE_GENERATE, total_calls=1000, failed_calls=120, failure_rate=12%
routeName=CHAT, total_calls=5000, failed_calls=50, failure_rate=1%
```

---

### 2-4. 점유율

```
route_share = calls(route) / calls(all)
```

**출력 예시:**
```
routeName=IMAGE_GENERATE, calls=1000, total_calls=10000, route_share=10%
routeName=CHAT, calls=4500, total_calls=10000, route_share=45%
```

---

### 2-5. 비용 비중(추정)

```
image_cost_share ≈ image_calls / total_calls
```

**출력 예시:**
```
image_calls=2000, total_calls=10000, image_cost_share=20%
```

---

## 3) 정책 트리거 판정 로직 (문서 기준 그대로)

### IMAGE 계열

| 트리거 | 기준 | 판정 |
|--------|------|------|
| 분당 호출 | ≥ 20 | 충족 시점/빈도 기록 |
| 평균 duration | ≥ 3000ms | 충족 시점/빈도 기록 |
| 실패율 | ≥ 10% | 충족 시점/빈도 기록 |

**출력 예시:**
```
IMAGE_GENERATE:
- 분당 ≥ 20: 15회 충족 (총 1000분 중)
- avg_duration ≥ 3000ms: 충족 (3200ms)
- failure_rate ≥ 10%: 충족 (12%)
```

---

### CHAT 계열

| 트리거 | 기준 | 판정 |
|--------|------|------|
| 분당 호출 | ≥ 60 | 충족 시점/빈도 기록 |
| 점유율 | ≥ 40% | 충족 여부 기록 |

**출력 예시:**
```
CHAT:
- 분당 ≥ 60: 8회 충족 (총 1000분 중)
- route_share ≥ 40%: 충족 (45%)
```

---

**⚠️ 주의:** 충족 시점/빈도만 기록 (적용 금지)

---

## 4) 가상 제한 레벨 판정

### Level 1 (소프트)

**조건:**
- 트리거 1개 충족
- 연속 호출 구간에서만 적용 가정

**산출:**
- Level 1 대상 요청 수
- 전체 대비 비율(%)

**출력 예시:**
```
Level 1 대상:
- IMAGE_GENERATE: 150개 요청 (전체 1000개 중 15%)
- CHAT: 80개 요청 (전체 5000개 중 1.6%)
```

---

### Level 2 (하드)

**조건:**
- 동일 라우트에서 트리거 2개 이상 동시 충족
- 실패율 포함 시 가중치 ↑

**산출:**
- Level 2 대상 요청 수
- 전체 대비 비율(%)

**출력 예시:**
```
Level 2 대상:
- IMAGE_GENERATE: 50개 요청 (전체 1000개 중 5%)
  - 이유: 분당 ≥ 20 + avg_duration ≥ 3000ms 동시 충족
```

---

## 5) UX 영향 시뮬레이션

### 보호 규칙 반영

1. **첫 요청 무조건 통과**
2. **연속 호출만 제한**

### 지표

| 지표 | 목표 | 계산 |
|------|------|------|
| 첫 요청 통과율 | ≥ 99% | 첫 요청 중 통과 비율 |
| 제한 체감 요청 비율 | ≤ 5% | Level 1+2 대상 / 전체 |
| IMAGE 대비 TEXT 보호 성공 여부 | - | TEXT 라우트 제한 비율 < IMAGE |

**출력 예시:**
```
UX 영향 시뮬레이션:
- 첫 요청 통과율: 99.8% (목표 ≥ 99%) ✅
- 제한 체감 요청 비율: 4.2% (목표 ≤ 5%) ✅
- IMAGE 제한 비율: 15%
- TEXT 제한 비율: 1.6%
- 보호 성공: ✅ (TEXT < IMAGE)
```

---

## 6) 최종 Go / No-Go 판정 템플릿

### 요약 표

| 항목 | 결과 | 비고 |
|------|------|------|
| IMAGE 트리거 충족 | O / X | - |
| CHAT 트리거 충족 | O / X | - |
| IMAGE 비용 비중 ≥50% | O / X | - |
| Level 2 발생 | O / X | - |
| 첫 요청 통과율 ≥99% | O / X | - |
| 제한 체감 비율 ≤5% | O / X | - |

### 결론 (하나만 선택)

- ⬜ **Go**: `enableLimit=true` 전환 검토
  - 사유: [명시]
  
- ⬜ **Hold**: 관측 연장
  - 사유: [명시]
  - 다음 검토 시점: [날짜]

---

## 7) Phase 6.5 완료 조건

- ✅ 3일 이상 로그로 시뮬레이션
- ✅ 트리거 충족 여부 명확
- ✅ Level 1/2 가상 적용 수치 산출
- ✅ Go/No-Go 단일 결론 도출
- ✅ 코드 변경 0

---

## 부록: 로그 수집 가이드

### Phase 5 로그 형식

```
[AI_CALL]
route=IMAGE_GENERATE
model=gpt-4-turbo
provider=openai
duration=3200ms
tokens~=1250
success=true
```

### 로그 파싱 예시

```javascript
// 로그에서 필드 추출
const logMatch = log.match(/route=(\w+)/);
const routeName = logMatch ? logMatch[1] : 'UNKNOWN';

const durationMatch = log.match(/duration=(\d+)ms/);
const duration = durationMatch ? parseInt(durationMatch[1]) : 0;

const successMatch = log.match(/success=(true|false)/);
const success = successMatch ? successMatch[1] === 'true' : false;
```

---

**문서 끝**

**버전:** 1.0 (고정본)  
**작성일:** 2025-01-21  
**상태:** 시뮬레이션 템플릿 준비 완료


