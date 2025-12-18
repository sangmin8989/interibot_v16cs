/**
 * V3 엔진 메인 (통합)
 * 
 * 5개 서브 엔진을 순차적으로 실행하고 결과를 통합합니다.
 * 
 * 실행 순서:
 * 1. 성향 엔진 (TraitEngine)
 * 2. 공정 엔진 (ProcessEngine) - 양방향 모델 적용
 * 3. 리스크 엔진 (RiskEngine)
 * 4. 시나리오 엔진 (ScenarioEngine)
 * 5. 설명 엔진 (ExplanationEngine) - AI 서술
 */

import {
  V3EngineInput,
  V3AnalysisResult,
  ToneType,
  TraitIndicators12
} from './types'

import { TraitEngine } from './engines/TraitEngine'
import { ProcessEngine } from './engines/ProcessEngine'
import { RiskEngine } from './engines/RiskEngine'
import { ScenarioEngine } from './engines/ScenarioEngine'
import { ExplanationEngine } from './engines/ExplanationEngine'
import { InterventionEngine } from './engines/InterventionEngine'
import { convertTraitsToAxes, JudgmentAxes } from '../types/judgment-axes'

export class V3Engine {
  private traitEngine: TraitEngine
  private processEngine: ProcessEngine
  private interventionEngine: InterventionEngine
  private riskEngine: RiskEngine
  private scenarioEngine: ScenarioEngine
  private explanationEngine: ExplanationEngine

  constructor() {
    this.traitEngine = new TraitEngine()
    this.processEngine = new ProcessEngine()
    this.interventionEngine = new InterventionEngine()
    this.riskEngine = new RiskEngine()
    this.scenarioEngine = new ScenarioEngine()
    this.explanationEngine = new ExplanationEngine()
  }

  /**
   * V3 분석 메인 함수
   */
  async analyze(input: V3EngineInput): Promise<V3AnalysisResult> {
    console.log('🚀 [V3Engine] 전체 분석 시작')
    const startTime = Date.now()

    const executionTime = {
      traitEngine: 0,
      processEngine: 0,
      interventionEngine: 0,
      riskEngine: 0,
      scenarioEngine: 0,
      explanationEngine: 0,
      total: 0
    }

    try {
      // 1. 성향 엔진
      const t1 = Date.now()
      const traitResult = await this.traitEngine.analyze({
        answers: input.answers,
        spaceInfo: input.spaceInfo,
        vibeInput: input.vibeInput
      })
      executionTime.traitEngine = Date.now() - t1

      // 2. 공정 엔진 (양방향 모델)
      const t2 = Date.now()
      let processResult = await this.processEngine.analyze({
        traitResult,
        selectedSpaces: input.selectedSpaces,
        selectedProcesses: input.selectedProcesses,
        budget: input.budget
      })
      executionTime.processEngine = Date.now() - t2

      // 2.5. 개입 엔진 (통합 설계서: 선택 축소)
      const t2_5 = Date.now()
      const axes = convertTraitsToAxes(processResult.adjustedIndicators)
      const interventionResult = this.interventionEngine.analyze({
        processes: processResult.recommendedProcesses,
        axes,
        selectedSpaces: input.selectedSpaces,
        // ✅ Integration Step: choiceVariables 전달
        choiceVariables: input.choiceVariables
      })
      // 축소된 공정으로 교체
      processResult = {
        ...processResult,
        recommendedProcesses: interventionResult.processedProcesses
      }
      executionTime.interventionEngine = Date.now() - t2_5

      // 3. 리스크 엔진
      const t3 = Date.now()
      const riskResult = await this.riskEngine.analyze({
        adjustedIndicators: processResult.adjustedIndicators,
        processResult,
        spaceInfo: input.spaceInfo
      })
      executionTime.riskEngine = Date.now() - t3

      // 4. 시나리오 엔진
      const t4 = Date.now()
      const scenarioResult = await this.scenarioEngine.analyze({
        adjustedIndicators: processResult.adjustedIndicators,
        lifestyleType: traitResult.lifestyleType,
        processResult,
        riskResult
      })
      executionTime.scenarioEngine = Date.now() - t4

      // 5. 설명 엔진 (AI 서술)
      const t5 = Date.now()
      const toneType = this.determineToneType(processResult.adjustedIndicators)
      const explanationResult = await this.explanationEngine.analyze({
        traitResult,
        processResult,
        riskResult,
        scenarioResult,
        toneType
      })
      executionTime.explanationEngine = Date.now() - t5

      executionTime.total = Date.now() - startTime

      // 메타데이터
      const analysisId = `v3_${Date.now()}`
      const createdAt = new Date().toISOString()

      console.log('✅ [V3Engine] 전체 분석 완료')
      console.log(`⏱️  실행 시간: ${executionTime.total}ms`)
      console.log(`   - 성향 엔진: ${executionTime.traitEngine}ms`)
      console.log(`   - 공정 엔진: ${executionTime.processEngine}ms`)
      console.log(`   - 개입 엔진: ${executionTime.interventionEngine}ms (개입강도:${interventionResult.interventionLevel}, 경고:${interventionResult.warnings.length}개)`)
      console.log(`   - 리스크 엔진: ${executionTime.riskEngine}ms`)
      console.log(`   - 시나리오 엔진: ${executionTime.scenarioEngine}ms`)
      console.log(`   - 설명 엔진: ${executionTime.explanationEngine}ms`)

      return {
        version: '3.0.0',
        traitResult,
        processResult,
        riskResult,
        scenarioResult,
        explanationResult,
        analysisId,
        createdAt,
        executionTime
      }
    } catch (error) {
      console.error('❌ [V3Engine] 전체 분석 오류:', error)
      throw error
    }
  }

  /**
   * 말투 유형 자동 판단
   * 성향 지표를 기반으로 고객에게 맞는 말투를 선택합니다.
   */
  private determineToneType(indicators: TraitIndicators12): ToneType {
    // 가족영향도가 높으면 정감형
    if (indicators.가족영향도 >= 70) {
      return 'warm'
    }

    // 스타일고집도가 높으면 공감형
    if (indicators.스타일고집도 >= 70) {
      return 'empathetic'
    }

    // 예산탄력성이 낮으면 논리형 (가성비 중시)
    if (indicators.예산탄력성 <= 40) {
      return 'logical'
    }

    // 집값방어의식이 높으면 직설형
    if (indicators.집값방어의식 >= 70) {
      return 'direct'
    }

    // 기본값: 공감형
    return 'empathetic'
  }
}

/**
 * 싱글톤 인스턴스
 */
export const v3Engine = new V3Engine()



















