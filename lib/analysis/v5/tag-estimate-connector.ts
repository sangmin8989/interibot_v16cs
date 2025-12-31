/**
 * V5 태그 → 견적 시스템 연결
 * 
 * 태그 기반으로 공정 ON/OFF 및 옵션 변경 적용
 */

import type { TagApplicationResult } from './tag-process-mapper'
import { useProcessStore } from '@/lib/store/processStore'
import type { SpaceId, ProcessCategory } from '@/types/spaceProcess'

/**
 * 태그 결과를 견적 시스템에 적용
 * 
 * @param tagResult 태그 적용 결과
 * @param selectedSpaces 선택된 공간
 */
export function applyTagsToEstimate(
  tagResult: TagApplicationResult,
  selectedSpaces: SpaceId[]
): void {
  const { setSpaceProcessSelection } = useProcessStore.getState()

  // 공정 변경 적용
  for (const pc of tagResult.processChanges) {
    // 공정 ID를 공간별로 매핑
    const spaceProcessMap = mapProcessToSpaces(pc.processId, selectedSpaces)

    for (const [spaceId, category, value] of spaceProcessMap) {
      if (pc.action === 'enable') {
        // 공정 ON
        setSpaceProcessSelection(spaceId, category, value)
      } else if (pc.action === 'disable') {
        // 공정 OFF
        setSpaceProcessSelection(spaceId, category, null)
      }
      // 'recommend'는 UI에서 표시만 (자동 적용 안 함)
      // 'required' 제거 (엔진 계약에 맞춤)
    }
  }
}

/**
 * 공정 ID를 공간별 카테고리로 매핑
 */
function mapProcessToSpaces(
  processId: string,
  selectedSpaces: SpaceId[]
): Array<[SpaceId, ProcessCategory, string]> {
  const mappings: Array<[SpaceId, ProcessCategory, string]> = []

  // 공정 → 공간 매핑 규칙
  const processSpaceMap: Record<
    string,
    Array<{ space: SpaceId | 'all'; category: ProcessCategory; value: string }>
  > = {
    waterproof: [
      { space: 'bathroom', category: 'bathroom_core', value: 'waterproof' },
      { space: 'kitchen', category: 'kitchen_core', value: 'waterproof' },
    ],
    insulation: [
      { space: 'living', category: 'wall_finish', value: 'insulation' },
      { space: 'masterBedroom', category: 'wall_finish', value: 'insulation' },
    ],
    window: [
      { space: 'living', category: 'wall_finish', value: 'window_replacement' },
    ],
    plumbing: [
      { space: 'bathroom', category: 'bathroom_core', value: 'plumbing' },
      { space: 'kitchen', category: 'kitchen_core', value: 'plumbing' },
    ],
    closet: [
      { space: 'masterBedroom', category: 'options', value: 'closet' },
      { space: 'room1', category: 'options', value: 'closet' },
    ],
    shoeRack: [
      { space: 'entrance', category: 'entrance_core', value: 'shoeRack' },
    ],
    demolition: [
      { space: 'all', category: 'wall_finish', value: 'demolition' },
    ],
    bathroomSafety: [
      { space: 'bathroom', category: 'bathroom_core', value: 'safety' },
    ],
    kitchen: [
      { space: 'kitchen', category: 'kitchen_core', value: 'kitchen_full' },
    ],
  }

  const processMapping = processSpaceMap[processId]
  if (!processMapping) return mappings

  for (const mapping of processMapping) {
    if (mapping.space === 'all') {
      // 모든 선택된 공간에 적용
      for (const spaceId of selectedSpaces) {
        mappings.push([spaceId, mapping.category, mapping.value])
      }
    } else {
      // 특정 공간에만 적용
      if (selectedSpaces.includes(mapping.space)) {
        mappings.push([mapping.space, mapping.category, mapping.value])
      }
    }
  }

  return mappings
}

/**
 * 등급 추천 적용
 * 
 * @param tierRecommendations 등급 추천
 */
export function applyTierRecommendations(
  tierRecommendations: Record<string, 'basic' | 'standard' | 'premium' | 'argen'>
): void {
  // TODO: tierSelections에 등급 추천 적용
  // 현재는 processStore에 tierSelections가 제거되었으므로
  // 추후 구현 필요
  console.log('등급 추천:', tierRecommendations)
}








