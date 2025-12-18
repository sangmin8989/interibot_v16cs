/**
 * 분석 흐름 테스트 API
 * 개발자가 분석 흐름을 쉽게 확인할 수 있도록 가상의 고객 입력을 생성해 전체 분석을 실행
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildAnalysisResultV2 } from '@/lib/analysis/engine-v2'
import { AnalysisRequest } from '@/lib/analysis/types'

// 가상의 고객 입력 생성
function createMockCustomerInput(): AnalysisRequest {
  return {
    mode: 'standard',
    preferences: {
      'quick_first_scene': 'warm_kitchen',
      'quick_photo_space': 'living_room',
      'quick_no_compromise': 'lighting',
      'quick_atmosphere': 'healing',
      'standard_main_space': 'living',
      'standard_daily_discomfort': 'storage',
      'standard_cleaning_style': 'quick',
      'standard_budget_priority': 'materials',
    },
    answeredCount: 8,
    completionRate: 100,
    timestamp: new Date().toISOString(),
    spaceInfo: {
      housingType: 'apartment',
      pyeong: 32,
      rooms: 3,
      bathrooms: 2,
      familySizeRange: '3~4인',
      totalPeople: 3,
      ageRanges: ['adult', 'child'],
      lifestyleTags: ['hasPets'],
      livingPurpose: '실거주',
      livingYears: 10,
    },
    selectedAreas: ['living', 'kitchen', 'masterBedroom'],
    vibeInput: null,
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [테스트] 분석 흐름 테스트 시작...')

    // 1. 가상의 고객 입력 생성
    const mockInput = createMockCustomerInput()
    console.log('✅ [테스트] 1단계: 고객 입력 생성 완료', {
      mode: mockInput.mode,
      answeredCount: mockInput.answeredCount,
      spaceInfo: mockInput.spaceInfo,
      selectedAreas: mockInput.selectedAreas,
    })

    // 2. 프로필 변환 및 점수 계산
    const result = buildAnalysisResultV2(mockInput)
    console.log('✅ [테스트] 2단계: 프로필 변환 및 점수 계산 완료', {
      analysisId: result.analysisId,
      topSpace: result.spaceRanking?.[0],
      topProcess: result.processRanking?.[0],
      homeValueScore: result.homeValueScore?.score,
      lifestyleScores: result.lifestyleScores,
    })

    // 3. 분석 요약 생성 확인
    console.log('✅ [테스트] 3단계: 분석 요약 생성 완료', {
      summary: result.summary.substring(0, 100) + '...',
      recommendationsCount: result.recommendations.length,
    })

    // 4. 점수 정보 확인
    const scoreInfo = {
      homeValueScore: result.homeValueScore
        ? {
            score: result.homeValueScore.score,
            reason: result.homeValueScore.reason.substring(0, 50) + '...',
            investmentValue: result.homeValueScore.investmentValue,
          }
        : null,
      lifestyleScores: result.lifestyleScores
        ? {
            storage: result.lifestyleScores.storage,
            cleaning: result.lifestyleScores.cleaning,
            flow: result.lifestyleScores.flow,
            comment: result.lifestyleScores.comment,
          }
        : null,
      preferenceScores: Object.entries(result.preferences)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([key, value]) => ({ category: key, score: value })),
    }

    console.log('✅ [테스트] 4단계: 점수 정보 확인 완료', scoreInfo)

    // 5. 핵심 요소 목록 생성
    const keyFactors = [
      ...(result.spaceRanking?.slice(0, 3).map(s => `공간: ${s.spaceId} (점수: ${s.score})`) || []),
      ...(result.processRanking?.slice(0, 3).map(p => `공정: ${p.process} (점수: ${p.score})`) || []),
      ...(result.styleMatch?.slice(0, 2).map(s => `스타일: ${s.style} (점수: ${s.score})`) || []),
    ]

    console.log('✅ [테스트] 5단계: 핵심 요소 목록 생성 완료', keyFactors)

    // 최종 결과 반환
    return NextResponse.json(
      {
        success: true,
        message: '분석 흐름 테스트 완료',
        testResults: {
          step1_customerInput: {
            status: '완료',
            data: {
              mode: mockInput.mode,
              answeredCount: mockInput.answeredCount,
              spaceInfo: mockInput.spaceInfo,
              selectedAreas: mockInput.selectedAreas,
            },
          },
          step2_profileAndScores: {
            status: '완료',
            data: {
              analysisId: result.analysisId,
              topSpace: result.spaceRanking?.[0],
              topProcess: result.processRanking?.[0],
              topStyle: result.styleMatch?.[0],
              budgetRecommendation: result.budgetRecommendation,
            },
          },
          step3_summary: {
            status: '완료',
            data: {
              summary: result.summary,
              recommendations: result.recommendations,
            },
          },
          step4_scores: {
            status: '완료',
            data: scoreInfo,
          },
          step5_keyFactors: {
            status: '완료',
            data: keyFactors,
          },
        },
        fullResult: {
          analysisId: result.analysisId,
          summary: result.summary,
          homeValueScore: result.homeValueScore,
          lifestyleScores: result.lifestyleScores,
          spaceRanking: result.spaceRanking?.slice(0, 5),
          processRanking: result.processRanking?.slice(0, 5),
          styleMatch: result.styleMatch?.slice(0, 3),
          budgetRecommendation: result.budgetRecommendation,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ [테스트] 분석 흐름 테스트 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '테스트 실행 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}






















