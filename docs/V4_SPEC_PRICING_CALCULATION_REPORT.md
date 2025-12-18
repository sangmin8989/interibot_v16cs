# V4 견적 엔진 명세서 및 가격 정책 보고서

**작성일**: 2025-12-18  
**버전**: V4.0.0  
**상태**: ✅ 구현 완료

---

## 📋 목차

1. [V4 명세서 개요](#1-v4-명세서-개요)
2. [3등급 가격 정책](#2-3등급-가격-정책)
3. [계산 로직 상세](#3-계산-로직-상세)
4. [데이터 흐름](#4-데이터-흐름)
5. [파일 구조](#5-파일-구조)

---

## 1. V4 명세서 개요

### 1.1 V4 엔진 아키텍처

V4 견적 엔진은 **3단계 파이프라인** 구조로 설계되었습니다:

```
입력 데이터
    ↓
[1단계] 성향 분석 (PersonalityEngineV4)
    ↓
[2단계] 전략 결정 (StrategyEngineV4)
    ↓
[3단계] 견적 계산 (EstimateEngineV4)
    ↓
UI 어댑터 (UIAdapter)
    ↓
최종 견적 결과
```

### 1.2 핵심 특징

#### ✅ V3 엔진 재사용
- **TraitEngine**: 성향 점수 계산
- **RiskEngine**: 위험 평가 (비동기 버전 제공)
- **ProcessEngine**: 공정 추천

#### ✅ 헌법 v1.1 준수
- `getMaterialPriceStrict`: 자재 단가 조회 (DB 기반)
- `getLaborRateStrict`: 노무비 조회 (DB 기반)
- `EstimateValidationError`: 검증 실패 시 throw

#### ✅ 타입 안전성
- TypeScript strict mode
- V3 ↔ V4 타입 변환 레이어
- 한글 키 ↔ 영문 키 매핑

### 1.3 주요 변경사항 (V3 → V4)

| 항목 | V3 | V4 |
|-----|----|----|
| 등급 체계 | 4등급 (BASIC/STANDARD/ARGEN/PREMIUM) | 3등급 (ARGEN_E/ARGEN_S/ARGEN_O) |
| 등급명 | 실속형/표준형/아르젠/프리미엄 | ARGEN A/S/O |
| 가격 기준 | STANDARD = 1.0 | ARGEN_S = 1.0 |
| 데이터 소스 | 프리셋 + DB | 헌법 v1.1 서비스 (DB 우선) |

---

## 2. 3등급 가격 정책

### 2.1 등급 체계

**파일 위치**: `lib/estimate-v4/converters/grade-mapper.ts`

```typescript
export const GRADE_INFO: Record<GradeV4, GradeInfoV4> = {
  'ARGEN_E': {
    code: 'ARGEN_E',
    name: '아르젠 에이',
    description: '합리적인 가성비',
    legacyGrade: 'BASIC',
    priceMultiplier: 0.85,  // ARGEN_S 대비 85%
  },
  'ARGEN_S': {
    code: 'ARGEN_S',
    name: '아르젠 에스',
    description: '균형 잡힌 품질과 가격',
    legacyGrade: 'ARGEN',
    priceMultiplier: 1.0,   // 기준 등급 (100%)
  },
  'ARGEN_O': {
    code: 'ARGEN_O',
    name: '아르젠 오퍼스',
    description: '프리미엄 맞춤형',
    legacyGrade: 'PREMIUM',
    priceMultiplier: 1.25,  // ARGEN_S 대비 125%
  },
}
```

### 2.2 가격 배율 정책

| 등급 | 코드 | 배율 | V3 매핑 | 설명 |
|-----|------|------|---------|------|
| **ARGEN E** | `ARGEN_E` | **0.85** | BASIC | 합리적인 가성비 (15% 할인) |
| **ARGEN S** | `ARGEN_S` | **1.0** | ARGEN | 기준 등급 (100%) |
| **ARGEN O** | `ARGEN_O` | **1.25** | PREMIUM | 프리미엄 맞춤형 (25% 프리미엄) |

### 2.3 등급 선택 로직

**파일 위치**: `lib/estimate-v4/engines/strategy/GradeSelector.ts`

#### 예산 기준 초기 등급 결정

```typescript
const budgetPerPyeong = budget.max / 32 // 평균 32평 기준

if (budgetPerPyeong < 1,000,000원) {
  grade = 'ARGEN_E'  // 평당 100만원 미만
} else if (budgetPerPyeong < 1,500,000원) {
  grade = 'ARGEN_S'  // 평당 100-150만원
} else {
  grade = 'ARGEN_O'  // 평당 150만원 이상
}
```

#### 성향 기반 업그레이드

```typescript
// 청결/정리 성향 높으면 업그레이드 고려
if (cleaningScore >= 8 && orgScore >= 8 && budget.flexibility !== 'strict') {
  if (grade === 'ARGEN_E') grade = 'ARGEN_S'
  if (grade === 'ARGEN_S') grade = 'ARGEN_O'
}
```

#### 목적 기반 조정

```typescript
// 매도 목적이면 최소 스탠다드 이상
if (purpose === 'sell' && grade === 'ARGEN_E') {
  grade = 'ARGEN_S'
}
```

### 2.4 V3 → V4 등급 매핑

**파일 위치**: `lib/estimate-v4/converters/grade-mapper.ts`

```typescript
export const V3_TO_V4_GRADE: Record<LegacyGrade, GradeV4> = {
  'BASIC': 'ARGEN_E',      // 실속형 → ARGEN E
  'STANDARD': 'ARGEN_S',   // 표준형 → ARGEN S
  'ARGEN': 'ARGEN_S',      // 아르젠 → ARGEN S
  'PREMIUM': 'ARGEN_O',    // 프리미엄 → ARGEN O
}
```

---

## 3. 계산 로직 상세

### 3.1 전체 계산 플로우

```
[입력]
  - spaceInfo: 평수, 방 개수, 욕실 개수 등
  - selectedSpaces: 선택된 공간 목록
  - selectedProcesses: 선택된 공정 목록
  - preferences: 예산, 가족 구성, 라이프스타일 등
  - answers: 성향 분석 답변

[1단계: 성향 분석]
  - TraitScorer: 성향 점수 계산 (V3 TraitEngine)
  - TypeClassifier: 타입 분류
  - RiskAssessor: 위험 평가 (V3 RiskEngine)

[2단계: 전략 결정]
  - GradeSelector: 등급 선택 (예산 + 성향 기반)
  - ProcessPicker: 공정 선택 (선택된 공간 기반)

[3단계: 견적 계산]
  - CostCalculator: 공정별 비용 계산
    - 자재비: getMaterialPriceStrict (헌법 v1.1)
    - 노무비: getLaborRateStrict (헌법 v1.1)
  - EstimateEngine: 전체 견적 집계

[출력]
  - UIEstimateV4: UI 표시용 견적 결과
```

### 3.2 공정별 비용 계산

**파일 위치**: `lib/estimate-v4/engines/estimate/CostCalculator.ts`

#### 자재비 계산

```typescript
// 1. 공정 ID → 헌법 ProcessId 변환
const heongbeopProcessId = V4_PROCESS_TO_HEONGBEOP[processId]

// 2. 자재 카테고리 매핑
const materialMapping = PROCESS_MATERIAL_MAP[processId]
// 예: kitchen_core → { category1: '주방', category2: '시스템주방', spec: 'SET' }

// 3. 수량 계산 (평수 기반)
const quantity = materialMapping.quantity(spaceInfo.pyeong)
// 예: lighting → Math.ceil(pyeong * 0.5) EA

// 4. 헌법 v1.1 서비스 호출
const materialData = await getMaterialPriceStrict({
  processId: heongbeopProcessId,
  space: mappedSpace,
  category: { category1, category2, category3 },
  spec: materialMapping.spec,
  brandCondition: { isArgenStandard: true },
  quantity,
})

// 5. 자재 항목 생성
materials.push({
  materialId: materialData.materialId,
  name: materialData.productName,
  unit: materialData.unit,
  quantity: quantity.value,
  unitPrice: materialData.price,
  totalPrice: quantity.value * materialData.price,
  dataSource: 'DB',
})
```

#### 노무비 계산

```typescript
// 1. 노무 정보 매핑
const laborMapping = PROCESS_LABOR_MAP[heongbeopProcessId]
// 예: kitchen → { unit: 'SET', totalQuantity: 1, dailyOutput: 0.5, crewSize: 2 }

// 2. 총 수량 계산
const totalQuantity = laborMapping.totalQuantity(spaceInfo.pyeong)

// 3. 헌법 v1.1 서비스 호출
const laborData = await getLaborRateStrict({
  processId: heongbeopProcessId,
  unit: laborMapping.unit,
  totalQuantity,
  dailyOutput: laborMapping.dailyOutput,
  crewSize: laborMapping.crewSize,
  difficultyFactor: 1.0,
})

// 4. 작업 일수 계산
const workDays = Math.ceil(totalQuantity / laborData.dailyOutput)

// 5. 총 노무비 계산
const totalLaborCost = 
  workDays * 
  laborData.crewSize * 
  laborData.ratePerPersonDay * 
  laborData.difficultyFactor
```

#### 공정 합계 계산

```typescript
// 자재비 소계
const materialSubtotal = materials.reduce((sum, m) => sum + m.totalPrice, 0)

// 노무비 소계
const laborSubtotal = labor.totalCost

// 공정 합계
const processTotal = materialSubtotal + laborSubtotal
```

### 3.3 견적 요약 계산

**파일 위치**: `lib/estimate-v4/engines/estimate/CostCalculator.ts:399-420`

```typescript
export function calculateSummary(
  blocks: ProcessBlockV4[],
  bufferPercentage: number,
  pyeong: number
): EstimateSummaryV4 {
  // 자재비 합계
  const materialTotal = blocks.reduce((sum, b) => sum + b.materialSubtotal, 0)
  
  // 노무비 합계
  const laborTotal = blocks.reduce((sum, b) => sum + b.laborSubtotal, 0)
  
  // 총 합계
  const grandTotal = materialTotal + laborTotal
  
  // 부가세 (10%)
  const vatAmount = Math.round(grandTotal * 0.1)
  
  // 예비비
  const bufferAmount = Math.round((grandTotal * bufferPercentage) / 100)
  
  // 예비비 포함 총액
  const totalWithBuffer = grandTotal + vatAmount + bufferAmount
  
  // 평당 단가
  const costPerPyeong = grandTotal / pyeong
  
  return {
    grandTotal,
    materialTotal,
    laborTotal,
    vatAmount,
    bufferAmount,
    totalWithBuffer,
    costPerPyeong,
  }
}
```

### 3.4 등급별 가격 적용

**현재 구현 상태**: ⚠️ **등급별 가격 배율이 자재/노무비 계산에 직접 적용되지 않음**

**문제점**:
- `CostCalculator`에서 `getMaterialPriceStrict`, `getLaborRateStrict` 호출 시
- 등급 정보(`grade`)는 전달되지만, 가격 배율(`priceMultiplier`)이 적용되지 않음
- 헌법 v1.1 서비스에서 등급별 가격을 반환하는지 확인 필요

**개선 방안**:
```typescript
// 등급별 가격 배율 적용
const gradeInfo = GRADE_INFO[grade]
const adjustedPrice = materialData.price * gradeInfo.priceMultiplier
```

---

## 4. 데이터 흐름

### 4.1 입력 데이터 구조

```typescript
interface CollectedInputV4 {
  spaceInfo: {
    housingType: 'apartment' | 'villa' | 'house' | 'officetel'
    pyeong: number
    rooms: number
    bathrooms: number
    buildingAge?: number
    floor?: number
  }
  answers: Array<{
    questionId: string
    answerId: string
    value: string
  }>
  preferences: {
    budget: { min: number; max: number; flexibility: 'strict' | 'flexible' | 'uncertain' }
    family: { totalPeople: number; hasInfant: boolean; hasChild: boolean; ... }
    lifestyle: { remoteWork: boolean; cookOften: boolean; guestsOften: boolean }
    purpose: 'live' | 'sell' | 'rent'
  }
  selectedSpaces: string[]  // ['kitchen', 'bathroom', 'living']
  selectedProcesses: Record<string, string[]>  // { 'kitchen': ['kitchen_core'] }
  timestamp: string
}
```

### 4.2 출력 데이터 구조

```typescript
interface UIEstimateV4 {
  isSuccess: boolean
  grade: 'ARGEN_E' | 'ARGEN_S' | 'ARGEN_O'
  gradeName: string
  total: {
    formatted: string  // "3,000만원"
    perPyeong: string  // "평당 100만원"
  }
  breakdown: Array<{
    processName: string
    amount: string
    percentage: number
    materials: Array<{
      name: string
      quantity: string
      unitPrice: string
      totalPrice: string
    }>
    labor: {
      type: string
      amount: string
    } | null
  }>
  personalityMatch: {
    score: number  // 0-100
    highlights: string[]
  }
  warnings: string[]
  errorMessage?: string
}
```

---

## 5. 파일 구조

### 5.1 핵심 파일 목록

```
lib/estimate-v4/
├── index.ts                          # 공개 API
├── types/
│   ├── input.types.ts                # 입력 타입
│   ├── personality.types.ts          # 성향 분석 타입
│   ├── strategy.types.ts             # 전략 결정 타입 (등급 정의 포함)
│   ├── estimate.types.ts             # 견적 결과 타입
│   └── index.ts
├── converters/
│   ├── grade-mapper.ts               # ⭐ 3등급 가격 정책 정의
│   ├── trait-mapper.ts
│   ├── risk-mapper.ts
│   ├── input-converter.ts
│   ├── output-converter.ts
│   └── index.ts
├── engines/
│   ├── personality/
│   │   ├── TraitScorer.ts
│   │   ├── TypeClassifier.ts
│   │   ├── RiskAssessor.ts
│   │   ├── PersonalityEngineV4.ts
│   │   └── index.ts
│   ├── strategy/
│   │   ├── GradeSelector.ts          # ⭐ 등급 선택 로직
│   │   ├── ProcessPicker.ts
│   │   ├── StrategyEngineV4.ts
│   │   └── index.ts
│   ├── estimate/
│   │   ├── ValidationGuard.ts
│   │   ├── CostCalculator.ts         # ⭐ 비용 계산 로직
│   │   ├── EstimateEngineV4.ts       # ⭐ 견적 계산 메인
│   │   └── index.ts
│   └── index.ts
├── adapters/
│   ├── UIAdapter.ts                  # UI 변환
│   └── index.ts
└── utils/
    ├── logger.ts
    ├── error-handler.ts
    └── index.ts

app/api/estimate/v4/
└── route.ts                          # API 엔드포인트
```

### 5.2 주요 매핑 테이블

#### 공정 ID → 헌법 ProcessId

**파일**: `lib/estimate-v4/engines/estimate/CostCalculator.ts:29-40`

```typescript
const V4_PROCESS_TO_HEONGBEOP: Record<string, ProcessId> = {
  kitchen_core: 'kitchen',
  bathroom_waterproof: 'bathroom',
  storage_system: 'storage',
  soundproof: 'finish',
  lighting: 'electric',
  flooring: 'finish',
  wallpaper: 'finish',
  window: 'window',
  door: 'door',
  demolition: 'demolition',
}
```

#### 공정별 자재 카테고리

**파일**: `lib/estimate-v4/engines/estimate/CostCalculator.ts:61-148`

```typescript
const PROCESS_MATERIAL_MAP: Record<string, {
  category1: string
  category2: string
  category3?: string
  spec: string
  quantity: (pyeong: number) => { value: number; unit: string; basis: string }
}> = {
  kitchen_core: {
    category1: '주방',
    category2: '시스템주방',
    spec: 'SET',
    quantity: () => ({ value: 1, unit: 'SET', basis: '주방 1세트' }),
  },
  bathroom_waterproof: {
    category1: '욕실',
    category2: '욕실세트',
    spec: 'SET',
    quantity: () => ({ value: 1, unit: 'SET', basis: '욕실 1세트' }),
  },
  lighting: {
    category1: '조명',
    category2: '다운라이트',
    spec: 'EA',
    quantity: (py) => ({
      value: Math.ceil(py * 0.5),
      unit: 'EA',
      basis: `평수 ${py}평 기준 조명 개수`,
    }),
  },
  flooring: {
    category1: '바닥',
    category2: '마루',
    spec: '㎡',
    quantity: (py) => ({
      value: py * 3.3,
      unit: '㎡',
      basis: `평수 ${py}평 기준 바닥 면적`,
    }),
  },
  // ... 기타 공정
}
```

#### 공정별 노무 정보

**파일**: `lib/estimate-v4/engines/estimate/CostCalculator.ts:153-225`

```typescript
const PROCESS_LABOR_MAP: Record<ProcessId, {
  unit: 'm2' | 'EA' | 'SET' | 'day' | 'team'
  totalQuantity: (pyeong: number) => number
  dailyOutput: number
  crewSize: number
}> = {
  finish: {
    unit: 'm2',
    totalQuantity: (py) => py * 3.3,
    dailyOutput: 40,
    crewSize: 2,
  },
  kitchen: {
    unit: 'SET',
    totalQuantity: () => 1,
    dailyOutput: 0.5,
    crewSize: 2,
  },
  bathroom: {
    unit: 'SET',
    totalQuantity: () => 1,
    dailyOutput: 0.7,
    crewSize: 2,
  },
  // ... 기타 공정
}
```

---

## 6. 주요 계산 공식

### 6.1 자재비 계산

```
자재비 = 수량 × 단가

수량 계산:
- 주방/욕실: 1 SET (고정)
- 조명: Math.ceil(평수 × 0.5) EA
- 바닥: 평수 × 3.3 ㎡
- 도배: 평수 × 3.3 × 2.5 ㎡
- 창호: Math.ceil(평수 / 8) EA
- 문: Math.ceil(평수 / 10) EA

단가: 헌법 v1.1 서비스에서 조회 (DB 기반)
```

### 6.2 노무비 계산

```
노무비 = 작업일수 × 인원수 × 일당 × 난이도

작업일수 = Math.ceil(총수량 / 일일생산량)
총수량: 공정별 계산 (평수 기반)
일일생산량: 공정별 고정값
인원수: 공정별 고정값
일당: 헌법 v1.1 서비스에서 조회 (DB 기반)
난이도: 기본 1.0
```

### 6.3 견적 합계 계산

```
자재비 합계 = Σ(공정별 자재비)
노무비 합계 = Σ(공정별 노무비)
총 합계 = 자재비 합계 + 노무비 합계
부가세 = 총 합계 × 0.1
예비비 = 총 합계 × 예비비율 (기본 10%)
예비비 포함 총액 = 총 합계 + 부가세 + 예비비
평당 단가 = 총 합계 / 평수
```

---

## 7. 등급별 가격 적용 현황

### 7.1 현재 구현 상태

**문제점**: 등급별 가격 배율(`priceMultiplier`)이 실제 계산에 적용되지 않음

**원인**:
- `CostCalculator`에서 `getMaterialPriceStrict`, `getLaborRateStrict` 호출 시
- 등급 정보는 전달되지만, 가격 배율이 적용되지 않음
- 헌법 v1.1 서비스가 등급별 가격을 반환하는지 확인 필요

### 7.2 개선 방안

```typescript
// CostCalculator.ts 수정 예시
const materialData = await getMaterialPriceStrict(materialRequest)

// 등급별 가격 배율 적용
const gradeInfo = GRADE_INFO[grade]
const adjustedUnitPrice = materialData.price * gradeInfo.priceMultiplier

materials.push({
  // ...
  unitPrice: adjustedUnitPrice,
  totalPrice: quantity.value * adjustedUnitPrice,
  // ...
})
```

---

## 8. 검증 사항

### 8.1 타입 안전성
- [x] TypeScript strict mode
- [x] 모든 타입 정의 완료
- [x] V3 ↔ V4 타입 변환 레이어

### 8.2 계산 정확성
- [x] 자재비 계산 로직
- [x] 노무비 계산 로직
- [x] 견적 합계 계산
- [ ] 등급별 가격 배율 적용 (미구현)

### 8.3 데이터 소스
- [x] 헌법 v1.1 서비스 연동
- [x] DB 우선 조회
- [x] 데이터 소스 통계

---

## 9. 참고 자료

### 9.1 관련 문서
- `docs/V4_IMPLEMENTATION_COMPLETE.md` - 구현 완료 보고서
- `docs/V4_FULL_LOGIC_ANALYSIS.md` - 전체 로직 분석
- `docs/V4_BUG_FIX_ANALYSIS.md` - 버그 수정 분석

### 9.2 핵심 파일
- `lib/estimate-v4/converters/grade-mapper.ts` - 3등급 가격 정책
- `lib/estimate-v4/engines/strategy/GradeSelector.ts` - 등급 선택 로직
- `lib/estimate-v4/engines/estimate/CostCalculator.ts` - 비용 계산 로직
- `lib/estimate-v4/engines/estimate/EstimateEngineV4.ts` - 견적 계산 메인

---

**보고서 완료!** 🎉

