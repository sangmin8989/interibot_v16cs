/**
 * 6대 지수 근거 패키지 생성
 * 
 * ⚠️ 절대 규칙: 모든 지수 출력 시 반드시 근거 패키지 포함
 * - score: 점수
 * - topFactors: 영향을 준 답변 TOP3
 * - assumption: 계산 가정
 * - improvement: 개선 포인트
 * 
 * @see Phase 2 작업 4️⃣
 */

import type { FullValueScores, SixIndexInput, IndexExplanation, FullIndexExplanations } from './types';

/**
 * 근거 패키지 검증 함수 (FAIL FAST)
 */
export function validateExplanation(explanation: IndexExplanation): boolean {
  if (typeof explanation.score !== 'number') return false;
  if (!Array.isArray(explanation.topFactors) || explanation.topFactors.length === 0) return false;
  if (typeof explanation.assumption !== 'string' || explanation.assumption.trim() === '') return false;
  if (!Array.isArray(explanation.improvement)) return false;
  return true;
}

/**
 * 6대 지수 설명 생성 (검증 포함)
 */
export function generateExplanations(
  scores: FullValueScores,
  input: SixIndexInput
): FullIndexExplanations {
  const explanations = {
    homeValue: explainHomeValue(scores.homeValueIndex, input),
    lifeQuality: explainLifeQuality(scores.lifeQualityScore, input),
    spaceEfficiency: explainSpaceEfficiency(scores.spaceEfficiency, input),
    maintenance: explainMaintenance(scores.maintenance, input),
    energy: explainEnergy(scores.energy, input),
    investment: explainInvestment(scores.investment, input),
  };

  // 검증: 하나라도 실패하면 에러
  for (const [key, explanation] of Object.entries(explanations)) {
    if (!validateExplanation(explanation)) {
      console.error(`[FAIL FAST] ${key} 근거 패키지 불완전:`, explanation);
      throw new Error(`근거 패키지 검증 실패: ${key}. 필수 필드가 누락되었습니다.`);
    }
  }

  return explanations;
}

/**
 * 집값방어지수 설명
 */
function explainHomeValue(score: number, input: SixIndexInput): IndexExplanation {
  const factors: Array<{ factor: string; impact: number }> = [];

  // 주거형태 영향
  if (input.housingType === '아파트') {
    factors.push({ factor: '아파트 선택', impact: 15 });
  } else if (input.housingType === '오피스텔') {
    factors.push({ factor: '오피스텔 선택', impact: 10 });
  }

  // 공정 영향
  if (input.selectedProcesses.includes('주방')) {
    factors.push({ factor: '주방 리모델링', impact: 5 });
  }
  if (input.selectedProcesses.includes('욕실')) {
    factors.push({ factor: '욕실 리모델링', impact: 4 });
  }
  if (input.selectedProcesses.includes('바닥재')) {
    factors.push({ factor: '바닥재 교체', impact: 3 });
  }

  // 등급 영향
  if (input.grade === 'OPUS') {
    factors.push({ factor: 'OPUS 등급 선택', impact: 10 });
  } else if (input.grade === 'STANDARD') {
    factors.push({ factor: 'STANDARD 등급 선택', impact: 7 });
  }

  // 평수 영향
  if (input.pyeong >= 24 && input.pyeong <= 34) {
    factors.push({ factor: `${input.pyeong}평 적정 평형`, impact: 12 });
  }

  // TOP3 추출
  factors.sort((a, b) => b.impact - a.impact);
  const topFactors = factors.slice(0, 3).map(f => f.factor);

  // 가정
  const assumption = `${input.pyeong}평 ${input.housingType}, 준공 10년 기준, 5년 후 매도 가정`;

  // 개선 포인트
  const improvement: string[] = [];
  if (!input.selectedProcesses.includes('샤시')) {
    improvement.push('샤시 교체 추가 시 +5점 상승 예상');
  }
  if (!input.selectedProcesses.includes('주방') && !input.selectedProcesses.includes('욕실')) {
    improvement.push('주방 또는 욕실 리모델링 추가 시 +10점 상승 예상');
  }
  if (input.grade !== 'OPUS' && score < 80) {
    improvement.push('등급 상향 시 +3~6점 상승 예상');
  }

  return {
    score,
    topFactors,
    assumption,
    improvement: improvement.length > 0 ? improvement : ['현재 구성이 최적입니다'],
    confidence: Math.min(1, factors.length * 0.2),
  };
}

/**
 * 생활안정지수 설명
 */
function explainLifeQuality(score: number, input: SixIndexInput): IndexExplanation {
  const factors: Array<{ factor: string; impact: number }> = [];

  // 라이프스타일 매칭
  if (input.traits.includes('COOKING_LOVER') && input.selectedProcesses.includes('주방')) {
    const impact = input.grade === 'OPUS' ? 10 : input.grade === 'STANDARD' ? 7 : 4;
    factors.push({ factor: '요리 성향 + 주방 리모델링', impact });
  }
  if (input.traits.includes('CLEANING_SYSTEM_NEED') && input.selectedProcesses.includes('바닥재')) {
    factors.push({ factor: '청소 편의 성향 + 바닥재 교체', impact: 10 });
  }
  if (input.traits.includes('SOUNDPROOF_NEED') && input.selectedProcesses.includes('중문')) {
    factors.push({ factor: '방음 니즈 + 중문 설치', impact: 10 });
  }

  // 가족 맞춤
  if (input.traits.includes('SAFETY_NEED') && input.selectedProcesses.includes('가구')) {
    factors.push({ factor: '안전 니즈 + 가구 설치', impact: 15 });
  }

  // 건강/편의
  if (input.selectedProcesses.includes('욕실')) {
    factors.push({ factor: '욕실 리모델링', impact: 10 });
  }
  if (input.selectedProcesses.includes('전기')) {
    factors.push({ factor: '전기 공사', impact: 8 });
  }
  if (input.additionalOptions?.includes('aircon_system')) {
    factors.push({ factor: '시스템 에어컨', impact: 7 });
  }

  // TOP3 추출
  factors.sort((a, b) => b.impact - a.impact);
  const topFactors = factors.slice(0, 3).map(f => f.factor);

  // 가정
  const assumption = `${input.familySize}인 가족, 일상 생활 패턴 기준`;

  // 개선 포인트
  const improvement: string[] = [];
  if (!input.selectedProcesses.includes('욕실')) {
    improvement.push('욕실 리모델링 추가 시 +10점 상승 예상');
  }
  if (input.traits.includes('COOKING_LOVER') && !input.selectedProcesses.includes('주방')) {
    improvement.push('주방 리모델링 추가 시 +7~10점 상승 예상');
  }
  if (!input.additionalOptions?.includes('aircon_system')) {
    improvement.push('시스템 에어컨 추가 시 +7점 상승 예상');
  }

  return {
    score,
    topFactors: topFactors.length > 0 ? topFactors : ['기본 생활 편의성'],
    assumption,
    improvement: improvement.length > 0 ? improvement : ['현재 구성이 최적입니다'],
    confidence: Math.min(1, factors.length * 0.2),
  };
}

/**
 * 공간효율지수 설명
 */
function explainSpaceEfficiency(score: number, input: SixIndexInput): IndexExplanation {
  const factors: Array<{ factor: string; impact: number }> = [];

  // 수납
  if (input.selectedProcesses.includes('가구')) {
    factors.push({ factor: '가구(붙박이장) 설치', impact: 15 });
  }
  if (input.traits.includes('STORAGE_NEED')) {
    factors.push({ factor: '수납 니즈', impact: 10 });
  }

  // 가족 적정도
  const pyeongPerPerson = input.pyeong / input.familySize;
  if (pyeongPerPerson >= 12) {
    factors.push({ factor: `1인당 ${pyeongPerPerson.toFixed(1)}평 (여유 공간)`, impact: 20 });
  } else if (pyeongPerPerson >= 10) {
    factors.push({ factor: `1인당 ${pyeongPerPerson.toFixed(1)}평 (적정 공간)`, impact: 16 });
  } else if (pyeongPerPerson >= 8) {
    factors.push({ factor: `1인당 ${pyeongPerPerson.toFixed(1)}평 (협소)`, impact: 12 });
  } else {
    factors.push({ factor: `1인당 ${pyeongPerPerson.toFixed(1)}평 (매우 협소)`, impact: 8 });
  }

  // 공간활용
  if (input.selectedProcesses.includes('주방')) {
    factors.push({ factor: '주방 리모델링', impact: 5 });
  }
  if (input.selectedProcesses.includes('중문')) {
    factors.push({ factor: '중문 설치', impact: 5 });
  }

  // TOP3 추출
  factors.sort((a, b) => b.impact - a.impact);
  const topFactors = factors.slice(0, 3).map(f => f.factor);

  // 가정
  const assumption = `${input.pyeong}평, ${input.familySize}인 가족 기준`;

  // 개선 포인트
  const improvement: string[] = [];
  if (!input.selectedProcesses.includes('가구')) {
    improvement.push('붙박이장 추가 시 수납력 2배 증가 (+15점)');
  }
  if (pyeongPerPerson < 10) {
    improvement.push('공간 확장 또는 수납 최적화 필요');
  }
  if (!input.selectedProcesses.includes('중문')) {
    improvement.push('중문 설치로 공간 활용도 향상 (+5점)');
  }

  return {
    score,
    topFactors: topFactors.length > 0 ? topFactors : ['기본 공간 효율'],
    assumption,
    improvement: improvement.length > 0 ? improvement : ['현재 구성이 최적입니다'],
    confidence: Math.min(1, factors.length * 0.2),
  };
}

/**
 * 유지관리용이도 설명
 */
function explainMaintenance(score: number, input: SixIndexInput): IndexExplanation {
  const factors: Array<{ factor: string; impact: number }> = [];

  // 등급 영향
  if (input.grade === 'STANDARD') {
    factors.push({ factor: 'STANDARD 등급 (관리 용이 최적)', impact: 25 });
  } else if (input.grade === 'ESSENTIAL') {
    factors.push({ factor: 'ESSENTIAL 등급 (관리 용이)', impact: 20 });
  } else if (input.grade === 'OPUS') {
    factors.push({ factor: 'OPUS 등급 (관리 감수)', impact: 15 });
  }

  // 청소 편의
  if (input.traits.includes('CLEANING_SYSTEM_NEED')) {
    const impact = input.grade === 'STANDARD' ? 20 : input.grade === 'ESSENTIAL' ? 15 : 10;
    factors.push({ factor: '청소 편의 성향', impact });
  } else {
    factors.push({ factor: '일반 청소 패턴', impact: 15 });
  }

  // 유지비
  if (input.grade === 'STANDARD') {
    factors.push({ factor: 'STANDARD 등급 유지비 최적', impact: 15 });
  } else if (input.grade === 'ESSENTIAL') {
    factors.push({ factor: 'ESSENTIAL 등급 유지비', impact: 12 });
  }

  // TOP3 추출
  factors.sort((a, b) => b.impact - a.impact);
  const topFactors = factors.slice(0, 3).map(f => f.factor);

  // 가정
  const assumption = `${input.grade} 등급 기준, 10년 사용 가정`;

  // 개선 포인트
  const improvement: string[] = [];
  if (input.grade === 'OPUS' && score < 70) {
    improvement.push('STANDARD 등급으로 변경 시 관리 용이도 +10점 상승');
  }
  if (!input.traits.includes('CLEANING_SYSTEM_NEED')) {
    improvement.push('청소 편의 소재 선택 시 +5~10점 상승');
  }

  return {
    score,
    topFactors: topFactors.length > 0 ? topFactors : ['기본 관리 용이도'],
    assumption,
    improvement: improvement.length > 0 ? improvement : ['현재 구성이 최적입니다'],
    confidence: Math.min(1, factors.length * 0.2),
  };
}

/**
 * 에너지효율지수 설명
 */
function explainEnergy(score: number, input: SixIndexInput): IndexExplanation {
  const factors: Array<{ factor: string; impact: number }> = [];

  // 샤시 단열
  if (input.selectedProcesses.includes('샤시')) {
    const impact = input.grade === 'OPUS' ? 35 : input.grade === 'STANDARD' ? 25 : 15;
    factors.push({ factor: `샤시 교체 (${input.grade} 등급)`, impact });
  }

  // 조명
  if (input.selectedProcesses.includes('전기')) {
    factors.push({ factor: '전기 공사 (LED 조명)', impact: 15 });
  }

  // 냉난방
  if (input.additionalOptions?.includes('aircon_system')) {
    const impact = input.grade === 'OPUS' ? 20 : input.grade === 'STANDARD' ? 15 : 10;
    factors.push({ factor: '시스템 에어컨', impact });
  }

  // TOP3 추출
  factors.sort((a, b) => b.impact - a.impact);
  const topFactors = factors.slice(0, 3).map(f => f.factor);

  // 가정
  const assumption = `${input.pyeong}평 기준, 연간 냉난방 사용량 기준`;

  // 개선 포인트
  const improvement: string[] = [];
  if (!input.selectedProcesses.includes('샤시')) {
    improvement.push('샤시 교체 추가 시 냉난방비 30% 절감 (+15~35점)');
  }
  if (!input.selectedProcesses.includes('전기')) {
    improvement.push('LED 조명 교체 시 전기료 절감 (+15점)');
  }
  if (!input.additionalOptions?.includes('aircon_system')) {
    improvement.push('시스템 에어컨 추가 시 에너지 효율 향상 (+10~20점)');
  }

  return {
    score,
    topFactors: topFactors.length > 0 ? topFactors : ['기본 에너지 효율'],
    assumption,
    improvement: improvement.length > 0 ? improvement : ['현재 구성이 최적입니다'],
    confidence: Math.min(1, factors.length * 0.2),
  };
}

/**
 * 투자효율지수 설명
 */
function explainInvestment(score: number, input: SixIndexInput): IndexExplanation {
  const factors: Array<{ factor: string; impact: number }> = [];

  const budgetPerPyeong = input.budget / input.pyeong;

  // 예산 배분 적정성
  if (input.grade === 'ESSENTIAL' && budgetPerPyeong <= 100) {
    factors.push({ factor: 'ESSENTIAL 등급 + 예산 적정', impact: 30 });
  } else if (input.grade === 'STANDARD' && budgetPerPyeong >= 100 && budgetPerPyeong <= 150) {
    factors.push({ factor: 'STANDARD 등급 + 예산 적정', impact: 30 });
  } else if (input.grade === 'OPUS' && budgetPerPyeong >= 150) {
    factors.push({ factor: 'OPUS 등급 + 예산 적정', impact: 30 });
  } else {
    factors.push({ factor: '예산 배분', impact: 15 });
  }

  // 핵심 공정 집중
  if (input.selectedProcesses.includes('주방')) {
    factors.push({ factor: '주방 리모델링', impact: 8 });
  }
  if (input.selectedProcesses.includes('욕실')) {
    factors.push({ factor: '욕실 리모델링', impact: 7 });
  }
  if (input.selectedProcesses.includes('바닥재')) {
    factors.push({ factor: '바닥재 교체', impact: 5 });
  }

  // TOP3 추출
  factors.sort((a, b) => b.impact - a.impact);
  const topFactors = factors.slice(0, 3).map(f => f.factor);

  // 가정
  const assumption = `평당 ${Math.round(budgetPerPyeong)}만원 투자, ${input.grade} 등급 기준`;

  // 개선 포인트
  const improvement: string[] = [];
  if (!input.selectedProcesses.includes('주방') && !input.selectedProcesses.includes('욕실')) {
    improvement.push('주방 또는 욕실 리모델링 추가 시 투자 효율 +8~10점 상승');
  }
  if (budgetPerPyeong < 100 && input.grade === 'OPUS') {
    improvement.push('예산 대비 등급 조정 권장');
  }
  if (budgetPerPyeong > 150 && input.grade === 'ESSENTIAL') {
    improvement.push('등급 상향으로 투자 효율 향상 가능');
  }

  return {
    score,
    topFactors: topFactors.length > 0 ? topFactors : ['기본 투자 효율'],
    assumption,
    improvement: improvement.length > 0 ? improvement : ['현재 구성이 최적입니다'],
    confidence: Math.min(1, factors.length * 0.2),
  };
}


