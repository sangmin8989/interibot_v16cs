import { NextRequest, NextResponse } from 'next/server'

/**
 * @deprecated 이 API는 더 이상 사용되지 않습니다.
 * 공식 API: /api/estimate/v4
 */
export async function POST(request: NextRequest) {
  console.log('[DEPRECATED_API_BLOCK] 구버전 견적 API 접근 차단: /api/estimate/argen');
  
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'DEPRECATED_API',
        severity: 'BLOCK',
        userMessage: '이 API는 더 이상 사용되지 않습니다. 공식 견적 API를 사용해주세요.',
        debug: {
          deprecated: '/api/estimate/argen',
          official: '/api/estimate/v4',
        },
      },
    },
    { status: 410 } // 410 Gone
  );
}
