/**
 * 인테리봇 AI 판단 레이어 - 판단 축 타입 정의
 * 
 * 통합 설계서 기준:
 * - 각 축은 0~100 스코어로 내부 계산
 * - 결과값은 화면·옵션·경고 강도에만 사용
 * - 고객에게 직접 노출하지 않음
 */

import { PreferenceScores } from '../types';
import { TraitIndicators12 } from '../engine-v3/types';

/**
 * 4개 판단 축 (0~100 스코어)
 */
export interface JudgmentAxes {
  /** 비용 민감도 (0: 영향 없음, 100: 강한 거부) */
  costSensitivity: number;
  
  /** 리스크 회피도 (하자/추가비/분쟁 회피 성향) */
  riskAversion: number;
  
  /** 결정 지연 성향 (비교/검색/고민을 오래 끄는 경향) */
  decisionDrag: number;
  
  /** 통제 욕구 ("내가 다 정하겠다" vs "알아서 정리해 달라") */
  controlNeed: number;
}

/**
 * 개입 강도 (판단 축 기반 계산)
 */
export type InterventionLevel = 'low' | 'mid' | 'high';

/**
 * PreferenceScores → JudgmentAxes 변환
 * 
 * 기존 15개 카테고리 점수(1~10)를 4개 판단 축(0~100)으로 변환
 */
export function convertScoresToAxes(scores: PreferenceScores): JudgmentAxes {
  // A. 비용 민감도
  // budget_sense가 낮을수록(1에 가까울수록) 비용 민감도 높음
  // 1~10 점수를 0~100으로 변환 (역변환)
  const costSensitivity = (10 - scores.budget_sense) * 10;
  
  // B. 리스크 회피도
  // health_factors + discomfort_factors 평균
  // 1~10 점수를 0~100으로 변환
  const riskAversion = ((scores.health_factors + scores.discomfort_factors) / 2) * 10;
  
  // C. 결정 지연 성향
  // organization_habit이 높을수록(10에 가까울수록) 즉결형 → 결정 지연 성향 낮음
  // 역변환: 낮을수록 결정 지연 성향 높음
  const decisionDrag = (10 - scores.organization_habit) * 10;
  
  // D. 통제 욕구
  // space_sense가 높을수록 통제 욕구 높음
  // 1~10 점수를 0~100으로 변환
  const controlNeed = scores.space_sense * 10;
  
  return {
    costSensitivity: Math.max(0, Math.min(100, Math.round(costSensitivity))),
    riskAversion: Math.max(0, Math.min(100, Math.round(riskAversion))),
    decisionDrag: Math.max(0, Math.min(100, Math.round(decisionDrag))),
    controlNeed: Math.max(0, Math.min(100, Math.round(controlNeed))),
  };
}

/**
 * TraitIndicators12 → JudgmentAxes 변환
 * 
 * V3 엔진의 12개 지표를 4개 판단 축으로 변환
 */
export function convertTraitsToAxes(indicators: TraitIndicators12): JudgmentAxes {
  // A. 비용 민감도
  // 예산탄력성이 낮을수록(0에 가까울수록) 비용 민감도 높음
  const costSensitivity = 100 - indicators.예산탄력성;
  
  // B. 리스크 회피도
  // 소음민감도 + 관리민감도 평균
  const riskAversion = (indicators.소음민감도 + indicators.관리민감도) / 2;
  
  // C. 결정 지연 성향
  // 공사복잡도수용성이 낮을수록 결정 지연 성향 높음
  const decisionDrag = 100 - indicators.공사복잡도수용성;
  
  // D. 통제 욕구
  // 스타일고집도가 높을수록 통제 욕구 높음
  const controlNeed = indicators.스타일고집도;
  
  return {
    costSensitivity: Math.max(0, Math.min(100, Math.round(costSensitivity))),
    riskAversion: Math.max(0, Math.min(100, Math.round(riskAversion))),
    decisionDrag: Math.max(0, Math.min(100, Math.round(decisionDrag))),
    controlNeed: Math.max(0, Math.min(100, Math.round(controlNeed))),
  };
}

/**
 * 개입 강도 계산
 * 
 * 공식: 개입 강도 = 리스크 회피도(B) ↑ + 결정 지연형(C) ↑ + 통제 욕구(D) ↓
 */
export function calculateInterventionLevel(axes: JudgmentAxes): InterventionLevel {
  let score = 0;
  
  // 리스크 회피도 ↑ (높을수록 개입 강도 높음)
  if (axes.riskAversion >= 70) score += 3;
  else if (axes.riskAversion >= 50) score += 2;
  else score += 1;
  
  // 결정 지연 성향 ↑ (높을수록 개입 강도 높음)
  if (axes.decisionDrag >= 70) score += 3;
  else if (axes.decisionDrag >= 50) score += 2;
  else score += 1;
  
  // 통제 욕구 ↓ (낮을수록 개입 강도 높음)
  if (axes.controlNeed <= 30) score += 3;
  else if (axes.controlNeed <= 50) score += 2;
  else score += 1;
  
  // 개입 강도 결정
  if (score >= 8) return 'high';
  if (score >= 5) return 'mid';
  return 'low';
}

/**
 * 판단 축 요약 (디버깅용)
 */
export function summarizeAxes(axes: JudgmentAxes): string {
  const level = calculateInterventionLevel(axes);
  return `비용민감도:${axes.costSensitivity} 리스크회피도:${axes.riskAversion} 결정지연:${axes.decisionDrag} 통제욕구:${axes.controlNeed} → 개입강도:${level}`;
}













