// 인테비티 결과를 바탕으로 3가지 방향 옵션(A/B/C)을 생성한다.
// 화살표(축)로 비교할 수 있도록 position 값을 제공한다.

import { getTraitImpactMap } from '@/lib/intevity/analyzer';
import type { IntevityResult } from '@/lib/intevity/types';
import type {
  DirectionOption,
  DirectionOptionsBuilder,
  DirectionOptionsResult,
} from './types';

// 공통 화살표 라벨
const AXIS_LABEL_LEFT = '변수 최소화';
const AXIS_LABEL_RIGHT = '체감 최대화';

// 프로필 유형별 기본 적용 문구
function buildApplications(profileTraits: string[]): {
  strong: string[];
  base: string[];
  impact: string[];
} {
  // 수납/정리 위주 여부 체크
  const hasStorage = profileTraits.includes('수납');
  const hasManage = profileTraits.includes('관리') || profileTraits.includes('정리');
  const hasOpenness = profileTraits.includes('개방감');
  const hasDesign = profileTraits.includes('디자인') || profileTraits.includes('감성') || profileTraits.includes('트렌드');

  if (hasStorage || hasManage) {
    return {
      strong: ['붙박이 비중 확대', '오픈 수납 최소화', '관리 쉬운 마감 우선'],
      base: ['붙박이 기본 유지', '오픈 수납 제한적 허용', '관리 쉬운 마감 기본'],
      impact: ['붙박이 기본 유지', '오픈 수납 일부 허용', '디자인 포인트 추가'],
    };
  }

  if (hasOpenness) {
    return {
      strong: ['오픈 비중 확대', '붙박이 축소', '시야 여백 확보'],
      base: ['오픈 기본 유지', '붙박이 제한적 허용', '미니멀 배치'],
      impact: ['오픈 유지', '붙박이 일부 추가', '정리 포인트 보강'],
    };
  }

  if (hasDesign) {
    return {
      strong: ['디자인 포인트 확대', '연출 요소 강화', '트렌드 반영'],
      base: ['디자인 포인트 기본', '연출 요소 균형', '트렌드 선택적 반영'],
      impact: ['디자인 포인트 유지', '관리 편의 일부 추가', '연출 + 실용 절충'],
    };
  }

  // 기본값 (균형형 등)
  return {
    strong: ['수납·관리 방향으로 강조', '관리 쉬운 마감', '변수 최소화'],
    base: ['균형 유지', '필수 포인트만 선택', '관리/체감 균형'],
    impact: ['개방·감성 방향 강조', '디자인 포인트 추가', '체감 요소 확대'],
  };
}

// 프로필 기반 설명 빌드
function buildExplanation(profileType: string, direction: 'strong' | 'base' | 'impact'): string {
  if (direction === 'strong') {
    return `${profileType} 기준을 가장 엄격히 지켜 변수와 견적 흔들림을 줄이는 방향입니다.`;
  }
  if (direction === 'impact') {
    return `${profileType} 기준보다 체감/연출을 우선해 선택지가 늘어날 수 있는 방향입니다.`;
  }
  return `${profileType} 기준을 유지하면서 체감 개선을 일부 가져가는 방향입니다.`;
}

// 트레이드오프 프리셋
const TRADEOFF_PRESETS = {
  strong: {
    variability: '적음' as const,
    perception: '적음' as const,
    note: '변수는 적지만 체감 변화도 작을 수 있습니다.',
    axisPosition: 0.1,
  },
  base: {
    variability: '보통' as const,
    perception: '보통' as const,
    note: '변수 관리 가능, 체감 변화는 보통입니다.',
    axisPosition: 0.5,
  },
  impact: {
    variability: '많음' as const,
    perception: '큼' as const,
    note: '변수가 늘어나지만 체감 변화가 큽니다.',
    axisPosition: 0.9,
  },
};

// 메인 빌더
export const buildDirectionOptionsFromIntevity: DirectionOptionsBuilder = ({ intevity }): DirectionOptionsResult => {
  const profileType = intevity?.profile.type ?? '기준형';
  const profileTraits = intevity?.profile.traits ?? [];
  const traitImpacts = intevity ? getTraitImpactMap(intevity.profile.traits) : {};
  const apps = buildApplications(profileTraits);

  const options: DirectionOption[] = [
    {
      code: 'A',
      name: '기준 강화',
      description: apps.strong[0] ?? '기준을 더 강하게 적용',
      applications: apps.strong,
      tradeoff: {
        variability: TRADEOFF_PRESETS.strong.variability,
        perception: TRADEOFF_PRESETS.strong.perception,
        note: TRADEOFF_PRESETS.strong.note,
      },
      axis: {
        labelLeft: AXIS_LABEL_LEFT,
        labelRight: AXIS_LABEL_RIGHT,
        position: TRADEOFF_PRESETS.strong.axisPosition,
      },
      explanation: buildExplanation(profileType, 'strong'),
    },
    {
      code: 'B',
      name: '기준 유지',
      description: apps.base[0] ?? '기준을 유지하며 균형 적용',
      applications: apps.base,
      tradeoff: {
        variability: TRADEOFF_PRESETS.base.variability,
        perception: TRADEOFF_PRESETS.base.perception,
        note: TRADEOFF_PRESETS.base.note,
      },
      axis: {
        labelLeft: AXIS_LABEL_LEFT,
        labelRight: AXIS_LABEL_RIGHT,
        position: TRADEOFF_PRESETS.base.axisPosition,
      },
      explanation: buildExplanation(profileType, 'base'),
    },
    {
      code: 'C',
      name: '체감 추가',
      description: apps.impact[0] ?? '체감/연출을 더 반영',
      applications: apps.impact,
      tradeoff: {
        variability: TRADEOFF_PRESETS.impact.variability,
        perception: TRADEOFF_PRESETS.impact.perception,
        note: TRADEOFF_PRESETS.impact.note,
      },
      axis: {
        labelLeft: AXIS_LABEL_LEFT,
        labelRight: AXIS_LABEL_RIGHT,
        position: TRADEOFF_PRESETS.impact.axisPosition,
      },
      explanation: buildExplanation(profileType, 'impact'),
    },
  ];

  return {
    profileType,
    profileTraits,
    traitImpacts,
    options,
  };
};

