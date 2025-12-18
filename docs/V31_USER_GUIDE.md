# V3.1 Core Edition - 사용 가이드

**버전**: 1.0.0  
**날짜**: 2025-12-10

---

## 📋 목차

1. [빠른 시작](#빠른-시작)
2. [기본 사용법](#기본-사용법)
3. [고급 사용법](#고급-사용법)
4. [설정 커스터마이징](#설정-커스터마이징)
5. [문제 해결](#문제-해결)

---

## 🚀 빠른 시작

### 1. 설치

```bash
# 이미 프로젝트에 포함되어 있습니다
# 별도 설치 불필요
```

### 2. 기본 사용

```typescript
import { V31CoreEngine } from '@/lib/analysis/engine-v3.1-core';

// 엔진 인스턴스 생성
const engine = new V31CoreEngine();

// 분석 실행 (V3 입력 사용)
const result = engine.analyze(v3Input, traitResult);

// 결과 확인
console.log('Needs:', result.needsResult?.needs);
console.log('추천 공정:', result.actionResult?.processes);
```

### 3. 테스트 실행

```bash
# 기본 테스트 (5개 시나리오)
npx ts-node lib/analysis/engine-v3.1-core/test.ts

# 통합 테스트 (V3 + V3.1)
npx ts-node lib/analysis/engine-v3.1-core/integration-example.ts
```

---

## 📖 기본 사용법

### Step 1: 입력 준비

V3.1 Core는 V3 엔진의 입력을 그대로 사용합니다.

```typescript
import type { V3EngineInput, SpaceInfo } from '@/lib/analysis/engine-v3/types';

const spaceInfo: SpaceInfo = {
  pyeong: 24,
  type: 'apartment',
  buildingAge: 20,
  // ... 기타 정보
};

const input: V3EngineInput = {
  answers: { /* 질문 답변 */ },
  spaceInfo,
  selectedSpaces: ['living', 'kitchen', 'bathroom'],
  budget: 'medium',
};
```

### Step 2: V3 엔진 실행 (TraitEngine 결과 필요)

```typescript
import { V3Engine } from '@/lib/analysis/engine-v3';

const v3Engine = new V3Engine();
const v3Result = await v3Engine.analyze(input);
```

### Step 3: V3.1 Core 실행

```typescript
import { V31CoreEngine } from '@/lib/analysis/engine-v3.1-core';

const v31Engine = new V31CoreEngine();
const v31Result = v31Engine.analyze(input, v3Result.traitResult);
```

### Step 4: 결과 확인

```typescript
if (!v31Result.inScope) {
  console.log('범위 밖:', v31Result.scopeCheck?.message);
  return;
}

// Needs 확인
const needs = v31Result.needsResult?.needs || [];
needs.forEach(need => {
  console.log(`${need.id}: ${need.level} (${need.source})`);
});

// 추천 공정 확인
const processes = v31Result.actionResult?.processes || [];
processes.forEach(proc => {
  console.log(`${proc.processName} (${proc.priority})`);
  console.log(`이유: ${proc.reason}`);
});
```

---

## 🎓 고급 사용법

### 1. Core Input 직접 생성

V3를 거치지 않고 직접 CoreInput을 생성할 수도 있습니다.

```typescript
import type { CoreInput } from '@/lib/analysis/engine-v3.1-core';

const coreInput: CoreInput = {
  soft: {
    family: {
      count: 3,
      hasInfant: true,
      hasElderly: false,
      hasPet: false,
    },
    lifestyle: {
      hasRemoteWork: false,
      timeAtHome: 'high',
    },
    // ... 기타
  },
  hard: {
    pyeong: 24,
    building: {
      age: 'old',
      type: 'apartment',
      occupied: true,
    },
  },
  budget: {
    level: 'medium',
    priceSensitive: false,
  },
  rooms: {
    rooms: [
      { type: 'living', label: '거실', usageTags: ['rest', 'tv'] },
      { type: 'bathroom', label: '욕실', usageTags: ['hygiene'] },
    ],
  },
  timestamp: new Date().toISOString(),
};

// Needs 엔진만 실행
const needsEngine = new NeedsEngineCore();
const needsResult = needsEngine.analyze(coreInput);
```

### 2. 개별 엔진 사용

```typescript
import {
  NeedsEngineCore,
  ResolutionEngine,
  ActionEngine,
} from '@/lib/analysis/engine-v3.1-core/engines';

// Step 1: Needs 계산
const needsEngine = new NeedsEngineCore();
const needsResult = needsEngine.analyze(coreInput);

// Step 2: Resolution
const resolutionEngine = new ResolutionEngine();
const resolutionResult = resolutionEngine.resolve(needsResult, coreInput);

// Step 3: Action
const actionEngine = new ActionEngine();
const actionResult = actionEngine.generate(resolutionResult, coreInput);
```

### 3. 결과 필터링

```typescript
// 필수 공정만 추출
const mustProcesses = actionResult.processes.filter(
  p => p.priority === 'must'
);

// 특정 Needs와 연결된 공정만
const safetyProcesses = actionResult.processes.filter(
  p => p.relatedNeeds.includes('safety')
);

// High 강도 Needs만
const highNeeds = needsResult.needs.filter(
  n => n.level === 'high'
);
```

---

## ⚙️ 설정 커스터마이징

### 1. Core Edition 범위 변경

`config/scope.ts` 수정:

```typescript
export const CORE_PYEONG_RANGE = {
  min: 20,
  max: 40,  // 34 → 40으로 확장
  // ...
};
```

### 2. 새로운 Needs 추가

`config/needs-definitions.ts`:

```typescript
export const CORE_NEEDS_DEFINITIONS = {
  // 기존 Needs...
  soundproof: {
    id: 'soundproof',
    name: '방음 강화',
    description: '층간소음 및 외부 소음 차단',
    category: 'lifestyle',
  },
};
```

### 3. 매핑 규칙 추가

`config/mapping-rules.ts`:

```typescript
export const SOFT_INPUT_MAPPING_RULES = {
  // ...
  noise: {
    sensitive: [
      {
        description: '소음에 민감한 경우',
        check: 'soft.noise.sensitive === true',
        mappings: [
          {
            needsId: 'soundproof',
            level: 'high',
            source: 'explicit',
            reason: '소음 민감도가 높아 방음 강화 필요',
          },
        ],
      },
    ],
  },
};
```

### 4. 새로운 공정 추가

`config/process-mapping.ts`:

```typescript
export const CORE_PROCESSES = [
  // 기존 공정...
  {
    id: 'living-soundproof',
    name: '거실 방음',
    category: 'living',
    description: '층간소음 차단을 위한 방음 시공',
  },
];

export const NEEDS_TO_PROCESS_MAPPING = [
  // ...
  {
    needsId: 'soundproof',
    processes: [
      {
        processId: 'living-soundproof',
        priority: 'must',
        reasonTemplate: '층간소음 차단을 위한 방음 시공이 필요합니다',
        minLevel: 'mid',
      },
    ],
  },
];
```

---

## 🔧 문제 해결

### Q1: "범위 밖" 메시지가 나옵니다

**원인**: Core Edition은 20-34평 아파트만 지원합니다.

**해결**:
```typescript
// 범위 확인
import { isInCoreScope } from '@/lib/analysis/engine-v3.1-core';

if (!isInCoreScope(pyeong, housingType, occupied)) {
  console.log('Core Edition 범위 밖입니다');
  // Extended Edition 사용 또는 V3 엔진 사용
}
```

### Q2: Needs가 예상과 다르게 나옵니다

**원인**: 매핑 규칙 또는 입력 데이터 문제

**디버깅**:
```typescript
// 디버그 정보 확인
console.log('적용된 규칙:', needsResult.debug?.appliedRules);
console.log('입력 스냅샷:', needsResult.debug?.inputSnapshot);
```

### Q3: 공정이 너무 많이 추천됩니다

**원인**: minLevel이 너무 낮거나 Needs 강도가 높음

**조정**:
```typescript
// minLevel 상향 조정
{
  processId: 'bathroom-storage',
  priority: 'recommended',
  minLevel: 'high',  // mid → high로 변경
}
```

### Q4: 실행 시간이 너무 오래 걸립니다

**원인**: 일반적으로 ~50ms인데, 100ms 이상이면 문제

**확인**:
```typescript
console.log('실행 시간:', v31Result.executionTime, 'ms');

// 개별 단계 시간 측정
const start1 = Date.now();
const needsResult = needsEngine.analyze(coreInput);
console.log('Needs 단계:', Date.now() - start1, 'ms');
```

---

## 📚 추가 리소스

- [README](../lib/analysis/engine-v3.1-core/README.md)
- [API 문서](./V31_API_DOCUMENTATION.md)
- [Phase 완료 보고서](../docs/)
  - Phase 1-2: `V31_CORE_PHASE1_2_COMPLETE.md`
  - Phase 3: `V31_CORE_PHASE3_COMPLETE.md`
  - Phase 4: `V31_CORE_PHASE4_COMPLETE.md`

---

## 💡 팁

### 성능 최적화
- 가능하면 엔진 인스턴스를 재사용하세요
- 불필요한 로깅은 프로덕션에서 제거하세요

### 디버깅
- `debug` 필드를 활용하여 적용된 규칙을 추적하세요
- 테스트 케이스를 추가하여 예상 동작을 검증하세요

### 확장
- 새로운 Needs/공정은 항상 설정 파일에서 관리하세요
- 엔진 코드는 가능한 수정하지 마세요

---

**작성자**: ARGEN INTERIBOT AI Assistant  
**업데이트**: 2025-12-10




















