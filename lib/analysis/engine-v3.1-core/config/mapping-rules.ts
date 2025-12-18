/**
 * V3.1 Core Edition - 매핑 규칙
 * 
 * Trait (성향/상태) → Needs 변환 규칙을 정의합니다.
 * 설정 기반으로 관리하여 확장 및 튜닝이 용이합니다.
 */

import { NeedsId, NeedsLevel, NeedsSource } from '../types/needs';

// ============ 매핑 규칙 타입 ============

export interface NeedsMapping {
  /** 대상 Needs ID */
  needsId: NeedsId;
  /** 강도 */
  level: NeedsLevel;
  /** 출처 */
  source: NeedsSource;
  /** 이유 (설명용) */
  reason: string;
}

export interface MappingCondition {
  /** 조건 설명 */
  description: string;
  /** 체크 함수 (실제 구현 시 사용) */
  check: string;  // 함수 이름 또는 조건식
  /** 결과 매핑 */
  mappings: NeedsMapping[];
}

// ============ SoftInput 기반 매핑 규칙 ============

export const SOFT_INPUT_MAPPING_RULES = {
  // 가족 구성 관련
  family: {
    hasInfant: [
      {
        description: '영유아가 있는 경우 안전성이 최우선',
        check: 'soft.family.hasInfant === true',
        mappings: [
          {
            needsId: 'safety',
            level: 'high',
            source: 'inferred',
            reason: '영유아가 있어 낙상 및 미끄러짐 위험 대응 필요',
          },
          {
            needsId: 'storage',
            level: 'mid',
            source: 'inferred',
            reason: '육아용품 및 장난감 수납 필요',
          },
        ],
      },
    ],
    
    hasElderly: [
      {
        description: '고령자 동거 시 안전성 필수',
        check: 'soft.family.hasElderly === true',
        mappings: [
          {
            needsId: 'safety',
            level: 'high',
            source: 'inferred',
            reason: '고령자 안전을 위한 미끄럼 방지 및 손잡이 필요',
          },
          {
            needsId: 'maintenance',
            level: 'mid',
            source: 'inferred',
            reason: '청소 및 관리 부담 최소화 필요',
          },
        ],
      },
    ],
    
    hasPet: [
      {
        description: '반려동물 있을 시 내구성 및 청소 편의성 중요',
        check: 'soft.family.hasPet === true',
        mappings: [
          {
            needsId: 'durability',
            level: 'high',
            source: 'explicit',
            reason: '반려동물로 인한 긁힘 및 마모 대응 필요',
          },
          {
            needsId: 'maintenance',
            level: 'high',
            source: 'explicit',
            reason: '털 및 오염 관리를 위한 청소 편의성 필요',
          },
        ],
      },
    ],
  },
  
  // 생활 루틴 관련
  lifestyle: {
    remoteWork: [
      {
        description: '재택근무 시 동선 및 채광 중요',
        check: 'soft.lifestyle.hasRemoteWork === true',
        mappings: [
          {
            needsId: 'flow',
            level: 'high',
            source: 'explicit',
            reason: '재택근무로 집 안 동선 효율이 중요',
          },
          {
            needsId: 'brightness',
            level: 'mid',
            source: 'explicit',
            reason: '장시간 실내 생활로 채광 및 밝기 중요',
          },
        ],
      },
    ],
    
    timeAtHome: [
      {
        description: '집에 머무는 시간이 많을 때',
        check: 'soft.lifestyle.timeAtHome === "high"',
        mappings: [
          {
            needsId: 'maintenance',
            level: 'mid',
            source: 'explicit',
            reason: '집에 오래 있어 청소/관리 편의성 중요',
          },
          {
            needsId: 'brightness',
            level: 'mid',
            source: 'explicit',
            reason: '실내 체류 시간이 길어 쾌적한 밝기 필요',
          },
        ],
      },
    ],
  },
  
  // 주방 패턴 관련
  kitchen: {
    cookingFrequency: [
      {
        description: '요리를 자주 하는 경우',
        check: 'soft.kitchen.cookingFrequency === "often"',
        mappings: [
          {
            needsId: 'flow',
            level: 'high',
            source: 'explicit',
            reason: '요리 빈도가 높아 주방 동선 최적화 필요',
          },
          {
            needsId: 'maintenance',
            level: 'mid',
            source: 'explicit',
            reason: '요리 후 청소 편의성 중요',
          },
        ],
      },
    ],
    
    oilyCooking: [
      {
        description: '기름 요리가 많은 경우',
        check: 'soft.kitchen.oilyCooking === "high"',
        mappings: [
          {
            needsId: 'maintenance',
            level: 'high',
            source: 'explicit',
            reason: '기름때 청소가 쉬운 마감재 필요',
          },
        ],
      },
    ],
  },
  
  // 수납 패턴 관련
  storage: {
    storageNeeds: [
      {
        description: '수납이 많이 필요한 경우',
        check: 'soft.storage.storageNeeds === "high"',
        mappings: [
          {
            needsId: 'storage',
            level: 'high',
            source: 'explicit',
            reason: '생활용품 및 계절용품 수납 공간 확보 필요',
          },
        ],
      },
      {
        description: '수납이 보통인 경우',
        check: 'soft.storage.storageNeeds === "medium"',
        mappings: [
          {
            needsId: 'storage',
            level: 'mid',
            source: 'explicit',
            reason: '기본적인 수납 공간 확보 필요',
          },
        ],
      },
    ],
    
    organizationStress: [
      {
        description: '정리 스트레스가 높은 경우',
        check: 'soft.storage.organizationStress === "high"',
        mappings: [
          {
            needsId: 'storage',
            level: 'high',
            source: 'explicit',
            reason: '정리 스트레스 해소를 위한 체계적 수납 필요',
          },
          {
            needsId: 'maintenance',
            level: 'mid',
            source: 'explicit',
            reason: '정돈 및 관리가 쉬운 구조 필요',
          },
        ],
      },
    ],
  },
  
  // 청소 패턴 관련
  cleaning: {
    maintenanceStress: [
      {
        description: '관리 스트레스가 높은 경우',
        check: 'soft.cleaning.maintenanceStress === "high"',
        mappings: [
          {
            needsId: 'maintenance',
            level: 'high',
            source: 'explicit',
            reason: '청소 및 관리가 쉬운 마감재 필요',
          },
        ],
      },
    ],
  },
  
  // 조명 선호 관련
  lighting: {
    brightness: [
      {
        description: '밝은 공간 선호',
        check: 'soft.lighting.overallBrightness === "bright"',
        mappings: [
          {
            needsId: 'brightness',
            level: 'high',
            source: 'explicit',
            reason: '밝은 공간 선호로 조명 및 채광 개선 필요',
          },
        ],
      },
    ],
    
    complaints: [
      {
        description: '특정 공간 밝기 불만',
        check: 'soft.lighting.brightnessComplaints && soft.lighting.brightnessComplaints.length > 0',
        mappings: [
          {
            needsId: 'brightness',
            level: 'high',
            source: 'explicit',
            reason: '특정 공간의 어두움 문제 개선 필요',
          },
        ],
      },
    ],
  },
} as const;

// ============ HardInput 기반 매핑 규칙 ============

export const HARD_INPUT_MAPPING_RULES = {
  // 건물 연식 관련
  buildingAge: {
    old: [
      {
        description: '15년 이상 구축 아파트',
        check: 'hard.building.age === "old"',
        mappings: [
          {
            needsId: 'durability',
            level: 'high',
            source: 'inferred',
            reason: '구축 아파트로 설비 및 마감재 내구성 보강 필요',
          },
          {
            needsId: 'maintenance',
            level: 'mid',
            source: 'inferred',
            reason: '노후화로 인한 관리 편의성 개선 필요',
          },
        ],
      },
    ],
  },
  
  // 누수/곰팡이 이력
  waterDamage: {
    hasWaterDamage: [
      {
        description: '누수 이력 있음',
        check: 'hard.building.hasWaterDamage === true',
        mappings: [
          {
            needsId: 'maintenance',
            level: 'high',
            source: 'inferred',
            reason: '누수 재발 방지 및 관리 편의성 필요',
          },
          {
            needsId: 'durability',
            level: 'mid',
            source: 'inferred',
            reason: '방수 및 내구성 보강 필요',
          },
        ],
      },
    ],
    
    hasVentilationIssue: [
      {
        description: '환기 문제 있음',
        check: 'hard.building.hasVentilationIssue === true',
        mappings: [
          {
            needsId: 'maintenance',
            level: 'high',
            source: 'inferred',
            reason: '곰팡이 및 습기 문제 해결 필요',
          },
        ],
      },
    ],
  },
  
  // 층/채광 관련
  floor: {
    low: [
      {
        description: '저층 - 채광 부족',
        check: 'hard.building.floor === "low"',
        mappings: [
          {
            needsId: 'brightness',
            level: 'high',
            source: 'inferred',
            reason: '저층으로 채광 개선 및 조명 보강 필요',
          },
        ],
      },
    ],
  },
} as const;

// ============ Rooms 기반 매핑 규칙 ============

export const ROOMS_MAPPING_RULES = {
  // 욕실 곰팡이 문제
  bathroomIssues: {
    mold: [
      {
        description: '욕실 곰팡이 문제',
        check: 'rooms.rooms.some(r => r.type === "bathroom" && r.issues?.includes("곰팡이"))',
        mappings: [
          {
            needsId: 'maintenance',
            level: 'high',
            source: 'explicit',
            reason: '욕실 곰팡이 문제 해결 및 관리 편의성 필요',
          },
          {
            needsId: 'safety',
            level: 'mid',
            source: 'inferred',
            reason: '곰팡이로 인한 위생 및 건강 문제 대응',
          },
        ],
      },
    ],
    
    dark: [
      {
        description: '특정 공간 어두움',
        check: 'rooms.rooms.some(r => r.issues?.includes("어두움"))',
        mappings: [
          {
            needsId: 'brightness',
            level: 'high',
            source: 'explicit',
            reason: '어두운 공간의 조명 및 채광 개선 필요',
          },
        ],
      },
    ],
    
    storageShortage: [
      {
        description: '수납 부족 문제',
        check: 'rooms.rooms.some(r => r.issues?.includes("수납 부족"))',
        mappings: [
          {
            needsId: 'storage',
            level: 'high',
            source: 'explicit',
            reason: '수납 공간 확보 필요',
          },
        ],
      },
    ],
  },
} as const;





















