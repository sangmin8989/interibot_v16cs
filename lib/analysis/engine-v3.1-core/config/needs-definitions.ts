/**
 * V3.1 Core Edition - Core Needs 정의
 * 
 * 6개 Core Needs의 상세 정의
 */

import { NeedDefinition } from '../types/needs';

export const CORE_NEEDS_DEFINITIONS: Record<string, NeedDefinition> = {
  safety: {
    id: 'safety',
    name: '안전성 강화',
    description: '낙상, 미끄러짐, 날카로운 모서리 등 안전 위험 요소 제거 및 안전성 확보',
    category: 'safety',
  },
  
  storage: {
    id: 'storage',
    name: '수납 강화',
    description: '생활용품, 계절용품, 정리 스트레스 해소를 위한 수납 공간 확보 및 최적화',
    category: 'lifestyle',
  },
  
  flow: {
    id: 'flow',
    name: '동선 최적화',
    description: '요리·식사·설거지, 현관-거실-주방 이동 등 생활 동선의 효율성 개선',
    category: 'lifestyle',
  },
  
  durability: {
    id: 'durability',
    name: '내구성 강화',
    description: '마감재 내구성, 빈번한 사용 공간의 마모 대응, 구축 아파트의 설비/단열 개선',
    category: 'lifestyle',
  },
  
  maintenance: {
    id: 'maintenance',
    name: '청소/관리 편의성',
    description: '청소 난이도 감소, 물때·곰팡이·기름때 등 관리 스트레스 최소화',
    category: 'lifestyle',
  },
  
  brightness: {
    id: 'brightness',
    name: '채광·밝기 향상',
    description: '어두운 공간 개선, 조명 부족 해소, 눈 피로 감소 및 쾌적한 밝기 확보',
    category: 'aesthetic',
  },
} as const;

// ============ 카테고리별 우선순위 ============

export const CATEGORY_PRIORITY = {
  safety: 1,      // 안전이 최우선
  lifestyle: 2,   // 생활 패턴이 그 다음
  aesthetic: 3,   // 감성/취향이 마지막
} as const;

// ============ Needs 설명 템플릿 ============

export const NEEDS_EXPLANATION_TEMPLATES = {
  safety: {
    infant: '영유아가 있어 낙상 및 미끄러짐 위험이 높아',
    elderly: '고령자가 계셔서 안전성이 특히 중요하여',
    waterDamage: '누수/곰팡이 이력이 있어 안전 및 위생 문제가 우려되어',
  },
  
  storage: {
    high: '수납이 많이 필요하고 정리 스트레스가 높아',
    medium: '수납 공간 확보가 필요하여',
    infant: '영유아 육아용품 및 장난감 수납이 필요하여',
  },
  
  flow: {
    cooking: '요리를 자주 하셔서 주방 동선 최적화가 중요하여',
    remoteWork: '재택근무로 집 안 동선이 중요하여',
    family: '가족 구성원이 많아 동선 효율이 중요하여',
  },
  
  durability: {
    old: '15년 이상 구축 아파트로 내구성 보강이 필요하여',
    pet: '반려동물이 있어 내구성이 높은 마감재가 필요하여',
    highUsage: '사용 빈도가 높아 내구성 확보가 중요하여',
  },
  
  maintenance: {
    stress: '청소 및 관리 스트레스가 높아',
    waterDamage: '곰팡이/습기 문제가 있어 관리 편의성이 중요하여',
    oilyCooking: '기름 요리가 많아 청소가 쉬운 마감이 필요하여',
  },
  
  brightness: {
    complaint: '특정 공간이 어둡다고 응답하셔서',
    lowFloor: '저층으로 채광이 부족하여',
    preference: '밝은 공간을 선호하셔서',
  },
} as const;




















