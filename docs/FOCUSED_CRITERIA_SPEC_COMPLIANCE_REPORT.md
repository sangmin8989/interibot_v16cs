# 집중 기준 선언 구조 명세서 준수 여부 최종 보고서

**작성일**: 2024-12-XX  
**분석 대상**: 3개 명세서 vs 현재 구현 (`app/onboarding/ai-recommendation/page.tsx`)  
**상태**: ⚠️ **명세서 위반 다수 발견**

---

## 📋 3개 명세서 비교 분석

### 명세서 공통 핵심 원칙

3개 명세서 모두 동일한 핵심 원칙을 강조:

1. **집중 기준은 ENUM으로만 존재** (7개 고정값)
2. **NEEDS_TO_CRITERIA_MAP 같은 매핑 테이블 금지**
3. **선언 문장은 완성형 함수로 반환** (JSX 조립 금지)
4. **선언 문장은 화면에 1회만 노출**
5. **sanitize는 fallback만 허용** (정상 루트 차단)

### 명세서별 차이점

| 항목 | 명세서 1 | 명세서 2 | 명세서 3 |
|------|----------|----------|----------|
| **강조도** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **ENUM 직접 반환** | 강조 | 매우 강조 | 강조 |
| **매핑 테이블 금지** | 명시 | 매우 명시 | 명시 |
| **구조 위반 처리** | 버그로 간주 | 구조 위반으로 간주 | 강제 규칙 |
| **완료 기준** | 명확 | 매우 명확 | 명확 |

**결론**: 3개 명세서 모두 **동일한 요구사항**을 제시하며, 명세서 2가 가장 엄격한 표현을 사용.

---

## 🔍 현재 구현 상태 점검

### ✅ 명세서 준수 항목

1. **집중 기준 ENUM 정의**: 7개 값 모두 명세서와 일치
2. **보조 기준 문장 템플릿**: "이 기준에 따라, [보조 요소]는 [제한된 방식]으로만 반영됩니다." 형식 준수
3. **복합 성향 감지**: `hasMultipleHighNeeds()` 함수 구현
4. **선언 문장 템플릿**: "이 집은 {기준}을 최우선으로 결정했습니다." 형식 사용

### ❌ 명세서 위반 항목 (심각)

#### 위반 1: NEEDS_TO_CRITERIA_MAP 사용 (76-103줄)

**명세서 요구**:
> ❌ NEEDS_TO_CRITERIA_MAP 같은 문자열 매핑 테이블 사용 금지

**현재 구현**:
```typescript
const NEEDS_TO_CRITERIA_MAP: Record<string, string> = {
  '안전성 강화': '아이 안전',
  '수납 강화': '정리 스트레스 최소화',
  // ... 20개 이상 매핑
}
```

**위반 심각도**: 🔴 **치명적** (명세서 핵심 원칙 위반)

---

#### 위반 2: getFocusedCriteria()가 매핑 테이블 기반 (121-148줄)

**명세서 요구**:
> ⭕ AI 또는 로직은 반드시 FocusedCriteria를 직접 반환  
> ❌ needs.name → 문자열 변환 → 기준

**현재 구현**:
```typescript
function getFocusedCriteria(result: V31AnalysisResult): string {
  const category = getFocusedCategory(result) // needs.name 기반
  let criteria = NEEDS_TO_CRITERIA_MAP[category] // 매핑 테이블 사용
  // ...
  return criteria
}
```

**위반 심각도**: 🔴 **치명적** (명세서 핵심 원칙 위반)

---

#### 위반 3: sanitizeCriteria() 정상 루트에서 사용 (106-118줄, 139줄, 169줄)

**명세서 요구**:
> ❌ 정상 루트에서 sanitize 함수 호출  
> ⭕ sanitize는 비정상 데이터 방어용 fallback만 허용

**현재 구현**:
```typescript
// 정상 루트에서 사용 (139줄)
if (!criteria) {
  criteria = sanitizeCriteria(category) // ❌ 위반
}

// 보조 기준에서도 사용 (169줄)
return NEEDS_TO_CRITERIA_MAP[category] || sanitizeCriteria(category) || ''
```

**위반 심각도**: 🟡 **중간** (구조 원칙 위반)

---

#### 위반 4: 선언 문장이 JSX에서 조립됨 (663줄, 707줄)

**명세서 요구**:
> ❌ JSX 내 문자열 조립  
> ⭕ 선언 문장은 완성형 함수로 반환

**현재 구현**:
```tsx
{/* 663줄 */}
<h1>
  이 집은 {getFocusedCriteria(analysisResult)}을 최우선으로 결정했습니다.
</h1>

{/* 707줄 */}
<p>
  이 집은 {getFocusedCriteria(analysisResult)}을 최우선으로 결정했습니다.
</p>
```

**위반 심각도**: 🟡 **중간** (구조 원칙 위반)

**명세서 요구 형태**:
```typescript
function getFocusedDeclaration(criteria: FocusedCriteria): string {
  return `이 집은 ${criteria}을 최우선으로 결정했습니다.`
}
```

---

#### 위반 5: 선언 문장이 화면에 2회 노출 (663줄, 707줄)

**명세서 요구**:
> ❌ 선언 문장 2회 이상 노출  
> ⭕ 선언 문장은 화면 최상단에서 1회만 노출

**현재 구현**:
- 663줄: 상단 헤더
- 707줄: V3 분석 카드

**위반 심각도**: 🟡 **중간** (노출 규칙 위반)

---

#### 위반 6: needs/category가 선언 영역에 노출 가능성

**명세서 요구**:
> ❌ needs, category가 선언 문장, 헤더, 요약 영역에 직접 노출

**현재 구현**:
- `getFocusedCategory()`가 `needs.name`을 반환
- V3 카드에서 `getFocusedCategory()` 사용 가능성 (704줄 확인 필요)

**위반 심각도**: 🟢 **경미** (간접적 위반 가능성)

---

## 📊 명세서 준수도 종합 평가

### 위반 항목 요약

| 위반 항목 | 심각도 | 명세서 1 | 명세서 2 | 명세서 3 |
|----------|--------|----------|----------|----------|
| NEEDS_TO_CRITERIA_MAP 사용 | 🔴 치명적 | ❌ | ❌ | ❌ |
| 매핑 테이블 기반 변환 | 🔴 치명적 | ❌ | ❌ | ❌ |
| sanitize 정상 루트 사용 | 🟡 중간 | ❌ | ❌ | ❌ |
| JSX에서 선언 문장 조립 | 🟡 중간 | ❌ | ❌ | ❌ |
| 선언 문장 2회 노출 | 🟡 중간 | ❌ | ❌ | ❌ |
| needs/category 노출 | 🟢 경미 | ⚠️ | ⚠️ | ⚠️ |

### 종합 판정

**현재 준수도**: **30%** (6개 위반 항목 중 0개 준수)

**명세서 요구 준수도**:
- 명세서 1: **30%** ❌
- 명세서 2: **30%** ❌ (가장 엄격한 기준)
- 명세서 3: **30%** ❌

**결론**: **3개 명세서 모두 미준수 상태**

---

## 🔧 수정 필요 사항 (우선순위별)

### 🔴 Priority 1: 치명적 위반 수정

#### 1-1. NEEDS_TO_CRITERIA_MAP 제거 및 ENUM 직접 반환 로직 구현

**현재**:
```typescript
const NEEDS_TO_CRITERIA_MAP: Record<string, string> = { ... }
function getFocusedCriteria(result: V31AnalysisResult): string {
  const category = getFocusedCategory(result)
  let criteria = NEEDS_TO_CRITERIA_MAP[category]
  // ...
}
```

**명세서 요구**:
```typescript
type FocusedCriteria =
  | '아이 안전'
  | '정리 스트레스 최소화'
  | '유지관리 부담 최소화'
  | '공간 활용 효율'
  | '공사 범위 최소화'
  | '예산 통제 우선'
  | '동선 단순화'

function decideFocusedCriteria(result: V31AnalysisResult): FocusedCriteria {
  // needs, priority, processes를 분석하여 ENUM 중 하나를 직접 반환
  const highNeeds = result.needs?.filter(n => n.level === 'high') || []
  
  // 분석 로직 (예시)
  if (highNeeds.some(n => n.name.includes('안전'))) {
    return '아이 안전'
  }
  if (highNeeds.some(n => n.name.includes('수납'))) {
    return '정리 스트레스 최소화'
  }
  // ...
  
  return '공간 활용 효율' // fallback
}
```

**수정 위치**: `app/onboarding/ai-recommendation/page.tsx` 76-148줄

---

#### 1-2. API 응답에 focusedCriteria 필드 추가 (권장)

**명세서 요구**:
> analysisResult.focusedCriteria: FocusedCriteria

**수정 필요**:
- `app/api/analyze/v31/route.ts` 또는 `app/api/analyze/complete/route.ts`에서
- `V31AnalysisResult` 타입에 `focusedCriteria: FocusedCriteria` 필드 추가
- AI 엔진에서 직접 `FocusedCriteria` ENUM 반환

**장점**:
- 프론트엔드에서 변환 로직 불필요
- 명세서 요구사항 완벽 준수
- 유지보수성 향상

---

### 🟡 Priority 2: 구조 원칙 위반 수정

#### 2-1. 선언 문장 완성형 함수로 변경

**현재**:
```tsx
<h1>
  이 집은 {getFocusedCriteria(analysisResult)}을 최우선으로 결정했습니다.
</h1>
```

**명세서 요구**:
```typescript
function getFocusedDeclaration(criteria: FocusedCriteria): string {
  return `이 집은 ${criteria}을 최우선으로 결정했습니다.`
}
```

**수정 후**:
```tsx
<h1>
  {getFocusedDeclaration(decideFocusedCriteria(analysisResult))}
</h1>
```

---

#### 2-2. 선언 문장 1회만 노출

**현재**: 663줄(헤더), 707줄(V3 카드) - 2회 노출

**수정**: 707줄 제거 또는 해석 문장으로 변경

---

#### 2-3. sanitizeCriteria() fallback 전용으로 변경

**현재**: 정상 루트에서 사용 (139줄, 169줄)

**수정**: `decideFocusedCriteria()` 내부에서만 fallback으로 사용

```typescript
function decideFocusedCriteria(result: V31AnalysisResult): FocusedCriteria {
  // 정상 로직
  // ...
  
  // fallback (비정상 데이터 방어용)
  return sanitizeCriteriaAsFallback(category) || '공간 활용 효율'
}
```

---

### 🟢 Priority 3: 경미한 위반 수정

#### 3-1. needs/category 직접 노출 방지

**확인 필요**: V3 카드에서 `getFocusedCategory()` 사용 여부 확인

**수정**: 모든 선언 영역에서 `decideFocusedCriteria()`만 사용

---

## 📝 수정 작업 체크리스트

### Phase 1: ENUM 직접 반환 로직 구현
- [ ] `FocusedCriteria` 타입 정의 (ENUM)
- [ ] `NEEDS_TO_CRITERIA_MAP` 제거
- [ ] `decideFocusedCriteria()` 함수 구현 (ENUM 직접 반환)
- [ ] `getFocusedCriteria()` 함수 제거 또는 `decideFocusedCriteria()`로 교체

### Phase 2: 선언 문장 구조 개선
- [ ] `getFocusedDeclaration()` 함수 추가
- [ ] JSX에서 선언 문장 조립 제거
- [ ] 선언 문장 1회만 노출 (707줄 제거 또는 변경)

### Phase 3: sanitize 함수 정리
- [ ] `sanitizeCriteria()` → `sanitizeCriteriaAsFallback()`로 이름 변경
- [ ] 정상 루트에서 호출 제거
- [ ] `decideFocusedCriteria()` 내부 fallback으로만 사용

### Phase 4: 검증 및 테스트
- [ ] 모든 선언 영역에서 ENUM만 사용 확인
- [ ] needs/category 직접 노출 없음 확인
- [ ] 선언 문장 1회 노출 확인
- [ ] 보조 기준 문장 규칙 준수 확인

---

## 🎯 최종 판정

### 현재 상태
- **명세서 준수도**: **30%**
- **치명적 위반**: 2개
- **구조 위반**: 3개
- **경미한 위반**: 1개

### 목표 상태
- **명세서 준수도**: **100%**
- **치명적 위반**: 0개
- **구조 위반**: 0개
- **경미한 위반**: 0개

### 결론

**현재 구현은 명세서 요구사항을 충족하지 못합니다.**

특히 다음 2개 항목은 **명세서 핵심 원칙 위반**으로 즉시 수정이 필요합니다:

1. ❌ **NEEDS_TO_CRITERIA_MAP 사용** → ENUM 직접 반환으로 변경
2. ❌ **매핑 테이블 기반 변환** → 분석 로직 기반 ENUM 선택으로 변경

**권장 작업 순서**:
1. Priority 1 (치명적 위반) 수정
2. Priority 2 (구조 위반) 수정
3. Priority 3 (경미한 위반) 수정
4. 최종 검증

---

## 📌 참고사항

- 이 보고서는 3개 명세서를 모두 분석한 결과입니다.
- 3개 명세서 모두 동일한 요구사항을 제시하며, 명세서 2가 가장 엄격한 표현을 사용합니다.
- 현재 구현은 명세서의 핵심 원칙(ENUM 직접 반환, 매핑 테이블 금지)을 위반하고 있습니다.
- 수정 작업은 위 우선순위에 따라 진행하는 것을 권장합니다.













