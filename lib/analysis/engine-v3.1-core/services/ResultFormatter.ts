/**
 * V3.1 Core Edition - Result Formatter
 * 
 * 역할: V3.1 Core 결과를 UI 호환 형식으로 변환
 * 
 * UI에서 필요한 형식:
 * 1. summary: 전체 요약 (제목 + 설명)
 * 2. needs: Needs 카드 표시용
 * 3. processes: 공정 리스트 표시용
 * 4. explanation: 인과 구조 설명
 */

import { V31CoreResult } from '../index';
import { NeedsId, NeedScore } from '../types/needs';
import { ProcessRecommendation } from '../types/action';
import { ExplanationSegment } from '../types/action';
import { V3EngineInput } from '@/lib/analysis/engine-v3/types';

// ============ UI 호환 결과 타입 ============

export interface UICompatibleResult {
  /** 전체 요약 */
  summary: {
    title: string;
    description: string;
  };
  
  /** Needs 카드 */
  needs: UINeed[];
  
  /** 공정 리스트 */
  processes: UIProcess[];
  
  /** 설명 */
  explanation: {
    segments: UIExplanationSegment[];
  };

  /** 집값 방어 점수 */
  homeValueScore?: {
    score: number;
    reason: string;
    investmentValue: string;
  };

  /** 생활 개선 점수 */
  lifestyleScores?: {
    storage: number;
    cleaning: number;
    flow: number;
    comment: string;
  };

  /** 메타 정보 */
  meta: {
    version: string;
    timestamp: string;
    executionTime: number;
  };
}

export interface UINeed {
  id: string;
  name: string;
  level: 'high' | 'mid' | 'low';
  levelText: string;
  category: 'safety' | 'lifestyle' | 'aesthetic';
  categoryText: string;
  reason: string;
  priority: number;
  icon?: string;
}

export interface UIProcess {
  id: string;
  name: string;
  category: string;
  priority: 'must' | 'recommended' | 'optional';
  priorityText: string;
  reason: string;
  relatedNeeds: string[];
  relatedNeedsText: string;
}

export interface UIExplanationSegment {
  order: number;
  title: string;
  content: string;
  relatedNeeds?: string[];
}

// ============ Result Formatter ============

export class ResultFormatter {
  /**
   * V3.1 Core 결과를 UI 호환 형식으로 변환
   */
  formatForUI(result: V31CoreResult, explanationSegments?: ExplanationSegment[], v3Input?: V3EngineInput): UICompatibleResult {
    if (!result.inScope || !result.coreInput || !result.needsResult || !result.actionResult) {
      throw new Error('V3.1 Core 결과가 범위 밖이거나 불완전합니다.');
    }

    return {
      summary: this.formatSummary(result, v3Input),
      needs: this.formatNeeds(result),
      processes: this.formatProcesses(result),
      explanation: {
        segments: explanationSegments?.map(seg => this.formatExplanationSegment(seg)) || [],
      },
      homeValueScore: result.homeValueScore,
      lifestyleScores: result.lifestyleScores,
      meta: {
        version: result.version,
        timestamp: result.timestamp,
        executionTime: result.executionTime,
      },
    };
  }

  /**
   * 전체 요약 생성
   */
  private formatSummary(result: V31CoreResult, v3Input?: V3EngineInput): { title: string; description: string } {
    const { coreInput, needsResult, actionResult } = result;

    if (!coreInput || !needsResult || !actionResult) {
      return {
        title: '분석 결과',
        description: '분석을 완료했습니다.',
      };
    }

    // 제목: 고객 상황 한 줄 요약 (주거형태 포함)
    // ✅ 원본 입력값 사용 (고객이 입력한 평수 그대로 반영)
    const pyeong = v3Input?.spaceInfo?.pyeong || coreInput.hard.pyeong;
    console.log('📏 [ResultFormatter] 평수 확인:', {
      coreInput평수: pyeong,
      주거형태: coreInput.hard.building.type,
      전체hard: JSON.stringify(coreInput.hard),
    });
    const housingTypeText = this.getHousingTypeText(coreInput.hard.building.type); // ✅ 주거형태 변환
    let familyCount = coreInput.soft.family.count;
    
    // ✅ v3Input에서 totalPeople 확인 (더 정확한 값)
    // Q_FAMILY_SIZE를 우선 확인 (convertToV3Input에서 totalPeople로 설정됨)
    const qFamilySize = v3Input?.answers?.['Q_FAMILY_SIZE'];
    if (qFamilySize) {
      const totalPeople = parseInt(qFamilySize, 10);
      if (!isNaN(totalPeople) && totalPeople > 0 && totalPeople <= 10 && totalPeople !== familyCount) {
        console.warn('⚠️ [ResultFormatter] familyCount와 Q_FAMILY_SIZE 불일치:', {
          familyCount,
          Q_FAMILY_SIZE: totalPeople,
        });
        // Q_FAMILY_SIZE가 더 정확한 값이므로 우선 사용
        familyCount = totalPeople;
        console.log('✅ [ResultFormatter] Q_FAMILY_SIZE 우선 사용:', familyCount);
      }
    }
    
    console.log('🔍 [ResultFormatter] 가족 수 확인:', {
      최종familyCount: familyCount,
      원본familyCount: coreInput.soft.family.count,
      Q_FAMILY_SIZE: qFamilySize,
      family전체: coreInput.soft.family,
    });
    const topNeed = needsResult.needs.find(n => n.level === 'high');
    
    const title = topNeed
      ? `${pyeong}평 ${housingTypeText} ${familyCount}인 가구 - ${this.getNeedName(topNeed.id)} 중심 설계`
      : `${pyeong}평 ${housingTypeText} ${familyCount}인 가구 맞춤 설계`;

    // 설명: 핵심 Needs + 공정 수
    const highNeeds = needsResult.needs.filter(n => n.level === 'high');
    const needsText = highNeeds.map(n => this.getNeedName(n.id)).join(', ');
    const processCount = actionResult.processes.length;

    // needsText가 비어있을 때 처리
    let description: string;
    if (needsText && needsText.length > 0) {
      description = `${needsText}을(를) 최우선으로, 총 ${processCount}개 공정이 추천되었습니다.`;
    } else {
      // high Needs가 없으면 전체 Needs 중 상위 2개 사용
      const topNeeds = needsResult.needs
        .sort((a, b) => {
          const levelOrder = { high: 3, mid: 2, low: 1 };
          return levelOrder[b.level] - levelOrder[a.level];
        })
        .slice(0, 2)
        .map(n => this.getNeedName(n.id))
        .join(', ');
      
      if (topNeeds && topNeeds.length > 0) {
        description = `${topNeeds}을(를) 중심으로, 총 ${processCount}개 공정이 추천되었습니다.`;
      } else {
        description = `총 ${processCount}개 공정이 추천되었습니다.`;
      }
    }

    return { title, description };
  }

  /**
   * Needs → UI 카드 형식 변환
   */
  private formatNeeds(result: V31CoreResult): UINeed[] {
    if (!result.needsResult || !result.resolutionResult) {
      return [];
    }

    const { needs } = result.needsResult;
    const { resolved } = result.resolutionResult;

    return needs.map(need => {
      const resolvedNeed = resolved.find(r => r.id === need.id);
      const priority = resolvedNeed?.priority || 999;

      return {
        id: need.id,
        name: this.getNeedName(need.id),
        level: need.level,
        levelText: this.getLevelText(need.level),
        category: need.category,
        categoryText: this.getCategoryText(need.category),
        reason: this.formatNeedReason(need),
        priority,
        icon: this.getNeedIcon(need.id),
      };
    }).sort((a, b) => a.priority - b.priority); // 우선순위 순으로 정렬
  }

  /**
   * 공정 → UI 리스트 형식 변환
   */
  private formatProcesses(result: V31CoreResult): UIProcess[] {
    if (!result.actionResult) {
      return [];
    }

    const { processes } = result.actionResult;

    return processes.map(proc => ({
      id: proc.processId,
      name: proc.processName,
      category: this.inferProcessCategory(proc.processId),
      priority: proc.priority,
      priorityText: this.getPriorityText(proc.priority),
      reason: proc.reason,
      relatedNeeds: proc.relatedNeeds,
      relatedNeedsText: proc.relatedNeeds.map(nid => this.getNeedName(nid)).join(', '),
    }));
  }

  /**
   * 설명 Segment 변환
   */
  private formatExplanationSegment(segment: ExplanationSegment): UIExplanationSegment {
    return {
      order: segment.order,
      title: segment.title,
      content: segment.content,
      relatedNeeds: segment.relatedNeeds,
    };
  }

  // ============ Helper 함수 ============

  private getNeedName(needId: NeedsId): string {
    const map: Record<NeedsId, string> = {
      safety: '안전성 강화',
      storage: '수납 강화',
      flow: '동선 최적화',
      durability: '내구성 강화',
      maintenance: '청소/관리 편의성',
      brightness: '채광·밝기 향상',
    };
    return map[needId] || needId;
  }

  private getLevelText(level: 'high' | 'mid' | 'low'): string {
    const map = {
      high: '높음',
      mid: '중간',
      low: '낮음',
    };
    return map[level];
  }

  private getCategoryText(category: 'safety' | 'lifestyle' | 'aesthetic'): string {
    const map = {
      safety: '안전',
      lifestyle: '생활 패턴',
      aesthetic: '감성',
    };
    return map[category];
  }

  private getPriorityText(priority: 'must' | 'recommended' | 'optional'): string {
    const map = {
      must: '필수',
      recommended: '권장',
      optional: '선택',
    };
    return map[priority];
  }

  private formatNeedReason(need: NeedScore): string {
    if (need.reasons.length === 0) {
      return `${this.getNeedName(need.id)}이(가) 필요합니다.`;
    }
    return need.reasons.join(', ');
  }

  private getNeedIcon(needId: NeedsId): string {
    const map: Record<NeedsId, string> = {
      safety: '🛡️',
      storage: '📦',
      flow: '🚶',
      durability: '💪',
      maintenance: '🧹',
      brightness: '💡',
    };
    return map[needId] || '✨';
  }

  private inferProcessCategory(processId: string): string {
    // processId에서 카테고리 추론
    if (processId.includes('bathroom') || processId.includes('bath')) return '욕실';
    if (processId.includes('kitchen')) return '주방';
    if (processId.includes('living')) return '거실';
    if (processId.includes('floor')) return '바닥';
    if (processId.includes('wall')) return '벽';
    if (processId.includes('ceiling')) return '천장';
    if (processId.includes('lighting')) return '조명';
    if (processId.includes('storage')) return '수납';
    return '기타';
  }

  /**
   * 주거형태 영어 → 한글 변환
   */
  private getHousingTypeText(type: string): string {
    const map: Record<string, string> = {
      'apartment': '아파트',
      'villa': '빌라',
      'officetel': '오피스텔',
      'house': '단독주택',
    };
    return map[type] || '주거공간';
  }
}

