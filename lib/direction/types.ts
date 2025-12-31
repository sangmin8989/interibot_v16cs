// 방향 선택 도메인 타입 정의
// 인테비티 결과를 바탕으로 3가지 방향(A/B/C)을 제공하고,
// 화살표(축) 기반으로 직관적 비교를 지원한다.

import type { IntevityResult } from '@/lib/intevity/types';

// A/B/C 코드
export type DirectionCode = 'A' | 'B' | 'C';

// 단일 방향 옵션
export interface DirectionOption {
  code: DirectionCode;
  name: string; // 예: 기준 강화 / 기준 유지 / 체감 추가
  description: string; // 한 줄 요약
  applications: string[]; // 적용 포인트 나열
  tradeoff: {
    variability: '적음' | '보통' | '많음';
    perception: '적음' | '보통' | '큼';
    note: string;
  };
  // 화살표(축) 표시용 데이터
  axis: {
    labelLeft: string; // 예: 변수 최소화
    labelRight: string; // 예: 체감 최대화
    position: number; // 0~1 사이 값 (0: 왼쪽, 1: 오른쪽)
  };
  explanation: string; // 인테비티 기준과의 연결 설명
}

// 방향 셋 생성 결과
export interface DirectionOptionsResult {
  profileType: string;
  profileTraits: string[];
  traitImpacts: Record<string, string>;
  options: DirectionOption[];
}

// 인테비티 결과를 입력으로 받는 빌더 인터페이스
export type DirectionOptionsBuilder = (input: {
  intevity: IntevityResult | null;
}) => DirectionOptionsResult;

