// 1차 성향분석: 생활패턴, 취향, 가치관
export const PRIMARY_QUESTIONS = [
  {
    id: 'cooking',
    question: '요리는 얼마나 자주 하세요?',
    options: [
      { value: 'daily', label: '거의 매일', trait: 'COOKING_LOVER' },
      { value: 'weekly', label: '주 2~3회', trait: null },
      { value: 'rarely', label: '거의 안 함', trait: null },
    ],
  },
  {
    id: 'cleaning',
    question: '청소 스타일은 어떠세요?',
    options: [
      { value: 'daily', label: '매일 조금씩', trait: null },
      { value: 'weekly', label: '주말에 몰아서', trait: 'CLEANING_SYSTEM_NEED' },
      { value: 'minimal', label: '최소한만', trait: 'CLEANING_SYSTEM_NEED' },
    ],
  },
  {
    id: 'noise',
    question: '소음에 민감하세요?',
    options: [
      { value: 'very', label: '매우 민감', trait: 'SOUNDPROOF_NEED' },
      { value: 'normal', label: '보통', trait: null },
      { value: 'not', label: '상관없음', trait: null },
    ],
  },
  {
    id: 'family',
    question: '함께 사는 가족 구성은?',
    options: [
      { value: 'kids', label: '어린 자녀 있음', trait: 'SAFETY_NEED' },
      { value: 'couple', label: '부부/커플', trait: null },
      { value: 'single', label: '1인 가구', trait: null },
      { value: 'parents', label: '부모님과 함께', trait: null },
    ],
  },
  {
    id: 'priority',
    question: '인테리어에서 가장 중요한 건?',
    options: [
      { value: 'design', label: '예쁜 디자인', trait: 'MODERN_LOVER' },
      { value: 'practical', label: '실용성', trait: 'STORAGE_NEED' },
      { value: 'comfort', label: '편안함', trait: 'NATURAL_LOVER' },
      { value: 'value', label: '집값 상승', trait: null },
    ],
  },
];

// 2차 성향분석: 선택 공정 기반 구체적 질문
export const SECONDARY_QUESTIONS: Record<string, Array<{
  id: string;
  question: string;
  options: Array<{ value: string; label: string; recommendation?: string | null }>;
}>> = {
  '주방': [
    {
      id: 'kitchen_pain',
      question: '주방에서 가장 불편한 점은?',
      options: [
        { value: 'storage', label: '수납 공간 부족', recommendation: '키큰장 추가' },
        { value: 'counter', label: '조리 공간 부족', recommendation: '아일랜드 추가' },
        { value: 'cleaning', label: '청소하기 어려움', recommendation: '엔지니어드스톤 상판' },
        { value: 'old', label: '전체적으로 낡음', recommendation: '전체 교체' },
      ],
    },
    {
      id: 'kitchen_appliance',
      question: '빌트인 가전 계획은?',
      options: [
        { value: 'dishwasher', label: '식기세척기 필수', recommendation: '하부장 배치 조정' },
        { value: 'oven', label: '오븐 필수', recommendation: '키큰장에 배치' },
        { value: 'none', label: '기존 가전 사용', recommendation: null },
      ],
    },
  ],
  '욕실': [
    {
      id: 'bathroom_user',
      question: '욕실 주 사용자는?',
      options: [
        { value: 'kids', label: '아이들 위주', recommendation: '미끄럼방지 타일' },
        { value: 'adults', label: '어른 위주', recommendation: '호텔식 마감' },
        { value: 'elderly', label: '어르신 계심', recommendation: '안전바 설치' },
      ],
    },
    {
      id: 'bathroom_style',
      question: '원하는 욕실 느낌은?',
      options: [
        { value: 'hotel', label: '호텔 같은', recommendation: '대형타일 + 간접조명' },
        { value: 'clean', label: '깔끔한', recommendation: '화이트 톤 + 대형타일' },
        { value: 'warm', label: '따뜻한', recommendation: '우드톤 + 난방' },
      ],
    },
  ],
  '바닥재': [
    {
      id: 'floor_use',
      question: '바닥 사용 패턴은?',
      options: [
        { value: 'barefoot', label: '맨발로 다님', recommendation: '온돌마루' },
        { value: 'slippers', label: '슬리퍼 착용', recommendation: '강마루' },
        { value: 'pets', label: '반려동물 있음', recommendation: 'SPC 또는 강마루' },
      ],
    },
  ],
  '가구': [
    {
      id: 'storage_need',
      question: '수납 고민은?',
      options: [
        { value: 'clothes', label: '옷이 너무 많음', recommendation: '드레스룸형 붙박이장' },
        { value: 'shoes', label: '신발이 많음', recommendation: '대형 신발장' },
        { value: 'books', label: '책/물건 많음', recommendation: '벽면 수납장' },
        { value: 'none', label: '적당함', recommendation: null },
      ],
    },
  ],
  '샤시': [
    {
      id: 'window_problem',
      question: '현재 창문 문제는?',
      options: [
        { value: 'cold', label: '겨울에 춥다', recommendation: '시스템 이중창' },
        { value: 'noise', label: '소음이 들린다', recommendation: '방음 특화 샤시' },
        { value: 'old', label: '오래됨', recommendation: '전체 교체' },
      ],
    },
  ],
  '중문': [
    {
      id: 'door_need',
      question: '중문 필요한 이유는?',
      options: [
        { value: 'noise', label: '소음 차단', recommendation: '3연동 자동' },
        { value: 'dust', label: '미세먼지 차단', recommendation: '기밀형 중문' },
        { value: 'privacy', label: '시선 차단', recommendation: '불투명 유리' },
        { value: 'design', label: '인테리어', recommendation: '슬림 프레임' },
      ],
    },
  ],
  '도배': [
    {
      id: 'wall_style',
      question: '원하는 벽 느낌은?',
      options: [
        { value: 'clean', label: '깔끔한 단색', recommendation: '실크 벽지' },
        { value: 'texture', label: '질감 있는', recommendation: '수입 벽지' },
        { value: 'paint', label: '페인트 느낌', recommendation: '합지 or 페인트' },
      ],
    },
  ],
};

// 질문 가져오기 함수
export function getPrimaryQuestions() {
  return PRIMARY_QUESTIONS;
}

export function getSecondaryQuestions(selectedProcesses: string[]): typeof SECONDARY_QUESTIONS[string] {
  const questions: typeof SECONDARY_QUESTIONS[string] = [];
  for (const process of selectedProcesses) {
    if (SECONDARY_QUESTIONS[process]) {
      questions.push(...SECONDARY_QUESTIONS[process]);
    }
  }
  return questions;
}


