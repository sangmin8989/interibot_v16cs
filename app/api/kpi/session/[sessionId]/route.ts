/**
 * 세션별 KPI 조회 API
 * 
 * 특정 세션의 KPI 데이터를 계산하여 반환합니다.
 * - decisionDurationMs: 결정 완료 시간 (밀리초)
 * - optionChangeCount: 옵션 변경 횟수
 * - lockOverrideAttemptCount: LOCK 변경 시도 횟수
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 세션의 모든 이벤트 조회
    const { data: events, error } = await supabase
      .from('kpi_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('❌ KPI 이벤트 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '이벤트 조회 실패' },
        { status: 500 }
      )
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        success: true,
        kpi: {
          sessionId,
          decisionDurationMs: null,
          optionChangeCount: 0,
          lockOverrideAttemptCount: 0
        }
      })
    }

    // KPI 계산
    const decisionStartEvent = events.find(e => e.event_type === 'decision_start')
    const decisionCompleteEvent = events.find(e => e.event_type === 'decision_complete')
    const optionChangeEvents = events.filter(e => e.event_type === 'option_change')
    const lockOverrideAttemptEvents = events.filter(e => e.event_type === 'lock_override_attempt')

    // 결정 완료 시간 계산
    let decisionDurationMs: number | null = null
    if (decisionStartEvent && decisionCompleteEvent) {
      const startTime = new Date(decisionStartEvent.timestamp).getTime()
      const endTime = new Date(decisionCompleteEvent.timestamp).getTime()
      decisionDurationMs = endTime - startTime
    }

    return NextResponse.json({
      success: true,
      kpi: {
        sessionId,
        decisionDurationMs,
        optionChangeCount: optionChangeEvents.length,
        lockOverrideAttemptCount: lockOverrideAttemptEvents.length
      }
    })
  } catch (error) {
    console.error('❌ KPI 조회 API 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    )
  }
}













