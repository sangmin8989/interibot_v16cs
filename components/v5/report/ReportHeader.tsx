/**
 * Phase 5-2: 상담 리포트 헤더 컴포넌트
 * 
 * ⚠️ 절대 원칙:
 * - 읽기 전용 (Read-only)
 * - 계산/해석 금지
 * - 기본값 생성 금지
 * - V5 결과 그대로 표시만
 */

'use client'

import type { DNATypeInfo } from '@/lib/analysis/v5/dna/dna-types'

interface ReportHeaderProps {
  dna: DNATypeInfo
  matchScore?: number // 매칭율 (옵션, 이미 계산된 값만 사용)
}

/**
 * DNA 유형별 이모지 매핑
 */
const DNA_EMOJI_MAP: Record<string, string> = {
  practical_family: '🏠',
  minimal_lifestyle: '✨',
  safety_first: '🛡️',
  budget_conscious: '💰',
  long_term_investor: '🔧',
  balanced: '⚖️',
}

/**
 * 상담 리포트 헤더
 * 
 * DNA 정보와 매칭율 표시
 */
export default function ReportHeader({ dna, matchScore }: ReportHeaderProps) {
  // ⚠️ 절대 원칙: 읽기 전용
  // DNA 정보 그대로 표시만 수행

  const emoji = DNA_EMOJI_MAP[dna.type] || '🏡'

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border-2 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-6xl">{emoji}</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{dna.name}</h1>
            <p className="text-gray-700 text-lg">{dna.description}</p>
          </div>
        </div>
        
        {/* 매칭율 (옵션) */}
        {matchScore !== undefined && (
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">매칭율</p>
            <p className="text-4xl font-bold text-blue-600">{matchScore}%</p>
          </div>
        )}
      </div>

      {/* 키워드 */}
      {dna.keywords && dna.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {dna.keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-medium shadow-sm"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}




