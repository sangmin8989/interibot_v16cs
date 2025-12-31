/**
 * Phase 4-3: V5 결과 페이지 컨테이너
 * 
 * ⚠️ 절대 원칙:
 * - 읽기 전용 (Read-only)
 * - 태그/Explain/DNA 재계산 금지
 * - V5 결과 그대로 표시만
 */

'use client'

import type { V5AnalysisResult } from '@/lib/analysis/v5'
import DNAResultCard from './DNAResultCard'
import ExplainSummary from './ExplainSummary'
import TagChipList from './TagChipList'
import ResultCTA from './ResultCTA'

interface ResultPageProps {
  result: V5AnalysisResult
  onShare?: (type: 'kakao' | 'link') => void
  onEstimate?: () => void
}

/**
 * V5 결과 페이지
 * 
 * DNA, Explain, 태그를 통합하여 표시
 */
export default function ResultPage({
  result,
  onShare,
  onEstimate,
}: ResultPageProps) {
  // ⚠️ 절대 원칙: 읽기 전용
  // V5 결과 그대로 사용, 재계산/재생성 금지

  const handleShare = (type: 'kakao' | 'link') => {
    if (onShare) {
      onShare(type)
    } else {
      // 기본 동작
      if (type === 'link') {
        navigator.clipboard.writeText(window.location.href)
        alert('링크가 복사되었습니다.')
      } else {
        // 카카오 공유는 별도 구현 필요
        console.log('카카오 공유:', result)
      }
    }
  }

  const handleEstimate = () => {
    if (onEstimate) {
      onEstimate()
    } else {
      // 기본 동작: 견적 페이지로 이동
      window.location.href = '/onboarding/estimate'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            당신의 인테리어 DNA
          </h1>
          <p className="text-gray-600">
            분석 결과를 확인하고 다음 단계로 진행하세요
          </p>
        </div>

        {/* DNA 카드 */}
        {result.dna && <DNAResultCard dna={result.dna} />}

        {/* Explain 요약 */}
        {result.explain && (
          <ExplainSummary
            explain={result.explain}
            dnaExplain={result.dna?.explain}
          />
        )}

        {/* 태그 칩 리스트 */}
        {result.tags?.tags && <TagChipList tags={result.tags.tags} />}

        {/* CTA 버튼 */}
        <ResultCTA onShare={handleShare} onEstimate={handleEstimate} />
      </div>
    </div>
  )
}




