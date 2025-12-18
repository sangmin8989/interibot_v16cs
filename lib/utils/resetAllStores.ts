/**
 * 모든 Store를 한 번에 초기화하는 유틸리티 함수
 * 새로 시작할 때 사용
 */

import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import { usePersonalityStore } from '@/lib/store/personalityStore'
import { useProcessStore } from '@/lib/store/processStore'
import { useScopeStore } from '@/lib/store/scopeStore'

/**
 * 모든 Store와 localStorage를 초기화합니다
 * 새로 시작할 때 호출하세요
 */
export function resetAllStores() {
  // 1. SpaceInfo Store 초기화
  const { clearSpaceInfo } = useSpaceInfoStore.getState()
  clearSpaceInfo()

  // 2. Personality Store 초기화
  const { clearAnalysis, clearVibeData } = usePersonalityStore.getState()
  clearAnalysis()
  clearVibeData()

  // 3. Process Store 초기화 (헌법 적용: tierSelections 제거)
  const { clearAllProcesses } = useProcessStore.getState()
  clearAllProcesses()

  // 4. Scope Store 초기화 (선택된 공간만 초기화, 공간 목록은 유지)
  const { clearSelectedSpaces } = useScopeStore.getState()
  clearSelectedSpaces()

  // 5. localStorage에서 세부옵션도 제거
  if (typeof window !== 'undefined') {
    localStorage.removeItem('interibot_detail_options')
  }

  console.log('✅ 모든 Store 초기화 완료')
}

/**
 * localStorage에서 모든 관련 데이터를 직접 제거합니다
 * (Store 초기화와 함께 사용)
 */
export function clearAllLocalStorage() {
  if (typeof window === 'undefined') return

  // 모든 관련 localStorage 키 제거
  localStorage.removeItem('space-info-storage')
  localStorage.removeItem('personality-analysis-storage')
  localStorage.removeItem('process-selection-storage')
  localStorage.removeItem('scope-selection-storage')
  localStorage.removeItem('interibot_detail_options')

  console.log('✅ localStorage 초기화 완료')
}

/**
 * sessionStorage에서 모든 관련 데이터를 제거합니다
 */
export function clearAllSessionStorage() {
  if (typeof window === 'undefined') return

  // 모든 관련 sessionStorage 키 제거
  const sessionKeys = [
    'selectedAreas',
    'spaceInfo',
    'selectedProcesses',
    'kitchenOptions',
    'bathroomOptions',
    'woodworkOptions',
    'areaDetailsAnswers',
    'selectedFrameworks',
    'vibeInput',
  ]

  sessionKeys.forEach(key => {
    sessionStorage.removeItem(key)
  })

  // analysis_${analysisId} 패턴의 모든 키 제거
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.startsWith('analysis_')) {
      sessionStorage.removeItem(key)
    }
  }

  console.log('✅ sessionStorage 초기화 완료')
}

/**
 * 모든 Store, localStorage, sessionStorage를 완전히 초기화합니다
 * 새로 시작할 때 이 함수를 호출하세요
 */
export function resetEverything() {
  resetAllStores()
  clearAllLocalStorage()
  clearAllSessionStorage()
  console.log('🔄 모든 데이터 초기화 완료 - 새로 시작할 준비가 되었습니다!')
}























