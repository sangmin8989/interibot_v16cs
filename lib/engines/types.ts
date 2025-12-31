/**
 * 인테리봇 - 통합 타입 정의
 * 
 * 모든 엔진에서 사용하는 공통 타입
 */

// ========================================
// 공정 관련
// ========================================

export type ProcessName =
  | 'kitchen'
  | 'bathroom'
  | 'flooring'
  | 'windows'
  | 'lighting'
  | 'doors_entrance'
  | 'storage_furniture'
  | 'wallpaper_painting'
  | 'insulation_ventilation'
  | 'electrical_system'
  | 'plumbing'
  | 'smart_home';

// ========================================
// 가족 구성
// ========================================

export type FamilyType =
  | 'newborn_infant'      // 영유아 가정
  | 'dual_income'         // 맞벌이 부부
  | 'elderly'             // 노인 동거
  | 'pet_owner'           // 반려동물
  | 'single'              // 1인 가구
  | 'multi_generation';   // 다세대

// ========================================
// 라이프스타일
// ========================================

export type LifestyleFactor =
  | 'frequent_cooking'    // 주 5회 이상 요리
  | 'remote_work'         // 주 3일 이상 재택근무
  | 'frequent_guests'     // 주 1회 이상 손님 방문
  | 'health_conscious'    // 호흡기/알레르기 질환
  | 'sensitive_to_noise'  // 소음에 민감
  | 'quality_focused'     // 고급 소재/마감재 선호
  | 'budget_conscious';   // 비용 효율 중시

// ========================================
// 시장 상황
// ========================================

export type MarketCondition =
  | 'prime_rising'        // 강남·분당 상승장
  | 'normal_rising'       // 평범한 지역 상승장
  | 'flat'                // 보합
  | 'declining';          // 하락장

export type Region =
  | 'seoul_gangnam'       // 강남 3구
  | 'seoul_gangbuk'       // 강북
  | 'seoul_others'        // 서울 기타
  | 'gyeonggi_prime'      // 분당·판교·광교
  | 'gyeonggi_normal'     // 경기 평범
  | 'gyeonggi_outer'      // 경기 외곽
  | 'provincial_major'    // 부산·대구·대전
  | 'provincial_minor';   // 지방 중소도시

// ========================================
// 디자인·문서화
// ========================================

export type DesignFit =
  | 'neutral_design'      // 무난한 화이트·그레이
  | 'too_personal'        // 강한 개성
  | 'inconsistent'        // 일부만 신식
  | 'unified_modern';     // 전체 통일된 모던

export type Documentation =
  | 'no_evidence'         // 내역서 없음
  | 'basic_receipt'       // 영수증만
  | 'full_documentation'  // 시공 사진+보증서+AS
  | 'certified_contractor'; // 검증 업체+10년 AS

// ========================================
// 만족도 레벨
// ========================================

export type SatisfactionLevel =
  | 'very_satisfied'      // 90~100점
  | 'satisfied'           // 80~89점
  | 'neutral'             // 70~79점
  | 'slightly_satisfied'  // 60~69점
  | 'unsatisfied';        // ~59점

// ========================================
// 하자 리스크
// ========================================

export type RiskLevel =
  | 'low'                 // 패널티 0점
  | 'medium'              // 패널티 5점
  | 'high';               // 패널티 12점

// ========================================
// 투자 가치 카테고리
// ========================================

export type InvestmentCategory =
  | 'excellent'           // ROI 150% 이상
  | 'good'                // ROI 120-149%
  | 'normal'              // ROI 100-119%
  | 'caution';            // ROI 100% 미만

// ========================================
// 종합 등급
// ========================================

export type OverallGrade =
  | 'S'                   // 만족도 90+ && ROI 120+
  | 'A'                   // 만족도 80+ && ROI 100+
  | 'B'                   // 만족도 70+ || ROI 80+
  | 'C'                   // 만족도 60+ || ROI 60+
  | 'D';                  // 그 외

// ========================================
// 건물 연식 범위
// ========================================

export type BuildingAgeRange =
  | '0_10'                // 0-10년
  | '10_20'               // 10-20년
  | '20_30'               // 20-30년
  | '30_plus';            // 30년 이상

// ========================================
// 평수 범위
// ========================================

export type PyeongRange =
  | '0-20'                // 소형
  | '21-30'               // 기준
  | '31-40'               // 중대형
  | '41+';                // 대형

// ========================================
// 공정 역할
// ========================================

export type ProcessRole =
  | 'defense'             // 감점 제거형 (도배·장판)
  | 'offense'             // 가점 추가형 (주방·욕실)
  | 'mixed';              // 혼합형 (바닥재)

// ========================================
// 공정 가시성
// ========================================

export type ProcessVisibility =
  | 'high'                // 매수자 즉시 체감 (주방·욕실)
  | 'medium'              // 보통 (수납·단열)
  | 'low';                // 보이지 않음 (배관·전기)

// ========================================
// 유틸리티 타입
// ========================================

/**
 * 점수 범위 (0-100)
 */
export type Score = number;

/**
 * 금액 (만원 단위)
 */
export type Amount = number;

/**
 * ROI (백분율)
 */
export type ROI = number;

/**
 * 가중치 (배수)
 */
export type Weight = number;

/**
 * 연식 (년)
 */
export type Age = number;

/**
 * 평수
 */
export type Pyeong = number;

// ========================================
// 에러 타입
// ========================================

export class InteriorbotEngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'InteriorbotEngineError';
  }
}

export class InvalidInputError extends InteriorbotEngineError {
  constructor(message: string, details?: any) {
    super(message, 'INVALID_INPUT', details);
  }
}

export class CalculationError extends InteriorbotEngineError {
  constructor(message: string, details?: any) {
    super(message, 'CALCULATION_ERROR', details);
  }
}

// ========================================
// 헬퍼 함수
// ========================================

/**
 * 점수를 0-100 범위로 제한
 */
export function clampScore(score: number): Score {
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * 금액을 100만원 단위로 반올림
 */
export function roundAmount(amount: number): Amount {
  return Math.round(amount / 100) * 100;
}

/**
 * ROI 계산
 */
export function calculateROI(increase: Amount, cost: Amount): ROI {
  if (cost === 0) return 0;
  return Math.round((increase / cost) * 100);
}

/**
 * 평균 계산
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/**
 * 가중 평균 계산
 */
export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0;
  
  const sum = values.reduce((acc, val, i) => acc + val * weights[i], 0);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  
  return weightSum > 0 ? sum / weightSum : 0;
}
