// lib/data/estimate-master.ts
// 공정 마스터 데이터베이스

// 등급별 브랜드 타입
export interface BrandByGrade {
  basic: string;
  standard: string;
  argen: string;
  premium: string;
}

// 공정/항목 조합별 기본 브랜드 매핑
// key 형식: `${processName}/${itemName}`
export const BRAND_CONFIG: Record<string, BrandByGrade> = {
  // ----- 욕실 -----
  '욕실/변기': {
    basic: '대림바스 기본형',
    standard: '대림바스 프리미엄',
    argen: '아메리칸스탠다드 High Line',
    premium: 'TOTO Neorest',
  },
  '욕실/세면대': {
    basic: '이누스 기본형',
    standard: '이누스 다리형',
    argen: '아메리칸스탠다드 Premium',
    premium: 'TOTO 수입 세면기',
  },
  '욕실/수전': {
    basic: '국산 수전 보급형',
    standard: '오늘의집 니켈무광',
    argen: '레인샤워 프리미엄',
    premium: 'Hansgrohe / Grohe',
  },
  '욕실/욕실장': {
    basic: '보급형 욕실장',
    standard: '슬라이드장 1200',
    argen: '슬라이드장 1200 + 조명',
    premium: '프리미엄 제작 욕실장',
  },
  '욕실/타일': {
    basic: '국산 도기질 타일',
    standard: '국산 포세린 타일 300x600',
    argen: '이탈리아 포세린 타일',
    premium: 'IMOLA / LIVING CERAMIC',
  },

  // ----- 주방 -----
  '주방/싱크대': {
    basic: '보급형 E0 PET',
    standard: '한샘 키친바흐',
    argen: 'ENEX 상위라인',
    premium: '훈증 무늬목 + Blum 하드웨어',
  },
  '주방/상판': {
    basic: '국산 인조대리석',
    standard: 'LG 하이막스',
    argen: '삼표 / LG 하이막스 프리미엄',
    premium: '세라믹 상판(Dekton/Laminam)',
  },

  // ----- 마감 -----
  '도배/도배': {
    basic: '국산 실크벽지 보급형',
    standard: 'LG Z:IN 친환경',
    argen: '개나리벽지 프리미엄 실크',
    premium: '벤자민무어 Aura 전체 도장',
  },
  '마감/바닥': {
    basic: '보급형 강마루',
    standard: 'KCC 강마루',
    argen: 'LG Z:IN Premium 강마루',
    premium: '수입 원목마루',
  },
  '필름/필름도장': {
    basic: '국산 필름',
    standard: '홈CC 필름',
    argen: '프리미엄 필름 + 던에드워드 도장',
    premium: '던에드워드 Everest 시스템',
  },

  // ----- 전기 -----
  '전기/기본전기': {
    basic: '국산 스위치/콘센트 보급형',
    standard: '나노스위치 세트',
    argen: 'IDS / LUXTE 조명 + 고급 스위치',
    premium: 'JUNG/ABB 스위치 + 프리미엄 조명',
  },
  '전기/인덕션': {
    basic: '일반 차단기/배선',
    standard: '4SQ 전용선 + ABB 차단기',
    argen: 'KS 전선 + ABB 차단기',
    premium: '프리미엄 전용선 + 차단기',
  },
};

// 공정/항목명으로 브랜드 키 생성
function buildBrandKey(processName: string, itemName: string): string {
  // 항목명 기준으로 대략적인 키를 만든다.
  if (itemName.includes('변기')) return `${processName}/변기`;
  if (itemName.includes('세면')) return `${processName}/세면대`;
  if (itemName.includes('수전')) return `${processName}/수전`;
  if (itemName.includes('욕실장')) return `${processName}/욕실장`;
  if (itemName.includes('타일')) return `${processName}/타일`;

  if (itemName.includes('싱크') || itemName.includes('주방가구')) {
    return `${processName}/싱크대`;
  }
  if (itemName.includes('상판')) {
    return `${processName}/상판`;
  }

  if (itemName.includes('도배') || itemName.includes('벽지')) {
    return `${processName}/도배`;
  }
  if (itemName.includes('마루') || itemName.includes('바닥')) {
    return `${processName}/바닥`;
  }
  if (itemName.includes('필름') || itemName.includes('도장')) {
    return `${processName}/필름도장`;
  }

  if (itemName.includes('전기') || itemName.includes('조명')) {
    return `${processName}/기본전기`;
  }
  if (itemName.includes('인덕션')) {
    return `${processName}/인덕션`;
  }

  return '';
}

const rawMasterData = {
  "metadata": {
    "version": "1.0",
    "last_updated": "2025-11-23",
    "accuracy": "94.1%"
  },
  "categories": {
    "창호": {
      "필수조건": "true",
      "항목": [
        {
          "id": "window_001",
          "항목명": "LX 하우시스 / KCC 창호",
          "브랜드": "슈퍼세이브/뉴프라임 (24mm)",
          "단위": "식",
          "재료비": { "basic": 5500000, "standard": 6500000, "argen": 6500000, "premium": 8500000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "18평 5,100k, 25평 7,100k"
        },
        {
          "id": "window_002",
          "항목명": "터닝도어 (LX 지인)",
          "브랜드": "LX 지인",
          "단위": "조",
          "재료비": { "basic": 500000, "standard": 600000, "argen": 600000, "premium": 800000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1
        },
        {
          "id": "window_003",
          "항목명": "사다리차 양중비",
          "단위": "식",
          "재료비": { "basic": 300000, "standard": 300000, "argen": 350000, "premium": 400000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1
        }
      ]
    },
    "설비": {
      "필수조건": "true",
      "항목": [
        {
          "id": "facility_001",
          "항목명": "욕실 방수 및 설비",
          "단위": "식",
          "재료비": { "basic": 250000, "standard": 300000, "argen": 300000, "premium": 400000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1
        },
        {
          "id": "facility_002",
          "항목명": "발코니 단열 공사 (이보드)",
          "단위": "식",
          "재료비": { "basic": 400000, "standard": 500000, "argen": 500000, "premium": 700000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1
        }
      ]
    },
    "철거": {
      "필수조건": "현재상태 === 구축아파트",
      "항목": [
        {
          "id": "demo_001",
          "항목명": "전체 철거",
          "단위": "식",
          "재료비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "인건비는 calculateRealisticLabor에서 계산"
        },
        {
          "id": "demo_002",
          "항목명": "폐기물 운반비 (1톤)",
          "단위": "대",
          "재료비": { "basic": 350000, "standard": 400000, "argen": 400000, "premium": 450000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 2,
          "비고": "18평 기준 2대, 평수당 조정"
        }
      ]
    },
    "주방": {
      "필수조건": "성향.요리빈도 >= 2",
      "항목": [
        {
          "id": "kitchen_001",
          "항목명": "싱크대 (예림 PET)",
          "규격": "2.4m~3.0m",
          "단위": "식",
          "재료비": { "basic": 1800000, "standard": 2000000, "argen": 2500000, "premium": 3500000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "18평 2,000k, 25평 2,500k (평수 비례)"
        },
        {
          "id": "kitchen_002",
          "항목명": "신발장 / 붙박이장",
          "규격": "PET 마감",
          "단위": "식",
          "재료비": { "basic": 800000, "standard": 900000, "argen": 1200000, "premium": 1800000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "18평 900k, 25평 1,200k"
        }
      ]
    },
    "욕실": {
      "필수조건": "욕실개수 >= 1",
      "항목": [
        {
          "id": "bath_001",
          "항목명": "욕실 리모델링 (공용)",
          "브랜드": "아메리칸스탠다드",
          "단위": "실",
          "재료비": { "basic": 1400000, "standard": 1600000, "argen": 1700000, "premium": 2200000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "도기/수전/파티션/돔천장 포함"
        },
        {
          "id": "bath_002",
          "항목명": "욕실 리모델링 (안방)",
          "브랜드": "아메리칸스탠다드",
          "단위": "실",
          "재료비": { "basic": 1200000, "standard": 1400000, "argen": 1500000, "premium": 2000000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "조건": "욕실개수 >= 2",
          "비고": "2개소 이상일 때 추가"
        },
        {
          "id": "bath_003",
          "항목명": "욕실 방수 및 설비",
          "브랜드": "3차 책임방수",
          "단위": "식",
          "재료비": { "basic": 250000, "standard": 300000, "argen": 300000, "premium": 400000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "18평 300k, 25평 300k"
        }
      ]
    },
    "타일": {
      "필수조건": "욕실개수 >= 1",
      "항목": [
        {
          "id": "tile_001",
          "항목명": "주방/현관/발코니 타일",
          "규격": "600x600",
          "단위": "식",
          "재료비": { "basic": 700000, "standard": 900000, "argen": 900000, "premium": 1200000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "18평 700k, 25평 900k"
        },
        {
          "id": "tile_002",
          "항목명": "부자재 (아덱스/세라픽스)",
          "단위": "식",
          "재료비": { "basic": 180000, "standard": 200000, "argen": 250000, "premium": 300000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "18평 200k, 25평 250k"
        }
      ]
    },
    "목공": {
      "필수조건": "true",
      "항목": [
        {
          "id": "wood_001",
          "항목명": "영림/예림 몰딩, 도어",
          "규격": "ABS 도어 포함",
          "단위": "식",
          "재료비": { "basic": 600000, "standard": 700000, "argen": 700000, "premium": 1000000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "18평 700k, 25평 700k"
        },
        {
          "id": "wood_002",
          "항목명": "ABS 도어 (문틀포함)",
          "브랜드": "영림/예림",
          "단위": "짝",
          "재료비": { "basic": 250000, "standard": 280000, "argen": 280000, "premium": 350000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량계산": "방개수 + 1",
          "비고": "18평 3짝, 25평 5짝"
        }
      ]
    },
    "전기": {
      "필수조건": "true",
      "항목": [
        {
          "id": "elec_001",
          "항목명": "르그랑 스위치 / LED 조명",
          "브랜드": "르그랑",
          "단위": "식",
          "재료비": { "basic": 450000, "standard": 500000, "argen": 600000, "premium": 800000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "18평 500k, 25평 600k"
        }
      ]
    },
    "도배": {
      "필수조건": "true",
      "항목": [
        {
          "id": "wall_001",
          "항목명": "실크 도배",
          "브랜드": "LX 지인 베스띠",
          "단위": "평",
          "재료비": { "basic": 35000, "standard": 40000, "argen": 40000, "premium": 50000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": "평수",
          "비고": "18평 기준 40,000원/평 (재료비), 인건비는 별도 계산"
        }
      ]
    },
    "필름": {
      "필수조건": "true",
      "항목": [
        {
          "id": "film_001",
          "항목명": "강화마루",
          "브랜드": "동화자연마루 나투스진",
          "단위": "평",
          "재료비": { "basic": 60000, "standard": 80000, "argen": 80000, "premium": 120000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": "평수",
          "비고": "18평 기준 80,000원/평 (재료비), 인건비는 별도 계산"
        }
      ]
    },
    "기타": {
      "필수조건": "true",
      "항목": [
        {
          "id": "etc_001",
          "항목명": "입주 청소 (전문팀)",
          "단위": "평",
          "재료비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": "평수",
          "비고": "18평 360k, 25평 500k → 평당 20,000원 (인건비에 포함)"
        },
        {
          "id": "etc_002",
          "항목명": "현장 보양 (엘리베이터)",
          "단위": "식",
          "재료비": { "basic": 100000, "standard": 115000, "argen": 130000, "premium": 150000 },
          "노무비": { "basic": 0, "standard": 0, "argen": 0, "premium": 0 },
          "기본수량": 1,
          "비고": "18평 115k, 25평 130k"
        }
      ]
    }
  }
};

// BRAND_CONFIG 를 기반으로 각 항목에 등급별 브랜드를 주입
function applyBrandConfigToMaster(data: typeof rawMasterData): typeof rawMasterData {
  Object.entries(data.categories).forEach(([processName, process]: [string, any]) => {
    process.항목.forEach((item: any) => {
      // 이미 브랜드가 객체 형태로 정의되어 있으면 건너뛴다.
      if (item.브랜드 && typeof item.브랜드 === 'object') return;

      const key = item.브랜드키 || buildBrandKey(processName, item.항목명);

      if (!key) return;
      const brand = BRAND_CONFIG[key];
      if (brand) {
        item.브랜드 = brand;
      }
    });
  });

  return data;
}

// 최종 export 되는 masterData
export const masterData = applyBrandConfigToMaster(rawMasterData);

