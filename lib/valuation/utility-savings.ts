/**
 * 인테리봇 - 관리비 절감 환산 엔진
 * 
 * 에너지 효율화 공사는 집값 상승 + 관리비 절감 2중 효과
 * 월 관리비 절감액 → 10년 현재가치 환산 → 집값에 반영
 * 
 * 출처: 에너지공단, 2025년 관리비 절감 사례
 */

/**
 * 공정별 월 관리비 절감액 (원)
 */
export const UTILITY_SAVINGS_PER_MONTH: Record<string, number> = {
  // 난방비 절감
  windows: 20000, // 고효율 창호: 월 2만원 절감
  insulation_ventilation: 15000, // 단열 개선: 월 1.5만원 절감
  boiler: 30000, // 고효율 보일러: 월 3만원 절감 (아직 미사용)

  // 전기료 절감
  lighting: 10000, // LED 조명: 월 1만원 절감

  // 수도료 절감
  bathroom: 5000, // 절수 설비: 월 0.5만원 절감
};

/**
 * 관리비 절감 효과를 집값 상승분으로 환산
 * 
 * 계산식:
 * 1. 월 절감액 계산
 * 2. 연간 절감액 = 월 절감액 × 12
 * 3. 10년 현재가치 = 연간 절감액 × 현가계수(8.53, 할인율 3%)
 * 
 * @param processes - 선택한 공정 목록
 * @returns 관리비 절감 환산 집값 상승분 (만원)
 */
export function calculateUtilitySavingsValue(processes: string[]): {
  monthlySavings: number; // 월 절감액 (원)
  annualSavings: number; // 연 절감액 (원)
  presentValue: number; // 10년 현재가치 (만원)
} {
  let monthlySavings = 0;

  // 공정별 절감액 합산
  processes.forEach((process) => {
    if (UTILITY_SAVINGS_PER_MONTH[process]) {
      monthlySavings += UTILITY_SAVINGS_PER_MONTH[process];
    }
  });

  // 연간 절감액
  const annualSavings = monthlySavings * 12;

  // 10년 현재가치 (할인율 3%, 현가계수 8.53)
  const presentValueWon = annualSavings * 8.53;

  // 만원 단위로 반환
  const presentValue = Math.round(presentValueWon / 10000);

  return {
    monthlySavings,
    annualSavings,
    presentValue,
  };
}

/**
 * 관리비 절감 효과 상세 설명 생성
 */
export function generateUtilitySavingsExplanation(
  monthlySavings: number,
  presentValue: number
): string {
  if (monthlySavings === 0) {
    return '';
  }

  const monthlyInManwon = Math.round(monthlySavings / 10000);
  return `💰 에너지 효율 개선으로 월 약 ${monthlyInManwon}만원의 관리비가 절감됩니다. 10년간 약 ${presentValue}만원의 추가 가치가 있습니다.`;
}
