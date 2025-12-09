import { AnchorEstimate } from './anchor-types';

/**
 * 아파트 45평 argen 등급 앵커 데이터
 * 출처: 실제 아르젠 견적서 (창호+필름 포함)
 * 총 공사비: 61,680,000원
 */
export const ANCHOR_APARTMENT_45PY: AnchorEstimate = {
  areaPy: 45,
  housingType: '아파트',
  grade: 'argen',
  totalCost: 61680000,
  directCost: 55073000,
  materialCost: 35783000,  // 모든 카테고리 material 합산
  laborCost: 18840000,     // 모든 카테고리 labor 합산
  indirectCost: {
    insurance: 861000,     // 18,840,000 × 4.57% = 860,988 → 반올림
    overhead: 1652000,     // 55,073,000 × 3% = 1,652,190 → 반올림
    management: 2754000,   // 55,073,000 × 5% = 2,753,650 → 반올림
    total: 6607000         // 실제 간접공사비 (61,680,000 - 55,073,000)
  },
  categories: {
    kitchen: {
      name: '주방/다용도실 공사',
      total: 7282000,      // 주방 6,082,000 + 베란다 1,200,000
      material: 5892000,
      labor: 1390000,
      expense: 0
    },
    woodwork: {
      name: '목공사/가구공사',
      total: 6254000,      // 바닥 4,604,000 + 붙박이/수납 1,650,000
      material: 5204000,
      labor: 1050000,
      expense: 0
    },
    electrical: {
      name: '전기공사',
      total: 1130000,
      material: 630000,
      labor: 500000,
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
      total: 6524000,
      material: 2924000,
      labor: 3600000,
      expense: 0
    },
    painting: {
      name: '도장공사',
      total: 3220000,
      material: 2520000,
      labor: 700000,
      expense: 0
    },
    film: {
      name: '필름공사',
      total: 3985000,
      material: 2885000,
      labor: 1100000,
      expense: 0
    },
    window: {
      name: '샤시/중문공사',
      total: 9920000,      // 창호 8,200,000 + 현관 1,720,000
      material: 8520000,
      labor: 1400000,
      expense: 0
    },
    wallpaper: {
      name: '도배공사',
      total: 3900000,
      material: 3000000,
      labor: 900000,
      expense: 0
    },
    misc: {
      name: '기타공사',
      total: 7850000,      // 철거 7,200,000 + 청소 450,000 + 소모품 200,000
      material: 200000,
      labor: 7200000,
      expense: 450000
    }
  }
};