# 집중 기준 → 옵션 설명 문장 매핑 명세서 (하이브리드 · 강제본 Phase1+)

**대상 파일**: 
- `app/onboarding/ai-recommendation/page.tsx` (향후 옵션 표시 시)
- `app/onboarding/detail-options/page.tsx` (옵션 설명 추가 시)
- `components/onboarding/options/*.tsx` (옵션 컴포넌트 설명 추가 시)

**목표**: 옵션 설명 하드코딩 제거 + 기준 종속 문장 생성 + (Phase1에서도) 최소한의 옵션 특성 반영

---

## 0. 명세서 지위 선언

- 본 명세서는 권장사항이 아니라 **강제 규칙**이다.
- 위반 시 구현은 **실패**로 간주한다.

---

## 1. 현재 문제(반드시 해결)

현재 옵션 설명이 하드코딩되어 있거나 집중 기준과 연동되지 않는다.

**금지 문장**:
```
"{optionName}은 추천 옵션입니다."
"{optionName}을 권장드립니다."
"{optionName}이 효과적입니다."
```

---

## 2. 절대 원칙(강제)

1) 옵션 설명은 **FocusedCriteria에 종속**된다.  
2) 옵션 설명 하드코딩 문자열 **0건**이어야 한다.  
3) 옵션 설명은 **단일 함수(getOptionDescription)** 로만 생성된다.  
4) 옵션 설명은 **추천/과장/감정 표현 금지**.  
5) 옵션 설명은 "왜 남았는지"만 말하고, "AI가 판단" 같은 주체 표현 금지.

---

## 3. 함수 위치 규칙(중복 방지)

- `getOptionDescription`는 `page.tsx` 내부에 두되, **컴포넌트 밖 최상단 유틸 구역**에 단 1회 정의한다.
- 동일 함수의 중복 정의 금지.
- 향후 분리 시: `lib/copy/optionDescription.ts`로 이동한다(이번 작업에서는 이동 불가).

---

## 4. Phase1+ 최소 옵션 분류(3그룹, 과도한 분류 금지)

Phase1에서도 옵션 특성이 최소 반영되어야 한다.  
아래 3그룹만 사용한다.

### 4-1. 그룹 정의

- `SAFETY_FUNCTIONAL` : 안전/기능/설비 관련 옵션 (비데, 샤워부스, 안전 손잡이, 방수, 환풍기, LED 등)
- `STORAGE_SPACE` : 수납/공간 활용 관련 옵션 (팬트리, 냉장고장, 키큰장, 아일랜드장, 욕실장, 붙박이 등)
- `FINISH_AESTHETIC` : 마감/디자인/분위기 관련 옵션 (벽지, 타일 패턴, 조명 타입, 몰딩, 포인트벽지 등)

### 4-2. 그룹 판별 함수(키워드 최소)

```ts
type OptionGroup = 'SAFETY_FUNCTIONAL' | 'STORAGE_SPACE' | 'FINISH_AESTHETIC'

function getOptionGroup(name: string): OptionGroup {
  const n = (name ?? '').toLowerCase()

  if (
    n.includes('비데') || n.includes('샤워') || n.includes('안전') ||
    n.includes('손잡이') || n.includes('방수') || n.includes('환풍') ||
    n.includes('led') || n.includes('설비') || n.includes('오븐') ||
    n.includes('정수기') || n.includes('식기세척')
  ) return 'SAFETY_FUNCTIONAL'

  if (
    n.includes('팬트리') || n.includes('냉장고장') || n.includes('키큰장') ||
    n.includes('아일랜드') || n.includes('욕실장') || n.includes('붙박이') ||
    n.includes('수납') || n.includes('장')
  ) return 'STORAGE_SPACE'

  return 'FINISH_AESTHETIC'
}
```

---

## 5. 옵션 설명 생성 함수(필수)

시그니처는 객체 파라미터형으로 고정한다.

Phase1 기본은 "기준" 분기 + "그룹" 보정 1회.

문장은 항상 1문장.

```ts
function getOptionDescription(
  option: { name: string },
  criteria: FocusedCriteria
): string {
  const name = option?.name ?? ''
  const group = getOptionGroup(name)

  switch (criteria) {
    case '아이 안전': {
      if (group === 'SAFETY_FUNCTIONAL') {
        return `${name}은 아이 동선에서 발생할 수 있는 위험을 직접 줄이기 위해 포함됩니다.`
      }
      if (group === 'STORAGE_SPACE') {
        return `${name}은 아이가 접근하기 어려운 위치에 수납을 고정하여 위험 요소를 줄이기 위해 포함됩니다.`
      }
      return `${name}은 손이 닿는 구역의 위험 요소를 줄이는 방향으로 선택되었습니다.`
    }

    case '정리 스트레스 최소화': {
      if (group === 'STORAGE_SPACE') {
        return `${name}은 물건이 쌓이거나 어질러지는 지점을 줄이기 위해 포함됩니다.`
      }
      if (group === 'FINISH_AESTHETIC') {
        return `${name}은 정리 부담이 늘지 않도록 표면 유지가 쉬운 마감으로 선택되었습니다.`
      }
      return `${name}은 사용 빈도가 높은 구역에서 정리 동작을 단순하게 만들기 위해 포함됩니다.`
    }

    case '유지관리 부담 최소화': {
      if (group === 'FINISH_AESTHETIC') {
        return `${name}은 청소·오염·손상 관리 부담이 커지지 않도록 마감을 안정화하기 위해 포함됩니다.`
      }
      if (group === 'SAFETY_FUNCTIONAL') {
        return `${name}은 유지관리 빈도를 줄이고 기능을 안정적으로 유지하기 위해 포함됩니다.`
      }
      return `${name}은 이후 관리 부담을 늘리지 않는 범위에서 선택되었습니다.`
    }

    case '공간 활용 효율': {
      if (group === 'STORAGE_SPACE') {
        return `${name}은 동일 면적에서 수납·배치 효율을 확보하기 위해 포함됩니다.`
      }
      return `${name}은 사용 가능한 면적과 동선 효율을 높이는 방향으로 선택되었습니다.`
    }

    case '공사 범위 최소화': {
      return `${name}은 구조 변경 없이 효과를 볼 수 있는 범위에서 선택되었습니다.`
    }

    case '예산 통제 우선': {
      return `${name}은 공정 추가가 아니라 대체·조정 범위에서 효과를 확보하기 위해 포함됩니다.`
    }

    case '동선 단순화': {
      if (group === 'STORAGE_SPACE') {
        return `${name}은 이동 경로를 막지 않고 이동 동작을 줄이기 위해 포함됩니다.`
      }
      return `${name}은 반복 이동이 생기는 구간을 단순하게 유지하기 위해 선택되었습니다.`
    }

    default:
      return `${name}은 현재 기준에 맞춰 포함되었습니다.`
  }
}
```

---

## 6. JSX 적용 규칙(강제)

### 삭제 대상(하드코딩)

```tsx
{optionName}은 추천 옵션입니다.
{optionName}을 권장드립니다.
```

### 교체(강제)

```tsx
{getOptionDescription(option, focusedCriteria)}
```

### 금지 사항

* JSX 내부 조건분기 금지
* 옵션 설명은 함수 호출로만 렌더링

---

## 7. 실패 판정

다음 중 하나라도 발생하면 실패:

1. 하드코딩 옵션 설명 문자열이 남아 있음
2. 모든 옵션이 사실상 같은 의미 문장으로 출력됨(그룹 보정 없음)
3. 추천/과장/감정 단어 포함
4. 기준과 무관한 문장 출력
5. criteria가 아닌 needs/category를 참조해 문장을 생성

---

## 8. 완료 기준

아래 조건을 모두 만족하면 완료로 간주한다:

* 하드코딩 옵션 설명 0건
* criteria별 문장 변화 확인
* SAFETY_FUNCTIONAL/STORAGE_SPACE/FINISH_AESTHETIC 최소 3그룹에서 문장 차이가 발생
* 빌드 성공, 타입 에러 없음

---

## 9. 적용 우선순위

### Phase 1 (현재)
- 명세서 작성 및 함수 구현
- 향후 옵션 설명 표시 시 즉시 적용 가능하도록 준비

### Phase 2 (향후)
- `detail-options/page.tsx`에 옵션 설명 추가
- 옵션 컴포넌트에 설명 문장 표시
- 집중 기준 연동

---

## 결론

옵션 설명도 공정 설명과 동일한 원칙을 따릅니다.  
집중 기준에 따라 옵션이 "왜 남았는지"를 명확히 설명해야 합니다.  
이 명세서는 향후 옵션 설명이 추가될 때 즉시 적용 가능하도록 준비된 구조입니다.












