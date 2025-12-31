/**
 * Phase 5-2: Explain 블록 컴포넌트
 * 
 * ⚠️ 절대 원칙:
 * - 읽기 전용 (Read-only)
 * - Explain 재생성 금지
 * - V5 결과 그대로 표시만
 */

'use client'

import type { ExplainResult } from '@/lib/analysis/v5/explain'

interface ExplainBlockProps {
  explain: ExplainResult
}

/**
 * Explain 블록
 * 
 * Explain 결과를 상담사가 바로 설명할 수 있게 표시
 */
export default function ExplainBlock({ explain }: ExplainBlockProps) {
  // ⚠️ 절대 원칙: 읽기 전용
  // Explain 결과 그대로 표시만 수행

  // 최대 5개 이유만 표시
  const reasons = explain.tagReasons.slice(0, 5)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">분석 결과 요약</h2>

      {/* 요약 문장 */}
      {explain.summary && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
          <p className="text-gray-800 font-medium leading-relaxed text-lg">
            {explain.summary}
          </p>
        </div>
      )}

      {/* 이유 목록 (최대 5개) */}
      {reasons.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">주요 이유</h3>
          {reasons.map((reason, index) => (
            <div key={index} className="flex gap-3 border-l-2 border-gray-300 pl-4">
              <span className="text-blue-500 font-bold mt-1">{index + 1}.</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{reason.title}</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}




