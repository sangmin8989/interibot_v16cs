/**
 * V3.1 Core Edition - Needs → Process 매핑 설정
 * 
 * Core Edition 범위:
 * - 욕실 (bathroom)
 * - 거실 (living)
 * - 주방 (kitchen)
 * 
 * 각 Needs가 어떤 공정/옵션과 연결되는지 정의합니다.
 */

import { NeedsId } from '../types/needs';

// ============ 공정 타입 정의 ============

export interface ProcessDefinition {
  /** 공정 ID */
  id: string;
  /** 공정 이름 */
  name: string;
  /** 카테고리 (공간) */
  category: 'bathroom' | 'living' | 'kitchen';
  /** 기본 설명 */
  description: string;
}

// ============ Needs → Process 매핑 ============

export interface NeedsToProcessMapping {
  /** 대상 Needs ID */
  needsId: NeedsId;
  /** 추천 공정 목록 */
  processes: {
    /** 공정 ID */
    processId: string;
    /** 우선순위 */
    priority: 'must' | 'recommended' | 'optional';
    /** 추천 이유 템플릿 */
    reasonTemplate: string;
    /** 필요 강도 (이 강도 이상일 때만 추천) */
    minLevel?: 'low' | 'mid' | 'high';
  }[];
}

// ============ Core Edition 공정 정의 ============

export const CORE_PROCESSES: ProcessDefinition[] = [
  // 욕실 공정
  {
    id: 'bathroom-floor',
    name: '욕실 바닥 타일',
    category: 'bathroom',
    description: '미끄럼 방지 및 청소 편의를 위한 바닥 타일 교체',
  },
  {
    id: 'bathroom-wall',
    name: '욕실 벽 타일',
    category: 'bathroom',
    description: '방수 및 곰팡이 방지를 위한 벽 타일 교체',
  },
  {
    id: 'bathroom-ceiling',
    name: '욕실 천장',
    category: 'bathroom',
    description: '곰팡이 방지 및 환기 개선을 위한 천장 마감',
  },
  {
    id: 'bathroom-ventilation',
    name: '욕실 환기팬',
    category: 'bathroom',
    description: '습기 및 곰팡이 제거를 위한 환기팬 설치/교체',
  },
  {
    id: 'bathroom-lighting',
    name: '욕실 조명',
    category: 'bathroom',
    description: '밝기 및 안전성 향상을 위한 조명 교체',
  },
  {
    id: 'bathroom-safety',
    name: '욕실 안전 손잡이',
    category: 'bathroom',
    description: '고령자/영유아 안전을 위한 손잡이 설치',
  },
  {
    id: 'bathroom-storage',
    name: '욕실 수납',
    category: 'bathroom',
    description: '수납 공간 확보를 위한 수납장/선반 설치',
  },
  {
    id: 'bathroom-waterproof',
    name: '욕실 방수',
    category: 'bathroom',
    description: '누수 방지를 위한 방수 작업',
  },

  // 거실 공정
  {
    id: 'living-flooring',
    name: '거실 바닥재',
    category: 'living',
    description: '내구성 및 청소 편의를 위한 바닥재 교체',
  },
  {
    id: 'living-wallpaper',
    name: '거실 도배',
    category: 'living',
    description: '밝기 및 분위기 개선을 위한 도배',
  },
  {
    id: 'living-lighting',
    name: '거실 조명',
    category: 'living',
    description: '밝기 및 분위기 조성을 위한 조명 설치',
  },
  {
    id: 'living-storage',
    name: '거실 수납',
    category: 'living',
    description: '수납 공간 확보를 위한 붙박이장/선반',
  },
  {
    id: 'living-layout',
    name: '거실 동선 개선',
    category: 'living',
    description: '생활 동선 최적화를 위한 레이아웃 조정',
  },

  // 주방 공정
  {
    id: 'kitchen-countertop',
    name: '주방 상판',
    category: 'kitchen',
    description: '내구성 및 청소 편의를 위한 상판 교체',
  },
  {
    id: 'kitchen-cabinets',
    name: '주방 수납장',
    category: 'kitchen',
    description: '수납 공간 확보 및 동선 개선',
  },
  {
    id: 'kitchen-wall',
    name: '주방 벽 타일',
    category: 'kitchen',
    description: '기름때 청소 편의를 위한 타일 시공',
  },
  {
    id: 'kitchen-hood',
    name: '주방 후드',
    category: 'kitchen',
    description: '환기 및 기름때 제거를 위한 후드 교체',
  },
  {
    id: 'kitchen-lighting',
    name: '주방 조명',
    category: 'kitchen',
    description: '작업 편의를 위한 조명 설치',
  },
  {
    id: 'kitchen-sink',
    name: '주방 싱크대',
    category: 'kitchen',
    description: '내구성 및 동선 개선을 위한 싱크대 교체',
  },
];

// ============ Needs → Process 매핑 규칙 ============

export const NEEDS_TO_PROCESS_MAPPING: NeedsToProcessMapping[] = [
  // 안전성 강화
  {
    needsId: 'safety',
    processes: [
      {
        processId: 'bathroom-floor',
        priority: 'must',
        reasonTemplate: '미끄럼 방지를 위해 논슬립 바닥 타일이 필수입니다',
        minLevel: 'mid',
      },
      {
        processId: 'bathroom-safety',
        priority: 'must',
        reasonTemplate: '안전을 위한 손잡이 설치가 필요합니다',
        minLevel: 'high',
      },
      {
        processId: 'living-flooring',
        priority: 'recommended',
        reasonTemplate: '미끄럼 방지 바닥재로 교체를 권장합니다',
        minLevel: 'high',
      },
    ],
  },

  // 수납 강화
  {
    needsId: 'storage',
    processes: [
      {
        processId: 'living-storage',
        priority: 'must',
        reasonTemplate: '생활용품 수납을 위한 붙박이장이 필요합니다',
        minLevel: 'mid',
      },
      {
        processId: 'bathroom-storage',
        priority: 'recommended',
        reasonTemplate: '욕실 수납 공간 확보를 권장합니다',
        minLevel: 'mid',
      },
      {
        processId: 'kitchen-cabinets',
        priority: 'must',
        reasonTemplate: '주방 수납 공간 확보가 필요합니다',
        minLevel: 'high',
      },
    ],
  },

  // 동선 최적화
  {
    needsId: 'flow',
    processes: [
      {
        processId: 'living-layout',
        priority: 'recommended',
        reasonTemplate: '생활 동선 개선을 위한 레이아웃 조정이 필요합니다',
        minLevel: 'mid',
      },
      {
        processId: 'kitchen-sink',
        priority: 'must',
        reasonTemplate: '주방 동선 최적화를 위한 싱크대 위치 조정이 필요합니다',
        minLevel: 'high',
      },
      {
        processId: 'kitchen-cabinets',
        priority: 'recommended',
        reasonTemplate: '요리 동선을 고려한 수납장 배치가 필요합니다',
        minLevel: 'mid',
      },
    ],
  },

  // 내구성 강화
  {
    needsId: 'durability',
    processes: [
      {
        processId: 'living-flooring',
        priority: 'must',
        reasonTemplate: '내구성 높은 바닥재 교체가 필요합니다',
        minLevel: 'mid',
      },
      {
        processId: 'kitchen-countertop',
        priority: 'must',
        reasonTemplate: '내구성 및 내열성 높은 상판 교체가 필요합니다',
        minLevel: 'mid',
      },
      {
        processId: 'bathroom-floor',
        priority: 'recommended',
        reasonTemplate: '내구성 높은 욕실 타일 교체를 권장합니다',
        minLevel: 'high',
      },
    ],
  },

  // 청소/관리 편의성
  {
    needsId: 'maintenance',
    processes: [
      {
        processId: 'bathroom-ventilation',
        priority: 'must',
        reasonTemplate: '곰팡이 방지를 위한 환기팬 설치가 필수입니다',
        minLevel: 'mid',
      },
      {
        processId: 'bathroom-wall',
        priority: 'must',
        reasonTemplate: '곰팡이 방지 타일 교체가 필요합니다',
        minLevel: 'high',
      },
      {
        processId: 'kitchen-wall',
        priority: 'must',
        reasonTemplate: '기름때 청소가 쉬운 타일 시공이 필요합니다',
        minLevel: 'mid',
      },
      {
        processId: 'kitchen-hood',
        priority: 'recommended',
        reasonTemplate: '환기 개선을 위한 후드 교체를 권장합니다',
        minLevel: 'mid',
      },
      {
        processId: 'bathroom-waterproof',
        priority: 'must',
        reasonTemplate: '누수 및 곰팡이 방지를 위한 방수 작업이 필요합니다',
        minLevel: 'high',
      },
    ],
  },

  // 채광·밝기 향상
  {
    needsId: 'brightness',
    processes: [
      {
        processId: 'living-lighting',
        priority: 'must',
        reasonTemplate: '밝기 개선을 위한 조명 보강이 필요합니다',
        minLevel: 'mid',
      },
      {
        processId: 'living-wallpaper',
        priority: 'recommended',
        reasonTemplate: '밝은 톤의 도배로 공간을 밝게 만들 수 있습니다',
        minLevel: 'high',
      },
      {
        processId: 'bathroom-lighting',
        priority: 'recommended',
        reasonTemplate: '욕실 조명 보강을 권장합니다',
        minLevel: 'mid',
      },
      {
        processId: 'kitchen-lighting',
        priority: 'must',
        reasonTemplate: '주방 작업 조명 보강이 필요합니다',
        minLevel: 'high',
      },
    ],
  },
];

// ============ 공정 우선순위 계산 헬퍼 ============

export function getProcessPriority(priority: 'must' | 'recommended' | 'optional'): number {
  const priorityMap = {
    must: 1,
    recommended: 2,
    optional: 3,
  };
  return priorityMap[priority];
}

export function getProcessById(processId: string): ProcessDefinition | undefined {
  return CORE_PROCESSES.find((p) => p.id === processId);
}

export function getProcessesByCategory(category: 'bathroom' | 'living' | 'kitchen'): ProcessDefinition[] {
  return CORE_PROCESSES.filter((p) => p.category === category);
}




















