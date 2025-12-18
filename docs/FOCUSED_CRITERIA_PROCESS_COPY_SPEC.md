# 집중 기준 → 공정 설명 문장 매핑 명세서 (하이브리드 · 강제본 Phase1+)

**대상 파일**: `app/onboarding/ai-recommendation/page.tsx`  
**목표**: 공정 설명 하드코딩 제거 + 기준 종속 문장 생성 + (Phase1에서도) 최소한의 공정 특성 반영

---

## 0. 명세서 지위 선언

- 본 명세서는 권장사항이 아니라 **강제 규칙**이다.
- 위반 시 구현은 **실패**로 간주한다.

---

## 1. 현재 문제(반드시 해결)

현재 공정 설명이 하드코딩되어 있으며 집중 기준과 연동되지 않는다.

**금지 문장**:
```
"{process.name}은 이번 조건에서 가장 효과가 확실한 선택입니다."
```

---

## 2. 절대 원칙(강제)

1) 공정 설명은 **FocusedCriteria에 종속**된다.  
2) 공정 설명 하드코딩 문자열 **0건**이어야 한다.  
3) 공정 설명은 **단일 함수(getProcessDescription)** 로만 생성된다.  
4) 공정 설명은 **추천/과장/감정 표현 금지**.  
5) 공정 설명은 "왜 남았는지"만 말하고, "AI가 판단" 같은 주체 표현 금지.

---

## 3. 함수 위치 규칙(중복 방지)

- `getProcessDescription`는 `page.tsx` 내부에 두되, **컴포넌트 밖 최상단 유틸 구역**에 단 1회 정의한다.
- 동일 함수의 중복 정의 금지.
- 향후 분리 시: `lib/copy/processDescription.ts`로 이동한다(이번 작업에서는 이동 불가).

---

## 4. Phase1+ 최소 공정 분류(3그룹, 과도한 분류 금지)

Phase1에서도 공정 특성이 최소 반영되어야 한다.  
아래 3그룹만 사용한다.

### 4-1. 그룹 정의

- `WET` : 물 사용/미끄럼/누수/위생 관련 공정 (욕실, 주방, 타일, 방수, 설비, 수전 등)
- `STORAGE_FLOW` : 수납/동선/가구배치 관련 공정 (가구, 수납장, 붙박이, 팬트리, 중문, 가벽 등)
- `FINISH` : 마감/표면/유지관리 관련 공정 (도배, 도장, 바닥, 조명, 실리콘, 필름 등)

### 4-2. 그룹 판별 함수(키워드 최소)

```ts
type ProcessGroup = 'WET' | 'STORAGE_FLOW' | 'FINISH'

function getProcessGroup(name: string): ProcessGroup {
  const n = (name ?? '').toLowerCase()

  if (
    n.includes('욕실') || n.includes('주방') || n.includes('타일') ||
    n.includes('방수') || n.includes('설비') || n.includes('수전') ||
    n.includes('배관') || n.includes('세면') || n.includes('샤워')
  ) return 'WET'

  if (
    n.includes('수납') || n.includes('가구') || n.includes('붙박이') ||
    n.includes('팬트리') || n.includes('중문') || n.includes('가벽') ||
    n.includes('동선') || n.includes('수납장')
  ) return 'STORAGE_FLOW'

  return 'FINISH'
}
```

---

## 5. 공정 설명 생성 함수(필수)

시그니처는 객체 파라미터형으로 고정한다.

Phase1 기본은 "기준" 분기 + "그룹" 보정 1회.

문장은 항상 1문장.

```ts
function getProcessDescription(
  process: { name: string },
  criteria: FocusedCriteria
): string {
  const name = process?.name ?? ''
  const group = getProcessGroup(name)

  switch (criteria) {
    case '아이 안전': {
      if (group === 'WET') return `${name}은 미끄럼·턱·누수 같은 위험 요소를 먼저 줄이기 위해 우선 적용됩니다.`
      if (group === 'STORAGE_FLOW') return `${name}은 아이 이동 경로에서 걸림·충돌 요소를 줄이기 위해 포함됩니다.`
      return `${name}은 손이 자주 닿는 구역의 위험 요소를 줄이기 위해 필요한 마감 공정입니다.`
    }

    case '정리 스트레스 최소화': {
      if (group === 'STORAGE_FLOW') return `${name}은 물건이 쌓이는 지점을 줄이고 정리 동작을 단순하게 만들기 위해 포함됩니다.`
      if (group === 'FINISH') return `${name}은 정리 부담이 늘지 않도록 표면 유지가 쉬운 마감으로 정리하는 공정입니다.`
      return `${name}은 사용 빈도가 높은 구역에서 어질러짐을 줄이기 위해 필요한 공정입니다.`
    }

    case '유지관리 부담 최소화': {
      if (group === 'FINISH') return `${name}은 청소·오염·손상 관리 부담이 커지지 않도록 마감을 안정화하기 위해 포함됩니다.`
      if (group === 'WET') return `${name}은 누수·곰팡이·오염 같은 유지관리 리스크를 줄이기 위해 우선 적용됩니다.`
      return `${name}은 이후 관리 부담을 늘리지 않는 범위에서 정리되는 공정입니다.`
    }

    case '공간 활용 효율': {
      if (group === 'STORAGE_FLOW') return `${name}은 동일 면적에서 수납·배치 효율을 확보하기 위한 핵심 공정입니다.`
      return `${name}은 사용 가능한 면적과 동선 효율을 높이는 방향으로 포함됩니다.`
    }

    case '공사 범위 최소화': {
      return `${name}은 철거·설비 변경을 키우지 않는 범위에서 효과를 확보하기 위해 제한 적용됩니다.`
    }

    case '예산 통제 우선': {
      return `${name}은 공정 추가가 아니라 대체·조정 범위에서 효과를 확보하기 위해 남겼습니다.`
    }

    case '동선 단순화': {
      if (group === 'STORAGE_FLOW') return `${name}은 이동 경로를 막지 않고 이동 동작을 줄이기 위해 포함됩니다.`
      return `${name}은 반복 이동이 생기는 구간을 단순하게 유지하기 위해 필요한 공정입니다.`
    }

    default:
      return `${name}은 현재 기준에 맞춰 우선 적용됩니다.`
  }
}
```

---

## 6. JSX 적용 규칙(강제)

### 삭제 대상(하드코딩)

```tsx
{process.name}은 이번 조건에서 가장 효과가 확실한 선택입니다.
```

### 교체(강제)

```tsx
{getProcessDescription(process, focusedCriteria)}
```

### 금지 사항

* JSX 내부 조건분기 금지
* 공정 설명은 함수 호출로만 렌더링

---

## 7. 실패 판정

다음 중 하나라도 발생하면 실패:

1. 하드코딩 공정 설명 문자열이 남아 있음
2. 모든 공정이 사실상 같은 의미 문장으로 출력됨(그룹 보정 없음)
3. 추천/과장/감정 단어 포함
4. 기준과 무관한 문장 출력
5. criteria가 아닌 needs/category를 참조해 문장을 생성

---

## 8. 완료 기준

아래 조건을 모두 만족하면 완료로 간주한다:

* 하드코딩 공정 설명 0건
* criteria별 문장 변화 확인
* WET/STORAGE_FLOW/FINISH 최소 3그룹에서 문장 차이가 발생
* 빌드 성공, 타입 에러 없음

---

## 결론

지금 "간결형(기준만)"으로 가면 **고객이 'AI 같다'는 느낌이 안 납니다.**  
그래서 Phase1에서 최소 3그룹 분류는 **필수**입니다.  
이 정도는 복잡도 거의 안 올리고, 체감 품질은 확 올립니다.












