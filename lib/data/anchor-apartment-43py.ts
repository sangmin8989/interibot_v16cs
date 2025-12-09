import { AnchorEstimate } from './anchor-types';

/**
 * 아파트 43평 Standard 등급 앵커 데이터
 * 출처: 실제 아르젠 견적서 (동수원자이)
 * 총 공사비: 59,600,000원
 */
export const ANCHOR_APARTMENT_43PY: AnchorEstimate = {
  areaPy: 43,
  housingType: '아파트',
  grade: 'Standard',
  totalCost: 59600000,
  directCost: 55239500,
  materialCost: 35575500,  // 모든 카테고리 material 합산
  laborCost: 16314000,     // 모든 카테고리 labor 합산
  indirectCost: {
    insurance: 745549,     // 16,314,000 × 4.57%
    overhead: 1657185,     // 55,239,500 × 3%
    management: 2761975,   // 55,239,500 × 5%
    total: 4360500         // 실제 간접공사비 (59,600,000 - 55,239,500)
  },
  categories: {
    kitchen: {
      name: '주방/다용도실 공사',
      total: 10904000,
      material: 10124000,
      labor: 780000,
      expense: 0
    },
    woodwork: {
      name: '목공사/가구공사',
      total: 8755000,
      material: 6095000,
      labor: 2660000,
      expense: 0
    },
    electrical: {
      name: '전기공사',
      total: 2910000,
      material: 1410000,
      labor: 1500000,
      expense: 0
    },
    bathroom: {
      name: '욕실 공사',
      total: 6490000,
      material: 4490000,
      labor: 2000000,
      expense: 0
    },
    tile: {
      name: '타일공사',
      total: 5817500,
      material: 3367500,
      labor: 2450000,
      expense: 0
    },
    painting: {
      name: '도장공사',
      total: 1150000,
      material: 550000,
      labor: 600000,
      expense: 0
    },
    film: {
      name: '필름공사',
      total: 2150000,
      material: 750000,
      labor: 1400000,
      expense: 0
    },
    window: {
      name: '샤시/중문공사',
      total: 5810000,
      material: 4970000,
      labor: 840000,
      expense: 0
    },
    wallpaper: {
      name: '도배공사',
      total: 4733000,
      material: 3733000,
      labor: 1000000,
      expense: 0
    },
    misc: {
      name: '기타공사',
      total: 6520000,
      material: 86000,
      labor: 3084000,
      expense: 3350000
    }
  }
};