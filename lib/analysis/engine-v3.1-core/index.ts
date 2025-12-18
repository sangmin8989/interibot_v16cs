/**
 * V3.1 Core Edition - 메인 진입점
 * 
 * V3.1 Core 엔진의 통합 진입점입니다.
 * 기존 V3 엔진과 병렬로 실행되며, 결과를 디버그/검증 목적으로 사용합니다.
 * 
 * Phase 1-2 구현:
 * - Input Layer + Adapter ✅
 * - Needs Layer (Core 6개) ✅
 * - Resolution Layer (향후 구현)
 * - Action Layer (향후 구현)
 */

import { V3EngineInput, TraitEngineResult } from '../engine-v3/types';
import { CoreInput } from './types/input';
import { NeedsResult } from './types/needs';
import { ResolutionResult } from './types/resolution';
import { ActionResult } from './types/action';
import { InputAdapter } from './engines/InputAdapter';
import { NeedsEngineCore } from './engines/NeedsEngineCore';
import { ResolutionEngine } from './engines/ResolutionEngine';
import { ActionEngine } from './engines/ActionEngine';
import { isInCoreScope } from './config/scope';

// ============ V3.1 Core Engine ============

export class V31CoreEngine {
  private needsEngine: NeedsEngineCore;
  private resolutionEngine: ResolutionEngine;
  private actionEngine: ActionEngine;

  constructor() {
    this.needsEngine = new NeedsEngineCore();
    this.resolutionEngine = new ResolutionEngine();
    this.actionEngine = new ActionEngine();
  }

  /**
   * V3.1 Core 분석 실행
   * 
   * @param v3Input V3 엔진 입력
   * @param traitResult V3 TraitEngine 결과 (변환에 필요)
   * @returns V3.1 Core 분석 결과
   */
  analyze(v3Input: V3EngineInput, traitResult: TraitEngineResult): V31CoreResult {
    console.log('🚀 [V3.1 Core] 분석 시작');
    const startTime = Date.now();

    // Step 1: 범위 검증
    const pyeong = v3Input.spaceInfo.pyeong || 25;
    const housingType = v3Input.spaceInfo.housingType || 'apartment';
    const occupied = true; // Core Edition 가정

    const inScope = isInCoreScope(pyeong, housingType, occupied);

    if (!inScope) {
      console.warn('⚠️ [V3.1 Core] 범위 밖:', { pyeong, housingType, occupied });
      return {
        version: '3.1.0-core',
        inScope: false,
        scopeCheck: {
          pyeong,
          housingType,
          occupied,
          message: `V3.1 Extended Edition은 10-80평 주거용 건물을 지원합니다. (입력: ${pyeong}평, ${housingType})`,
        },
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
      };
    }

    // Step 2: Input Layer - V3 → V3.1 Core 변환
    const coreInput = InputAdapter.convertV3ToCoreInput(v3Input, traitResult);

    // Step 3: Needs Layer - Core Needs 계산
    const needsResult = this.needsEngine.analyze(coreInput);

    // Step 4: Resolution Layer - Needs 충돌 해결 및 우선순위 조정
    const resolutionResult = this.resolutionEngine.resolve(needsResult, coreInput);

    // Step 5: Action Layer - 공정/옵션 추천 생성
    // ✅ selectedProcesses 전달 (주방 공정만 선택했을 때 필터링)
    const actionResult = this.actionEngine.generate(resolutionResult, coreInput, v3Input.selectedProcesses);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine-v3.1-core/index.ts:82',message:'ActionEngine.generate 호출',data:{selectedProcesses:v3Input.selectedProcesses,selectedProcessesLength:v3Input.selectedProcesses?.length||0,actionResultProcessCount:actionResult.processes.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Step 6: 집값 방어 점수 계산
    const homeValueScore = this.calculateHomeValueScore(
      coreInput,
      actionResult,
      v3Input.selectedSpaces
    );

    // Step 7: 생활 개선 점수 계산
    const lifestyleScores = this.calculateLifestyleScores(
      needsResult,
      resolutionResult,
      v3Input.selectedSpaces
    );

    // Step 8: 결과 통합
    const result: V31CoreResult = {
      version: '3.1.0-core',
      inScope: true,
      coreInput,
      needsResult,
      resolutionResult,
      actionResult,
      homeValueScore,
      lifestyleScores,
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
    };

    console.log('✅ [V3.1 Core] 분석 완료:', {
      needsCount: needsResult.needs.length,
      resolvedCount: resolutionResult.resolved.length,
      processCount: actionResult.processes.length,
      conflicts: resolutionResult.conflicts?.length || 0,
      executionTime: result.executionTime,
    });

    return result;
  }

  /**
   * 생활 개선 점수 계산 (0-100점)
   * Needs 기반으로 수납, 청소, 동선 개선 정도를 점수로 환산
   */
  private calculateLifestyleScores(
    needsResult: NeedsResult,
    resolutionResult: ResolutionResult,
    selectedSpaces: string[]
  ): { storage: number; cleaning: number; flow: number; comment: string } {
    let storage = 50, cleaning = 50, flow = 50; // 기본 점수

    // ✅ 1단계: Needs 레벨에 따른 기본 가산 (가장 중요!)
    needsResult.needs.forEach(need => {
      const levelMultiplier = need.level === 'high' ? 20 : need.level === 'mid' ? 12 : 5;
      
      if (need.id === 'storage') {
        storage += levelMultiplier;
      } else if (need.id === 'maintenance') {
        cleaning += levelMultiplier;
      } else if (need.id === 'flow') {
        flow += levelMultiplier;
      }
    });

    // ✅ 2단계: 선택된 공간 수에 따른 전체 리모델링 가산
    const spaceCount = selectedSpaces.length;
    if (spaceCount >= 7) {
      // 전체 리모델링 (7개 이상 공간)
      storage += 15;
      cleaning += 15;
      flow += 15;
    } else if (spaceCount >= 5) {
      // 대부분 리모델링
      storage += 10;
      cleaning += 10;
      flow += 10;
    } else if (spaceCount >= 3) {
      // 중간 규모 리모델링
      storage += 7;
      cleaning += 7;
      flow += 7;
    }

    // ✅ 3단계: 개별 공간에 따른 보너스 (중복 가산 가능)
    const hasKitchen = selectedSpaces.some(s => s.includes('kitchen') || s === 'kitchen');
    const hasBathroom = selectedSpaces.some(s => s.includes('bathroom') || s === 'bathroom');
    const hasDressRoom = selectedSpaces.some(s => s.includes('dressroom') || s.includes('storage'));
    const hasLiving = selectedSpaces.some(s => s.includes('living') || s === 'living');
    const hasEntrance = selectedSpaces.some(s => s.includes('entrance') || s === 'entrance');

    if (hasKitchen) {
      storage += 10;
      cleaning += 8;
      flow += 8;
    }
    if (hasBathroom) {
      cleaning += 10;
      storage += 5;
    }
    if (hasDressRoom) {
      storage += 15;
    }
    if (hasLiving) {
      flow += 10;
      cleaning += 5;
    }
    if (hasEntrance) {
      flow += 8;
      storage += 8;
    }

    // ✅ 4단계: 최종 점수 보정 (0-100점 범위)
    storage = Math.max(0, Math.min(100, Math.round(storage)));
    cleaning = Math.max(0, Math.min(100, Math.round(cleaning)));
    flow = Math.max(0, Math.min(100, Math.round(flow)));

    // ✅ 5단계: 코멘트 생성
    const avgScore = (storage + cleaning + flow) / 3;
    let comment = '';
    if (avgScore >= 80) {
      comment = '전반적인 생활 품질이 크게 향상됩니다.';
    } else if (avgScore >= 65) {
      comment = '생활 편의성이 상당히 개선됩니다.';
    } else if (avgScore >= 50) {
      comment = '일상 생활이 편리해집니다.';
    } else {
      comment = '기본적인 생활 개선이 예상됩니다.';
    }

    return { storage, cleaning, flow, comment };
  }

  /**
   * 집값 방어 점수 계산 (1-5점)
   */
  private calculateHomeValueScore(
    coreInput: CoreInput,
    actionResult: ActionResult,
    selectedSpaces: string[]
  ): { score: number; reason: string; investmentValue: string } {
    let score = 3; // 기본 3점

    // ✅ 1단계: 선택된 공간 수에 따른 전체 리모델링 가산 (가장 중요!)
    const spaceCount = selectedSpaces.length;
    if (spaceCount >= 7) {
      // 전체 리모델링 (7개 이상 공간)
      score += 1.2;
    } else if (spaceCount >= 5) {
      // 대부분 리모델링
      score += 0.9;
    } else if (spaceCount >= 3) {
      // 중간 규모 리모델링
      score += 0.6;
    }

    // ✅ 2단계: 주방/욕실 포함 시 가산 (매도 시 가장 중요)
    const hasKitchen = selectedSpaces.some(s => 
      s.includes('kitchen') || s === 'kitchen'
    );
    const hasBathroom = selectedSpaces.some(s => 
      s.includes('bathroom') || s === 'bathroom'
    );
    if (hasKitchen) score += 0.5;
    if (hasBathroom) score += 0.5;
    if (hasKitchen && hasBathroom) score += 0.3; // ✅ 둘 다 있으면 추가 가산

    // ✅ 3단계: 예산에 따른 가산
    if (coreInput.budget.level === 'high' || coreInput.budget.level === 'premium') {
      score += 0.5;
    }

    // ✅ 4단계: 거주 목적에 따른 가산
    const livingPurpose = coreInput.hard.livingPurpose;
    if (livingPurpose === '매도준비') {
      if (hasKitchen && hasBathroom) score += 0.5;
      if (spaceCount >= 5) score += 0.3; // ✅ 전체 리모델링은 매도 시 더 가치 있음
    } else if (livingPurpose === '실거주' && coreInput.hard.livingYears && coreInput.hard.livingYears >= 10) {
      score += 0.3;
    }

    // ✅ 5단계: 최종 점수 계산 (1-5점, 소수점 첫째 자리까지)
    const finalScore = Math.min(5, Math.max(1, Math.round(score * 10) / 10));

    // 예산 기반 월 비용 환산
    const budgetAmount = coreInput.budget.amount || 3000; // 기본 3000만원
    const monthlyEquivalent = Math.round(budgetAmount / 120); // 10년 기준

    return {
      score: finalScore,
      reason: finalScore >= 4.5
        ? `전체 리모델링(${spaceCount}개 공간)은 집값 상승에 가장 큰 영향을 미칩니다. 장기적으로 매우 훌륭한 투자입니다!`
        : finalScore >= 4
        ? '주방/욕실 전면 교체는 매도 시 가장 큰 가치 상승 요인입니다. 장기적으로 훌륭한 투자입니다!'
        : finalScore >= 3
        ? '선택하신 공간들은 집값 유지에 도움이 됩니다. 적절한 투자입니다.'
        : '기본적인 보수로 실용성 중심의 인테리어입니다.',
      investmentValue: `10년 거주 시 월 비용 환산 약 ${monthlyEquivalent}만원으로 ${monthlyEquivalent <= 20 ? '매우 합리적' : monthlyEquivalent <= 30 ? '적절한' : '투자 가치 있는'} 수준입니다.`,
    };
  }
}

// ============ V3.1 Core 결과 타입 ============

export interface V31CoreResult {
  /** 엔진 버전 */
  version: '3.1.0-core';
  
  /** Core Edition 범위 내인지 */
  inScope: boolean;
  
  /** 범위 검증 결과 (범위 밖일 경우) */
  scopeCheck?: {
    pyeong: number;
    housingType: string;
    occupied: boolean;
    message: string;
  };
  
  /** Core Input (범위 내일 경우) */
  coreInput?: CoreInput;
  
  /** Needs 결과 (범위 내일 경우) */
  needsResult?: NeedsResult;
  
  /** Resolution 결과 (범위 내일 경우) */
  resolutionResult?: ResolutionResult;
  
  /** Action 결과 (범위 내일 경우) */
  actionResult?: ActionResult;
  
  /** 집값 방어 점수 (1-5점) */
  homeValueScore?: {
    score: number;
    reason: string;
    investmentValue: string;
  };
  
  /** 생활 개선 점수 (0-100점) */
  lifestyleScores?: {
    storage: number;
    cleaning: number;
    flow: number;
    comment: string;
  };
  
  /** 분석 시점 */
  timestamp: string;
  
  /** 실행 시간 (ms) */
  executionTime: number;
}

// ============ Export ============

export * from './types/input';
export * from './types/needs';
export * from './types/resolution';
export * from './types/action';
export * from './config/scope';
export * from './config/needs-definitions';
export * from './services/ExplanationService';
export * from './services/ResultFormatter';

