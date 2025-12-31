# Phase 0 완료 보고서 - 질문 통제 스키마 고정

## 📋 작업 개요

**목적**: AI가 질문을 "만들 수는 있지만", 채택·폐기·우선순위는 전부 코드가 결정하도록 통제권을 이전

**완료일**: 2024년
**상태**: ✅ 완료

---

## ✅ 완료 기준 체크리스트

### Phase 0 PASS 조건

- [x] 질문 객체에 `questionId`, `referencedFields`, `impactType`, `allowIfMissingOnly`가 존재
- [x] 질문 문장(text)과 판단 정보가 분리되어 있음
- [x] AI가 만든 질문을 코드가 "후보"로 다룰 수 있는 구조
- [x] 이후 Phase에서 질문을 제거/선별/우선순위화할 수 있는 상태

---

## 🔧 구현 내용

### 1. Question 타입 확장

**파일**: `lib/data/personalityQuestions.ts`

```typescript
export type QuestionImpactType = 'PRICE' | 'PROCESS' | 'OPTION' | 'NONE'

export interface Question {
  id: string
  text: string
  options: QuestionOption[]
  // Phase 0: 질문 통제용 메타데이터 (선택적 필드)
  questionId?: string
  referencedFields?: string[]
  impactType?: QuestionImpactType
  allowIfMissingOnly?: boolean
}
```

**특징**:
- ✅ 기존 필드(`id`, `text`, `options`) 유지
- ✅ 메타데이터는 선택적 필드로 추가 (기존 코드 호환성 유지)
- ✅ 타입명, 함수명 변경 없음

### 2. 메타데이터 추출 함수 구현

**파일**: `app/api/generate-questions/route.ts`

#### 2-1. `extractReferencedFields()`
- 질문 텍스트와 category를 분석하여 참조하는 고객 입력 필드 추출
- 키워드 기반 매칭:
  - 평수: "평", "평수", "평형"
  - 가족 구성: "가족", "인원", "아이", "어르신" 등
  - 반려동물: "반려동물", "펫", "강아지", "고양이"
  - 주거형태: "아파트", "주거형태", "주택"
  - 방/욕실 개수: "방 개", "욕실 개"
  - 예산: "예산", "비용", "금액"
  - 거주 목적/기간: "거주", "거주기간"
  - 추가 정보: `additionalNotes` 키워드 매칭

#### 2-2. `inferImpactType()`
- category와 goal을 기반으로 영향도 추론
- PRICE: 예산, 비용, 금액, 가격, 등급, 자재 관련
- PROCESS: 공정, 공사, 시공, 철거, 마감, 수납, 주방, 욕실, 거실 관련
- OPTION: 옵션, 선택, 분기, 타일, 바닥, 조명, 문, 창호 관련
- NONE: 기본값 (영향 없음)

#### 2-3. `determineAllowIfMissingOnly()`
- `referencedFields`가 비어있으면 `true` (추가 확인 불필요)
- `referencedFields`가 있으면 `true` (기본값, Phase 1에서 세분화 예정)

### 3. 정규화 함수 수정

**파일**: `app/api/generate-questions/route.ts`

**변경 사항**:
- `normalizeAIQuestions()` 함수에 `spaceInfo` 파라미터 추가
- 각 질문 객체에 메타데이터 자동 추가:
  ```typescript
  const question: Question = {
    id: baseQuestionId,
    text: q.text!,
    options,
    questionId: baseQuestionId,
    referencedFields: extractReferencedFields(...),
    impactType: inferImpactType(...),
    allowIfMissingOnly: determineAllowIfMissingOnly(...),
  }
  ```

### 4. AI 프롬프트 업데이트

**변경 사항**:
- AI 역할 재정의: "질문 후보만 생성, 채택/폐기는 코드가 결정"
- 메타데이터 필드는 선택사항으로 명시
- AI가 제공하지 않아도 코드가 자동 추론한다고 명시

---

## 📊 메타데이터 스키마 상세

### `questionId: string`
- 질문 고유 식별자
- 현재는 `id`와 동일하게 설정
- 향후 별도 관리 가능하도록 확장 가능

### `referencedFields: string[]`
- 이 질문이 참조하는 고객 입력 필드 목록
- 예: `["totalPeople", "ageRanges"]`
- 빈 배열: 참조하는 필드 없음 (항상 허용)
- 값 있음: 해당 필드가 비어있을 때만 질문 허용 (Phase 1에서 활용)

### `impactType: QuestionImpactType`
- 견적 금액/공정 수/옵션 분기 영향도
- `PRICE`: 견적 금액에 영향
- `PROCESS`: 공정 수/종류에 영향
- `OPTION`: 옵션 분기에 영향
- `NONE`: 영향 없음 (Phase 1에서 제거 대상)

### `allowIfMissingOnly: boolean`
- `true`: 참조 필드가 비어있을 때만 질문 허용
- `false`: 값이 있어도 추가 확인 필요
- Phase 0에서는 기본값 `true`로 설정 (Phase 1에서 세분화 예정)

---

## 🔍 코드 레벨 통제 가능 여부

### ✅ 현재 가능한 판단

1. **이 질문이 어떤 고객 입력을 참조하는지**
   - `referencedFields` 배열 확인
   - 예: `["totalPeople", "ageRanges"]` → 가족 구성 관련 질문

2. **이미 고객 입력값이 존재하는지**
   - `spaceInfo[field]` 확인
   - 예: `spaceInfo.totalPeople`이 있으면 `referencedFields`에 `"totalPeople"` 포함 시 중복 질문 가능성

3. **이 질문이 견적/공정/옵션에 영향이 있는지**
   - `impactType` 확인
   - 예: `impactType === 'PRICE'` → 견적 금액에 영향

### ⏳ Phase 1에서 구현 예정

- 질문 개수 6개 제한
- `impactType` 기반 우선순위
- FAIL 처리/롤백
- "잘 모르겠습니다 / 전문가 판단" 옵션

---

## 📝 수정된 파일 목록

### 핵심 수정 파일

1. **`lib/data/personalityQuestions.ts`**
   - `QuestionImpactType` 타입 추가
   - `Question` 인터페이스에 메타데이터 필드 추가 (선택적)

2. **`app/api/generate-questions/route.ts`**
   - `extractReferencedFields()` 함수 추가
   - `inferImpactType()` 함수 추가
   - `determineAllowIfMissingOnly()` 함수 추가
   - `normalizeAIQuestions()` 함수 수정 (메타데이터 추가)
   - AI 프롬프트 업데이트 (메타데이터 설명 추가)

### 수정하지 않은 파일 (명세서 준수)

- ✅ `app/onboarding/personality/page.tsx` (UI 수정 금지)
- ✅ 스토어(store) 구조 (변경 없음)
- ✅ UI 렌더링 로직 (변경 없음)
- ✅ 기존 함수명, 타입명 유지

---

## 🎯 Phase 0 완료 확인

### 완료 기준 재확인

1. ✅ **질문 객체에 메타데이터 존재**
   - `questionId`, `referencedFields`, `impactType`, `allowIfMissingOnly` 모두 추가됨

2. ✅ **질문 문장과 판단 정보 분리**
   - `text`: 질문 문장 (UI 표시용)
   - `referencedFields`, `impactType`: 판단 정보 (코드 통제용)

3. ✅ **AI 질문을 "후보"로 다룰 수 있는 구조**
   - AI 응답은 `AIQuestionRaw`로 받음
   - `normalizeAIQuestions()`에서 메타데이터 추가하여 `Question`으로 변환
   - 코드가 메타데이터를 기반으로 채택/폐기 판단 가능

4. ✅ **이후 Phase에서 제거/선별/우선순위화 가능**
   - `referencedFields`로 중복 질문 필터링 가능
   - `impactType`으로 우선순위 결정 가능
   - `allowIfMissingOnly`로 조건부 허용 가능

---

## 🚀 다음 단계 (Phase 1 준비)

Phase 0 완료로 인해 다음 작업이 가능해졌습니다:

1. **질문 필터링 로직**
   - `referencedFields` 기반 중복 질문 제거
   - 이미 입력된 정보를 참조하는 질문 폐기

2. **질문 우선순위 로직**
   - `impactType` 기반 정렬
   - `PRICE` > `PROCESS` > `OPTION` > `NONE` 순서

3. **질문 개수 제한**
   - 최대 6개로 제한
   - 우선순위 높은 질문만 선별

4. **FAIL 처리**
   - 조건 불만족 시 질문 폐기
   - 한 단계 이전 조건으로 롤백

---

## ⚠️ 주의사항

### 기존 코드 호환성

- ✅ 메타데이터는 선택적 필드 (`?`)로 추가
- ✅ 기존 코드에서 메타데이터 없이도 동작 가능
- ✅ UI 컴포넌트는 메타데이터를 사용하지 않음 (로직만 수정)

### AI 역할 재정의

- ✅ AI는 질문 "후보"만 생성
- ✅ 채택/폐기/우선순위는 코드가 결정
- ✅ AI가 메타데이터를 제공하지 않아도 코드가 자동 추론

---

## 📊 테스트 시나리오

### 시나리오 1: 평수 관련 질문
- 질문 텍스트: "25평 아파트에서..."
- `referencedFields`: `["pyeong"]`
- `impactType`: `"NONE"` (기본값)
- `allowIfMissingOnly`: `true`

### 시나리오 2: 가족 구성 관련 질문
- 질문 텍스트: "3인 가족이 거주하시는데..."
- `referencedFields`: `["totalPeople", "familySizeRange"]`
- `impactType`: `"PROCESS"` (가족 구성 → 공정 영향)
- `allowIfMissingOnly`: `true`

### 시나리오 3: 예산 관련 질문
- 질문 텍스트: "예산을 생각할 때..."
- `referencedFields`: `["budget", "budgetAmount"]`
- `impactType`: `"PRICE"` (예산 → 견적 금액 영향)
- `allowIfMissingOnly`: `true`

---

## ✅ Phase 0 완료 선언

**완료일**: 2024년
**상태**: ✅ PASS

모든 완료 기준을 충족했으며, Phase 1(질문 필터링/우선순위) 작업을 안전하게 진행할 수 있는 상태입니다.

---

**작성자**: Cursor AI Assistant
**검토 필요**: Phase 1 작업 전 사용자 확인




















