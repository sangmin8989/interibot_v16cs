# API 엔드포인트 목록

## 🔍 Supabase 테이블 상태 확인

### 1. 전체 테이블 상태 확인
```
GET http://localhost:3001/api/test-db-tables
```

**응답:**
- 모든 필수 테이블 존재 여부
- 뷰/함수 존재 여부
- 샘플 데이터

---

### 2. 자재 입력 상태 확인
```
GET http://localhost:3001/api/test-materials-status
```

**응답:**
- materials 테이블 상태
- 카테고리별/등급별 통계
- personality_materials 입력 가능 여부

---

## 📊 사용 예시

### 브라우저에서 확인
```
http://localhost:3001/api/test-materials-status
```

### 터미널에서 확인
```bash
curl http://localhost:3001/api/test-materials-status
```

### PowerShell에서 확인
```powershell
Invoke-RestMethod -Uri http://localhost:3001/api/test-materials-status
```

---

## 🚀 다음 단계

자재 입력 상태를 확인한 후:
1. personality_materials 데이터 입력 시작
2. 핵심 성향 → 자재 매핑 입력
3. 테스트 및 검증
















