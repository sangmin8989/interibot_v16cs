# V4 버그 수정 명세서 분석 보고서

**작성일**: 2025-12-18  
**목적**: 오류 수정 명세서 분석 및 수정 위치 파악

---

## 🔍 발견된 문제점

### 1. ❌ `calculateBufferPercentage is not defined` 에러

#### 문제 상황
- **에러 발생 위치**: `lib/estimate-v4/engines/personality/RiskAssessor.ts:54`
- **호출 코드**:
  ```typescript
  const bufferPercentage = calculateBufferPercentage(level, regretRisks.length)
  ```

#### 원인 분석
1. **함수 정의 위치**: `lib/estimate-v4/converters/output-converter.ts:75-89`
   - 함수는 정의되어 있음 ✅
   - 하지만 `function` 키워드로 선언되어 export되지 않음 ❌
   - 현재는 `output-converter.ts` 내부에서만 사용 가능

2. **Import 누락**: `RiskAssessor.ts`에서 import하지 않음
   - `output-converter.ts`에서 `toV4RiskAssessment`만 import
   - `calculateBufferPercentage`는 import되지 않음

3. **함수 시그니처**:
   ```typescript
   // output-converter.ts:75-89
   function calculateBufferPercentage(
     level: 'low' | 'medium' | 'high',
     additionalRiskCount: number
   ): number {
     let base = 5 // 기본 5%
     if (level === 'medium') base += 3
     if (level === 'high') base += 5
     base += additionalRiskCount * 2
     return Math.min(base, 20) // 최대 20%
   }
   ```

#### 해결 방법 비교

**방법 A (임시 하드코딩)** ⚠️ 빠른 해결
- **위치**: `lib/estimate-v4/engines/personality/RiskAssessor.ts:54`
- **수정 내용**:
  ```typescript
  // 기존
  const bufferPercentage = calculateBufferPercentage(level, regretRisks.length)
  
  // 수정
  const bufferPercentage = 15 // 임시 기본값 15%
  ```
- **장점**: 즉시 에러 해결
- **단점**: 위험 수준 반영 안 됨, 임시방편

**방법 B (정석: 함수 export)** ✅ 권장
- **위치 1**: `lib/estimate-v4/converters/output-converter.ts:75`
  ```typescript
  // 기존
  function calculateBufferPercentage(...)
  
  // 수정
  export function calculateBufferPercentage(...)
  ```

- **위치 2**: `lib/estimate-v4/engines/personality/RiskAssessor.ts:16`
  ```typescript
  // 기존
  import { toV4RiskAssessment } from '../../converters/output-converter'
  
  // 수정
  import { toV4RiskAssessment, calculateBufferPercentage } from '../../converters/output-converter'
  ```

- **장점**: 기존 로직 활용, 위험 수준 반영
- **단점**: 없음 (이미 구현되어 있음)

**방법 C (명세서 제안: 새 함수 구현)** ⚠️ 불필요
- 명세서에서 제안한 `buildingAge`, `hasBathroomReno`, `hasKitchenReno` 기반 함수
- **현재 상황**: 이미 더 나은 로직이 구현되어 있음
- **결론**: 불필요 (기존 함수가 더 적합)

#### 권장 해결 방법
**방법 B (정석)**를 권장합니다.
- 이미 구현된 함수를 export만 하면 됨
- 위험 수준(`level`)과 추가 위험 개수(`additionalRiskCount`)를 반영하는 더 정교한 로직
- 명세서 제안 함수보다 우수함

---

### 2. 📝 등급 표시 변경

#### 현재 상태
**위치**: `app/onboarding/estimate/page.tsx:31-52`

```typescript
const V4_GRADE_INFO: Record<GradeKeyV4, {...}> = {
  argen_e: {
    icon: '💎',
    title: '에센셜',  // ← 변경 필요
    description: '실용적이고 가성비 좋은 선택'
  },
  argen_s: {
    icon: '⭐',
    title: '스탠다드',  // ← 변경 필요
    description: '균형 잡힌 품질과 가격'
  },
  argen_o: {
    icon: '👑',
    title: '오퍼스',  // ← 변경 필요
    description: '프리미엄 맞춤형 인테리어'
  }
}
```

#### 변경 요구사항
- **현재**: 에센셜, 스탠다드, 오퍼스
- **변경**: ARGEN A, ARGEN S, ARGEN O (또는 아르젠 A, 아르젠 S, 아르젠 O)

#### 수정 위치
1. **주요 수정**: `app/onboarding/estimate/page.tsx:33, 40, 47`
   ```typescript
   title: 'ARGEN A',  // 또는 '아르젠 A'
   title: 'ARGEN S',  // 또는 '아르젠 S'
   title: 'ARGEN O',  // 또는 '아르젠 O'
   ```

2. **설명 텍스트 (선택)**: `app/onboarding/estimate/page.tsx:36, 43, 50`
   ```typescript
   description: '합리적인 가성비',  // 기존: '실용적이고 가성비 좋은 선택'
   description: '균형 잡힌 품질과 가격',  // 유지
   description: '프리미엄 맞춤형',  // 기존: '프리미엄 맞춤형 인테리어'
   ```

#### 추가 확인 필요
- 다른 파일에서 등급명을 참조하는지 확인 필요
- 예: `lib/estimate-v4/types/strategy.types.ts`, `lib/estimate-v4/converters/grade-mapper.ts`

---

### 3. 💬 "계산 필요" 표시 수정

#### 현재 상태
**위치**: `app/onboarding/estimate/page.tsx`

1. **1131줄**:
   ```typescript
   const displayAmount = isCurrentGrade 
     ? currentEstimate.total.formatted
     : '계산 필요'  // ← 변경 필요
   ```

2. **1168줄**:
   ```typescript
   <p className="text-lg text-gray-400">계산 필요</p>  // ← 변경 필요
   ```

#### 변경 요구사항
- **현재**: "계산 필요"
- **변경**: "견적 확인하기" 또는 "선택하여 확인"

#### 수정 위치
1. **1131줄**: `'계산 필요'` → `'견적 확인하기'`
2. **1168줄**: `계산 필요` → `견적 확인하기`

---

## 📋 수정 우선순위

### 1. 🔴 즉시 (Critical)
**`calculateBufferPercentage` 에러 해결**
- **방법**: 방법 B (정석) 권장
- **파일**: 
  - `lib/estimate-v4/converters/output-converter.ts` (export 추가)
  - `lib/estimate-v4/engines/personality/RiskAssessor.ts` (import 추가)
- **예상 시간**: 2분

### 2. 🔴 즉시 (Critical)
**등급명 변경**
- **파일**: `app/onboarding/estimate/page.tsx`
- **위치**: 33, 40, 47줄
- **예상 시간**: 1분

### 3. 🟡 선택 (Medium)
**"계산 필요" 문구 변경**
- **파일**: `app/onboarding/estimate/page.tsx`
- **위치**: 1131, 1168줄
- **예상 시간**: 1분

---

## 🔍 추가 확인 사항

### 1. 다른 파일에서 등급명 참조 확인
다음 파일들도 확인 필요:
- `lib/estimate-v4/types/strategy.types.ts` - 등급 타입 정의
- `lib/estimate-v4/converters/grade-mapper.ts` - 등급 매핑
- `lib/estimate-v4/engines/strategy/GradeSelector.ts` - 등급 선택 로직

### 2. `EstimateEngineV4.ts`의 bufferPercentage 하드코딩
**위치**: `lib/estimate-v4/engines/estimate/EstimateEngineV4.ts:69`
```typescript
const bufferPercentage = 10 // 기본값 (실제로는 RiskAssessment에서 가져와야 함)
```

**문제**: 주석에 "RiskAssessment에서 가져와야 함"이라고 되어 있지만 실제로는 하드코딩됨

**해결**: `calculateEstimate` 함수에 `personalityResult` 파라미터 추가하여 `riskAssessment.bufferPercentage` 사용

---

## ✅ 수정 체크리스트

### 즉시 수정 (Critical)
- [ ] `output-converter.ts`: `calculateBufferPercentage` export 추가
- [ ] `RiskAssessor.ts`: `calculateBufferPercentage` import 추가
- [ ] `page.tsx`: 등급명 변경 (ARGEN A/S/O)

### 선택 수정 (Medium)
- [ ] `page.tsx`: "계산 필요" → "견적 확인하기"
- [ ] `page.tsx`: 설명 텍스트 간소화 (선택)
- [ ] `EstimateEngineV4.ts`: bufferPercentage 하드코딩 제거 (향후 개선)

---

## 📝 수정 예시 코드

### 1. calculateBufferPercentage export 추가

**파일**: `lib/estimate-v4/converters/output-converter.ts:75`
```typescript
// 기존
function calculateBufferPercentage(...)

// 수정
export function calculateBufferPercentage(...)
```

### 2. RiskAssessor.ts import 추가

**파일**: `lib/estimate-v4/engines/personality/RiskAssessor.ts:16`
```typescript
// 기존
import { toV4RiskAssessment } from '../../converters/output-converter'

// 수정
import { toV4RiskAssessment, calculateBufferPercentage } from '../../converters/output-converter'
```

### 3. 등급명 변경

**파일**: `app/onboarding/estimate/page.tsx:33, 40, 47`
```typescript
// 기존
title: '에센셜',
title: '스탠다드',
title: '오퍼스',

// 수정 (영문)
title: 'ARGEN A',
title: 'ARGEN S',
title: 'ARGEN O',

// 또는 (한글)
title: '아르젠 A',
title: '아르젠 S',
title: '아르젠 O',
```

### 4. "계산 필요" 문구 변경

**파일**: `app/onboarding/estimate/page.tsx:1131, 1168`
```typescript
// 기존
: '계산 필요'
<p className="text-lg text-gray-400">계산 필요</p>

// 수정
: '견적 확인하기'
<p className="text-lg text-gray-400">견적 확인하기</p>
```

---

**분석 완료!** 🎉

수정 진행 시 이 보고서를 참고하여 작업하시면 됩니다.

