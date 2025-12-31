# V5 Decision Trace Step 3 실행 체크리스트

> **작성 일시**: 2025-01-21  
> **목적**: 즉시 실행 순서 확인 및 검증

---

## ✅ 1. SQL 실행 (Supabase)

### 파일 위치
`docs/V5_DECISION_IMPACTS_TABLE.sql`

### 실행 방법
1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `docs/V5_DECISION_IMPACTS_TABLE.sql` 내용 복사
4. 실행

### 확인 사항
- ✅ 테이블 생성: `v5_decision_impacts`
- ✅ 인덱스 생성: `idx_v5_impacts_session`, `idx_v5_impacts_question_code`
- ✅ CHECK 제약조건: `impact_type IN ('INCLUDE', 'EXCLUDE', 'MULTIPLIER', 'ASSUMPTION')`

---

## ✅ 2. 서버 매핑 객체 확인

### 파일 위치
`lib/analysis/v5-ultimate/decision-impact-map.ts`

### 구현 확인
- ✅ `QUESTION_IMPACT_MAP` 객체 정의
- ✅ V5_Q_0 (공사 범위) 매핑
- ✅ V5_Q_1 (철거 범위) 매핑
- ✅ V5_Q_RISK (리스크/현장 조건) 매핑
- ✅ `getDecisionImpacts()` 함수

---

## ✅ 3. route.ts 삽입 확인

### 파일 위치
`app/api/estimate/v4/route.ts`

### 순서 확인 (정확한 순서)

1. ✅ **견적 계산 완료** (line 161)
   ```typescript
   const result = await calculateEstimateV4ForUI(input, forceGrade)
   ```

2. ✅ **v5_estimate_results 저장** (line 177)
   ```typescript
   await supabase.from('v5_estimate_results').insert({...})
   ```

3. ✅ **Decision Impact 저장** (line 188-240) ← NEW!
   ```typescript
   // ===== V5 DECISION IMPACT SAVE (Decision Trace Step 3) =====
   try {
     // 질문-답변 로그 읽기
     // 영향 매핑
     // INSERT
   } catch (impactError) {
     console.error('[V5_DECISION_IMPACT_ERROR]', impactError);
   }
   ```

4. ✅ **Decision Trace 설명 생성** (line 244)
   ```typescript
   const explanation = await buildDecisionTraceExplanation(sessionId);
   ```

---

## ✅ 4. 실패 격리 확인

### Impact INSERT 실패 시

**코드 위치**: `app/api/estimate/v4/route.ts` line 236-239

```typescript
} catch (impactError) {
  // 저장 실패해도 고객 응답은 정상 반환
  console.error('[V5_DECISION_IMPACT_ERROR]', impactError);
}
```

**확인 사항**:
- ✅ try-catch로 감싸져 있음
- ✅ `[V5_DECISION_IMPACT_ERROR]` 로그 출력
- ✅ 견적 응답은 정상 반환 (line 256)

**테스트 방법**:
1. Supabase 연결 끊기 (임시로 URL 잘못 설정)
2. 견적 계산 API 호출
3. `[V5_DECISION_IMPACT_ERROR]` 로그 확인
4. API 응답이 정상 반환되는지 확인

---

## ✅ 5. 최종 검증

### Supabase 쿼리로 확인

```sql
SELECT
  question_code,
  answer_value,
  affected_category,
  affected_rule_code,
  impact_type
FROM v5_decision_impacts
WHERE session_id = 'your-session-id'
ORDER BY question_code;
```

### 예상 결과

**의미 있는 조회**:
- "전체 리모델링" → `FULL_SCOPE` (INCLUDE)
- "올철거" → `FULL_DEMOLITION` (INCLUDE)
- "있음" (리스크) → `SITE_CONSTRAINTS` (ASSUMPTION) + `WORK_TIME_LIMIT` (ASSUMPTION)

**성공 기준**:
- 사람이 봐도 "아, 이 질문 때문에 이 공정이 이렇게 들어갔구나" 이해됨 ✅

---

## 📋 실행 순서 요약

1. ✅ **SQL 실행**: Supabase에서 `docs/V5_DECISION_IMPACTS_TABLE.sql` 실행
2. ✅ **매핑 파일 확인**: `lib/analysis/v5-ultimate/decision-impact-map.ts` 존재 확인
3. ✅ **route.ts 확인**: 순서 정확한지 확인
4. ✅ **실패 격리 확인**: try-catch 및 로그 확인
5. ✅ **테스트**: 견적 계산 API 호출 후 Supabase에서 데이터 확인

---

## 🎯 완료 판정

### 필수 확인 사항

- [x] SQL 실행 완료 (테이블 + 인덱스)
- [x] 매핑 파일 생성 완료
- [x] route.ts 삽입 완료 (정확한 순서)
- [x] 실패 격리 확인 (try-catch)
- [x] Supabase에서 의미 있는 조회 가능

---

**모든 체크리스트 완료** ✅


