# processSelections 구조 보고서

## 📋 개요

`processSelections`는 최종 견적 계산 시 사용되는 **공간별 공정 선택 데이터**입니다. 고객이 각 공간에서 선택한 공정 정보를 담고 있으며, 견적 계산의 **단일 진실 소스(Single Source of Truth)** 역할을 합니다.

---

## 🔍 타입 정의

### 기본 타입

```typescript
// lib/estimate/calculator-v3.ts (162-164줄)
export type SpaceProcessSelection = Record<string, string | string[] | null>;
export type SelectedProcessesBySpace = Record<string, SpaceProcessSelection>;

// EstimateInputV3 인터페이스 (187줄)
processSelections?: SelectedProcessesBySpace;
```

### 구조 설명

`processSelections`는 **2단계 중첩 객체** 구조입니다:

```typescript
processSelections: {
  [spaceId: string]: {                    // 1단계: 공간 ID
    [category: string]: string | string[] | null  // 2단계: 공정 카테고리별 선택값
  }
}
```

---

## 🏠 공간 ID (SpaceId)

### 정의 위치
- `types/spaceProcess.ts` (6-21줄)

### 가능한 값

```typescript
type SpaceId = 
  | 'living'           // 거실
  | 'kitchen'          // 주방
  | 'masterBedroom'    // 안방
  | 'room1'            // 방1
  | 'room2'            // 방2
  | 'room3'            // 방3
  | 'room4'            // 방4
  | 'room5'            // 방5
  | 'bathroom'         // 욕실 (1개일 때)
  | 'masterBathroom'   // 안방욕실 (욕실 2개 이상)
  | 'commonBathroom'   // 공용욕실 (욕실 2개 이상)
  | 'bathroom3'        // 욕실3 (욕실 3개 이상)
  | 'entrance'         // 현관
  | 'balcony'          // 발코니
  | 'dressRoom'        // 드레스룸
```

---

## 🔧 공정 카테고리 (ProcessCategory)

### 정의 위치
- `types/spaceProcess.ts` (24-34줄)

### 가능한 값

```typescript
type ProcessCategory = 
  | 'wall_finish'          // 벽 마감 (도배)
  | 'floor_finish'         // 바닥 마감 (장판/마루)
  | 'door_finish'          // 문 마감
  | 'window_finish'        // 창호(샤시)
  | 'electric_lighting'     // 조명/전기
  | 'options'              // 추가 옵션 (배열)
  | 'kitchen_core'         // 주방 핵심 공정
  | 'kitchen_countertop'   // 주방 상판
  | 'bathroom_core'        // 욕실 핵심 공정
  | 'entrance_core'        // 현관 핵심 공정
  | 'balcony_core'         // 발코니 핵심 공정
```

---

## 📊 값의 의미

### 값 타입

1. **`string`**: 단일 선택값
   - 예: `'wallpaper'`, `'standard'`, `'main_light'`

2. **`string[]`**: 다중 선택값 (배열)
   - 예: `['art_wall', 'molding']`, `['builtin_closet']`

3. **`null`**: 선택 안 함
   - 해당 카테고리를 선택하지 않음

4. **`'none'`**: "하지 않음" 명시적 선택
   - 고객이 명시적으로 "하지 않음"을 선택한 경우

---

## 💡 실제 사용 예시

### 예시 1: 주방만 선택한 경우

```typescript
processSelections = {
  kitchen: {
    kitchen_core: 'standard',           // 주방 핵심 공정: 표준형
    kitchen_countertop: 'quartz',       // 상판: 쿼츠
    wall_finish: 'tile',                // 벽 마감: 타일
    floor_finish: 'laminate',           // 바닥 마감: 장판
    electric_lighting: 'main_light'     // 조명: 메인등
  }
}
```

### 예시 2: 거실과 주방 선택한 경우

```typescript
processSelections = {
  living: {
    wall_finish: 'wallpaper',           // 벽 마감: 벽지
    floor_finish: 'laminate',           // 바닥 마감: 장판
    electric_lighting: 'indirect',      // 조명: 간접조명
    options: ['art_wall', 'molding']    // 추가 옵션: 아트월, 몰딩
  },
  kitchen: {
    kitchen_core: 'standard',
    kitchen_countertop: 'quartz',
    wall_finish: 'tile',
    floor_finish: 'laminate'
  }
}
```

### 예시 3: 욕실 선택한 경우

```typescript
processSelections = {
  bathroom: {
    bathroom_core: 'standard',          // 욕실 핵심 공정: 표준형
    wall_finish: 'tile',                // 벽 타일
    floor_finish: 'tile'                // 바닥 타일
  }
}
```

### 예시 4: 고객 정보 기반 자동 추가된 경우

```typescript
// 고객이 욕실 개수 2개, 방 개수 3개를 입력했지만 공간을 선택하지 않은 경우
processSelections = {
  masterBathroom: {
    bathroom_core: 'standard'           // ✅ 고객 정보 기반 자동 추가
  },
  living: {
    wall_finish: 'wallpaper',          // ✅ 고객 정보 기반 자동 추가
    floor_finish: 'laminate'           // ✅ 고객 정보 기반 자동 추가
  }
}
```

---

## 🔄 카테고리별 값 예시

### wall_finish (벽 마감)
```typescript
'wallpaper' | 'paint' | 'tile' | null
```

### floor_finish (바닥 마감)
```typescript
'laminate' | 'vinyl' | 'tile' | 'wood' | null
```

### electric_lighting (조명/전기)
```typescript
'main_light' | 'indirect' | 'line' | 'none' | null
```

### kitchen_core (주방 핵심)
```typescript
'basic' | 'standard' | 'premium' | null
```

### bathroom_core (욕실 핵심)
```typescript
'standard' | 'premium' | null
```

### options (추가 옵션)
```typescript
['art_wall', 'molding'] | ['builtin_closet'] | ['film'] | null
```

---

## ⚙️ 처리 로직

### 위치
- `lib/estimate/calculator-v3.ts` (433-535줄)

### 공정 추출 함수

```typescript
const extractProcessesFromSelections = (): {
  processIds: string[],
  spaceIds: string[],
  hasWallFinish: boolean,
  hasFloorFinish: boolean,
  hasDoorFinish: boolean,
  hasWindowFinish: boolean,
  hasElectricLighting: boolean,
  hasKitchenCore: boolean,
  hasBathroomCore: boolean,
  hasEntranceCore: boolean,
  hasBalconyCore: boolean,
  hasFurniture: boolean,
  hasFilm: boolean
} => {
  // processSelections를 순회하며 공정 추출
  Object.entries(processSelections).forEach(([spaceId, selections]) => {
    Object.entries(selections).forEach(([category, value]) => {
      if (value !== null && value !== 'none') {
        // 카테고리별 공정 ID 매핑
        if (category === 'wall_finish') → 'finish' 공정 추가
        if (category === 'floor_finish') → 'finish' 공정 추가
        if (category === 'kitchen_core') → 'kitchen' 공정 추가
        if (category === 'bathroom_core') → 'bathroom' 공정 추가
        if (category === 'electric_lighting') → 'electric' 공정 추가
        // ...
      }
    })
  })
}
```

### 카테고리 → 공정 ID 매핑

| 카테고리 | 공정 ID | 설명 |
|---------|---------|------|
| `wall_finish` | `finish` | 벽 마감 → 마감 공정 |
| `floor_finish` | `finish` | 바닥 마감 → 마감 공정 |
| `door_finish` | `door` | 문 마감 → 문 공정 |
| `window_finish` | `window` | 창호 마감 → 창호 공정 |
| `electric_lighting` | `electric` | 조명/전기 → 전기 공정 |
| `kitchen_core` | `kitchen` | 주방 핵심 → 주방 공정 |
| `kitchen_countertop` | `kitchen` | 주방 상판 → 주방 공정 |
| `bathroom_core` | `bathroom` | 욕실 핵심 → 욕실 공정 |
| `entrance_core` | `entrance` | 현관 핵심 → 현관 공정 |
| `balcony_core` | `balcony` | 발코니 핵심 → 발코니 공정 |
| `options` (furniture) | `furniture` | 수납 옵션 → 수납 공정 |
| `options` (film) | `film` | 필름 옵션 → 필름 공정 |

---

## 🔐 검증 로직

### API 검증
- 위치: `app/api/estimate/v3/route.ts` (42-48줄)

```typescript
// processSelections 검증
const hasProcessSelections = input.processSelections && 
  Object.keys(input.processSelections).length > 0
const isFullMode = (input as any).mode === 'FULL'

if (!hasProcessSelections && !isFullMode) {
  errors.push('공정 선택(processSelections)이 없습니다. 공정을 선택하거나 mode="FULL"을 명시적으로 지정해주세요.')
}
```

### 계산기 검증
- 위치: `lib/estimate/calculator-v3.ts` (429-431줄)

```typescript
if (!processSelections && !isFullMode) {
  throw new Error('processSelections가 없습니다. 공정을 선택하거나 mode="FULL"을 명시적으로 지정해주세요.')
}
```

---

## 🎯 고객 정보 기반 자동 추가

### 위치
- `app/onboarding/estimate/page.tsx` (627-683줄)

### 로직

1. **욕실 개수 기반 자동 추가** (631-647줄)
   - 욕실 개수가 있고 선택된 공간에 욕실이 없으면
   - 자동으로 `bathroom_core: 'standard'` 추가

2. **방 개수 기반 자동 추가** (649-665줄)
   - 방 개수가 있고 거실/방이 선택되지 않았으면
   - 자동으로 `wall_finish: 'wallpaper'`, `floor_finish: 'laminate'` 추가

3. **병합 로직** (667-683줄)
   - 고객 정보 기반 공정을 `filteredProcessesBySpace`와 병합
   - 고객이 이미 선택한 공정이 있으면 자동 추가하지 않음 (고객 선택 우선)

---

## 📝 주요 특징

### 1. 단일 진실 소스 (Single Source of Truth)
- `processSelections`가 견적 계산의 유일한 공정 선택 데이터 소스
- `selectedSpaces`는 UI 표시용으로만 사용, 계산에는 사용하지 않음

### 2. 공간별 세부 선택
- 각 공간별로 세부 공정 카테고리 선택 가능
- 예: 거실은 벽지, 주방은 타일 등 공간별로 다른 선택 가능

### 3. 고객 선택 우선
- 고객이 명시적으로 선택한 공정이 자동 추가된 공정보다 우선
- 고객 정보 기반 자동 추가는 고객이 선택하지 않은 경우에만 수행

### 4. 빈 객체 체크 강화
- 실제 공정 데이터가 있는지 검증
- 빈 객체 `{}`는 유효하지 않은 것으로 처리

---

## 🔗 관련 파일

1. **타입 정의**
   - `lib/estimate/calculator-v3.ts` (162-164줄, 187줄)
   - `types/spaceProcess.ts` (전체)

2. **Store 관리**
   - `lib/store/processStore.ts` (전체)

3. **처리 로직**
   - `lib/estimate/calculator-v3.ts` (433-535줄)
   - `app/onboarding/estimate/page.tsx` (627-805줄)

4. **검증 로직**
   - `app/api/estimate/v3/route.ts` (42-48줄)
   - `lib/estimate/calculator-v3.ts` (429-431줄)

---

## 📅 작성일
2024년 12월

## 📌 버전
V3 (calculator-v3.ts 기준)

















