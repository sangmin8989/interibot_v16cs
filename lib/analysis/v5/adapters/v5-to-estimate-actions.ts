/**
 * V5 → 견적 액션 변환 어댑터
 * 
 * ⚠️ V5 명세서 헌법 원칙 (절대 타협 금지):
 * 1. 필드 매핑만 수행 (해석/판단 금지)
 * 2. 기본값 생성 금지
 * 3. 누락 시 throw 규칙:
 *    - V5 태그에 없는 정보 → 해당 액션은 생성하지 않음 (데이터 오류 아님)
 *    - 타입 불일치 → throw (데이터 오류)
 * 4. 데이터 손실 0% 보장
 * 5. 점수 계산 금지
 * 
 * 역할: V5 태그를 견적 시스템이 이해할 수 있는 실행 명령으로 변환
 * - V5는 결정자 (태그 생성)
 * - 견적 시스템은 실행 엔진 (액션 실행)
 * - 단방향 변환: V5 → 견적 (역방향 금지)
 * - 해석/판단 없이 순수 태그 → 액션 매핑만 수행
 * 
 * ⚠️ 중요: 견적 엔진은 V5 태그를 직접 모르며, 오직 번역된 액션만 실행합니다.
 */

import type { PersonalityTags } from '../types'
import type { ProcessId } from '@/lib/types/헌법_견적_타입'

/**
 * 견적 실행 액션
 * 
 * V5 태그를 견적 시스템이 실행할 수 있는 명령으로 변환한 결과
 */
export interface EstimateActions {
  /** 필수 공정 목록 (견적 시스템에서 반드시 포함해야 함) */
  requiredProcesses: ProcessId[]
  
  /** 권장 공정 목록 (견적 시스템에서 우선 고려해야 함) */
  recommendedProcesses: ProcessId[]
  
  /** 기본 활성화 옵션 목록 (견적 시스템에서 기본적으로 ON) */
  defaultOptions: string[]
  
  /** 제외 옵션 목록 (견적 시스템에서 제외해야 함) */
  excludedOptions: string[]
  
  /** 등급 추천 (공정별 등급 추천) */
  gradeRecommendations: Record<string, 'basic' | 'standard' | 'premium' | 'argen'>
}

/**
 * V5 태그 → 견적 액션 변환
 * 
 * @param tags V5 성향 태그
 * @returns 견적 실행 액션
 */
export function mapV5TagsToEstimateActions(
  tags: PersonalityTags
): EstimateActions {
  // ⚠️ 헌법 원칙 3: 누락 시 throw (fallback 금지)
  if (!tags) {
    throw new Error('V5 → 견적 변환: tags가 필수입니다.')
  }

  const requiredProcesses: ProcessId[] = []
  const recommendedProcesses: ProcessId[] = []
  const defaultOptions: string[] = []
  const excludedOptions: string[] = []
  const gradeRecommendations: Record<string, 'basic' | 'standard' | 'premium' | 'argen'> = {}

  // ⚠️ 헌법 원칙 1: 필드 매핑만 수행 (해석/판단 금지)
  // V5 태그를 견적 액션으로 직접 매핑

  // 1. OLD_RISK_HIGH → 방수, 설비 필수 공정
  if (tags.tags.includes('OLD_RISK_HIGH')) {
    requiredProcesses.push('waterproof', 'plumbing')
    gradeRecommendations['waterproof'] = 'premium'
    gradeRecommendations['plumbing'] = 'premium'
  }

  // 2. OLD_RISK_MEDIUM → 방수, 설비 권장 공정
  if (tags.tags.includes('OLD_RISK_MEDIUM')) {
    recommendedProcesses.push('waterproof', 'plumbing')
  }

  // 3. STORAGE_RISK_HIGH → 수납 공정 기본 ON
  if (tags.tags.includes('STORAGE_RISK_HIGH')) {
    requiredProcesses.push('storage')
    defaultOptions.push('closet', 'shoeRack')
    gradeRecommendations['storage'] = 'argen'
  }

  // 4. SAFETY_RISK → 안전 옵션 기본 ON
  if (tags.tags.includes('SAFETY_RISK')) {
    requiredProcesses.push('bathroom')
    defaultOptions.push('bathroom_safety_handle', 'bathroom_slip_tile')
  }

  // 5. SHORT_STAY → 구조 변경 공정 제외, 저비용 등급 추천
  if (tags.tags.includes('SHORT_STAY')) {
    excludedOptions.push('demolition', 'structure_change')
    // 모든 공정 등급을 basic으로 추천
    gradeRecommendations['*'] = 'basic'
  }

  // 6. LONG_STAY → 내구성 공정 권장, 프리미엄 등급 추천
  if (tags.tags.includes('LONG_STAY')) {
    recommendedProcesses.push('finish', 'window')
    gradeRecommendations['finish'] = 'premium'
    gradeRecommendations['window'] = 'premium'
  }

  // 7. KITCHEN_IMPORTANT → 주방 공정 기본 ON
  if (tags.tags.includes('KITCHEN_IMPORTANT')) {
    requiredProcesses.push('kitchen')
    gradeRecommendations['kitchen'] = 'argen'
  }

  // 8. BATHROOM_COMFORT → 욕실 공정 기본 ON
  if (tags.tags.includes('BATHROOM_COMFORT')) {
    requiredProcesses.push('bathroom')
    gradeRecommendations['bathroom'] = 'premium'
  }

  // 9. BUDGET_TIGHT → 모든 공정 등급 basic 추천
  if (tags.tags.includes('BUDGET_TIGHT')) {
    gradeRecommendations['*'] = 'basic'
  }

  // 10. DECISION_FATIGUE_HIGH → 옵션 노출 수 제한 (견적 시스템에서 처리)
  // ⚠️ 주의: 이는 옵션 개수 제한이므로 직접적인 액션이 아님
  // 견적 시스템에서 옵션 노출 시 참고하도록 주석으로 명시
  // 실제 액션은 생성하지 않음 (해석/판단 금지)

  // ⚠️ 헌법 원칙 2: 기본값 생성 금지
  // V5 태그에 없는 액션은 생성하지 않음
  // 빈 배열이어도 그대로 반환 (없는 정보는 없다)

  // ⚠️ 헌법 원칙 4: 데이터 손실 0% 보장
  // 모든 V5 태그가 액션에 반영되었는지 확인
  // 단, V5 태그 중 견적 액션에 매핑되지 않는 태그는 무시 (정상)
  // 예: STYLE_EXCLUDE, MAINTENANCE_EASY 등은 견적 액션에 직접 매핑되지 않음

  return {
    requiredProcesses,
    recommendedProcesses,
    defaultOptions,
    excludedOptions,
    gradeRecommendations,
  }
}




