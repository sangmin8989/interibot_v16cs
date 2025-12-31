# V4 견적 계산 전체 로직 분석 보고서

**작성일**: 2025-12-18  
**목적**: 고객 입력 정보 기반 견적 계산 전체 플로우 분석

---

## 🔍 핵심 원칙 (헌법)

**고객이 입력한 정보만을 바탕으로 최종 견적이 나와야 함**
- 기본 공정 자동 추가 금지
- 고객이 선택하지 않은 공간/공정은 견적에 포함되지 않음
- 입력값 변경 금지 (특히 평수)

---

## 📊 전체 데이터 흐름

### 1. 고객 입력 데이터 수집

#### 1.1 공간 정보 (SpaceInfo)
**위치**: `lib/store/spaceInfoStore.ts`
- `pyeong`: 평수 (고객 직접 입력)
- `rooms`: 방 개수
- `bathrooms`: 욕실 개수
- `housingType`: 주거 형태
- `inputMethod`: 입력 방식 ('exact' = 직접 입력)

#### 1.2 선택된 공간 (SelectedSpaces)
**위치**: `lib/store/scopeStore.ts`
- `selectedSpaces`: 공간 배열
  - `id`: 공간 ID (예: 'living', 'kitchen', 'bathroom')
  - `name`: 공간 이름
  - `isSelected`: 선택 여부 (boolean)

#### 1.3 선택된 공정 (SelectedProcesses)
**위치**: `lib/store/processStore.ts`
- `selectedProcessesBySpace`: 공간별 공정 선택
  - `[spaceId][category]`: 선택된 공정 카테고리
  - 예: `{ 'kitchen': { 'kitchen_core': 'selected', ... } }`

---

### 2. 프론트엔드 데이터 변환

#### 2.1 선택된 공간 필터링
**위치**: `app/onboarding/estimate/page.tsx:490-492`

```typescript
const selectedSpaceIds = selectedSpaces
  .filter(space => space.isSelected)  // 🔒 고객이 선택한 공간만
  .map(space => space.id)
```

**문제 가능성**:
- `selectedSpaces`가 비어있거나
- 모든 공간의 `isSelected`가 `false`이면
- `selectedSpaceIds`가 빈 배열

#### 2.2 V4 공간 ID 변환
**위치**: `app/onboarding/estimate/page.tsx:502-521`

```typescript
const mapSpaceIdToV4 = (spaceId: SpaceId): string | null => {
  switch (spaceId) {
    case 'living': return 'living'
    case 'kitchen': return 'kitchen'
    case 'bathroom': return 'bathroom'
    case 'masterBedroom':
    case 'room1':
    case 'room2':
      return 'bedroom'
    // ...
  }
}
```

**변환 결과**:
- `v4SelectedSpacesFromIds`: V4 형식 공간 배열
- 예: `['living', 'kitchen', 'bathroom']`

#### 2.3 선택된 공정 필터링
**위치**: `app/onboarding/estimate/page.tsx:545-553`

```typescript
const filteredProcessesBySpace: Record<string, Record<string, string | string[] | null>> = {}
if (selectedProcessesBySpace && selectedSpaceIds.length > 0) {
  selectedSpaceIds.forEach(spaceId => {
    if (selectedProcessesBySpace[spaceId]) {
      filteredProcessesBySpace[spaceId] = selectedProcessesBySpace[spaceId]
    }
  })
}
```

**문제 가능성**:
- `selectedSpaceIds`가 비어있으면
- `filteredProcessesBySpace`가 빈 객체
- 결과적으로 `v4SelectedProcesses`도 빈 객체

#### 2.4 V4 공정 ID 변환
**위치**: `app/onboarding/estimate/page.tsx:607-627`

```typescript
const v4SelectedProcesses: Record<string, string[]> = {}
Object.entries(filteredProcessesBySpace).forEach(([spaceId, selections]) => {
  const v4SpaceId = v4SelectedSpaces.find(s => s === spaceId) || spaceId
  const processIds: string[] = []
  
  Object.entries(selections).forEach(([category, value]) => {
    if (value && value !== 'none') {
      // 카테고리 → V4 공정 ID 매핑
      if (category === 'kitchen_core') processIds.push('kitchen_core')
      if (category === 'bathroom_core') processIds.push('bathroom_waterproof')
      if (category === 'wall_finish') processIds.push('wallpaper')
      if (category === 'floor_finish') processIds.push('flooring')
      if (category === 'electric_lighting') processIds.push('lighting')
      if (category === 'entrance_core') processIds.push('storage_system')
    }
  })
  
  if (processIds.length > 0) {
    v4SelectedProcesses[v4SpaceId] = processIds
  }
})
```

**문제 가능성**:
- `filteredProcessesBySpace`가 비어있으면
- `v4SelectedProcesses`가 빈 객체
- 결과적으로 공정이 선택되지 않음

---

### 3. API 호출

#### 3.1 요청 데이터 구성
**위치**: `app/onboarding/estimate/page.tsx:671-688`

```typescript
const response = await fetch('/api/estimate/v4', {
  method: 'POST',
  body: JSON.stringify({
    spaceInfo: {
      pyeong: py,  // 🔒 고객 입력 평수 (변경 금지)
      rooms: roomCount,
      bathrooms: bathroomCount,
      ...
    },
    selectedSpaces: v4SelectedSpaces,  // V4 형식 공간 배열
    selectedProcesses: v4SelectedProcesses,  // V4 형식 공정 객체
    answers: [...],  // 성향 분석 답변
    preferences: {...},  // 선호 설정
  }),
})
```

**전달되는 데이터**:
- `selectedSpaces`: 고객이 선택한 공간만 포함
- `selectedProcesses`: 고객이 선택한 공정만 포함

---

### 4. V4 엔진 처리

#### 4.1 ProcessPicker - 공정 선택
**위치**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts:96-136`

```typescript
export function pickProcessesSimple(
  personality: PersonalityResultV4,
  selectedSpaces: string[]  // 고객이 선택한 공간
): ProcessStrategyItemV4[] {
  const result: ProcessStrategyItemV4[] = []
  
  // 공간별 필수 공정 매핑
  const spaceProcessMap: Record<string, string[]> = {
    kitchen: ['kitchen_core'],
    bathroom: ['bathroom_waterproof'],
    living: ['flooring', 'wallpaper', 'lighting'],
    bedroom: ['flooring', 'wallpaper'],
    entrance: ['storage_system'],
    storage: ['storage_system'],
  }
  
  // 🔒 고객이 선택한 공간의 필수 공정만 추가
  for (const space of selectedSpaces) {
    const processes = spaceProcessMap[space] || []
    for (const processId of processes) {
      if (!result.find(r => r.processId === processId)) {
        result.push({
          processId,
          priority: 'must',
          reason: `${space} 공간 필수 공정`,
          ...
        })
      }
    }
  }
  
  // 성향 기반 추천 공정 추가
  const personalityProcesses = getPersonalityBasedProcesses(personality, selectedSpaces)
  for (const proc of personalityProcesses) {
    if (!result.find(r => r.processId === proc.processId)) {
      result.push(proc)
    }
  }
  
  return result  // 🔒 고객이 선택한 공간/공정만 포함
}
```

**핵심 로직**:
- `selectedSpaces`가 비어있으면 `result`가 빈 배열
- **기본 공정 자동 추가 금지** (헌법)
- 고객이 선택하지 않은 공간의 공정은 포함되지 않음

#### 4.2 EstimateEngine - 견적 계산
**위치**: `lib/estimate-v4/engines/estimate/EstimateEngineV4.ts:36-66`

```typescript
const blocks: ProcessBlockV4[] = []

for (const processStrategy of strategy.processStrategy) {
  if (processStrategy.priority === 'optional') {
    continue  // 선택적 공정은 제외
  }
  
  const block = await calculateProcessCosts(
    processStrategy.processId,
    spaceInfo,
    strategy.recommendedGrade,
    Object.keys(selectedProcesses)  // 선택된 공간 전달
  )
  
  blocks.push(block)
}

return {
  status: 'SUCCESS',
  breakdown: blocks,  // 🔒 계산된 공정만 포함
  ...
}
```

**핵심 로직**:
- `strategy.processStrategy`가 비어있으면 `blocks`도 빈 배열
- 고객이 선택하지 않은 공정은 계산되지 않음

---

## 🔴 발견된 문제점

### 문제 1: selectedSpaces가 비어있음

**원인 분석**:
1. `scopeStore.selectedSpaces`에서 `isSelected: true`인 공간이 없음
2. 또는 `selectedSpaces` 자체가 빈 배열

**확인 방법**:
```typescript
console.log('📍 scopeStore.selectedSpaces:', selectedSpaces)
console.log('📍 선택된 공간:', selectedSpaces.filter(s => s.isSelected))
```

**결과**:
- `selectedSpaceIds`가 빈 배열
- `v4SelectedSpaces`가 빈 배열
- `ProcessPicker`에서 공정이 선택되지 않음
- `breakdown`이 비어있음

---

### 문제 2: selectedProcessesBySpace가 비어있음

**원인 분석**:
1. `processStore.selectedProcessesBySpace`가 비어있음
2. 또는 선택된 공간에 해당하는 공정이 없음

**확인 방법**:
```typescript
console.log('📍 processStore.selectedProcessesBySpace:', selectedProcessesBySpace)
console.log('🔍 선택된 공간의 공정만 필터링:', Object.keys(filteredProcessesBySpace))
```

**결과**:
- `filteredProcessesBySpace`가 빈 객체
- `v4SelectedProcesses`가 빈 객체
- 하지만 `ProcessPicker`는 `selectedSpaces` 기반으로 공정을 선택하므로 직접적인 영향은 적음

---

### 문제 3: 공간-공정 매핑 불일치

**원인 분석**:
1. 고객이 공간은 선택했지만 공정을 선택하지 않음
2. 또는 공정 카테고리와 V4 공정 ID 매핑이 잘못됨

**확인 방법**:
```typescript
console.log('📊 V4 견적 계산 시작:', {
  selectedSpaces: v4SelectedSpaces,
  selectedProcesses: v4SelectedProcesses,
})
```

---

## ✅ 해결 방안

### 방안 1: selectedSpaces 확인 및 디버깅 강화

**위치**: `app/onboarding/estimate/page.tsx:494-541`

**수정 내용**:
- `selectedSpaces`가 비어있을 때 상세 로그 출력
- `scopeStore`에서 데이터가 제대로 로드되는지 확인

### 방안 2: 공정 선택 로직 검증

**위치**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts`

**수정 내용**:
- `selectedSpaces`가 비어있을 때 경고 로그 출력
- 하지만 **기본 공정 자동 추가 금지** (헌법)

### 방안 3: UI에서 명확한 안내

**위치**: `app/onboarding/estimate/page.tsx`

**수정 내용**:
- `selectedSpaces`가 비어있을 때 "공사 범위를 선택해주세요" 안내
- `breakdown`이 비어있을 때 원인별 안내 메시지

---

## 📝 확인 체크리스트

다음 사항을 순서대로 확인:

1. **scopeStore 데이터 확인**
   - `selectedSpaces` 배열이 존재하는가?
   - `isSelected: true`인 공간이 있는가?

2. **processStore 데이터 확인**
   - `selectedProcessesBySpace` 객체가 존재하는가?
   - 선택된 공간에 해당하는 공정이 있는가?

3. **데이터 변환 확인**
   - `v4SelectedSpaces` 배열이 비어있지 않은가?
   - `v4SelectedProcesses` 객체가 비어있지 않은가?

4. **ProcessPicker 결과 확인**
   - `processStrategy` 배열이 비어있지 않은가?
   - 선택된 공간에 해당하는 공정이 포함되어 있는가?

5. **EstimateEngine 결과 확인**
   - `breakdown` 배열이 비어있지 않은가?
   - 각 공정의 비용이 계산되었는가?

---

**분석 완료!** 🎉








