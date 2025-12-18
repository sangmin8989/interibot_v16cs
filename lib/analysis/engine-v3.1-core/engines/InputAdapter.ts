/**
 * V3.1 Core Edition - Input Adapter
 * 
 * 기존 V3 엔진의 입력을 V3.1 Core Input 구조로 변환합니다.
 * 
 * 변환 흐름:
 * - V3EngineInput + TraitEngineResult → CoreInput
 */

import {
  CoreInput,
  SoftInputCore,
  HardInputCore,
  BudgetInputCore,
  RoomsCore,
  Room,
  RoomType,
  RoomUsageTag,
  BuildingAge,
} from '../types/input';

import {
  V3EngineInput,
  TraitEngineResult,
  BudgetRange,
} from '../../engine-v3/types';

import { SpaceInfo } from '../../types';

// ============ 어댑터 클래스 ============

export class InputAdapter {
  /**
   * V3 입력 → V3.1 Core Input 변환 (메인 함수)
   */
  static convertV3ToCoreInput(
    v3Input: V3EngineInput,
    traitResult: TraitEngineResult
  ): CoreInput {
    console.log('📥 [InputAdapter] V3 → V3.1 Core 변환 시작');

    const soft = this.extractSoftInput(v3Input, traitResult);
    const hard = this.extractHardInput(v3Input.spaceInfo);
    const budget = this.extractBudgetInput(v3Input.budget, v3Input.spaceInfo);
    const rooms = this.extractRooms(v3Input.spaceInfo, v3Input.selectedSpaces);

    const coreInput: CoreInput = {
      soft,
      hard,
      budget,
      rooms,
      timestamp: new Date().toISOString(),
      _source: 'v3',
    };

    console.log('✅ [InputAdapter] 변환 완료:', {
      pyeong: hard.pyeong,
      familyCount: soft.family.count,
      roomsCount: rooms.rooms.length,
    });

    return coreInput;
  }

  // ============ Soft Input 추출 ============

  private static extractSoftInput(
    v3Input: V3EngineInput,
    traitResult: TraitEngineResult
  ): SoftInputCore {
    // V3EngineInput는 answers를 사용
    const answers = v3Input.answers || {};
    const { vibeInput } = v3Input;
    const { indicators } = traitResult;

    // 가족 구성
    const family = {
      count: this.getFamilyCount(answers, vibeInput),
      hasInfant: this.hasInfant(answers, indicators),
      hasElderly: this.hasElderly(answers, indicators),
      hasPet: this.hasPet(answers, indicators),
      petSize: this.getPetSize(answers, indicators),
    };

    // 생활 루틴
    const lifestyle = {
      hasRemoteWork: this.hasRemoteWork(answers, traitResult.lifestyleType),
      timeAtHome: this.getTimeAtHome(answers, indicators),
      mainActivity: this.getMainActivity(answers),
    };

    // 주방 패턴
    const kitchen = {
      cookingFrequency: this.getCookingFrequency(answers, indicators),
      oilyCooking: this.getOilyCooking(answers, indicators),
      foodStorage: this.getFoodStorage(answers, indicators),
    };

    // 수납 패턴
    const storage = {
      storageNeeds: this.getStorageNeeds(indicators),
      organizationStress: this.getOrganizationStress(answers, indicators),
      prefersHiddenStorage: this.prefersHiddenStorage(answers, indicators),
    };

    // 청소 패턴
    const cleaning = {
      cleaningFrequency: this.getCleaningFrequency(answers, indicators),
      maintenanceStress: this.getMaintenanceStress(indicators),
    };

    // 조명 선호
    const lighting = {
      overallBrightness: this.getOverallBrightness(answers, indicators),
      prefersIndirectLighting: this.prefersIndirectLighting(answers),
      brightnessComplaints: this.getBrightnessComplaints(answers),
    };

    return {
      family,
      lifestyle,
      kitchen,
      storage,
      cleaning,
      lighting,
    };
  }

  // ============ Hard Input 추출 ============

private static extractHardInput(spaceInfo: SpaceInfo): HardInputCore {
  // ✅ 입력한 평수가 있으면 무조건 사용, 없을 때만 기본값 사용
  const pyeong = spaceInfo.pyeong && spaceInfo.pyeong > 0 ? spaceInfo.pyeong : 25; // 기본값 25평
  console.log('📏 [InputAdapter] 평수 추출:', {
    입력값: spaceInfo.pyeong,
    최종값: pyeong,
    기본값사용: spaceInfo.pyeong && spaceInfo.pyeong > 0 ? '아니오' : '예',
    전체spaceInfo: JSON.stringify(spaceInfo),
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputAdapter.ts:132',message:'InputAdapter 평수 추출',data:{입력값:spaceInfo.pyeong,최종값:pyeong,기본값사용:spaceInfo.pyeong && spaceInfo.pyeong > 0 ? '아니오' : '예',전체spaceInfo:JSON.stringify(spaceInfo)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
  // #endregion
  console.log('🏠 [InputAdapter] 주거형태 추출:', {
    입력값: spaceInfo.housingType,
    변환값: this.convertHousingType(spaceInfo.housingType),
  });
  const age = this.getBuildingAge(spaceInfo);

  // SpaceInfo 타입을 확장 타입으로 안전하게 처리
  const extendedInfo = spaceInfo as SpaceInfo & {
    hasBalcony?: boolean;
    buildingAge?: number;
    floor?: number;
    hasWaterDamage?: boolean;
    hasVentilationIssue?: boolean;
    bathroomMoldIssue?: boolean;
    bathroomDarkness?: boolean;
  };

  return {
    pyeong,
    building: {
      age,
      type: this.convertHousingType(spaceInfo.housingType), // ✅ 하드코딩 제거, 변환 함수 사용
      occupied: true,    // Core Edition: 거주 중 고정
      hasBalcony: extendedInfo.hasBalcony,
      hasWaterDamage: this.checkWaterDamage(extendedInfo),
      hasVentilationIssue: this.checkVentilationIssue(extendedInfo),
      floor: this.getFloorLevel(extendedInfo),
    },
    livingPurpose: (extendedInfo as any).livingPurpose || spaceInfo.livingPurpose,
    livingYears: (extendedInfo as any).livingYears || spaceInfo.livingYears,
  };
}

  // ============ Budget Input 추출 ============

  private static extractBudgetInput(budget: BudgetRange, spaceInfo?: SpaceInfo): BudgetInputCore {
    const levelMap: Record<BudgetRange, 'low' | 'medium' | 'high' | 'premium'> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      premium: 'premium',
    };

    // SpaceInfo에서 예산 금액 추출 (있는 경우)
    const extendedInfo = spaceInfo as SpaceInfo & { budgetAmount?: number };
    const budgetAmount = extendedInfo?.budgetAmount;

    return {
      level: levelMap[budget] || 'medium',
      priceSensitive: budget === 'low',
      amount: budgetAmount,
    };
  }

  // ============ Rooms 추출 ============

  private static extractRooms(spaceInfo: SpaceInfo, selectedSpaces: string[]): RoomsCore {
    const rooms: Room[] = [];

    // selectedSpaces를 기반으로 Room 목록 생성
    // V3의 공간 ID → V3.1 RoomType 매핑
    const spaceMapping: Record<string, { type: RoomType; usageTags: RoomUsageTag[] }> = {
      living: { type: 'living', usageTags: ['rest', 'tv'] },
      kitchen: { type: 'kitchen', usageTags: ['cooking'] },
      dining: { type: 'dining', usageTags: ['rest'] },
      entrance: { type: 'entrance', usageTags: ['entry'] },
      hallway: { type: 'hallway', usageTags: ['entry'] },
      'master-bedroom': { type: 'master-bedroom', usageTags: ['sleep'] },
      'child-room': { type: 'child-room', usageTags: ['sleep', 'play'] },
      bathroom: { type: 'bathroom', usageTags: ['hygiene'] },
      'powder-room': { type: 'powder-room', usageTags: ['hygiene'] },
      utility: { type: 'utility', usageTags: ['laundry', 'storage'] },
      balcony: { type: 'balcony', usageTags: ['storage'] },
      study: { type: 'study', usageTags: ['work', 'study'] },
    };

    selectedSpaces.forEach((spaceId) => {
      const mapping = spaceMapping[spaceId];
      if (mapping) {
        rooms.push({
          type: mapping.type,
          label: this.getSpaceLabel(spaceId),
          usageTags: mapping.usageTags,
          specialTags: [],
          issues: this.detectRoomIssues(spaceId, spaceInfo),
        });
      }
    });

    return { rooms };
  }

  // ============ 헬퍼 함수들 ============

  private static getFamilyCount(answers: Record<string, string>, vibeInput?: any): number {
    // 가족 인원수 추출 (질문 답변 또는 vibe에서)
    if (vibeInput?.familySize) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputAdapter.ts:234',message:'vibeInput에서 familySize 추출',data:{familySize:vibeInput.familySize},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('🔍 [InputAdapter.getFamilyCount] vibeInput에서 추출:', vibeInput.familySize);
      return vibeInput.familySize;
    }
    // 답변에서 추론 (예: Q_FAMILY_SIZE)
    const familyAnswer = answers['Q_FAMILY_SIZE'];
    console.log('🔍 [InputAdapter.getFamilyCount] Q_FAMILY_SIZE 확인:', {
      Q_FAMILY_SIZE: familyAnswer,
      전체answers키: Object.keys(answers),
      answers전체: answers,
    });
    if (familyAnswer) {
      const match = familyAnswer.match(/\d+/);
      if (match) {
        const count = parseInt(match[0], 10);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputAdapter.ts:239',message:'Q_FAMILY_SIZE에서 추출',data:{familyAnswer,match:match[0],count},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.log('✅ [InputAdapter.getFamilyCount] Q_FAMILY_SIZE에서 추출 성공:', count);
        return count;
      } else {
        console.warn('⚠️ [InputAdapter.getFamilyCount] Q_FAMILY_SIZE에 숫자가 없음:', familyAnswer);
      }
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputAdapter.ts:241',message:'Q_FAMILY_SIZE 없음, 기본값 1 반환',data:{familyAnswer,Q_FAMILY_SIZE:answers['Q_FAMILY_SIZE'],전체answers:Object.keys(answers),vibeInput},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.warn('⚠️ [InputAdapter.getFamilyCount] Q_FAMILY_SIZE 없음, 기본값 1 반환:', {
      Q_FAMILY_SIZE: answers['Q_FAMILY_SIZE'],
      전체answers키: Object.keys(answers),
    });
    // ✅ 기본값을 2에서 1로 변경 (1인 가구가 더 일반적)
    return 1; // 기본값
  }

  private static hasInfant(answers: Record<string, string>, indicators: any): boolean {
    // 영유아 여부 (질문 답변 또는 가족영향도)
    const familyAnswer = answers['Q8']; // 예시: Q8이 가족 관련 질문
    if (familyAnswer?.includes('아이')) return true;
    return indicators.가족영향도 > 70; // 임계값 기반 추론
  }

  private static hasElderly(answers: Record<string, string>, indicators: any): boolean {
    const familyAnswer = answers['Q8'];
    if (familyAnswer?.includes('부모') || familyAnswer?.includes('노인')) return true;
    return false;
  }

  private static hasPet(answers: Record<string, string>, indicators: any): boolean {
    // ✅ Q_HAS_PET을 우선 확인 (convertToV3Input에서 설정)
    if (answers['Q_HAS_PET'] === 'yes') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputAdapter.ts:272',message:'Q_HAS_PET에서 반려동물 확인',data:{Q_HAS_PET:answers['Q_HAS_PET']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      return true;
    }
    // ✅ lifestyleTags에서 'hasPets' 확인
    const lifestyleTags = Object.keys(answers).filter(k => k.startsWith('Q_LIFESTYLE_'));
    for (const key of lifestyleTags) {
      if (answers[key] === 'hasPets') {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputAdapter.ts:280',message:'lifestyleTags에서 반려동물 확인',data:{tag:answers[key]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        return true;
      }
    }
    // 기존 로직 (Q8 답변 확인)
    const petAnswer = answers['Q8'];
    if (petAnswer?.includes('반려동물') || petAnswer?.includes('강아지') || petAnswer?.includes('고양이')) {
      return true;
    }
    return indicators.반려동물영향도 > 50;
  }

  private static getPetSize(answers: Record<string, string>, indicators: any): 'small' | 'medium' | 'large' | undefined {
    if (!this.hasPet(answers, indicators)) return undefined;
    const petAnswer = answers['Q8'];
    if (petAnswer?.includes('대형')) return 'large';
    if (petAnswer?.includes('중형')) return 'medium';
    return 'small';
  }

  private static hasRemoteWork(answers: Record<string, string>, lifestyleType: string): boolean {
    const workAnswer = answers['Q2']; // 예시: Q2가 생활 패턴 질문
    if (workAnswer?.includes('재택') || workAnswer?.includes('집에서 일')) return true;
    return lifestyleType === 'focus';
  }

  private static getTimeAtHome(answers: Record<string, string>, indicators: any): 'low' | 'medium' | 'high' {
    const timeAnswer = answers['Q2'];
    if (timeAnswer?.includes('거의 없') || timeAnswer?.includes('적은')) return 'low';
    if (timeAnswer?.includes('많') || timeAnswer?.includes('대부분')) return 'high';
    return 'medium';
  }

  private static getMainActivity(answers: Record<string, string>): 'tv' | 'dining' | 'sofa' | 'bedroom' | 'mixed' | undefined {
    const activityAnswer = answers['Q3'];
    if (activityAnswer?.includes('TV')) return 'tv';
    if (activityAnswer?.includes('식탁')) return 'dining';
    if (activityAnswer?.includes('소파')) return 'sofa';
    if (activityAnswer?.includes('침실') || activityAnswer?.includes('방')) return 'bedroom';
    return 'mixed';
  }

  private static getCookingFrequency(answers: Record<string, string>, indicators: any): 'rarely' | 'sometimes' | 'often' {
    const cookAnswer = answers['Q5']; // 예시: Q5가 요리 빈도
    if (cookAnswer?.includes('거의 안') || cookAnswer?.includes('거의 하지')) return 'rarely';
    if (cookAnswer?.includes('자주') || cookAnswer?.includes('매일')) return 'often';
    return 'sometimes';
  }

  private static getOilyCooking(answers: Record<string, string>, indicators: any): 'low' | 'medium' | 'high' {
    const cookAnswer = answers['Q5'];
    if (cookAnswer?.includes('기름') || cookAnswer?.includes('튀김')) return 'high';
    return 'medium';
  }

  private static getFoodStorage(answers: Record<string, string>, indicators: any): 'low' | 'medium' | 'high' {
    if (indicators.수납중요도 > 70) return 'high';
    if (indicators.수납중요도 < 40) return 'low';
    return 'medium';
  }

  private static getStorageNeeds(indicators: any): 'low' | 'medium' | 'high' {
    if (indicators.수납중요도 >= 70) return 'high';
    if (indicators.수납중요도 <= 40) return 'low';
    return 'medium';
  }

  private static getOrganizationStress(answers: Record<string, string>, indicators: any): 'none' | 'some' | 'high' {
    const storageAnswer = answers['Q4']; // 예시: Q4가 정리 관련
    if (storageAnswer?.includes('스트레스') || storageAnswer?.includes('어지러')) return 'high';
    if (indicators.수납중요도 > 70) return 'some';
    return 'none';
  }

  private static prefersHiddenStorage(answers: Record<string, string>, indicators: any): boolean {
    if (indicators.스타일고집도 > 60) return true;
    return false;
  }

  private static getCleaningFrequency(answers: Record<string, string>, indicators: any): 'daily' | 'weekly-2-3' | 'weekly-1' | 'less' {
    const cleanAnswer = answers['Q4'];
    if (cleanAnswer?.includes('매일') || cleanAnswer?.includes('자주')) return 'daily';
    if (cleanAnswer?.includes('주 2') || cleanAnswer?.includes('주 3')) return 'weekly-2-3';
    if (cleanAnswer?.includes('주 1')) return 'weekly-1';
    return 'less';
  }

  private static getMaintenanceStress(indicators: any): 'low' | 'medium' | 'high' {
    if (indicators.관리민감도 >= 70) return 'high';
    if (indicators.관리민감도 <= 40) return 'low';
    return 'medium';
  }

  private static getOverallBrightness(answers: Record<string, string>, indicators: any): 'bright' | 'medium' | 'dim' {
    const lightAnswer = answers['Q7']; // 예시: Q7이 조명 관련
    if (lightAnswer?.includes('밝') || lightAnswer?.includes('환')) return 'bright';
    if (lightAnswer?.includes('어두') || lightAnswer?.includes('은은')) return 'dim';
    return 'medium';
  }

  private static prefersIndirectLighting(answers: Record<string, string>): boolean {
    const lightAnswer = answers['Q7'];
    if (lightAnswer?.includes('간접') || lightAnswer?.includes('분위기')) return true;
    return false;
  }

  private static getBrightnessComplaints(answers: Record<string, string>): string[] | undefined {
    // 특정 공간 밝기 불만 추출
    const complaints: string[] = [];
    Object.entries(answers).forEach(([key, value]) => {
      if (value?.includes('어두') || value?.includes('조명 부족')) {
        if (value.includes('거실')) complaints.push('거실');
        if (value.includes('안방')) complaints.push('안방');
        if (value.includes('주방')) complaints.push('주방');
      }
    });
    return complaints.length > 0 ? complaints : undefined;
  }

  private static getBuildingAge(spaceInfo: SpaceInfo): BuildingAge {
    // buildingAge는 SpaceInfo 확장 필드
    const age = (spaceInfo as any).buildingAge || 10; // 기본값 10년
    if (age <= 5) return 'new';
    if (age <= 15) return 'semi-new';
    return 'old';
  }

  private static checkWaterDamage(spaceInfo: SpaceInfo): boolean {
    // spaceInfo에서 누수 이력 확인 (필드가 있다면)
    return (spaceInfo as any).hasWaterDamage || false;
  }

  private static checkVentilationIssue(spaceInfo: SpaceInfo): boolean {
    // spaceInfo에서 환기 문제 확인
    return (spaceInfo as any).hasVentilationIssue || false;
  }

  private static getFloorLevel(spaceInfo: SpaceInfo): 'low' | 'mid' | 'high' | undefined {
    const floor = (spaceInfo as any).floor;
    if (!floor) return undefined;
    if (floor <= 3) return 'low';
    if (floor >= 10) return 'high';
    return 'mid';
  }

  private static getSpaceLabel(spaceId: string): string {
    const labelMap: Record<string, string> = {
      living: '거실',
      kitchen: '주방',
      dining: '다이닝',
      entrance: '현관',
      hallway: '복도',
      'master-bedroom': '안방',
      'child-room': '자녀방',
      bathroom: '욕실',
      'powder-room': '화장실',
      utility: '다용도실',
      balcony: '발코니',
      study: '서재',
    };
    return labelMap[spaceId] || spaceId;
  }

  private static detectRoomIssues(spaceId: string, spaceInfo: SpaceInfo): string[] | undefined {
    const issues: string[] = [];
    
    // spaceInfo의 특정 필드를 기반으로 문제 감지
    // (실제로는 더 정교한 로직 필요)
    if (spaceId === 'bathroom') {
      if ((spaceInfo as any).bathroomMoldIssue) issues.push('곰팡이');
      if ((spaceInfo as any).bathroomDarkness) issues.push('어두움');
    }
    
    return issues.length > 0 ? issues : undefined;
  }

  /**
   * 주거형태 변환 (한글 → 영어)
   */
  private static convertHousingType(housingType: string | null | undefined): 'apartment' | 'villa' | 'officetel' | 'house' {
    if (!housingType) {
      console.warn('⚠️ [InputAdapter] housingType이 없어 기본값(apartment) 사용');
      return 'apartment';
    }
    
    // 한글 → 영어 변환
    const typeMap: Record<string, 'apartment' | 'villa' | 'officetel' | 'house'> = {
      '아파트': 'apartment',
      '빌라': 'villa',
      '오피스텔': 'officetel',
      '단독주택': 'house',
      '주택': 'house',
    };
    
    // 이미 영어로 되어 있으면 그대로 사용
    if (housingType === 'apartment' || housingType === 'villa' || 
        housingType === 'officetel' || housingType === 'house') {
      return housingType;
    }
    
    // 한글 → 영어 변환
    const converted = typeMap[housingType];
    if (converted) {
      console.log('✅ [InputAdapter] 주거형태 변환:', { 입력: housingType, 변환: converted });
      return converted;
    }
    
    // 매핑되지 않은 경우 기본값
    console.warn('⚠️ [InputAdapter] 알 수 없는 주거형태:', housingType, '→ apartment로 변환');
    return 'apartment';
  }
}

