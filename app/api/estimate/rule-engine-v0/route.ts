/**
 * 규칙 엔진 v0 API
 * 
 * 견적 숫자만 생성하는 규칙 기반 엔진
 * - AI는 어떤 경우에도 숫자 생성/계산/보정/추정을 하지 않는다
 * - 4등급 체계 비활성화, 단일 추천안만 산출
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateRuleEngineV0, type RuleEngineInput } from '@/lib/estimate/rule-engine-v0'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 입력 검증
    const input: RuleEngineInput = {
      pyeong: body.pyeong,
      housingType: body.housingType || '아파트',
      roomCount: body.roomCount,
      bathroomCount: body.bathroomCount,
      constructionScope: body.constructionScope || '부분',
      selectedProcesses: body.selectedProcesses || [],
      removedProcesses: body.removedProcesses || [],
      selectedOptions: body.selectedOptions || [],
      siteVariables: body.siteVariables || {
        elevator: '미확인',
        parkingLifting: '미확인',
        managementRules: '미확인',
        wasteRemoval: '미확인',
        protectionScope: '미확인',
      },
    }
    
    // 규칙 엔진 실행
    const result = calculateRuleEngineV0(input)
    
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('규칙 엔진 v0 에러:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '알 수 없는 에러',
        },
      },
      { status: 500 }
    )
  }
}













