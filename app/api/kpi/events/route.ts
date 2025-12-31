/**
 * KPI 이벤트 수집 API
 * 
 * 프론트엔드에서 발생한 KPI 이벤트를 수집합니다.
 * 엔진 로직에 영향을 주지 않도록 독립적으로 동작합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db/supabase'

export interface KPIEventRequest {
  sessionId: string
  eventType: 'decision_start' | 'option_change' | 'lock_override_attempt' | 'decision_complete'
  eventData: Record<string, unknown>
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const body: KPIEventRequest = await request.json()

    // 필수 필드 검증
    if (!body.sessionId || !body.eventType || !body.timestamp) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // kpi_events 테이블에 이벤트 저장
    const { error } = await supabase
      .from('kpi_events')
      .insert({
        session_id: body.sessionId,
        event_type: body.eventType,
        event_data: body.eventData,
        timestamp: body.timestamp
      })

    if (error) {
      console.error('❌ KPI 이벤트 저장 실패:', error)
      return NextResponse.json(
        { success: false, error: '이벤트 저장 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ KPI 이벤트 API 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    )
  }
}




















