# V5 실행 지시문 분석 및 문제점 파악

> **분석 일시**: 2025-01-21  
> **상태**: 지시문 실행 불가능 - 필수 구성요소 누락

---

## 🔍 지시문 요구사항 요약

지시문은 다음 7가지 작업을 요구합니다:

1. **첫 질문 봉인 완전 해제**: `if (userMessages.length === 0) { return getFixedFirstQuestions(); }` 삭제
2. **플래너 에이전트 실제 호출 삽입**: `plannerAgent()` 호출 추가
3. **질문 생성 소스 강제 전환**: `filterAndRankQuestions`, `fallbackQuestions` 제거하고 `plannerResult.questions`만 사용
4. **검증 에이전트 FAIL 시 즉시 중단**: `validationAgent()` 호출 및 FAIL 처리
5. **FAIL 수신 시 질문 재생성 연결**: `generateNextQuestions()` 재귀 호출
6. **리스크 에이전트 질문 강제 삽입**: `riskAgent()` 호출 및 질문 병합
7. **실행 검증 기준**: 콘솔 로그 `[V5_PLANNER_RESULT]` 확인

---

## ❌ 발견된 문제점

### 1. **핵심 함수들이 존재하지 않음** 🔴 **치명적**

#### 1.1 `plannerAgent` 함수 없음
- **지시문 요구**: `plannerAgent({ normalizedInput, previousAnswers, round: currentRound })`
- **현재 상태**: 함수가 코드베이스에 존재하지 않음
- **위치**: `lib/analysis/v5-ultimate/` 디렉토리에 없음
- **영향도**: 🔴 **치명적** - 지시문의 핵심 로직이 실행 불가능

#### 1.2 `validationAgent` 함수 없음
- **지시문 요구**: `validationAgent(plannerResult)` 호출
- **현재 상태**: 함수가 코드베이스에 존재하지 않음
- **위치**: `lib/analysis/v5-ultimate/validation-agent.ts` 파일 없음
- **영향도**: 🔴 **치명적** - 검증 로직 실행 불가능

#### 1.3 `riskAgent` 함수 없음
- **지시문 요구**: `riskAgent()` 호출 및 `risk.requiredQuestion` 사용
- **현재 상태**: 함수가 코드베이스에 존재하지 않음
- **위치**: `lib/analysis/v5-ultimate/risk-agent.ts` 파일 없음
- **영향도**: 🔴 **치명적** - 리스크 평가 로직 실행 불가능

---

### 2. **함수명 불일치** 🔴 **치명적**

#### 2.1 `generateNextQuestions` vs `generateQuestion`
- **지시문 요구**: `generateNextQuestions(...)` 함수
- **현재 상태**: `generateQuestion(...)` 함수만 존재
- **위치**: `lib/analysis/v5-ultimate/question-engine.ts:163`
- **함수 시그니처 차이**:
  ```typescript
  // 지시문이 요구하는 형태 (추정)
  generateNextQuestions({
    normalizedInput,
    previousAnswers,
    round: currentRound,
    forceReplan?: boolean
  })
  
  // 현재 실제 함수
  generateQuestion(
    messages: ChatMessage[],
    photoAnalysis: PhotoAnalysisResult | null,
    styleResult?: {...} | null,
    spaceInfo?: {...} | null
  )
  ```
- **영향도**: 🔴 **치명적** - 함수 호출 불가능

---

### 3. **존재하지 않는 함수 호출** 🔴 **치명적**

#### 3.1 `filterAndRankQuestions` 함수 없음
- **지시문 요구**: `filterAndRankQuestions(...)` 제거
- **현재 상태**: 함수가 코드베이스에 존재하지 않음
- **영향도**: 🟡 **중간** - 제거할 대상이 없음 (작업 불필요)

#### 3.2 `fallbackQuestions` 함수 없음
- **지시문 요구**: `fallbackQuestions(...)` 제거
- **현재 상태**: `getFallbackQuestion()` 함수는 존재하지만 `fallbackQuestions()`는 없음
- **위치**: `lib/analysis/v5-ultimate/question-engine.ts:275`
- **영향도**: 🟡 **중간** - 제거할 대상이 없음 (작업 불필요)

#### 3.3 `buildQuestionForUI` 함수 없음
- **지시문 요구**: `plannerResult.questions.map(q => buildQuestionForUI(q))`
- **현재 상태**: 함수가 코드베이스에 존재하지 않음
- **영향도**: 🔴 **치명적** - 질문 변환 로직 실행 불가능

---

### 4. **파라미터 구조 불일치** 🔴 **치명적**

#### 4.1 `normalizedInput`, `previousAnswers`, `currentRound` 없음
- **지시문 요구**: 
  ```typescript
  const plannerResult = plannerAgent({
    normalizedInput,
    previousAnswers,
    round: currentRound,
  });
  ```
- **현재 상태**: 
  - `normalizedInput` 변수 없음
  - `previousAnswers` 변수 없음
  - `currentRound` 변수 없음
- **영향도**: 🔴 **치명적** - 함수 호출 시 파라미터 전달 불가능

#### 4.2 `forceReplan` 파라미터 없음
- **지시문 요구**: `generateNextQuestions({ ...params, forceReplan: true })`
- **현재 상태**: `generateQuestion` 함수에 `forceReplan` 파라미터 없음
- **영향도**: 🔴 **치명적** - 재생성 로직 실행 불가능

---

### 5. **타입 구조 불일치** 🔴 **치명적**

#### 5.1 `plannerResult` 타입 정의 없음
- **지시문 요구**: `plannerResult.questions`, `plannerResult`를 `validationAgent`에 전달
- **현재 상태**: `plannerResult` 타입이 `types.ts`에 정의되어 있지 않음
- **영향도**: 🔴 **치명적** - 타입 에러 발생

#### 5.2 `validation` 결과 타입 없음
- **지시문 요구**: `validation.result === 'FAIL'`, `validation.reason`, `validation.fix`
- **현재 상태**: 해당 타입 정의 없음
- **영향도**: 🔴 **치명적** - 타입 에러 발생

#### 5.3 `risk` 결과 타입 없음
- **지시문 요구**: `risk.level === 'HIGH'`, `risk.requiredQuestion`
- **현재 상태**: 해당 타입 정의 없음
- **영향도**: 🔴 **치명적** - 타입 에러 발생

---

### 6. **현재 코드 구조와의 불일치** 🟡 **중간**

#### 6.1 첫 질문 봉인 로직 위치
- **지시문 요구**: `lib/analysis/v5-ultimate/question-engine.ts`에서 삭제
- **현재 상태**: 
  ```typescript
  // 182-184번 라인
  if (userMessages.length === 0) {
    return getFixedFirstQuestions();
  }
  ```
- **영향도**: 🟢 **낮음** - 이 부분은 삭제 가능 (단, 다른 로직과의 연계 필요)

#### 6.2 질문 생성 로직 구조
- **지시문 요구**: `plannerResult.questions`만 사용
- **현재 상태**: OpenAI API 직접 호출로 질문 생성 (`openai.chat.completions.create`)
- **영향도**: 🔴 **높음** - 전체 로직 구조 변경 필요

---

## 📊 문제점 요약표

| 문제점 | 위치 | 영향도 | 우선순위 | 실행 가능 여부 |
|--------|------|--------|----------|----------------|
| `plannerAgent` 함수 없음 | - | 🔴 치명적 | 1 | ❌ 불가능 |
| `validationAgent` 함수 없음 | - | 🔴 치명적 | 1 | ❌ 불가능 |
| `riskAgent` 함수 없음 | - | 🔴 치명적 | 1 | ❌ 불가능 |
| `generateNextQuestions` 함수 없음 | - | 🔴 치명적 | 1 | ❌ 불가능 |
| `buildQuestionForUI` 함수 없음 | - | 🔴 치명적 | 1 | ❌ 불가능 |
| 파라미터 구조 불일치 | `question-engine.ts` | 🔴 치명적 | 1 | ❌ 불가능 |
| 타입 정의 없음 | `types.ts` | 🔴 치명적 | 1 | ❌ 불가능 |
| `filterAndRankQuestions` 없음 | - | 🟡 중간 | 2 | ✅ 불필요 |
| `fallbackQuestions` 없음 | - | 🟡 중간 | 2 | ✅ 불필요 |
| 첫 질문 봉인 로직 | `question-engine.ts:182` | 🟢 낮음 | 3 | ✅ 가능 |

---

## 🎯 근본 원인

**핵심 문제**: 지시문이 요구하는 V5 에이전트 기반 아키텍처가 **아직 구현되지 않았습니다**.

### 현재 아키텍처
```
generateQuestion()
  ├─ OpenAI API 직접 호출
  ├─ 고정 첫 질문 반환
  └─ Fallback 질문 사용
```

### 지시문이 요구하는 아키텍처
```
generateNextQuestions()
  ├─ plannerAgent() 호출
  ├─ validationAgent() 호출
  ├─ riskAgent() 호출
  └─ plannerResult.questions 사용
```

**결론**: 지시문은 **미래의 아키텍처**를 가정하고 작성되었으며, 현재 코드베이스와는 **완전히 다른 구조**입니다.

---

## 💡 해결 방안

### 방안 1: 지시문 실행 전 필수 구성요소 구현 (권장)

**필수 작업**:
1. `plannerAgent` 함수 구현
   - 위치: `lib/analysis/v5-ultimate/planner-agent.ts`
   - 입력: `{ normalizedInput, previousAnswers, round }`
   - 출력: `{ questions: Question[] }`

2. `validationAgent` 함수 구현
   - 위치: `lib/analysis/v5-ultimate/validation-agent.ts`
   - 입력: `plannerResult`
   - 출력: `{ result: 'PASS' | 'FAIL', reason?: string, fix?: string }`

3. `riskAgent` 함수 구현
   - 위치: `lib/analysis/v5-ultimate/risk-agent.ts`
   - 입력: (추정) `{ plannerResult, context }`
   - 출력: `{ level: 'LOW' | 'MEDIUM' | 'HIGH', requiredQuestion?: Question }`

4. `generateNextQuestions` 함수 구현
   - 위치: `lib/analysis/v5-ultimate/question-engine.ts`
   - 기존 `generateQuestion`을 확장하거나 새로 작성

5. 타입 정의 추가
   - 위치: `lib/analysis/v5-ultimate/types.ts`
   - `PlannerResult`, `ValidationResult`, `RiskResult` 등

6. `buildQuestionForUI` 함수 구현
   - 위치: `lib/analysis/v5-ultimate/question-engine.ts`
   - `Question` → `{ question: string, quickReplies: string[] }` 변환

**예상 작업 시간**: 2-3일 (에이전트 로직 복잡도에 따라)

---

### 방안 2: 지시문 수정 (현재 코드베이스에 맞게)

**수정 사항**:
1. `generateNextQuestions` → `generateQuestion`으로 변경
2. `plannerAgent` 호출 제거 또는 주석 처리
3. `validationAgent`, `riskAgent` 호출 제거 또는 주석 처리
4. 기존 OpenAI API 호출 로직 유지
5. 첫 질문 봉인 해제만 실행

**장점**: 즉시 실행 가능  
**단점**: 지시문의 의도(V5 에이전트 기반 로직)를 반영하지 못함

---

### 방안 3: 하이브리드 접근

**단계별 실행**:
1. **1단계**: 첫 질문 봉인 해제만 실행 (즉시 가능)
2. **2단계**: 에이전트 함수들 구현 (2-3일)
3. **3단계**: 지시문 나머지 작업 실행

**장점**: 점진적 개선 가능  
**단점**: 시간 소요

---

## ✅ 실행 가능한 작업 (즉시 실행 가능)

다음 작업만은 **지금 바로 실행 가능**합니다:

### 작업 1: 첫 질문 봉인 해제
```typescript
// lib/analysis/v5-ultimate/question-engine.ts:182-184
// 삭제할 코드:
if (userMessages.length === 0) {
  return getFixedFirstQuestions();
}
```

**주의사항**: 
- 삭제 후 첫 질문도 AI로 생성됨
- `getFixedFirstQuestions()` 함수는 유지 (fallback에서 사용 가능)

---

## 🔴 실행 불가능한 작업

다음 작업들은 **필수 구성요소가 없어 실행 불가능**합니다:

1. ❌ 플래너 에이전트 호출 (`plannerAgent` 함수 없음)
2. ❌ 검증 에이전트 호출 (`validationAgent` 함수 없음)
3. ❌ 리스크 에이전트 호출 (`riskAgent` 함수 없음)
4. ❌ `generateNextQuestions` 재귀 호출 (함수 없음)
5. ❌ `plannerResult.questions` 사용 (타입 및 데이터 구조 없음)
6. ❌ `buildQuestionForUI` 사용 (함수 없음)

---

## 📌 권장 사항

### 즉시 실행 가능
1. ✅ 첫 질문 봉인 해제 (작업 1번만)

### 사전 구현 필요
2. ⚠️ 에이전트 함수들 구현 후 나머지 작업 실행

### 최종 확인
3. ✅ `[V5_PLANNER_RESULT]` 로그 확인 (에이전트 구현 후)

---

## 🎯 결론

**현재 상태**: 지시문의 **80% 이상이 실행 불가능**합니다.

**이유**: 
- 핵심 함수들(`plannerAgent`, `validationAgent`, `riskAgent`)이 존재하지 않음
- 함수 시그니처와 파라미터 구조가 완전히 다름
- 타입 정의가 없음

**권장 조치**:
1. **즉시**: 첫 질문 봉인 해제만 실행
2. **다음 단계**: 에이전트 함수들 구현 (2-3일 소요)
3. **최종**: 지시문 나머지 작업 실행

**대안**: 지시문을 현재 코드베이스 구조에 맞게 수정

---

**문서 끝**


