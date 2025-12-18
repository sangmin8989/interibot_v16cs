/**
 * 인테리봇 AI 판단 레이어 - 공정 분류 매핑
 * 
 * 통합 설계서 기준:
 * - BASE: 기본 진행 공정 (거의 모든 현장에 필요)
 * - NARROW: 선택 폭이 좁은 공정 (옵션 2~3개로 강제 축소)
 * - LOCK: 되돌릴 수 없는 공정 (경고 필수, 표준안 고정)
 * - LATER: 후순위 공정 (나중에 해도 됨, 기본 OFF)
 */

export type ProcessClassification = 'BASE' | 'NARROW' | 'LOCK' | 'LATER';

/**
 * 공정별 AI 분류 매핑
 * 
 * 통합 설계서 기준으로 10개 공정을 분류합니다.
 */
export const PROCESS_CLASSIFICATION: Record<string, ProcessClassification> = {
  // BASE: 기본 진행 공정
  // 구조·방수·배관·배선, 기본 노무·안전 공정
  'demolition': 'LOCK',        // 철거 (되돌릴 수 없는 공정 - LOCK)
  'finish': 'BASE',            // 마감 (바닥, 벽, 천장 기본)
  
  // NARROW: 선택 폭이 좁은 공정
  // 옵션 2~3개로 강제 축소, 표준안 기본값 고정
  'bathroom': 'NARROW',        // 욕실 구성 (타일, 방수, 도기 등)
  'kitchen': 'NARROW',         // 주방 레이아웃 (상하부장, 상판 등)
  'electric': 'NARROW',        // 전기 기본 증설 (조명, 스위치, 회로)
  'door_window': 'NARROW',     // 도어·창호 (일부는 LOCK이지만 전체는 NARROW)
  
  // LATER: 후순위 공정
  // 입주 후에도 충분히 진행 가능, 기본 OFF
  'furniture': 'LATER',        // 가구 (붙박이장, 신발장 등)
  'film': 'LATER',             // 필름 (장식 조명 포함)
  'balcony': 'LATER',          // 베란다 (선택적)
  'entrance': 'LATER',         // 현관 (선택적)
};

/**
 * 공정 내부 옵션 중 LOCK 항목
 * 
 * 공정 자체는 NARROW이지만, 내부 옵션 중 되돌릴 수 없는 항목
 */
export const LOCK_OPTIONS: Record<string, string[]> = {
  'bathroom': [
    'waterproof',      // 방수 (되돌릴 수 없음)
    'drain_slope',     // 배수 경사
    'pipe_replace',    // 배관 교체
  ],
  'kitchen': [
    'plumbing',        // 배관 이동 (되돌릴 수 없음)
  ],
  'electric': [
    'old_wiring',      // 노후 배선 정리 (되돌릴 수 없음)
    'breaker_upgrade', // 누전차단기 업그레이드
  ],
  'finish': [
    'leveling',        // 정밀 평탄화 (되돌릴 수 없음)
    'soundproof',      // 층간소음 완충재 (구조 변경)
  ],
};

/**
 * 공정 분류 조회 함수
 */
export function getProcessClassification(processId: string): ProcessClassification {
  return PROCESS_CLASSIFICATION[processId] || 'NARROW'; // 기본값: NARROW
}

/**
 * 공정이 LOCK인지 확인
 */
export function isLockProcess(processId: string): boolean {
  return getProcessClassification(processId) === 'LOCK';
}

/**
 * 옵션이 LOCK인지 확인
 */
export function isLockOption(processId: string, optionId: string): boolean {
  const lockOptions = LOCK_OPTIONS[processId] || [];
  return lockOptions.includes(optionId);
}

/**
 * 공정이 BASE인지 확인 (기본 진행 공정)
 */
export function isBaseProcess(processId: string): boolean {
  return getProcessClassification(processId) === 'BASE';
}

/**
 * 공정이 LATER인지 확인 (나중에 해도 됨)
 */
export function isLaterProcess(processId: string): boolean {
  return getProcessClassification(processId) === 'LATER';
}

/**
 * 공정별 AI 말투 템플릿
 */
export const PROCESS_AI_MESSAGES: Record<ProcessClassification, {
  default: string;
  lock?: string;
}> = {
  BASE: {
    default: '이 공정은 기본 진행 항목입니다.',
  },
  NARROW: {
    default: '이 조건에서는 선택 범위를 줄이는 것이 안전합니다.',
  },
  LOCK: {
    default: '이 단계는 나중에 변경이 어렵습니다.',
    lock: '인테리봇 기준으로 안정적인 안을 우선 적용합니다.',
  },
  LATER: {
    default: '이 항목은 입주 후에도 충분히 진행할 수 있습니다.',
  },
};

/**
 * 공정별 AI 메시지 생성
 */
export function getProcessAIMessage(
  processId: string,
  isLockOption: boolean = false
): string {
  const classification = getProcessClassification(processId);
  const messages = PROCESS_AI_MESSAGES[classification];
  
  if (classification === 'LOCK' && isLockOption && messages.lock) {
    return `${messages.default} ${messages.lock}`;
  }
  
  return messages.default;
}













