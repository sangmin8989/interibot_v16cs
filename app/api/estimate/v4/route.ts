/**
 * V4 견적 계산 API 엔드포인트
 * 
 * POST /api/estimate/v4
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateEstimateV4ForUI } from '@/lib/estimate-v4'
import type { CollectedInputV4 } from '@/lib/estimate-v4/types'
import { logger } from '@/lib/estimate-v4/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 입력 검증
    if (!body.spaceInfo || !body.answers || !body.preferences) {
      return NextResponse.json(
        {
          status: 'ERROR',
          message: '필수 입력이 누락되었습니다.',
        },
        { status: 400 }
      )
    }

    // 강제 등급 지정 (선택사항)
    const forceGrade = body.forceGrade as 'ARGEN_E' | 'ARGEN_S' | 'ARGEN_O' | undefined

    // V4 입력 형식으로 변환
    const input: CollectedInputV4 = {
      spaceInfo: {
        housingType: body.spaceInfo.housingType || 'apartment',
        pyeong: Number(body.spaceInfo.pyeong) || 32,
        rooms: Number(body.spaceInfo.rooms) || 3,
        bathrooms: Number(body.spaceInfo.bathrooms) || 2,
        buildingAge: body.spaceInfo.buildingAge
          ? Number(body.spaceInfo.buildingAge)
          : undefined,
        floor: body.spaceInfo.floor ? Number(body.spaceInfo.floor) : undefined,
      },
      answers: Array.isArray(body.answers) ? body.answers : [],
      preferences: {
        budget: {
          min: Number(body.preferences?.budget?.min) || 0,
          max: Number(body.preferences?.budget?.max) || 50000000,
          flexibility:
            (body.preferences?.budget?.flexibility as 'strict' | 'flexible' | 'uncertain') ||
            'uncertain',
        },
        family: {
          totalPeople: Number(body.preferences?.family?.totalPeople) || 2,
          hasInfant: Boolean(body.preferences?.family?.hasInfant),
          hasChild: Boolean(body.preferences?.family?.hasChild),
          hasElderly: Boolean(body.preferences?.family?.hasElderly),
          hasPet: Boolean(body.preferences?.family?.hasPet),
        },
        lifestyle: {
          remoteWork: Boolean(body.preferences?.lifestyle?.remoteWork),
          cookOften: Boolean(body.preferences?.lifestyle?.cookOften),
          guestsOften: Boolean(body.preferences?.lifestyle?.guestsOften),
        },
        purpose: (body.preferences?.purpose as 'live' | 'sell' | 'rent') || 'live',
      },
      selectedSpaces: Array.isArray(body.selectedSpaces) ? body.selectedSpaces : [],
      selectedProcesses: body.selectedProcesses || {},
      timestamp: new Date().toISOString(),
    }

    logger.info('V4API', '견적 계산 요청', {
      pyeong: input.spaceInfo.pyeong,
      selectedSpacesCount: input.selectedSpaces.length,
      forceGrade,
    })

    // V4 견적 계산 (강제 등급이 있으면 전달)
    const result = await calculateEstimateV4ForUI(input, forceGrade)

    return NextResponse.json({
      status: 'SUCCESS',
      result,
    })
  } catch (error) {
    logger.error('V4API', '견적 계산 실패', error)

    return NextResponse.json(
      {
        status: 'ERROR',
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

