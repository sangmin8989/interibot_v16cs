# Phase 6.5 — 시뮬레이션 실행 가이드

> **목적**: 실제 로그로 정책을 가상 적용하여 `enableLimit` 전환 판단

---

## 준비 사항

### 1. 로그 수집

Phase 5에서 수집된 로그가 필요합니다. 개발 환경에서 다음 명령으로 로그를 파일로 저장하세요:

```bash
# 개발 서버 실행 시 로그를 파일로 리다이렉트
npm run dev 2>&1 | tee logs/ai-calls.log

# 또는 기존 로그 파일이 있다면
# (로그 형식: [AI_CALL]로 시작하는 라인)
```

### 2. 로그 형식 확인

로그는 다음 형식이어야 합니다:

```
[AI_CALL]
route=IMAGE_GENERATE
model=gpt-4-turbo
provider=openai
duration=3200ms
tokens~=1250
success=true
```

---

## 시뮬레이션 실행

### 방법 1: 스크립트 사용 (권장)

```bash
# 스크립트 실행
node scripts/phase6-5-simulation.js logs/ai-calls.log
```

**출력 예시:**
```
================================================================================
Phase 6.5 — AI 호출 제한 가상 시뮬레이션
================================================================================
로그 파일: logs/ai-calls.log

총 로그 수: 1000

1. 분당 호출 집계 (상위 10개):
  IMAGE_GENERATE: 25회/분
  CHAT: 45회/분
  ...

2. 지연 지표:
  IMAGE_GENERATE:
    평균: 3200ms
    P95: 4500ms
  ...

3. 실패율:
  IMAGE_GENERATE: 12.00% (120/1000)
  ...

4. 점유율:
  IMAGE_GENERATE: 10.00% (1000/10000)
  ...

5. 정책 트리거 판정:
  IMAGE 계열:
    분당 ≥ 20: 충족
      - IMAGE_GENERATE: 15회
    avg_duration ≥ 3000ms: 충족
      - IMAGE_GENERATE: 3200ms
    failure_rate ≥ 10%: 충족
      - IMAGE_GENERATE: 12.00%
  ...

6. 최종 Go/No-Go 판정:
  IMAGE 트리거 충족: O
  CHAT 트리거 충족: X
  결론: ⬜ Go 또는 ⬜ Hold (상세 분석 필요)
```

### 방법 2: 수동 분석

템플릿 문서(`docs/PHASE6_5_SIMULATION_TEMPLATE.md`)를 참고하여 수동으로 분석할 수 있습니다.

---

## 결과 해석

### 트리거 충족 여부

- **IMAGE 계열**: 분당 ≥ 20, avg_duration ≥ 3000ms, failure_rate ≥ 10% 중 하나라도 충족
- **CHAT 계열**: 분당 ≥ 60 또는 route_share ≥ 40% 충족

### Go/No-Go 판정

**Go 조건 (enableLimit=true 전환 검토):**
- 다음 중 2개 이상 충족:
  - IMAGE 트리거 충족
  - CHAT 트리거 충족
  - IMAGE 비용 비중 ≥ 50%
  - Level 2 발생

**Hold 조건 (관측 연장):**
- 위 조건 미충족
- 또는 UX 영향이 예상보다 큼

---

## 리포트 작성

시뮬레이션 결과를 다음 형식으로 정리하세요:

### 요약 표

| 항목 | 결과 | 비고 |
|------|------|------|
| IMAGE 트리거 충족 | O / X | - |
| CHAT 트리거 충족 | O / X | - |
| IMAGE 비용 비중 ≥50% | O / X | - |
| Level 2 발생 | O / X | - |
| 첫 요청 통과율 ≥99% | O / X | - |
| 제한 체감 비율 ≤5% | O / X | - |

### 결론

- ⬜ **Go**: `enableLimit=true` 전환 검토
  - 사유: [명시]
  
- ⬜ **Hold**: 관측 연장
  - 사유: [명시]
  - 다음 검토 시점: [날짜]

---

## 주의사항

### ❌ 금지사항

- `enableLimit=true` 전환
- 라우트별 임계값 미세조정
- 정책 문서 수정

### ✅ 허용사항

- 로그 분석
- 시뮬레이션 실행
- 리포트 작성

---

## 다음 단계

### Go 판정 시
- Phase 7: `enableLimit=true` 전환 및 Level 1 구현

### Hold 판정 시
- 관측 연장 (추가 로그 수집)
- 다음 검토 시점 설정

---

**문서 끝**


