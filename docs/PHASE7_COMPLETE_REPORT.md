# Phase 7 — AI 호출 제한 최소 적용 완료 보고서

> **작성일**: 2025-01-21  
> **상태**: 완료

---

## 작업 완료 요약

### 적용 대상
- ✅ **ON**: IMAGE 계열만
  - `IMAGE_GENERATE` (app/api/v5/analyze/photo/route.ts)
  - `IMAGE_PROMPT` (app/api/image/prompt/route.ts)
  - `VISION_ANALYSIS` (app/api/analyze/vision/route.ts)

- ✅ **OFF**: 절대 건드리지 않음
  - `CHAT`
  - `PROCESS_RECOMMEND`
  - `OPTION_RECOMMEND`
  - `TRAIT_ANALYSIS`
  - `SUMMARY`
  - `ESTIMATE_AI`

### 제한 방식 (Level 1 — 소프트)
- ✅ 응답 지연만 적용 (차단 없음)
- ✅ 지연 조건: 동일 세션의 연속 호출 (5분 이내)
- ✅ 지연 범위: 300~800ms (랜덤)
- ✅ 첫 요청: 무조건 통과

---

## 구현 체크리스트

- ✅ `enableLimit=true` (단, IMAGE 계열 분기에서만 적용)
- ✅ 연속 호출 판별 로직 활성
- ✅ 지연 로직 비동기 적용
- ✅ 기존 응답 포맷 불변
- ✅ 로그에 `soft_delay_applied=true/false` 추가

---

## 주요 변경사항

### 1. IMAGE 계열 Action 타입 추가
- `IMAGE_PROMPT` 추가
- `VISION_ANALYSIS` 추가

### 2. IMAGE 계열 판별 함수
```typescript
function isImageAction(action: AIAction): boolean {
  return action === 'IMAGE_GENERATE' || 
         action === 'IMAGE_PROMPT' || 
         action === 'VISION_ANALYSIS'
}
```

### 3. 연속 호출 판별 로직
- 세션 기반 추적
- 첫 요청은 항상 `false` 반환 (무조건 통과)
- 5분 이내 연속 호출만 `true` 반환

### 4. Level 1 소프트 제한
- 지연 범위: 300~800ms (랜덤)
- 비동기 적용: `await applySoftDelay()`
- 차단 없음: 모든 요청 통과

### 5. 로그 추가
- `soft_delay_applied=true/false` 필드 추가
- 모든 AI 호출 로그에 포함

---

## 환경변수 설정

### 활성화 (Phase 7 적용)
```env
NEXT_PUBLIC_AI_RATE_LIMIT=true
```

### 비활성화 (롤백)
```env
NEXT_PUBLIC_AI_RATE_LIMIT=false
```

**⚠️ 주의**: 환경변수 변경 후 재배포 필요

---

## 모니터링 기준 (적용 후 24~72h)

### 필수 지표
- [ ] IMAGE 평균 duration 변화
- [ ] IMAGE 실패율 변화
- [ ] 첫 요청 통과율 ≥ 99%
- [ ] 제한 체감 요청 비율 ≤ 5%

### 중단(롤백) 트리거
- [ ] 실패율 +2%p 이상 상승
- [ ] p95 duration 급증
- [ ] UX 이슈 리포트 발생

---

## 롤백 플랜 (즉시)

### 1단계: 환경변수 변경
```env
NEXT_PUBLIC_AI_RATE_LIMIT=false
```

### 2단계: 재배포
```bash
# Vercel 또는 배포 플랫폼에서 재배포
```

### 3단계: 확인
- 로그에서 `soft_delay_applied=false` 확인
- IMAGE 계열 호출 정상 동작 확인

**추가 조치 없음**: 환경변수만 변경하면 즉시 롤백

---

## 검증 결과

### 빌드 상태
- ✅ `npm run build` 성공
- ✅ 타입 에러 0개
- ✅ 린트 에러 0개

### 코드 검증
- ✅ IMAGE 계열에만 소프트 제한 적용
- ✅ CHAT/분석/견적 무영향 확인
- ✅ 첫 요청 통과 로직 확인
- ✅ 연속 호출 판별 로직 확인
- ✅ 지연 로직 비동기 적용 확인
- ✅ 로그에 `soft_delay_applied` 필드 추가 확인

---

## Phase 7 완료 기준 체크리스트

- ✅ IMAGE 계열에만 소프트 제한 적용
- ✅ CHAT/분석/견적 무영향
- ✅ 첫 요청 통과 로직 구현
- ✅ 연속 호출만 제한 로직 구현
- ✅ 지연 로직 구현 (300~800ms 랜덤)
- ✅ 로그에 `soft_delay_applied` 추가
- ✅ 빌드 PASS
- ⏳ UX 지표 목표치 충족 (모니터링 대기)
- ⏳ 롤백 테스트 1회 성공 (테스트 대기)

---

## 다음 단계

### Phase 8 (조건 충족 시)
- IMAGE 하드 제한 (Level 2) 검토
- 요청 차단 및 대체 경로 구현

### Phase 7 유지 (안정 시)
- 비용·지연 안정 시 동결
- 모니터링 지속

---

## 최종 보고

**Phase 7 (AI 호출 제한 최소 적용)**
- 적용 대상: IMAGE 계열만 (3개 라우트)
- 제한 방식: Level 1 소프트 (지연만, 차단 없음)
- 보호 규칙: 첫 요청 통과, 연속 호출만 제한
- 롤백: 환경변수 1줄로 즉시 복구 가능
- 빌드: PASS ✅
- 코드 변경: 최소화 (기존 로직 유지)

---

**문서 끝**


