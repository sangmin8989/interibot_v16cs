/**
 * Phase 4-3: DNA 결과 카드 컴포넌트
 * 
 * ⚠️ 절대 원칙:
 * - 읽기 전용 (Read-only)
 * - DNA 재결정 금지
 * - 점수 계산 금지
 * - V5 결과 그대로 표시만
 */

'use client'

import type { DNATypeInfo } from '@/lib/analysis/v5/dna/dna-types'

interface DNAResultCardProps {
  dna: DNATypeInfo
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
 * DNA 결과 카드
 * 
 * DNA 유형 정보를 시각적으로 표시
 */
export default function DNAResultCard({ dna }: DNAResultCardProps) {
  // ⚠️ 절대 원칙: 읽기 전용
  // DNA 정보 그대로 표시만 수행

  const emoji = DNA_EMOJI_MAP[dna.type] || '🏡'

  return (
    <div
      className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border-2"
      style={{
        borderColor: dna.color || '#7C83FD',
      }}
    >
      {/* DNA 이모지 & 이름 */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-6xl">{emoji}</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{dna.name}</h2>
          <p className="text-sm text-gray-600 mt-1">{dna.description}</p>
        </div>
      </div>

      {/* 키워드 */}
      {dna.keywords && dna.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {dna.keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}




