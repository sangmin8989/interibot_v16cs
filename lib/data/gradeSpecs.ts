/**
 * 아르젠 3등급 체계 - 공정별 상세 명세서
 * 
 * 등급: ESSENTIAL, STANDARD, OPUS
 * 32평 기준 총액: 2,800만원 / 4,900만원 / 8,700만원
 */

export type ArgenGrade = 'ESSENTIAL' | 'STANDARD' | 'OPUS'

export interface GradeInfo {
  code: ArgenGrade
  name: string
  nameEn: string
  concept: string
  targetCustomer: string
  totalPrice32py: {
    min: number // 만원
    max: number // 만원
  }
}

export const GRADE_INFO: Record<ArgenGrade, GradeInfo> = {
  ESSENTIAL: {
    code: 'ESSENTIAL',
    name: '에센셜',
    nameEn: 'ARGEN ESSENTIAL',
    concept: '필수만 확실하게',
    targetCustomer: '실속파, 전세, 단기 거주',
    totalPrice32py: {
      min: 2500,
      max: 3500,
    },
  },
  STANDARD: {
    code: 'STANDARD',
    name: '스탠다드',
    nameEn: 'ARGEN STANDARD',
    concept: '가성비 최적화',
    targetCustomer: '밸런스파, 5~10년 거주',
    totalPrice32py: {
      min: 3500,
      max: 5000,
    },
  },
  OPUS: {
    code: 'OPUS',
    name: '오퍼스',
    nameEn: 'ARGEN OPUS',
    concept: '타협 없는 퀄리티',
    targetCustomer: '프리미엄파, 10년+ 거주',
    totalPrice32py: {
      min: 5000,
      max: 8000,
    },
  },
}

// ============================================================
// 1. 주방 공정
// ============================================================

export interface KitchenSinkSpec {
  brand: string
  doorMaterial: string
  bodyMaterial: string
  drawerRail: string
  materialCostPerUnit: number // 원/자
  laborCost: 'included' | 'separate'
  durability: string
}

export interface KitchenUpperSpec {
  brand: string
  doorMaterial: string
  hinge: string
  materialCostPerUnit: number // 원/자
}

export interface KitchenCounterSpec {
  material: string
  thickness: string
  width: string
  materialCostPerM: number // 원/m
  heatResistance: string
  scratchResistance: string
  characteristics: string
}

export interface KitchenSinkFaucetSpec {
  sink: {
    type: string
    brand: string
    price: number // 원
  }
  faucet: {
    type: string
    brand: string
    price: number // 원
  }
  waterPurifier: 'none' | 'optional' | 'included'
}

export interface KitchenHoodSpec {
  type: string
  brand: string
  price: number // 원
  airflow: string // CMH
}

export interface KitchenIslandSpec {
  island: {
    type: string
    price: number // 원
  }
  tallCabinet: {
    included: boolean
    price: number // 원
  }
}

export interface KitchenSpec {
  sink: KitchenSinkSpec
  upper: KitchenUpperSpec
  counter: KitchenCounterSpec
  sinkFaucet: KitchenSinkFaucetSpec
  hood: KitchenHoodSpec
  island: KitchenIslandSpec
  total32py: {
    material: number // 만원
    labor: number // 만원
    total: number // 만원
  }
}

export const KITCHEN_SPECS: Record<ArgenGrade, KitchenSpec> = {
  ESSENTIAL: {
    sink: {
      brand: '국산 중소 (씽크존, 주방뱅크)',
      doorMaterial: 'LPM (저압 멜라민)',
      bodyMaterial: '일반 MDF',
      drawerRail: '일반 레일',
      materialCostPerUnit: 80000,
      laborCost: 'included',
      durability: '5~7년',
    },
    upper: {
      brand: '국산 중소',
      doorMaterial: 'LPM',
      hinge: '일반 경첩',
      materialCostPerUnit: 60000,
    },
    counter: {
      material: '인조대리석 (삼성/LX)',
      thickness: '12mm',
      width: '600mm',
      materialCostPerM: 150000,
      heatResistance: '180℃',
      scratchResistance: '약함',
      characteristics: '가성비',
    },
    sinkFaucet: {
      sink: {
        type: '스테인리스 일반',
        brand: '일반',
        price: 80000,
      },
      faucet: {
        type: '국산 기본',
        brand: '국산',
        price: 80000,
      },
      waterPurifier: 'none',
    },
    hood: {
      type: '벽부착형',
      brand: '린나이 기본',
      price: 150000,
      airflow: '600CMH',
    },
    island: {
      island: {
        type: '기본형 (수납만)',
        price: 1500000,
      },
      tallCabinet: {
        included: false,
        price: 0,
      },
    },
    total32py: {
      material: 450,
      labor: 80,
      total: 530,
    },
  },
  STANDARD: {
    sink: {
      brand: '한샘, 리바트, 에넥스',
      doorMaterial: 'PET 무광/유광',
      bodyMaterial: '친환경 MDF E0',
      drawerRail: '블룸 기본형',
      materialCostPerUnit: 120000,
      laborCost: 'included',
      durability: '10년',
    },
    upper: {
      brand: '한샘, 리바트',
      doorMaterial: 'PET',
      hinge: '블룸 소프트 클로징',
      materialCostPerUnit: 90000,
    },
    counter: {
      material: '엔지니어드스톤 (삼성 라디안스)',
      thickness: '12~20mm',
      width: '650mm',
      materialCostPerM: 250000,
      heatResistance: '250℃',
      scratchResistance: '중간',
      characteristics: '밸런스',
    },
    sinkFaucet: {
      sink: {
        type: '백조 언더싱크',
        brand: '백조',
        price: 250000,
      },
      faucet: {
        type: 'KVK / 세비앙',
        brand: 'KVK/세비앙',
        price: 200000,
      },
      waterPurifier: 'optional',
    },
    hood: {
      type: '빌트인 슬림',
      brand: '하츠 / 쿠쿠',
      price: 350000,
      airflow: '800CMH',
    },
    island: {
      island: {
        type: '싱크 포함',
        price: 2800000,
      },
      tallCabinet: {
        included: true,
        price: 400000,
      },
    },
    total32py: {
      material: 750,
      labor: 100,
      total: 850,
    },
  },
  OPUS: {
    sink: {
      brand: '아르젠 커스텀',
      doorMaterial: '도장 / 하이그로시',
      bodyMaterial: '친환경 MDF E0 + 내수합판',
      drawerRail: '블룸 풀익스텐션',
      materialCostPerUnit: 180000,
      laborCost: 'included',
      durability: '15년+',
    },
    upper: {
      brand: '아르젠 커스텀',
      doorMaterial: '도장 / 알루미늄 프레임',
      hinge: '블룸 익스펠로 (터치 오픈)',
      materialCostPerUnit: 140000,
    },
    counter: {
      material: '세라믹 (라미나) / 천연대리석',
      thickness: '20mm',
      width: '700mm',
      materialCostPerM: 450000,
      heatResistance: '500℃+ (세라믹)',
      scratchResistance: '강함',
      characteristics: '반영구적',
    },
    sinkFaucet: {
      sink: {
        type: '프랑케 / 블랑코',
        brand: '프랑케/블랑코',
        price: 500000,
      },
      faucet: {
        type: '그로헤 / 한스그로헤',
        brand: '그로헤/한스그로헤',
        price: 450000,
      },
      waterPurifier: 'included',
    },
    hood: {
      type: '천장 매립형',
      brand: '파세코 / 일렉트로룩스',
      price: 800000,
      airflow: '1,000CMH+',
    },
    island: {
      island: {
        type: '쿡탑+싱크 일체형',
        price: 5000000,
      },
      tallCabinet: {
        included: true,
        price: 600000,
      },
    },
    total32py: {
      material: 1200,
      labor: 150,
      total: 1350,
    },
  },
}

// ============================================================
// 2. 욕실 공정
// ============================================================

export interface BathroomToiletSpec {
  brand: string
  type: string
  price: number // 원
  waterSaving: string
}

export interface BathroomSinkSpec {
  type: string
  brand: string
  price: number // 원
  faucet: {
    type: string
    brand: string
    price: number // 원
  }
}

export interface BathroomShowerSpec {
  type: string
  brand: string
  price: number // 원
}

export interface BathroomTileSpec {
  wallTile: string
  floorTile: string
  materialCostPerSqm: number // 원/㎡
  laborCostPerSqm: number // 원/㎡
}

export interface BathroomOtherSpec {
  showerPartition: {
    type: string
    price: number // 원
  }
  slideCabinet: {
    type: string
    price: number // 원
  }
  ventilation: string
  accessories: string
}

export interface BathroomWaterproofSpec {
  method: string
  material: string
  pricePerUnit: number // 원/개소
}

export interface BathroomSpec {
  toilet: BathroomToiletSpec
  sink: BathroomSinkSpec
  shower: BathroomShowerSpec
  tile: BathroomTileSpec
  other: BathroomOtherSpec
  waterproof: BathroomWaterproofSpec
  total32py: {
    material: number // 만원 (2개소 기준)
    labor: number // 만원
    total: number // 만원
  }
}

export const BATHROOM_SPECS: Record<ArgenGrade, BathroomSpec> = {
  ESSENTIAL: {
    toilet: {
      brand: '국산 (계룡, 동서)',
      type: '투피스',
      price: 150000,
      waterSaving: '일반',
    },
    sink: {
      type: '반다리형',
      brand: '국산',
      price: 100000,
      faucet: {
        type: '국산 기본',
        brand: '국산',
        price: 50000,
      },
    },
    shower: {
      type: '일반 샤워기',
      brand: '국산',
      price: 80000,
    },
    tile: {
      wallTile: '국산 300x600',
      floorTile: '국산 300x300',
      materialCostPerSqm: 25000,
      laborCostPerSqm: 50000,
    },
    other: {
      showerPartition: {
        type: '아크릴',
        price: 150000,
      },
      slideCabinet: {
        type: '기본형',
        price: 80000,
      },
      ventilation: '일반',
      accessories: '국산 세트',
    },
    waterproof: {
      method: '2차 방수',
      material: '일반 방수제',
      pricePerUnit: 350000,
    },
    total32py: {
      material: 250,
      labor: 150,
      total: 400,
    },
  },
  STANDARD: {
    toilet: {
      brand: '대림 / 이누스',
      type: '원피스',
      price: 400000,
      waterSaving: '절수형',
    },
    sink: {
      type: '하부장 일체형',
      brand: '이누스 / 대림',
      price: 280000,
      faucet: {
        type: '세비앙',
        brand: '세비앙',
        price: 150000,
      },
    },
    shower: {
      type: '레인샤워 세트',
      brand: 'KVK / 세비앙',
      price: 180000,
    },
    tile: {
      wallTile: '수입 300x600',
      floorTile: '논슬립 300x300',
      materialCostPerSqm: 45000,
      laborCostPerSqm: 55000,
    },
    other: {
      showerPartition: {
        type: '강화유리 (8T)',
        price: 280000,
      },
      slideCabinet: {
        type: 'LED 조명',
        price: 200000,
      },
      ventilation: '힘펠',
      accessories: 'SUS 무광',
    },
    waterproof: {
      method: '3차 책임방수',
      material: '친환경 방수제',
      pricePerUnit: 500000,
    },
    total32py: {
      material: 400,
      labor: 200,
      total: 600,
    },
  },
  OPUS: {
    toilet: {
      brand: '토토 / 듀라빗 / 콜러',
      type: '비데일체형 / 월헝',
      price: 800000,
      waterSaving: '초절수',
    },
    sink: {
      type: '카운터형 / 벽걸이',
      brand: '듀라빗 / 콜러',
      price: 600000,
      faucet: {
        type: '한스그로헤',
        brand: '한스그로헤',
        price: 400000,
      },
    },
    shower: {
      type: '매립 레인샤워 + 핸드샤워',
      brand: '그로헤 / 한스그로헤',
      price: 500000,
    },
    tile: {
      wallTile: '대형 600x1200',
      floorTile: '대형 or 패턴',
      materialCostPerSqm: 80000,
      laborCostPerSqm: 65000,
    },
    other: {
      showerPartition: {
        type: '강화유리 (10T) + 블랙 프레임',
        price: 450000,
      },
      slideCabinet: {
        type: '스마트 미러',
        price: 500000,
      },
      ventilation: '힘펠 프리미엄',
      accessories: '수입 디자인',
    },
    waterproof: {
      method: '3차 + 누수 보험',
      material: '독일산 방수제',
      pricePerUnit: 700000,
    },
    total32py: {
      material: 700,
      labor: 250,
      total: 950,
    },
  },
}

// ============================================================
// 3. 바닥재 공정
// ============================================================

export interface FlooringSpec {
  type: string
  brand: string
  thickness: string
  materialCostPerSqm: number // 원/㎡
  laborCostPerSqm: number // 원/㎡
  durability: string
  reformPossible: string
  molding: {
    type: string
    pricePerM: number // 원/m
  }
  total32py: {
    material: number // 만원
    labor: number // 만원
    total: number // 만원
  }
}

export const FLOORING_SPECS: Record<ArgenGrade, FlooringSpec> = {
  ESSENTIAL: {
    type: '강마루',
    brand: '동화/이건 기본',
    thickness: '8mm',
    materialCostPerSqm: 35000,
    laborCostPerSqm: 15000,
    durability: '5~7년',
    reformPossible: '불가 (교체)',
    molding: {
      type: 'PVC 굽도리',
      pricePerM: 3000,
    },
    total32py: {
      material: 280,
      labor: 120,
      total: 400,
    },
  },
  STANDARD: {
    type: '강마루 프리미엄',
    brand: 'LX지인 / 한화',
    thickness: '10~12mm',
    materialCostPerSqm: 55000,
    laborCostPerSqm: 18000,
    durability: '10~15년',
    reformPossible: '불가',
    molding: {
      type: '알루미늄 8전',
      pricePerM: 5500,
    },
    total32py: {
      material: 440,
      labor: 145,
      total: 585,
    },
  },
  OPUS: {
    type: '원목마루',
    brand: '카린다 / 독일산',
    thickness: '15mm+',
    materialCostPerSqm: 120000,
    laborCostPerSqm: 25000,
    durability: '20년+',
    reformPossible: '샌딩 후 재사용',
    molding: {
      type: '원목 몰딩',
      pricePerM: 12000,
    },
    total32py: {
      material: 960,
      labor: 200,
      total: 1160,
    },
  },
}

// ============================================================
// 4. 도배 공정
// ============================================================

export interface WallpaperSpec {
  ceiling: string
  wall: string
  ceilingPricePerSqm: number | null // 원/㎡
  wallPricePerSqm: number // 원/㎡
  functionality: string
  pointWallpaper: {
    applied: boolean
    type: string
    additionalCost: number // 만원
  }
  total32py: {
    material: number // 만원
    labor: number // 만원
    total: number // 만원
  }
}

export const WALLPAPER_SPECS: Record<ArgenGrade, WallpaperSpec> = {
  ESSENTIAL: {
    ceiling: '합지',
    wall: '실크 기본',
    ceilingPricePerSqm: 7000,
    wallPricePerSqm: 9000,
    functionality: '일반',
    pointWallpaper: {
      applied: false,
      type: '-',
      additionalCost: 0,
    },
    total32py: {
      material: 150,
      labor: 100,
      total: 250,
    },
  },
  STANDARD: {
    ceiling: '실크',
    wall: 'LX지인 실크',
    ceilingPricePerSqm: null,
    wallPricePerSqm: 12000,
    functionality: '친환경/항균',
    pointWallpaper: {
      applied: true,
      type: '패턴/컬러',
      additionalCost: 30,
    },
    total32py: {
      material: 220,
      labor: 120,
      total: 340,
    },
  },
  OPUS: {
    ceiling: '수입 실크',
    wall: '수입 벽지 / 천연 벽지',
    ceilingPricePerSqm: null,
    wallPricePerSqm: 25000,
    functionality: '방염/조습/친환경',
    pointWallpaper: {
      applied: true,
      type: '수입 프리미엄 / 아트월',
      additionalCost: 100,
    },
    total32py: {
      material: 400,
      labor: 150,
      total: 550,
    },
  },
}

// ============================================================
// 5. 샤시/창호 공정
// ============================================================

export interface WindowSpec {
  type: string
  brand: string
  glass: string
  insulation: string
  soundproofing: string
  pricePerUnit: {
    material: number // 원 (1500x1500 기준)
    labor: number // 원
    total: number // 원
  }
  total32py: number // 만원 (창 5~6개 기준)
}

export const WINDOW_SPECS: Record<ArgenGrade, WindowSpec> = {
  ESSENTIAL: {
    type: '기존 유지',
    brand: '-',
    glass: '기존',
    insulation: '기존',
    soundproofing: '기존',
    pricePerUnit: {
      material: 0,
      labor: 0,
      total: 0,
    },
    total32py: 0,
  },
  STANDARD: {
    type: '이중샤시 추가',
    brand: 'KCC / LX',
    glass: '로이유리 22mm',
    insulation: '+40% 향상',
    soundproofing: '+30% 향상',
    pricePerUnit: {
      material: 600000,
      labor: 150000,
      total: 750000,
    },
    total32py: 400, // 창 5~6개 기준
  },
  OPUS: {
    type: '시스템창호 교체',
    brand: '슈코 / YKK / 레클라',
    glass: '삼중유리 36mm+',
    insulation: '+70% 향상',
    soundproofing: '+60% 향상',
    pricePerUnit: {
      material: 1500000,
      labor: 300000,
      total: 1800000,
    },
    total32py: 900, // 창 5~6개 기준
  },
}

// ============================================================
// 6. 중문 공정
// ============================================================

export interface SlidingDoorSpec {
  type: string
  frame: string
  thickness: string
  glass: string
  brand: string
  pricePerUnit: {
    material: number // 원 (1550x2200 기준)
    labor: number // 원
    total: number // 원
  }
}

export const SLIDING_DOOR_SPECS: Record<ArgenGrade, SlidingDoorSpec> = {
  ESSENTIAL: {
    type: '일반 3연동',
    frame: 'PVC',
    thickness: '50mm',
    glass: '일반 유리',
    brand: '국산 일반',
    pricePerUnit: {
      material: 700000,
      labor: 150000,
      total: 850000,
    },
  },
  STANDARD: {
    type: '슬림 3연동',
    frame: '알루미늄',
    thickness: '45mm',
    glass: '강화유리 5T',
    brand: '영림/한샘',
    pricePerUnit: {
      material: 1200000,
      labor: 200000,
      total: 1400000,
    },
  },
  OPUS: {
    type: '자동 3연동',
    frame: '알루미늄 프리미엄',
    thickness: '40mm (초슬림)',
    glass: '복층유리',
    brand: 'LX지인/네모아이',
    pricePerUnit: {
      material: 2000000,
      labor: 300000,
      total: 2300000,
    },
  },
}

// ============================================================
// 7. 도어 공정
// ============================================================

export interface DoorSpec {
  material: string
  brand: string
  finish: string
  handle: string
  pricePerUnit: {
    material: number // 원
    labor: number // 원
    total: number // 원
  }
  total32py: number // 만원 (5~6개 기준)
}

export const DOOR_SPECS: Record<ArgenGrade, DoorSpec> = {
  ESSENTIAL: {
    material: 'ABS 도어',
    brand: '국산 기본',
    finish: '필름',
    handle: '일반',
    pricePerUnit: {
      material: 250000,
      labor: 50000,
      total: 300000,
    },
    total32py: 165, // 5~6개 기준
  },
  STANDARD: {
    material: '온면 도어',
    brand: '영림 / 한샘',
    finish: '시트',
    handle: '알루미늄',
    pricePerUnit: {
      material: 400000,
      labor: 60000,
      total: 460000,
    },
    total32py: 255, // 5~6개 기준
  },
  OPUS: {
    material: '무늬목 / 도장 도어',
    brand: '아르젠 커스텀',
    finish: '무늬목/도장',
    handle: 'SUS / 가죽',
    pricePerUnit: {
      material: 700000,
      labor: 80000,
      total: 780000,
    },
    total32py: 430, // 5~6개 기준
  },
}

// ============================================================
// 8. 전기/조명 공정
// ============================================================

export interface ElectricalSpec {
  wiring: {
    replacement: string
    outlets: string
    switches: string
    panel: string
  }
  lighting: {
    livingRoom: {
      type: string
      price: number // 원
    }
    downlight: {
      type: string
      pricePerUnit: number // 원/개
    }
    indirect: {
      applied: boolean
      pricePerM: number // 원/m
    }
  }
  total32py: {
    material: number // 만원
    labor: number // 만원
    total: number // 만원
  }
}

export const ELECTRICAL_SPECS: Record<ArgenGrade, ElectricalSpec> = {
  ESSENTIAL: {
    wiring: {
      replacement: '부분 교체',
      outlets: '기존 + 추가 3~5개',
      switches: '기본형',
      panel: '기존 유지',
    },
    lighting: {
      livingRoom: {
        type: 'LED 기본형',
        price: 50000,
      },
      downlight: {
        type: 'LED 기본',
        pricePerUnit: 8000,
      },
      indirect: {
        applied: false,
        pricePerM: 0,
      },
    },
    total32py: {
      material: 100,
      labor: 100,
      total: 200,
    },
  },
  STANDARD: {
    wiring: {
      replacement: '전체 교체',
      outlets: '전체 교체',
      switches: '모던형',
      panel: '교체',
    },
    lighting: {
      livingRoom: {
        type: '삼성/LG 프리미엄',
        price: 150000,
      },
      downlight: {
        type: '삼성 다운라이트',
        pricePerUnit: 20000,
      },
      indirect: {
        applied: true,
        pricePerM: 15000,
      },
    },
    total32py: {
      material: 180,
      labor: 150,
      total: 330,
    },
  },
  OPUS: {
    wiring: {
      replacement: '전체 + 스마트홈',
      outlets: '전체 + USB일체형',
      switches: '터치형 / 스마트',
      panel: '스마트 분전반',
    },
    lighting: {
      livingRoom: {
        type: '디자인 조명 / 수입',
        price: 400000,
      },
      downlight: {
        type: '매입 조광형',
        pricePerUnit: 45000,
      },
      indirect: {
        applied: true,
        pricePerM: 30000,
      },
    },
    total32py: {
      material: 350,
      labor: 200,
      total: 550,
    },
  },
}

// ============================================================
// 9. 도장 공정
// ============================================================

export interface PaintingSpec {
  scope: string
  type: string
  finish: string
  total32py: {
    material: number // 만원
    labor: number // 만원
    total: number // 만원
  }
}

export const PAINTING_SPECS: Record<ArgenGrade, PaintingSpec> = {
  ESSENTIAL: {
    scope: '현관/다용도',
    type: '수성 탄성코트',
    finish: '롤러',
    total32py: {
      material: 10,
      labor: 40,
      total: 50,
    },
  },
  STANDARD: {
    scope: '+ 아트월',
    type: '친환경 탄성코트',
    finish: '롤러 + 붓터치',
    total32py: {
      material: 20,
      labor: 60,
      total: 80,
    },
  },
  OPUS: {
    scope: '전체 도장',
    type: '벤자민무어 / 수입',
    finish: '에어리스',
    total32py: {
      material: 80,
      labor: 150,
      total: 230,
    },
  },
}

// ============================================================
// 10. 필름 공정
// ============================================================

export interface FilmSpec {
  brand: string
  finish: string
  materialCostPerSqm: number // 원/㎡
  laborCostPerSqm: number // 원/㎡
  total32py: number // 만원
}

export const FILM_SPECS: Record<ArgenGrade, FilmSpec> = {
  ESSENTIAL: {
    brand: '국산 일반',
    finish: '유광/반광',
    materialCostPerSqm: 12000,
    laborCostPerSqm: 25000,
    total32py: 100,
  },
  STANDARD: {
    brand: 'LX지인 / 3M',
    finish: '무광',
    materialCostPerSqm: 18000,
    laborCostPerSqm: 30000,
    total32py: 150,
  },
  OPUS: {
    brand: '홈CC 프리미엄 / 수입',
    finish: '무광 / 엠보',
    materialCostPerSqm: 30000,
    laborCostPerSqm: 40000,
    total32py: 250,
  },
}

// ============================================================
// 11. 가구 공정
// ============================================================

export interface FurnitureSpec {
  builtInCloset: {
    brand: string
    door: string
    interior: string
    pricePerUnit: number // 원/식
  }
  shoeCabinet: {
    type: string
    brand: string
    price: number // 원
  }
  dressingRoom: {
    type: string
    brand: string
    price: number // 원
  }
  total32py: number // 만원
}

export const FURNITURE_SPECS: Record<ArgenGrade, FurnitureSpec> = {
  ESSENTIAL: {
    builtInCloset: {
      brand: '국산 일반',
      door: 'LPM',
      interior: '기본 선반',
      pricePerUnit: 1000000,
    },
    shoeCabinet: {
      type: '기존 도장',
      brand: '-',
      price: 200000,
    },
    dressingRoom: {
      type: '없음',
      brand: '-',
      price: 0,
    },
    total32py: 175,
  },
  STANDARD: {
    builtInCloset: {
      brand: '한샘/리바트',
      door: 'PET 무광',
      interior: '시스템 내부',
      pricePerUnit: 1800000,
    },
    shoeCabinet: {
      type: '문짝 교체',
      brand: '한샘/리바트',
      price: 800000,
    },
    dressingRoom: {
      type: '시스템 행거',
      brand: '한샘/이케아',
      price: 1500000,
    },
    total32py: 400,
  },
  OPUS: {
    builtInCloset: {
      brand: '아르젠 커스텀',
      door: '도장 / 거울',
      interior: '완전 맞춤',
      pricePerUnit: 3500000,
    },
    shoeCabinet: {
      type: '전체 교체',
      brand: '아르젠 커스텀',
      price: 2000000,
    },
    dressingRoom: {
      type: '풀 시스템',
      brand: '아르젠 커스텀',
      price: 4000000,
    },
    total32py: 850,
  },
}

// ============================================================
// 12. 철거 공정
// ============================================================

export interface DemolitionSpec {
  scope: string
  laborCostPerPerson: number // 원/인
  waste: {
    amount: number // 톤
    cost: number // 원
  }
  total32py: number // 만원
}

export const DEMOLITION_SPECS: Record<ArgenGrade, DemolitionSpec> = {
  ESSENTIAL: {
    scope: '부분 철거',
    laborCostPerPerson: 250000,
    waste: {
      amount: 3,
      cost: 500000,
    },
    total32py: 150,
  },
  STANDARD: {
    scope: '전체 철거',
    laborCostPerPerson: 250000,
    waste: {
      amount: 5,
      cost: 800000,
    },
    total32py: 250,
  },
  OPUS: {
    scope: '전체 + 구조 변경',
    laborCostPerPerson: 250000,
    waste: {
      amount: 8,
      cost: 1200000,
    },
    total32py: 400,
  },
}

// ============================================================
// 13. 기타 공정
// ============================================================

export interface OtherSpec {
  moveInCleaning: {
    type: string
    pricePerPyeong: number // 원/평
  }
  moving: {
    type: string
    price: number // 원
  }
  total32py: number // 만원
}

export const OTHER_SPECS: Record<ArgenGrade, OtherSpec> = {
  ESSENTIAL: {
    moveInCleaning: {
      type: '기본 청소',
      pricePerPyeong: 15000,
    },
    moving: {
      type: '소운반',
      price: 300000,
    },
    total32py: 100,
  },
  STANDARD: {
    moveInCleaning: {
      type: '기본 + 새집증후군',
      pricePerPyeong: 20000,
    },
    moving: {
      type: '소운반 + 사다리차 1회',
      price: 500000,
    },
    total32py: 150,
  },
  OPUS: {
    moveInCleaning: {
      type: '프리미엄 + 코팅',
      pricePerPyeong: 30000,
    },
    moving: {
      type: '소운반 + 사다리차 2회',
      price: 700000,
    },
    total32py: 200,
  },
}

// ============================================================
// 전체 견적 요약 (32평 기준)
// ============================================================

export interface TotalEstimate32py {
  demolition: number // 만원
  kitchen: number // 만원
  bathroom: number // 만원
  flooring: number // 만원
  wallpaper: number // 만원
  window: number // 만원
  slidingDoor: number // 만원
  door: number // 만원
  electrical: number // 만원
  painting: number // 만원
  film: number // 만원
  furniture: number // 만원
  other: number // 만원
  directCost: number // 만원 (직접공사비)
  indirectCost: number // 만원 (간접비 8%)
  totalCost: number // 만원 (총 공사비)
}

export const TOTAL_ESTIMATE_32PY: Record<ArgenGrade, TotalEstimate32py> = {
  ESSENTIAL: {
    demolition: 150,
    kitchen: 530,
    bathroom: 400,
    flooring: 400,
    wallpaper: 250,
    window: 0,
    slidingDoor: 85,
    door: 165,
    electrical: 200,
    painting: 50,
    film: 100,
    furniture: 175,
    other: 100,
    directCost: 2605,
    indirectCost: 208,
    totalCost: 2813,
  },
  STANDARD: {
    demolition: 250,
    kitchen: 850,
    bathroom: 600,
    flooring: 585,
    wallpaper: 340,
    window: 400,
    slidingDoor: 140,
    door: 255,
    electrical: 330,
    painting: 80,
    film: 150,
    furniture: 400,
    other: 150,
    directCost: 4530,
    indirectCost: 362,
    totalCost: 4892,
  },
  OPUS: {
    demolition: 400,
    kitchen: 1350,
    bathroom: 950,
    flooring: 1160,
    wallpaper: 550,
    window: 900,
    slidingDoor: 230,
    door: 430,
    electrical: 550,
    painting: 230,
    film: 250,
    furniture: 850,
    other: 200,
    directCost: 8050,
    indirectCost: 644,
    totalCost: 8694,
  },
}

// ============================================================
// 평수별 스케일링 함수
// ============================================================

/**
 * 32평 기준 견적을 다른 평수로 스케일링
 */
export function scaleEstimateByPyeong(
  estimate32py: TotalEstimate32py,
  targetPyeong: number
): TotalEstimate32py {
  const scale = targetPyeong / 32

  return {
    demolition: Math.round(estimate32py.demolition * scale),
    kitchen: Math.round(estimate32py.kitchen * scale),
    bathroom: Math.round(estimate32py.bathroom * scale),
    flooring: Math.round(estimate32py.flooring * scale),
    wallpaper: Math.round(estimate32py.wallpaper * scale),
    window: Math.round(estimate32py.window * scale),
    slidingDoor: Math.round(estimate32py.slidingDoor * scale),
    door: Math.round(estimate32py.door * scale),
    electrical: Math.round(estimate32py.electrical * scale),
    painting: Math.round(estimate32py.painting * scale),
    film: Math.round(estimate32py.film * scale),
    furniture: Math.round(estimate32py.furniture * scale),
    other: Math.round(estimate32py.other * scale),
    directCost: Math.round(estimate32py.directCost * scale),
    indirectCost: Math.round(estimate32py.indirectCost * scale),
    totalCost: Math.round(estimate32py.totalCost * scale),
  }
}

// ============================================================================
// 등급 추천 함수 (정책 분리 완료)
// ============================================================================

import { normalizeTraits } from '@/lib/analysis/v5-ultimate/code-mapping';
import { gradePolicy, getBudgetRange, determineGrade } from '@/lib/policy/grade-policy';

interface RecommendGradeInput {
  budget: number;
  pyeong: number;
  traits: string[];
  purpose?: 'longterm' | 'midterm' | 'sale' | 'rent';
}

/**
 * 등급 추천 (정책 파일 기반)
 * 
 * @see Phase 2 작업 5️⃣: 정책 분리 완료
 */
export function recommendGrade(input: RecommendGradeInput): ArgenGrade {
  const normalizedTraits = normalizeTraits(input.traits);
  
  // 1. 예산 점수 계산 (정책 기반)
  const budgetPerPyeong = input.budget / input.pyeong;
  const budgetRange = getBudgetRange(budgetPerPyeong);
  const budgetScore = gradePolicy.budgetMapping[budgetRange];

  // 2. 라이프스타일 점수 계산 (정책 기반)
  let lifestyleScore = 0;
  for (const trait of normalizedTraits) {
    const traitKey = trait as keyof typeof gradePolicy.lifestyleMapping;
    if (traitKey in gradePolicy.lifestyleMapping) {
      lifestyleScore += gradePolicy.lifestyleMapping[traitKey];
    }
  }
  // 최대 30점 제한 (라이프스타일 가중치 30% 기준)
  lifestyleScore = Math.min(30, lifestyleScore);

  // 3. 거주 목적 점수 계산 (정책 기반)
  const purpose = input.purpose || 'midterm';
  const purposeKey = purpose as keyof typeof gradePolicy.purposeMapping;
  const purposeScore = gradePolicy.purposeMapping[purposeKey] || 10;

  // 4. 가중 평균 계산
  const totalScore = Math.round(
    budgetScore * gradePolicy.weights.budget +
    lifestyleScore * gradePolicy.weights.lifestyle +
    purposeScore * gradePolicy.weights.purpose
  );

  // 5. 등급 결정 (정책 기반)
  return determineGrade(totalScore);
}

export function getGradeMessage(grade: ArgenGrade): string {
  const messages: Record<ArgenGrade, string> = {
    ESSENTIAL: '실속 있게, 필수만 확실하게 하는 게 맞아요.',
    STANDARD: '가성비 최적화 구성이에요. 대부분 이 등급 선택해요.',
    OPUS: '오래 사실 거면 확실히 좋은 걸로 하세요.',
  };
  return messages[grade];
}





