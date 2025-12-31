# 집중 기준 기반 UI 구조 구현 완료 보고서

**작성일**: 2024-12-XX  
**작업 범위**: 집중 기준 선언 → 공정 설명 → 옵션 설명 매핑 구조 완전 구현  
**대상 파일**: `app/onboarding/ai-recommendation/page.tsx`  
**상태**: ✅ **완료**

---

## 📋 작업 개요

인테리봇 V5의 AI 분석 결과 화면을 "추천 중심"에서 "결정 정리 중심"으로 전환하는 작업을 완료했습니다. 집중 기준(FocusedCriteria)을 최상위 개념으로 설정하고, 모든 설명 문장이 이 기준에 종속되도록 구조를 재설계했습니다.

---

## 🎯 핵심 목표 달성 현황

| 목표 | 상태 | 비고 |
|------|------|------|
| 집중 기준 단일 선언 구조 | ✅ 완료 | ENUM 기반 직접 반환 |
| 공정 설명 기준 종속 | ✅ 완료 | 3그룹 분류 포함 |
| 옵션 설명 기준 종속 | ✅ 완료 | 3그룹 분류 포함 |
| 하드코딩 문장 제거 | ✅ 완료 | 모든 설명 문장 함수화 |
| 타입 안정성 확보 | ✅ 완료 | TypeScript 엄격 모드 준수 |

---

## 📝 Phase 1: 집중 기준 선언 구조 구현

### 1.1 작업 목적

AI 분석 결과 화면의 역할을 "설명"에서 "결정 선언"으로 전환하고, 집중 기준을 단일 ENUM 값으로 고정하여 모든 하위 문구가 이 기준에 종속되도록 구조화했습니다.

### 1.2 구현 내용

#### 타입 정의
```typescript
type FocusedCriteria =
  | '아이 안전'
  | '정리 스트레스 최소화'
  | '유지관리 부담 최소화'
  | '공간 활용 효율'
  | '공사 범위 최소화'
  | '예산 통제 우선'
  | '동선 단순화'
```

#### 핵심 함수 구현

**1. `decideFocusedCriteria()` - 기준 결정 함수**
- 입력: `V31AnalysisResult`
- 출력: `FocusedCriteria` (ENUM 직접 반환)
- 로직: high level needs 기반 우선순위 결정
- 금지: NEEDS_TO_CRITERIA_MAP, 문자열 매핑, 정상 루트 sanitize

**2. `getFocusedDeclaration()` - 선언 문장 생성**
- 입력: `FocusedCriteria`
- 출력: `"이 집은 {기준}을 최우선으로 결정했습니다."`
- 규칙: 완성형 문장, JSX 조립 금지

**3. `getSecondaryNotice()` - 보조 기준 문장**
- 입력: `FocusedCriteria`
- 출력: 기준별 제한 문장
- 규칙: criteria 기반 switch, needs 기반 금지

**4. `sanitizeCriteriaAsFallback()` - Fallback 처리**
- 역할: 비정상 데이터 방어 전용
- 규칙: 정상 루트 호출 금지

### 1.3 제거된 항목

- ❌ `NEEDS_TO_CRITERIA_MAP` (76-103줄)
- ❌ `getFocusedCriteria()` (문자열 반환)
- ❌ `getSecondaryCriteria()` (needs 기반)
- ❌ `getLimitedReflection()` (needs 기반)

### 1.4 JSX 변경 사항

**변경 전:**
```tsx
<h1>🎉 AI 분석 완료!</h1>
<p>{getFocusedCategory(analysisResult)} 외 공정은 검토하지 않도록 정리했습니다.</p>
```

**변경 후:**
```tsx
<h1>{getFocusedDeclaration(decideFocusedCriteria(analysisResult))}</h1>
<p>{getSecondaryNotice(focusedCriteria)}</p>
```

### 1.5 생성된 문서

- `docs/FOCUSED_CRITERIA_DECLARATION_ANALYSIS.md`
- `docs/FOCUSED_CRITERIA_3SPEC_COMPARISON.md`
- `docs/FOCUSED_CRITERIA_SPEC_COMPLIANCE_REPORT.md`

---

## 📝 Phase 2: 공정 설명 문장 매핑 구현

### 2.1 작업 목적

공정 설명을 하드코딩에서 제거하고, 집중 기준과 공정 특성(그룹)을 모두 반영하여 "욕실"과 "도배" 같은 서로 다른 공정이 각각 맞는 설명을 받도록 구현했습니다.

### 2.2 구현 내용

#### 공정 그룹 분류 (3그룹)

```typescript
type ProcessGroup = 'WET' | 'STORAGE_FLOW' | 'FINISH'

function getProcessGroup(name: string): ProcessGroup {
  // WET: 욕실, 주방, 타일, 방수, 설비, 수전 등
  // STORAGE_FLOW: 수납, 가구, 붙박이, 팬트리, 중문, 가벽 등
  // FINISH: 도배, 도장, 바닥, 조명, 실리콘, 필름 등
}
```

#### 공정 설명 생성 함수

```typescript
function getProcessDescription(
  process: { name: string },
  criteria: FocusedCriteria
): string {
  const group = getProcessGroup(process.name)
  
  // 기준별 switch + 그룹별 분기
  // 예: "아이 안전" + "WET" → "미끄럼·턱·누수 같은 위험 요소를 먼저 줄이기 위해..."
  // 예: "아이 안전" + "FINISH" → "손이 자주 닿는 구역의 위험 요소를 줄이기 위해..."
}
```

### 2.3 제거된 하드코딩

**변경 전 (2곳):**
```tsx
<p>{process.name}은 이번 조건에서 가장 효과가 확실한 선택입니다.</p>
```

**변경 후:**
```tsx
<p>{getProcessDescription(process, focusedCriteria)}</p>
```

### 2.4 문장 다양성 확보

- **기준 수**: 7개
- **그룹 수**: 3개
- **최대 조합**: 21개 (기준 × 그룹)
- **실제 구현**: 기준별로 그룹별 분기 적용

**예시:**
- "욕실" (WET) + "아이 안전" → "미끄럼·턱·누수 같은 위험 요소를 먼저 줄이기 위해..."
- "도배" (FINISH) + "아이 안전" → "손이 자주 닿는 구역의 위험 요소를 줄이기 위해..."
- "붙박이장" (STORAGE_FLOW) + "정리 스트레스 최소화" → "물건이 쌓이는 지점을 줄이고 정리 동작을 단순하게 만들기 위해..."

### 2.5 생성된 문서

- `docs/FOCUSED_CRITERIA_PROCESS_DESCRIPTION_3SPEC_COMPARISON.md` - 3개 명세서 비교 분석
- `docs/FOCUSED_CRITERIA_PROCESS_DESCRIPTION_HYBRID_SPEC.md` - 하이브리드 명세서
- `docs/FOCUSED_CRITERIA_PROCESS_COPY_SPEC.md` - 최종 강제본 (Phase1+)

---

## 📝 Phase 3: 옵션 설명 문장 매핑 구현

### 3.1 작업 목적

옵션 설명도 공정 설명과 동일한 원칙을 적용하여, 집중 기준과 옵션 특성을 반영한 설명 문장을 생성하도록 구현했습니다. (현재 UI에서는 옵션이 직접 표시되지 않으나, 향후 확장을 위해 준비 완료)

### 3.2 구현 내용

#### 옵션 그룹 분류 (3그룹)

```typescript
type OptionGroup = 'SAFETY_FUNCTIONAL' | 'STORAGE_SPACE' | 'FINISH_AESTHETIC'

function getOptionGroup(name: string): OptionGroup {
  // SAFETY_FUNCTIONAL: 비데, 샤워, 안전 손잡이, 방수, 환풍기, LED 등
  // STORAGE_SPACE: 팬트리, 냉장고장, 키큰장, 아일랜드장, 욕실장 등
  // FINISH_AESTHETIC: 벽지, 타일 패턴, 조명 타입, 몰딩 등
}
```

#### 옵션 설명 생성 함수

```typescript
function getOptionDescription(
  option: { name: string },
  criteria: FocusedCriteria
): string {
  const group = getOptionGroup(option.name)
  
  // 기준별 switch + 그룹별 분기
  // 예: "아이 안전" + "SAFETY_FUNCTIONAL" → "아이 동선에서 발생할 수 있는 위험을 직접 줄이기 위해..."
}
```

### 3.3 생성된 문서

- `docs/FOCUSED_CRITERIA_OPTION_DESCRIPTION_SPEC.md` - 옵션 설명 명세서

---

## 🔧 기술적 구현 상세

### 함수 위치 규칙

모든 설명 생성 함수는 `page.tsx` 내부의 **컴포넌트 밖 최상단 유틸 구역**에 단 1회 정의:

```typescript
// 컴포넌트 밖 최상단
type FocusedCriteria = ...
function decideFocusedCriteria(...) { ... }
function getFocusedDeclaration(...) { ... }
function getSecondaryNotice(...) { ... }
function getProcessGroup(...) { ... }
function getProcessDescription(...) { ... }
function getOptionGroup(...) { ... }
function getOptionDescription(...) { ... }

// 컴포넌트 내부
export default function AIRecoPage() { ... }
```

### 타입 안정성

- 모든 함수는 TypeScript 엄격 모드 준수
- ENUM 타입으로 런타임 오류 방지
- 객체 파라미터로 향후 확장 가능

### 확장성

- Phase 1: 기본 구조 (기준별 + 그룹별)
- Phase 2: 키워드 분류 확장 가능 (명세서 1 방식)
- 향후: `lib/copy/` 디렉토리로 분리 가능

---

## 📊 구현 통계

### 코드 변경

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| **하드코딩 문장** | 2곳 | 0곳 |
| **설명 생성 함수** | 0개 | 7개 |
| **타입 정의** | 0개 | 3개 |
| **그룹 분류 함수** | 0개 | 2개 |

### 함수 목록

1. `decideFocusedCriteria()` - 기준 결정
2. `getFocusedDeclaration()` - 선언 문장
3. `getSecondaryNotice()` - 보조 기준 문장
4. `sanitizeCriteriaAsFallback()` - Fallback
5. `getProcessGroup()` - 공정 그룹 분류
6. `getProcessDescription()` - 공정 설명
7. `getOptionGroup()` - 옵션 그룹 분류
8. `getOptionDescription()` - 옵션 설명

### 문장 다양성

- **집중 기준**: 7개
- **공정 그룹**: 3개
- **옵션 그룹**: 3개
- **최대 조합**: 7 × 3 × 3 = 63개 (이론적)

---

## ✅ 완료 기준 달성 현황

### Phase 1: 집중 기준 선언

- [x] 기준 결정 함수는 `decideFocusedCriteria()` 하나
- [x] `FocusedCriteria` 타입 고정
- [x] 선언 문장 1회 노출
- [x] JSX 문자열 조립 없음
- [x] 보조 문장은 criteria switch
- [x] sanitize는 fallback 전용
- [x] 빌드 성공

### Phase 2: 공정 설명 매핑

- [x] 하드코딩 공정 설명 0건
- [x] criteria별 문장 변화 확인
- [x] WET/STORAGE_FLOW/FINISH 3그룹에서 문장 차이 발생
- [x] 빌드 성공, 타입 에러 없음

### Phase 3: 옵션 설명 매핑

- [x] 옵션 설명 함수 구현 완료
- [x] criteria별 문장 변화 확인
- [x] SAFETY_FUNCTIONAL/STORAGE_SPACE/FINISH_AESTHETIC 3그룹 분류
- [x] 빌드 성공, 타입 에러 없음

---

## 📚 생성된 문서 목록

### 명세서 문서

1. `docs/FOCUSED_CRITERIA_PROCESS_COPY_SPEC.md` - 공정 설명 최종 명세서 (강제본)
2. `docs/FOCUSED_CRITERIA_OPTION_DESCRIPTION_SPEC.md` - 옵션 설명 명세서

### 분석 문서

3. `docs/FOCUSED_CRITERIA_DECLARATION_ANALYSIS.md` - 선언 구조 분석
4. `docs/FOCUSED_CRITERIA_3SPEC_COMPARISON.md` - 3개 명세서 비교
5. `docs/FOCUSED_CRITERIA_SPEC_COMPLIANCE_REPORT.md` - 준수 여부 보고서
6. `docs/FOCUSED_CRITERIA_PROCESS_DESCRIPTION_3SPEC_COMPARISON.md` - 공정 설명 3개 명세서 비교
7. `docs/FOCUSED_CRITERIA_PROCESS_DESCRIPTION_HYBRID_SPEC.md` - 공정 설명 하이브리드 명세서

---

## 🎯 핵심 성과

### 1. 구조적 완성도

- 집중 기준이 최상위 개념으로 고정
- 모든 설명 문장이 기준에 종속
- 하드코딩 완전 제거

### 2. 고객 체감 품질 향상

- 공정별 맞춤 설명으로 AI 신뢰도 향상
- "욕실"과 "도배"가 다른 설명을 받아 자연스러움
- 기준 변경 시 모든 설명이 일관되게 변경

### 3. 유지보수성

- 단일 함수로 설명 생성
- 그룹 분류로 확장 용이
- 타입 안정성으로 런타임 오류 방지

### 4. 확장성

- Phase 2에서 키워드 분류 확장 가능
- 새로운 기준 추가 시 switch 문만 확장
- 새로운 그룹 추가 시 분류 함수만 수정

---

## 🔄 변경된 파일

### 수정된 파일

1. `app/onboarding/ai-recommendation/page.tsx`
   - 집중 기준 선언 구조 추가
   - 공정 설명 함수 추가
   - 옵션 설명 함수 추가
   - 하드코딩 문장 제거

### 생성된 문서 파일

1. `docs/FOCUSED_CRITERIA_PROCESS_COPY_SPEC.md`
2. `docs/FOCUSED_CRITERIA_OPTION_DESCRIPTION_SPEC.md`
3. `docs/FOCUSED_CRITERIA_PROCESS_DESCRIPTION_3SPEC_COMPARISON.md`
4. `docs/FOCUSED_CRITERIA_PROCESS_DESCRIPTION_HYBRID_SPEC.md`
5. `docs/FOCUSED_CRITERIA_DECLARATION_ANALYSIS.md`
6. `docs/FOCUSED_CRITERIA_3SPEC_COMPARISON.md`
7. `docs/FOCUSED_CRITERIA_SPEC_COMPLIANCE_REPORT.md`

---

## 🚀 다음 단계 (선택 사항)

### 즉시 적용 가능

현재 구현된 함수들은 모두 준비 완료 상태입니다. UI에서 옵션이 표시될 때 `getOptionDescription()` 함수를 호출하면 됩니다.

### 향후 확장 가능

1. **키워드 분류 확장** (Phase 2)
   - 공정/옵션 그룹 분류 정확도 향상
   - 더 세밀한 문장 다양성 확보

2. **함수 분리** (Phase 3)
   - `lib/copy/processDescription.ts`
   - `lib/copy/optionDescription.ts`
   - 재사용성 향상

3. **테스트 케이스 추가**
   - 기준별 문장 출력 검증
   - 그룹별 문장 차이 검증

---

## 📝 결론

집중 기준 기반 UI 구조 구현이 완료되었습니다. 

**핵심 성과:**
- ✅ 집중 기준 단일 선언 구조 완성
- ✅ 공정 설명 기준 종속 + 그룹 반영
- ✅ 옵션 설명 기준 종속 + 그룹 반영
- ✅ 하드코딩 완전 제거
- ✅ 타입 안정성 확보
- ✅ 확장성 확보

**고객 체감:**
- AI가 "생각했다"는 느낌 강화
- 공정별 맞춤 설명으로 신뢰도 향상
- 기준 변경 시 일관된 설명

**개발자 체감:**
- 단일 함수로 설명 생성
- 명확한 구조로 유지보수 용이
- 타입 안정성으로 런타임 오류 방지

---

**작업 완료일**: 2024-12-XX  
**작업자**: AI Assistant  
**검증 상태**: ✅ 빌드 성공, 타입 에러 없음




















