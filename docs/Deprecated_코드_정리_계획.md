# Deprecated 코드 정리 계획

> **작성일**: 2025-12-31  
> **목적**: 48개 deprecated 코드 정리

---

## 📋 주요 Deprecated 파일

### 1. `app/estimate/page.tsx`

**상태**: DEPRECATED 표시되어 있으나 여전히 라우트에 존재

**작업**:
- `/onboarding/estimate`로 리다이렉트 추가
- 또는 파일 제거

---

### 2. `lib/utils/estimate.ts`

**상태**: deprecated 주석 있으나 참조됨

**작업**:
- 사용처 파악
- 새로운 함수로 교체
- 또는 제거

---

## 🔍 Deprecated 코드 검색 결과

주요 파일:
- `app/estimate/page.tsx` - DEPRECATED 페이지
- `lib/utils/estimate.ts` - deprecated 함수
- `lib/utils/estimateCalculator.ts` - 확인 필요

---

## 📝 정리 전략

### Phase 1: 사용처 파악

1. Deprecated 코드 사용처 검색
2. 의존성 분석
3. 영향도 평가

### Phase 2: 대체 코드 작성

1. 새로운 함수/컴포넌트 작성
2. 기존 코드를 새 코드로 교체
3. 테스트

### Phase 3: Deprecated 코드 제거

1. 사용처 없으면 삭제
2. 사용처 있으면 봉인 처리
3. 문서 업데이트

---

## ⚠️ 주의사항

1. **하위 호환성**
   - 기존 코드가 깨지지 않도록 주의
   - 점진적 마이그레이션

2. **테스트**
   - 제거 전 모든 기능 테스트
   - 리그레션 테스트

---

## 📊 진행 상황

- [ ] Phase 1: 사용처 파악
- [ ] Phase 2: 대체 코드 작성
- [ ] Phase 3: Deprecated 코드 제거

---

**작성 완료** ✅
