# Argen InteriBot

AI 기반 인테리어 성향 분석 및 설계 추천 플랫폼

## 프로젝트 개요

아르젠 인테리봇은 고객의 성향을 분석하여 맞춤형 인테리어 설계안, 스타일/자재 추천, 이미지 생성, 견적 산출까지 자동화하는 B2C 플랫폼입니다.

## 주요 기능

- **성향 분석**: 15개 핵심 항목 기반 맞춤 분석
- **4가지 모드**: Quick / Standard / Deep / Vibe
- **Vision AI**: 사진 업로드 기반 공간 분석
- **스타일 추천**: 7가지 인테리어 스타일 추천
- **견적 시스템**: 자동 견적 계산 및 제시

## 기술 스택

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- OpenAI API (GPT-4, DALL·E 3)

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 3001)
npm run dev
```

서버가 실행되면 `http://localhost:3001`에서 접속할 수 있습니다.

## 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```
OPENAI_API_KEY=your_api_key_here
```

## 프로젝트 구조

```
app/
 ├─ (routes)          # 페이지 라우트
 ├─ api/              # API 라우트
 │   ├─ analyze/      # 성향 분석 API
 │   ├─ estimate/     # 견적 API
 │   └─ image/        # 이미지 생성 API
 ├─ components/       # 재사용 컴포넌트
 └─ lib/              # 유틸리티 함수
```

## 라이선스

Copyright © Argen InteriBot

