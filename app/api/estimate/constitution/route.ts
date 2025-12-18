/**
 * 인테리봇 헌법 v1.1 기반 견적 API (최소 복구 버전)
 * 
 * 작성일: 2025년 12월
 * 목적: 헌법 v1.1 문서에 따른 견적 계산 API 엔드포인트
 * 
 * 핵심 원칙:
 * - POST 요청을 받아 calculateFinalEstimateV1을 호출
 * - 성공 시 결과를 JSON으로 반환
 * - 실패 시 헌법 v1.1 규칙에 맞는 통일된 에러 응답
 * - 자재/노무 관련 실패는 외부 reason 통일
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateFinalEstimateV1 } from '@/lib/estimate/constitution-v1-engine'
import { EstimateValidationError } from '@/lib/types/헌법_견적_타입'
import type { EstimateGenerationOptions } from '@/lib/types/헌법_견적_타입'

/**
 * POST /api/estimate/constitution
 * 
 * 헌법 v1.1 기반 견적 계산 API
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()

    // 입력 검증
    if (!body.pyeong || typeof body.pyeong !== 'number' || body.pyeong <= 0) {
      return NextResponse.json(
        {
          status: 'ESTIMATE_FAILED',
          failedAt: 'ENGINE_VALIDATION',
          reason: '평수는 0보다 커야 합니다.',
          failedProcesses: ['system'],
        },
        { status: 422 }
      )
    }

    if (!body.processSelections && body.mode !== 'FULL') {
      return NextResponse.json(
        {
          status: 'ESTIMATE_FAILED',
          failedAt: 'ENGINE_VALIDATION',
          reason: 'processSelections가 없습니다.',
          failedProcesses: ['system'],
        },
        { status: 422 }
      )
    }

    // EstimateGenerationOptions 구성
    const options: EstimateGenerationOptions & {
      spaceType?: '주거' | '상업' | '사무실' | '기타'
      familyComposition?: {
        adults: number
        children: number
        elderly: number
        pets: boolean
      }
      specialConditions?: string[]
    } = {
      pyeong: body.pyeong,
      mode: body.mode || 'PARTIAL',
      spaces: body.spaces || [],
      processSelections: body.processSelections || {},
      spaceType: body.spaceType,
      familyComposition: body.familyComposition,
      specialConditions: body.specialConditions,
    }

    // ✅ 헌법 v1.1: calculateFinalEstimateV1 호출
    const result = await calculateFinalEstimateV1(options)

    // ✅ 성공 응답
    return NextResponse.json(
      {
        status: 'SUCCESS',
        result,
      },
      { status: 200 }
    )
  } catch (error) {
    // ✅ EstimateValidationError 처리 (헌법 v1.1)
    if (error instanceof EstimateValidationError) {
      // ✅ 자재/노무 관련 실패 판별: processId가 'system'이 아니면 자재/노무 관련으로 간주
      // (헌법 v1.1: material-service-strict, labor-service-strict에서 발생하는 에러는
      //  processId가 실제 공정 ID를 가짐)
      const isMaterialOrLaborError = error.processId !== 'system'

      const failedAt = isMaterialOrLaborError
        ? 'MATERIAL_OR_LABOR_VALIDATION'
        : 'ENGINE_VALIDATION'

      // ✅ 외부 reason 통일 (자재/노무 관련 실패)
      const externalReason = isMaterialOrLaborError
        ? '견적에 필요한 필수 단가/노무 정보가 DB에 존재하지 않습니다.'
        : error.reason

      // ✅ 내부 로그는 상세 사유 포함
      console.error('❌ 헌법 v1.1 검증 실패:', {
        processId: error.processId,
        reason: error.reason, // 상세 사유
        failedAt,
        code: error.code,
      })

      return NextResponse.json(
        {
          status: 'ESTIMATE_FAILED',
          failedAt,
          reason: externalReason,
          failedProcesses: [error.processId],
        },
        { status: 422 }
      )
    }

    // ✅ 기타 에러 처리 (500)
    console.error('❌ 헌법 v1.1 API 예외:', {
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        status: 'ESTIMATE_FAILED',
        failedAt: 'ENGINE_VALIDATION',
        reason: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        failedProcesses: ['system'],
      },
      { status: 500 }
    )
  }
}



