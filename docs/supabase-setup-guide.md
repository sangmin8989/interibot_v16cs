# Supabase 테이블 생성 가이드

## 📋 목차
1. [테이블 생성 방법](#1-테이블-생성-방법)
2. [데이터 입력 가이드](#2-데이터-입력-가이드)
3. [검증 방법](#3-검증-방법)

---

## 1. 테이블 생성 방법

### 방법 1: Supabase Dashboard 사용 (권장)

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **SQL 파일 내용 복사**
   - `docs/supabase-schema-personality.sql` 파일 열기
   - 전체 내용 복사

4. **SQL 실행**
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭
   - 성공 메시지 확인

### 방법 2: psql 사용

```bash
# 환경 변수 설정
export PGHOST=your-supabase-host
export PGDATABASE=postgres
export PGUSER=postgres
export PGPASSWORD=your-password

# SQL 파일 실행
psql -f docs/supabase-schema-personality.sql
```

---

## 2. 데이터 입력 가이드

### 2.1 답변-점수 매핑 데이터 입력

**목적:** 질문 답변 → 성향 점수 변환

**입력 방법:**

```sql
-- 예시: Quick 모드 질문 답변 매핑
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('quick_color', 'white_minimal', 'quick', '{"color_preference": 5, "organization_habit": 4, "sensory_sensitivity": 3}'::jsonb),
('quick_color', 'warm_wood', 'quick', '{"color_preference": 4, "home_purpose": 5, "sensory_sensitivity": 3}'::jsonb),
('quick_priority', 'budget_first', 'quick', '{"budget_sense": 5, "health_factors": 2}'::jsonb),
('quick_priority', 'quality_first', 'quick', '{"budget_sense": 2, "sensory_sensitivity": 5}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO UPDATE
SET trait_scores = EXCLUDED.trait_scores;
```

**입력 순서:**
1. Quick 모드 질문 4개 × 답변 옵션 (약 16-24개)
2. Standard 모드 질문 10개 × 답변 옵션 (약 50-70개)
3. Deep 모드 질문 20개 × 답변 옵션 (약 100-150개)

**예상 시간:** 2-3시간

---

### 2.2 성향-자재 매핑 데이터 입력

**목적:** 성향 점수 → 자재 추천

**입력 방법:**

```sql
-- 예시: 정리정돈 습관 높음 → 수납장 추천
INSERT INTO personality_materials (
  trait_id,
  material_id,
  phase_id,
  score_threshold,
  score_direction,
  recommendation_type,
  grade_adjustment,
  priority,
  reason_template
) VALUES
(
  (SELECT trait_id FROM personality_traits WHERE trait_code = 'organization_habit'),
  (SELECT material_id FROM materials WHERE material_code = 'FURNITURE_STORAGE_01'),
  '15', -- 가구 공정
  4, -- 4점 이상
  'gte',
  'upgrade',
  1, -- 등급 +1
  80, -- 우선순위 높음
  '정리를 좋아하시니 맞춤 수납장을 추천드려요'
);
```

**입력 순서:**
1. 핵심 성향 5개 우선 (정리정돈, 조명취향, 청각민감도, 건강요소, 예산감각)
2. 각 성향별로 관련 자재 매핑 (약 10-20개씩)
3. 나머지 성향 10개 (약 5-10개씩)

**예상 시간:** 3-4시간

---

## 3. 검증 방법

### 3.1 테이블 생성 확인

```sql
-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('personality_traits', 'personality_materials', 'answer_score_mapping');

-- 결과: 3개 테이블 모두 나와야 함
```

### 3.2 데이터 확인

```sql
-- 성향 항목 확인
SELECT * FROM personality_traits ORDER BY trait_id;

-- 답변-점수 매핑 확인
SELECT question_id, answer_value, trait_scores 
FROM answer_score_mapping 
WHERE analysis_mode = 'quick'
LIMIT 10;

-- 성향-자재 매핑 확인
SELECT 
  pt.trait_name,
  m.product_name,
  pm.score_threshold,
  pm.recommendation_type
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.material_id
LIMIT 10;
```

### 3.3 함수 테스트

```sql
-- 성향 점수 기반 자재 추천 테스트
SELECT * FROM get_recommended_materials(
  '{"organization_habit": 5, "lighting_preference": 4}'::jsonb,
  NULL -- 모든 공정
);
```

---

## 4. 다음 단계

테이블 생성 완료 후:

1. ✅ **답변-점수 매핑 데이터 입력** (2-3시간)
2. ✅ **성향-자재 매핑 데이터 입력** (3-4시간)
3. ✅ **코드에서 DB 조회 로직 추가** (이미 완료)
4. ✅ **테스트 및 검증** (1시간)

---

## 5. 주의사항

⚠️ **중요:**
- `materials` 테이블이 먼저 생성되어 있어야 함
- `construction_phases` 테이블이 먼저 생성되어 있어야 함
- 외래키 제약조건으로 인해 관련 테이블이 없으면 에러 발생

✅ **해결 방법:**
- 기존 테이블이 없으면 외래키 제약조건을 나중에 추가하거나
- `material_id`, `phase_id`를 NULL 허용으로 변경
























