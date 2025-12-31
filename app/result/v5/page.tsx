/**
 * Phase 4-3: V5 결과 페이지
 * 
 * ⚠️ 절대 원칙:
 * - 읽기 전용 (Read-only)
 * - 태그/Explain/DNA 재계산 금지
 * - V5 결과 그대로 표시만
 */

'use client'

import { Suspense } from 'react'
import ResultPage from '@/components/v5/ResultPage'
import { usePersonalityV5Store } from '@/lib/store/personalityV5.store'
import type { V5AnalysisResult } from '@/lib/analysis/v5'

/**
 * V5 결과 페이지 컨텐츠
 */
function V5ResultContent() {
  // ⚠️ 절대 원칙: 읽기 전용
  // Store에서 V5 결과 가져오기만 수행

  const v5Result = usePersonalityV5Store((state) => state.v5Result)

  // ⚠️ 접근성 & 안정성: 결과가 없으면 안내 메시지
  if (!v5Result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            분석 결과를 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 mb-6">
            성향 분석을 먼저 진행해주세요.
          </p>
          <a
            href="/onboarding/personality"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            성향 분석 시작하기
          </a>
        </div>
      </div>
    )
  }

  // ⚠️ 타입 변환: Store의 타입을 V5AnalysisResult로 변환
  // (Store 타입이 다른 경우를 대비)
  const result: V5AnalysisResult = v5Result as unknown as V5AnalysisResult

  // 공유 핸들러
  const handleShare = (type: 'kakao' | 'link') => {
    if (type === 'link') {
      navigator.clipboard.writeText(window.location.href)
      alert('링크가 복사되었습니다.')
    } else {
      // 카카오 공유는 별도 구현 필요
      console.log('카카오 공유:', result)
      // TODO: 카카오 공유 SDK 연동
    }
  }

  // 견적 받기 핸들러
  const handleEstimate = () => {
    window.location.href = '/onboarding/estimate'
  }

  return (
    <ResultPage
      result={result}
      onShare={handleShare}
      onEstimate={handleEstimate}
    />
  )
}

/**
 * V5 결과 페이지
 */
export default function V5ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-700">결과를 준비하고 있습니다...</p>
          </div>
        </div>
      }
    >
      <V5ResultContent />
    </Suspense>
  )
}




