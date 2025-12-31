# V5 성향분석 엔진

인테리봇 성향분석 엔진 v5 명세서 기반 구현

## 📁 파일 구조

```
lib/analysis/v5/
├── types.ts                 # 타입 정의
├── hypothesis-generator.ts  # 가설 생성 함수
├── question-scorer.ts       # 질문 점수 계산
├── question-selector.ts      # 질문 선별
├── input-converter.ts       # SpaceInfo → BasicInfoInput 변환
└── index.ts                 # 메인 모듈

lib/data/
└── v5-question-bank.ts      # 18개 고정 질문 뱅크
```

## 🚀 사용 방법

### 기본 사용

```typescript
import { generateV5Questions } from '@/lib/analysis/v5'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'

const spaceInfo = useSpaceInfoStore.getState().spaceInfo
if (spaceInfo) {
  const result = generateV5Questions(spaceInfo)
  console.log('선별된 질문:', result.questions)
  console.log('가설 결과:', result.hypothesis)
}
```

### 단계별 사용

```typescript
import { generateHypothesis } from '@/lib/analysis/v5/hypothesis-generator'
import { selectTopQuestions } from '@/lib/analysis/v5/question-selector'
import { convertSpaceInfoToBasicInput } from '@/lib/analysis/v5/input-converter'

// 1. 입력 변환
const basicInput = convertSpaceInfoToBasicInput(spaceInfo)

// 2. 가설 생성
const hypothesis = generateHypothesis(basicInput)

// 3. 질문 선별
const questionIds = selectTopQuestions(hypothesis, 6)
```

## 📋 구현 완료 항목

### Phase 1 ✅

- [x] SpaceInfo 타입에 V5 필드 추가
- [x] 가설 생성 함수 구현
- [x] 18개 고정 질문 뱅크 구축
- [x] 질문 점수 계산 함수 구현
- [x] 질문 선별 함수 구현
- [x] 입력 변환 유틸리티 구현
- [x] 통합 모듈 구현

## 🔄 다음 단계 (Phase 2)

- [ ] 질문 노출 UI 수정
- [ ] 성향 태그 확정 함수
- [ ] 태그 → 공정 매핑
- [ ] 검증 함수 구현

## 📝 명세서 참조

- 명세서: `docs/V5_SPEC_ANALYSIS.md`
- 개선 점수: `docs/V5_IMPROVEMENT_SCORING.md`








