# Phase 8A 실제 코드 PR 단위 체크리스트 (Merge Gate)

> **PR 제목 규칙**: `feat(rate-limit): phase-8a image_generate level2 partial`

---

## A. 범위·가드 (필수)

### 체크리스트

- [ ] `IMAGE_GENERATE`만 Level 2 적용
- [ ] `IMAGE_PROMPT` / `VISION_ANALYSIS` 미적용
- [ ] `CHAT` / `TRAIT_ANALYSIS` / `ESTIMATE_AI` 미적용
- [ ] 첫 요청 무조건 통과
- [ ] 연속 호출 과다 세션만 차단

### 검증 방법

```typescript
// lib/api/ai-call-limiter.ts에서 확인
const isImageGenerate = action === 'IMAGE_GENERATE'
const isFirstRequest = !isConsecutiveCall(sessionId, action)
const shouldApplyHardLimit = isImageGenerate && !isFirstRequest && isBurstCall(sessionId, action)
```

---

## B. env·롤백

### 환경변수 설정

```env
# 활성화
NEXT_PUBLIC_AI_RATE_LIMIT=true
NEXT_PUBLIC_AI_RATE_LIMIT_LEVEL2=true

# 롤백 (1줄)
NEXT_PUBLIC_AI_RATE_LIMIT=false
```

### 체크리스트

- [ ] `NEXT_PUBLIC_AI_RATE_LIMIT=true` 설정
- [ ] `NEXT_PUBLIC_AI_RATE_LIMIT_LEVEL2=true` 설정
- [ ] 1줄 롤백 확인: `NEXT_PUBLIC_AI_RATE_LIMIT=false`
- [ ] 롤백 시 즉시 429 미발생 확인

### 검증 방법

```bash
# 활성화 상태에서 테스트
NEXT_PUBLIC_AI_RATE_LIMIT=true NEXT_PUBLIC_AI_RATE_LIMIT_LEVEL2=true npm run dev

# 롤백 상태에서 테스트
NEXT_PUBLIC_AI_RATE_LIMIT=false npm run dev
```

---

## C. 로직 정확성

### 체크리스트

- [ ] 세션키 우선순위: `x-interibot-session` → `ip+ua`
- [ ] 슬라이딩 윈도우/TTL 정상 (예: 10초)
- [ ] 차단 기준 충족 시에만 429
- [ ] Level 1(soft delay) 로직 유지

### 구현 예시

```typescript
// 세션키 추출
function getSessionKey(request: NextRequest): string {
  const headerSession = request.headers.get('x-interibot-session')
  if (headerSession) return headerSession
  
  const ip = request.ip || 'unknown'
  const ua = request.headers.get('user-agent') || 'unknown'
  return `${ip}_${ua.substring(0, 50)}`
}

// 슬라이딩 윈도우 (10초)
function isBurstCall(sessionKey: string, action: AIAction): boolean {
  const window = 10 * 1000 // 10초
  const threshold = 3 // 3회 이상
  // 구현...
}
```

---

## D. 응답·UX

### 체크리스트

- [ ] 429 상태코드 반환
- [ ] `Retry-After` 헤더 포함
- [ ] 대체 UX payload 포함 (`TEXT_ONLY` 제안)
- [ ] 기존 응답 포맷 비파괴

### 구현 예시

```typescript
if (shouldApplyHardLimit) {
  return NextResponse.json(
    {
      success: false,
      error: '이미지 생성 요청이 많아 잠시 제한되었습니다',
      retryAfter: 10, // 초
      alternative: {
        type: 'TEXT_ONLY',
        suggestion: '텍스트 기반 설명을 제공할까요?',
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': '10',
      },
    }
  )
}
```

---

## E. 로그·관측

### 체크리스트

- [ ] `hard_limit_applied=true/false` 로그 추가
- [ ] `limit_level=2` 로그 추가
- [ ] `burst_count` 로그 추가
- [ ] `retry_after` 로그 추가
- [ ] 개발환경 콘솔 로그 확인

### 로그 형식

```
[AI_CALL]
route=IMAGE_GENERATE
model=gpt-4-turbo
provider=openai
duration=0ms
tokens~=NA
success=false
error=429
soft_delay_applied=false
hard_limit_applied=true
limit_level=2
burst_count=3
retry_after=10
```

---

## F. 테스트 (필수 6종)

### 테스트 시나리오

#### 1. 첫 요청 200
```bash
# 첫 요청은 항상 통과
curl -X POST /api/v5/analyze/photo \
  -H "x-interibot-session: test-session-1" \
  -d '{"imageBase64": "..."}'
# 예상: 200 OK
```

#### 2. 연속 2~3회 200(+soft delay)
```bash
# 연속 호출 (5분 이내)
curl -X POST /api/v5/analyze/photo \
  -H "x-interibot-session: test-session-2" \
  -d '{"imageBase64": "..."}'
# 예상: 200 OK + soft_delay_applied=true
```

#### 3. 연속 과다 429
```bash
# 10초 내 3회 이상 호출
for i in {1..4}; do
  curl -X POST /api/v5/analyze/photo \
    -H "x-interibot-session: test-session-3" \
    -d '{"imageBase64": "..."}'
  sleep 1
done
# 예상: 마지막 요청 429
```

#### 4. 10초 후 재시도 200 복귀
```bash
# 10초 대기 후 재시도
sleep 10
curl -X POST /api/v5/analyze/photo \
  -H "x-interibot-session: test-session-3" \
  -d '{"imageBase64": "..."}'
# 예상: 200 OK
```

#### 5. 롤백 후 429 미발생
```bash
# 환경변수 변경 후
NEXT_PUBLIC_AI_RATE_LIMIT=false npm run dev

# 동일한 연속 호출 테스트
# 예상: 모든 요청 200 OK
```

#### 6. 타 라우트 무영향
```bash
# CHAT 라우트 테스트
curl -X POST /api/v5/analyze/chat \
  -H "x-interibot-session: test-session-4" \
  -d '{"messages": [...]}'
# 예상: 200 OK (제한 없음)

# TRAIT_ANALYSIS 라우트 테스트
curl -X POST /api/generate-questions \
  -H "x-interibot-session: test-session-5" \
  -d '{"spaceInfo": {...}}'
# 예상: 200 OK (제한 없음)
```

### 체크리스트

- [ ] 첫 요청 200 ✅
- [ ] 연속 2~3회 200(+soft delay) ✅
- [ ] 연속 과다 429 ✅
- [ ] 10초 후 재시도 200 복귀 ✅
- [ ] 롤백 후 429 미발생 ✅
- [ ] 타 라우트 무영향 ✅

---

## Merge 조건

**A~F 전부 체크 시에만 승인**

### 최종 확인

- [ ] A. 범위·가드: 5/5 ✅
- [ ] B. env·롤백: 4/4 ✅
- [ ] C. 로직 정확성: 4/4 ✅
- [ ] D. 응답·UX: 4/4 ✅
- [ ] E. 로그·관측: 5/5 ✅
- [ ] F. 테스트: 6/6 ✅

**총합: 28/28 체크 완료 시 Merge 가능**

---

## PR 리뷰 포인트

### 코드 리뷰 시 확인 사항

1. **범위 제한 확인**
   - `isImageGenerate` 조건만 Level 2 적용
   - 다른 action은 절대 건드리지 않음

2. **보호 규칙 확인**
   - 첫 요청은 항상 통과
   - `isFirstRequest` 로직 확인

3. **롤백 가능성 확인**
   - 환경변수만 변경하면 즉시 롤백
   - 코드 수정 없이 복구 가능

4. **UX 영향 최소화**
   - 429 반환 시 대체 UX 제공
   - 기존 응답 포맷 유지

---

**문서 끝**

**버전:** 1.0 (고정본)  
**작성일:** 2025-01-21  
**상태:** PR 체크리스트 (Merge Gate)


