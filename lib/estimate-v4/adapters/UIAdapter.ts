/**
 * V4 UIAdapter - UI 어댑터
 * 
 * 견적 결과를 프론트엔드 표시용으로 변환
 */

import type {
  EstimateResultV4,
  PersonalityResultV4,
  StrategyResultV4,
  UIEstimateV4,
} from '../types'
import { GRADE_INFO } from '../converters/grade-mapper'
import { logger } from '../utils/logger'

/**
 * UI 어댑터 메인 함수
 */
export function adaptForUI(
  estimate: EstimateResultV4,
  personality: PersonalityResultV4,
  strategy: StrategyResultV4,
  selectedSpaces: string[] = []  // 버그 1 방지: 선택된 공간 필터링용
): UIEstimateV4 {
  // 실패 시
  if (estimate.status === 'ESTIMATE_FAILED') {
    return {
      isSuccess: false,
      grade: strategy.recommendedGrade,
      gradeName: getGradeName(strategy.recommendedGrade),
      total: { formatted: '-', perPyeong: '-' },
      breakdown: [],
      personalityMatch: { score: 0, highlights: [] },
      warnings: [],
      errorMessage: estimate.failures?.reasons[0] ?? '견적 계산 실패',
      hasPersonalityData: personality.traitScores.length > 0,
      personalityBasedMessage: personality.traitScores.length > 0
        ? '고객님의 성향 분석 결과를 반영한 맞춤 견적입니다.'
        : '특정 선택 기준 없이 일반적인 조합으로 구성된 결과입니다.',
    }
  }

  // 성공 시
  const summary = estimate.summary!
  const gradeInfo = GRADE_INFO[estimate.meta.grade]

  // 버그 1 방지: 선택된 공간의 공정만 필터링
  // breakdown이 없으면 실패로 처리
  if (!estimate.breakdown || estimate.breakdown.length === 0) {
    logger.warn('UIAdapter', 'breakdown이 비어있음', {
      status: estimate.status,
      hasBreakdown: !!estimate.breakdown,
      breakdownLength: estimate.breakdown?.length || 0,
      selectedSpacesCount: selectedSpaces.length,
      selectedSpaces,
      processStrategyCount: strategy.processStrategy.length,
    })
    return {
      isSuccess: false,
      grade: estimate.meta.grade,
      gradeName: gradeInfo.name,
      total: {
        formatted: '-',
        perPyeong: '-',
      },
      breakdown: [],
      personalityMatch: {
        score: calculateMatchScore(personality, strategy),
        highlights: extractHighlights(personality.classifiedTypes),
      },
      warnings: generateWarnings(personality.riskAssessment),
      errorMessage: selectedSpaces.length === 0
        ? '선택된 공간이 없어 견적을 계산할 수 없습니다. 공사 범위를 다시 선택해주세요.'
        : '선택된 공정이 없어 견적을 계산할 수 없습니다. 공정을 다시 선택해주세요.',
      hasPersonalityData: personality.traitScores.length > 0 && 
                         personality.traitScores.some(s => s.confidence > 0.5),
      personalityBasedMessage: personality.traitScores.length > 0 && 
                               personality.traitScores.some(s => s.confidence > 0.5)
        ? '고객님의 성향 분석 결과를 반영한 맞춤 견적입니다.'
        : '특정 선택 기준 없이 일반적인 조합으로 구성된 결과입니다.',
    }
  }

  const filteredBreakdown = estimate.breakdown.filter(block => {
    // common 공정은 항상 표시
    if (block.spaces.includes('common')) return true
    // 선택된 공간의 공정만 표시
    if (selectedSpaces.length === 0) return true  // 공간 선택 없으면 모두 표시
    return block.spaces.some(space => selectedSpaces.includes(space))
  })

  logger.debug('UIAdapter', 'breakdown 필터링', {
    originalCount: estimate.breakdown.length,
    filteredCount: filteredBreakdown.length,
    selectedSpaces,
  })

  return {
    isSuccess: true,
    grade: estimate.meta.grade,
    gradeName: gradeInfo.name,
    total: {
      formatted: formatWon(summary.grandTotal),
      perPyeong: `평당 ${formatWon(summary.costPerPyeong)}`,
    },
    breakdown: filteredBreakdown.map(block => ({
      processName: block.processName,
      amount: formatWon(block.processTotal),
      percentage: Math.round(
        (block.processTotal / summary.grandTotal) * 100
      ),
      materials: block.materials.map(m => ({
        name: m.name,
        quantity: `${m.quantity}${m.unit}`,
        unitPrice: formatWon(m.unitPrice),
        totalPrice: formatWon(m.totalPrice),
      })),
      labor: block.labor ? {
        type: block.labor.laborType,
        amount: formatWon(block.labor.totalCost),
      } : null,
    })),
    personalityMatch: {
      score: calculateMatchScore(personality, strategy),
      highlights: extractHighlights(personality.classifiedTypes),
    },
    warnings: generateWarnings(personality.riskAssessment),
    hasPersonalityData: personality.traitScores.length > 0 && 
                       personality.traitScores.some(s => s.confidence > 0.5),
    personalityBasedMessage: personality.traitScores.length > 0 && 
                             personality.traitScores.some(s => s.confidence > 0.5)
      ? '고객님의 성향 분석 결과를 반영한 맞춤 견적입니다.'
      : '특정 선택 기준 없이 일반적인 조합으로 구성된 결과입니다.',
  }
}

/**
 * 등급명 가져오기
 */
function getGradeName(grade: StrategyResultV4['recommendedGrade']): string {
  return GRADE_INFO[grade].name
}

/**
 * 금액 포맷 (원)
 */
function formatWon(amount: number): string {
  if (amount >= 10000000) {
    const man = Math.round(amount / 10000)
    return `${man.toLocaleString('ko-KR')}만원`
  }
  return `${amount.toLocaleString('ko-KR')}원`
}

/**
 * 성향 매칭 점수 계산
 */
function calculateMatchScore(
  personality: PersonalityResultV4,
  strategy: StrategyResultV4
): number {
  // 간소화: 공정별 성향 매칭도 평균
  const matches = strategy.processStrategy.map(p => p.personalityMatch)
  if (matches.length === 0) return 0.5

  const avg = matches.reduce((a, b) => a + b, 0) / matches.length
  return Math.round(avg * 100) // 0-100 범위
}

/**
 * 하이라이트 추출
 */
function extractHighlights(
  classifiedTypes: PersonalityResultV4['classifiedTypes']
): string[] {
  const highlights: string[] = []

  if (classifiedTypes.lifestyle.includes('remote_work')) {
    highlights.push('재택근무 환경 최적화')
  }
  if (classifiedTypes.family.includes('has_child')) {
    highlights.push('자녀 안전 고려')
  }
  if (classifiedTypes.personality.includes('clean_oriented')) {
    highlights.push('청결 편의성 강화')
  }

  return highlights
}

/**
 * 경고 메시지 생성
 */
function generateWarnings(
  riskAssessment: PersonalityResultV4['riskAssessment']
): string[] {
  const warnings: string[] = []

  if (riskAssessment.level === 'high') {
    warnings.push('위험 수준이 높아 예비비를 충분히 확보하세요.')
  }
  if (riskAssessment.bufferPercentage >= 15) {
    warnings.push(
      `예비비 ${riskAssessment.bufferPercentage}%를 권장합니다.`
    )
  }

  return warnings
}

