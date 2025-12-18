/**
 * V3.1 Core Edition - Explanation Service
 * 
 * 역할: V3.1 Core 결과를 기반으로 인과 구조 설명 생성
 * 
 * 구조: Input → Needs → Resolution → Action
 * 
 * 원칙:
 * 1. 모든 설명은 "왜 이 결정이 나왔는지" 인과 관계를 명확히 함
 * 2. Input과 Needs를 반드시 연결하여 설명
 * 3. 기술 용어보다 고객이 이해할 수 있는 언어 사용
 * 4. 감성적 문장이 아닌 논리적 근거 제시
 */

import { V31CoreResult } from '../index';
import { ExplanationSegment } from '../types/action';
import { CoreInput, FamilyComposition, LifestylePattern, KitchenPattern, StoragePattern, CleaningPattern, LightingPreference } from '../types/input';
import { NeedsResult, NeedScore, NeedsId } from '../types/needs';
import { ResolutionResult } from '../types/resolution';
import { ActionResult, ProcessRecommendation } from '../types/action';

export class ExplanationService {
  /**
   * V3.1 Core 결과를 기반으로 인과 구조 설명 생성
   * 
   * 구조: Input → Needs → Resolution → Action
   */
  generateExplanation(result: V31CoreResult, originalPyeong?: number): ExplanationSegment[] {
    const segments: ExplanationSegment[] = [];

    if (!result.coreInput || !result.needsResult || !result.actionResult) {
      return segments;
    }

    // Segment 1: 입력 요약 (고객 상황)
    segments.push({
      order: 1,
      title: '고객님의 상황',
      content: this.summarizeInput(result.coreInput, originalPyeong),
    });

    // Segment 2: Needs 도출 이유
    segments.push({
      order: 2,
      title: '핵심 니즈 분석',
      content: this.explainNeeds(result.needsResult, result.coreInput),
      relatedNeeds: result.needsResult.needs.map(n => n.id),
    });

    // Segment 3: 충돌 해결 설명 (충돌이 있을 경우)
    if (result.resolutionResult?.conflicts && result.resolutionResult.conflicts.length > 0) {
      segments.push({
        order: 3,
        title: '니즈 조정',
        content: this.explainResolution(result.resolutionResult),
      });
    }

    // Segment 4: 공정 추천 이유
    segments.push({
      order: result.resolutionResult?.conflicts?.length ? 4 : 3,
      title: '추천 공정',
      content: this.explainActions(result.actionResult, result.needsResult),
    });

    return segments;
  }

  /**
   * Input Layer 요약 (V3.1 설계서 기준)
   * 고객 상황 한 줄 요약: "30대 3인 가족, 25평 아파트에 거주 중이시고, 영유아가 있어 안전과 수납이 동시에 중요한 상황입니다."
   */
  private summarizeInput(coreInput: CoreInput, originalPyeong?: number): string {
    const { soft, hard, budget } = coreInput;
    const parts: string[] = [];

    // 1. 공간 기본 정보
    // ✅ 원본 입력값 사용 (고객이 입력한 평수 그대로 반영)
    const pyeong = originalPyeong !== undefined ? originalPyeong : hard.pyeong;
    const housingTypeText = hard.building.type === 'apartment' ? '아파트' :
                            hard.building.type === 'villa' ? '빌라' :
                            hard.building.type === 'officetel' ? '오피스텔' :
                            hard.building.type === 'house' ? '주택' : '주거공간';
    parts.push(`${pyeong}평 ${housingTypeText}에 거주 중이시고`);

    // 2. 가족 구성 (V3.1 설계서 스타일)
    const familyDesc = this.describeFamilyComposition(soft.family);
    if (familyDesc) {
      parts.push(familyDesc);
    }

    // 3. 핵심 Needs 힌트 (V3.1 설계서: "안전과 수납이 동시에 중요한 상황" 같은 표현)
    const needsHint = this.getNeedsHint(soft, hard);
    if (needsHint) {
      parts.push(needsHint);
    }

    return parts.join(', ') + '입니다.';
  }

  private describeFamilyComposition(family: FamilyComposition): string {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExplanationService.ts:99',message:'가족 구성 설명 생성',data:{familyCount:family.count,hasInfant:family.hasInfant,hasElderly:family.hasElderly,hasPet:family.hasPet},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    const parts: string[] = [];

    // V3.1 설계서 스타일: "3인 가족" 형식
    if (family.count === 1) {
      parts.push('1인 가구');
    } else {
      parts.push(`${family.count}인 가족`);
    }

    const conditions: string[] = [];
    if (family.hasInfant) conditions.push('영유아');
    if (family.hasElderly) conditions.push('고령자');
    if (family.hasPet) {
      const petSizeText = family.petSize === 'large' ? '대형' : family.petSize === 'medium' ? '중형' : '소형';
      conditions.push(`${petSizeText} 반려동물`);
    }

    if (conditions.length > 0) {
      parts.push(`${conditions.join(', ')} 있음`);
    }

    return parts.join(', ');
  }

  /**
   * 핵심 Needs 힌트 생성 (V3.1 설계서: "안전과 수납이 동시에 중요한 상황" 같은 표현)
   */
  private getNeedsHint(soft: any, hard: any): string {
    const hints: string[] = [];

    // 안전성 관련
    if (soft.family.hasInfant || soft.family.hasElderly) {
      hints.push('안전');
    }

    // 수납 관련
    if (soft.storage?.storageNeeds === 'high' || soft.storage?.organizationStress === 'high') {
      hints.push('수납');
    }

    // 내구성 관련
    if (hard.building.age === 'old' || hard.building.hasWaterDamage) {
      hints.push('내구성');
    }

    // 청소 관련
    if (soft.cleaning?.maintenanceStress === 'high') {
      hints.push('청소 편의성');
    }

    if (hints.length > 0) {
      if (hints.length === 1) {
        return `${hints[0]}이 중요한 상황`;
      } else if (hints.length === 2) {
        return `${hints[0]}과 ${hints[1]}이 동시에 중요한 상황`;
      } else {
        return `${hints.slice(0, -1).join(', ')}과 ${hints[hints.length - 1]}이 중요한 상황`;
      }
    }

    return '';
  }

  private describeLifestyle(lifestyle: LifestylePattern, kitchen: KitchenPattern): string {
    const parts: string[] = [];

    // 재택근무
    if (lifestyle.hasRemoteWork) {
      parts.push('재택근무를 하시며');
    }

    // 집에 머무는 시간
    if (lifestyle.timeAtHome === 'high') {
      parts.push('집에서 보내는 시간이 많습니다');
    }

    // 요리 빈도
    if (kitchen.cookingFrequency === 'often') {
      parts.push('요리를 자주 하십니다');
    }

    return parts.join(', ') + (parts.length > 0 ? '.' : '');
  }

  private describeBuildingCondition(building: any): string {
    const issues: string[] = [];

    if (building.hasWaterDamage) issues.push('누수/습기 이력');
    if (building.hasVentilationIssue) issues.push('환기 문제');

    if (issues.length > 0) {
      return `현재 ${issues.join(', ')}가 있는 상태입니다.`;
    }

    return '';
  }

  private describeBudget(level: 'low' | 'medium' | 'high' | 'premium', sensitive: boolean): string {
    const levelText = 
      level === 'premium' ? '프리미엄' :
      level === 'high' ? '충분한' : 
      level === 'medium' ? '적정' : 
      '제한적인';
    const sensitiveText = sensitive ? ', 예산 관리가 중요하십니다' : '';
    return `${levelText} 예산을 고려 중이십니다${sensitiveText}.`;
  }

  /**
   * Needs Layer 설명 (V3.1 설계서 기준)
   * "질문 답변을 바탕으로 '안전성 강화'와 '수납 강화' Needs가 강하게 나타났습니다."
   */
  private explainNeeds(needsResult: NeedsResult, coreInput: CoreInput): string {
    const { needs } = needsResult;

    // HIGH 레벨 Needs만 상세 설명
    const highNeeds = needs.filter(n => n.level === 'high');
    const midNeeds = needs.filter(n => n.level === 'mid');

    const parts: string[] = [];

    // V3.1 설계서 스타일: "질문 답변을 바탕으로 '안전성 강화'와 '수납 강화' Needs가 강하게 나타났습니다."
    if (highNeeds.length > 0) {
      const highNames = highNeeds.map(n => `'${this.getNeedName(n.id)}'`).join('과 ');
      parts.push(`질문 답변을 바탕으로 ${highNames} Needs가 강하게 나타났습니다.`);
      
      // 각 Needs의 이유 간략 설명
      highNeeds.forEach(need => {
        const explanation = this.explainSingleNeed(need, coreInput);
        parts.push(`- **${this.getNeedName(need.id)}**: ${explanation}`);
      });
    }

    // MID Needs 간략 언급
    if (midNeeds.length > 0) {
      const midNames = midNeeds.map(n => this.getNeedName(n.id)).join(', ');
      parts.push(`또한 ${midNames}도 함께 고려되었습니다.`);
    }

    return parts.join('\n\n');
  }

  private explainSingleNeed(need: NeedScore, coreInput: CoreInput): string {
    const { soft, hard } = coreInput;

    // Needs별 Input 연결 설명
    switch (need.id) {
      case 'safety':
        return this.explainSafetyNeed(soft.family);
      
      case 'storage':
        return this.explainStorageNeed(soft.storage, soft.family);
      
      case 'flow':
        return this.explainFlowNeed(soft.lifestyle, soft.kitchen);
      
      case 'durability':
        return this.explainDurabilityNeed(soft.family, soft.cleaning);
      
      case 'maintenance':
        return this.explainMaintenanceNeed(soft.cleaning, soft.family);
      
      case 'brightness':
        return this.explainBrightnessNeed(soft.lighting, hard.building);
      
      default:
        return need.reasons.join(', ');
    }
  }

  private explainSafetyNeed(family: FamilyComposition): string {
    const reasons: string[] = [];
    if (family.hasInfant) reasons.push('영유아가 있어 미끄럼 방지와 모서리 안전이 중요');
    if (family.hasElderly) reasons.push('고령자 동거로 인한 안전 손잡이 및 단차 제거 필요');
    if (family.hasPet && family.petSize !== 'small') reasons.push('반려동물로 인한 바닥 안전성 고려');
    
    return reasons.length > 0 ? reasons.join(', ') : '안전한 생활 환경이 필요합니다';
  }

  private explainStorageNeed(storage: StoragePattern, family: FamilyComposition): string {
    if (storage.storageNeeds === 'high' && storage.organizationStress !== 'none') {
      return '수납이 많이 필요하며 정리 스트레스가 있어, 효율적인 수납 시스템이 필수입니다';
    }
    if (storage.storageNeeds === 'high') {
      return '많은 물건을 보관해야 하므로 충분한 수납 공간이 필요합니다';
    }
    if (storage.organizationStress === 'high') {
      return '정리 정돈에 스트레스를 받으시므로, 숨김 수납 중심으로 계획해야 합니다';
    }
    return '적절한 수납 계획이 필요합니다';
  }

  private explainFlowNeed(lifestyle: LifestylePattern, kitchen: KitchenPattern): string {
    const reasons: string[] = [];
    
    if (lifestyle.hasRemoteWork) {
      reasons.push('재택근무로 인해 작업 공간 동선이 중요');
    }
    if (kitchen.cookingFrequency === 'often') {
      reasons.push('요리를 자주 하여 주방 동선 최적화가 필요');
    }
    if (lifestyle.timeAtHome === 'high') {
      reasons.push('집에서 보내는 시간이 많아 전체 동선이 편해야 함');
    }

    return reasons.length > 0 ? reasons.join(', ') : '효율적인 동선 설계가 필요합니다';
  }

  private explainDurabilityNeed(family: FamilyComposition, cleaning: CleaningPattern): string {
    const reasons: string[] = [];
    
    if (family.hasPet) {
      const petSize = family.petSize || 'small';
      if (petSize === 'large' || petSize === 'medium') {
        reasons.push('중/대형 반려동물로 인한 긁힘 방지 필요');
      }
    }
    if (family.hasInfant) {
      reasons.push('영유아의 활동으로 인한 내구성 요구');
    }
    if (cleaning.cleaningFrequency === 'less' || cleaning.cleaningFrequency === 'weekly-1') {
      reasons.push('청소 빈도가 낮아 관리가 쉬운 내구성 높은 마감재 필요');
    }

    return reasons.length > 0 ? reasons.join(', ') : '장기적으로 견딜 수 있는 마감재가 필요합니다';
  }

  private explainMaintenanceNeed(cleaning: CleaningPattern, family: FamilyComposition): string {
    if (cleaning.maintenanceStress === 'high') {
      return '청소와 관리에 큰 부담을 느끼시므로, 관리가 쉬운 마감재와 구조가 중요합니다';
    }
    if (cleaning.cleaningFrequency === 'daily') {
      return '매일 청소하시는 만큼 청소가 쉬운 구조가 필요합니다';
    }
    if (family.hasPet) {
      return '반려동물로 인해 털과 오염 관리가 쉬운 마감재가 필요합니다';
    }
    return '관리와 청소가 편한 환경이 필요합니다';
  }

  private explainBrightnessNeed(lighting: LightingPreference, building: any): string {
    const reasons: string[] = [];
    
    if (lighting.overallBrightness === 'bright') {
      reasons.push('밝은 공간을 선호하시므로 채광과 조명 계획이 중요');
    }
    if (building.floor === 'low') {
      reasons.push('저층으로 인한 자연 채광 보완 필요');
    }
    if (lighting.brightnessComplaints && lighting.brightnessComplaints.length > 0) {
      reasons.push(`${lighting.brightnessComplaints.join(', ')}의 어두움 개선 필요`);
    }

    return reasons.length > 0 ? reasons.join(', ') : '적절한 밝기 확보가 필요합니다';
  }

  /**
   * Resolution Layer 설명 (V3.1 설계서 기준)
   * "짐은 많지만 집은 가볍게 보이길 원하셔서, 눈에 보이지 않는 히든 수납 위주로 설계했습니다."
   */
  private explainResolution(resolutionResult: ResolutionResult): string {
    const { conflicts } = resolutionResult;

    if (!conflicts || conflicts.length === 0) {
      return '모든 니즈가 조화롭게 반영되었습니다.';
    }

    const parts: string[] = [];
    parts.push('일부 니즈가 충돌하여 다음과 같이 조정되었습니다:\n');

    conflicts.forEach(conflict => {
      // V3.1 설계서 스타일: "짐은 많지만 집은 가볍게 보이길 원하셔서, 눈에 보이지 않는 히든 수납 위주로 설계했습니다."
      parts.push(`- ${conflict.description}`);
      parts.push(`  → **조정:** ${conflict.resolution}`);
    });

    return parts.join('\n');
  }

  /**
   * Action Layer 설명 (V3.1 설계서 기준)
   * "욕실은 미끄럼 위험이 커서 미끄럼 방지 타일과 안전 손잡이를 필수로 추천드렸고, 거실에는 벽면 전체를 수납으로 쓰되 문선과 색을 맞춰 시각적으로 깔끔하게 처리했습니다."
   * 설명 톤: 과장 없이, 진단→결론 구조. "~하실 수 있습니다" 보다는 "~이 필요합니다 / ~이 더 좋습니다"처럼 전문가 어조.
   */
  private explainActions(actionResult: ActionResult, needsResult: NeedsResult): string {
    const { processes } = actionResult;

    // 우선순위별 분류
    const mustProcesses = processes.filter(p => p.priority === 'must');
    const recommendedProcesses = processes.filter(p => p.priority === 'recommended');

    const parts: string[] = [];

    // V3.1 설계서 스타일: 공간별로 묶어서 설명
    // MUST 공정 설명 (전문가 어조)
    if (mustProcesses.length > 0) {
      mustProcesses.forEach(proc => {
        // V3.1 설계서 스타일: "욕실은 미끄럼 위험이 커서 미끄럼 방지 타일과 안전 손잡이를 필수로 추천드렸고"
        const needsNames = proc.relatedNeeds.map(nid => this.getNeedName(nid)).join(', ');
        // 전문가 어조: "~이 필요합니다" / "~이 더 좋습니다"
        parts.push(`**${proc.processName}**: ${proc.reason} (${needsNames} 니즈)`);
      });
    }

    // RECOMMENDED 공정 간략 언급
    if (recommendedProcesses.length > 0) {
      const names = recommendedProcesses.map(p => p.processName).join(', ');
      parts.push(`또한 ${names}도 함께 고려하시면 더 좋습니다.`);
    }

    return parts.join('\n\n');
  }

  /**
   * Needs ID → 한글 이름 변환
   */
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
}

