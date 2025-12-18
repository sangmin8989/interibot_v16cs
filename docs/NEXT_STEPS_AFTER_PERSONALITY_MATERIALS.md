# personality_materials 입력 완료 후 다음 단계

## ✅ 완료된 작업

- [x] `personality_traits` 데이터 입력 (16개)
- [x] `answer_score_mapping` 데이터 입력 (154개)
- [x] `personality_materials` 데이터 입력 (완료)

---

## 🔍 Step 1: 입력 데이터 검증

### 실행할 쿼리

`docs/VERIFY_PERSONALITY_MATERIALS.sql` 파일을 Supabase SQL Editor에서 실행하세요.

**확인할 항목:**
1. 총 매핑 개수
2. 성향별 매핑 개수 (모든 성향이 매핑되었는지)
3. 자재별 매핑 개수
4. 데이터 무결성 (참조 오류 없음)
5. 성향별 커버리지 (각 성향당 최소 3-5개 매핑 권장)

---

## 🧪 Step 2: 기능 테스트

### 2-1. API 엔드포인트 테스트

#### 테스트 1: 성향 점수 → 자재 추천

```bash
# 브라우저 또는 Postman에서
GET http://localhost:3000/api/test-personality-system
```

**예상 결과:**
- `getAnswerScoreMappingFromDB`: ✅ 성공
- `getTraitScoresFromAnswers`: ✅ 성공
- `getRecommendedMaterialsFromDB`: ✅ 성공 (입력한 매핑 데이터 반환)

#### 테스트 2: 견적 계산에 성향 반영

```bash
POST http://localhost:3000/api/estimate/v3
Content-Type: application/json

{
  "py": 25,
  "grade": "STANDARD",
  "personalitySummary": {
    "organization_habit": 4,
    "lighting_preference": 5,
    "budget_sense": 3
  },
  ...
}
```

**확인 사항:**
- `personalitySummary`가 견적에 반영되는지
- 등급 조정(`grade_adjustment`)이 적용되는지
- 추천 자재가 반영되는지

---

## 🔧 Step 3: 코드 통합 확인

### 3-1. personality-adapter.ts 확인

`lib/db/adapters/personality-adapter.ts` 파일이 제대로 작동하는지 확인:

```typescript
// 테스트 코드
import { getRecommendedMaterialsFromDB } from '@/lib/db/adapters/personality-adapter';

const traitScores = {
  organization_habit: 4,
  lighting_preference: 5,
  budget_sense: 3
};

const recommendations = await getRecommendedMaterialsFromDB(traitScores);
console.log('추천 자재:', recommendations);
```

### 3-2. calculator-v3.ts 확인

`lib/estimate/calculator-v3.ts`의 `applyPersonalityOptions` 함수가 제대로 작동하는지 확인:

```typescript
// personalitySummary가 견적에 반영되는지 확인
const input: EstimateInputV3 = {
  py: 25,
  grade: 'STANDARD',
  personalitySummary: {
    organization_habit: 4,
    lighting_preference: 5
  },
  ...
};

const result = await calculateFullEstimateV3(input);
// result에서 personalitySummary가 반영되었는지 확인
```

---

## 📊 Step 4: 전체 플로우 테스트

### 온보딩 → 성향 분석 → 견적 계산 전체 흐름

1. **온보딩 페이지** (`/onboarding/space-info`)
   - 평수, 주거형태 입력

2. **성향 분석 페이지** (`/onboarding/personality`)
   - 질문 답변
   - `answer_score_mapping`으로 점수 계산

3. **AI 추천 페이지** (`/onboarding/ai-recommendation`)
   - 성향 분석 결과 표시
   - `personality_materials` 기반 자재 추천

4. **견적 페이지** (`/onboarding/estimate`)
   - `personalitySummary`가 견적에 반영
   - 등급 조정, 옵션 추가 등 확인

---

## 🐛 Step 5: 문제 해결

### 문제 1: 추천 자재가 나오지 않음

**원인:**
- `personality_materials`에 매핑이 부족
- `score_threshold`가 너무 높음
- `trait_id` 또는 `material_id` 참조 오류

**해결:**
```sql
-- 매핑 개수 확인
SELECT COUNT(*) FROM personality_materials WHERE is_active = true;

-- 특정 성향의 매핑 확인
SELECT * FROM personality_materials pm
JOIN personality_traits pt ON pm.trait_id = pt.trait_id
WHERE pt.trait_code = 'organization_habit';
```

### 문제 2: 견적에 성향이 반영되지 않음

**원인:**
- `personalitySummary`가 API 요청에 포함되지 않음
- `applyPersonalityOptions` 함수가 호출되지 않음

**해결:**
- 브라우저 개발자 도구에서 API 요청 확인
- `lib/estimate/calculator-v3.ts`의 로그 확인

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

## 📈 Step 6: 데이터 확장 계획

### 단기 (1주일 내)

- [ ] 각 성향당 최소 5개 매핑 확보
- [ ] 주요 자재 카테고리별 매핑 완료
- [ ] 우선순위 높은 매핑 (priority >= 80) 20개 이상

### 중기 (1개월 내)

- [ ] 모든 성향(16개) × 주요 자재 매핑 완료
- [ ] 공정별(`phase_id`) 매핑 추가
- [ ] 추천 이유 템플릿 다양화

### 장기 (3개월 내)

- [ ] A/B 테스트를 통한 매핑 효과 검증
- [ ] 고객 피드백 기반 매핑 개선
- [ ] 자동화된 매핑 추천 시스템 구축

---

## 🎯 성공 기준

### 최소 기준 (현재 단계)

- ✅ `personality_materials` 데이터 입력 완료
- ✅ 각 성향당 최소 1개 이상 매핑
- ✅ 데이터 무결성 검증 통과
- ✅ API 엔드포인트 정상 작동

### 권장 기준 (다음 단계)

- ⏳ 각 성향당 최소 3-5개 매핑
- ⏳ 주요 자재 카테고리별 매핑 완료
- ⏳ 전체 플로우 테스트 통과
- ⏳ 실제 사용자 테스트 진행

---

## 📝 체크리스트

입력 완료 후 다음 항목을 확인하세요:

- [ ] `VERIFY_PERSONALITY_MATERIALS.sql` 실행 완료
- [ ] 데이터 무결성 검증 통과
- [ ] 성향별 커버리지 확인 (각 성향당 최소 1개 이상)
- [ ] API 엔드포인트 테스트 완료
- [ ] 견적 계산에 성향 반영 확인
- [ ] 전체 플로우 테스트 완료

---

## 🚀 다음 단계

입력 데이터 검증이 완료되면:

1. **기능 테스트 진행** (`/api/test-personality-system`)
2. **전체 플로우 테스트** (온보딩 → 견적)
3. **실제 사용자 테스트** (베타 테스트)
4. **데이터 확장** (추가 매핑 입력)

---

**문의사항이나 문제가 있으면 알려주세요!** 🎉
















