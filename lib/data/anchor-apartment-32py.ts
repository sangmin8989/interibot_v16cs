import { AnchorEstimate } from './anchor-types';

/**
 * 아파트 32평 argen 등급 앵커 데이터
 * 출처: 실제 아르젠 견적서
 * 총 공사비: 57,704,000원
 */
export const ANCHOR_APARTMENT_32PY: AnchorEstimate = {
  areaPy: 32,
  housingType: '아파트',
  grade: 'argen',
  totalCost: 57704000,
  directCost: 53124000,
  materialCost: 35534000,  // 모든 카테고리 material 합산
  laborCost: 16500000,     // 모든 카테고리 labor 합산
  indirectCost: {
    insurance: 754000,     // 16,500,000 × 4.57% = 754,050 → 반올림
    overhead: 1593700,     // 53,124,000 × 3%
    management: 2656200,   // 53,124,000 × 5%
    total: 4580000         // 실제 간접공사비 (57,704,000 - 53,124,000)
  },
  categories: {
    kitchen: {
      name: '주방/다용도실 공사',
      total: 9700000,
      material: 8150000,
      labor: 1550000,
      expense: 0
    },
    woodwork: {
      name: '목공사/가구공사',
      total: 6100000,
      material: 5150000,
      labor: 950000,
      expense: 0
    },
    electrical: {
      name: '전기공사',
      total: 2700000,
      material: 1700000,
      labor: 1000000,
      expense: 0
    },
    bathroom: {
      name: '욕실 공사',
      total: 6544000,
      material: 5044000,
      labor: 1500000,
      expense: 0
    },
    tile: {
      name: '타일공사',
      total: 5860000,
      material: 2860000,
      labor: 3000000,
      expense: 0
    },
    painting: {
      name: '도장공사',
      total: 2800000,
      material: 2100000,
      labor: 700000,
      expense: 0
    },
    film: {
      name: '필름공사',
      total: 2250000,
      material: 850000,
      labor: 1400000,
      expense: 0
    },
    window: {
      name: '샤시/중문공사',
      total: 5770000,
      material: 5490000,
      labor: 280000,
      expense: 0
    },
    wallpaper: {
      name: '도배공사',
      total: 4990000,
      material: 3990000,
      labor: 1000000,
      expense: 0
    },
    misc: {
      name: '기타공사',
      total: 6410000,      // 철거 5,120,000 + 기타 1,290,000
      material: 200000,
      labor: 5120000,
      expense: 1090000
    }
  }
};