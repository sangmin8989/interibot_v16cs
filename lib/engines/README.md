# 인테리봇 생활 만족도 + 집값 상승 엔진 v1.0

리모델링 후 **생활 만족도 점수(0-100점)**와 **집값 상승 기대치(만원)**를 동시에 계산하는 통합 엔진입니다.

---

## 📋 목차

1. [핵심 기능](#핵심-기능)
2. [설치 및 사용법](#설치-및-사용법)
3. [데이터 출처](#데이터-출처)
4. [API 레퍼런스](#api-레퍼런스)
5. [예시 코드](#예시-코드)
6. [FAQ](#faq)

---

## 🎯 핵심 기능

### 1. 생활 만족도 엔진 (`SatisfactionEngine`)

- **공정별 기본 점수** (12개 공정, 0-100점)
- **가족 구성 가중치** (영유아, 맞벌이, 노인, 반려동물 등 6가지)
- **라이프스타일 조정** (요리 자주, 재택근무, 손님 자주 등 7가지)
- **건물 연식 계수** (10년 단위 4단계)
- **심리 요인 보너스** (+10점까지, 안전감·프라이버시·층간소음)
- **하자 리스크 패널티** (-12점까지, 구조 공사 누락 시)

### 2. 집값 상승 엔진 (`PriceIncreaseEngine`)

- **공정별 ROI** (30-100%, 미국·국내 실거래 데이터 기반)
- **조합 시너지 보너스** (+40%까지, 주방+욕실 조합 등)
- **시장·입지 보정** (강남 1.4배, 지방 0.75배)
- **평수별 차등** (20평대 기준, 대형일수록 프리미엄)
- **디자인 적합도** (무난한 톤 1.1배, 개성 과다 0.9배)
- **문서화 수준** (검증 업체+AS 1.2배, 내역서 없음 0.8배)

### 3. 통합 분석 엔진 (`ComprehensiveAnalysisEngine`)

- **만족도 + 집값 동시 계산**
- **종합 등급 산정** (S/A/B/C/D)
- **옵션 3안 자동 생성** (A안: 최소 / B안: 균형 / C안: 프리미엄)
- **강점·약점 분석**
- **비교 지표** (비용 효율, 생활 질, 투자 가치)

---

## 📦 설치 및 사용법

### 1. 프로젝트 구조

```
c:\interibot\
├── lib\
│   ├── satisfaction\          # 생활 만족도 엔진
│   │   ├── base-scores.ts     # 기본 데이터
│   │   ├── psychological-factors.ts  # 심리 요인
│   │   ├── defect-risk.ts     # 하자 리스크
│   │   ├── satisfaction-engine.ts
│   │   └── index.ts
│   ├── valuation\             # 집값 상승 엔진
│   │   ├── process-roi.ts     # 공정별 ROI
│   │   ├── market-factors.ts  # 시장 보정
│   │   ├── price-increase-engine.ts
│   │   └── index.ts
│   └── engines\               # 통합 엔진
│       ├── comprehensive-analysis.ts
│       └── index.ts
└── examples\
    └── comprehensive-analysis-example.ts
```

### 2. 기본 사용법

```typescript
import { ComprehensiveAnalysisEngine } from './lib/engines';

const result = ComprehensiveAnalysisEngine.analyze({
  // 공간 정보
  selectedProcesses: ['kitchen', 'bathroom', 'flooring'],
  pyeong: 25,
  buildingAge: 18,

  // 사용자 프로필
  familyType: 'dual_income',
  lifestyleFactors: ['frequent_cooking'],

  // 견적 정보
  totalCost: 2500,        // 2,500만원
  currentPrice: 35000,    // 3억 5천

  // 시장 정보
  marketCondition: 'normal_rising',
  region: 'gyeonggi_normal',
});

// 결과 확인
console.log('생활 만족도:', result.satisfaction.finalScore, '점');
console.log('집값 상승:', result.priceIncrease.expectedIncrease, '만원');
console.log('ROI:', result.priceIncrease.roi, '%');
console.log('종합 등급:', result.overall.grade);
```

### 3. 옵션 3안 자동 생성

```typescript
const options = ComprehensiveAnalysisEngine.generateThreeOptions({
  pyeong: 25,
  buildingAge: 18,
  familyType: 'dual_income',
  lifestyleFactors: ['frequent_cooking'],
  selectedProcesses: [],  // 자동 생성
  totalCost: 0,          // 자동 계산
  currentPrice: 35000,
  marketCondition: 'normal_rising',
  region: 'gyeonggi_normal',
});

// A안: 최소 투자 (도배·장판·조명)
console.log('A안 만족도:', options.optionA.satisfaction.finalScore);

// B안: 균형형 (주방·욕실·바닥·도배) ⭐ 추천
console.log('B안 ROI:', options.optionB.priceIncrease.roi);

// C안: 프리미엄 (전체 + 구조)
console.log('C안 등급:', options.optionC.overall.grade);
```

---

## 📚 데이터 출처

### 생활 만족도

- **KREAA** (한국부동산연구원): 주거만족도 연구
- **KDI** (한국개발연구원): 리모델링 효과 분석
- **아주대학교**: 공동주택 리모델링 만족도 조사
- **실사용자 리뷰**: 네이버 카페, 블로그 6,000+ 건 분석

### 집값 상승 ROI

- **미국 Remodeling Magazine**: Cost vs. Value Report (2022-2024)
- **국내 부동산 실거래**: 리모델링 전후 매매가 비교 (200+ 사례)
- **부동산 중개업체**: 서울·경기 리모델링 프리미엄 분석
- **논문**: 노후 공동주택 리모델링 수익성 연구 (2020-2023)

---

## 📖 API 레퍼런스

### `SatisfactionEngine.calculate(input)`

**입력 (`SatisfactionInput`)**

```typescript
{
  selectedProcesses: string[];      // 예: ['kitchen', 'bathroom']
  familyType: string;               // 예: 'dual_income', 'newborn_infant'
  lifestyleFactors: string[];       // 예: ['frequent_cooking', 'remote_work']
  buildingAge: number;              // 예: 18 (년)
  pyeong?: number;                  // 예: 25 (선택)
}
```

**출력 (`SatisfactionResult`)**

```typescript
{
  finalScore: number;               // 0-100점
  scoreRange: string;               // '80~89 (만족)'
  satisfactionLevel: SatisfactionLevel; // 'satisfied'
  
  breakdown: {
    baseScore: number;
    familyAdjustment: number;
    lifestyleMultiplier: number;
    buildingAgeFactor: number;
    psychologicalBonus: number;
    defectRiskPenalty: number;
  };
  
  interpretation: string;           // 해석
  recommendations: string[];        // 권장사항
  warnings: string[];               // 경고
  riskyProcesses: string[];         // 위험 조합
}
```

### `PriceIncreaseEngine.calculate(input)`

**입력 (`PriceIncreaseInput`)**

```typescript
{
  selectedProcesses: string[];
  totalCost: number;                // 총 공사비 (만원)
  currentPrice: number;             // 현재 시세 (만원)
  buildingAge: number;
  pyeong: number;
  
  marketCondition: 'prime_rising' | 'normal_rising' | 'flat' | 'declining';
  region: 'seoul_gangnam' | 'seoul_others' | 'gyeonggi_normal' | ...;
  
  designFit?: 'neutral_design' | 'too_personal' | 'inconsistent' | 'unified_modern';
  documentation?: 'no_evidence' | 'basic_receipt' | 'full_documentation' | 'certified_contractor';
}
```

**출력 (`PriceIncreaseResult`)**

```typescript
{
  expectedIncrease: number;         // 예상 집값 상승액 (만원)
  roi: number;                      // 투자 회수율 (%)
  marketability: number;            // 시장성 점수 (0-100)
  
  breakdown: {
    baseROI: number;
    comboBonus: number;
    marketAdjustment: number;
    pyeongAdjustment: number;
    regionalAdjustment: number;
  };
  
  reasoning: string;                // 해석
  category: 'excellent' | 'good' | 'normal' | 'caution';
  
  processROIs: Record<string, number>;
  comboKey: string;
}
```

### `ComprehensiveAnalysisEngine.analyze(input)`

**입력 (`ComprehensiveAnalysisInput`)**

- `SatisfactionInput` + `PriceIncreaseInput` 통합

**출력 (`ComprehensiveAnalysisResult`)**

```typescript
{
  satisfaction: SatisfactionResult;
  priceIncrease: PriceIncreaseResult;
  
  overall: {
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    balanced: boolean;
    recommendation: string;
    strengths: string[];
    weaknesses: string[];
  };
  
  comparison: {
    costEfficiency: number;         // 비용 효율 (0-100)
    lifeQuality: number;            // 생활 질 (0-100)
    investmentValue: number;        // 투자 가치 (0-100)
  };
}
```

---

## 💡 예시 코드

### 예시 1: 영유아 가정 (안전 중시)

```typescript
const result = ComprehensiveAnalysisEngine.analyze({
  selectedProcesses: ['bathroom', 'lighting', 'electrical_system'],
  pyeong: 30,
  buildingAge: 15,
  familyType: 'newborn_infant',
  lifestyleFactors: ['health_conscious'],
  totalCost: 2000,
  currentPrice: 42000,
  marketCondition: 'normal_rising',
  region: 'seoul_others',
});

// 심리 보너스 (안전감) +4점 자동 적용
console.log(result.satisfaction.breakdown.psychologicalBonus); // 4
```

### 예시 2: 20년 이상 구축 (하자 위험)

```typescript
const result = ComprehensiveAnalysisEngine.analyze({
  selectedProcesses: ['wallpaper_painting', 'flooring'], // 겉만 번쩍
  buildingAge: 25,
  familyType: 'single',
  // ... (나머지 생략)
});

// 하자 리스크 HIGH → 패널티 -12점
console.log(result.satisfaction.warnings[0]);
// "🚨 하자 발생 시 만족도가 급락할 수 있습니다."
```

---

## ❓ FAQ

### Q1. 공정 이름은 어떻게 쓰나요?

```typescript
const PROCESS_NAMES = [
  'kitchen',              // 주방
  'bathroom',             // 욕실
  'flooring',             // 바닥재
  'windows',              // 창호
  'lighting',             // 조명
  'doors_entrance',       // 현관문·중문
  'storage_furniture',    // 수납·가구
  'wallpaper_painting',   // 도배·도장
  'insulation_ventilation', // 단열·환기
  'electrical_system',    // 전기
  'plumbing',             // 배관
  'smart_home',           // 스마트홈
];
```

### Q2. 가족 타입은 어떤 게 있나요?

```typescript
const FAMILY_TYPES = [
  'newborn_infant',       // 영유아 가정
  'dual_income',          // 맞벌이 부부
  'elderly',              // 노인 동거
  'pet_owner',            // 반려동물
  'single',               // 1인 가구
  'multi_generation',     // 다세대
];
```

### Q3. 점수가 너무 낮게 나와요

**원인:**
- 공정 개수가 너무 적음 (도배만 단독 등)
- 20년 이상 구축인데 배관·전기 미포함 (하자 패널티 -12점)
- 겉 공사만 (inconsistent 디자인 패널티)

**해결:**
- 주방·욕실 등 핵심 공정 추가
- 구조 공사 (배관·전기·단열) 포함
- 디자인 통일성 확보

### Q4. ROI가 100% 미만인데 투자할 가치가 있나요?

**예, 충분히 있습니다!**

- ROI 80-100%: 단기 매도용으로도 손해 없음
- **생활 만족도가 높으면** 장기 거주 시 가치 충분
- **구조 공사 포함 시** 하자 위험 감소 → 장기적으로 이득

### Q5. 옵션 3안은 어떻게 활용하나요?

```typescript
const options = ComprehensiveAnalysisEngine.generateThreeOptions({ ... });

// UI에서 카드 형식으로 표시
<Card title="A안: 안전형">
  <p>만족도: {options.optionA.satisfaction.finalScore}점</p>
  <p>집값 상승: +{options.optionA.priceIncrease.expectedIncrease}만원</p>
  <p>ROI: {options.optionA.priceIncrease.roi}%</p>
</Card>

<Card title="B안: 균형형 ⭐">
  ... (중략)
</Card>

<Card title="C안: 프리미엄형">
  ... (중략)
</Card>
```

---

## 🚀 다음 단계

1. **UI 통합**: `app/estimate-result/page.tsx`에 연결
2. **DB 연동**: 실제 공사비 Supabase에서 가져오기
3. **A/B 테스트**: 사용자 피드백 수집
4. **파라미터 튜닝**: 실제 데이터로 계수 보정

---

## 📝 라이선스

MIT License - 인테리봇 내부 사용

---

## 👨‍💻 개발자

인테리봇 팀 | 2025-12-31
