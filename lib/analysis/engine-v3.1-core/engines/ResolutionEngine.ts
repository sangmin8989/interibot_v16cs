/**
 * V3.1 Core Edition - Resolution Engine
 * 
 * Needs 충돌 해결 및 우선순위 조정
 * 
 * 핵심 기능:
 * - Needs 간 충돌 감지 및 해결
 * - 카테고리별 우선순위 적용 (안전 > 생활 > 감성)
 * - 예산에 따른 Needs 조정
 * - 평형대별 Needs 강도 조정
 */

import { NeedsResult, NeedScore, NeedsLevel, NeedsId } from '../types/needs';
import { ResolutionResult, ResolvedNeed } from '../types/resolution';
import { BudgetInputCore, CoreInput } from '../types/input';
import { CATEGORY_PRIORITY } from '../config/needs-definitions';
import { getPyeongCategory } from '../config/scope';

// ============ 충돌 패턴 정의 ============

interface ConflictPattern {
  /** 충돌 설명 */
  description: string;
  /** 충돌하는 Needs 쌍 */
  needs: [NeedsId, NeedsId];
  /** 해결 방법 */
  resolution: (need1: NeedScore, need2: NeedScore) => {
    adjustments: Map<NeedsId, NeedsLevel>;
    note: string;
  };
}

// 충돌 패턴 정의
const CONFLICT_PATTERNS: ConflictPattern[] = [
  {
    description: '수납 강화 vs 미니멀/심플',
    needs: ['storage', 'brightness'], // 예시: 수납 많으면 공간이 줄어들어 밝기에 영향
    resolution: (storage, brightness) => {
      const adjustments = new Map<NeedsId, NeedsLevel>();
      let note = '';

      if (storage.level === 'high' && brightness.level === 'high') {
        // 수납을 우선하되, 밝기도 중요하므로 "숨김 수납 + 조명 강화" 방향
        note = '수납 강화와 밝기 향상을 동시에 만족하기 위해 숨김 수납 + 조명 보강 방향으로 조정';
        // 수납: high 유지, 밝기: high 유지 (충돌 아님, 단지 해결 방향 제시)
      }

      return { adjustments, note };
    },
  },
];

// ============ Resolution Engine ============

export class ResolutionEngine {
  /**
   * Needs 해결 메인 함수
   */
  resolve(needsResult: NeedsResult, coreInput: CoreInput): ResolutionResult {
    console.log('🔧 [ResolutionEngine] Needs 해결 시작');

    const { needs } = needsResult;
    const conflicts: { description: string; resolution: string }[] = [];

    // Step 1: 충돌 감지 및 해결
    const adjustedNeeds = this.detectAndResolveConflicts(needs, conflicts);

    // Step 2: 카테고리별 우선순위 적용
    const prioritizedNeeds = this.applyPriorityRules(adjustedNeeds);

    // Step 3: 예산 기반 조정
    const budgetAdjustedNeeds = this.applyBudgetAdjustment(
      prioritizedNeeds,
      coreInput.budget,
      conflicts
    );

    // Step 4: 평형대별 조정
    const finalNeeds = this.applyPyeongAdjustment(
      budgetAdjustedNeeds,
      coreInput.hard.pyeong,
      conflicts
    );

    // Step 5: ResolvedNeed로 변환
    const resolved = this.convertToResolvedNeeds(finalNeeds);

    console.log('✅ [ResolutionEngine] Needs 해결 완료:', resolved.length);

    return {
      resolved,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  // ============ Step 1: 충돌 감지 및 해결 ============

  private detectAndResolveConflicts(
    needs: NeedScore[],
    conflicts: { description: string; resolution: string }[]
  ): NeedScore[] {
    const needsMap = new Map<NeedsId, NeedScore>();
    needs.forEach((need) => needsMap.set(need.id, { ...need }));

    // 충돌 패턴 순회
    CONFLICT_PATTERNS.forEach((pattern) => {
      const [id1, id2] = pattern.needs;
      const need1 = needsMap.get(id1);
      const need2 = needsMap.get(id2);

      if (need1 && need2) {
        const { adjustments, note } = pattern.resolution(need1, need2);

        if (note) {
          conflicts.push({
            description: pattern.description,
            resolution: note,
          });
        }

        // 조정 적용
        adjustments.forEach((level, needsId) => {
          const need = needsMap.get(needsId);
          if (need) {
            need.level = level;
          }
        });
      }
    });

    return Array.from(needsMap.values());
  }

  // ============ Step 2: 카테고리별 우선순위 적용 ============

  private applyPriorityRules(needs: NeedScore[]): NeedScore[] {
    // 카테고리별 우선순위로 정렬
    return needs.sort((a, b) => {
      const priorityA = CATEGORY_PRIORITY[a.category];
      const priorityB = CATEGORY_PRIORITY[b.category];

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 같은 카테고리 내에서는 level 우선
      const levelPriority = { high: 3, mid: 2, low: 1 };
      return levelPriority[b.level] - levelPriority[a.level];
    });
  }

  // ============ Step 3: 예산 기반 조정 ============

  private applyBudgetAdjustment(
    needs: NeedScore[],
    budget: BudgetInputCore,
    conflicts: { description: string; resolution: string }[]
  ): NeedScore[] {
    if (budget.level === 'low' && budget.priceSensitive) {
      console.log('💰 [ResolutionEngine] 예산 낮음 - 감성 Needs 조정');

      // 예산이 낮으면 감성 카테고리 Needs를 다운그레이드
      const adjusted = needs.map((need) => {
        if (need.category === 'aesthetic' && need.level === 'high') {
          conflicts.push({
            description: '예산 제약으로 감성 Needs 조정',
            resolution: `${need.id}의 강도를 HIGH → MID로 조정 (예산 방어)`,
          });

          return {
            ...need,
            level: 'mid' as NeedsLevel,
          };
        }
        return need;
      });

      // 안전 카테고리는 절대 다운그레이드하지 않음
      return adjusted;
    }

    return needs;
  }

  // ============ Step 4: 평형대별 조정 ============

  private applyPyeongAdjustment(
    needs: NeedScore[],
    pyeong: number,
    conflicts: { description: string; resolution: string }[]
  ): NeedScore[] {
    const category = getPyeongCategory(pyeong);
    
    let adjusted = [...needs];

    // 10-19평: 초소형
    if (category === 'verySmall') {
      console.log('📐 [ResolutionEngine] 초소형 (10-19평) - 수납/동선 최우선');
      
      adjusted = adjusted.map((need) => {
        if ((need.id === 'storage' || need.id === 'flow') && need.level !== 'high') {
          conflicts.push({
            description: `초소형 평수(${pyeong}평)로 인한 ${need.id === 'storage' ? '수납' : '동선'} 중요도 급상승`,
            resolution: `${need.id} 강도를 ${need.level.toUpperCase()} → HIGH로 조정`,
          });
          return { ...need, level: 'high' as NeedsLevel };
        }
        if (need.id === 'brightness' && need.level === 'low') {
          conflicts.push({
            description: `작은 공간에서 답답함 방지를 위해 밝기 향상`,
            resolution: `brightness 강도를 LOW → MID로 조정`,
          });
          return { ...need, level: 'mid' as NeedsLevel };
        }
        return need;
      });
    }

    // 20-25평: 소형
    else if (category === 'small') {
      console.log('📐 [ResolutionEngine] 소형 (20-25평) - 수납 강화');
      
      adjusted = adjusted.map((need) => {
        if (need.id === 'storage' && need.level === 'mid') {
          conflicts.push({
            description: `작은 평수(${pyeong}평)로 인한 수납 중요도 증가`,
            resolution: 'storage 강도를 MID → HIGH로 조정',
          });
          return { ...need, level: 'high' as NeedsLevel };
        }
        return need;
      });
    }

    // 26-32평: 중소형 (조정 없음)
    else if (category === 'medium') {
      console.log('📐 [ResolutionEngine] 중소형 (26-32평) - 균형 유지');
    }

    // 33-40평: 중형
    else if (category === 'large') {
      console.log('📐 [ResolutionEngine] 중형 (33-40평) - 동선 최적화');
      
      adjusted = adjusted.map((need) => {
        if (need.id === 'flow' && need.level === 'mid') {
          conflicts.push({
            description: `넓은 평수(${pyeong}평)로 인한 동선 중요도 증가`,
            resolution: 'flow 강도를 MID → HIGH로 조정',
          });
          return { ...need, level: 'high' as NeedsLevel };
        }
        return need;
      });
    }

    // 41-59평: 대형
    else if (category === 'veryLarge') {
      console.log('📐 [ResolutionEngine] 대형 (41-59평) - 동선/내구성/수납 강화');
      
      adjusted = adjusted.map((need) => {
        if ((need.id === 'flow' || need.id === 'durability') && need.level === 'mid') {
          conflicts.push({
            description: `대형 평수(${pyeong}평)로 인한 ${need.id === 'flow' ? '동선' : '내구성'} 중요도 증가`,
            resolution: `${need.id} 강도를 MID → HIGH로 조정`,
          });
          return { ...need, level: 'high' as NeedsLevel };
        }
        if (need.id === 'storage' && need.level === 'low') {
          conflicts.push({
            description: `넓은 공간 활용을 위한 수납 강화`,
            resolution: `storage 강도를 LOW → MID로 조정`,
          });
          return { ...need, level: 'mid' as NeedsLevel };
        }
        return need;
      });
    }

    // 60-80평: 초대형
    else if (category === 'luxury') {
      console.log('📐 [ResolutionEngine] 초대형 (60평+) - 동선/내구성/관리 최우선');
      
      adjusted = adjusted.map((need) => {
        if ((need.id === 'flow' || need.id === 'durability' || need.id === 'maintenance') && need.level !== 'high') {
          conflicts.push({
            description: `초대형 평수(${pyeong}평)로 인한 ${need.id} 중요도 급상승`,
            resolution: `${need.id} 강도를 ${need.level.toUpperCase()} → HIGH로 조정`,
          });
          return { ...need, level: 'high' as NeedsLevel };
        }
        return need;
      });
    }

    return adjusted;
  }

  // ============ Step 5: ResolvedNeed로 변환 ============

  private convertToResolvedNeeds(needs: NeedScore[]): ResolvedNeed[] {
    return needs.map((need, index) => ({
      id: need.id,
      finalLevel: need.level,
      priority: index + 1, // 정렬된 순서가 우선순위
      resolutionNote: need.reasons.join('; '),
    }));
  }
}

