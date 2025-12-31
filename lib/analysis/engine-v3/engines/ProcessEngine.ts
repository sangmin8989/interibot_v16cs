/**
 * V3 공정 엔진 (ProcessEngine)
 * 
 * 성향 지표를 기반으로 공간 우선순위 및 공정 추천을 수행합니다.
 * ✅ 양방향 모델: 성향 → 공정 추천 후, 공정 선택 → 성향 재보정
 * 
 * 처리 흐름:
 * 1. 성향 기반 공간 우선순위 계산
 * 2. 공간별 공정 추천
 * 3. 고객 선택 공정 반영
 * 4. ✅ 양방향 모델: 공정 선택 → 성향 재보정
 * 5. 예산 등급 추천
 */

import {
  ProcessEngineInput,
  ProcessEngineResult,
  PrioritySpace,
  RecommendedProcess,
  ProcessPriorityLevel,
  TraitIndicators12,
  Grade,
  BudgetRange
} from '../types'
import { validateAllIndicators, validateIndicatorRange, scoreToLevel } from '../utils/scoreValidator'

export class ProcessEngine {
  /**
   * 공정 분석 메인 함수
   */
  async analyze(input: ProcessEngineInput): Promise<ProcessEngineResult> {
    console.log('⚙️ [ProcessEngine] 공정 분석 시작')
    const startTime = Date.now()

    try {
      // 1. 성향 기반 공간 우선순위 계산
      const prioritySpaces = this.calculateSpacePriority(
        input.traitResult.indicators,
        input.selectedSpaces,
        input.traitResult.priorityAreas
      )

      // 2. 공간별 공정 추천
      let recommendedProcesses = this.recommendProcesses(
        prioritySpaces,
        input.traitResult.indicators,
        input.budget
      )

      // 3. 고객 선택 공정 반영 (있다면)
      // selectedProcesses가 배열인지 객체인지 확인
      const selectedProcessesArray = Array.isArray(input.selectedProcesses)
        ? input.selectedProcesses
        : input.selectedProcesses
          ? Object.keys(input.selectedProcesses)
          : []
      
      if (selectedProcessesArray.length > 0) {
        recommendedProcesses = this.applyUserSelections(
          recommendedProcesses,
          selectedProcessesArray
        )
      }

      // 4. ✅ 양방향 모델: 공정 선택 → 성향 재보정
      const adjustedIndicators = this.recalculateTraits(
        input.traitResult.indicators,
        recommendedProcesses,
        selectedProcessesArray
      )

      // 5. 예산 등급 추천
      const gradeRecommendation = this.recommendGrade(
        adjustedIndicators,
        recommendedProcesses,
        input.budget
      )

      const executionTime = Date.now() - startTime
      console.log(`✅ [ProcessEngine] 공정 분석 완료 (${executionTime}ms)`)

      return {
        prioritySpaces,
        recommendedProcesses,
        gradeRecommendation,
        adjustedIndicators
      }
    } catch (error) {
      console.error('❌ [ProcessEngine] 공정 분석 오류:', error)
      
      // Fallback
      return {
        prioritySpaces: [],
        recommendedProcesses: [],
        gradeRecommendation: 'standard',
        adjustedIndicators: input.traitResult.indicators
      }
    }
  }

  /**
   * 성향 기반 공간 우선순위 계산
   */
  private calculateSpacePriority(
    indicators: TraitIndicators12,
    selectedSpaces: string[],
    priorityAreas: string[]
  ): PrioritySpace[] {
    const spaceScores: Record<string, number> = {}

    // 공간별 기본 점수 계산
    for (const spaceId of selectedSpaces) {
      let score = 50  // 기본 점수

      // 공간별 성향 지표 가중치 적용
      switch (spaceId) {
        case 'living':
        case '거실':
          score += indicators.가족영향도 * 0.3
          score += indicators.조명취향 * 0.2
          score += indicators.스타일고집도 * 0.2
          break
        
        case 'kitchen':
        case '주방':
          score += indicators.동선중요도 * 0.4
          score += indicators.수납중요도 * 0.3
          score += indicators.관리민감도 * 0.2
          break
        
        case 'bedroom':
        case '안방':
        case '침실':
          score += indicators.소음민감도 * 0.3
          score += indicators.조명취향 * 0.3
          score += indicators.관리민감도 * 0.2
          break
        
        case 'bathroom':
        case '욕실':
          score += indicators.관리민감도 * 0.4
          score += indicators.공사복잡도수용성 * 0.3
          break
        
        case 'storage':
        case '수납':
          score += indicators.수납중요도 * 0.6
          score += indicators.가족영향도 * 0.2
          break
        
        default:
          score += 50
      }

      spaceScores[spaceId] = Math.min(100, Math.round(score))
    }

    // 우선순위 정렬
    const sorted = Object.entries(spaceScores)
      .sort((a, b) => b[1] - a[1])
      .map(([spaceId, score], index) => ({
        spaceId,
        label: this.getSpaceLabel(spaceId),
        priority: index + 1,
        score,
        reason: this.getSpaceReason(spaceId, indicators)
      }))

    return sorted
  }

  /**
   * 공간별 공정 추천
   */
  private recommendProcesses(
    prioritySpaces: PrioritySpace[],
    indicators: TraitIndicators12,
    budget: BudgetRange
  ): RecommendedProcess[] {
    const processes: RecommendedProcess[] = []

    for (const space of prioritySpaces) {
      // 공간별 핵심 공정 추천
      const spaceProcesses = this.getProcessesForSpace(space.spaceId, indicators, budget)
      processes.push(...spaceProcesses)
    }

    // 우선순위 및 점수 기준 정렬
    return processes.sort((a, b) => {
      const priorityOrder = { essential: 1, recommended: 2, optional: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.score - a.score
    })
  }

  /**
   * 공간별 공정 리스트 생성
   */
  private getProcessesForSpace(
    spaceId: string,
    indicators: TraitIndicators12,
    budget: BudgetRange
  ): RecommendedProcess[] {
    const processes: RecommendedProcess[] = []

    switch (spaceId) {
      case 'kitchen':
      case '주방':
        // 동선중요도가 50 이상이면 주방 동선 최적화 추천
        if (indicators.동선중요도 >= 50) {
          processes.push({
            id: 'kitchen_layout',
            label: '주방 동선 최적화',
            category: '주방',
            priority: indicators.동선중요도 >= 60 ? 'essential' : 'recommended',
            score: indicators.동선중요도,
            reason: '주방 동선이 중요하게 나타났습니다'
          })
        }
        // 수납중요도가 50 이상이면 주방 수납 추천
        if (indicators.수납중요도 >= 50) {
          processes.push({
            id: 'kitchen_storage',
            label: '주방 수납장',
            category: '주방',
            priority: indicators.수납중요도 >= 60 ? 'essential' : 'recommended',
            score: indicators.수납중요도,
            reason: '주방 수납 공간 확보가 필요합니다'
          })
        }
        break
      
      case 'living':
      case '거실':
        // 조명취향이 50 이상이면 거실 조명 추천
        if (indicators.조명취향 >= 50) {
          processes.push({
            id: 'living_lighting',
            label: '거실 조명 설계',
            category: '거실',
            priority: indicators.조명취향 >= 60 ? 'essential' : 'recommended',
            score: indicators.조명취향,
            reason: '조명 감성이 중요하게 나타났습니다'
          })
        }
        // 가족영향도가 50 이상이면 거실 가족 공간 추천
        if (indicators.가족영향도 >= 50) {
          processes.push({
            id: 'living_layout',
            label: '거실 가족 공간 구성',
            category: '거실',
            priority: indicators.가족영향도 >= 60 ? 'essential' : 'recommended',
            score: indicators.가족영향도,
            reason: '가족 중심 공간 설계가 필요합니다'
          })
        }
        break
      
      case 'bedroom':
      case 'masterBedroom':
      case '안방':
        if (indicators.소음민감도 >= 60) {
          processes.push({
            id: 'bedroom_soundproof',
            label: '침실 방음 처리',
            category: '침실',
            priority: 'recommended',
            score: indicators.소음민감도,
            reason: '소음 민감도가 높아 방음이 필요합니다'
          })
        }
        if (indicators.수납중요도 >= 50) {
          processes.push({
            id: 'bedroom_storage',
            label: '침실 수납 공간',
            category: '침실',
            priority: 'recommended',
            score: indicators.수납중요도,
            reason: '수납 공간 확보가 필요합니다'
          })
        }
        break
      
      case 'room1':
      case 'room2':
      case 'room3':
      case '방':
        if (indicators.수납중요도 >= 50) {
          processes.push({
            id: 'room_storage',
            label: '방 수납 공간',
            category: '방',
            priority: 'recommended',
            score: indicators.수납중요도,
            reason: '수납 공간 확보가 필요합니다'
          })
        }
        break
      
      case 'entrance':
      case '현관':
        if (indicators.수납중요도 >= 50) {
          processes.push({
            id: 'entrance_storage',
            label: '현관 수납',
            category: '현관',
            priority: 'recommended',
            score: indicators.수납중요도,
            reason: '현관 수납 공간이 필요합니다'
          })
        }
        break
      
      case 'bathroom':
      case '욕실':
        if (indicators.관리민감도 >= 60) {
          processes.push({
            id: 'bathroom_easy_clean',
            label: '욕실 청소 편의 마감재',
            category: '욕실',
            priority: 'recommended',
            score: indicators.관리민감도,
            reason: '관리 편의성이 중요하게 나타났습니다'
          })
        }
        break
    }

    return processes
  }

  /**
   * 고객 선택 공정 반영
   */
  private applyUserSelections(
    recommendedProcesses: RecommendedProcess[],
    selectedProcesses: string[]
  ): RecommendedProcess[] {
    // 이미 추천된 공정 중 고객이 선택한 것은 'essential'로 상향
    const updated = recommendedProcesses.map(process => {
      if (selectedProcesses.includes(process.id)) {
        return { ...process, priority: 'essential' as ProcessPriorityLevel }
      }
      return process
    })

    // 고객이 선택했지만 추천 목록에 없던 공정 추가
    for (const processId of selectedProcesses) {
      const exists = updated.some(p => p.id === processId)
      if (!exists) {
        updated.push({
          id: processId,
          label: processId,
          category: '기타',
          priority: 'essential',
          score: 70,
          reason: '고객이 직접 선택하신 공정입니다'
        })
      }
    }

    return updated
  }

  /**
   * ✅ 양방향 모델: 공정 선택 → 성향 재보정
   * 핵심 로직! 고객이 선택한 공정을 보고 성향 지표를 다시 조정합니다.
   */
  private recalculateTraits(
    originalIndicators: TraitIndicators12,
    recommendedProcesses: RecommendedProcess[],
    selectedProcesses?: string[]
  ): TraitIndicators12 {
    let adjusted = { ...originalIndicators }

    // 고객이 선택한 공정이 없으면 원본 그대로 반환
    if (!selectedProcesses || selectedProcesses.length === 0) {
      return adjusted
    }

    console.log('🔄 [ProcessEngine] 양방향 모델: 공정 → 성향 재보정 시작')

    // 공정별 영향 매핑
    const processImpact: Record<string, Partial<TraitIndicators12>> = {
      // 수납 관련
      'closet_builtin': { 수납중요도: 5 },
      'kitchen_storage': { 수납중요도: 5, 동선중요도: 3 },
      'storage_system': { 수납중요도: 5 },
      
      // 방음 관련
      'soundproof': { 소음민감도: 5 },
      'bedroom_soundproof': { 소음민감도: 5 },
      'door_soundproof': { 소음민감도: 3 },
      
      // 조명 관련
      'living_lighting': { 조명취향: 5, 스타일고집도: 3 },
      'indirect_lighting': { 조명취향: 5 },
      
      // 동선 관련
      'kitchen_layout': { 동선중요도: 5 },
      'living_layout': { 동선중요도: 3, 가족영향도: 3 },
      
      // 관리/청소 관련
      'bathroom_easy_clean': { 관리민감도: 5 },
      'flooring_easy_clean': { 관리민감도: 3 },
      
      // 스타일 관련
      'wall_design': { 스타일고집도: 5, 색감취향: 3 },
      'custom_furniture': { 스타일고집도: 5 }
    }

    // 선택된 공정에 따라 지표 조정
    for (const processId of selectedProcesses) {
      const impact = processImpact[processId]
      if (impact) {
        for (const [indicator, value] of Object.entries(impact)) {
          const key = indicator as keyof TraitIndicators12
          adjusted[key] = validateIndicatorRange(key, adjusted[key] + value)
        }
      }
    }

    // 최종 검증
    adjusted = validateAllIndicators(adjusted)

    console.log('✅ [ProcessEngine] 양방향 모델: 성향 재보정 완료')
    
    return adjusted
  }

  /**
   * 예산 등급 추천
   */
  private recommendGrade(
    indicators: TraitIndicators12,
    processes: RecommendedProcess[],
    budget: BudgetRange
  ): Grade {
    // 예산탄력성 기반
    const budgetLevel = scoreToLevel(indicators.예산탄력성)
    const styleLevel = scoreToLevel(indicators.스타일고집도)
    const valueLevel = scoreToLevel(indicators.집값방어의식)

    // 필수 공정 개수
    const essentialCount = processes.filter(p => p.priority === 'essential').length

    // 종합 판단
    if (budget === 'low' || budgetLevel === 'low') {
      return essentialCount > 5 ? 'standard' : 'basic'
    }

    if (budget === 'high' || budget === 'premium') {
      if (styleLevel === 'high' || valueLevel === 'high') {
        return 'premium'
      }
      return 'argen'
    }

    // 중간
    if (essentialCount > 7 || styleLevel === 'high') {
      return 'argen'
    }

    return 'standard'
  }

  /**
   * 공간 라벨 변환
   */
  private getSpaceLabel(spaceId: string): string {
    const labels: Record<string, string> = {
      living: '거실',
      kitchen: '주방',
      bedroom: '안방',
      bathroom: '욕실',
      storage: '수납',
      workspace: '작업실',
      거실: '거실',
      주방: '주방',
      안방: '안방',
      욕실: '욕실'
    }
    return labels[spaceId] || spaceId
  }

  /**
   * 공간 우선 이유 생성
   */
  private getSpaceReason(spaceId: string, indicators: TraitIndicators12): string {
    switch (spaceId) {
      case 'kitchen':
      case '주방':
        return `동선중요도(${indicators.동선중요도}점), 수납중요도(${indicators.수납중요도}점)가 높아 주방을 우선 투자하는 것이 좋습니다`
      case 'living':
      case '거실':
        return `가족영향도(${indicators.가족영향도}점), 조명취향(${indicators.조명취향}점)이 높아 거실 공간이 중요합니다`
      case 'bedroom':
      case '안방':
        return `소음민감도(${indicators.소음민감도}점)가 높아 침실 환경을 개선하는 것이 좋습니다`
      case 'bathroom':
      case '욕실':
        return `관리민감도(${indicators.관리민감도}점)가 높아 욕실 리모델링을 권장합니다`
      default:
        return '고객님의 성향을 반영한 결과입니다'
    }
  }
}

/**
 * 싱글톤 인스턴스
 */
export const processEngine = new ProcessEngine()



























