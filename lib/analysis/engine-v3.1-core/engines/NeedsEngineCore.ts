/**
 * V3.1 Core Edition - Needs Engine Core
 * 
 * CoreInput → NeedsResult 변환
 * 
 * 핵심 기능:
 * - 6개 Core Needs 계산
 * - explicit (명시적) / inferred (추론) Needs 처리
 * - 매핑 규칙 기반 자동 계산
 * - 설명 가능한 이유 생성
 */

import { CoreInput } from '../types/input';
import { NeedScore, NeedsResult, NeedsLevel, NeedsSource, NeedsId } from '../types/needs';
import { CORE_NEEDS_DEFINITIONS, NEEDS_EXPLANATION_TEMPLATES } from '../config/needs-definitions';
import {
  SOFT_INPUT_MAPPING_RULES,
  HARD_INPUT_MAPPING_RULES,
  ROOMS_MAPPING_RULES,
  NeedsMapping,
} from '../config/mapping-rules';

// ============ Needs Engine Core ============

export class NeedsEngineCore {
  /**
   * CoreInput → NeedsResult 변환 (메인 함수)
   */
  analyze(input: CoreInput): NeedsResult {
    console.log('🧠 [NeedsEngineCore] Needs 계산 시작');

    const needsMap = new Map<NeedsId, NeedScore>();
    const appliedRules: string[] = [];

    // 1. SoftInput 기반 Needs 계산
    this.processSoftInputRules(input, needsMap, appliedRules);

    // 2. HardInput 기반 Needs 계산
    this.processHardInputRules(input, needsMap, appliedRules);

    // 3. Rooms 기반 Needs 계산
    this.processRoomsRules(input, needsMap, appliedRules);

    // 4. Inferred Needs 자동 활성화
    this.activateInferredNeeds(input, needsMap, appliedRules);

    // 5. Needs 통합 및 강도 조정
    const finalNeeds = this.consolidateNeeds(needsMap);

    console.log('✅ [NeedsEngineCore] Needs 계산 완료:', finalNeeds.length);

    return {
      needs: finalNeeds,
      timestamp: new Date().toISOString(),
      debug: {
        inputSnapshot: {
          pyeong: input.hard.pyeong,
          familyCount: input.soft.family.count,
          hasInfant: input.soft.family.hasInfant,
          hasElderly: input.soft.family.hasElderly,
          hasPet: input.soft.family.hasPet,
          buildingAge: input.hard.building.age,
        },
        appliedRules,
      },
    };
  }

  // ============ SoftInput 규칙 처리 ============

  private processSoftInputRules(
    input: CoreInput,
    needsMap: Map<NeedsId, NeedScore>,
    appliedRules: string[]
  ): void {
    const { soft } = input;

    // 가족 구성 규칙
    if (soft.family.hasInfant) {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.family.hasInfant,
        needsMap,
        appliedRules,
        'SoftInput: 영유아 있음'
      );
    }

    if (soft.family.hasElderly) {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.family.hasElderly,
        needsMap,
        appliedRules,
        'SoftInput: 고령자 동거'
      );
    }

    if (soft.family.hasPet) {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.family.hasPet,
        needsMap,
        appliedRules,
        'SoftInput: 반려동물 있음'
      );
    }

    // 생활 루틴 규칙
    if (soft.lifestyle.hasRemoteWork) {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.lifestyle.remoteWork,
        needsMap,
        appliedRules,
        'SoftInput: 재택근무'
      );
    }

    if (soft.lifestyle.timeAtHome === 'high') {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.lifestyle.timeAtHome,
        needsMap,
        appliedRules,
        'SoftInput: 집에 머무는 시간 많음'
      );
    }

    // 주방 패턴 규칙
    if (soft.kitchen.cookingFrequency === 'often') {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.kitchen.cookingFrequency,
        needsMap,
        appliedRules,
        'SoftInput: 요리 자주 함'
      );
    }

    if (soft.kitchen.oilyCooking === 'high') {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.kitchen.oilyCooking,
        needsMap,
        appliedRules,
        'SoftInput: 기름 요리 많음'
      );
    }

    // 수납 패턴 규칙
    if (soft.storage.storageNeeds === 'high') {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.storage.storageNeeds.filter((r) => r.check.includes('high')),
        needsMap,
        appliedRules,
        'SoftInput: 수납 많이 필요'
      );
    } else if (soft.storage.storageNeeds === 'medium') {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.storage.storageNeeds.filter((r) => r.check.includes('medium')),
        needsMap,
        appliedRules,
        'SoftInput: 수납 보통'
      );
    }

    if (soft.storage.organizationStress === 'high') {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.storage.organizationStress,
        needsMap,
        appliedRules,
        'SoftInput: 정리 스트레스 높음'
      );
    }

    // 청소 패턴 규칙
    if (soft.cleaning.maintenanceStress === 'high') {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.cleaning.maintenanceStress,
        needsMap,
        appliedRules,
        'SoftInput: 관리 스트레스 높음'
      );
    }

    // 조명 선호 규칙
    if (soft.lighting.overallBrightness === 'bright') {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.lighting.brightness,
        needsMap,
        appliedRules,
        'SoftInput: 밝은 공간 선호'
      );
    }

    if (soft.lighting.brightnessComplaints && soft.lighting.brightnessComplaints.length > 0) {
      this.applyMappings(
        SOFT_INPUT_MAPPING_RULES.lighting.complaints,
        needsMap,
        appliedRules,
        `SoftInput: 밝기 불만 (${soft.lighting.brightnessComplaints.join(', ')})`
      );
    }
  }

  // ============ HardInput 규칙 처리 ============

  private processHardInputRules(
    input: CoreInput,
    needsMap: Map<NeedsId, NeedScore>,
    appliedRules: string[]
  ): void {
    const { hard } = input;

    // 건물 연식 규칙
    if (hard.building.age === 'old') {
      this.applyMappings(
        HARD_INPUT_MAPPING_RULES.buildingAge.old,
        needsMap,
        appliedRules,
        'HardInput: 구축 아파트 (15년 이상)'
      );
    }

    // 누수/곰팡이 이력
    if (hard.building.hasWaterDamage) {
      this.applyMappings(
        HARD_INPUT_MAPPING_RULES.waterDamage.hasWaterDamage,
        needsMap,
        appliedRules,
        'HardInput: 누수 이력 있음'
      );
    }

    if (hard.building.hasVentilationIssue) {
      this.applyMappings(
        HARD_INPUT_MAPPING_RULES.waterDamage.hasVentilationIssue,
        needsMap,
        appliedRules,
        'HardInput: 환기 문제 있음'
      );
    }

    // 층/채광 규칙
    if (hard.building.floor === 'low') {
      this.applyMappings(
        HARD_INPUT_MAPPING_RULES.floor.low,
        needsMap,
        appliedRules,
        'HardInput: 저층 - 채광 부족'
      );
    }
  }

  // ============ Rooms 규칙 처리 ============

  private processRoomsRules(
    input: CoreInput,
    needsMap: Map<NeedsId, NeedScore>,
    appliedRules: string[]
  ): void {
    const { rooms } = input;

    // 욕실 곰팡이 문제
    const hasBathroomMold = rooms.rooms.some(
      (r) => r.type === 'bathroom' && r.issues?.includes('곰팡이')
    );
    if (hasBathroomMold) {
      this.applyMappings(
        ROOMS_MAPPING_RULES.bathroomIssues.mold,
        needsMap,
        appliedRules,
        'Rooms: 욕실 곰팡이 문제'
      );
    }

    // 어두운 공간
    const hasDarkRooms = rooms.rooms.some((r) => r.issues?.includes('어두움'));
    if (hasDarkRooms) {
      this.applyMappings(
        ROOMS_MAPPING_RULES.bathroomIssues.dark,
        needsMap,
        appliedRules,
        'Rooms: 어두운 공간 있음'
      );
    }

    // 수납 부족
    const hasStorageShortage = rooms.rooms.some((r) => r.issues?.includes('수납 부족'));
    if (hasStorageShortage) {
      this.applyMappings(
        ROOMS_MAPPING_RULES.bathroomIssues.storageShortage,
        needsMap,
        appliedRules,
        'Rooms: 수납 부족 문제'
      );
    }
  }

  // ============ Inferred Needs 자동 활성화 ============

  private activateInferredNeeds(
    input: CoreInput,
    needsMap: Map<NeedsId, NeedScore>,
    appliedRules: string[]
  ): void {
    const { soft, hard } = input;

    // 영유아/고령자 → 안전성 강화 (자동)
    if (soft.family.hasInfant && !needsMap.has('safety')) {
      this.addOrUpgradeNeed(needsMap, {
        needsId: 'safety',
        level: 'high',
        source: 'inferred',
        reason: '영유아가 있어 안전성 강화 필수',
      });
      appliedRules.push('Inferred: 영유아 → 안전성 강화');
    }

    if (soft.family.hasElderly && !needsMap.has('safety')) {
      this.addOrUpgradeNeed(needsMap, {
        needsId: 'safety',
        level: 'high',
        source: 'inferred',
        reason: '고령자 동거로 안전성 강화 필수',
      });
      appliedRules.push('Inferred: 고령자 → 안전성 강화');
    }

    // 구축 20년 이상 + 욕실 문제 → 내구성/관리 강화
    if (hard.building.age === 'old' && hard.building.hasWaterDamage) {
      this.upgradeNeedLevel(needsMap, 'durability', 'high', 'inferred', '구축 + 누수 이력');
      this.upgradeNeedLevel(needsMap, 'maintenance', 'high', 'inferred', '구축 + 누수 이력');
      appliedRules.push('Inferred: 구축 + 누수 → 내구성/관리 강화');
    }
  }

  // ============ 매핑 적용 헬퍼 ============

  private applyMappings(
    conditions: readonly any[],
    needsMap: Map<NeedsId, NeedScore>,
    appliedRules: string[],
    ruleLabel: string
  ): void {
    conditions.forEach((condition) => {
      condition.mappings.forEach((mapping: NeedsMapping) => {
        this.addOrUpgradeNeed(needsMap, mapping);
      });
      appliedRules.push(ruleLabel);
    });
  }

  private addOrUpgradeNeed(needsMap: Map<NeedsId, NeedScore>, mapping: NeedsMapping): void {
    const existing = needsMap.get(mapping.needsId);

    if (!existing) {
      // 새로 추가
      needsMap.set(mapping.needsId, {
        id: mapping.needsId,
        level: mapping.level,
        category: CORE_NEEDS_DEFINITIONS[mapping.needsId].category,
        source: mapping.source,
        reasons: [mapping.reason],
      });
    } else {
      // 기존 Needs 강도 업그레이드
      const newLevel = this.mergeLevel(existing.level, mapping.level);
      existing.level = newLevel;
      existing.reasons.push(mapping.reason);
      // explicit이 하나라도 있으면 explicit으로
      if (mapping.source === 'explicit') {
        existing.source = 'explicit';
      }
    }
  }

  private upgradeNeedLevel(
    needsMap: Map<NeedsId, NeedScore>,
    needsId: NeedsId,
    targetLevel: NeedsLevel,
    source: NeedsSource,
    reason: string
  ): void {
    const existing = needsMap.get(needsId);
    if (!existing) {
      needsMap.set(needsId, {
        id: needsId,
        level: targetLevel,
        category: CORE_NEEDS_DEFINITIONS[needsId].category,
        source,
        reasons: [reason],
      });
    } else {
      existing.level = this.mergeLevel(existing.level, targetLevel);
      existing.reasons.push(reason);
    }
  }

  private mergeLevel(level1: NeedsLevel, level2: NeedsLevel): NeedsLevel {
    // High > Mid > Low 우선순위
    const priority = { high: 3, mid: 2, low: 1 };
    return priority[level1] >= priority[level2] ? level1 : level2;
  }

  // ============ Needs 통합 ============

  private consolidateNeeds(needsMap: Map<NeedsId, NeedScore>): NeedScore[] {
    const needs = Array.from(needsMap.values());

    // 카테고리별 우선순위 정렬: safety > lifestyle > aesthetic
    const categoryPriority = { safety: 1, lifestyle: 2, aesthetic: 3 };
    
    needs.sort((a, b) => {
      const catA = categoryPriority[a.category];
      const catB = categoryPriority[b.category];
      if (catA !== catB) return catA - catB;
      
      // 같은 카테고리 내에서는 level 우선: high > mid > low
      const levelPriority = { high: 3, mid: 2, low: 1 };
      return levelPriority[b.level] - levelPriority[a.level];
    });

    return needs;
  }
}

