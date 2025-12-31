# V4 최종 견적 미표시 원인 분석 보고서

**작성일**: 2025-12-18  
**목적**: 최종 견적이 표시되지 않는 문제의 원인 분석

---

## 🔍 문제 현상

- 견적 계산 후 결과가 표시되지 않음
- `isSuccess: false`로 반환됨
- `breakdown`이 비어있음
- `selectedSpaces: Array(0)` - 선택된 공간이 없음

---

## 📊 데이터 흐름 추적

### 1. 프론트엔드 → API 호출

**파일**: `app/onboarding/estimate/page.tsx:671-688`

**로직**:
```typescript
const response = await fetch('/api/estimate/v4', {
  method: 'POST',
  body: JSON.stringify({
    spaceInfo: { pyeong: py, ... },
    selectedSpaces: v4SelectedSpaces,  // ⚠️ 빈 배열일 수 있음
    selectedProcesses: v4SelectedProcesses,
    ...
  }),
})
```

**문제점**:
- `v4SelectedSpaces`가 빈 배열이면 공정이 선택되지 않음

---

### 2. API → V4 엔진 호출

**파일**: `app/api/estimate/v4/route.ts:77`

**로직**:
```typescript
const result = await calculateEstimateV4ForUI(input, forceGrade)
return NextResponse.json({ status: 'SUCCESS', result })
```

**문제점**:
- `input.selectedSpaces`가 빈 배열이어도 에러 없이 처리됨
- 하지만 공정 선택에 실패하면 breakdown이 비어있음

---

### 3. ProcessPicker → 공정 선택

**파일**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts:96-136`

**로직**:
```typescript
export function pickProcessesSimple(
  personality: PersonalityResultV4,
  selectedSpaces: string[]  // ⚠️ 빈 배열일 수 있음
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
  
  // 선택된 공간의 필수 공정 추가
  for (const space of selectedSpaces) {  // ⚠️ 빈 배열이면 실행 안 됨
    const processes = spaceProcessMap[space] || []
    for (const processId of processes) {
      result.push({ processId, priority: 'must', ... })
    }
  }
  
  return result  // ⚠️ 빈 배열 반환 가능
}
```

**문제점**:
- `selectedSpaces`가 빈 배열이면 `result`가 빈 배열로 반환됨
- 공정이 없으면 breakdown이 비어있음

---

### 4. EstimateEngine → breakdown 생성

**파일**: `lib/estimate-v4/engines/estimate/EstimateEngineV4.ts:36-66`

**로직**:
```typescript
const blocks: ProcessBlockV4[] = []

for (const processStrategy of strategy.processStrategy) {
  if (processStrategy.priority === 'optional') {
    continue
  }
  
  const block = await calculateProcessCosts(...)
  blocks.push(block)
}

// breakdown이 비어있으면 경고
if (blocks.length === 0) {
  logger.warn('EstimateEngine', 'breakdown이 비어있음', ...)
}

return {
  status: 'SUCCESS',
  breakdown: blocks,  // ⚠️ 빈 배열일 수 있음
  ...
}
```

**문제점**:
- `strategy.processStrategy`가 빈 배열이면 `blocks`도 빈 배열
- 하지만 `status: 'SUCCESS'`로 반환됨 (에러 아님)

---

### 5. UIAdapter → UI 변환

**파일**: `lib/estimate-v4/adapters/UIAdapter.ts:47-53`

**로직**:
```typescript
if (!estimate.breakdown || estimate.breakdown.length === 0) {
  logger.warn('UIAdapter', 'breakdown이 비어있음', ...)
  return {
    isSuccess: true,  // ⚠️ 성공으로 처리
    breakdown: [],
    ...
  }
}
```

**문제점**:
- breakdown이 비어있어도 `isSuccess: true`로 반환됨
- 하지만 UI에서 `total.formatted`가 `'-'`로 표시됨

---

### 6. 프론트엔드 → UI 렌더링

**파일**: `app/onboarding/estimate/page.tsx:1290-1381`

**로직**:
```typescript
// V4 3등급 카드
{v4Estimate && !isCalculating && currentEstimate && (
  // 등급 카드 표시
)}

// 선택된 등급 상세
{currentEstimate && selectedGrade && currentEstimate.isSuccess && (
  // 견적 상세 표시
)}
```

**문제점**:
- `currentEstimate.isSuccess`가 `false`이면 상세가 표시되지 않음
- 하지만 breakdown이 비어있어도 `isSuccess: true`이므로 조건은 통과
- 실제 문제는 `breakdown`이 비어있어서 표시할 내용이 없음

---

## 🔴 발견된 주요 문제점

### 문제 1: selectedSpaces가 비어있으면 공정이 선택되지 않음

**위치**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts:113-125`

**문제**:
- `selectedSpaces`가 빈 배열이면 `spaceProcessMap`에서 공정을 찾을 수 없음
- 결과적으로 `result`가 빈 배열로 반환됨

**결과**:
- `strategy.processStrategy`가 빈 배열
- `EstimateEngine`에서 `blocks`가 빈 배열
- `breakdown`이 비어있음
- 견적 금액이 `'-'`로 표시됨

---

### 문제 2: breakdown이 비어있어도 성공으로 처리됨

**위치**: `lib/estimate-v4/adapters/UIAdapter.ts:48-80`

**문제**:
- breakdown이 비어있어도 `isSuccess: true`로 반환
- 하지만 실제로는 견적이 계산되지 않았음

**결과**:
- UI에서 `total.formatted`가 `'-'`로 표시됨
- 사용자는 견적이 실패했다고 느낌

---

### 문제 3: 에러 메시지가 명확하지 않음

**위치**: `app/onboarding/estimate/page.tsx:1278-1287`

**문제**:
- `isSuccess: false`일 때만 에러 메시지 표시
- 하지만 breakdown이 비어있어도 `isSuccess: true`이므로 에러 메시지가 표시되지 않음

---

## ✅ 수정 방안

### 수정 1: selectedSpaces가 비어있을 때 기본 공정 추가

**위치**: `lib/estimate-v4/engines/strategy/ProcessPicker.ts`

**수정 내용**:
```typescript
export function pickProcessesSimple(
  personality: PersonalityResultV4,
  selectedSpaces: string[]
): ProcessStrategyItemV4[] {
  const result: ProcessStrategyItemV4[] = []
  
  // ... 기존 로직 ...
  
  // ⚠️ 선택된 공간이 없으면 기본 공정 추가
  if (selectedSpaces.length === 0) {
    logger.warn('ProcessPicker', '선택된 공간이 없어 기본 공정 사용')
    // 기본 공정: 거실 기준
    result.push(
      { processId: 'flooring', priority: 'must', reason: '기본 공정', ... },
      { processId: 'wallpaper', priority: 'must', reason: '기본 공정', ... },
      { processId: 'lighting', priority: 'must', reason: '기본 공정', ... },
    )
  }
  
  return result
}
```

---

### 수정 2: breakdown이 비어있을 때 실패로 처리

**위치**: `lib/estimate-v4/adapters/UIAdapter.ts`

**수정 내용**:
```typescript
if (!estimate.breakdown || estimate.breakdown.length === 0) {
  logger.warn('UIAdapter', 'breakdown이 비어있음', ...)
  return {
    isSuccess: false,  // ⚠️ 실패로 처리
    errorMessage: '선택된 공간이나 공정이 없어 견적을 계산할 수 없습니다.',
    breakdown: [],
    ...
  }
}
```

---

### 수정 3: UI에서 breakdown이 비어있을 때 안내 메시지 표시

**위치**: `app/onboarding/estimate/page.tsx`

**수정 내용**:
```typescript
// breakdown이 비어있을 때 안내 메시지
{currentEstimate && 
 currentEstimate.isSuccess && 
 currentEstimate.breakdown.length === 0 && (
  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6">
    <p className="text-yellow-800 font-semibold mb-2">
      ⚠️ 견적을 계산할 수 없습니다
    </p>
    <p className="text-sm text-yellow-700 mb-4">
      선택된 공간이나 공정이 없습니다. 공사 범위를 다시 선택해주세요.
    </p>
    <button
      onClick={() => router.push('/onboarding/scope')}
      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
    >
      공사 범위 선택하기
    </button>
  </div>
)}
```

---

## 🎯 우선순위

1. **긴급**: selectedSpaces가 비어있을 때 기본 공정 추가
2. **긴급**: breakdown이 비어있을 때 실패로 처리
3. **중요**: UI에서 breakdown이 비어있을 때 안내 메시지 표시

---

## 📝 확인 사항

다음 사항을 확인해야 함:
1. `selectedSpaces`가 실제로 비어있는지 (콘솔 로그 확인)
2. `processStrategy`가 비어있는지 (서버 로그 확인)
3. `breakdown`이 비어있는지 (콘솔 로그 확인)
4. 에러 메시지가 표시되는지 (UI 확인)

---

**분석 완료!** 🎉








