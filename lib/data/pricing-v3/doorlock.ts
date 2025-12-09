/**
 * 인테리봇 견적 시스템 V3 - 디지털 도어락 단가표
 * 
 * 현관문 리폼 후 필수로 교체하는 품목
 * Push-Pull 타입이 대세
 * 단위: 개당 단가 (설치비 포함)
 */

// ============================================================
// 1. 도어락 브랜드 및 단가
// ============================================================

/** 도어락 타입 */
export type DoorlockType = 'BUDGET' | 'STANDARD' | 'PREMIUM';

/** 도어락 정보 */
export interface DoorlockInfo {
  type: DoorlockType;
  brand: string;
  model: string;
  price: number;        // 설치비 포함
  features: string[];
  recommendation: string;
}

/** 도어락 목록 */
export const DOORLOCK_OPTIONS: DoorlockInfo[] = [
  {
    type: 'BUDGET',
    brand: '솔리티',
    model: '웰콤/싱크 (주키)',
    price: 250000,
    features: [
      '가성비 1등',
      '잔고장 없음',
      '기능 충실',
      'NFC 지원'
    ],
    recommendation: '가성비를 원하신다면 솔리티! 잔고장 없고 기능도 충실합니다.'
  },
  {
    type: 'STANDARD',
    brand: '직방',
    model: '푸시풀 (SHP-DP)',
    price: 380000,
    features: [
      '디자인 1등',
      '푸시풀 방식',
      '밀고 당기는 편리함',
      '구 삼성SDS'
    ],
    recommendation: '⭐ 아르젠 추천: 직방 푸시풀! 밀고 당기는 방식으로 편리하고 디자인이 예쁩니다.'
  },
  {
    type: 'PREMIUM',
    brand: '게이트맨',
    model: '지문인식/후크',
    price: 550000,
    features: [
      '보안성 1등',
      '후크 메커니즘',
      '체결 강도 우수',
      '지문인식'
    ],
    recommendation: '보안이 최우선이라면 게이트맨! 후크 방식으로 강제 개방이 어렵습니다.'
  }
];

// ============================================================
// 2. 타입별 단가
// ============================================================

/** 타입별 단가 */
export const DOORLOCK_PRICES: Record<DoorlockType, number> = {
  BUDGET: 250000,    // 솔리티
  STANDARD: 380000,  // 직방
  PREMIUM: 550000    // 게이트맨
};

// ============================================================
// 3. 도어락 견적 결과
// ============================================================

/** 도어락 견적 결과 */
export interface DoorlockEstimate {
  type: DoorlockType;
  info: DoorlockInfo;
  totalCost: number;
}

/** 도어락 견적 계산 */
export function calculateDoorlockEstimate(
  type: DoorlockType
): DoorlockEstimate {
  const info = DOORLOCK_OPTIONS.find(d => d.type === type);
  
  if (!info) {
    throw new Error(`Unknown doorlock type: ${type}`);
  }
  
  return {
    type,
    info,
    totalCost: info.price
  };
}

/** 브랜드로 도어락 찾기 */
export function getDoorlockByBrand(brand: string): DoorlockInfo | undefined {
  return DOORLOCK_OPTIONS.find(d => d.brand === brand);
}

// ============================================================
// 4. 도어락 비교표
// ============================================================

/** 도어락 비교표 */
export const DOORLOCK_COMPARISON = {
  headers: ['브랜드', '모델', '단가', '특징'],
  rows: [
    {
      brand: '솔리티',
      model: '웰콤/싱크',
      price: 250000,
      feature: '가성비 1등'
    },
    {
      brand: '직방',
      model: '푸시풀 (SHP-DP)',
      price: 380000,
      feature: '디자인 1등 ⭐'
    },
    {
      brand: '게이트맨',
      model: '지문인식/후크',
      price: 550000,
      feature: '보안성 1등'
    }
  ]
};

// ============================================================
// 5. 도어락 관련 유틸리티
// ============================================================

/** 타입별 추천 문구 */
export function getDoorlockRecommendation(type: DoorlockType): string {
  const info = DOORLOCK_OPTIONS.find(d => d.type === type);
  return info?.recommendation || '';
}

/** 도어락 기능 설명 */
export const DOORLOCK_FEATURES = {
  PUSH_PULL: {
    name: '푸시풀',
    description: '문을 밀거나 당겨서 열기. 손잡이 없이 깔끔함.'
  },
  HOOK: {
    name: '후크',
    description: '문틀에 걸쇠가 걸림. 강제 개방 방지.'
  },
  FINGERPRINT: {
    name: '지문인식',
    description: '지문으로 열기. 비밀번호 없이 편리함.'
  },
  NFC: {
    name: 'NFC',
    description: '카드키나 스마트폰으로 열기.'
  },
  REMOTE: {
    name: '원격 제어',
    description: '앱으로 문 상태 확인 및 제어.'
  }
};

/** 도어락 설치 안내 */
export const DOORLOCK_INSTALL_NOTE = {
  description: '도어락 설치비는 단가에 포함',
  duration: '설치 시간: 약 30분~1시간',
  requirement: '현관문 규격 확인 필수',
  warranty: '제조사 AS 1~2년'
};

/** 아르젠 추천 도어락 */
export const ARGEN_RECOMMENDED_DOORLOCK = DOORLOCK_OPTIONS.find(d => d.type === 'STANDARD');



