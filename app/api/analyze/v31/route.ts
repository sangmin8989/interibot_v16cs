/**
 * V3.1 Core Edition API 엔드포인트
 * 
 * 역할:
 * 1. 기존 입력 → V3.1 Core 엔진 실행
 * 2. ExplanationService로 설명 생성
 * 3. ResultFormatter로 UI 형식 변환
 * 4. 결과 반환
 * 
 * 사용:
 * POST /api/analyze/v31
 * Body: { spaceInfo, selectedSpaces, personality, ... }
 */

import { NextRequest, NextResponse } from 'next/server';
import { V31CoreEngine, V31CoreResult } from '@/lib/analysis/engine-v3.1-core';
import { ExplanationService } from '@/lib/analysis/engine-v3.1-core/services/ExplanationService';
import { ResultFormatter } from '@/lib/analysis/engine-v3.1-core/services/ResultFormatter';
import { V3EngineInput, TraitEngineResult } from '@/lib/analysis/engine-v3/types';
import { TraitEngine } from '@/lib/analysis/engine-v3/engines/TraitEngine';

// ============ 요청 타입 ============

interface V31AnalysisRequest {
  // 1단계: 집 정보
  spaceInfo: {
    housingType: string;
    pyeong: number;
    rooms?: number;
    bathrooms?: number;
    buildingAge?: number;
    hasBalcony?: boolean;
    budget?: string;
    budgetAmount?: number;
    familySizeRange?: string;
    ageRanges?: string[];
    ageGroups?: { // ✅ 연령대별 구체적 인원수 추가
      baby?: number;
      child?: number;
      teen?: number;
      adult?: number;
      senior?: number;
    };
    lifestyleTags?: string[];
    livingPurpose?: '실거주' | '매도준비' | '임대' | '입력안함';
    livingYears?: number;
    totalPeople?: number;
    additionalNotes?: string; // ✅ 추가 정보 (자유 입력)
    specialConditions?: {
      hasPets?: boolean;
      petTypes?: string[];
      hasElderly?: boolean;
      hasPregnant?: boolean;
      hasDisabledMember?: boolean;
      hasShiftWorker?: boolean;
    };
  };
  
  // 2단계: 선택된 공간
  selectedSpaces: string[];
  
  // 3단계: 선택된 공정 (전체 공정 또는 기본 공정)
  selectedProcessesBySpace?: Record<string, any>;
  tierSelections?: Record<string, any>;
  
  // 5단계: 성향분석 결과
  personality?: {
    mode?: string;
    answers?: Record<string, string>;
    vibeData?: {
      mbti?: string;
      bloodType?: string;
      birthdate?: string;
    };
  };
}

// ============ API 핸들러 ============

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: V31AnalysisRequest = await request.json();
    
    console.log('🚀 [V3.1 API] 분석 요청 시작:', {
      평수: body.spaceInfo?.pyeong,
      주거형태: body.spaceInfo?.housingType,
      선택공간: body.selectedSpaces?.length,
      선택공정: body.selectedProcessesBySpace ? Object.keys(body.selectedProcessesBySpace).length : 0,
      티어선택: body.tierSelections ? Object.keys(body.tierSelections).length : 0,
      전체spaceInfo: JSON.stringify(body.spaceInfo),
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analyze/v31/route.ts:86',message:'V3.1 API 평수 수신 확인',data:{평수:body.spaceInfo?.pyeong,평수타입:typeof body.spaceInfo?.pyeong,전체spaceInfo:JSON.stringify(body.spaceInfo)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion

    // ============ Step 1: 입력 검증 ============
    
    if (!body.spaceInfo || !body.selectedSpaces) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 정보가 누락되었습니다. (spaceInfo, selectedSpaces)',
        },
        { status: 400 }
      );
    }

    // ============ Step 2: V3 형식으로 변환 ============
    
    const v3Input: V3EngineInput = convertToV3Input(body);
    
    console.log('📝 [V3.1 API] V3 입력 변환 완료:', {
      평수: v3Input.spaceInfo?.pyeong,
      전체spaceInfo: JSON.stringify(v3Input.spaceInfo),
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analyze/v31/route.ts:111',message:'V3 입력 변환 후 평수 확인',data:{평수:v3Input.spaceInfo?.pyeong,원본평수:body.spaceInfo?.pyeong,일치여부:v3Input.spaceInfo?.pyeong === body.spaceInfo?.pyeong ? '일치' : '불일치',전체spaceInfo:JSON.stringify(v3Input.spaceInfo)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion

    // ============ Step 3: TraitEngine 실행 (Needs 계산에 필요) ============
    
    const traitEngine = new TraitEngine();
    const traitResult: TraitEngineResult = await traitEngine.analyze(v3Input);
    
    console.log('🧠 [V3.1 API] TraitEngine 완료:', {
      keywords: traitResult.keywords?.length,
      priorityAreas: traitResult.priorityAreas?.length,
    });

    // ============ Step 4: V3.1 Core 엔진 실행 ============
    
    const v31Engine = new V31CoreEngine();
    const v31Result: V31CoreResult = v31Engine.analyze(v3Input, traitResult);
    
    console.log('✅ [V3.1 API] V3.1 Core 엔진 완료:', {
      inScope: v31Result.inScope,
      executionTime: v31Result.executionTime,
      평수: v31Result.coreInput?.hard?.pyeong,
      전체coreInput: JSON.stringify(v31Result.coreInput?.hard),
    });

    // ============ Step 5: 범위 밖 처리 (Fallback) ============
    
    if (!v31Result.inScope) {
      console.warn('⚠️ [V3.1 API] Core Edition 범위 밖');
      
      return NextResponse.json(
        {
          success: true,
          engine: 'v3.1-out-of-scope',
          message: v31Result.scopeCheck?.message || 'Core Edition 범위를 벗어났습니다.',
          scopeCheck: v31Result.scopeCheck,
          fallbackAvailable: true,
        },
        { status: 200 }
      );
    }

    // ============ Step 6: 설명 생성 (ExplanationService) ============
    
    const explanationService = new ExplanationService();
    // ✅ 원본 입력값 전달 (고객이 입력한 평수 그대로 반영)
    const originalPyeong = v3Input.spaceInfo?.pyeong;
    const explanations = explanationService.generateExplanation(v31Result, originalPyeong);
    
    console.log('📝 [V3.1 API] 설명 생성 완료:', {
      segments: explanations.length,
    });

    // ============ Step 7: UI 형식 변환 (ResultFormatter) ============
    
    const formatter = new ResultFormatter();
    // ✅ v3Input을 전달하여 totalPeople 접근 가능하도록 함
    const uiResult = formatter.formatForUI(v31Result, explanations, v3Input);
    
    console.log('🎨 [V3.1 API] UI 형식 변환 완료');

    // ============ Step 8: 최종 응답 ============
    
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        success: true,
        engine: 'v3.1-core',
        version: v31Result.version,
        result: uiResult,
        meta: {
          totalExecutionTime: totalTime,
          engineExecutionTime: v31Result.executionTime,
          timestamp: v31Result.timestamp,
        },
        // 디버그용 (개발 환경에서만)
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            coreInput: v31Result.coreInput,
            needsResult: v31Result.needsResult,
            resolutionResult: v31Result.resolutionResult,
          },
        }),
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ [V3.1 API] 오류 발생:', error);
    
    // 에러 타입별 처리
    const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
    const errorDetails = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    
    return NextResponse.json(
      {
        success: false,
        error: 'V3.1 분석 중 오류가 발생했습니다.',
        message: errorMessage,
        ...(errorDetails && { details: errorDetails }),
      },
      { status: 500 }
    );
  }
}

// ============ 헬퍼 함수: V31AnalysisRequest → V3EngineInput 변환 ============

function convertToV3Input(request: V31AnalysisRequest): V3EngineInput {
  const { spaceInfo, selectedSpaces, selectedProcessesBySpace, tierSelections, personality } = request;

  // answers 생성 (personality.answers 또는 빈 객체)
  const answers: Record<string, string> = personality?.answers || {};

    // ✅ 가족 정보 추가 - spaceInfo.totalPeople을 항상 우선 사용 (가장 정확한 값)
  if (spaceInfo.totalPeople) {
    answers['Q_FAMILY_SIZE'] = String(spaceInfo.totalPeople);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analyze/v31/route.ts:220',message:'Q_FAMILY_SIZE 설정',data:{totalPeople:spaceInfo.totalPeople,Q_FAMILY_SIZE:answers['Q_FAMILY_SIZE'],familySizeRange:spaceInfo.familySizeRange},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.log('✅ [convertToV3Input] totalPeople 우선 사용:', {
      totalPeople: spaceInfo.totalPeople,
      Q_FAMILY_SIZE: answers['Q_FAMILY_SIZE'],
      familySizeRange: spaceInfo.familySizeRange,
      전체answers: Object.keys(answers),
    });
  } else if (!answers['Q_FAMILY_SIZE']) {
    // totalPeople이 없을 때만 personality.answers 사용
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analyze/v31/route.ts:225',message:'totalPeople 없음 경고',data:{totalPeople:spaceInfo.totalPeople,familySizeRange:spaceInfo.familySizeRange,personalityAnswers:answers['Q_FAMILY_SIZE']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.log('⚠️ [convertToV3Input] totalPeople 없음, personality.answers 사용:', {
      totalPeople: spaceInfo.totalPeople,
      familySizeRange: spaceInfo.familySizeRange,
      Q_FAMILY_SIZE: answers['Q_FAMILY_SIZE'],
      전체spaceInfo: JSON.stringify(spaceInfo),
    });
  }

  // ✅ 추가 정보(additionalNotes)를 답변에 포함 (AI가 분석할 수 있도록)
  if (spaceInfo.additionalNotes && spaceInfo.additionalNotes.trim()) {
    answers['Q_ADDITIONAL_NOTES'] = spaceInfo.additionalNotes.trim();
    console.log('📝 [convertToV3Input] 추가 정보 전달:', spaceInfo.additionalNotes);
  }

  // ✅ 연령대별 구체적 인원수 정보 활용
  if (spaceInfo.ageGroups) {
    const ageGroupsStr = Object.entries(spaceInfo.ageGroups)
      .filter(([_, count]) => count > 0)
      .map(([age, count]) => `${age}:${count}`)
      .join(',');
    if (ageGroupsStr) {
      answers['Q_AGE_GROUPS'] = ageGroupsStr;
      console.log('👥 [convertToV3Input] 연령대별 인원수 전달:', spaceInfo.ageGroups);
    }
  }

  // 특수 조건 → 답변 변환
  if (spaceInfo.specialConditions) {
    if (spaceInfo.specialConditions.hasPets) {
      answers['Q_HAS_PET'] = 'yes';
    }
    if (spaceInfo.specialConditions.hasElderly) {
      answers['Q_HAS_ELDERLY'] = 'yes';
    }
  }

  // 생활 태그 → 답변 변환
  if (spaceInfo.lifestyleTags) {
    spaceInfo.lifestyleTags.forEach((tag, index) => {
      answers[`Q_LIFESTYLE_${index}`] = tag;
      // ✅ 'hasPets' 태그가 있으면 Q_HAS_PET도 설정 (중복 방지)
      if (tag === 'hasPets' && !answers['Q_HAS_PET']) {
        answers['Q_HAS_PET'] = 'yes';
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analyze/v31/route.ts:264',message:'lifestyleTags에서 hasPets 발견, Q_HAS_PET 설정',data:{tag,lifestyleTags:spaceInfo.lifestyleTags},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
      }
    });
  }

  // vibeInput 변환
  const vibeInput = personality?.vibeData
    ? {
        mbti: personality.vibeData.mbti,
        bloodType: personality.vibeData.bloodType,
        birthdate: personality.vibeData.birthdate,
      }
    : undefined;

  // budget 변환
  const budget = spaceInfo.budget
    ? (spaceInfo.budget.toLowerCase() as 'low' | 'medium' | 'high' | 'premium')
    : 'medium';

  // ✅ 선택된 공정 처리: selectedProcessesBySpace에서 공정 ID 목록 추출
  // ✅ 핵심: 선택된 공간에 해당하는 공정만 추출 + 카테고리 → V3.1 공정 ID 변환
  let selectedProcesses: string[] = []
  if (selectedProcessesBySpace && Object.keys(selectedProcessesBySpace).length > 0) {
    const allProcessIds = new Set<string>()
    const selectedSpaceSet = new Set(selectedSpaces) // 선택된 공간 Set 생성
    
    // 카테고리 → V3.1 공정 ID 매핑 함수
    const mapCategoryToProcessIds = (spaceId: string, category: string, value: string | string[]): string[] => {
      const processIds: string[] = []
      const values = Array.isArray(value) ? value : [value]
      
      // 주방 공정 매핑
      if (spaceId === 'kitchen' || spaceId === '주방') {
        if (category === 'kitchen_core' || category === 'kitchen_countertop') {
          if (values.some(v => v === 'full' || v === 'partial')) {
            processIds.push('kitchen-countertop', 'kitchen-cabinets', 'kitchen-sink')
          }
        }
        if (category === 'wall_finish') {
          if (values.some(v => v === 'tile' || v === 'film')) {
            processIds.push('kitchen-wall')
          }
        }
        if (category === 'electric_lighting') {
          if (values.some(v => v !== 'none')) {
            processIds.push('kitchen-lighting')
          }
        }
        // kitchen_core가 있으면 후드도 포함
        if (category === 'kitchen_core' && values.some(v => v === 'full' || v === 'partial')) {
          processIds.push('kitchen-hood')
        }
      }
      
      // 욕실 공정 매핑
      if (spaceId === 'bathroom' || spaceId === '욕실') {
        if (category === 'bathroom_core') {
          processIds.push('bathroom-floor', 'bathroom-wall', 'bathroom-ceiling')
        }
        if (category === 'wall_finish' && values.some(v => v === 'tile')) {
          processIds.push('bathroom-wall')
        }
        if (category === 'floor_finish' && values.some(v => v === 'tile')) {
          processIds.push('bathroom-floor')
        }
        if (category === 'electric_lighting') {
          processIds.push('bathroom-lighting')
        }
        if (category === 'options' && values.some(v => v.includes('storage') || v.includes('수납'))) {
          processIds.push('bathroom-storage')
        }
      }
      
      // 거실 공정 매핑
      if (spaceId === 'living' || spaceId === '거실') {
        if (category === 'wall_finish' || category === 'floor_finish') {
          processIds.push('living-flooring')
        }
        if (category === 'electric_lighting') {
          processIds.push('living-lighting')
        }
        if (category === 'options' && values.some(v => v.includes('storage') || v.includes('수납') || v.includes('closet'))) {
          processIds.push('living-storage')
        }
      }
      
      return processIds
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analyze/v31/route.ts:311',message:'selectedProcessesBySpace 파싱 시작',data:{selectedSpaces:selectedSpaces,selectedProcessesBySpaceKeys:Object.keys(selectedProcessesBySpace),selectedProcessesBySpace:JSON.stringify(selectedProcessesBySpace)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // ✅ 선택된 공간에 해당하는 공정만 추출 + 카테고리 → V3.1 공정 ID 변환
    Object.entries(selectedProcessesBySpace).forEach(([spaceId, spaceSelections]: [string, any]) => {
      // ✅ 선택된 공간이 아니면 건너뛰기
      if (!selectedSpaceSet.has(spaceId)) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analyze/v31/route.ts:318',message:'공간 제외 (선택되지 않음)',data:{spaceId,selectedSpaces:selectedSpaces},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return
      }
      
      if (spaceSelections) {
        Object.entries(spaceSelections).forEach(([category, value]) => {
          // ✅ 타입 가드: value가 string | string[]인지 확인
          if (value && value !== 'none' && value !== null && (typeof value === 'string' || Array.isArray(value))) {
            // ✅ 카테고리 → V3.1 공정 ID 변환
            const processIds = mapCategoryToProcessIds(spaceId, category, value as string | string[])
            processIds.forEach(pid => allProcessIds.add(pid))
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analyze/v31/route.ts:365',message:'카테고리 → 공정 ID 변환',data:{spaceId,category,value,processIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
            // #endregion
          }
        })
      }
    })
    selectedProcesses = Array.from(allProcessIds)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analyze/v31/route.ts:372',message:'선택된 공정 추출 완료',data:{selectedSpaces:selectedSpaces,selectedProcesses:selectedProcesses,selectedProcessesCount:selectedProcesses.length,allProcessIds:Array.from(allProcessIds)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    console.log('✅ [convertToV3Input] 선택된 공정 추출 (선택된 공간만 + 카테고리 변환):', {
      selectedSpaces: selectedSpaces,
      selectedProcessesBySpace: selectedProcessesBySpace,
      selectedProcesses: selectedProcesses,
      tierSelections: tierSelections,
    })
  } else {
    console.log('⚠️ [convertToV3Input] selectedProcessesBySpace 없음 또는 비어있음')
  }

  return {
    answers,
    spaceInfo: {
      pyeong: spaceInfo.pyeong, // ✅ 평수 그대로 전달
      housingType: spaceInfo.housingType,
      rooms: spaceInfo.rooms,
      bathrooms: spaceInfo.bathrooms,
      // buildingAge와 hasBalcony는 SpaceInfo 타입에 없으므로 제거하거나 확장 필요
      // InputAdapter가 내부적으로 처리하도록 함
    },
    vibeInput,
    selectedSpaces,
    selectedProcesses, // ✅ 선택된 공정 전달 (빈 배열이 아닌 실제 선택값)
    budget,
  };
}

// ============ GET 핸들러 (헬스 체크) ============

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'v3.1-core',
    version: '3.1.0',
    message: 'V3.1 Core Edition API is running',
  });
}

