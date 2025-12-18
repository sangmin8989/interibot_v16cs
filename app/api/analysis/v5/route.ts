/**
 * V5 분석 결과 저장 API
 * 
 * 답변 수집 후 태그 확정 및 결과 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeV5Complete } from '@/lib/analysis/v5'
import type { SpaceInfo } from '@/lib/store/spaceInfoStore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      spaceInfo,
      answers,
    }: {
      spaceInfo: SpaceInfo
      answers: Record<string, string>
    } = body

    // 입력 검증
    if (!spaceInfo) {
      return NextResponse.json(
        { error: '집 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: '답변이 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('🎯 V5 분석 시작:', {
      pyeong: spaceInfo.pyeong,
      answersCount: Object.keys(answers).length,
    })

    // V5 전체 분석
    const result = analyzeV5Complete(spaceInfo, answers)

    console.log('✅ V5 분석 완료:', {
      tags: result.tags.tags,
      validation: result.validation.passed,
      processChanges: result.processChanges.processChanges.length,
    })

    // 결과 반환
    return NextResponse.json({
      success: true,
      engine: 'v5',
      result: {
        tags: result.tags,
        processChanges: result.processChanges,
        argenRecommendation: result.argenRecommendation,
        riskMessages: result.riskMessages,
        validation: result.validation,
        choiceParalysis: result.choiceParalysis,
        paralysisStrategy: result.paralysisStrategy,
      },
    })
  } catch (error: any) {
    console.error('❌ V5 분석 오류:', error)
    return NextResponse.json(
      {
        error: 'V5 분석 중 오류가 발생했습니다.',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

