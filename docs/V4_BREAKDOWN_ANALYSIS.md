# V4 공정별 상세 견적 미표시 원인 분석 보고서

**작성일**: 2025-12-18  
**목적**: 공정별 상세 견적이 표시되지 않는 문제의 원인 분석

---

## 🔍 문제 현상

- "공정별 상세" 탭 클릭 시 상세 내역이 표시되지 않음
- 총 견적만 나오고 공정별 breakdown이 없음
- UI에 "⚠️ 표시할 상세 견적이 없습니다" 메시지 표시

---

## 📊 데이터 흐름 추적

### 1. ProcessPicker → 공정 선택

**파일**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts`

**문제점 발견**:
```typescript
// 86-92줄: 공간별 필수 공정 매핑
const spaceProcessMap: Record<string, string[]> = {
  kitchen: ['kitchen_core', 'kitchen_tile'],  // ❌ 'kitchen_tile'은 CostCalculator에 없음
  bathroom: ['bathroom_waterproof', 'bathroom_tile'],  // ❌ 'bathroom_tile'은 CostCalculator에 없음
  livingroom: ['flooring', 'wallpaper', 'lighting'],  // ❌ 'livingroom'은 V4 공간 ID가 아님
  bedroom: ['flooring', 'wallpaper'],  // ❌ 'bedroom'은 V4 공간 ID가 아님
  entrance: ['entrance_tile', 'shoe_storage'],  // ❌ 둘 다 CostCalculator에 없음
}
```

**문제**:
1. `spaceProcessMap`의 공간 ID가 V4 형식과 불일치
   - V4: `kitchen`, `bathroom`, `living`, `bedroom`, `entrance`
   - 코드: `kitchen`, `bathroom`, `livingroom`, `bedroom`, `entrance`
2. `kitchen_tile`, `bathroom_tile`, `entrance_tile`, `shoe_storage` 등은 `CostCalculator`의 `PROCESS_MATERIAL_MAP`에 없음
3. `PROCESS_TO_SPACE_MAP`가 정의되지 않음 (134, 159, 186줄에서 사용하지만 정의 없음)

---

### 2. CostCalculator → 공정 비용 계산

**파일**: `lib/estimate-v4/engines/estimate/CostCalculator.ts`

**문제점 발견**:
```typescript
// 29-40줄: V4_PROCESS_TO_HEONGBEOP 매핑
const V4_PROCESS_TO_HEONGBEOP: Record<string, ProcessId> = {
  kitchen_core: 'kitchen',  // ✅ 있음
  bathroom_waterproof: 'bathroom',  // ✅ 있음
  storage_system: 'storage',  // ✅ 있음
  soundproof: 'finish',
  lighting: 'electric',
  flooring: 'finish',
  wallpaper: 'finish',
  window: 'window',
  door: 'door',
  demolition: 'demolition',
  // ❌ kitchen_tile, bathroom_tile, entrance_tile, shoe_storage 없음
}
```

**문제**:
- ProcessPicker가 반환하는 `kitchen_tile`, `bathroom_tile` 등이 `V4_PROCESS_TO_HEONGBEOP`에 없음
- `PROCESS_MATERIAL_MAP`에도 없음 (68-148줄)
- 따라서 `calculateProcessCosts`에서 처리 불가 → 에러 발생 또는 빈 배열 반환

---

### 3. EstimateEngine → breakdown 생성

**파일**: `lib/estimate-v4/engines/estimate/EstimateEngineV4.ts`

**로직**:
```typescript
// 36-66줄: 공정별 비용 계산
for (const processStrategy of strategy.processStrategy) {
  if (processStrategy.priority === 'optional') {
    continue // 선택적 공정은 제외
  }
  
  const block = await calculateProcessCosts(...)
  blocks.push(block)
}
```

**문제**:
- `priority === 'optional'`인 공정은 제외됨
- `calculateProcessCosts`에서 에러 발생 시 catch되어 에러가 throw되면 전체 실패
- 일부 공정만 실패해도 전체 breakdown이 비어있을 수 있음

---

### 4. UIAdapter → breakdown 변환

**파일**: `lib/estimate-v4/adapters/UIAdapter.ts`

**로직**:
```typescript
// 47-53줄: 필터링
const filteredBreakdown = estimate.breakdown!.filter(block => {
  if (block.spaces.includes('common')) return true
  if (selectedSpaces.length === 0) return true
  return block.spaces.some(space => selectedSpaces.includes(space))
})

// 63-79줄: 변환
breakdown: filteredBreakdown.map(block => ({
  processName: block.processName,
  amount: formatWon(block.processTotal),
  percentage: ...,
  materials: block.materials.map(...),
  labor: block.labor ? {...} : null,
}))
```

**문제 가능성**:
- `estimate.breakdown`이 `undefined`일 수 있음 (실패 시)
- `filteredBreakdown`이 빈 배열일 수 있음 (필터링이 너무 강함)
- `block.materials`가 빈 배열일 수 있음 (자재 조회 실패 시)

---

### 5. 프론트엔드 → breakdown 렌더링

**파일**: `app/onboarding/estimate/page.tsx`

**로직**:
```typescript
// 1412줄: breakdown 렌더링
{currentEstimate.breakdown.length > 0 ? (
  currentEstimate.breakdown.map((block, idx) => (
    // 자재/노무 표시
  ))
) : (
  // "표시할 상세 견적이 없습니다" 메시지
)}
```

**문제**:
- `currentEstimate.breakdown`이 빈 배열이면 메시지 표시
- 하지만 실제로는 breakdown이 생성되지 않았을 가능성

---

## 🔴 발견된 주요 문제점

### 문제 1: ProcessPicker의 공간 ID 불일치

**위치**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts:86-92`

**문제**:
- `livingroom` → V4는 `living` 사용
- `bedroom` → V4는 `bedroom` 사용 (일치하지만 다른 공간 ID와 혼동 가능)

**수정 필요**:
```typescript
const spaceProcessMap: Record<string, string[]> = {
  kitchen: ['kitchen_core'],  // kitchen_tile 제거 (CostCalculator에 없음)
  bathroom: ['bathroom_waterproof'],  // bathroom_tile 제거
  living: ['flooring', 'wallpaper', 'lighting'],  // livingroom → living
  bedroom: ['flooring', 'wallpaper'],
  entrance: ['storage_system'],  // entrance_tile, shoe_storage 제거
  storage: ['storage_system'],
}
```

---

### 문제 2: 존재하지 않는 공정 ID

**위치**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts:87-91`

**문제**:
- `kitchen_tile`, `bathroom_tile`, `entrance_tile`, `shoe_storage`는 `CostCalculator`에 없음
- `V4_PROCESS_TO_HEONGBEOP`에도 없음
- `PROCESS_MATERIAL_MAP`에도 없음

**결과**:
- `calculateProcessCosts`에서 처리 불가
- 에러 발생 또는 빈 ProcessBlockV4 반환

---

### 문제 3: PROCESS_TO_SPACE_MAP 미정의

**위치**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts:134, 159, 186`

**문제**:
- `PROCESS_TO_SPACE_MAP['soundproof']` 사용하지만 정의되지 않음
- `PROCESS_TO_SPACE_MAP['storage_system']` 사용하지만 정의되지 않음
- `PROCESS_TO_SPACE_MAP['child_safety']` 사용하지만 정의되지 않음

**결과**:
- `|| []`로 빈 배열 반환
- 공간 체크가 항상 실패하여 공정이 추가되지 않음

---

### 문제 4: 필터링 로직이 너무 강함

**위치**: `lib/estimate-v4/adapters/UIAdapter.ts:47-53`

**문제**:
- `selectedSpaces`가 비어있으면 모든 공정 표시
- 하지만 `selectedSpaces`가 있으면 매칭되는 공정만 표시
- `block.spaces`가 올바르게 설정되지 않으면 모든 공정이 필터링됨

---

## ✅ 수정 방안 (적용 완료)

### ✅ 수정 1: ProcessPicker의 공간 매핑 수정

**적용 완료**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts:103-110`
- 존재하지 않는 공정 ID 제거 (`kitchen_tile`, `bathroom_tile` 등)
- 공간 ID 수정 (`livingroom` → `living`)
- CostCalculator에 존재하는 공정만 사용

### ✅ 수정 2: PROCESS_TO_SPACE_MAP 정의 추가

**적용 완료**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts:79-91`
- 모든 공정에 대한 공간 매핑 정의
- `soundproof`, `storage_system`, `child_safety` 등 포함

### ✅ 수정 3: 디버깅 로그 추가

**적용 완료**: 
- `app/onboarding/estimate/page.tsx`: breakdown 상세 로그 추가
- `lib/estimate-v4/engines/estimate/EstimateEngineV4.ts`: breakdown 생성 로그 추가
- `lib/estimate-v4/adapters/UIAdapter.ts`: breakdown 필터링 로그 추가
- `lib/estimate-v4/engines/estimate/CostCalculator.ts`: 자재 매핑 없음 경고 추가

### ✅ 수정 4: 필터링 로직 개선

**적용 완료**: `lib/estimate-v4/adapters/UIAdapter.ts:47-53`
- breakdown이 없을 때 안전 처리
- 필터링 전후 개수 로그 추가

---

## 🎯 우선순위

1. **긴급**: ProcessPicker의 공간 매핑 수정 (존재하지 않는 공정 ID 제거)
2. **긴급**: PROCESS_TO_SPACE_MAP 정의 추가
3. **중요**: 디버깅 로그 추가하여 실제 breakdown 데이터 확인
4. **중요**: 필터링 로직 검증 및 완화

---

## 📝 확인 사항

다음 사항을 확인해야 함:
1. API 응답에서 `breakdown` 배열이 실제로 있는지
2. `breakdown` 배열의 각 항목에 `materials`와 `labor`가 있는지
3. `block.spaces`가 올바르게 설정되는지
4. 필터링 로직이 breakdown을 모두 제거하는지

---

**분석 완료!** 🎉








