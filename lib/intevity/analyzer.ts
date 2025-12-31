import {
  IntevityAnswers,
  IntevityResult,
  IntevityQuestionId,
} from './types';
import { INTEVITY_QUESTIONS } from './questions';

type AxisScore = {
  storage: number;
  openness: number;
  manage: number;
  design: number;
  emotional: number;
  functional: number;
  trend: number;
  stable: number;
};

function clampConfidence(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildAxisScores(answers: IntevityAnswers): AxisScore {
  const score: AxisScore = {
    storage: 0,
    openness: 0,
    manage: 0,
    design: 0,
    emotional: 0,
    functional: 0,
    trend: 0,
    stable: 0,
  };

  // Q1: 수납 철학
  if (answers.q1 === 'A') score.storage += 1;
  if (answers.q1 === 'B') score.openness += 1;

  // Q2: 관리 vs 디자인
  if (answers.q2 === 'A') score.manage += 1;
  if (answers.q2 === 'B') score.design += 1;

  // Q3: 감성 vs 기능
  if (answers.q3 === 'A') score.emotional += 1;
  if (answers.q3 === 'B') score.functional += 1;

  // Q4: 트렌드 vs 안정
  if (answers.q4 === 'A') score.trend += 1;
  if (answers.q4 === 'B') score.stable += 1;

  // Q5: 개방감 vs 수납
  if (answers.q5 === 'A') score.openness += 1;
  if (answers.q5 === 'B') score.storage += 1;

  // Q6: 후회 포인트 (기능 vs 디자인)
  if (answers.q6 === 'A') score.functional += 1;
  if (answers.q6 === 'B') score.design += 1;

  // Q7: 최우선 기준 가중치
  switch (answers.q7) {
    case 'management_stress':
      score.manage += 2;
      break;
    case 'storage_priority':
      score.storage += 2;
      break;
    case 'openness_priority':
      score.openness += 2;
      break;
    case 'trend':
      score.trend += 2;
      break;
    case 'long_term_stability':
      score.stable += 2;
      break;
    case 'emotional_appeal':
      score.emotional += 2;
      break;
    case 'functional_rational':
      score.functional += 2;
      break;
    default:
      break;
  }

  return score;
}

function detectProfile(score: AxisScore) {
  // 우선순위: 관리/실용/안정 → 실용 안정형
  if (score.manage >= 2 && score.functional >= 2 && score.stable >= 1) {
    return {
      type: '실용 안정형',
      description: '관리 스트레스 최소화와 기능 합리를 우선시하며, 장기 안정성을 중시하는 성향',
      traits: ['관리', '실용', '안정'],
    };
  }

  // 디자인/감성/트렌드 → 감성 트렌드형
  if (score.design >= 2 && score.emotional >= 2 && score.trend >= 1) {
    return {
      type: '감성 트렌드형',
      description: '감성 연출과 트렌드를 즐기며, 디자인 임팩트를 우선하는 성향',
      traits: ['디자인', '감성', '트렌드'],
    };
  }

  // 수납 강조
  if (score.storage >= 2) {
    return {
      type: '수납 최적화형',
      description: '숨김/정리 우선으로 공간 효율과 수납을 최우선으로 여기는 성향',
      traits: ['수납', '정리'],
    };
  }

  // 개방감 강조
  if (score.openness >= 2) {
    return {
      type: '개방감 추구형',
      description: '시야 확장과 넓어 보이는 구성을 우선하며, 군더더기 없는 공간을 선호',
      traits: ['개방감', '미니멀'],
    };
  }

  // 기본
  return {
    type: '균형형',
    description: '관리, 디자인, 수납, 개방감 사이에서 균형 잡힌 선택을 추구하는 성향',
    traits: ['균형', '중립'],
  };
}

function buildReasoning(answers: IntevityAnswers): IntevityResult['reasoningReplay'] {
  const pick = (id: IntevityQuestionId) => INTEVITY_QUESTIONS.find((q) => q.id === id);
  const items: IntevityResult['reasoningReplay'] = [];

  const add = (id: IntevityQuestionId, answerText: string, reason: string) => {
    const q = pick(id);
    if (!q) return;
    items.push({
      questionId: id,
      question: q.title,
      answer: answerText,
      reason,
    });
  };

  add(
    'q1',
    answers.q1 === 'A' ? '숨김 수납 지향' : '미니멀 지향',
    answers.q1 === 'A'
      ? '보이는 물건을 줄이기보다 숨길 공간을 우선 확보하려는 선택'
      : '물건을 덜어내고 비워 보이게 하는 미니멀 선호'
  );

  add(
    'q2',
    answers.q2 === 'A' ? '관리 용이 우선' : '분위기/디자인 우선',
    answers.q2 === 'A'
      ? '마감 선택에서 유지관리 리스크를 낮추려는 결정'
      : '관리 번거로움보다 분위기와 디자인을 우선시'
  );

  add(
    'q7',
    (() => {
      const map: Record<string, string> = {
        management_stress: '관리 스트레스↓',
        storage_priority: '수납 우선',
        openness_priority: '개방감 우선',
        trend: '트렌드',
        long_term_stability: '장기 안정',
        emotional_appeal: '감성 연출',
        functional_rational: '기능 합리',
      };
      return map[answers.q7] || answers.q7;
    })(),
    '최우선 기준으로 명시된 항목'
  );

  return items.slice(0, 3);
}

function buildDailyEmpathy(score: AxisScore): string {
  // 기능적 설명 1줄로 축소 (감성 문장 삭제)
  return '이 기준은 가구·마감 선택에서 변수를 줄입니다.';
}

function buildConflictWarning(score: AxisScore): string | null {
  // 트렌드 vs 안정 충돌
  if (score.trend >= 1 && score.stable >= 1) {
    return '트렌드 욕구와 장기 안정이 충돌할 수 있어, 공간별 기준이 달라질 수 있습니다.';
  }

  // 감성 vs 기능 충돌
  if (score.emotional >= 1 && score.functional >= 1 && score.emotional === score.functional) {
    return '감성 연출과 기능 합리 사이에서 후회 포인트가 생길 수 있어, 공간별 기준이 달라질 수 있습니다.';
  }

  return null;
}

function calculateConfidence(score: AxisScore, answers: IntevityAnswers): number {
  let conf = 60;

  // q7 가중
  conf += 10;

  // 상충 축 패널티
  if (score.trend >= 1 && score.stable >= 1) conf -= 5;
  if (score.emotional >= 1 && score.functional >= 1) conf -= 5;

  // 답변 충실도 (7/7 응답 가정)
  conf += 10;

  return clampConfidence(conf);
}

// 태그별 영향 연결 정보 반환
function getTraitImpacts(traits: string[]): Record<string, string> {
  const impacts: Record<string, string> = {};
  
  if (traits.includes('수납')) {
    impacts['수납'] = '붙박이 ↑ / 오픈 ↓';
  }
  if (traits.includes('정리')) {
    impacts['정리'] = '관리 쉬운 마감 우선';
  }
  if (traits.includes('관리')) {
    impacts['관리'] = '관리 쉬운 마감 우선';
  }
  if (traits.includes('개방감')) {
    impacts['개방감'] = '오픈 수납 ↑ / 붙박이 ↓';
  }
  if (traits.includes('디자인')) {
    impacts['디자인'] = '마감재 디자인 우선';
  }
  if (traits.includes('실용')) {
    impacts['실용'] = '기능성 가구 우선';
  }
  if (traits.includes('안정')) {
    impacts['안정'] = '장기 내구성 우선';
  }
  
  return impacts;
}

export function analyzeIntevityAnswers(answers: IntevityAnswers): IntevityResult {
  const axis = buildAxisScores(answers);
  const profile = detectProfile(axis);
  const confidence = calculateConfidence(axis, answers);
  const reasoningReplay = buildReasoning(answers);
  const dailyEmpathy = buildDailyEmpathy(axis);
  const conflictWarning = buildConflictWarning(axis);

  return {
    profile,
    confidence,
    reasoningReplay,
    dailyEmpathy,
    conflictWarning,
    answers,
    createdAt: new Date().toISOString(),
  };
}

// 태그별 영향 연결 정보를 반환하는 헬퍼 함수 (컴포넌트에서 사용)
export function getTraitImpactMap(traits: string[]): Record<string, string> {
  return getTraitImpacts(traits);
}
