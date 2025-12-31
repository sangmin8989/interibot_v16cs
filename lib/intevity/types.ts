// 인테비티 도메인 타입 정의

// 7문항 고정 ID
export type IntevityQuestionId =
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'q5'
  | 'q6'
  | 'q7';

// Q1~Q6: A/B 선택
export type IntevityABAnswer = 'A' | 'B';

// Q7: 최우선 기준 (7택1)
export type IntevityTopPriority =
  | 'management_stress'
  | 'storage_priority'
  | 'openness_priority'
  | 'trend'
  | 'long_term_stability'
  | 'emotional_appeal'
  | 'functional_rational';

// 전체 답변 구조
export interface IntevityAnswers {
  q1: IntevityABAnswer;
  q2: IntevityABAnswer;
  q3: IntevityABAnswer;
  q4: IntevityABAnswer;
  q5: IntevityABAnswer;
  q6: IntevityABAnswer;
  q7: IntevityTopPriority;
}

// 결과 프로필
export interface IntevityProfile {
  type: string; // 예: 실용 안정형
  description: string;
  traits: string[]; // 주요 태그
}

// 선택 근거 리플레이
export interface IntevityReasoningItem {
  questionId: IntevityQuestionId;
  question: string;
  answer: string;
  reason: string;
}

// 최종 결과
export interface IntevityResult {
  profile: IntevityProfile;
  confidence: number; // 0~100 (표시는 하지 않지만 내부 계산용으로 유지)
  reasoningReplay: IntevityReasoningItem[];
  dailyEmpathy: string; // 1줄로 축소
  conflictWarning: string | null; // 1줄 또는 null
  answers: IntevityAnswers;
  createdAt: string;
}

