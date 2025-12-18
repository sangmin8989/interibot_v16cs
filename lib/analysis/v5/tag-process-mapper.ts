/**
 * V5 태그 → 공정/옵션 매핑
 * 
 * 명세서 STEP 9: 성향 → 공정·옵션·아르젠 매핑
 */

/**
 * 공정 변경 결과
 */
export interface ProcessChange {
  processId: string
  action: 'enable' | 'disable' | 'recommend' | 'required'
  reason: string
}

/**
 * 옵션 변경 결과
 */
export interface OptionChange {
  optionId: string
  action: 'show' | 'hide' | 'limit' | 'prioritize'
  value?: number // limit의 경우 최대 개수
  reason: string
}

/**
 * 태그 적용 결과
 */
export interface TagApplicationResult {
  processChanges: ProcessChange[]
  optionChanges: OptionChange[]
  tierRecommendations: Record<string, 'basic' | 'standard' | 'premium' | 'argen'>
}

/**
 * 태그를 공정/옵션에 적용
 * 
 * @param tags 성향 태그 배열
 * @param basicInfo 기본 정보 (평형 등)
 * @returns 공정/옵션 변경 결과
 */
export function applyTagsToProcesses(
  tags: string[],
  basicInfo: { pyeong_range: string; budget_range: string }
): TagApplicationResult {
  const processChanges: ProcessChange[] = []
  const optionChanges: OptionChange[] = []
  const tierRecommendations: Record<string, 'basic' | 'standard' | 'premium' | 'argen'> = {}

  // 평형 숫자 변환
  const pyeongNum = convertPyeongToNumber(basicInfo.pyeong_range)
  const budgetHigh = ['4000to6000', 'over6000'].includes(basicInfo.budget_range)

  for (const tag of tags) {
    switch (tag) {
      case 'OLD_RISK_HIGH':
        // 방수, 단열, 창호, 배관 필수 체크
        processChanges.push(
          { processId: 'waterproof', action: 'required', reason: '노후 리스크 HIGH - 방수 필수' },
          { processId: 'insulation', action: 'required', reason: '노후 리스크 HIGH - 단열 필수' },
          { processId: 'window', action: 'required', reason: '노후 리스크 HIGH - 창호 필수' },
          { processId: 'plumbing', action: 'required', reason: '노후 리스크 HIGH - 배관 필수' }
        )
        break

      case 'OLD_RISK_MEDIUM':
        // 방수, 단열 권장
        processChanges.push(
          { processId: 'waterproof', action: 'recommend', reason: '노후 리스크 MEDIUM - 방수 권장' },
          { processId: 'insulation', action: 'recommend', reason: '노후 리스크 MEDIUM - 단열 권장' }
        )
        break

      case 'STORAGE_RISK_HIGH':
        // 붙박이장, 신발장 기본 ON
        processChanges.push(
          { processId: 'closet', action: 'enable', reason: '수납 리스크 HIGH - 붙박이장 기본 ON' },
          { processId: 'shoeRack', action: 'enable', reason: '수납 리스크 HIGH - 신발장 기본 ON' }
        )
        // 아르젠 추천
        tierRecommendations['closet'] = 'argen'
        tierRecommendations['shoeRack'] = 'argen'
        break

      case 'SHORT_STAY':
        // 구조변경 OFF, 저비용 옵션 우선
        processChanges.push(
          { processId: 'demolition', action: 'disable', reason: '단기 거주 - 구조변경 OFF' }
        )
        // 모든 공정 등급 하향
        tierRecommendations['*'] = 'basic'
        break

      case 'LONG_STAY':
        // 구조변경 허용, 고품질 옵션 노출
        processChanges.push(
          { processId: 'demolition', action: 'enable', reason: '장기 거주 - 구조변경 허용' }
        )
        if (budgetHigh) {
          tierRecommendations['*'] = 'premium'
        }
        break

      case 'SAFETY_RISK':
        // 욕실 안전옵션 필수
        processChanges.push(
          { processId: 'bathroomSafety', action: 'required', reason: '안전 리스크 - 욕실 안전옵션 필수' }
        )
        optionChanges.push(
          { optionId: 'slipPrevention', action: 'show', reason: '안전 리스크 - 미끄럼방지 필수' },
          { optionId: 'handrail', action: 'show', reason: '안전 리스크 - 손잡이 필수' },
          { optionId: 'thresholdRemoval', action: 'show', reason: '안전 리스크 - 턱제거 필수' }
        )
        break

      case 'BUDGET_TIGHT':
        // Q09 응답 공정 등급 하향 (구체적 공정은 답변 기반)
        tierRecommendations['*'] = 'basic'
        break

      case 'DECISION_FATIGUE_HIGH':
        // 옵션 노출 최대 3개
        optionChanges.push(
          { optionId: '*', action: 'limit', value: 3, reason: '결정 피로 HIGH - 옵션 최대 3개' }
        )
        break

      case 'KITCHEN_IMPORTANT':
        // 주방 공정 확장, 상세 옵션 노출
        processChanges.push(
          { processId: 'kitchen', action: 'enable', reason: '주방 중요 - 공정 확장' }
        )
        optionChanges.push(
          { optionId: 'kitchenOptions', action: 'show', reason: '주방 중요 - 상세 옵션 노출' }
        )
        break

      case 'BATHROOM_COMFORT':
        // 욕조 옵션 ON
        optionChanges.push(
          { optionId: 'bathtub', action: 'show', reason: '욕실 여유 - 욕조 옵션 ON' }
        )
        break

      case 'MAINTENANCE_EASY':
        // 관리 쉬운 자재 우선 추천
        optionChanges.push(
          { optionId: 'easyMaintenance', action: 'prioritize', reason: '관리 피로 - 관리 쉬운 자재 우선' }
        )
        break
    }
  }

  return {
    processChanges,
    optionChanges,
    tierRecommendations,
  }
}

/**
 * 평형 구간을 숫자로 변환
 */
function convertPyeongToNumber(range: string): number {
  switch (range) {
    case 'under10':
      return 8
    case '11to15':
      return 13
    case '16to25':
      return 20
    case '26to40':
      return 33
    case 'over40':
      return 45
    default:
      return 25
  }
}

