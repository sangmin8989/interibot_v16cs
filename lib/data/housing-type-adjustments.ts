import { HousingTypeAdjustment } from './anchor-types';

/**
 * 주거형태별 견적 보정계수
 * 아파트 기준(1.0) 대비 배율
 */
export const HOUSING_TYPE_ADJUSTMENTS: Record<string, HousingTypeAdjustment> = {
  '아파트': {
    base: 1.0,
    description: '기준',
    note: '표준화된 구조, 가장 정확한 데이터'
  },
  
  '빌라': {
    base: 1.12,
    description: '아파트 대비 +12%',
    note: '비표준 구조, 노후도 고려',
    categoryAdjustments: {
      plumbing: 1.15,     // 설비 상태 다양
      carpentry: 1.18,    // 구조 보강 필요
      electrical: 1.12    // 배선 노후
    }
  },
  
  '단독주택': {
    base: 1.25,
    description: '아파트 대비 +25%',
    note: '외벽/지붕 공사 추가, 창호 증가',
    categoryAdjustments: {
      window: 1.30,       // 창문 더 많음
      plumbing: 1.40,     // 단열/방수 중요
      tile: 1.20,         // 외부 타일 추가
      carpentry: 1.25,    // 구조 작업 증가
      // roofing: 'add',  // 지붕 공사 추가 (향후)
      // exterior: 'add'  // 외벽 공사 추가 (향후)
    }
  },
  
  '오피스텔': {
    base: 0.85,
    description: '아파트 대비 -15%',
    note: '간소화된 구조, 원룸 형태',
    categoryAdjustments: {
      furniture: 0.70,    // 주방 간소
      bathroom: 0.60,     // 욕실 1개
      carpentry: 0.80,    // 수납 간소
      wallpaper: 0.85     // 면적 작음
    }
  },
  
  '전원주택': {
    base: 1.40,
    description: '아파트 대비 +40%',
    note: '특수 자재, 외부 공사 대폭 증가',
    categoryAdjustments: {
      window: 1.50,       // 대형 창호
      plumbing: 1.60,     // 단열/방수 강화
      tile: 1.35,         // 외부 타일
      carpentry: 1.40,    // 목조 구조
      electrical: 1.30    // 외부 조명
      // roofing: 'add',  // 지붕 특수 시공 (향후)
      // exterior: 'add', // 외벽 전체 (향후)
      // landscape: 'add' // 조경 (향후)
    }
  },
  
  '기타': {
    base: 1.15,
    description: '아파트 대비 +15%',
    note: '상황에 따라 변동 가능'
  }
};
