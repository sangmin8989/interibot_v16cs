# 견적 계산 폴백(전체 시공) 오동작 근절 보고서

## 📋 작업 개요

**작업 일시**: 2025-01-XX  
**목표**: 폴백(전체 시공) 오동작 근절  
**수정 파일**:
- `app/api/estimate/v3/route.ts`
- `lib/estimate/calculator-v3.ts`

---

## ✅ 완료된 수정 사항

### 1. API 레벨 입력 정규화 및 검증 ✅

#### `normalizeEstimateInput()` 함수 생성
- **위치**: `app/api/estimate/v3/route.ts`
- **기능**:
  1. 평수(py) 검증: 0 이하 시 에러 (기본값 대체 금지)
  2. 등급(grade) 검증: 유효한 값만 허용
  3. **processSelections 검증**: 없으면 에러 (전체 시공 폴백 금지)
  4. **mode="FULL" 명시적 선택만 전체 시공 허용**

#### 검증 규칙
```typescript
// 1. 평수 검증 (기본값 대체 금지)
if (!input.py || input.py <= 0) {
  errors.push('평수(py)는 필수이며 0보다 커야 합니다. 기본값으로 대체하지 않습니다.')
}

// 2. processSelections 검증 (폴백 금지)
const hasProcessSelections = input.processSelections && Object.keys(input.processSelections).length > 0
const isFullMode = (input as any).mode === 'FULL'

if (!hasProcessSelections && !isFullMode) {
  errors.push('공정 선택(processSelections)이 없습니다. 공정을 선택하거나 mode="FULL"을 명시적으로 지정해주세요.')
}
```

---

### 2. calculator-v3.ts 폴백 로직 제거 ✅

#### 주요 변경사항

1. **processSelections가 단일 진실 소스**
   - `selectedSpaces`는 UI 표시용으로만 사용
   - 계산 로직에서는 `extractedData.spaceIds`만 사용

2. **hasAllProcesses 로직 제거**
   - 기존: `hasAllProcesses = finalEnabledProcessIds.length === 0 && (!selectedSpaces || selectedSpaces.length === 0)`
   - 변경: `hasAllProcesses = isFullMode` (mode="FULL"일 때만 true)

3. **selectedSpaces 기반 추론 로직 제거**
   - 기존: `selectedSpaces`에서 공정 자동 추론
   - 변경: `processSelections`에서만 공정 추출

4. **공간 선택 판단 로직 수정**
   - 기존: `hasAllSpaces = !selectedSpaces || selectedSpaces.length === 0`
   - 변경: `hasAllSpaces = isFullMode` (mode="FULL"일 때만 true)
   - 공간 판단: `extractedData.spaceIds` 기반으로만 판단

---

### 3. 에러 처리 강화 ✅

#### API 레벨
- 입력 검증 실패 시 상세한 에러 메시지 반환
- 어떤 필드가 문제인지 명확히 표시

#### calculator-v3.ts 레벨
- `processSelections` 없을 때 즉시 에러 발생
- mode="FULL"이 아니면 계산 진행 불가

---

## 📊 수정 전후 비교

### 수정 전 (폴백 오동작)

```typescript
// ❌ 문제 1: 평수 0 이하 시 기본값 사용
if (py <= 0) {
  py = 34  // 기본값 대체
}

// ❌ 문제 2: 선택 데이터 없을 때 전체 시공으로 폴백
const hasAllProcesses = finalEnabledProcessIds.length === 0 && (!selectedSpaces || selectedSpaces.length === 0)

// ❌ 문제 3: selectedSpaces에서 공정 자동 추론
if (selectedSpaces.includes('kitchen')) inferredProcesses.push('kitchen')
```

### 수정 후 (폴백 근절)

```typescript
// ✅ 해결 1: 평수 0 이하 시 에러
if (!input.py || input.py <= 0) {
  errors.push('평수(py)는 필수이며 0보다 커야 합니다.')
}

// ✅ 해결 2: processSelections 없으면 에러 (mode="FULL" 제외)
if (!hasProcessSelections && !isFullMode) {
  errors.push('공정 선택(processSelections)이 없습니다.')
}

// ✅ 해결 3: processSelections가 단일 진실 소스
extractedData = extractProcessesFromSelections()
finalEnabledProcessIds = extractedData.processIds
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 거실+욕실만 선택

**입력**:
```json
{
  "py": 30,
  "grade": "ARGEN",
  "processSelections": {
    "living": {
      "wall_finish": "wallpaper",
      "floor_finish": "laminate"
    },
    "bathroom": {
      "bathroom_core": "standard"
    }
  }
}
```

**예상 결과**:
- ✅ 거실 마감 공정만 포함
- ✅ 욕실 공정만 포함
- ❌ 안방/주방/현관/방 공정 포함되면 실패

### 시나리오 2: 선택 데이터 없음

**입력**:
```json
{
  "py": 30,
  "grade": "ARGEN"
  // processSelections 없음
}
```

**예상 결과**:
- ❌ 계산 중단 (에러 반환)
- ❌ 전체 시공으로 폴백하지 않음

### 시나리오 3: mode="FULL" 명시적 선택

**입력**:
```json
{
  "py": 30,
  "grade": "ARGEN",
  "mode": "FULL"
  // processSelections 없어도 OK
}
```

**예상 결과**:
- ✅ 전체 시공으로 계산
- ✅ 모든 공정 포함

---

## 🎯 완료 기준 달성 여부

- [x] py<=0인 경우 기본값 대체하지 않고 에러로 중단 ✅
- [x] selectedSpaces/enabledProcessIds/processSelections가 비어있을 때 에러로 중단 ✅
- [x] 전체 시공은 mode="FULL" 명시적 선택만 허용 ✅
- [x] processSelections가 단일 진실 소스로 고정 ✅
- [x] selectedSpaces는 UI 표시용으로만 사용 ✅
- [x] 폴백 로직 제거 (selectedSpaces 기반 추론 제거) ✅

---

## 📝 주요 변경 파일

### 1. `app/api/estimate/v3/route.ts`
- `normalizeEstimateInput()` 함수 추가
- 입력 검증 강화
- 정규화된 입력만 계산기에 전달

### 2. `lib/estimate/calculator-v3.ts`
- `hasAllProcesses` 로직 수정 (mode="FULL"일 때만 true)
- `selectedSpaces` 기반 추론 로직 제거
- `processSelections`가 단일 진실 소스로 고정
- 공간 판단 로직 수정 (extractedData.spaceIds 기반)

---

## 🚀 다음 단계

1. **테스트**: 실제 사용 시나리오로 테스트
   - 거실+욕실만 선택 시나리오
   - 선택 데이터 없을 때 에러 확인
   - mode="FULL" 명시적 선택 테스트

2. **모니터링**: 에러 로그 수집 및 분석
   - processSelections 누락 빈도
   - mode="FULL" 사용 빈도

---

## 📌 참고 사항

- 모든 수정은 기존 기능에 영향을 주지 않도록 최소 변경 원칙 준수
- 에러 메시지는 사용자 친화적으로 작성
- mode="FULL"은 명시적 선택만 허용하여 실수 방지




















