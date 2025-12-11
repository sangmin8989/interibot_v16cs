import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경변수가 설정되지 않았습니다. ' +
    '.env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Next.js에서는 세션 유지 필요 없음
  },
})

// 연결 테스트 함수
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Supabase 연결 테스트 시작...')
    console.log('  URL:', supabaseUrl)
    console.log('  KEY 존재:', !!supabaseAnonKey)
    
    // 실제 사용 패턴과 동일하게 테스트 (materials_pricing에서 실제 데이터 조회)
    // getTilePriceFromDB와 동일한 방식으로 테스트
    const { data, error } = await supabase
      .from('materials_pricing')
      .select('price_min, price_max')
      .eq('grade', 'argen')
      .eq('is_current', true)
      .limit(1)
      .maybeSingle() // .single() 대신 .maybeSingle() 사용 (데이터가 없어도 에러 안 남)
    
    if (error) {
      console.error('❌ Supabase 연결 실패:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return false
    }
    
    console.log('✅ Supabase 연결 성공!', data ? '(데이터 있음)' : '(데이터 없음)')
    return true
  } catch (err: any) {
    console.error('❌ Supabase 연결 오류:', {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      cause: err?.cause
    })
    return false
  }
}

// 연결 테스트용 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase 클라이언트 초기화 완료')
  testSupabaseConnection()
}

