import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Phase 0: 생존 봉인 작업
 * 
 * 목적: 프로덕션에서 오직 1개의 공식 견적 경로만 존재하게 만들기
 * 
 * 공식 경로:
 * - UI: /onboarding/estimate
 * - API: /api/estimate/v4
 * 
 * 구버전 견적 경로는 모두 /onboarding/estimate로 리다이렉트
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ===== 견적 UI 라우트 봉인 =====
  
  // /estimate → /onboarding/estimate로 리다이렉트
  if (pathname === '/estimate') {
    console.log('[ESTIMATE_ROUTE_GUARD] 구버전 견적 페이지 접근 차단:', pathname)
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding/estimate'
    return NextResponse.redirect(url, 307) // 307 Temporary Redirect
  }

  // /v5/* 중에서 견적 결과로 이어지는 경로 차단
  // (분석/테스트용 내부 페이지는 예외)
  const v5EstimateRoutes = [
    '/v5/process-detail',
    '/v5/process-select',
    '/v5/options',
    '/v5/additional-options',
  ]
  
  if (v5EstimateRoutes.some(route => pathname.startsWith(route))) {
    console.log('[ESTIMATE_ROUTE_GUARD] V5 구버전 견적 경로 접근 차단:', pathname)
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding/estimate'
    return NextResponse.redirect(url, 307)
  }

  // ===== API 라우트는 여기서 처리하지 않음 (각 route.ts에서 처리) =====
  // API 차단은 app/api/estimate/*/route.ts에서 직접 처리

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


