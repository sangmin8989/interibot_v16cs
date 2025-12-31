/**
 * 인테리봇 - 집값 상승 예측 엔진 v2.0
 * 
 * 통합 기능:
 * - 공정별 ROI 계산
 * - 조합 시너지 보너스
 * - 시장·입지·디자인 보정
 * - 평수·지역·시간 변수 반영
 */

import {
  PARTIAL_REMODEL_ROI,
  getComboBonus,
  generateComboKey,
} from './process-roi';
import {
  VALUE_UPLIFT_FACTORS,
  PYEONG_MULTIPLIERS,
  REGIONAL_MULTIPLIERS,
  LOCATION_WEAKNESS_FACTORS,
  getScopeQuality,
  getPyeongRange,
  applyTimeDecay,
} from './market-factors';
import {
  calculateUtilitySavingsValue,
  generateUtilitySavingsExplanation,
} from './utility-savings';

export interface PriceIncreaseResult {
  // 금액
  expectedIncrease: number; // 예상 집값 상승액 (만원)
  roi: number; // 투자 회수율 (%)
  marketability: number; // 시장성 점수 (0-100)

  // 상세 분석
  breakdown: {
    baseROI: number;
    comboBonus: number;
    marketAdjustment: number;
    pyeongAdjustment: number;
    regionalAdjustment: number;
  };

  // 해석
  reasoning: string;
  category: 'excellent' | 'good' | 'normal' | 'caution';

  // 세부 정보
  processROIs: Record<string, number>; // 공정별 기여도
  comboKey: string; // 조합 키

  // 출처·면책
  disclaimer: {
    sources: string;
    warning: string;
  };

  // 관리비 절감 (신규)
  utilitySavings?: {
    monthlySavings: number; // 월 절감액 (원)
    annualSavings: number; // 연 절감액 (원)
    presentValue: number; // 10년 현재가치 (만원)
    explanation: string; // 설명
  };
}

export interface PriceIncreaseInput {
  selectedProcesses: string[];
  totalCost: number; // 총 공사비 (만원)
  currentPrice: number; // 현재 시세 (만원)
  buildingAge: number;
  pyeong: number;
  
  // 시장 요인
  marketCondition: 'prime_rising' | 'normal_rising' | 'flat' | 'declining';
  region: keyof typeof REGIONAL_MULTIPLIERS;
  
  // 디자인·문서화
  designFit?: 'neutral_design' | 'too_personal' | 'inconsistent' | 'unified_modern';
  documentation?: 'no_evidence' | 'basic_receipt' | 'full_documentation' | 'certified_contractor';
  
  // 시간 변수 (선택)
  yearsSinceRemodel?: number;
  
  // 재건축 위험
  redevelopmentYears?: number; // 재건축까지 예상 년수 (0 또는 undefined = 계획 없음)
  
  // 입지 약점 (신규)
  locationWeaknesses?: Array<keyof typeof LOCATION_WEAKNESS_FACTORS>;
}

export class PriceIncreaseEngine {
  /**
   * 메인 계산 함수
   */
  static calculate(input: PriceIncreaseInput): PriceIncreaseResult {
    const {
      selectedProcesses,
      totalCost,
      currentPrice,
      buildingAge,
      pyeong,
      marketCondition,
      region,
      designFit = 'neutral_design',
      documentation = 'basic_receipt',
      yearsSinceRemodel = 0,
      redevelopmentYears,
      locationWeaknesses,
    } = input;

    // Step 1: 공정별 ROI 계산 및 평균
    const processROIs = this.calculateProcessROIs(selectedProcesses);
    const baseROI = this.calculateAverageROI(selectedProcesses);

    // Step 2: 조합 시너지 보너스
    const comboBonus = getComboBonus(selectedProcesses);
    const comboKey = generateComboKey(selectedProcesses);

    // Step 3: 시장·입지·디자인 보정
    const scopeQuality = getScopeQuality(selectedProcesses);
    const scopeAdj = VALUE_UPLIFT_FACTORS.scope_quality[scopeQuality];
    const marketAdj = VALUE_UPLIFT_FACTORS.location_market[marketCondition];
    const designAdj = VALUE_UPLIFT_FACTORS.design_resale_fit[designFit];
    const docAdj = VALUE_UPLIFT_FACTORS.documentation[documentation];

    const combinedMarketAdj = scopeAdj * marketAdj * designAdj * docAdj;

    // Step 4: 평수·지역 보정
    const pyeongRange = getPyeongRange(pyeong);
    const pyeongAdj = PYEONG_MULTIPLIERS[pyeongRange];
    const regionalAdj = REGIONAL_MULTIPLIERS[region] || 1.0;

    // Step 5: 최종 상승액 계산
    let rawIncrease = totalCost * baseROI * comboBonus * combinedMarketAdj * pyeongAdj * regionalAdj;

    // Step 5.5: 재건축 위험 패널티
    if (redevelopmentYears && redevelopmentYears > 0) {
      let redevelopmentPenalty = 1.0;
      if (redevelopmentYears <= 3) {
        redevelopmentPenalty = 0.30; // REDEVELOPMENT_RISK_FACTORS.within_3_years
      } else if (redevelopmentYears <= 5) {
        redevelopmentPenalty = 0.50; // REDEVELOPMENT_RISK_FACTORS.within_5_years
      } else if (redevelopmentYears <= 10) {
        redevelopmentPenalty = 0.80; // REDEVELOPMENT_RISK_FACTORS.within_10_years
      }
      rawIncrease *= redevelopmentPenalty;
    }

    // Step 5.6: 입지 약점 패널티 (신규)
    if (locationWeaknesses && locationWeaknesses.length > 0) {
      let locationPenalty = 1.0;
      locationWeaknesses.forEach((weakness) => {
        locationPenalty *= LOCATION_WEAKNESS_FACTORS[weakness] || 1.0;
      });
      rawIncrease *= locationPenalty;
    }

    // Step 6: 시간 감가 적용 (선택)
    if (yearsSinceRemodel > 0) {
      const avgDecayRate = this.calculateAverageDecayRate(selectedProcesses);
      rawIncrease = applyTimeDecay(rawIncrease, yearsSinceRemodel, avgDecayRate);
    }

    // Step 7: 반올림 (100만원 단위)
    const expectedIncrease = Math.round(rawIncrease / 100) * 100;

    // Step 8: ROI 계산
    const roi = Math.round((expectedIncrease / totalCost) * 100);

    // Step 9: 시장성 점수 계산
    const marketability = this.calculateMarketability(
      selectedProcesses,
      roi,
      designFit,
      documentation
    );

    // Step 10: 해석 생성
    const { reasoning, category } = this.generateReasoning(
      roi,
      selectedProcesses,
      marketCondition,
      buildingAge
    );

    // Step 11: 관리비 절감 계산 (신규)
    const utilitySavingsData = calculateUtilitySavingsValue(selectedProcesses);
    const utilitySavings =
      utilitySavingsData.monthlySavings > 0
        ? {
            ...utilitySavingsData,
            explanation: generateUtilitySavingsExplanation(
              utilitySavingsData.monthlySavings,
              utilitySavingsData.presentValue
            ),
          }
        : undefined;

    return {
      expectedIncrease,
      roi,
      marketability,
      breakdown: {
        baseROI: Math.round(baseROI * 100),
        comboBonus: Math.round(comboBonus * 100) / 100,
        marketAdjustment: Math.round(combinedMarketAdj * 100) / 100,
        pyeongAdjustment: Math.round(pyeongAdj * 100) / 100,
        regionalAdjustment: Math.round(regionalAdj * 100) / 100,
      },
      reasoning,
      category,
      processROIs,
      comboKey,
      disclaimer: {
        sources:
          '본 수치는 「공동주택 리모델링 수익성 영향요인 분석」, 2025년 실거래 사례, 미국·국내 ROI 연구를 참고한 내부 시뮬레이션 결과입니다.',
        warning:
          '실제 매매가는 시장 상황·입지·협상 조건에 따라 달라질 수 있으며, 특정 수익을 보장하지 않습니다.',
      },
      utilitySavings,
    };
  }

  /**
   * 공정별 ROI 계산
   */
  private static calculateProcessROIs(processes: string[]): Record<string, number> {
    const result: Record<string, number> = {};

    processes.forEach((process) => {
      const roiData = PARTIAL_REMODEL_ROI[process];
      if (roiData) {
        // 중간값 사용
        result[process] = Math.round(((roiData.roi_min + roiData.roi_max) / 2) * 100);
      }
    });

    return result;
  }

  /**
   * 평균 ROI 계산
   */
  private static calculateAverageROI(processes: string[]): number {
    if (processes.length === 0) return 0;

    let totalROI = 0;
    let count = 0;

    processes.forEach((process) => {
      const roiData = PARTIAL_REMODEL_ROI[process];
      if (roiData) {
        totalROI += (roiData.roi_min + roiData.roi_max) / 2;
        count++;
      }
    });

    return count > 0 ? totalROI / count : 0;
  }

  /**
   * 평균 감가율 계산
   */
  private static calculateAverageDecayRate(processes: string[]): number {
    if (processes.length === 0) return 5;

    let totalDecay = 0;
    let count = 0;

    processes.forEach((process) => {
      const roiData = PARTIAL_REMODEL_ROI[process];
      if (roiData) {
        totalDecay += roiData.time_decay;
        count++;
      }
    });

    return count > 0 ? totalDecay / count : 5;
  }

  /**
   * 시장성 점수 계산 (0-100)
   * 
   * 요인:
   * - ROI (40점)
   * - 공정 가시성 (30점)
   * - 디자인 적합도 (20점)
   * - 문서화 수준 (10점)
   */
  private static calculateMarketability(
    processes: string[],
    roi: number,
    designFit: string,
    documentation: string
  ): number {
    let score = 0;

    // ROI 점수 (40점)
    if (roi >= 150) score += 40;
    else if (roi >= 120) score += 35;
    else if (roi >= 100) score += 30;
    else if (roi >= 80) score += 20;
    else score += 10;

    // 가시성 점수 (30점)
    let visibilityScore = 0;
    processes.forEach((process) => {
      const roiData = PARTIAL_REMODEL_ROI[process];
      if (roiData) {
        if (roiData.visibility === 'high') visibilityScore += 5;
        else if (roiData.visibility === 'medium') visibilityScore += 3;
        else visibilityScore += 1;
      }
    });
    score += Math.min(30, visibilityScore);

    // 디자인 적합도 (20점)
    if (designFit === 'unified_modern') score += 20;
    else if (designFit === 'neutral_design') score += 15;
    else if (designFit === 'too_personal') score += 8;
    else score += 5;

    // 문서화 수준 (10점)
    if (documentation === 'certified_contractor') score += 10;
    else if (documentation === 'full_documentation') score += 8;
    else if (documentation === 'basic_receipt') score += 5;
    else score += 2;

    return Math.min(100, Math.round(score));
  }

  /**
   * 해석 생성
   */
  private static generateReasoning(
    roi: number,
    processes: string[],
    marketCondition: string,
    buildingAge: number
  ): { reasoning: string; category: 'excellent' | 'good' | 'normal' | 'caution' } {
    const hasKitchen = processes.includes('kitchen');
    const hasBathroom = processes.includes('bathroom');
    const hasStructural =
      processes.includes('plumbing') || processes.includes('electrical_system');

    if (roi >= 150) {
      return {
        category: 'excellent',
        reasoning: `✅ 매우 우수: 공사비 대비 집값 상승폭이 큽니다. ${
          hasKitchen && hasBathroom
            ? '주방·욕실 등 핵심 공정이 포함되어 있습니다.'
            : '선택한 공정이 효율적입니다.'
        }`,
      };
    }

    if (roi >= 120) {
      return {
        category: 'good',
        reasoning: `✅ 우수: 적절한 공정 조합으로 투자 회수가 가능합니다. ${
          marketCondition === 'prime_rising' || marketCondition === 'normal_rising'
            ? '현재 시장 상황도 유리합니다.'
            : ''
        }`,
      };
    }

    if (roi >= 100) {
      return {
        category: 'normal',
        reasoning: `⚠️ 보통: 손해는 없지만, 집값 상승 효과는 제한적입니다. ${
          !hasKitchen && !hasBathroom
            ? '주방이나 욕실을 추가하면 효과가 커집니다.'
            : ''
        }`,
      };
    }

    return {
      category: 'caution',
      reasoning: `🚨 주의: 이 조합은 만족도는 높지만 집값은 덜 오를 수 있습니다. ${
        buildingAge >= 20 && !hasStructural
          ? '구조 공사(배관·전기)를 추가하면 프리미엄이 붙습니다.'
          : '주방·욕실 추가를 검토하세요.'
      }`,
    };
  }
}
