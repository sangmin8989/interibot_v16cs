/**
 * 간접공사비 데이터
 * 산재보험, 고용보험, 국민연금, 건강보험 등
 */

export interface IndirectCostRate {
  code: string;
  name: string;
  rate: number; // 비율 (%)
  baseType: 'labor' | 'total'; // 적용 기준 (노무비 or 총공사비)
  description: string;
}

export const indirectCostRates: IndirectCostRate[] = [
  {
    code: 'IC-01',
    name: '산재보험료',
    rate: 3.07,
    baseType: 'labor',
    description: '산업재해보상보험료 (노무비 기준)'
  },
  {
    code: 'IC-02',
    name: '고용보험료',
    rate: 1.5,
    baseType: 'labor',
    description: '고용보험료 (노무비 기준)'
  },
  {
    code: 'IC-03',
    name: '국민연금',
    rate: 4.5,
    baseType: 'labor',
    description: '국민연금 (노무비 기준)'
  },
  {
    code: 'IC-04',
    name: '건강보험',
    rate: 3.545,
    baseType: 'labor',
    description: '건강보험료 (노무비 기준)'
  },
  {
    code: 'IC-05',
    name: '일반관리비',
    rate: 5.0,
    baseType: 'total',
    description: '일반관리비 (총공사비 기준)'
  },
  {
    code: 'IC-06',
    name: '이윤',
    rate: 10.0,
    baseType: 'total',
    description: '이윤 (총공사비 기준)'
  }
];

/**
 * 간접공사비 비율 조회
 */
export function getIndirectCostRate(code: string): number {
  const cost = indirectCostRates.find(c => c.code === code);
  return cost?.rate || 0;
}

/**
 * 간접공사비 정보 조회
 */
export function getIndirectCostInfo(code: string): IndirectCostRate | undefined {
  return indirectCostRates.find(c => c.code === code);
}

/**
 * 이름으로 간접공사비 비율 조회
 */
export function getIndirectCostRateByName(name: string): number {
  const cost = indirectCostRates.find(c => c.name === name);
  return cost?.rate || 0;
}

/**
 * 노무비 기준 간접공사비 계산
 */
export function calculateLaborBasedIndirectCosts(laborCost: number): {
  산재보험료: number;
  고용보험료: number;
  국민연금: number;
  건강보험: number;
  총계: number;
} {
  const 산재보험료 = Math.round(laborCost * (getIndirectCostRateByName('산재보험료') / 100));
  const 고용보험료 = Math.round(laborCost * (getIndirectCostRateByName('고용보험료') / 100));
  const 국민연금 = Math.round(laborCost * (getIndirectCostRateByName('국민연금') / 100));
  const 건강보험 = Math.round(laborCost * (getIndirectCostRateByName('건강보험') / 100));

  return {
    산재보험료,
    고용보험료,
    국민연금,
    건강보험,
    총계: 산재보험료 + 고용보험료 + 국민연금 + 건강보험
  };
}

/**
 * 총공사비 기준 간접공사비 계산
 */
export function calculateTotalBasedIndirectCosts(totalCost: number): {
  일반관리비: number;
  이윤: number;
  총계: number;
} {
  const 일반관리비 = Math.round(totalCost * (getIndirectCostRateByName('일반관리비') / 100));
  const 이윤 = Math.round(totalCost * (getIndirectCostRateByName('이윤') / 100));

  return {
    일반관리비,
    이윤,
    총계: 일반관리비 + 이윤
  };
}

/**
 * 전체 간접공사비 계산
 */
export function calculateAllIndirectCosts(
  laborCost: number,
  totalDirectCost: number
): {
  노무비기준: ReturnType<typeof calculateLaborBasedIndirectCosts>;
  총공사비기준: ReturnType<typeof calculateTotalBasedIndirectCosts>;
  총간접비: number;
} {
  const 노무비기준 = calculateLaborBasedIndirectCosts(laborCost);
  const 총공사비기준 = calculateTotalBasedIndirectCosts(totalDirectCost);

  return {
    노무비기준,
    총공사비기준,
    총간접비: 노무비기준.총계 + 총공사비기준.총계
  };
}










