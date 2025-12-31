# V5 Decision Trace Step 3 구현 완료

> **구현 일시**: 2025-01-21  
> **목적**: 질문 → 견적 영향 추적 (DB 레벨 증명)

---

## ✅ 완료된 작업

### 1. Supabase 테이블 생성

**파일**: `docs/V5_DECISION_IMPACTS_TABLE.sql`

**테이블 구조**:
- `id`: UUID (Primary Key)
- `session_id`: TEXT (세션 ID, v5_question_logs와 동일)
- `question_code`: TEXT (질문 코드, JOIN 기준)
- `answer_value`: TEXT (답변 값)
- `affected_category`: TEXT (영향받은 카테고리)
- `affected_rule_code`: TEXT (영향받은 규칙 코드)
- `impact_type`: TEXT (INCLUDE/EXCLUDE/MULTIPLIER/ASSUMPTION)
- `created_at`: TIMESTAMPTZ (생성 시간)

**인덱스**:
- `idx_v5_impacts_session`: 세션별 조회 최적화
- `idx_v5_impacts_question_code`: 질문 코드별 조회 최적화

**특징**:
- ✅ 금액 컬럼 없음
- ✅ 수치 컬럼 없음
- ✅ "원인-영향"만 기록

**실행 방법**:
Supabase SQL Editor에서 `docs/V5_DECISION_IMPACTS_TABLE.sql` 실행

---

### 2. 영향 매핑 규칙 정의

**파일**: `lib/analysis/v5-ultimate/decision-impact-mapper.ts`

**구현 사항**:

1. **QUESTION_IMPACT_MAP 객체**
   - 질문 코드별 매핑 함수 정의
   - 하드코딩 금지: 매핑 객체로만 정의

2. **우선 구현된 질문 3개**
   - `V5_Q_0`: 공사 범위
   - `V5_Q_1`: 철거 범위
   - `V5_Q_RISK`: 리스크/현장 조건

3. **영향 타입**
   - `INCLUDE`: 포함 (예: 전체 리모델링 → 모든 공정 포함)
   - `EXCLUDE`: 제외 (예: 철거 없음 → 철거 공정 제외)
   - `MULTIPLIER`: 배수 (예: 부분 리모델링 → 공정 비율 조정)
   - `ASSUMPTION`: 가정 (예: 현장 제약 있음 → 작업 시간 가정)

**예시 매핑**:

```typescript
V5_Q_0: (answer) => {
  if (answer.includes('전체') || answer.includes('리모델링')) {
    return [{
      affected_category: 'ALL',
      affected_rule_code: 'FULL_SCOPE',
      impact_type: 'INCLUDE',
    }];
  }
  // ...
}
```

---

### 3. 서버: Decision Impact 저장 로직 추가

**파일**: `app/api/estimate/v4/route.ts`

**구현 사항**:

1. **삽입 위치** (정확한 순서 준수)
   - ✅ `calculateEstimateV4ForUI()` 완료 직후
   - ✅ `v5_estimate_results` 저장 이후
   - ✅ Decision Trace 설명 생성 이전

2. **저장 로직**
   ```typescript
   // 질문-답변 로그 읽기
   const { data: answers } = await supabase
     .from('v5_question_answers')
     .select('question_code, answer_value')
     .eq('session_id', sessionId);

   // 각 질문-답변에 대해 영향 기록
   for (const answer of answers) {
     const impacts = getDecisionImpacts(answer.question_code, answer.answer_value);
     // 영향이 있는 경우만 INSERT
   }
   ```

3. **안전한 저장**
   - try-catch로 에러 격리
   - 저장 실패해도 견적 응답 정상 반환
   - 영향이 있는 경우만 INSERT

---

## 🎯 설계 원칙 준수

### ✅ 기존 로직 수정 금지

- ✅ 기존 질문 로직 수정 없음
- ✅ 기존 견적 계산 로직 수정 없음
- ✅ 기존 Decision Trace Step A / Step 2 변경 없음
- ✅ 추가만 허용

### ✅ 구조적 기록만 생성

- ✅ 자연어 설명 없음
- ✅ AI 추론 없음
- ✅ 금액/수치 참조 없음
- ✅ 규칙 코드 기반 구조적 기록

### ✅ 영향 있는 경우만 기록

- ✅ 질문 수만큼 무조건 생성하지 않음
- ✅ 하나의 질문이 여러 impact 만들어도 됨
- ✅ 영향이 없으면 INSERT 안 함

---

## 📊 데이터 흐름

### 완전한 Decision Trace 흐름

```
1. 질문 생성
   └─> v5_question_logs 저장 (question_code 포함)

2. 답변 선택
   └─> v5_question_answers 저장 (question_code 매칭)

3. 견적 계산
   └─> calculateEstimateV4ForUI() 완료
   └─> v5_estimate_results 저장 (견적 스냅샷)
   └─> v5_decision_impacts 저장 (영향 관계) ← NEW!
   └─> Decision Trace 설명 생성
```

### 세션별 데이터 구조

```
session_id: "abc-123-..."

v5_question_logs (5개)
├─ idx: 0, question_code: "V5_Q_RISK", question: "..."
├─ idx: 1, question_code: "V5_Q_0", question: "..."
└─ ...

v5_question_answers (5개)
├─ question_code: "V5_Q_RISK", answer_value: "있음"
├─ question_code: "V5_Q_0", answer_value: "전체 리모델링"
└─ ...

v5_decision_impacts (영향 있는 경우만)
├─ question_code: "V5_Q_RISK", answer_value: "있음"
│  ├─ affected_category: "RISK", affected_rule_code: "SITE_CONSTRAINTS", impact_type: "ASSUMPTION"
│  └─ affected_category: "RISK", affected_rule_code: "WORK_TIME_LIMIT", impact_type: "ASSUMPTION"
├─ question_code: "V5_Q_0", answer_value: "전체 리모델링"
│  └─ affected_category: "ALL", affected_rule_code: "FULL_SCOPE", impact_type: "INCLUDE"
└─ ...

v5_estimate_results (1개)
└─ estimate_snapshot: { 전체 견적 결과 JSON }
```

---

## ✅ 검증 방법

### 1. Supabase에서 확인

**의미 있는 조회 쿼리**:
```sql
SELECT
  question_code,
  answer_value,
  affected_category,
  affected_rule_code,
  impact_type
FROM v5_decision_impacts
WHERE session_id = 'your-session-id'
ORDER BY question_code;
```

**예상 결과**:
```
question_code | answer_value | affected_category | affected_rule_code | impact_type
--------------|--------------|------------------|-------------------|-------------
V5_Q_0        | 전체 리모델링 | ALL              | FULL_SCOPE        | INCLUDE
V5_Q_1        | 올철거        | DEMOLITION       | FULL_DEMOLITION   | INCLUDE
V5_Q_RISK     | 있음          | RISK             | SITE_CONSTRAINTS  | ASSUMPTION
V5_Q_RISK     | 있음          | RISK             | WORK_TIME_LIMIT   | ASSUMPTION
```

### 2. 성공 기준

**PASS 조건**:
- 사람이 봐도 "아, 이 질문 때문에 이 공정이 이렇게 들어갔구나" 이해됨
- 질문 코드와 규칙 코드가 논리적으로 매칭됨
- 영향 타입이 적절함

**예시**:
- "전체 리모델링" → `FULL_SCOPE` (INCLUDE) ✅
- "올철거" → `FULL_DEMOLITION` (INCLUDE) ✅
- "있음" (리스크) → `SITE_CONSTRAINTS` (ASSUMPTION) ✅

---

## 🎯 핵심 설계 원칙

### 1. 구조적 기록만 생성

**원칙**:
- 자연어 설명 없음
- AI 추론 없음
- 규칙 코드 기반 구조적 기록

**효과**:
- DB 레벨에서 증명 가능
- 자동 분석 가능
- 특허 문장 근거로 활용 가능

### 2. 영향 있는 경우만 기록

**원칙**:
- 질문 수만큼 무조건 생성하지 않음
- 하나의 질문이 여러 impact 만들어도 됨
- 영향이 없으면 INSERT 안 함

**효과**:
- 불필요한 데이터 저장 방지
- 의미 있는 영향만 기록

### 3. 금액/수치 참조 금지

**원칙**:
- 금액 컬럼 없음
- 수치 컬럼 없음
- 규칙 코드만 기록

**효과**:
- 견적 계산 로직과 분리
- 규칙 기반 추적 가능

---

## 📈 구현된 질문 매핑

### 1. V5_Q_0: 공사 범위

**매핑 규칙**:
- "전체 리모델링" → `FULL_SCOPE` (INCLUDE)
- "부분 리모델링" → `PARTIAL_SCOPE` (MULTIPLIER)
- "한 공간만" → `SINGLE_SPACE` (MULTIPLIER)

### 2. V5_Q_1: 철거 범위

**매핑 규칙**:
- "올철거" / "전체" → `FULL_DEMOLITION` (INCLUDE)
- "부분" → `PARTIAL_DEMOLITION` (MULTIPLIER)
- "없음" / "거의 없음" → `MINIMAL_DEMOLITION` (EXCLUDE)

### 3. V5_Q_RISK: 리스크/현장 조건

**매핑 규칙**:
- "있음" → `SITE_CONSTRAINTS` (ASSUMPTION) + `WORK_TIME_LIMIT` (ASSUMPTION)
- "없음" → `NO_SITE_CONSTRAINTS` (ASSUMPTION)
- "확인" / "모름" → `UNKNOWN_CONSTRAINTS` (ASSUMPTION)

---

## 📝 TODO (추후 구현)

### 미구현 질문

1. **V5_Q_2**: 욕실 공사
   - 욕실 개수에 따른 영향 매핑 필요

2. **V5_Q_3**: 주방 공사
   - 주방 옵션에 따른 영향 매핑 필요

3. **V5_Q_4**: 바닥 및 도배 공사
   - 바닥/도배 선택에 따른 영향 매핑 필요

---

## 🔒 절대 하지 말 것 (준수 완료)

- ✅ 견적 금액 참조 안 함
- ✅ 계산 결과 참조 안 함
- ✅ OpenAI 호출 안 함
- ✅ 기존 Decision Trace 설명 수정 안 함
- ✅ 프론트 수정 안 함
- ✅ 기존 테이블 컬럼 추가 안 함

---

## ✅ 완료 체크리스트

### 테이블
- [x] `v5_decision_impacts` 테이블 생성
- [x] 인덱스 추가 (session_id, question_code)

### 매핑 규칙
- [x] `QUESTION_IMPACT_MAP` 객체 정의
- [x] V5_Q_0 (공사 범위) 매핑
- [x] V5_Q_1 (철거 범위) 매핑
- [x] V5_Q_RISK (리스크) 매핑

### 서버 로직
- [x] Decision Impact 저장 로직 추가
- [x] 정확한 순서 준수 (견적 저장 이후, 설명 생성 이전)
- [x] 영향 있는 경우만 INSERT
- [x] try-catch로 에러 격리

### 안전성
- [x] 저장 실패해도 견적 응답 정상 반환
- [x] 기존 로직 수정 없음

---

## 🎉 최종 결론

### 성과

1. **DB 레벨 증명 가능**: "이 질문 때문에 이 공정이 이렇게 들어갔구나" DB에서 직접 확인 가능
2. **구조적 기록**: 자연어/AI 없이 규칙 코드 기반 구조적 기록
3. **기존 로직 보존**: 기존 로직 수정 없이 추가만 수행

### 변화

- **이전**: "왜 이 견적이 나왔는지" 설명만 가능
- **현재**: "이 질문이 이 공정/옵션/비용에 영향을 줬다" DB 레벨에서 증명 가능

### 활용

- 특허 문장 근거: "질문-답변-영향 관계를 DB 레벨에서 추적하는 시스템"
- 자동 분석: 규칙 코드 기반 자동 분석 가능
- 내부 검증: 질문 패턴과 견적 영향 상관관계 분석

---

**작업 완료** ✅


