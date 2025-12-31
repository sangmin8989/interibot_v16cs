import { DNAType, DNATypeInfo, AllTags, TraitScores } from './types';

export const DNA_TYPES: Record<DNAType, DNATypeInfo> = {
  fox: {
    type: 'fox',
    emoji: '🦊',
    name: '여우',
    title: '영리한 공간 활용가',
    description: '제한된 공간에서 최대 효율을 뽑아내는 당신은 수납의 달인. 깔끔해 보이지만 서랍 속엔 철저한 시스템이 숨어있죠.',
    traits: ['수납 중요', '가성비 추구', '실용적', '효율 극대화'],
    recommendedStyles: ['modern', 'minimal', 'scandinavian'],
    prioritySpaces: ['living', 'bedroom', 'entrance']
  },
  lion: {
    type: 'lion',
    emoji: '🦁',
    name: '사자',
    title: '당당한 스타일 리더',
    description: '트렌드를 따르지 않고 만드는 타입. 과감한 색상과 독특한 소품으로 자신만의 공간을 연출합니다.',
    traits: ['스타일 고집', '과감한 선택', '트렌드 선도', '개성 강함'],
    recommendedStyles: ['modern', 'vintage', 'classic'],
    prioritySpaces: ['living', 'entrance', 'study']
  },
  bear: {
    type: 'bear',
    emoji: '🐻',
    name: '곰',
    title: '포근한 안식처 창조자',
    description: '집은 쉬는 곳이라는 철학. 편안함이 최우선이고, 가족이 함께하는 따뜻한 공간을 만듭니다.',
    traits: ['편안함 최우선', '따뜻한 톤', '가족 중심', '아늑함'],
    recommendedStyles: ['natural', 'scandinavian'],
    prioritySpaces: ['living', 'bedroom', 'kitchen']
  },
  owl: {
    type: 'owl',
    emoji: '🦉',
    name: '부엉이',
    title: '깊은 생각의 서재형',
    description: '조용히 책 읽고, 생각하고, 작업하는 공간이 필요한 타입. 나만의 영역이 확실해야 합니다.',
    traits: ['독립 공간 중요', '조용함', '기능성', '집중'],
    recommendedStyles: ['minimal', 'modern', 'natural'],
    prioritySpaces: ['study', 'bedroom']
  },
  dolphin: {
    type: 'dolphin',
    emoji: '🐬',
    name: '돌고래',
    title: '활기찬 사교형',
    description: '집에 사람들 초대하는 걸 좋아하는 타입. 거실이 무대고, 손님 맞이가 즐거움입니다.',
    traits: ['거실 중심', '손님 맞이', '밝은 분위기', '오픈형'],
    recommendedStyles: ['modern', 'scandinavian', 'natural'],
    prioritySpaces: ['living', 'kitchen', 'entrance']
  },
  swan: {
    type: 'swan',
    emoji: '🦢',
    name: '백조',
    title: '우아한 미니멀리스트',
    description: '물건은 적을수록 좋고, 하나를 두더라도 제대로 된 걸 두는 타입. 여백의 미학을 추구합니다.',
    traits: ['미니멀', '화이트톤', '고급스러움', '여백'],
    recommendedStyles: ['minimal', 'modern'],
    prioritySpaces: ['living', 'bedroom', 'bathroom']
  },
  bee: {
    type: 'bee',
    emoji: '🐝',
    name: '벌',
    title: '부지런한 시스템 구축자',
    description: '청소도, 정리도 시스템으로 해결하는 타입. 로봇청소기, 자동 수납, 스마트홈이 필수입니다.',
    traits: ['청소 시스템', '효율', '자동화', '스마트홈'],
    recommendedStyles: ['modern', 'minimal'],
    prioritySpaces: ['kitchen', 'living', 'bathroom']
  },
  butterfly: {
    type: 'butterfly',
    emoji: '🦋',
    name: '나비',
    title: '변화를 즐기는 트렌드세터',
    description: '계절마다, 기분마다 인테리어를 바꾸는 타입. 소품 활용의 달인이고 SNS 감성을 중요시합니다.',
    traits: ['계절별 변화', '소품 활용', 'SNS 감성', '트렌디'],
    recommendedStyles: ['scandinavian', 'natural', 'vintage'],
    prioritySpaces: ['living', 'bedroom', 'entrance']
  },
  turtle: {
    type: 'turtle',
    emoji: '🐢',
    name: '거북이',
    title: '신중한 장기 투자자',
    description: '한 번 하면 오래 쓰는 타입. 유행보다 내구성, 스타일보다 집값 방어가 중요합니다.',
    traits: ['내구성', '집값 방어', '장기 거주', '신중함'],
    recommendedStyles: ['modern', 'classic', 'natural'],
    prioritySpaces: ['bathroom', 'kitchen', 'bedroom']
  },
  rabbit: {
    type: 'rabbit',
    emoji: '🐰',
    name: '토끼',
    title: '아기자기한 디테일리스트',
    description: '작은 소품 하나에도 의미를 담는 타입. 컬러풀하고 아기자기한 공간을 만듭니다.',
    traits: ['소품 사랑', '컬러풀', '디테일', '아기자기'],
    recommendedStyles: ['natural', 'scandinavian', 'vintage'],
    prioritySpaces: ['bedroom', 'living', 'kitchen']
  },
  eagle: {
    type: 'eagle',
    emoji: '🦅',
    name: '독수리',
    title: '넓은 시야의 공간 설계자',
    description: '벽을 허물고 시원하게 트는 걸 좋아하는 타입. 동선과 시야가 중요합니다.',
    traits: ['오픈 플로어', '동선 중시', '시원한 느낌', '구조 변경'],
    recommendedStyles: ['modern', 'minimal'],
    prioritySpaces: ['living', 'kitchen']
  },
  wolf: {
    type: 'wolf',
    emoji: '🐺',
    name: '늑대',
    title: '독립적인 나만의 공간 추구자',
    description: '프라이버시가 최우선. 방음, 독립 공간, 나만의 영역이 확실해야 합니다.',
    traits: ['프라이버시', '방음', '개인 공간', '독립성'],
    recommendedStyles: ['modern', 'minimal', 'natural'],
    prioritySpaces: ['bedroom', 'study']
  }
};

export function determineDNAType(tags: AllTags[], traitScores: TraitScores): DNATypeInfo {
  const scores: Record<DNAType, number> = {
    fox: 0, lion: 0, bear: 0, owl: 0, dolphin: 0, swan: 0,
    bee: 0, butterfly: 0, turtle: 0, rabbit: 0, eagle: 0, wolf: 0
  };
  
  // 태그 기반 점수
  if (tags.includes('STORAGE_NEED') || tags.includes('SPACE_EFFICIENT')) scores.fox += 30;
  if (tags.includes('MODERN_LOVER') && traitScores.styleCommitment > 70) scores.lion += 30;
  if (tags.includes('HAS_CHILD') || tags.includes('NATURAL_LOVER')) scores.bear += 30;
  if (tags.includes('REMOTE_WORK') || tags.includes('BOOKWORM')) scores.owl += 30;
  if (tags.includes('GUEST_FREQUENT')) scores.dolphin += 30;
  if (tags.includes('MINIMAL_LOVER') && tags.includes('WELL_ORGANIZED')) scores.swan += 30;
  if (tags.includes('CLEANING_SYSTEM_NEED')) scores.bee += 30;
  if (traitScores.styleCommitment < 40) scores.butterfly += 20;
  if (tags.includes('VALUE_PROTECTION') || tags.includes('BUDGET_STRICT')) scores.turtle += 30;
  if (traitScores.visualSensitivity > 70) scores.rabbit += 20;
  if (traitScores.flowImportance > 70) scores.eagle += 30;
  if (tags.includes('SOUNDPROOF_NEED') || traitScores.independencePreference > 70) scores.wolf += 30;
  
  // 지표 기반 추가 점수
  if (traitScores.spaceEfficiency > 70) scores.fox += 20;
  if (traitScores.familyInfluence > 70) scores.bear += 20;
  if (traitScores.independencePreference > 70) { scores.owl += 15; scores.wolf += 15; }
  if (traitScores.cleaningSensitivity > 70) scores.bee += 20;
  if (traitScores.budgetFlexibility < 40) scores.turtle += 20;
  
  // 최고 점수 DNA 선택
  let maxScore = 0;
  let selectedType: DNAType = 'bear';
  
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      selectedType = type as DNAType;
    }
  }
  
  return DNA_TYPES[selectedType];
}

export function calculateDNAMatchScore(tags: AllTags[], dna: DNATypeInfo): number {
  let matchCount = 0;
  const totalFactors = 4;
  
  // 스타일 매칭
  const styleMap: Record<string, string> = {
    'MODERN_LOVER': 'modern',
    'NATURAL_LOVER': 'natural',
    'MINIMAL_LOVER': 'minimal',
    'CLASSIC_LOVER': 'classic',
    'SCANDINAVIAN_LOVER': 'scandinavian',
    'VINTAGE_LOVER': 'vintage'
  };
  
  for (const tag of tags) {
    if (styleMap[tag] && dna.recommendedStyles.includes(styleMap[tag] as any)) {
      matchCount++;
      break;
    }
  }
  
  // 특성 매칭 (간단한 키워드 매칭)
  const traitKeywords: Record<string, string[]> = {
    'STORAGE_NEED': ['수납'],
    'CLEANING_SYSTEM_NEED': ['청소', '시스템'],
    'HAS_CHILD': ['가족'],
    'GUEST_FREQUENT': ['손님', '사교'],
    'SOUNDPROOF_NEED': ['방음', '프라이버시']
  };
  
  for (const tag of tags) {
    const keywords = traitKeywords[tag];
    if (keywords) {
      for (const trait of dna.traits) {
        if (keywords.some(k => trait.includes(k))) {
          matchCount++;
          break;
        }
      }
      break;
    }
  }
  
  // 기본 점수 + 신뢰도 보너스 (랜덤 제거)
  const baseScore = 60 + (matchCount / totalFactors) * 30;
  const confidenceBonus = Math.min(5, matchCount * 0.5);
  
  return Math.min(99, Math.max(60, Math.round(baseScore + confidenceBonus)));
}




