# V3.1 Core Edition - API 문서

**버전**: 1.0.0  
**날짜**: 2025-12-10

---

## 📋 목차

1. [V31CoreEngine](#v31coreengine)
2. [타입 정의](#타입-정의)
3. [엔진 클래스](#엔진-클래스)
4. [설정](#설정)

---

## V31CoreEngine

### 클래스: `V31CoreEngine`

V3.1 Core Edition의 메인 엔진 클래스입니다.

#### 생성자

```typescript
constructor()
```

**예제**:
```typescript
const engine = new V31CoreEngine();
```

#### 메서드: `analyze`

고객 입력을 분석하여 Needs 기반 공정 추천을 생성합니다.

```typescript
analyze(
  v3Input: V3EngineInput,
  traitResult: TraitEngineResult
): V31CoreResult
```

**파라미터**:
- `v3Input`: V3 엔진 입력 (질문 답변, 공간 정보 등)
- `traitResult`: V3 TraitEngine 결과 (12개 성향 지표)

**반환값**: `V31CoreResult`

**예제**:
```typescript
const result = engine.analyze(v3Input, traitResult);

if (result.inScope) {
  console.log('Needs:', result.needsResult?.needs);
  console.log('공정:', result.actionResult?.processes);
} else {
  console.log('범위 밖:', result.scopeCheck?.message);
}
```

---

## 타입 정의

### `CoreInput`

V3.1 Core의 정규화된 입력 데이터입니다.

```typescript
interface CoreInput {
  soft: SoftInputCore;
  hard: HardInputCore;
  budget: BudgetInputCore;
  rooms: RoomsCore;
  timestamp: string;
  _source?: 'v3' | 'direct';
}
```

#### `SoftInputCore`

고객 성향 및 생활 패턴 정보입니다.

```typescript
interface SoftInputCore {
  family: FamilyComposition;      // 가족 구성
  lifestyle: LifestylePattern;    // 생활 루틴
  kitchen: KitchenPattern;        // 주방 패턴
  storage: StoragePattern;        // 수납 패턴
  cleaning: CleaningPattern;      // 청소 패턴
  lighting: LightingPreference;   // 조명 선호
}
```

#### `HardInputCore`

집 자체의 물리적 상태 정보입니다.

```typescript
interface HardInputCore {
  pyeong: number;                 // 평수 (20-34)
  building: BuildingCondition;    // 건물 상태
}
```

#### `BudgetInputCore`

예산 정보입니다.

```typescript
interface BudgetInputCore {
  level: 'low' | 'medium' | 'high';
  priceSensitive: boolean;
}
```

#### `RoomsCore`

공간 리스트입니다.

```typescript
interface RoomsCore {
  rooms: Room[];
}

interface Room {
  type: RoomType;
  label: string;
  usageTags: RoomUsageTag[];
  specialTags?: ('child-main' | 'elderly-main' | 'pet-main')[];
  issues?: string[];
}
```

### `NeedsResult`

Needs 계산 결과입니다.

```typescript
interface NeedsResult {
  needs: NeedScore[];
  timestamp: string;
  debug?: {
    inputSnapshot: any;
    appliedRules: string[];
  };
}

interface NeedScore {
  id: NeedsId;
  level: NeedsLevel;            // 'low' | 'mid' | 'high'
  category: NeedsCategory;      // 'safety' | 'lifestyle' | 'aesthetic'
  source: NeedsSource;          // 'explicit' | 'inferred'
  reasons: string[];
}
```

### `ResolutionResult`

Needs 해결 결과입니다.

```typescript
interface ResolutionResult {
  resolved: ResolvedNeed[];
  conflicts?: {
    description: string;
    resolution: string;
  }[];
  timestamp: string;
}

interface ResolvedNeed {
  id: NeedsId;
  finalLevel: NeedsLevel;
  priority: number;
  resolutionNote?: string;
}
```

### `ActionResult`

공정/옵션 추천 결과입니다.

```typescript
interface ActionResult {
  processes: ProcessRecommendation[];
  options: OptionRecommendation[];
  explanation: ExplanationSegment[];
  timestamp: string;
}

interface ProcessRecommendation {
  processId: string;
  processName: string;
  relatedNeeds: NeedsId[];
  priority: 'must' | 'recommended' | 'optional';
  reason: string;
}
```

### `V31CoreResult`

V3.1 Core 엔진의 최종 결과입니다.

```typescript
interface V31CoreResult {
  version: '3.1.0-core';
  inScope: boolean;
  scopeCheck?: {
    pyeong: number;
    housingType: string;
    occupied: boolean;
    message: string;
  };
  coreInput?: CoreInput;
  needsResult?: NeedsResult;
  resolutionResult?: ResolutionResult;
  actionResult?: ActionResult;
  timestamp: string;
  executionTime: number;
}
```

---

## 엔진 클래스

### `NeedsEngineCore`

Needs 계산 엔진입니다.

```typescript
class NeedsEngineCore {
  analyze(input: CoreInput): NeedsResult;
}
```

### `ResolutionEngine`

Needs 충돌 해결 및 우선순위 조정 엔진입니다.

```typescript
class ResolutionEngine {
  resolve(needsResult: NeedsResult, coreInput: CoreInput): ResolutionResult;
}
```

### `ActionEngine`

공정/옵션 추천 엔진입니다.

```typescript
class ActionEngine {
  generate(resolutionResult: ResolutionResult, coreInput: CoreInput): ActionResult;
}
```

### `InputAdapter`

V3 입력을 V3.1 Core Input으로 변환하는 어댑터입니다.

```typescript
class InputAdapter {
  static convertV3ToCoreInput(
    v3Input: V3EngineInput,
    traitResult: TraitEngineResult
  ): CoreInput;
}
```

---

## 설정

### `CORE_NEEDS_DEFINITIONS`

6개 Core Needs의 정의입니다.

```typescript
const CORE_NEEDS_DEFINITIONS: Record<string, NeedDefinition> = {
  safety: { id: 'safety', name: '안전성 강화', ... },
  storage: { id: 'storage', name: '수납 강화', ... },
  flow: { id: 'flow', name: '동선 최적화', ... },
  durability: { id: 'durability', name: '내구성 강화', ... },
  maintenance: { id: 'maintenance', name: '청소/관리 편의성', ... },
  brightness: { id: 'brightness', name: '채광·밝기 향상', ... },
};
```

### `SOFT_INPUT_MAPPING_RULES`

Soft Input → Needs 매핑 규칙입니다.

```typescript
const SOFT_INPUT_MAPPING_RULES = {
  family: {
    hasInfant: [...],
    hasElderly: [...],
    hasPet: [...],
  },
  lifestyle: {
    remoteWork: [...],
    timeAtHome: [...],
  },
  // ...
};
```

### `NEEDS_TO_PROCESS_MAPPING`

Needs → Process 매핑 규칙입니다.

```typescript
const NEEDS_TO_PROCESS_MAPPING: NeedsToProcessMapping[] = [
  {
    needsId: 'safety',
    processes: [
      {
        processId: 'bathroom-floor',
        priority: 'must',
        reasonTemplate: '...',
        minLevel: 'mid',
      },
      // ...
    ],
  },
  // ...
];
```

### `CORE_PROCESSES`

21개 공정 정의입니다.

```typescript
const CORE_PROCESSES: ProcessDefinition[] = [
  {
    id: 'bathroom-floor',
    name: '욕실 바닥 타일',
    category: 'bathroom',
    description: '미끄럼 방지 및 청소 편의를 위한 바닥 타일 교체',
  },
  // ...
];
```

---

## 헬퍼 함수

### `isInCoreScope`

입력이 Core Edition 범위 내인지 확인합니다.

```typescript
function isInCoreScope(
  pyeong: number,
  housingType: string,
  occupied: boolean
): boolean
```

**예제**:
```typescript
if (!isInCoreScope(30, 'apartment', true)) {
  console.log('Core Edition 범위 밖입니다');
}
```

### `getPyeongCategory`

평수 카테고리를 반환합니다.

```typescript
function getPyeongCategory(pyeong: number): 'small' | 'medium' | 'large' | 'out-of-range'
```

### `getNeedsKoreanName`

Needs ID를 한글 이름으로 변환합니다.

```typescript
function getNeedsKoreanName(needsId: NeedsId): string
```

**예제**:
```typescript
getNeedsKoreanName('safety'); // '안전성 강화'
```

---

## 사용 예제

### 기본 사용

```typescript
import { V31CoreEngine } from '@/lib/analysis/engine-v3.1-core';
import { V3Engine } from '@/lib/analysis/engine-v3';

// V3 엔진 실행
const v3Engine = new V3Engine();
const v3Result = await v3Engine.analyze(v3Input);

// V3.1 Core 실행
const v31Engine = new V31CoreEngine();
const v31Result = v31Engine.analyze(v3Input, v3Result.traitResult);

// 결과 사용
if (v31Result.inScope) {
  const processes = v31Result.actionResult?.processes || [];
  processes.forEach(proc => {
    console.log(`${proc.processName}: ${proc.reason}`);
  });
}
```

### 개별 엔진 사용

```typescript
import { NeedsEngineCore, ResolutionEngine, ActionEngine } from '@/lib/analysis/engine-v3.1-core/engines';

const needsEngine = new NeedsEngineCore();
const resolutionEngine = new ResolutionEngine();
const actionEngine = new ActionEngine();

// 순차 실행
const needsResult = needsEngine.analyze(coreInput);
const resolutionResult = resolutionEngine.resolve(needsResult, coreInput);
const actionResult = actionEngine.generate(resolutionResult, coreInput);
```

---

## 에러 처리

### 범위 밖 처리

```typescript
const result = engine.analyze(v3Input, traitResult);

if (!result.inScope) {
  console.error('범위 밖:', result.scopeCheck?.message);
  // Extended Edition 사용 또는 V3 엔진 사용
  return;
}
```

### 타입 가드

```typescript
function isV31CoreResult(result: any): result is V31CoreResult {
  return result.version === '3.1.0-core';
}

if (isV31CoreResult(result)) {
  // 타입 안전하게 사용 가능
  console.log(result.needsResult?.needs);
}
```

---

## 성능 최적화

### 엔진 인스턴스 재사용

```typescript
// Good: 인스턴스 재사용
const engine = new V31CoreEngine();
const result1 = engine.analyze(input1, trait1);
const result2 = engine.analyze(input2, trait2);

// Bad: 매번 새로 생성
const result1 = new V31CoreEngine().analyze(input1, trait1);
const result2 = new V31CoreEngine().analyze(input2, trait2);
```

### 디버그 모드 끄기

프로덕션에서는 `console.log`를 제거하여 성능을 향상시킬 수 있습니다.

---

**작성자**: ARGEN INTERIBOT AI Assistant  
**업데이트**: 2025-12-10




















