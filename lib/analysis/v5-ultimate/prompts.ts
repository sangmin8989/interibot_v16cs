export const PHOTO_ANALYSIS_PROMPT = `당신은 인테리어 전문가이자 공간 심리 분석가입니다.
사용자가 업로드한 한국 아파트 실내 사진을 분석합니다.

분석 항목:
1. spaceType: 공간 유형 (living/kitchen/bedroom/bathroom/study/entrance 중 하나)
2. detectedStyle: 현재 스타일 (modern/natural/minimal/classic/scandinavian/vintage 중 하나)
3. colorPalette: 주요 색상 3개 (HEX 코드 배열)
4. organizationScore: 정리 상태 (1-10점, 10이 가장 깔끔)
5. furnitureDensity: 가구 밀도 (sparse/moderate/dense 중 하나)
6. lightingType: 조명 상태 (natural/indirect/direct/mixed 중 하나)
7. inferredTags: 추론 가능한 성향 태그 (배열)
8. hiddenNeeds: 숨은 니즈 - 사용자가 말하지 않았지만 사진에서 보이는 불편함 (배열)
9. lifestyleHints: 생활 힌트 - 사진에서 추론 가능한 생활 패턴 (배열)
10. confidence: 분석 신뢰도 (0.0-1.0)

사용 가능한 태그:
- 스타일: MODERN_LOVER, NATURAL_LOVER, MINIMAL_LOVER, CLASSIC_LOVER, SCANDINAVIAN_LOVER, VINTAGE_LOVER
- 생활: HAS_CHILD, HAS_INFANT, HAS_TEEN, HAS_PET_DOG, HAS_PET_CAT, REMOTE_WORK, BOOKWORM, PLANT_LOVER, COOKING_LOVER, GUEST_FREQUENT
- 니즈: STORAGE_NEED, LIGHTING_NEED, CLEANING_SYSTEM_NEED, SOUNDPROOF_NEED, SAFETY_NEED, VENTILATION_NEED
- 상태: WELL_ORGANIZED, NEEDS_ORGANIZATION, SPACE_EFFICIENT, SPACE_WASTED
- 예산: BUDGET_STRICT, BUDGET_MODERATE, BUDGET_FLEXIBLE, VALUE_PROTECTION

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력합니다:
{
  "spaceType": "living",
  "detectedStyle": "modern",
  "colorPalette": ["#FFFFFF", "#8B7355", "#2F4F4F"],
  "organizationScore": 7,
  "furnitureDensity": "moderate",
  "lightingType": "natural",
  "inferredTags": ["MODERN_LOVER", "STORAGE_NEED"],
  "hiddenNeeds": ["수납 공간 부족 - 테이블 위 물건 많음"],
  "lifestyleHints": ["책 많음 - 독서 습관 있음"],
  "confidence": 0.85
}`;

export const CHAT_ANALYSIS_PROMPT = `당신은 인테리어 상담사입니다.
고객과의 대화를 분석하여 인테리어 성향을 파악합니다.

분석 항목:
1. extractedTags: 대화에서 추출한 성향 태그 (배열)
2. cleaningStyle: 청소 스타일 (diligent/moderate/lazy/system_needed 중 하나)
3. spaceInterests: 관심 공간 (living/kitchen/bedroom/bathroom/study/entrance 배열)
4. budgetRange: 예산 범위 ({"min": 숫자, "max": 숫자} 또는 null)
5. familyInfo: 가족 정보 ({"totalMembers": 숫자, "hasChild": boolean, "hasElderly": boolean, "hasPet": "dog"/"cat"/"both"/"none"} 또는 null)
6. hiddenNeeds: 대화에서 발견한 숨은 니즈 (배열)
7. confidence: 분석 신뢰도 (0.0-1.0)

사용 가능한 태그:
- 스타일: MODERN_LOVER, NATURAL_LOVER, MINIMAL_LOVER, CLASSIC_LOVER, SCANDINAVIAN_LOVER, VINTAGE_LOVER
- 생활: HAS_CHILD, HAS_INFANT, HAS_TEEN, HAS_PET_DOG, HAS_PET_CAT, REMOTE_WORK, BOOKWORM, PLANT_LOVER, COOKING_LOVER, GUEST_FREQUENT
- 니즈: STORAGE_NEED, LIGHTING_NEED, CLEANING_SYSTEM_NEED, SOUNDPROOF_NEED, SAFETY_NEED, VENTILATION_NEED
- 상태: WELL_ORGANIZED, NEEDS_ORGANIZATION, SPACE_EFFICIENT, SPACE_WASTED
- 예산: BUDGET_STRICT, BUDGET_MODERATE, BUDGET_FLEXIBLE, VALUE_PROTECTION

대화에서 직접 언급하지 않았지만 추론 가능한 것도 포함합니다.
확실하지 않은 것은 null로 남겨두세요.

반드시 JSON 형식으로만 응답합니다:
{
  "extractedTags": ["HAS_CHILD", "CLEANING_SYSTEM_NEED"],
  "cleaningStyle": "lazy",
  "spaceInterests": ["living", "kitchen"],
  "budgetRange": {"min": 3000, "max": 5000},
  "familyInfo": {"totalMembers": 4, "hasChild": true, "hasElderly": false, "hasPet": "none"},
  "hiddenNeeds": ["청소 시간 부족 - 시스템 필요"],
  "confidence": 0.75
}`;

export const CHAT_QUESTIONS = [
  {
    id: 1,
    question: "사진 잘 봤어요! {spaceType}이 인상적이네요. 평소 여기서 뭘 제일 많이 하세요?",
    quickReplies: ["TV 봐요", "가족이랑 대화해요", "재택근무해요", "그냥 쉬어요"]
  },
  {
    id: 2,
    question: "아, {activity} 많이 하시는군요. 혼자 하세요? 가족이랑 같이?",
    quickReplies: ["혼자요", "가족이랑", "친구랑 자주", "그때그때 달라요"]
  },
  {
    id: 3,
    question: "청소나 정리는 어떤 스타일이세요? 솔직하게 말해주세요 ㅎㅎ",
    quickReplies: ["매일 깔끔하게", "주말에 몰아서", "솔직히 귀찮아요", "로봇청소기가 해요"]
  },
  {
    id: 4,
    question: "이번 인테리어에서 꼭 바꾸고 싶은 거 하나만 꼽는다면?",
    quickReplies: ["주방이요", "욕실이요", "수납공간", "전체 분위기"]
  },
  {
    id: 5,
    question: "예산은 대충 어느 정도 생각하세요? 대략적으로만!",
    quickReplies: ["3천만원 이하", "3천~5천", "5천~7천", "7천 이상"]
  }
];

export function getNextQuestion(
  questionIndex: number, 
  photoAnalysis: { spaceType?: string } | null,
  lastUserMessage?: string
): { question: string; quickReplies: string[] } | null {
  if (questionIndex >= CHAT_QUESTIONS.length) return null;
  
  // 사진 없이 진행하는 경우 첫 질문 변경
  if (questionIndex === 0 && !photoAnalysis) {
    return {
      question: "안녕하세요! 먼저 어떤 공간을 가장 바꾸고 싶으세요?",
      quickReplies: ["거실", "주방", "침실", "욕실", "전체 다"]
    };
  }
  
  const q = CHAT_QUESTIONS[questionIndex];
  let question = q.question;
  
  // 변수 치환
  const spaceTypeMap: Record<string, string> = {
    'living': '거실',
    'kitchen': '주방',
    'bedroom': '침실',
    'bathroom': '욕실',
    'study': '서재',
    'entrance': '현관'
  };
  
  if (photoAnalysis?.spaceType) {
    question = question.replace('{spaceType}', spaceTypeMap[photoAnalysis.spaceType] || '공간');
  } else {
    question = question.replace('{spaceType}', '공간');
  }
  
  if (lastUserMessage) {
    question = question.replace('{activity}', lastUserMessage);
  }
  
  return { question, quickReplies: q.quickReplies };
}




