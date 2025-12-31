/**
 * V3 시나리오 엔진 (ScenarioEngine)
 * 
 * 고객의 성향과 생활 패턴을 기반으로
 * 60개 생활 시나리오 중 매칭되는 3-5개를 선택합니다.
 * 
 * 처리 흐름:
 * 1. 시나리오 데이터 로드
 * 2. 조건 매칭 (indicators, lifestyleType, 가족 구성 등)
 * 3. 매칭 점수 계산
 * 4. 상위 3-5개 선택
 */

import {
  ScenarioEngineInput,
  ScenarioEngineResult,
  LifestyleScenario,
  LifestyleScenarioData,
  ScenarioConditions,
  TraitIndicators12
} from '../types'
import { loadLifestyleScenarios } from '../utils/dataLoader'

export class ScenarioEngine {
  /**
   * 시나리오 매칭 메인 함수
   */
  async analyze(input: ScenarioEngineInput): Promise<ScenarioEngineResult> {
    console.log('📖 [ScenarioEngine] 시나리오 매칭 시작')
    const startTime = Date.now()

    try {
      // 1. 시나리오 데이터 로드
      const data = await loadLifestyleScenarios()
      const allScenarios = data.scenarios

      // 2. 조건 매칭
      const matchedScenarios = allScenarios.filter(scenario => {
        return this.checkConditions(scenario.conditions, input)
      })

      console.log(`🔍 [ScenarioEngine] ${allScenarios.length}개 중 ${matchedScenarios.length}개 매칭됨`)

      // 3. 매칭 점수 계산 및 정렬
      const scoredScenarios = matchedScenarios.map(scenario => ({
        scenario,
        score: this.calculateMatchScore(scenario, input)
      }))

      scoredScenarios.sort((a, b) => b.score - a.score)

      // 4. 상위 3-5개 선택
      const topCount = Math.min(5, scoredScenarios.length)
      const topScenarios = scoredScenarios.slice(0, topCount)

      // 5. 최종 형식으로 변환
      const scenarios: LifestyleScenario[] = topScenarios.map(item => ({
        id: item.scenario.id,
        category: item.scenario.category,
        title: item.scenario.title,
        current: item.scenario.scenario.current,
        futureWithout: item.scenario.scenario.futureWithout,
        futureWith: item.scenario.scenario.futureWith,
        keyPoints: item.scenario.recommendation.keyPoints
      }))

      const executionTime = Date.now() - startTime
      console.log(`✅ [ScenarioEngine] 시나리오 매칭 완료 (${executionTime}ms, ${scenarios.length}개 선택)`)

      return { scenarios }
    } catch (error) {
      console.error('❌ [ScenarioEngine] 시나리오 매칭 오류:', error)
      
      // Fallback: 빈 배열
      return { scenarios: [] }
    }
  }

  /**
   * 시나리오 조건 체크
   */
  private checkConditions(
    conditions: ScenarioConditions,
    input: ScenarioEngineInput
  ): boolean {
    const { adjustedIndicators, lifestyleType, processResult, riskResult } = input

    // 1. 성향 지표 조건 체크
    if (conditions.indicators) {
      for (const [indicator, range] of Object.entries(conditions.indicators)) {
        const key = indicator as keyof TraitIndicators12
        const value = adjustedIndicators[key]

        if (range.min !== undefined && value < range.min) {
          return false
        }
        if (range.max !== undefined && value > range.max) {
          return false
        }
      }
    }

    // 2. 생활 루틴 유형 체크
    if (conditions.lifestyleType) {
      const types = Array.isArray(conditions.lifestyleType)
        ? conditions.lifestyleType
        : [conditions.lifestyleType]
      
      if (!types.includes(lifestyleType)) {
        return false
      }
    }

    // 3. 가족 구성 체크 (hasKids, hasPets)
    if (conditions.hasKids !== undefined) {
      const hasKids = adjustedIndicators.가족영향도 >= 60
      if (conditions.hasKids !== hasKids) {
        return false
      }
    }

    if (conditions.hasPets !== undefined) {
      const hasPets = adjustedIndicators.반려동물영향도 >= 30
      if (conditions.hasPets !== hasPets) {
        return false
      }
    }

    // 4. 가족 크기 체크
    if (conditions.familySize) {
      // processResult에서 spaceInfo 접근 필요 (현재 구조상 없음)
      // 임시로 가족영향도로 추정
      const estimatedSize = adjustedIndicators.가족영향도 >= 70 ? 4 : 2
      
      if (conditions.familySize.min !== undefined && estimatedSize < conditions.familySize.min) {
        return false
      }
      if (conditions.familySize.max !== undefined && estimatedSize > conditions.familySize.max) {
        return false
      }
    }

    // 모든 조건 통과
    return true
  }

  /**
   * 매칭 점수 계산
   * 점수가 높을수록 고객에게 잘 맞는 시나리오
   */
  private calculateMatchScore(
    scenarioData: LifestyleScenarioData,
    input: ScenarioEngineInput
  ): number {
    let score = 0
    const { adjustedIndicators, lifestyleType, processResult } = input

    // 1. 성향 지표 일치도 (최대 50점)
    if (scenarioData.conditions.indicators) {
      for (const [indicator, range] of Object.entries(scenarioData.conditions.indicators)) {
        const key = indicator as keyof TraitIndicators12
        const value = adjustedIndicators[key]

        // 범위 내 값일수록 점수 증가
        if (range.min !== undefined) {
          const diff = value - range.min
          score += Math.min(10, diff / 5)  // 최대 10점
        }
      }
    }

    // 2. 생활 루틴 유형 일치 (20점)
    if (scenarioData.conditions.lifestyleType) {
      const types = Array.isArray(scenarioData.conditions.lifestyleType)
        ? scenarioData.conditions.lifestyleType
        : [scenarioData.conditions.lifestyleType]
      
      if (types.includes(lifestyleType)) {
        score += 20
      }
    }

    // 3. 우선 공간 일치도 (최대 20점)
    const prioritySpaceIds = processResult.prioritySpaces.map(s => s.spaceId)
    const scenarioSpaces = scenarioData.recommendation.prioritySpaces

    for (const spaceId of scenarioSpaces) {
      if (prioritySpaceIds.includes(spaceId) || prioritySpaceIds.includes(this.normalizeSpaceId(spaceId))) {
        score += 10
      }
    }

    // 4. 추천 공정 일치도 (최대 10점)
    const recommendedProcessIds = processResult.recommendedProcesses.map(p => p.id)
    const scenarioProcesses = scenarioData.recommendation.priorityProcesses

    for (const processId of scenarioProcesses) {
      if (recommendedProcessIds.includes(processId)) {
        score += 5
      }
    }

    return Math.round(score)
  }

  /**
   * 공간 ID 정규화 (한글 ↔ 영어)
   */
  private normalizeSpaceId(spaceId: string): string {
    const mapping: Record<string, string> = {
      '거실': 'living',
      '주방': 'kitchen',
      '안방': 'bedroom',
      '욕실': 'bathroom',
      '수납': 'storage',
      '작업실': 'workspace',
      'living': '거실',
      'kitchen': '주방',
      'bedroom': '안방',
      'bathroom': '욕실',
      'storage': '수납',
      'workspace': '작업실'
    }
    return mapping[spaceId] || spaceId
  }
}

/**
 * 싱글톤 인스턴스
 */
export const scenarioEngine = new ScenarioEngine()




























