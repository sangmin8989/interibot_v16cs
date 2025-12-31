/**
 * 아르젠 3등급 추천 로직
 * 
 * 사용자 입력 기반으로 ESSENTIAL, STANDARD, OPUS 중 적합한 등급 추천
 */

import type { ArgenGrade } from '@/lib/data/gradeSpecs'
import type { SpaceInfo } from '@/lib/store/spaceInfoStore'

export interface UserInput {
  // 집 정보
  housingType: string
  pyeong: number
  rooms: number
  bathrooms: number

  // 예산
  budget: number // 만원 단위

  // 라이프스타일
  cookingFrequency: 'daily' | 'often' | 'sometimes' | 'rarely'
  cleaningStyle: 'daily' | 'weekly' | 'lazy' | 'robot'
  noiseSensitivity: 'high' | 'medium' | 'low'
  socialFrequency: 'often' | 'sometimes' | 'rarely'
  workFromHome: 'daily' | 'sometimes' | 'never'

  // 거주 계획
  residencePlan: 'short' | 'medium' | 'long' // ~3년, 3~7년, 7년+
  purpose: 'residence' | 'sale' | 'rent' // 실거주, 매도, 임대

  // 우선순위
  priority: 'design' | 'practical' | 'balance'
}

export interface GradeRecommendation {
  grade: ArgenGrade
  score: number // 0~100점
  reasons: string[]
  confidence: 'high' | 'medium' | 'low'
  alternativeGrade?: ArgenGrade // 대안 등급
  upgradeInfo?: {
    from: ArgenGrade
    to: ArgenGrade
    additionalCost: number // 만원
    keyChanges: string[]
    valueIncrease: {
      homeValue: string
      lifeQuality: string
      maintenance: string
    }
    aiComment: string
  }
}

/**
 * SpaceInfo를 UserInput으로 변환
 */
export function convertSpaceInfoToUserInput(spaceInfo: SpaceInfo): Partial<UserInput> {
  const input: Partial<UserInput> = {
    housingType: spaceInfo.housingType,
    pyeong: spaceInfo.pyeong,
    rooms: spaceInfo.rooms,
    bathrooms: spaceInfo.bathrooms,
    budget: spaceInfo.budgetAmount || 
        (spaceInfo.budget && spaceInfo.budget !== 'unknown' 
          ? getBudgetFromRange(spaceInfo.budget) 
          : undefined),
    residencePlan: convertStayPlan(spaceInfo.stayPlan),
    purpose: convertPurpose(spaceInfo.purpose, spaceInfo.livingPurpose),
    cookingFrequency: convertCookFreq(spaceInfo.cookFreq),
    workFromHome: convertRemoteWork(spaceInfo.remoteWork),
  }

  return input
}

/**
 * 등급 추천 메인 함수
 */
export function recommendGrade(input: UserInput): GradeRecommendation {
  let score = 0
  const reasons: string[] = []

  // 1. 예산 기준 (35점)
  const pyeongBudget = input.budget / input.pyeong // 평당 예산
  if (pyeongBudget >= 200) {
    score += 35
    reasons.push('예산이 넉넉해서 프리미엄 자재 선택 가능')
  } else if (pyeongBudget >= 130) {
    score += 22
    reasons.push('적정 예산으로 밸런스 있는 구성 가능')
  } else {
    score += 10
    reasons.push('예산 내에서 필수 공정에 집중')
  }

  // 2. 거주 기간 (25점)
  if (input.residencePlan === 'long') {
    score += 25
    reasons.push('오래 사실 거라 내구성 좋은 자재 추천')
  } else if (input.residencePlan === 'medium') {
    score += 15
    reasons.push('중기 거주에 적합한 가성비 구성')
  } else {
    score += 5
    reasons.push('단기 거주라 필수만 확실하게')
  }

  // 3. 라이프스타일 (20점)
  if (input.cookingFrequency === 'daily') {
    score += 5
    reasons.push('요리 많이 하셔서 주방 투자 가치 있음')
  }
  if (input.noiseSensitivity === 'high') {
    score += 5
    reasons.push('소음에 민감하셔서 방음 투자 필요')
  }
  if (input.cleaningStyle === 'lazy' || input.cleaningStyle === 'robot') {
    score += 3
    reasons.push('청소 편한 자재로 구성')
  }
  if (input.socialFrequency === 'often') {
    score += 4
    reasons.push('손님 많으시면 거실/주방 투자 효과적')
  }
  if (input.workFromHome === 'daily') {
    score += 3
    reasons.push('재택근무 공간 필요')
  }

  // 4. 목적 (20점)
  if (input.purpose === 'residence' && input.priority === 'design') {
    score += 20
    reasons.push('실거주 + 디자인 중시 → 프리미엄 추천')
  } else if (input.purpose === 'sale') {
    score += 12
    reasons.push('매도 목적이라 대중적인 구성 추천')
  } else if (input.purpose === 'rent') {
    score += 8
    reasons.push('임대용이라 내구성 위주 구성')
  } else {
    score += 15
  }

  // 등급 결정
  let grade: ArgenGrade
  let confidence: 'high' | 'medium' | 'low'
  let alternativeGrade: ArgenGrade | undefined

  if (score >= 70) {
    grade = 'OPUS'
    confidence = score >= 85 ? 'high' : 'medium'
    alternativeGrade = 'STANDARD'
  } else if (score >= 45) {
    grade = 'STANDARD'
    confidence = score >= 55 && score < 70 ? 'high' : 'medium'
    if (score >= 60) {
      alternativeGrade = 'OPUS'
    } else {
      alternativeGrade = 'ESSENTIAL'
    }
  } else {
    grade = 'ESSENTIAL'
    confidence = score <= 30 ? 'high' : 'medium'
    alternativeGrade = 'STANDARD'
  }

  return {
    grade,
    score,
    reasons: reasons.slice(0, 3), // 상위 3개만
    confidence,
    alternativeGrade,
  }
}

/**
 * 등급 변경 시 차이 안내
 */
export function getUpgradeInfo(
  from: ArgenGrade,
  to: ArgenGrade,
  pyeong: number
): GradeRecommendation['upgradeInfo'] | null {
  if (from === to) return null

  if (from === 'ESSENTIAL' && to === 'STANDARD') {
    return {
      from,
      to,
      additionalCost: Math.round(pyeong * 65), // 평당 65만원 추가
      keyChanges: [
        '주방 상판: 인조대리석 → 엔지니어드스톤',
        '샤시: 기존 유지 → 이중샤시 추가',
        '도어: ABS → 온면도어',
        '가구: 기본 → 한샘/리바트급',
      ],
      valueIncrease: {
        homeValue: '+8점',
        lifeQuality: '+12점',
        maintenance: '+10점',
      },
      aiComment: '주방 상판만 바꿔도 요리할 때 체감이 확 달라요',
    }
  }

  if (from === 'STANDARD' && to === 'OPUS') {
    return {
      from,
      to,
      additionalCost: Math.round(pyeong * 95), // 평당 95만원 추가
      keyChanges: [
        '주방 상판: 엔지니어드스톤 → 세라믹/천연대리석',
        '샤시: 이중샤시 → 시스템창호',
        '바닥: 강마루 → 원목마루',
        '가구: 브랜드 → 아르젠 커스텀',
        '욕실: 국산 → 수입 도기',
      ],
      valueIncrease: {
        homeValue: '+10점',
        lifeQuality: '+15점',
        maintenance: '+8점',
      },
      aiComment: '10년 이상 사실 거면 이 정도 투자가 결국 이득이에요',
    }
  }

  if (from === 'ESSENTIAL' && to === 'OPUS') {
    return {
      from,
      to,
      additionalCost: Math.round(pyeong * 160), // 평당 160만원 추가
      keyChanges: [
        '주방: 전체 프리미엄 업그레이드',
        '샤시: 기존 → 시스템창호',
        '바닥: 강마루 → 원목마루',
        '가구: 기본 → 아르젠 커스텀',
        '욕실: 국산 → 수입 도기',
      ],
      valueIncrease: {
        homeValue: '+18점',
        lifeQuality: '+27점',
        maintenance: '+18점',
      },
      aiComment: '한 번 제대로 하면 손 안 대도 되는 구성이에요',
    }
  }

  // 다운그레이드 (역방향)
  if (from === 'STANDARD' && to === 'ESSENTIAL') {
    return {
      from,
      to,
      additionalCost: Math.round(pyeong * -65), // 절감
      keyChanges: [
        '주방 상판: 엔지니어드스톤 → 인조대리석',
        '샤시: 이중샤시 → 기존 유지',
        '도어: 온면도어 → ABS',
        '가구: 한샘/리바트 → 기본',
      ],
      valueIncrease: {
        homeValue: '-8점',
        lifeQuality: '-12점',
        maintenance: '-10점',
      },
      aiComment: '예산 절감을 위해 필수 공정에 집중',
    }
  }

  if (from === 'OPUS' && to === 'STANDARD') {
    return {
      from,
      to,
      additionalCost: Math.round(pyeong * -95), // 절감
      keyChanges: [
        '주방 상판: 세라믹 → 엔지니어드스톤',
        '샤시: 시스템창호 → 이중샤시',
        '바닥: 원목마루 → 강마루 프리미엄',
        '가구: 커스텀 → 브랜드',
        '욕실: 수입 → 국산 프리미엄',
      ],
      valueIncrease: {
        homeValue: '-10점',
        lifeQuality: '-15점',
        maintenance: '-8점',
      },
      aiComment: '가성비를 고려한 밸런스 구성',
    }
  }

  return null
}

/**
 * 등급별 AI 메시지 템플릿
 */
export function getGradeMessage(
  grade: ArgenGrade,
  reasons: string[],
  pyeong: number
): string {
  const { TOTAL_ESTIMATE_32PY } = require('@/lib/data/gradeSpecs')
  const estimate = TOTAL_ESTIMATE_32PY[grade]
  const scaledEstimate = require('@/lib/data/gradeSpecs').scaleEstimateByPyeong(estimate, pyeong)

  if (grade === 'ESSENTIAL') {
    return `💡 ARGEN ESSENTIAL을 추천드려요

추천 이유:
• ${reasons[0] || '필수 공정만 확실하게'}
• ${reasons[1] || '나머지는 기존 활용'}
• ${reasons[2] || '실속 있는 구성'}

이 등급의 핵심:
"필수 공정만 확실하게, 나머지는 기존 활용"

${pyeong}평 예상 견적: ${scaledEstimate.totalCost.toLocaleString()}만원

✓ 주방/욕실은 새것으로 교체
✓ 바닥재, 도배 새로 시공
✓ 샤시/중문은 기존 활용하거나 최소 투자

나중에 여유 생기면 샤시, 가구 추가하셔도 돼요.`
  }

  if (grade === 'STANDARD') {
    return `💡 ARGEN STANDARD를 추천드려요

추천 이유:
• ${reasons[0] || '가성비 최적화'}
• ${reasons[1] || '밸런스 있는 구성'}
• ${reasons[2] || '중기 거주에 적합'}

이 등급의 핵심:
"가성비 최적화, 밸런스 있는 구성"

${pyeong}평 예상 견적: ${scaledEstimate.totalCost.toLocaleString()}만원

✓ 주방 상판 엔지니어드스톤으로 업그레이드
✓ 이중샤시로 단열/방음 확보
✓ 한샘/리바트급 브랜드 가구
✓ 전체적으로 균형 잡힌 마감

5~10년 거주하시기에 최적의 구성이에요.`
  }

  // OPUS
  return `💡 ARGEN OPUS를 추천드려요

추천 이유:
• ${reasons[0] || '타협 없는 퀄리티'}
• ${reasons[1] || '10년 후에도 만족'}
• ${reasons[2] || '프리미엄 맞춤 구성'}

이 등급의 핵심:
"타협 없는 퀄리티, 10년 후에도 만족"

${pyeong}평 예상 견적: ${scaledEstimate.totalCost.toLocaleString()}만원

✓ 세라믹 상판, 수입 도기, 원목마루
✓ 시스템창호로 완벽한 단열
✓ 아르젠 커스텀 가구 (밀리 단위 맞춤)
✓ 스마트홈 기본 구성

한 번 제대로 하면 손 안 대도 되는 구성이에요.`
}

// ============================================================
// 헬퍼 함수들
// ============================================================

function getBudgetFromRange(budget: string): number {
  const budgetMap: Record<string, number> = {
    'under2000': 1500,
    '2000to4000': 3000,
    '4000to6000': 5000,
    'over6000': 7000,
  }
  return budgetMap[budget] || 3000
}

function convertStayPlan(
  stayPlan: SpaceInfo['stayPlan']
): UserInput['residencePlan'] {
  if (!stayPlan) return 'medium'
  if (stayPlan === 'under1y' || stayPlan === '1to3y') return 'short'
  if (stayPlan === '3to5y') return 'medium'
  if (stayPlan === 'over5y') return 'long'
  return 'medium'
}

function convertPurpose(
  purpose: SpaceInfo['purpose'],
  livingPurpose: SpaceInfo['livingPurpose']
): UserInput['purpose'] {
  if (purpose === 'live') return 'residence';   // ✅
  if (purpose === 'sell') return 'sale';        // ✅
  if (purpose === 'rent') return 'rent';        // ✅
  if (livingPurpose === '실거주') return 'residence'
  if (livingPurpose === '매도준비') return 'sale'
  if (livingPurpose === '임대') return 'rent'
  return 'residence'
}

function convertCookFreq(
  cookFreq: SpaceInfo['cookFreq']
): UserInput['cookingFrequency'] {
  if (!cookFreq) return 'sometimes'
  if (cookFreq === 'daily') return 'daily'
  if (cookFreq === 'sometimes') return 'sometimes'
  if (cookFreq === 'rarely') return 'rarely'
  return 'sometimes'
}

function convertRemoteWork(
  remoteWork: SpaceInfo['remoteWork']
): UserInput['workFromHome'] {
  if (!remoteWork) return 'never'
  if (remoteWork === 'none') return 'never'
  if (remoteWork === '1to2days') return 'sometimes'
  if (remoteWork === '3plus') return 'daily'
  return 'never'
}




