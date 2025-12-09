/**
 * AI 기반 공정 추천 API (V2 강화)
 * 
 * 개선사항:
 * - GPT-4o-mini로 업그레이드 (정확도 향상)
 * - 고객 성향 기반 맞춤 추천
 * - 세분화된 공정 옵션 추천
 * - 디자인/색상/스타일 추천 포함
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 공간 타입과 한글명 매핑
const AREA_LABELS: Record<string, string> = {
  'kitchen': '주방',
  'bathroom': '욕실',
  'living': '거실',
  'bedroom': '침실',
  'masterBedroom': '안방',
  'kidsBedroom': '아이방',
  'kidsroom': '아이방',
  'study': '서재/작업실',
  'dressing': '드레스룸',
  'dressRoom': '드레스룸',
  'veranda': '베란다',
  'balcony': '발코니',
  'laundry': '다용도실',
  'utility': '다용도실',
  'entrance': '현관',
  'storage': '창고/수납',
  'full': '전체 리모델링',
  'fullhome': '전체 리모델링',
}

const ALL_PROCESSES = ['철거', '주방', '욕실', '타일', '목공', '전기', '도배', '필름', '창호', '기타']

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { selectedAreas, spaceInfo, preferences, analysisResult } = await request.json()

    if (!selectedAreas || selectedAreas.length === 0) {
      return NextResponse.json(
        { error: '선택된 공간이 필요합니다.' },
        { status: 400 }
      )
    }

    // 전체 리모델링인 경우 모든 공정 반환 (최적화)
    if (selectedAreas.includes('full') || selectedAreas.includes('fullhome')) {
      return NextResponse.json({
        success: true,
        recommendedProcesses: ALL_PROCESSES,
        processOptions: generateFullProcessOptions(preferences),
        styleRecommendation: generateStyleRecommendation(preferences),
        reason: '전체 리모델링이 선택되어 모든 공정이 포함됩니다.',
      })
    }

    // 선택된 공간을 한글명으로 변환
    const selectedAreaNames = selectedAreas.map((area: string) => 
      AREA_LABELS[area] || area
    )

    // ============================================================
    // 강화된 시스템 프롬프트
    // ============================================================
    const systemPrompt = `당신은 대한민국 최고의 인테리어 전문가 AI입니다.
15년 경력의 베테랑 인테리어 디자이너처럼 정확하고 신뢰할 수 있는 추천을 제공합니다.

## 당신의 역할
1. 고객이 선택한 공간에 **필수 공정**을 정확히 추천
2. 고객의 **성향/라이프스타일**에 맞는 세부 옵션 추천
3. **디자인 스타일, 색상, 자재** 추천
4. 실제 시공 경험에 기반한 **실용적인 조언** 제공

## 사용 가능한 공정 (총 10개)
- 철거: 기존 시설물 철거/폐기 (구축 필수)
- 주방: 상하부장, 상판, 싱크, 후드, 설비 (주방형태: 일자/ㄱ자/ㄷ자/아일랜드)
- 욕실: 타일, 방수, 위생도기, 설비 (스타일: 모던/클래식/미니멀/호텔식)
- 타일: 현관/발코니 타일 (주방/욕실 타일은 각 공정에 포함됨)
- 목공: 붙박이장, 신발장, 방문, 중문, 몰딩
- 전기: 조명, 스위치, 콘센트, 분전반
- 도배: 벽지, 천장지 (종류: 합지/실크/수입/친환경)
- 필름: 문/가구/창틀 필름
- 창호: 방창, 발코니창, 방충망
- 기타: 준공청소, 보양, 현장관리

## 핵심 규칙 (반드시 지킬 것)
1. **주방 선택 시**: 주방 공정만 (타일/도배는 별도 선택 시에만)
2. **욕실 선택 시**: 욕실 공정만 (타일이 이미 포함됨)
3. **거실/침실 선택 시**: 도배 + 전기 (바닥공사는 목공에 포함)
4. **현관 선택 시**: 타일 + 목공(신발장)
5. **철거는 자동 추가 금지**: 고객이 직접 선택해야 함
6. **불필요한 공정 포함 금지**: 선택된 공간에 해당하는 것만

## 성향 기반 추천 지침
- 요리빈도 높음 → 주방 동선, 수납 강화 추천
- 정리정돈 높음 → 수납 공간 최적화, 붙박이장 추천
- 청소성향 높음 → 청소 용이한 자재 추천 (타일, 필름)
- 조명취향 높음 → 간접조명, 디밍 시스템 추천
- 예산감각 높음 → 가성비 좋은 옵션 위주 추천

## JSON 출력 형식
{
  "recommendedProcesses": ["필수 공정1", "필수 공정2"],
  "processOptions": {
    "주방": {
      "형태": "ㄱ자 또는 아일랜드 추천 이유",
      "상판": "엔지니어드스톤/세라믹 추천 이유",
      "설비": ["식기세척기", "인덕션"] 
    },
    "욕실": {
      "스타일": "모던/호텔식 추천 이유",
      "특수옵션": ["비데", "레인샤워"]
    }
  },
  "styleRecommendation": {
    "디자인": "모던/클래식/미니멀 중 추천",
    "주요색상": "화이트+우드톤 등",
    "포인트": "구체적인 포인트 컬러/자재"
  },
  "reason": "전체 추천 이유 (3줄 이내)"
}`

    // ============================================================
    // 강화된 사용자 프롬프트
    // ============================================================
    let userPrompt = `## 고객 요청 분석

### 선택된 공간
${selectedAreaNames.join(', ')}

`

    if (spaceInfo) {
      userPrompt += `### 주거 정보
- 평수: ${spaceInfo.size || spaceInfo.totalArea || '미지정'}평
- 방 개수: ${spaceInfo.roomCount || '미지정'}개
- 욕실 개수: ${spaceInfo.bathroomCount || '미지정'}개
- 주거 형태: ${spaceInfo.housingType === 'new' ? '신축' : '구축 아파트'}
- 가족 구성: ${spaceInfo.familySizeRange || spaceInfo.totalPeople || '미지정'}명
${spaceInfo.ageRanges ? `- 가족 연령대: ${spaceInfo.ageRanges.join(', ')}` : ''}

`
    }

    if (preferences) {
      userPrompt += `### 고객 성향 (1~10점)
- 요리 빈도: ${preferences.cooking_frequency || preferences.요리빈도 || 5}/10
- 정리정돈: ${preferences.organization || preferences.정리정돈 || 5}/10
- 청소 성향: ${preferences.cleaning || preferences.청소성향 || 5}/10
- 조명 취향: ${preferences.lighting || preferences.조명취향 || 5}/10
- 예산 감각: ${preferences.budget || preferences.예산감각 || 5}/10
- 디자인 선호: ${preferences.design || preferences.디자인선호 || '미지정'}
- 색상 선호: ${preferences.color || preferences.색상선호 || '미지정'}
- 스마트홈 관심도: ${preferences.tech || preferences.기술선호도 || 5}/10

`
    }

    if (analysisResult) {
      userPrompt += `### AI 성향 분석 결과
- 추천 스타일: ${analysisResult.recommendedStyle || '미지정'}
- 추천 무드: ${analysisResult.mood || '미지정'}
- 중요 가치: ${analysisResult.values?.join(', ') || '미지정'}

`
    }

    userPrompt += `### 요청사항
위 정보를 바탕으로:
1. 선택된 공간에 필요한 핵심 공정을 추천해주세요
2. 각 공정별 세부 옵션을 고객 성향에 맞게 추천해주세요
3. 전체 디자인 스타일과 색상을 제안해주세요
4. 추천 이유를 구체적으로 설명해주세요

※ 철거 공정은 포함하지 마세요 (고객이 별도 선택)
※ 선택된 공간에 해당하는 공정만 추천하세요`

    // API 호출 (GPT-4o-mini 사용)
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',  // gpt-4o-mini에서 변경 (API 호환성)
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4, // 약간의 창의성
      max_tokens: 1500,
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    const recommendedProcesses = result.recommendedProcesses || []

    // 공정 코드 검증 및 정규화
    const validProcesses = normalizeProcesses(recommendedProcesses)

    console.log('[AI 공정 추천 V2]', {
      selectedAreas,
      recommended: validProcesses,
      options: result.processOptions,
      style: result.styleRecommendation,
    })

    return NextResponse.json({
      success: true,
      recommendedProcesses: validProcesses,
      processOptions: result.processOptions || {},
      styleRecommendation: result.styleRecommendation || {},
      reason: result.reason || '선택된 공간에 필요한 공정을 추천했습니다.',
    })
  } catch (error: any) {
    console.error('[AI 공정 추천 오류]', error)
    
    // OpenAI 429 에러 처리
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('429')) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API 사용량 한도 초과',
          message: 'AI 추천 서비스를 일시적으로 사용할 수 없습니다. 기본 공정으로 진행해주세요.',
          fallbackProcesses: getFallbackProcesses(),
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: '공정 추천 중 오류가 발생했습니다.',
        message: error?.message || '알 수 없는 오류가 발생했습니다.',
        fallbackProcesses: getFallbackProcesses(),
      },
      { status: 500 }
    )
  }
}

// ============================================================
// 헬퍼 함수
// ============================================================

/** 공정 코드 정규화 */
function normalizeProcesses(processes: string[]): string[] {
  const processCodeMap: Record<string, string> = {
    '철거': '철거',
    '철거/폐기공사': '철거',
    '주방': '주방',
    '주방/다용도실 공사': '주방',
    '욕실': '욕실',
    '욕실/수전공사': '욕실',
    '타일': '타일',
    '타일/석재공사': '타일',
    '목공': '목공',
    '목공사/가구공사': '목공',
    '전기': '전기',
    '전기/통신공사': '전기',
    '도배': '도배',
    '도배/벽지공사': '도배',
    '필름': '필름',
    '필름/시트공사': '필름',
    '창호': '창호',
    '기타': '기타',
    '기타 공사 및 마감 작업': '기타',
  }

  const validProcesses = processes
    .map((process: string) => {
      if (ALL_PROCESSES.includes(process)) return process
      if (processCodeMap[process]) return processCodeMap[process]
      
      // 부분 매칭
      for (const [name, code] of Object.entries(processCodeMap)) {
        if (process.includes(name.split('/')[0]) || name.includes(process)) {
          return code
        }
      }
      return null
    })
    .filter((code): code is string => code !== null && ALL_PROCESSES.includes(code))

  return Array.from(new Set(validProcesses))
}

/** 전체 리모델링 옵션 생성 */
function generateFullProcessOptions(preferences: any) {
  return {
    주방: {
      형태: preferences?.요리빈도 >= 7 ? 'ㄷ자 또는 아일랜드 (요리 동선 최적화)' : 'ㄱ자 (효율적인 동선)',
      상판: '엔지니어드스톤 (내구성 + 관리 용이)',
      설비: ['인덕션', '식기세척기']
    },
    욕실: {
      스타일: preferences?.청소성향 >= 7 ? '미니멀 (청소 용이)' : '모던 (균형잡힌 디자인)',
      특수옵션: ['비데', '레인샤워']
    },
    도배: {
      종류: preferences?.예산감각 >= 7 ? '실크벽지 (가성비)' : '수입벽지 (고급감)'
    }
  }
}

/** 스타일 추천 생성 */
function generateStyleRecommendation(preferences: any) {
  const designStyle = preferences?.디자인선호 || '모던'
  const colorPref = preferences?.색상선호 || '화이트'

  return {
    디자인: designStyle,
    주요색상: `${colorPref} + 우드톤 조합`,
    포인트: '거실 TV장 뒤 포인트 월 추천'
  }
}

/** 폴백 공정 목록 */
function getFallbackProcesses() {
  return ['도배', '전기', '목공', '기타']
}
