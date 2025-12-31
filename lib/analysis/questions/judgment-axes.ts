/**
 * 판단 축 측정용 질문 세트 (6문항)
 * 
 * 통합 설계서 기준:
 * - 성향 분석을 "취향"이 아니라 "결정 패턴"으로 파악
 * - 4개 판단 축 (비용 민감도, 리스크 회피도, 결정 지연 성향, 통제 욕구) 측정
 */

import { Question } from './types';

/**
 * 판단 축 측정용 질문 6개
 * 
 * 통합 설계서 기준으로 설계된 질문입니다.
 */
export const judgmentAxesQuestions: Question[] = [
  // Q1: 리스크 회피도 측정
  {
    id: 'judgment_irreversible_priority',
    category: 'discomfort_factors', // 리스크 회피도와 관련
    mode: 'standard',
    title: '예산이 늘더라도 나중에 고치기 어려운 부분은 지금 확실히 하고 싶으신가요?',
    description: '이 질문은 리스크 회피도를 측정합니다.',
    type: 'single',
    options: [
      { id: 'strongly_agree', text: '네, 그게 맞아요. 나중에 고치려면 비용이 더 든다고 생각해요', value: 'strongly_agree', icon: '✅' },
      { id: 'agree', text: '대부분 그렇게 생각해요', value: 'agree', icon: '👍' },
      { id: 'neutral', text: '상황에 따라 다를 것 같아요', value: 'neutral', icon: '🤔' },
      { id: 'disagree', text: '아니요, 나중에 고쳐도 괜찮아요', value: 'disagree', icon: '🔄' },
      { id: 'ai_choice', text: '판단이 어려워요. 인테리봇이 정해줘요', value: 'ai_choice', icon: '🤖' },
      { id: 'skip', text: '넘기기', value: 'skip', icon: '⏭️' },
    ],
    required: true,
    weight: 2.0,
  },

  // Q2: 리스크 회피도 + 결정 지연 성향 측정
  {
    id: 'judgment_construction_dislike',
    category: 'discomfort_factors',
    mode: 'standard',
    title: '공사에서 가장 싫은 것은 무엇에 가깝나요?',
    description: '이 질문은 리스크 회피도와 결정 지연 성향을 측정합니다.',
    type: 'single',
    options: [
      { id: 'additional_cost', text: '추가비용', value: 'additional_cost', icon: '💰' },
      { id: 'defect', text: '하자', value: 'defect', icon: '⚠️' },
      { id: 'delay', text: '공사기간 지연', value: 'delay', icon: '⏰' },
      { id: 'decision_stress', text: '결정 스트레스', value: 'decision_stress', icon: '😰' },
      { id: 'ai_choice', text: '하나만 고르기 어려워요', value: 'ai_choice', icon: '🤖' },
      { id: 'skip', text: '넘기기', value: 'skip', icon: '⏭️' },
    ],
    required: true,
    weight: 2.0,
  },

  // Q3: 통제 욕구 측정
  {
    id: 'judgment_choice_preference',
    category: 'space_sense',
    mode: 'standard',
    title: '선택할 때 선호 방식은?',
    description: '이 질문은 통제 욕구를 측정합니다.',
    type: 'single',
    options: [
      { id: 'ai_recommend', text: '추천안 그대로', value: 'ai_recommend', icon: '🤖' },
      { id: 'compare_2_3', text: '2~3개만 비교', value: 'compare_2_3', icon: '⚖️' },
      { id: 'detail_select', text: '세부까지 직접 선택', value: 'detail_select', icon: '🎯' },
      { id: 'ai_choice', text: '상황에 따라 달라요', value: 'ai_choice', icon: '🔄' },
      { id: 'skip', text: '넘기기', value: 'skip', icon: '⏭️' },
    ],
    required: true,
    weight: 2.0,
  },

  // Q4: 결정 지연 성향 측정
  {
    id: 'judgment_decision_delay',
    category: 'organization_habit',
    mode: 'standard',
    title: '결정을 미루게 되는 이유는?',
    description: '이 질문은 결정 지연 성향을 측정합니다.',
    type: 'single',
    options: [
      { id: 'lack_info', text: '정보 부족', value: 'lack_info', icon: '📚' },
      { id: 'fear_loss', text: '손해볼까봐', value: 'fear_loss', icon: '😰' },
      { id: 'too_many', text: '비교할 게 많아서', value: 'too_many', icon: '📊' },
      { id: 'family_opinion', text: '가족 의견', value: 'family_opinion', icon: '👨‍👩‍👧' },
      { id: 'ai_choice', text: '여러 이유가 섞여 있어요', value: 'ai_choice', icon: '🤖' },
      { id: 'skip', text: '넘기기', value: 'skip', icon: '⏭️' },
    ],
    required: true,
    weight: 2.0,
  },

  // Q5: 비용 민감도 + 리스크 회피도 측정
  {
    id: 'judgment_inconvenience_preference',
    category: 'budget_sense',
    mode: 'standard',
    title: '공사 후 "불편"이 생기면 어느 쪽이 더 힘드신가요?',
    description: '이 질문은 비용 민감도와 리스크 회피도를 측정합니다.',
    type: 'single',
    options: [
      { id: 'more_money', text: '돈 더 쓰는 것', value: 'more_money', icon: '💰' },
      { id: 'redo_construction', text: '다시 공사하는 것', value: 'redo_construction', icon: '🔨' },
      { id: 'both', text: '둘 다 힘들어요', value: 'both', icon: '😰' },
      { id: 'neither', text: '둘 다 괜찮아요', value: 'neither', icon: '😊' },
      { id: 'ai_choice', text: '생각해보니 둘 다 싫어요', value: 'ai_choice', icon: '🤖' },
      { id: 'skip', text: '넘기기', value: 'skip', icon: '⏭️' },
    ],
    required: true,
    weight: 2.0,
  },

  // Q6: 비용 민감도 측정
  {
    id: 'judgment_maintenance_tradeoff',
    category: 'budget_sense',
    mode: 'standard',
    title: '결과가 예쁘면 약간의 관리/유지 스트레스는 감수 가능한가요?',
    description: '이 질문은 비용 민감도를 측정합니다.',
    type: 'single',
    options: [
      { id: 'strongly_agree', text: '네, 예쁘면 관리 스트레스는 감수해요', value: 'strongly_agree', icon: '✨' },
      { id: 'agree', text: '대부분 그렇게 생각해요', value: 'agree', icon: '👍' },
      { id: 'neutral', text: '상황에 따라 달라요', value: 'neutral', icon: '🤔' },
      { id: 'disagree', text: '아니요, 관리가 편한 게 더 중요해요', value: 'disagree', icon: '🧹' },
      { id: 'ai_choice', text: '고민이 되네요. 인테리봇이 정해줘요', value: 'ai_choice', icon: '🤖' },
      { id: 'skip', text: '넘기기', value: 'skip', icon: '⏭️' },
    ],
    required: true,
    weight: 2.0,
  },
];

/**
 * 판단 축 질문 ID 목록
 */
export const JUDGMENT_AXES_QUESTION_IDS = judgmentAxesQuestions.map(q => q.id);

/**
 * 질문 ID로 판단 축 질문 찾기
 */
export function getJudgmentAxesQuestion(questionId: string): Question | undefined {
  return judgmentAxesQuestions.find(q => q.id === questionId);
}

/**
 * 모든 판단 축 질문 가져오기
 */
export function getAllJudgmentAxesQuestions(): Question[] {
  return judgmentAxesQuestions;
}




















