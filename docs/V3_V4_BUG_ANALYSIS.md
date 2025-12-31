# V3 버그 지침서 vs V4 설계 분석 보고서

**작성일**: 2025-12-18  
**목적**: V3 버그가 V4에서 재현 가능한지, V4 설계가 이를 방지하는지 분석

---

## 📊 종합 분석 요약

| 버그 | V3 발생 여부 | V4 재현 가능성 | V4 대응 상태 | 우선순위 |
|------|------------|--------------|------------|---------|
| **버그 1**: 선택하지 않은 공간 표시 | ✅ Critical | ⚠️ **높음** | ❌ 미대응 | Critical |
| **버그 2**: 설계 이유 데이터 불일치 | ✅ Critical | ✅ 해당 없음 | - | - |
| **버그 3**: 남은 선택에서 거실 수납 추천 | ✅ High | ⚠️ **높음** | ❌ 미대응 | High |
| **버그 4**: 성향 분석 미반영 | ✅ High | ✅ 부분 해결 | ⚠️ UI 문구 필요 | Medium |
| **버그 5**: 폐기물 양 검증 | ✅ Medium | ⚠️ 미구현 | ❌ 미구현 | Low |

---

## 🔴 Critical: 버그 1 - 선택하지 않은 공간 표시

### V3 현상
- 사용자가 **주방만** 선택했는데 다른 공간들(living, bathroom 등)이 0원으로 표시됨
- UI에서 불필요한 정보가 노출되어 혼란

### V3 원인 분석
```typescript
// app/onboarding/estimate/page.tsx (1290-1307줄)
{Object.entries(currentEstimate?.spaces || {}).map(([key, space]) => {
  const willDisplay = space && 
                    space.items && 
                    space.items.length > 0 && 
                    (space.subtotal > 0 || key === 'common') &&
                    !space.spaceName?.includes('(미선택)');
  // 문제: selectedSpaces 체크 없음!
})}
```

**문제점**: `selectedSpaces`를 체크하지 않고 모든 공간을 순회

### V4 설계 분석

#### 현재 V4 구조
```typescript
// lib/estimate-v4/adapters/UIAdapter.ts
breakdown: estimate.breakdown!.map(block => ({
  processName: block.processName,
  amount: formatWon(block.processTotal),
  percentage: Math.round((block.processTotal / summary.grandTotal) * 100)
}))
```

**문제점**:
1. V4의 `ProcessBlockV4`에는 `spaceId` 정보가 없음
2. `breakdown`은 공정별로만 표시하고 공간별 필터링 없음
3. 선택된 공간 정보(`selectedSpaces`)를 UIAdapter에 전달하지 않음

#### V4에서 재현 가능성: ⚠️ **높음**

**이유**:
- V4도 공정별 breakdown만 제공하고 공간별 필터링 로직이 없음
- 만약 V4 결과를 V3와 유사한 UI로 표시한다면 동일한 문제 발생 가능

### V4 수정 방안

#### 1. ProcessBlockV4에 공간 정보 추가
```typescript
// lib/estimate-v4/types/estimate.types.ts
export interface ProcessBlockV4 {
  processId: string
  processName: string
  spaces: string[]  // ← 추가: 이 공정이 적용되는 공간 목록
  materials: MaterialItemV4[]
  labor: LaborItemV4
  // ...
}
```

#### 2. UIAdapter에 selectedSpaces 필터링 추가
```typescript
// lib/estimate-v4/adapters/UIAdapter.ts
export function adaptForUI(
  estimate: EstimateResultV4,
  personality: PersonalityResultV4,
  strategy: StrategyResultV4,
  selectedSpaces: string[]  // ← 추가
): UIEstimateV4 {
  // ...
  
  // 선택된 공간의 공정만 필터링
  const filteredBreakdown = estimate.breakdown!.filter(block => {
    // common 공정은 항상 표시
    if (block.spaces.includes('common')) return true
    // 선택된 공간의 공정만 표시
    return block.spaces.some(space => selectedSpaces.includes(space))
  })
  
  return {
    // ...
    breakdown: filteredBreakdown.map(block => ({
      processName: block.processName,
      amount: formatWon(block.processTotal),
      percentage: Math.round((block.processTotal / summary.grandTotal) * 100)
    })),
  }
}
```

#### 3. CostCalculator에서 공간 정보 포함
```typescript
// lib/estimate-v4/engines/estimate/CostCalculator.ts
export async function calculateProcessCosts(
  processId: string,
  spaceInfo: SpaceInfoV4,
  grade: GradeV4,
  selectedSpaces: string[]  // ← 추가
): Promise<ProcessBlockV4> {
  // ...
  
  return {
    processId,
    processName: getProcessName(processId),
    spaces: [space],  // ← 공간 정보 포함
    materials,
    labor,
    // ...
  }
}
```

---

## 🔴 Critical: 버그 2 - "설계 이유" 데이터 불일치

### V3 현상
- "이번 분석에서 제외한 것": 주방 리모델링 제외
- "인테리봇 판단 요약": 주방 리모델링 포함
- 같은 화면에서 서로 다른 데이터 표시

### V4 설계 분석

**V4에는 "설계 이유" 섹션이 없음**

**이유**:
- V4는 순수 견적 계산 엔진
- V3의 `ExplanationEngine`, `InterventionEngine` 결과를 표시하는 UI 기능은 V4 범위 밖

**결론**: ✅ **V4에서 해당 없음** (V3 전용 UI 기능)

---

## 🟡 High: 버그 3 - "남은 선택"에서 거실 수납 추천

### V3 현상
- 사용자가 **주방만** 선택
- "남은 선택 > 필수 선택"에 **거실 수납** 표시
- 선택하지 않은 공간의 공정을 "필수"로 추천

### V3 원인 분석
```typescript
// 추정 위치: ProcessEngine 또는 NeedsEngine
if (needs.includes('storage')) {
  recommendedProcesses.push({
    processId: 'living_storage',
    priority: 'must',  // ← 문제: selectedSpaces 체크 없음
    reason: '...'
  })
}
```

### V4 설계 분석

#### 현재 V4 구조
```typescript
// lib/estimate-v4/engines/strategy/ProcessPicker.ts
function getPersonalityBasedProcesses(
  personality: PersonalityResultV4
): ProcessStrategyItemV4[] {
  // ...
  
  // 수납중요도 높으면 수납 시스템 추천
  const storageScore = traitScores.find(t => t.traitCode === 'storage_importance')?.score ?? 5
  if (storageScore >= 7) {
    result.push({
      processId: 'storage_system',
      priority: 'recommended',
      reason: '수납중요도가 높아 맞춤 수납 추천',
      personalityMatch: storageScore / 10,
    })
  }
  // ← 문제: selectedSpaces 체크 없음!
}
```

**문제점**:
1. `getPersonalityBasedProcesses`가 `selectedSpaces`를 받지 않음
2. 성향만으로 공정을 추천하여 선택하지 않은 공간의 공정도 추천 가능

#### V4에서 재현 가능성: ⚠️ **높음**

**이유**:
- V4의 `pickProcessesSimple`에서 성향 기반 추천 공정을 추가할 때 `selectedSpaces` 체크 없음
- `storage_system`이 거실에 속하는 공정이라면, 거실을 선택하지 않아도 추천될 수 있음

### V4 수정 방안

#### 1. ProcessPicker에 공간 매핑 추가
```typescript
// lib/estimate-v4/engines/strategy/ProcessPicker.ts

/**
 * 공정 → 공간 매핑
 */
const PROCESS_TO_SPACE_MAP: Record<string, string[]> = {
  'storage_system': ['living', 'bedroom', 'entrance'],
  'soundproof': ['living', 'bedroom'],
  'child_safety': ['living', 'bedroom', 'kitchen'],
  // ...
}

/**
 * 성향 기반 추천 공정 (수정)
 */
function getPersonalityBasedProcesses(
  personality: PersonalityResultV4,
  selectedSpaces: string[]  // ← 추가
): ProcessStrategyItemV4[] {
  const result: ProcessStrategyItemV4[] = []
  const { traitScores, classifiedTypes } = personality

  // 수납중요도 높으면 수납 시스템 추천
  const storageScore = traitScores.find(t => t.traitCode === 'storage_importance')?.score ?? 5
  if (storageScore >= 7) {
    // ✅ 수정: 선택된 공간에 수납 공정이 포함되는지 체크
    const storageSpaces = PROCESS_TO_SPACE_MAP['storage_system'] || []
    const hasStorageSpace = storageSpaces.some(space => selectedSpaces.includes(space))
    
    if (hasStorageSpace) {
      result.push({
        processId: 'storage_system',
        priority: 'recommended',
        reason: '수납중요도가 높아 맞춤 수납 추천',
        personalityMatch: storageScore / 10,
      })
    } else {
      // 선택하지 않은 공간이면 'optional'로 낮춤
      result.push({
        processId: 'storage_system',
        priority: 'optional',
        reason: '수납중요도가 높지만 해당 공간이 선택되지 않아 선택사항으로 추천',
        personalityMatch: storageScore / 10,
      })
    }
  }
  
  // ...
}
```

#### 2. pickProcessesSimple 수정
```typescript
export function pickProcessesSimple(
  personality: PersonalityResultV4,
  selectedSpaces: string[]
): ProcessStrategyItemV4[] {
  // ...
  
  // 성향 기반 추천 공정 추가 (selectedSpaces 전달)
  const personalityProcesses = getPersonalityBasedProcesses(personality, selectedSpaces)
  // ...
}
```

---

## 🟡 High: 버그 4 - 성향 분석 미반영

### V3 현상
- 성향 분석 질문을 했는데도 "특정 선택 기준 없이 일반적인 조합으로 구성된 결과입니다"로 표시
- 성향 분석 결과가 견적/추천에 반영되지 않음

### V4 설계 분석

#### V4는 성향 분석을 필수로 사용
```typescript
// lib/estimate-v4/index.ts
export async function calculateEstimateV4ForUI(
  input: CollectedInputV4
): Promise<UIEstimateV4> {
  // Step 1: 성향 분석 (필수)
  const personality = await analyzePersonality(input)
  
  // Step 2: 전략 결정 (성향 기반)
  const strategy = await determineStrategy(
    personality,
    input.spaceInfo,
    input.preferences,
    input.selectedSpaces
  )
  
  // Step 3: 견적 계산
  const estimate = await calculateEstimate(strategy, ...)
}
```

**V4 장점**:
- ✅ 성향 분석이 파이프라인의 필수 단계
- ✅ 전략 결정과 공정 선택에 성향 반영

**하지만**:
- ⚠️ UI 문구는 V4 범위 밖 (프론트엔드에서 처리)
- V4 결과를 사용하는 UI에서 성향 분석 반영 여부를 표시해야 함

### V4 수정 방안

#### UIAdapter에 성향 분석 반영 여부 추가
```typescript
// lib/estimate-v4/adapters/UIAdapter.ts
export interface UIEstimateV4 {
  // ...
  
  /** 성향 분석 반영 여부 */
  hasPersonalityData: boolean  // ← 추가
  
  /** 성향 분석 기반 설명 */
  personalityBasedMessage?: string  // ← 추가
}

export function adaptForUI(...): UIEstimateV4 {
  // ...
  
  // 성향 분석 반영 여부 판단
  const hasPersonalityData = personality.traitScores.length > 0 && 
                             personality.traitScores.some(s => s.confidence > 0.5)
  
  return {
    // ...
    hasPersonalityData,
    personalityBasedMessage: hasPersonalityData
      ? '고객님의 성향 분석 결과를 반영한 맞춤 견적입니다.'
      : '특정 선택 기준 없이 일반적인 조합으로 구성된 결과입니다.',
  }
}
```

---

## 🟢 Medium: 버그 5 - 폐기물 양 검증

### V3 현상
- 주방만 철거하는데 폐기물 5.0톤 계산
- 30평 주방 리모델링 시 5톤이 적정한지 확인 필요

### V4 설계 분석

**V4에는 폐기물 계산 로직이 없음**

**이유**:
- V4는 기본 구조만 구현
- 폐기물 계산은 `CostCalculator`에 미구현

### V4 수정 방안

#### 폐기물 계산 로직 추가 (향후)
```typescript
// lib/estimate-v4/engines/estimate/CostCalculator.ts

/**
 * 폐기물 양 계산
 */
function calculateWasteAmount(
  processId: string,
  spaceInfo: SpaceInfoV4,
  selectedSpaces: string[]
): number {
  // 공간별 폐기물 계수
  const wasteCoefficient: Record<string, number> = {
    kitchen: 0.15,  // 주방 1개당 0.15톤
    bathroom: 0.10, // 욕실 1개당 0.10톤
    living: 0.05,   // 거실 평당 0.05톤
    // ...
  }
  
  // 선택된 공간별 폐기물 합산
  let totalWaste = 0
  for (const space of selectedSpaces) {
    const coefficient = wasteCoefficient[space] || 0
    if (space === 'kitchen' || space === 'bathroom') {
      totalWaste += coefficient
    } else {
      totalWaste += coefficient * spaceInfo.pyeong
    }
  }
  
  return Math.round(totalWaste * 10) / 10  // 소수점 1자리
}
```

---

## 🎯 V4 수정 우선순위

### 즉시 수정 필요 (Critical)

1. **버그 1 방지**: ProcessBlockV4에 공간 정보 추가 + UIAdapter 필터링
   - 파일: `lib/estimate-v4/types/estimate.types.ts`
   - 파일: `lib/estimate-v4/adapters/UIAdapter.ts`
   - 파일: `lib/estimate-v4/engines/estimate/CostCalculator.ts`

### 높은 우선순위 (High)

2. **버그 3 방지**: ProcessPicker에서 selectedSpaces 체크
   - 파일: `lib/estimate-v4/engines/strategy/ProcessPicker.ts`

3. **버그 4 개선**: UIAdapter에 성향 분석 반영 여부 추가
   - 파일: `lib/estimate-v4/adapters/UIAdapter.ts`

### 중간 우선순위 (Medium)

4. **버그 5**: 폐기물 계산 로직 추가 (향후)
   - 파일: `lib/estimate-v4/engines/estimate/CostCalculator.ts`

---

## 📝 결론

### V4의 장점
1. ✅ 성향 분석이 필수 단계로 통합됨
2. ✅ 모듈화된 구조로 버그 수정이 용이
3. ✅ 타입 안전성으로 일부 버그 예방

### V4의 개선 필요 사항
1. ❌ **공간 필터링 로직 부재**: 버그 1, 3 재현 가능
2. ⚠️ **UI 문구 처리 미흡**: 버그 4 부분 해결
3. ❌ **폐기물 계산 미구현**: 버그 5 미해결

### 권장 사항
1. **즉시 수정**: 버그 1, 3 방지 로직 추가
2. **단기 개선**: UIAdapter에 성향 분석 반영 여부 추가
3. **장기 계획**: 폐기물 계산 로직 구현

---

**분석 완료**








