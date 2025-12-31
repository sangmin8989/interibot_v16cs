/**
 * 등급 추천 정책
 * 
 * ⚠️ 절대 규칙: 등급 추천 기준은 오직 이 파일에서만 관리합니다.
 * 
 * @see Phase 2 작업 5️⃣
 */

import type { ArgenGrade } from '@/lib/data/gradeSpecs'

/**
 * 등급 추천 정책
 */
export const gradePolicy = {
  version: '1.0',
  updatedAt: '2025-01-21',
  
  /**
   * 가중치 (총합 100%)
   */
  weights: {
    budget: 0.4,      // 예산 가중치 (40%)
    lifestyle: 0.3,   // 생활패턴 가중치 (30%)
    purpose: 0.3,     // 거주 목적 가중치 (30%)
  },

  /**
   * 등급 결정 임계값
   */
  thresholds: {
    essential: {
      min: 0,
      max: 40,
    },
    standard: {
      min: 41,
      max: 70,
    },
    opus: {
      min: 71,
      max: 100,
    },
  },

  /**
   * 예산 매핑 (평당 예산 기준)
   */
  budgetMapping: {
    'under_100': 10,      // 평당 100만원 미만
    '100_120': 20,        // 평당 100~120만원
    '120_150': 25,        // 평당 120~150만원
    '150_180': 30,        // 평당 150~180만원
    'over_180': 40,       // 평당 180만원 이상
  },

  /**
   * 라이프스타일 매핑 (트레이트 기반)
   */
  lifestyleMapping: {
    'COOKING_LOVER': 10,
    'CLEANING_SYSTEM_NEED': 5,
    'SOUNDPROOF_NEED': 10,
    'SAFETY_NEED': 5,
  },

  /**
   * 거주 목적 매핑
   */
  purposeMapping: {
    'longterm': 15,   // 장기 거주 (7년+)
    'midterm': 10,    // 중기 거주 (3~7년)
    'sale': 5,        // 매도 목적
    'rent': 8,        // 임대 목적
  },
} as const

/**
 * 예산 범위 계산
 */
export function getBudgetRange(budgetPerPyeong: number): keyof typeof gradePolicy.budgetMapping {
  if (budgetPerPyeong < 100) return 'under_100'
  if (budgetPerPyeong < 120) return '100_120'
  if (budgetPerPyeong < 150) return '120_150'
  if (budgetPerPyeong < 180) return '150_180'
  return 'over_180'
}

/**
 * 등급 결정
 */
export function determineGrade(totalScore: number): ArgenGrade {
  if (totalScore <= gradePolicy.thresholds.essential.max) {
    return 'ESSENTIAL'
  }
  if (totalScore <= gradePolicy.thresholds.standard.max) {
    return 'STANDARD'
  }
  return 'OPUS'
}


