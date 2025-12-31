# V5 질문 로그 Supabase 저장 구현 완료

> **구현 일시**: 2025-01-21  
> **목적**: V5 질문 엔진 로그를 Supabase에 저장하여 추적 및 분석 가능하게 함

---

## ✅ 완료된 작업

### 1. Supabase 테이블 생성 SQL

**파일**: `docs/V5_QUESTION_LOGS_TABLE.sql`

**테이블 구조**:
- `id`: UUID (Primary Key)
- `session_id`: TEXT (세션 ID)
- `idx`: INT (질문 순서, 0~4)
- `risk_level`: TEXT (HIGH/LOW)
- `question`: TEXT (질문 텍스트)
- `quick_replies`: JSONB (빠른 답변 옵션 배열)
- `messages_count`: INT (질문 생성 시점의 메시지 총 개수)
- `created_at`: TIMESTAMPTZ (생성 시간)

**인덱스**:
- `idx_v5_question_logs_session_id`: 세션별 조회 최적화
- `idx_v5_question_logs_created_at`: 시간별 조회 최적화

---

### 2. API Route 로그 저장 로직 추가

**파일**: `app/api/v5/generate-question/route.ts`

**추가된 기능**:

1. **Supabase 클라이언트 생성**
   ```typescript
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```
   - SERVICE_ROLE_KEY 우선 사용 (RLS 우회)
   - 없으면 ANON_KEY 사용 (fallback)

2. **세션 ID 확보**
   ```typescript
   const sessionId =
     request.headers.get('x-session-id') ??
     crypto.randomUUID();
   ```
   - 프론트에서 `x-session-id` 헤더로 전달 가능
   - 없으면 서버에서 UUID 생성

3. **로그 저장 로직**
   ```typescript
   if (result && result.question) {
     try {
       const userMessagesCount = chatMessages.filter(m => m.role === 'user').length;
       const riskLevel = result.question.includes('관리규정') ||
                        result.question.includes('양중') ||
                        result.question.includes('주차')
         ? 'HIGH'
         : 'LOW';

       await supabase.from('v5_question_logs').insert({
         session_id: sessionId,
         idx: userMessagesCount,
         risk_level: riskLevel,
         question: result.question,
         quick_replies: result.quickReplies,
         messages_count: chatMessages.length,
       });
     } catch (logError) {
       // 로그 실패는 서비스에 영향 주면 안 됨
       console.error('[V5_LOG_ERROR]', logError);
     }
   }
   ```

**안전장치**:
- 로그 저장 실패해도 질문 응답은 정상 반환
- try-catch로 감싸서 에러가 서비스에 영향 없음

---

## 🔧 환경 변수 설정

### 필수 환경 변수

`.env.local` 파일에 다음을 추가:

```bash
# Supabase 설정 (기존)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 서버 전용 키 (권장, RLS 우회)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**참고**:
- `SUPABASE_SERVICE_ROLE_KEY`가 없으면 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 사용
- SERVICE_ROLE_KEY는 Supabase Dashboard → Settings → API에서 확인 가능

---

## 📊 사용 방법

### 1. 테이블 생성

Supabase SQL Editor에서 `docs/V5_QUESTION_LOGS_TABLE.sql` 실행:

```sql
create table if not exists v5_question_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  idx int not null,
  risk_level text not null,
  question text not null,
  quick_replies jsonb not null,
  messages_count int not null,
  created_at timestamptz not null default now()
);
```

### 2. 로그 확인

Supabase Dashboard → Table Editor → `v5_question_logs`에서 확인:

**예상 데이터**:
| idx | question | risk_level | session_id |
|-----|----------|------------|------------|
| 0 | 공사 범위는 어디까지인가요? | LOW | abc-123-... |
| 1 | 철거는 어느 정도로 진행하나요? | LOW | abc-123-... |
| 2 | 욕실은 몇 개 공사하나요? | LOW | abc-123-... |
| 3 | 주방 공사는 어느 수준인가요? | LOW | abc-123-... |
| 4 | 바닥/도배는 어디까지 진행하나요? | LOW | abc-123-... |

또는 리스크 질문이 나온 경우:
| idx | question | risk_level | session_id |
|-----|----------|------------|------------|
| 0 | 관리규정/작업시간/주차·양중 제한이 있나요? | HIGH | def-456-... |

### 3. 세션별 조회

```sql
-- 특정 세션의 모든 질문 로그
SELECT * FROM v5_question_logs 
WHERE session_id = 'abc-123-...' 
ORDER BY idx;

-- 세션별 질문 개수 통계
SELECT session_id, COUNT(*) as question_count
FROM v5_question_logs
GROUP BY session_id;
```

---

## ✅ 검증 방법

### 1. 로그 저장 확인

1. 프론트에서 질문 1~5회 진행
2. Supabase → `v5_question_logs` 테이블 확인
3. idx 0~4까지 순서대로 쌓여있는지 확인
4. 동일 `session_id`로 묶여 있는지 확인

### 2. 로그 실패 시 서비스 영향 확인

1. Supabase 연결 끊기 (임시로 URL 잘못 설정)
2. 질문 생성 API 호출
3. `[V5_LOG_ERROR]` 로그는 나오지만 질문 응답은 정상 반환되는지 확인

---

## 🎯 활용 가능한 것들

### 1. 질문 결정 근거 추적

**질문**: "왜 이 질문이 나왔지?"

**답변**: 세션 로그로 100% 설명 가능
- `idx`: 질문 순서
- `risk_level`: 리스크 개입 여부
- `messages_count`: 질문 생성 시점의 컨텍스트

### 2. 질문 패턴 vs 견적 오차 분석

- 특정 질문 패턴이 나온 세션의 견적 정확도 분석
- 리스크 질문이 나온 세션의 견적 오차율 비교

### 3. 특허 서술 근거

- V5 질문 엔진의 자동 질문 결정 로직 증거
- 리스크 개입 로그로 "현장 변수 자동 감지" 증명

### 4. V5.1 업그레이드 검증

- 질문 순서 자동 스왑 로직 검증
- missingInfo 기반 질문 우선순위 변경 효과 측정

---

## ⚠️ 주의사항

### 1. 로그 실패는 서비스에 영향 없음

- 로그 저장 실패해도 질문 응답은 정상 반환
- `[V5_LOG_ERROR]` 로그만 출력하고 계속 진행

### 2. SERVICE_ROLE_KEY 보안

- SERVICE_ROLE_KEY는 서버에서만 사용
- 클라이언트에 노출하지 않음
- `.env.local`에만 저장 (Git에 커밋 금지)

### 3. 테이블 용량 관리

- 로그가 계속 쌓이므로 주기적 정리 필요
- 예: 6개월 이상 된 로그 삭제 또는 아카이브

---

## 📝 다음 단계 (선택)

1. **로그 대시보드 구축**
   - 세션별 질문 패턴 시각화
   - 리스크 질문 비율 통계

2. **자동 분석 리포트**
   - 주간/월간 질문 패턴 리포트
   - 견적 정확도와 질문 패턴 상관관계 분석

3. **실시간 모니터링**
   - 질문 생성 실패율 모니터링
   - 리스크 질문 트리거 빈도 추적

---

**구현 완료** ✅


