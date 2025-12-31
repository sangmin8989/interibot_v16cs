import { IntevityQuestionId, IntevityTopPriority } from './types';

// 7문항 고정 질문 데이터
export type IntevityQuestion =
  | {
      id: IntevityQuestionId;
      title: string;
      type: 'AB';
      options: { code: 'A' | 'B'; label: string }[];
    }
  | {
      id: IntevityQuestionId;
      title: string;
      type: 'TOP';
      options: { code: IntevityTopPriority; label: string }[];
    };

export const INTEVITY_QUESTIONS: IntevityQuestion[] = [
  {
    id: 'q1',
    title: '집이 어수선할 때, 저는...',
    type: 'AB',
    options: [
      { code: 'A', label: '눈에 안 보이게 숨길 곳부터 만들고 싶어요' },
      { code: 'B', label: '물건을 줄여서 비워 보이게 만들고 싶어요' },
    ],
  },
  {
    id: 'q2',
    title: '새 마감재를 고를 때, 저는...',
    type: 'AB',
    options: [
      { code: 'A', label: '예쁘더라도 관리 힘들면 불안해요' },
      { code: 'B', label: '관리가 좀 번거로워도 분위기가 더 중요해요' },
    ],
  },
  {
    id: 'q3',
    title: '집에서 만족이 확 올라오는 포인트는...',
    type: 'AB',
    options: [
      { code: 'A', label: '조명/무드 같은 연출이 잡힐 때' },
      { code: 'B', label: '동선/수납 같은 사용성이 편해질 때' },
    ],
  },
  {
    id: 'q4',
    title: '“요즘 느낌”이 강한 디자인을 보면...',
    type: 'AB',
    options: [
      { code: 'A', label: '지금 아니면 못 하니 해보고 싶다' },
      { code: 'B', label: '유행 지나면 싫어질까 봐 안전한 쪽이 낫다' },
    ],
  },
  {
    id: 'q5',
    title: '거실이 넓어 보이는 게 중요하냐고 물으면...',
    type: 'AB',
    options: [
      { code: 'A', label: '네. 탁 트인 시야가 제일 중요해요' },
      { code: 'B', label: '아니요. 정리되는 느낌이 더 중요해요' },
    ],
  },
  {
    id: 'q6',
    title: '저는 공사 끝나고 후회할 때가 보통...',
    type: 'AB',
    options: [
      { code: 'A', label: '예쁜데 불편해서일 때' },
      { code: 'B', label: '편한데 심심해서일 때' },
    ],
  },
  {
    id: 'q7',
    title: '지금 인테리어에서 제일 중요한 기준은? (1개만)',
    type: 'TOP',
    options: [
      { code: 'management_stress', label: '관리 스트레스↓' },
      { code: 'storage_priority', label: '수납 우선' },
      { code: 'openness_priority', label: '개방감 우선' },
      { code: 'trend', label: '트렌드' },
      { code: 'long_term_stability', label: '장기 안정' },
      { code: 'emotional_appeal', label: '감성 연출' },
      { code: 'functional_rational', label: '기능 합리' },
    ],
  },
];

