/**
 * AI 기반 공사 일정 생성
 * 고객 정보를 분석하여 더 정확한 공정표 생성
 */

import OpenAI from 'openai'
import type { ProcessId } from './config'
import { PROCESS_NAMES } from './config'
import { calculateSchedule, type ScheduleResult } from './schedule'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface CustomerInfo {
  areaPyeong: number
  selectedProcesses: ProcessId[]
  traitsScore?: Record<string, number>
  spaceInfo?: {
    housingType?: string
    region?: string
    roomCount?: number
    bathroomCount?: number
  }
}

/**
 * AI 기반 공사 일정 생성
 * 기본 계산 결과를 AI가 개선하여 더 정확한 일정 제공
 */
export async function generateAISchedule(
  customerInfo: CustomerInfo
): Promise<ScheduleResult> {
  try {
    // 기본 일정 계산
    const baseSchedule = calculateSchedule(
      customerInfo.selectedProcesses,
      customerInfo.areaPyeong
    )

    // AI 프롬프트 생성
    const systemPrompt = `당신은 아르젠 인테리봇의 공사 일정 전문가입니다.
고객의 정보를 바탕으로 현실적이고 정확한 공사 일정을 제안하세요.

공정별 기본 일수:
${customerInfo.selectedProcesses
  .map((pid) => `- ${PROCESS_NAMES[pid]}: ${baseSchedule.processSchedule.find((p) => p.processName === PROCESS_NAMES[pid])?.days || 0}일`)
  .join('\n')}

고려사항:
1. 공정 간 병렬 작업 가능 여부
2. 평수에 따른 실제 소요 시간
3. 주거 형태에 따른 추가 시간 (아파트/단독주택 등)
4. 계절/날씨 고려 (필요시)
5. 현실적인 공사 일정

JSON 형식으로 반환:
{
  "processSchedule": [
    {"processName": "공정명", "days": 일수},
    ...
  ],
  "estimatedDays": 총일수,
  "reasoning": "일정 조정 이유 (한국어)"
}`

    const userPrompt = `고객 정보:
- 평수: ${customerInfo.areaPyeong}평
- 주거 형태: ${customerInfo.spaceInfo?.housingType || '미지정'}
- 지역: ${customerInfo.spaceInfo?.region || '미지정'}
- 방 개수: ${customerInfo.spaceInfo?.roomCount || '미지정'}
- 화장실 개수: ${customerInfo.spaceInfo?.bathroomCount || '미지정'}

선택된 공정:
${customerInfo.selectedProcesses.map((pid) => `- ${PROCESS_NAMES[pid]}`).join('\n')}

기본 계산 결과:
- 총 예상 일수: ${baseSchedule.estimatedDays}일
- 공정별 일수: ${JSON.stringify(baseSchedule.processSchedule, null, 2)}

위 정보를 바탕으로 현실적이고 정확한 공사 일정을 제안해주세요.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // 낮은 temperature로 일관성 있는 결과
    })

    const aiResult = JSON.parse(response.choices[0]?.message?.content || '{}')

    // AI 결과 검증 및 기본값 사용
    if (aiResult.processSchedule && Array.isArray(aiResult.processSchedule)) {
      // 공정명이 올바른지 검증
      const validatedSchedule = aiResult.processSchedule
        .filter((p: any) => {
          const processName = p.processName
          return Object.values(PROCESS_NAMES).includes(processName)
        })
        .map((p: any) => ({
          processName: p.processName,
          days: Math.max(1, Math.round(p.days || 0)), // 최소 1일 보장
        }))

      const totalDays = Math.max(
        aiResult.estimatedDays || baseSchedule.estimatedDays,
        validatedSchedule.reduce((sum: number, p: any) => sum + p.days, 0) * 0.6
      )

      return {
        estimatedDays: Math.round(totalDays),
        processSchedule: validatedSchedule.length > 0 ? validatedSchedule : baseSchedule.processSchedule,
      }
    }

    // AI 결과가 유효하지 않으면 기본 일정 반환
    return baseSchedule
  } catch (error) {
    console.error('[AI 공사 일정 생성 오류]', error)
    // 오류 발생 시 기본 일정 반환
    return calculateSchedule(customerInfo.selectedProcesses, customerInfo.areaPyeong)
  }
}


