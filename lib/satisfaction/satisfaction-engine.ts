/**
 * 인테리봇 - 생활 만족도 엔진 v2.0
 * 
 * 통합 기능:
 * - 기본 만족도 계산
 * - 심리 요인 보너스
 * - 하자 리스크 패널티
 * - 가족 구성·라이프스타일·연식 반영
 */

import {
  PROCESS_SATISFACTION_SCORES,
  FAMILY_COMPOSITION_WEIGHTS,
  LIFESTYLE_MODIFIERS,
  BUILDING_AGE_FACTORS,
} from './base-scores';
import { calculatePsychologicalBonus } from './psychological-factors';
import {
  calculateDefectRisk,
  applyDefectRiskPenalty,
  hasStructuralWork,
  getRiskyProcessCombinations,
} from './defect-risk';

export type SatisfactionLevel =
  | 'very_satisfied'
  | 'satisfied'
  | 'neutral'
  | 'slightly_satisfied'
  | 'unsatisfied';

export interface SatisfactionResult {
  // 점수
  finalScore: number;
  scoreRange: string;
  satisfactionLevel: SatisfactionLevel;

  // 상세 분석
  breakdown: {
    baseScore: number;
    familyAdjustment: number;
    lifestyleMultiplier: number;
    buildingAgeFactor: number;
    psychologicalBonus: number;
    defectRiskPenalty: number;
  };

  // 해석
  interpretation: string;
  recommendations: string[];

  // 경고
  warnings: string[];
  riskyProcesses: string[];
}

export interface SatisfactionInput {
  selectedProcesses: string[];
  familyType: string;
  lifestyleFactors: string[];
  buildingAge: number;
  pyeong?: number;
}

export class SatisfactionEngine {
  /**
   * 메인 계산 함수
   */
  static calculate(input: SatisfactionInput): SatisfactionResult {
    const { selectedProcesses, familyType, lifestyleFactors, buildingAge } = input;

    // Step 1: 기본 점수 계산
    const baseScore = this.calculateBaseScore(selectedProcesses);

    // Step 2: 가족 구성 가중치
    const familyAdjustment = this.applyFamilyCompositionWeight(
      selectedProcesses,
      familyType
    );

    // Step 3: 라이프스타일 조정
    const lifestyleMultiplier = this.applyLifestyleModifiers(
      selectedProcesses,
      lifestyleFactors
    );

    // Step 4: 건물 연식 계수
    const buildingAgeFactor = this.getBuildingAgeFactor(buildingAge);

    // Step 5: 중간 점수 계산
    let rawScore =
      baseScore * familyAdjustment * lifestyleMultiplier * buildingAgeFactor;

    // Step 6: 심리 요인 보너스
    const psychologicalBonus = calculatePsychologicalBonus(
      selectedProcesses,
      familyType
    );
    rawScore += psychologicalBonus;

    // Step 7: 하자 리스크 패널티
    const includesStructural = hasStructuralWork(selectedProcesses);
    const riskLevel = calculateDefectRisk({
      selectedProcesses,
      buildingAge,
      includesStructuralWork: includesStructural,
    });

    const { finalScore, warning, reasons } = applyDefectRiskPenalty(rawScore, riskLevel);

    // Step 8: 최종 점수 (0-100)
    const clampedScore = Math.min(100, Math.max(0, Math.round(finalScore)));

    // Step 9: 해석 생성
    const satisfactionLevel = this.getSatisfactionLevel(clampedScore);
    const interpretation = this.getInterpretation(clampedScore);
    const scoreRange = this.getScoreRange(clampedScore);
    const recommendations = this.generateRecommendations(
      selectedProcesses,
      familyType,
      clampedScore,
      buildingAge
    );

    // Step 10: 위험 조합 체크
    const riskyProcesses = getRiskyProcessCombinations(selectedProcesses, buildingAge);
    const warnings: string[] = [];
    if (warning) warnings.push(warning);

    return {
      finalScore: clampedScore,
      scoreRange,
      satisfactionLevel,
      breakdown: {
        baseScore: Math.round(baseScore),
        familyAdjustment: Math.round(familyAdjustment * 100) / 100,
        lifestyleMultiplier: Math.round(lifestyleMultiplier * 100) / 100,
        buildingAgeFactor: Math.round(buildingAgeFactor * 100) / 100,
        psychologicalBonus,
        defectRiskPenalty: Math.round(rawScore - finalScore),
      },
      interpretation,
      recommendations,
      warnings,
      riskyProcesses,
    };
  }

  /**
   * 공정별 기본 점수 평균
   */
  private static calculateBaseScore(selectedProcesses: string[]): number {
    if (selectedProcesses.length === 0) return 0;

    const totalScore = selectedProcesses.reduce((sum, process) => {
      const score = PROCESS_SATISFACTION_SCORES[process]?.baseScore ?? 0;
      return sum + score;
    }, 0);

    return totalScore / selectedProcesses.length;
  }

  /**
   * 가족 구성별 가중치 적용
   */
  private static applyFamilyCompositionWeight(
    selectedProcesses: string[],
    familyType: string
  ): number {
    const weights = FAMILY_COMPOSITION_WEIGHTS[familyType] || {};
    const weightValues = Object.values(weights) as number[];

    if (weightValues.length === 0) return 1.0;

    const averageWeight = weightValues.reduce((a, b) => a + b, 0) / weightValues.length;
    return averageWeight;
  }

  /**
   * 라이프스타일 조정 계수
   */
  private static applyLifestyleModifiers(
    selectedProcesses: string[],
    lifestyleFactors: string[]
  ): number {
    let combinedMultiplier = 1.0;

    lifestyleFactors.forEach((factor) => {
      const modifiers = LIFESTYLE_MODIFIERS[factor] || {};
      const multiplierValues = Object.values(modifiers) as number[];

      if (multiplierValues.length > 0) {
        const averageMultiplier =
          multiplierValues.reduce((a, b) => a + b, 0) / multiplierValues.length;
        combinedMultiplier *= averageMultiplier / 1.5; // 과도한 증폭 방지
      }
    });

    return Math.max(0.8, Math.min(2.0, combinedMultiplier));
  }

  /**
   * 건물 연식 계수
   */
  private static getBuildingAgeFactor(buildingAge: number): number {
    if (buildingAge <= 10) return 1.0;
    if (buildingAge <= 20) return 1.0;
    if (buildingAge <= 30) return 1.15;
    return 1.3;
  }

  /**
   * 만족도 레벨 판정
   */
  private static getSatisfactionLevel(score: number): SatisfactionLevel {
    if (score >= 90) return 'very_satisfied';
    if (score >= 80) return 'satisfied';
    if (score >= 70) return 'neutral';
    if (score >= 60) return 'slightly_satisfied';
    return 'unsatisfied';
  }

  /**
   * 점수 범위 라벨
   */
  private static getScoreRange(score: number): string {
    if (score >= 90) return '90~100 (매우 만족)';
    if (score >= 80) return '80~89 (만족)';
    if (score >= 70) return '70~79 (보통)';
    if (score >= 60) return '60~69 (약간 만족)';
    return '~59 (불만족)';
  }

  /**
   * 해석 생성
   */
  private static getInterpretation(score: number): string {
    if (score >= 90)
      return '생활 질이 획기적으로 개선되며, 주요 불편 사항이 거의 완전히 해결됩니다.';
    if (score >= 80) return '주요 불편 사항이 대부분 개선되어 거주 만족도가 높아집니다.';
    if (score >= 70)
      return '일부 불편이 개선되며 보통 수준의 만족도를 기대할 수 있습니다.';
    if (score >= 60) return '제한적인 개선으로 최소한의 만족도만 기대됩니다.';
    return '개선 효과가 미미하여 추가 공사가 필요할 수 있습니다.';
  }

  /**
   * 권장사항 생성
   */
  private static generateRecommendations(
    selectedProcesses: string[],
    familyType: string,
    finalScore: number,
    buildingAge: number
  ): string[] {
    const recommendations: string[] = [];

    // 공정 개수 체크
    if (selectedProcesses.length < 3) {
      recommendations.push(
        '☆ 더 많은 공정 추가를 고려하세요. 주방+욕실 조합은 만족도를 크게 높입니다.'
      );
    }

    // 가족 타입별 추천
    if (familyType === 'newborn_infant') {
      if (!selectedProcesses.includes('insulation_ventilation')) {
        recommendations.push('☆ 영유아 가정은 통풍/환기 개선이 건강에 중요합니다.');
      }
      if (!selectedProcesses.includes('bathroom')) {
        recommendations.push(
          '☆ 욕실의 안전성 개선(미끄럼 방지, 온도 안정화)을 강력히 추천합니다.'
        );
      }
    }

    if (familyType === 'elderly') {
      if (!selectedProcesses.includes('doors_entrance')) {
        recommendations.push(
          '☆ 현관/중문의 단차 제거와 손잡이 설치가 안전성에 필수입니다.'
        );
      }
      if (!selectedProcesses.includes('lighting')) {
        recommendations.push('☆ 밝은 조명은 낙상 사고 예방에 도움이 됩니다.');
      }
    }

    // 구축 연식별 추천
    if (buildingAge >= 20) {
      if (!selectedProcesses.includes('plumbing')) {
        recommendations.push(
          '☆ 20년 이상 구축은 배관 교체를 적극 검토하세요 (누수 예방).'
        );
      }
      if (!selectedProcesses.includes('electrical_system')) {
        recommendations.push('☆ 전기 용량 증설로 화재 위험을 낮추세요.');
      }
    }

    // 점수별 조언
    if (finalScore < 70) {
      recommendations.push(
        '⚠️ 이 정도의 공사로는 만족도가 낮을 수 있습니다. 주방 또는 욕실 추가를 검토하세요.'
      );
    }

    if (finalScore >= 85) {
      recommendations.push(
        '✓ 우수한 공정 조합입니다! 이 정도의 공사면 생활 만족도가 크게 향상될 것입니다.'
      );
    }

    return recommendations.length > 0
      ? recommendations
      : ['☆ 현재 선택은 적절한 수준입니다.'];
  }
}
