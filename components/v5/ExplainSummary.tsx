/**
 * Phase 4-3: Explain 요약 컴포넌트
 * 
 * ⚠️ 절대 원칙:
 * - 읽기 전용 (Read-only)
 * - Explain 재생성 금지
 * - V5 결과 그대로 표시만
 */

'use client'

import type { ExplainResult } from '@/lib/analysis/v5/explain'
import type { DNAExplainBridge } from '@/lib/analysis/v5/dna/dna-explain-bridge'

interface ExplainSummaryProps {
  explain: ExplainResult
  dnaExplain?: DNAExplainBridge
}

/**
 * Explain 요약 컴포넌트
 * 
 * Explain 결과를 사용자 친화적으로 표시
 */
export default function ExplainSummary({
  explain,
  dnaExplain,
}: ExplainSummaryProps) {
  // ⚠️ 절대 원칙: 읽기 전용
  // Explain 결과 그대로 표시만 수행

  // DNA Explain Bridge가 있으면 우선 사용
  const reasons = dnaExplain?.reasons || explain.tagReasons.slice(0, 3)
  const headline = dnaExplain?.headline || '분석 결과 요약'

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
      {/* 헤드라인 */}
      <h3 className="text-xl font-bold text-gray-900 mb-4">{headline}</h3>

      {/* 요약 문장 */}
      {explain.summary && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
          <p className="text-gray-800 font-medium leading-relaxed">
            {explain.summary}
          </p>
        </div>
      )}

      {/* 이유 목록 (최대 3~5줄) */}
      {reasons.length > 0 && (
        <div className="space-y-3">
          {reasons.slice(0, 5).map((reason, index) => (
            <div key={index} className="flex gap-3">
              <span className="text-blue-500 font-bold mt-1">•</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {reason.title}
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}




