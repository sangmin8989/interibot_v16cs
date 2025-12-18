/**
 * V3 개입 엔진 (InterventionEngine)
 * 
 * 통합 설계서 기준:
 * - 판단 축 기반 개입 강도 계산
 * - 개입 강도에 따른 선택 축소
 * - LOCK 공정 경고 생성
 * 
 * 처리 흐름:
 * 1. 판단 축 → 개입 강도 계산
 * 2. 개입 강도에 따른 공정 선택 축소
 * 3. LOCK 공정 경고 생성
 * 4. 선택지 축소 (3안 기본, 2안/4안 예외)
 */

import {
  RecommendedProcess,
  ProcessPriorityLevel
} from '../types'
import {
  JudgmentAxes,
  InterventionLevel,
  calculateInterventionLevel
} from '../../types/judgment-axes'
import {
  getProcessClassification,
  isLockProcess,
  isLockOption,
  isLaterProcess,
  ProcessClassification
} from '../../config/process-classification'
import type { ChoiceVariables } from '../../utils/choice-variables'

export interface InterventionEngineInput {
  processes: RecommendedProcess[]
  axes: JudgmentAxes
  selectedSpaces?: string[]
  choiceVariables?: ChoiceVariables // ✅ Integration Step: choiceVariables 추가
}

export interface InterventionEngineResult {
  processedProcesses: RecommendedProcess[]  // 축소된 공정 목록
  warnings: ProcessWarning[]                 // 경고 목록
  interventionLevel: InterventionLevel      // 개입 강도
  reductionInfo: ReductionInfo              // 축소 정보
}

export interface ProcessWarning {
  processId: string
  processLabel: string
  type: 'irreversible' | 'choice_reduction' | 'cost_high'
  message: string
  severity: 'low' | 'mid' | 'high'
  // ✅ LOCK 확장: LOCK 강도 정보
  lockLevel?: 'hard' | 'soft'
  canOverride?: boolean
}

export interface ReductionInfo {
  originalCount: number
  reducedCount: number
  removedProcesses: string[]
  reason: string
}

export class InterventionEngine {
  /**
   * 개입 엔진 메인 함수
   */
  analyze(input: InterventionEngineInput): InterventionEngineResult {
    console.log('🔧 [InterventionEngine] 개입 분석 시작')
    const startTime = Date.now()

    const { processes, axes, choiceVariables } = input

    // ✅ Integration Step: choiceVariables가 있으면 로그 출력
    if (choiceVariables) {
      console.log('📊 [InterventionEngine] choiceVariables 사용:', {
        optionCount: choiceVariables.optionCount,
        lockStrength: choiceVariables.lockStrength,
        defaultPlan: choiceVariables.defaultPlan
      })
    }

    // 1. 개입 강도 계산
    const interventionLevel = calculateInterventionLevel(axes)

    // 2. 공정 선택 축소 (choiceVariables 전달)
    const { processedProcesses, reductionInfo } = this.reduceProcesses(
      processes,
      interventionLevel,
      axes,
      choiceVariables
    )

    // 3. 경고 생성 (choiceVariables 전달)
    const warnings = this.generateWarnings(
      processedProcesses,
      interventionLevel,
      axes,
      choiceVariables
    )

    const executionTime = Date.now() - startTime
    console.log(`✅ [InterventionEngine] 개입 분석 완료 (${executionTime}ms, 개입강도:${interventionLevel}, 경고:${warnings.length}개)`)

    return {
      processedProcesses,
      warnings,
      interventionLevel,
      reductionInfo
    }
  }

  /**
   * 공정 선택 축소
   * 
   * ✅ Integration Step: choiceVariables를 입력으로만 사용 (수정하지 않음)
   */
  private reduceProcesses(
    processes: RecommendedProcess[],
    level: InterventionLevel,
    axes: JudgmentAxes,
    choiceVariables?: ChoiceVariables
  ): {
    processedProcesses: RecommendedProcess[]
    reductionInfo: ReductionInfo
  } {
    const originalCount = processes.length
    let processed = [...processes]

    // ✅ Integration Step: choiceVariables가 있으면 우선 사용
    if (choiceVariables) {
      // optionCount에 따라 공정 수 축소
      const targetCount = choiceVariables.optionCount
      
      // LOCK 공정이고 defaultPlan이 true면 표준안만 (이미 처리됨)
      // 일반적인 경우: 우선순위와 점수로 정렬 후 targetCount만큼 선택
      processed = processed
        .sort((a, b) => {
          const priorityOrder = { essential: 1, recommended: 2, optional: 3 }
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
          if (priorityDiff !== 0) return priorityDiff
          return b.score - a.score
        })
        .slice(0, targetCount)

      const reducedCount = processed.length
      const removedProcesses = processes
        .filter(p => !processed.some(proc => proc.id === p.id))
        .map(p => p.label)

      const reductionInfo: ReductionInfo = {
        originalCount,
        reducedCount,
        removedProcesses,
        reason: `질문 답변에 따라 ${targetCount}개로 축소했습니다. (optionCount: ${targetCount}, lockStrength: ${choiceVariables.lockStrength})`
      }

      console.log(`🔧 [InterventionEngine] choiceVariables 적용: ${originalCount}개 → ${reducedCount}개`)

      return {
        processedProcesses: processed,
        reductionInfo
      }
    }

    // 기존 로직 (choiceVariables가 없을 때만)
    // LATER 공정 제거 (개입 강도에 따라)
    if (level === 'high') {
      // 높음: LATER 공정 모두 제거
      const laterProcesses = processed.filter(p => isLaterProcess(p.id))
      processed = processed.filter(p => !isLaterProcess(p.id))
      
      if (laterProcesses.length > 0) {
        console.log(`🔧 [InterventionEngine] LATER 공정 ${laterProcesses.length}개 제거 (개입강도:high)`)
      }
    } else if (level === 'mid') {
      // 중간: LATER 공정 중 optional만 제거
      const laterOptional = processed.filter(
        p => isLaterProcess(p.id) && p.priority === 'optional'
      )
      processed = processed.filter(
        p => !(isLaterProcess(p.id) && p.priority === 'optional')
      )
      
      if (laterOptional.length > 0) {
        console.log(`🔧 [InterventionEngine] LATER optional 공정 ${laterOptional.length}개 제거 (개입강도:mid)`)
      }
    }
    // 낮음: LATER 공정 유지

    // NARROW 공정 선택 축소 (개입 강도에 따라)
    if (level === 'high') {
      // 높음: NARROW 공정 중 표준안만 남기기 (essential 또는 recommended 중 상위)
      const narrowProcesses = processed.filter(
        p => getProcessClassification(p.id) === 'NARROW'
      )
      
      // essential 우선, 없으면 recommended만 남기기
      const essentialNarrow = narrowProcesses.filter(p => p.priority === 'essential')
      const recommendedNarrow = narrowProcesses.filter(p => p.priority === 'recommended')
      
      if (essentialNarrow.length > 0) {
        // essential만 남기기
        processed = processed.filter(
          p => getProcessClassification(p.id) !== 'NARROW' || p.priority === 'essential'
        )
      } else if (recommendedNarrow.length > 0) {
        // recommended만 남기기 (상위 1개)
        const topRecommended = recommendedNarrow
          .sort((a, b) => b.score - a.score)
          .slice(0, 1)
        
        processed = processed.filter(
          p => getProcessClassification(p.id) !== 'NARROW' || 
               (p.priority === 'recommended' && topRecommended.some(t => t.id === p.id))
        )
      }
    } else if (level === 'mid') {
      // 중간: NARROW 공정 중 상위 2개만 남기기
      const narrowProcesses = processed.filter(
        p => getProcessClassification(p.id) === 'NARROW'
      )
      
      const topNarrow = narrowProcesses
        .sort((a, b) => {
          const priorityOrder = { essential: 1, recommended: 2, optional: 3 }
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
          if (priorityDiff !== 0) return priorityDiff
          return b.score - a.score
        })
        .slice(0, 2)
      
      processed = processed.filter(
        p => getProcessClassification(p.id) !== 'NARROW' || 
             topNarrow.some(t => t.id === p.id)
      )
    }
    // 낮음: NARROW 공정 모두 유지

    // 비용 민감도가 높으면 고비용 옵션 제거
    if (axes.costSensitivity >= 70) {
      const expensiveProcesses = processed.filter(p => {
        // estimatedCost가 있고 premium 등급이 높은 경우
        if (p.estimatedCost) {
          const avgCost = (
            p.estimatedCost.basic +
            p.estimatedCost.standard +
            p.estimatedCost.argen +
            p.estimatedCost.premium
          ) / 4
          return avgCost > 5000000 // 500만원 이상
        }
        return false
      })
      
      if (expensiveProcesses.length > 0 && level !== 'low') {
        processed = processed.filter(p => !expensiveProcesses.includes(p))
        console.log(`🔧 [InterventionEngine] 고비용 공정 ${expensiveProcesses.length}개 제거 (비용민감도:${axes.costSensitivity})`)
      }
    }

    const reducedCount = processed.length
    const removedProcesses = processes
      .filter(p => !processed.some(proc => proc.id === p.id))
      .map(p => p.label)

    const reductionInfo: ReductionInfo = {
      originalCount,
      reducedCount,
      removedProcesses,
      reason: this.getReductionReason(level, axes, originalCount - reducedCount)
    }

    return {
      processedProcesses: processed,
      reductionInfo
    }
  }

  /**
   * 축소 이유 생성
   */
  private getReductionReason(
    level: InterventionLevel,
    axes: JudgmentAxes,
    removedCount: number
  ): string {
    if (removedCount === 0) {
      return '선택 유지 (개입 강도 낮음)'
    }

    const reasons: string[] = []

    if (level === 'high') {
      reasons.push('개입 강도 높음')
    } else if (level === 'mid') {
      reasons.push('개입 강도 중간')
    }

    if (axes.costSensitivity >= 70) {
      reasons.push('비용 민감도 높음')
    }

    if (axes.riskAversion >= 70) {
      reasons.push('리스크 회피도 높음')
    }

    return `선택 축소 (${reasons.join(', ')}) - ${removedCount}개 제거`
  }

  /**
   * 경고 생성
   */
  private generateWarnings(
    processes: RecommendedProcess[],
    level: InterventionLevel,
    axes: JudgmentAxes,
    choiceVariables?: ChoiceVariables
  ): ProcessWarning[] {
    const warnings: ProcessWarning[] = []

    processes.forEach(process => {
      const classification = getProcessClassification(process.id)

      // ✅ LOCK 확장: 철거/방수/전기 LOCK 판단
      const lockInfo = this.getLockInfo(process.id, process.category, choiceVariables)
      
      // LOCK 공정이거나 방수/전기인 경우 경고 생성
      if (classification === 'LOCK' || isLockProcess(process.id) || lockInfo.lockLevel !== null) {
        warnings.push({
          processId: process.id,
          processLabel: process.label,
          type: 'irreversible',
          message: lockInfo.reason || '이 단계는 나중에 변경이 어렵습니다. 인테리봇 기준으로 안정적인 안을 우선 적용합니다.',
          severity: lockInfo.lockLevel === 'hard' ? 'high' : 'mid',
          lockLevel: lockInfo.lockLevel || 'hard',
          canOverride: lockInfo.canOverride
        })
      }

      // NARROW 공정: 개입 강도가 중간 이상일 때 경고
      if (classification === 'NARROW' && level !== 'low') {
        warnings.push({
          processId: process.id,
          processLabel: process.label,
          type: 'choice_reduction',
          message: '이 조건에서는 선택 범위를 줄이는 것이 안전합니다.',
          severity: level === 'high' ? 'mid' : 'low'
        })
      }

      // 고비용 공정: 비용 민감도가 높을 때 경고
      if (axes.costSensitivity >= 70 && process.estimatedCost) {
        const avgCost = (
          process.estimatedCost.basic +
          process.estimatedCost.standard +
          process.estimatedCost.argen +
          process.estimatedCost.premium
        ) / 4
        
        if (avgCost > 5000000) {
          warnings.push({
            processId: process.id,
            processLabel: process.label,
            type: 'cost_high',
            message: '이 공정은 비용이 높습니다. 지금 결정하지 않아도 됩니다.',
            severity: 'mid'
          })
        }
      }
    })

    return warnings
  }

  /**
   * ✅ LOCK 확장: 공정별 LOCK 정보 판단
   * 
   * 명세서 3 기준:
   * - 철거: 항상 hard LOCK (최우선)
   * - 방수: 욕실 포함 시 hard LOCK
   * - 전기: 회로 증설/분전반 = hard, 콘센트 일부 = soft
   * - 우선순위: 철거 > 방수 > 전기
   */
  private getLockInfo(
    processId: string,
    category: string,
    choiceVariables?: ChoiceVariables
  ): {
    lockLevel: 'hard' | 'soft' | null
    canOverride: boolean
    reason: string
  } {
    // 1. 철거: 항상 hard LOCK (최우선)
    if (processId === 'demolition' || processId.includes('demolition') || category === '철거') {
      return {
        lockLevel: 'hard',
        canOverride: false,
        reason: '이 공정은 공사 후 변경이 어렵습니다'
      }
    }

    // 2. 방수: 욕실 포함 시 hard LOCK
    // processId에 'bathroom'이 포함되거나 category가 '욕실'인 경우
    if (processId.includes('bathroom') || category === '욕실') {
      return {
        lockLevel: 'hard',
        canOverride: false,
        reason: '누수는 공사 후 변경이 불가능해 기본안을 고정합니다.'
      }
    }

    // 3. 전기: 회로 증설/분전반 = hard, 콘센트 일부 = soft
    if (processId === 'electric' || processId.includes('electric') || category === '전기') {
      // 회로 증설 또는 분전반 작업인지 확인 (processId 패턴으로 판단)
      const isHardLock = processId.includes('circuit') ||
                         processId.includes('breaker') ||
                         processId.includes('wiring') ||
                         processId.includes('분전') ||
                         processId.includes('회로')
      
      if (isHardLock) {
        return {
          lockLevel: 'hard',
          canOverride: false,
          reason: '전기 공정은 안전·규정상 변경 여지가 제한됩니다.'
        }
      } else {
        // 콘센트 일부 증설 등 soft LOCK
        // lockStrength < 40일 때만 변경 가능
        return {
          lockLevel: 'soft',
          canOverride: choiceVariables?.lockStrength !== undefined && choiceVariables.lockStrength < 40,
          reason: '전기 공정은 안전·규정상 변경 여지가 제한됩니다.'
        }
      }
    }

    // LOCK이 아닌 경우
    return {
      lockLevel: null,
      canOverride: true,
      reason: ''
    }
  }
}

/**
 * 싱글톤 인스턴스
 */
export const interventionEngine = new InterventionEngine()












