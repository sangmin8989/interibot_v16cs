import { AnchorEstimate } from './anchor-types';

/**
 * 아파트 18평 argen 등급 앵커 데이터
 * 출처: 실제 아르젠 견적서
 * 총 공사비: 27,944,000원
 */
export const ANCHOR_APARTMENT_18PY: AnchorEstimate = {
  areaPy: 18,
  housingType: '아파트',
  grade: 'argen',
  totalCost: 27944000,
  directCost: 24950000,
  materialCost: 13914000,  // 모든 카테고리 material 합산
  laborCost: 10780000,     // 모든 카테고리 labor 합산
  indirectCost: {
    insurance: 493000,     // 10,780,000 × 4.57% = 492,646 → 반올림
    overhead: 748500,      // 24,950,000 × 3%
    management: 1247500,   // 24,950,000 × 5%
    total: 2994000         // 실제 간접공사비 (27,944,000 - 24,950,000)
  },
  categories: {
    kitchen: {
      name: '주방/다용도실 공사',
      total: 5720000,      // 주방 4,950,000 + 베란다 770,000
      material: 4260000,
      labor: 1460000,
      expense: 0
    },
    woodwork: {
      name: '목공사/가구공사',
      total: 2676000,      // 바닥 2,376,000 + 수납 300,000
      material: 2156000,
      labor: 520000,
      expense: 0
    },
    electrical: {
      name: '전기공사',
      total: 850000,
      material: 500000,
      labor: 350000,
      expense: 0
    },
    bathroom: {
      name: '욕실 공사',
      total: 2428000,
      material: 1928000,
      labor: 500000,
      expense: 0
    },
    tile: {
      name: '타일공사',
      total: 3576000,
      material: 1176000,
      labor: 2400000,
      expense: 0
    },
    painting: {
      name: '도장공사',
      total: 1900000,
      material: 1400000,
      labor: 500000,
      expense: 0
    },
    film: {
      name: '필름공사',
      total: 0,
      material: 0,
      labor: 0,
      expense: 0
    },
    window: {
      name: '샤시/중문공사',
      total: 1650000,      // 현관 중문
      material: 1280000,
      labor: 370000,
      expense: 0
    },
    wallpaper: {
      name: '도배공사',
      total: 2840000,
      material: 2040000,
      labor: 800000,
      expense: 0
    },
    misc: {
      name: '기타공사',
      total: 3310000,      // 철거 2,880,000 + 청소 280,000 + 소모품 150,000
      material: 150000,
      labor: 2880000,
      expense: 280000
    }
  }
};