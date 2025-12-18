# Supabase 연결 테스트 가이드

## 🔍 연결 상태 확인

### 방법 1: 브라우저에서 API 테스트

개발 서버가 실행 중이면:
```
http://localhost:3000/api/test-supabase
```

**확인 사항:**
- `tests.connection.success`: `true`여야 함
- `tests.materialServiceDB.success`: `true`여야 함
- `overall`: `SUCCESS`여야 함

---

### 방법 2: Supabase Dashboard에서 직접 확인

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor에서 테스트 쿼리 실행**

```sql
-- 1. 기본 연결 테스트
SELECT NOW() AS current_time;

-- 2. personality_materials 테이블 확인
SELECT COUNT(*) AS total_count FROM personality_materials;
SELECT COUNT(*) AS active_count FROM personality_materials WHERE is_active = true;

-- 3. answer_score_mapping 테이블 확인 (이건 작동함)
SELECT COUNT(*) FROM answer_score_mapping;

-- 4. materials 테이블 확인
SELECT COUNT(*) FROM materials;
```

---

## 🐛 문제 진단

### Case 1: Supabase 연결 자체가 안 되는 경우

**증상:**
- `tests.connection.success`: `false`
- `tests.materialServiceDB.success`: `false`
- 모든 테스트 실패

**해결:**
1. `.env.local` 파일 확인
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
2. 환경 변수가 올바른지 확인
3. 개발 서버 재시작 (`npm run dev`)

---

### Case 2: personality_materials만 조회 안 되는 경우 (현재 상황)

**증상:**
- `answerScoreMapping`: ✅ 성공
- `traitScoresFromAnswers`: ✅ 성공
- `recommendedMaterials`: ❌ 0개

**원인:**
1. `personality_materials` 테이블에 데이터가 없음
2. `is_active = false`로 입력됨
3. `score_threshold` 조건이 맞지 않음

**해결:**
```sql
-- 1. 데이터 확인
SELECT COUNT(*) FROM personality_materials;
SELECT COUNT(*) FROM personality_materials WHERE is_active = true;

-- 2. 모든 매핑 활성화
UPDATE personality_materials SET is_active = true WHERE is_active = false;

-- 3. 함수 직접 테스트
SELECT * FROM get_recommended_materials(
  '{"organization_habit": 8}'::jsonb,
  NULL
);
```

---

## 🧪 빠른 진단 쿼리

Supabase SQL Editor에서 실행:

```sql
-- 전체 진단 쿼리
SELECT
  'answer_score_mapping' AS table_name,
  COUNT(*) AS count
FROM answer_score_mapping
UNION ALL
SELECT
  'personality_traits',
  COUNT(*)
FROM personality_traits
UNION ALL
SELECT
  'personality_materials (전체)',
  COUNT(*)
FROM personality_materials
UNION ALL
SELECT
  'personality_materials (활성)',
  COUNT(*)
FROM personality_materials
WHERE is_active = true
UNION ALL
SELECT
  'materials',
  COUNT(*)
FROM materials;
```

---

## ✅ 정상 작동 시 예상 결과

```
answer_score_mapping: 154개
personality_traits: 16개
personality_materials (전체): 10개
personality_materials (활성): 10개
materials: 659개
```

---

## 🔧 문제 해결 체크리스트

- [ ] `.env.local` 파일에 Supabase 환경 변수 설정됨
- [ ] 개발 서버 재시작 (`npm run dev`)
- [ ] `/api/test-supabase` 접속 → 연결 성공 확인
- [ ] Supabase Dashboard에서 `personality_materials` 데이터 확인
- [ ] `is_active = true`로 설정됨
- [ ] 함수 `get_recommended_materials` 직접 호출 테스트

---

**진단 결과를 공유해 주시면 추가로 안내하겠습니다!** 🎯

















