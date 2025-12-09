import { AnchorEstimate } from './anchor-types';

/**
 * 아파트 25평 argen 등급 앵커 데이터
 * 출처: 실제 아르젠 견적서
 * 총 공사비: 38,046,000원
 */
export const ANCHOR_APARTMENT_25PY: AnchorEstimate = {
  areaPy: 25,
  housingType: '아파트',
  grade: 'argen',
  totalCost: 38046000,
  directCost: 33970000,
  materialCost: 21140000,  // 모든 카테고리 material 합산
  laborCost: 12450000,     // 모든 카테고리 labor 합산
  indirectCost: {
    insurance: 569000,     // 12,450,000 × 4.57% = 568,965 → 반올림
    overhead: 1019100,     // 33,970,000 × 3%
    management: 1698500,   // 33,970,000 × 5%
    total: 4076000         // 실제 간접공사비 (38,046,000 - 33,970,000)
  },
  categories: {
    kitchen: {
      name: '주방/다용도실 공사',
      total: 7072000,      // 주방 6,082,000 + 베란다 990,000
      material: 5372000,
      labor: 1700000,
      expense: 0
    },
    woodwork: {
      name: '목공사/가구공사',
      total: 3526000,      // 바닥 3,136,000 + 수납 390,000
      material: 2976000,
      labor: 550000,
      expense: 0
    },
    electrical: {
      name: '전기공사',
      total: 1030000,
      material: 630000,
      labor: 400000,
      expense: 0
    },
    bathroom: {
      name: '욕실 공사',
      total: 5008000,
      material: 4008000,
      labor: 1000000,
      expense: 0
    },
    tile: {
      name: '타일공사',
      total: 5204000,
      material: 2204000,
      labor: 3000000,
      expense: 0
    },
    painting: {
      name: '도장공사',
      total: 2320000,
      material: 1820000,
      labor: 500000,
      expense: 0
    },
    film: {
      name: '필름공사',
      total: 0,            // 25평 견적서에 없음
      material: 0,
      labor: 0,
      expense: 0
    },
    window: {
      name: '샤시/중문공사',
      total: 1720000,      // 현관 중문
      material: 1320000,
      labor: 400000,
      expense: 0
    },
    wallpaper: {
      name: '도배공사',
      total: 3510000,
      material: 2610000,
      labor: 900000,
      expense: 0
    },
    misc: {
      name: '기타공사',
      total: 4580000,      // 철거 4,000,000 + 청소/소모품 580,000
      material: 200000,
      labor: 4000000,
      expense: 380000
    }
  }
};