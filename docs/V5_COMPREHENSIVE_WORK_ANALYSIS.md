# V5 Ultimate 종합 작업 분석 보고서

> **작성 일시**: 2025-12-21  
> **범위**: V5 로직 반영부터 Decision Trace 완결까지  
> **목적**: 전체 작업 내용 종합 분석 및 현황 파악

---

## 📋 작업 개요

### 작업 기간
- 시작: V5 실행 지시문 분석
- 완료: Decision Trace Step 2 (견적 결과 저장)

### 작업 단계
1. **분석 단계**: 지시문 분석 및 문제점 파악
2. **구현 단계**: V5 로직 실제 반영
3. **로그 단계**: 질문 로그 Supabase 저장
4. **추적 단계**: Decision Trace 입력부 구축
5. **완결 단계**: Decision Trace 완결 (견적 결과 저장)

---

## 🔍 단계별 상세 분석

### 1단계: 지시문 분석 및 문제점 파악

#### 작업 내용
- **파일**: `docs/V5_EXECUTION_INSTRUCTION_ANALYSIS.md`
- **목적**: V5 실행 지시문의 실행 가능성 분석

#### 발견된 문제점
1. **핵심 함수 부재** (치명적)
   - `plannerAgent`, `validationAgent`, `riskAgent` 함수 없음
   - `generateNextQuestions` 함수 없음 (현재는 `generateQuestion`만 존재)
   - `buildQuestionForUI` 함수 없음

2. **함수 시그니처 불일치**
   - 지시문 요구: `generateNextQuestions({ normalizedInput, previousAnswers, round, forceReplan })`
   - 실제 함수: `generateQuestion(messages, photoAnalysis, styleResult, spaceInfo)`

3. **타입 정의 없음**
   - `PlannerResult`, `ValidationResult`, `RiskResult` 등 정의되지 않음

#### 결론
- 지시문의 80% 이상이 실행 불가능
- 원인: V5 에이전트 기반 아키텍처가 아직 구현되지 않음

#### 대응 방안
- 즉시 실행 가능: 첫 질문 봉인 해제만 진행
- 사전 구현 필요: 에이전트 함수들 구현 (2-3일 소요)

---

### 2단계: 구현 참고 자료 작성

#### 작업 내용
- **파일**: `docs/V5_IMPLEMENTATION_REFERENCE.md`
- **목적**: V5 로직 구현을 위한 정확한 코드 및 구조 정보 제공

#### 제공된 자료
1. `generateQuestion()` 전체 코드
2. 최종 return shape: `{ question: string; quickReplies: string[] } | null`
3. OpenAI 호출 부분 코드
4. 핵심 변수명 정리
5. 호출 위치 확인

#### 활용도
- 이후 모든 구현 작업의 기준 자료로 활용
- 함수 시그니처, 변수명, 호출 구조 등 정확한 정보 제공

---

### 3단계: V5 로직 실제 반영

#### 작업 내용
- **파일**: `lib/analysis/v5-ultimate/question-engine.ts`
- **목적**: V5 PRIMARY 블록 삽입 및 로컬 헬퍼 추가

#### 구현 사항

1. **첫 질문 봉인 해제**
   ```typescript
   // 삭제된 코드
   if (userMessages.length === 0) {
     return getFixedFirstQuestions();
   }
   ```
   - 첫 질문도 V5 로직으로 생성되도록 변경

2. **V5 PRIMARY 블록 삽입**
   - 위치: `missingInfoText` 체크 후
   - 기능:
     - `v5RiskLocal()`: 리스크 평가
     - `v5PlannerLocal()`: 질문 생성
     - `v5ValidateLocal()`: 검증
     - PASS 시 즉시 반환, FAIL 시 OpenAI fallback

3. **V5 로컬 헬퍼 4개 추가**
   - `isSameQuestion()`: 질문 중복 체크
   - `v5ValidateLocal()`: 질문 검증
   - `v5RiskLocal()`: 리스크 평가 및 현장 변수 질문 생성
   - `v5PlannerLocal()`: 5문항 질문 플래너

#### 개선 사항

1. **조기 종료 방지**
   ```typescript
   // 수정 전
   if (missingInfoText === '모든 정보 수집 완료') {
     return null;
   }
   
   // 수정 후
   if (missingInfoText === '모든 정보 수집 완료' && userMessages.length >= 5) {
     return null;
   }
   ```
   - V5는 5문항을 완주하는 구조이므로 조기 종료 방지

2. **리스크 질문 1회만 강제**
   ```typescript
   const shouldForceRisk = v5Index === 0; // 첫 질문에서만 강제
   ```
   - 리스크 질문이 5문항을 모두 먹어버리는 문제 해결

#### 검증 결과
- ✅ `[V5_PLANNER_RESULT]` 로그 정상 출력 (idx: 0~4)
- ✅ 첫 질문이 V5 질문으로 생성됨
- ✅ 리스크 질문은 첫 질문에서만 강제

---

### 4단계: V5 질문 로그 Supabase 저장

#### 작업 내용
- **파일**: 
  - `docs/V5_QUESTION_LOGS_TABLE.sql`
  - `app/api/v5/generate-question/route.ts`
- **목적**: V5 질문 엔진 로그를 Supabase에 저장

#### 구현 사항

1. **Supabase 테이블 생성**
   - 테이블: `v5_question_logs`
   - 컬럼: `session_id`, `idx`, `risk_level`, `question`, `quick_replies`, `messages_count`, `created_at`

2. **로그 저장 로직**
   - 질문 생성 시점에 로그 저장
   - 리스크 레벨 자동 판단 (HIGH/LOW)
   - 로그 실패해도 질문 응답 정상 반환

3. **세션 ID 관리**
   - 프론트에서 `x-session-id` 헤더로 전달
   - 없으면 서버에서 UUID 생성

#### 활용 가능한 것들
- 질문 결정 근거 추적
- 질문 패턴 vs 견적 오차 분석
- 특허 서술 근거
- V5.1 업그레이드 검증

---

### 5단계: Decision Trace Step A (질문·답변 입력부)

#### 작업 내용
- **파일**:
  - `docs/V5_DECISION_TRACE_TABLES.sql`
  - `app/api/v5/generate-question/route.ts`
  - `components/v5-ultimate/ChatOnboarding.tsx`
- **목적**: 질문-답변 추적 시스템 구축

#### 구현 사항

1. **Supabase 테이블**
   - `v5_question_logs`: `question_code` 컬럼 추가
   - `v5_question_answers`: 신규 테이블 생성

2. **question_code 시스템**
   - 질문 생성 시점에 1회만 결정
   - 답변 저장 시 새로 계산하지 않음 (프론트에서 전달받은 값 그대로 사용)
   - 프론트 → 서버 → DB까지 동일 `question_code` 전달

3. **프론트 수정**
   - `session_id` localStorage 고정
   - `currentQuestionCode` 상태 관리
   - `lastAnswer`, `lastQuestionCode` 전달

4. **서버 수정**
   - 답변 저장 로직 추가 (질문 생성 이전)
   - 질문 로그에 `question_code` 추가
   - API 응답에 `question_code` 포함

#### 설계 원칙
- ✅ `question_code`는 질문 생성 시점에 1회만 결정
- ✅ 답변 저장 시 `question_code`를 새로 계산하지 않음
- ✅ 프론트 → 서버 → DB까지 동일 `question_code` 전달
- ✅ `idx`는 보조 지표이며, JOIN 기준은 `question_code`
- ✅ 로그 실패는 서비스 흐름에 영향 없음

---

### 6단계: Decision Trace Explainer (Step A)

#### 작업 내용
- **파일**: `lib/analysis/v5-ultimate/decision-trace-explainer.ts`
- **목적**: 질문-답변 로그를 읽어 자연어 설명 생성

#### 구현 사항

1. **규칙 기반 설명 생성** (OpenAI 호출 없음)
   - `QUESTION_EXPLAIN_MAP`: 질문 코드별 설명 문장 매핑
   - 답변 값을 문장에 자연스럽게 삽입

2. **금액·수치·평수 언급 금지**
   - 모든 설명이 선택 기준만 언급
   - 숫자 없이 자연어로 설명

3. **함수 시그니처**
   ```typescript
   export async function buildDecisionTraceExplanation(
     sessionId: string
   ): Promise<{ explanation: string }>
   ```

#### 예상 출력
```
이번 견적은 다음과 같은 선택을 기준으로 산출되었습니다.

1. 관리규정, 작업시간, 주차 및 양중 조건 등 현장 제약 사항이 반영되었습니다.
2. 공사 범위는 "전체 리모델링" 기준으로 설정되었습니다.
3. 철거 범위는 "부분철거" 선택을 반영했습니다.
...
```

---

### 7단계: Decision Trace Step 2 (견적 결과 저장)

#### 작업 내용
- **파일**:
  - `docs/V5_ESTIMATE_RESULTS_TABLE.sql`
  - `app/api/estimate/v4/route.ts`
- **목적**: 견적 결과 저장 및 Decision Trace 완결

#### 구현 사항

1. **Supabase 테이블 생성**
   - 테이블: `v5_estimate_results`
   - 컬럼: `session_id`, `estimate_version`, `estimate_snapshot`, `created_at`

2. **견적 결과 저장**
   - 견적 계산 완료 직후 저장
   - `estimate_snapshot`에 전체 견적 결과 JSON 저장
   - 재계산/수정 불가 (1회 스냅샷)

3. **Decision Trace 설명 생성**
   - `buildDecisionTraceExplanation()` 호출
   - API 응답에 `decision_explanation` 포함

4. **안전한 저장**
   - try-catch로 에러 격리
   - 저장 실패해도 견적 응답 정상 반환

---

## 📊 전체 아키텍처

### 데이터 흐름

```
1. 질문 생성
   └─> v5_question_logs 저장 (question_code 포함)
   └─> API 응답에 question_code 포함

2. 답변 선택
   └─> v5_question_answers 저장 (question_code 매칭)

3. 견적 계산
   └─> v5_estimate_results 저장 (견적 스냅샷)
   └─> Decision Trace 설명 생성
   └─> API 응답에 decision_explanation 포함
```

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

## 🎯 핵심 성과

### 1. V5 질문 엔진 완성

**이전**:
- 첫 질문 고정 (AI 호출 없음)
- OpenAI 직접 호출로 질문 생성
- 질문 패턴 추적 불가능

**현재**:
- 첫 질문도 V5 로직으로 생성
- 리스크 기반 질문 자동 삽입
- 질문 로그 완전 추적 가능

### 2. Decision Trace 시스템 구축

**구성 요소**:
- 질문 로그 (`v5_question_logs`)
- 답변 로그 (`v5_question_answers`)
- 견적 결과 (`v5_estimate_results`)
- Decision Trace 설명 (자동 생성)

**효과**:
- "왜 이 견적이 나왔는지" 완전 추적 가능
- 고객 설명, 분쟁 대응, 내부 검증, 특허 문장 모두 동일 데이터로 처리

### 3. 설계 원칙 확립

**question_code 시스템**:
- 질문 생성 시점에 1회만 결정
- 답변 저장 시 새로 계산하지 않음
- 프론트 → 서버 → DB까지 동일 값 전달

**안전성**:
- 로그 실패해도 서비스 영향 없음
- 모든 저장 로직 try-catch로 격리

---

## 📈 변경된 파일 목록

### 신규 생성 파일

1. `lib/analysis/v5-ultimate/decision-trace-explainer.ts`
   - Decision Trace 설명 생성 함수

2. `docs/V5_EXECUTION_INSTRUCTION_ANALYSIS.md`
   - 지시문 분석 보고서

3. `docs/V5_IMPLEMENTATION_REFERENCE.md`
   - 구현 참고 자료

4. `docs/V5_SEQUENCE_VERIFICATION.md`
   - 로그 시퀀스 검증 문서

5. `docs/V5_QUESTION_LOGS_TABLE.sql`
   - 질문 로그 테이블 생성 SQL

6. `docs/V5_QUESTION_LOGS_IMPLEMENTATION.md`
   - 질문 로그 구현 문서

7. `docs/V5_DECISION_TRACE_ANALYSIS.md`
   - Decision Trace 분석 보고서

8. `docs/V5_DECISION_TRACE_TABLES.sql`
   - Decision Trace 테이블 생성 SQL

9. `docs/V5_DECISION_TRACE_IMPLEMENTATION.md`
   - Decision Trace 구현 문서

10. `docs/V5_DECISION_TRACE_STEP2_IMPLEMENTATION.md`
    - Decision Trace Step 2 구현 문서

11. `docs/V5_ESTIMATE_RESULTS_TABLE.sql`
    - 견적 결과 테이블 생성 SQL

### 수정된 파일

1. `lib/analysis/v5-ultimate/question-engine.ts`
   - 첫 질문 봉인 해제
   - V5 PRIMARY 블록 삽입
   - V5 로컬 헬퍼 4개 추가
   - 조기 종료 방지
   - 리스크 질문 1회만 강제

2. `app/api/v5/generate-question/route.ts`
   - Supabase 클라이언트 추가
   - 세션 ID 확보
   - 질문 로그 저장
   - 답변 저장 로직
   - question_code 결정 및 반환

3. `components/v5-ultimate/ChatOnboarding.tsx`
   - session_id localStorage 관리
   - currentQuestionCode 상태 추가
   - fetch 헤더에 x-session-id 추가
   - fetch body에 lastAnswer, lastQuestionCode 추가

4. `app/api/estimate/v4/route.ts`
   - Supabase 클라이언트 추가
   - Decision Trace Explainer import
   - 견적 결과 저장
   - Decision Trace 설명 생성 및 응답 포함

---

## 🗄️ Supabase 테이블 구조

### 1. v5_question_logs

**목적**: 질문 생성 로그

**컬럼**:
- `id`: UUID (Primary Key)
- `session_id`: TEXT (세션 ID)
- `idx`: INT (질문 순서, 0~4)
- `question_code`: TEXT (질문 코드, JOIN 기준)
- `risk_level`: TEXT (HIGH/LOW)
- `question`: TEXT (질문 텍스트)
- `quick_replies`: JSONB (빠른 답변 옵션 배열)
- `messages_count`: INT (질문 생성 시점의 메시지 총 개수)
- `created_at`: TIMESTAMPTZ (생성 시간)

**인덱스**:
- `idx_v5_question_logs_session_id`
- `idx_v5_question_logs_question_code`
- `idx_v5_question_logs_created_at`

### 2. v5_question_answers

**목적**: 답변 로그

**컬럼**:
- `id`: UUID (Primary Key)
- `session_id`: TEXT (세션 ID)
- `question_code`: TEXT (질문 코드, v5_question_logs와 매칭)
- `idx`: INT (답변 순서, 0~4)
- `answer_value`: TEXT (사용자가 선택한 값)
- `answer_type`: TEXT (기본값: 'QUICK')
- `created_at`: TIMESTAMPTZ (생성 시간)

**인덱스**:
- `idx_v5_answers_session`
- `idx_v5_answers_question_code`

### 3. v5_estimate_results

**목적**: 견적 결과 스냅샷

**컬럼**:
- `id`: UUID (Primary Key)
- `session_id`: TEXT (세션 ID)
- `estimate_version`: TEXT (기본값: 'V5')
- `estimate_snapshot`: JSONB (견적 결과 JSON 스냅샷)
- `created_at`: TIMESTAMPTZ (생성 시간)

**인덱스**:
- `idx_v5_estimate_results_session`
- `idx_v5_estimate_results_created_at`

---

## 🔄 데이터 흐름 상세

### 정상 흐름 (완전한 Decision Trace)

1. **첫 질문 생성** (userMessages.length = 0)
   ```
   프론트: loadNextQuestion() 호출
     └─> 서버: generateQuestion() 호출
         └─> V5 PRIMARY 블록 실행
             ├─> v5RiskLocal() → 리스크 평가
             ├─> v5PlannerLocal() → 질문 생성
             └─> v5ValidateLocal() → 검증
         └─> questionCode = 'V5_Q_0' 또는 'V5_Q_RISK' 결정
         └─> v5_question_logs 저장
         └─> API 응답: { question, quickReplies, question_code }
     └─> 프론트: setCurrentQuestionCode(question_code)
   ```

2. **첫 답변 선택** (사용자가 quickReply 클릭)
   ```
   프론트: handleAnswer('전체 리모델링') 호출
     └─> loadNextQuestion('전체 리모델링') 호출
         └─> 서버: POST /api/v5/generate-question
             ├─> lastAnswer: '전체 리모델링'
             ├─> lastQuestionCode: 'V5_Q_0'
             └─> v5_question_answers 저장
                 └─> question_code: 'V5_Q_0' (프론트에서 전달받은 값 그대로)
   ```

3. **두 번째 질문 생성** (userMessages.length = 1)
   ```
   서버: generateQuestion() 호출
     └─> V5 PRIMARY 블록 실행
         └─> questionCode = 'V5_Q_1' 결정
         └─> v5_question_logs 저장
         └─> API 응답: { question, quickReplies, question_code: 'V5_Q_1' }
   ```

4. **반복** (idx 0~4까지)

5. **견적 계산** (5문항 완료 후)
   ```
   프론트: POST /api/estimate/v4
     └─> 서버: calculateEstimateV4ForUI() 호출
         └─> 견적 계산 완료
         └─> v5_estimate_results 저장
             └─> estimate_snapshot: { 전체 견적 결과 JSON }
         └─> buildDecisionTraceExplanation(sessionId) 호출
             └─> v5_question_logs + v5_question_answers 읽기
             └─> 자연어 설명 생성
         └─> API 응답: { result, decision_explanation }
   ```

---

## ✅ 검증 완료 사항

### 1. V5 로직 정상 동작

- ✅ 첫 질문이 V5 질문으로 생성됨
- ✅ `[V5_PLANNER_RESULT]` 로그 정상 출력 (idx: 0~4)
- ✅ 리스크 질문은 첫 질문에서만 강제
- ✅ V5 검증 실패 시 OpenAI fallback 정상 동작

### 2. Decision Trace 입력부

- ✅ 질문 로그 저장 (`question_code` 포함)
- ✅ 답변 로그 저장 (`question_code` 매칭)
- ✅ 세션 고정 (localStorage 기반)
- ✅ 로그 실패 시 서비스 영향 없음

### 3. Decision Trace 완결부

- ✅ 견적 결과 저장 (스냅샷)
- ✅ Decision Trace 설명 생성
- ✅ API 응답에 `decision_explanation` 포함

---

## 🎯 핵심 설계 원칙 (최종 확정)

### 1. question_code 시스템

**원칙**:
- 질문 생성 시점에 1회만 결정
- 답변 저장 시 새로 계산하지 않음
- 프론트 → 서버 → DB까지 동일 값 전달

**효과**:
- 질문 순서 변경돼도 안전
- 리스크 질문 위치 바뀌어도 안전
- V5.1 / V6에서도 데이터 그대로 사용 가능

### 2. 안전성 우선

**원칙**:
- 로그 실패는 서비스 흐름에 영향 없음
- 모든 저장 로직 try-catch로 격리

**효과**:
- Supabase 연결 실패해도 서비스 정상 동작
- 고객 경험 보장

### 3. 추적 가능성

**원칙**:
- 모든 의사결정 과정 기록
- 세션별 완전한 추적 가능

**효과**:
- "왜 이 견적이 나왔는지" 완전 추적
- 고객 설명, 분쟁 대응, 내부 검증, 특허 문장 모두 동일 데이터로 처리

---

## 📊 통계 및 지표

### 생성된 파일
- **문서**: 11개
- **SQL**: 3개
- **TypeScript**: 2개 (신규 1개, 수정 1개)

### 수정된 파일
- **TypeScript**: 3개
- **총 변경 라인**: 약 500+ 라인

### Supabase 테이블
- **신규 테이블**: 2개 (`v5_question_answers`, `v5_estimate_results`)
- **수정된 테이블**: 1개 (`v5_question_logs`에 `question_code` 추가)

---

## 🔒 최종 상태

### 이전 인테리봇
- ❌ "AI가 대충 낸 견적"
- ❌ 질문 패턴 추적 불가능
- ❌ "왜 이 견적이 나왔는지" 설명 불가능

### 현재 인테리봇
- ✅ "선택 → 판단 → 결과가 기록된 시스템"
- ✅ 질문-답변-견적 완전 추적 가능
- ✅ Decision Trace 설명 자동 생성
- ✅ 고객 설명, 분쟁 대응, 내부 검증, 특허 문장 모두 동일 데이터로 처리

---

## 🎯 활용 가능한 것들

### 1. 고객 설명
- "왜 이 견적이 나왔는지" 완전 추적 가능
- Decision Trace 설명으로 자동 생성

### 2. 분쟁 대응
- 세션별 전체 의사결정 과정 기록
- 질문-답변-견적 매칭으로 명확한 근거

### 3. 내부 검증
- 견적 정확도 분석
- 질문 패턴과 견적 오차 상관관계 분석

### 4. 특허 문장
- "자동 질문 결정 + 답변 기반 견적 + Decision Trace 시스템"
- 모든 데이터가 증거로 활용 가능

### 5. V5.1 / V6 업그레이드
- `question_code` 기반으로 매칭하므로 로직 변경에 영향 없음
- 기존 데이터 그대로 사용 가능

---

## 📝 다음 단계 (권장)

### 1. Decision Trace 분석 대시보드
- 세션별 Decision Trace 시각화
- 질문 패턴 통계

### 2. 자동 리포트 생성
- 견적 정확도 리포트
- 질문-답변-견적 상관관계 분석

### 3. 특허 서술 근거
- Decision Trace 시스템 특허 문장 작성
- 증거 데이터 자동 수집

### 4. V5.1 업그레이드
- missingInfo를 플래너에 실제 활용
- 질문 순서 자동 스왑

---

## ✅ 완료 체크리스트

### V5 로직
- [x] 첫 질문 봉인 해제
- [x] V5 PRIMARY 블록 삽입
- [x] V5 로컬 헬퍼 4개 추가
- [x] 조기 종료 방지
- [x] 리스크 질문 1회만 강제

### 로그 저장
- [x] 질문 로그 Supabase 저장
- [x] 답변 로그 Supabase 저장
- [x] 견적 결과 Supabase 저장

### Decision Trace
- [x] question_code 시스템 구축
- [x] 세션 고정 (localStorage)
- [x] Decision Trace 설명 생성
- [x] API 응답에 decision_explanation 포함

### 안전성
- [x] 로그 실패 시 서비스 영향 없음
- [x] 모든 저장 로직 try-catch로 격리

---

## 🎉 최종 결론

### 성과
1. **V5 질문 엔진 완성**: 첫 질문부터 V5 로직으로 생성
2. **Decision Trace 시스템 구축**: 질문-답변-견적 완전 추적
3. **설계 원칙 확립**: question_code 시스템으로 안정성 확보

### 변화
- **이전**: "AI가 대충 낸 견적"
- **현재**: "선택 → 판단 → 결과가 기록된 시스템"

### 활용
- 고객 설명, 분쟁 대응, 내부 검증, 특허 문장 모두 동일 데이터로 처리 가능

---

**작업 완료** ✅


