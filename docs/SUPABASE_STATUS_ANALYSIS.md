# Supabase 상태 분석 결과

## 📊 현재 상태 (2025-12-12)

### ✅ 완료된 항목

1. **materials** 테이블
   - ✅ 존재함
   - ✅ 403개 자재 데이터 입력 완료
   - ✅ 샘플 데이터 확인 (샤시/창호)

2. **construction_phases** 테이블
   - ✅ 존재함
   - ✅ 16개 공정 데이터 입력 완료
   - ✅ 샘플 데이터 확인 (샤시/창호, 경량철골, 설비)

3. **materials_pricing** 테이블
   - ✅ 존재함
   - ✅ 1,612개 가격 데이터 입력 완료
   - ✅ 등급별 가격 데이터 확인 (basic, standard, argen)

---

### ❌ 문제점 및 해결 방법

#### 1. personality_traits 테이블 - 데이터 없음

**현재 상태:**
- 테이블 존재: ✅
- 데이터 개수: 0개 ❌

**해결 방법:**
`docs/supabase-schema-personality.sql` 파일의 다음 부분을 실행:

```sql
-- 성향 항목 초기 데이터 삽입
INSERT INTO personality_traits (trait_code, trait_name, trait_category, description, min_score, max_score) VALUES
('space_sense', '공간 감각', '감각', '공간을 넓게 느끼고 싶은 정도', 1, 5),
('sensory_sensitivity', '시각 민감도', '감각', '디테일과 색상에 대한 민감도', 1, 5),
('auditory_sensitivity', '청각 민감도', '감각', '소음에 대한 민감도', 1, 5),
('cleaning_preference', '청소 성향', '습관', '청소를 자주 하는 정도', 1, 5),
('organization_habit', '정리정돈 습관', '습관', '정리정돈을 좋아하는 정도', 1, 5),
('family_composition', '가족 구성', '생활', '가족 중심 생활 정도', 1, 5),
('health_factors', '건강 요소', '선호', '건강과 안전에 대한 중요도', 1, 5),
('budget_sense', '예산 감각', '선호', '가성비를 중시하는 정도', 1, 5),
('color_preference', '색감 취향', '선호', '특정 색상 선호도', 1, 5),
('lighting_preference', '조명 취향', '선호', '조명에 대한 관심도', 1, 5),
('home_purpose', '집 사용 목적', '생활', '집을 어떻게 사용하는지', 1, 5),
('discomfort_factors', '불편 요소', '생활', '현재 집에서 불편한 점', 1, 5),
('activity_flow', '활동 동선', '생활', '집에서의 활동 패턴', 1, 5),
('life_routine', '생활 루틴', '생활', '일상 생활 패턴', 1, 5),
('sleep_pattern', '수면 패턴', '생활', '수면에 대한 민감도', 1, 5),
('hobby_lifestyle', '취미/라이프스타일', '생활', '취미와 라이프스타일', 1, 5)
ON CONFLICT (trait_code) DO NOTHING;
```

**실행 방법:**
1. Supabase Dashboard → SQL Editor
2. 위 SQL 복사 → 붙여넣기
3. Run 버튼 클릭
4. 확인: `SELECT COUNT(*) FROM personality_traits;` (15개여야 함)

---

#### 2. v_personality_materials 뷰 - 없음

**현재 상태:**
- 뷰 존재: ❌
- 에러: "Could not find the table 'public.v_personality_materials'"

**해결 방법:**
`docs/supabase-schema-personality.sql` 파일의 뷰 생성 부분 실행:

```sql
CREATE OR REPLACE VIEW v_personality_materials AS
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  pt.trait_category,
  pm.material_id,
  pm.phase_id,
  pm.score_threshold,
  pm.score_direction,
  pm.recommendation_type,
  pm.grade_adjustment,
  pm.priority,
  pm.reason_template,
  pm.is_active,
  m.material_code,
  m.product_name,
  m.grade,
  m.argen_made
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.material_id
WHERE pm.is_active = true;
```

---

#### 3. get_recommended_materials 함수 - 스키마 캐시 문제

**현재 상태:**
- 함수 존재: ❓ (스키마 캐시 문제로 확인 불가)
- 에러: "Could not find the function public.get_recommended_materials"

**해결 방법:**
`docs/supabase-schema-personality.sql` 파일의 함수 생성 부분 재실행:

```sql
CREATE OR REPLACE FUNCTION get_recommended_materials(
  p_trait_scores JSONB,
  p_phase_id VARCHAR(10) DEFAULT NULL
)
RETURNS TABLE (
  mapping_id INT,
  trait_code VARCHAR(50),
  trait_name VARCHAR(100),
  material_id UUID,
  phase_id VARCHAR(10),
  recommendation_type VARCHAR(20),
  grade_adjustment INT,
  priority INT,
  reason_template TEXT,
  material_code VARCHAR(20),
  product_name VARCHAR(100),
  grade VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.mapping_id,
    pt.trait_code,
    pt.trait_name,
    pm.material_id,
    pm.phase_id,
    pm.recommendation_type,
    pm.grade_adjustment,
    pm.priority,
    pm.reason_template,
    m.material_code,
    m.product_name,
    m.grade
  FROM personality_materials pm
  JOIN personality_traits pt ON pm.trait_id = pt.trait_id
  LEFT JOIN materials m ON pm.material_id = m.material_id
  WHERE pm.is_active = true
    AND (p_phase_id IS NULL OR pm.phase_id = p_phase_id)
    AND (
      (pm.score_direction = 'gte' AND (p_trait_scores->>pt.trait_code)::INT >= pm.score_threshold)
      OR (pm.score_direction = 'lte' AND (p_trait_scores->>pt.trait_code)::INT <= pm.score_threshold)
      OR (pm.score_direction = 'eq' AND (p_trait_scores->>pt.trait_code)::INT = pm.score_threshold)
    )
  ORDER BY pm.priority DESC, pm.mapping_id;
END;
$$ LANGUAGE plpgsql;
```

**참고:** 함수가 이미 존재해도 `CREATE OR REPLACE`로 재생성하면 스키마 캐시가 갱신됩니다.

---

#### 4. answer_score_mapping 테이블 - 데이터 없음

**현재 상태:**
- 테이블 존재: ✅
- 데이터 개수: 0개 ❌

**해결 방법:**
`docs/supabase-schema-personality.sql` 파일의 샘플 데이터 부분 실행:

```sql
-- Quick 모드 샘플 데이터
INSERT INTO answer_score_mapping (question_id, answer_value, analysis_mode, trait_scores) VALUES
('quick_first_scene', 'hotel_hallway', 'quick', '{"organization_habit": 9, "color_preference": 8}'::jsonb),
('quick_first_scene', 'warm_kitchen', 'quick', '{"family_composition": 8, "home_purpose": 7}'::jsonb),
('quick_first_scene', 'cozy_living', 'quick', '{"home_purpose": 8, "color_preference": 7}'::jsonb),
('quick_priority', 'storage', 'quick', '{"organization_habit": 9, "activity_flow": 8}'::jsonb),
('quick_priority', 'aesthetic', 'quick', '{"sensory_sensitivity": 9, "color_preference": 8, "lighting_preference": 8}'::jsonb),
('quick_priority', 'function', 'quick', '{"activity_flow": 9, "life_routine": 8, "cleaning_preference": 7}'::jsonb),
('quick_priority', 'comfort', 'quick', '{"home_purpose": 9, "auditory_sensitivity": 8, "health_factors": 8}'::jsonb)
ON CONFLICT (question_id, answer_value, analysis_mode) DO NOTHING;
```

---

## 🎯 우선순위 작업

### 즉시 실행 (5분)

1. ✅ **personality_traits 데이터 입력** (15개)
2. ✅ **뷰 및 함수 생성** (재실행)

### 단기 작업 (1-2시간)

3. ✅ **answer_score_mapping 샘플 데이터 입력** (7개)
4. ⏳ **personality_materials 데이터 입력** (자재와 성향 매핑)

---

## ✅ 완료 후 확인

모든 작업 완료 후 다시 API 호출:

```
http://localhost:3001/api/test-db-tables
```

**확인 항목:**
- `personality_traits.rowCount` = 15
- `answer_score_mapping.rowCount` = 7 (최소)
- `views.v_personality_materials.exists` = true
- `functions.get_recommended_materials.exists` = true

---

## 📝 다음 단계

1. **personality_traits 데이터 입력** (15개)
2. **뷰 및 함수 생성**
3. **answer_score_mapping 샘플 데이터 입력**
4. **personality_materials 데이터 입력 시작** (403개 자재 활용)

















