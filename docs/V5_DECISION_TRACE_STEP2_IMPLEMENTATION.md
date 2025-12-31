# V5 Decision Trace Step 2 구현 완료

> **구현 일시**: 2025-01-21  
> **목적**: 견적 결과 저장 및 Decision Trace 완결

---

## ✅ 완료된 작업

### 1. Supabase 테이블 생성

**파일**: `docs/V5_ESTIMATE_RESULTS_TABLE.sql`

**테이블 구조**:
- `id`: UUID (Primary Key)
- `session_id`: TEXT (세션 ID, v5_question_logs와 동일)
- `estimate_version`: TEXT (기본값: 'V5')
- `estimate_snapshot`: JSONB (견적 결과 JSON 스냅샷)
- `created_at`: TIMESTAMPTZ (생성 시간)

**인덱스**:
- `idx_v5_estimate_results_session`: 세션별 조회 최적화
- `idx_v5_estimate_results_created_at`: 시간별 조회 최적화

**실행 방법**:
Supabase SQL Editor에서 `docs/V5_ESTIMATE_RESULTS_TABLE.sql` 실행

---

### 2. 서버: 견적 결과 저장 로직 추가

**파일**: `app/api/estimate/v4/route.ts`

**구현 내용**:

1. **Supabase 클라이언트 및 Decision Trace Explainer import**
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   import { buildDecisionTraceExplanation } from '@/lib/analysis/v5-ultimate/decision-trace-explainer'
   ```

2. **세션 ID 확보**
   ```typescript
   const sessionId =
     request.headers.get('x-session-id') ??
     null;
   ```

3. **견적 결과 저장** (견적 계산 완료 직후)
   ```typescript
   if (sessionId) {
     try {
       const supabase = createClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
       );

       await supabase.from('v5_estimate_results').insert({
         session_id: sessionId,
         estimate_snapshot: result,
       });
     } catch (saveError) {
       // 저장 실패해도 고객 응답은 정상 반환
       console.error('[V5_ESTIMATE_SAVE_ERROR]', saveError);
     }
   }
   ```

4. **Decision Trace 설명 생성**
   ```typescript
   let decisionExplanation = '';
   if (sessionId) {
     try {
       const explanation = await buildDecisionTraceExplanation(sessionId);
       decisionExplanation = explanation.explanation;
     } catch (explainError) {
       console.error('[V5_DECISION_EXPLAIN_ERROR]', explainError);
     }
   }
   ```

5. **API 응답에 decision_explanation 포함**
   ```typescript
   return NextResponse.json({
     status: 'SUCCESS',
     result,
     decision_explanation: decisionExplanation || undefined,
   })
   ```

---

## 🎯 설계 원칙 준수

### ✅ 견적 결과 JSON을 1회 스냅샷으로 저장
- `estimate_snapshot`에 전체 견적 결과 JSON 저장
- 재계산/수정 불가 (스냅샷)

### ✅ 질문·답변과 같은 session_id로 묶기
- `v5_question_logs`, `v5_question_answers`, `v5_estimate_results` 모두 동일 `session_id`

### ✅ 재계산/수정 ❌
- 스냅샷이므로 수정 불가
- 새로운 견적은 새로운 세션으로 생성

### ✅ 로그 실패는 서비스 흐름에 영향 없음
- 모든 저장 로직을 try-catch로 감쌈
- 저장 실패해도 견적 응답은 정상 반환

---

## 📊 데이터 흐름

### 완전한 Decision Trace 흐름

1. **질문 생성** → `v5_question_logs` 저장
2. **답변 선택** → `v5_question_answers` 저장
3. **견적 계산 완료** → `v5_estimate_results` 저장
4. **Decision Trace 설명 생성** → API 응답에 포함

### 세션별 데이터 구조

```
session_id: "abc-123-..."

v5_question_logs (5개)
├─ idx: 0, question_code: "V5_Q_RISK", question: "..."
├─ idx: 1, question_code: "V5_Q_1", question: "..."
├─ idx: 2, question_code: "V5_Q_2", question: "..."
├─ idx: 3, question_code: "V5_Q_3", question: "..."
└─ idx: 4, question_code: "V5_Q_4", question: "..."

v5_question_answers (5개)
├─ question_code: "V5_Q_RISK", answer_value: "있음"
├─ question_code: "V5_Q_1", answer_value: "전체 리모델링"
├─ question_code: "V5_Q_2", answer_value: "부분철거"
├─ question_code: "V5_Q_3", answer_value: "2개"
└─ question_code: "V5_Q_4", answer_value: "교체(전체)"

v5_estimate_results (1개)
└─ estimate_snapshot: { 전체 견적 결과 JSON }
```

---

## ✅ 검증 방법

### 1. Supabase에서 확인

**v5_estimate_results**:
```sql
SELECT 
  session_id,
  estimate_version,
  created_at,
  jsonb_pretty(estimate_snapshot) as estimate
FROM v5_estimate_results
WHERE session_id = 'your-session-id';
```

**세션별 전체 Decision Trace 조회**:
```sql
-- 질문 로그
SELECT 'question' as type, idx, question_code, question
FROM v5_question_logs
WHERE session_id = 'your-session-id'
ORDER BY idx

UNION ALL

-- 답변 로그
SELECT 'answer' as type, idx, question_code, answer_value as question
FROM v5_question_answers
WHERE session_id = 'your-session-id'
ORDER BY idx

UNION ALL

-- 견적 결과
SELECT 'estimate' as type, 999 as idx, 'ESTIMATE' as question_code, '견적 결과 저장됨' as question
FROM v5_estimate_results
WHERE session_id = 'your-session-id';
```

### 2. API 응답 확인

**예상 응답**:
```json
{
  "status": "SUCCESS",
  "result": {
    // 견적 결과 전체
  },
  "decision_explanation": "이번 견적은 다음과 같은 선택을 기준으로 산출되었습니다.\n\n1. 관리규정, 작업시간, 주차 및 양중 조건 등 현장 제약 사항이 반영되었습니다.\n2. 공사 범위는 \"전체 리모델링\" 기준으로 설정되었습니다.\n..."
}
```

### 3. 로그 실패 시 서비스 영향 확인

- Supabase 연결 끊기 (임시로 URL 잘못 설정)
- 견적 계산 API 호출
- `[V5_ESTIMATE_SAVE_ERROR]` 또는 `[V5_DECISION_EXPLAIN_ERROR]` 로그는 나오지만
- 견적 응답은 정상 반환되는지 확인

---

## 🎯 완료 판정 기준

### 필수 확인 사항

1. ✅ `v5_estimate_results`에 견적 결과 저장됨
   - 동일 `session_id`로 질문·답변과 묶여 있음

2. ✅ API 응답에 `decision_explanation` 포함됨
   - 금액·수치·평수 없이 자연어 설명

3. ✅ 저장 실패 시 서비스 영향 없음
   - 로그는 나오지만 견적 응답은 정상 반환

---

## 🔒 이 상태의 인테리봇

### ❌ "AI가 대충 낸 견적"
### ✅ "선택 → 판단 → 결과가 기록된 시스템"

### 활용 가능한 것들

1. **고객 설명**
   - "왜 이 견적이 나왔는지" 완전 추적 가능
   - Decision Trace 설명으로 자동 생성

2. **분쟁 대응**
   - 세션별 전체 의사결정 과정 기록
   - 질문-답변-견적 매칭으로 명확한 근거

3. **내부 검증**
   - 견적 정확도 분석
   - 질문 패턴과 견적 오차 상관관계 분석

4. **특허 문장**
   - "자동 질문 결정 + 답변 기반 견적 + Decision Trace 시스템"
   - 모든 데이터가 증거로 활용 가능

---

## 📝 다음 단계 (Step B 예상)

1. **Decision Trace 분석 대시보드**
   - 세션별 Decision Trace 시각화
   - 질문 패턴 통계

2. **자동 리포트 생성**
   - 견적 정확도 리포트
   - 질문-답변-견적 상관관계 분석

3. **특허 서술 근거**
   - Decision Trace 시스템 특허 문장 작성
   - 증거 데이터 자동 수집

---

**구현 완료** ✅


