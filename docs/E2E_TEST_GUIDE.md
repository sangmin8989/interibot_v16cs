# 인테리봇 V5 E2E 테스트 가이드

> **작성일**: 2025-01-21  
> **목적**: Phase 1~3 완료 검증  
> **상태**: 안정성 검증 단계

---

## 테스트 전 준비사항

### 1. 브라우저 개발자 도구 열기
- F12 또는 우클릭 → 검사
- **Console 탭** 열어두기 (에러 확인용)
- **Application 탭** → Local Storage 확인용

### 2. localStorage 초기화 스크립트
브라우저 콘솔에서 실행:
```javascript
// V5 관련 데이터만 삭제
const keys = [
  'v5DnaResult1',
  'v5DnaResult2',
  'v5ProcessSelections',
  'v5EstimateOptions',
  'v5AdditionalOptions',
  'v5SpaceInfo',
  'v5Round2Answers',
  'v5AISessionId',
  'v5AICallSession_*'
];
keys.forEach(key => {
  if (key.endsWith('*')) {
    // 와일드카드 처리
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('v5AICallSession_')) {
        localStorage.removeItem(k);
      }
    });
  } else {
    localStorage.removeItem(key);
  }
});
console.log('✅ V5 localStorage 초기화 완료');
```

---

## 시나리오 A: 정상 신규 플로우

### 목표
처음부터 끝까지 정상적으로 진행되는지 확인

### 단계별 체크리스트

#### Step 1: localStorage 완전 초기화
- [ ] 위의 초기화 스크립트 실행
- [ ] Application 탭에서 V5 관련 키가 모두 삭제되었는지 확인

#### Step 2: /v5 진입
- [ ] URL: `http://localhost:3000/v5`
- [ ] 페이지 로딩 확인
- [ ] **콘솔 에러 0개** 확인

#### Step 3: 1차 성향 질문 완료
- [ ] 스타일 선택 완료
- [ ] 성향분석 1차 (채팅) 완료
- [ ] DNA 결과 1차 표시 확인
- [ ] **콘솔 에러 0개** 확인

#### Step 4: 공정 선택
- [ ] `/v5/process-select` 페이지 진입
- [ ] 공정 선택 (예: 주방, 욕실, 도배)
- [ ] "다음" 버튼 클릭
- [ ] **콘솔 에러 0개** 확인
- [ ] Application 탭에서 `v5ProcessSelections` 확인:
  ```json
  {
    "schemaVersion": "5.0",
    "createdAt": "...",
    "data": ["KITCHEN", "BATH", "WALLPAPER"]
  }
  ```

#### Step 5: 2차 성향 분석 UI 진입
- [ ] `/v5/analysis-phase2` 페이지 진입
- [ ] 질문이 표시되는지 확인 (최대 6개)
- [ ] 모든 질문에 답변
- [ ] "결과 확인" 버튼 클릭
- [ ] **콘솔 에러 0개** 확인
- [ ] Application 탭에서 `v5DnaResult2` 확인:
  ```json
  {
    "schemaVersion": "5.0",
    "createdAt": "...",
    "data": {
      "round1Result": {...},
      "selectedProcesses": ["KITCHEN", "BATH", "WALLPAPER"],
      "answers": {...},
      "adjustedTraitScores": {...}
    }
  }
  ```

#### Step 6: 2차 DNA 결과 페이지 확인
- [ ] `/v5/dna-result-2` 페이지 진입
- [ ] 6대 트레이트 점수 표시 확인
- [ ] 1차 대비 변화 요약 표시 확인
- [ ] **콘솔 에러 0개** 확인

#### Step 7: 다음 단계 정상 이동
- [ ] "공정 상세로 이동" 버튼 클릭
- [ ] `/v5/process-detail` 페이지 진입
- [ ] 공정 상세 옵션 표시 확인
- [ ] **콘솔 에러 0개** 확인

### ✅ PASS 조건
- [ ] 페이지 전환 오류 없음
- [ ] 데이터 누락 없음 (모든 localStorage 키에 `schemaVersion: '5.0'` 존재)
- [ ] 콘솔 에러 0개

---

## 시나리오 B: 새로고침/복원

### 목표
중간에 새로고침해도 데이터가 정상 복원되는지 확인

### 단계별 체크리스트

#### Step 1: 시나리오 A의 Step 5까지 진행
- [ ] 2차 분석 화면 (`/v5/analysis-phase2`) 진입
- [ ] 질문 일부에 답변 (예: 3개 중 2개)
- [ ] Application 탭에서 `v5Round2Answers` 또는 `v5DnaResult2` 확인

#### Step 2: 새로고침
- [ ] F5 또는 새로고침 버튼 클릭
- [ ] 페이지 재로딩 확인

#### Step 3: 데이터 복원 확인
- [ ] 동일 페이지 (`/v5/analysis-phase2`)로 복귀 확인
- [ ] 이전에 답변한 질문의 답변이 복원되었는지 확인
- [ ] **콘솔 에러 0개** 확인

#### Step 4: schemaVersion 체크
- [ ] Application 탭에서 모든 V5 관련 키 확인
- [ ] 모든 키에 `schemaVersion: '5.0'` 존재 확인
- [ ] `createdAt` 필드 존재 확인

### ✅ PASS 조건
- [ ] schemaVersion 체크 통과
- [ ] 데이터 꼬임 없음 (이전 답변이 정확히 복원됨)
- [ ] 콘솔 에러 0개

---

## 시나리오 C: 잘못된 접근

### 목표
잘못된 입력에도 크래시 없이 안전하게 처리되는지 확인

### 테스트 케이스

#### 케이스 C-1: 잘못된 processId로 직접 URL 접근
- [ ] URL: `http://localhost:3000/v5/process-detail?processes=INVALID_PROCESS`
- [ ] 페이지 로딩 확인
- [ ] **크래시 없음** 확인
- [ ] 안전한 폴백 또는 안내 UI 노출 확인
- [ ] **콘솔 에러 0개** (또는 예상 가능한 경고만)

#### 케이스 C-2: 한글 공정 코드로 접근 (하위호환)
- [ ] URL: `http://localhost:3000/v5/process-detail?processes=주방,욕실`
- [ ] 페이지 로딩 확인
- [ ] 정상적으로 처리되는지 확인 (한글 → 영문 변환)
- [ ] **콘솔 에러 0개** 확인

#### 케이스 C-3: 옵션 없는 공정 접근
- [ ] URL: `http://localhost:3000/v5/process-detail?processes=PAINT` (도장)
- [ ] 페이지 로딩 확인
- [ ] 옵션 선택 UI가 스킵되거나 적절히 처리되는지 확인
- [ ] **콘솔 에러 0개** 확인

#### 케이스 C-4: 데이터 없이 직접 접근
- [ ] localStorage 완전 초기화
- [ ] URL: `http://localhost:3000/v5/analysis-phase2?processes=KITCHEN`
- [ ] 페이지 로딩 확인
- [ ] 적절한 리다이렉트 또는 안내 메시지 확인
- [ ] **크래시 없음** 확인

### ✅ PASS 조건
- [ ] 크래시 없음
- [ ] 안전한 폴백 또는 안내 UI 노출
- [ ] 콘솔 에러 0개 (또는 예상 가능한 경고만)

---

## localStorage 복원 테스트

### 목표
모든 저장 데이터에 `schemaVersion: '5.0'`이 존재하고, 구버전 데이터도 정상 처리되는지 확인

### 체크리스트

#### 1. schemaVersion 존재 확인
브라우저 콘솔에서 실행:
```javascript
const keys = [
  'v5DnaResult1',
  'v5DnaResult2',
  'v5ProcessSelections',
  'v5EstimateOptions',
  'v5AdditionalOptions',
  'v5SpaceInfo',
];

let allPass = true;
keys.forEach(key => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    console.log(`⚠️ ${key}: 없음 (정상일 수 있음)`);
    return;
  }
  
  try {
    const data = JSON.parse(raw);
    if (data.schemaVersion === '5.0') {
      console.log(`✅ ${key}: schemaVersion: '5.0' 존재`);
    } else {
      console.error(`❌ ${key}: schemaVersion 없음 또는 잘못됨`, data);
      allPass = false;
    }
  } catch (e) {
    console.error(`❌ ${key}: JSON 파싱 실패`, e);
    allPass = false;
  }
});

if (allPass) {
  console.log('✅ 모든 키에 schemaVersion: 5.0 존재');
} else {
  console.error('❌ 일부 키에 schemaVersion 누락');
}
```

- [ ] 모든 키에 `schemaVersion: '5.0'` 존재

#### 2. 구버전 데이터 처리 확인
브라우저 콘솔에서 실행:
```javascript
// 구버전 형식 데이터 생성 (테스트용)
const oldFormat = {
  data: ['주방', '욕실'], // 한글 코드
  // schemaVersion 없음
};

localStorage.setItem('v5ProcessSelections_TEST', JSON.stringify(oldFormat));

// 페이지에서 읽기 테스트
// normalizeProcessIds가 정상 작동하는지 확인
```

- [ ] 구버전(한글 공정 코드) 데이터가 정상 무시 또는 변환됨
- [ ] 앱 중단 없음

---

## 에러 처리 검증

### 목표
모든 API 호출과 데이터 처리에 적절한 에러 처리가 있는지 확인

### 체크리스트

#### 1. try/catch 확인
주요 파일에서 확인:
- [ ] `app/v5/page.tsx` - try/catch 또는 에러 경계 존재
- [ ] `app/v5/analysis-phase2/page.tsx` - try/catch 또는 에러 경계 존재
- [ ] `app/v5/dna-result-2/page.tsx` - try/catch 또는 에러 경계 존재
- [ ] `app/v5/process-select/page.tsx` - try/catch 또는 에러 경계 존재

#### 2. Fallback 동작 확인
- [ ] API 호출 실패 시 폴백 동작 확인
- [ ] 데이터 누락 시 적절한 리다이렉트 또는 안내

#### 3. UI 멈춤 확인
- [ ] 에러 발생 시에도 UI가 멈추지 않음
- [ ] 로딩 상태가 무한정 지속되지 않음

---

## 최종 빌드 재확인

### 명령어
```bash
npm run build
```

### 체크리스트
- [ ] 빌드 성공 (exit code 0)
- [ ] 타입 에러 0개
- [ ] 린트 에러 0개
- [ ] 경고만 있고 에러 없음

---

## 작업 종료 조건

다음 4개가 **전부 PASS**면 Phase 1~3을 "완료"로 선언:

- [ ] ✅ E2E 3개 시나리오 PASS
- [ ] ✅ localStorage 복원 PASS
- [ ] ✅ 콘솔 에러 0
- [ ] ✅ 빌드 재확인 PASS

---

## 테스트 결과 기록

### 시나리오 A
- [ ] PASS / FAIL
- 문제점 (있으면):

### 시나리오 B
- [ ] PASS / FAIL
- 문제점 (있으면):

### 시나리오 C
- [ ] PASS / FAIL
- 문제점 (있으면):

### localStorage 복원
- [ ] PASS / FAIL
- 문제점 (있으면):

### 에러 처리
- [ ] PASS / FAIL
- 문제점 (있으면):

### 빌드
- [ ] PASS / FAIL
- 문제점 (있으면):

---

**테스트 완료일**:  
**테스터**:  
**최종 결과**: ✅ PASS / ❌ FAIL


