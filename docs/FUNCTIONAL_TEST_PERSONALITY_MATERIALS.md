# personality_materials 기능 테스트 가이드

## 📋 테스트 목표

현재 입력된 10개 매핑으로 다음 기능들이 정상 작동하는지 확인:
1. ✅ 성향 점수 → 자재 추천 (`getRecommendedMaterialsFromDB`)
2. ✅ 견적 계산에 성향 반영 (`personalitySummary` → 견적)
3. ✅ 전체 플로우 (온보딩 → 성향 분석 → 견적)

---

## 🧪 Step 1: API 엔드포인트 테스트

### 테스트 1-1: 성향 시스템 API

**URL:**
```
http://localhost:3000/api/test-personality-system
```

**예상 결과:**
```json
{
  "timestamp": "...",
  "tests": {
    "answerScoreMapping": {
      "success": true,
      "message": "✅ answer_score_mapping 조회 성공"
    },
    "traitScoresFromAnswers": {
      "success": true,
      "message": "✅ trait scores 계산 성공"
    },
    "recommendedMaterials": {
      "success": true,
      "message": "✅ 추천 자재 조회 성공",
      "count": 10  // 또는 더 많을 수 있음
    }
  },
  "summary": {
    "status": "SUCCESS"
  }
}
```

**확인 사항:**
- ✅ `recommendedMaterials.success`가 `true`
- ✅ `recommendedMaterials.count`가 0보다 큼 (현재 10개 매핑이 있으므로)

---

### 테스트 1-2: 견적 계산 API (성향 반영)

**URL:**
```
POST http://localhost:3000/api/estimate/v3
Content-Type: application/json
```

**요청 Body:**
```json
{
  "py": 25,
  "grade": "STANDARD",
  "isExtended": false,
  "closetType": "SWING",
  "includeFoldingDoor": false,
  "includeBidet": false,
  "includeBathtub": false,
  "includeDoorlock": true,
  "includeLighting": true,
  "selectedSpaces": [
    { "id": "living", "isSelected": true },
    { "id": "kitchen", "isSelected": true },
    { "id": "bathroom", "isSelected": true }
  ],
  "selectedProcesses": [
    { "spaceId": "living", "processIds": ["FLOOR", "WALL"] },
    { "spaceId": "kitchen", "processIds": ["FLOOR", "WALL", "CABINET"] },
    { "spaceId": "bathroom", "processIds": ["FLOOR", "WALL", "TILE"] }
  ],
  "personalitySummary": {
    "organization_habit": 4,
    "lighting_preference": 5,
    "auditory_sensitivity": 4,
    "sensory_sensitivity": 4,
    "budget_sense": 3
  }
}
```

**확인 사항:**
- ✅ 응답이 정상적으로 반환됨
- ✅ `personalitySummary`가 견적에 반영되는지 확인
- ✅ 등급 조정이 적용되는지 확인 (`adjustGradeByPersonality`)

---

## 🧪 Step 2: 코드 레벨 테스트

### 테스트 2-1: personality-adapter.ts 테스트

**테스트 코드:**
```typescript
// 브라우저 콘솔 또는 테스트 파일에서
import { getRecommendedMaterialsFromDB } from '@/lib/db/adapters/personality-adapter';

const traitScores = {
  organization_habit: 4,
  lighting_preference: 5,
  auditory_sensitivity: 4,
  sensory_sensitivity: 4,
  budget_sense: 3
};

const recommendations = await getRecommendedMaterialsFromDB(traitScores);
console.log('추천 자재:', recommendations);
```

**예상 결과:**
- ✅ `recommendations` 배열이 반환됨
- ✅ `organization_habit: 4` → 수납 자재 추천 (2개)
- ✅ `lighting_preference: 5` → 조명 자재 추천 (1개)
- ✅ `auditory_sensitivity: 4` → 방음 자재 추천 (2개)

---

### 테스트 2-2: calculator-v3.ts 테스트

**테스트 코드:**
```typescript
import { calculateFullEstimateV3 } from '@/lib/estimate/calculator-v3';

const input = {
  py: 25,
  grade: 'STANDARD',
  personalitySummary: {
    organization_habit: 4,
    lighting_preference: 5,
    auditory_sensitivity: 4
  },
  // ... 기타 필수 필드
};

const result = await calculateFullEstimateV3(input);
console.log('견적 결과:', result);
console.log('등급 조정 확인:', result.grade); // 원본과 다를 수 있음
```

**확인 사항:**
- ✅ `personalitySummary`가 견적에 반영됨
- ✅ `adjustGradeByPersonality`가 작동하여 등급이 조정될 수 있음
- ✅ `applyPersonalityOptions`가 작동하여 옵션이 추가/변경될 수 있음

---

## 🧪 Step 3: 전체 플로우 테스트

### 테스트 3-1: 온보딩 → 성향 분석 → 견적

**단계별 확인:**

1. **온보딩 페이지** (`/onboarding/space-info`)
   - 평수, 주거형태 입력
   - ✅ Zustand store에 저장되는지 확인

2. **성향 분석 페이지** (`/onboarding/personality`)
   - 질문 답변
   - ✅ `answer_score_mapping`으로 점수 계산되는지 확인
   - ✅ 성향 분석 결과가 표시되는지 확인

3. **AI 추천 페이지** (`/onboarding/ai-recommendation`)
   - ✅ 성향 분석 결과 표시
   - ✅ `personality_materials` 기반 자재 추천 표시

4. **견적 페이지** (`/onboarding/estimate`)
   - ✅ `personalitySummary`가 견적에 반영되는지 확인
   - ✅ 등급 조정이 적용되는지 확인
   - ✅ 추천 자재가 견적에 포함되는지 확인

---

## 🐛 문제 해결

### 문제 1: 추천 자재가 나오지 않음

**원인:**
- `personality_materials`에 매핑이 부족
- `score_threshold`가 너무 높음
- `trait_id` 또는 `material_id` 참조 오류

**해결:**
```sql
-- 특정 성향의 매핑 확인
SELECT 
  pm.mapping_id,
  pt.trait_code,
  pt.trait_name,
  m.material_code,
  m.product_name,
  pm.score_threshold,
  pm.score_direction
FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
LEFT JOIN materials m ON pm.material_id = m.id
WHERE pt.trait_code = 'organization_habit';
```

---

### 문제 2: 견적에 성향이 반영되지 않음

**원인:**
- `personalitySummary`가 API 요청에 포함되지 않음
- `applyPersonalityOptions` 함수가 호출되지 않음

**해결:**
1. 브라우저 개발자 도구 → Network 탭
2. `/api/estimate/v3` 요청 확인
3. Request Payload에 `personalitySummary`가 있는지 확인
4. Response에서 등급 조정이 적용되었는지 확인

---

### 문제 3: 등급 조정이 작동하지 않음

**원인:**
- `grade_adjustment` 값이 잘못됨
- `adjustGradeByPersonality` 함수 로직 오류

**해결:**
```typescript
// calculator-v3.ts에서 확인
const adjustedGrade = adjustGradeByPersonality(
  input.grade,
  input.personalitySummary
);
console.log('원본 등급:', input.grade);
console.log('조정된 등급:', adjustedGrade);
```

---

## 📊 테스트 체크리스트

- [ ] API 엔드포인트 테스트 완료 (`/api/test-personality-system`)
- [ ] 견적 계산 API 테스트 완료 (`/api/estimate/v3` with `personalitySummary`)
- [ ] personality-adapter.ts 테스트 완료
- [ ] calculator-v3.ts 테스트 완료
- [ ] 전체 플로우 테스트 완료 (온보딩 → 견적)
- [ ] 추천 자재가 정상적으로 표시됨
- [ ] 성향이 견적에 반영됨
- [ ] 등급 조정이 적용됨

---

## 🎯 성공 기준

### 최소 기준 (현재 단계)

- ✅ `getRecommendedMaterialsFromDB`가 정상 작동
- ✅ `personalitySummary`가 견적 계산에 포함됨
- ✅ 추천 자재가 API 응답에 포함됨

### 권장 기준 (다음 단계)

- ⏳ 각 성향당 최소 3-5개 매핑
- ⏳ 전체 플로우 테스트 통과
- ⏳ 실제 사용자 테스트 진행

---

## 🚀 다음 단계

테스트 완료 후:

1. **문제 발견 시**: 문제 해결 후 재테스트
2. **정상 작동 시**: 추가 매핑 입력 또는 실제 사용자 테스트
3. **성능 이슈 시**: 캐싱 최적화 또는 쿼리 최적화

---

**테스트 중 문제가 발생하면 알려주세요!** 🎉

















