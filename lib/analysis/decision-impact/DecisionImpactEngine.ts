/**
 * 인테리봇 성향분석 엔진 개편 - 결정 영향 엔진
 * 
 * 명세서 vFinal 기준
 * - 성향 점수 → 결정 변화로 변환
 * - AI가 실제로 간섭하는 유일한 출력 계층
 */

import type { PreferenceCategory } from '../questions/types';
import type { SpaceInfo } from '../types';
import type {
  TraitEvaluation,
  TraitLevel,
  DecisionSummary,
  DecisionImpactInput,
  DecisionImpactOutput,
  TraitImpactRule,
  PriorityGroup,
  RequestionTrigger,
} from './types';
import { PREFERENCE_CATEGORIES } from '../questions/types';
import { traitImpactMap, validateTraitImpactMap } from './traitImpactMap';
import { traitToPriorityGroup, traitPriorityOrder, isHigherPriority } from './traitPriority';
import { canForceProcess } from './matchers';
import {
  getProcessExcludeDescription,
  getOptionDefaultDescription,
  getOptionExcludeDescription,
  generateCoreCriteriaSentences,
} from './descriptionMaps';

// ============================================
// 1. 레벨 파생 함수
// ============================================

/**
 * 점수로부터 레벨 파생
 * 명세서 고정 규칙:
 * - score >= 7 → HIGH
 * - score <= 4 → LOW
 * - else → MID
 */
function deriveLevel(score: number): TraitLevel {
  if (score >= 7) return 'HIGH';
  if (score <= 4) return 'LOW';
  return 'MID';
}

// ============================================
// 2. TraitEvaluation 생성
// ============================================

/**
 * 모든 카테고리에 대해 TraitEvaluation 생성
 * 명세서 STEP 2-1: 누락 시 즉시 FAIL
 */
function createTraitEvaluations(
  scores: Record<PreferenceCategory, number>,
  evidenceCounts: Record<PreferenceCategory, number>
): Record<PreferenceCategory, TraitEvaluation> {
  const evaluations: Record<PreferenceCategory, TraitEvaluation> = {} as any;

  for (const category of PREFERENCE_CATEGORIES as readonly PreferenceCategory[]) {
    // 명세서 STEP 2-1: 누락 시 즉시 FAIL
    if (scores[category] === undefined) {
      throw new Error(`TraitEvaluation 누락: ${category}의 score가 없습니다.`);
    }
    if (evidenceCounts[category] === undefined) {
      throw new Error(`TraitEvaluation 누락: ${category}의 evidenceCount가 없습니다.`);
    }
    
    evaluations[category] = {
      score: scores[category],
      evidenceCount: evidenceCounts[category],
      level: deriveLevel(scores[category]),
    };
  }

  return evaluations;
}

// ============================================
// 3. 단독 영향 폐기 성향 확인
// ============================================

/**
 * 단독 영향 폐기 성향 목록
 * 이 성향들은 HIGH/LOW가 null이므로 결정 변화 생성 금지
 */
const DISABLED_TRAITS: PreferenceCategory[] = [
  'space_sense',
  'life_routine',
  'hobby_lifestyle',
];

function isDisabledTrait(category: PreferenceCategory): boolean {
  return DISABLED_TRAITS.includes(category);
}

// ============================================
// 4. 룰 적용 결과 타입
// ============================================

interface RuleApplicationResult {
  processIncludes: Set<string>;
  processExcludes: Set<string>;
  optionDefaults: Set<string>;
  optionExcludes: Set<string>;
  riskMessages: string[];
  appliedCategories: PreferenceCategory[];
  forceProcessFailedCategories: PreferenceCategory[];  // 공정 강제 실패한 카테고리
}

// ============================================
// 5. DecisionImpactEngine 클래스
// ============================================

export class DecisionImpactEngine {
  /**
   * 메인 실행 함수
   * 
   * 명세서 실행 순서:
   * 1. TraitEvaluation 생성
   * 2. traitImpactMap에서 룰 로드
   * 3. null 룰 체크 (단독 영향 폐기)
   * 4. 우선순위 그룹 순서대로 정렬
   * 5. 각 룰 적용 (canForceProcess 검사 포함)
   * 6. 충돌 해결
   * 7. appliedChanges/risks 생성
   * 8. coreCriteria 생성
   * 9. excludedItems 생성
   * 10. 증폭 인자 적용
   */
  execute(input: DecisionImpactInput): DecisionImpactOutput {
    // ============================================
    // FAIL-FAST 검증 (명세서 10-1)
    // ============================================
    
    // 1. traitImpactMap이 모든 성향을 포함하는지
    validateTraitImpactMap();
    
    // 2. priorityGroup 누락 검증
    for (const category of PREFERENCE_CATEGORIES as readonly PreferenceCategory[]) {
      const definition = traitImpactMap[category];
      if (!definition) {
        throw new Error(`traitImpactMap에 ${category}가 없습니다`);
      }
      if (!definition.priorityGroup) {
        throw new Error(`${category}의 priorityGroup이 없습니다`);
      }
    }
    
    // 3. TraitEvaluation 생성
    const traitEvaluations = createTraitEvaluations(
      input.scores,
      input.evidenceCounts
    );
    
    // 4. evidenceCount가 전반적으로 너무 낮은지 경고 (명세서 10-2)
    const lowEvidenceCount = PREFERENCE_CATEGORIES.filter(
      (cat): cat is PreferenceCategory => traitEvaluations[cat as PreferenceCategory].evidenceCount < 2
    );
    if (lowEvidenceCount.length > PREFERENCE_CATEGORIES.length / 2) {
      console.warn('⚠️ [DecisionImpactEngine] evidenceCount가 전반적으로 낮음:', {
        lowEvidenceCount: lowEvidenceCount.length,
        totalCategories: PREFERENCE_CATEGORIES.length,
      });
    }

    // 2. 룰 적용 결과 초기화
    const result: RuleApplicationResult = {
      processIncludes: new Set(),
      processExcludes: new Set(),
      optionDefaults: new Set(),
      optionExcludes: new Set(),
      riskMessages: [],
      appliedCategories: [],
      forceProcessFailedCategories: [],
    };

    // 3. 우선순위 그룹 순서대로 정렬된 카테고리 목록 생성
    const sortedCategories = this.sortByPriority(traitEvaluations);

    // 4. 각 룰 적용
    for (const category of sortedCategories) {
      // 단독 영향 폐기 성향은 건너뛰기
      if (isDisabledTrait(category)) {
        continue;
      }

      const evaluation = traitEvaluations[category];
      const definition = traitImpactMap[category];

      // 룰이 없으면 건너뛰기
      if (!definition) {
        throw new Error(`traitImpactMap에 ${category}가 없습니다`);
      }

      // 명세서 STEP 2-3: HIGH만 처리 (MID, LOW는 결정 변화 생성 금지)
      if (evaluation.level !== 'HIGH') {
        continue;
      }

      // HIGH 레벨 룰 선택
      const rule = definition.HIGH;

      // 룰이 null이면 건너뛰기 (단독 영향 폐기)
      if (!rule) {
        continue;
      }

      // 룰 적용
      this.applyRule(
        category,
        evaluation,
        rule,
        definition.priorityGroup,
        input.spaceInfo,
        input.discomfortDetail,
        result
      );
    }

    // 5. 충돌 해결
    this.resolveConflicts(result, traitEvaluations);

    // 6. 재질문 트리거 검사 (명세서 규칙 8)
    const requestionTrigger = this.checkRequestionTrigger(
      traitEvaluations,
      result,
      input.spaceInfo,
      input.discomfortDetail
    );

    // 7. 결정 요약 생성
    // 명세서 6-1: 증폭 인자는 appliedChanges 생성 직전에 적용됨 (generateDecisionSummary 내부)
    const decisionSummary = this.generateDecisionSummary(
      result,
      traitEvaluations,
      input.spaceInfo
    );

    return {
      decisionSummary,
      traitEvaluations,
      ...(requestionTrigger.needsRequestion && { requestionTrigger }),
    };
  }

  /**
   * 우선순위 그룹 순서대로 카테고리 정렬
   * 명세서 STEP 2-4: priorityGroup → evidenceCount 내림차순 → 정의 순서
   */
  private sortByPriority(
    evaluations: Record<PreferenceCategory, TraitEvaluation>
  ): PreferenceCategory[] {
    // HIGH 레벨만 필터링 (명세서 STEP 2-3: HIGH만 처리)
    const highCategories = PREFERENCE_CATEGORIES.filter((cat): cat is PreferenceCategory => {
      const category = cat as PreferenceCategory;
      if (isDisabledTrait(category)) return false;
      return evaluations[category].level === 'HIGH';
    });

    return highCategories.sort((a, b) => {
      const groupA = traitToPriorityGroup[a];
      const groupB = traitToPriorityGroup[b];
      
      const orderA = traitPriorityOrder.indexOf(groupA);
      const orderB = traitPriorityOrder.indexOf(groupB);
      
      // 1. 우선순위가 높은 그룹이 먼저 (safety가 가장 높음)
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // 2. 동일 그룹 내에서는 evidenceCount 내림차순 (명세서 요구)
      const evidenceA = evaluations[a].evidenceCount;
      const evidenceB = evaluations[b].evidenceCount;
      if (evidenceA !== evidenceB) {
        return evidenceB - evidenceA; // 내림차순
      }
      
      // 3. 그래도 동일하면 정의 순서 유지 (랜덤성 방지)
      // PREFERENCE_CATEGORIES의 순서를 유지
      const indexA = PREFERENCE_CATEGORIES.indexOf(a);
      const indexB = PREFERENCE_CATEGORIES.indexOf(b);
      return indexA - indexB;
    });
  }

  /**
   * 룰 적용
   * 
   * 명세서 규칙:
   * - allow.forceProcess가 true이면 canForceProcess 검사
   * - 실패 시 processIncludes/processExcludes는 적용하지 않음
   * - 옵션만 가능하면 옵션만 적용
   */
  private applyRule(
    category: PreferenceCategory,
    evaluation: TraitEvaluation,
    rule: TraitImpactRule,
    priorityGroup: PriorityGroup,
    spaceInfo: SpaceInfo | null | undefined,
    discomfortDetail: string[] | undefined,
    result: RuleApplicationResult
  ): void {
    // 공정 강제 검사
    let canApplyProcess = true;
    
    if (rule.allow.forceProcess) {
      // canForceProcess 검사
      canApplyProcess = canForceProcess(
        evaluation,
        spaceInfo,
        discomfortDetail
      );

      // FAIL-FAST: 공정 강제가 canForceProcess를 무시하고 적용되면 FAIL
      if (!canApplyProcess && (rule.impacts.processIncludes || rule.impacts.processExcludes)) {
        // 공정 강제 실패 기록 (재질문 트리거용)
        result.forceProcessFailedCategories.push(category);
        
        // 공정 강제 실패 → 옵션만 적용 가능하면 옵션만 적용
        if (!rule.allow.defaultOptions && !rule.allow.excludeOptions) {
          // 옵션도 적용 불가면 건너뛰기
          return;
        }
        // 공정은 적용하지 않음 (옵션만 적용)
      }
    }
    
    // FAIL-FAST: 공정 강제가 canForceProcess를 무시하고 적용되는지 최종 확인
    if (!canApplyProcess && rule.allow.forceProcess) {
      // 공정 관련 impacts는 적용하지 않음 (이미 위에서 처리됨)
    }

    // 공정 포함/제외 적용
    if (canApplyProcess && rule.allow.forceProcess) {
      if (rule.impacts.processIncludes) {
        rule.impacts.processIncludes.forEach(code => {
          result.processIncludes.add(code);
        });
      }
      if (rule.impacts.processExcludes) {
        rule.impacts.processExcludes.forEach(code => {
          result.processExcludes.add(code);
        });
      }
    }

    // 옵션 기본값 적용
    if (rule.allow.defaultOptions && rule.impacts.optionDefaults) {
      rule.impacts.optionDefaults.forEach(code => {
        result.optionDefaults.add(code);
      });
    }

    // 옵션 제외 적용
    if (rule.allow.excludeOptions && rule.impacts.optionExcludes) {
      rule.impacts.optionExcludes.forEach(code => {
        result.optionExcludes.add(code);
      });
    }

    // 리스크 메시지 추가
    if (rule.impacts.riskMessage) {
      result.riskMessages.push(rule.impacts.riskMessage);
    }

    // 적용된 카테고리 기록
    result.appliedCategories.push(category);
  }

  /**
   * 충돌 해결
   * 
   * 명세서 규칙 5-2:
   * 1. priorityGroup 상위 승리
   * 2. 동일 그룹 → evidenceCount 높은 쪽 승리
   * 3. 그래도 동일 → exclude 우선
   */
  private resolveConflicts(
    result: RuleApplicationResult,
    evaluations: Record<PreferenceCategory, TraitEvaluation>
  ): void {
    // optionDefaults와 optionExcludes 충돌 해결
    const conflicts: string[] = [];
    
    for (const code of result.optionDefaults) {
      if (result.optionExcludes.has(code)) {
        conflicts.push(code);
      }
    }

    // processIncludes와 processExcludes 충돌 해결
    for (const code of result.processIncludes) {
      if (result.processExcludes.has(code)) {
        conflicts.push(`PROCESS:${code}`);
      }
    }

    for (const conflictKey of conflicts) {
      const isProcess = conflictKey.startsWith('PROCESS:');
      const code = isProcess ? conflictKey.replace('PROCESS:', '') : conflictKey;

      // 충돌하는 카테고리 찾기
      let defaultCategory: PreferenceCategory | undefined;
      let excludeCategory: PreferenceCategory | undefined;

      if (isProcess) {
        // 공정 충돌
        defaultCategory = result.appliedCategories.find(cat => {
          const category = cat as PreferenceCategory;
          const traitEval = evaluations[category];
          const def = traitImpactMap[category];
          const rule = def.HIGH; // HIGH만 처리하므로
          return rule?.impacts.processIncludes?.includes(code);
        });

        excludeCategory = result.appliedCategories.find(cat => {
          const category = cat as PreferenceCategory;
          const traitEval = evaluations[category];
          const def = traitImpactMap[category];
          const rule = def.HIGH; // HIGH만 처리하므로
          return rule?.impacts.processExcludes?.includes(code);
        });
      } else {
        // 옵션 충돌
        defaultCategory = result.appliedCategories.find(cat => {
          const category = cat as PreferenceCategory;
          const traitEval = evaluations[category];
          const def = traitImpactMap[category];
          const rule = def.HIGH; // HIGH만 처리하므로
          return rule?.impacts.optionDefaults?.includes(code);
        });

        excludeCategory = result.appliedCategories.find(cat => {
          const category = cat as PreferenceCategory;
          const traitEval = evaluations[category];
          const def = traitImpactMap[category];
          const rule = def.HIGH; // HIGH만 처리하므로
          return rule?.impacts.optionExcludes?.includes(code);
        });
      }

      if (defaultCategory && excludeCategory) {
        const defaultGroup = traitToPriorityGroup[defaultCategory];
        const excludeGroup = traitToPriorityGroup[excludeCategory];
        const defaultEvidence = evaluations[defaultCategory].evidenceCount;
        const excludeEvidence = evaluations[excludeCategory].evidenceCount;

        // 명세서 규칙 5-2: 충돌 해결 우선순위
        let shouldKeepDefault = false;
        let shouldKeepExclude = false;

        // 1. priorityGroup 상위 승리
        if (isHigherPriority(defaultGroup, excludeGroup)) {
          shouldKeepDefault = true;
        } else if (isHigherPriority(excludeGroup, defaultGroup)) {
          shouldKeepExclude = true;
        } else {
          // 2. 동일 그룹 → evidenceCount 높은 쪽 승리
          if (defaultEvidence > excludeEvidence) {
            shouldKeepDefault = true;
          } else if (excludeEvidence > defaultEvidence) {
            shouldKeepExclude = true;
          } else {
            // 3. 그래도 동일 → exclude 우선 (보수적 판단)
            shouldKeepExclude = true;
          }
        }

        // 충돌 해결 적용
        if (isProcess) {
          if (shouldKeepDefault) {
            result.processExcludes.delete(code);
          } else {
            result.processIncludes.delete(code);
          }
        } else {
          if (shouldKeepDefault) {
            result.optionExcludes.delete(code);
          } else {
            result.optionDefaults.delete(code);
          }
        }
      }
    }
  }

  /**
   * 결정 요약 생성
   * 
   * FAIL-FAST 검증:
   * - 단독 영향 폐기 성향이 appliedChanges를 생성하려고 시도하면 FAIL
   * - appliedChanges/risks가 빈 배열이면 FAIL 처리 또는 재질문 트리거
   */
  private generateDecisionSummary(
    result: RuleApplicationResult,
    evaluations: Record<PreferenceCategory, TraitEvaluation>,
    spaceInfo: SpaceInfo | null | undefined
  ): DecisionSummary {
    // FAIL-FAST: 단독 영향 폐기 성향이 appliedChanges를 생성하려고 시도했는지 확인
    for (const category of result.appliedCategories) {
      if (isDisabledTrait(category)) {
        throw new Error(
          `단독 영향 폐기 성향(${category})이 appliedChanges를 생성하려고 시도했습니다. ` +
          `이는 명세서 위반입니다.`
        );
      }
    }
    // appliedChanges 생성 (사람이 읽는 문장)
    // 명세서 7-2: 옵션/공정 코드명 직접 노출 ❌, "그래서 무엇이 달라졌는지" 서술
    let appliedChanges: string[] = [];

    // 공정 포함
    if (result.processIncludes.size > 0) {
      const processes = Array.from(result.processIncludes);
      for (const processCode of processes) {
        // 명세서 요구: 코드명 직접 노출 ❌, 문장으로 서술
        const description = `주요 공정으로 ${processCode}을(를) 포함했습니다.`;
        appliedChanges.push(description);
      }
    }

    // 공정 제외
    if (result.processExcludes.size > 0) {
      const processes = Array.from(result.processExcludes);
      for (const processCode of processes) {
        appliedChanges.push(getProcessExcludeDescription(processCode));
      }
    }

    // 옵션 기본값
    if (result.optionDefaults.size > 0) {
      const options = Array.from(result.optionDefaults);
      for (const optionCode of options) {
        appliedChanges.push(getOptionDefaultDescription(optionCode));
      }
    }

    // 옵션 제외
    if (result.optionExcludes.size > 0) {
      const options = Array.from(result.optionExcludes);
      for (const optionCode of options) {
        appliedChanges.push(getOptionExcludeDescription(optionCode));
      }
    }

    // 명세서 6-1: 증폭 인자 적용 (appliedChanges 생성 직전)
    appliedChanges = this.applyAmplifiersToChanges(appliedChanges, evaluations);

    // coreCriteria 생성 (2~3개)
    // 명세서 7-1: priorityGroup 상위에서 2~3개, 추상 단어 ❌, 결정 이유가 바로 보이는 문장
    const coreCriteria = this.generateCoreCriteria(
      result.appliedCategories,
      evaluations
    );

    // excludedItems 생성 (최소 1개는 포함)
    const excludedItems = this.generateExcludedItems(
      result,
      evaluations,
      spaceInfo
    );

    // risks 생성 (1~3개)
    const risks = result.riskMessages.slice(0, 3);

    // 명세서 8: appliedChanges가 비어 있음 → 즉시 FAIL
    if (appliedChanges.length === 0) {
      throw new Error('appliedChanges가 비어 있습니다. 재질문이 필요합니다.');
    }

    return {
      coreCriteria,
      appliedChanges,
      excludedItems: excludedItems.length > 0 ? excludedItems : ['가정/제외 항목 없음'],
      risks: risks.length > 0 ? risks : ['리스크 없음'],
    };
  }

  /**
   * coreCriteria 생성 (2~3개)
   * 명세서 7-1: priorityGroup 상위에서 2~3개, 추상 단어 ❌, 결정 이유가 바로 보이는 문장
   */
  private generateCoreCriteria(
    appliedCategories: PreferenceCategory[],
    evaluations: Record<PreferenceCategory, TraitEvaluation>
  ): string[] {
    // priorityGroup 상위에서 2~3개 선택
    // 우선순위 그룹 순서대로 정렬 (traitPriorityOrder 기준)
    const categoryGroups = appliedCategories.map(cat => ({
      category: cat,
      group: traitToPriorityGroup[cat],
      order: traitPriorityOrder.indexOf(traitToPriorityGroup[cat]),
    }));
    
    // 우선순위 그룹 순서대로 정렬
    categoryGroups.sort((a, b) => a.order - b.order);
    
    // 중복 제거하면서 상위 3개 그룹 선택
    const uniqueGroups: PriorityGroup[] = [];
    for (const item of categoryGroups) {
      if (!uniqueGroups.includes(item.group)) {
        uniqueGroups.push(item.group);
        if (uniqueGroups.length >= 3) break;
      }
    }

    // 명세서 요구: "결정 이유가 바로 보이는 문장" 생성
    const criteria = generateCoreCriteriaSentences(appliedCategories, uniqueGroups);

    // 2~3개로 제한
    return criteria.slice(0, 3);
  }

  /**
   * excludedItems 생성 (최소 1개는 포함)
   */
  private generateExcludedItems(
    result: RuleApplicationResult,
    evaluations: Record<PreferenceCategory, TraitEvaluation>,
    spaceInfo: SpaceInfo | null | undefined
  ): string[] {
    const excluded: string[] = [];

    // 제외된 옵션
    if (result.optionExcludes.size > 0) {
      const options = Array.from(result.optionExcludes);
      excluded.push(`제외된 옵션: ${options.join(', ')}`);
    }

    // 공정 제외
    if (result.processExcludes.size > 0) {
      const processes = Array.from(result.processExcludes);
      excluded.push(`제외된 공정: ${processes.join(', ')}`);
    }

    // 가정 항목 (spaceInfo 기반)
    if (spaceInfo) {
      if (!spaceInfo.totalPeople || spaceInfo.totalPeople < 2) {
        excluded.push('1인 가구로 가정');
      }
      if (!spaceInfo.ageRanges || spaceInfo.ageRanges.length === 0) {
        excluded.push('특수 연령대 없음으로 가정');
      }
    }

    // 최소 1개는 포함
    if (excluded.length === 0) {
      excluded.push('명시적 제외 항목 없음');
    }

    return excluded;
  }

  /**
   * 증폭 인자 적용 (문장 생성 시)
   * 명세서 6-1: 충돌 해결 이후, 공정 강제 판단 이후, appliedChanges 생성 직전
   * 명세서 6-3: 증폭 규칙 고정
   */
  private applyAmplifiersToChanges(
    appliedChanges: string[],
    evaluations: Record<PreferenceCategory, TraitEvaluation>
  ): string[] {
    const additionalChanges: string[] = [];

    // 명세서 6-3: space_sense HIGH && activity_flow HIGH
    if (
      evaluations.space_sense?.level === 'HIGH' &&
      evaluations.activity_flow?.level === 'HIGH'
    ) {
      additionalChanges.push('동선 최적화 기준을 강화했습니다.');
    }

    // 명세서 6-3: life_routine HIGH && cleaning_preference HIGH
    if (
      evaluations.life_routine?.level === 'HIGH' &&
      evaluations.cleaning_preference?.level === 'HIGH'
    ) {
      additionalChanges.push('유지관리 기준을 더 보수적으로 적용했습니다.');
    }

    // 추가 문장이 있으면 appliedChanges에 추가 (최대 1개만)
    if (additionalChanges.length > 0) {
      return [...appliedChanges, additionalChanges[0]];
    }

    return appliedChanges;
  }

  /**
   * 재질문 트리거 검사
   * 명세서 규칙 8: 재질문 트리거 (FAIL 아님)
   * 
   * 조건:
   * 1. evidenceCount 평균 < 1.5
   * 2. HIGH 성향 다수 + 공정 강제 전부 실패
   * 
   * → 결정 검증 질문 1~2개 생성
   */
  private checkRequestionTrigger(
    evaluations: Record<PreferenceCategory, TraitEvaluation>,
    result: RuleApplicationResult,
    spaceInfo: SpaceInfo | null | undefined,
    discomfortDetail: string[] | undefined
  ): RequestionTrigger {
    // 1. evidenceCount 평균 < 1.5 검사
    const totalEvidenceCount = PREFERENCE_CATEGORIES.reduce(
      (sum, cat) => sum + evaluations[cat as PreferenceCategory].evidenceCount,
      0
    );
    const avgEvidenceCount = totalEvidenceCount / PREFERENCE_CATEGORIES.length;

    if (avgEvidenceCount < 1.5) {
      return {
        needsRequestion: true,
        reason: 'low_evidence',
        validationQuestions: this.generateValidationQuestions(
          evaluations,
          'low_evidence'
        ),
      };
    }

    // 2. HIGH 성향 다수 + 공정 강제 전부 실패 검사
    const highCategories = PREFERENCE_CATEGORIES.filter(
      (cat): cat is PreferenceCategory => {
        const category = cat as PreferenceCategory;
        return evaluations[category].level === 'HIGH' && !isDisabledTrait(category);
      }
    );

    // HIGH 성향이 3개 이상이고, 공정 강제를 시도한 카테고리 중 전부 실패
    if (highCategories.length >= 3 && result.forceProcessFailedCategories.length > 0) {
      // 공정 강제를 시도한 카테고리 찾기
      const attemptedForceProcessCategories = highCategories.filter(cat => {
        const definition = traitImpactMap[cat];
        const rule = definition?.HIGH;
        return rule?.allow.forceProcess === true;
      });

      // 공정 강제를 시도한 카테고리 중 전부 실패했는지 확인
      if (
        attemptedForceProcessCategories.length > 0 &&
        attemptedForceProcessCategories.every(cat =>
          result.forceProcessFailedCategories.includes(cat)
        )
      ) {
        return {
          needsRequestion: true,
          reason: 'force_process_failed',
          validationQuestions: this.generateValidationQuestions(
            evaluations,
            'force_process_failed',
            result.forceProcessFailedCategories
          ),
        };
      }
    }

    // 재질문 불필요
    return {
      needsRequestion: false,
      reason: 'low_evidence', // 기본값 (사용되지 않음)
      validationQuestions: [],
    };
  }

  /**
   * 결정 검증 질문 생성
   * 명세서 규칙 8: 결정 검증 질문 1~2개 생성
   */
  private generateValidationQuestions(
    evaluations: Record<PreferenceCategory, TraitEvaluation>,
    reason: 'low_evidence' | 'force_process_failed',
    failedCategories?: PreferenceCategory[]
  ): string[] {
    const questions: string[] = [];

    if (reason === 'low_evidence') {
      // evidenceCount가 낮은 카테고리 찾기
      const lowEvidenceCategories = PREFERENCE_CATEGORIES.filter(
        (cat): cat is PreferenceCategory => evaluations[cat as PreferenceCategory].evidenceCount < 2
      ).slice(0, 2);

      for (const cat of lowEvidenceCategories) {
        const categoryLabels: Record<PreferenceCategory, string> = {
          space_sense: '공간 활용',
          sensory_sensitivity: '시각적 편안함',
          cleaning_preference: '청소',
          organization_habit: '정리',
          family_composition: '가족 구성',
          health_factors: '건강',
          budget_sense: '예산',
          color_preference: '색감',
          lighting_preference: '조명',
          home_purpose: '집 사용 목적',
          discomfort_factors: '불편 요소',
          activity_flow: '동선',
          life_routine: '생활 패턴',
          sleep_pattern: '수면',
          hobby_lifestyle: '취미',
        };

        const label = categoryLabels[cat] || cat;
        questions.push(`${label}에 대해 더 자세히 알려주시겠어요?`);
      }
    } else if (reason === 'force_process_failed' && failedCategories) {
      // 공정 강제 실패한 카테고리 기반 질문
      const categoryLabels: Record<PreferenceCategory, string> = {
        family_composition: '가족 구성',
        health_factors: '건강 상태',
        budget_sense: '예산 계획',
        cleaning_preference: '청소 빈도',
        organization_habit: '정리 습관',
        activity_flow: '활동 동선',
        discomfort_factors: '불편 요소',
        home_purpose: '집 사용 목적',
        sleep_pattern: '수면 패턴',
        color_preference: '색감 선호',
        lighting_preference: '조명 선호',
        sensory_sensitivity: '시각 민감도',
        space_sense: '공간 감각',
        life_routine: '생활 루틴',
        hobby_lifestyle: '취미 활동',
      };

      for (const cat of failedCategories.slice(0, 2)) {
        const label = categoryLabels[cat] || cat;
        questions.push(`${label}에 대한 정보를 더 구체적으로 알려주시겠어요?`);
      }
    }

    // 1~2개로 제한
    return questions.slice(0, 2);
  }
}

// ============================================
// 6. 싱글톤 인스턴스
// ============================================

export const decisionImpactEngine = new DecisionImpactEngine();






