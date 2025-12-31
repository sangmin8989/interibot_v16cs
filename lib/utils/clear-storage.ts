/**
 * localStorage 클리어 유틸리티
 * 개발 환경에서 모든 Zustand store 데이터를 클리어합니다.
 */

/**
 * 모든 Zustand store의 localStorage 데이터를 클리어합니다.
 */
export function clearAllStores() {
  if (typeof window === 'undefined') return

  const storeKeys = [
    'space-info-storage',
    'personality-analysis-storage',
    'scope-selection-storage',
    'process-selection-storage',
  ]

  storeKeys.forEach(key => {
    localStorage.removeItem(key)
    console.log(`✅ ${key} 클리어 완료`)
  })

  console.log('🎉 모든 store 데이터 클리어 완료!')
}

/**
 * 특정 store의 localStorage 데이터를 클리어합니다.
 */
export function clearStore(storeName: string) {
  if (typeof window === 'undefined') return

  localStorage.removeItem(storeName)
  console.log(`✅ ${storeName} 클리어 완료`)
}

/**
 * 개발 환경에서 자동으로 localStorage를 클리어합니다.
 * URL 파라미터에 ?clear=true가 있으면 자동으로 클리어합니다.
 */
export function autoClearOnDev() {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV !== 'development') return

  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('clear') === 'true') {
    clearAllStores()
    // URL에서 clear 파라미터 제거
    urlParams.delete('clear')
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
    window.history.replaceState({}, '', newUrl)
    // 페이지 새로고침
    window.location.reload()
  }
}
























