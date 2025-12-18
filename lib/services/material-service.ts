/**
 * MaterialService - 자재 데이터 통합 서비스
 * 
 * 파일 기반과 DB 기반을 통합하는 서비스 레이어
 * Feature Flag로 점진적 전환 지원
 */

import { supabase } from '@/lib/db/supabase'
import type { Grade, SizeRange } from '@/lib/data/pricing-v3/types'
import { TILE_MATERIAL_PRICES } from '@/lib/data/pricing-v3/tile-constants'
import { 
  TILE_AREA_BY_LOCATION,
  type TileLocation 
} from '@/lib/data/pricing-v3/tile'
import { TILE_DAYS } from '@/lib/data/pricing-v3/labor'
import {
  tilePriceCache,
  tileAreaCache,
  tileDaysCache,
  createCacheKey,
  getCachedOrFetch
} from '@/lib/db/cache'
import {
  getTilePriceFromDB,
  getTileAreaFromDB,
  getTileDaysFromDB
} from '@/lib/db/adapters/tile-adapter'

// ============================================================
// 타입 정의
// ============================================================

/** 타일 단가 조회 옵션 */
interface TilePriceOptions {
  useDB?: boolean
  grade: Grade
}

/** 타일 면적 조회 옵션 */
interface TileAreaOptions {
  useDB?: boolean
  location: TileLocation
  sizeRange: SizeRange
}

/** 타일 시공일수 조회 옵션 */
interface TileDaysOptions {
  useDB?: boolean
  sizeRange: SizeRange
}

// ============================================================
// MaterialService 클래스
// ============================================================

/**
 * 자재 데이터 통합 서비스
 * 
 * 파일 기반과 DB 기반을 통합하여 제공하는 서비스 레이어
 * Feature Flag로 점진적 전환 지원
 */
export class MaterialService {
  // 싱글톤 패턴
  private static instance: MaterialService
  
  private constructor() {}
  
  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): MaterialService {
    if (!MaterialService.instance) {
      MaterialService.instance = new MaterialService()
    }
    return MaterialService.instance
  }
  
  /**
   * 타일 단가 조회
   * 
   * @param options - grade, useDB 옵션
   * @returns 평당 단가 (원/m²)
   * @throws Error - DB 조회 실패 시
   */
  async getTilePrice(options: TilePriceOptions): Promise<number> {
    const { useDB = false, grade } = options
    
    // Feature Flag 확인
    const shouldUseDB = useDB || process.env.USE_DB_TILE === 'true'
    const cacheKey = createCacheKey('tile_price', grade, shouldUseDB ? 'db' : 'file')
    
    return getCachedOrFetch(tilePriceCache, cacheKey, async () => {
      if (shouldUseDB) {
        try {
          console.log('🔄 DB에서 타일 단가 조회:', grade)
          return await getTilePriceFromDB(grade)
        } catch (error) {
          console.error('❌ DB 타일 단가 조회 실패, 파일로 fallback:', error)
          return this.getTilePriceFromFile(grade)
        }
      }
      
      // 파일에서 조회
      return this.getTilePriceFromFile(grade)
    })
  }
  
  /**
   * 타일 면적 조회
   * 
   * @param options - location, sizeRange, useDB 옵션
   * @returns 면적 (m²)
   * @throws Error - DB 조회 실패 시
   */
  async getTileArea(options: TileAreaOptions): Promise<number> {
    const { useDB = false, location, sizeRange } = options
    
    // Feature Flag 확인
    const shouldUseDB = useDB || process.env.USE_DB_TILE === 'true'
    const cacheKey = createCacheKey('tile_area', location, sizeRange, shouldUseDB ? 'db' : 'file')
    
    return getCachedOrFetch(tileAreaCache, cacheKey, async () => {
      if (shouldUseDB) {
        try {
          console.log('🔄 DB에서 타일 면적 조회:', location, sizeRange)
          return await getTileAreaFromDB(location, sizeRange)
        } catch (error) {
          console.error('❌ DB 타일 면적 조회 실패, 파일로 fallback:', error)
          return this.getTileAreaFromFile(location, sizeRange)
        }
      }
      
      return this.getTileAreaFromFile(location, sizeRange)
    })
  }
  
  /**
   * 타일 시공일수 조회
   * 
   * @param options - sizeRange, useDB 옵션
   * @returns 시공일수
   * @throws Error - DB 조회 실패 시
   */
  async getTileDays(options: TileDaysOptions): Promise<number> {
    const { useDB = false, sizeRange } = options
    
    // Feature Flag 확인
    const shouldUseDB = useDB || process.env.USE_DB_TILE === 'true'
    const cacheKey = createCacheKey('tile_days', sizeRange, shouldUseDB ? 'db' : 'file')
    
    return getCachedOrFetch(tileDaysCache, cacheKey, async () => {
      if (shouldUseDB) {
        try {
          console.log('🔄 DB에서 타일 일수 조회:', sizeRange)
          return await getTileDaysFromDB(sizeRange)
        } catch (error) {
          console.error('❌ DB 타일 일수 조회 실패, 파일로 fallback:', error)
          return this.getTileDaysFromFile(sizeRange)
        }
      }
      
      return this.getTileDaysFromFile(sizeRange)
    })
  }
  
  // ============================================================
  // Private: 파일에서 조회하는 메서드들
  // ============================================================
  
  /**
   * 파일에서 타일 단가 조회
   * 
   * @param grade - 등급
   * @returns 평당 단가 (원/m²)
   */
  private getTilePriceFromFile(grade: Grade): number {
    return TILE_MATERIAL_PRICES[grade] || TILE_MATERIAL_PRICES.STANDARD
  }
  
  /**
   * 파일에서 타일 면적 조회
   * 
   * @param location - 위치 (BATHROOM, KITCHEN, ENTRANCE)
   * @param sizeRange - 평형 범위
   * @returns 면적 (m²)
   */
  private getTileAreaFromFile(
    location: TileLocation, 
    sizeRange: SizeRange
  ): number {
    const area = TILE_AREA_BY_LOCATION[location]?.[sizeRange]
    
    if (area === undefined) {
      console.warn(`⚠️ 타일 면적 데이터 없음: ${location}, ${sizeRange}`)
      // 기본값 반환
      return location === 'BATHROOM' ? 20 : location === 'KITCHEN' ? 6 : 3
    }
    
    return area
  }
  
  /**
   * 파일에서 타일 시공일수 조회
   * 
   * @param sizeRange - 평형 범위
   * @returns 시공일수
   */
  private getTileDaysFromFile(sizeRange: SizeRange): number {
    const days = TILE_DAYS[sizeRange]
    
    if (days === undefined) {
      console.warn(`⚠️ 타일 일수 데이터 없음: ${sizeRange}`)
      return 3 // 기본값
    }
    
    return days
  }
}

// ============================================================
// Export 싱글톤 인스턴스
// ============================================================

/**
 * MaterialService 싱글톤 인스턴스
 * 
 * @example
 * ```typescript
 * import { materialService } from '@/lib/services/material-service'
 * 
 * const price = await materialService.getTilePrice({ grade: 'STANDARD' })
 * ```
 */
export const materialService = MaterialService.getInstance()

// ============================================================
// 개발 환경 테스트
// ============================================================

if (process.env.NODE_ENV === 'development') {
  (async () => {
    const service = materialService
    
    console.log('🧪 MaterialService DB 연동 테스트 시작')
    console.log('='.repeat(50))
    
    try {
      // 파일 기반 조회
      console.log('\n📁 파일 기반 조회:')
      const priceFile = await service.getTilePrice({ 
        grade: 'ARGEN', 
        useDB: false 
      })
      console.log('✅ 파일: ARGEN =', priceFile, '원')
      
      // DB 기반 조회 (실제 작동)
      console.log('\n🗄️ DB 기반 조회:')
      try {
        const priceDB = await service.getTilePrice({ 
          grade: 'ARGEN', 
          useDB: true 
        })
        console.log('✅ DB: ARGEN =', priceDB, '원')
      } catch (error) {
        console.log('⚠️ DB 조회 실패 (정상 - DB 연결 안 됨):', error instanceof Error ? error.message : error)
      }
      
      // 캐시 테스트
      console.log('\n🎯 캐시 테스트:')
      console.log('--- 첫 번째 호출 (캐시 미스 예상) ---')
      const price1 = await service.getTilePrice({ 
        grade: 'STANDARD', 
        useDB: false 
      })
      console.log('타일 단가 (STANDARD, 파일):', price1, '원')
      
      console.log('--- 두 번째 호출 (캐시 히트 예상) ---')
      const price2 = await service.getTilePrice({ 
        grade: 'STANDARD', 
        useDB: false 
      })
      console.log('타일 단가 (STANDARD, 파일):', price2, '원')
      
      // 타일 면적 테스트
      console.log('\n📐 타일 면적 조회:')
      const area = await service.getTileArea({
        location: 'BATHROOM',
        sizeRange: '30PY',
        useDB: false
      })
      console.log('✅ 타일 면적 (욕실, 30평, 파일):', area, 'm²')
      
      console.log('\n' + '='.repeat(50))
      console.log('✅ MaterialService 테스트 완료')
    } catch (error) {
      console.error('❌ 테스트 중 오류:', error)
    }
  })()
}

