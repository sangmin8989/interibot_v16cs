# Supabase SQL 실행 단계별 가이드

## 🎯 목표
Supabase에 성향 분석 시스템을 완전히 설정합니다.

---

## 📋 실행 전 확인 사항

### 필수 테이블 존재 확인
다음 테이블들이 이미 존재해야 합니다:
- ✅ `materials` (403개 데이터)
- ✅ `construction_phases` (16개 데이터)
- ✅ `materials_pricing` (1,612개 데이터)

**확인 방법:**
```sql
SELECT COUNT(*) FROM materials;
SELECT COUNT(*) FROM construction_phases;
```

---

## 🚀 실행 단계

### Step 1: Supabase Dashboard 접속
1. 브라우저에서 https://supabase.com/dashboard 접속
2. 로그인
3. **인테리봇 프로젝트** 선택

### Step 2: SQL Editor 열기
1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
2. 상단에 **"New query"** 버튼 클릭
   - 또는 `Ctrl + N` (Windows) / `Cmd + N` (Mac)

### Step 3: SQL 파일 열기
1. 로컬에서 `docs/SUPABASE_COMPLETE_SETUP.sql` 파일 열기
2. **전체 내용 선택** (Ctrl+A)
3. **복사** (Ctrl+C)

### Step 4: SQL Editor에 붙여넣기
1. SQL Editor 빈 공간에 **붙여넣기** (Ctrl+V)
2. 내용 확인 (약 200줄)

### Step 5: SQL 파일로 저장 (선택 사항)
1. 상단 오른쪽에 **"Save"** 버튼 클릭
2. 파일 이름 입력: **"Complete Setup - Personality System"**
3. **"Save"** 버튼 클릭

### Step 6: SQL 실행
1. 상단 오른쪽에 **"Run"** 버튼 클릭
   - 또는 `Ctrl + Enter` (Windows) / `Cmd + Enter` (Mac)
2. 실행 중... 표시 확인
3. 약 5-10초 대기

### Step 7: 결과 확인
1. 하단 결과 패널 확인
2. 성공 메시지 확인:
   - ✅ **"Success. No rows returned"** (정상)
   - ✅ **"Success. X rows returned"** (정상, X개 행 반환)

**실행되는 작업:**
- ✅ personality_traits 테이블에 15개 데이터 입력
- ✅ personality_materials 테이블 생성
- ✅ answer_score_mapping 테이블에 7개 샘플 데이터 입력
- ✅ v_personality_materials 뷰 생성
- ✅ get_recommended_materials 함수 생성

### Step 8: 최종 확인
브라우저에서 API 호출:
```
http://localhost:3001/api/test-db-tables
```

**확인 항목:**
- `personality_traits.rowCount` = **15** ✅
- `answer_score_mapping.rowCount` = **7** ✅
- `views.v_personality_materials.exists` = **true** ✅
- `functions.get_recommended_materials.exists` = **true** ✅

---

## ✅ 완료 체크리스트

- [ ] Supabase Dashboard 접속
- [ ] SQL Editor 열기
- [ ] `SUPABASE_COMPLETE_SETUP.sql` 파일 내용 복사
- [ ] SQL Editor에 붙여넣기
- [ ] SQL 실행
- [ ] 성공 메시지 확인
- [ ] API로 최종 확인

---

## 🚨 문제 해결

### 문제 1: Foreign Key 에러
**에러 메시지:**
```
relation "materials" does not exist
또는
relation "construction_phases" does not exist
```

**해결:**
1. Table Editor에서 테이블 존재 확인
2. API 결과에서 확인: materials 403개, construction_phases 16개
3. 테이블이 있으면 정상, Foreign Key 참조만 확인

### 문제 2: 뷰/함수 생성 실패
**에러 메시지:**
```
relation "v_personality_materials" does not exist
또는
function "get_recommended_materials" does not exist
```

**해결:**
1. `CREATE OR REPLACE` 사용 중이므로 재실행
2. 에러 메시지 확인 후 수정

### 문제 3: 데이터 중복 에러
**에러 메시지:**
```
duplicate key value violates unique constraint
```

**해결:**
- `ON CONFLICT DO NOTHING` 사용 중이므로 중복 입력 시 무시됨
- 정상 동작

### 문제 4: 실행 시간이 너무 오래 걸림
**해결:**
1. 네트워크 상태 확인
2. Supabase 서버 상태 확인
3. 다시 실행

---

## 📝 다음 단계

SQL 실행 완료 후:

### 1. personality_materials 데이터 입력
- 403개 자재와 15개 성향 매핑
- 핵심 성향 5개부터 시작
- 가이드: `docs/supabase-materials-input-guide.md`

### 2. answer_score_mapping 전체 데이터 입력
- Quick 모드: 16-24개
- Standard 모드: 50-70개
- 가이드: `docs/supabase-setup-guide.md`

---

## 🎉 완료!

이제 Supabase에 성향 분석 시스템이 완전히 설정되었습니다!

**확인:**
- ✅ personality_traits: 15개
- ✅ answer_score_mapping: 7개 (샘플)
- ✅ v_personality_materials: 뷰 생성
- ✅ get_recommended_materials: 함수 생성
























