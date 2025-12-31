# TODO/FIXME 정리 계획

> **작성일**: 2025-12-31  
> **목적**: 29개 TODO/FIXME 우선순위 정리 및 해결

---

## 📋 현재 상태

- **TODO/FIXME 발견**: 30개 파일에서 82개
- **주요 파일**:
  - `app/api/estimate/v4/route.ts` - analyzePersonality 호출 제거
  - `lib/estimate/constitution-estimate-engine.ts` - 실패 조건 체크 완성
  - `app/onboarding/process-new/page.tsx` - processSelections 기반 재구현

---

## 🎯 우선순위

### 🔴 Critical (즉시 해결)

1. **`app/api/estimate/v4/route.ts`**
   - TODO: calculateEstimateV4ForUI 내부의 analyzePersonality 호출 제거
   - 영향: 핵심 견적 API

2. **`lib/estimate/constitution-estimate-engine.ts`**
   - TODO: 나머지 실패 조건 체크
   - 영향: 견적 검증 로직

### 🟡 High (우선 해결)

3. **`app/onboarding/process-new/page.tsx`**
   - TODO: processSelections 기반으로 재구현
   - 영향: 공정 선택 UI

---

## 📝 해결 전략

### Phase 1: Critical TODO 해결

1. `app/api/estimate/v4/route.ts` - analyzePersonality 호출 제거
2. `lib/estimate/constitution-estimate-engine.ts` - 실패 조건 체크 완성

### Phase 2: High Priority TODO 해결

1. `app/onboarding/process-new/page.tsx` - processSelections 기반 재구현

### Phase 3: 기타 TODO 정리

1. 나머지 TODO 우선순위 정리
2. 단계적 해결

---

## ⚠️ 주의사항

1. **테스트 필수**
   - TODO 해결 후 기능 테스트
   - 리그레션 테스트

2. **문서화**
   - 해결한 TODO는 문서에 기록
   - 해결 방법 문서화

---

## 📊 진행 상황

- [ ] Phase 1: Critical TODO 해결
- [ ] Phase 2: High Priority TODO 해결
- [ ] Phase 3: 기타 TODO 정리

---

**작성 완료** ✅
