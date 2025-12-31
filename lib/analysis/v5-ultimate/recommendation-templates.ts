interface RecommendationTemplate {
  recall: string;
  recommended: string;
  reason: string;
  warning?: string;
}

type TraitProcessTemplates = Record<string, Record<string, RecommendationTemplate>>;

const TEMPLATES: TraitProcessTemplates = {
  COOKING_LOVER: {
    '주방': {
      recall: '요리 자주 하신다고 했잖아요.',
      recommended: '엔지니어드스톤 상판',
      reason: '열과 얼룩에 강해요. 뜨거운 냄비 바로 올려도 됨.',
      warning: '인조대리석은 1년 후 누렇게 변색돼요.',
    },
  },
  CLEANING_SYSTEM_NEED: {
    '바닥재': {
      recall: '청소 자주 안 하신다고 했잖아요.',
      recommended: '강마루',
      reason: '물걸레로 쓱 닦으면 끝. 스크래치도 잘 안 남.',
      warning: '원목마루는 6개월마다 왁싱 필요해요.',
    },
    '욕실': {
      recall: '청소 자주 안 하신다고 했잖아요.',
      recommended: '대형 타일 (600x600)',
      reason: '줄눈이 적어서 청소할 곳이 줄어요.',
      warning: '소형 타일은 줄눈 청소 지옥.',
    },
  },
  SOUNDPROOF_NEED: {
    '중문': {
      recall: '소음에 민감하다고 했잖아요.',
      recommended: '3연동 자동 중문',
      reason: '복층 유리 + 기밀 패킹으로 소음 차단.',
      warning: '2연동은 틈새 소음 들어와요.',
    },
    '샤시': {
      recall: '소음에 민감하다고 했잖아요.',
      recommended: '시스템 이중창',
      reason: '외부 소음 80% 차단. 층간소음 완화.',
      warning: '단창은 소음 차단 효과 없어요.',
    },
  },
  SAFETY_NEED: {
    '가구': {
      recall: '아이가 있어서 안전이 중요하다고 했잖아요.',
      recommended: '아르젠 맞춤 가구',
      reason: '모서리 라운딩 + 슬로우 댐핑 경첩 기본.',
      warning: '기성품은 날카로운 모서리 주의.',
    },
  },
  MODERN_LOVER: {
    '도배': {
      recall: '모던 스타일 좋아하신다고 했잖아요.',
      recommended: '실크 벽지 (그레이/화이트)',
      reason: '깔끔한 무광 마감. 모던 인테리어 필수.',
      warning: '무늬 있는 합지는 촌스러워 보일 수 있어요.',
    },
  },
  NATURAL_LOVER: {
    '바닥재': {
      recall: '내추럴 스타일 좋아하신다고 했잖아요.',
      recommended: '원목마루 또는 온돌마루',
      reason: '따뜻한 나무 질감. 자연스러운 분위기.',
      warning: '강화마루는 플라스틱 느낌날 수 있어요.',
    },
  },
};

export function getRecommendation(
  trait: string,
  process: string
): RecommendationTemplate | null {
  return TEMPLATES[trait]?.[process] || null;
}

export function getRecommendationsForTraits(
  traits: string[],
  selectedProcesses: string[]
): Array<RecommendationTemplate & { trait: string; process: string }> {
  const results: Array<RecommendationTemplate & { trait: string; process: string }> = [];

  for (const trait of traits) {
    for (const process of selectedProcesses) {
      const template = getRecommendation(trait, process);
      if (template) {
        results.push({ ...template, trait, process });
      }
    }
  }

  return results;
}

export function formatRecommendation(template: RecommendationTemplate): string {
  let result = `${template.recall}\n그래서 ${template.recommended}이 맞아요. ${template.reason}`;
  if (template.warning) {
    result += `\n⚠️ ${template.warning}`;
  }
  return result;
}


