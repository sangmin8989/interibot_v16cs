# KPI 계측 연결 통합 명세서 (100점 버전)

## 📊 목표

**"왜 인테리봇이 다른지"를 숫자로 증명하는 결정 보호 플랫폼**

인테리봇은 "추천하지 않는 AI, 되돌릴 수 없는 선택을 구조로 보호하는 플랫폼"입니다.
이제 경쟁사는 카피로도, 기능 추가로도 따라오기 어렵습니다.

### 비즈니스 가치
- ✅ **투자/세일즈/PR에 바로 사용 가능한 데이터**
- ✅ 경쟁사가 절대 못 내는 지표
- ✅ "결정이 얼마나 빨라졌는지"를 수치로 고정

---

## 🎯 목표 KPI

### 핵심 지표 3가지

1. **결정 완료 시간 (decisionDurationMs)**
   - 목표: 평균 8-12분
   - 측정: 질문 시작 → 견적 요약 확정까지

2. **옵션 변경 횟수 (optionChangeCount)**
   - 목표: 3회 이하
   - 측정: 사용자가 옵션을 변경한 횟수

3. **LOCK 재변경 시도 횟수 (lockOverrideAttemptCount)**
   - 목표: ≤1회
   - 측정: LOCK 공정 변경 시도 횟수

---

## 🔒 현재 공식 상태 (변경 불가 기준)

- ✅ LOCK 3종 완성: 철거 / 방수 / 전기
- ✅ 선택권 제어: optionCount / lockStrength / defaultPlan
- ✅ 판단 단일 루트: choiceVariables
- ✅ 엔진 무결성: 유지
- ✅ OpenAI 의존: 0

→ **AI 견적툴이 아니라 '결정 보호 엔진'**입니다.

---

## 📋 구현 규칙

### 엔진 보호 (절대 금지)
- ❌ 엔진 로직 수정 금지 (InterventionEngine, choiceVariables)
- ❌ 판단/계산 재개입 금지
- ❌ OpenAI 호출 금지
- ❌ UI 개편 금지 (이벤트 훅만 추가)

### 역할 분리
- **프론트엔드**: 이벤트만 전달 (계산 없음)
- **서버**: 이벤트 수집 및 KPI 계산

### DB 스키마
- 이벤트 테이블 1개만 추가 (`kpi_events`)
- 기존 스키마 변경 최소화

---

## 📊 계측 항목

### 이벤트 타입

1. **decision_start**
   - `decisionStartAt`: 질문 시작 시각 (ISO 8601)
   - `sessionId`: 세션 고유 ID

2. **option_change**
   - `processId`: 변경된 공정 ID
   - `fromOption`: 이전 옵션
   - `toOption`: 변경된 옵션
   - `timestamp`: 변경 시각

3. **lock_override_attempt**
   - `processId`: LOCK 공정 ID
   - `lockLevel`: 'hard' | 'soft'
   - `attemptedOption`: 시도한 옵션
   - `timestamp`: 시도 시각

4. **decision_complete**
   - `decisionEndAt`: 견적 요약 확정 시각
   - `finalOptions`: 최종 선택 옵션들
   - `timestamp`: 완료 시각

### 계산된 KPI

- `decisionDurationMs`: `decisionEndAt - decisionStartAt` (밀리초)
- `optionChangeCount`: `option_change` 이벤트 개수
- `lockOverrideAttemptCount`: `lock_override_attempt` 이벤트 개수

---

## 🗄️ DB 스키마

### `kpi_events` 테이블

```sql
CREATE TABLE kpi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'decision_start' | 'option_change' | 'lock_override_attempt' | 'decision_complete'
  event_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kpi_events_session_id ON kpi_events(session_id);
CREATE INDEX idx_kpi_events_event_type ON kpi_events(event_type);
CREATE INDEX idx_kpi_events_timestamp ON kpi_events(timestamp);
```

---

## 🔧 구현 단계

### Phase 1: 프론트엔드 이벤트 훅 추가
- [ ] `decisionStartAt` 추적 (질문 시작 시점)
- [ ] `optionChange` 이벤트 전송
- [ ] `lockOverrideAttempt` 이벤트 전송
- [ ] `decisionEndAt` 추적 (견적 요약 확정 시점)

### Phase 2: 서버 API 엔드포인트
- [ ] `POST /api/kpi/events`: 이벤트 수집
- [ ] `GET /api/kpi/session/:sessionId`: 세션별 KPI 조회

### Phase 3: DB 스키마 추가
- [ ] `kpi_events` 테이블 생성
- [ ] 인덱스 추가

### Phase 4: KPI 계산 로직
- [ ] 서버에서 `decisionDurationMs` 계산
- [ ] 서버에서 `optionChangeCount` 계산
- [ ] 서버에서 `lockOverrideAttemptCount` 계산

### Phase 5: 검증
- [ ] 테스트 세션에서 KPI 산출 확인
- [ ] 실사용자 파일럿 5명 검증 (선택)

---

## ✅ 완료 기준

1. **기능 완료**
   - 세션별 KPI 로그가 누락 없이 저장됨
   - 테스트 세션에서 `decisionDurationMs` 산출 확인
   - 엔진 결과에 영향 없음 (기존 로직 보호)

2. **비즈니스 가치**
   - 평균 결정 시간 8-12분 달성 여부 측정 가능
   - 옵션 변경 3회 이하 달성 여부 측정 가능
   - LOCK 재변경 시도 ≤1회 달성 여부 측정 가능

3. **실사용자 파일럿 (선택)**
   - 동일 시나리오로 5명 테스트
   - 상담 전/후 비교
   - 평균 결정 시간 수집

---

## 🚫 금지 사항

- ❌ KPI를 기준으로 로직 변경 금지
- ❌ 엔진 구조 변경 금지
- ❌ OpenAI 호출 추가 금지
- ❌ UI 전면 개편 금지 (이벤트 훅만 추가)

---

## 📝 커서 지시문 (바로 실행용)

```
지금은 KPI 계측 연결 작업이다.

[목표]
사용자의 '결정 과정'을 수치로 측정한다.
엔진 로직은 변경하지 않는다.

[계측 항목]
- decisionStartAt: 질문 시작 시각
- decisionEndAt: 견적 요약 확정 시각
- decisionDurationMs: 총 소요 시간
- optionChangeCount: 옵션 변경 횟수
- lockOverrideAttemptCount: LOCK 변경 시도 횟수

[구현 규칙]
- 계측은 이벤트 로그로만 기록한다.
- 엔진(InterventionEngine, choiceVariables) 수정 금지
- 프론트는 이벤트만 전달, 계산은 서버에서 수행
- DB 스키마 변경 최소화 (이벤트 테이블 1개 허용)

[금지]
- KPI를 기준으로 로직 변경 금지
- OpenAI 호출 금지
- UI 개편 금지

[완료 기준]
- 세션별 KPI 로그가 누락 없이 저장됨
- 테스트 세션에서 decisionDurationMs 산출 확인
```

---

## 🎯 최종 목표

**"결정이 얼마나 빨라졌는지"를 수치로 고정하여, 경쟁사가 절대 못 내는 지표를 만든다.**













