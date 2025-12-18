# 데이터 전달 로직 수정 백업 문서

**작성일**: 2024년  
**작업 내용**: 확인하기 버튼 로딩 상태 추가 및 데이터 전달 로직 수정

---

## 📋 작업 개요

### 문제점
1. 확인하기 버튼 클릭 시 로딩 표시 없음
2. 평수 입력이 잘못 전달됨
3. 인테리봇 판단 요약에서 전체 공정 선택했는데 전달 안 됨
4. 선택공정에서 기본으로 했는데 전달 안 될 수 있음

### 해결 내용
1. ✅ 완료 버튼에 모래시계(로딩) 표시 추가
2. ✅ 평수 전달 로직 확인 및 로그 추가
3. ✅ 전체 공정 선택 전달 로직 수정
4. ✅ 기본 공정 선택 전달 로직 수정

---

## 🔧 수정된 파일 목록

### 1. `app/onboarding/personality/page.tsx`

**수정 내용**:
- 완료 버튼 클릭 시 로딩 상태 추가
- `isSubmitting` 상태로 버튼 비활성화 및 로딩 표시

**주요 변경 사항**:
```typescript
// handleNext 함수에 로딩 상태 추가
const handleNext = async () => {
  // ...
  if (currentQuestionIndex < currentQuestions.length - 1) {
    setCurrentQuestionIndex(prev => prev + 1)
  } else {
    // 마지막 질문 완료 - AI 분석 실행
    setIsSubmitting(true) // ✅ 로딩 상태 시작
    
    try {
      // API 호출
      // ...
    } catch (error) {
      // ...
    } finally {
      setIsSubmitting(false) // ✅ 로딩 상태 종료
    }
  }
}

// 버튼에 로딩 상태 반영
<button
  onClick={handleNext}
  disabled={!isAnswered || isSubmitting}
  className={...}
>
  {isSubmitting ? (
    <div className="flex items-center gap-2">
      <span className="animate-spin">⏳</span>
      <span>처리 중...</span>
    </div>
  ) : (
    <span>{currentQuestionIndex === currentQuestions.length - 1 ? '완료 →' : '다음 →'}</span>
  )}
</button>
```

---

### 2. `app/onboarding/ai-recommendation/page.tsx`

**수정 내용**:
- `selectedProcessesBySpace` 및 `tierSelections`를 API 요청에 포함
- 평수 전달 로직 확인을 위한 상세 로그 추가

**주요 변경 사항**:
```typescript
const requestBody = {
  spaceInfo: {
    housingType: spaceInfo.housingType,
    pyeong: spaceInfo.pyeong, // ✅ 평수 전달
    // ... 기타 필드
  },
  selectedSpaces: selectedSpaceIds,
  selectedProcessesBySpace: selectedProcessesBySpace || {}, // ✅ 선택된 공정 전달
  tierSelections: tierSelections || {}, // ✅ 티어 선택 전달
  personality: {
    // ...
  },
};

// 상세 로그 추가
console.log('📤 [AI 분석 페이지] API 요청 데이터:', {
  평수: requestBody.spaceInfo.pyeong,
  평수타입: typeof requestBody.spaceInfo.pyeong,
  평수값확인: requestBody.spaceInfo.pyeong === spaceInfo?.pyeong ? '일치' : '불일치',
  원본spaceInfo평수: spaceInfo?.pyeong,
  선택공정: Object.keys(selectedProcessesBySpace || {}).length,
  // ...
});
```

---

### 3. `app/api/analyze/v31/route.ts`

**수정 내용**:
- `V31AnalysisRequest` 타입에 `selectedProcessesBySpace`, `tierSelections` 추가
- `convertToV3Input` 함수에서 공정 데이터 파싱 로직 추가
- 빈 배열 대신 실제 선택된 공정 ID 목록 전달

**주요 변경 사항**:

#### 타입 정의 추가
```typescript
interface V31AnalysisRequest {
  // ...
  // 3단계: 선택된 공정 (전체 공정 또는 기본 공정)
  selectedProcessesBySpace?: Record<string, any>;
  tierSelections?: Record<string, any>;
  // ...
}
```

#### 로그 추가
```typescript
console.log('🚀 [V3.1 API] 분석 요청 시작:', {
  평수: body.spaceInfo?.pyeong,
  주거형태: body.spaceInfo?.housingType,
  선택공간: body.selectedSpaces?.length,
  선택공정: body.selectedProcessesBySpace ? Object.keys(body.selectedProcessesBySpace).length : 0,
  티어선택: body.tierSelections ? Object.keys(body.tierSelections).length : 0,
  // ...
});
```

#### 공정 데이터 파싱 로직
```typescript
function convertToV3Input(request: V31AnalysisRequest): V3EngineInput {
  const { spaceInfo, selectedSpaces, selectedProcessesBySpace, tierSelections, personality } = request;
  
  // ...
  
  // ✅ 선택된 공정 처리: selectedProcessesBySpace에서 공정 ID 목록 추출
  let selectedProcesses: string[] = []
  if (selectedProcessesBySpace && Object.keys(selectedProcessesBySpace).length > 0) {
    const allProcessIds = new Set<string>()
    Object.values(selectedProcessesBySpace).forEach((spaceSelections: any) => {
      if (spaceSelections) {
        Object.entries(spaceSelections).forEach(([category, value]) => {
          if (value && value !== 'none' && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v: string) => allProcessIds.add(v))
            } else {
              allProcessIds.add(value as string)
            }
          }
        })
      }
    })
    selectedProcesses = Array.from(allProcessIds)
    
    console.log('✅ [convertToV3Input] 선택된 공정 추출:', {
      selectedProcessesBySpace: selectedProcessesBySpace,
      selectedProcesses: selectedProcesses,
      tierSelections: tierSelections,
    })
  } else {
    console.log('⚠️ [convertToV3Input] selectedProcessesBySpace 없음 또는 비어있음')
  }

  return {
    // ...
    selectedProcesses, // ✅ 선택된 공정 전달 (빈 배열이 아닌 실제 선택값)
    // ...
  };
}
```

---

## 📊 데이터 전달 흐름

### 1. 프론트엔드 → API 요청

**위치**: `app/onboarding/ai-recommendation/page.tsx`

**전달 데이터**:
```typescript
{
  spaceInfo: {
    pyeong: number, // ✅ 평수
    // ... 기타 필드
  },
  selectedSpaces: string[],
  selectedProcessesBySpace: Record<string, any>, // ✅ 전체 공정/기본 공정 선택
  tierSelections: Record<string, any>, // ✅ 티어 선택
  personality: {
    // ...
  }
}
```

### 2. API → V3 엔진 입력 변환

**위치**: `app/api/analyze/v31/route.ts`

**변환 로직**:
1. `selectedProcessesBySpace`에서 모든 공정 ID 추출
2. 배열/단일 값 모두 처리
3. `selectedProcesses` 배열로 변환
4. V3 엔진에 전달

---

## 🔍 디버깅 로그

### 프론트엔드 로그
- `📤 [AI 분석 페이지] API 요청 데이터` - 전송 전 데이터 확인
- `📤 [AI 분석 페이지] 선택된 공정 데이터` - 공정 선택 상태 확인

### 백엔드 로그
- `🚀 [V3.1 API] 분석 요청 시작` - API 수신 데이터 확인
- `✅ [convertToV3Input] 선택된 공정 추출` - 공정 파싱 결과
- `⚠️ [convertToV3Input] selectedProcessesBySpace 없음 또는 비어있음` - 공정 데이터 없음 경고

---

## ✅ 완료 기준

- [x] 완료 버튼 클릭 시 모래시계 표시
- [x] 평수 전달 로직 확인 및 로그 추가
- [x] 전체 공정 선택 전달 로직 수정
- [x] 기본 공정 선택 전달 로직 수정
- [x] 모든 타입 오류 해결
- [x] 빌드 성공 확인

---

## 🎯 핵심 개선 사항

### 1. 사용자 경험 개선
- 완료 버튼 클릭 시 즉각적인 피드백 제공
- 로딩 상태로 중복 클릭 방지

### 2. 데이터 전달 안정성 향상
- 평수 전달 로직 명확화
- 공정 선택 데이터 전달 보장
- 상세 로그로 디버깅 용이성 향상

### 3. 타입 안정성
- API 요청 타입에 공정 데이터 필드 추가
- 타입 안전한 데이터 처리

---

## 📝 참고 사항

### 공정 데이터 구조
- `selectedProcessesBySpace`: 공간별 공정 선택
  - 키: 공간 ID (예: 'kitchen', 'bathroom')
  - 값: 공정 선택 객체
- `tierSelections`: 티어 선택 정보
  - 키: 공정 ID
  - 값: 티어 선택 객체

### 평수 전달 확인
- `spaceInfo.pyeong` 값이 API에 정확히 전달되는지 확인
- 로그에서 평수 타입 및 값 일치 여부 확인 가능

---

## 🔄 롤백 방법

만약 문제가 발생하면:

1. **완료 버튼 로딩 상태 제거**:
   - `app/onboarding/personality/page.tsx`의 `handleNext` 함수에서 `setIsSubmitting` 제거
   - 버튼 JSX에서 로딩 상태 표시 제거

2. **공정 데이터 전달 제거**:
   - `app/onboarding/ai-recommendation/page.tsx`에서 `selectedProcessesBySpace`, `tierSelections` 제거
   - `app/api/analyze/v31/route.ts`에서 `selectedProcesses: []`로 되돌리기

---

**작성자**: Cursor AI Assistant  
**검토 필요**: 실제 테스트 후 사용자 확인













