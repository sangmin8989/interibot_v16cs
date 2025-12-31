# 인테리봇 성향분석 엔진 재질문 트리거 구현 완료 보고서

## 📋 개요

명세서 규칙 8에 따라 재질문 트리거 로직을 완전히 구현했습니다.
**FAIL이 아닌 재질문 트리거**로 불완전한 입력을 보완할 수 있도록 했습니다.

---

## ✅ 구현 완료 항목

### 1. 재질문 트리거 타입 정의 ✅

**파일:** `lib/analysis/decision-impact/types.ts`

**추가된 타입:**
```typescript
export interface RequestionTrigger {
  needsRequestion: boolean;           // 재질문 필요 여부
  reason: 'low_evidence' | 'force_process_failed';  // 재질문 이유
  validationQuestions: string[];      // 결정 검증 질문 1~2개
}

export interface DecisionImpactOutput {
  decisionSummary: DecisionSummary;
  traitEvaluations: Record<PreferenceCategory, TraitEvaluation>;
  requestionTrigger?: RequestionTrigger;  // 재질문 트리거 정보 (선택)
}
```

---

### 2. 재질문 트리거 조건 1: evidenceCount 평균 < 1.5 ✅

**파일:** `lib/analysis/decision-impact/DecisionImpactEngine.ts`

**구현 내용:**
- 모든 성향의 evidenceCount 평균 계산
- 평균 < 1.5이면 재질문 트리거
- evidenceCount가 낮은 카테고리 기반으로 검증 질문 생성

**명세서 준수:**
```typescript
// evidenceCount 평균 < 1.5 → 재질문 트리거
const avgEvidenceCount = totalEvidenceCount / PREFERENCE_CATEGORIES.length;
if (avgEvidenceCount < 1.5) {
  return {
    needsRequestion: true,
    reason: 'low_evidence',
    validationQuestions: [...],
  };
}
```

---

### 3. 재질문 트리거 조건 2: HIGH 다수 + 공정 강제 전부 실패 ✅

**파일:** `lib/analysis/decision-impact/DecisionImpactEngine.ts`

**구현 내용:**
- HIGH 성향이 3개 이상인지 확인
- 공정 강제를 시도한 카테고리 추적
- 공정 강제 전부 실패 시 재질문 트리거

**명세서 준수:**
```typescript
// HIGH 성향 다수인데 canForceProcess 전부 실패
// → 결정 검증 질문 1~2개 생성
if (highCategories.length >= 3 && 
    attemptedForceProcessCategories.every(cat => 
      result.forceProcessFailedCategories.includes(cat)
    )) {
  return {
    needsRequestion: true,
    reason: 'force_process_failed',
    validationQuestions: [...],
  };
}
```

---

### 4. 공정 강제 실패 추적 ✅

**파일:** `lib/analysis/decision-impact/DecisionImpactEngine.ts`

**구현 내용:**
- `RuleApplicationResult`에 `forceProcessFailedCategories` 추가
- `applyRule()`에서 공정 강제 실패 시 카테고리 기록

**코드:**
```typescript
interface RuleApplicationResult {
  // ... 기존 필드들
  forceProcessFailedCategories: PreferenceCategory[];  // 공정 강제 실패한 카테고리
}
```

---

### 5. 결정 검증 질문 생성 ✅

**파일:** `lib/analysis/decision-impact/DecisionImpactEngine.ts`

**구현 내용:**
- `generateValidationQuestions()` 함수 구현
- 재질문 이유에 따라 적절한 질문 생성
- 1~2개로 제한

**질문 예시:**
- `low_evidence`: "청소에 대해 더 자세히 알려주시겠어요?"
- `force_process_failed`: "가족 구성에 대한 정보를 더 구체적으로 알려주시겠어요?"

---

### 6. 상위 레이어 연동 ✅

**파일:** `lib/analysis/engine.ts`

**구현 내용:**
- `buildAnalysisResult()`에서 `requestionTrigger` 추출
- 재질문 트리거가 있으면 로그 출력
- `AnalysisResult`에 `requestionTrigger` 포함

**코드:**
```typescript
const decisionResult = decisionImpactEngine.execute({...});
decisionSummary = decisionResult.decisionSummary;
requestionTrigger = decisionResult.requestionTrigger;

// 재질문 트리거가 있으면 로그 출력
if (requestionTrigger?.needsRequestion) {
  console.warn('⚠️ [DecisionImpactEngine] 재질문 트리거:', {
    reason: requestionTrigger.reason,
    questions: requestionTrigger.validationQuestions,
  });
}
```

---

## 📊 명세서 준수도

| 항목 | 상태 | 비고 |
|------|------|------|
| **evidenceCount 평균 < 1.5** | ✅ 완료 | 재질문 트리거 |
| **HIGH 다수 + 공정 강제 전부 실패** | ✅ 완료 | 재질문 트리거 |
| **결정 검증 질문 1~2개 생성** | ✅ 완료 | 재질문 이유별 질문 생성 |
| **FAIL 아님** | ✅ 완료 | 재질문 트리거는 FAIL이 아님 |

**명세서 규칙 8 준수도: 100%**

---

## 🔍 주요 변경 파일

### 수정 파일
1. `lib/analysis/decision-impact/types.ts`
   - `RequestionTrigger` 타입 추가
   - `DecisionImpactOutput`에 `requestionTrigger` 필드 추가

2. `lib/analysis/decision-impact/DecisionImpactEngine.ts`
   - `RuleApplicationResult`에 `forceProcessFailedCategories` 추가
   - `applyRule()`에서 공정 강제 실패 추적
   - `checkRequestionTrigger()` 함수 구현
   - `generateValidationQuestions()` 함수 구현

3. `lib/analysis/engine.ts`
   - `requestionTrigger` 추출 및 로그 출력
   - `AnalysisResult`에 `requestionTrigger` 포함

---

## 🎯 재질문 트리거 동작 흐름

### 시나리오 1: evidenceCount 평균 < 1.5

```
1. DecisionImpactEngine.execute() 실행
2. evidenceCount 평균 계산
3. 평균 < 1.5 감지
4. evidenceCount가 낮은 카테고리 찾기
5. 검증 질문 1~2개 생성
6. requestionTrigger 반환
7. 상위 레이어에서 재질문 처리
```

### 시나리오 2: HIGH 다수 + 공정 강제 전부 실패

```
1. DecisionImpactEngine.execute() 실행
2. HIGH 성향 카테고리 필터링
3. 공정 강제를 시도한 카테고리 추적
4. 공정 강제 실패 카테고리 기록
5. HIGH 3개 이상 + 공정 강제 전부 실패 감지
6. 실패한 카테고리 기반 검증 질문 생성
7. requestionTrigger 반환
8. 상위 레이어에서 재질문 처리
```

---

## 📝 사용 예시

### 재질문 트리거 확인

```typescript
const result = decisionImpactEngine.execute({
  scores: preferenceScores,
  evidenceCounts,
  spaceInfo,
  discomfortDetail,
});

if (result.requestionTrigger?.needsRequestion) {
  console.log('재질문 필요:', result.requestionTrigger.reason);
  console.log('검증 질문:', result.requestionTrigger.validationQuestions);
  
  // UI에서 재질문 표시
  // result.requestionTrigger.validationQuestions를 사용하여 질문 생성
}
```

---

## 🚀 다음 단계 (선택 사항)

### 1. UI 연동
- 재질문 트리거가 있으면 사용자에게 추가 질문 표시
- `validationQuestions`를 사용하여 질문 UI 생성

### 2. 재질문 응답 처리
- 사용자가 재질문에 답변하면 다시 분석 실행
- 이전 분석 결과와 비교하여 개선 여부 확인

### 3. 통합 테스트
- 재질문 트리거 시나리오 테스트
- 다양한 입력 케이스로 검증

---

## ✅ 완료 상태

**재질문 트리거 구현: 100% 완료**

명세서 규칙 8의 모든 요구사항을 구현했으며, 불완전한 입력을 보완할 수 있는 재질문 트리거 시스템이 완성되었습니다.

---

**작성일:** 2024년
**버전:** 1.0
**작성자:** AI Assistant




