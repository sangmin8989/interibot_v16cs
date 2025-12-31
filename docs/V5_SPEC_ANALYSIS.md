# 인테리봇 성향분석 엔진 v5 명세서 분석 보고서

**작성일**: 2025년 12월 18일  
**분석 대상**: 인테리봇 성향분석 엔진 v5 완전본 명세서  
**목적**: 명세서와 현재 코드베이스 비교 분석 및 구현 계획 수립

---

## 📋 목차

1. [핵심 원칙 비교](#1-핵심-원칙-비교)
2. [STEP별 구현 상태](#2-step별-구현-상태)
3. [주요 차이점](#3-주요-차이점)
4. [구현 우선순위](#4-구현-우선순위)
5. [상세 구현 계획](#5-상세-구현-계획)

---

## 1. 핵심 원칙 비교

### 1.1 명세서의 핵심 원칙

> **"쓸데없는 질문을 하지 않는 AI"**
> - 질문의 개수와 정확도가 곧 엔진의 성능
> - 모든 질문은 공정을 바꾸고, 모든 태그는 옵션을 바꾸며, 모든 리스크는 선택을 돕는다

### 1.2 현재 구현 상태

**✅ 구현됨:**
- AI 기반 질문 생성 (`/api/generate-questions`)
- 질문 개수 제한 (최대 7개 → 명세서는 6개)
- 질문 필터링 로직 (Phase 0)

**❌ 미구현:**
- 가설 기반 질문 생성 (규칙 기반)
- 질문 중요도 점수 계산 (구체적 공식)
- 성향 태그 시스템 (12개 태그)
- 태그 → 공정/옵션 매핑
- 리스크 문구 생성 (템플릿 기반)

---

## 2. STEP별 구현 상태

### STEP 1: 고객 기본 정보 입력

| 필드 | 명세서 | 현재 구현 | 상태 |
|-----|--------|----------|------|
| 주택 유형 | `housing_type` | `housingType` | ✅ 유사 |
| 평형 구간 | `pyeong_range` | `pyeong` (직접 입력) | ⚠️ 차이 |
| 준공연도 | `building_year` | ❌ 없음 | ❌ 누락 |
| 점유 형태 | `ownership` | ❌ 없음 | ❌ 누락 |
| 거주 계획 | `stay_plan` | ❌ 없음 | ❌ 누락 |
| 가족 구성 | `family_type` | `ageRanges`, `familySizeRange` | ⚠️ 차이 |
| 예산 구간 | `budget_range` | `budget` (별도 페이지) | ⚠️ 차이 |
| 공사 목적 | `purpose` | ❌ 없음 | ❌ 누락 |
| 재택 근무 | `remote_work` | `lifestyleTags` 포함 가능 | ⚠️ 차이 |
| 요리 빈도 | `cook_freq` | ❌ 없음 | ❌ 누락 |

**결론**: 기본 정보 입력 필드가 **70% 누락** 상태

---

### STEP 2: AI 1차 성향 가설 생성

**명세서 요구사항:**
- 규칙 기반 가설 생성 (if-then)
- 8개 가설: 노후_리스크, 수납_리스크, 단기_거주, 안전_리스크, 예산_리스크, 결정_피로, 주방_리스크, 작업공간

**현재 구현:**
- ❌ 가설 생성 함수 없음
- ⚠️ RiskEngine에서 일부 리스크 탐지 (하지만 가설 기반 아님)

**결론**: **완전 미구현**

---

### STEP 3: 질문 후보군 생성

**명세서 요구사항:**
- 가설 → 질문 매핑 규칙
- 18개 고정 질문 뱅크 (Q01-Q18)

**현재 구현:**
- ✅ AI 기반 질문 생성 (`/api/generate-questions`)
- ❌ 고정 질문 뱅크 없음 (AI가 동적 생성)
- ❌ 가설 기반 매핑 없음

**결론**: **접근 방식이 다름** (AI 동적 생성 vs 규칙 기반 고정 뱅크)

---

### STEP 4: 질문 중요도 점수 계산

**명세서 요구사항:**
- 구체적 점수 공식:
  - 공정 영향도 (30%)
  - 비용 영향도 (25%)
  - 리스크 감소 (25%)
  - 가설 연관도 (15%)
  - 중복 감점 (-5%)

**현재 구현:**
- ⚠️ `impactType` 기반 우선순위 정렬 (PRICE > PROCESS > OPTION)
- ❌ 구체적 점수 계산 없음
- ❌ 가중치 기반 점수 없음

**결론**: **부분 구현** (우선순위만, 점수 계산 없음)

---

### STEP 5: 질문 선별 (최대 6개)

**명세서 요구사항:**
- 최대 6개
- HARD 질문 최소 2개
- SOFT 질문 단독 금지

**현재 구현:**
- ✅ 최대 7개 제한 (명세서는 6개)
- ❌ HARD/SEMI/SOFT 분류 없음
- ❌ 질문 타입별 규칙 없음

**결론**: **부분 구현** (개수 제한만)

---

### STEP 6-7: 질문 노출 및 답변 수집

**현재 구현:**
- ✅ 질문 UI 구현 (`app/onboarding/personality/page.tsx`)
- ✅ 답변 수집 및 저장

**결론**: **완전 구현**

---

### STEP 8: 성향 태그 확정

**명세서 요구사항:**
- 12개 태그: OLD_RISK_HIGH, STORAGE_RISK_HIGH, SHORT_STAY 등
- 답변 기반 태그 확정 규칙

**현재 구현:**
- ⚠️ `PersonalityEngineV4`에서 타입 분류 (하지만 태그 시스템 아님)
- ❌ 12개 태그 정의 없음
- ❌ 태그 확정 함수 없음

**결론**: **완전 미구현**

---

### STEP 9: 공정·옵션·아르젠 추천 반영

**명세서 요구사항:**
- 태그 → 공정/옵션 매핑
- 아르젠 제작 추천 로직

**현재 구현:**
- ⚠️ `ProcessEngine`에서 공정 추천 (하지만 태그 기반 아님)
- ❌ 태그 → 공정 매핑 없음
- ❌ 아르젠 추천 로직 없음

**결론**: **완전 미구현**

---

### STEP 10: 성향 분석 검증

**명세서 요구사항:**
- PASS/FAIL 검증 규칙
- 재시도 로직

**현재 구현:**
- ❌ 검증 함수 없음

**결론**: **완전 미구현**

---

## 3. 주요 차이점

### 3.1 질문 생성 방식

| 항목 | 명세서 | 현재 구현 |
|-----|--------|----------|
| **방식** | 규칙 기반 고정 뱅크 (18개) | AI 동적 생성 |
| **기준** | 가설 → 질문 매핑 | AI 프롬프트 기반 |
| **점수** | 구체적 공식 (가중치) | impactType 우선순위 |
| **개수** | 최대 6개 | 최대 7개 |

**분석:**
- 명세서는 **규칙 기반, 예측 가능한 시스템**
- 현재는 **AI 기반, 유연하지만 불확실한 시스템**
- 명세서 방식이 더 **명확하고 검증 가능**

---

### 3.2 성향 표현 방식

| 항목 | 명세서 | 현재 구현 |
|-----|--------|----------|
| **표현** | 태그 (12개) | 점수 (15개 카테고리) |
| **확정** | 답변 기반 규칙 | 점수 계산 |
| **연동** | 태그 → 공정/옵션 매핑 | 점수 → 추천 |

**분석:**
- 명세서는 **이진 태그** (있음/없음)
- 현재는 **연속 점수** (1-10)
- 명세서 방식이 **공정 변경에 더 명확**

---

### 3.3 기본 정보 수집

| 항목 | 명세서 | 현재 구현 |
|-----|--------|----------|
| **필수 필드** | 7개 | 3-4개 (평수, 방, 욕실) |
| **선택 필드** | 3개 | 라이프스타일 태그 |
| **용도** | 가설 생성 | AI 프롬프트 맥락 |

**분석:**
- 명세서는 **구조화된 입력** (가설 생성용)
- 현재는 **자유 입력** (AI 맥락용)
- 명세서 방식이 **규칙 기반 로직에 적합**

---

## 4. 구현 우선순위

### 🔴 Phase 1: 핵심 인프라 (1주)

**목표**: 명세서 기반 질문 시스템 구축

1. **기본 정보 입력 필드 추가** (2일)
   - 준공연도, 점유 형태, 거주 계획, 공사 목적, 요리 빈도 추가
   - UI 수정 (`app/onboarding/space-info/page.tsx`)

2. **가설 생성 함수 구현** (2일)
   - `lib/analysis/v5/hypothesis-generator.ts`
   - 8개 가설 규칙 구현

3. **질문 뱅크 구축** (2일)
   - 18개 고정 질문 정의
   - `lib/data/v5-question-bank.ts`

4. **질문 점수 계산 함수** (1일)
   - `lib/analysis/v5/question-scorer.ts`
   - 가중치 기반 점수 계산

---

### 🟡 Phase 2: 질문 시스템 교체 (1주)

**목표**: AI 동적 생성 → 규칙 기반 고정 뱅크로 전환

1. **질문 선별 로직** (2일)
   - `lib/analysis/v5/question-selector.ts`
   - HARD/SEMI/SOFT 규칙 적용

2. **질문 노출 UI 수정** (2일)
   - 기존 AI 질문 → 고정 뱅크 질문으로 교체
   - 질문 타입 표시 (선택사항)

3. **검증 함수 구현** (1일)
   - `lib/analysis/v5/validator.ts`
   - PASS/FAIL 검증

4. **테스트 및 버그 수정** (2일)

---

### 🟢 Phase 3: 성향 태그 시스템 (1주)

**목표**: 점수 기반 → 태그 기반 전환

1. **태그 정의 및 확정 함수** (2일)
   - `lib/analysis/v5/tag-confirmer.ts`
   - 12개 태그 확정 규칙

2. **태그 → 공정/옵션 매핑** (2일)
   - `lib/analysis/v5/tag-process-mapper.ts`
   - 공정 ON/OFF 로직

3. **아르젠 추천 로직** (2일)
   - `lib/analysis/v5/argen-recommender.ts`
   - 조건 기반 추천

4. **리스크 문구 생성** (1일)
   - `lib/analysis/v5/risk-message-generator.ts`
   - 템플릿 기반 생성

---

### 🔵 Phase 4: 통합 및 정리 (3일)

**목표**: 기존 시스템과 통합

1. **기존 시스템 연결** (1일)
   - 태그 → 견적 시스템 연결
   - 아르젠 추천 → 자재 DB 연결

2. **UI 정리** (1일)
   - 결과 화면 새 구조 적용
   - 기존 체크리스트 코드 제거

3. **전체 테스트** (1일)

---

## 5. 상세 구현 계획

### 5.1 기본 정보 입력 필드 추가

**파일**: `app/onboarding/space-info/page.tsx` (또는 새 페이지)

**추가 필드:**
```typescript
interface BasicInfoInput {
  // 기존
  housingType: string;
  pyeong: number;
  
  // 신규 (필수)
  buildingYear: number;        // 준공연도
  ownership: 'owned' | 'jeonse' | 'monthly';  // 점유 형태
  stayPlan: 'under1y' | '1to3y' | '3to5y' | 'over5y' | 'unknown';  // 거주 계획
  familyType: ('infant' | 'child' | 'teen' | 'adult' | 'elderly' | 'pet')[];  // 가족 구성
  budgetRange: 'under2000' | '2000to4000' | '4000to6000' | 'over6000' | 'unknown';  // 예산 구간
  
  // 신규 (선택)
  purpose?: 'live' | 'sell' | 'rent';  // 공사 목적
  remoteWork?: 'none' | '1to2days' | '3plus';  // 재택 근무
  cookFreq?: 'rarely' | 'sometimes' | 'daily';  // 요리 빈도
}
```

---

### 5.2 가설 생성 함수

**파일**: `lib/analysis/v5/hypothesis-generator.ts`

```typescript
export interface HypothesisResult {
  old_risk: 'HIGH' | 'MEDIUM' | 'LOW';
  storage_risk: 'HIGH' | 'MEDIUM' | 'LOW';
  short_stay: 'HIGH' | 'MEDIUM' | 'LOW';
  safety_risk: 'HIGH' | 'MEDIUM' | 'LOW';
  budget_risk: 'HIGH' | 'MEDIUM' | 'LOW';
  decision_fatigue: 'HIGH' | 'MEDIUM' | 'LOW';
  kitchen_risk: 'HIGH' | 'MEDIUM' | 'LOW';
  workspace: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function generateHypothesis(input: BasicInfoInput): HypothesisResult {
  // 명세서 규칙 그대로 구현
}
```

---

### 5.3 질문 뱅크

**파일**: `lib/data/v5-question-bank.ts`

```typescript
export const QUESTION_BANK = {
  Q01: { text: "...", type: 'HARD', category: 'old', ... },
  Q02: { text: "...", type: 'HARD', category: 'old', ... },
  // ... 18개 질문
} as const;
```

---

### 5.4 질문 점수 계산

**파일**: `lib/analysis/v5/question-scorer.ts`

```typescript
export function calculateQuestionScore(
  questionId: string,
  hypothesis: HypothesisResult,
  selectedQuestions: string[]
): QuestionScore {
  // 명세서 공식 그대로 구현
  // 공정 영향도 30% + 비용 영향도 25% + 리스크 감소 25% + 가설 연관도 15% - 중복 감점 5%
}
```

---

### 5.5 성향 태그 확정

**파일**: `lib/analysis/v5/tag-confirmer.ts`

```typescript
export function confirmPersonalityTags(
  answers: Record<string, string>,
  basicInfo: BasicInfoInput
): PersonalityTags {
  // 명세서 규칙 그대로 구현
  // 12개 태그 확정
}
```

---

### 5.6 태그 → 공정 매핑

**파일**: `lib/analysis/v5/tag-process-mapper.ts`

```typescript
export function applyTagsToProcesses(
  tags: string[],
  currentProcesses: Record<string, boolean>
): void {
  // OLD_RISK_HIGH → 방수, 단열, 창호, 배관 필수 체크
  // STORAGE_RISK_HIGH → 붙박이장, 신발장 기본 ON
  // ...
}
```

---

## 6. 마이그레이션 전략

### 6.1 기존 시스템과의 공존

**옵션 1: 플래그 기반 분기**
```typescript
const USE_V5_ENGINE = process.env.USE_V5_ENGINE === 'true';

if (USE_V5_ENGINE) {
  // V5 엔진 사용
} else {
  // 기존 엔진 사용
}
```

**옵션 2: 단계적 교체**
- Phase 1-2: V5 질문 시스템만 교체 (기존 분석 엔진 유지)
- Phase 3: V5 태그 시스템 추가 (기존 점수 시스템과 병행)
- Phase 4: 완전 전환

---

### 6.2 데이터 호환성

**기존 데이터:**
- `personalityStore.answers`: 질문 ID → 답변
- `personalityStore.analysis`: 점수 기반 분석 결과

**V5 데이터:**
- 기본 정보: `BasicInfoInput`
- 가설: `HypothesisResult`
- 태그: `PersonalityTags`

**변환 함수 필요:**
```typescript
function convertV3ToV5(v3Data: V3PersonalityData): V5PersonalityData {
  // 기존 데이터를 V5 형식으로 변환
}
```

---

## 7. 위험 요소 및 대응

### 7.1 위험 요소

1. **기존 사용자 데이터 호환성**
   - 기존 답변 데이터가 V5 형식과 맞지 않을 수 있음
   - **대응**: 변환 함수 구현, 기본값 처리

2. **질문 뱅크 고정 vs 유연성**
   - 18개 고정 질문이 모든 케이스 커버 못할 수 있음
   - **대응**: 초기에는 고정, 이후 확장 가능하도록 설계

3. **태그 시스템 복잡도**
   - 12개 태그 조합이 많아질 수 있음
   - **대응**: 태그 우선순위 규칙 정의

---

### 7.2 테스트 시나리오

**시나리오 1: 노후 아파트 + 소형 평형**
- 입력: 25년차, 24평, 자가, 5년 이상 거주
- 예상 가설: old_risk=HIGH, storage_risk=HIGH
- 예상 질문: Q01, Q02, Q04, Q05
- 예상 태그: OLD_RISK_HIGH, STORAGE_RISK_HIGH

**시나리오 2: 단기 거주 + 예산 긴축**
- 입력: 월세, 1-3년 거주, 예산 2000만 이하
- 예상 가설: short_stay=HIGH, budget_risk=HIGH
- 예상 질문: Q06, Q07, Q09
- 예상 태그: SHORT_STAY, BUDGET_TIGHT

---

## 8. 결론 및 권장사항

### 8.1 핵심 발견

1. **명세서는 규칙 기반 시스템**을 요구하지만, 현재는 **AI 기반 시스템**
2. **기본 정보 입력이 70% 누락**되어 가설 생성 불가능
3. **태그 시스템이 완전히 없음** (점수 기반만 존재)
4. **질문 뱅크가 없음** (AI 동적 생성만 존재)

### 8.2 권장사항

**즉시 시작 가능:**
- ✅ Phase 1: 기본 정보 입력 필드 추가
- ✅ Phase 1: 가설 생성 함수 구현
- ✅ Phase 1: 질문 뱅크 구축

**신중한 검토 필요:**
- ⚠️ Phase 2: AI 질문 생성 완전 제거 여부
- ⚠️ Phase 3: 점수 시스템 완전 제거 여부

**하이브리드 접근 제안:**
- V5 규칙 기반 시스템을 기본으로 하되
- AI 질문 생성은 "추가 질문" 옵션으로 유지
- 점수 시스템은 태그와 병행하여 사용

---

## 9. 다음 단계

1. **명세서 검토 및 승인** (1일)
   - 명세서의 모든 규칙이 실제로 필요한지 확인
   - 하이브리드 접근 가능 여부 논의

2. **Phase 1 시작** (1주)
   - 기본 정보 입력 필드 추가
   - 가설 생성 함수 구현

3. **프로토타입 테스트** (3일)
   - Phase 1 완료 후 실제 데이터로 테스트
   - 명세서 규칙의 실효성 검증

---

**분석 완료!** 🎉

**작성자**: AI Assistant  
**최종 수정**: 2025년 12월 18일








