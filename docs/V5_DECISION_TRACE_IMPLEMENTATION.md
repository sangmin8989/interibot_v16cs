# V5 Decision Trace Step A 구현 완료

> **구현 일시**: 2025-01-21  
> **목적**: V5 Decision Trace 입력부 완성 (질문·답변 추적 시스템)

---

## ✅ 완료된 작업

### 1. Supabase 테이블

**파일**: `docs/V5_DECISION_TRACE_TABLES.sql`

**작업 내용**:
- `v5_question_logs` 테이블에 `question_code` 컬럼 추가
- `v5_question_answers` 테이블 생성
- 인덱스 추가 (세션별, question_code별)

**실행 방법**:
Supabase SQL Editor에서 `docs/V5_DECISION_TRACE_TABLES.sql` 실행

---

### 2. 서버: 질문 생성 + question_code 반환

**파일**: `app/api/v5/generate-question/route.ts`

**구현 내용**:

1. **답변 저장 로직 추가** (질문 생성 이전)
   ```typescript
   if (lastAnswer && lastQuestionCode && sessionId) {
     await supabase.from('v5_question_answers').insert({
       session_id: sessionId,
       question_code: lastQuestionCode, // 프론트에서 전달받은 값 그대로
       idx: userCount - 1,
       answer_value: lastAnswer,
       answer_type: 'QUICK',
     });
   }
   ```

2. **question_code 결정** (질문 생성 시점에 1회만)
   ```typescript
   const questionCode =
     riskLevel === 'HIGH'
       ? 'V5_Q_RISK'
       : `V5_Q_${userMessagesCount}`;
   ```

3. **질문 로그 저장** (question_code 포함)
   ```typescript
   await supabase.from('v5_question_logs').insert({
     session_id: sessionId,
     idx: userMessagesCount,
     question_code: questionCode,
     risk_level: riskLevel,
     question: result.question,
     quick_replies: result.quickReplies,
     messages_count: chatMessages.length,
   });
   ```

4. **API 응답에 question_code 포함**
   ```typescript
   return NextResponse.json({
     success: true,
     question: result.question,
     quickReplies: result.quickReplies,
     question_code: questionCode, // ✅ 추가
     isComplete: false
   });
   ```

---

### 3. 프론트: session_id 고정 + question_code 상태 유지

**파일**: `components/v5-ultimate/ChatOnboarding.tsx`

**구현 내용**:

1. **session_id localStorage 관리 함수**
   ```typescript
   const getV5SessionId = () => {
     if (typeof window === 'undefined') return null;
     let sid = localStorage.getItem('v5_session_id');
     if (!sid) {
       sid = crypto.randomUUID();
       localStorage.setItem('v5_session_id', sid);
     }
     return sid;
   };
   ```

2. **currentQuestionCode 상태 추가**
   ```typescript
   const [currentQuestionCode, setCurrentQuestionCode] = useState<string | null>(null);
   ```

3. **질문 응답 수신 시 question_code 저장**
   ```typescript
   if (data.question_code) {
     setCurrentQuestionCode(data.question_code);
   }
   ```

4. **fetch 헤더에 session_id 추가**
   ```typescript
   const sessionId = getV5SessionId();
   
   headers: {
     'Content-Type': 'application/json',
     'x-session-id': sessionId ?? '',
   }
   ```

5. **fetch body에 lastAnswer, lastQuestionCode 추가**
   ```typescript
   body: JSON.stringify({
     messages,
     photoAnalysis,
     styleResult,
     spaceInfo,
     lastAnswer: lastAnswer,
     lastQuestionCode: currentQuestionCode,
   })
   ```

6. **loadNextQuestion에 lastAnswer 파라미터 추가**
   ```typescript
   const loadNextQuestion = async (lastAnswer?: string) => {
     // ...
   };
   
   // handleAnswer에서 호출
   await loadNextQuestion(answer);
   ```

---

## 🎯 설계 원칙 준수

### ✅ question_code는 "질문 생성 시점"에 1회만 결정
- 서버에서 질문 생성 시 `questionCode` 변수에 저장
- 이후 재계산하지 않음

### ✅ 답변 저장 시 question_code를 새로 계산하지 않음
- 프론트에서 전달받은 `lastQuestionCode`를 그대로 사용
- 서버는 판단하지 않음

### ✅ 프론트 → 서버 → DB까지 동일 question_code 전달
- 프론트: API 응답에서 `question_code` 받아서 상태 저장
- 서버: 프론트에서 받은 `lastQuestionCode`를 그대로 DB에 저장

### ✅ idx는 보조 지표이며, JOIN 기준이 아님
- `question_code`가 JOIN 기준
- `idx`는 참고용

### ✅ 로그 실패는 서비스 흐름에 영향 없음
- 모든 로그 저장 로직을 try-catch로 감쌈
- 로그 실패해도 질문 응답은 정상 반환

---

## 📊 데이터 흐름

### 정상 흐름

1. **첫 질문 생성** (userMessages.length = 0)
   - 서버: `questionCode = 'V5_Q_0'` 결정
   - 서버: `v5_question_logs`에 저장
   - 서버: API 응답에 `question_code: 'V5_Q_0'` 포함
   - 프론트: `setCurrentQuestionCode('V5_Q_0')` 저장

2. **첫 답변 선택** (사용자가 quickReply 클릭)
   - 프론트: `handleAnswer('전체 리모델링')` 호출
   - 프론트: `loadNextQuestion('전체 리모델링')` 호출
   - 프론트: fetch body에 `lastAnswer: '전체 리모델링'`, `lastQuestionCode: 'V5_Q_0'` 전달

3. **답변 저장** (질문 생성 이전)
   - 서버: `v5_question_answers`에 저장
     - `question_code: 'V5_Q_0'` (프론트에서 전달받은 값 그대로)
     - `answer_value: '전체 리모델링'`

4. **두 번째 질문 생성** (userMessages.length = 1)
   - 서버: `questionCode = 'V5_Q_1'` 결정
   - 서버: `v5_question_logs`에 저장
   - 서버: API 응답에 `question_code: 'V5_Q_1'` 포함
   - 프론트: `setCurrentQuestionCode('V5_Q_1')` 저장

5. **반복** (idx 0~4까지)

---

## ✅ 검증 방법

### Supabase에서 확인

**v5_question_logs**:
```sql
SELECT session_id, idx, question_code, question 
FROM v5_question_logs 
WHERE session_id = 'your-session-id'
ORDER BY idx;
```

**예상 결과**:
| session_id | idx | question_code | question |
|------------|-----|---------------|----------|
| abc-123 | 0 | V5_Q_RISK | 관리규정/작업시간/주차·양중 제한이 있나요? |
| abc-123 | 1 | V5_Q_1 | 철거는 어느 정도로 진행하나요? |
| abc-123 | 2 | V5_Q_2 | 욕실은 몇 개 공사하나요? |

**v5_question_answers**:
```sql
SELECT session_id, question_code, idx, answer_value 
FROM v5_question_answers 
WHERE session_id = 'your-session-id'
ORDER BY idx;
```

**예상 결과**:
| session_id | question_code | idx | answer_value |
|------------|---------------|-----|--------------|
| abc-123 | V5_Q_RISK | 0 | 있음 |
| abc-123 | V5_Q_1 | 1 | 부분철거 |
| abc-123 | V5_Q_2 | 2 | 2개 |

**매칭 확인**:
```sql
-- 질문-답변 매칭 확인
SELECT 
  q.session_id,
  q.question_code,
  q.question,
  a.answer_value
FROM v5_question_logs q
LEFT JOIN v5_question_answers a 
  ON q.session_id = a.session_id 
  AND q.question_code = a.question_code
WHERE q.session_id = 'your-session-id'
ORDER BY q.idx;
```

---

## 🎯 완료 판정 기준

### 필수 확인 사항

1. ✅ `v5_question_logs`에 `question_code` 저장됨
   - `V5_Q_RISK` 또는 `V5_Q_0~4`

2. ✅ `v5_question_answers`에 `question_code` 저장됨
   - 질문 로그의 `question_code`와 정확히 일치

3. ✅ 동일 `session_id`로 묶여 있음
   - 새로고침/뒤로가기 후에도 동일 세션 유지

4. ✅ 로그 실패 시 서비스 영향 없음
   - `[V5_ANSWER_LOG_ERROR]` 또는 `[V5_LOG_ERROR]` 로그는 나오지만
   - 질문 응답은 정상 반환

---

## 🧠 설계 원칙의 이유

### 1. 질문 순서 변경돼도 안전
- `question_code`는 질문 생성 시점에 결정되므로 순서 변경에 영향 없음

### 2. 리스크 질문 위치 바뀌어도 안전
- `V5_Q_RISK`는 항상 리스크 질문을 나타냄
- 위치가 바뀌어도 코드로 추적 가능

### 3. V5.1 / V6에서도 데이터 그대로 사용 가능
- `question_code` 기반으로 매칭하므로 로직 변경에 영향 없음

### 4. 특허 문장으로 바로 전환 가능
- "질문 코드 기반 자동 질문 결정 및 답변 추적 시스템"

### 5. "왜 이 견적이 나왔는지" 완전 추적 가능
- 질문-답변 매칭으로 전체 의사결정 과정 추적

---

## 📝 다음 단계 (Step B 예상)

1. **Decision Trace 분석**
   - 질문-답변 패턴 분석
   - 견적 정확도와의 상관관계 분석

2. **자동 리포트 생성**
   - 세션별 Decision Trace 리포트
   - 질문 패턴 통계

3. **특허 서술 근거**
   - Decision Trace 로그로 "자동 질문 결정 + 답변 기반 견적" 증명

---

**구현 완료** ✅


