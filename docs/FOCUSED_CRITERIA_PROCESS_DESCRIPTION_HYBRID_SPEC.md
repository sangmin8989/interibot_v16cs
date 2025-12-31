# 집중 기준 → 공정 설명 문장 매핑 명세서 (하이브리드 · 최종 적용본)

**작성일**: 2024-12-XX  
**대상 파일**: `app/onboarding/ai-recommendation/page.tsx`  
**기반**: 명세서 3 (타입 안정성) + 명세서 2 (간결성) + 명세서 1 (확장 준비)  
**상태**: 🔴 즉시 실행 / 변경 불가

---

## 0. 명세서 지위 선언

본 명세서는 **권장사항이 아니다.**  
이 명세서는 **코드보다 상위 규칙**이며, 위반 시 구현은 **실패로 간주**한다.

공정 설명은 더 이상 "형식 문장"이 아니라  
**집중 기준의 하위 증거 문장**이어야 한다.

---

## 1. 목적

현재 공정 설명이 다음과 같이 **집중 기준과 무관하게 하드코딩**되어 있다.

```
"{process.name}은 이번 조건에서 가장 효과가 확실한 선택입니다."
```

이 구조는 다음 문제를 가진다:
- 집중 기준 선언 구조와 **논리 단절**
- 모든 공정이 **같은 이유로 선택된 것처럼 보임**
- 고객 입장에서 "AI가 생각했다"는 신뢰 붕괴

본 명세서의 목적은  
**집중 기준(FocusedCriteria)에 따라 공정 설명 문장이 달라지도록 규칙을 고정**하는 것이다.

---

## 2. 절대 원칙 (강제)

1. 공정 설명은 **FocusedCriteria에 종속**된다.
2. 공정 설명은 **하드코딩 문자열 사용 금지**.
3. 공정 설명은 **매핑 함수로만 생성**된다.
4. 공정 설명은 **결정 이유를 설명하지 않는다**  
   → "왜 이 공정이 남았는지"만 말한다.

---

## 3. 허용 / 금지 구조

### ❌ 금지

```tsx
"{process.name}은 이번 조건에서 가장 효과가 확실한 선택입니다."
```

### ⭕ 허용

```tsx
{getProcessDescription(process, focusedCriteria)}
```

---

## 4. 공정 설명 생성 함수 (필수 구현)

### 4-1. 함수 시그니처

```ts
function getProcessDescription(
  process: { name: string },
  criteria: FocusedCriteria
): string
```

**설명**:
- `process`: 공정 객체 (현재는 `name`만 사용, 향후 확장 가능)
- `criteria`: 집중 기준 (ENUM)
- 반환: 공정 설명 1문장

### 4-2. 구현 코드

```ts
function getProcessDescription(
  process: { name: string },
  criteria: FocusedCriteria
): string {
  switch (criteria) {
    case '아이 안전':
      return `${process.name}은 아이 동선에서 위험 요소를 제거하기 위해 우선 적용됩니다.`

    case '정리 스트레스 최소화':
      return `${process.name}은 물건이 쌓이거나 어질러지는 상황을 줄이기 위해 포함됩니다.`

    case '유지관리 부담 최소화':
      return `${process.name}은 향후 청소·수리 부담을 늘리지 않는 방향으로 선택되었습니다.`

    case '공간 활용 효율':
      return `${process.name}은 동일 면적에서 사용 효율을 높이기 위한 핵심 공정입니다.`

    case '공사 범위 최소화':
      return `${process.name}은 구조 변경 없이 효과를 볼 수 있는 범위로 제한 적용됩니다.`

    case '예산 통제 우선':
      return `${process.name}은 추가 비용 없이 효과를 확보할 수 있는 항목으로 남겼습니다.`

    case '동선 단순화':
      return `${process.name}은 이동 경로를 단순하게 유지하기 위해 필요한 공정입니다.`

    default:
      return `${process.name}은 현재 기준에 맞춰 우선 적용됩니다.`
  }
}
```

---

## 5. 문장 톤 규칙 (중요)

공정 설명 문장은 반드시 아래 조건을 만족해야 한다.

### 반드시 포함

* "왜 이 공정이 **남았는지**"
* "기준과 어떤 관계인지"

### 절대 금지

* 추천, 제안, 선택, 효과가 확실, 최적
* 감정 단어 (안심, 편안, 만족 등)
* AI 주체 표현 ("AI가 판단", "분석 결과")
* "가장", "확실", "무조건", "완벽" 등 과장 표현

---

## 6. JSX 적용 규칙 (강제)

### 기존 코드 (삭제 대상)

```tsx
<p className="text-sm text-gray-600 mb-2">
  {process.name}은<br />
  이번 조건에서 가장 효과가 확실한 선택입니다.
</p>
```

### 수정 후 (강제)

```tsx
<p className="text-sm text-gray-600 mb-2">
  {getProcessDescription(process, focusedCriteria)}
</p>
```

### 금지 사항

* JSX 내 조건 분기 ❌
* 공정 설명 하드코딩 ❌
* process 단독 설명 ❌

---

## 7. 집중 기준 구조와의 연결 규칙

* `focusedCriteria`는 반드시 `decideFocusedCriteria()`의 반환값만 사용
* needs / category를 직접 참조하여 공정 설명 생성 ❌
* 공정 설명에서 다른 기준을 암시 ❌

---

## 8. 향후 확장 준비 (Phase 2)

현재는 간결한 구조로 구현하지만, 향후 공정별 차별화가 필요할 경우:

### 확장 가능 구조

```ts
function getProcessDescription(
  process: { name: string; category?: string },
  criteria: FocusedCriteria
): string {
  // Phase 1: 기준별 기본 문장
  // Phase 2: process.category 기반 분기 추가 가능
  // Phase 3: 키워드 분류 로직 추가 가능 (명세서 1 방식)
}
```

**현재는 Phase 1만 구현**

---

## 9. 실패 판정 조건

다음 중 하나라도 발생하면 명세서 위반이다.

1. 공정 설명이 기준과 무관한 문장이다
2. 모든 기준에서 동일한 문장이 출력된다
3. 하드코딩 문자열이 남아 있다
4. 공정 설명에서 추천·제안 뉘앙스가 보인다
5. 기준 선언과 공정 설명의 논리가 충돌한다

---

## 10. 완료 기준

아래 조건을 모두 만족하면 완료로 간주한다.

* 하드코딩 공정 설명 0건
* 모든 공정 설명이 `FocusedCriteria`에 따라 달라짐
* 기준 변경 시 공정 설명 문장도 함께 변경됨
* 선언 → 보조 기준 → 공정 설명 논리 흐름이 일관됨
* 빌드 성공 및 타입 에러 없음

---

## 결론

이 명세서를 적용하면:
* 집중 기준 선언 구조가 **공정 단위까지 완성**
* 고객은 "왜 이 공정이 필요한지" 즉시 이해
* 하드코딩 문구 재등장 방지
* 타입 안정성 확보 (향후 확장 준비)

본 명세서는 권장이 아니라 **강제 규칙**이다.




















