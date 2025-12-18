# V3.1 Core Edition - README

## 📌 개요

**V3.1 Core Edition**은 인테리봇 분석 엔진의 차세대 버전으로, **Needs 기반 추론 시스템**을 도입한 혁신적인 아키텍처입니다.

### 핵심 철학

> **"성향 → 공정" 직접 매핑이 아닌**  
> **"성향 → Needs → 공정" 3단계 레이어 구조**

이를 통해:
- ✅ **설명 가능한 AI** (Explainable AI)
- ✅ **확장 가능한 구조** (Scalable Architecture)
- ✅ **유지보수 용이성** (Maintainability)

---

## 🎯 Phase 1-4 구현 완료 (현재 단계)

### ✅ 구현된 기능

1. **Input Layer** - 고객 입력 정규화
   - `CoreInput`: SoftInput + HardInput + Budget + Rooms
   - `InputAdapter`: V3 → V3.1 Core 변환

2. **Needs Layer** - 6개 Core Needs 계산
   - `NeedsEngineCore`: 매핑 규칙 기반 Needs 자동 도출
   - 6개 Core Needs:
     - 안전성 강화 (Safety)
     - 수납 강화 (Storage)
     - 동선 최적화 (Flow)
     - 내구성 강화 (Durability)
     - 청소/관리 편의성 (Maintenance)
     - 채광·밝기 향상 (Brightness)

3. **Resolution Layer** - Needs 충돌 해결
   - `ResolutionEngine`: 충돌 감지 및 해결
   - 우선순위 자동 조정 (안전 > 생활 > 감성)
   - 예산/평형 기반 Needs 조정

4. **Action Layer** - 공정/옵션 자동 추천
   - `ActionEngine`: Needs → 공정 매핑
   - 21개 공정 정의 (욕실 8 + 거실 5 + 주방 6 + 기타 2)
   - 추천 이유 자동 생성
   - 4단계 설명 구조

### 🔜 향후 구현 (Phase 5)

5. **Integration & Documentation**
   - V3 엔진과 통합 테스트
   - 전체 문서화
   - Extended Edition 설계

---

## 📂 디렉토리 구조

```
lib/analysis/engine-v3.1-core/
├── types/
│   ├── input.ts          # Input Layer 타입 (CoreInput)
│   ├── needs.ts          # Needs Layer 타입 (NeedsResult)
│   ├── resolution.ts     # Resolution Layer 타입 (향후)
│   └── action.ts         # Action Layer 타입 (향후)
├── config/
│   ├── scope.ts          # Core Edition 범위 설정 (20-34평 아파트)
│   ├── needs-definitions.ts  # 6개 Core Needs 정의
│   └── mapping-rules.ts  # Trait → Needs 매핑 규칙
├── engines/
│   ├── InputAdapter.ts   # V3 → V3.1 변환 어댑터
│   ├── NeedsEngineCore.ts  # Needs 계산 엔진
│   ├── ResolutionEngine.ts  # Needs 충돌 해결 엔진
│   └── ActionEngine.ts   # 공정/옵션 추천 엔진
├── test.ts               # 테스트 케이스 5개
└── index.ts              # V3.1 Core 진입점
```

---

## 🚀 사용법

### 1. V3.1 Core 엔진 실행

```typescript
import { V31CoreEngine } from '@/lib/analysis/engine-v3.1-core';
import { V3Engine } from '@/lib/analysis/engine-v3';

// V3 엔진 실행 (기존)
const v3Engine = new V3Engine();
const v3Input = { /* ... */ };
const v3Result = await v3Engine.analyze(v3Input);

// V3.1 Core 엔진 실행 (병렬)
const v31Engine = new V31CoreEngine();
const v31Result = v31Engine.analyze(v3Input, v3Result.traitResult);

console.log('V3.1 Needs:', v31Result.needsResult?.needs);
```

### 2. 테스트 실행

```bash
npx ts-node lib/analysis/engine-v3.1-core/test.ts
```

---

## 📊 Core Edition 제한사항

### 범위

- **평형**: 20~34평
- **주거 형태**: 아파트만
- **거주 상태**: 거주 중인 세대만
- **공간**: 전체 공간 (우선순위: 욕실 > 거실 > 주방)
- **Needs**: 6개 Core Needs만

### 확장 가능성

구조는 다음을 지원할 수 있도록 설계됨:
- 평형 확대 (20~80평)
- 다른 주거 형태 (빌라, 오피스텔 등)
- 추가 Needs (방음, 아이 공간, 반려동물, 작업 공간 등)

**확장 시에는 설정 파일만 수정하면 됨** (코드 수정 최소화)

---

## 🧪 테스트 케이스

5개의 실제 시나리오 기반 테스트:

1. **영유아 + 수납 스트레스 + 구축 20년**
   - 예상 Needs: 안전성↑, 수납↑, 내구성↑

2. **반려견 + 청소 스트레스**
   - 예상 Needs: 내구성↑, 관리 편의성↑

3. **재택근무 + 채광 불만**
   - 예상 Needs: 동선↑, 채광↑

4. **요리 자주 + 기름 요리 많음**
   - 예상 Needs: 동선↑, 관리 편의성↑

5. **고령 부모 동거 + 안전 우려**
   - 예상 Needs: 안전성↑, 관리 편의성↑

---

## 🔧 매핑 규칙 커스터마이징

매핑 규칙은 `config/mapping-rules.ts`에서 관리됩니다.

### 예시: 새로운 규칙 추가

```typescript
// config/mapping-rules.ts
export const SOFT_INPUT_MAPPING_RULES = {
  family: {
    hasPet: [
      {
        description: '반려동물 있을 시 내구성 및 청소 편의성 중요',
        check: 'soft.family.hasPet === true',
        mappings: [
          {
            needsId: 'durability',
            level: 'high',
            source: 'explicit',
            reason: '반려동물로 인한 긁힘 및 마모 대응 필요',
          },
        ],
      },
    ],
  },
};
```

---

## 📈 성능

- **실행 시간**: ~30-50ms (Phase 1-4 전체)
  - Input: ~5ms
  - Needs: ~10-20ms
  - Resolution: ~5-10ms
  - Action: ~10-15ms
- **메모리**: 경량 (타입 안정성 유지)
- **확장성**: 설정 기반 매핑으로 O(n) 복잡도 유지

---

## 🛣️ 로드맵

### ✅ Phase 1-4 (완료)
- Input Layer + Adapter
- Needs Layer (Core 6개)
- Resolution Layer (충돌 해결)
- Action Layer (공정 추천)

### 🔜 Phase 5 (다음 단계)
- V3 엔진과 통합 테스트
- 전체 문서화
- Extended Edition 설계

---

## 📝 참고 문서

- [V3 Engine 분석 보고서](../../../docs/V3_ENGINE_FINAL_INTEGRATED_REVIEW.md)
- [V3.1 Core Edition 최종 기술 명세서](../../../docs/V31_CORE_EDITION_SPEC.md) (작성 예정)

---

## 🤝 기여

V3.1 Core Edition은 인테리봇의 핵심 엔진입니다.  
매핑 규칙 개선, 테스트 케이스 추가 등 기여를 환영합니다!

---

**Made with ❤️ by ARGEN INTERIBOT Team**

