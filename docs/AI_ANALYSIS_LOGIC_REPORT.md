# 인테리봇 AI 분석 전체 로직 보고서

## 📋 목차
1. [전체 아키텍처 개요](#1-전체-아키텍처-개요)
2. [데이터 수집 단계](#2-데이터-수집-단계)
3. [성향 분석 단계](#3-성향-분석-단계)
4. [종합 분석 단계](#4-종합-분석-단계)
5. [분석 제출 단계](#5-분석-제출-단계)
6. [결과 표시 단계](#6-결과-표시-단계)
7. [에러 처리 및 폴백 메커니즘](#7-에러-처리-및-폴백-메커니즘)
8. [주요 기술 스택](#8-주요-기술-스택)

---

## 1. 전체 아키텍처 개요

### 1.1 시스템 구조
```
[고객 입력] 
    ↓
[데이터 수집] → [성향 분석] → [종합 분석] → [분석 제출] → [결과 표시]
    ↓              ↓              ↓              ↓              ↓
[Zustand Store] [OpenAI API] [OpenAI API] [V2 엔진 + AI] [React UI]
```

### 1.2 핵심 컴포넌트
- **프론트엔드**: Next.js 14 (App Router), React, Zustand (상태 관리)
- **백엔드 API**: Next.js API Routes
- **AI 엔진**: OpenAI GPT-3.5-turbo / GPT-4o-mini
- **규칙 기반 엔진**: V2 분석 엔진 (`lib/analysis/engine-v2.ts`)

---

## 2. 데이터 수집 단계

### 2.1 수집되는 데이터

#### 2.1.1 집 정보 (SpaceInfo)
```typescript
{
  housingType: string          // 주거형태 (아파트, 오피스텔 등)
  pyeong: number              // 평수
  rooms: number               // 방 개수
  bathrooms: number           // 욕실 개수
  budget?: string             // 예산 범위
  familySizeRange?: string    // 가족 규모
  ageRanges?: string[]        // 연령대
  lifestyleTags?: string[]    // 생활 특성 (아이, 반려동물, 재택근무 등)
  livingPurpose?: string      // 거주 목적 (실거주, 매도준비, 임대)
  livingYears?: number        // 예상 거주 기간
  specialConditions?: {      // 특수 조건
    hasPets?: boolean
    hasElderly?: boolean
    hasPregnant?: boolean
    // ...
  }
}
```

#### 2.1.2 선택된 공간 (SelectedSpaces)
- 거실, 주방, 욕실, 안방, 방, 현관, 발코니 등
- 공간별로 개별 선택 가능

#### 2.1.3 선택된 공정 (SelectedProcesses)
- 공간별 공정 선택 (B안): `selectedProcessesBySpace`
  - 예: 주방 → 주방 코어, 주방 상판
  - 예: 욕실 → 욕실 코어
- 티어 기반 공정 선택 (A안): `tierSelections`
  - 예: 철거, 주방, 욕실, 타일, 목공, 전기, 도배, 필름

#### 2.1.4 세부 옵션 (DetailOptions)
```typescript
{
  주방옵션?: {
    형태: string              // 일자, ㄱ자, ㄷ자 등
    상판재질: string
    냉장고장: boolean
    키큰장: boolean
    // ...
  }
  욕실옵션?: {
    스타일: string
    욕조: boolean
    비데: boolean
    // ...
  }
}
```

#### 2.1.5 성향 분석 데이터 (Personality)
```typescript
{
  mode: 'quick' | 'standard' | 'deep' | 'vibe'
  answers: Record<string, string>  // 질문ID → 답변
  vibeData?: {
    mbti?: string
    bloodType?: string
    birthdate?: string
  }
}
```

### 2.2 데이터 저장 위치
- **Zustand Store**: 클라이언트 상태 관리
  - `spaceInfoStore`: 집 정보
  - `personalityStore`: 성향 분석 결과
  - `processStore`: 공정 선택
  - `scopeStore`: 공간 선택
- **localStorage**: 브라우저 영구 저장 (Zustand persist)

---

## 3. 성향 분석 단계

### 3.1 API 엔드포인트
**경로**: `/api/analyze/preference`  
**파일**: `app/api/analyze/preference/route.ts`

### 3.2 처리 흐름

```
1. 요청 검증
   ├─ OpenAI API 키 확인
   ├─ 모드별 데이터 검증 (vibe 모드 vs 일반 모드)
   └─ 답변 데이터 확인

2. 프롬프트 생성
   ├─ System Prompt: 15개 핵심 성향 항목 분석 지시
   └─ User Prompt: 고객 답변 데이터 + 공간별 스타일

3. OpenAI API 호출
   ├─ Model: gpt-3.5-turbo
   ├─ Response Format: JSON
   └─ Temperature: 0.7

4. 응답 처리
   ├─ JSON 파싱
   ├─ 에러 처리 (429 Quota 초과 등)
   └─ 결과 반환
```

### 3.3 분석 항목 (15개)
1. 공간 감각
2. 시각 민감도
3. 청각 민감도
4. 청소 성향
5. 정리정돈 수준
6. 수면 패턴
7. 활동량·동선
8. 가족 구성
9. 건강 요소
10. 예산 감각
11. 색감 취향
12. 조명 취향
13. 집 사용 목적
14. 불편 요소
15. 전체 생활 루틴

### 3.4 반환 형식
```typescript
{
  success: boolean
  analysisId: string
  analysis: {
    preferences: {
      spaceSense: number        // 1-10 점수
      visualSensitivity: number
      // ... 15개 항목
    }
    recommendedStyle: string
    recommendedColors: string[]
    summary: string
  }
}
```

---

## 4. 종합 분석 단계

### 4.1 API 엔드포인트
**경로**: `/api/analyze/complete`  
**파일**: `app/api/analyze/complete/route.ts`

### 4.2 처리 흐름

```
1. 요청 데이터 수집
   ├─ 집 정보 (spaceInfo)
   ├─ 선택된 공간 (selectedSpaces)
   ├─ 선택된 공정 (selectedProcesses, tierSelections)
   ├─ 세부 옵션 (detailOptions)
   └─ 성향 분석 결과 (personality)

2. 프롬프트 생성 (buildAnalysisPrompt)
   ├─ 집 기본 정보
   ├─ 선택한 공간 목록
   ├─ 선택한 공정 정보
   ├─ 세부 옵션 상세
   └─ 성향 분석 결과 (매우 중요!)

3. OpenAI API 호출
   ├─ Model: gpt-3.5-turbo
   ├─ System Prompt: 15년 경력 컨설턴트 역할 부여
   │   ├─ 성향 질문 심층 해석 가이드
   │   ├─ MBTI + 혈액형 조합 분석
   │   ├─ 집 정보 + 성향 결합 분석
   │   └─ 톤앤매너 (친구 같은 전문가 느낌)
   ├─ User Prompt: 고객 정보 종합
   └─ Temperature: 0.8 (창의적 응답)

4. 응답 처리
   ├─ JSON 파싱 (정규식으로 JSON 블록 추출)
   ├─ AI 실패 시 기본 분석 사용 (createDefaultAnalysis)
   └─ 결과 반환
```

### 4.3 System Prompt 핵심 내용

#### 4.3.1 성향 질문 해석 가이드
- **퇴근 후 원하는 첫 장면**: 라이프스타일 핵심 파악
- **사진 찍고 싶은 공간**: 가장 투자하고 싶은 공간
- **절대 타협 안 할 것**: 최우선 투자 영역
- **원하는 집 분위기**: 스타일 결정의 핵심

#### 4.3.2 MBTI + 혈액형 조합 분석
- MBTI 4글자 각각의 의미 해석
- 혈액형 특성 반영
- 조합 예시 제공 (예: ISFJ + A형 → 꼼꼼하게 가족을 챙기시는 분)

#### 4.3.3 톤앤매너
- ❌ 금지: "~합니다", "추천드립니다" 형식적 표현
- ✅ 권장: 친구 같은 전문가 느낌, 대화체, 고객 선택 해석하며 공감

### 4.4 반환 형식
```typescript
{
  success: boolean
  analysis: {
    summary: string                    // 3-4문장 요약
    customerProfile: {
      lifestyle: string                // 라이프스타일 심층 분석
      priorities: string[]             // 최우선 포인트 3개
      style: string                    // 추천 스타일명
    }
    homeValueScore: {
      score: number                    // 1-5점
      reason: string
      investmentValue: string
    }
    lifestyleScores: {
      storage: number                  // 0-100점
      cleaning: number
      flow: number
      comment: string
    }
    spaceAnalysis: Array<{
      space: string
      recommendation: string
      tips: string[]
      estimatedImpact: string
    }>
    budgetAdvice: {
      grade: string                    // basic/standard/argen/premium
      reason: string
      savingTips: string[]
    }
    warnings: string[]
    nextSteps: string[]
  }
  inputSummary: {
    평수: number
    주거형태: string
    선택공간수: number
    예산: string
  }
}
```

### 4.5 기본 분석 (Fallback)
AI 실패 시 `createDefaultAnalysis` 함수가 실행:
- MBTI 기반 성향 분석
- 성향 답변 심층 해석
- 가족 구성별 숨은 니즈 반영
- 공간별 정밀 분석
- 예산별 등급 추천

---

## 5. 분석 제출 단계

### 5.1 API 엔드포인트
**경로**: `/api/analysis/submit`  
**파일**: `app/api/analysis/submit/route.ts`

### 5.2 처리 흐름 (2단계 하이브리드)

```
1단계: 규칙 기반 엔진 (V2) 실행
   ├─ buildAnalysisResultV2(payload)
   ├─ 입력: mode, preferences, spaceInfo, selectedAreas, vibeInput
   ├─ 출력: 
   │   ├─ summary: 요약
   │   ├─ recommendations: 추천사항
   │   ├─ spaceRanking: 공간 우선순위
   │   ├─ processRanking: 공정 우선순위
   │   ├─ styleMatch: 스타일 매칭
   │   ├─ homeValueScore: 집값 방어 점수
   │   └─ lifestyleScores: 생활 개선 점수

2단계: OpenAI 자연어 리포트 생성
   ├─ buildAIReportWithOpenAI(payload, result)
   ├─ System Prompt: 15년 경력 컨설턴트
   │   └─ 핵심 미션: 고객이 놓치는 부분 찾기
   ├─ User Prompt: 
   │   ├─ 고객 정보 요약 (buildCustomerSummary)
   │   └─ 규칙 기반 분석 결과 요약 (buildEngineSummaryForAI)
   └─ 출력: AIAnalysisReport
```

### 5.3 V2 엔진 결과
```typescript
{
  mode: string
  summary: string
  summaryExplanation?: string
  recommendations: string[]
  spaceRanking?: Array<{ spaceId: string; score: number }>
  processRanking?: Array<{ process: string; score: number }>
  styleMatch?: Array<{ style: string; score: number }>
  colorPalette?: string[]
  budgetRecommendation?: string
  estimateHints?: {
    prioritySpaces: string[]
    priorityProcesses: string[]
    suggestedGrade: string
    specialRequirements: string[]
  }
  vibeProfile?: {
    type: string
    archetype: string
    keywords: string[]
    dominantColor: string
    description: string
  }
  homeValueScore?: {
    score: number
    reason: string
    investmentValue: string
  }
  lifestyleScores?: {
    storage: number
    cleaning: number
    flow: number
    comment: string
  }
  preferences?: Record<string, number>
}
```

### 5.4 AI 리포트 (aiReport)
```typescript
{
  title: string                    // 한 줄 요약 타이틀
  overview: string                  // 2~3단락 전체 요약
  personalityKeywords: string[]      // 성향 키워드 3~7개
  styleKeywords: string[]           // 스타일 키워드 3~7개
  prioritySpaces: Array<{
    spaceId: string
    label: string
    reason: string
  }>
  priorityProcesses: Array<{
    process: string
    label: string
    reason: string
  }>
  budgetSummary: string
  nextActions: string[]
  missedPoints?: {                 // 핵심 가치!
    title: string
    items: Array<{
      point: string                 // 놓칠 수 있는 문제점
      impact: string                // 발생 시 영향
      recommendation: string       // 전문가 추천
    }>
  }
}
```

### 5.5 최종 반환 형식
```typescript
{
  success: true
  ...result,                        // V2 엔진 결과 전체
  aiReport: AIAnalysisReport | null // AI 자연어 리포트
}
```

---

## 6. 결과 표시 단계

### 6.1 결과 페이지
**경로**: `/result`  
**파일**: `app/result/ResultContent.tsx`

### 6.2 표시되는 정보

#### 6.2.1 기본 분석 결과
- 요약 (summary)
- 성향 점수 (preferences)
- 추천사항 (recommendations)

#### 6.2.2 Vibe 프로필 (vibe 모드)
- 타입 (type)
- 아키타입 (archetype)
- 키워드 (keywords)
- MBTI/혈액형 정보

#### 6.2.3 점수 정보
- 집값 방어 점수 (homeValueScore)
- 생활 개선 점수 (lifestyleScores)

#### 6.2.4 AI 리포트 (aiReport)
- 타이틀
- 전체 요약 (overview)
- 성향/스타일 키워드
- 우선 투자 공간/공정
- 예산 요약
- 다음 액션
- **놓친 부분 (missedPoints)** ← 핵심 가치!

### 6.3 UI 컴포넌트
- 분석 완료 헤더
- Vibe 프로필 카드
- 점수 표시 (그래프/바)
- AI 리포트 섹션
- 놓친 부분 강조 표시

---

## 7. 에러 처리 및 폴백 메커니즘

### 7.1 OpenAI API 키 없음
- **감지**: `process.env.OPENAI_API_KEY` 확인
- **처리**: 기본 분석 사용 (`createDefaultAnalysis`)
- **로그**: "OpenAI API 키 없음, 기본 분석 사용"

### 7.2 API 호출 실패
- **429 Quota 초과**: 별도 에러 응답 반환
- **기타 에러**: 기본 분석으로 폴백
- **로그**: 에러 상세 정보 기록

### 7.3 JSON 파싱 실패
- **정규식 추출**: `/\{[\s\S]*\}/` 로 JSON 블록 추출
- **실패 시**: 기본 분석 사용
- **로그**: 파싱 실패한 내용 일부 출력

### 7.4 기본 분석 로직
- MBTI 기반 성향 분석
- 성향 답변 심층 해석
- 가족 구성별 니즈 반영
- 공간별 정밀 분석
- 예산별 등급 추천

---

## 8. 주요 기술 스택

### 8.1 프론트엔드
- **Next.js 14**: App Router
- **React**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Zustand**: 클라이언트 상태 관리
- **Tailwind CSS**: 스타일링

### 8.2 백엔드
- **Next.js API Routes**: 서버 API
- **OpenAI SDK**: AI API 호출
- **규칙 기반 엔진**: V2 분석 로직

### 8.3 AI 모델
- **gpt-3.5-turbo**: 주로 사용 (비용 효율)
- **gpt-4o-mini**: 일부 분석에 사용
- **Temperature**: 0.7~0.8 (창의적 응답)

### 8.4 데이터 저장
- **Zustand Persist**: localStorage 자동 동기화
- **localStorage**: 브라우저 영구 저장

---

## 9. 핵심 특징 요약

### 9.1 하이브리드 분석 시스템
- **규칙 기반 엔진 (V2)**: 정확한 점수 계산, 우선순위 결정
- **AI 자연어 리포트**: 고객이 이해하기 쉬운 설명, 놓친 부분 발견

### 9.2 맞춤형 분석
- **성향 질문 심층 해석**: 단순 답변 → 라이프스타일 파악
- **MBTI + 혈액형 조합**: 개성 반영
- **가족 구성별 니즈**: 아이, 반려동물, 고령자 등 특수 조건

### 9.3 고객 경험 최적화
- **친구 같은 전문가 톤**: 딱딱한 표현 금지
- **놓친 부분 발견**: 전문가 관점에서 미래 문제 예측
- **구체적 추천**: "추천합니다" → "왜 추천하는지" 설명

### 9.4 안정성
- **다단계 폴백**: AI 실패 → 기본 분석 → 최소한의 결과
- **에러 처리**: 모든 단계에서 에러 처리
- **로깅**: 상세한 디버깅 정보

---

## 10. 향후 개선 방향

### 10.1 성능 최적화
- API 호출 최적화 (배치 처리)
- 캐싱 전략 도입
- 응답 시간 단축

### 10.2 분석 정확도 향상
- 더 많은 학습 데이터 수집
- 프롬프트 지속적 개선
- A/B 테스트를 통한 최적화

### 10.3 사용자 경험 개선
- 실시간 분석 진행 상황 표시
- 분석 결과 공유 기능
- 히스토리 관리

---

## 📝 작성일
2025년 1월

## 📌 버전
v1.0





















