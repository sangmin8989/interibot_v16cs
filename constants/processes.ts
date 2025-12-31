/**
 * 공정 정의 (25개 → 자동 패키지로 통합)
 */

import type { ProcessGroup, ProcessCategory, SpaceId } from '@/types/spaceProcess';

export type ProcessId = string;

export interface Process {
  id: ProcessId;
  name: string;
  description: string;
  category: 'core' | 'optional' | 'additional';
}

// 핵심 공정 (자동 포함)
export const CORE_PROCESSES: Process[] = [
  // 욕실
  { id: 'bathroom_tile', name: '타일/방수 재시공', description: '바닥·벽 타일 전체 교체', category: 'core' },
  { id: 'bathroom_fixture', name: '위생기구 교체', description: '양변기, 세면기, 수전', category: 'core' },
  { id: 'bathroom_shower', name: '샤워파티션', description: '샤워부스/파티션 설치', category: 'core' },
  { id: 'bathroom_light', name: '조명/환풍기', description: '욕실 조명, 환풍기 교체', category: 'core' },
  
  // 주방
  { id: 'kitchen_sink', name: '싱크대 교체', description: '상하부장, 상판 포함', category: 'core' },
  { id: 'kitchen_hood', name: '후드/쿡탑', description: '레인지후드, 가스/인덕션', category: 'core' },
  { id: 'kitchen_plumb', name: '수전/배수', description: '주방 수전, 배수 설비', category: 'core' },
  
  // 공통
  { id: 'floor_all', name: '바닥재 교체', description: '강마루/강화마루/타일', category: 'core' },
  { id: 'wallpaper_all', name: '도배', description: '벽지/도배 전체', category: 'core' },
  { id: 'lighting', name: '조명', description: '다운라이트, 간접조명', category: 'core' },
  
  // 현관
  { id: 'entrance_door', name: '중문 설치', description: '현관 중문 (3연동/슬라이딩)', category: 'core' },
  { id: 'entrance_shoe', name: '신발장', description: '현관 수납/신발장', category: 'core' },
];

// 선택 공정
export const OPTIONAL_PROCESSES: Process[] = [
  { id: 'artwall', name: '아트월', description: 'TV벽 포인트 시공', category: 'optional' },
  { id: 'builtin', name: '붙박이장', description: '침실 붙박이장', category: 'optional' },
  { id: 'tv_stand', name: 'TV장/수납장', description: '거실 맞춤 수납가구', category: 'optional' },
  { id: 'dressingroom', name: '드레스룸', description: '워크인 드레스룸', category: 'optional' },
  { id: 'balcony_tile', name: '베란다 타일', description: '베란다 바닥 타일/데크', category: 'optional' },
  { id: 'balcony_storage', name: '베란다 수납', description: '세탁/수납공간 구성', category: 'optional' },
  { id: 'film', name: '인테리어 필름', description: '문짝/가구 래핑', category: 'optional' },
  { id: 'door_molding', name: '도어/몰딩', description: '실내문, 걸레받이 교체', category: 'optional' },
];

// 추가 옵션
export const ADDITIONAL_OPTIONS: Process[] = [
  { id: 'window', name: '창호(샷시) 교체', description: '단열/방음 시스템 창호', category: 'additional' },
  { id: 'hvac', name: '시스템 에어컨', description: '천장 매립형 멀티 에어컨', category: 'additional' },
  { id: 'expansion', name: '발코니 확장', description: '거실/방 면적 확장', category: 'additional' },
  { id: 'ceiling', name: '천장 공사', description: '우물천장, 간접조명 박스', category: 'additional' },
  { id: 'insulation', name: '단열 보강', description: '외벽/창 주변 단열재', category: 'additional' },
];

// 공간별 기본 패키지
export interface SpacePackage {
  spaceId: string;
  name: string;
  icon: string;
  processes: ProcessId[];
  estimateRange: { min: number; max: number }; // 만원 단위 (32평 기준)
}

export const SPACE_PACKAGES: Record<string, SpacePackage> = {
  kitchen: {
    spaceId: 'kitchen',
    name: '주방',
    icon: '🍳',
    processes: ['kitchen_sink', 'kitchen_hood', 'kitchen_plumb', 'lighting'],
    estimateRange: { min: 350, max: 480 },
  },
  living: {
    spaceId: 'living',
    name: '거실',
    icon: '🛋️',
    processes: ['floor_all', 'wallpaper_all', 'lighting'],
    estimateRange: { min: 280, max: 400 },
  },
  entrance: {
    spaceId: 'entrance',
    name: '현관',
    icon: '🚪',
    processes: ['entrance_door', 'entrance_shoe', 'lighting'],
    estimateRange: { min: 180, max: 280 },
  },
  balcony: {
    spaceId: 'balcony',
    name: '베란다',
    icon: '🌿',
    processes: ['balcony_tile', 'balcony_storage'],
    estimateRange: { min: 120, max: 200 },
  },
};

// 욕실 패키지 템플릿
export const BATHROOM_PACKAGE_TEMPLATE: Omit<SpacePackage, 'spaceId' | 'name'> = {
  icon: '🚿',
  processes: ['bathroom_tile', 'bathroom_fixture', 'bathroom_shower', 'bathroom_light'],
  estimateRange: { min: 400, max: 550 },
};

// 방 패키지 템플릿
export const ROOM_PACKAGE_TEMPLATE: Omit<SpacePackage, 'spaceId' | 'name'> = {
  icon: '🛏️',
  processes: ['floor_all', 'wallpaper_all', 'lighting'],
  estimateRange: { min: 150, max: 220 },
};

// 욕실/방 개수에 따라 동적으로 공간 생성
export function generateDynamicSpaces(rooms: number, bathrooms: number): SpacePackage[] {
  const spaces: SpacePackage[] = [];
  
  // 주방, 거실, 현관, 베란다 (고정)
  spaces.push(
    SPACE_PACKAGES.kitchen,
    SPACE_PACKAGES.living,
    SPACE_PACKAGES.entrance,
    SPACE_PACKAGES.balcony
  );
  
  // 욕실 동적 생성
  if (bathrooms === 1) {
    spaces.push({
      ...BATHROOM_PACKAGE_TEMPLATE,
      spaceId: 'bathroom',
      name: '욕실',
    });
  } else if (bathrooms >= 2) {
    spaces.push({
      ...BATHROOM_PACKAGE_TEMPLATE,
      spaceId: 'masterBathroom',
      name: '안방욕실',
      icon: '🛁',
    });
    spaces.push({
      ...BATHROOM_PACKAGE_TEMPLATE,
      spaceId: 'commonBathroom',
      name: '공용욕실',
      icon: '🚿',
    });
    
    // 욕실 3개 이상
    for (let i = 3; i <= bathrooms; i++) {
      spaces.push({
        ...BATHROOM_PACKAGE_TEMPLATE,
        spaceId: `bathroom${i}`,
        name: `욕실${i}`,
      });
    }
  }
  
  // 방 동적 생성
  spaces.push({
    ...ROOM_PACKAGE_TEMPLATE,
    spaceId: 'masterBedroom',
    name: '안방',
  });
  
  for (let i = 1; i < rooms; i++) {
    spaces.push({
      ...ROOM_PACKAGE_TEMPLATE,
      spaceId: `room${i}`,
      name: `룸${i}`,
    });
  }
  
  return spaces;
}

// 평수 기반 계수 계산
export function getPyeongCoefficient(pyeong: number): number {
  if (pyeong <= 20) return 0.7;
  if (pyeong <= 25) return 0.85;
  if (pyeong <= 32) return 1.0;
  if (pyeong <= 40) return 1.15;
  if (pyeong <= 50) return 1.3;
  return 1.5;
}

// 평수 기반 견적 조정
export function adjustEstimateByPyeong(
  baseEstimate: { min: number; max: number },
  pyeong: number
): { min: number; max: number } {
  const coeff = getPyeongCoefficient(pyeong);
  return {
    min: Math.round(baseEstimate.min * coeff),
    max: Math.round(baseEstimate.max * coeff),
  };
}

// 특별 패키지 생성 함수
export function generateFullRemodelPackage(allSpaces: SpacePackage[]): SpacePackage {
  const allProcesses = allSpaces.flatMap(s => s.processes);
  const totalEstimate = allSpaces.reduce(
    (acc, space) => ({
      min: acc.min + space.estimateRange.min,
      max: acc.max + space.estimateRange.max,
    }),
    { min: 0, max: 0 }
  );
  
  return {
    spaceId: 'full',
    name: '전체 리모델링',
    icon: '🏠',
    processes: [...new Set([...allProcesses, 'door_molding'])],
    estimateRange: totalEstimate,
  };
}

export const STYLE_ONLY_PACKAGE: SpacePackage = {
  spaceId: 'style',
  name: '분위기만 바꾸기',
  icon: '🎨',
  processes: ['floor_all', 'wallpaper_all', 'lighting', 'film'],
  estimateRange: { min: 300, max: 500 },
};

// ============================================================
// 하위 호환성을 위한 레거시 export
// (기존 온보딩 페이지에서 사용)
// ============================================================

/**
 * @deprecated 레거시 호환용 - 새 코드에서는 SPACE_PACKAGES 사용
 */
export const defaultProcessesBySpace: Record<string, Record<string, boolean>> = {
  bathroom: {
    bathroom_tile: true,
    bathroom_fixture: true,
    bathroom_shower: true,
    bathroom_light: true,
  },
  kitchen: {
    kitchen_sink: true,
    kitchen_hood: true,
    kitchen_plumb: true,
    lighting: true,
  },
  living: {
    floor_all: true,
    wallpaper_all: true,
    lighting: true,
  },
  bedroom: {
    floor_all: true,
    wallpaper_all: true,
    lighting: true,
  },
  entrance: {
    entrance_door: true,
    entrance_shoe: true,
    lighting: true,
  },
};

/**
 * @deprecated 레거시 호환용 - 새 코드에서는 SPACE_PACKAGES와 CORE_PROCESSES 사용
 */
export function getProcessGroupsForSpace(
  spaceId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spaceSelections?: any
): ProcessGroup[] {
  const allProcesses = [...CORE_PROCESSES, ...OPTIONAL_PROCESSES];
  
  // 공간에 관련된 공정들만 필터링
  const spaceProcesses = allProcesses.filter(p => {
    // 공간별 기본 공정 매핑
    if (spaceId === 'bathroom' || spaceId === 'masterBathroom' || spaceId === 'commonBathroom') {
      return p.id.startsWith('bathroom_');
    }
    if (spaceId === 'kitchen') {
      return p.id.startsWith('kitchen_') || p.id === 'lighting';
    }
    if (spaceId === 'living') {
      return ['floor_all', 'wallpaper_all', 'lighting', 'artwall', 'tv_stand'].includes(p.id);
    }
    if (spaceId === 'bedroom' || spaceId === 'masterBedroom' || spaceId.startsWith('room')) {
      return ['floor_all', 'wallpaper_all', 'lighting', 'builtin', 'dressingroom'].includes(p.id);
    }
    if (spaceId === 'entrance') {
      return p.id.startsWith('entrance_') || p.id === 'lighting';
    }
    if (spaceId === 'balcony') {
      return p.id.startsWith('balcony_');
    }
    return false;
  });

  // 공간별 카테고리 매핑
  const categoryMap: Record<string, ProcessCategory> = {
    bathroom: 'bathroom_core',
    masterBathroom: 'bathroom_core',
    commonBathroom: 'bathroom_core',
    kitchen: 'kitchen_core',
    living: 'wall_finish',
    bedroom: 'wall_finish',
    masterBedroom: 'wall_finish',
    entrance: 'entrance_core',
    balcony: 'balcony_core',
  };

  const category = categoryMap[spaceId] || 'options' as ProcessCategory;

  return [
    {
      category,
      name: '기본 공정',
      type: 'multiple' as const,
      applicableSpaces: [spaceId as SpaceId],
      options: spaceProcesses.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
      })),
    },
  ];
}
