# Decision Engine v1.1 명세서 분석 보고서

> **작성일**: 2025-01-21  
> **분석자**: 인테리봇 아키텍처 총 책임자  
> **명세서 버전**: v1.1 (강제 실행본)  
> **기준**: v1 분석 결과 반영

---

## 📋 목차

1. [v1 → v1.1 변경 요약](#1-v1--v11-변경-요약)
2. [핵심 변경사항 상세](#2-핵심-변경사항-상세)
3. [구현 전략 업데이트](#3-구현-전략-업데이트)
4. [Risk Aggregation 규칙 강화](#4-risk-aggregation-규칙-강화)
5. [구현 체크리스트 v1.1](#5-구현-체크리스트-v11)

---

## 1. v1 → v1.1 변경 요약

| 항목 | v1 | v1.1 | 변경 이유 |
|------|-----|------|----------|
| **대안(alternatives)** | 추상 문구 (`string[]`) | 구조화 + 근거 필수 (`{ optionType, reason }[]`) | 특허 서술 가능, 운영 명확성 |
| **BLOCK 조건** | DEFECT 단독 | DEFECT 또는 복합 리스크 (ASSET + MAINTENANCE) | 실제 리스크 반영 |
| **residencePlan 기본값** | `'mid'` | `'short'` (보수 처리) | 불확실 시 보수적 처리 원칙 |

---

## 2. 핵심 변경사항 상세

### 2.1 DecisionResult 구조 수정

#### ❌ v1 (폐기)
```typescript
alternatives?: string[];
```

#### ✅ v1.1 (강제)
```typescript
alternatives?: {
  optionType: string;
  reason: string;
}[];
```

**원칙**:
- ✅ 대안은 옵션명 + 이유 세트
- ❌ "추천", "권장" 같은 표현 금지
- ✅ 왜 안전한지만 설명

**예시**:
```typescript
alternatives: [
  {
    optionType: 'QUARTZ',
    reason: '현재 가구 구성과 사용 패턴에서 유지관리 및 하자 리스크가 낮음',
  },
  {
    optionType: 'PORCELAIN',
    reason: '내구성과 유지관리 측면에서 안정적',
  },
];
```

### 2.2 Risk Aggregation 판정 규칙 강화

#### ❌ v1 문제점
- DEFECT만 BLOCK
- 자산 + 유지관리 복합 리스크 미반영

#### ✅ v1.1 최종 판정 규칙 (강제)

```typescript
// BLOCK 조건
if (
  categoryWeights.DEFECT > defectThreshold ||
  (
    categoryWeights.ASSET > assetThreshold &&
    categoryWeights.MAINTENANCE > maintenanceThreshold
  )
) {
  result = 'BLOCK';
}

// WARN 조건
else if (
  categoryWeights.ASSET > assetThreshold ||
  categoryWeights.MAINTENANCE > maintenanceThreshold
) {
  result = 'WARN';
}

// PASS 조건
else {
  result = 'PASS';
}
```

**해석**:
- **하자 리스크** → 무조건 차단
- **돈 + 관리 둘 다 위험** → 차단
- **하나만 위험** → 경고
- **전부 안전** → 통과

**중요**: 이 규칙은 모든 공정에 공통 적용

### 2.3 residencePlan 처리 규칙 수정

#### ❌ v1 (위험)
```typescript
residencePlan: 'mid'
```

#### ✅ v1.1 (강제)
```typescript
residencePlan: spaceInfo?.residencePlan ?? 'short'
```

**이유**:
- 거주 계획 미입력 = 불확실
- 불확실하면 보수적으로 단기 거주 처리
- 자산 리스크 방어 목적

**임계값 영향**:
- `SHORT_RESIDENCE`: `ASSET: +1` (단기 거주면 자산 가치 임계값 높임)
- 보수적 처리로 자산 리스크 방어

### 2.4 rules/kitchen.ts 수정 예시

#### 리스크 평가 (동일)
```typescript
if (option.material === 'PET_GLOSS') {
  risks.push({
    category: 'MAINTENANCE',
    weight: 2,
    reason: '스크래치 및 변색 발생 빈도가 높음',
  });

  if (ctx.household.hasKids) {
    risks.push({
      category: 'DEFECT',
      weight: 2,
      reason: '충격에 의한 하자 발생 가능성이 높음',
    });
  }
}
```

#### 대안 제시 (v1.1 구조화)
```typescript
alternatives: [
  {
    optionType: 'QUARTZ',
    reason: '현재 가구 구성과 사용 패턴에서 유지관리 및 하자 리스크가 낮음',
  },
  {
    optionType: 'PORCELAIN',
    reason: '내구성과 유지관리 측면에서 안정적',
  },
];
```

**금지 표현**:
- ❌ "더 좋은 선택"
- ❌ "추천드립니다"
- ✅ 리스크 감소 근거만

---

## 3. 구현 전략 업데이트

### 3.1 타입 정의 업데이트

```typescript
// types.ts
export interface DecisionResult {
  result: DecisionResultType;
  riskCategory: RiskCategory[];
  reasons: string[];
  consequences: string[];
  alternatives?: {
    optionType: string;
    reason: string;
  }[];  // v1.1: 구조화된 대안
}
```

### 3.2 context-builder.ts 업데이트

```typescript
// v1.1: residencePlan 기본값 'short'
const space = {
  housingType: (spaceInfo?.housingType === '빌라' ? 'villa' : 
                spaceInfo?.housingType === '오피스텔' ? 'officetel' : 
                'apartment') as 'apartment' | 'villa' | 'officetel',
  pyeong: spaceInfo?.pyeong || 30,
  rooms: spaceInfo?.rooms || 2,
  bathrooms: spaceInfo?.bathrooms || 1,
  residencePlan: (spaceInfo?.residencePlan ?? 'short') as 'short' | 'mid' | 'long', // v1.1: 기본값 'short'
};
```

### 3.3 risk-engine.ts 업데이트

```typescript
// v1.1: BLOCK 조건 강화
function determineResult(
  categoryWeights: Record<RiskCategory, number>,
  thresholds: Record<RiskCategory, number>
): DecisionResultType {
  // BLOCK 조건 1: 하자 리스크
  if (categoryWeights.DEFECT > thresholds.DEFECT) {
    return 'BLOCK';
  }

  // BLOCK 조건 2: 복합 리스크 (자산 + 유지관리)
  if (
    categoryWeights.ASSET > thresholds.ASSET &&
    categoryWeights.MAINTENANCE > thresholds.MAINTENANCE
  ) {
    return 'BLOCK';
  }

  // WARN 조건: 단일 리스크
  if (
    categoryWeights.ASSET > thresholds.ASSET ||
    categoryWeights.MAINTENANCE > thresholds.MAINTENANCE
  ) {
    return 'WARN';
  }

  // PASS 조건
  return 'PASS';
}
```

---

## 4. Risk Aggregation 규칙 강화

### 4.1 판정 로직 플로우

```
리스크 평가 시작
    ↓
카테고리별 weight 합산
    ↓
임계값 계산 (modifier 반영)
    ↓
┌─────────────────────────────┐
│ BLOCK 조건 체크              │
├─────────────────────────────┤
│ 1. DEFECT > threshold?      │ → YES → BLOCK
│ 2. ASSET > threshold AND    │
│    MAINTENANCE > threshold? │ → YES → BLOCK
└─────────────────────────────┘
    ↓ NO
┌─────────────────────────────┐
│ WARN 조건 체크               │
├─────────────────────────────┤
│ ASSET > threshold OR        │
│ MAINTENANCE > threshold?    │ → YES → WARN
└─────────────────────────────┘
    ↓ NO
┌─────────────────────────────┐
│ PASS                         │
└─────────────────────────────┘
```

### 4.2 복합 리스크 시나리오

**시나리오 1: 하자 리스크 (DEFECT)**
```
DEFECT weight: 3
DEFECT threshold: 2 (hasKids modifier 적용)
→ 3 > 2 → BLOCK
```

**시나리오 2: 복합 리스크 (ASSET + MAINTENANCE)**
```
ASSET weight: 4
ASSET threshold: 3
MAINTENANCE weight: 4
MAINTENANCE threshold: 3
→ (4 > 3) AND (4 > 3) → BLOCK
```

**시나리오 3: 단일 리스크 (ASSET만)**
```
ASSET weight: 4
ASSET threshold: 3
MAINTENANCE weight: 2
MAINTENANCE threshold: 3
→ (4 > 3) AND (2 <= 3) → WARN
```

**시나리오 4: 안전 (모두 임계값 이하)**
```
ASSET weight: 2
ASSET threshold: 3
MAINTENANCE weight: 2
MAINTENANCE threshold: 3
DEFECT weight: 1
DEFECT threshold: 2
→ 모두 임계값 이하 → PASS
```

---

## 5. 구현 체크리스트 v1.1

### 5.1 필수 구현 항목 (v1.1 기준)

- [ ] `lib/decision/types.ts` - 타입 정의
  - [ ] `DecisionResult.alternatives` 구조화 (`{ optionType, reason }[]`)
  - [ ] 기타 타입 동일

- [ ] `lib/decision/thresholds.ts` - 임계값 테이블
  - [ ] v1과 동일 (변경 없음)

- [ ] `lib/decision/context-builder.ts` - Context Builder
  - [ ] `residencePlan` 기본값 `'short'` 적용
  - [ ] `spaceInfo?.residencePlan ?? 'short'` 로직

- [ ] `lib/decision/risk-engine.ts` - Risk Aggregation Engine
  - [ ] v1.1 BLOCK 조건 구현 (DEFECT 또는 복합 리스크)
  - [ ] v1.1 WARN 조건 구현 (단일 리스크)
  - [ ] v1.1 PASS 조건 구현

- [ ] `lib/decision/rules/kitchen.ts` - 주방 규칙
  - [ ] 리스크 평가 로직 (v1과 동일)
  - [ ] `alternatives` 구조화된 형식으로 반환
  - [ ] "추천" 표현 금지 확인

- [ ] `lib/decision/index.ts` - 외부 진입점
  - [ ] v1과 동일

### 5.2 검증 항목 (v1.1 추가)

- [ ] `alternatives` 구조화 확인 (`{ optionType, reason }[]`)
- [ ] BLOCK 조건 복합 리스크 테스트
- [ ] `residencePlan` 기본값 `'short'` 확인
- [ ] "추천" 키워드 없음 (코드 검색)
- [ ] v1 로직 발견 시 수정 (코드 검색)

### 5.3 UI 출력 계약 (v1.1 고정)

**UI는 이 정보만 표시 가능**:

```
[판정 결과]
🔴 이 선택은 현재 조건에서 차단됩니다.

[차단 사유]
- 유지관리 부담이 높음
- 하자 발생 가능성이 높음

[예상 문제]
- 사용 중 스크래치 누적
- A/S 분쟁 가능성

[대안]
- QUARTZ: 유지관리 및 하자 리스크가 낮음
- PORCELAIN: 내구성과 유지관리 측면에서 안정적
```

**주의사항**:
- ❌ "추천" 표현 사용 금지
- ❌ "더 좋은 선택" 표현 금지
- ✅ 리스크 감소 근거만 표시

---

## 6. 구현 예시 코드 (v1.1)

### 6.1 types.ts (v1.1)

```typescript
export type RiskCategory = 'ASSET' | 'MAINTENANCE' | 'DEFECT';
export type DecisionResultType = 'PASS' | 'WARN' | 'BLOCK';

export interface DecisionContext {
  space: {
    housingType: 'apartment' | 'villa' | 'officetel';
    pyeong: number;
    rooms: number;
    bathrooms: number;
    residencePlan: 'short' | 'mid' | 'long';
  };
  household: {
    hasKids: boolean;
    hasPets: boolean;
  };
  personality: {
    maintenanceSensitive: boolean;
    budgetSensitive: boolean;
    riskAverse: boolean;
  };
  budget: {
    level: 'low' | 'mid' | 'high';
  };
}

export interface RiskFactor {
  category: RiskCategory;
  weight: number;
  reason: string;
}

export interface DecisionResult {
  result: DecisionResultType;
  riskCategory: RiskCategory[];
  reasons: string[];
  consequences: string[];
  alternatives?: {
    optionType: string;
    reason: string;
  }[];  // v1.1: 구조화된 대안
}
```

### 6.2 context-builder.ts (v1.1)

```typescript
import { DecisionContext } from './types';
import type { FusionAnalysisResult } from '@/lib/analysis/v5-ultimate/types';
import type { SpaceInfo } from '@/lib/store/spaceInfoStore';

export function buildDecisionContext(
  spaceInfo: SpaceInfo | null,
  fusionResult: FusionAnalysisResult | null
): DecisionContext {
  // 공간 정보 변환 (v1.1: residencePlan 기본값 'short')
  const space = {
    housingType: (spaceInfo?.housingType === '빌라' ? 'villa' : 
                  spaceInfo?.housingType === '오피스텔' ? 'officetel' : 
                  'apartment') as 'apartment' | 'villa' | 'officetel',
    pyeong: spaceInfo?.pyeong || 30,
    rooms: spaceInfo?.rooms || 2,
    bathrooms: spaceInfo?.bathrooms || 1,
    residencePlan: (spaceInfo?.residencePlan ?? 'short') as 'short' | 'mid' | 'long', // v1.1: 기본값 'short'
  };

  // 가구 정보 변환 (tags 기반)
  const tags = fusionResult?.finalTags || [];
  const household = {
    hasKids: tags.includes('HAS_CHILD') || tags.includes('HAS_INFANT') || tags.includes('HAS_TEEN'),
    hasPets: tags.includes('HAS_PET_DOG') || tags.includes('HAS_PET_CAT'),
  };

  // 성향 정보 변환 (tags → boolean)
  const personality = {
    maintenanceSensitive: tags.includes('CLEANING_SYSTEM_NEED'),
    budgetSensitive: tags.includes('BUDGET_STRICT'),
    riskAverse: tags.includes('SAFETY_NEED') || tags.includes('OLD_RISK_HIGH'),
  };

  // 예산 정보 변환 (보수적 처리)
  const budget = {
    level: (tags.includes('BUDGET_STRICT') ? 'low' :
            tags.includes('BUDGET_FLEXIBLE') ? 'high' :
            'mid') as 'low' | 'mid' | 'high',
  };

  return {
    space,
    household,
    personality,
    budget,
  };
}
```

### 6.3 risk-engine.ts (v1.1)

```typescript
import { DecisionContext, RiskFactor, DecisionResult, RiskCategory } from './types';
import { BASE_THRESHOLD, THRESHOLD_MODIFIER } from './thresholds';

export function aggregateRisks(
  risks: RiskFactor[],
  ctx: DecisionContext
): DecisionResult {
  // 1. 카테고리별 weight 합산
  const categoryWeights: Record<RiskCategory, number> = {
    ASSET: 0,
    MAINTENANCE: 0,
    DEFECT: 0,
  };

  for (const risk of risks) {
    categoryWeights[risk.category] += risk.weight;
  }

  // 2. threshold 계산 (modifier 반영)
  let assetThreshold = BASE_THRESHOLD.ASSET;
  let maintenanceThreshold = BASE_THRESHOLD.MAINTENANCE;
  let defectThreshold = BASE_THRESHOLD.DEFECT;

  if (ctx.household.hasKids) {
    defectThreshold += THRESHOLD_MODIFIER.HAS_KIDS.DEFECT;
  }
  if (ctx.personality.maintenanceSensitive) {
    maintenanceThreshold += THRESHOLD_MODIFIER.MAINTENANCE_SENSITIVE.MAINTENANCE;
  }
  if (ctx.space.residencePlan === 'short') {
    assetThreshold += THRESHOLD_MODIFIER.SHORT_RESIDENCE.ASSET;
  }

  // 3. v1.1: BLOCK / WARN / PASS 판정 (강화된 규칙)
  const riskCategories: RiskCategory[] = [];
  if (categoryWeights.ASSET > assetThreshold) riskCategories.push('ASSET');
  if (categoryWeights.MAINTENANCE > maintenanceThreshold) riskCategories.push('MAINTENANCE');
  if (categoryWeights.DEFECT > defectThreshold) riskCategories.push('DEFECT');

  // v1.1: BLOCK 조건 강화
  let result: DecisionResult['result'];
  if (
    categoryWeights.DEFECT > defectThreshold ||
    (
      categoryWeights.ASSET > assetThreshold &&
      categoryWeights.MAINTENANCE > maintenanceThreshold
    )
  ) {
    result = 'BLOCK';
  } else if (
    categoryWeights.ASSET > assetThreshold ||
    categoryWeights.MAINTENANCE > maintenanceThreshold
  ) {
    result = 'WARN';
  } else {
    result = 'PASS';
  }

  // 4. 이유 / 결과 문장 구성
  const reasons = risks.map(r => r.reason);
  const consequences: string[] = [];
  
  if (riskCategories.includes('ASSET')) {
    consequences.push('자산 가치 하락 가능성이 있습니다.');
  }
  if (riskCategories.includes('MAINTENANCE')) {
    consequences.push('유지 비용이 예상보다 높을 수 있습니다.');
  }
  if (riskCategories.includes('DEFECT')) {
    consequences.push('하자 발생 위험이 높습니다.');
  }

  // 5. 대안은 규칙에서 제공 (여기서는 빈 배열)
  // rules/kitchen.ts에서 alternatives 생성

  return {
    result,
    riskCategory: riskCategories,
    reasons,
    consequences,
    // alternatives는 규칙에서 제공
  };
}
```

### 6.4 rules/kitchen.ts (v1.1)

```typescript
import { DecisionContext, RiskFactor, DecisionResult } from '../types';
import { aggregateRisks } from '../risk-engine';

export function evaluateKitchenCountertop(
  ctx: DecisionContext,
  option: {
    material: 'PET_GLOSS' | 'QUARTZ' | 'PORCELAIN';
  }
): DecisionResult {
  const risks: RiskFactor[] = [];

  if (option.material === 'PET_GLOSS') {
    // 유지관리 리스크
    risks.push({
      category: 'MAINTENANCE',
      weight: 2,
      reason: '스크래치 및 변색 발생 빈도가 높음',
    });

    // 아이 있으면 하자 리스크 추가
    if (ctx.household.hasKids) {
      risks.push({
        category: 'DEFECT',
        weight: 2,
        reason: '충격에 의한 하자 발생 가능성이 높음',
      });
    }

    // 유지관리 민감하면 추가 리스크
    if (ctx.personality.maintenanceSensitive) {
      risks.push({
        category: 'MAINTENANCE',
        weight: 1,
        reason: '유지관리 부담이 예상보다 높을 수 있음',
      });
    }
  }

  if (option.material === 'QUARTZ') {
    // 쿼츠는 일반적으로 안전 (리스크 없음)
    // 단, 예산 민감하면 자산 가치 리스크
    if (ctx.budget.level === 'low' && ctx.personality.budgetSensitive) {
      risks.push({
        category: 'ASSET',
        weight: 1,
        reason: '예산 대비 투자 대비 효과가 낮을 수 있음',
      });
    }
  }

  if (option.material === 'PORCELAIN') {
    // 포세린은 일반적으로 안전 (리스크 없음)
  }

  // Risk Aggregation 실행
  const result = aggregateRisks(risks, ctx);

  // v1.1: 구조화된 대안 제시 (WARN / BLOCK일 때만)
  if (result.result !== 'PASS') {
    result.alternatives = [
      {
        optionType: 'QUARTZ',
        reason: '현재 가구 구성과 사용 패턴에서 유지관리 및 하자 리스크가 낮음',
      },
      {
        optionType: 'PORCELAIN',
        reason: '내구성과 유지관리 측면에서 안정적',
      },
    ];
  }

  return result;
}
```

---

## 7. 상태 선언

### 7.1 v1.1 구조적 봉인

**Decision Engine v1.1은**:
- ✅ "추천 시스템으로 회귀할 수 없도록" 구조적으로 봉인됨
- ✅ 기능 추가해도 본질이 안 무너짐
- ✅ 사람이 바뀌어도 본질이 안 무너짐
- ✅ AI 모델이 바뀌어도 본질이 안 무너짐

### 7.2 봉인 메커니즘

1. **타입 시스템**: `alternatives` 구조화로 추천 표현 차단
2. **판정 규칙**: BLOCK/WARN/PASS만 허용 (점수 금지)
3. **기본값 보수**: `residencePlan` 기본값 `'short'`로 리스크 방어
4. **복합 리스크**: 실제 리스크 반영 (ASSET + MAINTENANCE)

---

## 8. 결론

### 8.1 v1.1 핵심 개선사항

1. **대안 구조화**: 특허 서술 가능, 운영 명확성 확보
2. **BLOCK 조건 강화**: 복합 리스크 반영으로 실제 위험 차단
3. **보수적 처리**: `residencePlan` 기본값 `'short'`로 리스크 방어

### 8.2 구현 우선순위

1. **1단계**: 타입 정의 업데이트 (`types.ts`)
2. **2단계**: Context Builder 업데이트 (`context-builder.ts`)
3. **3단계**: Risk Engine 업데이트 (`risk-engine.ts`)
4. **4단계**: 주방 규칙 업데이트 (`rules/kitchen.ts`)
5. **5단계**: 검증 및 테스트

### 8.3 성공 기준 (v1.1)

- ✅ TypeScript 에러 0
- ✅ 기존 파일 변경 없음
- ✅ AI 호출 없음
- ✅ 점수 출력 없음
- ✅ `alternatives` 구조화 확인
- ✅ BLOCK 조건 복합 리스크 테스트
- ✅ `residencePlan` 기본값 `'short'` 확인
- ✅ "추천" 키워드 없음
- ✅ v1 로직 발견 시 수정 완료

---

**문서 끝**

