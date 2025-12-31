/**
 * 인테리봇 - 통합 분석 엔진 v1.0
 * 
 * 생활 만족도 + 집값 상승을 동시에 계산
 * → 옵션 3안(A/B/C) 자동 생성에 사용
 */

import {
  SatisfactionEngine,
  type SatisfactionInput,
  type SatisfactionResult,
} from '../satisfaction/satisfaction-engine';
import {
  PriceIncreaseEngine,
  type PriceIncreaseInput,
  type PriceIncreaseResult,
} from '../valuation/price-increase-engine';

export interface ComprehensiveAnalysisInput {
  // 공간 정보
  selectedProcesses: string[];
  pyeong: number;
  buildingAge: number;

  // 사용자 프로필
  familyType: string;
  lifestyleFactors: string[];

  // 견적 정보
  totalCost: number; // 총 공사비 (만원)
  currentPrice: number; // 현재 시세 (만원)

  // 시장 정보
  marketCondition: 'prime_rising' | 'normal_rising' | 'flat' | 'declining';
  region:
    | 'seoul_gangnam'
    | 'seoul_gangbuk'
    | 'seoul_others'
    | 'gyeonggi_prime'
    | 'gyeonggi_normal'
    | 'gyeonggi_outer'
    | 'provincial_major'
    | 'provincial_minor';

  // 디자인·문서화 (선택)
  designFit?: 'neutral_design' | 'too_personal' | 'inconsistent' | 'unified_modern';
  documentation?: 'no_evidence' | 'basic_receipt' | 'full_documentation' | 'certified_contractor';
}

export interface ComprehensiveAnalysisResult {
  // 생활 만족도
  satisfaction: SatisfactionResult;

  // 집값 상승
  priceIncrease: PriceIncreaseResult;

  // 종합 판정
  overall: {
    grade: 'S' | 'A' | 'B' | 'C' | 'D'; // 종합 등급
    balanced: boolean; // 만족도와 투자가치 균형 여부
    recommendation: string; // 최종 추천
    strengths: string[]; // 강점
    weaknesses: string[]; // 약점
  };

  // 비교 지표
  comparison: {
    costEfficiency: number; // 비용 효율 (0-100)
    lifeQuality: number; // 생활 질 개선 (0-100)
    investmentValue: number; // 투자 가치 (0-100)
  };
}

export class ComprehensiveAnalysisEngine {
  /**
   * 통합 분석 실행
   */
  static analyze(input: ComprehensiveAnalysisInput): ComprehensiveAnalysisResult {
    // Step 1: 생활 만족도 계산
    const satisfactionInput: SatisfactionInput = {
      selectedProcesses: input.selectedProcesses,
      familyType: input.familyType,
      lifestyleFactors: input.lifestyleFactors,
      buildingAge: input.buildingAge,
      pyeong: input.pyeong,
    };
    const satisfaction = SatisfactionEngine.calculate(satisfactionInput);

    // Step 2: 집값 상승 계산
    const priceIncreaseInput: PriceIncreaseInput = {
      selectedProcesses: input.selectedProcesses,
      totalCost: input.totalCost,
      currentPrice: input.currentPrice,
      buildingAge: input.buildingAge,
      pyeong: input.pyeong,
      marketCondition: input.marketCondition,
      region: input.region,
      designFit: input.designFit,
      documentation: input.documentation,
    };
    const priceIncrease = PriceIncreaseEngine.calculate(priceIncreaseInput);

    // Step 3: 종합 판정
    const overall = this.generateOverallAssessment(
      satisfaction,
      priceIncrease,
      input.totalCost
    );

    // Step 4: 비교 지표
    const comparison = this.calculateComparisonMetrics(
      satisfaction,
      priceIncrease,
      input.totalCost
    );

    return {
      satisfaction,
      priceIncrease,
      overall,
      comparison,
    };
  }

  /**
   * 종합 판정 생성
   */
  private static generateOverallAssessment(
    satisfaction: SatisfactionResult,
    priceIncrease: PriceIncreaseResult,
    totalCost: number
  ): ComprehensiveAnalysisResult['overall'] {
    const satisfactionScore = satisfaction.finalScore;
    const roi = priceIncrease.roi;

    // 등급 산정 (만족도 + ROI 종합)
    const grade = this.calculateGrade(satisfactionScore, roi);

    // 균형 여부 (만족도와 ROI 차이가 20점 이내)
    const balanced = Math.abs(satisfactionScore - roi) <= 20;

    // 강점·약점 분석
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (satisfactionScore >= 85) {
      strengths.push('생활 만족도가 매우 높습니다');
    }
    if (roi >= 120) {
      strengths.push('투자 회수율이 우수합니다');
    }
    if (priceIncrease.marketability >= 80) {
      strengths.push('시장에서 높은 평가를 받을 수 있습니다');
    }
    if (satisfaction.warnings.length === 0) {
      strengths.push('하자 위험이 낮습니다');
    }

    if (satisfactionScore < 70) {
      weaknesses.push('생활 만족도가 제한적입니다');
    }
    if (roi < 100) {
      weaknesses.push('투자 회수율이 낮습니다');
    }
    if (satisfaction.warnings.length > 0) {
      weaknesses.push('하자 위험이 있습니다');
    }
    if (!balanced) {
      weaknesses.push('만족도와 투자가치의 균형이 부족합니다');
    }

    // 최종 추천
    const recommendation = this.generateFinalRecommendation(
      grade,
      satisfactionScore,
      roi,
      balanced
    );

    return {
      grade,
      balanced,
      recommendation,
      strengths: strengths.length > 0 ? strengths : ['기본적인 개선 효과가 있습니다'],
      weaknesses:
        weaknesses.length > 0 ? weaknesses : ['특별한 약점은 발견되지 않았습니다'],
    };
  }

  /**
   * 종합 등급 산정
   * 
   * S등급: 만족도 90+ && ROI 120+
   * A등급: 만족도 80+ && ROI 100+
   * B등급: 만족도 70+ || ROI 80+
   * C등급: 만족도 60+ || ROI 60+
   * D등급: 그 외
   */
  private static calculateGrade(
    satisfactionScore: number,
    roi: number
  ): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (satisfactionScore >= 90 && roi >= 120) return 'S';
    if (satisfactionScore >= 80 && roi >= 100) return 'A';
    if (satisfactionScore >= 70 || roi >= 80) return 'B';
    if (satisfactionScore >= 60 || roi >= 60) return 'C';
    return 'D';
  }

  /**
   * 최종 추천 메시지
   */
  private static generateFinalRecommendation(
    grade: string,
    satisfactionScore: number,
    roi: number,
    balanced: boolean
  ): string {
    if (grade === 'S') {
      return '🏆 최고의 선택입니다! 생활 만족도와 투자 가치가 모두 뛰어납니다.';
    }

    if (grade === 'A') {
      if (balanced) {
        return '✅ 우수한 선택입니다. 만족도와 투자가치가 균형있게 우수합니다.';
      }
      if (satisfactionScore > roi) {
        return '✅ 우수한 선택입니다. 특히 생활 만족도가 높습니다.';
      }
      return '✅ 우수한 선택입니다. 특히 투자 가치가 높습니다.';
    }

    if (grade === 'B') {
      if (satisfactionScore >= 70 && roi < 80) {
        return '⚠️ 생활 만족도는 좋지만, 투자 회수율은 낮습니다. 장기 거주 목적에 적합합니다.';
      }
      if (roi >= 80 && satisfactionScore < 70) {
        return '⚠️ 투자 가치는 있지만, 생활 만족도는 제한적입니다. 단기 매도 목적에 적합합니다.';
      }
      return '보통 수준의 선택입니다. 추가 공정을 검토하세요.';
    }

    if (grade === 'C') {
      return '🚨 개선 효과가 제한적입니다. 주방·욕실 등 핵심 공정 추가를 적극 검토하세요.';
    }

    return '🚨 현재 구성으로는 만족스러운 결과를 기대하기 어렵습니다. 공정을 대폭 수정하세요.';
  }

  /**
   * 비교 지표 계산
   */
  private static calculateComparisonMetrics(
    satisfaction: SatisfactionResult,
    priceIncrease: PriceIncreaseResult,
    totalCost: number
  ): ComprehensiveAnalysisResult['comparison'] {
    // 비용 효율 = (만족도 + ROI) / 2
    const costEfficiency = Math.round((satisfaction.finalScore + priceIncrease.roi) / 2);

    // 생활 질 개선 = 만족도 그대로
    const lifeQuality = satisfaction.finalScore;

    // 투자 가치 = (ROI + 시장성) / 2
    const investmentValue = Math.round((priceIncrease.roi + priceIncrease.marketability) / 2);

    return {
      costEfficiency: Math.min(100, costEfficiency),
      lifeQuality: Math.min(100, lifeQuality),
      investmentValue: Math.min(100, investmentValue),
    };
  }

  /**
   * 옵션 3안 자동 생성 (A/B/C)
   * 
   * 사용자 입력 기반으로 최적화된 3가지 옵션 제시
   */
  static generateThreeOptions(
    baseInput: ComprehensiveAnalysisInput
  ): {
    optionA: ComprehensiveAnalysisResult;
    optionB: ComprehensiveAnalysisResult;
    optionC: ComprehensiveAnalysisResult;
  } {
    // A안: 최소 투자 (도배·장판·조명)
    const optionA = this.analyze({
      ...baseInput,
      selectedProcesses: ['wallpaper_painting', 'flooring', 'lighting'],
      totalCost: 1200,
    });

    // B안: 균형형 (주방·욕실·바닥·도배)
    const optionB = this.analyze({
      ...baseInput,
      selectedProcesses: ['kitchen', 'bathroom', 'flooring', 'wallpaper_painting'],
      totalCost: 2500,
    });

    // C안: 프리미엄 (전체 + 구조)
    const optionC = this.analyze({
      ...baseInput,
      selectedProcesses: [
        'kitchen',
        'bathroom',
        'flooring',
        'wallpaper_painting',
        'plumbing',
        'windows',
        'lighting',
      ],
      totalCost: 4500,
    });

    return { optionA, optionB, optionC };
  }
}
