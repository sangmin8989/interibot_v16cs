/**
 * 인테리봇 견적 API V3
 * 
 * @deprecated 이 API는 더 이상 사용되지 않습니다.
 * 공식 API: /api/estimate/v4
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('[DEPRECATED_API_BLOCK] 구버전 견적 API 접근 차단: /api/estimate/v3');
  
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'DEPRECATED_API',
        severity: 'BLOCK',
        userMessage: '이 API는 더 이상 사용되지 않습니다. 공식 견적 API를 사용해주세요.',
        debug: {
          deprecated: '/api/estimate/v3',
          official: '/api/estimate/v4',
        },
      },
    },
    { status: 410 } // 410 Gone
  );
}

export async function GET() {
  return NextResponse.json({
    message: '인테리봇 견적 API V3',
    note: '이 엔드포인트는 deprecated 되었습니다.',
    redirect: '/api/estimate/v4',
    status: 'deprecated',
  })
}
