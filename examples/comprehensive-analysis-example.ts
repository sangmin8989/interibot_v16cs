/**
 * 인테리봇 생활 만족도 + 집값 상승 엔진 사용 예시
 * 
 * 실전 사용법과 결과 해석
 */

import { ComprehensiveAnalysisEngine } from '../lib/engines';

// ========================================
// 예시 1: 기본 사용법
// ========================================

console.log('=== 예시 1: 기본 분석 ===\n');

const basicAnalysis = ComprehensiveAnalysisEngine.analyze({
  // 공간 정보
  selectedProcesses: ['kitchen', 'bathroom', 'flooring'],
  pyeong: 25,
  buildingAge: 18,

  // 사용자 프로필
  familyType: 'dual_income', // 맞벌이 부부
  lifestyleFactors: ['frequent_cooking'], // 요리 자주

  // 견적 정보
  totalCost: 2500, // 2,500만원
  currentPrice: 35000, // 3억 5천

  // 시장 정보
  marketCondition: 'normal_rising',
  region: 'gyeonggi_normal',
  
  // 디자인·문서화
  designFit: 'neutral_design',
  documentation: 'full_documentation',
});

console.log('📊 생활 만족도:', basicAnalysis.satisfaction.finalScore, '점');
console.log('   - 등급:', basicAnalysis.satisfaction.scoreRange);
console.log('   - 해석:', basicAnalysis.satisfaction.interpretation);
console.log('   - 심리 보너스:', basicAnalysis.satisfaction.breakdown.psychologicalBonus, '점');
console.log('   - 하자 패널티:', basicAnalysis.satisfaction.breakdown.defectRiskPenalty, '점');

console.log('\n💰 집값 상승 예측:', basicAnalysis.priceIncrease.expectedIncrease, '만원');
console.log('   - ROI:', basicAnalysis.priceIncrease.roi, '%');
console.log('   - 시장성:', basicAnalysis.priceIncrease.marketability, '점');
console.log('   - 평가:', basicAnalysis.priceIncrease.reasoning);

console.log('\n🏆 종합 판정');
console.log('   - 등급:', basicAnalysis.overall.grade);
console.log('   - 균형:', basicAnalysis.overall.balanced ? '✅ 균형있음' : '⚠️ 불균형');
console.log('   - 추천:', basicAnalysis.overall.recommendation);

console.log('\n📈 비교 지표');
console.log('   - 비용 효율:', basicAnalysis.comparison.costEfficiency, '점');
console.log('   - 생활 질:', basicAnalysis.comparison.lifeQuality, '점');
console.log('   - 투자 가치:', basicAnalysis.comparison.investmentValue, '점');

// ========================================
// 예시 2: 옵션 3안 자동 생성 (A/B/C)
// ========================================

console.log('\n\n=== 예시 2: 옵션 3안 자동 생성 ===\n');

const threeOptions = ComprehensiveAnalysisEngine.generateThreeOptions({
  pyeong: 25,
  buildingAge: 18,
  familyType: 'dual_income',
  lifestyleFactors: ['frequent_cooking', 'remote_work'],
  selectedProcesses: [], // 자동 생성
  totalCost: 0, // 자동 계산
  currentPrice: 35000,
  marketCondition: 'normal_rising',
  region: 'gyeonggi_normal',
});

console.log('┌─────────────────────────────────────┐');
console.log('│  A안: 안전형 (최소 투자)           │');
console.log('└─────────────────────────────────────┘');
console.log('공정: 도배·장판·조명');
console.log('견적: 1,200만원');
console.log('만족도:', threeOptions.optionA.satisfaction.finalScore, '점');
console.log('집값 상승:', threeOptions.optionA.priceIncrease.expectedIncrease, '만원');
console.log('ROI:', threeOptions.optionA.priceIncrease.roi, '%');
console.log('등급:', threeOptions.optionA.overall.grade);
console.log('추천:', threeOptions.optionA.overall.recommendation);

console.log('\n┌─────────────────────────────────────┐');
console.log('│  B안: 균형형 (추천) ⭐              │');
console.log('└─────────────────────────────────────┘');
console.log('공정: 주방·욕실·바닥·도배');
console.log('견적: 2,500만원');
console.log('만족도:', threeOptions.optionB.satisfaction.finalScore, '점');
console.log('집값 상승:', threeOptions.optionB.priceIncrease.expectedIncrease, '만원');
console.log('ROI:', threeOptions.optionB.priceIncrease.roi, '%');
console.log('등급:', threeOptions.optionB.overall.grade);
console.log('추천:', threeOptions.optionB.overall.recommendation);

console.log('\n┌─────────────────────────────────────┐');
console.log('│  C안: 프리미엄형 (장기 거주)       │');
console.log('└─────────────────────────────────────┘');
console.log('공정: 주방·욕실·바닥·도배·배관·창호·조명');
console.log('견적: 4,500만원');
console.log('만족도:', threeOptions.optionC.satisfaction.finalScore, '점');
console.log('집값 상승:', threeOptions.optionC.priceIncrease.expectedIncrease, '만원');
console.log('ROI:', threeOptions.optionC.priceIncrease.roi, '%');
console.log('등급:', threeOptions.optionC.overall.grade);
console.log('추천:', threeOptions.optionC.overall.recommendation);

// ========================================
// 예시 3: 영유아 가정 (안전 중시)
// ========================================

console.log('\n\n=== 예시 3: 영유아 가정 (안전 중시) ===\n');

const infantFamily = ComprehensiveAnalysisEngine.analyze({
  selectedProcesses: [
    'bathroom',
    'flooring',
    'lighting',
    'electrical_system',
    'insulation_ventilation',
  ],
  pyeong: 30,
  buildingAge: 15,
  familyType: 'newborn_infant',
  lifestyleFactors: ['health_conscious'],
  totalCost: 3000,
  currentPrice: 42000,
  marketCondition: 'normal_rising',
  region: 'seoul_others',
  designFit: 'neutral_design',
  documentation: 'certified_contractor',
});

console.log('📊 생활 만족도:', infantFamily.satisfaction.finalScore, '점');
console.log('   - 심리 보너스 (안전감):', infantFamily.satisfaction.breakdown.psychologicalBonus, '점');
console.log('\n💰 집값 상승:', infantFamily.priceIncrease.expectedIncrease, '만원');
console.log('   - ROI:', infantFamily.priceIncrease.roi, '%');
console.log('\n🏆 종합 등급:', infantFamily.overall.grade);
console.log('강점:', infantFamily.overall.strengths.join(' / '));
console.log('추천:', infantFamily.overall.recommendation);

// ========================================
// 예시 4: 노후 아파트 (구조 공사 포함)
// ========================================

console.log('\n\n=== 예시 4: 노후 아파트 (구조 공사 필수) ===\n');

const oldApartment = ComprehensiveAnalysisEngine.analyze({
  selectedProcesses: [
    'kitchen',
    'bathroom',
    'plumbing',
    'electrical_system',
    'windows',
    'flooring',
  ],
  pyeong: 22,
  buildingAge: 28,
  familyType: 'elderly',
  lifestyleFactors: [],
  totalCost: 4200,
  currentPrice: 32000,
  marketCondition: 'flat',
  region: 'gyeonggi_normal',
  designFit: 'unified_modern',
  documentation: 'certified_contractor',
});

console.log('📊 생활 만족도:', oldApartment.satisfaction.finalScore, '점');
console.log('   - 하자 패널티:', oldApartment.satisfaction.breakdown.defectRiskPenalty, '점');
console.log('   - 경고:', oldApartment.satisfaction.warnings.length > 0 ? oldApartment.satisfaction.warnings[0] : '없음');

console.log('\n💰 집값 상승:', oldApartment.priceIncrease.expectedIncrease, '만원');
console.log('   - ROI:', oldApartment.priceIncrease.roi, '%');
console.log('   - 구조 공사 효과: 배관·전기 교체로 안심 프리미엄 확보');

console.log('\n🏆 종합 등급:', oldApartment.overall.grade);
console.log('추천:', oldApartment.overall.recommendation);

// ========================================
// 예시 5: 겉만 번쩍 (하자 위험 높음)
// ========================================

console.log('\n\n=== 예시 5: 겉만 번쩍 (비추천 사례) ===\n');

const surfaceOnly = ComprehensiveAnalysisEngine.analyze({
  selectedProcesses: ['wallpaper_painting', 'lighting'],
  pyeong: 25,
  buildingAge: 25,
  familyType: 'single',
  lifestyleFactors: [],
  totalCost: 800,
  currentPrice: 35000,
  marketCondition: 'declining',
  region: 'gyeonggi_outer',
  designFit: 'inconsistent',
  documentation: 'no_evidence',
});

console.log('📊 생활 만족도:', surfaceOnly.satisfaction.finalScore, '점');
console.log('   - 하자 패널티:', surfaceOnly.satisfaction.breakdown.defectRiskPenalty, '점');
console.log('   - ⚠️ 경고:', surfaceOnly.satisfaction.warnings[0] || '구조 문제 방치');

console.log('\n💰 집값 상승:', surfaceOnly.priceIncrease.expectedIncrease, '만원');
console.log('   - ROI:', surfaceOnly.priceIncrease.roi, '%');
console.log('   - 🚨 문제:', surfaceOnly.priceIncrease.reasoning);

console.log('\n🏆 종합 등급:', surfaceOnly.overall.grade);
console.log('약점:', surfaceOnly.overall.weaknesses.join(' / '));
console.log('추천:', surfaceOnly.overall.recommendation);

// ========================================
// 실행 방법
// ========================================

/*
터미널에서 실행:

npx tsx examples/comprehensive-analysis-example.ts

또는 Node.js:

node --loader ts-node/esm examples/comprehensive-analysis-example.ts
*/
