# GPT 5.2 견적 개편 시나리오 분석 보고서

## 📋 개요

**작성일**: 2024년 12월  
**분석 대상**: GPT 5.2가 제안한 인테리봇 견적 개편 시나리오  
**목적**: 시나리오의 강점/약점 분석 및 현실성 평가

---

## 🎯 시나리오 핵심 원칙

### 1. **같은 입력 → 항상 같은 견적 구조**
- ✅ **강점**: 결정론적(deterministic) 견적 생성
- ✅ **강점**: 디버깅 및 재현 가능성 향상
- ⚠️ **약점**: 동적 요소(시간, 시장 가격 변동) 반영 어려움

### 2. **DB가 있으면 반드시 DB를 쓰고**
- ✅ **강점**: Fallback 남용 방지
- ✅ **강점**: 데이터 일관성 보장
- ⚠️ **약점**: DB 장애 시 서비스 중단 가능성

### 3. **안 되면 조용히 틀리는 게 아니라 멈춘다**
- ✅ **강점**: 명확한 실패 처리
- ✅ **강점**: 사용자에게 정직한 피드백
- ⚠️ **약점**: 사용자 경험 저하 가능성 (견적을 못 받는 경우)

---

## 📊 단계별 분석

### STEP 0. 개편 전 선언

**내용**: 기존 견적 로직은 "부분 작동 상태"로 공식 선언

**평가**:
- ✅ **현실적**: 현재 상태를 정확히 반영
- ✅ **명확함**: 개편 범위를 명확히 정의
- ⚠️ **리스크**: 사용자 신뢰도 하락 가능성

**권장사항**:
- 내부 문서화로 진행
- 사용자에게는 "개선 중" 메시지로 전달

---

### STEP 1. 입력 확정 단계 분리

**내용**:
- 고객 입력 수집
- 자동추론은 1회만 허용
- processSelections로 확정
- SSOT 해시 생성

**평가**:
- ✅ **강점**: 입력 단계와 계산 단계 명확히 분리
- ✅ **강점**: SSOT(Single Source of Truth) 확립
- ✅ **강점**: 해시 생성으로 무결성 검증 가능
- ⚠️ **구현 난이도**: 중간 (기존 코드 구조 변경 필요)
- ⚠️ **호환성**: 기존 코드와 충돌 가능

**현재 코드와의 비교**:
```typescript
// ❌ 현재: 입력이 여러 단계에서 변경됨
let py = 0
let finalPyForEstimate = 0
// ... 여러 단계에서 변경

// ✅ 시나리오: 입력 확정 후 봉인
const inputHash = generateHash(processSelections)
// 이후 변경 불가
```

**권장사항**:
- ✅ **적용 가능**: 핵심 원칙은 좋음
- ⚠️ **점진적 적용**: 기존 코드를 한 번에 바꾸지 말고 단계적으로

---

### STEP 2. 모드 결정 (PARTIAL / FULL)

**내용**:
- 자동 판단 금지
- PARTIAL: processSelections가 고객 선택 기반
- FULL: 사용자가 명시적으로 "전체 공정" 선택
- ❌ 공간 개수 / 선택 개수 / fallback으로 FULL 판단 금지

**평가**:
- ✅ **강점**: 모드 결정 로직이 명확함
- ✅ **강점**: 자동 판단 제거로 예상치 못한 동작 방지
- ⚠️ **사용자 경험**: 사용자가 "전체 공정"을 명시적으로 선택해야 함
- ⚠️ **현실성**: 기존 UI에 "전체 공정" 명시적 선택 버튼 필요

**현재 코드와의 비교**:
```typescript
// ❌ 현재: 자동 판단
const isFullProcess = (!hasValidProcessSelections && v3SelectedSpaces.length >= 5) || 
                      (v3SelectedSpaces.length >= 8)

// ✅ 시나리오: 명시적 선택만
const isFullProcess = userExplicitlySelectedFullProcess
```

**권장사항**:
- ✅ **적용 가능**: UI에 "전체 공정" 명시적 선택 추가
- ⚠️ **점진적 적용**: 기존 자동 판단 로직을 유지하되, 명시적 선택 우선

---

### STEP 3. 계산기 진입 전 검증

**내용**:
- processSelections 존재 여부
- py 확정 여부
- processSelections 안에 유효 공정 1개 이상 존재
- ❌ 하나라도 실패하면 계산기 진입 금지

**평가**:
- ✅ **강점**: 조기 실패(fail-fast) 원칙
- ✅ **강점**: 계산기 로직 단순화
- ⚠️ **사용자 경험**: 검증 실패 시 명확한 에러 메시지 필요
- ✅ **현실적**: 현재 API 레벨 검증과 유사

**현재 코드와의 비교**:
```typescript
// ✅ 현재: API 레벨 검증 (이미 구현됨)
function normalizeEstimateInput(input: EstimateInputV3): {
  normalized: EstimateInputV3
  errors: string[]
}

// ✅ 시나리오: 더 엄격한 검증
if (!processSelections || !py || !hasValidProcess) {
  throw new Error('검증 실패')
}
```

**권장사항**:
- ✅ **적용 가능**: 현재 검증 로직 강화
- ✅ **즉시 적용 가능**: 기존 코드와 호환

---

### STEP 4. 공정 활성화 결정

**내용**:
- processSelections를 순회
- null / 'none' 제외
- 카테고리 → 공정 ID 매핑
- 활성 공정 리스트 생성
- 이후 tierSelections, 공간 정보, 고객 성향 전부 무시

**평가**:
- ✅ **강점**: 단일 진실 소스(processSelections) 확립
- ✅ **강점**: 복잡한 fallback 로직 제거
- ⚠️ **구현 난이도**: 중간 (기존 로직 대폭 수정 필요)
- ⚠️ **호환성**: 기존 tierSelections 의존 코드와 충돌

**현재 코드와의 비교**:
```typescript
// ❌ 현재: 여러 소스에서 공정 추출
let enabledProcessIds: string[] = []
// processSelections에서 추출 (B안)
// tierSelections에서 추출 (A안)
// 공간 기반 추론 (3차 fallback)

// ✅ 시나리오: processSelections만 사용
const enabledProcessIds = extractFromProcessSelections(processSelections)
// 이후 다른 소스 무시
```

**권장사항**:
- ✅ **적용 가능**: 핵심 원칙은 좋음
- ⚠️ **점진적 적용**: tierSelections fallback을 먼저 제거하고, processSelections만 사용

---

### STEP 5. 공정 → 자재요청서 생성

**내용**:
- DB를 부르기 전에 질문지를 만든다
- 공정 하나당: 자재 카테고리, 위치, grade, 필수 조건
- MaterialRequest 리스트로 생성

**평가**:
- ✅ **강점**: DB 조회 전 요구사항 명확화
- ✅ **강점**: 재사용 가능한 구조
- ⚠️ **구현 난이도**: 높음 (새로운 타입 및 로직 필요)
- ⚠️ **현실성**: 기존 코드와 완전히 다른 구조

**현재 코드와의 비교**:
```typescript
// ❌ 현재: DB 조회와 계산이 섞여 있음
const packageData = await getFullDemolitionPackageFromDB(pyeong, propertyType)
if (packageData) {
  return packageData.total_price
}
return calculateFromConfig(pyeong, propertyType) // fallback

// ✅ 시나리오: 요구사항 먼저 정의
const materialRequests = generateMaterialRequests(enabledProcessIds)
// 그 다음 DB 조회
```

**권장사항**:
- ⚠️ **장기 목표**: 좋은 구조이지만 구현 난이도 높음
- ✅ **점진적 적용**: 먼저 MaterialRequest 타입 정의, 점진적으로 적용

---

### STEP 6. Supabase DB 조회

**내용**:
- MaterialRequest 기준으로 DB 조회
- 조회 결과는 반드시 3가지 중 하나: SUCCESS, NOT_FOUND, ERROR
- ERROR → 즉시 실패
- NOT_FOUND → 정의된 경우만 fallback
- ❌ fallback으로 조용히 넘어가는 구조 제거

**평가**:
- ✅ **강점**: 명확한 결과 타입
- ✅ **강점**: Fallback 남용 방지
- ⚠️ **사용자 경험**: ERROR 시 견적을 못 받는 경우
- ⚠️ **현실성**: DB 장애 시 서비스 중단 가능성

**현재 코드와의 비교**:
```typescript
// ❌ 현재: 에러를 무시하고 fallback 사용
if (error) {
  console.error('❌ 조회 에러:', error)
  return null  // fallback으로 넘어감
}

// ✅ 시나리오: 명확한 결과 타입
type DBResult<T> = 
  | { type: 'SUCCESS', data: T }
  | { type: 'NOT_FOUND', reason: string }
  | { type: 'ERROR', error: Error }

const result = await queryDB(materialRequest)
if (result.type === 'ERROR') {
  throw result.error  // 즉시 실패
}
```

**권장사항**:
- ✅ **적용 가능**: 결과 타입 명확화는 좋음
- ⚠️ **점진적 적용**: ERROR 시 즉시 실패는 사용자 경험 고려 필요
- ✅ **권장**: ERROR 시 사용자에게 명확한 메시지 표시

---

### STEP 7. 공정 블록 구성

**내용**:
- 금액 말고 구조를 만든다
- 공정별로: 포함 자재 카테고리, 포함 노무 카테고리, 제외 항목, 가정 사항, 옵션, DB 근거

**평가**:
- ✅ **강점**: 견적의 투명성 향상
- ✅ **강점**: 디버깅 용이
- ⚠️ **구현 난이도**: 높음 (기존 구조 대폭 변경)
- ⚠️ **현실성**: 기존 UI와 호환성 문제

**현재 코드와의 비교**:
```typescript
// ❌ 현재: 금액 중심
interface ProcessItem {
  name: string
  materialCost: number
  laborCost: number
  totalCost: number
}

// ✅ 시나리오: 구조 중심
interface ProcessBlock {
  processId: string
  materials: MaterialCategory[]
  labor: LaborCategory[]
  exclusions: string[]
  assumptions: string[]
  options: string[]
  dbSource: { table: string, conditions: Record<string, any> }
}
```

**권장사항**:
- ⚠️ **장기 목표**: 좋은 구조이지만 구현 난이도 높음
- ✅ **점진적 적용**: 기존 구조 유지하되, 메타 정보 추가

---

### STEP 8. 최종 견적서 출력

**내용**:
- 숫자 없는 구조 견적서
- 메타 정보, 공정 요약, 공정 상세 블록, 리스크 및 현장 확인 항목, 변경 로그

**평가**:
- ✅ **강점**: 견적의 투명성 및 추적 가능성
- ⚠️ **사용자 경험**: 숫자 없는 견적서는 사용자가 원하는 형태가 아닐 수 있음
- ⚠️ **현실성**: 기존 UI와 완전히 다른 형태

**권장사항**:
- ⚠️ **수정 필요**: 숫자도 포함하되, 구조 정보 추가
- ✅ **점진적 적용**: 기존 견적서 유지하되, 메타 정보 추가

---

### STEP 9. 실패 시나리오

**내용**:
- 실패는 숨기지 않는다
- DB ERROR, 필수 데이터 NOT_FOUND, 공정 활성화는 됐는데 자재요청서 없음
- → 견적 실패, "추가 확인 필요" 메시지, 결과 출력 금지

**평가**:
- ✅ **강점**: 명확한 실패 처리
- ✅ **강점**: 사용자에게 정직한 피드백
- ⚠️ **사용자 경험**: 견적을 못 받는 경우가 많아질 수 있음
- ⚠️ **현실성**: DB 장애 시 서비스 중단 가능성

**권장사항**:
- ✅ **적용 가능**: 실패 시나리오 명확화는 좋음
- ⚠️ **수정 필요**: 사용자에게 명확한 해결 방법 제시
- ✅ **권장**: "잠시 후 다시 시도" 또는 "고객센터 문의" 안내

---

## 🎯 종합 평가

### 강점

1. **구조적 명확성**: 각 단계의 책임이 명확함
2. **결정론적 견적**: 같은 입력 → 같은 결과 보장
3. **Fallback 남용 방지**: DB 우선, 명확한 실패 처리
4. **투명성**: 견적 생성 과정이 추적 가능

### 약점

1. **구현 난이도**: 기존 코드 대폭 수정 필요
2. **사용자 경험**: 실패 시 견적을 못 받는 경우 증가
3. **현실성**: DB 장애 시 서비스 중단 가능성
4. **호환성**: 기존 UI와 충돌 가능

---

## 📊 현재 코드와의 호환성

### 즉시 적용 가능 (Low Risk)

1. ✅ **STEP 3: 계산기 진입 전 검증** - 기존 검증 로직 강화
2. ✅ **STEP 9: 실패 시나리오** - 에러 처리 개선

### 점진적 적용 가능 (Medium Risk)

1. ⚠️ **STEP 1: 입력 확정 단계 분리** - 기존 코드 구조 변경 필요
2. ⚠️ **STEP 2: 모드 결정** - UI 수정 필요
3. ⚠️ **STEP 4: 공정 활성화 결정** - 기존 로직 대폭 수정 필요
4. ⚠️ **STEP 6: Supabase DB 조회** - 결과 타입 명확화 필요

### 장기 목표 (High Risk)

1. ⚠️ **STEP 5: 공정 → 자재요청서 생성** - 완전히 새로운 구조
2. ⚠️ **STEP 7: 공정 블록 구성** - 기존 구조 대폭 변경
3. ⚠️ **STEP 8: 최종 견적서 출력** - UI 완전 재설계 필요

---

## 🛠️ 권장 적용 전략

### Phase 1: 즉시 적용 (1-2주)

1. **STEP 3 강화**: 계산기 진입 전 검증 로직 강화
2. **STEP 9 적용**: 실패 시나리오 명확화
3. **STEP 6 개선**: DB 조회 결과 타입 명확화 (ERROR 시 명확한 메시지)

### Phase 2: 단기 적용 (1-2개월)

1. **STEP 1 적용**: 입력 확정 단계 분리 (점진적)
2. **STEP 2 적용**: 모드 결정 로직 개선 (UI 수정 포함)
3. **STEP 4 적용**: 공정 활성화 결정 단순화 (tierSelections fallback 제거)

### Phase 3: 장기 목표 (3-6개월)

1. **STEP 5 구현**: 공정 → 자재요청서 생성
2. **STEP 7 구현**: 공정 블록 구성
3. **STEP 8 구현**: 최종 견적서 출력 개선

---

## 🎯 결론

### 시나리오 평가: ⭐⭐⭐⭐ (4/5)

**강점**:
- 구조적 명확성 및 결정론적 견적 생성
- Fallback 남용 방지 및 명확한 실패 처리
- 견적 생성 과정의 투명성

**약점**:
- 구현 난이도 높음 (기존 코드 대폭 수정 필요)
- 사용자 경험 저하 가능성 (실패 시 견적을 못 받는 경우)
- DB 장애 시 서비스 중단 가능성

**권장사항**:
1. ✅ **핵심 원칙 적용**: "같은 입력 → 같은 결과", "DB 우선", "명확한 실패 처리"
2. ⚠️ **점진적 적용**: 한 번에 모든 것을 바꾸지 말고 단계적으로
3. ✅ **사용자 경험 고려**: 실패 시 명확한 해결 방법 제시
4. ⚠️ **Fallback 전략 재검토**: 완전히 제거하기보다는 명확한 조건 하에서만 사용

---

## 📅 작성일
2024년 12월

## 📌 버전
V1.0 (초안)









