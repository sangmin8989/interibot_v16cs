/**
 * V5 아르젠 추천 → 자재 DB 연결
 * 
 * 아르젠 추천 품목을 자재 DB에서 우선 추천
 */

import type { ArgenRecommendation } from './argen-recommender'

/**
 * 아르젠 추천 품목을 자재 검색 조건으로 변환
 * 
 * @param recommendation 아르젠 추천 결과
 * @returns 자재 검색 조건
 */
export function convertArgenToMaterialSearch(
  recommendation: ArgenRecommendation
): {
  keywords: string[]
  prioritizeArgen: boolean
  categories: string[]
} {
  if (!recommendation.recommend_argen) {
    return {
      keywords: [],
      prioritizeArgen: false,
      categories: [],
    }
  }

  // 품목별 카테고리 매핑
  const itemCategoryMap: Record<string, string> = {
    붙박이장: 'closet',
    신발장: 'shoeRack',
    수납장: 'storage',
    주방: 'kitchen',
    드레스룸: 'dressRoom',
    싱크대: 'sink',
    상부장: 'upperCabinet',
    하부장: 'lowerCabinet',
  }

  const categories: string[] = []
  const keywords: string[] = []

  for (const item of recommendation.items) {
    if (itemCategoryMap[item]) {
      categories.push(itemCategoryMap[item])
    }
    keywords.push(item)
  }

  return {
    keywords,
    prioritizeArgen: true,
    categories: Array.from(new Set(categories)),
  }
}

/**
 * 자재 검색 시 아르젠 우선 정렬
 * 
 * @param materials 자재 배열
 * @param recommendation 아르젠 추천 결과
 * @returns 정렬된 자재 배열 (아르젠 우선)
 */
export function sortMaterialsByArgen<T extends { argen_made?: boolean }>(
  materials: T[],
  recommendation: ArgenRecommendation
): T[] {
  if (!recommendation.recommend_argen) {
    return materials
  }

  // 아르젠 제작 자재를 앞으로
  return [...materials].sort((a, b) => {
    const aIsArgen = a.argen_made === true ? 1 : 0
    const bIsArgen = b.argen_made === true ? 1 : 0
    return bIsArgen - aIsArgen
  })
}

