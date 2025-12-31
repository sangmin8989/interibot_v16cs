/**
 * 인테리봇 v5 - 옵션 3안 자동 생성 API
 * 
 * A안(최소) / B안(균형) / C안(프리미엄) 자동 생성
 * 인테비티 성향 기반 LLM 분석 + 기존 엔진 계산 통합
 * 
 * POST /api/v5/generate-three-options
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ComprehensiveAnalysisEngine } from '@/lib/engines';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 공정 ID 매핑 (한글 → 영문)
const PROCESS_NAME_TO_ID: Record<string, string> = {
  '주방': 'kitchen',
  '욕실': 'bathroom',
  '바닥': 'flooring',
  '도배': 'wallpaper_painting',
  '조명': 'lighting',
  '창호': 'windows',
  '배관': 'plumbing',
  '전기': 'electrical_system',
  '단열': 'insulation_ventilation',
  '현관': 'doors_entrance',
  '수납': 'storage_furniture',
  '스마트홈': 'smart_home',
};

// 공정 ID → 한글 매핑
const PROCESS_ID_TO_NAME: Record<string, string> = {
  'kitchen': '주방',
  'bathroom': '욕실',
  'flooring': '바닥',
  'wallpaper_painting': '도배',
  'lighting': '조명',
  'windows': '창호',
  'plumbing': '배관',
  'electrical_system': '전기',
  'insulation_ventilation': '단열',
  'doors_entrance': '현관',
  'storage_furniture': '수납',
  'smart_home': '스마트홈',
};

// 공정별 기본 비용 (평당, 만원)
const PROCESS_COST_PER_PYEONG: Record<string, number> = {
  'kitchen': 25,
  'bathroom': 20,
  'flooring': 8,
  'wallpaper_painting': 5,
  'lighting': 4,
  'windows': 15,
  'plumbing': 12,
  'electrical_system': 8,
  'insulation_ventilation': 10,
  'doors_entrance': 6,
  'storage_furniture': 10,
  'smart_home': 8,
};

/**
 * 인테비티 성향 기반 AI 공정 추천
 */
async function getAIRecommendedProcesses(
  intevityType: string,
  intevityTraits: string[],
  familyType: string,
  buildingAge: number,
  pyeong: number
): Promise<{
  optionA: { processes: string[]; name: string; description: string };
  optionB: { processes: string[]; name: string; description: string };
  optionC: { processes: string[]; name: string; description: string };
  aiReasoning: string;
}> {
  const prompt = `당신은 인테리어 전문가입니다. 사용자의 성향과 상황을 분석하여 맞춤 리모델링 옵션을 추천해주세요.

## 사용자 정보
- 인테비티 성향: ${intevityType}
- 성향 특성: ${intevityTraits.join(', ')}
- 가족 구성: ${familyType}
- 건물 연식: ${buildingAge}년
- 평수: ${pyeong}평

## 선택 가능한 공정
주방, 욕실, 바닥, 도배, 조명, 창호, 배관, 전기, 단열, 현관, 수납, 스마트홈

## 요청
위 정보를 바탕으로 3가지 옵션을 추천해주세요.
- A안: 가성비형 (최소 투자로 최대 효과)
- B안: 균형형 (만족도와 투자가치 균형)
- C안: 프리미엄형 (장기 거주 최적화)

각 옵션에 포함할 공정과 이유를 JSON 형식으로 응답해주세요.

## 응답 형식 (JSON만)
{
  "optionA": {
    "name": "A안: 가성비형",
    "description": "이 성향에 맞는 설명",
    "processes": ["공정1", "공정2"]
  },
  "optionB": {
    "name": "B안: 균형형",
    "description": "이 성향에 맞는 설명",
    "processes": ["공정1", "공정2", "공정3", "공정4"]
  },
  "optionC": {
    "name": "C안: 프리미엄형",
    "description": "이 성향에 맞는 설명",
    "processes": ["공정1", "공정2", "공정3", "공정4", "공정5", "공정6"]
  },
  "aiReasoning": "${intevityType} 성향의 특성을 고려한 추천 이유 한 문장"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '당신은 인테리어 전문가입니다. JSON 형식으로만 응답하세요.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // JSON 파싱 시도
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        optionA: parsed.optionA,
        optionB: parsed.optionB,
        optionC: parsed.optionC,
        aiReasoning: parsed.aiReasoning || `${intevityType} 성향에 맞춘 맞춤 추천입니다.`,
      };
    }
    
    throw new Error('JSON 파싱 실패');
  } catch (error) {
    console.error('OpenAI API Error:', error);
    // 폴백: 기본 추천
    return getDefaultProcesses(intevityType, familyType, buildingAge);
  }
}

/**
 * 폴백: 규칙 기반 기본 공정 추천
 */
function getDefaultProcesses(
  intevityType: string,
  familyType: string,
  buildingAge: number
): {
  optionA: { processes: string[]; name: string; description: string };
  optionB: { processes: string[]; name: string; description: string };
  optionC: { processes: string[]; name: string; description: string };
  aiReasoning: string;
} {
  // 성향별 기본 추천
  let baseA = ['도배', '조명'];
  let baseB = ['주방', '욕실', '바닥', '도배'];
  let baseC = ['주방', '욕실', '바닥', '도배', '창호', '조명'];

  // 성향에 따른 조정
  if (intevityType.includes('실용') || intevityType.includes('안정')) {
    baseA = ['주방', '조명'];
    baseB = ['주방', '욕실', '수납', '도배'];
    baseC = ['주방', '욕실', '수납', '도배', '배관', '전기', '조명'];
  } else if (intevityType.includes('감성') || intevityType.includes('체험')) {
    baseA = ['도배', '조명', '바닥'];
    baseB = ['도배', '조명', '바닥', '현관', '수납'];
    baseC = ['도배', '조명', '바닥', '현관', '수납', '창호', '스마트홈'];
  }

  // 구축 연식에 따른 조정
  if (buildingAge >= 20) {
    if (!baseB.includes('배관')) baseB.push('배관');
    if (!baseC.includes('배관')) baseC.push('배관');
    if (!baseC.includes('전기')) baseC.push('전기');
  }

  // 가족 구성에 따른 조정
  if (familyType === 'newborn_infant' || familyType === 'elderly') {
    if (!baseB.includes('욕실')) baseB.unshift('욕실');
    if (!baseC.includes('단열')) baseC.push('단열');
  }

  return {
    optionA: {
      name: 'A안: 가성비형',
      description: `${intevityType} 성향에 맞는 최소 투자`,
      processes: baseA,
    },
    optionB: {
      name: 'B안: 균형형',
      description: `${intevityType} 성향의 만족도와 가치 균형`,
      processes: baseB,
    },
    optionC: {
      name: 'C안: 프리미엄형',
      description: `${intevityType} 성향을 위한 장기 최적화`,
      processes: baseC,
    },
    aiReasoning: `${intevityType} 성향과 ${buildingAge}년 된 건물을 고려한 추천입니다.`,
  };
}

/**
 * 공정 목록으로 총 비용 계산
 */
function calculateTotalCost(processes: string[], pyeong: number): number {
  return processes.reduce((total, processName) => {
    const processId = PROCESS_NAME_TO_ID[processName];
    const costPerPyeong = PROCESS_COST_PER_PYEONG[processId] || 5;
    return total + costPerPyeong * pyeong;
  }, 0);
}

/**
 * 한글 공정명 → 영문 ID 변환
 */
function convertToProcessIds(processNames: string[]): string[] {
  return processNames
    .map(name => PROCESS_NAME_TO_ID[name])
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();

    // 필수 파라미터 검증
    if (!input.pyeong || input.pyeong <= 0) {
      return NextResponse.json(
        { error: 'pyeong은 양수여야 합니다.' },
        { status: 400 }
      );
    }

    if (!input.buildingAge || input.buildingAge < 0) {
      return NextResponse.json(
        { error: 'buildingAge는 0 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // currentPrice는 선택사항 (기본값: 평수 기반 추정치)
    const estimatedPrice = input.pyeong * 1500; // 평당 1500만원 기본 가정
    const currentPrice = input.currentPrice && input.currentPrice > 0 
      ? input.currentPrice 
      : estimatedPrice;

    // 재건축 위험 (선택사항)
    const redevelopmentYears = input.redevelopmentYears || undefined;
    
    // 입지 약점 (선택사항)
    const locationWeaknesses = input.locationWeaknesses || undefined;

    // 인테비티 결과 (AI 분석용)
    const intevityType = input.intevityType || '';
    const intevityTraits = input.intevityTraits || [];

    // AI 공정 추천 가져오기 (인테비티 결과가 있는 경우)
    let aiRecommendation;
    if (intevityType) {
      aiRecommendation = await getAIRecommendedProcesses(
        intevityType,
        intevityTraits,
        input.familyType || 'dual_income',
        input.buildingAge,
        input.pyeong
      );
    } else {
      // 인테비티 결과 없으면 기본 추천
      aiRecommendation = getDefaultProcesses(
        '일반',
        input.familyType || 'dual_income',
        input.buildingAge
      );
    }

    // 공정별 비용 계산
    const costA = calculateTotalCost(aiRecommendation.optionA.processes, input.pyeong);
    const costB = calculateTotalCost(aiRecommendation.optionB.processes, input.pyeong);
    const costC = calculateTotalCost(aiRecommendation.optionC.processes, input.pyeong);

    // 공정 ID로 변환
    const processIdsA = convertToProcessIds(aiRecommendation.optionA.processes);
    const processIdsB = convertToProcessIds(aiRecommendation.optionB.processes);
    const processIdsC = convertToProcessIds(aiRecommendation.optionC.processes);

    // 기본 입력 설정
    const baseInput = {
      pyeong: input.pyeong,
      buildingAge: input.buildingAge,
      familyType: input.familyType || 'dual_income',
      lifestyleFactors: input.lifestyleFactors || [],
      currentPrice: currentPrice,
      marketCondition: input.marketCondition || 'normal_rising',
      region: input.region || 'gyeonggi_normal',
      designFit: input.designFit,
      documentation: input.documentation,
      redevelopmentYears: redevelopmentYears,
      locationWeaknesses: locationWeaknesses,
    };

    // 각 옵션별 분석 실행 (AI 추천 공정 기반)
    const analysisA = ComprehensiveAnalysisEngine.analyze({
      ...baseInput,
      selectedProcesses: processIdsA,
      totalCost: costA,
    });

    const analysisB = ComprehensiveAnalysisEngine.analyze({
      ...baseInput,
      selectedProcesses: processIdsB,
      totalCost: costB,
    });

    const analysisC = ComprehensiveAnalysisEngine.analyze({
      ...baseInput,
      selectedProcesses: processIdsC,
      totalCost: costC,
    });

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        optionA: {
          name: aiRecommendation.optionA.name,
          description: aiRecommendation.optionA.description,
          processes: aiRecommendation.optionA.processes,
          cost: costA,
          analysis: analysisA,
        },
        optionB: {
          name: aiRecommendation.optionB.name,
          description: aiRecommendation.optionB.description,
          processes: aiRecommendation.optionB.processes,
          cost: costB,
          recommended: true,
          analysis: analysisB,
        },
        optionC: {
          name: aiRecommendation.optionC.name,
          description: aiRecommendation.optionC.description,
          processes: aiRecommendation.optionC.processes,
          cost: costC,
          analysis: analysisC,
        },
        aiReasoning: aiRecommendation.aiReasoning,
        intevityType: intevityType || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Generate Three Options API Error:', error);

    return NextResponse.json(
      {
        error: '옵션 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
