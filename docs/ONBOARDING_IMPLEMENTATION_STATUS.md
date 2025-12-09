# 온보딩 플로우 구현 현황

## 📋 작업 완료 내역

### 1. 온보딩 페이지 구조 완성
- ✅ `/onboarding/space-info` - 집 정보 입력 페이지
- ✅ `/onboarding/personality` - 성향 분석 페이지
- ✅ `/onboarding/ai-recommendation` - AI 추천 페이지
- ✅ `/onboarding/estimate` - 즉시 견적 페이지

### 2. 공통 컴포넌트
- ✅ `components/onboarding/StepIndicator.tsx` - 4단계 진행 표시기

### 3. 상태 관리 (Zustand)
- ✅ `lib/store/spaceInfoStore.ts` - 공간 정보 저장소
- ✅ `lib/store/personalityStore.ts` - 성향 분석 저장소

### 4. 데이터 구조
- ✅ `lib/data/personalityQuestions.ts` - 질문 데이터 (4가지 모드)
- ✅ `lib/utils/analysisInterpreter.ts` - 성향 분석 결과 해석 유틸리티

### 5. 견적 계산 연동
- ✅ `lib/estimate/unified-calculator.ts` - 견적 계산 함수 연결
- ✅ `components/estimate/EstimateTable.tsx` - 상세 견적 테이블

---

## 📁 주요 파일 위치

### 온보딩 페이지
```
app/onboarding/
├── space-info/page.tsx          # 1단계: 집 정보 입력
├── personality/page.tsx         # 2단계: 성향 분석
├── ai-recommendation/page.tsx   # 3단계: AI 추천
└── estimate/page.tsx            # 4단계: 즉시 견적
```

### 공통 컴포넌트
```
components/onboarding/
└── StepIndicator.tsx            # 진행 단계 표시기
```

### 상태 관리
```
lib/store/
├── spaceInfoStore.ts            # 공간 정보 (Zustand)
└── personalityStore.ts          # 성향 분석 (Zustand)
```

### 데이터 및 유틸리티
```
lib/data/
└── personalityQuestions.ts      # 질문 세트 (4가지 모드)

lib/utils/
└── analysisInterpreter.ts       # 성향 분석 해석 유틸리티
```

### 견적 계산
```
lib/estimate/
└── unified-calculator.ts        # 통합 견적 계산기

components/estimate/
└── EstimateTable.tsx            # 상세 견적 테이블
```

---

## 🔄 데이터 흐름

### 1단계: 집 정보 입력 (`/onboarding/space-info`)
- 입력 데이터 → `useSpaceInfoStore` → localStorage
- 데이터 구조:
  ```typescript
  {
    housingType: '아파트' | '빌라' | '단독주택' | '오피스텔' | '기타',
    pyeong: number,
    squareMeter: number,
    rooms: number,
    bathrooms: number,
    isRoomAuto: boolean,
    isBathroomAuto: boolean,
    timestamp: string
  }
  ```

### 2단계: 성향 분석 (`/onboarding/personality`)
- 모드 선택 → 질문 답변 → `usePersonalityStore` → localStorage
- 데이터 구조:
  ```typescript
  {
    mode: 'quick' | 'standard' | 'deep' | 'vibe',
    answers: [
      {
        questionId: number,
        question: string,
        answer: string,
        isAuto: boolean
      }
    ],
    completedAt: string
  }
  ```

### 3단계: AI 추천 (`/onboarding/ai-recommendation`)
- 성향 분석 데이터 → API 호출 (`/api/analyze/preference`)
- 분석 결과 해석 → 사용자 친화적 메시지 생성
- 인테리봇의 한마디 (타입별 개인화 메시지)

### 4단계: 즉시 견적 (`/onboarding/estimate`)
- 공간 정보 + 성향 분석 → `calculateEstimate()` 호출
- 4등급 견적 계산 (basic, standard, argen, premium)
- 상세 견적 보기 기능

---

## 🎨 디자인 가이드

### 브랜드 컬러
- **보라색**: `#8B5CF6` (모든 보라색 요소에 일관 사용)
- 활성 상태, 선택된 버튼, 진행률 바, 강조 요소

### 반응형
- **모바일** (< 768px): 세로 배치, 2열 그리드
- **태블릿** (768px ~ 1024px): 3열 그리드
- **데스크톱** (> 1024px): 4-5열 그리드, max-width 800-1000px

### 애니메이션
- `animate-fadeIn` - 페이지 진입
- `animate-slideLeft` - 질문 전환
- `animate-pulse-once` - 자동 제안 하이라이트
- `animate-shake` - 에러 표시

---

## 🔧 다음 작업 시 참고사항

### 1. 성향 데이터 변환 로직 개선
현재 `convertPersonalityToTraits()` 함수가 질문 ID 기반으로 성향 점수를 추출하는데, 더 정확한 매핑이 필요할 수 있습니다.

**위치**: `app/onboarding/estimate/page.tsx` (21-93번째 줄)

### 2. API 응답 구조 확인
`/api/analyze/preference` API의 응답 구조가 예상과 다를 수 있습니다.

**확인 필요**:
- `data.preferences` vs `data.analysis.preferences`
- `data.recommendedStyle` 존재 여부
- 점수 범위 (1-10 vs 1-5)

### 3. 견적 계산 정확도
- 현재 `unified-calculator` 사용 중
- 앵커 기반 계산도 가능 (`anchor-based-calculator.ts`)
- 필요 시 계산 방식 변경 가능

### 4. 상세 견적 테이블
- `EstimateTable` 컴포넌트 사용 중
- 공정별 그룹화 표시
- 모바일에서 가로 스크롤 필요할 수 있음

---

## 🐛 알려진 이슈

### 1. 성향 데이터 변환
- 질문 ID 매핑이 완벽하지 않을 수 있음
- 실제 질문 구조에 맞게 조정 필요

### 2. API 에러 처리
- OpenAI API 키 설정 필요
- 429 Quota 초과 에러 처리 구현됨

### 3. 로딩 시간
- 견적 계산은 즉시 완료 (1-2초)
- AI 추천은 API 호출 시간에 따라 다름 (10-15초)

---

## 📝 다음 작업 제안

### 1. 성향 분석 결과 개선
- 질문 답변을 더 정확하게 성향 점수로 변환
- API 응답 구조에 맞게 데이터 매핑 수정

### 2. 견적 계산 정확도 향상
- 성향 점수를 더 정확하게 반영
- 등급 추천 로직 개선

### 3. 전문가 상담 신청 기능
- 현재 버튼만 있음 (alert 표시)
- 실제 상담 신청 페이지/폼 구현 필요

### 4. 견적서 다운로드 기능
- PDF 생성 기능 추가
- 상세 견적 내역 포함

---

## 🚀 로컬 개발 환경

### 필수 환경 변수
```env
OPENAI_API_KEY=your_api_key_here
```

### 실행 명령어
```bash
npm run dev
```

### 접속 URL
- 개발 서버: `http://localhost:3001`
- 온보딩 시작: `http://localhost:3001/onboarding/space-info`

---

## 💾 Git 상태

### 새로 생성된 파일 (Untracked)
- `app/onboarding/` (전체 디렉토리)
- `components/onboarding/StepIndicator.tsx`
- `lib/data/personalityQuestions.ts`
- `lib/store/` (전체 디렉토리)
- `lib/utils/analysisInterpreter.ts`

### 수정된 파일
- `app/globals.css` (애니메이션 추가)
- `tailwind.config.js` (보라색 컬러 통일)

---

## 📚 참고 문서

### 견적 계산 관련
- `lib/estimate/unified-calculator.ts` - 메인 계산 함수
- `lib/data/estimate-master-real.ts` - 마스터 데이터
- `types/estimate.ts` - 타입 정의

### 성향 분석 관련
- `lib/data/personalityQuestions.ts` - 질문 세트
- `lib/utils/analysisInterpreter.ts` - 결과 해석

### API 엔드포인트
- `/api/analyze/preference` - 성향 분석 API
- `/api/estimate/calculate` - 견적 계산 API

---

## ✅ 체크리스트

### 완료된 기능
- [x] 4단계 온보딩 플로우 완성
- [x] 진행 단계 표시기
- [x] 집 정보 입력 (평수, 방, 화장실)
- [x] 성향 분석 (4가지 모드, 질문 세트)
- [x] AI 추천 (분석 결과 해석)
- [x] 즉시 견적 (4등급 계산)
- [x] 상세 견적 보기
- [x] 상태 관리 (Zustand + localStorage)
- [x] 반응형 디자인
- [x] 애니메이션 효과

### 개선 필요
- [ ] 성향 데이터 변환 로직 정확도 향상
- [ ] 전문가 상담 신청 기능 구현
- [ ] 견적서 다운로드 기능
- [ ] 에러 처리 개선
- [ ] 로딩 상태 UX 개선

---

**마지막 업데이트**: 2024년 현재
**작업 상태**: 기본 기능 완료, 개선 작업 진행 중



