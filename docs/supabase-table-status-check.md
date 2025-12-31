# Supabase 테이블 상태 확인 가이드

## 📋 현재 필요한 테이블 목록

### ✅ 필수 테이블 (성향 시스템)

1. **personality_traits** - 성향 항목 마스터
   - 15개 항목 (space_sense, organization_habit, etc.)
   - 상태: ✅ 생성됨

2. **personality_materials** - 성향-자재 매핑
   - materials, construction_phases 참조
   - 상태: ✅ 생성됨 (하지만 참조 테이블 필요)

3. **answer_score_mapping** - 답변-점수 매핑
   - 질문 답변 → 성향 점수 변환
   - 상태: ✅ 생성됨

### ⚠️ 참조 테이블 (필수)

4. **materials** - 자재 마스터
   - personality_materials가 참조
   - 상태: ❓ 확인 필요

5. **construction_phases** - 공정 마스터
   - personality_materials가 참조
   - 상태: ❓ 확인 필요

### ✅ 기존 테이블 (타일 가격 조회용)

6. **materials_pricing** - 자재 가격
   - 타일 가격 조회에 사용
   - 상태: ✅ 이미 존재

---

## 🔍 확인 방법

### 1. Supabase Dashboard에서 확인

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Table Editor 열기**
   - 왼쪽 메뉴에서 "Table Editor" 클릭
   - 테이블 목록 확인

3. **확인할 테이블**
   - `materials` - 있나요?
   - `construction_phases` - 있나요?
   - `personality_traits` - 있나요?
   - `personality_materials` - 있나요?
   - `answer_score_mapping` - 있나요?

### 2. SQL Editor에서 확인

```sql
-- 모든 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- materials 테이블 확인
SELECT * FROM materials LIMIT 5;

-- construction_phases 테이블 확인
SELECT * FROM construction_phases LIMIT 5;

-- personality_traits 테이블 확인
SELECT * FROM personality_traits LIMIT 5;

-- personality_materials 테이블 확인
SELECT * FROM personality_materials LIMIT 5;

-- answer_score_mapping 테이블 확인
SELECT * FROM answer_score_mapping LIMIT 5;
```

---

## 🛠️ 누락된 테이블 생성 방법

### 방법 1: SQL 파일 실행 (권장)

1. **SQL 파일 열기**
   - `docs/supabase-schema-required-tables.sql` 파일 열기

2. **Supabase SQL Editor에서 실행**
   - SQL Editor 열기
   - 파일 내용 복사 → 붙여넣기
   - Run 버튼 클릭

3. **확인**
   - Table Editor에서 `materials`, `construction_phases` 테이블 확인

### 방법 2: 수동 생성

Supabase Dashboard → Table Editor → New Table

**materials 테이블:**
- material_id (UUID, Primary Key)
- material_code (VARCHAR(20), Unique)
- product_name (VARCHAR(100))
- grade (VARCHAR(20))
- argen_made (BOOLEAN)
- category (VARCHAR(50))
- unit (VARCHAR(10))
- description (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

**construction_phases 테이블:**
- phase_id (VARCHAR(10), Primary Key)
- phase_name (VARCHAR(100))
- phase_category (VARCHAR(50))
- description (TEXT)
- display_order (INT)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

---

## ✅ 완료 체크리스트

- [ ] `materials` 테이블 존재 확인
- [ ] `construction_phases` 테이블 존재 확인
- [ ] `personality_traits` 테이블 존재 확인
- [ ] `personality_materials` 테이블 존재 확인
- [ ] `answer_score_mapping` 테이블 존재 확인
- [ ] `materials_pricing` 테이블 존재 확인
- [ ] `v_personality_materials` 뷰 존재 확인
- [ ] `get_recommended_materials` 함수 존재 확인

---

## 🚨 문제 해결

### 문제 1: Foreign Key 에러

**에러 메시지:**
```
relation "materials" does not exist
```

**해결:**
1. `docs/supabase-schema-required-tables.sql` 실행
2. `materials`, `construction_phases` 테이블 생성 확인

### 문제 2: 뷰 조회 실패

**에러 메시지:**
```
column "material_code" does not exist
```

**해결:**
1. `materials` 테이블에 `material_code` 컬럼 확인
2. `docs/supabase-schema-required-tables.sql` 재실행

### 문제 3: 함수 호출 실패

**에러 메시지:**
```
function get_recommended_materials does not exist
```

**해결:**
1. `docs/supabase-schema-personality.sql` 재실행
2. 함수 생성 확인

---

## 📞 다음 단계

테이블 생성 완료 후:
1. 샘플 데이터 입력
2. `personality_materials`에 매핑 데이터 입력
3. `answer_score_mapping`에 답변-점수 매핑 데이터 입력

가이드: `docs/supabase-setup-guide.md` 참고
























