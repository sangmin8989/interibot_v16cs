/**
 * V4 EstimateEngine - 견적 계산 엔진
 * 
 * ValidationGuard, CostCalculator를 통합
 */

import type {
  StrategyResultV4,
  SpaceInfoV4,
  EstimateResultV4,
  ProcessBlockV4,
} from '../../types'
import { calculateProcessCosts, calculateSummary } from './CostCalculator'
import { toFailedEstimate } from '../../utils/error-handler'
import { logger } from '../../utils/logger'
import { EstimateCalculationError } from '../../errors'
import { EstimateValidationError } from '@/lib/types/헌법_견적_타입'

/**
 * 견적 계산 메인 함수
 */
export async function calculateEstimate(
  strategy: StrategyResultV4,
  spaceInfo: SpaceInfoV4,
  selectedProcesses: Record<string, string[]>
): Promise<EstimateResultV4> {
  logger.info('EstimateEngine', '견적 계산 시작', {
    grade: strategy.recommendedGrade,
    processCount: strategy.processStrategy.length,
  })

  try {
    const blocks: ProcessBlockV4[] = []

    // 공정별 비용 계산
    for (const processStrategy of strategy.processStrategy) {
      if (processStrategy.priority === 'optional') {
        continue // 선택적 공정은 제외
      }

      try {
        const block = await logger.measure(
          'EstimateEngine',
          `${processStrategy.processId} 비용 계산`,
          () =>
            calculateProcessCosts(
              processStrategy.processId,
              spaceInfo,
              strategy.recommendedGrade,
              Object.keys(selectedProcesses)  // 버그 1 방지: 선택된 공간 전달
            )
        )

        blocks.push(block)
      } catch (error) {
        // 헌법 v1.1 에러는 그대로 throw
        if (error instanceof EstimateValidationError) {
          throw new EstimateCalculationError(
            processStrategy.processId,
            error.reason,
            'MATERIAL_OR_LABOR_VALIDATION'
          )
        }
        throw error
      }
    }

    // 견적 요약 계산
    const bufferPercentage = 10 // 기본값 (실제로는 RiskAssessment에서 가져와야 함)
    const summary = calculateSummary(blocks, bufferPercentage, spaceInfo.pyeong)

    // 데이터 소스 통계
    const totalItems = blocks.reduce(
      (sum, b) => sum + b.materials.length + 1,
      0
    )
    const fromDB = blocks.reduce(
      (sum, b) =>
        sum +
        b.materials.filter(m => m.dataSource === 'DB').length +
        (b.labor.dataSource === 'DB' ? 1 : 0),
      0
    )
    const fromPreset = totalItems - fromDB

    logger.info('EstimateEngine', '견적 계산 완료', {
      grandTotal: summary.grandTotal,
      blockCount: blocks.length,
      breakdownDetails: blocks.map(b => ({
        processId: b.processId,
        processName: b.processName,
        spaces: b.spaces,
        materialCount: b.materials.length,
        hasLabor: !!b.labor,
        processTotal: b.processTotal,
      })),
    })
    
    // breakdown이 비어있으면 경고
    if (blocks.length === 0) {
      logger.warn('EstimateEngine', 'breakdown이 비어있음', {
        processStrategyCount: strategy.processStrategy.length,
        processStrategy: strategy.processStrategy.map(p => ({
          processId: p.processId,
          priority: p.priority,
        })),
      })
    }

    return {
      status: 'SUCCESS',
      summary,
      breakdown: blocks,
      meta: {
        version: 'v4.0.0',
        grade: strategy.recommendedGrade,
        dataSourceStats: {
          totalItems,
          fromDB,
          fromPreset,
          dbRatio: totalItems > 0 ? fromDB / totalItems : 0,
        },
        calculatedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    logger.error('EstimateEngine', '견적 계산 실패', error)
    return toFailedEstimate(error, {
      grade: strategy.recommendedGrade,
    })
  }
}

