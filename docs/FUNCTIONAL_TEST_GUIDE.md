# 기능 테스트 가이드

## 🎯 테스트 목표

Supabase 설정이 완료되었으니, 각 기능이 정상적으로 작동하는지 테스트합니다.

---

## 📋 테스트 항목

### 1. 성향 분석 시스템 테스트
- answer_score_mapping 조회
- 답변 → 성향 점수 변환
- 성향 점수 → 자재 추천

### 2. 견적 계산 시스템 테스트
- MaterialService DB 연동
- 타일 가격 조회 (DB/파일)
- 타일 면적/시공일수 조회

---

## 🚀 테스트 실행 방법

### 방법 1: 브라우저에서 확인 (권장)

#### 1. 성향 분석 시스템 테스트
```
http://localhost:3001/api/test-personality-system
```

**확인 항목:**
- `tests.answerScoreMapping.success` = true
- `tests.traitScoresFromAnswers.success` = true
- `tests.recommendedMaterials.success` = true (데이터 없어도 정상)
- `tests.viewTest.success` = true
- `tests.functionTest.success` = true
- `summary.status` = "ALL_PASSED" 또는 "PARTIAL"

#### 2. 견적 계산 시스템 테스트
```
http://localhost:3001/api/test-estimate-system
```

**확인 항목:**
- `tests.tilePriceDB.success` = true
- `tests.tilePriceFile.success` = true
- `tests.tileArea.success` = true
- `tests.tileDays.success` = true
- `tests.allGrades.success` = true
- `summary.status` = "ALL_PASSED"

---

### 방법 2: 터미널에서 확인

#### PowerShell
```powershell
# 성향 분석 시스템 테스트
Invoke-RestMethod -Uri http://localhost:3001/api/test-personality-system | ConvertTo-Json -Depth 10

# 견적 계산 시스템 테스트
Invoke-RestMethod -Uri http://localhost:3001/api/test-estimate-system | ConvertTo-Json -Depth 10
```

#### curl
```bash
# 성향 분석 시스템 테스트
curl http://localhost:3001/api/test-personality-system

# 견적 계산 시스템 테스트
curl http://localhost:3001/api/test-estimate-system
```

---

## ✅ 예상 결과

### 성향 분석 시스템 테스트

**성공 시:**
```json
{
  "summary": {
    "status": "ALL_PASSED",
    "successCount": 5,
    "totalTests": 5
  },
  "tests": {
    "answerScoreMapping": {
      "success": true,
      "test1": {
        "result": { "organization_habit": 9, "color_preference": 8 }
      }
    },
    "traitScoresFromAnswers": {
      "success": true,
      "output": { "organization_habit": 9, ... }
    },
    "recommendedMaterials": {
      "success": true,
      "note": "personality_materials 데이터가 없어서 결과가 비어있습니다. 정상입니다."
    }
  }
}
```

**주의:**
- `recommendedMaterials`의 결과가 비어있어도 정상입니다 (데이터가 0개이므로)
- `viewTest`의 결과가 비어있어도 정상입니다 (데이터가 0개이므로)

---

### 견적 계산 시스템 테스트

**성공 시:**
```json
{
  "summary": {
    "status": "ALL_PASSED",
    "successCount": 5,
    "totalTests": 5
  },
  "tests": {
    "tilePriceDB": {
      "success": true,
      "price": 1450000,
      "grade": "ARGEN"
    },
    "tilePriceFile": {
      "success": true,
      "price": 45000,
      "grade": "BASIC"
    },
    "allGrades": {
      "success": true,
      "prices": {
        "BASIC": 45000,
        "STANDARD": 60000,
        "ARGEN": 1450000,
        "PREMIUM": 2000000
      }
    }
  }
}
```

---

## 🚨 문제 해결

### 문제 1: "Cannot find module" 에러
**해결:**
1. 서버 재시작: `npm run dev`
2. 모듈 경로 확인

### 문제 2: "Supabase connection failed" 에러
**해결:**
1. `.env.local` 파일 확인
2. `NEXT_PUBLIC_SUPABASE_URL` 확인
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인

### 문제 3: "Function does not exist" 에러
**해결:**
1. Supabase에서 함수 생성 확인
2. `docs/SUPABASE_COMPLETE_SETUP.sql` 재실행

---

## 📝 테스트 결과 기록

테스트 후 다음 정보를 기록하세요:

### 성향 분석 시스템
- [ ] answer_score_mapping 조회 성공
- [ ] 답변 → 점수 변환 성공
- [ ] 자재 추천 함수 작동 (데이터 없어도 정상)
- [ ] 뷰 조회 성공

### 견적 계산 시스템
- [ ] DB 타일 가격 조회 성공
- [ ] 파일 타일 가격 조회 성공
- [ ] 타일 면적 조회 성공
- [ ] 타일 시공일수 조회 성공
- [ ] 모든 등급 가격 조회 성공

---

## 🎉 완료!

모든 테스트가 통과하면:
1. ✅ Supabase 설정 완료
2. ✅ 성향 분석 시스템 작동
3. ✅ 견적 계산 시스템 작동

다음 단계:
- 나머지 데이터 입력 (필요 시)
- 실제 사용자 테스트

















