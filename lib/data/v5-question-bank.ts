/**
 * V5 질문 뱅크
 * 
 * 명세서 STEP 9: 18개 고정 질문
 * ⚠️ 표현 변경, 유사 질문 생성 절대 금지
 */

import type { QuestionMetadata } from '@/lib/analysis/v5/types'

/**
 * 18개 고정 질문 메타데이터
 */
export const QUESTION_BANK: Record<string, QuestionMetadata> = {
  // 구조·노후·하자 (HARD) - 4개
  Q01: {
    id: 'Q01',
    text: '이 집의 준공연도 또는 최근 전면 수리는 언제인가요?',
    type: 'HARD',
    category: 'old',
    trigger_hypothesis: 'old_risk',
    affected_processes: 3,
    cost_diff: 500,
    claim_reduction: 40,
    options: ['직접입력'],
  },
  Q02: {
    id: 'Q02',
    text: '결로·누수·곰팡이·소음 중 가장 스트레스를 주는 문제는? (최대 2개)',
    type: 'HARD',
    category: 'old',
    trigger_hypothesis: 'old_risk',
    affected_processes: 2,
    cost_diff: 300,
    claim_reduction: 35,
    options: ['결로', '누수', '곰팡이', '소음', '없음'],
  },
  Q03: {
    id: 'Q03',
    text: '이전 공사 후 1년 내 A/S를 요청한 경험이 있나요?',
    type: 'HARD',
    category: 'old',
    trigger_hypothesis: 'old_risk',
    affected_processes: 1,
    cost_diff: 200,
    claim_reduction: 30,
    options: ['예', '아니오', '공사한적없음'],
  },
  Q08: {
    id: 'Q08',
    text: '집 안에서 미끄럼·단차·모서리 때문에 안전이 걱정되는 공간이 있나요?',
    type: 'HARD',
    category: 'safety',
    trigger_hypothesis: 'safety_risk',
    affected_processes: 2,
    cost_diff: 150,
    claim_reduction: 50,
    options: ['욕실', '현관', '거실', '복도', '없음'],
  },

  // 평형·수납·동선 (SEMI) - 3개
  Q04: {
    id: 'Q04',
    text: '물건이 바닥이나 통로를 침범해 스트레스를 느끼는 빈도는?',
    type: 'SEMI',
    category: 'storage',
    trigger_hypothesis: 'storage_risk',
    affected_processes: 2,
    cost_diff: 200,
    claim_reduction: 25,
    options: ['자주', '가끔', '거의없음'],
  },
  Q05: {
    id: 'Q05',
    text: '물건을 찾느라 5분 이상 헤맨 경험이 자주 있나요?',
    type: 'SEMI',
    category: 'storage',
    trigger_hypothesis: 'storage_risk',
    affected_processes: 1,
    cost_diff: 150,
    claim_reduction: 20,
    options: ['예', '아니오'],
  },
  Q14: {
    id: 'Q14',
    text: '집에서 일할 때 집중이 안 되는 가장 큰 이유는?',
    type: 'SEMI',
    category: 'workspace',
    trigger_hypothesis: 'workspace',
    affected_processes: 1,
    cost_diff: 100,
    claim_reduction: 15,
    options: ['소음', '공간부족', '조명', '없음'],
  },

  // 점유·거주 계획 (HARD) - 2개
  Q06: {
    id: 'Q06',
    text: '이 집에서 최소 몇 년 더 거주할 계획이신가요?',
    type: 'HARD',
    category: 'stay',
    trigger_hypothesis: 'short_stay',
    affected_processes: 3,
    cost_diff: 400,
    claim_reduction: 20,
    options: ['1년이하', '1-3년', '3-5년', '5년이상'],
  },
  Q07: {
    id: 'Q07',
    text: '구조 변경(벽 철거, 확장)까지 고려하시나요, 마감 위주로 하시나요?',
    type: 'HARD',
    category: 'stay',
    trigger_hypothesis: 'short_stay',
    affected_processes: 4,
    cost_diff: 800,
    claim_reduction: 25,
    options: ['구조변경', '마감위주', '모르겠음'],
  },

  // 예산·결정 (HARD/SEMI) - 3개
  Q09: {
    id: 'Q09',
    text: '예산이 초과되면 어떤 공정을 줄이시겠어요?',
    type: 'HARD',
    category: 'budget',
    trigger_hypothesis: 'budget_risk',
    affected_processes: 2,
    cost_diff: 300,
    claim_reduction: 30,
    options: ['주방', '욕실', '바닥', '수납', '기타'],
  },
  Q10: {
    id: 'Q10',
    text: '여러 옵션을 직접 비교 vs 전문가가 추려주는 것, 어떤 방식이 편한가요?',
    type: 'SEMI',
    category: 'decision',
    trigger_hypothesis: 'decision_fatigue',
    affected_processes: 0,
    cost_diff: 0,
    claim_reduction: 15,
    options: ['직접비교', '전문가추천'],
  },
  Q11: {
    id: 'Q11',
    text: '색상·스타일 고르는 게 어려우신가요, 아니면 이미 정해두셨나요?',
    type: 'SEMI',
    category: 'decision',
    trigger_hypothesis: 'decision_fatigue',
    affected_processes: 0,
    cost_diff: 0,
    claim_reduction: 10,
    options: ['어려움', '정해둠', '대충있음'],
  },

  // 주방·욕실 (SEMI) - 3개
  Q12: {
    id: 'Q12',
    text: '주방에서 가장 불편한 것은?',
    type: 'SEMI',
    category: 'kitchen',
    trigger_hypothesis: 'kitchen_risk',
    affected_processes: 2,
    cost_diff: 250,
    claim_reduction: 25,
    options: ['동선', '수납', '환기', '작업공간', '없음'],
  },
  Q13: {
    id: 'Q13',
    text: '욕실에서 가장 오래 머무는 활동은?',
    type: 'SEMI',
    category: 'bathroom',
    trigger_hypothesis: null,
    affected_processes: 1,
    cost_diff: 150,
    claim_reduction: 15,
    options: ['샤워만', '반신욕', '세면화장', '청소'],
  },
  Q16: {
    id: 'Q16',
    text: '아침 출근 시간에 욕실·세면대 동시 사용으로 불편한 적 있나요?',
    type: 'SEMI',
    category: 'bathroom',
    trigger_hypothesis: null,
    affected_processes: 1,
    cost_diff: 200,
    claim_reduction: 20,
    options: ['예', '아니오'],
  },

  // 관리·청소 (SEMI) - 1개
  Q17: {
    id: 'Q17',
    text: '집 관리·청소·수리가 버겁다고 느끼시나요?',
    type: 'SEMI',
    category: 'maintenance',
    trigger_hypothesis: null,
    affected_processes: 1,
    cost_diff: 100,
    claim_reduction: 20,
    options: ['예', '아니오'],
  },

  // 스타일 (SOFT) - 2개
  Q15: {
    id: 'Q15',
    text: '3가지 스타일 중 가장 싫은 것은?',
    type: 'SOFT',
    category: 'style',
    trigger_hypothesis: 'decision_fatigue',
    affected_processes: 0,
    cost_diff: 0,
    claim_reduction: 10,
    options: ['모던미니멀', '내추럴우드', '클래식'],
  },
  Q18: {
    id: 'Q18',
    text: '전체 톤은 어떤 느낌?',
    type: 'SOFT',
    category: 'style',
    trigger_hypothesis: 'decision_fatigue',
    affected_processes: 0,
    cost_diff: 0,
    claim_reduction: 5,
    options: ['밝고화사한', '차분하고따뜻한', '어둡고고급스러운', '모르겠음'],
  },
}

/**
 * 질문 ID 배열
 */
export const QUESTION_IDS = Object.keys(QUESTION_BANK) as Array<keyof typeof QUESTION_BANK>

/**
 * 질문 ID로 질문 가져오기
 */
export function getQuestion(id: string): QuestionMetadata | undefined {
  return QUESTION_BANK[id]
}

/**
 * 타입별 질문 가져오기
 */
export function getQuestionsByType(type: 'HARD' | 'SEMI' | 'SOFT'): QuestionMetadata[] {
  return Object.values(QUESTION_BANK).filter((q) => q.type === type)
}

