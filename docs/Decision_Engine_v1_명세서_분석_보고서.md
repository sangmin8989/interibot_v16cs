# Decision Engine v1 명세서 분석 보고서

> **작성일**: 2025-01-21  
> **분석자**: 인테리봇 아키텍처 총 책임자  
> **명세서 버전**: v1 (강제 실행 명세서)

---

## 📋 목차

1. [명세서 핵심 요약](#1-명세서-핵심-요약)
2. [기존 시스템과의 차이점](#2-기존-시스템과의-차이점)
3. [구현 전략](#3-구현-전략)
4. [주요 위험 요소](#4-주요-위험-요소)
5. [기존 코드베이스 영향 분석](#5-기존-코드베이스-영향-분석)
6. [구현 체크리스트](#6-구현-체크리스트)

---

## 1. 명세서 핵심 요약

### 1.1 프로젝트 목적의 근본적 변화

**기존 인테리봇**:
- ❌ 취향을 추천하는 서비스
- ❌ 점수로 성향을 평가하는 서비스
- ✅ AI 기반 추천 시스템

**새로운 Decision Engine v1**:
- ✅ **잘못된 인테리어 선택으로 인한 리스크를 사전에 차단하는 의사결정 시스템**
- ✅ **자산 가치·유지 비용·하자 리스크 보호**
- ✅ **규칙 기반 판단 (AI 호출 금지)**

### 1.2 절대 금지 규칙 (FAIL 조건)

| 금지 사항 | 이유 |
|---------|------|
| ❌ AI가 판단(PASS/WARN/BLOCK)을 내리게 만들기 | 규칙 기반만 허용 |
| ❌ 점수(숫자) 기반 결과 출력 | PASS/WARN/BLOCK만 허용 |
| ❌ "추천", "어울림", "베스트" 같은 표현 사용 | 의사결정 시스템이므로 추천 금지 |
| ❌ 기존 lib/analysis, lib/estimate 구조 수정 | 기존 시스템 침범 금지 |
| ❌ 임의의 UI 변경 | UI는 별도 작업 |
| ❌ 기존 데이터 스키마 변경 | 호환성 유지 |

### 1.3 작업 범위

**목표**: Decision Engine 신규 구현
- **첫 대상**: 주방 → 상판 옵션
- **구조**: `lib/decision/` 디렉토리 신규 생성
- **기존 구조 침범 금지**: V5 Ultimate 구조 수정 불가

---

## 2. 기존 시스템과의 차이점

### 2.1 기존 시스템 분석

#### 기존 DecisionImpactEngine (`lib/analysis/decision-impact/`)

**특징**:
- ✅ 이미 Decision Engine 개념 존재
- ❌ 하지만 "추천" 기반 (riskMessage는 있지만 추천 성격)
- ❌ AI 호출 가능성 (명확하지 않음)
- ❌ 점수 기반 결과 포함 가능

**주요 파일**:
- `DecisionImpactEngine.ts`: 의사결정 영향 엔진
- `types.ts`: DecisionResult 타입 정의
- `traitImpactMap.ts`: 성향 → 영향 매핑

**문제점**:
- 기존 시스템은 "추천" 성격이 강함
- 새로운 명세서는 "차단" 성격이 강함
- 따라서 **신규 구현 필요** (기존 구조 수정 금지)

#### 기존 V5 분석 시스템

**특징**:
- `lib/analysis/v5/`: 규칙 기반 분석 (AI 호출 없음)
- `risk-message-generator.ts`: 리스크 메시지 생성
- 하지만 "추천" 성격 (공정/옵션 추천)

**차이점**:
- V5: "어떤 공정을 추천할까?"
- Decision Engine: "이 옵션을 선택해도 될까?" (PASS/WARN/BLOCK)

### 2.2 새로운 Decision Engine의 특징

| 항목 | 기존 시스템 | Decision Engine v1 |
|------|-----------|-------------------|
| **목적** | 추천 | 차단/보호 |
| **결과 타입** | 추천 목록, 점수 | PASS/WARN/BLOCK |
| **판단 주체** | AI 또는 규칙 | 규칙만 (AI 금지) |
| **출력** | "이 옵션이 좋아요" | "이 옵션은 위험합니다" |
| **리스크 카테고리** | 일반적 | ASSET/MAINTENANCE/DEFECT |

---

## 3. 구현 전략

### 3.1 디렉토리 구조 (강제)

```
lib/
 └── decision/
     ├── index.ts              # 외부 진입점
     ├── types.ts              # 타입 정의
     ├── thresholds.ts         # 임계값 테이블
     ├── context-builder.ts    # Decision Context 생성
     ├── risk-engine.ts        # Risk Aggregation Engine
     └── rules/
         └── kitchen.ts       # 주방 규칙 (첫 대상)
```

**주의사항**:
- ❌ 파일명 변경 금지
- ❌ 폴더 생략 금지
- ❌ 기존 `lib/analysis/decision-impact/` 수정 금지

### 3.2 타입 시스템

#### 핵심 타입

```typescript
// RiskCategory: 리스크 카테고리
export type RiskCategory = 'ASSET' | 'MAINTENANCE' | 'DEFECT';

// DecisionResultType: 판단 결과
export type DecisionResultType = 'PASS' | 'WARN' | 'BLOCK';

// DecisionContext: 판단 컨텍스트
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

// RiskFactor: 리스크 요소
export interface RiskFactor {
  category: RiskCategory;
  weight: number;
  reason: string;
}

// DecisionResult: 최종 판단 결과
export interface DecisionResult {
  result: DecisionResultType;
  riskCategory: RiskCategory[];
  reasons: string[];
  consequences: string[];
  alternatives?: string[];
}
```

**설계 원칙**:
- ✅ boolean/enum만 사용 (점수 금지)
- ✅ AI 결과를 그대로 쓰지 않음
- ✅ 불확실하면 보수적으로 처리

### 3.3 임계값 시스템

```typescript
// BASE_THRESHOLD: 기본 임계값
export const BASE_THRESHOLD = {
  ASSET: 3,
  MAINTENANCE: 3,
  DEFECT: 3,
};

// THRESHOLD_MODIFIER: 컨텍스트별 임계값 수정자
export const THRESHOLD_MODIFIER = {
  HAS_KIDS: {
    DEFECT: -1,  // 아이 있으면 하자 리스크 임계값 낮춤
  },
  MAINTENANCE_SENSITIVE: {
    MAINTENANCE: -1,  // 유지관리 민감하면 임계값 낮춤
  },
  SHORT_RESIDENCE: {
    ASSET: +1,  // 단기 거주면 자산 가치 임계값 높임
  },
};
```

**판정 기준**:
- 임계값 초과 → **BLOCK**
- 임계값 -1 → **WARN**
- 나머지 → **PASS**

### 3.4 Context Builder 전략

**입력 소스**:
- `spaceInfo`: 공간 정보 (기존 `spaceInfoStore`)
- `fusionResult`: V5 Ultimate 분석 결과 (기존 `FusionAnalysisResult`)

**변환 규칙**:
- ❌ `sixIndices` 직접 사용 금지
- ✅ `tags` → boolean 플래그로 변환
- ✅ 불확실하면 위험 쪽으로 처리 (보수적)

**예시 변환**:
```typescript
// fusionResult.tags에서 추출
const hasMaintenanceTag = tags.includes('CLEANING_SYSTEM_NEED');
const hasBudgetTag = tags.includes('BUDGET_STRICT');

// boolean으로 변환
personality: {
  maintenanceSensitive: hasMaintenanceTag,
  budgetSensitive: hasBudgetTag,
  riskAverse: tags.includes('SAFETY_NEED') || tags.includes('OLD_RISK_HIGH'),
}
```

### 3.5 Risk Aggregation Engine

**프로세스**:
1. 카테고리별 weight 합산
2. threshold 계산 (modifier 반영)
3. BLOCK / WARN / PASS 결정
4. 이유 / 결과 문장 구성

**알고리즘**:
```typescript
function aggregateRisks(risks: RiskFactor[], ctx: DecisionContext): DecisionResult {
  // 1. 카테고리별 합산
  const assetWeight = risks.filter(r => r.category === 'ASSET').reduce((sum, r) => sum + r.weight, 0);
  const maintenanceWeight = risks.filter(r => r.category === 'MAINTENANCE').reduce((sum, r) => sum + r.weight, 0);
  const defectWeight = risks.filter(r => r.category === 'DEFECT').reduce((sum, r) => sum + r.weight, 0);
  
  // 2. 임계값 계산 (modifier 반영)
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
  
  // 3. 판정
  const riskCategories: RiskCategory[] = [];
  if (assetWeight > assetThreshold) riskCategories.push('ASSET');
  if (maintenanceWeight > maintenanceThreshold) riskCategories.push('MAINTENANCE');
  if (defectWeight > defectThreshold) riskCategories.push('DEFECT');
  
  // 4. 최종 결과
  if (riskCategories.length > 0) {
    return {
      result: riskCategories.some(c => c === 'DEFECT') ? 'BLOCK' : 'WARN',
      riskCategory: riskCategories,
      reasons: risks.map(r => r.reason),
      consequences: [...],
      alternatives: [...],
    };
  }
  
  return {
    result: 'PASS',
    riskCategory: [],
    reasons: [],
    consequences: [],
  };
}
```

### 3.6 첫 규칙: 주방 상판

**대상 옵션**:
- `PET_GLOSS`: PET 글로시
- `QUARTZ`: 쿼츠
- `PORCELAIN`: 포세린

**리스크 규칙**:
```typescript
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
}
```

**주의사항**:
- ❌ 추천 문구 생성 금지
- ❌ UI 로직 포함 금지
- ✅ 리스크만 평가

---

## 4. 주요 위험 요소

### 4.1 구현 시 주의사항

| 위험 요소 | 대응 방안 |
|---------|----------|
| **기존 시스템과 혼동** | `lib/decision/` 신규 디렉토리로 완전 분리 |
| **AI 호출 유혹** | 모든 함수에 AI 호출 금지 주석 추가 |
| **점수 출력 유혹** | 타입 시스템으로 점수 타입 제거 |
| **추천 문구 사용** | 코드 리뷰 시 "추천" 키워드 검색 |
| **기존 구조 수정** | 기존 파일 수정 전 명세서 재확인 |

### 4.2 테스트 전략

**단위 테스트**:
- `context-builder.ts`: 다양한 입력에 대한 변환 테스트
- `risk-engine.ts`: 임계값 계산 및 판정 테스트
- `rules/kitchen.ts`: 주방 상판 규칙 테스트

**통합 테스트**:
- `index.ts`: 전체 플로우 테스트
- PASS/WARN/BLOCK 모든 케이스 테스트

**검증 조건**:
- ✅ TypeScript 에러 0
- ✅ 기존 파일 변경 없음
- ✅ PASS / WARN / BLOCK 결과 정상 출력
- ✅ AI 호출 없음
- ✅ 점수 출력 없음

---

## 5. 기존 코드베이스 영향 분석

### 5.1 기존 시스템과의 관계

#### DecisionImpactEngine (`lib/analysis/decision-impact/`)

**상태**: 기존 시스템 유지 (수정 금지)

**차이점**:
- DecisionImpactEngine: "추천" 기반
- Decision Engine v1: "차단" 기반

**공존 전략**:
- 두 시스템은 독립적으로 동작
- 필요 시 Decision Engine 결과를 DecisionImpactEngine에 전달 가능

#### V5 Ultimate 시스템

**상태**: 기존 시스템 유지 (수정 금지)

**연결점**:
- `FusionAnalysisResult`를 `DecisionContext`로 변환
- `context-builder.ts`에서 변환 수행

**데이터 흐름**:
```
FusionAnalysisResult (V5 Ultimate)
    ↓
context-builder.ts
    ↓
DecisionContext
    ↓
Decision Engine
    ↓
DecisionResult (PASS/WARN/BLOCK)
```

### 5.2 기존 Store와의 관계

**spaceInfoStore**:
- ✅ 읽기 전용 사용 (수정 금지)
- `DecisionContext.space` 생성에 활용

**v5UltimateStore**:
- ✅ 읽기 전용 사용 (수정 금지)
- `fusionResult`에서 `DecisionContext` 생성에 활용

### 5.3 API 통합 전략

**현재**: API 통합 없음 (이번 스프린트)

**향후 통합 시**:
- `/api/v5/decision/evaluate` 엔드포인트 추가 가능
- 하지만 이번 스프린트는 `lib/decision/` 구현만

---

## 6. 구현 체크리스트

### 6.1 필수 구현 항목

- [ ] `lib/decision/types.ts` - 타입 정의
  - [ ] `RiskCategory` 타입
  - [ ] `DecisionResultType` 타입
  - [ ] `DecisionContext` 인터페이스
  - [ ] `RiskFactor` 인터페이스
  - [ ] `DecisionResult` 인터페이스

- [ ] `lib/decision/thresholds.ts` - 임계값 테이블
  - [ ] `BASE_THRESHOLD` 상수
  - [ ] `THRESHOLD_MODIFIER` 상수
  - [ ] 수치 변경 금지 확인

- [ ] `lib/decision/context-builder.ts` - Context Builder
  - [ ] `buildDecisionContext()` 함수
  - [ ] `spaceInfo` → `DecisionContext.space` 변환
  - [ ] `fusionResult` → `DecisionContext` 변환
  - [ ] boolean/enum만 사용 확인
  - [ ] 보수적 처리 확인

- [ ] `lib/decision/risk-engine.ts` - Risk Aggregation Engine
  - [ ] `aggregateRisks()` 함수
  - [ ] 카테고리별 weight 합산
  - [ ] threshold 계산 (modifier 반영)
  - [ ] BLOCK / WARN / PASS 판정
  - [ ] 이유 / 결과 문장 구성

- [ ] `lib/decision/rules/kitchen.ts` - 주방 규칙
  - [ ] `evaluateKitchenCountertop()` 함수
  - [ ] PET_GLOSS 규칙
  - [ ] QUARTZ 규칙
  - [ ] PORCELAIN 규칙
  - [ ] 추천 문구 생성 금지 확인

- [ ] `lib/decision/index.ts` - 외부 진입점
  - [ ] `evaluateDecision()` 함수
  - [ ] `KITCHEN_COUNTERTOP` 케이스
  - [ ] 에러 처리

### 6.2 검증 항목

- [ ] TypeScript 에러 0
- [ ] 기존 파일 변경 없음
- [ ] AI 호출 없음 (코드 검색)
- [ ] 점수 출력 없음 (숫자 타입 제거)
- [ ] "추천" 키워드 없음 (코드 검색)
- [ ] PASS / WARN / BLOCK 결과 정상 출력

### 6.3 금지 사항 확인

- [ ] AI 호출 함수 없음 (`openai`, `chat.completions.create` 등)
- [ ] 점수 타입 없음 (`number` 기반 결과 없음)
- [ ] 추천 문구 없음 ("추천", "어울림", "베스트" 등)
- [ ] 기존 파일 수정 없음 (`lib/analysis/`, `lib/estimate/` 등)
- [ ] UI 변경 없음 (`components/`, `app/` 등)
- [ ] 데이터 스키마 변경 없음 (`types/`, `prisma/` 등)

---

## 7. 구현 예시 코드

### 7.1 context-builder.ts 예시

```typescript
import { DecisionContext } from './types';
import type { FusionAnalysisResult } from '@/lib/analysis/v5-ultimate/types';
import type { SpaceInfo } from '@/lib/store/spaceInfoStore';

export function buildDecisionContext(
  spaceInfo: SpaceInfo | null,
  fusionResult: FusionAnalysisResult | null
): DecisionContext {
  // 공간 정보 변환 (보수적 처리)
  const space = {
    housingType: (spaceInfo?.housingType === '빌라' ? 'villa' : 
                  spaceInfo?.housingType === '오피스텔' ? 'officetel' : 
                  'apartment') as 'apartment' | 'villa' | 'officetel',
    pyeong: spaceInfo?.pyeong || 30,
    rooms: spaceInfo?.rooms || 2,
    bathrooms: spaceInfo?.bathrooms || 1,
    residencePlan: 'mid' as 'short' | 'mid' | 'long', // 기본값 (향후 확장)
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

### 7.2 risk-engine.ts 예시

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

  // 3. BLOCK / WARN / PASS 판정
  const riskCategories: RiskCategory[] = [];
  if (categoryWeights.ASSET > assetThreshold) riskCategories.push('ASSET');
  if (categoryWeights.MAINTENANCE > maintenanceThreshold) riskCategories.push('MAINTENANCE');
  if (categoryWeights.DEFECT > defectThreshold) riskCategories.push('DEFECT');

  // 4. 최종 결과 결정
  let result: DecisionResult['result'];
  if (riskCategories.length === 0) {
    result = 'PASS';
  } else if (riskCategories.includes('DEFECT')) {
    result = 'BLOCK'; // 하자 리스크는 무조건 BLOCK
  } else {
    result = 'WARN';
  }

  // 5. 이유 / 결과 문장 구성
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

  // 6. 대안 제시 (WARN/BLOCK일 때만)
  const alternatives: string[] | undefined = result !== 'PASS' ? [
    '더 안전한 옵션을 고려해보세요.',
    '전문가 상담을 권장합니다.',
  ] : undefined;

  return {
    result,
    riskCategory: riskCategories,
    reasons,
    consequences,
    alternatives,
  };
}
```

### 7.3 rules/kitchen.ts 예시

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

  return aggregateRisks(risks, ctx);
}
```

---

## 8. 결론

### 8.1 핵심 요약

1. **목적 변화**: 추천 시스템 → 의사결정 시스템 (리스크 차단)
2. **결과 타입**: 추천 목록 → PASS/WARN/BLOCK
3. **판단 방식**: AI 또는 규칙 → 규칙만 (AI 금지)
4. **구현 범위**: `lib/decision/` 신규 디렉토리만
5. **기존 구조**: 완전 분리 (수정 금지)

### 8.2 구현 우선순위

1. **1단계**: 타입 정의 및 임계값 테이블 (`types.ts`, `thresholds.ts`)
2. **2단계**: Context Builder 및 Risk Engine (`context-builder.ts`, `risk-engine.ts`)
3. **3단계**: 주방 상판 규칙 (`rules/kitchen.ts`)
4. **4단계**: 외부 진입점 (`index.ts`)
5. **5단계**: 검증 및 테스트

### 8.3 성공 기준

- ✅ TypeScript 에러 0
- ✅ 기존 파일 변경 없음
- ✅ AI 호출 없음
- ✅ 점수 출력 없음
- ✅ PASS / WARN / BLOCK 결과 정상 출력
- ✅ "추천" 키워드 없음

---

**문서 끝**

