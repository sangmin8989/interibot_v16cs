/**
 * 아르젠 3등급 추천 API
 * 
 * POST /api/v5/analyze/grade
 * 
 * 사용자 입력 기반으로 적합한 등급 추천 및 견적 계산
 */

import { NextRequest, NextResponse } from 'next/server'
import type { SpaceInfo } from '@/lib/store/spaceInfoStore'
import {
  recommendGrade,
  convertSpaceInfoToUserInput,
  getGradeMessage,
  getUpgradeInfo,
  type UserInput,
  type GradeRecommendation,
} from '@/lib/analysis/gradeRecommender'
import {
  calculateEstimateByGrade,
  compareGrades,
  recommendGradeByBudget,
  analyzeGradeDifference,
  type EstimateInput,
} from '@/lib/analysis/estimateCalculator'
import type { ArgenGrade } from '@/lib/data/gradeSpecs'

export interface GradeAnalysisRequest {
  spaceInfo: SpaceInfo
  userInput?: Partial<UserInput> // 추가 입력 (선택)
  budget?: number // 만원 단위
  compareAll?: boolean // 모든 등급 비교 여부
}

export interface GradeAnalysisResponse {
  recommended: {
    grade: ArgenGrade
    recommendation: GradeRecommendation
    estimate: ReturnType<typeof calculateEstimateByGrade>
    message: string
  }
  alternatives?: {
    grade: ArgenGrade
    estimate: ReturnType<typeof calculateEstimateByGrade>
    difference: {
      costDifference: number
      percentageIncrease: number
      keyUpgrades: string[]
      valueProposition: string
    }
  }[]
  comparison?: Record<ArgenGrade, ReturnType<typeof calculateEstimateByGrade>>
  budgetAnalysis?: {
    recommendedGrade: ArgenGrade
    estimatedCost: number
    difference: number
    isWithinBudget: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GradeAnalysisRequest = await request.json()

    const { spaceInfo, userInput: additionalInput, budget, compareAll } = body

    if (!spaceInfo || !spaceInfo.pyeong) {
      return NextResponse.json(
        { error: '공간 정보가 필요합니다 (pyeong 필수)' },
        { status: 400 }
      )
    }

    // SpaceInfo를 UserInput으로 변환
    const baseInput = convertSpaceInfoToUserInput(spaceInfo)

    // 추가 입력 병합
    const fullInput: UserInput = {
      housingType: baseInput.housingType || spaceInfo.housingType || '아파트',
      pyeong: spaceInfo.pyeong,
      rooms: baseInput.rooms || spaceInfo.rooms || 0,
      bathrooms: baseInput.bathrooms || spaceInfo.bathrooms || 0,
      budget: budget || baseInput.budget || 3000, // 기본값 3000만원
      cookingFrequency: additionalInput?.cookingFrequency || baseInput.cookingFrequency || 'sometimes',
      cleaningStyle: additionalInput?.cleaningStyle || baseInput.cleaningStyle || 'weekly',
      noiseSensitivity: additionalInput?.noiseSensitivity || baseInput.noiseSensitivity || 'medium',
      socialFrequency: additionalInput?.socialFrequency || baseInput.socialFrequency || 'sometimes',
      workFromHome: baseInput.workFromHome || additionalInput?.workFromHome || 'never',
      residencePlan: baseInput.residencePlan || additionalInput?.residencePlan || 'medium',
      purpose: baseInput.purpose || additionalInput?.purpose || 'residence',
      priority: additionalInput?.priority || 'balance',
    }

    // 등급 추천
    const recommendation = recommendGrade(fullInput)
    const recommendedGrade = recommendation.grade

    // 추천 등급 견적 계산
    const recommendedEstimate = calculateEstimateByGrade({
      pyeong: spaceInfo.pyeong,
      grade: recommendedGrade,
      rooms: spaceInfo.rooms,
      bathrooms: spaceInfo.bathrooms,
    })

    // AI 메시지 생성
    const message = getGradeMessage(recommendedGrade, recommendation.reasons, spaceInfo.pyeong)

    // 응답 구성
    const response: GradeAnalysisResponse = {
      recommended: {
        grade: recommendedGrade,
        recommendation,
        estimate: recommendedEstimate,
        message,
      },
    }

    // 대안 등급 정보
    if (recommendation.alternativeGrade) {
      const alternativeEstimate = calculateEstimateByGrade({
        pyeong: spaceInfo.pyeong,
        grade: recommendation.alternativeGrade,
        rooms: spaceInfo.rooms,
        bathrooms: spaceInfo.bathrooms,
      })

      const difference = analyzeGradeDifference(
        recommendedGrade,
        recommendation.alternativeGrade,
        spaceInfo.pyeong
      )

      response.alternatives = [
        {
          grade: recommendation.alternativeGrade,
          estimate: alternativeEstimate,
          difference,
        },
      ]

      // 업그레이드 정보 추가
      const upgradeInfo = getUpgradeInfo(
        recommendedGrade,
        recommendation.alternativeGrade,
        spaceInfo.pyeong
      )
      if (upgradeInfo) {
        response.recommended.recommendation.upgradeInfo = upgradeInfo
      }
    }

    // 모든 등급 비교
    if (compareAll) {
      response.comparison = compareGrades({
        pyeong: spaceInfo.pyeong,
        rooms: spaceInfo.rooms,
        bathrooms: spaceInfo.bathrooms,
      })
    }

    // 예산 기반 분석
    if (budget) {
      response.budgetAnalysis = recommendGradeByBudget(budget, spaceInfo.pyeong)
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ [Grade Analysis API] 오류:', error)

    return NextResponse.json(
      {
        error: '등급 분석 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET 요청: 등급별 기본 정보 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pyeong = parseFloat(searchParams.get('pyeong') || '32')

    if (isNaN(pyeong) || pyeong <= 0) {
      return NextResponse.json({ error: '유효한 평수를 입력해주세요' }, { status: 400 })
    }

    // 모든 등급 비교 정보 반환
    const comparison = compareGrades({ pyeong })

    return NextResponse.json(
      {
        pyeong,
        comparison,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ [Grade Analysis API] GET 오류:', error)

    return NextResponse.json(
      {
        error: '등급 정보 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}




