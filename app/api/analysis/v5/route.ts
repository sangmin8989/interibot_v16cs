/**
 * V5 분석 결과 저장 API
 * 
 * 답변 수집 후 태그 확정 및 결과 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeV5Complete } from '@/lib/analysis/v5'
import type { SpaceInfo } from '@/lib/store/spaceInfoStore'
import { assertV5InputIntegrity } from '@/lib/analysis/v5/guards/input-guard'
import { buildInputHash, buildOutputHash } from '@/lib/analysis/v5/guards/reproducibility-guard'
import { auditLogger } from '@/lib/analysis/v5/audit/audit-logger'
import { convertSpaceInfoToBasicInput } from '@/lib/analysis/v5/input-converter'

export async function POST(request: NextRequest) {
  let requestId: string | undefined
  let inputHash: string | undefined

  try {
    const body = await request.json()
    const {
      spaceInfo,
      answers,
    }: {
      spaceInfo: SpaceInfo
      answers: Record<string, string>
    } = body

    // ⚠️ Phase 6: 입력 변환 (SpaceInfo → BasicInfoInput)
    const basicInput = convertSpaceInfoToBasicInput(spaceInfo)

    // ⚠️ Phase 6: 입력 무결성 가드
    assertV5InputIntegrity({
      basicInfo: basicInput,
      answers,
      spaceInfo,
    })

    // ⚠️ Phase 6: 입력 해시 생성 (재현성 보장)
    inputHash = buildInputHash({
      basicInfo: basicInput,
      answers,
    })

    // ⚠️ Phase 6: 감사 로그 - 분석 요청
    auditLogger.log('ANALYSIS_REQUESTED', inputHash)
    requestId = auditLogger.getLogs()[auditLogger.getLogs().length - 1]?.requestId

    console.log('🎯 V5 분석 시작:', {
      requestId,
      inputHash: inputHash.substring(0, 8) + '...',
      pyeong: spaceInfo.pyeong,
      answersCount: Object.keys(answers).length,
    })

    // V5 전체 분석
    const result = analyzeV5Complete(spaceInfo, answers)

    // ⚠️ Phase 6: 출력 해시 생성 (재현성 보장)
    const outputHash = buildOutputHash({
      tags: result.tags,
      dna: result.dna,
      explain: result.explain,
    })

    // ⚠️ Phase 6: 감사 로그 - 분석 완료
    auditLogger.log('ANALYSIS_COMPLETED', inputHash, outputHash, requestId)

    console.log('✅ V5 분석 완료:', {
      requestId,
      inputHash: inputHash.substring(0, 8) + '...',
      outputHash: outputHash.substring(0, 8) + '...',
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
    // ⚠️ Phase 6: 감사 로그 - 분석 실패
    if (inputHash) {
      auditLogger.log(
        'ANALYSIS_FAILED',
        inputHash,
        undefined,
        requestId,
        error.message
      )
    }

    console.error('❌ V5 분석 오류:', {
      requestId,
      inputHash: inputHash?.substring(0, 8) + '...',
      error: error.message,
    })

    return NextResponse.json(
      {
        error: 'V5 분석 중 오류가 발생했습니다.',
        message: error.message,
        requestId, // 디버깅용
      },
      { status: 500 }
    )
  }
}








