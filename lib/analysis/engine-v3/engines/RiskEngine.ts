/**
 * V3 리스크 엔진 (RiskEngine)
 * 
 * 성향 지표와 공정 선택을 기반으로 3단계 리스크를 판단합니다.
 * 1단계: 현재 문제 리스크 (Current)
 * 2단계: 미래 예측 리스크 (Future)
 * 3단계: 공정 누락 리스크 (Missing)
 * 
 * 처리 흐름:
 * 1. 현재 문제 리스크 탐지
 * 2. 미래 예측 리스크 탐지
 * 3. 공정 누락 리스크 탐지
 * 4. 우선순위 정렬 (영향도 높은 순)
 */

import {
  RiskEngineInput,
  RiskEngineResult,
  Risk,
  RiskType,
  RiskLevel,
  RiskTiming,
  TraitIndicators12
} from '../types'
import { scoreToLevel } from '../utils/scoreValidator'

export class RiskEngine {
  /**
   * 리스크 분석 메인 함수
   */
  async analyze(input: RiskEngineInput): Promise<RiskEngineResult> {
    console.log('⚠️ [RiskEngine] 리스크 분석 시작')
    const startTime = Date.now()

    try {
      const risks: Risk[] = []

      // 1단계: 현재 문제 리스크
      const currentRisks = this.detectCurrentIssues(input)
      risks.push(...currentRisks)

      // 2단계: 미래 예측 리스크
      const futureRisks = this.predictFutureRisks(input)
      risks.push(...futureRisks)

      // 3단계: 공정 누락 리스크
      const missingRisks = this.checkMissingProcesses(input)
      risks.push(...missingRisks)

      // 우선순위 정렬 (영향도 높은 순)
      const sortedRisks = this.sortByImpact(risks)

      const executionTime = Date.now() - startTime
      console.log(`✅ [RiskEngine] 리스크 분석 완료 (${executionTime}ms, ${sortedRisks.length}개 리스크)`)

      return { risks: sortedRisks }
    } catch (error) {
      console.error('❌ [RiskEngine] 리스크 분석 오류:', error)
      return { risks: [] }
    }
  }

  /**
   * 1단계: 현재 문제 리스크 탐지
   */
  private detectCurrentIssues(input: RiskEngineInput): Risk[] {
    const risks: Risk[] = []
    const { adjustedIndicators, processResult, spaceInfo } = input

    // 리스크 1: 수납 부족
    if (adjustedIndicators.수납중요도 >= 70) {
      const hasStorageProcess = processResult.recommendedProcesses.some(
        p => p.id.includes('storage') || p.id.includes('closet')
      )
      if (!hasStorageProcess) {
        risks.push({
          id: 'storage_shortage',
          type: 'current',
          title: '수납 공간 부족 위험',
          level: 'high',
          timing: 'immediate',
          description: '수납중요도가 매우 높지만, 수납 관련 공정이 계획에 없습니다.',
          impact: '물건이 쌓여 거실과 방이 어지러워지고, 생활 동선이 막힐 수 있습니다.',
          solution1: '붙박이장, 시스템 선반, 수납장 등을 추가로 검토해보세요.',
          solution2: '최소한 현관이나 거실에 수납 공간을 확보하시는 것을 권장합니다.'
        })
      }
    }

    // 리스크 2: 동선 개선 누락
    if (adjustedIndicators.동선중요도 >= 70) {
      const hasFlowProcess = processResult.recommendedProcesses.some(
        p => p.id.includes('layout') || p.id.includes('flow')
      )
      if (!hasFlowProcess) {
        risks.push({
          id: 'flow_issue',
          type: 'current',
          title: '동선 개선 누락',
          level: 'high',
          timing: 'immediate',
          description: '동선중요도가 매우 높지만, 동선 개선 계획이 없습니다.',
          impact: '아침 준비, 요리, 청소 등 일상생활에서 계속 불편함을 느낄 수 있습니다.',
          solution1: '주방 동선, 욕실 접근성 등을 우선적으로 개선하세요.',
          solution2: '가구 배치나 문 위치를 조정하는 것만으로도 효과가 있습니다.'
        })
      }
    }

    // 리스크 3: 방음 필요
    if (adjustedIndicators.소음민감도 >= 70) {
      const hasSoundproofProcess = processResult.recommendedProcesses.some(
        p => p.id.includes('soundproof') || p.id.includes('door')
      )
      if (!hasSoundproofProcess) {
        risks.push({
          id: 'noise_sensitivity',
          type: 'current',
          title: '소음 문제 미해결',
          level: 'medium',
          timing: 'short_term',
          description: '소음민감도가 높지만 방음 처리가 계획에 없습니다.',
          impact: '층간 소음, 옆집 소음 등으로 인한 스트레스가 계속될 수 있습니다.',
          solution1: '방음문 교체, 벽체 방음 처리를 검토해보세요.',
          solution2: '예산이 부족하면 침실만이라도 방음 커튼, 방음재를 추가하세요.'
        })
      }
    }

    // 리스크 4: 관리/청소 어려움
    if (adjustedIndicators.관리민감도 >= 70) {
      const hasEasyCleanProcess = processResult.recommendedProcesses.some(
        p => p.id.includes('easy_clean') || p.label.includes('청소')
      )
      if (!hasEasyCleanProcess) {
        risks.push({
          id: 'maintenance_difficulty',
          type: 'current',
          title: '관리 어려운 마감재 선택 위험',
          level: 'medium',
          timing: 'short_term',
          description: '관리민감도가 높지만, 청소 편의성이 고려되지 않았습니다.',
          impact: '유광 타일, 복잡한 구조 등으로 청소 스트레스가 증가할 수 있습니다.',
          solution1: '무광 타일, 강화마루, 청소하기 쉬운 상판 등을 선택하세요.',
          solution2: '욕실, 주방은 특히 관리 편의성을 우선 고려해야 합니다.'
        })
      }
    }

    return risks
  }

  /**
   * 2단계: 미래 예측 리스크
   */
  private predictFutureRisks(input: RiskEngineInput): Risk[] {
    const risks: Risk[] = []
    const { adjustedIndicators, spaceInfo } = input

    // 리스크: 가족 구성 변화
    if (spaceInfo.ageRanges && spaceInfo.ageRanges.includes('0-5')) {
      risks.push({
        id: 'kids_growth',
        type: 'future',
        title: '아이 성장에 따른 공간 부족',
        level: 'medium',
        timing: 'mid_term',
        description: '아이가 크면서 개인 공간, 학습 공간이 필요해질 수 있습니다.',
        impact: '3-5년 후 방 구조나 수납 시스템을 다시 손봐야 할 수 있습니다.',
        solution1: '성장 단계를 고려한 유연한 공간 구조를 계획하세요.',
        solution2: '아이 방은 확장 가능하도록 여유를 두는 것이 좋습니다.'
      })
    }

    // 리스크: 반려동물 관련
    if (adjustedIndicators.반려동물영향도 >= 60) {
      const hasPetConsideration = input.processResult.recommendedProcesses.some(
        p => p.label.includes('반려동물') || p.label.includes('바닥')
      )
      if (!hasPetConsideration) {
        risks.push({
          id: 'pet_damage',
          type: 'future',
          title: '반려동물로 인한 마감재 손상',
          level: 'medium',
          timing: 'short_term',
          description: '반려동물 영향도가 높지만 내구성 있는 마감재가 고려되지 않았습니다.',
          impact: '바닥 기스, 벽지 손상 등이 빠르게 발생할 수 있습니다.',
          solution1: '강화마루, 내구성 높은 벽지/필름 등을 선택하세요.',
          solution2: '소파, 러그도 반려동물 친화적 소재로 선택하세요.'
        })
      }
    }

    // 리스크: 장기 거주 시 집값 방어
    if (adjustedIndicators.집값방어의식 >= 60) {
      risks.push({
        id: 'resale_value',
        type: 'future',
        title: '재판매 시 집값 방어 포인트 부족',
        level: 'low',
        timing: 'long_term',
        description: '집값 방어 의식이 있지만, 재판매 가치를 높일 포인트가 부족합니다.',
        impact: '매매 시 호가를 높이기 어렵거나, 빠른 거래가 어려울 수 있습니다.',
        solution1: '주방, 욕실, 바닥은 기본 이상 투자를 권장합니다.',
        solution2: '너무 개성 강한 스타일은 피하고, 대중적 취향을 고려하세요.'
      })
    }

    return risks
  }

  /**
   * 3단계: 공정 누락 리스크
   */
  private checkMissingProcesses(input: RiskEngineInput): Risk[] {
    const risks: Risk[] = []
    const { adjustedIndicators, processResult } = input

    // 필수 공정 개수 체크
    const essentialCount = processResult.recommendedProcesses.filter(
      p => p.priority === 'essential'
    ).length

    if (essentialCount < 2) {
      risks.push({
        id: 'insufficient_processes',
        type: 'missing',
        title: '필수 공정이 너무 적음',
        level: 'medium',
        timing: 'immediate',
        description: '성향 분석 결과 필수 공정이 2개 미만으로 나타났습니다.',
        impact: '현재 불편 요소가 제대로 해결되지 않을 수 있습니다.',
        solution1: '우선 공간/공정을 다시 확인하고 추가 검토하세요.',
        solution2: '예산이 부족하다면 1순위 공간만이라도 제대로 진행하세요.'
      })
    }

    // 우선 공간이 비어있음
    if (processResult.prioritySpaces.length === 0) {
      risks.push({
        id: 'no_priority_spaces',
        type: 'missing',
        title: '우선 공간이 선택되지 않음',
        level: 'high',
        timing: 'immediate',
        description: '분석 결과 우선 투자할 공간이 명확하지 않습니다.',
        impact: '예산이 분산되어 어느 공간도 만족스럽지 않을 수 있습니다.',
        solution1: '가장 불편한 공간 1-2곳을 우선 선택하세요.',
        solution2: '전체를 조금씩 하기보다 핵심 공간을 집중 투자하는 것이 좋습니다.'
      })
    }

    return risks
  }

  /**
   * 리스크 우선순위 정렬
   * 순서: level (high → medium → low) → timing (immediate → short → mid → long)
   */
  private sortByImpact(risks: Risk[]): Risk[] {
    const levelOrder: Record<RiskLevel, number> = {
      high: 1,
      medium: 2,
      low: 3
    }

    const timingOrder: Record<RiskTiming, number> = {
      immediate: 1,
      short_term: 2,
      mid_term: 3,
      long_term: 4
    }

    return risks.sort((a, b) => {
      const levelDiff = levelOrder[a.level] - levelOrder[b.level]
      if (levelDiff !== 0) return levelDiff

      const timingDiff = timingOrder[a.timing] - timingOrder[b.timing]
      return timingDiff
    })
  }
}

/**
 * 싱글톤 인스턴스
 */
export const riskEngine = new RiskEngine()




























