# API 호출 방법 가이드

## 🌐 방법 1: 브라우저에서 호출 (가장 쉬움)

### 1단계: 개발 서버 실행 확인
터미널에서 다음 명령어로 서버가 실행 중인지 확인:
```bash
# 서버가 실행 중이어야 함
npm run dev
```

### 2단계: 브라우저에서 주소 입력
브라우저 주소창에 다음 주소를 입력하고 Enter:

```
http://localhost:3001/api/test-materials-status
```

### 3단계: 결과 확인
브라우저에 JSON 형식으로 결과가 표시됩니다.

---

## 💻 방법 2: 터미널에서 호출 (Windows PowerShell)

### PowerShell 열기
1. Windows 키 누르기
2. "PowerShell" 검색
3. PowerShell 실행

### 명령어 입력
```powershell
Invoke-RestMethod -Uri http://localhost:3001/api/test-materials-status | ConvertTo-Json
```

또는 간단하게:
```powershell
curl http://localhost:3001/api/test-materials-status
```

---

## 🖥️ 방법 3: VS Code 터미널에서 호출

### VS Code 터미널 열기
1. VS Code에서 `Ctrl + `` (백틱) 누르기
2. 또는 상단 메뉴: Terminal → New Terminal

### 명령어 입력
```powershell
curl http://localhost:3001/api/test-materials-status
```

---

## 📋 다른 API 엔드포인트

### 전체 테이블 상태 확인
```
http://localhost:3001/api/test-db-tables
```

### 자재 입력 상태 확인
```
http://localhost:3001/api/test-materials-status
```

---

## 🔍 결과 해석

### 성공 시 (200 OK)
```json
{
  "timestamp": "2025-12-12T...",
  "materials": {
    "exists": true,
    "totalCount": 50,
    "byCategory": {
      "tile": 20,
      "floor": 15
    }
  },
  "readiness": {
    "canInputPersonalityMaterials": true
  }
}
```

### 실패 시
- **404 Not Found**: 서버가 실행되지 않았거나 URL이 잘못됨
- **500 Internal Server Error**: 서버 에러 (Supabase 연결 문제 등)

---

## 🚨 문제 해결

### 문제 1: "연결할 수 없습니다"
**해결:**
1. 개발 서버가 실행 중인지 확인
2. 터미널에서 `npm run dev` 실행
3. 포트 번호 확인 (3001)

### 문제 2: "404 Not Found"
**해결:**
1. URL이 정확한지 확인
2. `/api/test-materials-status` 경로 확인
3. 서버 재시작

### 문제 3: "500 Internal Server Error"
**해결:**
1. Supabase 환경 변수 확인 (`.env.local`)
2. Supabase 연결 확인
3. 서버 로그 확인

---

## 💡 팁

### JSON 보기 좋게 보기
브라우저 확장 프로그램 설치:
- **Chrome**: JSON Formatter
- **Edge**: JSON Viewer

또는 온라인 도구 사용:
- https://jsonformatter.org/

---

## 📞 다음 단계

API 호출 결과를 확인한 후:
1. `materials.totalCount` 확인
2. `readiness.canInputPersonalityMaterials` 확인
3. personality_materials 입력 시작
























