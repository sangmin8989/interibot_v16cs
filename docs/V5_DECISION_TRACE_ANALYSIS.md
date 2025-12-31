# V5 Decision Trace 구현 지시문 분석 보고서

> **분석 일시**: 2025-01-21  
> **목적**: V5 Decision Trace Step A (답변 저장) 구현 지시문 분석 및 구현 가이드

---

## 📋 작업 내용 요약

### 목표
V5 질문-답변 추적 시스템 구축 (Decision Trace의 "입력부" 완성)

### 범위
- ✅ 프론트 1개 파일 수정: `components/v5-ultimate/ChatOnboarding.tsx`
- ✅ API Route 1개 파일 수정: `app/api/v5/generate-question/route.ts`
- ✅ Supabase 테이블 2개: `v5_question_logs` (수정), `v5_question_answers` (신규)

### 제약사항
- ❌ 새 API 만들지 않음
- ❌ 기존 견적 로직 손대지 않음
- ✅ Supabase 테이블은 이미 만든 것만 사용

---

## 🔍 작업 상세 분석

### 1️⃣ 프론트: session_id 고정 발급 + 헤더 전송

#### 작업 A) session_id localStorage 관리 함수 추가

**위치**: `components/v5-ultimate/ChatOnboarding.tsx`

**추가할 코드**:
```typescript
// V5 Decision Trace session id (localStorage 고정)
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

**삽입 위치**: 컴포넌트 최상단 또는 `useEffect` 상단

**효과**:
- 새로고침/뒤로가기/재접속에도 동일 세션 유지
- localStorage 기반 영구 저장

#### 작업 B) fetch 헤더에 session_id 추가

**현재 코드** (47-61번 라인):
```typescript
const response = await fetch('/api/v5/generate-question', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... }),
});
```

**수정 후**:
```typescript
const sessionId = getV5SessionId();

const response = await fetch('/api/v5/generate-question', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-session-id': sessionId ?? '',
  },
  body: JSON.stringify({ ... }),
});
```

**위치**: `loadNextQuestion` 함수 내부

---

### 2️⃣ 서버: 질문 로그에 question_code 추가

#### 작업 A) v5_question_logs 테이블에 question_code 컬럼 추가

**필수 작업**: Supabase SQL Editor에서 실행

```sql
-- v5_question_logs 테이블에 question_code 컬럼 추가
ALTER TABLE v5_question_logs 
ADD COLUMN IF NOT EXISTS question_code text;

-- 인덱스 추가 (question_code로 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_v5_question_logs_question_code 
ON v5_question_logs(question_code);
```

#### 작업 B) 로그 insert에 question_code 추가

**현재 코드** (60-67번 라인):
```typescript
await supabase.from('v5_question_logs').insert({
  session_id: sessionId,
  idx: userMessagesCount,
  risk_level: riskLevel,
  question: result.question,
  quick_replies: result.quickReplies,
  messages_count: chatMessages.length,
});
```

**수정 후**:
```typescript
const questionCode =
  riskLevel === 'HIGH'
    ? 'V5_Q_RISK'
    : `V5_Q_${userMessagesCount}`;

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

**효과**:
- 질문 문구가 바뀌어도 코드로 추적 가능
- 리스크 질문: `V5_Q_RISK`
- 일반 질문: `V5_Q_0`, `V5_Q_1`, `V5_Q_2`, `V5_Q_3`, `V5_Q_4`

---

### 3️⃣ 서버: 답변 저장 (v5_question_answers) 연결

#### 작업 A) 요청 body에서 lastAnswer 받기

**현재 코드** (16-31번 라인):
```typescript
const { 
  messages, 
  photoAnalysis,
  styleResult,
  spaceInfo
} = body;
```

**수정 후**:
```typescript
const { 
  messages, 
  photoAnalysis,
  styleResult,
  spaceInfo,
  lastAnswer
} = body;
```

#### 작업 B) 답변 저장 로직 추가

**삽입 위치**: 질문 엔진 호출 이전, try-catch 블록 내부

**추가할 코드**:
```typescript
// ===== V5 ANSWER LOG =====
if (lastAnswer && sessionId) {
  try {
    const userCount = chatMessages.filter(m => m.role === 'user').length;

    const questionCode =
      userCount === 0
        ? 'V5_Q_START'
        : `V5_Q_${userCount - 1}`;

    await supabase.from('v5_question_answers').insert({
      session_id: sessionId,
      question_code: questionCode,
      idx: userCount - 1,
      answer_value: lastAnswer,
      answer_type: 'QUICK',
    });
  } catch (e) {
    console.error('[V5_ANSWER_LOG_ERROR]', e);
  }
}
// ===== /V5 ANSWER LOG =====
```

**주의사항**:
- 로그 실패해도 질문 생성 흐름 절대 영향 없음
- try-catch로 감싸서 에러 격리

---

### 4️⃣ 프론트: lastAnswer 전달

#### 작업: fetch body에 lastAnswer 추가

**현재 코드** (50-60번 라인):
```typescript
body: JSON.stringify({
  messages,
  photoAnalysis,
  styleResult,
  spaceInfo: spaceInfo ? {
    housingType: spaceInfo.housingType,
    pyeong: spaceInfo.pyeong,
    rooms: spaceInfo.rooms,
    bathrooms: spaceInfo.bathrooms,
  } : null,
}),
```

**수정 후**:
```typescript
body: JSON.stringify({
  messages,
  photoAnalysis,
  styleResult,
  spaceInfo: spaceInfo ? {
    housingType: spaceInfo.housingType,
    pyeong: spaceInfo.pyeong,
    rooms: spaceInfo.rooms,
    bathrooms: spaceInfo.bathrooms,
  } : null,
  lastAnswer: answer, // 사용자가 클릭한 값
}),
```

**위치**: `loadNextQuestion` 함수 내부

**문제점**: `loadNextQuestion` 함수에는 `answer` 변수가 없음

**해결 방법**: `handleAnswer` 함수에서 `loadNextQuestion` 호출 시 `answer` 전달 필요

**수정 필요**:
```typescript
// handleAnswer 함수 수정
const handleAnswer = async (answer: string) => {
  // ... 기존 코드 ...
  
  // 다음 질문 로드 (answer 전달)
  await loadNextQuestion(answer);
};

// loadNextQuestion 함수 시그니처 수정
const loadNextQuestion = async (lastAnswer?: string) => {
  // ... 기존 코드 ...
  
  body: JSON.stringify({
    // ... 기존 필드들 ...
    lastAnswer: lastAnswer, // 추가
  }),
};
```

---

## 🗄️ Supabase 테이블 스키마

### 1. v5_question_logs (수정)

**추가 컬럼**:
- `question_code`: TEXT (질문 코드)

**예상 값**:
- `V5_Q_RISK`: 리스크 질문
- `V5_Q_0`, `V5_Q_1`, `V5_Q_2`, `V5_Q_3`, `V5_Q_4`: 일반 질문

### 2. v5_question_answers (신규)

**테이블 생성 SQL**:
```sql
create table if not exists v5_question_answers (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  question_code text not null,
  idx int not null,
  answer_value text not null,
  answer_type text not null default 'QUICK',
  created_at timestamptz not null default now()
);

-- 인덱스 추가
create index if not exists idx_v5_question_answers_session_id 
on v5_question_answers(session_id);
create index if not exists idx_v5_question_answers_question_code 
on v5_question_answers(question_code);
```

**컬럼 설명**:
- `session_id`: 세션 ID (v5_question_logs와 동일)
- `question_code`: 질문 코드 (v5_question_logs와 매칭)
- `idx`: 답변 순서 (0~4)
- `answer_value`: 사용자가 선택한 값 (quickReply text)
- `answer_type`: 답변 타입 (기본값: 'QUICK')

---

## ⚠️ 잠재적 문제점 및 해결 방안

### 문제 1: 프론트에서 lastAnswer 전달 위치

**문제**:
- `loadNextQuestion` 함수에는 `answer` 변수가 없음
- `handleAnswer`에서 `answer`를 받지만 `loadNextQuestion` 호출 시 전달 안 됨

**해결**:
- `loadNextQuestion` 함수 시그니처에 `lastAnswer?: string` 파라미터 추가
- `handleAnswer`에서 `loadNextQuestion(answer)` 호출

### 문제 2: 첫 질문 생성 시 lastAnswer 없음

**문제**:
- 초기 질문 생성 시 (`useEffect`에서 호출) `lastAnswer`가 없음
- 서버에서 `lastAnswer`가 없으면 답변 저장 스킵해야 함

**해결**:
- 서버 로직에서 `if (lastAnswer && sessionId)` 조건으로 처리 (이미 지시문에 포함)

### 문제 3: question_code 매칭 불일치 가능성

**문제**:
- 질문 로그의 `question_code`와 답변 로그의 `question_code`가 불일치할 수 있음
- 예: 질문은 `V5_Q_0`인데 답변은 `V5_Q_START`로 저장

**해결**:
- 지시문의 로직 확인:
  - 질문 로그: `riskLevel === 'HIGH' ? 'V5_Q_RISK' : 'V5_Q_${userMessagesCount}'`
  - 답변 로그: `userCount === 0 ? 'V5_Q_START' : 'V5_Q_${userCount - 1}'`
- **불일치 발생**: 첫 질문(idx: 0) 생성 시
  - 질문 로그: `V5_Q_0` (userMessagesCount = 0)
  - 답변 로그: `V5_Q_START` (userCount = 0)
- **해결 방안**: 답변 로직을 질문 로직과 일치시키기
  ```typescript
  const questionCode =
    userCount === 0
      ? (riskLevel === 'HIGH' ? 'V5_Q_RISK' : 'V5_Q_0')
      : `V5_Q_${userCount - 1}`;
  ```

### 문제 4: localStorage 사용 시 SSR 이슈

**문제**:
- `typeof window === 'undefined'` 체크는 있지만, 초기 렌더링 시 `null` 반환 가능

**해결**:
- `getV5SessionId()` 호출 시 `null` 체크 필요
- 헤더 전송 시 `sessionId ?? ''`로 처리 (이미 지시문에 포함)

---

## ✅ 구현 체크리스트

### Supabase 테이블

- [ ] `v5_question_logs` 테이블에 `question_code` 컬럼 추가
- [ ] `v5_question_answers` 테이블 생성
- [ ] 인덱스 추가 (세션별, question_code별)

### 프론트 (ChatOnboarding.tsx)

- [ ] `getV5SessionId()` 함수 추가
- [ ] `loadNextQuestion` 함수에 `lastAnswer` 파라미터 추가
- [ ] fetch 헤더에 `x-session-id` 추가
- [ ] fetch body에 `lastAnswer` 추가
- [ ] `handleAnswer`에서 `loadNextQuestion(answer)` 호출

### 서버 (route.ts)

- [ ] 요청 body에서 `lastAnswer` 받기
- [ ] 답변 저장 로직 추가 (질문 생성 이전)
- [ ] 질문 로그에 `question_code` 추가
- [ ] 로그 실패 시 에러 처리 (try-catch)

---

## 🎯 검증 방법

### 1. Supabase에서 확인

**v5_question_logs**:
- `session_id` 동일한지 확인
- `idx` 0~4 순서대로 있는지 확인
- `question_code`: `V5_Q_RISK` 또는 `V5_Q_0~4`

**v5_question_answers**:
- 같은 `session_id`인지 확인
- `question_code`와 `idx`가 질문 로그와 매칭되는지 확인
- `answer_value` 저장되었는지 확인

### 2. 세션 유지 확인

- 새로고침 후에도 동일 `session_id` 사용되는지 확인
- localStorage에 `v5_session_id` 저장되었는지 확인

### 3. 로그 실패 시 서비스 영향 확인

- Supabase 연결 끊기 (임시로 URL 잘못 설정)
- 질문 생성 API 호출
- `[V5_ANSWER_LOG_ERROR]` 로그는 나오지만 질문 응답은 정상 반환되는지 확인

---

## 📊 예상 데이터 구조

### v5_question_logs

| session_id | idx | question_code | risk_level | question |
|------------|-----|---------------|------------|----------|
| abc-123 | 0 | V5_Q_RISK | HIGH | 관리규정/작업시간/주차·양중 제한이 있나요? |
| abc-123 | 1 | V5_Q_1 | LOW | 철거는 어느 정도로 진행하나요? |
| abc-123 | 2 | V5_Q_2 | LOW | 욕실은 몇 개 공사하나요? |

### v5_question_answers

| session_id | question_code | idx | answer_value | answer_type |
|------------|---------------|-----|--------------|-------------|
| abc-123 | V5_Q_RISK | 0 | 있음 | QUICK |
| abc-123 | V5_Q_1 | 1 | 부분철거 | QUICK |
| abc-123 | V5_Q_2 | 2 | 2개 | QUICK |

---

## 🎯 완료 기준

### 필수 확인 사항

1. ✅ 질문 로그 저장 (question_code 포함)
2. ✅ 답변 로그 저장 (question_code 매칭)
3. ✅ 세션 고정 (localStorage 기반)
4. ✅ 로그 실패 시 서비스 영향 없음

### Decision Trace "입력부" 완성

- 질문 로그 ✅
- 답변 로그 ✅
- 세션 고정 ✅
- 질문-답변 매칭 (question_code) ✅

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

**분석 완료** ✅


