// 성향 가중치 규칙

export interface TraitWeightData {
  traitName: string;
  processCode: number;
  conditionScore: number;
  weightPercent: number;
  itemCodes: string;  // JSON 문자열
  actionType: string;
}

export const TRAIT_WEIGHTS: TraitWeightData[] = [
  // Q1=1: 수납공간 부족
  {
    traitName: '수납 부족',
    processCode: 200,
    conditionScore: 1,
    weightPercent: 0.3,
    itemCodes: '["201","202","203"]',
    actionType: 'increase_quantity'
  },
  {
    traitName: '수납 부족',
    processCode: 1000,
    conditionScore: 1,
    weightPercent: 0.3,
    itemCodes: '["1002","1003"]',
    actionType: 'increase_quantity'
  },
  
  // Q2=3: 정리정돈 습관 낮음
  {
    traitName: '정리정돈 낮음',
    processCode: 200,
    conditionScore: 3,
    weightPercent: 0.2,
    itemCodes: '["202","209"]',
    actionType: 'increase_quantity'
  },
  
  // Q5=2: 아이 있음
  {
    traitName: '아이 있음',
    processCode: 200,
    conditionScore: 2,
    weightPercent: 1.0,
    itemCodes: '["205"]',
    actionType: 'add_item'
  }
];

// 유틸 함수
export const getWeightsByAnswers = (answers: number[]): TraitWeightData[] => {
  return TRAIT_WEIGHTS.filter(weight => 
    answers.some((answer, index) => answer === weight.conditionScore)
  );
};

export const parseItemCodes = (itemCodes: string): string[] => {
  try {
    return JSON.parse(itemCodes);
  } catch {
    return [];
  }
};






