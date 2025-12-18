# 인테리봇 성향분석 엔진 DB 설계서 비교 분석 보고서

**작성일**: 2025년 12월 16일  
**목적**: 제공된 DB 설계서와 현재 인테리봇 로직 비교 분석  
**작성자**: AI Assistant

---

## 📋 목차

1. [전체 구조 비교](#1-전체-구조-비교)
2. [성향 분석 시스템 비교](#2-성향-분석-시스템-비교)
3. [자재 매핑 시스템 비교](#3-자재-매핑-시스템-비교)
4. [평형 처리 비교](#4-평형-처리-비교)
5. [연식 처리 비교](#5-연식-처리-비교)
6. [예산 기준점 비교](#6-예산-기준점-비교)
7. [경고/리스크 시스템 비교](#7-경고리스크-시스템-비교)
8. [가족 구성/연령 처리 비교](#8-가족-구성연령-처리-비교)
9. [종합 평가 및 권장사항](#9-종합-평가-및-권장사항)

---

## 1. 전체 구조 비교

### 1.1 현재 인테리봇 구조

```
현재 시스템:
├── 성향 분석: 15개 카테고리 점수 시스템 (1-10점)
│   ├── personality_traits (DB)
│   ├── answer_score_mapping (DB)
│   └── answer-mappings.ts (파일 기반 fallback)
├── 자재 매핑: personality_materials (DB)
│   └── 점수 threshold 기반 필터링
├── 평형 처리: 간단한 카테고리 분류 (소형/중형/대형)
├── 연식 처리: 간단한 분류 (new/semi-new/old)
├── 예산 처리: 범위 기반 등급 추천
└── 리스크 처리: RiskEngine 하드코딩 규칙
```

### 1.2 제공된 설계서 구조

```
제안 시스템:
├── 성향 분석: personality_types (카테고리별 분류)
│   ├── lifestyle, decision, budget, style, family, pain_point 등
│   └── 하이브리드 방식 (DB + AI 해석)
├── 자재 매핑: personality_material_mapping
│   └── 키워드 기반 검색
├── 평형 처리: pyeong_characteristics (상세 특성)
├── 연식 처리: building_age_risks (하자 정보)
├── 예산 처리: budget_benchmarks (평형별 기준)
├── 경고 시스템: warning_templates (템플릿 기반)
└── 추가 테이블: age_preferences, family_needs, noise_solutions
```

### 1.3 주요 차이점

| 항목 | 현재 시스템 | 제안 시스템 | 차이점 |
|------|------------|------------|--------|
| **성향 구조** | 점수 기반 (1-10) | 타입 기반 (카테고리) | 접근 방식 완전히 다름 |
| **자재 매핑** | 점수 threshold | 키워드 검색 | 매핑 방식 다름 |
| **평형 처리** | 단순 분류 | 상세 특성 DB | 제안이 훨씬 상세함 |
| **연식 처리** | 단순 분류 | 하자 정보 DB | 제안이 훨씬 상세함 |
| **경고 시스템** | 하드코딩 | 템플릿 DB | 제안이 유연함 |

---

## 2. 성향 분석 시스템 비교

### 2.1 현재 시스템

**구조:**
- `personality_traits` 테이블: 15개 성향 항목 (trait_code, trait_name)
- `answer_score_mapping` 테이블: 답변 → 점수 매핑
- 점수 범위: 1-10점 (실제로는 1-5점도 사용)
- 카테고리: space_sense, sensory_sensitivity, cleaning_preference 등

**특징:**
- ✅ 점수 기반으로 정량적 분석 가능
- ✅ DB 기반 매핑 (USE_DB_PERSONALITY 플래그)
- ✅ 파일 기반 fallback 지원
- ❌ 성향 타입 분류가 없음 (예: "재택근무형", "요리형" 등)
- ❌ 카테고리별 그룹화가 약함

**코드 위치:**
- `lib/analysis/engine.ts` - buildPreferenceScores()
- `lib/db/adapters/personality-adapter.ts` - getTraitScoresFromAnswers()

### 2.2 제안 시스템

**구조:**
- `personality_types` 테이블: 타입 기반 분류
- 카테고리: lifestyle, decision, budget, style, family, pain_point, personality, participation
- 예시: 'lifestyle_remote', 'decision_solo', 'budget_strict' 등

**특징:**
- ✅ 직관적인 타입 분류 (예: "재택근무형")
- ✅ 카테고리별 그룹화 명확
- ✅ 하이브리드 방식 (DB + AI 해석)
- ❌ 점수 기반 정량 분석이 약함
- ❌ 현재 시스템과 호환성 낮음

### 2.3 비교 분석

**장단점:**

| 측면 | 현재 시스템 | 제안 시스템 |
|------|------------|------------|
| **정량 분석** | ✅ 우수 (점수 기반) | ⚠️ 제한적 (타입 기반) |
| **직관성** | ⚠️ 낮음 (점수만 봄) | ✅ 우수 (타입명으로 이해) |
| **확장성** | ✅ 우수 (점수 추가만) | ⚠️ 타입 추가 필요 |
| **AI 활용** | ⚠️ 제한적 | ✅ 하이브리드 방식 |
| **호환성** | ✅ 기존 시스템 유지 | ❌ 대규모 마이그레이션 필요 |

**권장사항:**
1. **하이브리드 접근**: 현재 점수 시스템 유지 + 타입 분류 추가
2. **매핑 테이블 추가**: 점수 → 타입 매핑 테이블 생성
3. **점진적 도입**: 기존 시스템 유지하면서 타입 분류를 보조 정보로 활용

---

## 3. 자재 매핑 시스템 비교

### 3.1 현재 시스템

**구조:**
- `personality_materials` 테이블
- 매핑 방식: trait_id + score_threshold + score_direction
- 필터링: 점수가 threshold 이상/이하/같음인지 확인
- 추천 타입: upgrade, downgrade, must, optional

**특징:**
- ✅ 정확한 점수 기반 필터링
- ✅ 공정별 필터링 지원 (phase_id)
- ✅ 등급 조정 지원 (grade_adjustment)
- ✅ 우선순위 정렬 (priority)
- ❌ 키워드 검색 불가
- ❌ 조건부 매핑 제한적 (condition_json 없음)

**코드 위치:**
- `lib/db/adapters/personality-adapter.ts` - getRecommendedMaterialsFromDB()
- `docs/supabase-schema-personality.sql` - personality_materials 테이블

**예시 쿼리:**
```typescript
// 점수가 7 이상이면 추천
WHERE score_threshold = 7 AND score_direction = 'gte'
```

### 3.2 제안 시스템

**구조:**
- `personality_material_mapping` 테이블
- 매핑 방식: personality_type_code + recommended_keywords
- 검색: 키워드 배열로 자재 DB 검색
- 조건: condition_json (연령, 예산 등 추가 조건)

**특징:**
- ✅ 키워드 기반 유연한 검색
- ✅ 조건부 매핑 (condition_json)
- ✅ 추천/회피 키워드 분리
- ❌ 점수 기반 정확도 낮음
- ❌ 키워드 매칭이 부정확할 수 있음

**예시:**
```sql
-- 키워드로 자재 검색
WHERE search_keywords && ARRAY['강마루', 'SPC', 'PVC']
```

### 3.3 비교 분석

**장단점:**

| 측면 | 현재 시스템 | 제안 시스템 |
|------|------------|------------|
| **정확도** | ✅ 우수 (점수 기반) | ⚠️ 키워드 매칭 의존 |
| **유연성** | ⚠️ 제한적 | ✅ 키워드로 확장 용이 |
| **성능** | ✅ 우수 (인덱스 활용) | ⚠️ 키워드 검색 비용 |
| **조건부 매핑** | ❌ 없음 | ✅ condition_json 지원 |
| **회피 자재** | ❌ 없음 | ✅ avoid_keywords 지원 |

**권장사항:**
1. **하이브리드 방식**: 점수 기반 + 키워드 보조
2. **현재 시스템 확장**: condition_json, avoid_keywords 필드 추가
3. **키워드 검색 보조**: 점수 매칭 실패 시 키워드로 fallback

---

## 4. 평형 처리 비교

### 4.1 현재 시스템

**구조:**
- `lib/analysis/color-recommendation.ts` - getPyeongCategory()
- 분류: 소형(≤20), 중형(≤40), 대형(>40)
- 처리: 간단한 if-else 분기

**특징:**
- ✅ 단순하고 빠름
- ❌ 평형별 특성 정보 없음
- ❌ 공통 레이아웃 정보 없음
- ❌ 불편 요소 정보 없음
- ❌ 리모델링 우선순위 정보 없음

**코드:**
```typescript
export function getPyeongCategory(pyeong: number): '소형' | '중형' | '대형' {
  if (pyeong <= 20) return '소형'
  if (pyeong <= 40) return '중형'
  return '대형'
}
```

### 4.2 제안 시스템

**구조:**
- `pyeong_characteristics` 테이블
- 필드: pyeong_range, common_layout, room_count, bathroom_count, pain_points, reno_priorities, tips
- 평형별 상세 정보: 24평, 32평, 43평, 49평

**특징:**
- ✅ 평형별 상세 특성 정보
- ✅ 공통 레이아웃 정보
- ✅ 불편 요소 배열 (JSONB)
- ✅ 리모델링 우선순위 배열
- ✅ 팁 정보 제공
- ❌ DB 조회 필요 (성능 고려)

**예시 데이터:**
```sql
-- 24평 특성
INSERT INTO pyeong_characteristics VALUES
('24', '3베이, 거실-주방 분리형 또는 LDK', '3개', '1~2개',
 '["주방이 길고 좁아 동선 답답", "작은방 두 개가 진짜 작음"]',
 '["거실-주방 LDK화로 체감 면적 확대", "작은방 용도 확정"]',
 ARRAY['LDK형으로 바꾸면 체감 면적 크게 증가']);
```

### 4.3 비교 분석

**장단점:**

| 측면 | 현재 시스템 | 제안 시스템 |
|------|------------|------------|
| **상세도** | ❌ 매우 낮음 | ✅ 매우 상세 |
| **실용성** | ⚠️ 제한적 | ✅ 높음 (불편 요소, 우선순위) |
| **성능** | ✅ 즉시 | ⚠️ DB 조회 필요 |
| **확장성** | ❌ 하드코딩 | ✅ DB 추가만 |

**권장사항:**
1. **즉시 도입 권장**: 평형별 특성 테이블은 매우 유용함
2. **캐싱 고려**: 자주 조회되므로 캐싱 적용
3. **현재 시스템 확장**: getPyeongCategory() 함수에서 DB 조회 추가

---

## 5. 연식 처리 비교

### 5.1 현재 시스템

**구조:**
- `lib/analysis/engine-v3.1-core/config/mapping-rules.ts` - HARD_INPUT_MAPPING_RULES
- 분류: new(≤5년), semi-new(≤15년), old(>15년)
- 처리: 간단한 분기로 needs 레벨 조정

**특징:**
- ✅ 단순하고 빠름
- ❌ 연식별 하자 정보 없음
- ❌ 확률 정보 없음
- ❌ 비용 영향 정보 없음
- ❌ 경고 문구 없음

**코드:**
```typescript
if (hard.building.age === 'old') {
  mappings: [
    { needsId: 'durability', level: 'high', ... },
    { needsId: 'maintenance', level: 'mid', ... }
  ]
}
```

### 5.2 제안 시스템

**구조:**
- `building_age_risks` 테이블
- 필드: age_range, priority, risk_category, risk_items, probability_range, cost_impact, must_check, warning_text
- 연식별 상세 하자 정보: 0-10년, 10-20년, 20-30년, 30년+

**특징:**
- ✅ 연식별 상세 하자 정보
- ✅ 확률 정보 (높음, 매우높음 등)
- ✅ 비용 영향 정보 (+20%, +30-60% 등)
- ✅ 필수 체크 항목 (must_check)
- ✅ 경고 문구 제공
- ❌ DB 조회 필요

**예시 데이터:**
```sql
-- 20-30년 연식 하자
INSERT INTO building_age_risks VALUES
('20-30', 1, '구조/설비 안전',
 ARRAY['슬래브/기둥/보 균열', '전기설비 피복 노후'],
 '높음', '+25~40%', TRUE,
 '20년 이상은 구조 안전 점검이 필요합니다');
```

### 5.3 비교 분석

**장단점:**

| 측면 | 현재 시스템 | 제안 시스템 |
|------|------------|------------|
| **상세도** | ❌ 매우 낮음 | ✅ 매우 상세 |
| **실용성** | ⚠️ 제한적 | ✅ 높음 (하자, 비용 정보) |
| **경고 기능** | ❌ 없음 | ✅ 경고 문구 제공 |
| **확장성** | ❌ 하드코딩 | ✅ DB 추가만 |

**권장사항:**
1. **즉시 도입 권장**: 연식별 하자 정보는 매우 중요함
2. **현재 시스템 확장**: HARD_INPUT_MAPPING_RULES에서 DB 조회 추가
3. **경고 시스템 연동**: RiskEngine과 연동하여 경고 표시

---

## 6. 예산 기준점 비교

### 6.1 현재 시스템

**구조:**
- `lib/data/budget-options.ts` - BUDGET_OPTIONS
- 범위: unknown, under2000, range2000_4000, range4000_6000, over6000
- 등급 추천: basic, standard, argen, premium
- 평형별 구분 없음

**특징:**
- ✅ 단순하고 명확
- ✅ 등급 추천 제공
- ❌ 평형별 기준 없음
- ❌ 포함/제외 항목 정보 없음
- ❌ 경고 임계값 없음

**코드:**
```typescript
export const BUDGET_OPTIONS: BudgetOption[] = [
  { id: 'under2000', maxAmount: 2000, recommendedGrade: 'basic' },
  { id: 'range2000_4000', minAmount: 2000, maxAmount: 4000, recommendedGrade: 'standard' },
  ...
]
```

### 6.2 제안 시스템

**구조:**
- `budget_benchmarks` 테이블
- 필드: pyeong_range, grade, grade_name_ko, min_budget, max_budget, included_items, excluded_items, warning_threshold, warning_message
- 평형별 상세 기준: 24평, 32평, 43평, 49평 × 등급별

**특징:**
- ✅ 평형별 상세 기준
- ✅ 포함/제외 항목 배열
- ✅ 경고 임계값 및 메시지
- ✅ 등급별 명확한 기준
- ❌ DB 조회 필요

**예시 데이터:**
```sql
-- 32평 표준형
INSERT INTO budget_benchmarks VALUES
('32', 'standard', '표준형', 4000, 5500,
 ARRAY['도배', '바닥', '욕실2개', '주방', '일부 샷시'],
 ARRAY['전면 샷시', '시스템에어컨'],
 NULL, NULL);
```

### 6.3 비교 분석

**장단점:**

| 측면 | 현재 시스템 | 제안 시스템 |
|------|------------|------------|
| **평형별 구분** | ❌ 없음 | ✅ 상세함 |
| **포함 항목** | ❌ 없음 | ✅ 명확함 |
| **경고 기능** | ❌ 없음 | ✅ 임계값 기반 |
| **단순성** | ✅ 매우 단순 | ⚠️ 복잡함 |

**권장사항:**
1. **도입 권장**: 평형별 예산 기준은 매우 유용함
2. **현재 시스템 확장**: budget-options.ts에서 평형별 기준 조회 추가
3. **경고 시스템 연동**: 예산이 warning_threshold 이하일 때 경고 표시

---

## 7. 경고/리스크 시스템 비교

### 7.1 현재 시스템

**구조:**
- `lib/analysis/engine-v3/engines/RiskEngine.ts`
- 리스크 타입: current, future, missing
- 리스크 레벨: high, medium, low
- 리스크 타이밍: immediate, short_term, mid_term, long_term
- 처리: 하드코딩된 규칙

**특징:**
- ✅ 3단계 리스크 분류
- ✅ 우선순위 정렬
- ❌ 하드코딩된 규칙 (확장 어려움)
- ❌ 템플릿 시스템 없음
- ❌ 연구 기반 데이터 없음

**코드 예시:**
```typescript
// 하드코딩된 리스크
if (adjustedIndicators.수납중요도 >= 70) {
  risks.push({
    id: 'storage_shortage',
    type: 'current',
    title: '수납 공간 부족 위험',
    ...
  })
}
```

### 7.2 제안 시스템

**구조:**
- `risk_factors` 테이블: 후회 위험 데이터
- `warning_templates` 테이블: 경고 문구 템플릿
- 필드: probability, trigger_conditions, consequence, timeframe, remediation_cost, research_source

**특징:**
- ✅ DB 기반 템플릿 시스템
- ✅ 연구 기반 데이터 (확률, 비용)
- ✅ 트리거 조건 (JSONB)
- ✅ 심각도 분류 (info, caution, warning, critical)
- ✅ 제안 문구 제공
- ❌ 현재 RiskEngine과 구조 다름

**예시 데이터:**
```sql
-- 트렌드 과다 위험
INSERT INTO risk_factors VALUES
('trend_overuse', '트렌드 과다', 42,
 '{"style_preference": "trendy", "age_group": ["20대", "30대"]}',
 '스타일 피로, 올드해 보임', '2년', '500~1000만원',
 '미국 소비자 조사 2020');
```

### 7.3 비교 분석

**장단점:**

| 측면 | 현재 시스템 | 제안 시스템 |
|------|------------|------------|
| **유연성** | ❌ 하드코딩 | ✅ DB 템플릿 |
| **연구 기반** | ❌ 없음 | ✅ 확률, 비용 정보 |
| **확장성** | ❌ 코드 수정 필요 | ✅ DB 추가만 |
| **구조** | ✅ 3단계 분류 | ⚠️ 다른 구조 |

**권장사항:**
1. **하이브리드 접근**: 현재 RiskEngine 유지 + warning_templates 보조
2. **템플릿 시스템 도입**: 하드코딩된 메시지를 템플릿으로 전환
3. **연구 데이터 활용**: risk_factors의 확률, 비용 정보를 RiskEngine에 반영

---

## 8. 가족 구성/연령 처리 비교

### 8.1 현재 시스템

**구조:**
- `lib/analysis/engine.ts` - calculateFamilyScoreFromSpaceInfo()
- `lib/analysis/engine-v3.1-core/config/mapping-rules.ts` - SOFT_INPUT_MAPPING_RULES
- 처리: 간단한 점수 조정 및 needs 매핑

**특징:**
- ✅ 가족 구성 점수 계산
- ✅ 영유아/노인/반려동물 needs 매핑
- ❌ 연령별 선호 정보 없음
- ❌ 가족 구성별 상세 니즈 정보 없음
- ❌ 위험 항목/필수 항목 정보 없음

**코드 예시:**
```typescript
if (ageRanges?.includes('senior')) {
  score = Math.max(score, 8);
}
```

### 8.2 제안 시스템

**구조:**
- `age_preferences` 테이블: 연령별 선호
- `family_needs` 테이블: 가족 구성별 니즈
- 필드: style_keywords, priority_spaces, material_preferences, danger_items, required_items, avoid_materials

**특징:**
- ✅ 연령별 상세 선호 정보
- ✅ 가족 구성별 위험/필수/회피 항목
- ✅ 추천 자재 정보
- ✅ 우선순위 공간 정보
- ❌ DB 조회 필요

**예시 데이터:**
```sql
-- 영유아 가족 니즈
INSERT INTO family_needs VALUES
('영유아(0-3세)',
 ARRAY['날카로운 모서리', '문틈 끼임', '미끄러운 바닥'],
 ARRAY['코너 보호대', '손끼임 방지', '미끄럼 방지 바닥'],
 ARRAY['논슬립 바닥재', '충격 완충 매트'],
 ARRAY['유리 테이블', '날카로운 금속 몰딩'],
 ARRAY['안방-욕실-수납 동선', '아이방 근접성'],
 '안방에서 아이방, 욕실이 가까운 동선이 핵심');
```

### 8.3 비교 분석

**장단점:**

| 측면 | 현재 시스템 | 제안 시스템 |
|------|------------|------------|
| **상세도** | ⚠️ 기본적 | ✅ 매우 상세 |
| **안전 정보** | ❌ 없음 | ✅ 위험/필수 항목 |
| **자재 추천** | ⚠️ 제한적 | ✅ 구체적 키워드 |
| **확장성** | ❌ 하드코딩 | ✅ DB 추가만 |

**권장사항:**
1. **즉시 도입 권장**: 가족 구성별 니즈 정보는 매우 중요함
2. **현재 시스템 확장**: SOFT_INPUT_MAPPING_RULES에서 DB 조회 추가
3. **안전 정보 활용**: danger_items, required_items를 RiskEngine에 반영

---

## 9. 종합 평가 및 권장사항

### 9.1 전체 평가

**현재 시스템 강점:**
- ✅ 점수 기반 정량 분석 시스템
- ✅ DB 기반 자재 매핑 (점수 threshold)
- ✅ 단순하고 빠른 처리
- ✅ 기존 시스템 안정성

**제안 시스템 강점:**
- ✅ 상세한 평형/연식/가족 구성 정보
- ✅ DB 기반 템플릿 시스템 (확장 용이)
- ✅ 연구 기반 데이터 (확률, 비용)
- ✅ 키워드 기반 유연한 검색

**주요 차이점:**
1. **성향 분석**: 점수 vs 타입 (근본적 차이)
2. **자재 매핑**: 점수 threshold vs 키워드 검색
3. **정보 상세도**: 제안 시스템이 훨씬 상세함

### 9.2 권장 도입 순서

#### Phase 1: 즉시 도입 (높은 가치, 낮은 리스크)

1. **pyeong_characteristics 테이블**
   - 평형별 특성 정보는 매우 유용
   - 현재 시스템과 독립적으로 사용 가능
   - 영향: 높음, 리스크: 낮음

2. **building_age_risks 테이블**
   - 연식별 하자 정보는 필수
   - RiskEngine과 연동하여 경고 표시
   - 영향: 높음, 리스크: 낮음

3. **family_needs 테이블**
   - 가족 구성별 니즈 정보는 중요
   - SOFT_INPUT_MAPPING_RULES 확장
   - 영향: 높음, 리스크: 낮음

4. **age_preferences 테이블**
   - 연령별 선호 정보는 유용
   - 자재 추천에 활용
   - 영향: 중간, 리스크: 낮음

#### Phase 2: 점진적 도입 (중간 가치, 중간 리스크)

5. **budget_benchmarks 테이블**
   - 평형별 예산 기준은 유용
   - 현재 budget-options.ts 확장
   - 영향: 중간, 리스크: 중간

6. **warning_templates 테이블**
   - 템플릿 시스템은 유연함
   - RiskEngine 메시지를 템플릿으로 전환
   - 영향: 중간, 리스크: 중간

7. **risk_factors 테이블**
   - 연구 기반 데이터는 가치 있음
   - RiskEngine에 확률, 비용 정보 반영
   - 영향: 중간, 리스크: 중간

#### Phase 3: 신중한 검토 (높은 가치, 높은 리스크)

8. **personality_types 테이블**
   - 타입 기반 분류는 직관적
   - 하지만 현재 점수 시스템과 충돌
   - 권장: 하이브리드 접근 (점수 + 타입 보조)

9. **personality_material_mapping 테이블**
   - 키워드 기반 검색은 유연함
   - 하지만 현재 점수 기반 시스템과 다름
   - 권장: 현재 시스템 확장 (condition_json, avoid_keywords 추가)

10. **noise_solutions 테이블**
    - 층간소음 해결 정보는 유용
    - 하지만 현재 시스템에 통합 필요
    - 영향: 낮음, 리스크: 중간

### 9.3 구체적 구현 방안

#### 방안 1: 하이브리드 접근 (권장)

**원칙:**
- 현재 점수 시스템 유지
- 제안 시스템을 보조 정보로 활용
- 점진적 통합

**구현:**
1. Phase 1 테이블들 즉시 도입
2. 현재 시스템에 DB 조회 추가
3. 점수 기반 분석 + 상세 정보 보조

**예시:**
```typescript
// 현재: 점수만 사용
if (scores.family_composition >= 7) { ... }

// 개선: 점수 + DB 정보
const familyInfo = await getFamilyNeeds(spaceInfo.familyType);
if (scores.family_composition >= 7 || familyInfo.required_items.length > 0) {
  // familyInfo의 danger_items, required_items 활용
}
```

#### 방안 2: 완전 전환 (비권장)

**원칙:**
- 제안 시스템으로 완전 전환
- 현재 시스템 폐기

**문제점:**
- 대규모 마이그레이션 필요
- 기존 데이터 호환성 문제
- 높은 리스크

### 9.4 최종 권장사항

1. **즉시 도입 (Phase 1)**
   - pyeong_characteristics
   - building_age_risks
   - family_needs
   - age_preferences

2. **현재 시스템 확장**
   - personality_materials에 condition_json, avoid_keywords 추가
   - RiskEngine에 warning_templates 연동
   - budget-options.ts에 평형별 기준 추가

3. **하이브리드 접근**
   - 점수 시스템 유지 + 타입 분류 보조
   - 점수 기반 자재 매핑 + 키워드 검색 보조

4. **점진적 통합**
   - 기존 시스템 안정성 유지
   - 새 기능을 보조 정보로 활용
   - 사용자 피드백 수집 후 확대

---

## 10. 결론

제공된 DB 설계서는 **현재 인테리봇 시스템을 크게 보완할 수 있는 상세한 정보**를 제공합니다. 특히 **평형, 연식, 가족 구성** 관련 정보는 즉시 도입할 가치가 높습니다.

다만, **성향 분석과 자재 매핑** 부분은 현재 시스템과 근본적으로 다른 접근 방식을 사용하므로, **하이브리드 접근**을 통해 점진적으로 통합하는 것이 안전합니다.

**핵심 권장사항:**
- ✅ Phase 1 테이블들 즉시 도입
- ✅ 현재 시스템 유지 + 보조 정보로 활용
- ✅ 점진적 통합으로 리스크 최소화

---

**작성 완료일**: 2025년 12월 16일  
**다음 단계**: Phase 1 테이블 생성 및 통합 작업




