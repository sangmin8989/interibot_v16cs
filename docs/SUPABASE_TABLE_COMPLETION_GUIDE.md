# Supabase 테이블 완성 가이드

## 🎯 목표

현재 Supabase에 테이블이 생성되어 있지만 완벽하지 않다고 하셨습니다.  
이 가이드를 따라 누락된 부분을 확인하고 보완하세요.

---

## 📋 Step 1: 현재 상태 확인

### 방법 1: API로 확인 (권장)

브라우저 또는 터미널에서:

```bash
# 로컬 개발 서버 실행 중이어야 함
curl http://localhost:3000/api/test-db-tables
```

또는 브라우저에서:
```
http://localhost:3000/api/test-db-tables
```

**확인 항목:**
- ✅ `exists: true` → 테이블 존재
- ❌ `exists: false` → 테이블 없음 (생성 필요)

### 방법 2: Supabase Dashboard에서 확인

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Table Editor 열기**
   - 왼쪽 메뉴 → "Table Editor"
   - 다음 테이블 확인:
     - `materials` ❓
     - `construction_phases` ❓
     - `personality_traits` ✅
     - `personality_materials` ✅
     - `answer_score_mapping` ✅
     - `materials_pricing` ✅

---

## 🛠️ Step 2: 누락된 테이블 생성

### 필수 참조 테이블 생성

`personality_materials` 테이블이 다음 테이블을 참조합니다:
- `materials` (자재 마스터)
- `construction_phases` (공정 마스터)

이 테이블들이 없으면 `personality_materials`에 데이터를 입력할 수 없습니다.

### 생성 방법

1. **SQL 파일 열기**
   - `docs/supabase-schema-required-tables.sql` 파일 열기

2. **Supabase SQL Editor에서 실행**
   - Supabase Dashboard → SQL Editor
   - "New query" 클릭
   - SQL 파일 내용 복사 → 붙여넣기
   - "Run" 버튼 클릭

3. **확인**
   - Table Editor에서 `materials`, `construction_phases` 테이블 확인
   - 샘플 데이터 4개씩 들어가 있는지 확인

---

## 📊 Step 3: 데이터 입력 상태 확인

### 확인할 데이터

1. **personality_traits** (15개 항목)
   ```sql
   SELECT COUNT(*) FROM personality_traits;
   -- 예상: 15개
   ```

2. **answer_score_mapping** (답변-점수 매핑)
   ```sql
   SELECT COUNT(*) FROM answer_score_mapping;
   -- 현재: 샘플 7개 (Quick 모드)
   -- 목표: 150-200개 (모든 질문 답변)
   ```

3. **personality_materials** (성향-자재 매핑)
   ```sql
   SELECT COUNT(*) FROM personality_materials;
   -- 현재: 0개 (데이터 입력 필요)
   -- 목표: 100-200개
   ```

4. **materials** (자재 마스터)
   ```sql
   SELECT COUNT(*) FROM materials;
   -- 현재: 샘플 4개 (타일)
   -- 목표: 실제 자재 데이터 입력
   ```

5. **construction_phases** (공정 마스터)
   ```sql
   SELECT COUNT(*) FROM construction_phases;
   -- 현재: 샘플 10개
   -- 목표: 실제 공정 데이터 확인
   ```

---

## 🔧 Step 4: 문제 해결

### 문제 1: Foreign Key 에러

**증상:**
```
relation "materials" does not exist
```

**해결:**
1. `docs/supabase-schema-required-tables.sql` 실행
2. `materials`, `construction_phases` 테이블 생성 확인

### 문제 2: 뷰 조회 실패

**증상:**
```
column "material_code" does not exist
```

**해결:**
1. `materials` 테이블 스키마 확인
2. `docs/supabase-schema-required-tables.sql` 재실행

### 문제 3: 함수 호출 실패

**증상:**
```
function get_recommended_materials does not exist
```

**해결:**
1. `docs/supabase-schema-personality.sql` 재실행
2. 함수 생성 확인:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'get_recommended_materials';
   ```

---

## ✅ 완료 체크리스트

### 테이블 존재 확인
- [ ] `materials` 테이블 존재
- [ ] `construction_phases` 테이블 존재
- [ ] `personality_traits` 테이블 존재 (15개 데이터)
- [ ] `personality_materials` 테이블 존재
- [ ] `answer_score_mapping` 테이블 존재
- [ ] `materials_pricing` 테이블 존재

### 뷰 및 함수 확인
- [ ] `v_personality_materials` 뷰 존재
- [ ] `get_recommended_materials` 함수 존재

### 데이터 확인
- [ ] `personality_traits`에 15개 데이터
- [ ] `materials`에 샘플 데이터 (최소 4개)
- [ ] `construction_phases`에 샘플 데이터 (최소 10개)
- [ ] `answer_score_mapping`에 샘플 데이터 (최소 7개)

---

## 🚀 다음 단계

테이블 생성 완료 후:

1. **답변-점수 매핑 데이터 입력**
   - Quick 모드: 16-24개
   - Standard 모드: 50-70개
   - 가이드: `docs/supabase-setup-guide.md` 참고

2. **성향-자재 매핑 데이터 입력**
   - 핵심 성향 5개 × 10-20개 = 50-100개
   - 가이드: `docs/supabase-setup-guide.md` 참고

3. **실제 자재 데이터 입력**
   - `materials` 테이블에 실제 자재 데이터 입력
   - `materials_pricing` 테이블에 가격 데이터 입력

---

## 📞 도움말

문제가 있으면:
1. `http://localhost:3001/api/test-db-tables` 확인
2. Supabase Dashboard → SQL Editor에서 직접 쿼리 실행
3. 에러 메시지 확인 후 `docs/supabase-table-status-check.md` 참고

