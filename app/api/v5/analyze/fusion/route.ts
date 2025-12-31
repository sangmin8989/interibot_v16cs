import { NextRequest, NextResponse } from 'next/server';
import { 
  FusionAnalysisResult, 
  FusionAnalyzeResponse, 
  PhotoAnalysisResult, 
  ChatAnalysisResult,
  AllTags,
  TraitScores,
  HiddenNeed
} from '@/lib/analysis/v5-ultimate/types';
import { determineDNAType, calculateDNAMatchScore } from '@/lib/analysis/v5-ultimate/dna-types';
import { calculateValueScoresFromResult } from '@/lib/analysis/v5-ultimate/valueCalculator';
import { calculateReport, convertToReportInput } from '@/lib/analysis/report';
import type { ReportInput, ReportResult } from '@/lib/analysis/report';

function calculateTraitScores(
  tags: AllTags[], 
  photoAnalysis: PhotoAnalysisResult | null,
  chatAnalysis: ChatAnalysisResult | null
): TraitScores {
  const scores: TraitScores = {
    spaceEfficiency: 50,
    cleaningSensitivity: 50,
    visualSensitivity: 50,
    familyInfluence: 50,
    budgetFlexibility: 50,
    styleCommitment: 50,
    flowImportance: 50,
    independencePreference: 50,
  };

  // 태그 기반 조정
  if (tags.includes('STORAGE_NEED') || tags.includes('SPACE_EFFICIENT')) scores.spaceEfficiency += 30;
  if (tags.includes('SPACE_WASTED')) scores.spaceEfficiency -= 20;
  
  if (tags.includes('CLEANING_SYSTEM_NEED')) scores.cleaningSensitivity += 20;
  if (tags.includes('WELL_ORGANIZED')) scores.cleaningSensitivity += 25;
  if (tags.includes('NEEDS_ORGANIZATION')) scores.cleaningSensitivity -= 15;
  
  if (tags.includes('MODERN_LOVER') || tags.includes('MINIMAL_LOVER')) scores.visualSensitivity += 20;
  if (tags.includes('VINTAGE_LOVER') || tags.includes('CLASSIC_LOVER')) scores.styleCommitment += 25;
  
  if (tags.includes('HAS_CHILD') || tags.includes('HAS_INFANT')) scores.familyInfluence += 30;
  if (tags.includes('GUEST_FREQUENT')) scores.familyInfluence += 15;
  
  if (tags.includes('BUDGET_FLEXIBLE')) scores.budgetFlexibility += 30;
  if (tags.includes('BUDGET_STRICT')) scores.budgetFlexibility -= 25;
  if (tags.includes('VALUE_PROTECTION')) scores.budgetFlexibility -= 15;
  
  if (tags.includes('SOUNDPROOF_NEED')) scores.independencePreference += 25;
  if (tags.includes('REMOTE_WORK') || tags.includes('BOOKWORM')) scores.independencePreference += 20;

  // 사진 분석 기반 조정
  if (photoAnalysis) {
    scores.visualSensitivity += (photoAnalysis.organizationScore - 5) * 5;
    if (photoAnalysis.detectedStyle === 'minimal') scores.styleCommitment += 15;
  }

  // 대화 분석 기반 조정
  if (chatAnalysis) {
    if (chatAnalysis.cleaningStyle === 'diligent') scores.cleaningSensitivity += 25;
    if (chatAnalysis.cleaningStyle === 'lazy') scores.cleaningSensitivity -= 20;
    if (chatAnalysis.cleaningStyle === 'system_needed') scores.cleaningSensitivity += 10;
    
    if (chatAnalysis.familyInfo) {
      if (chatAnalysis.familyInfo.totalMembers > 3) scores.familyInfluence += 20;
    }
    
    if (chatAnalysis.budgetRange) {
      if (chatAnalysis.budgetRange.max >= 7000) scores.budgetFlexibility += 20;
      if (chatAnalysis.budgetRange.max <= 3000) scores.budgetFlexibility -= 20;
    }
  }

  // 범위 제한 (0-100)
  for (const key of Object.keys(scores) as (keyof TraitScores)[]) {
    scores[key] = Math.max(0, Math.min(100, scores[key]));
  }

  return scores;
}

function mergeHiddenNeeds(
  photoAnalysis: PhotoAnalysisResult | null,
  chatAnalysis: ChatAnalysisResult | null
): HiddenNeed[] {
  const needs: HiddenNeed[] = [];

  if (photoAnalysis?.hiddenNeeds) {
    photoAnalysis.hiddenNeeds.forEach(need => {
      needs.push({
        need,
        source: 'photo',
        confidence: photoAnalysis.confidence,
        suggestion: generateSuggestion(need)
      });
    });
  }

  if (chatAnalysis?.hiddenNeeds) {
    chatAnalysis.hiddenNeeds.forEach(need => {
      needs.push({
        need,
        source: 'chat',
        confidence: chatAnalysis.confidence,
        suggestion: generateSuggestion(need)
      });
    });
  }

  return needs;
}

function generateSuggestion(need: string): string {
  const suggestions: Record<string, string> = {
    '수납': '붙박이장이나 시스템 수납장을 추천드려요',
    '청소': '로봇청소기가 다니기 좋은 가구 배치를 추천드려요',
    '조명': '간접조명 추가로 분위기를 확 바꿀 수 있어요',
    '콘센트': '콘센트 증설로 멀티탭을 없앨 수 있어요',
    '방음': '중문 설치로 현관 소음을 줄일 수 있어요',
  };

  for (const [keyword, suggestion] of Object.entries(suggestions)) {
    if (need.includes(keyword)) return suggestion;
  }
  
  return '전문가 상담을 추천드려요';
}

// styleResult와 chatData를 ChatAnalysisResult로 변환하는 헬퍼 함수
function convertToChatAnalysis(styleResult: any, chatData: any): ChatAnalysisResult {
  const tags: AllTags[] = [];
  const hiddenNeeds: string[] = [];

  // styleResult에서 스타일 태그 추출
  if (styleResult?.styleTag) {
    const styleTagMap: Record<string, AllTags> = {
      '모던 내추럴': 'NATURAL_LOVER',
      '모던 미니멀': 'MINIMAL_LOVER',
      '북유럽 내추럴': 'SCANDINAVIAN_LOVER',
      '모던 클래식': 'CLASSIC_LOVER',
    };
    const tag = styleTagMap[styleResult.styleTag];
    if (tag) tags.push(tag);
  }

  // chatData answers에서 태그 추출
  if (chatData?.answers) {
    const answers = chatData.answers;

    // 공간 관련
    if (answers.space === '주방') {
      tags.push('COOKING_LOVER');
    }
    if (answers.space === '서재/작업실') {
      tags.push('REMOTE_WORK');
      tags.push('BOOKWORM');
    }

    // 가족 구성
    if (answers.family === '혼자 살아요') {
      // 태그 없음
    } else if (answers.family === '2인') {
      // 태그 없음
    } else if (answers.family === '3~4인 가족') {
      tags.push('HAS_CHILD');
    } else if (answers.family?.includes('반려동물')) {
      tags.push('HAS_PET_DOG'); // 기본값
    }

    // 청소 스타일
    if (answers.cleaning === '매일 깔끔하게') {
      tags.push('WELL_ORGANIZED');
    } else if (answers.cleaning === '주말에 몰아서') {
      tags.push('NEEDS_ORGANIZATION');
    } else if (answers.cleaning === '로봇청소기에 맡겨요') {
      tags.push('CLEANING_SYSTEM_NEED');
    }

    // 우선순위
    if (answers.priority === '실용적인 수납') {
      tags.push('STORAGE_NEED');
    }
    if (answers.priority === '편안한 휴식') {
      tags.push('LIGHTING_NEED');
    }

    // 예산
    if (answers.budget === '1,000만원 이하') {
      tags.push('BUDGET_STRICT');
    } else if (answers.budget === '5,000만원 이상') {
      tags.push('BUDGET_FLEXIBLE');
    } else {
      tags.push('BUDGET_MODERATE');
    }
  }

  // hiddenNeeds 추출
  if (chatData?.insights) {
    chatData.insights.forEach((insight: string) => {
      if (insight.includes('수납')) hiddenNeeds.push('수납 공간 부족');
      if (insight.includes('청소')) hiddenNeeds.push('청소 시스템 필요');
      if (insight.includes('조명')) hiddenNeeds.push('조명 개선 필요');
    });
  }

  // cleaningStyle 결정
  let cleaningStyle: 'diligent' | 'moderate' | 'lazy' | 'system_needed' = 'moderate';
  if (chatData?.answers?.cleaning === '매일 깔끔하게') {
    cleaningStyle = 'diligent';
  } else if (chatData?.answers?.cleaning === '주말에 몰아서') {
    cleaningStyle = 'moderate';
  } else if (chatData?.answers?.cleaning === '솔직히 귀찮아요') {
    cleaningStyle = 'lazy';
  } else if (chatData?.answers?.cleaning === '로봇청소기에 맡겨요') {
    cleaningStyle = 'system_needed';
  }

  // budgetRange 추출
  let budgetRange: { min: number; max: number } | null = null;
  if (chatData?.answers?.budget) {
    const budgetMap: Record<string, { min: number; max: number }> = {
      '1,000만원 이하': { min: 0, max: 1000 },
      '1,000~3,000만원': { min: 1000, max: 3000 },
      '3,000~5,000만원': { min: 3000, max: 5000 },
      '5,000만원 이상': { min: 5000, max: 10000 },
    };
    budgetRange = budgetMap[chatData.answers.budget] || null;
  }

  // familyInfo 추출
  let familyInfo: ChatAnalysisResult['familyInfo'] = null;
  if (chatData?.answers?.family) {
    const familyMap: Record<string, { totalMembers: number; hasChild: boolean; hasElderly: boolean; hasPet: 'dog' | 'cat' | 'both' | 'none' }> = {
      '혼자 살아요': { totalMembers: 1, hasChild: false, hasElderly: false, hasPet: 'none' },
      '2인': { totalMembers: 2, hasChild: false, hasElderly: false, hasPet: 'none' },
      '3~4인 가족': { totalMembers: 4, hasChild: true, hasElderly: false, hasPet: 'none' },
      '5인 이상/반려동물': { totalMembers: 5, hasChild: true, hasElderly: false, hasPet: 'dog' },
    };
    familyInfo = familyMap[chatData.answers.family] || null;
  }

  // spaceInterests 추출
  const spaceInterests: any[] = [];
  if (chatData?.answers?.space) {
    const spaceMap: Record<string, any> = {
      '거실': 'living',
      '침실': 'bedroom',
      '주방': 'kitchen',
      '서재/작업실': 'study',
    };
    const space = spaceMap[chatData.answers.space];
    if (space) spaceInterests.push(space);
  }

  return {
    extractedTags: tags,
    cleaningStyle,
    spaceInterests,
    budgetRange,
    familyInfo,
    hiddenNeeds,
    confidence: 0.7, // 쇼츠 버전은 기본 신뢰도
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<FusionAnalyzeResponse>> {
  try {
    const { photoAnalysis, chatAnalysis, styleResult, chatData, spaceInfo }: { 
      photoAnalysis: PhotoAnalysisResult | null; 
      chatAnalysis: ChatAnalysisResult | null;
      styleResult?: any;
      chatData?: any;
      spaceInfo?: {
        housingType?: string;
        pyeong?: number;
        selectedGrade?: string;
      };
    } = await request.json();

    // 쇼츠 버전: styleResult와 chatData가 있으면 ChatAnalysisResult 생성
    let finalChatAnalysis = chatAnalysis;
    if (!chatAnalysis && styleResult && chatData) {
      finalChatAnalysis = convertToChatAnalysis(styleResult, chatData);
    }

    // 태그 통합 (중복 제거)
    const allTags: AllTags[] = [];
    
    if (photoAnalysis?.inferredTags) {
      allTags.push(...photoAnalysis.inferredTags);
    }
    if (finalChatAnalysis?.extractedTags) {
      finalChatAnalysis.extractedTags.forEach(tag => {
        if (!allTags.includes(tag)) {
          allTags.push(tag);
        }
      });
    }

    // styleResult에서 추가 태그 추출
    if (styleResult?.styleTag) {
      const styleTagMap: Record<string, AllTags> = {
        '모던 내추럴': 'NATURAL_LOVER',
        '모던 미니멀': 'MINIMAL_LOVER',
        '북유럽 내추럴': 'SCANDINAVIAN_LOVER',
        '모던 클래식': 'CLASSIC_LOVER',
      };
      const tag = styleTagMap[styleResult.styleTag];
      if (tag && !allTags.includes(tag)) {
        allTags.push(tag);
      }
    }

    // 지표 점수 계산
    const traitScores = calculateTraitScores(allTags, photoAnalysis, finalChatAnalysis);

    // DNA 유형 결정
    const dnaType = determineDNAType(allTags, traitScores);
    const dnaMatchScore = calculateDNAMatchScore(allTags, dnaType);

    // 숨은 니즈 통합
    const hiddenNeeds = mergeHiddenNeeds(photoAnalysis, finalChatAnalysis);

    // 전체 신뢰도 계산
    const photoConfidence = photoAnalysis?.confidence || 0;
    const chatConfidence = finalChatAnalysis?.confidence || 0;
    const overallConfidence = photoAnalysis && finalChatAnalysis
      ? (photoConfidence * 0.6 + chatConfidence * 0.4)
      : (photoConfidence || chatConfidence);

    // 투자 가치 점수 계산 (기존 호환성 유지)
    const housingType = spaceInfo?.housingType || '아파트';
    const pyeong = spaceInfo?.pyeong || 30;
    const selectedGrade = spaceInfo?.selectedGrade || 'STANDARD';
    
    const baseValueScores = calculateValueScoresFromResult(
      {
        photoAnalysis,
        chatAnalysis: finalChatAnalysis,
        finalTags: allTags,
        traitScores,
        dnaType,
        dnaMatchScore,
        hiddenNeeds,
        analysisId: `fusion_${Date.now()}`,
        createdAt: new Date().toISOString(),
        overallConfidence,
      },
      housingType,
      pyeong,
      selectedGrade
    );
    
    // ValueScores 타입으로 확장
    const valueScores: import('@/lib/analysis/v5-ultimate/types').ValueScores = {
      ...baseValueScores,
      spaceEfficiency: undefined,
      maintenance: undefined,
      energy: undefined,
      investment: undefined,
    };

    // 6대 지수 리포트 계산
    let fullReport: ReportResult | null = null;
    try {
      // 공정 추출 (chatAnalysis.spaceInterests에서)
      const selectedProcesses: string[] = [];
      if (finalChatAnalysis?.spaceInterests) {
        const spaceToProcess: Record<string, string> = {
          'kitchen': '주방',
          'bathroom': '욕실',
          'bedroom': '도배',
          'living': '도배',
          'study': '수납',
        };
        finalChatAnalysis.spaceInterests.forEach(space => {
          const process = spaceToProcess[space];
          if (process && !selectedProcesses.includes(process)) {
            selectedProcesses.push(process);
          }
        });
      }
      // 기본 공정 추가
      if (selectedProcesses.length === 0) {
        selectedProcesses.push('도배', '조명');
      }

      // 스타일 추출 (dnaType.recommendedStyles에서)
      const styleMap: Record<string, string> = {
        'modern': '모던',
        'natural': '내추럴',
        'scandinavian': '북유럽',
        'minimal': '미니멀',
        'classic': '클래식',
        'vintage': '빈티지',
        'industrial': '인더스트리얼',
      };
      const recommendedStyle = dnaType.recommendedStyles?.[0];
      const style = recommendedStyle ? styleMap[recommendedStyle] : '모던';

      // 라이프스타일 추출
      const cleaningStyleMap: Record<string, 'lazy' | 'daily' | 'robot'> = {
        'diligent': 'daily',
        'moderate': 'daily',
        'lazy': 'lazy',
        'system_needed': 'robot',
      };
      const cleaningStyle = finalChatAnalysis?.cleaningStyle 
        ? cleaningStyleMap[finalChatAnalysis.cleaningStyle] || 'daily'
        : 'daily';

      // 요리 빈도 추출 (tags에서)
      let cookingFrequency: 'daily' | 'often' | 'sometimes' | 'rarely' = 'sometimes';
      if (allTags.includes('COOKING_LOVER')) {
        cookingFrequency = 'daily';
      }

      // 가족 구성 추출
      let familyType = '2인';
      if (finalChatAnalysis?.familyInfo) {
        const members = finalChatAnalysis.familyInfo.totalMembers;
        if (members === 1) familyType = '1인';
        else if (members === 2) familyType = '2인';
        else if (members >= 3 && members <= 4) familyType = '3~4인';
        else familyType = '5인+';
      }

      // 옵션 추출 (hiddenNeeds에서)
      const options: string[] = [];
      hiddenNeeds.forEach(need => {
        if (need.need.includes('수납')) options.push('수납');
        if (need.need.includes('조명')) options.push('조광');
        if (need.need.includes('방음')) options.push('자동중문');
      });

      // ReportInput 구성
      const reportInput: ReportInput = {
        spaceInfo: {
          housingType: (housingType === '아파트' ? '아파트' : 
                       housingType === '오피스텔' ? '오피스텔' :
                       housingType === '빌라' ? '빌라' :
                       housingType === '단독주택' ? '단독주택' : '아파트') as any,
          pyeong,
        },
        selectedProcesses: selectedProcesses as any,
        grade: (selectedGrade === 'OPUS' ? 'OPUS' :
                selectedGrade === 'STANDARD' ? 'STANDARD' :
                selectedGrade === 'ESSENTIAL' ? 'ESSENTIAL' : 'STANDARD') as any,
        style: style as any,
        lifestyle: {
          cookingFrequency,
          cleaningStyle,
          noiseSensitivity: allTags.includes('SOUNDPROOF_NEED') ? 'high' : 'medium',
          socialFrequency: allTags.includes('GUEST_FREQUENT') ? 'often' : 'sometimes',
        },
        familyType: familyType as any,
        options,
      };

      // 6대 지수 리포트 계산
      fullReport = calculateReport(reportInput);
      
      // valueScores에 6대 지수 추가 (기존 호환성 유지)
      if (fullReport && valueScores) {
        valueScores.homeValueIndex = fullReport.homeValue.score;
        valueScores.lifeQualityScore = fullReport.lifeQuality.score;
        // optional 속성들 추가
        if (fullReport.spaceEfficiency) {
          valueScores.spaceEfficiency = fullReport.spaceEfficiency.score;
        }
        if (fullReport.maintenance) {
          valueScores.maintenance = fullReport.maintenance.score;
        }
        if (fullReport.energy) {
          valueScores.energy = fullReport.energy.score;
        }
        if (fullReport.investment) {
          valueScores.investment = fullReport.investment.score;
        }
      }
    } catch (error) {
      console.error('6대 지수 리포트 계산 에러:', error);
      // 에러가 나도 기존 valueScores는 유지
    }

    // Decision Engine 평가 (추천/옵션 생성 이전 단계)
    let decisionEnvelope: import('@/lib/decision/envelope').DecisionEnvelope | null = null
    try {
      const { buildDecisionContext } = await import('@/lib/decision/context-builder')
      const { evaluateDecision } = await import('@/lib/decision')
      const { wrapDecisionResult } = await import('@/lib/decision/envelope')

      const decisionCtx = buildDecisionContext(
        {
          housingType: housingType,
          pyeong: pyeong,
          rooms: 0,
          bathrooms: 0,
        },
        {
          finalTags: allTags,
        }
      )

      // 주방 상판 평가 (현재는 주방만 지원)
      const decisionPayload = {
        material: 'PET_GLOSS', // 기본값 (향후 사용자 선택으로 변경)
      }
      const decisionResult = evaluateDecision('KITCHEN_COUNTERTOP', decisionCtx, decisionPayload)

      // 감사 로그 저장 (evaluateDecision 호출 직후)
      try {
        const { createAuditLog, saveAuditLog } = await import('@/lib/decision/audit')
        const auditLog = createAuditLog('KITCHEN_COUNTERTOP', decisionResult, decisionPayload, decisionCtx)
        // payloadSummary에 keyFlags 추가
        auditLog.payloadSummary.keyFlags = allTags
        await saveAuditLog(auditLog)
      } catch (error) {
        console.error('[Decision Audit] 로그 저장 실패:', error)
        // 로그 저장 실패해도 분석은 계속 진행
      }

      decisionEnvelope = wrapDecisionResult('KITCHEN_COUNTERTOP', decisionResult, decisionCtx)
    } catch (error) {
      console.error('[Decision Engine] 평가 실패:', error)
      // Decision 실패해도 분석은 계속 진행
    }

    const result: FusionAnalysisResult = {
      photoAnalysis,
      chatAnalysis: finalChatAnalysis,
      finalTags: allTags,
      traitScores,
      dnaType,
      dnaMatchScore,
      hiddenNeeds,
      valueScores,
      fullReport: fullReport || undefined,
      analysisId: `fusion_${Date.now()}`,
      createdAt: new Date().toISOString(),
      overallConfidence,
      decisionEnvelope: decisionEnvelope || undefined,
    };

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('통합 분석 에러:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 에러' 
    }, { status: 500 });
  }
}





