# 인테리봇 AI 로직 업그레이드 계획 검토 보고서

## 📋 문서 정보
- **작성일**: 2025년 1월
- **검토 대상**: 성향 기준표 연동 설계 v2
- **현재 버전**: V2 엔진
- **제안 버전**: V3 엔진 (성향 기준표 기반)

---

## 1. 실행 요약 (Executive Summary)

### 1.1 검토 결과
✅ **전반적으로 우수한 설계** - 현재 코드베이스와 호환 가능하며, 장기적 유지보수성과 안정성을 크게 향상시킬 것으로 예상됩니다.

### 1.2 핵심 평가
- **구현 가능성**: ⭐⭐⭐⭐⭐ (5/5) - 높음
- **현재 구조 호환성**: ⭐⭐⭐⭐ (4/5) - 양호
- **기대 효과**: ⭐⭐⭐⭐⭐ (5/5) - 매우 높음
- **구현 난이도**: ⭐⭐⭐ (3/5) - 중간

### 1.3 주요 권장사항
1. ✅ **즉시 진행 권장**: 설계 방향성은 매우 적절함
2. ⚠️ **점진적 마이그레이션**: 기존 V2 엔진과 병행 운영 후 전환
3. 📝 **추가 개선 제안**: 아래 상세 섹션 참조

---

## 2. 현재 코드베이스 분석

### 2.1 기존 구조 현황

#### 2.1.1 성향 분석 관련 파일
```
lib/analysis/
├── engine.ts              # V1 엔진 (레거시)
├── engine-v2.ts           # V2 엔진 (현재 사용 중)
├── answer-mappings.ts     # 답변→점수 매핑 테이블 ✅
├── styleMatchingEngine.ts # 스타일 매칭 로직 ✅
├── ai-analyzer.ts         # AI 분석기
└── types.ts               # 타입 정의
```

#### 2.1.2 데이터 파일
```
lib/data/
├── trait-weights.json     # 성향 가중치 매트릭스 ✅
└── spaceStyleOptions.json # 스타일 옵션
```

### 2.2 기존 구조의 강점
✅ **이미 구현된 부분**:
- `answer-mappings.ts`: 답변→점수 매핑 로직 존재
- `trait-weights.json`: 성향 가중치 매트릭스 존재
- `engine-v2.ts`: 규칙 기반 엔진 구조 존재
- `styleMatchingEngine.ts`: 스타일 매칭 로직 존재

✅ **재사용 가능한 코드**:
- 질문-답변 매핑 로직
- 성향 점수 계산 로직
- 스타일 추천 로직

### 2.3 기존 구조의 한계
❌ **개선이 필요한 부분**:
1. **하드코딩된 로직**: `engine-v2.ts`에 답변 효과가 하드코딩됨
2. **분산된 데이터**: 기준표가 여러 파일에 분산되어 있음
3. **AI 의존도 높음**: 규칙 기반 판단보다 AI 자유 해석에 의존
4. **유지보수 어려움**: 기준표 수정 시 코드 수정 필요

---

## 3. 제안된 설계 상세 검토

### 3.1 디렉토리 구조 설계

#### 3.1.1 제안된 구조
```
/lib
  /traits
    성향기준표.json
    성향지표_점수표.json
    성향→공정매핑.json
    성향→스타일매핑.json
    성향→예산매핑.json
    성향→리스크감지.json

  /analysis
    /engine
      성향지표계산기.ts
      공정추천엔진.ts
      스타일추천엔진.ts
      예산추천엔진.ts
      리스크감지엔진.ts
      분석결과통합기.ts

    /services
      성향질문정규화.ts
      기준표로직적용기.ts
      AI보조서술생성.ts
      JSON보정기.ts
      기본분석Fallback.ts
```

#### 3.1.2 검토 의견
✅ **장점**:
- 명확한 책임 분리 (Separation of Concerns)
- JSON 기반으로 Cursor AI가 이해하기 쉬움
- 모듈 단위 테스트 용이
- 기능별 독립적 수정 가능

⚠️ **개선 제안**:
1. **파일명 한글 → 영문 변환 권장**
   - 이유: Git diff, 코드 검색, IDE 지원 향상
   - 예: `성향기준표.json` → `trait-criteria.json`

2. **타입 정의 파일 추가**
   - `lib/traits/types.ts`: JSON 스키마 타입 정의
   - TypeScript 타입 안정성 확보

3. **버전 관리 파일 추가**
   - `lib/traits/version.json`: 기준표 버전 정보
   - 마이그레이션 전략 수립 가능

---

### 3.2 기준표 저장 방식 설계

#### 3.2.1 제안된 구조
```json
{
  "질문ID": {
    "선택지": {
      "답변값": {
        "의미": "해석",
        "영향지표": ["지표1+", "지표2-"],
        "추가태그": ["tag1", "tag2"]
      }
    }
  }
}
```

#### 3.2.2 검토 의견
✅ **장점**:
- 구조가 명확하고 이해하기 쉬움
- JSON으로 Cursor가 자동 생성 가능
- 확장 가능한 구조

⚠️ **개선 제안**:
1. **스키마 검증 추가**
   ```typescript
   // lib/traits/schema-validator.ts
   import Ajv from 'ajv'
   const validateTraitCriteria = (data: unknown) => {
     // JSON Schema 검증
   }
   ```

2. **가중치 명시적 표현**
   ```json
   {
     "영향지표": [
       { "지표": "수납중요도", "변화량": +15, "가중치": 1.0 },
       { "지표": "조명취향", "변화량": +10, "가중치": 0.8 }
     ]
   }
   ```

3. **버전 호환성 관리**
   ```json
   {
     "version": "2.0.0",
     "last_updated": "2025-01-XX",
     "criteria": { ... }
   }
   ```

---

### 3.3 분석 엔진 V3 구조 설계

#### 3.3.1 제안된 흐름
```
1단계: 질문정규화
2단계: 기준표 매핑 적용
3단계: 성향지표 점수 계산
4단계: 공정·스타일·예산 추천
5단계: 리스크 감지
6단계: 엔진 결과 통합
7단계: AI에 전달 (서술화)
8단계: JSON 정규화 후 UI 전달
```

#### 3.3.2 검토 의견
✅ **장점**:
- 단계별 명확한 책임 분리
- 각 단계 독립적 테스트 가능
- 디버깅 용이 (단계별 로그)

⚠️ **개선 제안**:
1. **에러 처리 전략 명시**
   ```typescript
   // 각 단계에서 에러 발생 시
   try {
     const result = await step1()
   } catch (error) {
     // 폴백 로직 또는 부분 결과 반환
   }
   ```

2. **캐싱 전략 추가**
   ```typescript
   // 동일한 입력에 대한 재계산 방지
   const cacheKey = hashInput(input)
   if (cache.has(cacheKey)) return cache.get(cacheKey)
   ```

3. **성능 모니터링**
   ```typescript
   // 각 단계별 실행 시간 측정
   const timings = {
     normalization: 0,
     mapping: 0,
     calculation: 0,
     // ...
   }
   ```

---

### 3.4 AI 서술 보조 구조 설계

#### 3.4.1 제안된 접근
- AI는 "결정"이 아닌 "서술"만 담당
- 규칙 기반 엔진 결과를 받아 자연어로 변환

#### 3.4.2 검토 의견
✅ **매우 우수한 접근**:
- AI 자유 해석 최소화 → 안정성 향상
- 규칙 기반 판단 → 일관성 확보
- AI는 스토리텔링만 담당 → 비용 절감

⚠️ **추가 고려사항**:
1. **프롬프트 템플릿 관리**
   ```typescript
   // lib/analysis/services/prompt-templates.ts
   export const PROMPT_TEMPLATES = {
     summary: (indicators) => `...`,
     recommendation: (processes) => `...`,
     risk: (risks) => `...`
   }
   ```

2. **AI 응답 검증**
   ```typescript
   // AI 응답이 규칙 기반 결과와 일치하는지 검증
   const validateAIResponse = (aiResponse, engineResult) => {
     // 핵심 추천이 일치하는지 확인
   }
   ```

---

## 4. 현재 구조와의 호환성 분석

### 4.1 마이그레이션 전략

#### 4.1.1 단계별 전환 계획
```
Phase 1: V3 엔진 개발 (기존 V2와 병행)
  ├─ 새로운 디렉토리 구조 생성
  ├─ 기준표 JSON 파일 작성
  └─ V3 엔진 모듈 개발

Phase 2: 점진적 전환
  ├─ Feature Flag로 V2/V3 선택 가능
  ├─ A/B 테스트로 결과 비교
  └─ 버그 수정 및 최적화

Phase 3: 완전 전환
  ├─ V2 엔진 Deprecated 표시
  ├─ 모든 API가 V3 사용
  └─ V2 코드 제거 (선택적)
```

#### 4.1.2 호환성 유지 방안
✅ **기존 API 인터페이스 유지**:
```typescript
// 기존 API 응답 형식 그대로 유지
export interface AnalysisResult {
  analysisId: string
  mode: AnalysisMode
  summary: string
  preferences: PreferenceScores
  // ... 기존 필드 유지
}
```

✅ **점진적 데이터 마이그레이션**:
```typescript
// 기존 answer-mappings.ts 데이터를 JSON으로 변환
// 기존 trait-weights.json 재사용
```

---

### 4.2 기존 코드 재사용 방안

#### 4.2.1 재사용 가능한 모듈
| 기존 파일 | 재사용 방안 | 비고 |
|---------|-----------|------|
| `answer-mappings.ts` | JSON 변환 후 재사용 | 기준표 JSON 생성 시 참고 |
| `trait-weights.json` | 그대로 재사용 | 공정 매핑에 활용 |
| `styleMatchingEngine.ts` | 로직 추출 후 재사용 | 스타일 추천 엔진에 활용 |
| `engine-v2.ts` | 로직 참고 | V3 설계 시 참고용 |

#### 4.2.2 신규 개발 필요 모듈
- ✅ 기준표 JSON 파일 (신규 작성)
- ✅ 성향지표 계산기 (기존 로직 개선)
- ✅ 리스크 감지 엔진 (신규)
- ✅ AI 보조 서술 생성기 (기존 프롬프트 개선)

---

## 5. 구현 난이도 및 일정 추정

### 5.1 작업 분류

#### 5.1.1 낮은 난이도 (1-2일)
- ✅ 디렉토리 구조 생성
- ✅ 기준표 JSON 파일 작성 (기존 데이터 변환)
- ✅ 타입 정의 파일 작성

#### 5.1.2 중간 난이도 (3-5일)
- ⚠️ 성향지표 계산기 구현
- ⚠️ 공정/스타일/예산 추천 엔진 구현
- ⚠️ 질문 정규화 서비스 구현

#### 5.1.3 높은 난이도 (5-7일)
- 🔴 리스크 감지 엔진 구현 (신규 로직)
- 🔴 분석 결과 통합기 구현
- 🔴 AI 보조 서술 생성기 구현
- 🔴 테스트 및 디버깅

### 5.2 예상 총 일정
- **최소**: 2주 (전담 개발자 1명 기준)
- **권장**: 3-4주 (테스트 및 최적화 포함)
- **안전**: 6주 (버퍼 포함)

---

## 6. 기대 효과 분석

### 6.1 정량적 효과

#### 6.1.1 성향 분석 정확도
- **현재**: AI 자유 해석 → 일관성 낮음
- **개선 후**: 규칙 기반 판단 → 일관성 높음
- **예상 향상**: 정확도 20-30% 향상 예상

#### 6.1.2 응답 시간
- **현재**: AI API 호출 2-3회 → 느림
- **개선 후**: 규칙 기반 계산 + AI 1회 → 빠름
- **예상 향상**: 응답 시간 40-50% 단축

#### 6.1.3 비용 절감
- **현재**: AI API 호출 다수 → 높은 비용
- **개선 후**: AI API 호출 최소화 → 낮은 비용
- **예상 절감**: API 비용 50-60% 절감

### 6.2 정성적 효과

#### 6.2.1 개발 생산성
- ✅ 기준표 수정 시 코드 수정 불필요
- ✅ 모듈 단위 테스트 용이
- ✅ 버그 추적 및 수정 용이

#### 6.2.2 유지보수성
- ✅ JSON 기반으로 비개발자도 수정 가능
- ✅ 버전 관리 및 롤백 용이
- ✅ 문서화 자동화 가능

#### 6.2.3 확장성
- ✅ 새로운 질문 추가 용이
- ✅ 새로운 성향 지표 추가 용이
- ✅ 다른 AI 모델로 교체 용이

---

## 7. 리스크 및 대응 방안

### 7.1 기술적 리스크

#### 7.1.1 리스크: 기존 기능 회귀
- **확률**: 중간
- **영향**: 높음
- **대응**: 
  - Feature Flag로 점진적 전환
  - A/B 테스트로 결과 비교
  - 롤백 계획 수립

#### 7.1.2 리스크: 성능 저하
- **확률**: 낮음
- **영향**: 중간
- **대응**:
  - 성능 벤치마크 테스트
  - 캐싱 전략 도입
  - 비동기 처리 최적화

#### 7.1.3 리스크: 데이터 불일치
- **확률**: 중간
- **영향**: 높음
- **대응**:
  - 스키마 검증 로직 추가
  - 마이그레이션 스크립트 작성
  - 데이터 검증 테스트

### 7.2 비즈니스 리스크

#### 7.2.1 리스크: 고객 경험 저하
- **확률**: 낮음
- **영향**: 매우 높음
- **대응**:
  - 점진적 롤아웃
  - 사용자 피드백 수집
  - 빠른 롤백 가능성 확보

---

## 8. 개선 제안사항

### 8.1 즉시 반영 권장

#### 8.1.1 파일명 영문화
```diff
- 성향기준표.json
+ trait-criteria.json

- 성향지표_점수표.json
+ trait-score-table.json

- 성향→공정매핑.json
+ trait-process-mapping.json
```

**이유**: Git diff, 코드 검색, IDE 지원 향상

#### 8.1.2 타입 정의 추가
```typescript
// lib/traits/types.ts
export interface TraitCriteria {
  version: string
  questions: Record<string, QuestionCriteria>
}

export interface QuestionCriteria {
  questionId: string
  options: Record<string, OptionEffect>
}

export interface OptionEffect {
  meaning: string
  impactIndicators: ImpactIndicator[]
  tags?: string[]
}
```

#### 8.1.3 스키마 검증 추가
```typescript
// lib/traits/schema-validator.ts
import Ajv from 'ajv'
import traitCriteriaSchema from './schemas/trait-criteria.schema.json'

export function validateTraitCriteria(data: unknown): boolean {
  const ajv = new Ajv()
  const validate = ajv.compile(traitCriteriaSchema)
  return validate(data)
}
```

### 8.2 단계적 개선 제안

#### 8.2.1 캐싱 전략
```typescript
// lib/analysis/services/cache-manager.ts
export class AnalysisCache {
  private cache = new Map<string, AnalysisResult>()
  
  getCacheKey(input: AnalysisRequest): string {
    return hashObject(input)
  }
  
  get(key: string): AnalysisResult | null {
    return this.cache.get(key) || null
  }
  
  set(key: string, result: AnalysisResult): void {
    this.cache.set(key, result)
  }
}
```

#### 8.2.2 모니터링 및 로깅
```typescript
// lib/analysis/services/analytics.ts
export class AnalysisAnalytics {
  logStep(step: string, duration: number, input?: any): void {
    console.log(`[${step}] ${duration}ms`, input)
    // 추후 분석 플랫폼 연동
  }
  
  trackError(error: Error, context: any): void {
    // 에러 추적 시스템 연동
  }
}
```

#### 8.2.3 테스트 전략
```typescript
// __tests__/analysis/engine-v3.test.ts
describe('Engine V3', () => {
  it('should calculate trait scores correctly', () => {
    // 기준표 기반 점수 계산 테스트
  })
  
  it('should recommend processes based on traits', () => {
    // 공정 추천 테스트
  })
  
  it('should detect risks correctly', () => {
    // 리스크 감지 테스트
  })
})
```

---

## 9. 구현 우선순위

### 9.1 Phase 1: 기반 구축 (1주)
1. ✅ 디렉토리 구조 생성
2. ✅ 기준표 JSON 파일 작성 (기존 데이터 변환)
3. ✅ 타입 정의 파일 작성
4. ✅ 스키마 검증 로직 추가

### 9.2 Phase 2: 핵심 엔진 개발 (2주)
1. ⚠️ 성향지표 계산기 구현
2. ⚠️ 질문 정규화 서비스 구현
3. ⚠️ 기준표 로직 적용기 구현
4. ⚠️ 공정/스타일/예산 추천 엔진 구현

### 9.3 Phase 3: 고급 기능 (1주)
1. 🔴 리스크 감지 엔진 구현
2. 🔴 분석 결과 통합기 구현
3. 🔴 AI 보조 서술 생성기 구현

### 9.4 Phase 4: 통합 및 테스트 (1주)
1. 🔴 V2와 V3 병행 운영
2. 🔴 A/B 테스트
3. 🔴 버그 수정 및 최적화
4. 🔴 문서화

---

## 10. 최종 권장사항

### 10.1 즉시 진행 권장 ✅
제안된 설계는 **현재 코드베이스와 호환 가능**하며, **장기적 유지보수성과 안정성을 크게 향상**시킬 것으로 예상됩니다.

### 10.2 구현 전략
1. **점진적 마이그레이션**: V2와 V3 병행 운영
2. **Feature Flag**: 안전한 전환을 위한 토글
3. **A/B 테스트**: 결과 비교 및 검증
4. **롤백 계획**: 문제 발생 시 즉시 복구

### 10.3 추가 고려사항
1. **문서화**: 기준표 작성 가이드라인 필요
2. **교육**: 팀원 대상 V3 구조 교육
3. **모니터링**: 성능 및 에러 모니터링 시스템 구축

---

## 11. 결론

### 11.1 종합 평가
제안된 **성향 기준표 연동 설계 v2**는 현재 인테리봇 AI 분석 시스템의 **안정성, 일관성, 유지보수성**을 크게 향상시킬 수 있는 우수한 설계입니다.

### 11.2 핵심 강점
- ✅ 규칙 기반 판단으로 AI 자유 해석 최소화
- ✅ JSON 기반 기준표로 유지보수 용이
- ✅ 모듈화된 구조로 확장성 확보
- ✅ 기존 코드와 호환 가능한 마이그레이션 전략

### 11.3 최종 의견
**즉시 진행을 권장**하며, 위에 제시한 개선 제안사항을 반영하여 구현하면 더욱 견고한 시스템이 될 것입니다.

---

## 📝 부록

### A. 참고 파일 목록
- `lib/analysis/engine-v2.ts`: 현재 V2 엔진
- `lib/analysis/answer-mappings.ts`: 답변 매핑 테이블
- `lib/data/trait-weights.json`: 성향 가중치 매트릭스
- `docs/AI_ANALYSIS_LOGIC_REPORT.md`: 현재 시스템 분석 보고서

### B. 관련 문서
- [인테리봇 AI 분석 전체 로직 보고서](./AI_ANALYSIS_LOGIC_REPORT.md)
- [성향 기준표 v1.0 설계서](./TRAIT_CRITERIA_V1.md) (작성 필요)

---

**작성자**: AI Assistant  
**검토일**: 2025년 1월  
**버전**: 1.0





























