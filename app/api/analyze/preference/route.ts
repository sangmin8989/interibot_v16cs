// 인테리봇 성향 분석 API
// - OpenAI 호출을 수행하고, 429(Quota 초과)를 포함한 오류를 일관된 JSON 포맷으로 반환한다.

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { callAIWithLimit } from '@/lib/api/ai-call-limiter'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // OpenAI API 키 확인 (더 자세한 로깅)
    console.log('🔑 환경 변수 확인:', {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV
    })
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다.')
      console.error('💡 해결 방법: .env.local 파일을 생성하고 OPENAI_API_KEY=your_key_here 를 추가하세요.')
      return NextResponse.json(
        { 
          error: 'OpenAI API 키가 설정되지 않았습니다.',
          message: '.env.local 파일을 생성하고 OPENAI_API_KEY를 설정해주세요.',
          hint: '프로젝트 루트에 .env.local 파일을 만들고 OPENAI_API_KEY=your_api_key_here 를 추가한 후 서버를 재시작하세요.'
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    console.log('📥 API 요청 받음:', { 
      mode: body.mode, 
      hasAnswers: !!body.answers,
      answersKeys: body.answers ? Object.keys(body.answers) : [],
      hasVibeData: !!body.vibeData,
      hasSpaceInfo: !!body.spaceInfo,
      hasSpaceStyles: !!body.spaceStyles
    })

    const { mode, answers, vibeData, spaceInfo, spaceStyles } = body

    // Vibe 모드 체크
    const isVibeMode = mode === 'vibe'
    
    if (isVibeMode) {
      // Vibe 모드일 때는 vibeData 확인
      if (!vibeData || (!vibeData.mbti && !vibeData.bloodType && !vibeData.birthdate)) {
        console.error('❌ Vibe 모드 데이터가 없습니다.')
        return NextResponse.json(
          { error: 'Vibe 모드 데이터가 필요합니다. (MBTI, 혈액형, 별자리 중 최소 1개)' },
          { status: 400 }
        )
      }
    } else {
      // 일반 모드일 때는 answers 확인
      if (!answers || Object.keys(answers).length === 0) {
        console.error('❌ 답변이 없습니다.')
        return NextResponse.json(
          { error: '답변이 필요합니다.' },
          { status: 400 }
        )
      }
    }

    // 공간별 스타일 답변이 있으면 처리
    const hasSpaceStyles = spaceStyles && Object.keys(spaceStyles).length > 0
    console.log('📊 공간별 스타일:', hasSpaceStyles)

    // 15개 핵심 성향 항목 분석을 위한 프롬프트 생성
    const systemPrompt = `당신은 아르젠 인테리봇의 전문 인테리어 분석가입니다.
고객의 답변을 바탕으로 다음 15개 핵심 성향 항목을 분석하세요:

1. 공간 감각
2. 시각 민감도
3. 청각 민감도
4. 청소 성향
5. 정리정돈 수준
6. 수면 패턴
7. 활동량·동선
8. 가족 구성
9. 건강 요소
10. 예산 감각
11. 색감 취향
12. 조명 취향
13. 집 사용 목적
14. 불편 요소
15. 전체 생활 루틴

분석 결과를 JSON 형식으로 반환하세요:
{
  "preferences": {
    "spaceSense": "점수 1-10",
    "visualSensitivity": "점수 1-10",
    "auditorySensitivity": "점수 1-10",
    "cleaningTendency": "점수 1-10",
    "organizationLevel": "점수 1-10",
    "sleepPattern": "점수 1-10",
    "activityLevel": "점수 1-10",
    "familyComposition": "점수 1-10",
    "healthFactors": "점수 1-10",
    "budgetSense": "점수 1-10",
    "colorPreference": "점수 1-10",
    "lightingPreference": "점수 1-10",
    "spacePurpose": "점수 1-10",
    "discomfortFactors": "점수 1-10",
    "lifestyleRoutine": "점수 1-10"
  },
  "recommendedStyle": "모던|내추럴|미니멀|북유럽|빈티지|모던클래식|호텔식",
  "recommendedColors": ["색상1", "색상2"],
  "summary": "분석 요약 (한국어)"
}`

    // Vibe 모드일 때는 vibeData를 answers 형식으로 변환
    let processedAnswers: Record<string, string> = {}
    
    if (isVibeMode && vibeData) {
      // Vibe 데이터를 answers 형식으로 변환
      if (vibeData.mbti) processedAnswers.mbti = vibeData.mbti
      if (vibeData.bloodType) processedAnswers.bloodType = vibeData.bloodType
      if (vibeData.birthdate) {
        // 생년월일에서 별자리 계산 (간단한 예시)
        processedAnswers.birthdate = vibeData.birthdate
      }
    } else if (answers) {
      // 일반 모드: 기존 로직 유지
      processedAnswers = { ...answers }
      
      // vibe_selection 객체가 있으면 평탄화
      if (answers.vibe_selection && typeof answers.vibe_selection === 'object') {
        const vibeSelection = answers.vibe_selection as Record<string, string>
        processedAnswers = {
          ...answers,
          mbti: vibeSelection.mbti || '',
          blood: vibeSelection.blood || '',
          zodiac: vibeSelection.zodiac || '',
        }
        delete processedAnswers.vibe_selection
      }
    }

    // 공간별 스타일 답변을 프롬프트에 포함
    let userPrompt = `모드: ${mode}\n`
    
    if (hasSpaceStyles) {
      userPrompt += `공간별 스타일 선택:\n${JSON.stringify(spaceStyles, null, 2)}\n\n`
    }
    
    userPrompt += `답변:\n${JSON.stringify(processedAnswers, null, 2)}\n\n위 답변을 바탕으로 성향을 분석해주세요.`
    
    // 공간별 스타일이 있고 "잘 모르겠어요" 비율이 높으면 AI 추천 모드 활성화
    if (hasSpaceStyles && answers.unknownRatio !== undefined && answers.unknownRatio >= 0.5) {
      userPrompt += '\n\n고객이 많은 공간에서 "잘 모르겠어요"를 선택했으므로, 다른 답변을 기반으로 TOP3 추천 스타일을 제공해주세요.'
    }

    console.log('🤖 OpenAI API 호출 시작...')
    
    // Phase 4: AI 호출 래퍼 적용 (enableLimit=false)
    const enableLimit = process.env.NEXT_PUBLIC_AI_RATE_LIMIT === 'true';
    const sessionId = request.headers.get('x-session-id') || undefined;
    
    let response
    try {
      response = await callAIWithLimit({
        sessionId,
        action: 'TRAIT_ANALYSIS',
        prompt: { systemPrompt, userPrompt },
        enableLimit: false, // 🔒 Phase 4: 반드시 false
        aiCall: async () => {
          return await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          });
        },
      })
      console.log('✅ OpenAI API 응답 받음')
    } catch (openaiError: any) {
      // OpenAI API 에러를 별도로 처리
      console.error('❌ OpenAI API 호출 실패:', openaiError)
      
      // 429 Quota 초과 에러 처리
      if (openaiError?.status === 429 || openaiError?.message?.includes('quota') || openaiError?.message?.includes('429')) {
        return NextResponse.json(
          {
            success: false,
            error: 'OpenAI API 사용량 한도 초과',
            message: '현재 OpenAI API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주시거나, OpenAI 계정의 사용량 한도를 확인해주세요.',
            errorCode: 'QUOTA_EXCEEDED',
            details: process.env.NODE_ENV === 'development' ? openaiError?.message : undefined
          },
          { status: 429 }
        )
      }
      
      // 기타 OpenAI 에러
      throw openaiError
    }
    const content = response.choices[0]?.message?.content || '{}'
    console.log('📄 응답 내용 길이:', content.length)
    
    let analysis
    try {
      analysis = JSON.parse(content)
      console.log('✅ JSON 파싱 성공')
    } catch (parseError) {
      console.error('❌ JSON 파싱 오류:', parseError)
      console.error('📄 파싱 실패한 내용:', content.substring(0, 500))
      throw new Error(`AI 응답 파싱 실패: ${parseError}`)
    }
    
    const analysisId = `analysis_${Date.now()}`

    // TODO: 분석 결과를 데이터베이스에 저장

    console.log('✅ 분석 완료:', analysisId)
    return NextResponse.json({
      success: true,
      analysisId,
      analysis,
    })
  } catch (error: any) {
    console.error('성향 분석 오류:', error)
    
    // 더 자세한 에러 메시지 제공
    let errorMessage = '성향 분석 중 오류가 발생했습니다.'
    
    if (error?.message) {
      if (error.message.includes('API key') || error.message.includes('OPENAI_API_KEY')) {
        errorMessage = 'OpenAI API 키가 설정되지 않았거나 유효하지 않습니다. 환경 변수를 확인해주세요.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.message.includes('JSON')) {
        errorMessage = 'AI 응답을 파싱하는 중 오류가 발생했습니다.'
      } else {
        errorMessage = `성향 분석 오류: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

