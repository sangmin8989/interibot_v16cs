/**
 * Supabase 연결 테스트 API
 * 디버깅용 엔드포인트
 */

import { NextResponse } from 'next/server'
import { testSupabaseConnection } from '@/lib/db/supabase'
import { materialService } from '@/lib/services/material-service'

export async function GET() {
  
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'N/A',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT_SET'
    },
    tests: {},
    logs: [] as string[]
  }
  
  const addLog = (msg: string) => {
    results.logs.push(`[${new Date().toISOString()}] ${msg}`)
    console.log(msg)
  }
  
  addLog('🔍 Supabase 테스트 시작')
  addLog(`  환경 변수 확인: URL=${results.environment.hasSupabaseUrl}, KEY=${results.environment.hasSupabaseKey}`)

  try {
    // 테스트 1: 기본 연결 테스트
    addLog('🔍 기본 연결 테스트 시작...')
    const connectionTest = await testSupabaseConnection()
    addLog(`🔍 기본 연결 테스트 결과: ${connectionTest ? '성공' : '실패'}`)
    results.tests.connection = {
      success: connectionTest,
      message: connectionTest ? '연결 성공' : '연결 실패'
    }

    // 테스트 2: MaterialService DB 조회 테스트
    addLog('🔍 MaterialService DB 조회 테스트 시작...')
    try {
      const priceDB = await materialService.getTilePrice({ 
        grade: 'ARGEN', 
        useDB: true 
      })
      addLog(`✅ MaterialService DB 조회 성공: ${priceDB}원`)
      results.tests.materialServiceDB = {
        success: true,
        price: priceDB,
        message: `DB 조회 성공: ${priceDB}원`
      }
    } catch (error: any) {
      addLog(`❌ MaterialService DB 조회 실패: ${error.message}`)
      addLog(`  에러 코드: ${error.code || 'N/A'}`)
      addLog(`  에러 상세: ${error.details || 'N/A'}`)
      results.tests.materialServiceDB = {
        success: false,
        error: error.message,
        errorName: error.name,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        stack: error.stack?.substring(0, 500)
      }
    }

    // 테스트 3: 파일 기반 조회 (비교용)
    const priceFile = await materialService.getTilePrice({ 
      grade: 'ARGEN', 
      useDB: false 
    })
    results.tests.materialServiceFile = {
      success: true,
      price: priceFile,
      message: `파일 조회 성공: ${priceFile}원`
    }

    results.overall = results.tests.connection?.success && results.tests.materialServiceDB?.success ? 'SUCCESS' : 'PARTIAL'

  } catch (error: any) {
    results.overall = 'ERROR'
    results.error = {
      message: error.message,
      stack: error.stack
    }
  }

  return NextResponse.json(results, { status: 200 })
}

