/**
 * Phase 5-2: 상담 리포트 페이지 컨테이너
 * 
 * ⚠️ 절대 원칙:
 * - 읽기 전용 (Read-only)
 * - 계산/해석 금지
 * - 기본값 생성 금지
 * - V5 결과 그대로 표시만
 */

'use client'

import type { V5AnalysisResult } from '@/lib/analysis/v5'
import ReportHeader from './ReportHeader'
import ExplainBlock from './ExplainBlock'
import TagChipList from '../TagChipList'
import OptimizationPolicyBlock from './OptimizationPolicyBlock'
import ReportActions from './ReportActions'

interface ReportPageProps {
  result: V5AnalysisResult
  onViewEstimate?: () => void
  onSaveMemo?: (memo: string) => void
}

/**
 * 상담 리포트 페이지
 * 
 * V5 결과를 상담사가 바로 설명할 수 있게 통합 표시
 */
export default function ReportPage({
  result,
  onViewEstimate,
  onSaveMemo,
}: ReportPageProps) {
  // ⚠️ 절대 원칙: 읽기 전용
  // V5 결과 그대로 사용, 재계산/재생성 금지

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더: 고객 요약 */}
        {result.dna && (
          <ReportHeader dna={result.dna} />
        )}

        {/* Explain 요약 */}
        {result.explain && (
          <ExplainBlock explain={result.explain} />
        )}

        {/* 핵심 태그 요약 */}
        {result.tags?.tags && <TagChipList tags={result.tags.tags} />}

        {/* 최적화 정책 요약 */}
        {result.estimateOptimization && (
          <OptimizationPolicyBlock
            materialPolicy={result.estimateOptimization.materialPolicy}
            gradePolicy={result.estimateOptimization.gradePolicy}
            contingencyPolicy={result.estimateOptimization.contingencyPolicy}
          />
        )}

        {/* 다음 액션 */}
        <ReportActions onViewEstimate={onViewEstimate} onSaveMemo={onSaveMemo} />
      </div>
    </div>
  )
}




