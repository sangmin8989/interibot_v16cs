# 화면 이동 순서 변경 구현 완료 보고서

**작성일**: 2024-12-XX  
**작업 범위**: 사용자 플로우 순서 변경 및 기준 없는 결과 처리 분기 추가  
**상태**: ✅ **완료**

---

## 📋 작업 개요

명세서에 따라 화면 이동 순서를 변경하고, 기준 없는 결과 처리 분기를 추가했습니다.

### 변경 전 플로우
```
집 정보 입력
→ 공정 전부 선택
→ AI 성향 분석/질문
→ AI 추천/설명
→ 견적 결과
```

### 변경 후 플로우
```
집 정보 입력
→ AI 성향 분석/질문 (기본 진입)
→ [선택 기준 생성 여부 판단]
→ 공사 범위 선택 (고객 주도)
→ 공정 선택 (고객 주도)
→ 결과 화면
```

---

## ✅ 구현 완료 내용

### 1. space-info → personality 이동 변경

**파일**: `app/space-info/page.tsx`

**변경 내용**:
- 기존: `router.push('/onboarding/scope')`
- 변경: `router.push('/onboarding/personality')`
- 버튼 텍스트: "공간 선택하기" → "성향 분석하기"

### 2. personality 페이지 개선

**파일**: `app/onboarding/personality/page.tsx`

**추가 내용**:
- 건너뛰기 버튼 추가 (상단)
- 완료 시 `setHasDecisionCriteria(true)` 호출
- 건너뛰기 시 `setHasDecisionCriteria(false)` 호출
- 완료/건너뛰기 모두 `router.push('/onboarding/scope')`로 이동

### 3. personalityStore 상태 추가

**파일**: `lib/store/personalityStore.ts`

**추가 내용**:
- `hasDecisionCriteria: boolean` 필드 추가
- `setHasDecisionCriteria(hasCriteria: boolean)` 함수 추가
- 기본값: `false` (기준 없음)

### 4. ai-recommendation 페이지 분기 처리

**파일**: `app/onboarding/ai-recommendation/page.tsx`

**추가 내용**:
- `hasDecisionCriteria` 상태 확인
- 기준 있는 경우: 기존 로직 유지 (집중 기준 선언, 설명 등)
- 기준 없는 경우:
  - 집중 기준 선언 문장 숨김
  - "기준 없는 결과" 안내 표시
  - 재진입 제안 버튼 표시 (최초 진입 시)
- `handleSetCriteria()` 함수 추가 (personality로 이동)

### 5. StepIndicator 단계 순서 변경

**파일**: `components/onboarding/StepIndicator.tsx`

**변경 내용**:
- 기존: 집 정보 → 공간 선택 → 성향 분석 → 공정 선택 → 세부 옵션 → 견적 확인
- 변경: 집 정보 → 성향 분석 → 공사 범위 → 공정 선택 → 결과 화면 → 견적 확인

**각 페이지 currentStep 조정**:
- personality: 3 → 2
- scope: 2 → 3
- process: 4 (유지)
- ai-recommendation: 5 (유지)

---

## 🎯 명세서 요구사항 달성 현황

### ✅ 이번에 한 것

- [x] 화면 이동 순서 변경
- [x] AI 성향 분석 위치 이동 (공정 선택 전)
- [x] 기준 없는 결과 처리 분기 추가
- [x] 결과 화면에서 즉시 기준 설정 제안

### ❌ 이번에 하지 않은 것 (명세서 준수)

- 질문 내용 수정
- 질문 개수 조정
- 색상 로직 고도화
- 견적 계산 정확도 개선
- 문구 카피 다듬기

---

## ✅ 성공 조건 달성 현황

명세서에서 요구한 "이번 단계의 성공 조건":

1. ✅ **AI 성향 분석이 공정 선택 전에 등장**
   - space-info → personality로 이동
   - personality → scope → process 순서

2. ✅ **분석을 건너뛰면 → 기준 없는 결과가 나온다**
   - `setHasDecisionCriteria(false)` 호출
   - ai-recommendation에서 `hasDecisionCriteria === false` 분기 처리

3. ✅ **기준 없는 결과 화면에서 즉시 기준 설정 재진입이 가능**
   - 재진입 제안 버튼 추가
   - `handleSetCriteria()` 함수로 personality로 이동

4. ✅ **순서 변경 외 기능 변화 없음**
   - 기존 기능 유지
   - 문구 수정 없음

---

## 📊 변경된 파일

### 수정된 파일

1. `app/space-info/page.tsx`
   - personality로 이동하도록 변경

2. `app/onboarding/personality/page.tsx`
   - 건너뛰기 버튼 추가
   - 완료/건너뛰기 핸들러 추가
   - scope로 이동

3. `lib/store/personalityStore.ts`
   - `hasDecisionCriteria` 상태 추가
   - `setHasDecisionCriteria` 함수 추가

4. `app/onboarding/ai-recommendation/page.tsx`
   - 기준 있는 경우/없는 경우 분기 처리
   - 재진입 제안 버튼 추가

5. `components/onboarding/StepIndicator.tsx`
   - 기본 단계 순서 변경

---

## 🔄 새로운 플로우

```
1. 집 정보 입력 (space-info)
   ↓
2. 성향 분석 (personality)
   ├─ 완료 → hasDecisionCriteria = true → scope
   └─ 건너뛰기 → hasDecisionCriteria = false → scope
   ↓
3. 공사 범위 선택 (scope)
   ↓
4. 공정 선택 (process)
   ↓
5. 결과 화면 (ai-recommendation)
   ├─ 기준 있는 경우: 집중 기준 선언 + 설명
   └─ 기준 없는 경우: "기준 없는 결과" 안내 + 재진입 제안
```

---

## ✅ 결론

화면 이동 순서 변경 및 기준 없는 결과 처리 분기가 완료되었습니다.

**핵심 성과**:
- ✅ AI 성향 분석이 공정 선택 전에 등장
- ✅ 건너뛰기 시 기준 없는 결과 표시
- ✅ 재진입 제안 버튼 추가
- ✅ 순서 변경 외 기능 변화 없음

**다음 단계**:
- 실제 사용자 테스트
- 플로우 검증

---

**작업 완료일**: 2024-12-XX  
**작업자**: AI Assistant  
**검증 상태**: ✅ 빌드 성공




















