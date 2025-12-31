/**
 * 모델 검증 전용 테스트 API
 * 
 * GET /api/test-model-verification
 * 
 * ⚠️ 목적: 지정한 GPT 모델이 실제로 적용되고 있는지 검증
 * - Fallback(자동 대체 모델 사용) 여부를 명확히 판별
 * - 기존 API 호출 로직은 수정하지 않음
 * - 오직 "검증용 호출"만 수행
 * 
 * 검증 방법:
 * 1. 단순 프롬프트로 정확한 출력 요구
 * 2. 출력이 요구한 문장과 완전히 일치하는지 확인
 * 3. 일치하지 않으면 fallback 발생 또는 모델 미적용 판단
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { callAIWithLimit } from '@/lib/api/ai-call-limiter'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 검증용 프롬프트 (단순하고 명확하게)
const VERIFICATION_PROMPT = '정확히 이 문장만 출력하세요: MODEL_TEST_VERIFICATION'

// 검증할 모델 목록 (프로젝트에서 실제 사용 중인 모델)
const TEST_MODELS = [
  'gpt-3.5-turbo', // 프로젝트에서 가장 많이 사용 중
  'gpt-4-turbo', // 프로젝트에서 일부 사용 중
  'gpt-4o-mini', // 프로젝트에서 일부 사용 중
  'gpt-4o', // 고성능 모델 (비교용)
  'gpt-4', // 프리미엄 모델 (비교용)
]

interface VerificationResult {
  model: string
  success: boolean
  expectedOutput: string
  actualOutput: string
  exactMatch: boolean
  rawResponse: any
  error?: string
}

/**
 * 단일 모델 검증
 */
async function verifyModel(model: string): Promise<VerificationResult> {
  const expectedOutput = 'MODEL_TEST_VERIFICATION'
  
  try {
    // Phase 4: AI 호출 래퍼 적용 (enableLimit=false)
    const enableLimit = process.env.NEXT_PUBLIC_AI_RATE_LIMIT === 'true';
    const sessionId = undefined; // 검증용이므로 세션 ID 없음
    
    // ⚠️ 검증 전용 호출: 옵션 최소화, 후처리 없음
    const response = await callAIWithLimit({
      sessionId,
      action: 'DEBUG',
      prompt: { model, prompt: VERIFICATION_PROMPT },
      enableLimit: false, // 🔒 Phase 4: 반드시 false
      aiCall: async () => {
        return await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'user',
              content: VERIFICATION_PROMPT
            }
          ],
          // temperature, top_p 등 옵션 지정하지 않음 (기본값 사용)
        });
      },
    })

    const actualOutput = response.choices[0]?.message?.content?.trim() || ''
    const exactMatch = actualOutput === expectedOutput

    return {
      model,
      success: exactMatch,
      expectedOutput,
      actualOutput,
      exactMatch,
      rawResponse: {
        id: response.id,
        object: response.object,
        created: response.created,
        model: response.model, // ⚠️ 실제 사용된 모델명 확인
        choices: response.choices,
        usage: response.usage,
      },
    }
  } catch (error: any) {
    return {
      model,
      success: false,
      expectedOutput,
      actualOutput: '',
      exactMatch: false,
      rawResponse: null,
      error: error?.message || '알 수 없는 오류',
    }
  }
}

export async function GET(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: 'OpenAI API 키가 설정되지 않았습니다.',
        message: '.env.local 파일에 OPENAI_API_KEY를 설정해주세요.',
      },
      { status: 500 }
    )
  }

  console.log('='.repeat(80))
  console.log('🔍 모델 검증 테스트 시작')
  console.log('='.repeat(80))

  const results: VerificationResult[] = []
  const timestamp = new Date().toISOString()

  // 각 모델별로 동일한 검증 호출 반복 실행
  for (const model of TEST_MODELS) {
    console.log(`\n📌 테스트 모델: ${model}`)
    console.log(`   프롬프트: "${VERIFICATION_PROMPT}"`)
    console.log(`   기대 출력: "MODEL_TEST_VERIFICATION"`)
    
    const result = await verifyModel(model)
    results.push(result)

    // 콘솔에 구분해서 출력
    console.log(`\n   결과:`)
    console.log(`   - 성공 여부: ${result.success ? '✅ 성공' : '❌ 실패'}`)
    console.log(`   - 정확 일치: ${result.exactMatch ? '✅ 예' : '❌ 아니오'}`)
    console.log(`   - 기대 출력: "${result.expectedOutput}"`)
    console.log(`   - 실제 출력: "${result.actualOutput}"`)
    
    if (result.rawResponse) {
      console.log(`   - 응답 모델명: ${result.rawResponse.model}`)
      console.log(`   - Usage:`, result.rawResponse.usage)
    }
    
    if (result.error) {
      console.log(`   - 오류: ${result.error}`)
    }

    // 원본 응답 전체 로그 (가공·필터링·정리 금지)
    console.log(`\n   📋 원본 응답 객체:`)
    console.log(JSON.stringify(result.rawResponse, null, 2))
    
    console.log(`\n${'-'.repeat(80)}`)
  }

  // 최종 요약
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  console.log(`\n${'='.repeat(80)}`)
  console.log('📊 검증 결과 요약')
  console.log('='.repeat(80))
  console.log(`총 테스트: ${results.length}개`)
  console.log(`✅ 성공: ${successCount}개`)
  console.log(`❌ 실패: ${failCount}개`)
  console.log(`\n${'='.repeat(80)}\n`)

  // 판별 규칙 안내
  const analysis = {
    allSuccess: successCount === results.length,
    someFailed: failCount > 0,
    failedModels: results.filter(r => !r.success).map(r => r.model),
    successModels: results.filter(r => r.success).map(r => r.model),
  }

  // 후속 판단 로직 안내
  let judgment = ''
  if (analysis.allSuccess) {
    judgment = '✅ 모든 모델 테스트 성공 → 모델 변경은 정상 작동, 문제 없음'
  } else if (analysis.someFailed) {
    judgment = `⚠️ 특정 모델 실패 → 실패한 모델(${analysis.failedModels.join(', ')})은 프로젝트에서 비활성화되었거나 계정 권한이 없거나 fallback 대상 (코드 문제 아님)`
  }

  return NextResponse.json({
    timestamp,
    verificationPrompt: VERIFICATION_PROMPT,
    expectedOutput: 'MODEL_TEST_VERIFICATION',
    results,
    summary: {
      total: results.length,
      success: successCount,
      failed: failCount,
    },
    analysis,
    judgment,
    note: '⚠️ 판별 기준: 출력이 프롬프트에서 요구한 문장과 완전히 일치해야 성공. 문장 변경, 설명 추가, 형식 붕괴, 말투 개입 시 실패 (모델 미적용 또는 fallback 발생)',
  })
}




