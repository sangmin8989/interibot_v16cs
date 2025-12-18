# 다음 단계 가이드

## 📊 현재 상태 요약

### ✅ 완료
- **materials**: 403개 자재 데이터 ✅
- **construction_phases**: 16개 공정 데이터 ✅
- **materials_pricing**: 1,612개 가격 데이터 ✅

### ❌ 수정 필요
- **personality_traits**: 데이터 0개 → 15개 입력 필요
- **answer_score_mapping**: 데이터 0개 → 샘플 7개 입력 필요
- **v_personality_materials**: 뷰 없음 → 생성 필요
- **get_recommended_materials**: 함수 스키마 캐시 문제 → 재생성 필요

---

## 🚀 즉시 실행 (5분)

### Step 1: SQL 파일 실행

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴 → "SQL Editor"
   - "New query" 클릭

3. **SQL 파일 내용 복사**
   - `docs/QUICK_FIX_SQL.sql` 파일 열기
   - 전체 내용 복사

4. **SQL 실행**
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭
   - 성공 메시지 확인

5. **확인**
   ```sql
   SELECT COUNT(*) FROM personality_traits;
   -- 예상 결과: 15
   
   SELECT COUNT(*) FROM answer_score_mapping;
   -- 예상 결과: 7
   ```

---

## ✅ Step 2: API로 재확인

브라우저에서:
```
http://localhost:3001/api/test-db-tables
```

**확인 항목:**
- `personality_traits.rowCount` = 15 ✅
- `answer_score_mapping.rowCount` = 7 ✅
- `views.v_personality_materials.exists` = true ✅
- `functions.get_recommended_materials.exists` = true ✅

---

## 📋 Step 3: personality_materials 데이터 입력 준비

### 현재 준비 상태
- ✅ materials: 403개 자재 준비 완료
- ✅ construction_phases: 16개 공정 준비 완료
- ✅ personality_traits: 15개 성향 준비 완료 (Step 1 완료 후)

### 입력 시작 가능
Step 1 완료 후 바로 `personality_materials` 데이터 입력을 시작할 수 있습니다.

**입력 예시:**
```sql
-- 1. trait_id 조회
SELECT trait_id, trait_code FROM personality_traits WHERE trait_code = 'organization_habit';
-- 예: trait_id = 5

-- 2. material_id 조회 (예: 수납장)
SELECT id, material_code, product_name FROM materials 
WHERE category_1 LIKE '%수납%' OR category_1 LIKE '%장%'
LIMIT 1;
-- 예: id = '9cc2418e-85a5-4ad6-92c0-7411f086c130'

-- 3. phase_id 확인
SELECT id, phase_name FROM construction_phases WHERE id = '03';
-- 예: id = '03'

-- 4. personality_materials에 입력
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
) VALUES (
  5, -- organization_habit의 trait_id
  '9cc2418e-85a5-4ad6-92c0-7411f086c130', -- material_id
  '03', -- phase_id
  7, -- 정리정돈 습관 7점 이상
  'gte', -- 이상
  'upgrade', -- 업그레이드 추천
  1, -- 등급 +1
  80, -- 우선순위 높음
  '정리정돈을 좋아하시니 수납 공간을 강화해드려요'
);
```

---

## 🎯 우선순위

### 즉시 (5분)
1. ✅ `docs/QUICK_FIX_SQL.sql` 실행

### 단기 (1-2시간)
2. ✅ `personality_materials` 핵심 성향 5개 매핑 입력
   - organization_habit (정리정돈)
   - lighting_preference (조명)
   - budget_sense (예산)
   - health_factors (건강)
   - family_composition (가족)

### 중기 (3-5시간)
3. ✅ 나머지 성향 10개 매핑 입력
4. ✅ `answer_score_mapping` 전체 질문 답변 매핑 입력

---

## 📞 문제 해결

### 문제: SQL 실행 에러
**해결:**
1. 에러 메시지 확인
2. 테이블 존재 여부 확인
3. 컬럼명 확인 (실제 스키마와 일치하는지)

### 문제: 뷰/함수 생성 실패
**해결:**
1. `CREATE OR REPLACE` 사용
2. 기존 뷰/함수 삭제 후 재생성
3. Supabase 스키마 캐시 새로고침

---

## 📝 참고 문서

- `docs/QUICK_FIX_SQL.sql` - 빠른 수정 SQL
- `docs/SUPABASE_STATUS_ANALYSIS.md` - 상태 분석 결과
- `docs/supabase-materials-input-guide.md` - 자재 입력 가이드
















