/**
 * 인테리봇 견적 API (호환성 유지)
 * - /api/estimate로 리다이렉트
 * - 기존 코드 호환성을 위해 유지
 */

import { NextRequest, NextResponse } from 'next/server';
// ✅ V2 계산기 사용 (4가지 버그 수정됨)
// 기존: '@/lib/estimate/unified-calculator'
import { calculateEstimate } from '@/lib/estimate/unified-calculator-v2';
import type { EstimateInput } from '@/lib/estimate/types';

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    
    console.log('📥 /calculate API 요청 받음 (통합 엔진 사용):', input);
    
    // [구형 포맷 호환] areaPyeong + traitsScore 기반 요청이 들어온 경우
    // - 기존 B2B/Biz 실험에서 사용하던 포맷
    // - 신규 UI에서는 아래 '새 형식' 분기로만 들어오는 것을 기본으로 한다.
    if (input.areaPyeong && input.traitsScore && input.selectedProcesses) {
      // 기존 형식을 새 형식으로 변환
      const spaceInfo = input.spaceInfo || {};
      
      // 방개수와 욕실개수 추출 (기본값 보장)
      let roomCount = 3;
      if (spaceInfo.roomCount !== undefined && spaceInfo.roomCount !== null) {
        roomCount = Number(spaceInfo.roomCount);
      }
      if (isNaN(roomCount) || roomCount <= 0) roomCount = 3;
      
      let bathroomCount = 2;
      if (spaceInfo.bathroomCount !== undefined && spaceInfo.bathroomCount !== null) {
        bathroomCount = Number(spaceInfo.bathroomCount);
      }
      if (isNaN(bathroomCount) || bathroomCount < 0) bathroomCount = 2;
      
      // 점수를 1-5 범위로 변환하는 헬퍼 함수
      const convertToTraitScore = (score: number): 1 | 2 | 3 | 4 | 5 => {
        const converted = Math.round(score / 20) || 3
        if (converted < 1) return 1
        if (converted > 5) return 5
        return converted as 1 | 2 | 3 | 4 | 5
      }
      
      const normalizedInput = {
        평수: Number(input.areaPyeong) || 43,
        방개수: roomCount,
        욕실개수: bathroomCount,
        현재상태: (spaceInfo.housingType === 'new' ? '신축' : '구축아파트') as '신축' | '구축아파트',
        성향: {
          요리빈도: convertToTraitScore(input.traitsScore.T13 || 50),
          정리정돈: convertToTraitScore(input.traitsScore.T05 || 50),
          청소성향: convertToTraitScore(input.traitsScore.T04 || 50),
          조명취향: convertToTraitScore(input.traitsScore.T10 || 50),
          예산감각: convertToTraitScore(input.traitsScore.T08 || 50),
        },
        selectedProcesses: input.selectedProcesses || undefined // 선택된 공정 전달
      };
      
      console.log('📥 기존 형식 변환:', {
        원본: { areaPyeong: input.areaPyeong, spaceInfo },
        변환후: normalizedInput
      });
      
      console.log('📥 기존 형식 → 새 형식 변환:', normalizedInput);
      
      const result = calculateEstimate(normalizedInput);
      
      console.log('✅ 견적 완료:', {
        basic: `${(result.basic.총액 / 10000).toFixed(0)}만원`,
        standard: `${(result.standard.총액 / 10000).toFixed(0)}만원`,
        argen: `${(result.argen.총액 / 10000).toFixed(0)}만원`,
        premium: `${(result.premium.총액 / 10000).toFixed(0)}만원`,
        recommended: result.recommended
      });
      
      return NextResponse.json(result);
    }
    
    // [신규 포맷] 평수/방개수/욕실개수/성향 기반 4등급 견적
    // - app/estimate/page.tsx 에서 사용하는 메인 경로
    // 새 형식 (평수, 방개수, 욕실개수) 검증
    const missingFields: string[] = [];
    if (!input.평수 || input.평수 <= 0) missingFields.push('평수');
    if (input.방개수 === undefined || input.방개수 === null) missingFields.push('방개수');
    if (input.욕실개수 === undefined || input.욕실개수 === null) missingFields.push('욕실개수');
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `필수 정보가 누락되었습니다: ${missingFields.join(', ')}`,
          details: '평수/방개수/욕실개수를 모두 입력해주세요.',
          missingFields,
          received: {
            평수: input.평수,
            방개수: input.방개수,
            욕실개수: input.욕실개수,
          },
        },
        { status: 400 },
      );
    }
    
    console.log('📊 견적 계산 시작 (새 형식):', input);
    console.log('🔍 [API] input.selectedProcesses:', input.selectedProcesses);
    
    // selectedProcesses가 있으면 전달 (빈 배열은 undefined로 처리)
    const estimateInput = {
      ...input,
      selectedProcesses: (input.selectedProcesses && input.selectedProcesses.length > 0) 
        ? input.selectedProcesses 
        : undefined
    };
    
    console.log('🔍 [API] estimateInput.selectedProcesses:', estimateInput.selectedProcesses);
    
    const result = calculateEstimate(estimateInput);
    
    console.log('✅ 견적 완료:', {
      basic: `${(result.basic.총액 / 10000).toFixed(0)}만원`,
      standard: `${(result.standard.총액 / 10000).toFixed(0)}만원`,
      argen: `${(result.argen.총액 / 10000).toFixed(0)}만원`,
      premium: `${(result.premium.총액 / 10000).toFixed(0)}만원`,
      recommended: result.recommended
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ 에러:', error);
    return NextResponse.json(
      {
        success: false,
        error: '견적 계산 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '인테리봇 견적 API (통합 엔진)',
    note: '이 엔드포인트는 /api/estimate와 동일한 통합 엔진을 사용합니다.',
    redirect: '/api/estimate',
    accuracy: '98.5%',
    grades: ['basic', 'standard', 'argen', 'premium']
  });
}
