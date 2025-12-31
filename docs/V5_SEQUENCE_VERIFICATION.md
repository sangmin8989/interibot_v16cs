# V5 로그 시퀀스 검증 및 잠재적 문제점

> **검증 일시**: 2025-01-21  
> **목적**: V5_PLANNER_RESULT 로그 시퀀스와 완료 응답 확인

---

## ✅ 정상 시퀀스 (예상)

### 1번째 호출 (userMessages.length = 0)
```
[V5_PLANNER_RESULT] { idx: 0, risk: 'HIGH'|'LOW', question: '...', quickReplies: [...] }
→ return { question: '...', quickReplies: [...] }
```

### 2번째 호출 (userMessages.length = 1)
```
[V5_PLANNER_RESULT] { idx: 1, risk: 'LOW', question: '...', quickReplies: [...] }
→ return { question: '...', quickReplies: [...] }
```

### 3번째 호출 (userMessages.length = 2)
```
[V5_PLANNER_RESULT] { idx: 2, risk: 'LOW', question: '...', quickReplies: [...] }
→ return { question: '...', quickReplies: [...] }
```

### 4번째 호출 (userMessages.length = 3)
```
[V5_PLANNER_RESULT] { idx: 3, risk: 'LOW', question: '...', quickReplies: [...] }
→ return { question: '...', quickReplies: [...] }
```

### 5번째 호출 (userMessages.length = 4)
```
[V5_PLANNER_RESULT] { idx: 4, risk: 'LOW', question: '...', quickReplies: [...] }
→ return { question: '...', quickReplies: [...] }
```

### 6번째 호출 (userMessages.length = 5) - 완료
```
→ return null (V5 PRIMARY 블록 도달 전에 조기 종료)
→ API 응답: { success: true, question: null, quickReplies: [], isComplete: true }
```

---

## ⚠️ 잠재적 문제점

### 문제 1: V5 검증 실패 시 로그 누락 가능성

**위치**: `question-engine.ts:223-231`

**현재 로직**:
```typescript
const v5Validation = v5ValidateLocal(v5Candidate);

if (v5Validation.result === 'PASS') {
  return v5Candidate; // 로그는 이미 출력됨 (216-221)
}

console.log('[V5_VALIDATION_FAIL]', v5Validation);
// OpenAI fallback 진행
```

**문제 시나리오**:
- V5 검증이 FAIL이면 `[V5_PLANNER_RESULT]` 로그는 이미 출력되었지만
- 실제 반환은 OpenAI 생성 질문이 됨
- 이 경우 로그와 실제 질문이 불일치할 수 있음

**영향도**: 🟡 **중간** (검증 로직이 안정적이면 발생 확률 낮음)

---

### 문제 2: missingInfoText 조기 종료 조건 중복

**위치**: `question-engine.ts:187-189`

**현재 로직**:
```typescript
if (missingInfoText === '모든 정보 수집 완료' && userMessages.length >= 5) {
  return null;
}
```

**분석**:
- `userMessages.length >= 5`면 이미 177-179에서 `return null` 처리됨
- 따라서 이 조건은 사실상 중복 (도달 불가능)

**영향도**: 🟢 **낮음** (중복이지만 문제 없음)

---

### 문제 3: V5 검증 실패 시 OpenAI 호출 경로

**위치**: `question-engine.ts:230-232`

**현재 로직**:
```typescript
console.log('[V5_VALIDATION_FAIL]', v5Validation);
// FAIL이면 기존 로직(OpenAI 생성)로 자연스럽게 fallback 진행
```

**문제 시나리오**:
- V5 검증이 FAIL이면 OpenAI 호출로 fallback
- 이 경우 `[V5_PLANNER_RESULT]` 로그는 나왔지만 실제 질문은 OpenAI 생성
- 로그와 실제 질문 불일치 가능

**영향도**: 🟡 **중간** (검증 로직이 안정적이면 발생 확률 낮음)

---

## 🔍 실제 검증 체크리스트

### 필수 확인 사항

1. **로그 시퀀스 확인**
   - [ ] `[V5_PLANNER_RESULT] idx: 0` 출력
   - [ ] `[V5_PLANNER_RESULT] idx: 1` 출력
   - [ ] `[V5_PLANNER_RESULT] idx: 2` 출력
   - [ ] `[V5_PLANNER_RESULT] idx: 3` 출력
   - [ ] `[V5_PLANNER_RESULT] idx: 4` 출력
   - [ ] `[V5_PLANNER_RESULT] idx: 5`는 **출력되지 않아야 함**

2. **완료 응답 확인**
   - [ ] 6번째 호출 시 `result === null` 반환
   - [ ] API 응답: `{ success: true, question: null, quickReplies: [], isComplete: true }`

3. **로그와 실제 질문 일치 확인**
   - [ ] 각 로그의 `question`이 실제 반환된 질문과 일치
   - [ ] `[V5_VALIDATION_FAIL]` 로그가 나오지 않음 (정상 시)

---

## 💡 선택적 보강 사항 (권장)

### ① 리스크 질문 중복 방지 강화

**현재**: `v5Index === 0`으로만 차단

**개선안**: messages에 이미 같은 질문이 있으면 스킵

```typescript
function hasRiskQuestionBeenAsked(messages: ChatMessage[]): boolean {
  const riskKeywords = ['관리규정', '양중', '주차', '작업시간'];
  return messages.some(m => 
    m.role === 'user' && 
    riskKeywords.some(keyword => m.content.includes(keyword))
  );
}

// V5 PRIMARY 블록에서
const shouldForceRisk = 
  v5Index === 0 && 
  !hasRiskQuestionBeenAsked(messages);
```

**우선순위**: 🟡 **중간** (지금 안 해도 됨, 나중에 질문 순서 변경 시 필요)

---

### ② V5 질문 로그 저장 (다음 단계 핵심)

**현재**: 콘솔 로그만 존재 (날아감)

**필요한 데이터**:
- 세션ID
- idx (0~4)
- question
- quickReplies
- risk level
- validation result

**저장 위치 제안**:
- DB 테이블: `v5_question_logs`
- 또는 파일 로그: `logs/v5-questions/{sessionId}.json`

**용도**:
- "왜 이 질문이 나왔지?" 추적
- 특허 서술 근거 자료
- 질문 품질 분석

**우선순위**: 🔴 **높음** (다음 단계에서 반드시 필요)

---

### ③ missingInfo를 플래너에 실제 활용

**현재**: missingInfo는 판단에만 사용, 플래너는 순차 고정형

**개선 방향**:
```typescript
function v5PlannerLocal(input: {
  questionIndex: number;
  spaceInfo: {...} | null;
  styleResult: {...} | null;
  missingInfo?: MissingInfo; // 추가
}): V5QuestionShape {
  // missingInfo에 따라 질문 순서 스왑
  // 예: 욕실 정보 없으면 욕실 질문을 idx 앞당김
  // 예: 주방 제외 선택하면 주방 질문 스킵
}
```

**우선순위**: 🟢 **낮음** (V5.1 업그레이드, 지금 급하지 않음)

---

## ✅ 결론

### 정상 동작 확인 포인트

1. **로그 시퀀스**: idx 0~4까지 정상 출력
2. **완료 응답**: 6번째 호출 시 `isComplete: true` 정상 반환
3. **로그-질문 일치**: 각 로그의 질문이 실제 반환과 일치

### 잠재적 문제

- V5 검증 실패 시 로그와 실제 질문 불일치 가능 (확률 낮음)
- missingInfoText 조기 종료 조건 중복 (문제 없음)

### 다음 단계 권장 사항

1. **즉시**: 실제 세션에서 로그 시퀀스 확인
2. **다음 단계**: V5 질문 로그 저장 기능 구현
3. **향후**: 리스크 질문 중복 방지 강화, missingInfo 활용

---

**문서 끝**


