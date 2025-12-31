/**
 * 인테리봇 - 시장·입지·디자인 보정 계수
 * 
 * 집값 상승에 영향을 주는 외부 요인:
 * - 공사 범위·품질
 * - 구조·면적 개선
 * - 입지·시장 사이클
 * - 디자인 되팔기 적합도
 * - 문서화·검증 수준
 * - 재건축 위험
 */

export interface MarketFactors {
  scope_quality: Record<string, number>;
  structure_area: Record<string, number>;
  location_market: Record<string, number>;
  design_resale_fit: Record<string, number>;
  documentation: Record<string, number>;
}

export const VALUE_UPLIFT_FACTORS: MarketFactors = {
  // ========== 공사 범위·품질 ==========
  scope_quality: {
    partial_cosmetic: 0.9, // 겉만 번쩍 (도배·장판·조명)
    partial_core_included: 1.0, // 구조 일부 포함 (주방 or 욕실)
    full_remodel_standard: 1.2, // 전체 표준 (주방+욕실+바닥+도배)
    full_remodel_high_quality: 1.3, // 전체 프리미엄 (위 + 구조)
  },

  // ========== 구조·면적 개선 ==========
  structure_area: {
    layout_improvement: 1.1, // 동선 개선, 공간 재구성
    area_extension: 1.3, // 증축, 발코니 확장
    no_structural_change: 0.9, // 구조는 그대로
  },

  // ========== 입지·시장 사이클 ==========
  location_market: {
    prime_rising: 1.3, // 강남·분당 상승장
    normal_rising: 1.1, // 평범한 지역 상승장
    flat: 1.0, // 보합
    declining: 0.8, // 하락장
  },

  // ========== 디자인 되팔기 적합도 ==========
  design_resale_fit: {
    neutral_design: 1.1, // 무난한 화이트·그레이 톤
    too_personal: 0.9, // 강한 개성 (빨강·파랑)
    inconsistent: 0.85, // 일부만 신식, 나머지 구식
    unified_modern: 1.15, // 전체 통일된 모던 스타일
  },

  // ========== 문서화·검증 수준 ==========
  documentation: {
    no_evidence: 0.8, // 내역서 없음 (구두 설명만)
    basic_receipt: 1.0, // 영수증만
    full_documentation: 1.15, // 시공 사진 + 보증서 + AS
    certified_contractor: 1.2, // 검증 업체 + 10년 AS
  },
};

/**
 * 평수별 리모델링 효과 차등
 * 
 * 소형은 리모델링 효과 제한적
 * 대형은 프리미엄 강화
 */
export const PYEONG_MULTIPLIERS: Record<string, number> = {
  '0-20': 0.85, // 소형 (원룸·투룸)
  '21-30': 1.0, // 기준 (소형 아파트)
  '31-40': 1.1, // 중대형
  '41+': 1.15, // 대형
};

/**
 * 지역별 리모델링 ROI 차등
 * 
 * 같은 공사라도 강남 vs 지방은 2배 차이
 */
export const REGIONAL_MULTIPLIERS: Record<string, number> = {
  seoul_gangnam: 1.4, // 강남 3구
  seoul_gangbuk: 1.25, // 강북 (성북·노원·도봉 등)
  seoul_others: 1.2, // 서울 기타 (마포·용산·영등포 등)
  gyeonggi_prime: 1.15, // 분당·판교·광교
  gyeonggi_normal: 1.0, // 경기 평범 (의정부·부천 등)
  gyeonggi_outer: 0.9, // 경기 외곽 (양주·포천 등)
  provincial_major: 0.85, // 부산·대구·대전
  provincial_minor: 0.75, // 지방 중소도시
};

/**
 * 재건축 위험 계수
 * 
 * 재건축 임박 시 리모델링 투자는 손실 위험
 */
export const REDEVELOPMENT_RISK_FACTORS: Record<string, number> = {
  within_3_years: 0.30, // 3년 이내 재건축 → 70% 손실
  within_5_years: 0.50, // 5년 이내 → 50% 손실
  within_10_years: 0.80, // 10년 이내 → 20% 손실
  no_plan: 1.0, // 재건축 계획 없음
};

/**
 * 입지 약점 보정 계수
 * 
 * 리모델링으로 개선할 수 없는 구조적 약점
 */
export const LOCATION_WEAKNESS_FACTORS: Record<string, number> = {
  first_floor_no_security: 0.85, // 1층 + 방범창 없음
  north_facing: 0.90, // 북향
  road_side_no_soundproof: 0.90, // 도로변 + 방음창 없음
  top_floor_no_waterproof: 0.90, // 최상층 + 방수 미개선
  low_floor_damp: 0.92, // 저층 + 습기 미해결
};

/**
 * 공사 범위 자동 판단
 */
export function getScopeQuality(processes: string[]): keyof MarketFactors['scope_quality'] {
  const hasKitchen = processes.includes('kitchen');
  const hasBathroom = processes.includes('bathroom');
  const hasFlooring = processes.includes('flooring');
  const hasWallpaper = processes.includes('wallpaper_painting');
  const hasStructural =
    processes.includes('plumbing') ||
    processes.includes('electrical_system') ||
    processes.includes('insulation_ventilation');

  // 전체 프리미엄
  if (
    hasKitchen &&
    hasBathroom &&
    hasFlooring &&
    hasWallpaper &&
    hasStructural &&
    processes.length >= 6
  ) {
    return 'full_remodel_high_quality';
  }

  // 전체 표준
  if (hasKitchen && hasBathroom && hasFlooring && hasWallpaper) {
    return 'full_remodel_standard';
  }

  // 부분 (핵심 포함)
  if (hasKitchen || hasBathroom) {
    return 'partial_core_included';
  }

  // 겉만 (도배·장판·조명)
  return 'partial_cosmetic';
}

/**
 * 평수 범위 판단
 */
export function getPyeongRange(pyeong: number): string {
  if (pyeong <= 20) return '0-20';
  if (pyeong <= 30) return '21-30';
  if (pyeong <= 40) return '31-40';
  return '41+';
}

/**
 * 시간 경과에 따른 가치 감소
 * 
 * 복리 감가 적용
 */
export function applyTimeDecay(
  initialIncrease: number,
  yearsSinceRemodel: number,
  decayRate: number
): number {
  const currentValue = initialIncrease * Math.pow(1 - decayRate / 100, yearsSinceRemodel);
  return Math.max(0, Math.round(currentValue));
}
