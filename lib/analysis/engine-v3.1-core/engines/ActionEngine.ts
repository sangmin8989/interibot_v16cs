/**
 * V3.1 Core Edition - Action Engine
 * 
 * ResolvedNeeds → 공정/옵션 추천
 * 
 * 핵심 기능:
 * - Needs 기반 공정 자동 추천
 * - 우선순위 기반 정렬
 * - 추천 이유 자동 생성
 * - 설명 가능한 추천 (Explainable)
 */

import { ResolutionResult, ResolvedNeed } from '../types/resolution';
import { ActionResult, ProcessRecommendation, OptionRecommendation, ExplanationSegment } from '../types/action';
import { CoreInput } from '../types/input';
import {
  NEEDS_TO_PROCESS_MAPPING,
  CORE_PROCESSES,
  getProcessById,
  getProcessPriority,
} from '../config/process-mapping';
import { getNeedsKoreanName, getNeedsLevelKorean } from '../utils/helpers';

// ============ Action Engine ============

export class ActionEngine {
  /**
   * Action 생성 메인 함수
   */
  generate(resolutionResult: ResolutionResult, coreInput: CoreInput, selectedProcesses?: string[]): ActionResult {
    console.log('⚡ [ActionEngine] 공정/옵션 추천 시작', {
      selectedProcesses: selectedProcesses,
      selectedProcessesLength: selectedProcesses?.length || 0,
    });

    const { resolved } = resolutionResult;

    // Step 1: Needs 기반 공정 추천
    let processes = this.generateProcessRecommendations(resolved);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ActionEngine.ts:36',message:'Needs 기반 추천 후',data:{processesCount:processes.length,processIds:processes.map(p=>p.processId),selectedProcesses:selectedProcesses},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // ✅ selectedProcesses가 있으면 선택된 공정만 필터링
    if (selectedProcesses && selectedProcesses.length > 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ActionEngine.ts:42',message:'selectedProcesses 필터링 시작',data:{selectedProcesses:selectedProcesses,processesBeforeFilter:processes.map(p=>({id:p.processId,name:p.processName}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      // selectedProcesses를 소문자로 변환하여 매칭 (공정 ID는 소문자일 수 있음)
      const selectedProcessIdsLower = new Set(selectedProcesses.map(sp => sp.toLowerCase()));
      const selectedProcessNamesLower = new Set(selectedProcesses.map(sp => sp.toLowerCase()));
      
      const filteredProcesses = processes.filter(p => {
        // processId 매칭 (정확한 매칭)
        const processIdLower = p.processId.toLowerCase();
        const processNameLower = p.processName.toLowerCase();
        
        // 1. processId가 selectedProcesses에 포함되어 있는지 확인
        if (selectedProcessIdsLower.has(processIdLower) || selectedProcessNamesLower.has(processIdLower)) {
          return true;
        }
        
        // 2. processName이 selectedProcesses에 포함되어 있는지 확인
        if (selectedProcessNamesLower.has(processNameLower)) {
          return true;
        }
        
        // 3. selectedProcesses 중 하나가 processId나 processName을 포함하는지 확인
        // 예: "kitchen"이 selectedProcesses에 있고, processId가 "kitchen-countertop"인 경우
        const matchesSelected = selectedProcesses.some(sp => {
          const spLower = sp.toLowerCase();
          return processIdLower.includes(spLower) || 
                 processNameLower.includes(spLower) ||
                 spLower.includes(processIdLower) ||
                 spLower.includes(processNameLower);
        });
        
        return matchesSelected;
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ActionEngine.ts:70',message:'selectedProcesses 필터링 후',data:{originalCount:processes.length,filteredCount:filteredProcesses.length,selectedProcesses:selectedProcesses,filteredProcessIds:filteredProcesses.map(p=>p.processId),filteredProcessNames:filteredProcesses.map(p=>p.processName)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      // 필터링된 공정이 있으면 그것만 사용, 없으면 원본 유지 (에러 방지)
      if (filteredProcesses.length > 0) {
        processes = filteredProcesses;
        console.log('✅ [ActionEngine] selectedProcesses 필터링 적용:', {
          originalCount: processes.length,
          filteredCount: filteredProcesses.length,
          selectedProcesses: selectedProcesses,
          filteredProcessIds: filteredProcesses.map(p => p.processId),
        });
      } else {
        console.warn('⚠️ [ActionEngine] selectedProcesses 필터링 결과가 비어있음, 원본 유지');
      }
    }

    // Step 2: 옵션 추천 (향후 확장)
    const options = this.generateOptionRecommendations(resolved);

    // Step 3: 설명 생성
    const explanation = this.generateExplanation(resolved, processes, coreInput);

    console.log('✅ [ActionEngine] 추천 완료:', {
      processCount: processes.length,
      optionCount: options.length,
    });

    return {
      processes,
      options,
      explanation,
      timestamp: new Date().toISOString(),
    };
  }

  // ============ Step 1: 공정 추천 생성 ============

  private generateProcessRecommendations(resolvedNeeds: ResolvedNeed[]): ProcessRecommendation[] {
    const processMap = new Map<string, ProcessRecommendation>();

    // 각 Needs에 대해 매핑된 공정 추출
    resolvedNeeds.forEach((need) => {
      const mapping = NEEDS_TO_PROCESS_MAPPING.find((m) => m.needsId === need.id);
      
      if (!mapping) return;

      mapping.processes.forEach((proc) => {
        // minLevel 체크: Needs 강도가 충분한지 확인
        if (proc.minLevel) {
          const levelPriority = { low: 1, mid: 2, high: 3 };
          const needLevel = levelPriority[need.finalLevel];
          const minLevel = levelPriority[proc.minLevel];
          
          if (needLevel < minLevel) {
            return; // Needs 강도가 부족하면 추천하지 않음
          }
        }

        const processId = proc.processId;
        const existing = processMap.get(processId);

        if (!existing) {
          // 새로운 공정 추가
          const processDef = getProcessById(processId);
          if (!processDef) return;

          processMap.set(processId, {
            processId,
            processName: processDef.name,
            relatedNeeds: [need.id],
            priority: proc.priority,
            reason: this.formatReason(proc.reasonTemplate, need),
          });
        } else {
          // 기존 공정에 Needs 추가
          if (!existing.relatedNeeds.includes(need.id)) {
            existing.relatedNeeds.push(need.id);
          }

          // 우선순위 업그레이드 (must > recommended > optional)
          const currentPriority = getProcessPriority(existing.priority);
          const newPriority = getProcessPriority(proc.priority);
          
          if (newPriority < currentPriority) {
            existing.priority = proc.priority;
          }

          // 이유 추가
          const additionalReason = this.formatReason(proc.reasonTemplate, need);
          if (!existing.reason.includes(additionalReason)) {
            existing.reason += ` / ${additionalReason}`;
          }
        }
      });
    });

    // 우선순위로 정렬
    const processes = Array.from(processMap.values());
    processes.sort((a, b) => {
      const priorityA = getProcessPriority(a.priority);
      const priorityB = getProcessPriority(b.priority);
      return priorityA - priorityB;
    });

    return processes;
  }

  // ============ Step 2: 옵션 추천 생성 ============

  private generateOptionRecommendations(resolvedNeeds: ResolvedNeed[]): OptionRecommendation[] {
    // 향후 확장: 재질, 색상, 등급 등 옵션 추천
    // 현재는 빈 배열 반환
    return [];
  }

  // ============ Step 3: 설명 생성 ============

  private generateExplanation(
    resolvedNeeds: ResolvedNeed[],
    processes: ProcessRecommendation[],
    coreInput: CoreInput
  ): ExplanationSegment[] {
    const segments: ExplanationSegment[] = [];

    // Segment 1: 인사 및 전체 요약
    segments.push({
      order: 1,
      title: '분석 결과 요약',
      content: this.generateSummary(coreInput, resolvedNeeds),
    });

    // Segment 2: Needs 설명
    segments.push({
      order: 2,
      title: '고객님의 핵심 니즈',
      content: this.generateNeedsExplanation(resolvedNeeds),
      relatedNeeds: resolvedNeeds.map((n) => n.id),
    });

    // Segment 3: 공정 추천 설명
    segments.push({
      order: 3,
      title: '추천 공정',
      content: this.generateProcessExplanation(processes, resolvedNeeds),
    });

    // Segment 4: 다음 단계
    segments.push({
      order: 4,
      title: '다음 단계',
      content: '상담을 통해 구체적인 일정과 견적을 확인하실 수 있습니다.',
    });

    return segments;
  }

  // ============ 설명 생성 헬퍼 ============

  private generateSummary(coreInput: CoreInput, resolvedNeeds: ResolvedNeed[]): string {
    const { pyeong } = coreInput.hard;
    const { count: familyCount } = coreInput.soft.family;
    
    const highPriorityNeeds = resolvedNeeds
      .filter((n) => n.priority <= 3)
      .map((n) => getNeedsKoreanName(n.id))
      .join(', ');

    return `${pyeong}평 아파트에 거주 중인 ${familyCount}인 가구 고객님의 집을 분석한 결과, ` +
      `${highPriorityNeeds} 등이 중요하게 나타났습니다. ` +
      `이를 해결하기 위한 맞춤형 공정을 추천드립니다.`;
  }

  private generateNeedsExplanation(resolvedNeeds: ResolvedNeed[]): string {
    const lines = resolvedNeeds.slice(0, 5).map((need, idx) => {
      const name = getNeedsKoreanName(need.id);
      const level = getNeedsLevelKorean(need.finalLevel);
      return `${idx + 1}. ${name} (${level})`;
    });

    return '분석 결과 다음과 같은 핵심 니즈가 도출되었습니다:\n\n' + lines.join('\n');
  }

  private generateProcessExplanation(
    processes: ProcessRecommendation[],
    resolvedNeeds: ResolvedNeed[]
  ): string {
    const mustProcesses = processes.filter((p) => p.priority === 'must');
    const recommendedProcesses = processes.filter((p) => p.priority === 'recommended');

    let content = '';

    if (mustProcesses.length > 0) {
      content += '【필수 공정】\n\n';
      mustProcesses.forEach((proc) => {
        content += `• ${proc.processName}\n`;
        content += `  이유: ${proc.reason}\n\n`;
      });
    }

    if (recommendedProcesses.length > 0) {
      content += '\n【권장 공정】\n\n';
      recommendedProcesses.forEach((proc) => {
        content += `• ${proc.processName}\n`;
        content += `  이유: ${proc.reason}\n\n`;
      });
    }

    return content;
  }

  private formatReason(template: string, need: ResolvedNeed): string {
    // 템플릿을 그대로 사용 (향후 변수 치환 가능)
    return template;
  }
}




















