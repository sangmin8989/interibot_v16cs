/**
 * 캐시 모듈 - LRU Cache 기반
 * 
 * Supabase 조회 결과를 캐싱하여 성능 최적화
 * TTL 24시간, 조회 시 자동 갱신
 */

import { LRUCache } from 'lru-cache'

// ============================================================
// 타입 정의
// ============================================================

export type CacheKey = string
export type CacheValue = any

// ============================================================
// 캐시 인스턴스
// ============================================================

/**
 * 타일 단가 캐시 (등급별 4개)
 * - BASIC, STANDARD, ARGEN, PREMIUM
 */
export const tilePriceCache = new LRUCache<CacheKey, number>({
  max: 4,  // BASIC, STANDARD, ARGEN, PREMIUM
  ttl: 1000 * 60 * 60 * 24, // 24시간
  updateAgeOnGet: true, // 조회 시 TTL 갱신
})

/**
 * 타일 면적 캐시 (위치 3개 × 평형 5개 = 15개)
 * - 위치: BATHROOM, KITCHEN, ENTRANCE
 * - 평형: 10PY, 20PY, 30PY, 40PY, 50PY
 */
export const tileAreaCache = new LRUCache<CacheKey, number>({
  max: 15,
  ttl: 1000 * 60 * 60 * 24, // 24시간
  updateAgeOnGet: true,
})

/**
 * 타일 시공일수 캐시 (평형 5개)
 * - 10PY, 20PY, 30PY, 40PY, 50PY
 */
export const tileDaysCache = new LRUCache<CacheKey, number>({
  max: 5,
  ttl: 1000 * 60 * 60 * 24, // 24시간
  updateAgeOnGet: true,
})

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * 캐시 키 생성
 * 
 * @param prefix - 키 접두사 (예: 'tile:price')
 * @param parts - 키 부분들 (예: 'ARGEN', '30PY')
 * @returns 캐시 키
 * 
 * @example
 * ```typescript
 * const key = createCacheKey('tile:price', 'ARGEN')
 * // 결과: 'tile:price:ARGEN'
 * ```
 */
export function createCacheKey(prefix: string, ...parts: (string | number)[]): CacheKey {
  return `${prefix}:${parts.join(':')}`
}

/**
 * 캐시에서 가져오기 (없으면 fetch 실행)
 * 
 * @param cache - LRU 캐시 인스턴스
 * @param key - 캐시 키
 * @param fetchFn - 캐시 미스 시 실행할 비동기 함수
 * @returns 캐시된 값 또는 fetch 결과
 * 
 * @example
 * ```typescript
 * const price = await getCachedOrFetch(
 *   tilePriceCache,
 *   'tile:price:ARGEN',
 *   async () => await fetchFromDB('ARGEN')
 * )
 * ```
 */
export async function getCachedOrFetch<T extends {}>(
  cache: LRUCache<CacheKey, T>,
  key: CacheKey,
  fetchFn: () => Promise<T>
): Promise<T> {
  // 캐시에 있으면 리턴
  const cached = cache.get(key)
  if (cached !== undefined) {
    console.log('🎯 캐시 히트:', key)
    return cached
  }
  
  // 없으면 fetch 실행
  console.log('🔄 캐시 미스, 조회 중:', key)
  const value = await fetchFn()
  
  // 캐시에 저장
  cache.set(key, value)
  console.log('💾 캐시 저장:', key)
  
  return value
}

// ============================================================
// 개발 환경 로깅
// ============================================================

if (process.env.NODE_ENV === 'development') {
  console.log('✅ 캐시 시스템 초기화 완료')
  console.log('   - 타일 단가 캐시: max 4, TTL 24h')
  console.log('   - 타일 면적 캐시: max 15, TTL 24h')
  console.log('   - 타일 일수 캐시: max 5, TTL 24h')
}

