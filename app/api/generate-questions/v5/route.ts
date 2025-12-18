/**
 * V5 질문 생성 API
 * 
 * 명세서 기반 규칙 기반 질문 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateV5Questions, isV5EngineAvailable } from '@/lib/analysis/v5'
import type { SpaceInfo } from '@/lib/store/spaceInfoStore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { spaceInfo }: { spaceInfo: SpaceInfo | null } = body

    // 입력 검증
    if (!spaceInfo) {
      return NextResponse.json(
        { error: '집 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    // V5 엔진 사용 가능 여부 확인
    if (!isV5EngineAvailable(spaceInfo)) {
      return NextResponse.json(
        { error: 'V5 엔진을 사용하기 위한 최소 정보가 부족합니다.' },
        { status: 400 }
      )
    }

    console.log('🎯 V5 질문 생성 시작:', {
      pyeong: spaceInfo.pyeong,
      housingType: spaceInfo.housingType,
    })

    // V5 질문 생성
    const result = generateV5Questions(spaceInfo)

    // 기존 API 형식에 맞게 변환
    const questions = result.questions.map((q, index) => ({
      id: `q${index + 1}`,
      questionId: q.id,
      category: q.category,
      goal: `${q.type} 타입 질문 - ${q.category} 카테고리`,
      text: q.text,
      options: q.options.map((opt, optIndex) => ({
        id: `opt${index + 1}_${optIndex + 1}`,
        text: opt,
        value: opt,
        icon: getIconForOption(opt),
      })),
      type: q.type,
    }))

    console.log(`✅ V5 질문 생성 완료: ${questions.length}개 질문`)

    return NextResponse.json({
      success: true,
      questions,
      reason: result.reason,
      hypothesis: result.hypothesis, // 디버깅용
      engine: 'v5', // 엔진 버전 표시
    })
  } catch (error: any) {
    console.error('❌ V5 질문 생성 오류:', error)
    return NextResponse.json(
      {
        error: 'V5 질문 생성 중 오류가 발생했습니다.',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * 옵션에 맞는 아이콘 반환
 */
function getIconForOption(option: string): string {
  const iconMap: Record<string, string> = {
    예: '✅',
    아니오: '❌',
    자주: '🔴',
    가끔: '🟡',
    거의없음: '🟢',
    없음: '⚪',
    직접비교: '🔍',
    전문가추천: '👨‍🔧',
    어려움: '😰',
    정해둠: '✅',
    밝고화사한: '☀️',
    차분하고따뜻한: '🕯️',
    어둡고고급스러운: '🌙',
    모르겠음: '❓',
  }

  // 부분 매칭
  for (const [key, icon] of Object.entries(iconMap)) {
    if (option.includes(key)) {
      return icon
    }
  }

  return '📌' // 기본 아이콘
}

